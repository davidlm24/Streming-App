import React, { useState } from 'react';
import { 
  Play, RotateCcw, ArrowRightLeft, Sparkles, Layers, Sliders, 
  Eye, Radio, Check, AlertCircle, RefreshCw, Columns, Maximize2,
  Tv, Zap, ChevronDown, CheckCircle2
} from 'lucide-react';
import { StudioSceneState } from '../types';

export interface StudioScenePreviewControlsProps {
  isStudioPreviewMode: boolean;
  onToggleStudioPreviewMode: () => void;
  previewViewMode: 'split' | 'preview-only' | 'program-only';
  onPreviewViewModeChange: (mode: 'split' | 'preview-only' | 'program-only') => void;
  hasPendingChanges: boolean;
  pendingChanges: string[];
  onPushToLive: () => void;
  onRevertToLive: () => void;
  onSwapPreviewAndLive?: () => void;
  isTransitioning?: boolean;
  transitionType?: 'cut' | 'fade' | 'slide' | 'zoom' | 'dip-to-color' | 'slide-wipe' | 'smooth-wipe' | 'shutter-wipe' | 'radial-wipe' | 'flash';
  onTransitionTypeChange?: (t: 'cut' | 'fade' | 'slide' | 'zoom' | 'dip-to-color' | 'slide-wipe' | 'smooth-wipe' | 'shutter-wipe' | 'radial-wipe' | 'flash') => void;
  transitionDuration?: number;
  onTransitionDurationChange?: (d: number) => void;
  isLive?: boolean;
}

