import React from 'react';
import { User, Video, Presentation, Radio, Sparkles, MessageSquare, Pin } from 'lucide-react';
import { Participant, StudioSceneState, Banner, TickerItem, Comment } from '../types';

interface ProgramMonitorViewProps {
  programState: StudioSceneState;
  participants: Participant[];
  allBanners?: Banner[];
  allTickers?: TickerItem[];
  streamColor?: string;
  textStyle?: 'default' | 'news' | 'rounded';
  isLive?: boolean;
  liveTime?: number;
  localStream?: MediaStream | null;
  isCamStopped?: boolean;
  cameraZoom?: number;
  cameraOffsetX?: number;
  cameraOffsetY?: number;
  mirrorCamera?: boolean;
  chromaKeyEnabled?: boolean;
  selectedSharedSource?: any;
  activeVideoClip?: any;
}

export function ProgramMonitorView({
  programState,
  participants,
  allBanners = [],
  allTickers = [],
  streamColor = '#4683E0',
  textStyle = 'default',
  isLive = false,
  liveTime = 0,
  localStream,
  isCamStopped = false,
  cameraZoom = 1,
  cameraOffsetX = 0,
  cameraOffsetY = 0,
  mirrorCamera = false,
  chromaKeyEnabled = false,
  selectedSharedSource,
  activeVideoClip
}: ProgramMonitorViewProps) {
  const {
    layout = '1-cam',
    activeParticipantIds = ['p-local'],
    activeBannerId,
    activeTickerId,
    pinnedComment,
    bannerPosition = 'bottom',
    activeBackground,
    activeOverlay,
    activeLogo,
    activeSlide,
    showQrCode,
    qrCodeText
  } = programState;

  const activeBanner = allBanners.find(b => b.id === activeBannerId) || null;
  const activeTicker = allTickers.find(t => t.id === activeTickerId) || null;

  // Filter participants active in the program state
  const activeParticipants = participants.filter(p => activeParticipantIds.includes(p.id));

  // Add slide / screenshare if present
  const feeds: any[] = [...activeParticipants];
  if (activeSlide) {
    feeds.push({
      id: 'p-slides-program',
      name: `Slides: ${activeSlide.name}`,
      isScreenShare: true,
      isActive: true,
      isSlides: true
    });
  } else if (selectedSharedSource && (selectedSharedSource.type === 'pdf' || selectedSharedSource.type === 'window' || selectedSharedSource.type === 'screen')) {
    if (!feeds.some(f => f.isScreenShare)) {
      feeds.push({
        id: 'p-shared-program',
        name: selectedSharedSource.name,
        isScreenShare: true,
        isActive: true
      });
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const renderFeed = (p: any, customClass = '') => {
    if (!p) return null;
    if (p.isLocal) {
      return (
        <div 
          key={p.id} 
          className={`relative w-full h-full overflow-hidden rounded-lg flex items-center justify-center bg-[#0F1115] ${customClass}`}
        >
          {!isCamStopped && localStream ? (
            <video
              ref={(el) => {
                if (el && localStream && el.srcObject !== localStream) {
                  el.srcObject = localStream;
                }
              }}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{
                transform: `${mirrorCamera ? 'scaleX(-1)' : 'scaleX(1)'} scale(${cameraZoom}) translate(${-cameraOffsetX}%, ${cameraOffsetY}%)`,
                transformOrigin: 'center'
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-[#4683E0] mb-1">
                <User size={20} />
              </div>
              <p className="text-[11px] font-semibold text-white">Marcos (Você)</p>
            </div>
          )}
          <div 
            style={{ backgroundColor: streamColor }}
            className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded text-[9px] font-bold shadow text-white"
          >
            Marcos (Palestrante)
          </div>
        </div>
      );
    }

    if (p.isSlides && activeSlide) {
      return (
        <div key={p.id} className={`relative w-full h-full bg-[#0F1115] overflow-hidden rounded-lg flex flex-col justify-between border border-slate-800 ${customClass}`}>
          <div className="bg-slate-900/90 px-2 py-1 flex items-center justify-between border-b border-slate-800">
            <span className="text-[9px] font-bold text-slate-300 truncate">{activeSlide.name}</span>
            <span className="text-[8px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded">
              PÁG {activeSlide.currentPage}/{activeSlide.totalPages}
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-[#12141a] to-[#0a0b0e]">
            <Sparkles size={20} className="text-emerald-400 mb-1 animate-pulse" />
            <p className="text-[11px] font-black text-white">Planejamento Estratégico</p>
            <p className="text-[8px] text-slate-400">Transmissão de Slides Ativa</p>
          </div>
        </div>
      );
    }

    return (
      <div key={p.id} className={`relative w-full h-full bg-[#16191E] overflow-hidden rounded-lg flex items-center justify-center ${customClass}`}>
        <div className="flex flex-col items-center justify-center text-center p-2">
          <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-300 mb-1">
            <User size={18} />
          </div>
          <p className="text-[10px] font-medium text-slate-200">{p.name || 'Convidado'}</p>
        </div>
        <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded text-[8px] font-semibold bg-black/60 text-white">
          {p.name || 'Convidado'}
        </div>
      </div>
    );
  };

  const renderLayout = () => {
    if (feeds.length === 0) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
          <p className="text-xs text-slate-400 font-bold">Nenhum participante no ar</p>
        </div>
      );
    }

    if (feeds.length === 1 || layout === '1-cam') {
      return <div className="w-full h-full p-1.5">{renderFeed(feeds[0])}</div>;
    }

    if (layout === 'dual') {
      return (
        <div className="w-full h-full grid grid-cols-2 gap-1.5 p-1.5">
          {renderFeed(feeds[0])}
          {renderFeed(feeds[1] || feeds[0])}
        </div>
      );
    }

    if (layout === 'presentation') {
      return (
        <div className="w-full h-full flex gap-1.5 p-1.5">
          <div className="flex-[2.5] h-full">{renderFeed(feeds[0])}</div>
          <div className="flex-1 flex flex-col gap-1.5 h-full">
            {renderFeed(feeds[1] || feeds[0], 'flex-1')}
            {feeds[2] && renderFeed(feeds[2], 'flex-1')}
          </div>
        </div>
      );
    }

    if (layout === 'picture-in-picture') {
      return (
        <div className="relative w-full h-full p-1.5">
          {renderFeed(feeds[0])}
          {feeds[1] && (
            <div className="absolute bottom-3 right-3 w-1/3 h-1/3 rounded-lg overflow-hidden border-2 border-blue-500 shadow-xl z-20">
              {renderFeed(feeds[1])}
            </div>
          )}
        </div>
      );
    }

    // Grid or default
    return (
      <div className="w-full h-full grid grid-cols-2 gap-1.5 p-1.5">
        {feeds.slice(0, 4).map(f => renderFeed(f))}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-black border border-rose-900/60 shadow-2xl flex flex-col select-none">
      {/* Background Image / Gradient */}
      {activeBackground ? (
        <img 
          src={activeBackground} 
          alt="Fundo ao vivo" 
          className="absolute inset-0 w-full h-full object-cover opacity-80" 
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B0D11] to-[#14171E]" />
      )}

      {/* Program Header Tag */}
      <div className="absolute top-2 left-2 z-30 flex items-center gap-1.5">
        <span className="bg-rose-600 text-[9px] font-black uppercase px-2 py-0.5 rounded text-white flex items-center gap-1 shadow-md animate-pulse">
          <Radio size={10} />
          PROGRAM (NO AR)
        </span>
        {isLive ? (
          <span className="bg-black/70 text-[9px] font-mono text-red-400 font-bold px-1.5 py-0.5 rounded border border-red-500/30">
            {formatTime(liveTime)}
          </span>
        ) : (
          <span className="bg-slate-900/80 text-[8px] font-mono text-slate-400 px-1.5 py-0.5 rounded">
            TRANSMISSÃO PRONTA
          </span>
        )}
      </div>

      {/* Program Overlay Image */}
      {activeOverlay && (
        <img
          src={activeOverlay}
          alt="Overlay do programa"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-20 opacity-90"
          referrerPolicy="no-referrer"
        />
      )}

      {/* Main Layout Feeds */}
      <div className={`relative h-full z-10 flex items-center justify-center transition-all duration-300 ${bannerPosition === 'lateral' ? 'w-[calc(100%-70px)] mr-auto ml-1' : 'w-full'}`}>
        {renderLayout()}
      </div>

      {/* Logo */}
      {activeLogo && (
        <div className="absolute top-2 right-2 z-30 w-8 h-8 rounded-lg bg-black/40 backdrop-blur-sm p-1 border border-white/10 flex items-center justify-center">
          <img src={activeLogo} alt="Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
        </div>
      )}

      {/* Pinned Comment */}
      {pinnedComment && (
        <div className="absolute bottom-12 left-4 right-4 z-30 bg-slate-950/95 border-l-4 border-blue-500 p-2 rounded-r-lg shadow-2xl flex items-center gap-2">
          <img src={pinnedComment.authorAvatar} alt="" className="w-6 h-6 rounded-full" />
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-bold text-blue-400 block">{pinnedComment.authorName}</span>
            <p className="text-[10px] text-white truncate">{pinnedComment.text}</p>
          </div>
        </div>
      )}

      {/* Active Lower-Third Banner */}
      {activeBanner && (
        <div 
          className={`absolute z-30 flex flex-col pointer-events-none ${
            bannerPosition === 'top' ? 'top-2 inset-x-2' :
            bannerPosition === 'top-left' ? 'top-10 left-2 max-w-xs' :
            bannerPosition === 'top-right' ? 'top-10 right-2 max-w-xs' :
            bannerPosition === 'bottom-left' ? 'bottom-3 left-2 max-w-xs' :
            bannerPosition === 'bottom-right' ? 'bottom-3 right-2 max-w-xs' :
            bannerPosition === 'lateral' ? 'top-1/3 left-3 max-w-xs' :
            'bottom-2 inset-x-2'
          }`}
        >
          {activeBanner.subtitle && (
            <div className="bg-amber-400 text-slate-950 font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-t-md self-start">
              {activeBanner.subtitle}
            </div>
          )}
          <div 
            style={{ backgroundColor: activeBanner.themeColor || '#1d273b' }}
            className="px-3 py-1.5 rounded-md border-l-4 border-emerald-400 text-white font-bold text-[11px] shadow-xl truncate"
          >
            {activeBanner.text}
          </div>
        </div>
      )}

      {/* Active Scrolling Ticker */}
      {activeTicker && (
        <div className="absolute bottom-0 inset-x-0 h-6 bg-slate-950/95 border-t border-slate-800 z-30 flex items-center overflow-hidden">
          <div 
            style={{ backgroundColor: streamColor }}
            className="h-full px-2 text-[8px] font-black text-white flex items-center uppercase shrink-0"
          >
            {activeTicker.badgeText || 'ALERTA'}
          </div>
          <div className="px-2 text-[9px] font-semibold text-white whitespace-nowrap truncate animate-pulse">
            {activeTicker.text}
          </div>
        </div>
      )}

      {/* QR Code */}
      {showQrCode && qrCodeText && (
        <div className="absolute bottom-8 right-2 z-30 bg-black/90 p-1 rounded-lg border border-slate-700 shadow-xl flex flex-col items-center">
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(qrCodeText)}`}
            alt="QR Code" 
            className="w-12 h-12"
          />
          <span className="text-[7px] font-black text-white uppercase mt-0.5">ACESSE</span>
        </div>
      )}
    </div>
  );
}
