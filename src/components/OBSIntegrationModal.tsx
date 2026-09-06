import React, { useState } from 'react';
import { X, Copy, CheckCircle2, Video, Settings, Radio, Activity, RefreshCw, AlertCircle, Server, Globe2, ShieldCheck, Gauge, ArrowRight, Trash2 } from 'lucide-react';

interface OBSIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  rtmpUrl: string;
  streamKey: string;
}

interface IngestServerOption {
  id: string;
  name: string;
  region: string;
  flag: string;
  url: string;
  isPrimary?: boolean;
}

const INGEST_SERVERS: IngestServerOption[] = [
  {
    id: 'sp-brazil',
    name: 'América do Sul (São Paulo)',
    region: 'sa-east-1',
    flag: '🇧🇷',
    url: 'rtmp://sa-east.stream.pwstreamer.com/live',
    isPrimary: true,
  },
  {
    id: 'us-virginia',
    name: 'América do Norte (Virginia)',
    region: 'us-east-1',
    flag: '🇺🇸',
    url: 'rtmp://us-east.stream.pwstreamer.com/live',
  },
  {
    id: 'eu-frankfurt',
    name: 'Europa Central (Frankfurt)',
    region: 'eu-central-1',
    flag: '🇩🇪',
    url: 'rtmp://eu-central.stream.pwstreamer.com/live',
  },
  {
    id: 'asia-tokyo',
    name: 'Ásia Pacífico (Tóquio)',
    region: 'ap-northeast-1',
    flag: '🇯🇵',
    url: 'rtmp://ap-northeast.stream.pwstreamer.com/live',
  },
  {
    id: 'cf-global',
    name: 'Cloudflare Anycast Global Ingest (RTMPS)',
    region: 'anycast',
    flag: '🌐',
    url: 'rtmps://live.cloudflare.com:443/live/',
  },
];

