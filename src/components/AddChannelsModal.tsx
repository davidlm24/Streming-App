import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Lock, Sparkles, ArrowRight, ShieldCheck, Radio, Server, Copy, CheckCircle2, ChevronRight, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { Destination } from '../types';

interface AddChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinations: Destination[];
  onAddOrUpdateDestination: (destination: Destination) => void;
  onToggleDestination: (id: string) => void;
  currentPlan?: 'Standard' | 'Professional' | 'Business' | 'Free Trial';
  onOpenUpgrade?: () => void;
}

export interface PlatformConfig {
  id: string;
  name: string;
  badge?: 'UPGRADE' | 'BETA' | 'NEW' | 'PRO';
  badgeColor?: string;
  defaultRtmpUrl: string;
  defaultRtmpKeyPlaceholder: string;
  avatarUrl: string;
  requiredPlan?: 'Standard' | 'Professional' | 'Business';
  guideText: string;
  logo: React.ReactNode;
  iconBg?: string;
  officialDocUrl?: string;
}

export function AddChannelsModal({
  isOpen,
  onClose,
  destinations,
  onAddOrUpdateDestination,
  onToggleDestination,
  currentPlan = 'Free Trial',
  onOpenUpgrade
}: AddChannelsModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformConfig | null>(null);
  const [channelName, setChannelName] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [successSaved, setSuccessSaved] = useState(false);

  if (!isOpen) return null;

  // Maximum active destinations allowed based on plan
  const planLimits: Record<string, { maxChannels: number; allowedProtocols: string[] }> = {
    'Free Trial': { maxChannels: 2, allowedProtocols: ['youtube', 'facebook', 'instagram', 'tiktok', 'twitch', 'kick', 'linkedin', 'rumble'] },
    'Standard': { maxChannels: 2, allowedProtocols: ['youtube', 'facebook', 'instagram', 'tiktok', 'twitch', 'kick', 'linkedin', 'rumble'] },
    'Professional': { maxChannels: 5, allowedProtocols: ['youtube', 'facebook', 'instagram', 'tiktok', 'twitch', 'kick', 'linkedin', 'rumble'] },
    'Business': { maxChannels: 8, allowedProtocols: ['youtube', 'facebook', 'instagram', 'tiktok', 'twitch', 'kick', 'linkedin', 'rumble'] }
  };

  const currentLimit = planLimits[currentPlan] || planLimits['Free Trial'];
  const activeCount = destinations.filter(d => d.selected).length;

  // Platform definitions strictly limited to the 8 requested platforms
  const platforms: PlatformConfig[] = [
    {
      id: 'youtube',
      name: 'YouTube',
      defaultRtmpUrl: 'rtmp://a.rtmp.youtube.com/live2',
      defaultRtmpKeyPlaceholder: 'xxxx-xxxx-xxxx-xxxx-xxxx',
      avatarUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=100&auto=format&fit=crop&q=80',
      guideText: 'Acesse o YouTube Studio > Criar > Transmitir ao vivo > Copie a chave de transmissão.',
      officialDocUrl: 'https://studio.youtube.com',
      logo: (
        <div className="flex items-center gap-1.5">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#FF0000">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <span className="font-extrabold text-lg text-slate-900 tracking-tight">YouTube</span>
        </div>
      )
    },
    {
      id: 'facebook',
      name: 'Facebook',
      defaultRtmpUrl: 'rtmps://live-api-s.facebook.com:443/rtmp/',
      defaultRtmpKeyPlaceholder: 'FB-xxxxxxxxxxxxxxxxxxxxxxxx',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      guideText: 'Acesse o Facebook Live Producer > Usar Chave de Stream > Copie e cole aqui.',
      officialDocUrl: 'https://facebook.com/live/producer',
      logo: (
        <span className="font-extrabold text-2xl text-[#1877F2] tracking-tighter lowercase">
          facebook
        </span>
      )
    },
    {
      id: 'instagram',
      name: 'Instagram',
      defaultRtmpUrl: 'rtmps://live-upload.instagram.com:443/rtmp/',
      defaultRtmpKeyPlaceholder: 'IG-xxxxxxxxxxxxxxxxxxxxxxxx',
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
      guideText: 'Acesse o Instagram Live Producer no computador (instagram.com) para obter a URL e Chave de stream.',
      officialDocUrl: 'https://www.instagram.com',
      logo: (
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
            </svg>
          </div>
          <span className="font-semibold text-lg italic text-slate-900 tracking-tight font-serif">Instagram</span>
        </div>
      )
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      defaultRtmpUrl: 'rtmp://live.tiktok.com/live/',
      defaultRtmpKeyPlaceholder: 'stream-xxxxxxxxxxxxxxxxxxxx',
      avatarUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=100&auto=format&fit=crop&q=80',
      guideText: 'Acesse o TikTok Live Studio ou TikTok Live Producer para gerar sua chave de stream.',
      officialDocUrl: 'https://www.tiktok.com/live',
      logo: (
        <div className="flex items-center gap-1.5">
          <svg className="w-6 h-6 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.73 1.54-.07 2.86-1.15 3.14-2.65.1-1.04.09-2.09.09-3.13V.02h-.01z"/>
          </svg>
          <span className="font-extrabold text-lg text-slate-900 tracking-tight">TikTok</span>
          <span className="text-[10px] font-black uppercase text-white bg-rose-600 px-1 py-0.2 rounded">LIVE</span>
        </div>
      )
    },
    {
      id: 'twitch',
      name: 'Twitch',
      defaultRtmpUrl: 'rtmp://live.twitch.tv/app/',
      defaultRtmpKeyPlaceholder: 'live_xxxxxxxxxxxxxxxxxxxxxxxx',
      avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80',
      guideText: 'Acesse o Painel de Controle do Criador Twitch > Configurações > Transmissão > Chave Primária.',
      officialDocUrl: 'https://dashboard.twitch.tv/settings/stream',
      logo: (
        <div className="flex items-center gap-1">
          <svg className="w-6 h-6 text-[#9146FF]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
          </svg>
          <span className="font-black text-2xl text-[#9146FF] tracking-tighter">twitch</span>
        </div>
      )
    },
    {
      id: 'kick',
      name: 'Kick',
      defaultRtmpUrl: 'rtmps://live.kick.com/app/',
      defaultRtmpKeyPlaceholder: 'sk_us_live_xxxxxxxxxxxxxxxxxxxx',
      avatarUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=100&auto=format&fit=crop&q=80',
      guideText: 'Acesse Creator Dashboard no Kick.com > Stream Key > Copie a chave de transmissão.',
      officialDocUrl: 'https://kick.com/dashboard/settings/stream',
      logo: (
        <span className="font-black text-2xl text-slate-900 tracking-wider font-mono">
          KICK
        </span>
      )
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      defaultRtmpUrl: 'rtmps://live-api.linkedin.com:443/rtmp/',
      defaultRtmpKeyPlaceholder: 'linkedin_stream_key_xxxx',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
      guideText: 'Acesse o LinkedIn Live > Configurações de Transmissão Personalizada (RTMP).',
      officialDocUrl: 'https://linkedin.com/video/golive',
      logo: (
        <div className="flex items-center gap-0.5">
          <span className="font-bold text-xl text-[#0A66C2]">Linked</span>
          <span className="bg-[#0A66C2] text-white font-bold text-lg px-1.5 py-0.2 rounded-md">in</span>
        </div>
      )
    },
    {
      id: 'rumble',
      name: 'Rumble',
      defaultRtmpUrl: 'rtmps://live.rumble.com/live/',
      defaultRtmpKeyPlaceholder: 'rumble_stream_key_xxxx',
      avatarUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100&auto=format&fit=crop&q=80',
      guideText: 'Acesse o Rumble.com > Go Live > Configuração de Transmissão RTMP.',
      officialDocUrl: 'https://rumble.com',
      logo: (
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-[#85C744] flex items-center justify-center text-white">
            <svg className="w-3.5 h-3.5 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <span className="font-extrabold text-xl text-slate-900 tracking-tight">rumble</span>
        </div>
      )
    }
  ];

  const handleSelectPlatform = (plat: PlatformConfig) => {
    // If platform requires an upgrade that is not met by the current plan:
    const isLocked = plat.requiredPlan && currentPlan === 'Free Trial';
    if (isLocked) {
      if (onOpenUpgrade) onOpenUpgrade();
      return;
    }

    // Check if user already configured this platform
    const existing = destinations.find(d => d.platform === plat.id);
    setSelectedPlatform(plat);
    setChannelName(existing ? existing.name : `${plat.name} (Canal Principal)`);
    setStreamUrl(existing?.streamUrl || plat.defaultRtmpUrl);
    setStreamKey(existing?.streamKey || '');
    setSuccessSaved(false);
  };

  const handleSaveChannel = () => {
    if (!selectedPlatform) return;

    const existingIndex = destinations.findIndex(d => d.platform === selectedPlatform.id);
    const newDest: Destination = {
      id: existingIndex >= 0 ? destinations[existingIndex].id : `dest-${selectedPlatform.id}-${Date.now()}`,
      name: channelName.trim() || selectedPlatform.name,
      platform: selectedPlatform.id,
      avatarUrl: selectedPlatform.avatarUrl,
      selected: true, // auto select when adding
      streamUrl: streamUrl.trim(),
      streamKey: streamKey.trim(),
      isCustom: selectedPlatform.id.includes('custom'),
      updatedAt: new Date().toISOString()
    };

    onAddOrUpdateDestination(newDest);
    setSuccessSaved(true);
    setTimeout(() => {
      setSelectedPlatform(null);
      setSuccessSaved(false);
    }, 900);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      id="add-channels-modal-overlay"
    >
      <div className="bg-[var(--bg)] text-slate-100 rounded-3xl w-full max-w-5xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0 bg-[var(--surface)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Radio size={18} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Add new channels
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Multistreaming
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Selecione as redes sociais e servidores RTMP para transmitir simultaneamente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Plan Info Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">Plano:</span>
              <span className="font-black text-amber-400 uppercase">{currentPlan}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-mono font-bold">
                {activeCount}/{currentLimit.maxChannels === 99 ? '∞' : currentLimit.maxChannels} destinos ativos
              </span>
            </div>

            {onOpenUpgrade && currentPlan === 'Free Trial' && (
              <button
                type="button"
                onClick={onOpenUpgrade}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-sm"
              >
                <Sparkles size={13} />
                Upgrade
              </button>
            )}

            <button 
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
              title="Fechar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-[var(--well)]">
          
          {/* Active Banner for Limit Warning */}
          {activeCount >= currentLimit.maxChannels && currentLimit.maxChannels < 99 && (
            <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
              <div className="flex items-center gap-2.5">
                <AlertCircle size={17} className="text-amber-400 shrink-0" />
                <span>
                  Você atingiu o limite de <strong>{currentLimit.maxChannels} destinos simultâneos</strong> do plano {currentPlan}. 
                  Faça upgrade para o <strong>Professional (5 destinos)</strong> ou <strong>Business (Ilimitado)</strong>.
                </span>
              </div>
              {onOpenUpgrade && (
                <button
                  type="button"
                  onClick={onOpenUpgrade}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg uppercase tracking-wider text-[10px] shrink-0 cursor-pointer ml-3"
                >
                  Ver Planos
                </button>
              )}
            </div>
          )}

          {/* Grid of 8 Platforms (YouTube, Facebook, Instagram, TikTok, Twitch, Kick, LinkedIn, Rumble) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {platforms.map((plat) => {
              const configuredDest = destinations.find(d => d.platform === plat.id);
              const isConfigured = !!configuredDest;
              const isSelected = !!configuredDest?.selected;
              const isLocked = plat.requiredPlan && currentPlan === 'Free Trial';

              return (
                <div
                  key={plat.id}
                  onClick={() => handleSelectPlatform(plat)}
                  className={`relative group h-28 sm:h-32 bg-white rounded-2xl p-3 flex flex-col items-center justify-center transition-all cursor-pointer select-none text-center shadow-md hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] border ${
                    isSelected 
                      ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-50/10' 
                      : isConfigured 
                        ? 'border-emerald-400' 
                        : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {/* Badge in top-left (e.g. UPGRADE, BETA, NEW) */}
                  {plat.badge && (
                    <span className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${plat.badgeColor || 'bg-purple-600 text-white'}`}>
                      {plat.badge}
                    </span>
                  )}

                  {/* Connected checkmark indicator in top-right */}
                  {isConfigured && (
                    <div className={`absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      isSelected 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      <Check size={10} strokeWidth={3} />
                      <span className="text-[8px]">{isSelected ? 'ON' : 'OFF'}</span>
                    </div>
                  )}

                  {/* Logo Center */}
                  <div className="flex-1 flex items-center justify-center w-full px-2">
                    {plat.logo}
                  </div>

                  {/* Platform Name Label */}
                  <div className="mt-auto">
                    <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {plat.name}
                    </p>
                  </div>

                  {/* Locked Overlay Icon for Pro-only features */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-slate-900/90 text-white px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border border-slate-700">
                        <Lock size={10} className="text-amber-400" />
                        Upgrade
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Connected Channels List preview at bottom */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Canais Configurados no seu Estúdio ({destinations.length})</span>
              <span className="text-[10px] text-slate-500 font-normal">
                Clique nos cards acima para editar chaves ou adicionar novos
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {destinations.map(dest => (
                <div 
                  key={dest.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    dest.selected 
                      ? 'bg-blue-500/10 border-blue-500/40 text-white' 
                      : 'bg-[var(--surface)] border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <img 
                      src={dest.avatarUrl} 
                      alt={dest.name} 
                      className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate text-white">{dest.name}</p>
                      <p className="text-[9px] uppercase font-bold text-slate-400">{dest.platform}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleDestination(dest.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                      dest.selected 
                        ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {dest.selected ? 'Ativo' : 'Ativar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[var(--surface)] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-blue-400" />
            <span>Transmita simultaneamente para todas as suas redes sem usar mais banda do seu computador.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
          >
            Concluir
          </button>
        </div>

      </div>

      {/* Slide-over / Modal for Platform RTMP Details Configuration */}
      <AnimatePresence>
        {selectedPlatform && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <div className="bg-[var(--bg)] text-slate-100 rounded-3xl w-full max-w-lg border border-slate-700 shadow-2xl overflow-hidden p-6 space-y-5">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white rounded-xl p-2 h-10 w-20 flex items-center justify-center shadow-xs">
                    {selectedPlatform.logo}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Configurar {selectedPlatform.name}</h3>
                    <p className="text-[11px] text-slate-400">Insira os dados de transmissão da plataforma</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlatform(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Instructions text */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-start gap-2.5">
                <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="leading-relaxed">{selectedPlatform.guideText}</p>
                  {selectedPlatform.officialDocUrl && (
                    <a 
                      href={selectedPlatform.officialDocUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:underline"
                    >
                      Abrir painel oficial do {selectedPlatform.name} <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-3.5 text-left">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Nome de Exibição do Canal
                  </label>
                  <input
                    type="text"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder="Ex: Meu Canal Oficial"
                    className="w-full px-3.5 py-2.5 bg-[var(--well)] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    URL do Servidor RTMP / RTMPS
                  </label>
                  <input
                    type="text"
                    value={streamUrl}
                    onChange={(e) => setStreamUrl(e.target.value)}
                    placeholder="rtmp://..."
                    className="w-full px-3.5 py-2.5 bg-[var(--well)] border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Chave de Transmissão (Stream Key)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="text-[10px] text-blue-400 font-bold hover:underline"
                    >
                      {showKey ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={streamKey}
                    onChange={(e) => setStreamKey(e.target.value)}
                    placeholder={selectedPlatform.defaultRtmpKeyPlaceholder}
                    className="w-full px-3.5 py-2.5 bg-[var(--well)] border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPlatform(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSaveChannel}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/20"
                >
                  {successSaved ? (
                    <>
                      <Check size={14} /> Canal Salvo!
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> Salvar & Ativar Canal
                    </>
                  )}
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
