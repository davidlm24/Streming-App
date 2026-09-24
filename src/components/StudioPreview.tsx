import React, { useEffect, useRef, useState } from 'react';
import { Monitor, User, Video, ShieldAlert, CheckCircle2, Pencil, Trash2, X, Sparkles, Compass, Youtube, Mail, Globe, Server, Play, Pause, ChevronLeft, ChevronRight, Activity, MessageSquare, Camera, Download, Presentation, Clock, Pin, PinOff, Move, RotateCcw, ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight, ArrowUp, ArrowDown, FileText, Maximize2, Check, Eye, EyeOff, Radio, RefreshCw, Columns, QrCode, ShoppingBag, Tag, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Participant, BannerPosition, StudioSceneState, Banner, TickerItem, QrCodeConfig, SceneTransitionType } from '../types';
import { AudioVUMeter } from './AudioVUMeter';
import { useMediaManager } from '../context/MediaManagerContext';
import { ProgramMonitorView } from './ProgramMonitorView';

interface StudioPreviewProps {
  layout: '1-cam' | 'dual' | 'screen-share' | 'picture-in-picture' | 'presentation' | 'grid' | 'gallery';
  onLayoutChange: (l: '1-cam' | 'dual' | 'screen-share' | 'picture-in-picture' | 'presentation' | 'grid' | 'gallery') => void;
  streamColor: string;
  textStyle: 'default' | 'news' | 'rounded';
  activeBannerText: string | null;
  pinnedComment?: import('../types').Comment | null;
  participants: Participant[];
  onToggleParticipantActive: (id: string) => void;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isCamStopped: boolean;
  isLive: boolean;
  liveTime: number;
  showQrCode?: boolean;
  qrCodeText?: string;
  qrCodeConfig?: QrCodeConfig;
  onToggleShowQrCode?: (show: boolean) => void;
  onOpenQrCodeModal?: () => void;
  transitionType?: SceneTransitionType;
  isTransitioning?: boolean;
  transitionStage?: 'idle' | 'covering' | 'revealing';
  transitionColor?: string;
  onTransitionColorChange?: (color: string) => void;
  isMuted?: boolean;
  cameraZoom?: number;
  cameraOffsetX?: number;
  cameraOffsetY?: number;
  chromaKeyEnabled?: boolean;
  chromaColor?: string;
  chromaTolerance?: number;
  selectedSharedSource?: { 
    type: 'tab' | 'window' | 'screen' | 'pdf' | 'video'; 
    name: string; 
    audioShared: boolean;
    fileUrl?: string;
    fileName?: string;
    pdfPageCount?: number;
    resolution?: '720p' | '1080p';
    frameRate?: '30fps' | '60fps';
    initialPage?: number;
  } | null;
  transitionDuration?: number;
  onAddSnapshot?: (snap: { id: string; name: string; url: string; timestamp: string }) => void;
  mirrorCamera?: boolean;
  logoAnimation?: 'none' | 'fade' | 'slide' | 'pop';
  bannerAnimation?: 'none' | 'fade' | 'slide' | 'typewriter' | 'pop';
  onTransitionTypeChange?: (t: SceneTransitionType) => void;
  onTransitionDurationChange?: (duration: number) => void;
  
  // Custom video and slide props
  activeVideoClip?: { id: string; name: string; url: string; isPlaying: boolean } | null;
  activeSlide?: { name: string; currentPage: number; totalPages: number } | null;
  countdownTimeLeft?: number;
  isCountdownActive?: boolean;
  showCountdownOnScreen?: boolean;
  isPlaylistActive?: boolean;
  onVideoClipEnded?: () => void;
  chromaEdgeSoftness?: number;
  chromaSpillSuppression?: number;
  isSceneAutomationEnabled?: boolean;
  activeSpeaker?: string;
  isPresentationOverlayActive?: boolean;
  onTogglePresentationOverlayActive?: () => void;
  onPresentationOverlayActiveToggle?: () => void;
  comments?: import('../types').Comment[];
  onPinComment?: (id: string | null) => void;
  bannerPosition?: BannerPosition;
  onBannerPositionChange?: (pos: BannerPosition) => void;
  activeBanner?: import('../types').Banner | null;
  activeTicker?: import('../types').TickerItem | null;
  tickerSpeed?: 'slow' | 'normal' | 'fast';
  tickerDirection?: 'left' | 'right';
  onSetActiveTicker?: (id: string | null) => void;

  // Teleprompter overlay props
  teleprompterText?: string;
  isTeleprompterPlaying?: boolean;
  onToggleTeleprompterPlaying?: () => void;
  teleprompterSpeed?: number;
  onTeleprompterSpeedChange?: (speed: number) => void;
  teleprompterFontSize?: 'sm' | 'md' | 'lg' | 'xl';
  teleprompterMirrored?: boolean;
  showTeleprompterOnStudio?: boolean;
  onToggleShowTeleprompterOnStudio?: () => void;

  // Studio Widgets optional controlled props
  showWidgetChat?: boolean;
  onToggleShowWidgetChat?: () => void;
  chatWidgetOpacity?: number;
  showWidgetLousa?: boolean;
  onToggleShowWidgetLousa?: () => void;
  showWidgetSnapshot?: boolean;
  onToggleShowWidgetSnapshot?: () => void;
  isFloatingChatOpen?: boolean;
  onToggleFloatingChatOpen?: () => void;
  isStreamHealthOpen?: boolean;
  onToggleStreamHealthOpen?: () => void;
  isDrawingMode?: boolean;
  onToggleDrawingMode?: () => void;

  // Studio Preview / Push to Live mode props
  isStudioPreviewMode?: boolean;
  /** Modo monitor: só o palco e a composição da cena, sem nenhum controle.
   *  Serve para instanciar um segundo monitor alimentado por outro estado —
   *  é assim que o PGM existe sem duplicar o compositor. */
  monitorOnly?: boolean;
  /** Qual barramento este monitor representa. Decide a moldura do tally. */
  monitorRole?: 'pgm' | 'pvw';
  onToggleStudioPreviewMode?: () => void;
  previewViewMode?: 'split' | 'preview-only' | 'program-only';
  onPreviewViewModeChange?: (mode: 'split' | 'preview-only' | 'program-only') => void;
  hasPendingChanges?: boolean;
  pendingChanges?: string[];
  onPushToLive?: () => void;
  onRevertToLive?: () => void;
  onSwapPreviewAndLive?: () => void;
  programSceneState?: StudioSceneState;
  allBanners?: Banner[];
  allTickers?: TickerItem[];
}

function useAspectRatio(aspectRatio: number = 16 / 9) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;

      if (containerWidth === 0 || containerHeight === 0) return;

      let width = containerWidth;
      let height = containerWidth / aspectRatio;

      if (height > containerHeight) {
        height = containerHeight;
        width = containerHeight * aspectRatio;
      }

      setDimensions({ width, height });
    };

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(container);
    updateSize(); // Initial measurement

    return () => {
      resizeObserver.disconnect();
    };
  }, [aspectRatio]);

  return { containerRef, dimensions };
}

