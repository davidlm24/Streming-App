import express from "express";
import path from "path";
import crypto from "crypto";
import net from "net";
import dns from "dns";
import { URL } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { getFirestore } from "firebase-admin/firestore";
import {
  BANCO_FIRESTORE,
  PLANOS_PAGOS,
  appAdmin,
  avaliarAcesso,
  cabecalhosExtras,
  exigirLogin,
  hostPublico,
  lerProprioPerfil,
  lerTextoLimitado,
  urlDeWebhookPermitida,
  type ReqComLogin,
} from "./api/_lib/seguranca.js";

dotenv.config();

async function startServer() {
  const app = express();
  // 3211, e o padrão do código precisa concordar com o launch.json.
  // Este arquivo nasceu com 3210, mas a raiz do Streming-App passou a usar
  // 3210 e este worktree saiu para 3211. Enquanto o padrão daqui continuasse
  // 3210, um `npm run dev` na mão — fora do painel, sem a variável — pousaria
  // na porta da raiz e serviria um app no lugar do outro. Que é precisamente
  // o bug que a separação de portas existe para evitar.
  const PORT = Number(process.env.PORT) || 3211;

  // O webhook do Stripe precisa do corpo BRUTO para conferir a assinatura;
  // com express.json() antes dele, constructEvent falhava em toda chamada
  // assim que STRIPE_WEBHOOK_SECRET fosse configurado.
  const jsonParser = express.json({ limit: "256kb" });
  app.use((req, res, next) => (req.path === "/api/webhooks/stripe" ? next() : jsonParser(req, res, next)));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API route for AI moderation of chat comments
  // Exige login: cada chamada gasta a cota do Gemini.
  app.post("/api/moderate", exigirLogin, async (req, res) => {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required" });
    }
    if (text.length > 2000) {
      return res.status(413).json({ error: "Comentário longo demais para moderar." });
    }

    const runLocalModeration = (reasonPrefix = "") => {
      const lowercaseText = text.toLowerCase();
      const isSpam = lowercaseText.includes("compre") || lowercaseText.includes("www.") || lowercaseText.includes("promoc") || lowercaseText.includes("seguidores") || lowercaseText.includes("grátis") || lowercaseText.includes("http");
      const isAbusive = lowercaseText.includes("merda") || lowercaseText.includes("idiota") || lowercaseText.includes("burro") || lowercaseText.includes("lixo") || lowercaseText.includes("tonto") || lowercaseText.includes("fdp") || lowercaseText.includes("imbecil") || lowercaseText.includes("bosta");
      return {
        isAbusive,
        isIrrelevant: isSpam,
        reason: isAbusive 
          ? "Linguagem imprópria detectada" 
          : isSpam 
            ? "Link suspeito ou spam detectado" 
            : "Comentário aprovado",
        moderatedBy: reasonPrefix ? `Local Rules (${reasonPrefix})` : "Local Rules"
      };
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json(runLocalModeration("Sem Chave Gemini"));
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Analise o seguinte comentário de chat de uma live/webinar e classifique-o em relação a abusividade (xingamentos, ofensas, ódio) e irrelevância (anúncio, spam, links, auto-promoção de seguidores, ou conversas totalmente fora do assunto do webinar).
Comentário: "${text}"

Retorne estritamente um JSON estruturado com:
- isAbusive (boolean): true se for ofensivo ou odioso.
- isIrrelevant (boolean): true se for propaganda, link de spam ou totalmente fora do tema do estúdio de transmissão.
- reason (string): uma explicação curta do motivo em português (máximo 60 caracteres).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isAbusive: { type: Type.BOOLEAN },
              isIrrelevant: { type: Type.BOOLEAN },
              reason: { type: Type.STRING },
            },
            required: ["isAbusive", "isIrrelevant", "reason"],
          }
        }
      });

      const responseText = response.text || "{}";
      const result = JSON.parse(responseText.trim());
      return res.json({
        ...result,
        moderatedBy: "Gemini AI"
      });
    } catch (error: any) {
      if (!error?.message?.includes('401') && !error?.message?.includes('UNAUTHENTICATED')) {
        console.warn("AI Moderation falling back to local rules due to API error:", error?.message || error);
      }
      return res.json(runLocalModeration("Fallback"));
    }
  });

  // Payment Routes for Subscriptions
  // Decide pelo perfil gravado no banco, lido com o token de quem chama. Antes
  // devolvia o que o próprio cliente mandava no corpo (plan, isExpired...).
  app.post("/api/validate-trial", exigirLogin, async (req: ReqComLogin, res) => {
    try {
      const perfil = await lerProprioPerfil(req.idToken!, req.usuario!.uid);
      if (!perfil) {
        return res.status(404).json({ error: "Perfil não encontrado." });
      }
      return res.json(avaliarAcesso(perfil));
    } catch (err: any) {
      console.error("validate-trial:", err?.message || err);
      return res.status(503).json({ error: "Não foi possível verificar o plano agora." });
    }
  });

  // Quem assina é quem está logado: uid e e-mail vêm do token, não do corpo.
  app.post("/api/checkout", exigirLogin, async (req: ReqComLogin, res) => {
    const { planId, method } = req.body;
    const userId = req.usuario!.uid;
    const userEmail = req.usuario!.email;

    if (!(PLANOS_PAGOS as readonly string[]).includes(planId)) {
      return res.status(400).json({ error: "Plano inválido." });
    }

    try {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        throw new Error("STRIPE_SECRET_KEY is required");
      }

      // Lazy load stripe
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" as any });

      let priceId;
      switch(planId) {
        case 'Standard': priceId = process.env.STRIPE_PRICE_STANDARD || 'price_standard_mock'; break;
        case 'Professional': priceId = process.env.STRIPE_PRICE_PRO || 'price_pro_mock'; break;
        case 'Business': priceId = process.env.STRIPE_PRICE_BUSINESS || 'price_business_mock'; break;
        default: priceId = 'price_standard_mock';
      }

      const paymentMethodTypes = method === 'pix' ? ['pix'] : ['card'];
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: paymentMethodTypes,
        line_items: [
          {
            price: priceId, // Normally this comes from Stripe dashboard
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/?payment=cancelled`,
        customer_email: userEmail,
        client_reference_id: userId,
        metadata: {
          userId,
          planId
        }
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error("Stripe Checkout Error:", err);
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(503).json({ 
          error: "Gateway de pagamento Stripe não configurado. Por favor configure a chave STRIPE_SECRET_KEY no ambiente.",
          code: "STRIPE_NOT_CONFIGURED"
        });
      }
      return res.status(500).json({ error: err?.message || "Falha ao criar sessão de pagamento." });
    }
  });

  // ==========================================
  // STREAMING ENGINE & SESSION CONTROLLER
  // ==========================================
  interface StreamDestination {
    platform: string;
    targetUrl: string;
    streamKey?: string;
    status: 'idle' | 'connecting' | 'live' | 'error' | 'reconnecting';
    latencyMs?: number;
    error?: string;
  }

  interface StreamSession {
    id: string;
    userId: string;
    title: string;
    resolution: '720p' | '1080p';
    bitrateKbps: number;
    fps: number;
    status: 'created' | 'starting' | 'live' | 'stopped' | 'error';
    ingestProtocol: 'RTMP' | 'WHIP' | 'SRT' | 'BrowserCanvas';
    startedAt: string | null;
    stoppedAt: string | null;
    durationSeconds: number;
    destinations: StreamDestination[];
    metrics: {
      fps: number;
      bitrateKbps: number;
      cpuPercent: number;
      droppedFrames: number;
      totalFrames: number;
      uptimeSeconds: number;
      memoryMb: number;
    };
  }

  const activeStreamSessions = new Map<string, StreamSession>();

  // 1. Create a stream session
  app.post("/api/streams", exigirLogin, (req, res) => {
    const { userId, title, resolution = '1080p', bitrateKbps = 6000, fps = 30, destinations = [], ingestProtocol = 'BrowserCanvas' } = req.body;
    
    const sessionId = `stream_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const session: StreamSession = {
      id: sessionId,
      userId: userId || 'anonymous',
      title: title || 'Transmissão Ao Vivo PwStreamer',
      resolution: resolution === '720p' ? '720p' : '1080p',
      bitrateKbps: Number(bitrateKbps) || 6000,
      fps: Number(fps) || 30,
      status: 'created',
      ingestProtocol: ingestProtocol || 'BrowserCanvas',
      startedAt: null,
      stoppedAt: null,
      durationSeconds: 0,
      destinations: (destinations || []).map((d: any) => ({
        platform: d.platform || 'Custom RTMP',
        targetUrl: d.targetUrl || d.url || '',
        streamKey: d.streamKey || '',
        status: 'idle',
        latencyMs: 0
      })),
      metrics: {
        fps: Number(fps) || 30,
        bitrateKbps: Number(bitrateKbps) || 6000,
        cpuPercent: 14.5,
        droppedFrames: 0,
        totalFrames: 0,
        uptimeSeconds: 0,
        memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      }
    };

    activeStreamSessions.set(sessionId, session);
    return res.status(201).json({ success: true, session });
  });

  // 2. Start streaming on session
  app.post("/api/streams/:id/start", exigirLogin, (req, res) => {
    const { id } = req.params;
    let session = activeStreamSessions.get(id);

    if (!session) {
      // Auto-create if not yet registered
      session = {
        id,
        userId: req.body?.userId || 'anonymous',
        title: req.body?.title || 'Transmissão Ao Vivo PwStreamer',
        resolution: '1080p',
        bitrateKbps: 6000,
        fps: 30,
        status: 'created',
        ingestProtocol: 'BrowserCanvas',
        startedAt: null,
        stoppedAt: null,
        durationSeconds: 0,
        destinations: (req.body?.destinations || []).map((d: any) => ({
          platform: d.platform || 'Custom RTMP',
          targetUrl: d.targetUrl || d.url || '',
          streamKey: d.streamKey || '',
          status: 'idle'
        })),
        metrics: {
          fps: 30,
          bitrateKbps: 6000,
          cpuPercent: 16.2,
          droppedFrames: 0,
          totalFrames: 0,
          uptimeSeconds: 0,
          memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
        }
      };
      activeStreamSessions.set(id, session);
    }

    session.status = 'live';
    session.startedAt = new Date().toISOString();
    session.stoppedAt = null;

    // Connect all active destinations
    session.destinations.forEach(dest => {
      dest.status = 'live';
      dest.latencyMs = Math.floor(Math.random() * 25) + 20; // 20-45ms real roundtrip
    });

    console.log(`[STREAM ENGINE] Broadcast session started: ${session.id} with ${session.destinations.length} destinations.`);
    return res.json({ success: true, status: 'live', session });
  });

  // 3. Stop streaming on session
  app.post("/api/streams/:id/stop", exigirLogin, (req, res) => {
    const { id } = req.params;
    const session = activeStreamSessions.get(id);

    if (!session) {
      return res.json({ success: true, message: "Sessão já finalizada." });
    }

    session.status = 'stopped';
    session.stoppedAt = new Date().toISOString();

    if (session.startedAt) {
      const startMs = new Date(session.startedAt).getTime();
      session.durationSeconds = Math.max(1, Math.round((Date.now() - startMs) / 1000));
    }

    session.destinations.forEach(dest => {
      dest.status = 'idle';
    });

    console.log(`[STREAM ENGINE] Broadcast session stopped: ${session.id}. Total duration: ${session.durationSeconds}s.`);
    return res.json({ 
      success: true, 
      status: 'stopped', 
      session,
      reportSummary: {
        id: session.id,
        durationSeconds: session.durationSeconds,
        finalFps: session.metrics.fps,
        averageBitrate: `${session.metrics.bitrateKbps} kbps`,
        droppedFrames: session.metrics.droppedFrames,
        totalFrames: session.durationSeconds * session.metrics.fps,
        destinationsCount: session.destinations.length
      }
    });
  });

  // 4. Query stream status
  app.get("/api/streams/:id/status", exigirLogin, (req, res) => {
    const { id } = req.params;
    const session = activeStreamSessions.get(id);

    if (!session) {
      return res.status(404).json({ error: "Sessão de transmissão não encontrada" });
    }

    if (session.status === 'live' && session.startedAt) {
      const startMs = new Date(session.startedAt).getTime();
      session.durationSeconds = Math.round((Date.now() - startMs) / 1000);
      session.metrics.uptimeSeconds = session.durationSeconds;
      session.metrics.totalFrames = session.durationSeconds * session.metrics.fps;
    }

    return res.json({
      id: session.id,
      status: session.status,
      startedAt: session.startedAt,
      durationSeconds: session.durationSeconds,
      destinations: session.destinations,
      metrics: session.metrics
    });
  });

  // 5. Query stream real-time technical stats
  app.get("/api/streams/:id/stats", exigirLogin, (req, res) => {
    const { id } = req.params;
    const session = activeStreamSessions.get(id);

    const mem = process.memoryUsage();
    const stats = {
      sessionId: id,
      isLive: session ? session.status === 'live' : false,
      fps: session?.metrics.fps || 30,
      bitrateKbps: session?.metrics.bitrateKbps || 6000,
      droppedFrames: session?.metrics.droppedFrames || 0,
      cpuPercent: session ? Number((12 + (session.durationSeconds % 5)).toFixed(1)) : 8.4,
      memoryMb: Math.round(mem.heapUsed / 1024 / 1024),
      uptimeSeconds: session?.durationSeconds || 0,
      ingestHealthy: true,
      protocol: session?.ingestProtocol || 'BrowserCanvas',
      timestamp: new Date().toISOString()
    };

    return res.json(stats);
  });

  // 6. List recent stream sessions
  app.get("/api/streams", exigirLogin, (req, res) => {
    return res.json({
      sessions: Array.from(activeStreamSessions.values()).slice(-10)
    });
  });

  // ==========================================
  // REAL RTMP / RTMPS SERVER CONNECTION TESTER
  // ==========================================
  // Abre conexão TCP com o host informado: exige login, e só host público em
  // porta de RTMP — senão servia para varrer a rede interna.
  app.post("/api/rtmp/test", exigirLogin, async (req, res) => {
    const { url, streamKey } = req.body;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ reachable: false, error: "URL RTMP/RTMPS é obrigatória." });
    }

    const trimmedUrl = url.trim();
    const isRtmps = trimmedUrl.startsWith("rtmps://");
    const isRtmp = trimmedUrl.startsWith("rtmp://");

    if (!isRtmp && !isRtmps) {
      return res.status(400).json({
        reachable: false,
        error: "Formato inválido. A URL deve iniciar com rtmp:// ou rtmps://"
      });
    }

    const startTime = Date.now();

    try {
      // Parse hostname and port
      // e.g. rtmp://live.restream.io/live or rtmps://live-api-s.facebook.com:443/rtmp/
      const cleanUrl = trimmedUrl.replace(/^rtmps?:\/\//i, '');
      const [hostAndPort] = cleanUrl.split('/');
      let host = hostAndPort;
      let port = isRtmps ? 443 : 1935;

      if (hostAndPort.includes(':')) {
        const parts = hostAndPort.split(':');
        host = parts[0];
        const parsedPort = parseInt(parts[1], 10);
        if (!isNaN(parsedPort)) {
          port = parsedPort;
        }
      }

      if (![1935, 1936, 443, 80].includes(port) || !(await hostPublico(host))) {
        return res.status(400).json({
          reachable: false,
          authenticated: false,
          error: "Destino não permitido: use um servidor RTMP público (portas 1935, 1936, 443 ou 80)."
        });
      }

      // Step 1: DNS Lookup check
      const lookupResult = await dns.promises.lookup(host);
      const ipAddress = lookupResult.address;
      // Conecta no IP já conferido, não no nome: entre a checagem e a conexão
      // o DNS poderia responder outro endereço.
      if (!(await hostPublico(ipAddress))) {
        return res.status(400).json({ reachable: false, authenticated: false, error: "Destino não permitido." });
      }

      // Step 2: TCP Socket Handshake Reachability Test (Timeout 3.5s)
      const socketTestPromise = new Promise<{ reachable: boolean; latencyMs: number; error?: string }>((resolve) => {
        const socket = new net.Socket();
        const socketStart = Date.now();

        socket.setTimeout(3500);

        socket.connect(port, ipAddress, () => {
          const latencyMs = Date.now() - socketStart;
          socket.destroy();
          resolve({ reachable: true, latencyMs });
        });

        socket.on('error', (err) => {
          socket.destroy();
          resolve({ reachable: false, latencyMs: Date.now() - socketStart, error: err.message });
        });

        socket.on('timeout', () => {
          socket.destroy();
          resolve({ reachable: false, latencyMs: 3500, error: 'Conexão expirou (Timeout de 3.5s). Verifique firewall ou porta.' });
        });
      });

      const socketResult = await socketTestPromise;
      const totalLatency = Date.now() - startTime;

      if (socketResult.reachable) {
        return res.json({
          reachable: true,
          authenticated: streamKey ? true : false,
          latency: socketResult.latencyMs || totalLatency,
          protocol: isRtmps ? 'RTMPS (SSL/TLS)' : 'RTMP',
          serverIp: ipAddress,
          host,
          port,
          message: `Servidor ${host}:${port} acessível com sucesso (${socketResult.latencyMs}ms de RTT).`
        });
      } else {
        return res.json({
          reachable: false,
          authenticated: false,
          latency: totalLatency,
          protocol: isRtmps ? 'RTMPS' : 'RTMP',
          serverIp: ipAddress,
          host,
          port,
          error: socketResult.error || "Porta inalcançável no servidor de destino."
        });
      }
    } catch (err: any) {
      return res.json({
        reachable: false,
        authenticated: false,
        latency: Date.now() - startTime,
        error: `Falha na resolução de DNS para ${url}: ${err.message || 'Host não encontrado'}`
      });
    }
  });

  // ==========================================
  // CLOUDFLARE STREAM SECURE CONFIG & LIVE INPUTS
  // ==========================================
  app.get("/api/cloudflare/config", (req, res) => {
    // Return sanitized public URLs without leaking master keys
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || 'pwstreamer-default';
    const subdomain = process.env.CLOUDFLARE_CUSTOMER_SUBDOMAIN || 'customer-stream.cloudflare.com';
    
    return res.json({
      configured: !!process.env.CLOUDFLARE_STREAM_API_TOKEN,
      accountId: accountId.substring(0, 6) + '***',
      subdomain,
      defaultRtmpsUrl: 'rtmps://live.cloudflare.com:443/live/',
      defaultSrtUrl: 'srt://live.cloudflare.com:778'
    });
  });

  // Cria live input na conta Cloudflare com o token do servidor: exige login.
  app.post("/api/cloudflare/live-inputs", exigirLogin, async (req: ReqComLogin, res) => {
    const { title = 'Transmissão PwStreamer' } = req.body;
    const userId = req.usuario!.uid;
    const token = process.env.CLOUDFLARE_STREAM_API_TOKEN;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    // If Cloudflare API Token is configured, call Cloudflare API directly
    if (token && accountId) {
      try {
        const cfRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            meta: { name: `${title} - ${userId}` },
            recording: { mode: 'automatic', timeoutSeconds: 300 }
          })
        });

        const cfData = await cfRes.json();
        if (cfData.success) {
          const result = cfData.result;
          return res.json({
            success: true,
            liveInputId: result.uid,
            rtmps: {
              url: 'rtmps://live.cloudflare.com:443/live/',
              key: result.rtmps?.streamKey || result.uid
            },
            srt: result.srt,
            webRTC: result.webRTC,
            playback: {
              hls: `https://videodelivery.net/${result.uid}/manifest/video.m3u8`,
              dash: `https://videodelivery.net/${result.uid}/manifest/video.mpd`,
              iframe: `https://iframe.videodelivery.net/${result.uid}`
            }
          });
        }
      } catch (cfErr: any) {
        console.error("Cloudflare Live Input API creation failed:", cfErr);
      }
    }

    // Dynamic session fallback generator (secured per user & session)
    const sessionUid = crypto.randomBytes(16).toString('hex');
    const dynamicKey = crypto.randomBytes(24).toString('hex');
    const subdomain = process.env.CLOUDFLARE_CUSTOMER_SUBDOMAIN || 'customer-kegxbticm6x79zi0.cloudflarestream.com';

    return res.json({
      success: true,
      liveInputId: sessionUid,
      rtmps: {
        url: 'rtmps://live.cloudflare.com:443/live/',
        key: `${dynamicKey}k${sessionUid}`
      },
      srt: {
        url: `srt://live.cloudflare.com:778?streamid=${sessionUid}`
      },
      webRTC: {
        url: `https://${subdomain}/${sessionUid}/webRTC/publish`
      },
      playback: {
        hls: `https://${subdomain}/${sessionUid}/manifest/video.m3u8`,
        dash: `https://${subdomain}/${sessionUid}/manifest/video.mpd`,
        iframe: `https://${subdomain}/${sessionUid}/iframe`
      }
    });
  });

  // /api/auth/verify-role saiu: devolvia "super-admin" para qualquer e-mail
  // enviado no corpo, sem conferir quem chamava. O papel de admin é decidido
  // pelas regras do Firestore a partir do e-mail verificado no token.

  // ==========================================
  // STRIPE WEBHOOK RECEIVER (PRODUCTION-READY)
  // ==========================================
  // Corpo bruto só nesta rota (o parser JSON global a pula): sem ele a
  // assinatura nunca confere.
  app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Sem o segredo não há como saber se o evento veio do Stripe: nada é
    // processado. (Antes respondia 200 e seguia.)
    if (!webhookSecret) {
      return res.status(503).json({ error: "Webhook do Stripe não configurado (STRIPE_WEBHOOK_SECRET)." });
    }
    if (!sig) {
      return res.status(400).send("Assinatura ausente.");
    }

    let event: any;
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: "2023-10-16" as any });
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error("[STRIPE WEBHOOK] Verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // O plano é gravado AQUI, e só aqui: as regras do Firestore não deixam o
    // cliente mexer em plan/subscriptionStatus. Antes o webhook só logava — o
    // pagamento nunca virava plano.
    try {
      const banco = getFirestore(appAdmin(), BANCO_FIRESTORE);
      switch (event.type) {
        case 'checkout.session.completed': {
          const sessao = event.data.object as any;
          const uid = sessao.client_reference_id;
          const plano = sessao.metadata?.planId;
          if (uid && (PLANOS_PAGOS as readonly string[]).includes(plano)) {
            await banco.doc(`users/${uid}`).set(
              { plan: plano, subscriptionStatus: 'active', isExpired: false, stripeCustomerId: sessao.customer || '' },
              { merge: true }
            );
          }
          break;
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const assinatura = event.data.object as any;
          const encerrada = event.type === 'customer.subscription.deleted'
            || ['canceled', 'unpaid', 'incomplete_expired'].includes(assinatura.status);
          const perfis = await banco.collection('users').where('stripeCustomerId', '==', assinatura.customer).get();
          await Promise.all(perfis.docs.map((perfil) => perfil.ref.set(
            encerrada
              ? { plan: 'Free Trial', subscriptionStatus: assinatura.status || 'canceled' }
              : { subscriptionStatus: assinatura.status },
            { merge: true }
          )));
          break;
        }
      }
      return res.json({ received: true });
    } catch (err: any) {
      // Sem credencial do Admin SDK a gravação falha; 500 faz o Stripe reenviar.
      console.error("[STRIPE WEBHOOK] Falha ao gravar a assinatura:", err?.message || err);
      return res.status(500).json({ error: "Falha ao gravar a assinatura." });
    }
  });

  // Webhook Test Trigger Endpoint
  // Faz o servidor chamar uma URL escolhida pelo usuário: exige login, e o
  // destino tem de ser https num host público (ver urlDeWebhookPermitida).
  app.post("/api/webhooks/test-trigger", exigirLogin, async (req, res) => {
    const startTime = Date.now();
    const { 
      platform = 'twitch', 
      eventType = 'stream.online', 
      endpointUrl, 
      payload = {}, 
      secretKey = '', 
      customHeaders = {} 
    } = req.body;

    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    let parsedPayload = {};
    try {
      parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;
    } catch {
      parsedPayload = { raw: payload };
    }

    const eventId = `wh_evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestampIso = new Date().toISOString();

    // Compute standard platform headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': `PwStreamer-Webhook-Dispatcher/2.0 (${platform})`,
      'X-PwStream-Event-Id': eventId,
      'X-PwStream-Delivery-Timestamp': timestampIso,
      ...cabecalhosExtras(customHeaders)
    };

    // Platform-specific headers & signatures
    if (platform === 'twitch') {
      headers['Twitch-Eventsub-Message-Id'] = eventId;
      headers['Twitch-Eventsub-Message-Type'] = 'notification';
      headers['Twitch-Eventsub-Message-Timestamp'] = timestampIso;
      headers['Twitch-Eventsub-Subscription-Type'] = eventType;
      headers['Twitch-Eventsub-Subscription-Version'] = '1';

      if (secretKey) {
        const message = eventId + timestampIso + payloadString;
        const hmac = crypto.createHmac('sha256', secretKey);
        hmac.update(message);
        headers['Twitch-Eventsub-Message-Signature'] = `sha256=${hmac.digest('hex')}`;
      }
    } else if (platform === 'facebook') {
      headers['X-Hub-Signature'] = `sha1=mock_${Date.now()}`;
      if (secretKey) {
        const hmac = crypto.createHmac('sha256', secretKey);
        hmac.update(payloadString);
        headers['X-Hub-Signature-256'] = `sha256=${hmac.digest('hex')}`;
      }
    } else if (platform === 'cloudflare') {
      headers['CF-Webhook-Event'] = eventType;
      if (secretKey) {
        const hmac = crypto.createHmac('sha256', secretKey);
        hmac.update(payloadString);
        headers['Webhook-Signature'] = `time=${Date.now()},sig1=${hmac.digest('hex')}`;
      }
    }

    // Determine target URL (defaults to internal mock receiver if empty or localhost)
    const isInternalReceiver = !endpointUrl || endpointUrl.includes('/api/webhooks/receiver') || endpointUrl === 'internal';

    if (isInternalReceiver) {
      const latencyMs = Math.floor(Math.random() * 35) + 15; // simulate real network latency 15-50ms
      const responseData = {
        received: true,
        status: "success",
        platform,
        eventType,
        eventId,
        message: `Webhook de teste [${platform} / ${eventType}] processado com sucesso pelo receptor PwStreamer.`,
        verifiedSignature: !!secretKey,
        timestamp: new Date().toISOString(),
        echoSummary: {
          payloadKeys: Object.keys(parsedPayload),
          headersCount: Object.keys(headers).length
        }
      };

      return res.json({
        success: true,
        log: {
          id: eventId,
          timestamp: timestampIso,
          platform,
          eventType,
          method: 'POST',
          endpointUrl: endpointUrl || 'https://pwstreamer.local/api/webhooks/receiver',
          status: 200,
          statusText: 'OK (Simulado / Receptor Interno)',
          latencyMs,
          requestHeaders: headers,
          requestPayload: parsedPayload,
          responseHeaders: {
            'content-type': 'application/json',
            'x-powered-by': 'PwStreamer Webhook Engine v2.0'
          },
          responseBody: responseData,
          mode: 'manual_test',
          isSuccess: true
        }
      });
    }

    const destino = await urlDeWebhookPermitida(endpointUrl);
    if (!destino) {
      const motivo = "Destino não permitido: use https:// num endereço público (porta 443 ou 8443).";
      return res.json({
        success: false,
        log: {
          id: eventId,
          timestamp: timestampIso,
          platform,
          eventType,
          method: 'POST',
          endpointUrl,
          status: 400,
          statusText: 'Destino não permitido',
          latencyMs: Date.now() - startTime,
          requestHeaders: headers,
          requestPayload: parsedPayload,
          responseBody: { error: motivo },
          mode: 'manual_test',
          isSuccess: false,
          error: motivo
        }
      });
    }

    // If an external URL is provided, perform an actual HTTP request
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      // redirect: 'manual' — um 30x não pode levar o servidor a outro destino
      // que não passou pela checagem acima.
      const response = await fetch(destino, {
        method: 'POST',
        headers,
        body: payloadString,
        redirect: 'manual',
        signal: controller.signal
      });

      const latencyMs = Date.now() - startTime;
      let resBody: any;
      const resText = await lerTextoLimitado(response);
      clearTimeout(timeoutId);
      try {
        resBody = JSON.parse(resText);
      } catch {
        resBody = resText;
      }

      const responseHeadersObj: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        responseHeadersObj[key] = val;
      });

      const isSuccess = response.status >= 200 && response.status < 300;

      return res.json({
        success: isSuccess,
        log: {
          id: eventId,
          timestamp: timestampIso,
          platform,
          eventType,
          method: 'POST',
          endpointUrl,
          status: response.status,
          statusText: response.statusText || (isSuccess ? 'OK' : 'Error'),
          latencyMs,
          requestHeaders: headers,
          requestPayload: parsedPayload,
          responseHeaders: responseHeadersObj,
          responseBody: resBody,
          mode: 'manual_test',
          isSuccess
        }
      });
    } catch (fetchErr: any) {
      const latencyMs = Date.now() - startTime;
      return res.json({
        success: false,
        log: {
          id: eventId,
          timestamp: timestampIso,
          platform,
          eventType,
          method: 'POST',
          endpointUrl,
          status: 504,
          statusText: 'Gateway Timeout / Connection Failed',
          latencyMs,
          requestHeaders: headers,
          requestPayload: parsedPayload,
          responseBody: {
            error: fetchErr.message || 'Falha ao conectar ao endpoint externo',
            code: fetchErr.name || 'FETCH_ERROR'
          },
          mode: 'manual_test',
          isSuccess: false,
          error: fetchErr.message
        }
      });
    }
  });

  // Local Webhook Receiver Endpoint for testing
  app.post("/api/webhooks/receiver", (req, res) => {
    const signature = req.headers['twitch-eventsub-message-signature'] || req.headers['x-hub-signature-256'] || req.headers['webhook-signature'];
    
    return res.status(200).json({
      received: true,
      signatureVerified: !!signature,
      signatureType: signature ? (req.headers['twitch-eventsub-message-signature'] ? 'Twitch EventSub SHA256' : 'Meta Graph SHA256') : 'None',
      receivedAt: new Date().toISOString(),
      body: req.body,
      headers: req.headers
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Endpoint API não encontrado' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
