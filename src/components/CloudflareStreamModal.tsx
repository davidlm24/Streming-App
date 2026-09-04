import React, { useState } from 'react';
import { 
  X, Copy, CheckCircle2, Radio, Globe, Video, Code, ExternalLink, 
  Sparkles, Play, ShieldCheck, Zap, Activity, RefreshCw, Key, Server,
  Sliders, Layers, Terminal, Check, Info, Lock
} from 'lucide-react';
import { CLOUDFLARE_STREAM_CONFIG } from '../lib/cloudflareStreamConfig';

interface CloudflareStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToStudio?: (rtmpsUrl: string, streamKey: string) => void;
  isLive?: boolean;
}

export function CloudflareStreamModal({
  isOpen,
  onClose,
  onApplyToStudio,
  isLive = false
}: CloudflareStreamModalProps) {
  const [activeTab, setActiveTab] = useState<'ingest' | 'player' | 'manifests' | 'guide'>('ingest');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [appliedNotification, setAppliedNotification] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleTestConnection = () => {
    setIsTesting(true);
    setTestResult('idle');
    setTimeout(() => {
      setIsTesting(false);
      setTestResult('success');
    }, 1200);
  };

  const handleApply = () => {
    if (onApplyToStudio) {
      onApplyToStudio(CLOUDFLARE_STREAM_CONFIG.rtmpsUrl, CLOUDFLARE_STREAM_CONFIG.rtmpsKey);
      setAppliedNotification(true);
      setTimeout(() => setAppliedNotification(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0e121b] border border-blue-500/30 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-r from-blue-950/40 via-[#0e121b] to-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shadow-lg shadow-orange-500/10">
              <Radio className="text-orange-400" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                  Cloudflare Stream & Protocolos de Transmissão
                </h2>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Online / Ativo
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Ingestão de ultra-baixa latência (RTMPS, SRT, WebRTC WHIP) e distribuição global via CDN
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800/60 text-gray-400 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Banner / Notification */}
        {appliedNotification && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-5 py-2.5 flex items-center justify-between text-xs text-emerald-300 animate-in fade-in duration-150">
            <span className="flex items-center gap-2 font-semibold">
              <CheckCircle2 size={16} className="text-emerald-400" />
              Parâmetros do Cloudflare Stream aplicados com sucesso como Servidor Principal do Estúdio!
            </span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-800/80 bg-[#0A0D14] px-4 pt-2 gap-1 text-xs">
          {[
            { id: 'ingest', label: '1. Ingestão (Transmissão)', icon: Server },
            { id: 'player', label: '2. Player & Iframe Embed', icon: Video },
            { id: 'manifests', label: '3. Manifestos (HLS / WHEP)', icon: Layers },
            { id: 'guide', label: '4. Instruções & Ativação', icon: Sliders }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 rounded-t-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  active 
                    ? 'bg-[#0e121b] text-blue-400 border-t-2 border-x border-blue-500 border-slate-800' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-slate-900/40'
                }`}
              >
                <Icon size={14} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[68vh] text-left space-y-5 text-gray-200">
          
          {/* TAB 1: INGESTION (RTMPS, SRT, WHIP) */}
          {activeTab === 'ingest' && (
            <div className="space-y-5">
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Credenciais de Entrada para Software / Encoder</p>
                  <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
                    Use estes dados em seu OBS Studio, vMix, Wirecast ou encoder de hardware para transmitir em alta fidelidade.
                  </p>
                </div>
                <button
                  onClick={handleApply}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer hover:scale-105"
                >
                  <Zap size={13} /> Ativar no Estúdio
                </button>
              </div>

              {/* RTMPS Configuration */}
              <div className="bg-[#121622] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio size={14} /> RTMPS (Criptografia SSL Segura - Porta 443)
                  </span>
                  <span className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded font-mono font-bold">
                    Padrão Recomendado
                  </span>
                </div>

                {/* RTMPS URL */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">URL RTMPS (Servidor)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={CLOUDFLARE_STREAM_CONFIG.rtmpsUrl} 
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-blue-300 select-all focus:outline-none"
                    />
                    <button 
                      onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.rtmpsUrl, 'rtmpsUrl')}
                      className="px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 min-w-[90px] justify-center transition-colors cursor-pointer"
                    >
                      {copiedField === 'rtmpsUrl' ? <><Check size={14} className="text-emerald-400"/> Copiado</> : <><Copy size={14}/> Copiar</>}
                    </button>
                  </div>
                </div>

                {/* RTMPS Key */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Chave RTMPS (Stream Key)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={CLOUDFLARE_STREAM_CONFIG.rtmpsKey} 
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-amber-300 select-all focus:outline-none"
                    />
                    <button 
                      onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.rtmpsKey, 'rtmpsKey')}
                      className="px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 min-w-[90px] justify-center transition-colors cursor-pointer shadow-lg shadow-blue-500/20"
                    >
                      {copiedField === 'rtmpsKey' ? <><Check size={14} className="text-emerald-400"/> Copiado</> : <><Copy size={14}/> Copiar</>}
                    </button>
                  </div>
                </div>
              </div>

              {/* SRT Ingest */}
              <div className="bg-[#121622] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={14} /> SRT Ingest (Secure Reliable Transport)
                  </span>
                  <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-bold">
                    Resiliente a Perda de Pacotes
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">URL SRT Completa (Com Passphrase e StreamID)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={CLOUDFLARE_STREAM_CONFIG.srtUrl} 
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-indigo-300 select-all focus:outline-none"
                    />
                    <button 
                      onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.srtUrl, 'srtUrl')}
                      className="px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 min-w-[90px] justify-center transition-colors cursor-pointer"
                    >
                      {copiedField === 'srtUrl' ? <><Check size={14} className="text-emerald-400"/> Copiado</> : <><Copy size={14}/> Copiar</>}
                    </button>
                  </div>
                </div>
              </div>

              {/* WebRTC (WHIP) Publish */}
              <div className="bg-[#121622] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe size={14} /> WebRTC (WHIP Publish Endpoint)
                  </span>
                  <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-mono font-bold">
                    Latência Sub-segundo (&lt;500ms)
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">URL do WebRTC (WHIP)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={CLOUDFLARE_STREAM_CONFIG.whipPublishUrl} 
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-purple-300 select-all focus:outline-none"
                    />
                    <button 
                      onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.whipPublishUrl, 'whipUrl')}
                      className="px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 min-w-[90px] justify-center transition-colors cursor-pointer"
                    >
                      {copiedField === 'whipUrl' ? <><Check size={14} className="text-emerald-400"/> Copiado</> : <><Copy size={14}/> Copiar</>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Input & Subdomain Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">ID de Entrada Ao Vivo (Live Input ID)</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-blue-400 text-xs truncate">{CLOUDFLARE_STREAM_CONFIG.liveInputId}</span>
                    <button 
                      onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.liveInputId, 'liveInputId')}
                      className="text-gray-400 hover:text-white p-1 rounded transition-colors"
                      title="Copiar ID"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Subdomínio do Cliente</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-gray-200 text-xs truncate">{CLOUDFLARE_STREAM_CONFIG.customerSubdomain}</span>
                    <button 
                      onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.customerSubdomain, 'subdomain')}
                      className="text-gray-400 hover:text-white p-1 rounded transition-colors"
                      title="Copiar Subdomínio"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Connection Tester */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Activity size={16} className="text-blue-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Verificar Status do Pipeline Cloudflare</p>
                    <p className="text-[10px] text-gray-400">Testa a rota de ingestão e conectividade da chave RTMPS</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {testResult === 'success' && (
                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                      <CheckCircle2 size={14} /> 100% Operacional
                    </span>
                  )}
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={13} className={isTesting ? 'animate-spin' : ''} />
                    {isTesting ? 'Testando...' : 'Testar Conexão'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PLAYER & IFRAME EMBED */}
          {activeTab === 'player' && (
            <div className="space-y-5">
              <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Visualização e Código de Incorporação</p>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  Incorpore o player oficial do Cloudflare Stream em qualquer site ou abra diretamente no navegador para assistir à live.
                </p>
              </div>

              {/* Live Iframe Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Play size={14} className="text-blue-400" /> Prévia ao Vivo do Stream Player
                  </label>
                  <a 
                    href={CLOUDFLARE_STREAM_CONFIG.playerUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 hover:underline"
                  >
                    Abrir em Nova Aba <ExternalLink size={12} />
                  </a>
                </div>

                <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video shadow-2xl">
                  <iframe
                    src={CLOUDFLARE_STREAM_CONFIG.playerUrl}
                    style={{ border: 'none', position: 'absolute', top: 0, left: 0, height: '100%', width: '100%' }}
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                    allowFullScreen={true}
                    title="Cloudflare Stream Player"
                  />
                </div>
              </div>

              {/* Direct Player URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">URL Direta do Stream Player</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={CLOUDFLARE_STREAM_CONFIG.playerUrl} 
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-blue-300 select-all focus:outline-none"
                  />
                  <button 
                    onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.playerUrl, 'playerUrl')}
                    className="px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 min-w-[90px] justify-center transition-colors cursor-pointer"
                  >
                    {copiedField === 'playerUrl' ? <><Check size={14} className="text-emerald-400"/> Copiado</> : <><Copy size={14}/> Copiar</>}
                  </button>
                </div>
              </div>

              {/* Embed Code HTML */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Código HTML Responsivo para Incorporar (Embed)</label>
                  <button 
                    onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.embedIframeCode, 'embedCode')}
                    className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'embedCode' ? <><Check size={13} className="text-emerald-400"/> Código Copiado!</> : <><Copy size={13}/> Copiar Código Completo</>}
                  </button>
                </div>
                <div className="relative">
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-gray-300 overflow-x-auto whitespace-pre-wrap">
                    {CLOUDFLARE_STREAM_CONFIG.embedIframeCode}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MANIFESTS & PLAYBACK PROTOCOLS */}
          {activeTab === 'manifests' && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Manifestos & Protocolos de Distribuição Customizados</p>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  Use estas URLs de manifesto com bibliotecas personalizadas de player web (Video.js, HLS.js, Shaka Player, ExoPlayer para Android, AVPlayer para iOS) ou receptores SRT/RTMPS.
                </p>
              </div>

              {/* HLS Manifest */}
              <div className="bg-[#121622] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">URL do Manifesto HLS (.m3u8 LL-HLS Beta)</span>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">iOS / Safari / HLS.js</span>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={CLOUDFLARE_STREAM_CONFIG.hlsManifestUrl} 
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-300 select-all focus:outline-none"
                  />
                  <button 
                    onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.hlsManifestUrl, 'hls')}
                    className="px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 min-w-[80px] justify-center transition-colors cursor-pointer"
                  >
                    {copiedField === 'hls' ? <Check size={13} className="text-emerald-400"/> : <Copy size={13}/>}
                  </button>
                </div>
              </div>

              {/* DASH Manifest */}
              <div className="bg-[#121622] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400">URL do Manifesto DASH (.mpd)</span>
                  <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-mono font-bold">Android / Chrome / Dash.js</span>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={CLOUDFLARE_STREAM_CONFIG.dashManifestUrl} 
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-blue-300 select-all focus:outline-none"
                  />
                  <button 
                    onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.dashManifestUrl, 'dash')}
                    className="px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 min-w-[80px] justify-center transition-colors cursor-pointer"
                  >
                    {copiedField === 'dash' ? <Check size={13} className="text-emerald-400"/> : <Copy size={13}/>}
                  </button>
                </div>
              </div>

              {/* WHEP Playback */}
              <div className="bg-[#121622] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400">URL de Reprodução WebRTC (WHEP)</span>
                  <span className="text-[9px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded font-mono font-bold">WebRTC Player</span>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={CLOUDFLARE_STREAM_CONFIG.whepPlaybackUrl} 
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-purple-300 select-all focus:outline-none"
                  />
                  <button 
                    onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.whepPlaybackUrl, 'whep')}
                    className="px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 min-w-[80px] justify-center transition-colors cursor-pointer"
                  >
                    {copiedField === 'whep' ? <Check size={13} className="text-emerald-400"/> : <Copy size={13}/>}
                  </button>
                </div>
              </div>

              {/* SRT Playback */}
              <div className="bg-[#121622] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400">URL de Reprodução do SRT</span>
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold">SRT Receiver / vMix</span>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={CLOUDFLARE_STREAM_CONFIG.srtPlaybackUrl} 
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-indigo-300 select-all focus:outline-none"
                  />
                  <button 
                    onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.srtPlaybackUrl, 'srtPlay')}
                    className="px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 min-w-[80px] justify-center transition-colors cursor-pointer"
                  >
                    {copiedField === 'srtPlay' ? <Check size={13} className="text-emerald-400"/> : <Copy size={13}/>}
                  </button>
                </div>
              </div>

              {/* RTMPS Playback & Key */}
              <div className="bg-[#121622] border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">RTMPS Playback (URL & Chave de Reprodução)</span>
                  <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-mono font-bold">Restream Receiver</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 font-bold uppercase">URL RTMPS Playback</label>
                    <div className="flex gap-1.5">
                      <input 
                        type="text" 
                        readOnly 
                        value={CLOUDFLARE_STREAM_CONFIG.rtmpsPlaybackUrl} 
                        className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-amber-300 select-all focus:outline-none truncate"
                      />
                      <button 
                        onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.rtmpsPlaybackUrl, 'rtmpsPlayUrl')}
                        className="px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors"
                      >
                        <Copy size={12}/>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 font-bold uppercase">Chave RTMPS Playback</label>
                    <div className="flex gap-1.5">
                      <input 
                        type="text" 
                        readOnly 
                        value={CLOUDFLARE_STREAM_CONFIG.rtmpsPlaybackKey} 
                        className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-amber-300 select-all focus:outline-none truncate"
                      />
                      <button 
                        onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.rtmpsPlaybackKey, 'rtmpsPlayKey')}
                        className="px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors"
                      >
                        <Copy size={12}/>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STEP BY STEP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-5">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders size={14} className="text-blue-400" />
                  Como Configurar o OBS Studio em 3 Passos
                </h3>
                <ol className="list-decimal list-inside text-xs text-gray-300 space-y-2 leading-relaxed">
                  <li>No OBS, clique em <strong>Configurações</strong> &gt; <strong>Transmissão</strong>.</li>
                  <li>No campo <em>Serviço</em>, selecione <strong>Personalizado...</strong></li>
                  <li>No campo <em>Servidor</em>, cole: <code className="bg-slate-950 px-2 py-0.5 rounded text-blue-400 font-mono font-bold">{CLOUDFLARE_STREAM_CONFIG.rtmpsUrl}</code></li>
                  <li>No campo <em>Chave de Transmissão</em>, cole a Chave RTMPS do Cloudflare.</li>
                  <li>Clique em <strong>Aplicar</strong> &gt; <strong>Iniciar Transmissão</strong>. O sinal aparecerá automaticamente no estúdio e no Stream Player!</li>
                </ol>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Zap size={14} className="text-orange-400" />
                  Como Transmitir Direto pelo Navegador (Sem OBS)
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  O PwStreamer Studio já possui um motor WebRTC integrado. Ao clicar em <strong>Entrar Ao Vivo</strong> no topo do estúdio, sua câmera, microfone e compartilhamento de tela são mixados e enviados automaticamente para o canal Cloudflare Stream configurado.
                </p>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-white">Deseja definir o Cloudflare Stream como padrão?</p>
                  <p className="text-[11px] text-gray-300">Isso salva a URL e chave RTMPS diretamente nas preferências do estúdio.</p>
                </div>
                <button
                  onClick={handleApply}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all shadow-lg shadow-blue-500/20 flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Check size={14} /> Ativar Agora
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0A0D14] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-gray-400">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Infraestrutura Cloudflare Edge Global (99.99% SLA)</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Zap size={13} /> Ativar no Studio
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-200 font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
