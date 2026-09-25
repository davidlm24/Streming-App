import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/apiFetch';
import { 
  Radio, 
  Send, 
  RefreshCw, 
  Check, 
  Copy, 
  Trash2, 
  Play, 
  Sparkles, 
  Filter, 
  Search, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Code, 
  Eye, 
  Activity, 
  Terminal, 
  Settings, 
  Key, 
  Zap,
  ChevronRight,
  Layers,
  CheckCircle,
  XCircle,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { WebhookPlatform, WebhookEventLog, WebhookTriggerConfig } from '../types';
import { useToast } from './ui/Toast';
import { useConfirm } from './ui/ConfirmDialog';
import { copyText } from './ui/clipboard';
import { Modal } from './ui/Modal';

interface WebhookPanelProps {
  userId?: string;
  isLive?: boolean;
  onSaveToFirestore?: (log: any) => Promise<void>;
  initialLogs?: any[];
}

const PLATFORM_PRESETS: Record<WebhookPlatform, {
  name: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  defaultEndpoint: string;
  defaultSecret: string;
  eventTypes: Array<{
    id: string;
    name: string;
    description: string;
    defaultPayload: any;
  }>;
}> = {
  twitch: {
    name: 'Twitch (EventSub)',
    color: 'text-purple-400',
    badgeBg: 'bg-purple-500/10 text-purple-300',
    badgeBorder: 'border-purple-500/20',
    defaultEndpoint: 'https://api.pwstreamer.com/v1/webhooks/twitch',
    defaultSecret: 'whsec_tw_88b1f204ca98e',
    eventTypes: [
      {
        id: 'stream.online',
        name: 'stream.online (Início da Transmissão)',
        description: 'Notificação disparada quando o canal entra ao vivo na Twitch.',
        defaultPayload: {
          subscription: {
            id: "f1c2a92b-9bf8-40de-958b-d7982f79cd7a",
            status: "enabled",
            type: "stream.online",
            version: "1",
            condition: { broadcaster_user_id: "13370001" },
            transport: { method: "webhook", callback: "https://api.pwstreamer.com/v1/webhooks/twitch" },
            created_at: new Date().toISOString()
          },
          event: {
            id: "evt_tw_live_9941",
            broadcaster_user_id: "13370001",
            broadcaster_user_login: "pwstreamer_pro",
            broadcaster_user_name: "PwStreamer Studio",
            type: "live",
            started_at: new Date().toISOString()
          }
        }
      },
      {
        id: 'stream.offline',
        name: 'stream.offline (Término da Transmissão)',
        description: 'Notificação disparada quando o canal encerra a transmissão.',
        defaultPayload: {
          subscription: {
            id: "f1c2a92b-9bf8-40de-958b-d7982f79cd7a",
            status: "enabled",
            type: "stream.offline",
            version: "1",
            condition: { broadcaster_user_id: "13370001" }
          },
          event: {
            broadcaster_user_id: "13370001",
            broadcaster_user_login: "pwstreamer_pro",
            broadcaster_user_name: "PwStreamer Studio"
          }
        }
      },
      {
        id: 'channel.subscribe',
        name: 'channel.subscribe (Novo Inscrito / Sub)',
        description: 'Disparado quando um espectador assina ou renova o canal.',
        defaultPayload: {
          subscription: {
            id: "sub_tw_771829",
            type: "channel.subscribe",
            version: "1",
            condition: { broadcaster_user_id: "13370001" }
          },
          event: {
            user_id: "44810294",
            user_login: "marcos_dev",
            user_name: "Marcos Developer",
            broadcaster_user_id: "13370001",
            tier: "1000",
            is_gift: false
          }
        }
      },
      {
        id: 'channel.follow',
        name: 'channel.follow (Novo Seguidor)',
        description: 'Disparado quando um novo usuário segue o canal.',
        defaultPayload: {
          subscription: {
            id: "fol_tw_284719",
            type: "channel.follow",
            version: "2",
            condition: { broadcaster_user_id: "13370001" }
          },
          event: {
            user_id: "55918231",
            user_login: "ana_clara",
            user_name: "Ana Clara",
            broadcaster_user_id: "13370001",
            followed_at: new Date().toISOString()
          }
        }
      },
      {
        id: 'channel.cheer',
        name: 'channel.cheer (Bits / Doação)',
        description: 'Disparado quando alguém doa Bits no chat da transmissão.',
        defaultPayload: {
          subscription: {
            id: "cheer_tw_1029",
            type: "channel.cheer",
            version: "1",
            condition: { broadcaster_user_id: "13370001" }
          },
          event: {
            is_anonymous: false,
            user_id: "9918234",
            user_login: "carlos_gamer",
            user_name: "Carlos Gamer",
            broadcaster_user_id: "13370001",
            message: "Parabéns pela transmissão com qualidade absurda! cheer500",
            bits: 500
          }
        }
      }
    ]
  },
  facebook: {
    name: 'Facebook (Meta Graph Live API)',
    color: 'text-blue-400',
    badgeBg: 'bg-blue-500/10 text-blue-300',
    badgeBorder: 'border-blue-500/20',
    defaultEndpoint: 'https://api.pwstreamer.com/v1/webhooks/facebook',
    defaultSecret: 'whsec_fb_33c91a02fe1',
    eventTypes: [
      {
        id: 'live_video.started',
        name: 'live_video.started (Vídeo ao Vivo Iniciado)',
        description: 'Disparado pela Meta quando uma live é iniciada na Página do Facebook.',
        defaultPayload: {
          object: "page",
          entry: [
            {
              id: "109827361849201",
              time: Math.floor(Date.now() / 1000),
              changes: [
                {
                  field: "live_videos",
                  value: {
                    id: "fb_live_9812739182",
                    status: "LIVE",
                    title: "Webinar Masterclass - Ao Vivo com PwStreamer",
                    description: "Transmissão multi-destino em Full HD",
                    permalink_url: "https://facebook.com/watch/live/?v=fb_live_9812739182",
                    creation_time: new Date().toISOString()
                  }
                }
              ]
            }
          ]
        }
      },
      {
        id: 'live_video.ended',
        name: 'live_video.ended (Vídeo ao Vivo Finalizado)',
        description: 'Disparado quando a live é finalizada na Página do Facebook.',
        defaultPayload: {
          object: "page",
          entry: [
            {
              id: "109827361849201",
              time: Math.floor(Date.now() / 1000),
              changes: [
                {
                  field: "live_videos",
                  value: {
                    id: "fb_live_9812739182",
                    status: "VOD",
                    total_views: 1420,
                    peak_concurrent_viewers: 289
                  }
                }
              ]
            }
          ]
        }
      },
      {
        id: 'feed_comment',
        name: 'feed_comment (Novo Comentário na Live)',
        description: 'Disparado quando um espectador comenta no vídeo ao vivo.',
        defaultPayload: {
          object: "page",
          entry: [
            {
              id: "109827361849201",
              time: Math.floor(Date.now() / 1000),
              changes: [
                {
                  field: "feed",
                  value: {
                    item: "comment",
                    comment_id: "cm_99182741_12",
                    post_id: "fb_live_9812739182",
                    verb: "add",
                    from: { id: "fb_usr_8819", name: "Juliana Santos" },
                    message: "A imagem está perfeita e sem nenhum delay!"
                  }
                }
              ]
            }
          ]
        }
      },
      {
        id: 'page_reaction',
        name: 'page_reaction (Reação / Like na Live)',
        description: 'Disparado em curtidas e reações (Love, Wow, Haha) em tempo real.',
        defaultPayload: {
          object: "page",
          entry: [
            {
              id: "109827361849201",
              time: Math.floor(Date.now() / 1000),
              changes: [
                {
                  field: "feed",
                  value: {
                    item: "reaction",
                    reaction_type: "like",
                    post_id: "fb_live_9812739182",
                    sender_name: "Ricardo Mendes"
                  }
                }
              ]
            }
          ]
        }
      }
    ]
  },
  youtube: {
    name: 'YouTube (Live Streaming API)',
    color: 'text-red-400',
    badgeBg: 'bg-red-500/10 text-red-300',
    badgeBorder: 'border-red-500/20',
    defaultEndpoint: 'https://api.pwstreamer.com/v1/webhooks/youtube',
    defaultSecret: 'whsec_yt_11a884fbc99',
    eventTypes: [
      {
        id: 'liveBroadcast.active',
        name: 'liveBroadcast.active (Transmissão Ativa no YouTube)',
        description: 'Disparado quando a transmissão do YouTube passa para o status live.',
        defaultPayload: {
          kind: "youtube#liveBroadcast",
          etag: "yt_etag_88129",
          id: "yt_bc_771829",
          snippet: {
            publishedAt: new Date().toISOString(),
            channelId: "UC_pwstreamer_official",
            title: "Super Live Stream - Ingest Cloudflare Stream",
            description: "Transmitido com alta fidelidade e baixa latência"
          },
          status: {
            lifeCycleStatus: "live",
            recordingStatus: "recording"
          }
        }
      },
      {
        id: 'liveChatMessage.inserted',
        name: 'liveChatMessage.inserted (SuperChat / Mensagem)',
        description: 'Disparado em novas mensagens ou SuperChats enviados no YouTube.',
        defaultPayload: {
          kind: "youtube#liveChatMessage",
          id: "yt_msg_551829",
          snippet: {
            type: "superChatEvent",
            liveChatId: "yt_chat_main_881",
            authorChannelId: "UC_viewer_9918",
            publishedAt: new Date().toISOString(),
            superChatDetails: {
              amountMicros: "20000000",
              currency: "BRL",
              amountDisplayString: "R$ 20,00",
              userComment: "Excelente áudio e qualidade 1080p60!"
            }
          }
        }
      }
    ]
  },
  cloudflare: {
    name: 'Cloudflare Stream',
    color: 'text-orange-400',
    badgeBg: 'bg-orange-500/10 text-orange-300',
    badgeBorder: 'border-orange-500/20',
    defaultEndpoint: 'https://api.pwstreamer.com/v1/webhooks/cloudflare',
    defaultSecret: 'whsec_cf_44e9910ab3',
    eventTypes: [
      {
        id: 'live_input.connected',
        name: 'live_input.connected (Ingestão Conectada)',
        description: 'Disparado quando o OBS/Encoder inicia o envio de vídeo ao Cloudflare Stream.',
        defaultPayload: {
          event: "live_input.connected",
          liveInputId: "a739b059baae319a0ba42453c3407b42",
          timestamp: new Date().toISOString(),
          protocol: "RTMPS",
          clientIp: "177.18.29.41",
          bitrateKbps: 7850,
          resolution: "1920x1080",
          framerate: 60
        }
      },
      {
        id: 'live_input.disconnected',
        name: 'live_input.disconnected (Ingestão Finalizada)',
        description: 'Disparado quando o encoder encerra a conexão de envio de vídeo.',
        defaultPayload: {
          event: "live_input.disconnected",
          liveInputId: "a739b059baae319a0ba42453c3407b42",
          durationSeconds: 3640,
          totalBytesReceived: 3840192830
        }
      },
      {
        id: 'video.ready',
        name: 'video.ready (Gravação / VOD Disponível)',
        description: 'Disparado quando o arquivo de replay gravado da live é codificado.',
        defaultPayload: {
          event: "video.ready",
          videoId: "vod_cf_991823746",
          liveInputId: "a739b059baae319a0ba42453c3407b42",
          playback: {
            hls: "https://customer-kegxbticm6x79zi0.cloudflarestream.com/vod_cf_991823746/manifest/video.m3u8",
            dash: "https://customer-kegxbticm6x79zi0.cloudflarestream.com/vod_cf_991823746/manifest/video.mpd"
          }
        }
      }
    ]
  },
  stripe: {
    name: 'Stripe (Pagamentos & Planos)',
    color: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/10 text-indigo-300',
    badgeBorder: 'border-indigo-500/20',
    defaultEndpoint: 'https://api.pwstreamer.com/v1/webhooks/stripe',
    defaultSecret: 'whsec_stripe_test_9918',
    eventTypes: [
      {
        id: 'checkout.session.completed',
        name: 'checkout.session.completed (Assinatura Ativada)',
        description: 'Disparado após confirmação de pagamento de plano Standard, Pro ou Business.',
        defaultPayload: {
          id: "evt_stripe_9918274",
          type: "checkout.session.completed",
          data: {
            object: {
              id: "cs_test_a1b2c3d4",
              customer_email: "cliente@exemplo.com",
              amount_total: 9700,
              currency: "brl",
              payment_status: "paid",
              plan: "Professional"
            }
          }
        }
      }
    ]
  },
  discord: {
    name: 'Discord Webhook (Notificações)',
    color: 'text-sky-400',
    badgeBg: 'bg-sky-500/10 text-sky-300',
    badgeBorder: 'border-sky-500/20',
    defaultEndpoint: 'https://discord.com/api/webhooks/1293847291827364/abcdef123456',
    defaultSecret: '',
    eventTypes: [
      {
        id: 'stream_notification',
        name: 'stream_notification (Card Rico do Discord)',
        description: 'Envia um embed de alerta de live online para canais do Discord.',
        defaultPayload: {
          username: "PwStreamer Bot",
          avatar_url: "https://customer-kegxbticm6x79zi0.cloudflarestream.com/logo.png",
          content: "🔴 **ESTAMOS AO VIVO AGORA!** Venha assistir à transmissão:",
          embeds: [
            {
              title: "Webinar Masterclass - Transmissão em Alta Definição",
              description: "Estamos transmitindo em multiplataforma simultânea no YouTube, Facebook e Twitch.",
              url: "https://pwstreamer.com/live",
              color: 3447003,
              fields: [
                { name: "Qualidade", value: "1080p60 8000kbps", inline: true },
                { name: "Status", value: "🟢 Online", inline: true }
              ]
            }
          ]
        }
      }
    ]
  },
  custom: {
    name: 'Webhook Customizado (HTTP POST)',
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-300',
    badgeBorder: 'border-emerald-500/20',
    defaultEndpoint: 'https://webhook.site/demo-endpoint',
    defaultSecret: 'secret_custom_token_123',
    eventTypes: [
      {
        id: 'custom_event',
        name: 'custom_event (Payload Personalizado)',
        description: 'Qualquer payload JSON enviado para a sua API ou infraestrutura.',
        defaultPayload: {
          event: "studio_custom_event",
          timestamp: new Date().toISOString(),
          app: "PwStreamer Studio",
          data: {
            status: "active",
            bitrate: 8000,
            activeDestinations: ["youtube", "facebook", "twitch"]
          }
        }
      }
    ]
  }
};

export function WebhookPanel({ userId, isLive = false, onSaveToFirestore, initialLogs = [] }: WebhookPanelProps) {
  const confirm = useConfirm();
  const toast = useToast();
  // Navigation sub-tab inside webhook manager
  const [activeSubTab, setActiveSubTab] = useState<'trigger' | 'history' | 'endpoints' | 'docs'>('trigger');

  // Platform & event selection
  const [selectedPlatform, setSelectedPlatform] = useState<WebhookPlatform>('twitch');
  const [selectedEventTypeId, setSelectedEventTypeId] = useState<string>('stream.online');
  
  // Trigger form configuration
  const [targetEndpointUrl, setTargetEndpointUrl] = useState<string>('internal');
  const [secretKey, setSecretKey] = useState<string>('whsec_tw_88b1f204ca98e');
  const [payloadText, setPayloadText] = useState<string>('');
  const [customHeadersJson, setCustomHeadersJson] = useState<string>('{\n  "X-Custom-Auth": "pw-streamer-key"\n}');
  
  // Execution status & feedback
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastExecutionResult, setLastExecutionResult] = useState<WebhookEventLog | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // History state
  const [logs, setLogs] = useState<WebhookEventLog[]>(() => {
    if (initialLogs && initialLogs.length > 0) {
      return initialLogs.map(l => ({
        id: l.id || `wh-${Date.now()}`,
        timestamp: l.timestamp || l.time || new Date().toLocaleTimeString(),
        platform: (l.platform || 'twitch') as WebhookPlatform,
        eventType: l.eventType || l.path || 'test_event',
        method: (l.method || 'POST') as any,
        endpointUrl: l.endpointUrl || l.path || 'https://api.pwstreamer.com/v1/webhooks',
        status: l.status || 200,
        statusText: l.status === 200 ? 'OK' : 'Error',
        latencyMs: l.latencyMs || Math.floor(Math.random() * 40 + 15),
        requestHeaders: l.requestHeaders || { 'Content-Type': 'application/json' },
        requestPayload: typeof l.payload === 'string' ? safeParseJson(l.payload) : (l.requestPayload || l.payload || {}),
        responseHeaders: l.responseHeaders || { 'content-type': 'application/json' },
        responseBody: l.responseBody || { received: true, status: 'success' },
        mode: l.mode || 'manual_test',
        isSuccess: l.status === 200
      }));
    }
    return [
      {
        id: 'evt-init-1',
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString(),
        platform: 'twitch',
        eventType: 'stream.online',
        method: 'POST',
        endpointUrl: 'https://api.pwstreamer.com/v1/webhooks/twitch',
        status: 200,
        statusText: 'OK',
        latencyMs: 24,
        requestHeaders: {
          'Content-Type': 'application/json',
          'Twitch-Eventsub-Message-Id': 'f1c2a92b-9bf8-40de-958b-d7982f79cd7a',
          'Twitch-Eventsub-Message-Type': 'notification',
          'Twitch-Eventsub-Subscription-Type': 'stream.online',
          'Twitch-Eventsub-Message-Signature': 'sha256=9b48f981273948bf81726a...'
        },
        requestPayload: {
          event: {
            broadcaster_user_name: "PwStreamer Studio",
            type: "live",
            started_at: new Date(Date.now() - 1000 * 60 * 12).toISOString()
          }
        },
        responseHeaders: { 'content-type': 'application/json' },
        responseBody: { received: true, message: "Twitch webhook processado com sucesso" },
        mode: 'manual_test',
        isSuccess: true
      },
      {
        id: 'evt-init-2',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toLocaleTimeString(),
        platform: 'facebook',
        eventType: 'live_video.started',
        method: 'POST',
        endpointUrl: 'https://api.pwstreamer.com/v1/webhooks/facebook',
        status: 200,
        statusText: 'OK',
        latencyMs: 31,
        requestHeaders: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': 'sha256=44a981cba90123847...'
        },
        requestPayload: {
          entry: [{ changes: [{ field: "live_videos", value: { status: "LIVE", title: "Live Streaming Multi-Canal" } }] }]
        },
        responseHeaders: { 'content-type': 'application/json' },
        responseBody: { success: true, verified: true },
        mode: 'manual_test',
        isSuccess: true
      }
    ];
  });

  // Filters for history
  const [searchFilter, setSearchFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');

  // Selected Log for Deep Inspection Drawer/Modal
  const [inspectingLog, setInspectingLog] = useState<WebhookEventLog | null>(null);
  const [inspectTab, setInspectTab] = useState<'overview' | 'reqPayload' | 'reqHeaders' | 'resBody' | 'resHeaders'>('overview');

  function safeParseJson(str: string) {
    try {
      return JSON.parse(str);
    } catch {
      return { raw: str };
    }
  }

  // Set default payload when platform or event type changes
  useEffect(() => {
    const currentPlatformConfig = PLATFORM_PRESETS[selectedPlatform];
    const eventConfig = currentPlatformConfig.eventTypes.find(e => e.id === selectedEventTypeId) || currentPlatformConfig.eventTypes[0];
    if (eventConfig) {
      setPayloadText(JSON.stringify(eventConfig.defaultPayload, null, 2));
      setSelectedEventTypeId(eventConfig.id);
    }
    setSecretKey(currentPlatformConfig.defaultSecret);
  }, [selectedPlatform, selectedEventTypeId]);

  // Handler for manual test dispatch
  const handleExecuteWebhookTest = async () => {
    setIsExecuting(true);
    setLastExecutionResult(null);

    let parsedPayload: any = {};
    try {
      parsedPayload = JSON.parse(payloadText);
    } catch {
      toast.error("Aviso: O payload inserido não é um JSON válido. Verifique as chaves e aspas.");
      setIsExecuting(false);
      return;
    }

    let parsedHeaders: Record<string, string> = {};
    try {
      if (customHeadersJson.trim()) {
        parsedHeaders = JSON.parse(customHeadersJson);
      }
    } catch {
      parsedHeaders = {};
    }

    try {
      const response = await apiFetch('/api/webhooks/test-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          eventType: selectedEventTypeId,
          endpointUrl: targetEndpointUrl === 'internal' ? '' : targetEndpointUrl,
          payload: parsedPayload,
          secretKey,
          customHeaders: parsedHeaders
        })
      });

      const data = await response.json();
      if (data.log) {
        const logItem: WebhookEventLog = data.log;
        setLastExecutionResult(logItem);
        setLogs(prev => [logItem, ...prev]);

        if (onSaveToFirestore) {
          onSaveToFirestore({
            id: logItem.id,
            time: logItem.timestamp,
            method: logItem.method,
            path: logItem.endpointUrl,
            status: logItem.status,
            payload: JSON.stringify(logItem.requestPayload),
            platform: logItem.platform,
            latencyMs: logItem.latencyMs,
            eventType: logItem.eventType,
            isSuccess: logItem.isSuccess
          }).catch(console.error);
        }
      }
    } catch (err: any) {
      const fallbackLog: WebhookEventLog = {
        id: `wh_err_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        platform: selectedPlatform,
        eventType: selectedEventTypeId,
        method: 'POST',
        endpointUrl: targetEndpointUrl,
        status: 500,
        statusText: 'Client Fetch Error',
        latencyMs: 12,
        requestHeaders: { 'Content-Type': 'application/json' },
        requestPayload: parsedPayload,
        responseBody: { error: err.message || 'Falha ao despachar webhook' },
        mode: 'manual_test',
        isSuccess: false,
        error: err.message
      };
      setLastExecutionResult(fallbackLog);
      setLogs(prev => [fallbackLog, ...prev]);
    } finally {
      setIsExecuting(false);
    }
  };

  // Re-trigger an existing log
  const handleReTriggerLog = (log: WebhookEventLog) => {
    setSelectedPlatform(log.platform);
    setSelectedEventTypeId(log.eventType);
    setTargetEndpointUrl(log.endpointUrl.includes('local') ? 'internal' : log.endpointUrl);
    setPayloadText(JSON.stringify(log.requestPayload, null, 2));
    setActiveSubTab('trigger');
  };

  // Format JSON text in editor
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(payloadText);
      setPayloadText(JSON.stringify(parsed, null, 2));
    } catch {
      toast.error("JSON inválido. Não foi possível formatar.");
    }
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    copyText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  // Export history to JSON
  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `webhook_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filtered Logs
  const filteredLogs = logs.filter(log => {
    if (platformFilter !== 'all' && log.platform !== platformFilter) return false;
    if (statusFilter === 'success' && !log.isSuccess) return false;
    if (statusFilter === 'error' && log.isSuccess) return false;
    if (modeFilter !== 'all' && log.mode !== modeFilter) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchPlat = log.platform.toLowerCase().includes(q);
      const matchType = log.eventType.toLowerCase().includes(q);
      const matchUrl = log.endpointUrl.toLowerCase().includes(q);
      const matchPayload = JSON.stringify(log.requestPayload).toLowerCase().includes(q);
      if (!matchPlat && !matchType && !matchUrl && !matchPayload) return false;
    }
    return true;
  });

  const currentPlatformInfo = PLATFORM_PRESETS[selectedPlatform];

  return (
    <div className="space-y-5 text-left animate-in fade-in duration-150" id="webhook-management-panel">
      
      {/* Top Banner with Platform Status */}
      <div className="bg-gradient-to-r from-purple-950/50 via-[var(--surface)] to-blue-950/50 border border-purple-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30">
            <Radio size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[var(--ink-hi)] uppercase tracking-wider">
                Centro Avançado de Webhooks & EventSub
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black px-2 py-0.5 rounded border border-emerald-500/30 uppercase">
                Dispatcher v2.0 Ativo
              </span>
              {isLive && (
                <span className="bg-red-500/20 text-red-400 text-[9px] font-black px-2 py-0.5 rounded border border-red-500/30 uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span> Live Capturing
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--ink)] mt-0.5 leading-relaxed">
              Configure disparos manuais com payloads reais para validação de integrações com Twitch (EventSub), Facebook (Meta Graph), YouTube e Cloudflare Stream, além de acompanhar o histórico completo de requisições e assinaturas criptográficas HMAC.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('trigger')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'trigger' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-[var(--panel)] text-[var(--ink)] hover:text-[var(--ink-hi)]'
            }`}
          >
            <Zap size={14} className="text-amber-300" />
            <span>Disparador de Testes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer relative ${
              activeSubTab === 'history' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-[var(--panel)] text-[var(--ink)] hover:text-[var(--ink-hi)]'
            }`}
          >
            <Clock size={14} />
            <span>Histórico ({logs.length})</span>
            {logs.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('endpoints')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'endpoints' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-[var(--panel)] text-[var(--ink)] hover:text-[var(--ink-hi)]'
            }`}
          >
            <ShieldCheck size={14} />
            <span>Endpoints & Assinaturas</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: DISPARADOR MANUAL DE TESTES */}
      {activeSubTab === 'trigger' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="webhook-trigger-workspace">
          
          {/* Left Column: Platform & Trigger Configuration */}
          <div className="lg:col-span-5 bg-[var(--bg)] border border-[var(--line)] p-5 rounded-2xl space-y-4 shadow-md">
            
            {/* Step 1: Select Platform */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block flex items-center justify-between">
                <span>1. Escolha a Plataforma Externa</span>
                <span className="text-[9px] text-blue-400 font-semibold">Suporte a EventSub / Graph API</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(PLATFORM_PRESETS) as WebhookPlatform[]).map(plat => {
                  const info = PLATFORM_PRESETS[plat];
                  const isSelected = selectedPlatform === plat;
                  return (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => setSelectedPlatform(plat)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-blue-600/15 border-blue-500 shadow-md ring-1 ring-blue-500/50' 
                          : 'bg-[var(--surface)] border-[var(--line)] hover:border-[var(--line-ctl)] text-[var(--ink)]'
                      }`}
                    >
                      <span className={`text-xs font-black capitalize ${isSelected ? 'text-[var(--ink-hi)]' : 'text-[var(--ink)]'}`}>
                        {plat}
                      </span>
                      <span className="text-[9px] text-[var(--ink-dim)] truncate mt-0.5">
                        {info.eventTypes.length} eventos
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Select Event Type */}
            <div className="space-y-1.5 pt-2 border-t border-[var(--line)]/80">
              <label htmlFor="webhookpanel-tipo-de-evento-subscricao" className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block">
                2. Tipo de Evento / Subscrição
              </label>
              <select id="webhookpanel-tipo-de-evento-subscricao"
                value={selectedEventTypeId}
                onChange={(e) => setSelectedEventTypeId(e.target.value)}
                className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-blue-500 font-semibold transition-all cursor-pointer"
              >
                {currentPlatformInfo.eventTypes.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[var(--ink-lo)] italic">
                {currentPlatformInfo.eventTypes.find(e => e.id === selectedEventTypeId)?.description}
              </p>
            </div>

            {/* Step 3: Target Endpoint URL */}
            <div className="space-y-1.5 pt-2 border-t border-[var(--line)]/80">
              <div className="flex items-center justify-between">
                <label htmlFor="webhookpanel-destino-http-endpoint" className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block">
                  3. Destino HTTP (Endpoint)
                </label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTargetEndpointUrl('internal')}
                    className={`text-[9px] px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      targetEndpointUrl === 'internal' 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)] bg-[var(--panel)]'
                    }`}
                  >
                    Receptor Local
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetEndpointUrl(currentPlatformInfo.defaultEndpoint)}
                    className={`text-[9px] px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      targetEndpointUrl !== 'internal' 
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                        : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)] bg-[var(--panel)]'
                    }`}
                  >
                    Endpoint Remoto
                  </button>
                </div>
              </div>

              <input id="webhookpanel-destino-http-endpoint"
                type="text"
                value={targetEndpointUrl === 'internal' ? 'https://pwstreamer.local/api/webhooks/receiver (Receptor Local Embutido)' : targetEndpointUrl}
                onChange={(e) => setTargetEndpointUrl(e.target.value)}
                readOnly={targetEndpointUrl === 'internal'}
                placeholder="https://sua-api.com/webhooks/listener"
                className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs text-[var(--ink-hi)] font-mono placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500 transition-all"
              />
              <p className="text-[9px] text-[var(--ink-dim)] leading-tight">
                {targetEndpointUrl === 'internal' 
                  ? 'Modo receptor local: Simula e valida cabeçalhos, assinaturas HMAC e latência sem depender de servidor externo.'
                  : 'Modo externo: Disparará um POST real para a URL informada através do backend Express.'}
              </p>
            </div>

            {/* Step 4: Secret Key & HMAC signing */}
            <div className="space-y-1.5 pt-2 border-t border-[var(--line)]/80">
              <label htmlFor="webhookpanel-chave-secreta-hmac" className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Key size={12} className="text-amber-400" />
                  Chave Secreta HMAC (Assinatura SHA-256)
                </span>
                <span className="text-[9px] text-amber-400 font-mono">
                  {selectedPlatform === 'twitch' ? 'Twitch-Eventsub-Signature' : selectedPlatform === 'facebook' ? 'X-Hub-Signature-256' : 'Webhook-Signature'}
                </span>
              </label>
              <div className="flex gap-2">
                <input id="webhookpanel-chave-secreta-hmac" aria-label="Chave Secreta HMAC (Assinatura SHA-256)"
                  type="text"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="whsec_..."
                  className="flex-1 bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs text-[var(--ink-hi)] font-mono placeholder-[var(--ink-dim)] focus:outline-none focus:border-amber-500 transition-all"
                />
                <button
                  type="button"
                  // Segredo de assinatura é senha: crypto, e não Math.random
                  onClick={() => {
                    const bytes = new Uint8Array(16);
                    crypto.getRandomValues(bytes);
                    setSecretKey(`whsec_${selectedPlatform}_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`);
                  }}
                  className="px-3 bg-[var(--panel)] hover:bg-[var(--raise)] text-[var(--ink)] hover:text-[var(--ink-hi)] rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                  title="Gerar nova chave secreta aleatória"
                >
                  Gerar
                </button>
              </div>
            </div>

            {/* Step 5: Custom Headers */}
            <div className="space-y-1.5 pt-2 border-t border-[var(--line)]/80">
              <label htmlFor="webhookpanel-headers-http-adicionais-json" className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block flex items-center justify-between">
                <span>Headers HTTP Adicionais (JSON)</span>
                <span className="text-[9px] text-[var(--ink-dim)] font-mono">Custom Headers</span>
              </label>
              <textarea id="webhookpanel-headers-http-adicionais-json" aria-label="Headers HTTP Adicionais (JSON)"
                rows={2}
                value={customHeadersJson}
                onChange={(e) => setCustomHeadersJson(e.target.value)}
                className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl p-2.5 text-[10px] text-[var(--ink)] font-mono focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Trigger Button */}
            <button
              type="button"
              disabled={isExecuting}
              onClick={handleExecuteWebhookTest}
              className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                isExecuting 
                  ? 'bg-blue-800 text-[var(--ink)] cursor-wait' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20'
              }`}
            >
              {isExecuting ? (
                <>
                  <RefreshCw size={16} className="animate-spin text-blue-300" />
                  <span>Enviando Requisição HTTP POST...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Disparar Webhook de Teste Agora</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Payload Editor & Instant Execution Feedback */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            
            {/* Payload Editor Card */}
            <div className="bg-[var(--bg)] border border-[var(--line)] p-5 rounded-2xl flex-1 flex flex-col space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--line)]/80 pb-3">
                <div className="flex items-center gap-2">
                  <Code size={16} className="text-blue-400" />
                  <label htmlFor="webhookpanel-editor-de-payload-json" className="text-xs font-bold text-[var(--ink-hi)] uppercase tracking-wider">
                    Editor de Payload JSON (Corpo da Requisição)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFormatJson}
                    className="px-2.5 py-1 bg-[var(--panel)] hover:bg-[var(--raise)] text-[var(--ink)] hover:text-[var(--ink-hi)] rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles size={11} className="text-amber-400" /> Formatar JSON
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy(payloadText, 'payload')}
                    className="px-2.5 py-1 bg-[var(--panel)] hover:bg-[var(--raise)] text-[var(--ink)] hover:text-[var(--ink-hi)] rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    {copySuccess === 'payload' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    <span>{copySuccess === 'payload' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* JSON Textarea with syntax feel */}
              <div className="flex-1 min-h-[260px] relative">
                <textarea id="webhookpanel-editor-de-payload-json"
                  value={payloadText}
                  onChange={(e) => setPayloadText(e.target.value)}
                  className="w-full h-full min-h-[260px] bg-[var(--bg)] border border-[var(--line)]/80 rounded-xl p-3 font-mono text-[11px] leading-relaxed text-emerald-300 placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500 resize-y"
                  spellCheck={false}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-[var(--ink-dim)] font-mono pt-1">
                <span>Content-Type: application/json</span>
                <span>Tamanho aproximado: {payloadText.length} bytes</span>
              </div>
            </div>

            {/* Last Execution Result Card */}
            {lastExecutionResult && (
              <div className={`p-4 rounded-2xl border transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                lastExecutionResult.isSuccess 
                  ? 'bg-emerald-950/30 border-emerald-500/30' 
                  : 'bg-red-950/30 border-red-500/30'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {lastExecutionResult.isSuccess ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : (
                      <AlertTriangle size={18} className="text-red-400" />
                    )}
                    <span className="text-xs font-bold text-[var(--ink-hi)] uppercase tracking-wider">
                      {lastExecutionResult.isSuccess ? 'Webhook Disparado com Sucesso!' : 'Falha no Disparo do Webhook'}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                      lastExecutionResult.isSuccess ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      HTTP {lastExecutionResult.status} {lastExecutionResult.statusText}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--ink-lo)] font-mono flex items-center gap-1">
                      <Clock size={11} /> {lastExecutionResult.latencyMs}ms
                    </span>
                    <button
                      type="button"
                      onClick={() => setInspectingLog(lastExecutionResult)}
                      className="px-2.5 py-1 bg-[var(--panel)] hover:bg-[var(--raise)] text-blue-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Eye size={11} /> Inspecionar Resposta
                    </button>
                  </div>
                </div>

                <div className="bg-[var(--bg)]/80 p-3 rounded-xl border border-[var(--line)] font-mono text-[10px] text-[var(--ink)] overflow-x-auto max-h-32">
                  <pre>{JSON.stringify(lastExecutionResult.responseBody, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: HISTÓRICO DETALHADO */}
      {activeSubTab === 'history' && (
        <div className="bg-[var(--bg)] border border-[var(--line)] p-5 rounded-2xl space-y-4 shadow-md" id="webhook-history-view">
          
          {/* Header & Filter Controls */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-[var(--line)]/80 pb-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--ink-hi)] uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} className="text-blue-400" />
                Histórico Detalhado de Webhooks Disparados
              </h3>
              <p className="text-[11px] text-[var(--ink-lo)] mt-0.5">
                Auditoria de todas as chamadas manuais e automáticas com status HTTP, latência de rede e dados de requisição/resposta.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleExportLogs}
                className="px-3 py-1.5 bg-[var(--panel)] hover:bg-[var(--raise)] text-[var(--ink)] hover:text-[var(--ink-hi)] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={13} /> Exportar JSON
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (await confirm({
                    title: 'Limpar o histórico de logs?',
                    description: 'Todos os registros de webhook recebidos são apagados. Não é possível recuperá-los.',
                    confirmLabel: 'Limpar',
                    destructive: true
                  })) {
                    setLogs([]);
                  }
                }}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={13} /> Limpar
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-[var(--ink-dim)]" />
              <input aria-label="Buscar nos logs"
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar por evento, payload, URL..."
                className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Platform Filter */}
            <select aria-label="Filtrar por plataforma"
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Todas as Plataformas</option>
              <option value="twitch">Twitch (EventSub)</option>
              <option value="facebook">Facebook (Meta Graph)</option>
              <option value="youtube">YouTube Live</option>
              <option value="cloudflare">Cloudflare Stream</option>
              <option value="stripe">Stripe</option>
              <option value="custom">Customizados</option>
            </select>

            {/* Status Filter */}
            <select aria-label="Filtrar por status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Todos os Status HTTP</option>
              <option value="success">Apenas Sucesso (2xx)</option>
              <option value="error">Apenas Erros (4xx / 5xx)</option>
            </select>

            {/* Mode Filter */}
            <select aria-label="Filtrar por modo"
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Todos os Modos</option>
              <option value="manual_test">Disparos de Teste Manual</option>
              <option value="incoming">Tráfego Recebido</option>
              <option value="automated">Simulações em Live</option>
            </select>
          </div>

          {/* Table of Webhook Logs */}
          <div className="overflow-x-auto border border-[var(--line)] rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg)] text-[var(--ink-lo)] font-bold uppercase text-[10px] border-b border-[var(--line)]">
                <tr>
                  <th className="p-3.5">Hora / Data</th>
                  <th className="p-3.5">Plataforma</th>
                  <th className="p-3.5">Tipo de Evento</th>
                  <th className="p-3.5">Status HTTP</th>
                  <th className="p-3.5">Latência</th>
                  <th className="p-3.5">Modo</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]/60 text-[var(--ink)]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[var(--ink-dim)] italic">
                      Nenhum registro de webhook encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => {
                    const platInfo = PLATFORM_PRESETS[log.platform] || PLATFORM_PRESETS.custom;
                    return (
                      <tr key={log.id} className="hover:bg-[var(--panel)]/30 transition-colors">
                        <td className="p-3.5 font-mono text-[11px] text-[var(--ink-lo)]">
                          {log.timestamp}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${platInfo.badgeBg} ${platInfo.badgeBorder}`}>
                            {log.platform}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[var(--ink-hi)] font-bold text-[11px]">
                          {log.eventType}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                            log.isSuccess 
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-red-500/15 text-red-400 border border-red-500/20'
                          }`}>
                            {log.status} {log.statusText}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-[var(--ink-lo)]">
                          {log.latencyMs}ms
                        </td>
                        <td className="p-3.5">
                          <span className="text-[10px] text-[var(--ink-lo)] bg-[var(--panel)] px-2 py-0.5 rounded font-semibold">
                            {log.mode === 'manual_test' ? 'Teste Manual' : 'Em Live'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setInspectingLog(log);
                                setInspectTab('overview');
                              }}
                              className="px-2.5 py-1 bg-[var(--panel)] hover:bg-[var(--raise)] text-blue-300 hover:text-[var(--ink-hi)] rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="Inspecionar requisição e resposta completas"
                            >
                              <Eye size={11} /> Ver Detalhes
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReTriggerLog(log)}
                              className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="Carregar este evento no disparador para reenviar"
                            >
                              <RotateCcw size={11} /> Reenviar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ENDPOINTS & DOCUMENTAÇÃO DE ASSINATURA */}
      {activeSubTab === 'endpoints' && (
        <div className="bg-[var(--bg)] border border-[var(--line)] p-5 rounded-2xl space-y-6 shadow-md" id="webhook-endpoints-guide">
          <div>
            <h3 className="text-sm font-bold text-[var(--ink-hi)] uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              Guia de Integração e Verificação Criptográfica HMAC
            </h3>
            <p className="text-[11px] text-[var(--ink-lo)] mt-1">
              Como validar com segurança os webhooks enviados pelo PwStreamer ou recebidos de plataformas parceiras como Twitch e Meta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Twitch EventSub Guide */}
            <div className="bg-[var(--surface)] border border-purple-500/20 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-purple-500/20 text-purple-300 rounded-lg">
                  <Radio size={16} />
                </span>
                <h4 className="text-xs font-bold text-[var(--ink-hi)] uppercase">Twitch EventSub Webhooks</h4>
              </div>
              <p className="text-[11px] text-[var(--ink)] leading-relaxed">
                A Twitch assina cada requisição usando HMAC-SHA256. Você deve concatenar <code className="text-purple-300 font-mono">Twitch-Eventsub-Message-Id + Twitch-Eventsub-Message-Timestamp + RawBody</code> e comparar com o header <code className="text-purple-300 font-mono">Twitch-Eventsub-Message-Signature</code>.
              </p>
              <div className="bg-[var(--bg)] p-3 rounded-lg font-mono text-[10px] text-purple-200 overflow-x-auto">
                <p className="text-[var(--ink-dim)]">// Node.js / Express verification:</p>
                <p>const message = id + timestamp + rawBody;</p>
                <p>const hmac = crypto.createHmac('sha256', secret);</p>
                <p>const signature = 'sha256=' + hmac.update(message).digest('hex');</p>
              </div>
            </div>

            {/* Facebook Graph API Guide */}
            <div className="bg-[var(--surface)] border border-blue-500/20 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-500/20 text-blue-300 rounded-lg">
                  <ShieldCheck size={16} />
                </span>
                <h4 className="text-xs font-bold text-[var(--ink-hi)] uppercase">Facebook (Meta Graph Webhooks)</h4>
              </div>
              <p className="text-[11px] text-[var(--ink)] leading-relaxed">
                A Meta envia a assinatura no cabeçalho <code className="text-blue-300 font-mono">X-Hub-Signature-256</code> contendo o hash HMAC-SHA256 do corpo bruto calculado com seu <code className="text-blue-300 font-mono">App Secret</code>.
              </p>
              <div className="bg-[var(--bg)] p-3 rounded-lg font-mono text-[10px] text-blue-200 overflow-x-auto">
                <p className="text-[var(--ink-dim)]">// Meta signature check:</p>
                <p>const expectedSig = 'sha256=' + crypto.createHmac('sha256', appSecret)</p>
                <p>  .update(rawBody)</p>
                <p>  .digest('hex');</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DEEP INSPECTOR MODAL */}
      {inspectingLog && (
        <Modal isOpen onClose={() => setInspectingLog(null)} bare ariaLabel="Detalhes do webhook">
          <div className="bg-[var(--bg)] border border-[var(--line)] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-left">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[var(--surface)] border-b border-[var(--line)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${
                  inspectingLog.isSuccess 
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                    : 'bg-red-500/15 border-red-500/30 text-red-400'
                }`}>
                  {inspectingLog.isSuccess ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--ink-hi)] uppercase tracking-wider">
                      Inspecionar Webhook #{inspectingLog.id}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      inspectingLog.isSuccess ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {inspectingLog.status} {inspectingLog.statusText}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--ink-lo)] font-mono mt-0.5">
                    {inspectingLog.platform.toUpperCase()} ➜ {inspectingLog.eventType} ({inspectingLog.latencyMs}ms)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="p-1.5 text-[var(--ink-lo)] hover:text-[var(--ink-hi)] rounded-lg bg-[var(--panel)]/80 hover:bg-[var(--panel)] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="flex border-b border-[var(--line)] bg-[var(--bg)] px-6 gap-2 pt-2">
              {[
                { id: 'overview', label: 'Visão Geral' },
                { id: 'reqPayload', label: 'Corpo da Requisição (Payload)' },
                { id: 'reqHeaders', label: 'Headers Enviados' },
                { id: 'resBody', label: 'Resposta Recebida' },
                { id: 'resHeaders', label: 'Headers de Resposta' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setInspectTab(t.id as any)}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    inspectTab === t.id 
                      ? 'border-blue-500 text-[var(--ink-hi)]' 
                      : 'border-transparent text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Body with Active Tab */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 font-mono text-xs">
              
              {inspectTab === 'overview' && (
                <div className="space-y-3 font-sans">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-[var(--surface)] border border-[var(--line)] rounded-xl">
                      <span className="text-[10px] text-[var(--ink-lo)] font-bold uppercase block">Plataforma</span>
                      <span className="text-[var(--ink-hi)] font-bold text-sm capitalize">{inspectingLog.platform}</span>
                    </div>
                    <div className="p-3 bg-[var(--surface)] border border-[var(--line)] rounded-xl">
                      <span className="text-[10px] text-[var(--ink-lo)] font-bold uppercase block">Status Code</span>
                      <span className={`font-bold text-sm ${inspectingLog.isSuccess ? 'text-emerald-400' : 'text-red-400'}`}>
                        {inspectingLog.status} {inspectingLog.statusText}
                      </span>
                    </div>
                    <div className="p-3 bg-[var(--surface)] border border-[var(--line)] rounded-xl">
                      <span className="text-[10px] text-[var(--ink-lo)] font-bold uppercase block">Latência de Ida e Volta</span>
                      <span className="text-blue-400 font-bold text-sm">{inspectingLog.latencyMs} ms</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[var(--surface)] border border-[var(--line)] rounded-xl space-y-1">
                    <span className="text-[10px] text-[var(--ink-lo)] font-bold uppercase block">URL do Endpoint</span>
                    <span className="text-[var(--ink-hi)] font-mono text-xs break-all select-all">{inspectingLog.endpointUrl}</span>
                  </div>

                  <div className="p-3.5 bg-[var(--surface)] border border-[var(--line)] rounded-xl space-y-1">
                    <span className="text-[10px] text-[var(--ink-lo)] font-bold uppercase block">Data e Hora do Disparo</span>
                    <span className="text-[var(--ink-hi)] text-xs">{inspectingLog.timestamp}</span>
                  </div>
                </div>
              )}

              {inspectTab === 'reqPayload' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-[var(--ink-lo)]">
                    <span>JSON Payload:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(JSON.stringify(inspectingLog.requestPayload, null, 2), 'modal-payload')}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer font-sans font-bold"
                    >
                      {copySuccess === 'modal-payload' ? <Check size={12} /> : <Copy size={12} />}
                      {copySuccess === 'modal-payload' ? 'Copiado!' : 'Copiar Payload'}
                    </button>
                  </div>
                  <pre className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-emerald-300 text-[11px] overflow-x-auto leading-relaxed select-all">
                    {JSON.stringify(inspectingLog.requestPayload, null, 2)}
                  </pre>
                </div>
              )}

              {inspectTab === 'reqHeaders' && (
                <div className="space-y-2">
                  <span className="text-[10px] text-[var(--ink-lo)] block">Cabeçalhos HTTP Enviados:</span>
                  <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-blue-300 text-[11px] space-y-1 overflow-x-auto select-all">
                    {Object.entries(inspectingLog.requestHeaders).map(([key, val]) => (
                      <div key={key} className="flex gap-2">
                        <span className="text-[var(--ink-lo)] font-bold">{key}:</span>
                        <span className="text-[var(--ink-hi)]">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {inspectTab === 'resBody' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-[var(--ink-lo)]">
                    <span>Corpo da Resposta do Servidor:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(JSON.stringify(inspectingLog.responseBody, null, 2), 'modal-res')}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer font-sans font-bold"
                    >
                      {copySuccess === 'modal-res' ? <Check size={12} /> : <Copy size={12} />}
                      {copySuccess === 'modal-res' ? 'Copiado!' : 'Copiar Resposta'}
                    </button>
                  </div>
                  <pre className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-yellow-300 text-[11px] overflow-x-auto leading-relaxed select-all">
                    {JSON.stringify(inspectingLog.responseBody, null, 2)}
                  </pre>
                </div>
              )}

              {inspectTab === 'resHeaders' && (
                <div className="space-y-2">
                  <span className="text-[10px] text-[var(--ink-lo)] block">Cabeçalhos Retornados:</span>
                  <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-[var(--ink)] text-[11px] space-y-1 overflow-x-auto select-all">
                    {inspectingLog.responseHeaders && Object.keys(inspectingLog.responseHeaders).length > 0 ? (
                      Object.entries(inspectingLog.responseHeaders).map(([key, val]) => (
                        <div key={key} className="flex gap-2">
                          <span className="text-[var(--ink-lo)] font-bold">{key}:</span>
                          <span className="text-[var(--ink-hi)]">{val}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[var(--ink-dim)] italic">Nenhum cabeçalho retornado ou receptor interno simulado.</p>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-[var(--surface)] border-t border-[var(--line)] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  handleReTriggerLog(inspectingLog);
                  setInspectingLog(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <RotateCcw size={13} />
                <span>Carregar no Disparador</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="px-4 py-2 bg-[var(--panel)] hover:bg-[var(--raise)] text-[var(--ink-hi)] rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
}
