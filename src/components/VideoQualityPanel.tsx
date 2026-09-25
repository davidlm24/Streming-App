import React, { useState, useEffect } from 'react';
import { 
  Video, Sliders, Zap, Check, Crown, Wifi, Cpu, Gauge, 
  Sparkles, Save, Info, RefreshCw, AlertTriangle, ArrowUpRight
} from 'lucide-react';

export type ResolutionOption = '720p' | '1080p' | '4k';
export type EncoderOption = 'h264' | 'hevc' | 'av1';
export type AudioBitrateOption = '128' | '192' | '320';

export interface VideoQualityConfig {
  resolution: ResolutionOption;
  fps: 30 | 60;
  bitrateKbps: number; // e.g. 6000
  encoder: EncoderOption;
  audioBitrateKbps: AudioBitrateOption;
  keyframeInterval: number; // in seconds, default 2
  autoOptimizeForPlan: boolean;
}

interface VideoQualityPanelProps {
  userPlan?: 'Standard' | 'Professional' | 'Business' | 'Free Trial';
  onNavigateToBilling?: () => void;
  onSaveConfig?: (config: VideoQualityConfig) => void;
}

const PLAN_LIMITS = {
  'Free Trial': { maxRes: '720p' as ResolutionOption, maxBitrate: 4500, maxFps: 30, label: 'Free Trial (720p Max)' },
  'Standard': { maxRes: '1080p' as ResolutionOption, maxBitrate: 8000, maxFps: 60, label: 'Plano Standard (1080p 60fps)' },
  'Professional': { maxRes: '4k' as ResolutionOption, maxBitrate: 18000, maxFps: 60, label: 'Plano Professional (4K 60fps)' },
  'Business': { maxRes: '4k' as ResolutionOption, maxBitrate: 35000, maxFps: 60, label: 'Plano Business (4K Unconstrained)' },
};

const DEFAULT_CONFIGS: Record<ResolutionOption, { defaultBitrate: number; minBitrate: number; maxBitrate: number; recommendedUpload: string }> = {
  '720p': { defaultBitrate: 3500, minBitrate: 1500, maxBitrate: 5000, recommendedUpload: '8 Mbps' },
  '1080p': { defaultBitrate: 6000, minBitrate: 3500, maxBitrate: 12000, recommendedUpload: '15 Mbps' },
  '4k': { defaultBitrate: 20000, minBitrate: 12000, maxBitrate: 35000, recommendedUpload: '40 Mbps' },
};