export function StudioScenePreviewControls({
  isStudioPreviewMode,
  onToggleStudioPreviewMode,
  previewViewMode,
  onPreviewViewModeChange,
  hasPendingChanges,
  pendingChanges,
  onPushToLive,
  onRevertToLive,
  onSwapPreviewAndLive,
  isTransitioning = false,
  transitionType = 'fade',
  onTransitionTypeChange,
  transitionDuration = 300,
  onTransitionDurationChange,
  isLive = false
}: StudioScenePreviewControlsProps) {
  const [isTransitionsMenuOpen, setIsTransitionsMenuOpen] = useState(false);

  const transitionLabels: Record<string, string> = {
    'cut': 'Corte Seco (Cut)',
    'fade': 'Fade Suave (Dissolve)',
    'slide': 'Slide Lateral',
    'zoom': 'Zoom Dinâmico',
    'dip-to-color': 'Dip to Color (Flash)',
    'slide-wipe': 'Slide Wipe',
    'smooth-wipe': 'Smooth Wipe TV',
    'shutter-wipe': 'Shutter (Cortina)',
    'radial-wipe': 'Radial Circular',
    'flash': 'Flash Branco'
  };

  return (
    <div className="w-full bg-[var(--bg)] border-b border-[var(--line)]/80 px-2 sm:px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 shadow-inner select-none transition-all" id="studio-scene-preview-controls">
      
      {/* Left: Mode Toggle & View Switcher */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Toggle Studio Preview Mode */}
        <button
          type="button"
          onClick={onToggleStudioPreviewMode}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
            isStudioPreviewMode
              ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/40'
              : 'bg-[var(--panel)]/60 border-[var(--line-ctl)]/60 text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:bg-[var(--raise)]/50'
          }`}
          title={isStudioPreviewMode ? 'Desativar modo Preview (voltar para edição ao vivo direta)' : 'Ativar modo Studio Preview (Permite editar câmeras, banners e tickers antes de publicar no ar)'}
        >
          <Layers size={13} className={isStudioPreviewMode ? 'text-cyan-400 animate-pulse' : 'text-[var(--ink-lo)]'} />
          <span>Preview de Cena (Studio Mode)</span>
          <span className={`text-[8px] font-black px-1 py-0.2 rounded uppercase ${
            isStudioPreviewMode ? 'bg-cyan-500 text-slate-950' : 'bg-[var(--raise)] text-[var(--ink)]'
          }`}>
            {isStudioPreviewMode ? 'Ativo' : 'Off'}
          </span>
        </button>

        {/* View mode buttons (Only visible when Studio Preview Mode is Active) */}
        {isStudioPreviewMode && (
          <div className="flex items-center bg-[var(--surface)]/90 border border-[var(--line)] rounded-lg p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => onPreviewViewModeChange('split')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer ${
                previewViewMode === 'split'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
              }`}
              title="Exibir Prévia e Ao Vivo Lado a Lado (Estilo OBS / vMix)"
            >
              <Columns size={11} />
              <span className="hidden md:inline">Lado a Lado</span>
            </button>

            <button
              type="button"
              onClick={() => onPreviewViewModeChange('preview-only')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer ${
                previewViewMode === 'preview-only'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
              }`}
              title="Focar apenas na Tela de Prévia (Edição)"
            >
              <Eye size={11} />
              <span>Prévia</span>
            </button>

            <button
              type="button"
              onClick={() => onPreviewViewModeChange('program-only')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer ${
                previewViewMode === 'program-only'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
              }`}
              title="Visualizar exatamente o que está No Ar (Program)"
            >
              <Radio size={11} className={isLive ? 'animate-pulse text-[var(--ink-hi)]' : ''} />
              <span>Ao Vivo</span>
            </button>
          </div>
        )}

        {/* Pending changes badge */}
        {isStudioPreviewMode && (
          <div className="flex items-center gap-1.5">
            {hasPendingChanges ? (
              <div 
                className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-md text-[10px] font-bold animate-in fade-in duration-200 cursor-help"
                title={`Alterações pendentes:\n• ${pendingChanges.join('\n• ')}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span>{pendingChanges.length} {pendingChanges.length === 1 ? 'alteração pronta' : 'alterações prontas'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md text-[10px] font-bold">
                <CheckCircle2 size={11} />
                <span>Em sincronia com Ao Vivo</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Push to Live / Transition Actions */}
      {isStudioPreviewMode && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Transition selector dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTransitionsMenuOpen(prev => !prev)}
              className="px-2 py-1 bg-[var(--surface)] border border-[var(--line-ctl)]/80 hover:border-[var(--line-ctl)] text-[var(--ink)] hover:text-[var(--ink-hi)] rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Configurar efeito de transição para o Push to Live"
            >
              <Zap size={11} className="text-amber-400" />
              <span>{transitionLabels[transitionType] || 'Fade'}</span>
              <span className="text-[9px] text-[var(--ink-dim)] font-mono">{transitionDuration}ms</span>
              <ChevronDown size={10} className="text-[var(--ink-lo)]" />
            </button>

            {/* Dropdown Menu */}
            {isTransitionsMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsTransitionsMenuOpen(false)} 
                />
                <div className="absolute right-0 top-full mt-1 w-56 bg-[var(--surface)] border border-[var(--line-ctl)] rounded-xl p-2 z-50 shadow-2xl space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-[var(--ink-lo)] px-1 border-b border-[var(--line)] pb-1">
                    Efeito de Transição
                  </div>

                  <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                    {Object.entries(transitionLabels).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          onTransitionTypeChange?.(key as any);
                          setIsTransitionsMenuOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center justify-between cursor-pointer ${
                          transitionType === key
                            ? 'bg-blue-600 text-white'
                            : 'text-[var(--ink)] hover:bg-[var(--panel)] hover:text-[var(--ink-hi)]'
                        }`}
                      >
                        <span>{label}</span>
                        {transitionType === key && <Check size={11} />}
                      </button>
                    ))}
                  </div>

                  {/* Duration Slider */}
                  <div className="pt-2 border-t border-[var(--line)] px-1 space-y-1">
                    <div className="flex items-center justify-between text-[9px] text-[var(--ink-lo)]">
                      <span>Duração:</span>
                      <span className="font-mono text-[var(--ink-hi)] font-bold">{transitionDuration}ms</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="1000"
                      step="50"
                      value={transitionDuration}
                      onChange={(e) => onTransitionDurationChange?.(parseInt(e.target.value, 10))}
                      className="w-full h-1 bg-[var(--panel)] rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Revert / Discard button */}
          {hasPendingChanges && (
            <button
              type="button"
              onClick={onRevertToLive}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[var(--panel)]/80 hover:bg-[var(--raise)] text-[var(--ink)] hover:text-[var(--ink-hi)] border border-[var(--line-ctl)]/60 transition-all flex items-center gap-1 cursor-pointer"
              title="Descartar rascunho de prévia e restaurar a cena atual do Ao Vivo"
            >
              <RotateCcw size={11} />
              <span className="hidden sm:inline">Descartar</span>
            </button>
          )}

          {/* Swap Preview & Program (optional take) */}
          {onSwapPreviewAndLive && (
            <button
              type="button"
              onClick={onSwapPreviewAndLive}
              className="p-1 rounded-lg text-[10px] font-bold bg-[var(--surface)] hover:bg-[var(--panel)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)] border border-[var(--line)] transition-all flex items-center justify-center cursor-pointer"
              title="Inverter Prévia e Ao Vivo"
            >
              <ArrowRightLeft size={12} />
            </button>
          )}

          {/* Core PUSH TO LIVE Button */}
          <button
            type="button"
            onClick={onPushToLive}
            disabled={isTransitioning}
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-lg active:scale-95 ${
              hasPendingChanges
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 ring-2 ring-emerald-400/50 shadow-emerald-500/25 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/40'
            }`}
            title="Publicar a cena da Prévia no Ao Vivo (Transmissão)"
          >
            {isTransitioning ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Transição...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} className="text-slate-950" />
                <span>Push to Live</span>
                <span className="text-[9px] bg-[var(--bg)]/20 text-slate-950 font-black px-1.5 py-0.2 rounded ml-0.5">
                  NO AR ➔
                </span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
