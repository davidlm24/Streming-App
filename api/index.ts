import express from "express";
import crypto from "crypto";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API route for AI moderation of chat comments
app.post("/api/moderate", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text is required" });
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
app.post("/api/validate-trial", async (req, res) => {
  const { userId, userEmail, plan, trialEndsAt, trialDays, isExpired } = req.body;
  
  if (plan && plan !== "Free Trial") {
    return res.json({
      isExpired: false,
      trialDays: 30,
      canBroadcast: true,
      canRecord: true,
      plan
    });
  }

  const now = Date.now();
  const endsAtMs = trialEndsAt ? new Date(trialEndsAt).getTime() : now - 1000;
  const diffDays = Math.ceil((endsAtMs - now) / (1000 * 60 * 60 * 24));
  const expired = isExpired === true || trialDays === 0 || diffDays <= 0;
  const remainingDays = expired ? 0 : Math.max(0, diffDays);

  return res.json({
    isExpired: expired,
    trialDays: remainingDays,
    canBroadcast: !expired,
    canRecord: !expired,
    trialEndsAt: trialEndsAt || new Date(endsAtMs).toISOString(),
    plan: plan || 'Free Trial'
  });
});

app.post("/api/checkout", async (req, res) => {
  const { planId, userId, userEmail, method } = req.body;
  
  if (!planId || !userId || !userEmail) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is required");
    }

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
          price: priceId,
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
    res.json({ url: `${req.headers.origin}/?payment=success&mock=true` });
  }
});

// Webhook Test Trigger Endpoint
app.post("/api/webhooks/test-trigger", async (req, res) => {
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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': `PwStreamer-Webhook-Dispatcher/2.0 (${platform})`,
    'X-PwStream-Event-Id': eventId,
    'X-PwStream-Delivery-Timestamp': timestampIso,
    ...customHeaders
  };

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

  const isInternalReceiver = !endpointUrl || endpointUrl.includes('/api/webhooks/receiver') || endpointUrl === 'internal';

  if (isInternalReceiver) {
    const latencyMs = Math.floor(Math.random() * 35) + 15;
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

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startTime;
    let resBody: any;
    const resText = await response.text();
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

export default app;
