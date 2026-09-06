import React, { useState } from 'react';
import { 
  Users, Check, Copy, Monitor, Minimize2, Tv,
  RefreshCw, Eye, Sparkles, Layers
} from 'lucide-react';
import { Participant } from '../types';
import { ImagePlaceholder } from './ImagePlaceholder';
import { AudioVUMeter } from './AudioVUMeter';

export interface Scene {
  id: string;
  name: string;
  type: 'video' | 'slides' | 'guests' | 'welcome';
  layout: '1-cam' | 'dual' | 'screen-share' | 'picture-in-picture' | 'presentation' | 'grid' | 'gallery';
  activeParticipantIds: string[];
  videoName?: string;
  slideName?: string;
  bannerText?: string;
  bgOverlayOpacity?: number;
}

export const DEFAULT_STUDIO_SCENES: Scene[] = [
  { id: 'scene-1', name: 'Abertura (Welcome)', type: 'welcome', layout: '1-cam', activeParticipantIds: ['p-local'] },
  { id: 'scene-2', name: 'Apresentador Solo', type: 'guests', layout: '1-cam', activeParticipantIds: ['p-local'] },
  { id: 'scene-3', name: 'Entrevista Duo', type: 'guests', layout: 'dual', activeParticipantIds: ['p-local', 'p-guest'] },
  { id: 'scene-4', name: 'Apresentação Slides', type: 'slides', layout: 'presentation', activeParticipantIds: ['p-local', 'p-screen'] },
  { id: 'scene-5', name: 'Vídeo / Tela Cheia', type: 'video', layout: 'screen-share', activeParticipantIds: ['p-screen'] }
];

interface ScenesPanelProps {
  participants: Participant[];
  onToggleParticipantActive?: (id: string) => void;
  isMuted?: boolean;
  isSceneAutomationEnabled?: boolean;
  activeSpeaker?: string;
  onToggleImmersiveMode?: () => void;
  currentSceneId?: string;
  onSelectScene?: (scene: Scene) => void;
  scenes?: Scene[];
  sceneTransitions?: Record<string, { type: string; duration: number }>;
}