export function StudioPreview({
  layout,
  onLayoutChange,
  streamColor,
  textStyle,
  activeBannerText,
  pinnedComment = null,
  participants,
  onToggleParticipantActive,
  localStream,
  screenStream,
  isCamStopped,
  isLive,
  liveTime,
  showQrCode = false,
  qrCodeText = '',
  qrCodeConfig,
  onToggleShowQrCode,
  onOpenQrCodeModal,
  transitionType = 'fade',
  isTransitioning = false,
  transitionStage = 'idle',
  transitionColor = '#FF3D38',
  onTransitionColorChange = () => {},
  isMuted = false,
  cameraZoom = 1,
  cameraOffsetX = 0,
  cameraOffsetY = 0,
  chromaKeyEnabled = false,
  chromaColor = '#00ff00',
  chromaTolerance = 40,
  selectedSharedSource = null,
  transitionDuration = 300,
  onAddSnapshot,
  mirrorCamera = true,
  logoAnimation = 'fade',
  bannerAnimation = 'slide',
  activeSlide = null,
  countdownTimeLeft = 300,
  isCountdownActive = false,
  showCountdownOnScreen = false,
  isPlaylistActive = false,
  onVideoClipEnded = () => {},
  chromaEdgeSoftness = 20,
  chromaSpillSuppression = 30,
  onTransitionTypeChange = () => {},
  onTransitionDurationChange = () => {},
  isSceneAutomationEnabled = false,
  activeSpeaker = 'p-local',
  isPresentationOverlayActive = true,
  onTogglePresentationOverlayActive = () => {},
  onPresentationOverlayActiveToggle = () => {},
  comments = [],
  onPinComment,
  bannerPosition = 'bottom',
  onBannerPositionChange = () => {},
  activeBanner = null,
  activeTicker = null,
  tickerSpeed = 'normal',
  tickerDirection = 'left',
  onSetActiveTicker = () => {},
  teleprompterText = '',
  isTeleprompterPlaying = false,
  onToggleTeleprompterPlaying = () => {},
  teleprompterSpeed = 3,
  onTeleprompterSpeedChange = () => {},
  teleprompterFontSize = 'lg',
  teleprompterMirrored = false,
  showTeleprompterOnStudio = false,
  onToggleShowTeleprompterOnStudio = () => {},
  showWidgetChat = false,
  onToggleShowWidgetChat = () => {},
  chatWidgetOpacity = 95,
  showWidgetLousa = false,
  onToggleShowWidgetLousa = () => {},
  showWidgetSnapshot = false,
  onToggleShowWidgetSnapshot = () => {},
  isFloatingChatOpen: isFloatingChatOpenProp,
  onToggleFloatingChatOpen,
  isStreamHealthOpen: isStreamHealthOpenProp,
  onToggleStreamHealthOpen,
  isDrawingMode: isDrawingModeProp,
  onToggleDrawingMode,
  isStudioPreviewMode = false,
  monitorOnly = false,
  monitorRole = 'pvw',
  onToggleStudioPreviewMode,
  previewViewMode = 'split',
  onPreviewViewModeChange,
  hasPendingChanges = false,
  pendingChanges = [],
  onPushToLive,
  onRevertToLive,
  onSwapPreviewAndLive,
  programSceneState,
  allBanners = [],
  allTickers = []
}: StudioPreviewProps) {
  const { activeLogo, setActiveLogo, activeWatermark, activeOverlay, activeBackground, activeVideoClip } = useMediaManager();

  const [internalFloatingChat, setInternalFloatingChat] = useState<boolean>(false);
  const isFloatingChatOpen = isFloatingChatOpenProp !== undefined ? isFloatingChatOpenProp : internalFloatingChat;
  const setIsFloatingChatOpen = (val: boolean | ((prev: boolean) => boolean)) => {
    if (onToggleFloatingChatOpen) {
      onToggleFloatingChatOpen();
    } else {
      setInternalFloatingChat(val);
    }
  };

  const [internalStreamHealth, setInternalStreamHealth] = useState<boolean>(false);
  const isStreamHealthOpen = isStreamHealthOpenProp !== undefined ? isStreamHealthOpenProp : internalStreamHealth;
  const setIsStreamHealthOpen = (val: boolean | ((prev: boolean) => boolean)) => {
    if (onToggleStreamHealthOpen) {
      onToggleStreamHealthOpen();
    } else {
      setInternalStreamHealth(val);
    }
  };

  const [isBannerPosEditorOpen, setIsBannerPosEditorOpen] = useState<boolean>(false);

  // Teleprompter scroll ref and animation effect for Studio preview
  const studioPrompterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTeleprompterOnStudio || !isTeleprompterPlaying) return;

    const interval = setInterval(() => {
      if (studioPrompterRef.current) {
        const el = studioPrompterRef.current;
        const maxScroll = el.scrollHeight - el.clientHeight;
        if (maxScroll > 10) {
          el.scrollTop += (teleprompterSpeed * 0.5);
          if (el.scrollTop >= maxScroll - 2) {
            onToggleTeleprompterPlaying();
          }
        }
      }
    }, 35);

    return () => clearInterval(interval);
  }, [showTeleprompterOnStudio, isTeleprompterPlaying, teleprompterSpeed]);

  // Stage ref for accurate 16:9 bounding box calculations
  const stageRef = useRef<HTMLDivElement>(null);

  const getStageRect = () => {
    if (stageRef.current) {
      const r = stageRef.current.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return r;
    }
    if (containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return r;
    }
    return null;
  };

  // Drag & scale state for Logo and Banner
  const [logoPos, setLogoPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('pw_logo_pos');
      return saved ? JSON.parse(saved) : { x: 86, y: 4 };
    } catch {
      return { x: 86, y: 4 };
    }
  });
  const [logoScale, setLogoScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pw_logo_scale');
      return saved ? parseFloat(saved) : 1.0;
    } catch {
      return 1.0;
    }
  });
  const [isHoveringLogo, setIsHoveringLogo] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isResizingLogo, setIsResizingLogo] = useState(false);

  const [bannerPos, setBannerPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('pw_banner_pos');
      return saved ? JSON.parse(saved) : { x: 3, y: 76 };
    } catch {
      return { x: 3, y: 76 };
    }
  });
  const [bannerScale, setBannerScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pw_banner_scale');
      return saved ? parseFloat(saved) : 1.0;
    } catch {
      return 1.0;
    }
  });
  const [isHoveringBanner, setIsHoveringBanner] = useState(false);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const [isResizingBanner, setIsResizingBanner] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('pw_logo_pos', JSON.stringify(logoPos));
      localStorage.setItem('pw_logo_scale', logoScale.toString());
    } catch {}
  }, [logoPos, logoScale]);

  useEffect(() => {
    const handleSetLogoPos = (e: any) => {
      if (e.detail?.pos) {
        setLogoPos(e.detail.pos);
      }
    };
    window.addEventListener('studio-logo-pos-set', handleSetLogoPos);
    return () => window.removeEventListener('studio-logo-pos-set', handleSetLogoPos);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('pw_banner_pos', JSON.stringify(bannerPos));
      localStorage.setItem('pw_banner_scale', bannerScale.toString());
    } catch {}
  }, [bannerPos, bannerScale]);

  useEffect(() => {
    const handleSetBannerPos = (e: any) => {
      if (e.detail?.pos) {
        setBannerPos(e.detail.pos);
      }
    };
    window.addEventListener('studio-banner-pos-set', handleSetBannerPos);
    return () => window.removeEventListener('studio-banner-pos-set', handleSetBannerPos);
  }, []);

  const resetLogoPos = () => {
    setLogoPos({ x: 86, y: 4 });
    setLogoScale(1.0);
  };

  const resetBannerPos = () => {
    setBannerPos({ x: 3, y: 76 });
    setBannerScale(1.0);
  };

  const startDragLogo = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingLogo(true);
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const initialX = logoPos.x;
    const initialY = logoPos.y;

    const handleMove = (moveEvt: MouseEvent | TouchEvent) => {
      const rect = getStageRect();
      if (!rect) return;
      const currentX = 'touches' in moveEvt ? moveEvt.touches[0].clientX : moveEvt.clientX;
      const currentY = 'touches' in moveEvt ? moveEvt.touches[0].clientY : moveEvt.clientY;
      const deltaX = ((currentX - startX) / rect.width) * 100;
      const deltaY = ((currentY - startY) / rect.height) * 100;
      setLogoPos({
        x: Math.max(1, Math.min(88, initialX + deltaX)),
        y: Math.max(1, Math.min(86, initialY + deltaY))
      });
    };

    const handleUp = () => {
      setIsDraggingLogo(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
  };

  const startResizeLogo = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizingLogo(true);
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const initialScale = logoScale;

    const handleMove = (moveEvt: MouseEvent | TouchEvent) => {
      const currentY = 'touches' in moveEvt ? moveEvt.touches[0].clientY : moveEvt.clientY;
      const deltaY = (startY - currentY) * 0.01;
      setLogoScale(Math.max(0.4, Math.min(2.5, initialScale + deltaY)));
    };

    const handleUp = () => {
      setIsResizingLogo(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
  };

  const startDragBanner = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingBanner(true);
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const initialX = bannerPos.x;
    const initialY = bannerPos.y;

    const handleMove = (moveEvt: MouseEvent | TouchEvent) => {
      const rect = getStageRect();
      if (!rect) return;
      const currentX = 'touches' in moveEvt ? moveEvt.touches[0].clientX : moveEvt.clientX;
      const currentY = 'touches' in moveEvt ? moveEvt.touches[0].clientY : moveEvt.clientY;
      const deltaX = ((currentX - startX) / rect.width) * 100;
      const deltaY = ((currentY - startY) / rect.height) * 100;
      setBannerPos({
        x: Math.max(1, Math.min(75, initialX + deltaX)),
        y: Math.max(1, Math.min(82, initialY + deltaY))
      });
    };

    const handleUp = () => {
      setIsDraggingBanner(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
  };

  const startResizeBanner = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizingBanner(true);
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const initialScale = bannerScale;

    const handleMove = (moveEvt: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvt ? moveEvt.touches[0].clientX : moveEvt.clientX;
      const deltaX = (currentX - startX) * 0.005;
      setBannerScale(Math.max(0.5, Math.min(2.0, initialScale + deltaX)));
    };

    const handleUp = () => {
      setIsResizingBanner(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
  };

  // Speaker Card Draggable Position, Scale, Shape & Presets
  const [speakerCardPos, setSpeakerCardPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('pw_speaker_pip_pos');
      return saved ? JSON.parse(saved) : { x: 74, y: 66 }; // Default bottom-right standard
    } catch {
      return { x: 74, y: 66 };
    }
  });

  const [speakerCardScale, setSpeakerCardScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pw_speaker_pip_scale');
      return saved ? parseFloat(saved) : 1.0;
    } catch {
      return 1.0;
    }
  });

  const [speakerCardShape, setSpeakerCardShape] = useState<'rounded' | 'circle' | 'compact'>(() => {
    try {
      const saved = localStorage.getItem('pw_speaker_pip_shape') as any;
      return (saved === 'rounded' || saved === 'circle' || saved === 'compact') ? saved : 'rounded';
    } catch {
      return 'rounded';
    }
  });

  const [isHoveringSpeakerCard, setIsHoveringSpeakerCard] = useState(false);
  const [isDraggingSpeakerCard, setIsDraggingSpeakerCard] = useState(false);
  const [isResizingSpeakerCard, setIsResizingSpeakerCard] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('pw_speaker_pip_pos', JSON.stringify(speakerCardPos));
      localStorage.setItem('pw_speaker_pip_scale', speakerCardScale.toString());
      localStorage.setItem('pw_speaker_pip_shape', speakerCardShape);
    } catch {}

    // Dispatch sync event so LeftSidebar controls stay perfectly in sync
    window.dispatchEvent(new CustomEvent('studio-speaker-pos-updated', {
      detail: { pos: speakerCardPos, scale: speakerCardScale, shape: speakerCardShape }
    }));
  }, [speakerCardPos, speakerCardScale, speakerCardShape]);

  useEffect(() => {
    const handleRemoteSpeakerPosChange = (e: any) => {
      if (!e.detail) return;
      if (e.detail.pos) setSpeakerCardPos(e.detail.pos);
      if (e.detail.scale !== undefined) setSpeakerCardScale(e.detail.scale);
      if (e.detail.shape) setSpeakerCardShape(e.detail.shape);
    };

    window.addEventListener('studio-speaker-pos-change', handleRemoteSpeakerPosChange);
    return () => {
      window.removeEventListener('studio-speaker-pos-change', handleRemoteSpeakerPosChange);
    };
  }, []);

  const resetSpeakerCardPos = () => {
    setSpeakerCardPos({ x: 74, y: 66 });
    setSpeakerCardScale(1.0);
    setSpeakerCardShape('rounded');
  };

  const setSpeakerPresetPos = (preset: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center' | 'center') => {
    switch (preset) {
      case 'top-left':
        setSpeakerCardPos({ x: 3, y: 4 });
        break;
      case 'top-right':
        setSpeakerCardPos({ x: 74, y: 4 });
        break;
      case 'bottom-left':
        setSpeakerCardPos({ x: 3, y: 66 });
        break;
      case 'bottom-right':
        setSpeakerCardPos({ x: 74, y: 66 });
        break;
      case 'top-center':
        setSpeakerCardPos({ x: 38, y: 4 });
        break;
      case 'bottom-center':
        setSpeakerCardPos({ x: 38, y: 66 });
        break;
      case 'center':
        setSpeakerCardPos({ x: 38, y: 35 });
        break;
    }
  };

  const startDragSpeakerCard = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingSpeakerCard(true);
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const initialX = speakerCardPos.x;
    const initialY = speakerCardPos.y;

    const handleMove = (moveEvt: MouseEvent | TouchEvent) => {
      const rect = getStageRect();
      if (!rect) return;
      const currentX = 'touches' in moveEvt ? moveEvt.touches[0].clientX : moveEvt.clientX;
      const currentY = 'touches' in moveEvt ? moveEvt.touches[0].clientY : moveEvt.clientY;
      const deltaX = ((currentX - startX) / rect.width) * 100;
      const deltaY = ((currentY - startY) / rect.height) * 100;
      setSpeakerCardPos({
        x: Math.max(1, Math.min(80, initialX + deltaX)),
        y: Math.max(1, Math.min(74, initialY + deltaY))
      });
    };

    const handleUp = () => {
      setIsDraggingSpeakerCard(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
  };

  const startResizeSpeakerCard = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizingSpeakerCard(true);
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const initialScale = speakerCardScale;

    const handleMove = (moveEvt: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvt ? moveEvt.touches[0].clientX : moveEvt.clientX;
      const currentY = 'touches' in moveEvt ? moveEvt.touches[0].clientY : moveEvt.clientY;
      const delta = ((currentX - startX) + (currentY - startY)) * 0.005;
      setSpeakerCardScale(Math.max(0.6, Math.min(1.8, Number((initialScale + delta).toFixed(2)))));
    };

    const handleUp = () => {
      setIsResizingSpeakerCard(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
  };

  // QR Code & Live Commerce Product Card Draggable Position, Scale & Handlers
  const [qrCodePos, setQrCodePos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('pw_qrcode_pos');
      return saved ? JSON.parse(saved) : { x: 62, y: 56 };
    } catch {
      return { x: 62, y: 56 };
    }
  });

  const [qrCodeScale, setQrCodeScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pw_qrcode_scale');
      return saved ? parseFloat(saved) : 1.0;
    } catch {
      return 1.0;
    }
  });

  const [isHoveringQrCode, setIsHoveringQrCode] = useState(false);
  const [isDraggingQrCode, setIsDraggingQrCode] = useState(false);
  const [isResizingQrCode, setIsResizingQrCode] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('pw_qrcode_pos', JSON.stringify(qrCodePos));
      localStorage.setItem('pw_qrcode_scale', qrCodeScale.toString());
    } catch {}
  }, [qrCodePos, qrCodeScale]);

  const resetQrCodePos = () => {
    setQrCodePos({ x: 62, y: 56 });
    setQrCodeScale(1.0);
  };

  const startDragQrCode = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingQrCode(true);
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const initialX = qrCodePos.x;
    const initialY = qrCodePos.y;

    const handleMove = (moveEvt: MouseEvent | TouchEvent) => {
      const rect = getStageRect();
      if (!rect) return;
      const currentX = 'touches' in moveEvt ? moveEvt.touches[0].clientX : moveEvt.clientX;
      const currentY = 'touches' in moveEvt ? moveEvt.touches[0].clientY : moveEvt.clientY;
      const deltaX = ((currentX - startX) / rect.width) * 100;
      const deltaY = ((currentY - startY) / rect.height) * 100;
      setQrCodePos({
        x: Math.max(1, Math.min(74, initialX + deltaX)),
        y: Math.max(1, Math.min(70, initialY + deltaY))
      });
    };

    const handleUp = () => {
      setIsDraggingQrCode(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
  };

  const startResizeQrCode = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizingQrCode(true);
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const initialScale = qrCodeScale;

    const handleMove = (moveEvt: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvt ? moveEvt.touches[0].clientX : moveEvt.clientX;
      const currentY = 'touches' in moveEvt ? moveEvt.touches[0].clientY : moveEvt.clientY;
      const delta = ((currentX - startX) + (currentY - startY)) * 0.005;
      setQrCodeScale(Math.max(0.5, Math.min(1.8, Number((initialScale + delta).toFixed(2)))));
    };

    const handleUp = () => {
      setIsResizingQrCode(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
  };

  // Regime de rede simulado, pegajoso entre ticks. Ver o comentário no
  // intervalo abaixo — existe para que o estado de aviso seja atingível.
  const regimeRef = useRef<'nominal' | 'degraded' | 'critical'>('nominal');

  const [streamMetrics, setStreamMetrics] = useState({
    fps: 60,
    bitrate: 4850,
    packetLoss: 0.02,
    status: 'excellent' as 'excellent' | 'good' | 'warning',
    rtt: 18,
    resolution: '1080p (1920x1080)',
    codec: 'H.264 / Opus 48kHz',
    bitrateHistory: [4600, 4700, 4850, 4800, 4900, 4850, 4820, 4880, 4850]
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const baseFps = localStream || screenStream || isLive ? 60 : 30;
      // ── Regime de rede ───────────────────────────────────────────────────
      // A geração anterior tornava o aviso INALCANÇÁVEL: `lossVar` ia no
      // máximo a 0,06 contra limiares de > 2 e > 0,5, e `fpsVar` caía no
      // mínimo a 29,2 contra < 24. `status` só podia valer 'excellent' ou
      // 'good' — a única superfície que precisa avisar um cliente pagante de
      // que a transmissão está degradando era incapaz de fazê-lo.
      //
      // Enquanto não existe telemetria real do servidor de ingestão, o regime
      // é pegajoso (não pisca a cada 1,5 s) e percorre os três estados, de
      // modo que o caminho de aviso existe, é atingível e pode ser testado.
      // Ver `simulatedMetrics` abaixo: a origem simulada é declarada, não
      // apresentada como medição.
      const r = Math.random();
      const prevRegime = regimeRef.current;
      if (prevRegime === 'nominal' && r > 0.97) regimeRef.current = 'degraded';
      else if (prevRegime === 'degraded') {
        if (r > 0.93) regimeRef.current = 'critical';
        else if (r < 0.45) regimeRef.current = 'nominal';
      } else if (prevRegime === 'critical' && r < 0.35) regimeRef.current = 'degraded';
      const regime = regimeRef.current;

      const fpsVar = Number((
        regime === 'critical' ? 20 + Math.random() * 3.5
        : regime === 'degraded' ? baseFps - 16 - Math.random() * 6
        : baseFps - Math.random() * 0.8
      ).toFixed(1));
      const baseBitrate = isLive ? 6200 : (localStream || screenStream ? 4800 : 2500);
      const bitrateVar = Math.round(baseBitrate + (Math.random() * 260 - 130));
      const lossVar = Number((
        regime === 'critical' ? 2.2 + Math.random() * 2.8
        : regime === 'degraded' ? 0.6 + Math.random() * 1.1
        : Math.random() * 0.06
      ).toFixed(2));
      const rttVar = Math.round(16 + Math.random() * 6);

      let status: 'excellent' | 'good' | 'warning' = 'excellent';
      if (lossVar > 2 || fpsVar < 24) {
        status = 'warning';
      } else if (lossVar > 0.5 || fpsVar < 45) {
        status = 'good';
      }

      setStreamMetrics(prev => ({
        fps: fpsVar,
        bitrate: bitrateVar,
        packetLoss: lossVar,
        status,
        rtt: rttVar,
        resolution: screenStream ? '1080p (1920x1080)' : (localStream ? '1080p (1920x1080)' : '720p (1280x720)'),
        codec: 'H.264 / Opus 48kHz',
        bitrateHistory: [...prev.bitrateHistory.slice(1), bitrateVar]
      }));
    }, 1500);

    return () => clearInterval(interval);
  }, [localStream, screenStream, isLive]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const { containerRef, dimensions } = useAspectRatio(16 / 9);

  // Floating Reactions State
  const [floatingReactions, setFloatingReactions] = useState<{ id: string; emoji: string; x: number }[]>([]);
  // Current PDF Slide State
  const [pdfCurrentPage, setPdfCurrentPage] = useState<number>(1);
  // Recording State
  const [recordingState, setRecordingState] = useState<{ isRecording: boolean; formattedTime: string }>({
    isRecording: false,
    formattedTime: '00:00:00'
  });

  useEffect(() => {
    if (selectedSharedSource?.type === 'pdf' && selectedSharedSource.initialPage) {
      setPdfCurrentPage(selectedSharedSource.initialPage);
    } else {
      setPdfCurrentPage(1);
    }
  }, [selectedSharedSource]);

  useEffect(() => {
    const handleReaction = (e: any) => {
      if (!e.detail) return;
      const { emoji } = e.detail;
      const id = Math.random().toString();
      // Generate random coordinate between 15% and 85%
      const x = 15 + Math.random() * 70;
      setFloatingReactions(prev => [...prev, { id, emoji, x }]);

      setTimeout(() => {
        setFloatingReactions(prev => prev.filter(r => r.id !== id));
      }, 2500);
    };

    const handleRecordingState = (e: any) => {
      if (!e.detail) return;
      setRecordingState(e.detail);
    };

    window.addEventListener('studio-reaction', handleReaction);
    window.addEventListener('studio-recording-state', handleRecordingState);

    return () => {
      window.removeEventListener('studio-reaction', handleReaction);
      window.removeEventListener('studio-recording-state', handleRecordingState);
    };
  }, []);

  // Helpers for logo entrance animation
  const getLogoInitial = () => {
    switch (logoAnimation) {
      case 'fade':
        return { opacity: 0, scale: 0.8 };
      case 'slide':
        return { opacity: 0, x: 50 }; // slide in from right side
      case 'pop':
        return { opacity: 0, scale: 0.4 };
      case 'none':
      default:
        return { opacity: 1, scale: 1, x: 0 };
    }
  };

  const getLogoAnimate = () => {
    if (logoAnimation === 'none') return { opacity: 1, scale: 1, x: 0 };
    return { opacity: 1, scale: 1, x: 0 };
  };

  const getLogoExit = () => {
    switch (logoAnimation) {
      case 'fade':
        return { opacity: 0, scale: 0.8 };
      case 'slide':
        return { opacity: 0, x: 50 };
      case 'pop':
        return { opacity: 0, scale: 0.4 };
      case 'none':
      default:
        return { opacity: 1 };
    }
  };

  // Typewriter effect state
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    if (!activeBannerText) {
      setTypedText('');
      return;
    }
    if (bannerAnimation !== 'typewriter') {
      setTypedText(activeBannerText);
      return;
    }

    setTypedText('');
    let i = 0;
    const interval = setInterval(() => {
      setTypedText((prev) => prev + (activeBannerText[i] || ''));
      i++;
      if (i >= activeBannerText.length) {
        clearInterval(interval);
      }
    }, 45); // type rate

    return () => clearInterval(interval);
  }, [activeBannerText, bannerAnimation]);

  // Helpers for banner entrance and exit animations (faded slide-in)
  const getBannerInitial = () => {
    switch (bannerAnimation) {
      case 'fade':
        return { opacity: 0, scale: 0.96, y: 16, filter: 'blur(8px)' };
      case 'typewriter':
        return { opacity: 0, y: 14, filter: 'blur(4px)' };
      case 'slide':
        return { opacity: 0, y: 32, x: -20, scale: 0.94, filter: 'blur(8px)' }; // slide up and in smoothly
      case 'pop':
        return { opacity: 0, scale: 0.78, y: 12, filter: 'blur(6px)' };
      case 'none':
      default:
        return { opacity: 0, y: 12, filter: 'blur(4px)' };
    }
  };

  const getBannerAnimate = () => {
    return { 
      opacity: 1, 
      y: 0, 
      x: 0, 
      scale: 1, 
      filter: 'blur(0px)',
      transition: (bannerAnimation === 'pop' || bannerAnimation === 'slide')
        ? { type: 'spring' as const, damping: 24, stiffness: 280, mass: 0.85 }
        : { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const }
    };
  };

  const getBannerExit = () => {
    switch (bannerAnimation) {
      case 'fade':
        return { opacity: 0, scale: 0.96, y: 12, filter: 'blur(6px)', transition: { duration: 0.22, ease: [0.4, 0, 1, 1] as const } };
      case 'typewriter':
        return { opacity: 0, y: 10, filter: 'blur(4px)', transition: { duration: 0.18 } };
      case 'slide':
        return { opacity: 0, y: 24, x: -16, scale: 0.94, filter: 'blur(6px)', transition: { duration: 0.24, ease: [0.4, 0, 1, 1] as const } };
      case 'pop':
        return { opacity: 0, scale: 0.82, y: 8, filter: 'blur(6px)', transition: { duration: 0.2 } };
      case 'none':
      default:
        return { opacity: 0, y: 8, filter: 'blur(4px)', transition: { duration: 0.18 } };
    }
  };

  const getBannerPositionClasses = () => {
    switch (bannerPosition) {
      case 'top':
        return 'top-0 inset-x-0 w-full h-10 border-b border-white/10 rounded-none';
      case 'top-left':
        return 'top-12 left-4 max-w-sm rounded-xl border border-white/20 shadow-2xl overflow-hidden h-10';
      case 'top-right':
        return 'top-12 right-4 max-w-sm rounded-xl border border-white/20 shadow-2xl overflow-hidden h-10';
      case 'bottom-left':
        return 'bottom-4 left-4 max-w-sm rounded-xl border border-white/20 shadow-2xl overflow-hidden h-10';
      case 'bottom-right':
        return 'bottom-4 right-4 max-w-sm rounded-xl border border-white/20 shadow-2xl overflow-hidden h-10';
      case 'lateral':
        return 'top-1/3 left-4 max-w-xs rounded-xl border border-white/20 shadow-2xl overflow-hidden';
      case 'bottom':
      default:
        return 'bottom-0 inset-x-0 w-full h-10 border-t border-white/10 rounded-none';
    }
  };

  const handleBannerDragEnd = (event: any, info: any) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pointX = info.point.x - rect.left;
    const pointY = info.point.y - rect.top;
    const w = rect.width;
    const h = rect.height;

    const isTop = pointY < h * 0.45;
    const isBottom = pointY > h * 0.55;
    const isLeft = pointX < w * 0.35;
    const isRight = pointX > w * 0.65;

    let newPos: BannerPosition = 'bottom';
    if (isTop && isLeft) newPos = 'top-left';
    else if (isTop && isRight) newPos = 'top-right';
    else if (isTop) newPos = 'top';
    else if (isBottom && isLeft) newPos = 'bottom-left';
    else if (isBottom && isRight) newPos = 'bottom-right';
    else if (isBottom) newPos = 'bottom';
    else if (isLeft) newPos = 'bottom-left';
    else if (isRight) newPos = 'bottom-right';

    if (onBannerPositionChange) {
      onBannerPositionChange(newPos);
    }
  };

  // Canvas Drawing States & Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [internalDrawingMode, setInternalDrawingMode] = useState<boolean>(false);
  const isDrawingMode = isDrawingModeProp !== undefined ? isDrawingModeProp : internalDrawingMode;
  const setIsDrawingMode = (val: boolean | ((prev: boolean) => boolean)) => {
    if (onToggleDrawingMode) {
      onToggleDrawingMode();
    } else {
      setInternalDrawingMode(val);
    }
  };
  const [isFlashActive, setIsFlashActive] = useState<boolean>(false);
  const [drawColor, setDrawColor] = useState<string>('#f43f5e'); // Default to warm rose
  const [drawThickness, setDrawThickness] = useState<number>(5);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  // Resize drawing canvas to match current bounding client rect
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    
    // Save current drawings
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.drawImage(canvas, 0, 0);
    }

    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = drawThickness;
      contextRef.current = ctx;
      // Redraw the saved contents
      ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
    }
  };

  // Drawing event handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawThickness;
    contextRef.current = ctx;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = contextRef.current || canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      if (e.cancelable) e.preventDefault();
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.closePath();
      }
    }
    setIsDrawing(false);
  };

  // Handle canvas resize on isDrawingMode or window size changes
  useEffect(() => {
    if (isDrawingMode) {
      const timer = setTimeout(() => {
        resizeCanvas();
      }, 50);

      window.addEventListener('resize', resizeCanvas);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', resizeCanvas);
      };
    }
  }, [isDrawingMode]);

  // Convert hex color to normalized RGB for Chroma Key filter matrix
  const hexToRgb = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 1, b: 0 };
  };

  const getChromaMatrix = () => {
    const rgb = hexToRgb(chromaColor);
    const t = (chromaTolerance / 100) * 4;
    
    let ar = t;
    let ag = t;
    let ab = t;
    
    if (rgb.g > rgb.r && rgb.g > rgb.b) {
      ag = -2 * t;
    } else if (rgb.b > rgb.r && rgb.b > rgb.g) {
      ab = -2 * t;
    } else {
      ar = -2 * t;
    }
    
    const ac = 2.0 - (chromaTolerance / 100) * 1.5;

    return `
      1 0 0 0 0
      0 1 0 0 0
      0 0 1 0 0
      ${ar} ${ag} ${ab} 0 ${ac}
    `;
  };

  const getSpillSuppressionMatrix = () => {
    const rgb = hexToRgb(chromaColor);
    const s = chromaSpillSuppression / 100; // 0 to 1
    
    let r1 = 1, r2 = 0, r3 = 0;
    let g1 = 0, g2 = 1, g3 = 0;
    let b1 = 0, b2 = 0, b3 = 1;
    
    if (rgb.g > rgb.r && rgb.g > rgb.b) {
      // Green key spill suppression: replace green with a mix of red and blue based on suppression intensity
      g1 = s * 0.5;
      g2 = 1 - s;
      g3 = s * 0.5;
    } else if (rgb.b > rgb.r && rgb.b > rgb.g) {
      // Blue key spill suppression
      b1 = s * 0.5;
      b2 = s * 0.5;
      b3 = 1 - s;
    } else {
      // Red key spill suppression
      r1 = 1 - s;
      r2 = s * 0.5;
      r3 = s * 0.5;
    }
    
    return `
      ${r1} ${r2} ${r3} 0 0
      ${g1} ${g2} ${g3} 0 0
      ${b1} ${b2} ${b3} 0 0
      0 0 0 1 0
    `;
  };

  // Bind local web camera stream
  useEffect(() => {
    if (localVideoRef.current && localStream && !isCamStopped) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isCamStopped]);

  // Bind screen share stream
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // Format live timer
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Synthesize a quick modern camera shutter sound effect using Web Audio API!
  const playShutterSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(850, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // Audio context might be blocked by browser autoplay policy
    }
  };

  // Helper method to draw a participant feed to offscreen canvas
  const drawFeedToCanvas = async (ctx: CanvasRenderingContext2D, feed: Participant | undefined, x: number, y: number, w: number, h: number) => {
    if (!feed) return;

    // Fill background for feed
    ctx.fillStyle = '#0F1115';
    ctx.fillRect(x, y, w, h);

    if (feed.isLocal && !isCamStopped) {
      // Draw local video element frame
      const video = localVideoRef.current;
      if (video && video.readyState >= 2) {
        ctx.save();
        if (mirrorCamera) {
          // Handle horizontal mirror for local webcam
          ctx.translate(x + w, y);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, w, h);
        } else {
          ctx.drawImage(video, x, y, w, h);
        }
        ctx.restore();
        return;
      }
    }

    if (feed.isScreenShare) {
      // Draw screen share video or simulated presentation slides
      const video = screenVideoRef.current;
      if (video && screenStream && video.readyState >= 2) {
        ctx.drawImage(video, x, y, w, h);
        return;
      } else {
        // No real track, let's render high fidelity slides on the canvas snapshot
        ctx.fillStyle = '#1e1f29';
        ctx.fillRect(x, y, w, h);

        // Draw PowerPoint template mockup on canvas
        ctx.fillStyle = '#e0533c';
        ctx.fillRect(x, y, w, 40);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('Apresentação de Vendas.pptx', x + 20, y + 25);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('Vega6: Métricas de Crescimento 2026', x + 40, y + 140);

        ctx.fillStyle = '#a59ebf';
        ctx.font = '12px sans-serif';
        ctx.fillText('Demonstração das estatísticas consolidadas da plataforma.', x + 40, y + 180);

        // Chart mockup
        ctx.fillStyle = '#16191e';
        ctx.fillRect(x + 40, y + 240, 160, 80);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(x + 40, y + 290, 160, 30);
        return;
      }
    }

    // Render avatar for external guests or placeholder when camera is stopped
    const avatarUrl = feed.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';
    const avatarImg = new Image();
    avatarImg.crossOrigin = 'anonymous';
    avatarImg.src = avatarUrl;
    await new Promise((resolve) => {
      avatarImg.onload = () => {
        // Draw centered circular avatar
        ctx.save();
        const r = Math.min(w, h) * 0.25;
        const cx = x + w / 2;
        const cy = y + h / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarImg, cx - r, cy - r, r * 2, r * 2);
        ctx.restore();

        // Draw name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(feed.name, x + w / 2, y + h / 2 + r + 24);
        resolve(null);
      };
      avatarImg.onerror = () => {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(feed.name, x + w / 2, y + h / 2);
        resolve(null);
      };
    });
  };

  const handleTakeSnapshot = async () => {
    try {
      // Create a 16:9 high-definition canvas (1280x720)
      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = 1280;
      captureCanvas.height = 720;
      const ctx = captureCanvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw background
      if (activeBackground) {
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        bgImg.src = activeBackground;
        await new Promise((resolve) => {
          bgImg.onload = () => {
            ctx.drawImage(bgImg, 0, 0, 1280, 720);
            resolve(null);
          };
          bgImg.onerror = () => {
            // Fallback gradient if load fails due to CORS or network
            const grad = ctx.createLinearGradient(0, 0, 1280, 720);
            grad.addColorStop(0, '#0F1115');
            grad.addColorStop(1, '#16191E');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 1280, 720);
            resolve(null);
          };
        });
      } else {
        const grad = ctx.createLinearGradient(0, 0, 1280, 720);
        grad.addColorStop(0, '#0F1115');
        grad.addColorStop(1, '#16191E');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1280, 720);
      }

      // 2. Draw Active Participant feeds
      const activeFeeds = participants.filter(p => p.isActive);
      if (activeFeeds.length > 0) {
        if (activeFeeds.length === 1) {
          // Single Feed takes full size
          const feed = activeFeeds[0];
          await drawFeedToCanvas(ctx, feed, 0, 0, 1280, 720);
        } else if (layout === 'dual') {
          // Split screen
          await drawFeedToCanvas(ctx, activeFeeds[0], 0, 0, 635, 720);
          await drawFeedToCanvas(ctx, activeFeeds[1], 645, 0, 635, 720);
        } else if (layout === 'screen-share') {
          const screenFeed = activeFeeds.find(f => f.isScreenShare);
          const camFeeds = activeFeeds.filter(f => !f.isScreenShare);
          if (screenFeed) {
            await drawFeedToCanvas(ctx, screenFeed, 0, 0, 960, 720);
            if (camFeeds.length > 0) {
              await drawFeedToCanvas(ctx, camFeeds[0], 975, 10, 295, 220);
              if (camFeeds.length > 1) {
                await drawFeedToCanvas(ctx, camFeeds[1], 975, 245, 295, 220);
              }
            }
          } else {
            await drawFeedToCanvas(ctx, activeFeeds[0], 0, 0, 635, 720);
            await drawFeedToCanvas(ctx, activeFeeds[1], 645, 0, 635, 720);
          }
        } else if (layout === 'picture-in-picture') {
          const screenFeed = activeFeeds.find(f => f.isScreenShare);
          const camFeeds = activeFeeds.filter(f => !f.isScreenShare);
          if (screenFeed) {
            await drawFeedToCanvas(ctx, screenFeed, 0, 0, 1280, 720);
            if (camFeeds.length > 0) {
              // Picture-in-picture box
              ctx.strokeStyle = '#3b82f6';
              ctx.lineWidth = 4;
              ctx.strokeRect(960, 20, 300, 200);
              await drawFeedToCanvas(ctx, camFeeds[0], 960, 20, 300, 200);
            }
          } else {
            await drawFeedToCanvas(ctx, activeFeeds[0], 0, 0, 1280, 720);
          }
        } else if (layout === 'presentation') {
          const screenFeed = activeFeeds.find(f => f.isScreenShare);
          const camFeeds = activeFeeds.filter(f => !f.isScreenShare);
          if (screenFeed) {
            await drawFeedToCanvas(ctx, screenFeed, 0, 0, 1280, 720);
            if (camFeeds.length > 0) {
              ctx.strokeStyle = '#3b82f6';
              ctx.lineWidth = 4;
              ctx.strokeRect(950, 470, 310, 230);
              await drawFeedToCanvas(ctx, camFeeds[0], 950, 470, 310, 230);
            }
          } else {
            await drawFeedToCanvas(ctx, activeFeeds[0], 0, 0, 1280, 720);
          }
        } else if (layout === 'gallery') {
          const count = activeFeeds.length;
          if (count === 1) {
            await drawFeedToCanvas(ctx, activeFeeds[0], 0, 0, 1280, 720);
          } else if (count === 2) {
            await drawFeedToCanvas(ctx, activeFeeds[0], 0, 0, 635, 720);
            await drawFeedToCanvas(ctx, activeFeeds[1], 645, 0, 635, 720);
          } else if (count <= 4) {
            await drawFeedToCanvas(ctx, activeFeeds[0], 0, 0, 635, 355);
            if (activeFeeds[1]) await drawFeedToCanvas(ctx, activeFeeds[1], 645, 0, 635, 355);
            if (activeFeeds[2]) await drawFeedToCanvas(ctx, activeFeeds[2], 0, 365, 635, 355);
            if (activeFeeds[3]) await drawFeedToCanvas(ctx, activeFeeds[3], 645, 365, 635, 355);
          } else {
            for (let i = 0; i < Math.min(count, 9); i++) {
              const row = Math.floor(i / 3);
              const col = i % 3;
              const w = 420;
              const h = 230;
              const x = col * 430 + 10;
              const y = row * 240 + 10;
              await drawFeedToCanvas(ctx, activeFeeds[i], x, y, w, h);
            }
          }
        } else {
          // Grid or default
          if (activeFeeds.length === 2) {
            await drawFeedToCanvas(ctx, activeFeeds[0], 0, 0, 635, 720);
            await drawFeedToCanvas(ctx, activeFeeds[1], 645, 0, 635, 720);
          } else if (activeFeeds.length >= 3) {
            await drawFeedToCanvas(ctx, activeFeeds[0], 0, 0, 635, 355);
            await drawFeedToCanvas(ctx, activeFeeds[1], 645, 0, 635, 355);
            await drawFeedToCanvas(ctx, activeFeeds[2], 320, 365, 640, 355);
          }
        }
      }

      // 3. Draw Brand Logo
      if (activeLogo) {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.src = activeLogo;
        await new Promise((resolve) => {
          logoImg.onload = () => {
            // Logo placed top right: at (1120, 40)
            ctx.drawImage(logoImg, 1120, 40, 120, 120);
            resolve(null);
          };
          logoImg.onerror = () => resolve(null);
        });
      }

      // 4. Draw Overlay Transparent border/frame
      if (activeOverlay) {
        const overlayImg = new Image();
        overlayImg.crossOrigin = 'anonymous';
        overlayImg.src = activeOverlay;
        await new Promise((resolve) => {
          overlayImg.onload = () => {
            ctx.drawImage(overlayImg, 0, 0, 1280, 720);
            resolve(null);
          };
          overlayImg.onerror = () => resolve(null);
        });
      }

      // 5. Draw QR Code
      if (showQrCode && qrCodeText) {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCodeText)}`;
        const qrImg = new Image();
        qrImg.crossOrigin = 'anonymous';
        qrImg.src = qrUrl;
        await new Promise((resolve) => {
          qrImg.onload = () => {
            // QR placed bottom right
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(1080, 460, 160, 180);
            ctx.drawImage(qrImg, 1090, 470, 140, 140);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ACESSE JÁ', 1160, 630);
            resolve(null);
          };
          qrImg.onerror = () => resolve(null);
        });
      }

      // 6a. Draw Active Scrolling Ticker Bar at bottom
      if (activeTicker && isPresentationOverlayActive) {
        const tickerText = activeTicker.text;
        const badgeText = activeTicker.badgeText || 'ALERTA';

        // Draw bottom ticker bar (60px high at bottom of 1280x720 canvas)
        ctx.fillStyle = 'rgba(12, 16, 24, 0.92)';
        ctx.fillRect(0, 660, 1280, 60);

        // Draw badge box
        ctx.fillStyle = streamColor || '#FF3D38';
        ctx.fillRect(0, 660, 160, 60);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(badgeText, 80, 696);

        // Draw ticker text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(tickerText, 180, 695);
      }

      // 6b. Draw Active Lower-Third Banner at dynamic position
      if (activeBanner && isPresentationOverlayActive) {
        const textToDraw = activeBanner.text;
        const subToDraw = activeBanner.subtitle || 'Stream like a Pro - OneStream Live Studio';
        const mainColor = activeBanner.themeColor || '#1d273b';
        const accentColor = activeBanner.accentColor || '#84cc16';

        // Calculate positions on 1280x720 canvas
        const bx = (bannerPos.x / 100) * 1280;
        const by = (bannerPos.y / 100) * 720;
        const scale = bannerScale;

        // Subtitle pill
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.roundRect(bx, by - 30 * scale, 320 * scale, 28 * scale, [8 * scale, 8 * scale, 0, 0]);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.font = `bold ${Math.round(13 * scale)}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(subToDraw, bx + 12 * scale, by - 10 * scale);

        // Main banner pill
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.roundRect(bx, by, 580 * scale, 50 * scale, [0, 12 * scale, 12 * scale, 12 * scale]);
        ctx.fill();

        // Accent border bar
        ctx.fillStyle = accentColor;
        ctx.fillRect(bx, by, 6 * scale, 50 * scale);

        // Main text
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(16 * scale)}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(textToDraw, bx + 18 * scale, by + 30 * scale);
      }

      // 7. Draw chalkboard drawings from drawing canvas
      const sketchCanvas = canvasRef.current;
      if (isDrawingMode && sketchCanvas) {
        ctx.drawImage(sketchCanvas, 0, 0, 1280, 720);
      }

      // Convert captured composition to Data URL
      const dataUrl = captureCanvas.toDataURL('image/png');

      // Trigger standard browser download of image file
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `webinar-snapshot-${dateStr}-${Math.floor(Math.random() * 10000)}.png`;
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Create local timestamp
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // Register the snapshot in state so it populates the local Assets list in the sidebar!
      if (onAddSnapshot) {
        onAddSnapshot({
          id: `snap-${Date.now()}`,
          name: fileName,
          url: dataUrl,
          timestamp: timeStr
        });
      }

      // Audio/visual capture feedback effect
      setIsFlashActive(true);
      setTimeout(() => setIsFlashActive(false), 200);

      // Play shutter sound
      playShutterSound();

    } catch (err) {
      console.error("Erro ao tirar snapshot da transmissão:", err);
    }
  };

  // Get active participants on stream
  const activeFeeds = [...participants.filter(p => p.isActive)];
  
  if (activeVideoClip && activeVideoClip.isPlaying) {
    activeFeeds.push({
      id: 'p-videoclip',
      name: `Vídeo: ${activeVideoClip.name}`,
      avatarUrl: '',
      isLocal: false,
      isScreenShare: true,
      isActive: true,
      hasVideo: true,
      hasAudio: true,
      isVideoClip: true
    } as any);
  }
  
  if (activeSlide) {
    activeFeeds.push({
      id: 'p-slides',
      name: `Slides: ${activeSlide.name}`,
      avatarUrl: '',
      isLocal: false,
      isScreenShare: true,
      isActive: true,
      hasVideo: true,
      hasAudio: false,
      isSlides: true
    } as any);
  } else if (selectedSharedSource && (selectedSharedSource.type === 'pdf' || selectedSharedSource.type === 'window' || selectedSharedSource.type === 'tab' || selectedSharedSource.type === 'screen' || selectedSharedSource.name.toLowerCase().includes('powerpoint') || selectedSharedSource.name.toLowerCase().includes('.pptx'))) {
    const hasScreenInFeeds = activeFeeds.some(f => f.isScreenShare);
    if (!hasScreenInFeeds) {
      activeFeeds.push({
        id: 'p-shared-source',
        name: selectedSharedSource.name,
        avatarUrl: '',
        isLocal: false,
        isScreenShare: true,
        isActive: true,
        hasVideo: true,
        hasAudio: false
      } as any);
    }
  }

  // Define animation variants based on transitionType and duration (in seconds)
  const durationSecs = transitionDuration / 1000;

  let animationProps: any = {
    initial: { opacity: 0, scale: 1, x: 0 },
    animate: { opacity: 1, scale: 1, x: 0 },
    exit: { opacity: 0, scale: 1, x: 0 },
    transition: { duration: durationSecs, ease: 'easeInOut' }
  };

  if (!isTransitioning || transitionType === 'cut') {
    animationProps = {
      initial: { opacity: 1, scale: 1, x: 0 },
      animate: { opacity: 1, scale: 1, x: 0 },
      exit: { opacity: 1, scale: 1, x: 0 },
      transition: { duration: 0 }
    };
  } else if (transitionType === 'slide') {
    animationProps = {
      initial: { x: '100%', opacity: 0.5, scale: 1 },
      animate: { x: 0, opacity: 1, scale: 1 },
      exit: { x: '-100%', opacity: 0.5, scale: 1 },
      transition: { duration: durationSecs, ease: 'easeOut' }
    };
  } else if (transitionType === 'zoom') {
    animationProps = {
      initial: { scale: 0.9, opacity: 0, x: 0 },
      animate: { scale: 1, opacity: 1, x: 0 },
      exit: { scale: 1.05, opacity: 0, x: 0 },
      transition: { duration: durationSecs, ease: 'easeInOut' }
    };
  }

  // Helper render of user webcam/placeholder
  const renderParticipantFeed = (p: Participant | undefined, customClass = '') => {
    if (!p) return null;
    if (p.isLocal) {
      const virtualBg = activeBackground || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
      return (
        <div 
          key={p.id} 
          className={`relative w-full h-full overflow-hidden rounded-xl flex items-center justify-center ${customClass}`}
          style={{
            backgroundColor: '#0F1115',
            backgroundImage: chromaKeyEnabled ? `url(${virtualBg})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
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
                transformOrigin: 'center',
                transition: 'transform 0.05s ease-out',
                filter: chromaKeyEnabled ? 'url(#chromakey-filter)' : 'none'
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center text-[var(--color-brand)] mb-3 animate-pulse">
                <User size={32} />
              </div>
              <p className="text-sm font-semibold text-[var(--ink-hi)]">Marcos (Você)</p>
              <p className="text-[10px] text-[var(--ink-lo)]">Câmera Desativada</p>
            </div>
          )}
          {/* Label Tag */}
          <div 
            style={{ backgroundColor: streamColor }}
            className="absolute bottom-3 left-3 px-3 py-1 rounded text-[10px] font-bold shadow-md text-[var(--ink-hi)] tracking-wide"
          >
            Marcos (Palestrante)
          </div>
        </div>
      );
    }

    if ((p as any).isVideoClip && activeVideoClip) {
      return (
        <div key={p.id} className={`relative w-full h-full bg-black overflow-hidden rounded-xl flex items-center justify-center ${customClass}`}>
          {activeVideoClip.url ? (
            <video
              src={activeVideoClip.url}
              autoPlay
              loop={!isPlaylistActive}
              
              playsInline
              controls
              className="w-full h-full object-cover"
              onEnded={onVideoClipEnded}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mb-3 animate-pulse">
                <Video size={32} />
              </div>
              <p className="text-sm font-semibold text-[var(--ink-hi)]">Vídeo: {activeVideoClip.name}</p>
              <p className="text-[10px] text-[var(--ink-lo)]">Reproduzindo no estúdio</p>
            </div>
          )}
          {/* Label Tag */}
          <div 
            style={{ backgroundColor: streamColor }}
            className="absolute bottom-3 left-3 px-3 py-1 rounded text-[10px] font-bold shadow-md text-[var(--ink-hi)] tracking-wide z-10 flex items-center gap-1"
          >
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
            <span>CLIPE DE VÍDEO ATIVO</span>
          </div>
        </div>
      );
    }

    if ((p as any).isSlides && activeSlide) {
      return (
        <div key={p.id} className={`relative w-full h-full bg-[var(--bg)] overflow-hidden rounded-xl flex flex-col justify-between border border-[var(--line)]/80 ${customClass}`}>
          {/* Slide Header */}
          <div className="bg-[var(--surface)]/90 px-4 py-2 flex items-center justify-between border-b border-[var(--line)] z-10">
            <div className="flex items-center gap-2">
              <Presentation size={14} className="text-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase text-[var(--ink)] truncate max-w-[160px] tracking-wider">{activeSlide.name}</span>
            </div>
            <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              PÁGINA {activeSlide.currentPage} de {activeSlide.totalPages}
            </span>
          </div>

          {/* Dynamic Content */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-gradient-to-br from-[var(--bg)] to-[var(--well)] relative overflow-hidden">
            {/* Ambient visual background glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

            {activeSlide.currentPage === 1 && (
              <div className="space-y-2 animate-in fade-in duration-300 z-10">
                <Sparkles size={36} className="text-emerald-400 mx-auto mb-2 animate-pulse" />
                <h2 className="text-base font-black text-[var(--ink-hi)] tracking-tight">Planejamento Estratégico & Metas</h2>
                <p className="text-[11px] text-[var(--ink-lo)] max-w-sm mx-auto leading-relaxed">Evolução do mercado corporativo, canais de streaming e estratégias digitais de alta performance.</p>
              </div>
            )}
            {activeSlide.currentPage === 2 && (
              <div className="space-y-3 w-full max-w-xs animate-in slide-in-from-right duration-300 z-10">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-lo)]">Público-Alvo & Engajamento</h2>
                <div className="h-2 w-full bg-[var(--panel)] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }} />
                </div>
                <p className="text-[10px] text-[var(--ink-lo)] leading-normal">85% dos usuários interagem ativamente através do chat integrado ou perguntas e respostas.</p>
              </div>
            )}
            {activeSlide.currentPage >= 3 && (
              <div className="space-y-2 animate-in zoom-in-95 duration-300 z-10">
                <Activity size={32} className="text-blue-400 mx-auto mb-1 animate-pulse" />
                <h2 className="text-[11px] font-bold text-[var(--ink-hi)] uppercase tracking-wider">Crescimento de Audiência</h2>
                <p className="text-[10px] text-[var(--ink-lo)] max-w-xs leading-normal">Análise preditiva de métricas em tempo real e canais de distribuição CDN unificados de alta disponibilidade.</p>
              </div>
            )}
          </div>

          {/* Slide Footer */}
          <div className="bg-[var(--bg)] px-4 py-1.5 flex items-center justify-between text-[8px] font-mono text-[var(--ink-dim)] border-t border-[var(--line)] z-10">
            <span>PwStreamer Presentations™</span>
            <span>Apresentado por Marcos (Palestrante)</span>
          </div>
        </div>
      );
    }

    if (p.isScreenShare) {
      const hasMockUI = selectedSharedSource && (
        selectedSharedSource.type === 'pdf' ||
        selectedSharedSource.type === 'video' ||
        ['PwStreamer', 'Caixa', 'Powerpoint', 'Como funciona'].some(key => selectedSharedSource.name.includes(key))
      );

      return (
        <div key={p.id} className={`relative w-full h-full bg-[var(--surface)] overflow-hidden rounded-xl flex items-center justify-center ${customClass}`}>
          {screenStream && !hasMockUI ? (
            <video
              ref={(el) => {
                if (el && screenStream && el.srcObject !== screenStream) {
                  el.srcObject = screenStream;
                }
              }}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain"
            />
          ) : selectedSharedSource ? (
            <div className="w-full h-full bg-[var(--bg)] text-[var(--ink-hi)] flex flex-col overflow-hidden select-none font-sans">
              
              {/* Simulated browser search bar / top window header */}
              <div className="bg-[var(--surface)] border-b border-[var(--line)] px-3.5 py-1.5 flex items-center gap-3 shrink-0">
                <div className="flex gap-1.5 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                </div>
                <div className="bg-[var(--surface)]/90 border border-[var(--line)] rounded px-3 py-0.5 text-[10px] text-[var(--ink-lo)] flex items-center gap-1.5 flex-1 max-w-md mx-auto">
                  <Globe size={10} className="text-blue-400" />
                  <span className="truncate">https://{selectedSharedSource.name.includes('PwStreamer') ? 'pwstreamer.com' : selectedSharedSource.name.includes('Caixa') ? 'mail.google.com' : 'app.restream.io'}/studio</span>
                </div>
                <span className="text-[9px] font-mono text-[var(--ink-dim)] uppercase font-black tracking-widest bg-[var(--surface)]/60 px-1.5 py-0.5 rounded border border-[var(--line)] shrink-0">
                  {selectedSharedSource.type === 'tab' ? 'Guia' : selectedSharedSource.type === 'window' ? 'Janela' : selectedSharedSource.type === 'screen' ? 'Tela' : selectedSharedSource.type === 'pdf' ? 'PDF' : 'Vídeo'}
                </span>
              </div>

              {/* Mock content rendering according to selection */}
              <div className="flex-1 flex overflow-hidden bg-[var(--bg)]">
                
                {/* 1. PWSTREAMER MOCK */}
                {selectedSharedSource.name.includes('PwStreamer') && (
                  <div className="flex-1 flex overflow-hidden">
                    {/* Main content */}
                    <div className="flex-[3] p-4 flex flex-col justify-between border-r border-[var(--line)] bg-gradient-to-b from-[var(--surface)] to-[var(--bg)]">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded bg-rose-600/15 text-rose-500">
                            <Compass size={14} />
                          </div>
                          <span className="text-xs font-black tracking-wider uppercase text-[var(--ink)]">PwStreamer Live Studio</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-[10px] font-semibold text-emerald-400 font-mono">1,402 ONLINE</span>
                        </div>
                      </div>

                      {/* Animated live statistics or slideshow mockup */}
                      <div className="flex-1 rounded-xl bg-[var(--surface)]/60 border border-[var(--line)] p-4 flex flex-col justify-center text-center space-y-3 relative overflow-hidden">
                        <div className="absolute top-2 right-2 flex items-center gap-1 text-[8px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold">
                          <Activity size={8} /> METRICS UPDATE
                        </div>
                        <h4 className="text-sm font-black text-[var(--ink-hi)] tracking-tight">Estratégias de Engajamento 2026</h4>
                        <p className="text-[10px] text-[var(--ink-lo)] max-w-sm mx-auto leading-relaxed">
                          A evolução dos webinars corporativos e o uso de inteligência artificial generativa em tempo real.
                        </p>
                        
                        {/* Micro visual bars dashboard */}
                        <div className="grid grid-cols-4 gap-2.5 max-w-xs mx-auto pt-2">
                          {[
                            { label: 'Retenção', val: '84%', color: 'bg-rose-500' },
                            { label: 'Interação', val: '92%', color: 'bg-amber-500' },
                            { label: 'Chat Q&A', val: '148', color: 'bg-blue-500' },
                            { label: 'Conversão', val: '18.5%', color: 'bg-emerald-500' }
                          ].map(metric => (
                            <div key={metric.label} className="bg-[var(--bg)]/70 border border-[var(--line)]/80 p-2 rounded-lg text-center">
                              <span className="text-[7px] text-[var(--ink-dim)] block uppercase font-bold">{metric.label}</span>
                              <span className="text-[11px] font-black font-mono text-[var(--ink-hi)] mt-0.5 block">{metric.val}</span>
                              <div className="w-full h-1 bg-[var(--surface)] rounded-full mt-1.5 overflow-hidden">
                                <div className={`h-full ${metric.color} rounded-full`} style={{ width: '75%' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Chat Sidebar */}
                    <div className="flex-1 bg-[var(--bg)] p-3 flex flex-col justify-between text-[9px] text-[var(--ink-lo)]">
                      <div className="border-b border-[var(--line)] pb-2 mb-2 flex items-center justify-between">
                        <span className="font-extrabold text-[var(--ink-hi)] flex items-center gap-1.5 uppercase tracking-wide">
                          <MessageSquare size={10} className="text-rose-500" /> Bate-papo (Guia)
                        </span>
                        <span className="bg-[var(--panel)]/80 text-[8px] font-bold px-1 rounded text-[var(--ink)]">Chat</span>
                      </div>
                      
                      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                        <div className="bg-[var(--surface)]/50 p-2 rounded border border-[var(--line)]/40">
                          <strong className="text-rose-400">Ana Souza:</strong> Olá Marcos! Webinar fantástico!
                        </div>
                        <div className="bg-[var(--surface)]/50 p-2 rounded border border-[var(--line)]/40">
                          <strong className="text-amber-400">Carlos Lima:</strong> O recurso de lousa digital está excelente.
                        </div>
                        <div className="bg-[var(--surface)]/50 p-2 rounded border border-[var(--line)]/40">
                          <strong className="text-sky-400">Marcos:</strong> Obrigado pessoal! Próximo slide em instantes.
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-[var(--line)] text-[8px] text-[var(--ink-dim)] text-center uppercase tracking-wider font-bold">
                        Enviando como restream-bot
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. GMAIL MOCK */}
                {selectedSharedSource.name.includes('Caixa') && (
                  <div className="flex-1 flex overflow-hidden">
                    {/* Gmail Sidebar */}
                    <div className="w-1/4 bg-[var(--surface)] p-3 border-r border-[var(--line)]/80 flex flex-col justify-between">
                      <div className="space-y-1 text-[10px]">
                        <div className="bg-rose-500/15 text-rose-400 px-3 py-1.5 rounded-lg font-black tracking-wide text-center uppercase mb-3 border border-rose-500/10">
                          ✉️ Escrever
                        </div>
                        <div className="bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded font-bold flex items-center justify-between">
                          <span>📥 Entrada</span>
                          <span className="text-[8px] font-mono font-black bg-blue-500 text-white px-1.5 rounded-full">192</span>
                        </div>
                        <div className="hover:bg-[var(--panel)]/40 text-[var(--ink-lo)] px-2.5 py-1 rounded">⭐ Com Estrela</div>
                        <div className="hover:bg-[var(--panel)]/40 text-[var(--ink-lo)] px-2.5 py-1 rounded">📤 Enviados</div>
                        <div className="hover:bg-[var(--panel)]/40 text-[var(--ink-lo)] px-2.5 py-1 rounded">📝 Rascunhos</div>
                      </div>
                      <span className="text-[7px] text-[var(--ink-dim)] font-mono text-center block">Google Workspace</span>
                    </div>

                    {/* Gmail List */}
                    <div className="flex-1 p-3 bg-[var(--bg)] flex flex-col">
                      <div className="border-b border-[var(--line)]/60 pb-2 mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[var(--ink)]">Caixa de Entrada (mgdlms@gmail.com)</span>
                        <span className="text-[8px] text-[var(--ink-dim)]">Filtrado por: Mais Recentes</span>
                      </div>
                      
                      <div className="flex-1 space-y-1.5 overflow-y-auto">
                        {[
                          { sender: 'Vega6 Dev Team', title: '🚀 Deploy do pwstreamer-studio concluído com sucesso', time: '11:45', desc: 'Olá Marcos, seu ambiente de desenvolvimento foi compilado e publicado.' },
                          { sender: 'PwStreamer Support', title: '🎓 Confirmação de Palestrante Convidado', time: '10:30', desc: 'Olá! Gostaríamos de confirmar os dados de acesso para a transmissão de hoje.' },
                          { sender: 'Marcos (Você)', title: '📝 Pauta da Transmissão da Comunidade', time: 'Ontem', desc: 'Olá time, segue a pauta e os tópicos que abordaremos na apresentação.' },
                          { sender: 'Felipe Ramos', title: '⚡ Feedback da nova Lousa Digital', time: 'Ontem', desc: 'Impressionante como os traços ficaram responsivos e sem latência na transmissão.' }
                        ].map((email, idx) => (
                          <div key={idx} className="bg-[var(--surface)]/60 border border-[var(--line)]/60 p-2 rounded-lg hover:border-blue-500/40 transition-all flex items-start gap-2.5">
                            <span className="text-[11px] shrink-0 mt-0.5">✉️</span>
                            <div className="flex-1 min-w-0 text-[9px]">
                              <div className="flex justify-between font-bold text-[var(--ink-hi)]">
                                <span className="truncate">{email.sender}</span>
                                <span className="text-[var(--ink-dim)] font-mono text-[8px]">{email.time}</span>
                              </div>
                              <p className="text-blue-400 font-medium truncate mt-0.5">{email.title}</p>
                              <p className="text-[var(--ink-lo)] truncate mt-0.5 text-[8px]">{email.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. POWERPOINT MOCK */}
                {selectedSharedSource.name.includes('Powerpoint') && (
                  <div className="flex-1 flex flex-col bg-[var(--surface)]/20 p-4 justify-between font-sans">
                    {/* PowerPoint top menu simulation */}
                    <div className="flex justify-between items-center border-b border-orange-500/20 pb-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-orange-600 text-white font-extrabold text-[9px] tracking-wide uppercase">P</span>
                        <span className="text-xs font-bold text-[var(--ink-hi)]">Powerpoint - Apresentação de Vendas.pptx [Modo de Exibição]</span>
                      </div>
                      <span className="text-[8px] text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 shrink-0">SLIDE {pdfCurrentPage} / 12</span>
                    </div>

                    {/* Slide main graphics */}
                    <div className="flex-1 bg-[var(--bg)]/60 border border-[var(--line)] rounded-xl p-4 flex flex-col justify-center text-center space-y-4">
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono tracking-widest text-orange-500 font-black uppercase">
                          {pdfCurrentPage === 1 && "Apresentação de Abertura"}
                          {pdfCurrentPage === 2 && "Estatísticas de Vendas"}
                          {pdfCurrentPage === 3 && "Retenção & CSAT"}
                          {pdfCurrentPage === 4 && "Suporte de Alto Nível"}
                          {pdfCurrentPage === 5 && "Novos Recursos de Transmissão"}
                          {pdfCurrentPage === 6 && "Otimização de Infraestrutura"}
                          {pdfCurrentPage === 7 && "Escala Enterprise"}
                          {pdfCurrentPage === 8 && "ROI e Custos"}
                          {pdfCurrentPage === 9 && "Cronograma Geral"}
                          {pdfCurrentPage === 10 && "SLA de Transmissão"}
                          {pdfCurrentPage === 11 && "FAQ de Suporte"}
                          {pdfCurrentPage === 12 && "Fechamento & Contato"}
                        </span>
                        <h3 className="text-base font-extrabold text-[var(--ink-hi)] tracking-tight">
                          {pdfCurrentPage === 1 && "Estratégia de Expansão Global Vega6"}
                          {pdfCurrentPage === 2 && "Vega6: Métricas de Crescimento 2026"}
                          {pdfCurrentPage === 3 && "Retenção de Clientes e Crescimento YoY"}
                          {pdfCurrentPage === 4 && "Pontuação CSAT e Satisfação do Cliente"}
                          {pdfCurrentPage === 5 && "Transmissão em Baixíssima Latência"}
                          {pdfCurrentPage === 6 && "Eficiência Operacional em Nuvem"}
                          {pdfCurrentPage === 7 && "Expansão de Pacotes Corporativos"}
                          {pdfCurrentPage === 8 && "Redução de Custos de CDN"}
                          {pdfCurrentPage === 9 && "Marcos de Desenvolvimento Q3-Q4"}
                          {pdfCurrentPage === 10 && "Suporte 24/7 com SLA de 99.9%"}
                          {pdfCurrentPage === 11 && "Canais de Atendimento Prioritários"}
                          {pdfCurrentPage === 12 && "Perguntas & Respostas (Q&A)"}
                        </h3>
                        <p className="text-[10px] text-[var(--ink-lo)] max-w-md mx-auto">
                          {pdfCurrentPage === 1 && "Bem-vindo à apresentação executiva do plano de aceleração corporativa para o ano de 2026."}
                          {pdfCurrentPage === 2 && "Demonstração das estatísticas consolidadas do último trimestre da plataforma."}
                          {pdfCurrentPage === 3 && "Foco absoluto em diminuir o Churn rate e expandir o Net Promoter Score por meio de ferramentas interativas."}
                          {pdfCurrentPage === 4 && "Análise comparativa das taxas de cliques, retenção em webinars ao vivo e volume de mensagens enviadas."}
                          {pdfCurrentPage === 5 && "Por que nossa tecnologia de transmissão de baixíssima latência é o pilar principal de retenção."}
                          {pdfCurrentPage === 6 && "Redução de custos de banda através de otimização de codecs de codificação em tempo real."}
                          {pdfCurrentPage === 7 && "Projeção de expansão de pacotes enterprise e expansão de faturamento por assentos adicionais."}
                          {pdfCurrentPage === 8 && "Redução de custos de banda através de otimização de codecs de codificação em tempo real."}
                          {pdfCurrentPage === 9 && "Visão geral de crescimento líquido estimado de 2.4M USD até o fechamento de dezembro."}
                          {pdfCurrentPage === 10 && "Fases de testes beta, auditoria de segurança de dados e implantação em servidores CDN."}
                          {pdfCurrentPage === 11 && "Monitoramento proativo e canais de comunicação direta de alta prioridade para contas VIP."}
                          {pdfCurrentPage === 12 && "Abriremos espaço para que palestrantes e convidados do estúdio tragam suas perguntas."}
                        </p>
                      </div>

                      {/* Charts and columns */}
                      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto w-full">
                        <div className="bg-[var(--surface)]/80 border border-[var(--line)] p-2.5 rounded-lg text-center">
                          <span className="text-[8px] text-[var(--ink-lo)] block uppercase font-bold">Crescimento MRR</span>
                          <span className="text-xs font-black text-emerald-400 block mt-0.5">+{30 + pdfCurrentPage * 2}% YoY</span>
                          <div className="h-1 bg-[var(--bg)] rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${60 + pdfCurrentPage * 3}%` }} />
                          </div>
                        </div>
                        <div className="bg-[var(--surface)]/80 border border-[var(--line)] p-2.5 rounded-lg text-center">
                          <span className="text-[8px] text-[var(--ink-lo)] block uppercase font-bold">Retenção de Clientes</span>
                          <span className="text-xs font-black text-amber-400 block mt-0.5">{90 + (pdfCurrentPage * 0.4).toFixed(1)}%</span>
                          <div className="h-1 bg-[var(--bg)] rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: `${80 + pdfCurrentPage * 1.5}%` }} />
                          </div>
                        </div>
                        <div className="bg-[var(--surface)]/80 border border-[var(--line)] p-2.5 rounded-lg text-center">
                          <span className="text-[8px] text-[var(--ink-lo)] block uppercase font-bold">Suporte CSAT</span>
                          <span className="text-xs font-black text-sky-400 block mt-0.5">{(4.0 + pdfCurrentPage * 0.08).toFixed(1)} / 5.0</span>
                          <div className="h-1 bg-[var(--bg)] rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-sky-500" style={{ width: `${70 + pdfCurrentPage * 2}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[8px] text-[var(--ink-dim)] pt-1.5 border-t border-[var(--line)]/40 shrink-0">
                      <span>Navegação do Apresentador</span>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => setPdfCurrentPage(prev => Math.max(1, prev - 1))}
                          className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--panel)] cursor-pointer text-[8px]"
                        >
                          Anterior
                        </button>
                        <button 
                          onClick={() => setPdfCurrentPage(prev => Math.min(12, prev + 1))}
                          className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--panel)] cursor-pointer text-[8px]"
                        >
                          Próximo
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. YOUTUBE MOCK */}
                {selectedSharedSource.name.includes('Como funciona') && (
                  <div className="flex-1 flex flex-col bg-[var(--bg)] p-4 justify-between">
                    <div className="flex justify-between items-center border-b border-red-500/10 pb-1.5 mb-2">
                      <span className="text-xs font-bold text-[var(--ink-hi)] flex items-center gap-1.5"><Youtube size={14} className="text-red-500" /> YouTube Premium Player</span>
                      <span className="text-[8px] bg-red-600 text-white font-bold px-1.5 rounded uppercase">Reproduzindo</span>
                    </div>

                    <div className="flex-1 bg-[var(--surface)]/80 border border-[var(--line)] rounded-xl overflow-hidden flex flex-col justify-between p-3 relative">
                      {/* Video Simulated Poster/Illustration */}
                      <div className="flex-1 flex flex-col justify-center items-center text-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-red-600/10 flex items-center justify-center text-red-500">
                          <Play size={16} fill="currentColor" />
                        </div>
                        <h4 className="text-[11px] font-black text-[var(--ink-hi)] px-4">Como funciona a tecnologia x prevenção na saúde inteligente</h4>
                        <p className="text-[9px] text-[var(--ink-lo)]">Vega6 Webinars & Palestras Acadêmicas</p>
                      </div>

                      {/* YouTube Player Controller Bar */}
                      <div className="bg-black/80 p-2 rounded-lg border border-[var(--line)] mt-2 space-y-1 text-[8px] text-[var(--ink-lo)]">
                        <div className="w-full h-1 bg-[var(--panel)] rounded-full overflow-hidden">
                          <div className="w-1/3 h-full bg-red-600" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span>04:12 / 12:45</span>
                          <span>1080p HD</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. PDF SLIDESHOW TEMPLATE */}
                {selectedSharedSource.type === 'pdf' && (
                  <div className="flex-1 flex flex-col justify-between p-4 bg-gradient-to-br from-[var(--bg)] to-[var(--well)] min-h-0">
                    <div className="flex justify-between items-center border-b border-orange-500/20 pb-2 mb-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="p-1 px-1.5 rounded bg-orange-600 text-white font-black text-[9px] tracking-wide uppercase shrink-0">PDF</span>
                        <span className="text-[11px] font-bold text-[var(--ink-hi)] truncate max-w-sm">{selectedSharedSource.name}</span>
                      </div>
                      <span className="text-[8px] text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 shrink-0">SLIDE {pdfCurrentPage} DE 12</span>
                    </div>

                    <div className="flex-1 bg-[var(--bg)]/70 border border-[var(--line)] rounded-xl p-3 flex flex-col justify-center text-center space-y-2 relative group min-h-0 overflow-hidden">
                      <button aria-label="Página anterior" 
                        onClick={() => setPdfCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={pdfCurrentPage === 1}
                        className={`absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-[var(--panel)]/80 hover:bg-[var(--raise)] text-white transition-all shadow z-10 ${
                          pdfCurrentPage === 1 ? 'opacity-20 cursor-not-allowed' : 'opacity-100 cursor-pointer'
                        }`}
                      >
                        <ChevronLeft size={14} />
                      </button>

                      <button aria-label="Próxima página" 
                        onClick={() => setPdfCurrentPage(prev => Math.min(12, prev + 1))}
                        disabled={pdfCurrentPage === 12}
                        className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-[var(--panel)]/80 hover:bg-[var(--raise)] text-[var(--ink-hi)] transition-all shadow z-10 ${
                          pdfCurrentPage === 12 ? 'opacity-20 cursor-not-allowed' : 'opacity-100 cursor-pointer'
                        }`}
                      >
                        <ChevronRight size={14} />
                      </button>

                      <div className="space-y-1 animate-in fade-in duration-150">
                        <span className="text-[8px] font-mono tracking-widest text-orange-500 font-extrabold uppercase block">
                          {pdfCurrentPage === 1 && "Apresentação de Abertura"}
                          {pdfCurrentPage === 2 && "Objetivos Estratégicos"}
                          {pdfCurrentPage === 3 && "Mercado e Demografia"}
                          {pdfCurrentPage === 4 && "Estatísticas Consolidadas"}
                          {pdfCurrentPage === 5 && "Plano de Marketing 2026"}
                          {pdfCurrentPage === 6 && "Análise da Concorrência"}
                          {pdfCurrentPage === 7 && "Modelos de Receita"}
                          {pdfCurrentPage === 8 && "Estrutura de Custos"}
                          {pdfCurrentPage === 9 && "Projeção de Lucro Semestral"}
                          {pdfCurrentPage === 10 && "Cronograma de Lançamento"}
                          {pdfCurrentPage === 11 && "Garantia de Qualidade"}
                          {pdfCurrentPage === 12 && "Conclusão & Próximos Passos"}
                        </span>

                        <h3 className="text-sm font-black text-[var(--ink-hi)] tracking-tight leading-snug">
                          {pdfCurrentPage === 1 && "Estratégia de Expansão Global Vega6"}
                          {pdfCurrentPage === 2 && "Maximização de Engajamento & Retenção"}
                          {pdfCurrentPage === 3 && "Análise Demográfica do Público-Alvo"}
                          {pdfCurrentPage === 4 && "Resultados e Métricas Trimestrais"}
                          {pdfCurrentPage === 5 && "Canais de Aquisição Multicanal"}
                          {pdfCurrentPage === 6 && "Vantagem Competitiva Exclusiva"}
                          {pdfCurrentPage === 7 && "Escalabilidade de SaaS Recorrente"}
                          {pdfCurrentPage === 8 && "Eficiência Operacional & Custo de Infra"}
                          {pdfCurrentPage === 9 && "Crescimento Líquido Projetado"}
                          {pdfCurrentPage === 10 && "Marcos de Desenvolvimento Q3-Q4"}
                          {pdfCurrentPage === 11 && "Suporte ao Cliente & SLA de 99.9%"}
                          {pdfCurrentPage === 12 && "Sessão de Perguntas & Respostas (Q&A)"}
                        </h3>

                        <p className="text-[10px] text-[var(--ink-lo)] max-w-md mx-auto leading-normal">
                          {pdfCurrentPage === 1 && "Bem-vindo à apresentação executiva do plano de aceleração corporativa para o ano de 2026."}
                          {pdfCurrentPage === 2 && "Foco absoluto em diminuir o Churn rate e expandir o Net Promoter Score por meio de ferramentas interativas."}
                          {pdfCurrentPage === 3 && "Identificação dos segmentos de usuários com maior propensão de conversão para planos anuais."}
                          {pdfCurrentPage === 4 && "Análise comparativa das taxas de cliques, retenção em webinars ao vivo e volume de mensagens enviadas."}
                          {pdfCurrentPage === 5 && "Lançamento de campanhas via Google Ads, tráfego orgânico, marketing de influência e parcerias com agências."}
                          {pdfCurrentPage === 6 && "Por que nossa tecnologia de transmissão de baixíssima latência é o pilar principal de retenção."}
                          {pdfCurrentPage === 7 && "Projeção de expansão de pacotes enterprise e expansão de faturamento por assentos adicionais."}
                          {pdfCurrentPage === 8 && "Redução de custos de banda através de otimização de codecs de codificação em tempo real."}
                          {pdfCurrentPage === 9 && "Visão geral de crescimento líquido estimado de 2.4M USD até o fechamento de dezembro."}
                          {pdfCurrentPage === 10 && "Fases de testes beta, auditoria de segurança de dados e implantação em servidores CDN."}
                          {pdfCurrentPage === 11 && "Monitoramento proativo e canais de comunicação direta de alta prioridade para contas VIP."}
                          {pdfCurrentPage === 12 && "Abriremos espaço para que palestrantes e convidados do estúdio tragam suas perguntas."}
                        </p>
                      </div>

                      {pdfCurrentPage % 2 === 0 && (
                        <div className="grid grid-cols-4 gap-1.5 max-w-xs mx-auto w-full pt-1">
                          <div className="bg-[var(--surface)] border border-[var(--line)] p-1 rounded-lg text-center">
                            <span className="text-[6px] text-[var(--ink-dim)] block uppercase font-bold">Conversão</span>
                            <span className="text-[8px] font-bold text-emerald-400 block font-mono">14.2%</span>
                          </div>
                          <div className="bg-[var(--surface)] border border-[var(--line)] p-1 rounded-lg text-center">
                            <span className="text-[6px] text-[var(--ink-dim)] block uppercase font-bold">Interações</span>
                            <span className="text-[8px] font-bold text-rose-400 block font-mono">82/min</span>
                          </div>
                          <div className="bg-[var(--surface)] border border-[var(--line)] p-1 rounded-lg text-center">
                            <span className="text-[6px] text-[var(--ink-dim)] block uppercase font-bold">Tempo Médio</span>
                            <span className="text-[8px] font-bold text-blue-400 block font-mono">48m</span>
                          </div>
                          <div className="bg-[var(--surface)] border border-[var(--line)] p-1 rounded-lg text-center">
                            <span className="text-[6px] text-[var(--ink-dim)] block uppercase font-bold">Suporte</span>
                            <span className="text-[8px] font-bold text-amber-400 block font-mono">99.9%</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[8px] text-[var(--ink-dim)] pt-1.5 border-t border-[var(--line)]/40 shrink-0">
                      <span>Navegação do Apresentador</span>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => setPdfCurrentPage(prev => Math.max(1, prev - 1))}
                          className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--panel)] cursor-pointer text-[8px]"
                        >
                          Anterior
                        </button>
                        <button 
                          onClick={() => setPdfCurrentPage(prev => Math.min(12, prev + 1))}
                          className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--panel)] cursor-pointer text-[8px]"
                        >
                          Próximo
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. VIDEO PLAYBACK TEMPLATE */}
                {selectedSharedSource.type === 'video' && (
                  <div className="flex-1 flex flex-col bg-black justify-between relative min-h-0">
                    {selectedSharedSource.fileUrl ? (
                      <video 
                        src={selectedSharedSource.fileUrl}
                        controls
                        autoPlay
                        loop
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex-1 flex flex-col justify-between p-4 bg-[var(--well)] text-[var(--ink-hi)] font-sans min-h-0">
                        <div className="flex justify-between items-center border-b border-emerald-500/20 pb-1.5 mb-2 shrink-0">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className="p-0.5 px-1.5 rounded bg-emerald-600 text-white font-black text-[9px] tracking-wide uppercase shrink-0">VIDEO</span>
                            <span className="text-[11px] font-bold text-[var(--ink-hi)] truncate max-w-sm">{selectedSharedSource.name}</span>
                          </div>
                          <span className="text-[8px] bg-emerald-600 text-white font-bold px-1.5 rounded uppercase animate-pulse shrink-0">REPRODUZINDO</span>
                        </div>

                        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-2 p-3 bg-[var(--bg)]/60 border border-[var(--line)] rounded-xl min-h-0">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 animate-pulse shrink-0">
                            <Play size={16} fill="currentColor" />
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="text-[11px] font-extrabold text-[var(--ink-hi)]">Transmissão de Vídeo Digital Ativa</h4>
                            <p className="text-[9px] text-[var(--ink-lo)] max-w-xs leading-normal">
                              O reprodutor está processando áudio e vídeo integrados no palco de streaming.
                            </p>
                          </div>
                        </div>

                        <div className="bg-[var(--bg)]/80 p-2 rounded-lg border border-[var(--line)] mt-2 flex items-center justify-between gap-3 text-[8px] font-mono text-[var(--ink-lo)] shrink-0">
                          <span>01:45 / 03:00</span>
                          <div className="flex-1 h-1 bg-[var(--panel)] rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[58%]" />
                          </div>
                          <span>1080p Stream</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 7. GENERAL / FALLBACK TEMPLATE */}
                {selectedSharedSource.type !== 'pdf' && selectedSharedSource.type !== 'video' && !['PwStreamer', 'Caixa', 'Powerpoint', 'Como funciona'].some(key => selectedSharedSource.name.includes(key)) && (
                  <div className="flex-1 flex flex-col justify-between p-4 bg-gradient-to-br from-[var(--bg)] to-[var(--well)] min-h-0">
                    <div className="flex justify-between items-center border-b border-[var(--line)] pb-2 shrink-0">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Monitor size={12} className="text-blue-400 shrink-0" />
                        <span className="text-xs font-bold text-[var(--ink-hi)] truncate max-w-xs">{selectedSharedSource.name}</span>
                      </div>
                      <span className="text-[8px] font-mono font-bold text-[var(--ink-lo)] shrink-0">DISPOSITIVO VIRTUAL</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center items-center text-center space-y-2 p-3 bg-[var(--surface)]/30 border border-[var(--line)]/50 rounded-xl my-2 min-h-0">
                      <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 animate-pulse shrink-0">
                        <Activity size={16} />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-[11px] font-extrabold text-[var(--ink-hi)]">Transmissão Compartilhada Ativa</h4>
                        <p className="text-[9px] text-[var(--ink-lo)] max-w-xs mx-auto">Sua tela está sendo transmitida em tempo real para os servidores de distribuição.</p>
                      </div>
                    </div>

                    <div className="text-[8px] text-[var(--ink-dim)] text-center font-mono uppercase tracking-wide shrink-0">
                      Compartilhamento de Áudio: {selectedSharedSource.audioShared ? 'ATIVADO' : 'DESATIVADO'}
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center bg-gradient-to-br from-[var(--bg)] to-[var(--surface)] p-6">
              <Monitor size={48} className="text-[var(--color-brand)] mb-3 animate-pulse" />
              <p className="text-sm font-semibold text-[var(--ink-hi)]">Compartilhamento de Tela Ativo</p>
              <p className="text-[11px] text-[var(--ink-lo)] max-w-xs mt-1">Exibindo slides ou janelas do apresentador para os participantes.</p>
            </div>
          )}
          {/* Label Tag */}
          <div className="absolute bottom-3 left-3 px-3 py-1 rounded text-[10px] font-bold shadow-md bg-black/60 text-[var(--ink-hi)] tracking-wide flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[var(--color-brand-deep)] rounded-full animate-ping"></span>
            <span>Tela Compartilhada</span>
            {selectedSharedSource && (
              <span className="text-[var(--ink-lo)] font-mono text-[9px] border-l border-[var(--line-ctl)] pl-1.5 ml-0.5">
                {selectedSharedSource.resolution || '1080p'} @ {selectedSharedSource.frameRate ? selectedSharedSource.frameRate.replace('fps', ' FPS') : '30 FPS'}
              </span>
            )}
          </div>
        </div>
      );
    }

    // Guest participant
    return (
      <div key={p.id} className={`relative w-full h-full bg-[var(--bg)] overflow-hidden rounded-xl flex items-center justify-center ${customClass}`}>
        <div className="flex flex-col items-center justify-center text-center p-4">
          <img 
            src={p.avatarUrl} 
            alt={p.name} 
            className="w-16 h-16 rounded-full object-cover border-2 border-dashed border-[var(--line-ctl)] mb-2 animate-pulse"
            referrerPolicy="no-referrer"
          />
          <p className="text-xs font-semibold text-[var(--ink-hi)]">{p.name}</p>
          <p className="text-[9px] text-blue-400 flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Convidado Conectado
          </p>
        </div>
        {/* Label Tag */}
        <div className="absolute bottom-3 left-3 px-3 py-1 rounded text-[10px] font-bold shadow-md bg-black/50 text-[var(--ink-hi)] tracking-wide">
          {p.name}
        </div>
      </div>
    );
  };

  // Helper to render draggable speaker card for presentation and PIP
  const renderDraggableSpeakerCard = (camFeed: Participant) => {
    const isCircle = speakerCardShape === 'circle';
    const isCompact = speakerCardShape === 'compact';

    let dimensionClasses = 'w-48 h-32';
    if (isCircle) {
      dimensionClasses = 'w-36 h-36';
    } else if (isCompact) {
      dimensionClasses = 'w-40 h-26';
    } else {
      dimensionClasses = 'w-48 h-32';
    }

    return (
      <div 
        key={`draggable-speaker-${camFeed.id}`}
        onMouseEnter={() => setIsHoveringSpeakerCard(true)}
        onMouseLeave={() => setIsHoveringSpeakerCard(false)}
        style={{
          left: `${speakerCardPos.x}%`,
          top: `${speakerCardPos.y}%`,
          transform: `scale(${speakerCardScale})`,
          transformOrigin: 'top left',
          touchAction: 'none'
        }}
        className={`absolute z-30 shadow-2xl transition-shadow select-none group/speakercard ${dimensionClasses} ${
          isDraggingSpeakerCard ? 'ring-4 ring-blue-400 ring-opacity-80 cursor-grabbing' : ''
        }`}
      >
        {/* Main Card Content */}
        <div 
          className={`w-full h-full relative overflow-hidden bg-[var(--bg)] border-2 transition-all ${
            isCircle ? 'rounded-full' : isCompact ? 'rounded-lg' : 'rounded-xl'
          } ${
            isHoveringSpeakerCard || isDraggingSpeakerCard 
              ? 'border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.6)]' 
              : 'border-blue-500/90 shadow-2xl'
          }`}
        >
          {renderParticipantFeed(camFeed, isCircle ? 'rounded-full' : '')}

          {/* Drag Overlay Handle */}
          <div 
            onMouseDown={startDragSpeakerCard}
            onTouchStart={startDragSpeakerCard}
            title="Arraste para reposicionar o card do palestrante em qualquer lugar"
            className={`absolute inset-0 z-20 flex flex-col justify-between p-1.5 transition-opacity cursor-grab active:cursor-grabbing ${
              isDraggingSpeakerCard ? 'bg-blue-600/15' : 'bg-transparent hover:bg-black/25'
            }`}
          >
            {/* Top Bar with Drag Grip & Quick Scale Tools */}
            <div className="flex items-center justify-between opacity-0 group-hover/speakercard:opacity-100 transition-opacity bg-black/85 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 text-[var(--ink-hi)] text-[9px] pointer-events-auto">
              <span className="flex items-center gap-1 font-bold text-[8px] uppercase tracking-wider text-blue-300">
                <Move size={10} className="animate-pulse" />
                <span>Mover</span>
              </span>
              
              <div className="flex items-center gap-1">
                {/* Scale buttons */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSpeakerCardScale(prev => Math.max(0.6, Number((prev - 0.1).toFixed(1))));
                  }}
                  className="w-4 h-4 rounded bg-[var(--panel)] hover:bg-[var(--raise)] flex items-center justify-center text-[var(--ink-hi)]"
                  title="Diminuir tamanho"
                >
                  -
                </button>
                <span className="font-mono text-[8px] text-[var(--ink)]">{Math.round(speakerCardScale * 100)}%</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSpeakerCardScale(prev => Math.min(1.8, Number((prev + 0.1).toFixed(1))));
                  }}
                  className="w-4 h-4 rounded bg-[var(--panel)] hover:bg-[var(--raise)] flex items-center justify-center text-[var(--ink-hi)]"
                  title="Aumentar tamanho"
                >
                  +
                </button>
              </div>
            </div>

            {/* Bottom Floating Quick Preset Dock on Hover */}
            <div className="flex items-center justify-center gap-1 opacity-0 group-hover/speakercard:opacity-100 transition-opacity pointer-events-auto">
              <div className="flex items-center gap-0.5 bg-black/90 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-[var(--line-ctl)]/80 shadow-lg">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSpeakerPresetPos('top-left');
                  }}
                  className="p-1 hover:bg-blue-600 rounded text-[var(--ink)] hover:text-white transition-colors"
                  title="Fixar no Topo Esquerdo (↖)"
                >
                  <ArrowUpLeft size={10} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSpeakerPresetPos('top-right');
                  }}
                  className="p-1 hover:bg-blue-600 rounded text-[var(--ink)] hover:text-white transition-colors"
                  title="Fixar no Topo Direito (↗)"
                >
                  <ArrowUpRight size={10} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSpeakerPresetPos('bottom-left');
                  }}
                  className="p-1 hover:bg-blue-600 rounded text-[var(--ink)] hover:text-white transition-colors"
                  title="Fixar na Base Esquerda (↙)"
                >
                  <ArrowDownLeft size={10} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSpeakerPresetPos('bottom-right');
                  }}
                  className="p-1 hover:bg-blue-600 rounded text-[var(--ink)] hover:text-white transition-colors"
                  title="Fixar na Base Direita (↘)"
                >
                  <ArrowDownRight size={10} />
                </button>
                <div className="w-[1px] h-2.5 bg-[var(--raise)] mx-0.5" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSpeakerCardShape(prev => prev === 'rounded' ? 'circle' : prev === 'circle' ? 'compact' : 'rounded');
                  }}
                  className="px-1 py-0.5 hover:bg-blue-600 rounded text-[8px] font-bold text-[var(--ink)] hover:text-white transition-colors"
                  title="Alterar Formato do Card (Retângulo / Círculo / Compacto)"
                >
                  {isCircle ? 'Circ' : isCompact ? 'Mini' : 'Ret'}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetSpeakerCardPos();
                  }}
                  className="p-1 hover:bg-rose-600 rounded text-[var(--ink)] hover:text-white transition-colors"
                  title="Resetar Posição Padrão"
                >
                  <RotateCcw size={10} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Right Resize Handle */}
        {!isCircle && (
          <div 
            onMouseDown={startResizeSpeakerCard}
            onTouchStart={startResizeSpeakerCard}
            title="Arraste para redimensionar o card do palestrante"
            className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-blue-600 hover:bg-blue-500 rounded-full border border-white shadow flex items-center justify-center text-white cursor-nwse-resize z-40 opacity-0 group-hover/speakercard:opacity-100 transition-opacity pointer-events-auto"
          >
            <Maximize2 size={9} />
          </div>
        )}

        {/* Live Coordinate Badge during Drag */}
        {isDraggingSpeakerCard && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-mono text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-50 animate-pulse">
            X: {Math.round(speakerCardPos.x)}% | Y: {Math.round(speakerCardPos.y)}%
          </div>
        )}
      </div>
    );
  };

  // Render layouts on stream canvas
  const renderLayoutContent = () => {
    if (activeFeeds.length === 0) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--bg)]/95 text-center p-6">
          <ShieldAlert size={48} className="text-[var(--color-brand)] mb-3" />
          <p className="text-base font-semibold text-[var(--ink-hi)]">Transmissão Vazia</p>
          <p className="text-xs text-[var(--ink-lo)] max-w-sm mt-1">Adicione o seu vídeo ou compartilhamento de tela ao palco para começar.</p>
          <button 
            onClick={() => onToggleParticipantActive('p-local')}
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold rounded-lg transition-all"
          >
            Adicionar Minha Câmera
          </button>
        </div>
      );
    }

    // Single source active (if not presentation layout)
    if (activeFeeds.length === 1 && layout !== 'presentation') {
      return renderParticipantFeed(activeFeeds[0]);
    }

    // Multiple sources depending on selected layout style
    switch (layout) {
      case 'dual':
        return (
          <div className="grid grid-cols-2 gap-3 p-3 w-full h-full">
            {activeFeeds.slice(0, 2).map(f => renderParticipantFeed(f))}
          </div>
        );

      case 'screen-share': {
        const screenFeed = activeFeeds.find(f => f.isScreenShare);
        const camFeeds = activeFeeds.filter(f => !f.isScreenShare);
        if (screenFeed && camFeeds.length > 0) {
          return (
            <div className="flex gap-3 p-3 w-full h-full">
              <div className="flex-[3] h-full">
                {renderParticipantFeed(screenFeed)}
              </div>
              <div className="flex-1 flex flex-col gap-3 h-full overflow-y-auto">
                {camFeeds.map(f => renderParticipantFeed(f, 'h-[120px] shrink-0'))}
              </div>
            </div>
          );
        }
        return (
          <div className="grid grid-cols-2 gap-3 p-3 w-full h-full">
            {activeFeeds.map(f => renderParticipantFeed(f))}
          </div>
        );
      }

      case 'picture-in-picture': {
        const screenFeed = activeFeeds.find(f => f.isScreenShare);
        const camFeeds = activeFeeds.filter(f => !f.isScreenShare);
        if (screenFeed && camFeeds.length > 0) {
          return (
            <div className="relative w-full h-full">
              {renderParticipantFeed(screenFeed)}
              {renderDraggableSpeakerCard(camFeeds[0])}
            </div>
          );
        }
        return (
          <div className="grid grid-cols-2 gap-3 p-3 w-full h-full">
            {activeFeeds.map(f => renderParticipantFeed(f))}
          </div>
        );
      }

      case 'presentation': {
        const screenFeed = activeFeeds.find(f => f.isScreenShare || (f as any).isSlides);
        const camFeed = activeFeeds.find(f => f.isLocal || (!f.isScreenShare && !(f as any).isSlides));
        if (screenFeed) {
          return (
            <div className="relative w-full h-full flex items-center justify-center bg-black rounded-xl overflow-hidden">
              {renderParticipantFeed(screenFeed)}
              {camFeed && renderDraggableSpeakerCard(camFeed)}
            </div>
          );
        }
        if (activeFeeds.length > 0) {
          return (
            <div className="relative w-full h-full flex items-center justify-center">
              {renderParticipantFeed(activeFeeds[0])}
            </div>
          );
        }
        return null;
      }

      case 'gallery': {
        const count = activeFeeds.length;
        let gridCols = 'grid-cols-1';
        if (count === 2) {
          gridCols = 'grid-cols-2';
        } else if (count <= 4) {
          gridCols = 'grid-cols-2'; // 2x2 grid
        } else if (count <= 9) {
          gridCols = 'grid-cols-3'; // 3x3 grid
        } else {
          gridCols = 'grid-cols-4'; // 4x4 or more
        }
        return (
          <div className={`grid ${gridCols} gap-3 p-3 w-full h-full`} id="gallery-layout-grid">
            {activeFeeds.map(f => renderParticipantFeed(f))}
          </div>
        );
      }

      case 'grid':
      default: {
        const gridCols = activeFeeds.length > 4 ? 'grid-cols-3' : activeFeeds.length > 1 ? 'grid-cols-2' : 'grid-cols-1';
        return (
          <div className={`grid ${gridCols} gap-3 p-3 w-full h-full`}>
            {activeFeeds.map(f => renderParticipantFeed(f))}
          </div>
        );
      }
    }
  };

  // ── MODO MONITOR ───────────────────────────────────────────────────────────
  // Só o palco e a composição. Todos os hooks já rodaram acima, então sair
  // aqui é legal. Reaproveitar `renderLayoutContent` é o ponto: o PGM compõe
  // pelo MESMO caminho que o PVW, senão os dois monitores divergiriam pelo
  // motivo mais bobo possível — duas implementações do mesmo layout.
  if (monitorOnly) {
    const isPgm = monitorRole === 'pgm';
    return (
      <div className={`pw-frame ${isPgm ? 'pw-frame--pgm' : 'pw-frame--pvw'} w-full`}
           style={{ ['--pw-frame-radius' as string]: 'var(--radius-lg)' }}>
        <div className="relative w-full aspect-video rounded-[var(--radius-lg)] overflow-hidden bg-[var(--stage)] flex items-center justify-center">
          {renderLayoutContent()}
          <span className={`absolute top-1 left-1 px-1.5 py-px rounded-[var(--radius-sm)] text-xs font-black tracking-widest tabular-nums ${
            isPgm ? 'bg-[var(--color-sig)] text-[var(--color-n-100)]' : 'bg-[var(--raise)] text-[var(--ink-hi)]'
          }`}>
            {isPgm ? 'PGM' : 'PVW'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full w-full justify-between gap-1.5 md:gap-2 overflow-hidden min-h-0">
      {/* 1. Main Live Screen Player */}
      <div ref={containerRef} className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden">
        {/* Tally. A moldura e as marcas de canto vivem FORA do palco:
            ele tem `overflow-hidden` e recortaria as marcas. */}
        {/* Este palco é o PVW: ele renderiza o estado de EDIÇÃO, não o que
            está no ar. Eu tinha marcado como PGM — errado. O vermelho do
            tally pertence ao monitor de programa, e uma moldura que acende
            no barramento errado é pior que nenhuma. */}
        <div className="pw-frame pw-frame--pvw">
        <div 
          ref={stageRef}
          style={dimensions.width > 0 ? { width: `${dimensions.width}px`, height: `${dimensions.height}px` } : {}}
          className={`relative rounded-2xl overflow-hidden shadow-2xl bg-black flex items-center justify-center transition-all duration-150 ${
            isStudioPreviewMode
              ? 'border-2 border-cyan-500/70 ring-2 ring-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.15)]'
              : 'border border-[var(--line)]'
          }`}
        >
        {/* Active background selection */}
        <AnimatePresence>
          {activeBackground ? (
            <motion.img 
              key={activeBackground}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              src={activeBackground} 
              alt="Fundo da stream" 
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <motion.div 
              key="default-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 bg-gradient-to-br from-[var(--bg)] to-[var(--surface)]"
            ></motion.div>
          )}
        </AnimatePresence>

        {/* Live Status indicator */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-30 flex flex-wrap items-center gap-1 sm:gap-2 max-w-[calc(100%-60px)]">
          {/* AO VIVO / STUDIO PREVIEW tag */}
          {isStudioPreviewMode ? (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="bg-cyan-500 text-slate-950 text-[8px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded tracking-widest flex items-center gap-1 shadow-md">
                <Eye size={11} className="text-slate-950" />
                PRÉVIA (OFFLINE)
              </span>
              {hasPendingChanges && onPushToLive && (
                <button
                  type="button"
                  onClick={onPushToLive}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-1 animate-pulse shadow-lg cursor-pointer transition-all active:scale-95"
                  title="Enviar alterações preparadas para o Ao Vivo"
                >
                  <Sparkles size={10} />
                  PUSH TO LIVE ➔
                </button>
              )}
            </div>
          ) : isLive ? (
            <>
              <span className="bg-red-600 text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded tracking-widest text-white animate-blink">
                AO VIVO
              </span>
              <span className="bg-black/60 text-[8px] sm:text-[10px] font-mono font-semibold px-1.5 sm:px-2 py-0.5 rounded text-[var(--ink-hi)]">
                {formatTime(liveTime)}
              </span>
            </>
          ) : (
            <span className="bg-[var(--raise)] text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded tracking-wide text-[var(--ink-hi)]">
              PREVIEW
            </span>
          )}

          {/* Floating Chat toggle button */}
          {showWidgetChat && (
            <button
              type="button"
              onClick={() => setIsFloatingChatOpen(prev => !prev)}
              className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded text-[7px] sm:text-[8px] font-black tracking-wider uppercase transition-all shadow-md cursor-pointer border ${
                isFloatingChatOpen
                  ? 'bg-blue-600/30 border-blue-400 text-blue-200 hover:bg-blue-600/40 ring-1 ring-blue-500/30'
                  : 'bg-black/60 border-white/10 text-[var(--ink)] hover:text-[var(--ink-hi)] hover:bg-black/80'
              }`}
              title={isFloatingChatOpen ? "Ocultar Chat Flutuante" : "Exibir Chat Flutuante no Preview"}
            >
              <MessageSquare size={10} className={isFloatingChatOpen ? 'text-blue-400 animate-pulse' : 'text-[var(--ink-lo)]'} />
              <span>Chat: {isFloatingChatOpen ? 'ON' : 'OFF'}</span>
              {comments && comments.length > 0 && (
                <span className="bg-blue-500 text-white px-1 py-0.2 rounded-full text-[7px] font-mono leading-none">
                  {comments.length}
                </span>
              )}
            </button>
          )}

          {/* Toggle Drawing Mode */}
          {showWidgetLousa && (
            <button
              type="button"
              onClick={() => setIsDrawingMode(!isDrawingMode)}
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                isDrawingMode 
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' 
                  : 'bg-black/65 hover:bg-[var(--panel)] text-[var(--ink)] hover:text-[var(--ink-hi)] border border-[var(--line)]/80'
              }`}
            >
              <Pencil size={11} className={isDrawingMode ? "animate-pulse" : ""} />
              {isDrawingMode ? 'DESATIVAR LOUSA' : 'LOUSA DIGITAL'}
            </button>
          )}

          {/* Snapshot Button */}
          {showWidgetSnapshot && (
            <button
              type="button"
              onClick={handleTakeSnapshot}
              className="px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide transition-all duration-200 cursor-pointer bg-black/65 hover:bg-blue-600 text-[var(--ink)] hover:text-white border border-[var(--line)]/80 flex items-center gap-1.5 active:scale-95"
              title="Tirar Snapshot da Transmissão"
            >
              <Camera size={11} />
              SNAPSHOT
            </button>
          )}
        </div>

        {/* Recording indicator */}
        {recordingState.isRecording && (
          <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-black/60 text-[10px] font-mono font-black px-2.5 py-1 rounded text-red-500 shadow-md">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            <span>REC {recordingState.formattedTime}</span>
          </div>
        )}

        {/* Floating Reactions Overlay */}
        <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
          <AnimatePresence>
            {floatingReactions.map(reaction => (
              <motion.div
                key={reaction.id}
                initial={{ y: '105%', x: `${reaction.x}%`, scale: 0.5, opacity: 0 }}
                animate={{ y: '-10%', scale: [1, 1.3, 1], opacity: [0, 1, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.2, ease: 'easeOut' }}
                style={{ left: `${reaction.x}%` }}
                className="absolute text-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
              >
                {reaction.emoji}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Shutter Visual Flash Effect */}
        {isFlashActive && (
          <div className="absolute inset-0 bg-white z-[100] pointer-events-none transition-opacity duration-150 animate-fade" />
        )}

        {/* Professional TV Studio Transition Color Overlays */}
        {isTransitioning && (
          <div className="absolute inset-0 z-[105] pointer-events-none overflow-hidden select-none">
            {transitionType === 'dip-to-color' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: transitionStage === 'covering' ? 1 : 0 }}
                transition={{ duration: transitionDuration / 2000, ease: 'easeInOut' }}
                style={{ backgroundColor: transitionColor }}
                className="absolute inset-0 pointer-events-auto"
              />
            )}
            {transitionType === 'slide-wipe' && (
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: transitionStage === 'covering' ? '0%' : '-100%' }}
                transition={{ duration: transitionDuration / 2000, ease: 'easeInOut' }}
                style={{ backgroundColor: transitionColor }}
                className="absolute inset-0 pointer-events-auto"
              />
            )}
            {transitionType === 'smooth-wipe' && (
              <motion.div
                initial={{ x: '-115%', skewX: -12 }}
                animate={{ 
                  x: transitionStage === 'covering' ? '0%' : '115%',
                  skewX: -12 
                }}
                transition={{ duration: transitionDuration / 2000, ease: [0.22, 1, 0.36, 1] as const }}
                style={{ 
                  background: `linear-gradient(110deg, ${transitionColor} 0%, ${transitionColor} 85%, #ffffff 100%)`,
                  boxShadow: '0 0 60px rgba(0,0,0,0.8)'
                }}
                className="absolute inset-y-0 -left-[20%] w-[140%] pointer-events-auto z-[105]"
              >
                <div 
                  className="absolute top-0 bottom-0 right-0 w-10 bg-gradient-to-r from-transparent via-white/40 to-white/80 blur-sm"
                  style={{ boxShadow: `0 0 30px 8px ${transitionColor}` }}
                />
              </motion.div>
            )}
            {transitionType === 'shutter-wipe' && (
              <>
                {/* Top shutter gate */}
                <motion.div
                  initial={{ y: '-100%' }}
                  animate={{ y: transitionStage === 'covering' ? '0%' : '-100%' }}
                  transition={{ duration: transitionDuration / 2000, ease: 'easeInOut' }}
                  style={{ backgroundColor: transitionColor }}
                  className="absolute inset-x-0 top-0 h-1/2 pointer-events-auto"
                />
                {/* Bottom shutter gate */}
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: transitionStage === 'covering' ? '0%' : '-100%' }}
                  transition={{ duration: transitionDuration / 2000, ease: 'easeInOut' }}
                  style={{ backgroundColor: transitionColor }}
                  className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-auto"
                />
              </>
            )}
            {transitionType === 'radial-wipe' && (
              <motion.div
                initial={{ scale: 0, borderRadius: '100%' }}
                animate={{ 
                  scale: transitionStage === 'covering' ? 1.5 : 0, 
                  borderRadius: transitionStage === 'covering' ? '0%' : '100%' 
                }}
                transition={{ duration: transitionDuration / 2000, ease: 'easeInOut' }}
                style={{ backgroundColor: transitionColor }}
                className="absolute inset-0 origin-center pointer-events-auto"
              />
            )}
            {transitionType === 'flash' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: transitionDuration / 2000, ease: 'easeOut' }}
                style={{ backgroundColor: transitionColor }}
                className="absolute inset-0 pointer-events-auto"
              />
            )}
          </div>
        )}

        {/* Core Rendered feeds */}
        {(() => {
          const isLateralMode = (qrCodeConfig?.orientation === 'vertical') || bannerPosition === 'lateral';
          const isLateralActive = (showQrCode && isPresentationOverlayActive && isLateralMode) || bannerPosition === 'lateral';

          return (
            <div className={`relative h-full z-10 flex items-center justify-center transition-all duration-500 ease-in-out ${isLateralActive ? 'w-[calc(100%-220px)] sm:w-[calc(100%-250px)] mr-auto ml-2' : 'w-full'}`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeeds.length === 0 ? 'empty' : `${layout}-${activeFeeds.map(f => f.id).join(',')}`}
                  initial={animationProps.initial}
                  animate={animationProps.animate}
                  exit={animationProps.exit}
                  transition={animationProps.transition}
                  className="w-full h-full flex items-center justify-center"
                >
                  {renderLayoutContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          );
        })()}

        {/* Brand Logo Overlay (Fixed at top-right corner) */}
        <AnimatePresence>
          {activeLogo && (
            <motion.div
              key={activeLogo}
              initial={getLogoInitial()}
              animate={getLogoAnimate()}
              exit={getLogoExit()}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute top-3.5 right-4 z-30 select-none p-1.5 rounded-xl border bg-black/40 backdrop-blur-md border-white/20 shadow-xl flex items-center justify-center group"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center pointer-events-none">
                <img 
                  src={activeLogo} 
                  alt="Logo principal" 
                  className="max-h-full max-w-full object-contain pointer-events-none"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Botão para ocultar logo no hover */}
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setActiveLogo(''); }}
                className="absolute -top-2 -left-2 w-4 h-4 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] shadow-lg cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-40 border border-white/20"
                title="Esconder Logotipo do Estúdio"
              >
                <EyeOff size={9} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Watermark Overlay (Bottom Left) */}
        <AnimatePresence>
          {activeWatermark && (
            <motion.div
              key={activeWatermark}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute bottom-4 left-4 z-20 w-16 h-16 pointer-events-none opacity-50"
            >
              <img 
                src={activeWatermark} 
                alt="Marca D'água" 
                className="max-h-full max-w-full object-contain mix-blend-screen"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transparent layout overlay */}
        <AnimatePresence>
          {activeOverlay && (
            <motion.img 
              key={activeOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              src={activeOverlay} 
              alt="Estilo overlay" 
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-20"
              referrerPolicy="no-referrer"
            />
          )}
        </AnimatePresence>



        {/* Countdown Timer Overlay */}
        <AnimatePresence>
          {showCountdownOnScreen && (
            <motion.div
              key="countdown-overlay"
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(8px)', transition: { duration: 0.25, ease: [0.4, 0, 1, 1] as const } }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md"
            >
              <motion.div 
                initial={{ opacity: 0, y: 24, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.94 }}
                transition={{ type: 'spring' as const, damping: 26, stiffness: 280 }}
                className="bg-[var(--bg)]/95 border border-[var(--line)] p-8 rounded-2xl text-center max-w-sm w-full space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-center gap-2 text-blue-400">
                  <Clock size={20} className="animate-spin duration-1000" style={{ animationDuration: '4s' }} />
                  <span className="text-xs font-black uppercase tracking-widest text-blue-400">
                    {isLive ? 'Intervalo' : 'Aguardando Início'}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[var(--ink)]">
                    {isLive ? 'Voltamos em breve!' : 'O Webinar começará em:'}
                  </h4>
                  <p className="text-[10px] text-[var(--ink-dim)] uppercase tracking-wider font-semibold">
                    Aproveite para preparar sua água
                  </p>
                </div>

                <div 
                  className="py-4 px-6 bg-black/60 rounded-xl border border-[var(--line)]/80 font-mono font-black text-4xl tracking-widest text-center shadow-inner"
                  style={{ color: streamColor || '#4683E0' }}
                >
                  {Math.floor(countdownTimeLeft / 60).toString().padStart(2, '0')}:
                  {(countdownTimeLeft % 60).toString().padStart(2, '0')}
                </div>

                <div className="w-full bg-[var(--surface)] h-1.5 rounded-full overflow-hidden border border-[var(--line)]">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-linear"
                    style={{ 
                      backgroundColor: streamColor || '#4683E0',
                      width: `${Math.min(100, Math.max(0, (countdownTimeLeft / 1800) * 100))}%`
                    }}
                  />
                </div>

                <p className="text-[9px] text-[var(--ink-lo)] font-medium leading-relaxed">
                  {isCountdownActive ? 'Contagem regressiva ao vivo' : 'Temporizador pausado pelo produtor'}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Presentation Loading Preload Component (Slides Sandbox Preview) */}
        <AnimatePresence>
          {selectedSharedSource && (selectedSharedSource.type === 'pdf' || selectedSharedSource.name.toLowerCase().includes('powerpoint') || selectedSharedSource.name.toLowerCase().includes('.pptx')) && layout !== 'presentation' && (
            <motion.div 
              key="presentation-preload-sandbox"
              initial={{ opacity: 0, x: 36, scale: 0.94, filter: 'blur(6px)' }}
              animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: 28, scale: 0.94, filter: 'blur(4px)', transition: { duration: 0.22, ease: [0.4, 0, 1, 1] as const } }}
              transition={{ type: 'spring' as const, damping: 25, stiffness: 280, mass: 0.85 }}
              className="absolute top-16 right-4 z-40 w-[240px] bg-[var(--bg)]/95 backdrop-blur-md border border-blue-500/30 rounded-2xl p-3.5 shadow-2xl flex flex-col gap-2.5 text-left"
            >
              {/* Status indicator */}
              <div className="flex items-center justify-between border-b border-[var(--line)]/80 pb-1.5">
                <span className="flex items-center gap-1.5 text-[8px] font-black text-blue-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Slides: Modo Sandbox
                </span>
                <span className="text-[8px] bg-amber-500/10 text-amber-400 font-bold px-1.5 rounded">PREPARAÇÃO</span>
              </div>

              {/* Thumbnail Preview box */}
              <div className="relative aspect-video w-full rounded-xl bg-[var(--bg)] border border-[var(--line)]/80 overflow-hidden flex flex-col justify-between p-2.5 shadow-inner">
                <div className="flex justify-between items-center text-[7px] text-[var(--ink-dim)] uppercase tracking-wider">
                  <span className="truncate max-w-[120px] font-bold text-[var(--ink)]">{selectedSharedSource.name}</span>
                  <span className="shrink-0 font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.2 rounded border border-orange-500/20">
                    SLIDE {pdfCurrentPage} / 12
                  </span>
                </div>

                {/* Dynamic Thumbnail Content based on current page */}
                <div className="flex-1 flex flex-col justify-center items-center text-center p-1 space-y-1">
                  <Presentation size={14} className="text-blue-400 animate-pulse" />
                  <h4 className="text-[8px] font-extrabold text-[var(--ink-hi)] leading-tight truncate max-w-full">
                    {pdfCurrentPage === 1 && "Estratégia de Expansão Global Vega6"}
                    {pdfCurrentPage === 2 && (selectedSharedSource.type === 'pdf' ? "Maximização de Engajamento & Retenção" : "Vega6: Métricas de Crescimento 2026")}
                    {pdfCurrentPage === 3 && (selectedSharedSource.type === 'pdf' ? "Análise Demográfica do Público-Alvo" : "Retenção de Clientes e Crescimento YoY")}
                    {pdfCurrentPage === 4 && (selectedSharedSource.type === 'pdf' ? "Resultados e Métricas Trimestrais" : "Pontuação CSAT e Satisfação do Cliente")}
                    {pdfCurrentPage === 5 && (selectedSharedSource.type === 'pdf' ? "Canais de Aquisição Multicanal" : "Transmissão em Baixíssima Latência")}
                    {pdfCurrentPage === 6 && (selectedSharedSource.type === 'pdf' ? "Vantagem Competitiva Exclusiva" : "Eficiência Operacional em Nuvem")}
                    {pdfCurrentPage === 7 && (selectedSharedSource.type === 'pdf' ? "Escalabilidade de SaaS Recorrente" : "Expansão de Pacotes Corporativos")}
                    {pdfCurrentPage === 8 && (selectedSharedSource.type === 'pdf' ? "Eficiência Operacional & Custo de Infra" : "Redução de Custos de CDN")}
                    {pdfCurrentPage === 9 && (selectedSharedSource.type === 'pdf' ? "Crescimento Líquido Projetado" : "Marcos de Desenvolvimento Q3-Q4")}
                    {pdfCurrentPage === 10 && (selectedSharedSource.type === 'pdf' ? "Marcos de Desenvolvimento Q3-Q4" : "Suporte 24/7 com SLA de 99.9%")}
                    {pdfCurrentPage === 11 && (selectedSharedSource.type === 'pdf' ? "Suporte ao Cliente & SLA de 99.9%" : "Canais de Atendimento Prioritários")}
                    {pdfCurrentPage === 12 && "Sessão de Perguntas & Respostas (Q&A)"}
                  </h4>
                  <p className="text-[6.5px] text-[var(--ink-dim)] uppercase tracking-wide font-mono">
                    Slide Pré-carregado
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[var(--surface)] h-1 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-300" 
                    style={{ width: `${(pdfCurrentPage / 12) * 100}%` }}
                  />
                </div>
              </div>

              {/* Slide Navigation Controls */}
              <div className="flex items-center justify-between gap-2">
                <button 
                  type="button"
                  onClick={() => setPdfCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={pdfCurrentPage === 1}
                  className="flex-1 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--panel)] hover:text-[var(--ink-hi)] transition-all disabled:opacity-25 disabled:pointer-events-none flex items-center justify-center gap-1 text-[9px] font-bold cursor-pointer"
                >
                  <ChevronLeft size={10} />
                  Anterior
                </button>
                
                <button 
                  type="button"
                  onClick={() => setPdfCurrentPage(prev => Math.min(12, prev + 1))}
                  disabled={pdfCurrentPage === 12}
                  className="flex-1 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--panel)] hover:text-[var(--ink-hi)] transition-all disabled:opacity-25 disabled:pointer-events-none flex items-center justify-center gap-1 text-[9px] font-bold cursor-pointer"
                >
                  Próximo
                  <ChevronRight size={10} />
                </button>
              </div>

              {/* Broadcast action button */}
              <button
                type="button"
                onClick={() => {
                  onLayoutChange('presentation');
                  onTogglePresentationOverlayActive(); // Set isPresentationOverlayActive to true!
                }}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(59,130,246,0.35)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all cursor-pointer hover:scale-102 active:scale-98"
              >
                <Play size={11} fill="currentColor" />
                Apresentar no Studio
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pinned Comment Overlay */}
        <AnimatePresence>
          {pinnedComment && isPresentationOverlayActive && (
            <motion.div
              key={`pin-${pinnedComment.id}`}
              initial={{ opacity: 0, x: -32, y: 12, scale: 0.92, filter: 'blur(6px)' }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -24, y: 8, scale: 0.92, filter: 'blur(6px)', transition: { duration: 0.22, ease: [0.4, 0, 1, 1] as const } }}
              transition={{ type: 'spring' as const, damping: 25, stiffness: 300, mass: 0.85 }}
              className={`absolute left-4 z-30 max-w-[60%] flex gap-2.5 p-2.5 rounded-xl text-left bg-black/85 backdrop-blur-md border border-white/15 shadow-2xl transition-all duration-300 ${
                activeTicker && isPresentationOverlayActive ? 'bottom-14 sm:bottom-16' : 'bottom-4'
              }`}
            >
              <img 
                src={pinnedComment.authorAvatar} 
                alt={pinnedComment.authorName} 
                className="w-8 h-8 rounded-full object-cover mt-0.5 border border-white/25 shadow-md shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-[var(--ink-hi)] text-[10px] truncate leading-none">{pinnedComment.authorName}</span>
                  <span className="text-[7px] text-[var(--color-brand)] uppercase px-1.5 py-0.5 rounded bg-blue-500/20 font-bold tracking-wider leading-none shadow-xs">
                    {pinnedComment.platform}
                  </span>
                </div>
                <p className="text-[var(--ink-hi)] text-[11px] leading-tight break-words font-medium">{pinnedComment.text}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Chat Overlay Card */}
        <AnimatePresence>
          {isFloatingChatOpen && (
            <motion.div
              key="floating-chat-overlay"
              initial={{ opacity: 0, y: 28, scale: 0.93, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 20, scale: 0.93, filter: 'blur(6px)', transition: { duration: 0.22, ease: [0.4, 0, 1, 1] as const } }}
              transition={{ type: 'spring' as const, damping: 25, stiffness: 290, mass: 0.8 }}
              className={`absolute right-3 z-30 w-72 sm:w-80 max-h-72 backdrop-blur-md border border-[var(--line-ctl)]/80 rounded-2xl shadow-2xl p-3 flex flex-col transition-all duration-300 ${
                activeTicker && isPresentationOverlayActive ? 'bottom-14 sm:bottom-16' : 'bottom-3'
              }`}
              style={{ backgroundColor: `rgba(15, 17, 21, ${chatWidgetOpacity / 100})` }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--line)] text-left shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-blue-500/20 text-blue-400">
                    <MessageSquare size={13} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--ink-hi)] flex items-center gap-1.5 leading-none">
                      Chat Flutuante
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    </h4>
                    <p className="text-[9px] text-[var(--ink-lo)] mt-0.5">Comentários ao vivo</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsFloatingChatOpen(false)}
                    className="p-1 hover:bg-[var(--panel)] rounded-lg text-[var(--ink-lo)] hover:text-[var(--ink-hi)] transition-colors cursor-pointer"
                    title="Ocultar Chat Flutuante"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* List of recent comments */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 text-left custom-scrollbar">
                {!comments || comments.length === 0 ? (
                  <div className="text-center py-6 text-[var(--ink-dim)] text-xs animate-in fade-in duration-300">
                    Nenhum comentário recebido ainda.
                  </div>
                ) : (
                  comments.slice(-10).map((comm) => {
                    const isPinned = pinnedComment?.id === comm.id;
                    return (
                      <div
                        key={comm.id}
                        className={`p-2 rounded-xl text-xs transition-all border flex gap-2 animate-chat-bubble-in ${
                          isPinned
                            ? 'border-blue-500/60 shadow-sm'
                            : 'border-[var(--line)] hover:border-[var(--line-ctl)]'
                        }`}
                        style={{
                          backgroundColor: isPinned 
                            ? `rgba(23, 37, 84, ${chatWidgetOpacity > 30 ? 0.6 : chatWidgetOpacity / 100})` 
                            : `rgba(22, 25, 30, ${(chatWidgetOpacity / 100) * 0.9})`
                        }}
                      >
                        <img
                          src={comm.authorAvatar}
                          alt={comm.authorName}
                          className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5 border border-white/10"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-[var(--ink-hi)] text-[10px] truncate">{comm.authorName}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-[7px] text-blue-400 uppercase px-1 py-0.2 rounded bg-blue-500/10 font-bold tracking-wider">
                                {comm.platform}
                              </span>
                              {onPinComment && (
                                <button
                                  type="button"
                                  onClick={() => onPinComment(isPinned ? null : comm.id)}
                                  className={`p-0.5 rounded transition-colors ${
                                    isPinned ? 'bg-blue-500 text-white' : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:bg-[var(--raise)]'
                                  }`}
                                  title={isPinned ? "Desafixar comentário" : "Fixar comentário na tela"}
                                >
                                  {isPinned ? <PinOff size={10} /> : <Pin size={10} />}
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-[var(--ink-hi)] text-[10px] mt-0.5 break-words leading-snug">
                            {comm.text}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Studio Banner Overlay (Draggable & Resizable Lower Third) */}
        <AnimatePresence>
          {activeBanner && isPresentationOverlayActive && (
            <motion.div
              key={activeBanner.id}
              initial={getBannerInitial()}
              animate={getBannerAnimate()}
              exit={getBannerExit()}
              style={{
                left: `${bannerPos.x}%`,
                top: `${bannerPos.y}%`,
                transform: `scale(${bannerScale})`,
                transformOrigin: 'bottom left'
              }}
              className={`absolute z-30 select-none cursor-move group transition-shadow ${
                isHoveringBanner || isDraggingBanner || isResizingBanner ? 'ring-2 ring-indigo-500/80 rounded-2xl p-1 bg-black/40 backdrop-blur-xs' : ''
              }`}
              onMouseDown={(e) => startDragBanner(e)}
              onTouchStart={(e) => startDragBanner(e)}
              onMouseEnter={() => setIsHoveringBanner(true)}
              onMouseLeave={() => setIsHoveringBanner(false)}
            >
              {/* Stacked lower third matching broadcast styling */}
              <div className="flex flex-col items-start max-w-lg drop-shadow-2xl">
                {/* Subtitle / Upper pill */}
                <div 
                  style={{ backgroundColor: activeBanner.accentColor || '#84cc16' }}
                  className="px-3.5 py-1 text-xs sm:text-sm font-extrabold text-slate-900 rounded-tl-2xl rounded-tr-lg shadow-md tracking-tight leading-none mb-[1px]"
                >
                  {activeBanner.subtitle || 'Stream like a Pro - OneStream Live Studio'}
                </div>

                {/* Main Title / Lower pill */}
                <div 
                  style={{ backgroundColor: activeBanner.themeColor || '#1d273b' }}
                  className="px-4 py-2.5 sm:py-3 text-sm sm:text-base font-extrabold text-[var(--ink-hi)] rounded-tr-xl rounded-br-2xl rounded-bl-xl shadow-2xl border-l-4 border-lime-400 leading-snug break-words"
                >
                  {activeBanner.text}
                </div>
              </div>

              {/* Hover / Active Controls */}
              {(isHoveringBanner || isDraggingBanner || isResizingBanner) && (
                <>
                  {/* Top toolbar */}
                  <div className="absolute -top-8 left-0 flex items-center gap-1.5 bg-[var(--bg)]/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-[var(--line-ctl)] shadow-xl text-[10px] text-[var(--ink-hi)] pointer-events-auto">
                    <span className="text-[var(--ink-lo)] font-bold text-[9px] uppercase tracking-wider flex items-center gap-1">
                      <Move size={10} className="text-indigo-400" /> Arrastar Banner
                    </span>
                    <div className="w-px h-3 bg-[var(--raise)]" />
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setBannerScale(s => Math.max(0.5, s - 0.1)); }}
                      className="hover:text-indigo-400 font-bold px-1 text-xs cursor-pointer"
                      title="Diminuir"
                    >
                      -
                    </button>
                    <span className="text-[9px] text-indigo-300 font-semibold">{Math.round(bannerScale * 100)}%</span>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setBannerScale(s => Math.min(2.0, s + 0.1)); }}
                      className="hover:text-indigo-400 font-bold px-1 text-xs cursor-pointer"
                      title="Aumentar"
                    >
                      +
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); resetBannerPos(); }}
                      className="hover:text-amber-400 ml-1 p-0.5 rounded cursor-pointer"
                      title="Redefinir Posição"
                    >
                      <RotateCcw size={10} />
                    </button>
                  </div>

                  {/* Resize handle bottom-right */}
                  <div 
                    onMouseDown={(e) => startResizeBanner(e)}
                    onTouchStart={(e) => startResizeBanner(e)}
                    className="absolute -bottom-2 -right-2 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center cursor-nwse-resize shadow-lg hover:scale-125 transition-transform border border-white/20 z-40"
                    title="Arraste para Redimensionar"
                  >
                    <Move size={10} />
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Scrolling News Ticker Overlay (Barra de Rolagem de Texto) */}
        <AnimatePresence>
          {activeTicker && isPresentationOverlayActive && (
            <motion.div
              key={activeTicker.id}
              initial={{ opacity: 0, y: 36, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 28, filter: 'blur(6px)', transition: { duration: 0.26, ease: [0.4, 0, 1, 1] as const } }}
              transition={{ type: 'spring' as const, damping: 28, stiffness: 280, mass: 0.9 }}
              className="absolute bottom-0 left-0 right-0 z-20 h-10 sm:h-12 bg-[var(--bg)]/95 backdrop-blur-md border-t border-[var(--line)]/80 flex items-center overflow-hidden shadow-2xl group select-none"
            >
              {/* Badge Indicator */}
              <div 
                style={{ backgroundColor: streamColor }}
                className="h-full shrink-0 flex items-center justify-center px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-[var(--ink-hi)] shadow-md z-10 animate-ticker-badge"
              >
                {activeTicker.badgeText || 'ALERTA'}
              </div>

              {/* Scrolling Text Container with edge fading */}
              <div className="w-full overflow-hidden relative flex items-center">
                <div 
                  style={{
                    animationDuration: tickerSpeed === 'slow' ? '25s' : tickerSpeed === 'fast' ? '8s' : '15s'
                  }}
                  className={`${tickerDirection === 'right' ? 'animate-ticker-right' : 'animate-ticker-left'} text-xs sm:text-sm font-semibold text-[var(--ink-hi)] whitespace-nowrap pl-4 pr-12`}
                >
                  {activeTicker.text} &nbsp; &bull; &nbsp; {activeTicker.text}
                </div>
              </div>

              {/* Quick close button on hover */}
              <button
                type="button"
                onClick={() => onSetActiveTicker?.(null)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--surface)]/80 hover:bg-red-600 text-[var(--ink)] hover:text-white p-1 rounded-md text-[10px] z-20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md"
                title="Ocultar Barra de Rolagem"
              >
                <X size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full-Screen Studio Teleprompter Overlay */}
        <AnimatePresence>
          {showTeleprompterOnStudio && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-30 bg-[var(--bg)]/80 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden select-none"
            >
              {/* Floating Top Control Toolbar */}
              <div className="absolute top-3 right-3 z-40 bg-[var(--well)]/90 backdrop-blur-xl border border-[var(--line)] rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-xl">
                <div className="flex items-center gap-1.5 pr-2 border-r border-[var(--line)]">
                  <span className={`w-2 h-2 rounded-full ${isTeleprompterPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="text-[10px] font-black uppercase tracking-wider text-[var(--ink)] hidden sm:inline flex items-center gap-1">
                    <FileText size={11} className="text-blue-400" />
                    {isTeleprompterPlaying ? 'Lendo...' : 'Pausado'}
                  </span>
                </div>

                {/* Play / Pause */}
                <button
                  type="button"
                  onClick={() => onToggleTeleprompterPlaying()}
                  className={`px-3 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-sm ${
                    isTeleprompterPlaying 
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' 
                      : 'bg-blue-600 text-white hover:bg-blue-500'
                  }`}
                >
                  {isTeleprompterPlaying ? <Pause size={12} /> : <Play size={12} />}
                  {isTeleprompterPlaying ? 'Pausar' : 'Iniciar'}
                </button>

                {/* Return to top */}
                <button
                  type="button"
                  onClick={() => {
                    if (studioPrompterRef.current) studioPrompterRef.current.scrollTop = 0;
                  }}
                  className="p-1.5 text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:bg-[var(--panel)] rounded-lg transition-colors cursor-pointer"
                  title="Voltar ao topo"
                >
                  <RotateCcw size={13} />
                </button>

                {/* Close Overlay */}
                <button
                  type="button"
                  onClick={() => onToggleShowTeleprompterOnStudio()}
                  className="p-1.5 text-[var(--ink-lo)] hover:text-red-400 hover:bg-[var(--panel)] rounded-lg transition-colors cursor-pointer"
                  title="Fechar Teleprompter do Palco"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Full-screen Reading Guide Line */}
              <div className="absolute top-1/2 left-0 right-0 h-14 -translate-y-1/2 bg-blue-500/10 border-y border-blue-500/30 pointer-events-none z-20 flex items-center justify-between px-4 sm:px-8">
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-400/80 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-500/20 shadow-sm">
                  GUIA DE LEITURA
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-400/80 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-500/20 shadow-sm">
                  {teleprompterSpeed}x • ESTÚDIO
                </span>
              </div>

              {/* Full-screen Scrolling Text Viewport */}
              <div
                ref={studioPrompterRef}
                style={{
                  transform: teleprompterMirrored ? 'scaleX(-1)' : 'none'
                }}
                className={`w-full h-full overflow-y-auto px-4 sm:px-12 text-center font-bold leading-relaxed transition-all select-none scrollbar-none ${
                  teleprompterFontSize === 'sm' ? 'text-base sm:text-lg' :
                  teleprompterFontSize === 'md' ? 'text-lg sm:text-xl' :
                  teleprompterFontSize === 'xl' ? 'text-2xl sm:text-4xl font-black' :
                  'text-xl sm:text-3xl'
                } ${isTeleprompterPlaying ? 'text-yellow-300' : 'text-[var(--ink-hi)]'}`}
              >
                {/* Generous top spacer so text enters at center reading line */}
                <div className="h-[40vh]" />

                <p className="whitespace-pre-line tracking-wide drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] max-w-4xl mx-auto my-auto">
                  {teleprompterText || 'Digite ou cole o seu script na barra lateral para iniciar a leitura.'}
                </p>

                {/* Bottom spacer so text can scroll through to end */}
                <div className="h-[50vh]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic QR Code & Live Commerce Product Showcase Overlay */}
        <AnimatePresence>
          {showQrCode && isPresentationOverlayActive && (() => {
            const effectiveConfig = qrCodeConfig || {
              title: 'Smartphone Pro Max 256GB',
              subtitle: 'Oferta Especial de Transmissão',
              price: 'R$ 1.899,00',
              originalPrice: 'R$ 2.499,00',
              discountBadge: '24% OFF + FRETE GRÁTIS',
              storeUrl: qrCodeText || 'https://shopee.com.br/smartphone-pro-max-live',
              storeName: 'Shopee',
              ctaLabel: 'Compre com Desconto',
              imageUrl: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&auto=format&fit=crop&q=80',
              orientation: 'horizontal' as const,
              cardTheme: 'dark' as const,
              qrColor: '#000000',
              qrBgColor: '#ffffff',
              showProductImage: true,
              showPrice: true,
              showDiscountBadge: true,
              showStoreName: true,
              showScanPrompt: true
            };

            const isCardLateral = effectiveConfig.orientation === 'vertical' || bannerPosition === 'lateral';

            return (
              <motion.div
                key="studio-qrcode-overlay"
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 15 }}
                transition={{ type: 'spring' as const, damping: 26, stiffness: 300 }}
                style={{
                  transform: `scale(${qrCodeScale})`,
                  transformOrigin: isCardLateral ? 'center right' : 'bottom center'
                }}
                className={`absolute z-35 select-none group transition-all duration-700 ease-out ${
                  isCardLateral
                    ? 'right-3 sm:right-5 top-1/2 -translate-y-1/2'
                    : `left-1/2 -translate-x-1/2 ${activeTicker && isPresentationOverlayActive ? 'bottom-12 sm:bottom-14' : 'bottom-3 sm:bottom-4'}`
                } ${
                  isHoveringQrCode ? 'ring-2 ring-blue-500/80 rounded-2xl p-1 bg-black/40 backdrop-blur-xs' : ''
                }`}
                onMouseEnter={() => setIsHoveringQrCode(true)}
                onMouseLeave={() => setIsHoveringQrCode(false)}
              >
                {/* Quick Floating Action Controls on Hover */}
                <div className="absolute -top-7 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 backdrop-blur-md border border-[var(--line-ctl)]/80 rounded-lg px-2 py-0.5 flex items-center gap-1.5 z-40 shadow-xl pointer-events-auto">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQrCodeScale(prev => Math.max(0.6, Number((prev - 0.1).toFixed(1))));
                    }}
                    className="p-0.5 hover:bg-[var(--panel)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)] rounded text-[9px] font-bold cursor-pointer"
                    title="Diminuir Escala"
                  >
                    -
                  </button>
                  <span className="text-[8px] font-mono text-[var(--ink)]">{Math.round(qrCodeScale * 100)}%</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQrCodeScale(prev => Math.min(1.8, Number((prev + 0.1).toFixed(1))));
                    }}
                    className="p-0.5 hover:bg-[var(--panel)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)] rounded text-[9px] font-bold cursor-pointer"
                    title="Aumentar Escala"
                  >
                    +
                  </button>
                  {onOpenQrCodeModal && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenQrCodeModal();
                      }}
                      className="p-0.5 hover:bg-blue-600/30 text-blue-400 hover:text-white rounded cursor-pointer"
                      title="Editar QR Code & Produto"
                    >
                      <Pencil size={9} />
                    </button>
                  )}
                  {onToggleShowQrCode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleShowQrCode(false);
                      }}
                      className="p-0.5 hover:bg-red-600/30 text-[var(--ink-lo)] hover:text-red-400 rounded cursor-pointer"
                      title="Ocultar da Tela"
                    >
                      <X size={9} />
                    </button>
                  )}
                </div>

              {/* CARD PRESENTATION: HORIZONTAL VS VERTICAL */}
              {(() => {
                const effectiveConfig = qrCodeConfig || {
                  title: 'Smartphone Pro Max 256GB',
                  subtitle: 'Oferta Especial de Transmissão',
                  price: 'R$ 1.899,00',
                  originalPrice: 'R$ 2.499,00',
                  discountBadge: '24% OFF + FRETE GRÁTIS',
                  storeUrl: qrCodeText || 'https://shopee.com.br/smartphone-pro-max-live',
                  storeName: 'Shopee',
                  ctaLabel: 'Compre com Desconto',
                  imageUrl: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&auto=format&fit=crop&q=80',
                  orientation: 'horizontal' as const,
                  cardTheme: 'dark' as const,
                  qrColor: '#000000',
                  qrBgColor: '#ffffff',
                  showProductImage: true,
                  showPrice: true,
                  showDiscountBadge: true,
                  showStoreName: true,
                  showScanPrompt: true
                };

                const activeTargetUrl = effectiveConfig.storeUrl || qrCodeText || 'https://pwstreamer.com';
                const dynamicQrImage = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(activeTargetUrl)}&color=${(effectiveConfig.qrColor || '#000000').replace('#', '')}&bgcolor=${(effectiveConfig.qrBgColor || '#ffffff').replace('#', '')}`;

                // Card Theme classes
                let themeClasses = {
                  bg: 'bg-[var(--bg)]/95 text-[var(--ink-hi)] border-[var(--line)] shadow-2xl',
                  subtext: 'text-[var(--ink-lo)]',
                  priceColor: 'text-emerald-400',
                  border: 'border-[var(--line)]'
                };

                if (effectiveConfig.cardTheme === 'light') {
                  themeClasses = {
                    bg: 'bg-white/95 text-slate-900 border-slate-200 shadow-2xl',
                    subtext: 'text-[var(--ink-dim)]',
                    priceColor: 'text-emerald-600',
                    border: 'border-slate-300'
                  };
                } else if (effectiveConfig.cardTheme === 'brand') {
                  themeClasses = {
                    bg: 'bg-[var(--bg)]/95 text-[var(--ink-hi)] border-blue-500/40 shadow-[0_10px_30px_rgba(70,131,224,0.3)]',
                    subtext: 'text-blue-200/70',
                    priceColor: 'text-blue-400',
                    border: 'border-blue-500/30'
                  };
                } else if (effectiveConfig.cardTheme === 'neon') {
                  themeClasses = {
                    bg: 'bg-[var(--well)]/95 text-[var(--ink-hi)] border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.35)]',
                    subtext: 'text-cyan-200/80',
                    priceColor: 'text-cyan-400',
                    border: 'border-cyan-500/40'
                  };
                } else if (effectiveConfig.cardTheme === 'gold') {
                  themeClasses = {
                    bg: 'bg-[var(--bg)]/95 text-[var(--ink-hi)] border-amber-500/50 shadow-[0_10px_30px_rgba(245,158,11,0.25)]',
                    subtext: 'text-amber-200/80',
                    priceColor: 'text-amber-400',
                    border: 'border-amber-500/40'
                  };
                } else if (effectiveConfig.cardTheme === 'glass') {
                  themeClasses = {
                    bg: 'bg-[var(--bg)]/75 backdrop-blur-xl text-[var(--ink-hi)] border-white/20 shadow-2xl',
                    subtext: 'text-[var(--ink)]',
                    priceColor: 'text-emerald-400',
                    border: 'border-white/15'
                  };
                }

                if (effectiveConfig.orientation === 'horizontal') {
                  return (
                    <div className={`p-3 rounded-2xl border ${themeClasses.bg} ${themeClasses.border} flex items-center gap-3 max-w-md shadow-2xl drop-shadow-2xl`}>
                      {/* Product Image */}
                      {effectiveConfig.showProductImage && effectiveConfig.imageUrl && (
                        <img
                          src={effectiveConfig.imageUrl}
                          alt={effectiveConfig.title}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-white/10 shrink-0 shadow"
                          referrerPolicy="no-referrer"
                        />
                      )}

                      {/* Product Texts */}
                      <div className="flex-1 min-w-0 text-left">
                        {effectiveConfig.showStoreName && effectiveConfig.storeName && (
                          <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 inline-block mb-1">
                            {effectiveConfig.storeName}
                          </span>
                        )}
                        <h5 className="text-xs sm:text-sm font-extrabold leading-snug truncate">
                          {effectiveConfig.title || 'Produto em Destaque'}
                        </h5>
                        {effectiveConfig.subtitle && (
                          <p className={`text-[9px] ${themeClasses.subtext} truncate mt-0.5`}>
                            {effectiveConfig.subtitle}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-1">
                          {effectiveConfig.showPrice && effectiveConfig.price && (
                            <span className={`text-xs sm:text-sm font-black ${themeClasses.priceColor}`}>
                              {effectiveConfig.price}
                            </span>
                          )}
                          {effectiveConfig.showPrice && effectiveConfig.originalPrice && (
                            <span className="text-[9px] text-[var(--ink-dim)] line-through">
                              {effectiveConfig.originalPrice}
                            </span>
                          )}
                        </div>

                        {effectiveConfig.showDiscountBadge && effectiveConfig.discountBadge && (
                          <span className="text-[8px] font-black uppercase text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.2 rounded inline-block mt-1">
                            {effectiveConfig.discountBadge}
                          </span>
                        )}
                      </div>

                      {/* QR Code Container */}
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className="p-1.5 bg-white rounded-xl shadow-md border border-slate-200">
                          <img
                            src={dynamicQrImage}
                            alt="QR Code"
                            className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        {effectiveConfig.showScanPrompt && (
                          <span className="text-[8px] font-black uppercase tracking-tight text-center opacity-85 whitespace-nowrap">
                            Aponte a Câmera
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                {/* VERTICAL PRESENTATION (TOTEM / STANDING CARD) */}
                return (
                  <div className={`p-3.5 rounded-2xl border ${themeClasses.bg} ${themeClasses.border} flex flex-col items-center text-center gap-2 w-48 sm:w-52 shadow-2xl drop-shadow-2xl`}>
                    {/* Store badge */}
                    {effectiveConfig.showStoreName && effectiveConfig.storeName && (
                      <span className="text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {effectiveConfig.storeName}
                      </span>
                    )}

                    {/* Product Image */}
                    {effectiveConfig.showProductImage && effectiveConfig.imageUrl && (
                      <img
                        src={effectiveConfig.imageUrl}
                        alt={effectiveConfig.title}
                        className="w-24 h-24 rounded-xl object-cover border border-white/10 shadow"
                        referrerPolicy="no-referrer"
                      />
                    )}

                    {/* Product info */}
                    <div className="w-full space-y-0.5">
                      <h5 className="text-xs font-black leading-tight line-clamp-2">
                        {effectiveConfig.title || 'Produto em Destaque'}
                      </h5>

                      <div className="flex items-center justify-center gap-1.5 pt-0.5">
                        {effectiveConfig.showPrice && effectiveConfig.price && (
                          <span className={`text-xs font-black ${themeClasses.priceColor}`}>
                            {effectiveConfig.price}
                          </span>
                        )}
                        {effectiveConfig.showPrice && effectiveConfig.originalPrice && (
                          <span className="text-[9px] text-[var(--ink-dim)] line-through">
                            {effectiveConfig.originalPrice}
                          </span>
                        )}
                      </div>

                      {effectiveConfig.showDiscountBadge && effectiveConfig.discountBadge && (
                        <div className="pt-0.5">
                          <span className="text-[7.5px] font-black uppercase text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded">
                            {effectiveConfig.discountBadge}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* QR Code Container */}
                    <div className="p-1.5 bg-white rounded-xl shadow-md border border-slate-200 mt-1">
                      <img
                        src={dynamicQrImage}
                        alt="QR Code"
                        className="w-24 h-24 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {effectiveConfig.showScanPrompt && (
                      <div className="w-full bg-blue-600/20 border border-blue-500/30 py-1 px-2 rounded-lg">
                        <span className="text-[8px] font-black uppercase tracking-wider text-blue-300 block truncate">
                          {effectiveConfig.ctaLabel || 'Aponte a Câmera'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          );
        })()}
        </AnimatePresence>

        {/* Canvas Overlay for Drawing */}
        {isDrawingMode && (
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="absolute inset-0 w-full h-full z-40 cursor-crosshair select-none touch-none"
          />
        )}

        {/* Floating Drawing Toolbar */}
        {isDrawingMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-black/95 backdrop-blur-md border border-[var(--line)] rounded-full px-3.5 py-1.5 flex items-center gap-4 shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200">
            {/* Status light & Label */}
            <div className="flex items-center gap-1.5 pr-2.5 border-r border-[var(--line)] shrink-0">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
              <span className="text-[9px] font-black tracking-wider text-[var(--ink-lo)] uppercase">LOUSA ATIVA</span>
            </div>

            {/* Quick Colors Selector */}
            <div className="flex items-center gap-1.5 shrink-0">
              {[
                { hex: '#f43f5e', label: 'Rosa' },
                { hex: '#eab308', label: 'Amarelo' },
                { hex: '#10b981', label: 'Verde' },
                { hex: '#3b82f6', label: 'Azul' },
                { hex: '#ffffff', label: 'Branco' }
              ].map((colorPreset) => (
                <button
                  key={colorPreset.hex}
                  type="button"
                  onClick={() => {
                    setDrawColor(colorPreset.hex);
                    if (contextRef.current) {
                      contextRef.current.strokeStyle = colorPreset.hex;
                    }
                  }}
                  className={`w-5 h-5 rounded-full border transition-all cursor-pointer hover:scale-115 flex items-center justify-center ${
                    drawColor.toLowerCase() === colorPreset.hex.toLowerCase()
                      ? 'border-white scale-110 ring-2 ring-blue-500/50'
                      : 'border-[var(--line)]/80 hover:border-slate-400'
                  }`}
                  style={{ backgroundColor: colorPreset.hex }}
                  title={colorPreset.label}
                />
              ))}

              {/* Custom HTML Color Picker */}
              <div className="relative w-5 h-5 rounded-full overflow-hidden border border-[var(--line-ctl)] hover:scale-115 transition-all shrink-0 cursor-pointer flex items-center justify-center">
                <input
                  type="color"
                  value={drawColor}
                  onChange={(e) => {
                    setDrawColor(e.target.value);
                    if (contextRef.current) {
                      contextRef.current.strokeStyle = e.target.value;
                    }
                  }}
                  className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                />
                <div 
                  className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-tr from-rose-500 via-yellow-500 to-blue-500"
                  title="Cor Personalizada"
                >
                  +
                </div>
              </div>
            </div>

            {/* Thickness presets */}
            <div className="flex items-center gap-1 border-l border-r border-[var(--line)] px-2.5 shrink-0">
              {[
                { val: 2, label: 'Fina' },
                { val: 5, label: 'Média' },
                { val: 9, label: 'Grossa' }
              ].map((size) => (
                <button
                  key={size.val}
                  type="button"
                  onClick={() => {
                    setDrawThickness(size.val);
                    if (contextRef.current) {
                      contextRef.current.lineWidth = size.val;
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase transition-all cursor-pointer ${
                    drawThickness === size.val
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-[var(--surface)]/80 text-[var(--ink-lo)] hover:text-[var(--ink-hi)] border border-transparent'
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const canvas = canvasRef.current;
                  if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                  }
                }}
                className="p-1 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 rounded-md transition-all cursor-pointer flex items-center justify-center"
                title="Limpar Desenhos"
              >
                <Trash2 size={13} />
              </button>
              
              <button
                type="button"
                onClick={() => setIsDrawingMode(false)}
                className="p-1 hover:bg-[var(--panel)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)] rounded-md transition-all cursor-pointer flex items-center justify-center"
                title="Sair da Lousa"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Dynamic SVG Chroma Key Filter */}
        {chromaKeyEnabled && (
          <svg className="absolute w-0 h-0 invisible">
            <defs>
              <filter id="chromakey-filter" colorInterpolationFilters="sRGB">
                {/* 1. Spill Suppression Color Correction */}
                <feColorMatrix
                  type="matrix"
                  values={getSpillSuppressionMatrix()}
                  result="spill-suppressed"
                />
                
                {/* 2. Keying Matte Generation */}
                <feColorMatrix
                  type="matrix"
                  values={getChromaMatrix()}
                  in="spill-suppressed"
                  result="matte"
                />
                
                {chromaEdgeSoftness > 0 ? (
                  <>
                    {/* 3. Isolate Alpha from matte */}
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                      in="matte"
                      result="alpha-channel"
                    />
                    
                    {/* 4. Blur the isolated alpha channel */}
                    <feGaussianBlur
                      in="alpha-channel"
                      stdDeviation={chromaEdgeSoftness / 20}
                      result="blurred-alpha"
                    />
                    
                    {/* 5. Composite original RGB with soft alpha */}
                    <feComposite
                      in="matte"
                      in2="blurred-alpha"
                      operator="in"
                    />
                  </>
                ) : null}
              </filter>
            </defs>
          </svg>
        )}
      </div>
        </div>
    </div>

      {/* Rounded Layout Selector Bar (Matches the User's Screenshot Exactly!) */}
      <div className="flex justify-center shrink-0 py-1 px-1 w-full overflow-hidden" id="minimalist-layout-selector-bar">
        <div className="bg-[var(--bg)]/95 border border-[var(--line)]/80 px-2 sm:px-3.5 py-1.5 rounded-xl flex flex-wrap xl:flex-nowrap items-center justify-center gap-2 md:gap-3 shadow-2xl max-w-full overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full pb-0.5 custom-scrollbar shrink-0">
            {[
              { id: '1-cam', label: 'Solo', name: 'Solo' },
              { id: 'dual', label: 'Duo', name: 'Lado a Lado' },
              { id: 'presentation', label: 'Slide Host', name: 'Slides + Cam' },
              { id: 'picture-in-picture', label: 'PIP', name: 'Canto Flutuante' },
              { id: 'grid', label: 'Grade', name: 'Grade Simétrica' },
              { id: 'gallery', label: 'Galeria', name: 'Modo Galeria' },
              { id: 'screen-share', label: 'Cheia', name: 'Tela Inteira' }
            ].map(l => {
              const isSelected = layout === l.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => onLayoutChange(l.id as any)}
                  className={`w-14 h-10 rounded-xl relative transition-all duration-200 cursor-pointer flex items-center justify-center p-1 hover:scale-105 active:scale-95 ${
                    isSelected 
                      ? 'bg-blue-600/10 border-[var(--color-brand)] border-2 shadow-[0_0_12px_rgba(70,131,224,0.35)]' 
                      : 'bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line-ctl)] hover:bg-[var(--panel)]/40'
                  }`}
                  title={`Mudar layout para: ${l.name}`}
                >
                  {l.id === '1-cam' && (
                    <div className="w-full h-full bg-[var(--panel)]/40 rounded-lg border border-[var(--line-ctl)]/40 p-1 flex items-center justify-center">
                      <div className="w-1/2 h-full bg-slate-500/80 rounded-md" />
                    </div>
                  )}
                  {l.id === 'dual' && (
                    <div className="w-full h-full flex gap-1 bg-[var(--panel)]/40 rounded-lg border border-[var(--line-ctl)]/40 p-1">
                      <div className="flex-1 bg-slate-500/80 rounded-md" />
                      <div className="flex-1 bg-slate-500/80 rounded-md" />
                    </div>
                  )}
                  {l.id === 'presentation' && (
                    <div className="w-full h-full flex gap-1 bg-[var(--panel)]/40 rounded-lg border border-[var(--line-ctl)]/40 p-1">
                      <div className="flex-[2.5] bg-slate-500/80 rounded-md" />
                      <div className="flex-1 flex flex-col gap-0.5">
                        <div className="w-full h-[45%] bg-slate-600/50 rounded-sm" />
                        <div className="w-full h-[45%] bg-slate-600/50 rounded-sm" />
                      </div>
                    </div>
                  )}
                  {l.id === 'picture-in-picture' && (
                    <div className="w-full h-full bg-[var(--panel)]/40 rounded-lg border border-[var(--line-ctl)]/40 p-1 relative">
                      <div className="w-full h-full bg-slate-500/50 rounded-md" />
                      <div className="absolute bottom-1 right-1 w-2/5 h-2/5 bg-slate-400 rounded-sm border border-[var(--line-ctl)] shadow" />
                    </div>
                  )}
                  {l.id === 'grid' && (
                    <div className="w-full h-full grid grid-cols-2 gap-0.5 bg-[var(--panel)]/40 rounded-lg border border-[var(--line-ctl)]/40 p-1">
                      <div className="bg-slate-500/80 rounded-sm" />
                      <div className="bg-slate-500/80 rounded-sm" />
                      <div className="bg-slate-500/80 rounded-sm" />
                      <div className="bg-slate-500/80 rounded-sm" />
                    </div>
                  )}
                  {l.id === 'gallery' && (
                    <div className="w-full h-full grid grid-cols-3 gap-0.5 bg-[var(--panel)]/40 rounded-lg border border-[var(--line-ctl)]/40 p-0.5">
                      <div className="bg-slate-500/80 rounded-[1px]" />
                      <div className="bg-slate-500/80 rounded-[1px]" />
                      <div className="bg-slate-500/80 rounded-[1px]" />
                      <div className="bg-slate-500/80 rounded-[1px]" />
                      <div className="bg-slate-500/80 rounded-[1px]" />
                      <div className="bg-slate-500/80 rounded-[1px]" />
                      <div className="bg-slate-500/80 rounded-[1px]" />
                      <div className="bg-slate-500/80 rounded-[1px]" />
                      <div className="bg-slate-500/80 rounded-[1px]" />
                    </div>
                  )}
                  {l.id === 'screen-share' && (
                    <div className="w-full h-full bg-[var(--panel)]/40 rounded-lg border border-[var(--line-ctl)]/40 p-1">
                      <div className="w-full h-full bg-slate-500/80 rounded-md" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          
        </div>
      </div>
    </div>
  );
}
