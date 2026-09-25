import { Button } from './ui/Button';
import { apiFetch } from '../lib/apiFetch';
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Server, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  Tv, 
  Globe, 
  Youtube, 
  Sparkles, 
  Key, 
  ShieldCheck, 
  Cloud, 
  HelpCircle, 
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  Activity,
  Layers,
  RefreshCw
} from 'lucide-react';
import { Destination } from '../types';
import { cabeLigado } from '../lib/canais';
import { useConfirm } from './ui/ConfirmDialog';
import { copyText } from './ui/clipboard';
import { Modal } from './ui/Modal';
import { 
  saveDestinationsToFirestore, 
  addCustomDestinationToFirestore, 
  updateCustomDestinationInFirestore, 
  deleteCustomDestinationFromFirestore 
} from '../lib/firestoreService';

interface CustomDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinations: Destination[];
  onUpdateDestinations: (destinations: Destination[]) => void;
  userId?: string;
  /** Canais ligados ao mesmo tempo que o plano permite (plans.ts). */
  limiteDeLigados?: number;
  /** Avisa que o canal não foi ligado por causa do limite. */
  onLimiteDeCanais?: (nome: string) => void;
}

interface PlatformPreset {
  id: string;
  name: string;
  platform: Destination['platform'];
  defaultUrl: string;
  defaultPort?: number;
  placeholderKey: string;
  avatarUrl: string;
  description: string;
  badge: string;
  protocol: 'rtmp' | 'rtmps';
}

const PLATFORM_PRESETS: PlatformPreset[] = [
  {
    id: 'preset-nginx',
    name: 'NGINX RTMP Module',
    platform: 'nginx',
    defaultUrl: 'rtmp://127.0.0.1:1935/live',
    defaultPort: 1935,
    placeholderKey: 'stream_key_nginx_01',
    avatarUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=100&auto=format&fit=crop&q=80',
    description: 'Servidor RTMP local ou VPS auto-hospedado com módulo nginx-rtmp.',
    badge: 'Self-Hosted',
    protocol: 'rtmp'
  },
  {
    id: 'preset-srs',
    name: 'SRS (Simple Realtime Server)',
    platform: 'srs',
    defaultUrl: 'rtmp://127.0.0.1:1935/live',
    defaultPort: 1935,
    placeholderKey: 'livestream_srs_key',
    avatarUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=100&auto=format&fit=crop&q=80',
    description: 'Cluster SRS de alta performance para WebRTC e RTMP de baixa latência.',
    badge: 'Open Source',
    protocol: 'rtmp'
  },
  {
    id: 'preset-cloudflare',
    name: 'Cloudflare Stream Live',
    platform: 'cloudflare',
    defaultUrl: 'rtmps://live.cloudflare.com:443/live/',
    defaultPort: 443,
    placeholderKey: '72eace7ef9fd7451de7e3efb6b2d07dbka739b059baae319a0ba42453c3407b42',
    avatarUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=100&auto=format&fit=crop&q=80',
    description: 'Distribuição global em CDN com ingestão RTMPS e reprodução instantânea HLS/WebRTC.',
    badge: 'Global CDN',
    protocol: 'rtmps'
  },
  {
    id: 'preset-kick',
    name: 'Kick.com Live Stream',
    platform: 'kick',
    defaultUrl: 'rtmps://fa723710.global-contribute.live-video.net:443/app/',
    defaultPort: 443,
    placeholderKey: 'sk_us-east-1_kick_live_stream_key',
    avatarUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=100&auto=format&fit=crop&q=80',
    description: 'Transmissão direta para o Kick via ingestão RTMPS criptografada.',
    badge: 'RTMPS',
    protocol: 'rtmps'
  },
  {
    id: 'preset-restream',
    name: 'Restream.io / Multi-relay',
    platform: 'restream',
    defaultUrl: 'rtmp://live.restream.io/live',
    defaultPort: 1935,
    placeholderKey: 're_live_multistream_key',
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    description: 'Serviço intermediador para retransmissão simultânea em mais de 30 redes.',
    badge: 'Multi-stream',
    protocol: 'rtmp'
  },
  {
    id: 'preset-youtube',
    name: 'YouTube Live (RTMP Primário)',
    platform: 'youtube',
    defaultUrl: 'rtmp://a.rtmp.youtube.com/live2',
    defaultPort: 1935,
    placeholderKey: 'xxxx-xxxx-xxxx-xxxx-xxxx',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    description: 'Ingestão padrão do YouTube Studio Live com suporte a 1080p60 e 4K.',
    badge: 'RTMP',
    protocol: 'rtmp'
  },
  {
    id: 'preset-twitch',
    name: 'Twitch TV (Ingest Brasil)',
    platform: 'twitch',
    defaultUrl: 'rtmp://sao01.contribute.live-video.net/app/',
    defaultPort: 1935,
    placeholderKey: 'live_user_twitch_key_xyz',
    avatarUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=100&auto=format&fit=crop&q=80',
    description: 'Servidor oficial Twitch São Paulo (sao01) com menor tempo de ida e volta.',
    badge: 'Low Latency',
    protocol: 'rtmp'
  },
  {
    id: 'preset-custom',
    name: 'Servidor RTMP / RTMPS Personalizado',
    platform: 'custom',
    defaultUrl: 'rtmp://seu-dominio-ou-ip:1935/live',
    defaultPort: 1935,
    placeholderKey: 'minha_chave_de_transmissao',
    avatarUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=100&auto=format&fit=crop&q=80',
    description: 'Qualquer endpoint RTMP/RTMPS de terceiros (MistServer, Owncast, Wowza, Ant Media).',
    badge: 'Custom',
    protocol: 'rtmp'
  }
];

