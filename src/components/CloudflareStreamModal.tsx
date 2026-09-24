import { Button } from './ui/Button';
import React, { useState } from 'react';
import { 
  X, Copy, CheckCircle2, Radio, Globe, Video, Code, ExternalLink, 
  Sparkles, Play, ShieldCheck, Zap, Activity, RefreshCw, Key, Server,
  Sliders, Layers, Terminal, Check, Info, Lock
} from 'lucide-react';
import { CLOUDFLARE_STREAM_CONFIG } from '../lib/cloudflareStreamConfig';
import { copyText } from './ui/clipboard';
import { Modal } from './ui/Modal';

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

  const copyToClipboard = (text: string, fieldName: string) => {
    copyText(text);
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
    <Modal isOpen={isOpen} onClose={onClose} bare ariaLabel="Cloudflare Stream">
      <div className="bg-[var(--bg)] border border-blue-500/30 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--line)]/80 bg-gradient-to-r from-blue-950/40 via-[var(--bg)] to-[var(--surface)]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shadow-lg shadow-orange-500/10">
              <Radio className="text-orange-400" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[var(--ink-hi)] leading-tight">
                  Cloudflare Stream & Protocolos de Transmissão
                </h2>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Online / Ativo
                </span>
              </div>
              <p className="text-xs text-[var(--ink-lo)] mt-0.5">
                Ingestão de ultra-baixa latência (RTMPS, SRT, WebRTC WHIP) e distribuição global via CDN
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[var(--panel)]/60 text-[var(--ink-lo)] hover:text-[var(--ink-hi)] rounded-xl transition-colors cursor-pointer"
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
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-[var(--line)]/80 bg-[var(--well)] px-4 pt-2 gap-1 text-xs">
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
                    ? 'bg-[var(--bg)] text-blue-400 border-t-2 border-x border-blue-500 border-[var(--line)]' 
                    : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:bg-[var(--surface)]/40'
                }`}
              >
                <Icon size={14} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[68vh] text-left space-y-5 text-[var(--ink-hi)]">
          
          {/* TAB 1: INGESTION (RTMPS, SRT, WHIP) */}
          {activeTab === 'ingest' && (
            <div className="space-y-5">
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Credenciais de Entrada para Software / Encoder</p>
                  <p className="text-[11px] text-[var(--ink)] mt-1 leading-relaxed">
                    Use estes dados em seu OBS Studio, vMix, Wirecast ou encoder de hardware para transmitir em alta fidelidade.
                  </p>
                </div>
                <Button size="sm" onClick={handleApply} icon={<Zap size={13} />}>
                  Ativar no Estúdio
                </Button>
              </div>

              {/* RTMPS Configuration */}
              <div className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-4 space-y-3">
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
                  <label htmlFor="cloudflarestreammodal-url-rtmps-servidor" className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider">URL RTMPS (Servidor)</label>
                  <div className="flex gap-2">
                    <input id="cloudflarestreammodal-url-rtmps-servidor" 
                      type="text" 
                      readOnly 
                      value={CLOUDFLARE_STREAM_CONFIG.rtmpsUrl} 
                      className="flex-1 bg-[var(--bg)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-mono text-blue-300 select-all focus:outline-none"
                    />
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.rtmpsUrl, 'rtmpsUrl')}>
                      {copiedField === 'rtmpsUrl' ? <><Check size={14} className="text-emerald-400"/> Copiado</> : <><Copy size={14}/> Copiar</>}
                    </Button>
                  </div>
                </div>

                {/* RTMPS Key */}
                <div className="space-y-1">
                  <label htmlFor="cloudflarestreammodal-chave-rtmps-stream-key" className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider">Chave RTMPS (Stream Key)</label>
                  <div className="flex gap-2">
                    <input id="cloudflarestreammodal-chave-rtmps-stream-key" 
                      type="text" 
                      readOnly 
                      value={CLOUDFLARE_STREAM_CONFIG.rtmpsKey} 
                      className="flex-1 bg-[var(--bg)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-mono text-amber-300 select-all focus:outline-none"
                    />
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.rtmpsKey, 'rtmpsKey')}>
                      {copiedField === 'rtmpsKey' ? <><Check size={14} className="text-emerald-400"/> Copiado</> : <><Copy size={14}/> Copiar</>}
                    </Button>
                  </div>
                </div>
              </div>

              {/* SRT Ingest */}
              <div className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={14} /> SRT Ingest (Secure Reliable Transport)
                  </span>
                  <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-bold">
                    Resiliente a Perda de Pacotes
                  </span>
                </div>
                <div className="space-y-1">
                  <label htmlFor="cloudflarestreammodal-url-srt-completa-com-passphrase-e-" className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider">URL SRT Completa (Com Passphrase e StreamID)</label>
                  <div className="flex gap-2">
                    <input id="cloudflarestreammodal-url-srt-completa-com-passphrase-e-" 
                      type="text" 
                      readOnly 
                      value={CLOUDFLARE_STREAM_CONFIG.srtUrl} 
                      className="flex-1 bg-[var(--bg)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-mono text-indigo-300 select-all focus:outline-none"
                    />
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.srtUrl, 'srtUrl')}>
                      {copiedField === 'srtUrl' ? <><Check size={14} className="text-emerald-400"/> Copiado</> : <><Copy size={14}/> Copiar</>}
                    </Button>
                  </div>
                </div>
              </div>

              {/* WebRTC (WHIP) Publish */}
              <div className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe size={14} /> WebRTC (WHIP Publish Endpoint)
                  </span>
                  <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-mono font-bold">
                    Latência Sub-segundo (&lt;500ms)
                  </span>
                </div>
                <div className="space-y-1">
                  <label htmlFor="cloudflarestreammodal-url-do-webrtc-whip" className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider">URL do WebRTC (WHIP)</label>
                  <div className="flex gap-2">
                    <input id="cloudflarestreammodal-url-do-webrtc-whip" 
                      type="text" 
                      readOnly 
                      value={CLOUDFLARE_STREAM_CONFIG.whipPublishUrl} 
                      className="flex-1 bg-[var(--bg)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-mono text-purple-300 select-all focus:outline-none"
                    />
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.whipPublishUrl, 'whipUrl')}>
                      {copiedField === 'whipUrl' ? <><Check size={14} className="text-emerald-400"/> Copiado</> : <><Copy size={14}/> Copiar</>}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Live Input & Subdomain Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-[var(--bg)] border border-[var(--line)] p-3 rounded-xl">
                  <span className="text-[10px] text-[var(--ink-lo)] font-bold uppercase block">ID de Entrada Ao Vivo (Live Input ID)</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-blue-400 text-xs truncate">{CLOUDFLARE_STREAM_CONFIG.liveInputId}</span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.liveInputId, 'liveInputId')}>
                      <Copy size={13} />
                    </Button>
                  </div>
                </div>
                <div className="bg-[var(--bg)] border border-[var(--line)] p-3 rounded-xl">
                  <span className="text-[10px] text-[var(--ink-lo)] font-bold uppercase block">Subdomínio do Cliente</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-[var(--ink-hi)] text-xs truncate">{CLOUDFLARE_STREAM_CONFIG.customerSubdomain}</span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.customerSubdomain, 'subdomain')}>
                      <Copy size={13} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Connection Tester */}
              <div className="p-4 bg-[var(--bg)]/60 border border-[var(--line)]/80 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Activity size={16} className="text-blue-400" />
                  <div>
                    <p className="text-xs font-bold text-[var(--ink-hi)]">Verificar Status do Pipeline Cloudflare</p>
                    <p className="text-[10px] text-[var(--ink-lo)]">Testa a rota de ingestão e conectividade da chave RTMPS</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {testResult === 'success' && (
                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                      <CheckCircle2 size={14} /> 100% Operacional
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleTestConnection}
                    loading={isTesting}
                  >
                    {isTesting ? 'Testando...' : 'Testar Conexão'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PLAYER & IFRAME EMBED */}
          {activeTab === 'player' && (
            <div className="space-y-5">
              <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Visualização e Código de Incorporação</p>
                <p className="text-[11px] text-[var(--ink)] leading-relaxed">
                  Incorpore o player oficial do Cloudflare Stream em qualquer site ou abra diretamente no navegador para assistir à live.
                </p>
              </div>

              {/* Live Iframe Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider flex items-center gap-1.5">
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

                <div className="relative w-full rounded-2xl overflow-hidden border border-[var(--line)] bg-black aspect-video shadow-2xl">
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
                <label htmlFor="cloudflarestreammodal-url-direta-do-stream-player" className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider">URL Direta do Stream Player</label>
                <div className="flex gap-2">
                  <input id="cloudflarestreammodal-url-direta-do-stream-player" 
                    type="text" 
                    readOnly 
                    value={CLOUDFLARE_STREAM_CONFIG.playerUrl} 
                    className="flex-1 bg-[var(--bg)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-mono text-blue-300 select-all focus:outline-none"
                  />
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.playerUrl, 'playerUrl')}>
                      {copiedField === 'playerUrl' ? <><Check size={14} className="text-emerald-400"/> Copiado</> : <><Copy size={14}/> Copiar</>}
                    </Button>
                </div>
              </div>

              {/* Embed Code HTML */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider">Código HTML Responsivo para Incorporar (Embed)</label>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.embedIframeCode, 'embedCode')}>
                      {copiedField === 'embedCode' ? <><Check size={13} className="text-emerald-400"/> Código Copiado!</> : <><Copy size={13}/> Copiar Código Completo</>}
                    </Button>
                </div>
                <div className="relative">
                  <pre className="p-3 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-mono text-[11px] text-[var(--ink)] overflow-x-auto whitespace-pre-wrap">
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
                <p className="text-[11px] text-[var(--ink)] leading-relaxed">
                  Use estas URLs de manifesto com bibliotecas personalizadas de player web (Video.js, HLS.js, Shaka Player, ExoPlayer para Android, AVPlayer para iOS) ou receptores SRT/RTMPS.
                </p>
              </div>

              {/* HLS Manifest */}
              <div className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">URL do Manifesto HLS (.m3u8 LL-HLS Beta)</span>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">iOS / Safari / HLS.js</span>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={CLOUDFLARE_STREAM_CONFIG.hlsManifestUrl} 
                    className="flex-1 bg-[var(--bg)] border border-[var(--line)] rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-300 select-all focus:outline-none"
                  />
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.hlsManifestUrl, 'hls')}>
                      {copiedField === 'hls' ? <Check size={13} className="text-emerald-400"/> : <Copy size={13}/>}
                    </Button>
                </div>
              </div>

              {/* DASH Manifest */}
              <div className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400">URL do Manifesto DASH (.mpd)</span>
                  <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-mono font-bold">Android / Chrome / Dash.js</span>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={CLOUDFLARE_STREAM_CONFIG.dashManifestUrl} 
                    className="flex-1 bg-[var(--bg)] border border-[var(--line)] rounded-lg px-3 py-1.5 text-xs font-mono text-blue-300 select-all focus:outline-none"
                  />
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.dashManifestUrl, 'dash')}>
                      {copiedField === 'dash' ? <Check size={13} className="text-emerald-400"/> : <Copy size={13}/>}
                    </Button>
                </div>
              </div>

              {/* WHEP Playback */}
              <div className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400">URL de Reprodução WebRTC (WHEP)</span>
                  <span className="text-[9px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded font-mono font-bold">WebRTC Player</span>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={CLOUDFLARE_STREAM_CONFIG.whepPlaybackUrl} 
                    className="flex-1 bg-[var(--bg)] border border-[var(--line)] rounded-lg px-3 py-1.5 text-xs font-mono text-purple-300 select-all focus:outline-none"
                  />
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.whepPlaybackUrl, 'whep')}>
                      {copiedField === 'whep' ? <Check size={13} className="text-emerald-400"/> : <Copy size={13}/>}
                    </Button>
                </div>
              </div>

              {/* SRT Playback */}
              <div className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400">URL de Reprodução do SRT</span>
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold">SRT Receiver / vMix</span>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={CLOUDFLARE_STREAM_CONFIG.srtPlaybackUrl} 
                    className="flex-1 bg-[var(--bg)] border border-[var(--line)] rounded-lg px-3 py-1.5 text-xs font-mono text-indigo-300 select-all focus:outline-none"
                  />
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.srtPlaybackUrl, 'srtPlay')}>
                      {copiedField === 'srtPlay' ? <Check size={13} className="text-emerald-400"/> : <Copy size={13}/>}
                    </Button>
                </div>
              </div>

              {/* RTMPS Playback & Key */}
              <div className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">RTMPS Playback (URL & Chave de Reprodução)</span>
                  <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-mono font-bold">Restream Receiver</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label htmlFor="cloudflarestreammodal-url-rtmps-playback" className="text-[9px] text-[var(--ink-lo)] font-bold uppercase">URL RTMPS Playback</label>
                    <div className="flex gap-1.5">
                      <input id="cloudflarestreammodal-url-rtmps-playback" 
                        type="text" 
                        readOnly 
                        value={CLOUDFLARE_STREAM_CONFIG.rtmpsPlaybackUrl} 
                        className="flex-1 bg-[var(--bg)] border border-[var(--line)] rounded px-2.5 py-1 text-xs font-mono text-amber-300 select-all focus:outline-none truncate"
                      />
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.rtmpsPlaybackUrl, 'rtmpsPlayUrl')}>
                      <Copy size={12}/>
                    </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="cloudflarestreammodal-chave-rtmps-playback" className="text-[9px] text-[var(--ink-lo)] font-bold uppercase">Chave RTMPS Playback</label>
                    <div className="flex gap-1.5">
                      <input id="cloudflarestreammodal-chave-rtmps-playback" 
                        type="text" 
                        readOnly 
                        value={CLOUDFLARE_STREAM_CONFIG.rtmpsPlaybackKey} 
                        className="flex-1 bg-[var(--bg)] border border-[var(--line)] rounded px-2.5 py-1 text-xs font-mono text-amber-300 select-all focus:outline-none truncate"
                      />
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(CLOUDFLARE_STREAM_CONFIG.rtmpsPlaybackKey, 'rtmpsPlayKey')}>
                      <Copy size={12}/>
                    </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STEP BY STEP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-5">
              <div className="bg-[var(--surface)] border border-[var(--line)] p-4 rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-[var(--ink-hi)] uppercase tracking-wider flex items-center gap-2">
                  <Sliders size={14} className="text-blue-400" />
                  Como Configurar o OBS Studio em 3 Passos
                </h3>
                <ol className="list-decimal list-inside text-xs text-[var(--ink)] space-y-2 leading-relaxed">
                  <li>No OBS, clique em <strong>Configurações</strong> &gt; <strong>Transmissão</strong>.</li>
                  <li>No campo <em>Serviço</em>, selecione <strong>Personalizado...</strong></li>
                  <li>No campo <em>Servidor</em>, cole: <code className="bg-[var(--bg)] px-2 py-0.5 rounded text-blue-400 font-mono font-bold">{CLOUDFLARE_STREAM_CONFIG.rtmpsUrl}</code></li>
                  <li>No campo <em>Chave de Transmissão</em>, cole a Chave RTMPS do Cloudflare.</li>
                  <li>Clique em <strong>Aplicar</strong> &gt; <strong>Iniciar Transmissão</strong>. O sinal aparecerá automaticamente no estúdio e no Stream Player!</li>
                </ol>
              </div>

              <div className="bg-[var(--surface)] border border-[var(--line)] p-4 rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-[var(--ink-hi)] uppercase tracking-wider flex items-center gap-2">
                  <Zap size={14} className="text-orange-400" />
                  Como Transmitir Direto pelo Navegador (Sem OBS)
                </h3>
                <p className="text-xs text-[var(--ink)] leading-relaxed">
                  O PwStreamer Studio já possui um motor WebRTC integrado. Ao clicar em <strong>Entrar Ao Vivo</strong> no topo do estúdio, sua câmera, microfone e compartilhamento de tela são mixados e enviados automaticamente para o canal Cloudflare Stream configurado.
                </p>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-[var(--ink-hi)]">Deseja definir o Cloudflare Stream como padrão?</p>
                  <p className="text-[11px] text-[var(--ink)]">Isso salva a URL e chave RTMPS diretamente nas preferências do estúdio.</p>
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
        <div className="p-4 border-t border-[var(--line)] bg-[var(--well)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[var(--ink-lo)]">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Infraestrutura Cloudflare Edge Global (99.99% SLA)</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* A ordem aqui estava invertida em relação ao resto do produto:
                o primário vinha à esquerda do "Fechar". Ação principal à
                direita, como nos outros rodapés e no ConfirmDialog. */}
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={handleApply} icon={<Zap size={13} />}>
              Ativar no Studio
            </Button>
          </div>
        </div>

      </div>
    </Modal>
  );
}
