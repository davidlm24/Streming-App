import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle2, Server, Save, Activity, RefreshCw, AlertCircle, Plus, Trash2, Youtube, Tv, Globe, Radio, Check, Edit3 } from 'lucide-react';

export interface RTMPProfile {
  id: string;
  name: string;
  platform: 'YouTube Live' | 'Twitch TV' | 'Facebook Live' | 'Custom RTMP' | 'Restream' | 'Cloudflare Stream';
  url: string;
  streamKey: string;
  isDefault?: boolean;
}

const DEFAULT_PROFILES: RTMPProfile[] = [
  {
    id: 'prof-cf',
    name: 'Cloudflare Stream (Live Ingest RTMPS)',
    platform: 'Cloudflare Stream',
    url: 'rtmps://live.cloudflare.com:443/live/',
    streamKey: '72eace7ef9fd7451de7e3efb6b2d07dbka739b059baae319a0ba42453c3407b42',
    isDefault: true,
  },
  {
    id: 'prof-yt',
    name: 'Canal Oficial YouTube',
    platform: 'YouTube Live',
    url: 'rtmp://a.rtmp.youtube.com/live2',
    streamKey: 'yt_live_9812_3840_911',
  },
  {
    id: 'prof-twitch',
    name: 'Canal Twitch TV',
    platform: 'Twitch TV',
    url: 'rtmp://live.twitch.tv/app',
    streamKey: 'live_tw_881902_x491',
  },
  {
    id: 'prof-fb',
    name: 'Página Facebook Live',
    platform: 'Facebook Live',
    url: 'rtmps://live-api-s.facebook.com:443/rtmp/',
    streamKey: 'fb_live_key_0029318',
  },
  {
    id: 'prof-pwstream',
    name: 'Servidor PwStreamer Ingest',
    platform: 'Custom RTMP',
    url: 'rtmp://stream.pwstreamer.com/live',
    streamKey: 'pw_mgdlms_2026_live',
  }
];

interface RTMPConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string, key: string) => void;
  initialUrl?: string;
  initialKey?: string;
}