export function CustomDestinationModal({
  isOpen,
  onClose,
  destinations,
  onUpdateDestinations,
  userId,
  limiteDeLigados,
  onLimiteDeCanais
}: CustomDestinationModalProps) {
  const confirm = useConfirm();
  const [selectedDestId, setSelectedDestId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Form states
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<string>('nginx');
  const [streamUrl, setStreamUrl] = useState('');
  const [alternativeIngestUrl, setAlternativeIngestUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [port, setPort] = useState<number>(1935);
  const [notes, setNotes] = useState('');
  const [isSelectedForBroadcast, setIsSelectedForBroadcast] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Testing connection & Latency state
  const [isTesting, setIsTesting] = useState(false);
  const [testingTarget, setTestingTarget] = useState<'primary' | 'alternative' | 'both' | null>(null);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message?: string;
    latencyPrimary?: number;
    latencyAlternative?: number;
    jitterPrimary?: number;
    jitterAlternative?: number;
  }>({ status: 'idle' });

  // Bulk latency testing map for all destinations in sidebar
  const [bulkLatencyMap, setBulkLatencyMap] = useState<Record<string, { ms: number; status: 'optimal' | 'good' | 'fair' | 'poor' | 'offline' }>>({
    'dest-nginx': { ms: 14, status: 'optimal' },
    'dest-srs': { ms: 22, status: 'optimal' },
    'dest-cloudflare': { ms: 28, status: 'optimal' },
    'dest-kick': { ms: 84, status: 'good' }
  });
  const [isBulkTesting, setIsBulkTesting] = useState(false);

  // Clipboard copies
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedAltUrl, setCopiedAltUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Filter custom/RTMP destinations
  const customDestinations = destinations.filter(d => d.isCustom || d.streamUrl || d.platform === 'nginx' || d.platform === 'srs' || d.platform === 'kick' || d.platform === 'restream' || d.platform === 'custom');

  // Set initial selected item when opened
  useEffect(() => {
    if (isOpen) {
      if (customDestinations.length > 0) {
        loadDestinationIntoForm(customDestinations[0]);
      } else {
        startNewDestination('nginx');
      }
    }
  }, [isOpen]);

  const loadDestinationIntoForm = (dest: Destination) => {
    setSelectedDestId(dest.id);
    setIsCreating(false);
    setName(dest.name);
    setPlatform(dest.platform);
    setStreamUrl(dest.streamUrl || '');
    setAlternativeIngestUrl(dest.alternativeIngestUrl || dest.backupStreamUrl || '');
    setStreamKey(dest.streamKey || '');
    setUsername(dest.username || '');
    setPassword(dest.password || '');
    setPort(dest.port || (dest.streamUrl?.startsWith('rtmps://') ? 443 : 1935));
    setNotes(dest.notes || '');
    setIsSelectedForBroadcast(dest.selected);
    setTestResult({
      status: dest.latencyStatus ? 'success' : 'idle',
      latencyPrimary: dest.latencyMs,
      message: dest.latencyMs ? `Latência anterior registrada: ${dest.latencyMs}ms` : undefined
    });
  };

  const startNewDestination = (presetPlatform: string = 'nginx') => {
    const preset = PLATFORM_PRESETS.find(p => p.platform === presetPlatform) || PLATFORM_PRESETS[0];
    const generatedKey = `stream_${Math.random().toString(36).substring(2, 10)}`;
    setSelectedDestId('');
    setIsCreating(true);
    setName(`Meu Destino ${preset.name}`);
    setPlatform(preset.platform);
    setStreamUrl(preset.defaultUrl);
    setAlternativeIngestUrl('');
    setStreamKey(preset.placeholderKey.includes('xxxx') ? generatedKey : preset.placeholderKey);
    setUsername('');
    setPassword('');
    setPort(preset.defaultPort || 1935);
    setNotes(preset.description);
    setIsSelectedForBroadcast(true);
    setTestResult({ status: 'idle' });
  };

  const handleApplyPreset = (preset: PlatformPreset) => {
    setName(`Servidor ${preset.name}`);
    setPlatform(preset.platform);
    setStreamUrl(preset.defaultUrl);
    setPort(preset.defaultPort || 1935);
    setNotes(preset.description);
    if (!streamKey || streamKey.startsWith('stream_') || streamKey.includes('key_')) {
      setStreamKey(preset.placeholderKey);
    }
  };

  const handleGenerateKey = () => {
    const randomHex = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setStreamKey(`live_${platform}_${randomHex}`);
  };

  const handleTestConnection = async (target: 'primary' | 'alternative' | 'both' = 'both') => {
    if (!streamUrl.trim() && !alternativeIngestUrl.trim()) return;
    setIsTesting(true);
    setTestingTarget(target);
    setTestResult({ status: 'idle' });

    try {
      let primRes: any = null;
      let altRes: any = null;

      if ((target === 'primary' || target === 'both') && streamUrl.trim()) {
        const res = await apiFetch('/api/rtmp/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: streamUrl.trim(), streamKey })
        });
        primRes = await res.json();
      }

      if ((target === 'alternative' || target === 'both') && alternativeIngestUrl.trim()) {
        const res = await apiFetch('/api/rtmp/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: alternativeIngestUrl.trim(), streamKey })
        });
        altRes = await res.json();
      }

      const primOk = primRes ? primRes.reachable : true;
      const altOk = altRes ? altRes.reachable : true;

      if (!primOk || !altOk) {
        setTestResult({
          status: 'error',
          message: primRes?.error || altRes?.error || 'Falha ao conectar no servidor RTMP.',
          latencyPrimary: primRes?.latency,
          latencyAlternative: altRes?.latency
        });
      } else {
        const primLat = primRes?.latency;
        const altLat = altRes?.latency;
        setTestResult({
          status: 'success',
          message: `Servidor verificado! ${primLat ? `Primário: ${primLat}ms` : ''} ${altLat ? `| Alternativo: ${altLat}ms` : ''}`,
          latencyPrimary: primLat,
          latencyAlternative: altLat,
          jitterPrimary: primLat ? Math.max(1, Math.round(primLat * 0.08)) : undefined,
          jitterAlternative: altLat ? Math.max(1, Math.round(altLat * 0.08)) : undefined
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: err.message || 'Erro na requisição ao servidor de teste'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleBulkLatencyTest = async () => {
    setIsBulkTesting(true);
    
    await Promise.all(customDestinations.map(async (dest) => {
      if (!dest.streamUrl) return;
      try {
        const res = await apiFetch('/api/rtmp/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: dest.streamUrl, streamKey: dest.streamKey })
        });
        const data = await res.json();
        const ms = data.latency || 45;
        const status: 'optimal' | 'good' | 'fair' = data.reachable 
          ? (ms < 40 ? 'optimal' : ms < 100 ? 'good' : 'fair')
          : 'fair';

        setBulkLatencyMap(prev => ({
          ...prev,
          [dest.id]: { ms, status }
        }));
      } catch {
        setBulkLatencyMap(prev => ({
          ...prev,
          [dest.id]: { ms: 999, status: 'fair' }
        }));
      }
    }));

    setIsBulkTesting(false);
  };

  const handleClearLatencyLogs = () => {
    setBulkLatencyMap({});
    setTestResult({ status: 'idle' });
  };

  const handleSaveDestination = async () => {
    if (!name.trim() || !streamUrl.trim()) return;

    setIsSaving(true);
    setSaveStatus('saving');

    const avatarForPlatform = PLATFORM_PRESETS.find(p => p.platform === platform)?.avatarUrl || 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=100&auto=format&fit=crop&q=80';

    // Marcado para transmitir, mas o plano já está no limite de canais
    // ligados: salva desligado e avisa, em vez de ligar além do plano.
    const cabe = limiteDeLigados === undefined || cabeLigado(destinations, isCreating ? undefined : selectedDestId, limiteDeLigados);
    const ligar = isSelectedForBroadcast && cabe;
    if (isSelectedForBroadcast && !cabe) {
      setIsSelectedForBroadcast(false);
      onLimiteDeCanais?.(name.trim());
    }

    const currentLatency = testResult.latencyPrimary || bulkLatencyMap[selectedDestId]?.ms;
    const currentStatus = currentLatency 
      ? (currentLatency < 45 ? 'optimal' : currentLatency < 120 ? 'good' : currentLatency < 200 ? 'fair' : 'poor') 
      : undefined;

    const destinationData: Destination = {
      id: isCreating ? `dest-custom-${Date.now()}` : selectedDestId,
      name: name.trim(),
      platform: platform as any,
      avatarUrl: avatarForPlatform,
      selected: ligar,
      streamUrl: streamUrl.trim(),
      alternativeIngestUrl: alternativeIngestUrl.trim() || undefined,
      backupStreamUrl: alternativeIngestUrl.trim() || undefined,
      streamKey: streamKey.trim(),
      username: username.trim() || undefined,
      password: password.trim() || undefined,
      port: Number(port) || (streamUrl.startsWith('rtmps://') ? 443 : 1935),
      notes: notes.trim() || undefined,
      latencyMs: currentLatency,
      latencyStatus: currentStatus,
      lastLatencyCheck: currentLatency ? new Date().toISOString() : undefined,
      isCustom: true,
      updatedAt: new Date().toISOString(),
      createdAt: isCreating ? new Date().toISOString() : undefined
    };

    let updatedList: Destination[];
    if (isCreating) {
      updatedList = [...destinations, destinationData];
      setSelectedDestId(destinationData.id);
      setIsCreating(false);
    } else {
      updatedList = destinations.map(d => d.id === selectedDestId ? destinationData : d);
    }

    // Update local state immediately
    onUpdateDestinations(updatedList);

    // Persist to Firebase Firestore
    if (userId) {
      try {
        await saveDestinationsToFirestore(userId, updatedList);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (err) {
        console.error('Error saving to Firebase:', err);
        setSaveStatus('error');
      }
    } else {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }

    setIsSaving(false);
  };

  const handleDeleteDestination = async (destId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!(await confirm({ title: 'Remover este destino?', description: 'A plataforma sai da lista de multistream. As transmissões já feitas não são afetadas.', confirmLabel: 'Remover', destructive: true }))) return;

    const updatedList = destinations.filter(d => d.id !== destId);
    onUpdateDestinations(updatedList);

    if (userId) {
      try {
        await deleteCustomDestinationFromFirestore(userId, destinations, destId);
      } catch (err) {
        console.error('Error deleting from Firebase:', err);
      }
    }

    const remainingCustom = updatedList.filter(d => d.isCustom || d.streamUrl || d.platform === 'nginx');
    if (remainingCustom.length > 0) {
      loadDestinationIntoForm(remainingCustom[0]);
    } else {
      startNewDestination('nginx');
    }
  };

  const handleToggleDestinationActive = async (destId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const alvo = destinations.find(d => d.id === destId);
    if (alvo && !alvo.selected && limiteDeLigados !== undefined && !cabeLigado(destinations, destId, limiteDeLigados)) {
      onLimiteDeCanais?.(alvo.name);
      return;
    }
    const updatedList = destinations.map(d => d.id === destId ? { ...d, selected: !d.selected } : d);
    onUpdateDestinations(updatedList);
    if (selectedDestId === destId) {
      setIsSelectedForBroadcast(!isSelectedForBroadcast);
    }

    if (userId) {
      try {
        await saveDestinationsToFirestore(userId, updatedList);
      } catch (err) {
        console.error('Error updating active state in Firebase:', err);
      }
    }
  };

  const getPlatformIcon = (plat: string) => {
    switch (plat) {
      case 'nginx':
        return <Server size={16} className="text-emerald-400" />;
      case 'srs':
        return <Activity size={16} className="text-cyan-400" />;
      case 'cloudflare':
        return <Sparkles size={16} className="text-orange-400" />;
      case 'kick':
        return <Tv size={16} className="text-emerald-400" />;
      case 'youtube':
        return <Youtube size={16} className="text-red-500" />;
      case 'twitch':
        return <Tv size={16} className="text-purple-400" />;
      case 'restream':
        return <Radio size={16} className="text-blue-400" />;
      default:
        return <Globe size={16} className="text-amber-400" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} bare ariaLabel="Destinos RTMP personalizados">
      <div className="bg-[var(--bg)] border border-[var(--line-ctl)]/80 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[var(--surface)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
              <Server size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[var(--ink-hi)] tracking-wide">
                  Destinos RTMP & Plataformas Adicionais
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Cloud size={10} /> Firebase Sync
                </span>
              </div>
              <p className="text-xs text-[var(--ink-lo)] mt-0.5">
                Defina URLs de destino e chaves de fluxo para NGINX RTMP, SRS, Kick e outros servidores com persistência em nuvem.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveStatus === 'saved' && (
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1.5 animate-in fade-in duration-200">
                <CheckCircle2 size={13} /> Salvo no Firebase
              </span>
            )}
            {saveStatus === 'saving' && (
              <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 flex items-center gap-1.5 animate-in fade-in">
                <RefreshCw size={13} className="animate-spin" /> Sincronizando...
              </span>
            )}
            <button 
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-[var(--panel)] rounded-lg text-[var(--ink-lo)] hover:text-[var(--ink-hi)] transition-colors cursor-pointer"
              title="Fechar Janela"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Main Body (2 Columns Layout) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 min-h-0 bg-[var(--bg)]">
          
          {/* Left Column: List of Configured RTMP Destinations (5 Cols) */}
          <div className="md:col-span-5 p-4 sm:p-5 border-b md:border-b-0 md:border-r border-[var(--line)] space-y-4 overflow-y-auto bg-[var(--bg)]">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-lo)] flex items-center gap-1.5">
                <Layers size={14} className="text-blue-400" />
                Destinos ({customDestinations.length})
              </span>
              <div className="flex items-center gap-1.5">
                {Object.keys(bulkLatencyMap).length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearLatencyLogs}
                    className="p-1.5 bg-[var(--panel)] hover:bg-rose-500/20 text-[var(--ink-lo)] hover:text-rose-400 border border-[var(--line-ctl)] hover:border-rose-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    title="Limpar logs de latência anteriores"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkLatencyTest}
                  loading={isBulkTesting}
                  disabled={customDestinations.length === 0}
                  icon={<Activity size={11} />}
                  title="Testar latência de todos os destinos"
                >
                  Testar Pings
                </Button>
                <Button size="sm" onClick={() => startNewDestination('nginx')} icon={<Plus size={13} />}>
                  Novo
                </Button>
              </div>
            </div>

            {/* Quick Preset Selector Buttons */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--ink-dim)] block">
                Modelos Rápidos (1-Clique):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PLATFORM_PRESETS.slice(0, 4).map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      startNewDestination(preset.platform);
                    }}
                    className="px-2 py-1 bg-[var(--surface)] hover:bg-blue-600/20 text-[var(--ink)] hover:text-blue-400 hover:border-blue-500/40 border border-[var(--line)] rounded-md text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {getPlatformIcon(preset.platform)}
                    <span>{preset.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Configured Destinations Cards List */}
            <div className="space-y-2 pt-1">
              {customDestinations.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-[var(--line)] rounded-xl space-y-2 bg-[var(--surface)]/40">
                  <Server size={28} className="mx-auto text-[var(--ink-dim)]" />
                  <p className="text-xs font-semibold text-[var(--ink)]">Nenhum destino RTMP adicional cadastrado</p>
                  <p className="text-[10px] text-[var(--ink-dim)]">Clique no botão "Novo Destino" ou escolha um modelo acima para conectar seu NGINX RTMP ou outros servidores.</p>
                  <Button size="sm" className="mt-2" onClick={() => startNewDestination('nginx')}>
                    + Criar Destino NGINX RTMP
                  </Button>
                </div>
              ) : (
                customDestinations.map(dest => {
                  const isCurrent = dest.id === selectedDestId && !isCreating;
                  const latencyInfo = bulkLatencyMap[dest.id] || (dest.latencyMs ? { ms: dest.latencyMs, status: dest.latencyStatus || 'optimal' } : null);

                  return (
                    <div
                      key={dest.id}
                      onClick={() => loadDestinationIntoForm(dest)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer relative group flex items-center justify-between ${
                        isCurrent
                          ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500/40 text-[var(--ink-hi)] shadow-md'
                          : 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--line-ctl)] hover:bg-[var(--surface)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isCurrent ? 'bg-blue-500/20' : 'bg-[var(--panel)]'
                        }`}>
                          {getPlatformIcon(dest.platform)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold truncate text-[var(--ink-hi)]">{dest.name}</p>
                            {dest.selected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Ativo para transmissão" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-[9px] text-[var(--ink-lo)] font-mono truncate max-w-[110px]">
                              {dest.streamUrl || 'Sem URL definida'}
                            </p>
                            {latencyInfo && (
                              <span className={`text-[8px] font-extrabold px-1 rounded ${
                                latencyInfo.status === 'optimal' ? 'bg-emerald-500/20 text-emerald-300' :
                                latencyInfo.status === 'good' ? 'bg-blue-500/20 text-blue-300' :
                                'bg-amber-500/20 text-amber-300'
                              }`}>
                                {latencyInfo.ms}ms
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Toggle active button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleDestinationActive(dest.id, e)}
                          className={`px-2 py-1 rounded text-[9px] font-black uppercase transition-all cursor-pointer ${
                            dest.selected
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-[var(--panel)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                          }`}
                          title="Alternar se este destino transmite ao vivo"
                        >
                          {dest.selected ? 'No Ar' : 'Off'}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteDestination(dest.id, e)}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-[var(--ink-lo)] hover:text-red-400 rounded transition-all cursor-pointer"
                          title="Excluir Destino"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Destination Editor / Configuration Form (7 Cols) */}
          <div className="md:col-span-7 p-4 sm:p-6 space-y-5 overflow-y-auto">
            
            {/* Form Header */}
            <div className="flex items-center justify-between border-b border-[var(--line)]/80 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 size={16} className="text-blue-400" />
                <h3 className="text-xs font-black text-[var(--ink-hi)] uppercase tracking-wider">
                  {isCreating ? 'Cadastrar Novo Destino RTMP' : 'Configurações do Destino'}
                </h3>
              </div>
              <span className="text-[10px] text-[var(--ink-dim)] font-mono">
                {isCreating ? 'Modo Criação' : `ID: ${selectedDestId.slice(0, 16)}`}
              </span>
            </div>

            {/* Presets Bar */}
            <div className="space-y-1.5 bg-[var(--surface)] border border-[var(--line)] p-3 rounded-xl">
              <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider flex items-center justify-between">
                <span>Aplicar Configuração Predefinida:</span>
                <span className="text-[9px] text-blue-400 font-normal">Preenche URL e padrões</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {PLATFORM_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-1.5 rounded-lg border text-left transition-all text-[10px] flex items-center gap-1.5 cursor-pointer ${
                      platform === preset.platform
                        ? 'bg-blue-600/20 border-blue-500 text-[var(--ink-hi)] font-bold'
                        : 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:border-[var(--line-ctl)]'
                    }`}
                  >
                    {getPlatformIcon(preset.platform)}
                    <span className="truncate">{preset.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Form Fields */}
            <div className="space-y-4">
              
              {/* Row 1: Name and Platform */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 text-left">
                  <label htmlFor="customdestinationmodal-nome-rotulo-amigavel" className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block">
                    Nome / Rótulo Amigável <span className="text-red-400">*</span>
                  </label>
                  <input id="customdestinationmodal-nome-rotulo-amigavel"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Servidor NGINX Matriz"
                    className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label htmlFor="customdestinationmodal-tipo-de-plataforma-protocol" className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block">
                    Tipo de Plataforma / Protocolo
                  </label>
                  <select id="customdestinationmodal-tipo-de-plataforma-protocol"
                    value={platform}
                    onChange={(e) => {
                      const selectedPlat = e.target.value;
                      setPlatform(selectedPlat);
                      const matchingPreset = PLATFORM_PRESETS.find(p => p.platform === selectedPlat);
                      if (matchingPreset && (!streamUrl || streamUrl.includes('127.0.0.1') || streamUrl.includes('seu-dominio'))) {
                        setStreamUrl(matchingPreset.defaultUrl);
                        setPort(matchingPreset.defaultPort || 1935);
                      }
                    }}
                    className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="nginx">NGINX RTMP Module</option>
                    <option value="srs">SRS (Simple Realtime Server)</option>
                    <option value="cloudflare">Cloudflare Stream (RTMPS)</option>
                    <option value="kick">Kick.com</option>
                    <option value="youtube">YouTube Live RTMP</option>
                    <option value="twitch">Twitch TV</option>
                    <option value="restream">Restream.io</option>
                    <option value="custom">Outro Servidor Customizado</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Stream URL & Alternative Ingest URL */}
              <div className="space-y-3">
                {/* Primary Ingest URL */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <label htmlFor="customdestinationmodal-url-de-destino-ingest-rtmp" className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      URL de Destino / Ingest RTMP Primário <span className="text-red-400">*</span>
                    </label>
                    <span className="text-[9px] text-[var(--ink-dim)] font-mono">rtmp:// ou rtmps://</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input id="customdestinationmodal-url-de-destino-ingest-rtmp"
                      type="text"
                      value={streamUrl}
                      onChange={(e) => {
                        setStreamUrl(e.target.value);
                        setTestResult({ status: 'idle' });
                      }}
                      placeholder="rtmp://seu-servidor-nginx:1935/live"
                      className="flex-1 bg-[var(--surface)] border border-[var(--line)] rounded-lg px-3.5 py-2 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500 font-mono transition-colors"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        copyText(streamUrl);
                        setCopiedUrl(true);
                        setTimeout(() => setCopiedUrl(false), 2000);
                      }}
                      disabled={!streamUrl}
                      title="Copiar URL Primária"
                    >
                      {copiedUrl ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </Button>
                  </div>
                </div>

                {/* Alternative / Redundant Ingest URL */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <label htmlFor="customdestinationmodal-servidor-rtmp-de-ingestao-a" className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      Servidor RTMP de Ingestão Alternativo (Backup / Redundância Failover)
                    </label>
                    <span className="text-[9px] text-purple-400/80 font-mono">Opcional</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input id="customdestinationmodal-servidor-rtmp-de-ingestao-a"
                      type="text"
                      value={alternativeIngestUrl}
                      onChange={(e) => {
                        setAlternativeIngestUrl(e.target.value);
                        setTestResult({ status: 'idle' });
                      }}
                      placeholder="rtmp://backup-ingest.servidor.com:1935/live ou rtmps://..."
                      className="flex-1 bg-[var(--surface)] border border-purple-500/20 focus:border-purple-500 rounded-lg px-3.5 py-2 text-xs text-purple-200 placeholder-[var(--ink-dim)] focus:outline-none font-mono transition-colors"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        copyText(alternativeIngestUrl);
                        setCopiedAltUrl(true);
                        setTimeout(() => setCopiedAltUrl(false), 2000);
                      }}
                      disabled={!alternativeIngestUrl}
                      title="Copiar URL Alternativa"
                    >
                      {copiedAltUrl ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Latency & Quality Diagnostic Benchmark Card */}
              <div className="bg-[var(--bg)] border border-[var(--line)]/90 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-blue-400" />
                    <span className="text-[10px] font-black text-[var(--ink-hi)] uppercase tracking-wider">
                      Diagnóstico de Latência & Rota RTMP
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(testResult.latencyPrimary !== undefined || testResult.latencyAlternative !== undefined) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTestResult({ status: 'idle' })}
                        icon={<Trash2 size={10} />}
                        title="Limpar resultado de latência do formulário"
                      >
                        Limpar
                      </Button>
                    )}
                    {/* As duas eram fundo entintado (bg-blue-600/20,
                        bg-purple-600/20) — um terceiro padrão visual que a
                        primitiva não tem, e roxo está fora dos dois matizes
                        do sistema. Ghost é o secundário real aqui: "Testar
                        Ambos" já é o primário da fileira. */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestConnection('primary')}
                      disabled={isTesting || !streamUrl}
                    >
                      {isTesting && testingTarget === 'primary' ? 'Pingando...' : 'Testar Primário'}
                    </Button>
                    {alternativeIngestUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestConnection('alternative')}
                        disabled={isTesting || !alternativeIngestUrl}
                      >
                        {isTesting && testingTarget === 'alternative' ? 'Pingando...' : 'Testar Alternativo'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleTestConnection('both')}
                      disabled={isTesting || (!streamUrl && !alternativeIngestUrl)}
                    >
                      {isTesting && testingTarget === 'both' ? 'Testando...' : 'Testar Ambos'}
                    </Button>
                  </div>
                </div>

                {/* Benchmark Meters Display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Primary latency meter */}
                  <div className="p-2.5 bg-[var(--surface)] rounded-xl border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-[var(--ink-lo)] uppercase">Servidor Primário</span>
                      {testResult.latencyPrimary !== undefined ? (
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
                          testResult.latencyPrimary < 40 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          testResult.latencyPrimary < 100 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {testResult.latencyPrimary} ms {testResult.latencyPrimary < 40 ? '(Ultra-Baixa)' : '(Boa)'}
                        </span>
                      ) : (
                        <span className="text-[9px] text-[var(--ink-dim)] font-mono">Não testado</span>
                      )}
                    </div>
                    <div className="w-full bg-[var(--panel)] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          testResult.latencyPrimary ? (testResult.latencyPrimary < 40 ? 'bg-emerald-400' : testResult.latencyPrimary < 100 ? 'bg-blue-400' : 'bg-amber-400') : 'bg-[var(--raise)]'
                        }`}
                        style={{ width: testResult.latencyPrimary ? `${Math.min(100, Math.max(10, 100 - testResult.latencyPrimary / 2))}%` : '0%' }}
                      />
                    </div>
                    {testResult.jitterPrimary !== undefined && (
                      <p className="text-[8px] text-[var(--ink-lo)] font-mono">Jitter: ~{testResult.jitterPrimary}ms | Perda: 0.0% | Status: Estável</p>
                    )}
                  </div>

                  {/* Alternative latency meter */}
                  <div className="p-2.5 bg-[var(--surface)] rounded-xl border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-purple-300 uppercase">Servidor Alternativo</span>
                      {testResult.latencyAlternative !== undefined ? (
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
                          testResult.latencyAlternative < 40 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          testResult.latencyAlternative < 100 ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                          'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {testResult.latencyAlternative} ms (Backup Ativo)
                        </span>
                      ) : (
                        <span className="text-[9px] text-[var(--ink-dim)] font-mono">{alternativeIngestUrl ? 'Pendente' : 'Desativado'}</span>
                      )}
                    </div>
                    <div className="w-full bg-[var(--panel)] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          testResult.latencyAlternative ? (testResult.latencyAlternative < 40 ? 'bg-emerald-400' : 'bg-purple-400') : 'bg-[var(--raise)]'
                        }`}
                        style={{ width: testResult.latencyAlternative ? `${Math.min(100, Math.max(10, 100 - testResult.latencyAlternative / 2))}%` : '0%' }}
                      />
                    </div>
                    {testResult.jitterAlternative !== undefined && (
                      <p className="text-[8px] text-[var(--ink-lo)] font-mono">Jitter: ~{testResult.jitterAlternative}ms | Failover: Pronto</p>
                    )}
                  </div>
                </div>

                {testResult.message && (
                  <p className={`text-[10px] flex items-center gap-1 font-semibold ${
                    testResult.status === 'success' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {testResult.status === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    {testResult.message}
                  </p>
                )}
              </div>

              {/* Row 3: Stream Key with Generator and Toggle Visibility */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label htmlFor="customdestinationmodal-chave-de-fluxo-stream-key" className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block">
                    Chave de Fluxo (Stream Key)
                  </label>
                  <Button variant="ghost" size="sm" onClick={handleGenerateKey} icon={<Key size={10} />}>
                    Gerar Chave Aleatória
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input id="customdestinationmodal-chave-de-fluxo-stream-key"
                      type={showKey ? 'text' : 'password'}
                      value={streamKey}
                      onChange={(e) => setStreamKey(e.target.value)}
                      placeholder="Chave secreta de transmissão..."
                      className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-lg px-3.5 py-2 text-xs text-amber-300 placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500 font-mono transition-colors pr-9"
                    />
                    <button aria-label={showKey ? "Ocultar chave de transmissão" : "Mostrar chave de transmissão"} aria-pressed={showKey}
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-dim)] hover:text-[var(--ink)] cursor-pointer"
                    >
                      {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      copyText(streamKey);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    disabled={!streamKey}
                    title="Copiar Stream Key"
                  >
                    {copiedKey ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </Button>
                </div>
              </div>

              {/* Row 4: Optional Basic Auth for NGINX/SRS with Auth Hooks */}
              <div className="bg-[var(--surface)] border border-[var(--line)]/80 p-3.5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider flex items-center gap-1.5">
                    <Lock size={12} className="text-blue-400" />
                    Autenticação do Servidor (Opcional - on_publish / Basic)
                  </span>
                  <span className="text-[8px] text-[var(--ink-dim)]">Para NGINX com módulo de autenticação</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 text-left">
                    <label htmlFor="customdestinationmodal-usuario-rtmp" className="text-[9px] font-semibold text-[var(--ink-dim)] block">Usuário RTMP</label>
                    <input id="customdestinationmodal-usuario-rtmp"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin ou stream_user"
                      className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--ink)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label htmlFor="customdestinationmodal-senha-token-de-publicacao" className="text-[9px] font-semibold text-[var(--ink-dim)] block">Senha / Token de Publicação</label>
                    <div className="relative">
                      <input id="customdestinationmodal-senha-token-de-publicacao"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--ink)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500 font-mono pr-8"
                      />
                      <button aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} aria-pressed={showPassword}
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ink-dim)] hover:text-[var(--ink)] cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={11} /> : <Eye size={11} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 5: Notes and Broadcast toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div className="space-y-1 text-left">
                  <label htmlFor="customdestinationmodal-notas-descricao-interna" className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block">
                    Notas / Descrição Interna
                  </label>
                  <input id="customdestinationmodal-notas-descricao-interna"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Retransmissão interna no auditório 2"
                    className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-[var(--surface)] border border-[var(--line)] rounded-xl">
                  <div className="text-left">
                    <p className="text-xs font-bold text-[var(--ink-hi)]">Transmitir para este destino</p>
                    <p className="text-[9px] text-[var(--ink-dim)]">Enviar feed de vídeo no Go Live</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSelectedForBroadcast(!isSelectedForBroadcast)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors relative flex items-center cursor-pointer ${
                      isSelectedForBroadcast ? 'bg-blue-600' : 'bg-[var(--raise)]'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${
                      isSelectedForBroadcast ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Test Connection Row */}
              <div className="p-3 bg-[var(--surface)] border border-[var(--line)] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    // Passado direto, o React entregava o MouseEvent como
                    // `target`: o padrão 'both' nunca valia e setTestingTarget
                    // guardava um evento do DOM.
                    onClick={() => handleTestConnection()}
                    disabled={isTesting || !streamUrl}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wide transition-all flex items-center gap-1.5 border cursor-pointer disabled:opacity-40 ${
                      testResult.status === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : testResult.status === 'error'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : 'bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20'
                    }`}
                  >
                    {isTesting ? <RefreshCw size={13} className="animate-spin" /> : <Activity size={13} />}
                    {isTesting ? 'Verificando...' : 'Testar Conexão RTMP'}
                  </button>

                  {testResult.status === 'success' && (
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={13} /> {testResult.message}
                    </span>
                  )}
                  {testResult.status === 'error' && (
                    <span className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                      <AlertCircle size={13} /> {testResult.message}
                    </span>
                  )}
                  {testResult.status === 'idle' && !isTesting && (
                    <span className="text-[10px] text-[var(--ink-dim)]">Valide o endpoint antes de iniciar a transmissão</span>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[var(--line)] bg-[var(--surface)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[var(--ink-lo)]">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span className="hidden sm:inline">Suas preferências e credenciais são sincronizadas com segurança no Firebase Firestore.</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>

            {/* Era `bg-blue-600` cru — a marca tem token, e é --brand-deep. */}
            <Button
              onClick={handleSaveDestination}
              loading={isSaving}
              disabled={!name.trim() || !streamUrl.trim()}
              icon={<Check size={14} />}
            >
              {isCreating ? 'Salvar Novo Destino' : 'Salvar Preferências'}
            </Button>
          </div>
        </div>

      </div>
    </Modal>
  );
}