export function VideoQualityPanel({ 
  userPlan = 'Standard', 
  onNavigateToBilling,
  onSaveConfig 
}: VideoQualityPanelProps) {
  const planInfo = PLAN_LIMITS[userPlan] || PLAN_LIMITS['Standard'];

  const [config, setConfig] = useState<VideoQualityConfig>(() => {
    const saved = localStorage.getItem('pwstream_video_quality_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      resolution: '1080p',
      fps: 60,
      bitrateKbps: 6000,
      encoder: 'h264',
      audioBitrateKbps: '192',
      keyframeInterval: 2,
      autoOptimizeForPlan: true
    };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activePreset, setActivePreset] = useState<'eco' | 'balanced' | 'ultra' | 'custom'>('balanced');

  useEffect(() => {
    localStorage.setItem('pwstream_video_quality_config', JSON.stringify(config));
  }, [config]);

  const handleResolutionChange = (res: ResolutionOption) => {
    const defaultBitrate = DEFAULT_CONFIGS[res].defaultBitrate;
    // Cap bitrate to plan limit if needed
    const safeBitrate = Math.min(defaultBitrate, planInfo.maxBitrate);
    const newFps = (res === '720p' && userPlan === 'Free Trial') ? 30 : config.fps;

    setConfig(prev => ({
      ...prev,
      resolution: res,
      bitrateKbps: safeBitrate,
      fps: newFps
    }));
    setActivePreset('balanced');
  };

  const handleOptimizeForPlan = () => {
    let optimalRes: ResolutionOption = '1080p';
    let optimalBitrate = 6000;
    let optimalFps: 30 | 60 = 60;

    if (userPlan === 'Free Trial') {
      optimalRes = '720p';
      optimalBitrate = 3500;
      optimalFps = 30;
    } else if (userPlan === 'Standard') {
      optimalRes = '1080p';
      optimalBitrate = 6000;
      optimalFps = 60;
    } else if (userPlan === 'Professional') {
      optimalRes = '1080p';
      optimalBitrate = 9000;
      optimalFps = 60;
    } else if (userPlan === 'Business') {
      optimalRes = '4k';
      optimalBitrate = 20000;
      optimalFps = 60;
    }

    setConfig({
      resolution: optimalRes,
      fps: optimalFps,
      bitrateKbps: optimalBitrate,
      encoder: 'h264',
      audioBitrateKbps: '192',
      keyframeInterval: 2,
      autoOptimizeForPlan: true
    });
    setActivePreset('balanced');
    triggerSavedFeedback();
  };

  const applyPreset = (preset: 'eco' | 'balanced' | 'ultra') => {
    setActivePreset(preset);
    const currentResLimits = DEFAULT_CONFIGS[config.resolution];
    
    let targetBitrate = currentResLimits.defaultBitrate;
    let targetFps: 30 | 60 = config.fps;

    if (preset === 'eco') {
      targetBitrate = currentResLimits.minBitrate;
      targetFps = 30;
    } else if (preset === 'balanced') {
      targetBitrate = currentResLimits.defaultBitrate;
      targetFps = config.resolution === '720p' ? 30 : 60;
    } else if (preset === 'ultra') {
      targetBitrate = Math.min(currentResLimits.maxBitrate, planInfo.maxBitrate);
      targetFps = 60;
    }

    setConfig(prev => ({
      ...prev,
      bitrateKbps: targetBitrate,
      fps: targetFps
    }));
  };

  const triggerSavedFeedback = () => {
    setSavedSuccess(true);
    if (onSaveConfig) {
      onSaveConfig(config);
    }
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  // Check if resolution exceeds current user plan
  const is4kUnsupported = config.resolution === '4k' && (userPlan === 'Free Trial' || userPlan === 'Standard');
  const is1080pUnsupported = config.resolution === '1080p' && userPlan === 'Free Trial';

  const requiredUploadMbps = ((config.bitrateKbps + parseInt(config.audioBitrateKbps)) * 1.3 / 1000).toFixed(1);

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl overflow-hidden shadow-xl text-left">
      {/* Header */}
      <div className="p-5 border-b border-[var(--line)] bg-[var(--bg)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Gauge size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--ink-hi)] flex items-center gap-2">
              Controle de Qualidade de Vídeo & Bitrate
            </h2>
            <p className="text-xs text-[var(--ink-lo)]">Ajuste resolução, bitrate e encoders otimizados para seu plano de transmissão.</p>
          </div>
        </div>

        {/* Current Plan Badge & Optimization CTA */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--line)] text-xs flex items-center gap-2">
            <Crown size={14} className="text-amber-400" />
            <span className="text-[var(--ink)] font-semibold">{userPlan}</span>
            <span className="text-[10px] text-[var(--ink-dim)] font-mono">({planInfo.maxRes.toUpperCase()} Max)</span>
          </div>

          <button
            type="button"
            onClick={handleOptimizeForPlan}
            className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Ajustar automaticamente bitrate e resolução recomendados para o seu plano contratado"
          >
            <Sparkles size={13} className="animate-pulse" />
            <span>Otimizar pro Plano</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Warning if selected resolution exceeds plan limits */}
        {(is4kUnsupported || is1080pUnsupported) && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-xs text-amber-200">
            <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-bold text-amber-300">
                A resolução {config.resolution.toUpperCase()} é limitada no seu plano atual ({userPlan}).
              </p>
              <p className="text-amber-200/80">
                Transmissões em {config.resolution.toUpperCase()} exigem mais largura de banda e capacidade de servidores de transcodificação.
                Faça o upgrade do plano para desbloquear suporte completo a 4K e bitrates ilimitados sem marca d'água.
              </p>
            </div>
            {onNavigateToBilling && (
              <button
                type="button"
                onClick={onNavigateToBilling}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-lg transition-all shrink-0 flex items-center gap-1 cursor-pointer"
              >
                Fazer Upgrade <ArrowUpRight size={13} />
              </button>
            )}
          </div>
        )}

        {/* 1. Resolution Selection */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-lo)] flex items-center justify-between">
            <span>Resolução da Transmissão</span>
            <span className="text-[11px] font-normal text-blue-400 font-mono">
              Ativo: {config.resolution.toUpperCase()} @ {config.fps} FPS
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 720p Option */}
            <button
              type="button"
              onClick={() => handleResolutionChange('720p')}
              className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer ${
                config.resolution === '720p'
                  ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/20'
                  : 'bg-[var(--bg)] border-[var(--line)] hover:border-[var(--line-ctl)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-[var(--ink-hi)]">720p HD</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--panel)] text-[var(--ink)]">
                  1280x720
                </span>
              </div>
              <p className="text-[11px] text-[var(--ink-lo)] mt-2">Bitrate: 1.5 - 5 Mbps</p>
              <div className="mt-3 flex items-center justify-between text-[10px]">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Check size={12} /> Compatível com todos os planos
                </span>
                <span className="text-[var(--ink-dim)] font-mono">30 FPS</span>
              </div>
            </button>

            {/* 1080p Option */}
            <button
              type="button"
              onClick={() => handleResolutionChange('1080p')}
              className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer ${
                config.resolution === '1080p'
                  ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/20'
                  : 'bg-[var(--bg)] border-[var(--line)] hover:border-[var(--line-ctl)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-[var(--ink-hi)]">1080p Full HD</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Recomendado
                </span>
              </div>
              <p className="text-[11px] text-[var(--ink-lo)] mt-2">Bitrate: 3.5 - 12 Mbps</p>
              <div className="mt-3 flex items-center justify-between text-[10px]">
                {userPlan === 'Free Trial' ? (
                  <span className="text-amber-400 font-semibold">Standard+</span>
                ) : (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Check size={12} /> Liberado no seu plano
                  </span>
                )}
                <span className="text-[var(--ink-lo)] font-mono">60 FPS</span>
              </div>
            </button>

            {/* 4K Option */}
            <button
              type="button"
              onClick={() => handleResolutionChange('4k')}
              className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer ${
                config.resolution === '4k'
                  ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/20'
                  : 'bg-[var(--bg)] border-[var(--line)] hover:border-[var(--line-ctl)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-[var(--ink-hi)]">4K Ultra HD</span>
                  <Crown size={12} className="text-amber-400" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Pro & Business
                </span>
              </div>
              <p className="text-[11px] text-[var(--ink-lo)] mt-2">Bitrate: 12 - 35 Mbps</p>
              <div className="mt-3 flex items-center justify-between text-[10px]">
                {(userPlan === 'Professional' || userPlan === 'Business') ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Check size={12} /> Liberado no seu plano
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold">Requer Upgrade Pro</span>
                )}
                <span className="text-[var(--ink-lo)] font-mono">60 FPS HDR</span>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Bitrate Control Slider & Presets */}
        <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label htmlFor="videoqualitypanel-bitrate-de-video" className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
                <Sliders size={14} className="text-blue-400" /> Bitrate de Vídeo (Taxa de Transmissão)
              </label>
              <p className="text-[11px] text-[var(--ink-lo)] mt-0.5">
                Valores maiores entregam imagem mais nítida, porém requerem conexões de internet mais rápidas.
              </p>
            </div>

            <div className="text-right">
              <span className="text-xl font-black text-[var(--ink-hi)] font-mono">
                {(config.bitrateKbps / 1000).toFixed(1)} <span className="text-xs text-blue-400 font-normal">Mbps</span>
              </span>
              <p className="text-[10px] text-[var(--ink-dim)] font-mono">{config.bitrateKbps} Kbps</p>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-1">
            <input id="videoqualitypanel-bitrate-de-video"
              type="range"
              min={DEFAULT_CONFIGS[config.resolution].minBitrate}
              max={DEFAULT_CONFIGS[config.resolution].maxBitrate}
              step={250}
              value={config.bitrateKbps}
              onChange={(e) => {
                setConfig(prev => ({ ...prev, bitrateKbps: parseInt(e.target.value) }));
                setActivePreset('custom');
              }}
              className="w-full accent-blue-500 h-2 bg-[var(--panel)] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--ink-dim)] font-mono">
              <span>Mínimo: {DEFAULT_CONFIGS[config.resolution].minBitrate / 1000} Mbps</span>
              <span>Recomendado: {DEFAULT_CONFIGS[config.resolution].defaultBitrate / 1000} Mbps</span>
              <span>Máximo: {DEFAULT_CONFIGS[config.resolution].maxBitrate / 1000} Mbps</span>
            </div>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--line)]/80">
            <span className="text-[11px] font-semibold text-[var(--ink-lo)]">Presets Rápido:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => applyPreset('eco')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  activePreset === 'eco'
                    ? 'bg-blue-500 text-white'
                    : 'bg-[var(--panel)] text-[var(--ink)] hover:bg-[var(--raise)]'
                }`}
              >
                Economia de Banda (Low Latency)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('balanced')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  activePreset === 'balanced'
                    ? 'bg-blue-500 text-white'
                    : 'bg-[var(--panel)] text-[var(--ink)] hover:bg-[var(--raise)]'
                }`}
              >
                Equilibrado (Padrão)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('ultra')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  activePreset === 'ultra'
                    ? 'bg-blue-500 text-white'
                    : 'bg-[var(--panel)] text-[var(--ink)] hover:bg-[var(--raise)]'
                }`}
              >
                Ultra Qualidade (Máxima)
              </button>
            </div>
          </div>
        </div>

        {/* 3. Advanced Parameters (FPS, Codec, Audio Bitrate, Keyframes) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Frame Rate */}
          <div className="space-y-1.5">
            <label htmlFor="videoqualitypanel-taxa-de-quadros-fps" className="text-[11px] font-bold text-[var(--ink-lo)] uppercase tracking-wider flex items-center gap-1">
              <Cpu size={12} className="text-blue-400" /> Taxa de Quadros (FPS)
            </label>
            <select id="videoqualitypanel-taxa-de-quadros-fps"
              value={config.fps}
              onChange={(e) => setConfig(prev => ({ ...prev, fps: parseInt(e.target.value) as 30 | 60 }))}
              className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs text-[var(--ink-hi)] font-semibold focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value={30}>30 FPS (Padrão Suave)</option>
              <option value={60}>60 FPS (Ultra Fluidez / Games)</option>
            </select>
          </div>

          {/* Encoder Codec */}
          <div className="space-y-1.5">
            <label htmlFor="videoqualitypanel-encoder-de-video" className="text-[11px] font-bold text-[var(--ink-lo)] uppercase tracking-wider flex items-center gap-1">
              <Video size={12} className="text-indigo-400" /> Encoder de Vídeo
            </label>
            <select id="videoqualitypanel-encoder-de-video"
              value={config.encoder}
              onChange={(e) => setConfig(prev => ({ ...prev, encoder: e.target.value as EncoderOption }))}
              className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs text-[var(--ink-hi)] font-semibold focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="h264">H.264 (AVC - Maior Compatibilidade)</option>
              <option value="hevc">HEVC (H.265 - Alta Eficiência)</option>
              <option value="av1">AV1 (Next-Gen / Ultra Compressão)</option>
            </select>
          </div>

          {/* Audio Bitrate */}
          <div className="space-y-1.5">
            <label htmlFor="videoqualitypanel-qualidade-de-audio" className="text-[11px] font-bold text-[var(--ink-lo)] uppercase tracking-wider flex items-center gap-1">
              <Wifi size={12} className="text-emerald-400" /> Qualidade de Áudio
            </label>
            <select id="videoqualitypanel-qualidade-de-audio"
              value={config.audioBitrateKbps}
              onChange={(e) => setConfig(prev => ({ ...prev, audioBitrateKbps: e.target.value as AudioBitrateOption }))}
              className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs text-[var(--ink-hi)] font-semibold focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="128">128 kbps (AAC Padrão)</option>
              <option value="192">192 kbps (AAC Alta Fidelidade)</option>
              <option value="320">320 kbps (Estúdio / Músicos)</option>
            </select>
          </div>

          {/* Keyframe Interval */}
          <div className="space-y-1.5">
            <label htmlFor="videoqualitypanel-keyframe-interval" className="text-[11px] font-bold text-[var(--ink-lo)] uppercase tracking-wider flex items-center gap-1">
              <RefreshCw size={12} className="text-amber-400" /> Keyframe Interval
            </label>
            <select id="videoqualitypanel-keyframe-interval"
              value={config.keyframeInterval}
              onChange={(e) => setConfig(prev => ({ ...prev, keyframeInterval: parseInt(e.target.value) }))}
              className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs text-[var(--ink-hi)] font-semibold focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value={1}>1 segundo (Baixíssima latência)</option>
              <option value={2}>2 segundos (Recomendado YouTube/Twitch)</option>
              <option value={4}>4 segundos (Transmissão de baixo custo)</option>
            </select>
          </div>
        </div>

        {/* 4. Bandwidth Requirements & Footer Actions */}
        <div className="pt-4 border-t border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-[var(--ink-lo)]">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Wifi size={16} />
            </div>
            <div>
              <p className="font-semibold text-[var(--ink-hi)]">
                Upload Mínimo de Internet Recomendado: <span className="text-emerald-400 font-mono font-bold">{requiredUploadMbps} Mbps</span>
              </p>
              <p className="text-[10px] text-[var(--ink-dim)]">Calculado com margem de segurança de 30% contra oscilações de rede.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in duration-150">
                <Check size={14} /> Configurações Aplicadas!
              </span>
            )}

            <button
              type="button"
              onClick={triggerSavedFeedback}
              className="px-6 py-2.5 bg-[var(--color-brand-deep)] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
            >
              <Save size={14} />
              <span>Salvar e Aplicar no Estúdio</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
