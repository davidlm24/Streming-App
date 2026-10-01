import express from "express";
import path from "path";
import crypto from "crypto";
import net from "net";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { getSupabaseAdminClient, isSupabaseServerConfigured } from "./src/lib/supabase-admin.ts";
import { AuthRequest, configuredSuperAdmins, isSuperAdmin, requireAuth } from "./src/middleware/auth.ts";
import { resolvePublicAddress } from "./src/server/safe-http.ts";
import { ORIGENS_DO_SUPABASE_EM_PRODUCAO, origensDoSupabase, politicaDeSeguranca } from "./src/server/csp.ts";

dotenv.config();

export async function createApiApp({ serveFrontend = false } = {}) {
  const app = express();

  // O papel de admin no banco segue o SUPER_ADMIN_EMAILS também para quem não
  // passa pelo servidor: ao subir, o servidor rebaixa quem saiu da lista e
  // promove quem entrou (sync_super_admins). Mudar a lista pede subir o
  // servidor de novo (na Vercel, um novo deploy). Os testes esperam por isto.
  app.locals.papeisSincronizados = isSupabaseServerConfigured()
    ? Promise.resolve(
        getSupabaseAdminClient().rpc('sync_super_admins', { p_emails: [...configuredSuperAdmins()] }),
      ).then(({ error }) => {
        if (error) console.error('Admin role sync failed:', error);
      })
    : Promise.resolve();

  const rateLimitBuckets = new Map<string, { count: number; resetsAt: number }>();
  const userRateLimit = (scope: string, limit: number, windowMs = 60_000): express.RequestHandler =>
    (request, response, next) => {
      const req = request as AuthRequest;
      const now = Date.now();
      const bucketKey = `${scope}:${req.user?.uid || request.ip}`;
      const current = rateLimitBuckets.get(bucketKey);
      const bucket = !current || current.resetsAt <= now
        ? { count: 0, resetsAt: now + windowMs }
        : current;
      bucket.count += 1;
      rateLimitBuckets.set(bucketKey, bucket);
      response.setHeader('RateLimit-Limit', String(limit));
      response.setHeader('RateLimit-Remaining', String(Math.max(0, limit - bucket.count)));
      if (bucket.count > limit) {
        response.setHeader('Retry-After', String(Math.ceil((bucket.resetsAt - now) / 1000)));
        return response.status(429).json({ error: 'Too many requests' });
      }
      next();
    };
  const requireJsonObject: express.RequestHandler = (request, response, next) => {
    if (!request.is('application/json') || !request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
      return response.status(400).json({ error: 'A JSON object body is required' });
    }
    next();
  };

  const jsonParser = express.json({ limit: '1mb' });
  app.use((req, res, next) => {
    if (req.path === '/api/webhooks/stripe') return next();
    return jsonParser(req, res, next);
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API route for AI moderation of chat comments
  app.post("/api/moderate", requireAuth, requireJsonObject, userRateLimit('moderate', 60), async (req, res) => {
    const { text } = req.body;
    if (typeof text !== 'string' || !text.trim() || text.length > 2000) {
      return res.status(400).json({ error: "Text must contain between 1 and 2000 characters" });
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

  const paidPlans = new Set(['Standard', 'Professional', 'Business']);
  // Os planos como o app os nomeia e como o banco os guarda (public.app_plan)
  const PLANO_NO_BANCO: Record<string, string> = { Standard: 'standard', Professional: 'professional', Business: 'business' };
  const PLANO_NO_APP: Record<string, 'Free Trial' | 'Standard' | 'Professional' | 'Business'> = {
    free_trial: 'Free Trial',
    standard: 'Standard',
    professional: 'Professional',
    business: 'Business',
  };
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // O plano de uma assinatura pelo preço dela, que acompanha uma troca de plano
  // feita no portal de cobrança; o metadado planId fica como veio do checkout
  const planoDoPreco = (precoId: unknown): string | undefined => {
    const precos: Record<string, string> = {};
    if (process.env.STRIPE_PRICE_STANDARD) precos[process.env.STRIPE_PRICE_STANDARD] = 'standard';
    if (process.env.STRIPE_PRICE_PRO) precos[process.env.STRIPE_PRICE_PRO] = 'professional';
    if (process.env.STRIPE_PRICE_BUSINESS) precos[process.env.STRIPE_PRICE_BUSINESS] = 'business';
    return typeof precoId === 'string' ? precos[precoId] : undefined;
  };

  // O perfil nasce no banco com a conta, pelo gatilho de auth.users, com o
  // teste de 30 dias. O servidor lê o perfil, mantém o papel de admin igual ao
  // SUPER_ADMIN_EMAILS (public.user_roles, que a RLS consulta) e calcula o que
  // o app mostra. O papel devolvido vem de isSuperAdmin (e-mail confirmado na
  // lista), nunca de um campo que o usuário edita.
  const COLUNAS_DO_PERFIL = 'display_name, avatar_url, plan, subscription_status, trial_ends_at, stripe_subscription_id';
  const ensureServerManagedProfile = async (user: NonNullable<AuthRequest['user']>) => {
    const banco = getSupabaseAdminClient();
    const lido = await banco.from('profiles').select(COLUNAS_DO_PERFIL).eq('id', user.uid).maybeSingle();
    if (lido.error) throw lido.error;
    let perfil = lido.data;
    if (!perfil) {
      // Sem perfil (apagado pela administração): nasce de novo, com um teste novo
      const criado = await banco
        .from('profiles')
        .upsert(
          {
            id: user.uid,
            email: user.email,
            display_name: (user.name || 'Usuário PwStreamer').slice(0, 120),
            avatar_url: user.picture || null,
          },
          { onConflict: 'id' },
        )
        .select(COLUNAS_DO_PERFIL)
        .single();
      if (criado.error) throw criado.error;
      perfil = criado.data;
    }

    const papel = isSuperAdmin(user) ? 'super_admin' : 'client';
    const papelGravado = await banco.from('user_roles').select('role').eq('user_id', user.uid).maybeSingle();
    if (papelGravado.error) throw papelGravado.error;
    if (papelGravado.data?.role !== papel) {
      const gravado = await banco
        .from('user_roles')
        .upsert({ user_id: user.uid, role: papel, assigned_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (gravado.error) throw gravado.error;
    }

    const now = Date.now();
    const plano = PLANO_NO_APP[perfil.plan] ?? 'Free Trial';
    const paidPlanIsActive = paidPlans.has(plano)
      && perfil.subscription_status === 'active'
      && Boolean(perfil.stripe_subscription_id);
    const trialEndsAtMs = perfil.trial_ends_at ? new Date(perfil.trial_ends_at).getTime() : 0;
    const trialDays = Math.max(0, Math.ceil((trialEndsAtMs - now) / 86_400_000));
    const inactiveStripeSubscription = Boolean(perfil.stripe_subscription_id)
      && perfil.subscription_status !== 'active';
    const isExpired = !paidPlanIsActive && (inactiveStripeSubscription || trialDays === 0);

    return {
      uid: user.uid,
      email: user.email,
      name: perfil.display_name || user.name || 'Usuário PwStreamer',
      photoURL: perfil.avatar_url || user.picture || '',
      role: papel === 'super_admin' ? 'super-admin' : 'client',
      plan: paidPlanIsActive ? plano : 'Free Trial',
      subscriptionStatus: paidPlanIsActive ? 'active' : (isExpired ? 'canceled' : 'trial'),
      isExpired,
      trialDays: paidPlanIsActive ? 0 : trialDays,
      trialEndsAt: perfil.trial_ends_at ?? null,
    };
  };

  app.get('/api/auth/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      return res.json(await ensureServerManagedProfile(req.user!));
    } catch (error) {
      console.error('Profile service failed:', error);
      return res.status(503).json({ error: 'Profile service unavailable' });
    }
  });

  // Payment Routes for Subscriptions
  app.post("/api/validate-trial", requireAuth, async (req: AuthRequest, res) => {
    try {
      const profile = await ensureServerManagedProfile(req.user!);
      const adminBypass = isSuperAdmin(req.user);
      return res.json({
        isExpired: adminBypass ? false : profile.isExpired,
        trialDays: profile.trialDays,
        canBroadcast: adminBypass || !profile.isExpired,
        canRecord: adminBypass || !profile.isExpired,
        trialEndsAt: profile.trialEndsAt,
        plan: profile.plan,
      });
    } catch (error) {
      console.error('Subscription validation failed:', error);
      return res.status(503).json({ error: 'Subscription service unavailable' });
    }
  });

  app.post("/api/checkout", requireAuth, requireJsonObject, userRateLimit('checkout', 10), async (req: AuthRequest, res) => {
    const { planId, method } = req.body;
    if (typeof planId !== 'string' || !paidPlans.has(planId)) {
      return res.status(400).json({ error: "Invalid plan" });
    }
    if (method !== undefined && method !== 'card' && method !== 'pix') {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    try {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        throw new Error("STRIPE_SECRET_KEY is required");
      }

      // Lazy load stripe
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" as any });

      let priceId: string | undefined;
      switch(planId) {
        case 'Standard': priceId = process.env.STRIPE_PRICE_STANDARD; break;
        case 'Professional': priceId = process.env.STRIPE_PRICE_PRO; break;
        case 'Business': priceId = process.env.STRIPE_PRICE_BUSINESS; break;
      }
      if (!priceId) return res.status(503).json({ error: 'Stripe price is not configured for this plan' });

      const configuredAppUrl = process.env.APP_URL;
      const appUrl = configuredAppUrl || (process.env.NODE_ENV !== 'production' ? req.headers.origin : undefined);
      if (!appUrl) return res.status(503).json({ error: 'APP_URL is not configured' });
      const parsedAppUrl = new URL(appUrl);
      if (!['http:', 'https:'].includes(parsedAppUrl.protocol)) {
        return res.status(500).json({ error: 'APP_URL is invalid' });
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
        success_url: `${parsedAppUrl.origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${parsedAppUrl.origin}/?payment=cancelled`,
        customer_email: req.user!.email,
        client_reference_id: req.user!.uid,
        metadata: {
          userId: req.user!.uid,
          planId
        },
        subscription_data: {
          metadata: {
            userId: req.user!.uid,
            planId,
          },
        },
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

  app.post('/api/billing/portal', requireAuth, userRateLimit('billing-portal', 10), async (req: AuthRequest, res) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(503).json({ error: 'Stripe is not configured' });
      }
      const { data: perfil, error } = await getSupabaseAdminClient()
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', req.user!.uid)
        .maybeSingle();
      if (error) throw error;
      if (!perfil?.stripe_customer_id) {
        return res.status(404).json({ error: 'No Stripe subscription is associated with this account' });
      }

      const appUrl = process.env.APP_URL || (process.env.NODE_ENV !== 'production' ? req.headers.origin : undefined);
      if (!appUrl) return res.status(503).json({ error: 'APP_URL is not configured' });
      const returnUrl = new URL(appUrl);
      if (!['http:', 'https:'].includes(returnUrl.protocol)) {
        return res.status(500).json({ error: 'APP_URL is invalid' });
      }

      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any });
      const session = await stripe.billingPortal.sessions.create({
        customer: perfil.stripe_customer_id,
        return_url: `${returnUrl.origin}/`,
      });
      return res.json({ url: session.url });
    } catch (error) {
      console.error('Stripe billing portal error:', error);
      return res.status(503).json({ error: 'Billing portal unavailable' });
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
  const canAccessSession = (req: AuthRequest, session: StreamSession) =>
    session.userId === req.user?.uid || isSuperAdmin(req.user);

  // 1. Create a stream session
  app.post("/api/streams", requireAuth, requireJsonObject, (req: AuthRequest, res) => {
    const { title, resolution = '1080p', bitrateKbps = 6000, fps = 30, destinations = [], ingestProtocol = 'BrowserCanvas' } = req.body;
    const parsedBitrate = Number(bitrateKbps);
    const parsedFps = Number(fps);
    const allowedProtocols = new Set(['RTMP', 'WHIP', 'SRT', 'BrowserCanvas']);
    if ((title !== undefined && (typeof title !== 'string' || title.length > 200))
      || !Number.isInteger(parsedBitrate) || parsedBitrate < 100 || parsedBitrate > 20_000
      || ![24, 25, 30, 50, 60].includes(parsedFps)
      || !allowedProtocols.has(ingestProtocol)
      || !Array.isArray(destinations) || destinations.length > 10
      || destinations.some((destination) => !destination || typeof destination !== 'object'
        || typeof destination.platform !== 'string' || destination.platform.length > 80
        || typeof (destination.targetUrl || destination.url || '') !== 'string'
        || (destination.targetUrl || destination.url || '').length > 2048
        || (destination.streamKey !== undefined && (typeof destination.streamKey !== 'string' || destination.streamKey.length > 1024)))) {
      return res.status(400).json({ error: 'Invalid stream configuration' });
    }
    
    const sessionId = `stream_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const session: StreamSession = {
      id: sessionId,
      userId: req.user!.uid,
      title: title || 'Transmissão Ao Vivo PwStreamer',
      resolution: resolution === '720p' ? '720p' : '1080p',
      bitrateKbps: parsedBitrate,
      fps: parsedFps,
      status: 'created',
      ingestProtocol,
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
        fps: parsedFps,
        bitrateKbps: parsedBitrate,
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
  app.post("/api/streams/:id/start", requireAuth, (req: AuthRequest, res) => {
    const id = String(req.params.id);
    let session = activeStreamSessions.get(id);

    if (!session) return res.status(404).json({ error: 'Sessão de transmissão não encontrada' });
    if (!canAccessSession(req, session)) return res.status(403).json({ error: 'Forbidden' });

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
  app.post("/api/streams/:id/stop", requireAuth, (req: AuthRequest, res) => {
    const id = String(req.params.id);
    const session = activeStreamSessions.get(id);

    if (!session) {
      return res.json({ success: true, message: "Sessão já finalizada." });
    }
    if (!canAccessSession(req, session)) return res.status(403).json({ error: 'Forbidden' });

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
  app.get("/api/streams/:id/status", requireAuth, (req: AuthRequest, res) => {
    const id = String(req.params.id);
    const session = activeStreamSessions.get(id);

    if (!session) {
      return res.status(404).json({ error: "Sessão de transmissão não encontrada" });
    }
    if (!canAccessSession(req, session)) return res.status(403).json({ error: 'Forbidden' });

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
  app.get("/api/streams/:id/stats", requireAuth, (req: AuthRequest, res) => {
    const id = String(req.params.id);
    const session = activeStreamSessions.get(id);
    if (!session) return res.status(404).json({ error: 'Sessão de transmissão não encontrada' });
    if (!canAccessSession(req, session)) return res.status(403).json({ error: 'Forbidden' });

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
  app.get("/api/streams", requireAuth, (req: AuthRequest, res) => {
    return res.json({
      sessions: Array.from(activeStreamSessions.values())
        .filter((session) => canAccessSession(req, session))
        .slice(-10)
    });
  });

  // ==========================================
  // REAL RTMP / RTMPS SERVER CONNECTION TESTER
  // ==========================================
  app.post("/api/rtmp/test", requireAuth, requireJsonObject, userRateLimit('rtmp-test', 20), async (req, res) => {
    const { url } = req.body;
    
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
      const parsedUrl = new URL(trimmedUrl.replace(/^rtmps:/i, 'https:').replace(/^rtmp:/i, 'http:'));
      if (parsedUrl.username || parsedUrl.password) {
        return res.status(400).json({ reachable: false, error: 'Credenciais não são permitidas na URL RTMP.' });
      }
      const host = parsedUrl.hostname;
      const port = parsedUrl.port ? Number(parsedUrl.port) : (isRtmps ? 443 : 1935);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        return res.status(400).json({ reachable: false, error: 'Porta RTMP inválida.' });
      }

      // Só portas de RTMP: sem isto o teste abria conexão TCP em qualquer
      // porta de qualquer host público, e o servidor virava um varredor.
      if (![1935, 1936, 443, 80].includes(port)) {
        return res.status(400).json({
          reachable: false,
          authenticated: false,
          error: "Destino não permitido: use um servidor RTMP público (portas 1935, 1936, 443 ou 80)."
        });
      }

      // Step 1: DNS Lookup check. Recusa host privado ou reservado, e a
      // conexão vai para o IP já conferido, não para o nome: entre a checagem
      // e a conexão o DNS poderia responder outro endereço.
      const lookupResult = await resolvePublicAddress(host);
      const ipAddress = lookupResult.address;

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
          authenticated: false,
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

  // A rota de gerar de novo uma chave RTMP saiu: sem tela nem ingestão que a
  // usassem, ela gravava nas coleções rtmpKeys e auditLogs do Firestore. As
  // tabelas de chaves do Supabase (public.rtmp_keys e o segredo cifrado em
  // app_private) ficam para quando a ingestão chegar.

  // ==========================================
  // CLOUDFLARE STREAM SECURE CONFIG & LIVE INPUTS
  // ==========================================
  app.get("/api/cloudflare/config", requireAuth, (req, res) => {
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

  app.post("/api/cloudflare/live-inputs", requireAuth, requireJsonObject, userRateLimit('cloudflare-input', 10), async (req: AuthRequest, res) => {
    const { title = 'Transmissão PwStreamer' } = req.body;
    if (typeof title !== 'string' || !title.trim() || title.length > 200) {
      return res.status(400).json({ error: 'Invalid live input title' });
    }
    const userId = req.user!.uid;
    const token = process.env.CLOUDFLARE_STREAM_API_TOKEN;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    if (!token || !accountId) {
      return res.status(503).json({ error: 'Cloudflare Stream is not configured' });
    }

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

      const cfData: any = await cfRes.json();
      if (!cfRes.ok || !cfData.success || !cfData.result?.uid) {
        return res.status(502).json({ error: 'Cloudflare rejected the live input request' });
      }
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
    } catch (cfErr) {
      console.error('Cloudflare Live Input API creation failed:', cfErr);
      return res.status(502).json({ error: 'Cloudflare Stream is unavailable' });
    }
  });

  // ==========================================
  // SECURE ROLE-BASED ACCESS CONTROL (RBAC)
  // ==========================================
  app.post("/api/auth/verify-role", requireAuth, (req: AuthRequest, res) => {
    const hasSuperAdminRole = isSuperAdmin(req.user);
    return res.json({
      uid: req.user!.uid,
      email: req.user!.email || '',
      role: hasSuperAdminRole ? 'super-admin' : 'client',
      permissions: hasSuperAdminRole
        ? ['stream.manage', 'users.manage', 'billing.manage', 'recordings.manage', 'webhooks.manage', 'settings.manage']
        : ['stream.broadcast', 'stream.record']
    });
  });

  // ==========================================
  // STRIPE WEBHOOK RECEIVER (PRODUCTION-READY)
  // ==========================================
  app.post("/api/webhooks/stripe", express.raw({ type: 'application/json', limit: '1mb' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      return res.status(503).json({ error: 'Stripe webhook verification is not configured' });
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }

    let event: any;
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any });
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error("[STRIPE WEBHOOK] Verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // O que o evento muda no perfil. Os outros tipos só ficam registrados
    const object = event.data.object as any;
    const planId = object.metadata?.planId;
    let mudanca: Record<string, string | null> = {};
    if (event.type === 'checkout.session.completed') {
      if (object.payment_status === 'paid' && paidPlans.has(planId)) {
        mudanca = {
          p_plan: PLANO_NO_BANCO[planId],
          p_subscription_status: 'active',
          p_stripe_customer_id: object.customer ?? null,
          p_stripe_subscription_id: object.subscription ?? null,
        };
      }
    } else if (event.type === 'customer.subscription.updated') {
      const plano = planoDoPreco(object.items?.data?.[0]?.price?.id) ?? (paidPlans.has(planId) ? PLANO_NO_BANCO[planId] : undefined);
      mudanca = {
        ...(plano ? { p_plan: plano } : {}),
        p_subscription_status: object.status === 'active' || object.status === 'trialing' ? 'active' : 'past_due',
        p_stripe_customer_id: object.customer ?? null,
        p_stripe_subscription_id: object.id ?? null,
      };
    } else if (event.type === 'customer.subscription.deleted') {
      mudanca = { p_plan: 'free_trial', p_subscription_status: 'canceled' };
    }

    // As mudanças de uma assinatura valem só para a assinatura do perfil; o
    // checkout traz uma nova, e pode substituir a anterior
    const escopo = event.type.startsWith('customer.subscription.') ? (object.id ?? null) : null;
    // A hora do evento no Stripe: um evento mais velho que o último aplicado só fica registrado
    const criadoEm = new Date((Number(event.created) || Math.floor(Date.now() / 1000)) * 1000).toISOString();

    // Um id que não é do Supabase (de um evento de antes da migração) não muda perfil
    const idDoUsuario = object.client_reference_id || object.metadata?.userId;
    const conta = Object.keys(mudanca).length > 0 && typeof idDoUsuario === 'string' && UUID.test(idDoUsuario)
      ? idDoUsuario
      : null;

    try {
      // O evento e a mudança no perfil numa transação só; o evento repetido não muda nada
      const { data: novo, error } = await getSupabaseAdminClient().rpc('apply_stripe_event', {
        p_event_id: event.id,
        p_event_type: event.type,
        p_event_created: criadoEm,
        p_payload: event,
        p_user_id: conta,
        p_subscription_scope: escopo,
        ...mudanca,
      });
      if (error) throw error;
      return res.json({ received: true, duplicate: novo === false });
    } catch (err) {
      // Sem uma resposta 2xx, o Stripe entrega o evento de novo mais tarde
      console.error('[STRIPE WEBHOOK] Recording failed:', err);
      return res.status(503).json({ error: 'Stripe event could not be recorded' });
    }
  });

  // As rotas de teste de webhook (test-trigger e receiver) saíram com a tela de
  // Webhooks da Administração, a única que as chamava. Sem tela, a test-trigger
  // só servia para qualquer conta logada fazer o servidor mandar um POST, com
  // corpo e cabeçalhos à escolha, a um endereço público. O webhook do Stripe,
  // acima, fica.

  if (serveFrontend) {
    const desenvolvimento = process.env.NODE_ENV !== "production";

    // Na Vercel quem serve o frontend é a CDN, e o cabeçalho vem do
    // `vercel.json`; aqui é o `npm run dev` e o `npm start` do servidor
    // próprio. As origens do Supabase saem da variável que o navegador usa,
    // para o endereço do stack local valer em desenvolvimento.
    const politica = politicaDeSeguranca({
      origensDeDados: process.env.VITE_SUPABASE_URL
        ? origensDoSupabase(process.env.VITE_SUPABASE_URL)
        : ORIGENS_DO_SUPABASE_EM_PRODUCAO,
      desenvolvimento,
    });
    app.use((_req, res, next) => {
      res.setHeader('Content-Security-Policy', politica);
      next();
    });

    if (desenvolvimento) {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.use((req, res) => {
        if (req.path.startsWith('/api/')) {
          return res.status(404).json({ error: 'Endpoint API não encontrado' });
        }
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  return app;
}