export function RTMPConfigModal({ isOpen, onClose, onSave, initialUrl = '', initialKey = '' }: RTMPConfigModalProps) {
  const [profiles, setProfiles] = useState<RTMPProfile[]>(() => {
    try {
      const saved = localStorage.getItem('pw_rtmp_profiles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Could not load RTMP profiles from localStorage", e);
    }
    return DEFAULT_PROFILES;
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    if (initialUrl) {
      const existing = DEFAULT_PROFILES.find(p => p.url === initialUrl);
      if (existing) return existing.id;
    }
    return DEFAULT_PROFILES[0].id;
  });

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || DEFAULT_PROFILES[0];

  const [url, setUrl] = useState(activeProfile?.url || '');
  const [streamKey, setStreamKey] = useState(activeProfile?.streamKey || '');
  const [profileName, setProfileName] = useState(activeProfile?.name || '');
  const [platform, setPlatform] = useState<RTMPProfile['platform']>(activeProfile?.platform || 'Custom RTMP');

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [testDetails, setTestDetails] = useState<string>('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Sync profile edits to current profile state
  useEffect(() => {
    if (activeProfile) {
      setUrl(activeProfile.url);
      setStreamKey(activeProfile.streamKey);
      setProfileName(activeProfile.name);
      setPlatform(activeProfile.platform);
      setTestResult('idle');
      setTestDetails('');
    }
  }, [activeProfileId]);

  // Persist profiles to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pw_rtmp_profiles', JSON.stringify(profiles));
    } catch (e) {
      console.warn("Could not save RTMP profiles to localStorage", e);
    }
  }, [profiles]);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(streamKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleTestConnection = async () => {
    if (!url) return;
    setIsTesting(true);
    setTestResult('idle');
    setTestDetails('');

    try {
      const res = await fetch('/api/rtmp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, streamKey })
      });
      const data = await res.json();
      
      if (data.reachable) {
        setTestResult('success');
        setTestDetails(`${data.message || 'Servidor online'} | Latência: ${data.latency}ms (${data.protocol})`);
      } else {
        setTestResult('error');
        setTestDetails(data.error || 'Falha ao conectar na porta do servidor.');
      }
    } catch (err: any) {
      setTestResult('error');
      setTestDetails(err.message || 'Erro na requisição de teste');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSelectProfile = (id: string) => {
    setActiveProfileId(id);
    setIsAddingNew(false);
  };

  const handleSaveCurrentProfile = () => {
    setProfiles(prev => prev.map(p => {
      if (p.id === activeProfileId) {
        return {
          ...p,
          name: profileName || p.name,
          platform,
          url,
          streamKey
        };
      }
      return p;
    }));
  };

  const handleCreateNewProfile = () => {
    const newId = `prof-${Date.now()}`;
    const newProf: RTMPProfile = {
      id: newId,
      name: 'Novo Destino Customizado',
      platform: 'Custom RTMP',
      url: 'rtmp://stream.pwstreamer.com/live',
      streamKey: `key_${Math.floor(Math.random() * 899999 + 100000)}`
    };
    setProfiles(prev => [...prev, newProf]);
    setActiveProfileId(newId);
    setIsAddingNew(true);
  };

  const handleDeleteProfile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (profiles.length <= 1) return;
    const filtered = profiles.filter(p => p.id !== id);
    setProfiles(filtered);
    if (activeProfileId === id) {
      setActiveProfileId(filtered[0].id);
    }
  };

  const handleApplyAndClose = () => {
    // Ensure active profile is saved
    handleSaveCurrentProfile();
    if (url && streamKey) {
      onSave(url, streamKey);
      onClose();
    }
  };

  const getPlatformIcon = (plat: RTMPProfile['platform']) => {
    switch (plat) {
      case 'YouTube Live':
        return <Youtube size={16} className="text-red-500" />;
      case 'Twitch TV':
        return <Tv size={16} className="text-purple-400" />;
      case 'Facebook Live':
        return <Globe size={16} className="text-blue-500" />;
      default:
        return <Radio size={16} className="text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--bg)]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--surface)] border border-[var(--line-ctl)]/50 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[var(--bg)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Server className="text-purple-400" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--ink-hi)] leading-tight">Perfis & Destinos RTMP Multicanais</h2>
              <p className="text-xs text-[var(--ink-lo)] mt-1">Gerencie múltiplos perfis de transmissão e alterne rapidamente sem sobrescrever configurações.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-[var(--ink-lo)] hover:text-[var(--ink-hi)] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          
          {/* Profile Switcher Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Radio size={14} /> Perfis Salvos ({profiles.length})
              </label>
              <button
                type="button"
                onClick={handleCreateNewProfile}
                className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Novo Perfil RTMP
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {profiles.map((prof) => {
                const isSelected = prof.id === activeProfileId;
                return (
                  <div
                    key={prof.id}
                    onClick={() => handleSelectProfile(prof.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group relative ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500 text-white shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/50'
                        : 'bg-[var(--well)] border-white/5 text-[var(--ink)] hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-purple-500/20' : 'bg-white/5'
                      }`}>
                        {getPlatformIcon(prof.platform)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[var(--ink-hi)] truncate">{prof.name}</span>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />}
                        </div>
                        <span className="text-[10px] text-[var(--ink-lo)] font-mono truncate block">{prof.url}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isSelected ? (
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-bold uppercase">
                          Ativo
                        </span>
                      ) : (
                        profiles.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteProfile(prof.id, e)}
                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-[var(--ink-lo)] hover:text-rose-400 rounded-lg transition-all"
                            title="Excluir Perfil"
                          >
                            <Trash2 size={13} />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Edit Selected Profile Form */}
          <div className="bg-[var(--well)] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-xs font-bold text-[var(--ink-hi)] uppercase tracking-wider flex items-center gap-2">
                <Edit3 size={14} className="text-purple-400" /> Configurações do Perfil Selecionado
              </span>
              <span className="text-[10px] text-[var(--ink-lo)] font-mono">ID: {activeProfileId}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block">Nome do Perfil</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => {
                    setProfileName(e.target.value);
                    handleSaveCurrentProfile();
                  }}
                  placeholder="Ex: Transmissão Principal YouTube"
                  className="w-full bg-[var(--bg)] px-3 py-2 rounded-lg text-xs text-[var(--ink-hi)] border border-white/10 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block">Plataforma</label>
                <select
                  value={platform}
                  onChange={(e) => {
                    const newPlat = e.target.value as RTMPProfile['platform'];
                    setPlatform(newPlat);
                    if (newPlat === 'Cloudflare Stream' && !url) {
                      setUrl('rtmps://live.cloudflare.com:443/live/');
                      setStreamKey('72eace7ef9fd7451de7e3efb6b2d07dbka739b059baae319a0ba42453c3407b42');
                    }
                    if (newPlat === 'YouTube Live' && !url) setUrl('rtmp://a.rtmp.youtube.com/live2');
                    if (newPlat === 'Twitch TV' && !url) setUrl('rtmp://live.twitch.tv/app');
                    if (newPlat === 'Facebook Live' && !url) setUrl('rtmps://live-api-s.facebook.com:443/rtmp/');
                  }}
                  className="w-full bg-[var(--bg)] px-3 py-2 rounded-lg text-xs text-[var(--ink-hi)] border border-white/10 focus:outline-none focus:border-purple-500"
                >
                  <option value="Cloudflare Stream">Cloudflare Stream (RTMPS)</option>
                  <option value="YouTube Live">YouTube Live</option>
                  <option value="Twitch TV">Twitch TV</option>
                  <option value="Facebook Live">Facebook Live</option>
                  <option value="Custom RTMP">Custom RTMP / Servidor Próprio</option>
                  <option value="Restream">Restream.io</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block">Servidor RTMP (URL Ingest)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setTestResult('idle');
                    }}
                    placeholder="rtmp://a.rtmp.youtube.com/live2"
                    className="flex-1 bg-[var(--bg)] px-3.5 py-2.5 rounded-lg text-xs text-[var(--ink-hi)] border border-white/10 focus:outline-none focus:border-purple-500 font-mono transition-colors"
                  />
                  <button 
                    type="button"
                    onClick={handleCopyUrl}
                    disabled={!url}
                    className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 border border-white/10 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 min-w-[100px] justify-center cursor-pointer"
                  >
                    {copiedUrl ? <><CheckCircle2 size={14} className="text-emerald-400"/> Copiado</> : <><Copy size={14} /> Copiar</>}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block">Chave de Transmissão (Stream Key)</label>
                <div className="flex items-center gap-2">
                  <input
                    type={copiedKey ? "text" : "password"}
                    value={streamKey}
                    onChange={(e) => setStreamKey(e.target.value)}
                    placeholder="••••••••••••••••••••"
                    className="flex-1 bg-[var(--bg)] px-3.5 py-2.5 rounded-lg text-xs text-amber-300 border border-white/10 focus:outline-none focus:border-purple-500 font-mono transition-colors"
                  />
                  <button 
                    type="button"
                    onClick={handleCopyKey}
                    disabled={!streamKey}
                    className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 border border-white/10 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 min-w-[100px] justify-center cursor-pointer"
                  >
                    {copiedKey ? <><CheckCircle2 size={14} className="text-emerald-400"/> Copiado</> : <><Copy size={14} /> Copiar</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Test Connection Row */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !url}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer disabled:opacity-50 ${
                    testResult === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                    testResult === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                    'bg-purple-600/10 border-purple-600/30 text-purple-300 hover:bg-purple-600/20'
                  }`}
                >
                  {isTesting ? <RefreshCw size={13} className="animate-spin" /> : <Activity size={13} />}
                  {isTesting ? 'Testando Servidor...' : 'Testar Conexão RTMP'}
                </button>
                
                <div className="text-xs">
                  {testResult === 'success' && (
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                      <CheckCircle2 size={13} /> {testDetails || 'Servidor respondendo e pronto!'}
                    </span>
                  )}
                  {testResult === 'error' && (
                    <span className="text-rose-400 flex items-center gap-1 font-semibold text-[11px]">
                      <AlertCircle size={13} /> {testDetails || 'Falha de conexão com o servidor.'}
                    </span>
                  )}
                  {testResult === 'idle' && !isTesting && (
                    <span className="text-[var(--ink-dim)] text-[11px]">Teste o endpoint antes de salvar (validação DNS e socket TCP)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 bg-[var(--bg)] flex items-center justify-between gap-3">
          <span className="text-xs text-[var(--ink-lo)] hidden sm:inline">
            Perfil ativo: <strong className="text-[var(--ink-hi)]">{profileName || activeProfile.name}</strong>
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-[var(--ink-hi)] rounded-lg font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="button"
              onClick={handleApplyAndClose}
              disabled={!url || !streamKey}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20 cursor-pointer"
            >
              <Save size={16} /> Salvar e Usar Perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