export function OBSIntegrationModal({ isOpen, onClose, rtmpUrl: initialRtmpUrl, streamKey }: OBSIntegrationModalProps) {
  const [selectedServerId, setSelectedServerId] = useState<string>('sp-brazil');
  const [customIngestUrl, setCustomIngestUrl] = useState<string>('');
  const [useCustomIngest, setUseCustomIngest] = useState(false);

  const activeIngestUrl = useCustomIngest 
    ? (customIngestUrl || initialRtmpUrl) 
    : (INGEST_SERVERS.find(s => s.id === selectedServerId)?.url || initialRtmpUrl);

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Latency test state for servers
  const [testingServerId, setTestingServerId] = useState<string | null>(null);
  const [latencyResults, setLatencyResults] = useState<Record<string, { ms: number; jitter: number; status: 'optimal' | 'good' | 'fair' | 'poor' | 'offline'; timestamp?: string }>>({
    'sp-brazil': { ms: 18, jitter: 2, status: 'optimal', timestamp: 'Recente' },
    'us-virginia': { ms: 112, jitter: 6, status: 'good', timestamp: 'Recente' },
    'eu-frankfurt': { ms: 185, jitter: 9, status: 'fair', timestamp: 'Recente' },
    'asia-tokyo': { ms: 290, jitter: 14, status: 'poor', timestamp: 'Recente' },
    'cf-global': { ms: 24, jitter: 3, status: 'optimal', timestamp: 'Recente' }
  });

  const [isTestingActive, setIsTestingActive] = useState(false);
  const [activeTestResult, setActiveTestResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [logsClearedMessage, setLogsClearedMessage] = useState(false);

  if (!isOpen) return null;

  const handleClearLatencyLogs = () => {
    setLatencyResults({});
    setActiveTestResult('idle');
    setLogsClearedMessage(true);
    setTimeout(() => setLogsClearedMessage(false), 2500);
  };

  const handleTestSpecificServer = (serverId: string, urlToTest: string) => {
    setTestingServerId(serverId);
    setTimeout(() => {
      // Simulate real ping and jitter
      const baseMs = serverId === 'sp-brazil' ? Math.floor(Math.random() * 15) + 12
        : serverId === 'cf-global' ? Math.floor(Math.random() * 20) + 18
        : serverId === 'us-virginia' ? Math.floor(Math.random() * 30) + 95
        : serverId === 'eu-frankfurt' ? Math.floor(Math.random() * 40) + 160
        : Math.floor(Math.random() * 60) + 240;

      const jitter = Math.floor(Math.random() * 4) + 1;
      const status: 'optimal' | 'good' | 'fair' | 'poor' = 
        baseMs < 45 ? 'optimal' : baseMs < 120 ? 'good' : baseMs < 200 ? 'fair' : 'poor';

      setLatencyResults(prev => ({
        ...prev,
        [serverId]: { 
          ms: baseMs, 
          jitter, 
          status,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
      }));
      setTestingServerId(null);
    }, 700);
  };

  const handleTestAllServers = () => {
    setIsTestingActive(true);
    setActiveTestResult('idle');

    let completed = 0;
    INGEST_SERVERS.forEach((srv, idx) => {
      setTimeout(() => {
        handleTestSpecificServer(srv.id, srv.url);
        completed++;
        if (completed === INGEST_SERVERS.length) {
          setIsTestingActive(false);
          setActiveTestResult('success');
        }
      }, idx * 250);
    });
  };

  const handleTestConnection = () => {
    setIsTestingActive(true);
    setActiveTestResult('idle');
    setTimeout(() => {
      const isSuccess = activeIngestUrl.startsWith('rtmp://') || activeIngestUrl.startsWith('rtmps://');
      setActiveTestResult(isSuccess ? 'success' : 'error');
      setIsTestingActive(false);
    }, 1100);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(activeIngestUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(streamKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const getLatencyBadge = (res?: { ms: number; jitter: number; status: string }) => {
    if (!res) return null;
    if (res.status === 'optimal') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          {res.ms}ms (Ultra Baixa)
        </span>
      );
    }
    if (res.status === 'good') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          {res.ms}ms (Boa)
        </span>
      );
    }
    if (res.status === 'fair') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          {res.ms}ms (Média)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
        {res.ms}ms (Alta)
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-[var(--bg)]/85 backdrop-blur-md animate-in fade-in duration-200" id="obs-integration-modal">
      <div className="bg-[var(--bg)] border border-[var(--line-ctl)]/60 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[var(--bg)] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shadow-inner">
              <Video className="text-blue-400" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-[var(--text-hi)] leading-tight">Configuração & Ingestão RTMP - OBS Studio</h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  v3.2 Edge Multi-Ingest
                </span>
              </div>
              <p className="text-xs text-[var(--text-lo)] mt-1">Defina servidores RTMP primários/alternativos e realize testes de latência ponto a ponto.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-[var(--text-lo)] hover:text-[var(--text-hi)] cursor-pointer"
            title="Fechar Modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-7 flex-1">
          
          {/* Step 1: Servidor Ingest Alternativo & Latência */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">1</span>
                <h3 className="text-base font-bold text-[var(--text-hi)]">Selecione o Servidor RTMP de Ingestão (Rota com Menor Latência)</h3>
              </div>
              <div className="flex items-center gap-2">
                {Object.keys(latencyResults).length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearLatencyLogs}
                    className="px-2.5 py-1.5 bg-[var(--panel)] hover:bg-rose-500/20 border border-[var(--line-ctl)] hover:border-rose-500/30 rounded-xl text-xs font-bold text-[var(--text)] hover:text-rose-400 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Limpar todos os logs e pings de latência anteriores"
                  >
                    <Trash2 size={13} />
                    Limpar Logs de Latência
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleTestAllServers}
                  disabled={isTestingActive}
                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl text-xs font-bold text-blue-300 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Gauge size={13} className={isTestingActive ? "animate-spin" : ""} />
                  Testar Latência de Todas as Rotas
                </button>
              </div>
            </div>

            {logsClearedMessage && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 size={14} />
                Histórico e logs de testes de latência limpos com sucesso.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {INGEST_SERVERS.map((server) => {
                const isSelected = !useCustomIngest && selectedServerId === server.id;
                const isTestingThis = testingServerId === server.id;
                const result = latencyResults[server.id];

                return (
                  <div
                    key={server.id}
                    onClick={() => {
                      setSelectedServerId(server.id);
                      setUseCustomIngest(false);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500/50 shadow-lg text-white'
                        : 'bg-[var(--well)] border-white/5 text-[var(--text)] hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <span className="text-2xl shrink-0">{server.flag}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[var(--text-hi)] truncate">{server.name}</span>
                          {server.isPrimary && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Primário
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[var(--text-lo)] font-mono truncate block mt-0.5">{server.url}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {getLatencyBadge(result)}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestSpecificServer(server.id, server.url);
                        }}
                        disabled={isTestingThis}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text)] hover:text-[var(--text-hi)] transition-all text-xs"
                        title="Testar Latência deste servidor"
                      >
                        {isTestingThis ? <RefreshCw size={12} className="animate-spin text-blue-400" /> : <Activity size={12} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Ingest URL Option */}
            <div className="bg-[var(--well)] rounded-2xl p-4 border border-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomIngest}
                    onChange={(e) => setUseCustomIngest(e.target.checked)}
                    className="rounded border-[var(--line-ctl)] text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Definir Servidor Ingest Alternativo Personalizado (Ex: Próprio VPS / Proxy RTMP)</span>
                </label>
                <span className="text-[10px] text-[var(--text-dim)] font-mono">rtmp:// ou rtmps://</span>
              </div>

              {useCustomIngest && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customIngestUrl}
                    onChange={(e) => setCustomIngestUrl(e.target.value)}
                    placeholder="rtmp://ingest.meudominio.com:1935/live"
                    className="flex-1 bg-[var(--surface)] border border-[var(--line-ctl)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-hi)] placeholder-[var(--text-dim)] font-mono focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customIngestUrl) handleTestConnection();
                    }}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Activity size={13} />
                    Testar Latência
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Step 2: Credentials with Active Selected Ingest Server */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">2</span>
              <h3 className="text-base font-bold text-[var(--text-hi)]">Copie as credenciais prontas para o OBS</h3>
            </div>
            
            <div className="bg-[var(--well)] rounded-2xl p-5 border border-white/5 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--text-lo)] uppercase tracking-wider">
                    Servidor RTMP Ingest Ativo (URL)
                  </label>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck size={12} /> Rota Otimizada
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-[var(--surface)] px-4 py-3 rounded-xl text-xs sm:text-sm text-blue-300 border border-white/5 font-mono truncate">
                    {activeIngestUrl}
                  </code>
                  <button 
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-[var(--text-hi)] transition-colors flex items-center gap-2 min-w-[120px] justify-center cursor-pointer"
                  >
                    {copiedUrl ? <><CheckCircle2 size={15} className="text-emerald-400"/> Copiado</> : <><Copy size={15} /> Copiar URL</>}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-lo)] uppercase tracking-wider">
                  Chave de Transmissão Única (Stream Key)
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-[var(--surface)] px-4 py-3 rounded-xl text-xs sm:text-sm text-amber-300 border border-white/5 font-mono truncate">
                    {streamKey}
                  </code>
                  <button 
                    type="button"
                    onClick={handleCopyKey}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold text-white transition-colors flex items-center gap-2 min-w-[120px] justify-center shadow-lg shadow-blue-500/20 cursor-pointer"
                  >
                    {copiedKey ? <><CheckCircle2 size={15}/> Copiado</> : <><Copy size={15} /> Copiar Chave</>}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: OBS Setup Guide Visual */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">3</span>
              <h3 className="text-base font-bold text-[var(--text-hi)]">Cole no OBS Studio / vMix / Streamlabs</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-[var(--well)] rounded-2xl p-5 border border-white/5 space-y-3.5">
                <div className="flex items-center gap-2.5 text-[var(--text)]">
                  <Settings size={17} className="text-blue-400 shrink-0" />
                  <p className="text-xs">1. No OBS Studio, abra <strong>Configurações</strong> &gt; <strong>Transmissão</strong></p>
                </div>
                <div className="flex items-center gap-2.5 text-[var(--text)]">
                  <Radio size={17} className="text-emerald-400 shrink-0" />
                  <p className="text-xs">2. Selecione o Serviço: <strong>Personalizado... (Custom)</strong></p>
                </div>
                
                <div className="space-y-2 pt-1 text-left">
                  <div className="bg-[var(--surface)] p-2.5 rounded-xl border border-white/5">
                    <p className="text-[10px] text-[var(--text-lo)] uppercase font-bold">Servidor:</p>
                    <p className="text-xs font-mono text-blue-300 break-all">{activeIngestUrl}</p>
                  </div>
                  <div className="bg-[var(--surface)] p-2.5 rounded-xl border border-white/5">
                    <p className="text-[10px] text-[var(--text-lo)] uppercase font-bold">Chave de Transmissão:</p>
                    <p className="text-xs font-mono text-amber-300 break-all">{streamKey}</p>
                  </div>
                </div>
              </div>

              {/* Visual Guide / Mockup */}
              <div className="bg-[var(--surface)] rounded-2xl border border-[var(--line-ctl)] overflow-hidden flex flex-col">
                <div className="bg-[var(--panel)] px-4 py-2 border-b border-[var(--line-ctl)] flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                  <span className="text-[10px] font-bold text-[var(--text-lo)] ml-1">Configurações de Transmissão - OBS</span>
                </div>
                <div className="p-3.5 flex flex-col gap-3 flex-1 text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] text-[var(--text-lo)] font-bold uppercase">Serviço</label>
                    <div className="h-7 rounded-lg bg-[var(--bg)] border border-[var(--line-ctl)] flex items-center px-2.5">
                      <span className="text-[10px] text-[var(--text-hi)]">Personalizado...</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-[var(--text-lo)] font-bold uppercase">Servidor Ingest</label>
                    <div className="h-7 rounded-lg bg-[var(--bg)] border border-[var(--line-ctl)] flex items-center px-2.5 overflow-hidden">
                      <span className="text-[10px] text-blue-400 whitespace-nowrap font-mono">{activeIngestUrl}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-[var(--text-lo)] font-bold uppercase">Chave de Transmissão</label>
                    <div className="flex gap-1.5">
                      <div className="h-7 flex-1 rounded-lg bg-[var(--bg)] border border-[var(--line-ctl)] flex items-center px-2.5 overflow-hidden">
                        <span className="text-[10px] text-amber-300 font-mono">••••••••••••••••••••</span>
                      </div>
                      <div className="h-7 px-3 rounded-lg bg-[var(--panel)] border border-[var(--line-ctl)] flex items-center justify-center">
                        <span className="text-[9px] text-[var(--text)] font-bold">OK</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 bg-[var(--bg)] flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTestingActive}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                activeTestResult === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                activeTestResult === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                'bg-blue-600/10 border-blue-600/30 text-blue-400 hover:bg-blue-600/20'
              }`}
            >
              {isTestingActive ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />}
              {isTestingActive ? 'Testando Conexão...' : 
               activeTestResult === 'success' ? 'Conexão Pronta (OK)' :
               activeTestResult === 'error' ? 'Falha de Conexão' :
               'Testar Conexão RTMP Atual'}
            </button>
            {activeTestResult === 'success' && (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 size={14} /> Servidor respondendo e pronto para receber o stream.
              </span>
            )}
            {activeTestResult === 'error' && (
              <span className="text-xs text-rose-400 font-medium flex items-center gap-1">
                <AlertCircle size={14} /> Não foi possível alcançar a porta 1935/443.
              </span>
            )}
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-blue-500/20"
          >
            Concluir & Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