export function ScenesPanel({
  participants,
  onToggleParticipantActive = () => {},
  isMuted = false,
  isSceneAutomationEnabled = false,
  activeSpeaker = 'p-local',
  onToggleImmersiveMode,
  currentSceneId = 'scene-1',
  onSelectScene,
  scenes = DEFAULT_STUDIO_SCENES,
  sceneTransitions
}: ScenesPanelProps) {
  const [copied, setCopied] = useState(false);

  // Preview Scene state (Program is currentSceneId)
  const [previewSceneId, setPreviewSceneId] = useState<string>(() => {
    // Pick first scene that is not currentSceneId if possible
    const other = scenes.find(s => s.id !== currentSceneId);
    return other ? other.id : currentSceneId;
  });

  const handleCopyInvite = () => {
    navigator.clipboard.writeText("https://stream.pwstreamer.com/guest-studio?id=5427");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const programScene = scenes.find(s => s.id === currentSceneId) || scenes[0];
  const previewScene = scenes.find(s => s.id === previewSceneId) || scenes[1] || scenes[0];

  const handleExecuteTransition = () => {
    if (onSelectScene && previewScene) {
      onSelectScene(previewScene);
    }
  };

  const handleSwapProgramPreview = () => {
    const oldProgramId = currentSceneId;
    if (onSelectScene && previewScene) {
      onSelectScene(previewScene);
      setPreviewSceneId(oldProgramId);
    }
  };

  const getTransitionLabel = (sceneId: string) => {
    const config = sceneTransitions?.[sceneId];
    if (!config) return 'FADE 300ms';
    return `${config.type.toUpperCase()} ${config.duration}ms`;
  };

  // Helper to render layout thumbnail diagram
  const renderLayoutDiagram = (layout: Scene['layout']) => {
    switch (layout) {
      case '1-cam':
        return (
          <div className="w-full h-full bg-[var(--surface)] rounded p-1 flex items-center justify-center">
            <div className="w-4/5 h-4/5 bg-blue-500/30 border border-blue-400/50 rounded flex items-center justify-center">
              <span className="text-[7px] font-bold text-blue-300">CAM</span>
            </div>
          </div>
        );
      case 'dual':
        return (
          <div className="w-full h-full bg-[var(--surface)] rounded p-1 grid grid-cols-2 gap-1">
            <div className="bg-blue-500/30 border border-blue-400/50 rounded flex items-center justify-center">
              <span className="text-[6px] font-bold text-blue-300">CAM 1</span>
            </div>
            <div className="bg-purple-500/30 border border-purple-400/50 rounded flex items-center justify-center">
              <span className="text-[6px] font-bold text-purple-300">CAM 2</span>
            </div>
          </div>
        );
      case 'presentation':
      case 'screen-share':
        return (
          <div className="w-full h-full bg-[var(--surface)] rounded p-1 flex gap-1">
            <div className="flex-1 bg-[var(--color-brand-deep)]/30 border border-blue-400/50 rounded flex items-center justify-center">
              <span className="text-[6px] font-bold text-blue-300">TELA</span>
            </div>
            <div className="w-1/3 bg-[var(--panel)] border border-[var(--line-ctl)] rounded flex items-center justify-center">
              <span className="text-[6px] font-bold text-[var(--text-lo)]">CAM</span>
            </div>
          </div>
        );
      case 'grid':
      case 'gallery':
        return (
          <div className="w-full h-full bg-[var(--surface)] rounded p-1 grid grid-cols-2 grid-rows-2 gap-0.5">
            <div className="bg-blue-500/20 border border-blue-400/30 rounded"></div>
            <div className="bg-purple-500/20 border border-purple-400/30 rounded"></div>
            <div className="bg-emerald-500/20 border border-emerald-400/30 rounded"></div>
            <div className="bg-amber-500/20 border border-amber-400/30 rounded"></div>
          </div>
        );
      default:
        return (
          <div className="w-full h-full bg-[var(--surface)] rounded p-1 flex items-center justify-center">
            <span className="text-[7px] text-[var(--text-lo)]">{layout}</span>
          </div>
        );
    }
  };

  return (
    <div className="w-full bg-[var(--surface)] border-r border-[var(--line)] flex flex-col h-full select-none" id="scenes-sidebar">
      {/* Header */}
      <div className="p-3.5 border-b border-[var(--line)] bg-[var(--bg)] shrink-0 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-hi)] flex items-center gap-2">
            <Users size={14} className="text-blue-400" />
            <span>Integrantes do Estúdio</span>
          </h3>
          <p className="text-[10px] text-[var(--text-dim)] mt-0.5">Gerencie participantes e fontes de áudio/vídeo</p>
        </div>
        {onToggleImmersiveMode && (
          <button
            onClick={onToggleImmersiveMode}
            className="p-1.5 rounded-lg bg-[var(--panel)] hover:bg-[var(--raise)] hover:text-[var(--text-hi)] text-[var(--text-lo)] transition-all border border-[var(--line-ctl)]/50 cursor-pointer flex items-center justify-center shrink-0"
            title="Recuar Painel Lateral"
          >
            <Minimize2 size={13} />
          </button>
        )}
      </div>

      {/* Content Viewport */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar">
        {/* SECTION 1: Invite Guest */}
        <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-3.5 rounded-xl space-y-2.5 shadow-inner">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
              <Users size={13} />
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-wider text-[var(--text-hi)]">Convidar para o Estúdio</h4>
              <p className="text-[8px] text-[var(--text-lo)]">Palestrantes externos ao vivo</p>
            </div>
          </div>

          <p className="text-[9px] text-[var(--text-lo)] leading-relaxed">
            Link para convidados entrarem no estúdio diretamente pelo navegador:
          </p>

          <div className="flex gap-1.5 items-stretch">
            <div className="flex-1 bg-[var(--surface)] border border-[var(--line)]/80 rounded-lg px-2 flex items-center overflow-hidden min-w-0">
              <span className="text-[8.5px] font-mono text-[var(--text-lo)] truncate select-all">
                https://stream.pwstreamer.com/guest-studio?id=5427
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyInvite}
              className={`px-2.5 py-1.5 rounded-lg font-bold text-[9px] transition-all flex items-center gap-1 shrink-0 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                copied 
                  ? 'bg-green-600 text-white' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {copied ? <Check size={10} /> : <Copy size={10} />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* SECTION 2: Participant List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black tracking-wider text-[var(--text-dim)] uppercase">Integrantes ({participants.length})</span>
            <span className="text-[8px] font-mono text-[var(--text-lo)] bg-[var(--panel)]/50 px-1.5 py-0.5 rounded">Fontes</span>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2">
            {participants.map(p => (
              <button 
                key={p.id}
                type="button"
                onClick={() => onToggleParticipantActive && onToggleParticipantActive(p.id)}
                className={`w-full text-left rounded-xl p-2.5 border transition-all relative flex flex-col gap-2 cursor-pointer ${
                  p.isActive 
                    ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500/30 text-white' 
                    : 'bg-[var(--bg)]/40 border-[var(--line)] text-[var(--text-lo)] hover:border-[var(--line-ctl)] hover:bg-[var(--panel)]/20'
                }`}
              >
                <div className="w-full flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {p.isScreenShare ? (
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20">
                        <Monitor size={14} />
                      </div>
                    ) : (
                      <>
                      <img 
                        src={p.avatarUrl} 
                        alt={p.name} 
                        className="w-7 h-7 rounded-full object-cover border border-[var(--line)] shrink-0"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden shrink-0">
                        <ImagePlaceholder variant="small" className="w-7 h-7 rounded-full" />
                      </div>
                    </>
                    )}
                    <div className="overflow-hidden">
                      <p className={`text-xs font-bold truncate ${p.isActive ? 'text-[var(--text-hi)]' : 'text-[var(--text)]'}`}>{p.name}</p>
                      <p className="text-[8px] text-[var(--text-dim)] mt-0.5">
                        {p.isLocal ? 'Apresentador Principal' : p.isScreenShare ? 'Apresentação / Tela' : 'Convidado Externo'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {p.isActive ? (
                      <span className="text-[8px] font-black uppercase text-white bg-blue-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></span>
                        No Palco
                      </span>
                    ) : (
                      <span className="text-[8px] font-black uppercase text-[var(--text-lo)] hover:text-[var(--text-hi)] border border-[var(--line-ctl)] bg-[var(--bg)] px-1.5 py-0.5 rounded">
                        + Add
                      </span>
                    )}
                  </div>
                </div>

                {/* Sound indicator / Mic level VU Meter */}
                {!p.isScreenShare && (
                  <div className="w-full pt-1 border-t border-[var(--line)]/40" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between text-[8px] text-[var(--text-dim)] mb-0.5">
                      <span>Sinal de Voz:</span>
                      <span>{p.id === 'p-local' && isMuted ? 'Mutado' : 'Conectado'}</span>
                    </div>
                    <AudioVUMeter 
                      isMuted={p.id === 'p-local' ? isMuted : false} 
                      isActive={true} 
                      simulationType={
                        isSceneAutomationEnabled 
                          ? (activeSpeaker === p.id ? 'speech' : 'ambient')
                          : 'speech'
                      } 
                      stream={p.stream}
                    />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
