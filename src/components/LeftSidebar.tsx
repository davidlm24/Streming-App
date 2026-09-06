import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, Music, Upload, Plus, Trash2, 
  Check, Volume2, Eye, EyeOff, MessageSquare, AlertCircle, Send,
  ChevronDown, ChevronRight, Folder, Sliders, Settings, Pin, PinOff, Save,
  Tv, Users, QrCode, FileText, Info, HelpCircle, Film, Edit, CheckCircle2, Monitor, X, Sparkles, Copy,
  Camera, Download, Puzzle, Calendar, Bell, Mic, MicOff, Clock, RotateCcw, Activity, ShieldAlert, Palette,
  Move, ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Bookmark, Edit3, Layers, FastForward, Gauge, LayoutGrid, Maximize2, Pencil, Video,
  Sun, Moon, ShoppingBag, Tag, ExternalLink
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ImagePlaceholder } from './ImagePlaceholder';
import { Destination, AudioTrack, Banner, BannerPosition, Comment, Participant, QrCodeConfig, StudioTab, SceneTransitionType } from '../types';
import { AUDIO_LIBRARY, BACKGROUND_TEMPLATES, OVERLAY_TEMPLATES, LOGO_TEMPLATES } from '../data';
import { ThumbnailEditor } from './ThumbnailEditor';
import { AudioVUMeter } from './AudioVUMeter';
import { AudiencePanel } from './AudiencePanel';
import { VirtualizedChat } from './VirtualizedChat';
import { useTheme } from '../context/ThemeContext';
import { CLOUDFLARE_STREAM_CONFIG } from '../lib/cloudflareStreamConfig';

const BANNER_TEMPLATES = [
  {
    id: 'tmpl-1',
    text: "🔥 SUPER OFERTA: Inscreva-se agora e ganhe 50% de desconto! Cupom: LIVE50",
    styleName: "Vendas Glow",
    category: "Comercial",
    badgeColor: "bg-red-500/10 text-red-400 border-red-500/20"
  },
  {
    id: 'tmpl-2',
    text: "🚨 ATENÇÃO: A sessão de perguntas e respostas iniciará em instantes. Participe!",
    styleName: "Alerta Notícias",
    category: "Urgente",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  },
  {
    id: 'tmpl-3',
    text: "👉 CLIQUE NO LINK fixado no chat para fazer o download do e-book gratuito.",
    styleName: "Call to Action",
    category: "Ação",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20"
  },
  {
    id: 'tmpl-4',
    text: "📺 Inscreva-se no canal e ative as notificações para receber novos conteúdos!",
    styleName: "Social Media",
    category: "Engajamento",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
  },
  {
    id: 'tmpl-5',
    text: "💡 DICA: Envie sua pergunta com [PERGUNTA] no início para facilitar a leitura.",
    styleName: "Estúdio Clean",
    category: "Dica",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  },
  {
    id: 'tmpl-6',
    text: "✨ BEM-VINDOS ao nosso webinar! Deixe seu nome e cidade aqui no chat ao vivo.",
    styleName: "Boas-vindas",
    category: "Interação",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20"
  }
];

const TELEPROMPTER_PRESETS = [
  {
    id: 'intro',
    title: 'Abertura & Boas-Vindas',
    category: 'Geral',
    text: "Sejam todos muito bem-vindos a mais uma transmissão ao vivo no nosso canal!\n\nNo episódio de hoje, vamos discutir os principais acontecimentos do mercado, apresentar novidades imperdíveis e interagir com todos vocês no chat ao vivo.\n\nAproveite para se inscrever, deixar o seu like e compartilhar o link desta live com seus amigos e colegas!"
  },
  {
    id: 'product',
    title: 'Lançamento de Produto',
    category: 'Vendas',
    text: "É com enorme satisfação que apresentamos hoje o nosso mais novo lançamento.\n\nEsta plataforma foi desenvolvida para resolver os maiores desafios do seu dia a dia, entregando alta performance, design intuitivo e segurança total.\n\nVamos agora fazer uma demonstração prática ao vivo de todas as funcionalidades principais!"
  },
  {
    id: 'pitch',
    title: 'Pitch & Oferta Especial',
    category: 'Conversão',
    text: "Atenção: preparamos uma condição super especial e exclusiva apenas para quem está nos acompanhando ao vivo nesta transmissão.\n\nClicando no link fixado no chat agora mesmo, você garante 40% de desconto e bônus exclusivos.\n\nEssa oferta expira assim que encerrarmos esta live, então não perca tempo!"
  },
  {
    id: 'interview',
    title: 'Entrevista & Debate',
    category: 'Conteúdo',
    text: "Hoje temos a honra de receber um convidado muito especial para um bate-papo exclusivo sobre tendências e inovação.\n\nQueremos que você participe ativamente enviando suas perguntas no chat. Nosso convidado responderá tudo na segunda metade da live!"
  },
  {
    id: 'closing',
    title: 'Encerramento & CTA',
    category: 'Final',
    text: "Chegamos ao fim da nossa transmissão de hoje! Muito obrigado a cada um de vocês pela audiência e pelo carinho no chat.\n\nNão se esqueçam de ativar as notificações para não perder a live da próxima semana. Um forte abraço e até breve!"
  }
];

export interface SceneTemplateItem {
  id: string;
  name: string;
  description?: string;
  layout: '1-cam' | 'dual' | 'screen-share' | 'picture-in-picture' | 'presentation' | 'grid' | 'gallery';
  activeParticipantIds: string[];
  activeBannerId: string | null;
  activeLogo?: string;
  activeOverlay?: string;
  activeBackground?: string;
  isCustom?: boolean;
}

const DEFAULT_SCENE_TEMPLATES: SceneTemplateItem[] = [
  {
    id: 'scntmpl-solo',
    name: 'Apresentador Solo',
    description: '1 Câmera em Destaque + Logo da Marca',
    layout: '1-cam',
    activeParticipantIds: ['p-local'],
    activeBannerId: 'b-1',
  },
  {
    id: 'scntmpl-duo',
    name: 'Entrevista Duo',
    description: '2 Câmeras Lado a Lado + Banner de Pergunta',
    layout: 'dual',
    activeParticipantIds: ['p-local', 'p-guest1'],
    activeBannerId: 'b-2',
  },
  {
    id: 'scntmpl-screen',
    name: 'Apresentação de Tela',
    description: 'Tela Compartilhada Grande + Apresentador Mini',
    layout: 'screen-share',
    activeParticipantIds: ['p-screen', 'p-local'],
    activeBannerId: null,
  },
  {
    id: 'scntmpl-grid',
    name: 'Painel / Debates (Grade)',
    description: 'Todos os Participantes Ativos em Matriz',
    layout: 'grid',
    activeParticipantIds: ['p-local', 'p-guest1', 'p-guest2'],
    activeBannerId: 'b-3',
  }
];

interface BrandPreset {
  id: string;
  name: string;
  streamColor: string;
  activeLogo: string;
  textStyle: 'default' | 'news' | 'rounded';
  isCustom?: boolean;
}

const DEFAULT_PRESETS: BrandPreset[] = [
  {
    id: 'preset-default',
    name: 'PwStreamer Standard',
    streamColor: '#FF3D38',
    activeLogo: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&auto=format&fit=crop&q=80',
    textStyle: 'default'
  },
  {
    id: 'preset-ocean',
    name: 'Ocean Tech',
    streamColor: '#0EA5E9',
    activeLogo: 'https://cdn-icons-png.flaticon.com/512/4406/4406180.png',
    textStyle: 'rounded'
  },
  {
    id: 'preset-emerald',
    name: 'Emerald News',
    streamColor: '#10B981',
    activeLogo: 'https://cdn-icons-png.flaticon.com/512/3220/3220554.png',
    textStyle: 'news'
  },
  {
    id: 'preset-cyberpunk',
    name: 'Cyberpunk Glow',
    streamColor: '#EAB308',
    activeLogo: 'https://cdn-icons-png.flaticon.com/512/4406/4406180.png',
    textStyle: 'news'
  },
  {
    id: 'preset-elegant',
    name: 'Classic Indigo',
    streamColor: '#6366F1',
    activeLogo: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&auto=format&fit=crop&q=80',
    textStyle: 'default'
  }
];

import { useMediaManager } from '../context/MediaManagerContext';

interface LeftSidebarProps {
  activeTab: StudioTab;
  destinations: Destination[];
  onToggleDestination: (id: string) => void;
  title: string;
  setTitle: (t: string) => void;
  description: string;
  setDescription: (d: string) => void;
  isThumbnailEnabled: boolean;
  setIsThumbnailEnabled: (val: boolean) => void;
  isScheduleEnabled: boolean;
  setIsScheduleEnabled: (val: boolean) => void;
  banners: Banner[];
  onAddBanner: (text: string, subtitle?: string, themeColor?: string, accentColor?: string) => void;
  onUpdateBanner?: (banner: Banner) => void;
  onDeleteBanner: (id: string) => void;
  activeBannerId: string | null;
  onSetActiveBanner: (id: string | null) => void;
  tickers?: import('../types').TickerItem[];
  onAddTicker?: (text: string, badgeText?: string) => void;
  onUpdateTicker?: (ticker: import('../types').TickerItem) => void;
  onDeleteTicker?: (id: string) => void;
  activeTickerId?: string | null;
  onSetActiveTicker?: (id: string | null) => void;
  tickerSpeed?: 'slow' | 'normal' | 'fast';
  onSetTickerSpeed?: (speed: 'slow' | 'normal' | 'fast') => void;
  tickerDirection?: 'left' | 'right';
  onSetTickerDirection?: (dir: 'left' | 'right') => void;
  bannerPosition?: BannerPosition;
  onBannerPositionChange?: (pos: BannerPosition) => void;
  currentPlayingTrackId: string | null;
  onPlayTrack: (id: string | null) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  musicLoop: boolean;
  setMusicLoop: (loop: boolean) => void;
  streamColor: string;
  onStreamColorChange: (color: string) => void;
  textStyle: 'default' | 'news' | 'rounded';
  setTextStyle: (style: 'default' | 'news' | 'rounded') => void;
  comments: Comment[];
  pinnedComment: Comment | null;
  onPostComment: (text: string) => void;
  onPinComment: (id: string | null) => void;
  isLive: boolean;

  // Layout & Source Manager integration
  layout: '1-cam' | 'dual' | 'screen-share' | 'picture-in-picture' | 'presentation' | 'grid' | 'gallery';
  onLayoutChange: (l: '1-cam' | 'dual' | 'screen-share' | 'picture-in-picture' | 'presentation' | 'grid' | 'gallery') => void;
  participants: Participant[];
  onToggleParticipantActive: (id: string) => void;
  transitionType: SceneTransitionType;
  onTransitionTypeChange: (t: SceneTransitionType) => void;
  isPresentationOverlayActive?: boolean;
  onTogglePresentationOverlayActive?: () => void;

  // QR Code integration
  showQrCode: boolean;
  setShowQrCode: (show: boolean) => void;
  qrCodeText: string;
  setQrCodeText: (text: string) => void;
  qrCodeConfig?: QrCodeConfig;
  onUpdateQrCodeConfig?: (config: QrCodeConfig) => void;
  onOpenQrCodeModal?: () => void;

  // Notes integration
  presenterNotes: string;
  setPresenterNotes: (notes: string) => void;

  // Teleprompter integration
  teleprompterText?: string;
  onTeleprompterTextChange?: (text: string) => void;
  isTeleprompterPlaying?: boolean;
  onToggleTeleprompterPlaying?: () => void;
  teleprompterSpeed?: number;
  onTeleprompterSpeedChange?: (speed: number) => void;
  teleprompterFontSize?: 'sm' | 'md' | 'lg' | 'xl';
  onTeleprompterFontSizeChange?: (size: 'sm' | 'md' | 'lg' | 'xl') => void;
  teleprompterMirrored?: boolean;
  onToggleTeleprompterMirrored?: () => void;
  showTeleprompterOnStudio?: boolean;
  onToggleShowTeleprompterOnStudio?: () => void;

  // Camera Crop/Framing Controls
  cameraZoom: number;
  onCameraZoomChange: (z: number) => void;
  cameraOffsetX: number;
  onCameraOffsetXChange: (x: number) => void;
  cameraOffsetY: number;
  onCameraOffsetYChange: (y: number) => void;

  // Chroma Key Controls
  chromaKeyEnabled: boolean;
  onChromaKeyEnabledChange: (enabled: boolean) => void;
  chromaColor: string;
  onChromaColorChange: (color: string) => void;
  chromaTolerance: number;
  onChromaToleranceChange: (tolerance: number) => void;
  chromaEdgeSoftness?: number;
  onChromaEdgeSoftnessChange?: (softness: number) => void;
  chromaSpillSuppression?: number;
  onChromaSpillSuppressionChange?: (spill: number) => void;

  transitionDuration: number;
  onTransitionDurationChange: (duration: number) => void;
  snapshots: { id: string; name: string; url: string; timestamp: string }[];
  onDeleteSnapshot: (id: string) => void;

  mirrorCamera: boolean;
  onMirrorCameraChange: (mirror: boolean) => void;

  // Local Recording options
  recordingFormat: 'mp4' | 'webm';
  setRecordingFormat: (format: 'mp4' | 'webm') => void;
  recordingQuality: '720p' | '1080p';
  setRecordingQuality: (quality: '720p' | '1080p') => void;

  // Animations config
  logoAnimation: 'none' | 'fade' | 'slide' | 'pop';
  setLogoAnimation: (anim: 'none' | 'fade' | 'slide' | 'pop') => void;
  bannerAnimation: 'none' | 'fade' | 'slide' | 'typewriter' | 'pop';
  setBannerAnimation: (anim: 'none' | 'fade' | 'slide' | 'typewriter' | 'pop') => void;
  webinars: any[];
  setWebinars: React.Dispatch<React.SetStateAction<any[]>>;
  isScreenSharing?: boolean;
  onToggleScreenShare?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  rtmpServer?: string;
  setRtmpServer?: (url: string) => void;
  streamKey?: string;
  setStreamKey?: (key: string) => void;
  countdownDuration?: number;
  setCountdownDuration?: (d: number) => void;
  countdownTimeLeft?: number;
  setCountdownTimeLeft?: (t: number) => void;
  isCountdownActive?: boolean;
  setIsCountdownActive?: (a: boolean) => void;
  showCountdownOnScreen?: boolean;
  setShowCountdownOnScreen?: (s: boolean) => void;
  isSceneAutomationEnabled?: boolean;
  onToggleSceneAutomation?: (enabled: boolean) => void;
  activeSpeaker?: string;
  isAiModerationEnabled?: boolean;
  onToggleAiModeration?: (enabled: boolean) => void;
  aiModerationMode?: 'warn' | 'hide';
  onChangeAiModerationMode?: (mode: 'warn' | 'hide') => void;
  onApproveComment?: (id: string) => void;

  // Auto-fade props
  isAutoFadeEnabled?: boolean;
  onToggleAutoFade?: (enabled: boolean) => void;
  autoFadeVolumeFactor?: number;
  onChangeAutoFadeVolumeFactor?: (factor: number) => void;
  autoFadeSensitivity?: number;
  onChangeAutoFadeSensitivity?: (sensitivity: number) => void;
  isPresenterSpeaking?: boolean;

  // Scene-specific transitions
  sceneTransitions?: Record<string, { type: SceneTransitionType; duration: number }>;
  onUpdateSceneTransition?: (sceneId: string, type: SceneTransitionType, duration: number) => void;

  // Studio Widgets props
  showWidgetChat?: boolean;
  onToggleShowWidgetChat?: () => void;
  chatWidgetOpacity?: number;
  onChatWidgetOpacityChange?: (opacity: number) => void;
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
  onTakeSnapshot?: () => void;
  isSmartSidebarEnabled?: boolean;
  setIsSmartSidebarEnabled?: (val: boolean) => void;
  onBatchAddComments?: (comments: Comment[]) => void;
  onClearComments?: () => void;
  onOpenCloudflareModal?: () => void;
  onOpenCustomDestinationsModal?: () => void;
  onOpenAddChannelsModal?: () => void;
  userId?: string;
}

export function LeftSidebar({
  activeTab,
  destinations,
  onToggleDestination,
  title,
  setTitle,
  description,
  setDescription,
  isThumbnailEnabled,
  setIsThumbnailEnabled,
  isScheduleEnabled,
  setIsScheduleEnabled,
  banners,
  onAddBanner,
  onUpdateBanner,
  onDeleteBanner,
  activeBannerId,
  onSetActiveBanner,
  tickers = [],
  onAddTicker,
  onUpdateTicker,
  onDeleteTicker,
  activeTickerId = null,
  onSetActiveTicker,
  tickerSpeed = 'normal',
  onSetTickerSpeed = () => {},
  tickerDirection = 'left',
  onSetTickerDirection = () => {},
  bannerPosition = 'bottom',
  onBannerPositionChange = () => {},
  currentPlayingTrackId,
  onPlayTrack,
  volume,
  onVolumeChange,
  musicLoop,
  setMusicLoop,
  streamColor,
  onStreamColorChange,
  textStyle,
  setTextStyle,
  comments,  pinnedComment,
  onPostComment,  onPinComment,
  isLive,

  // Stream controls & Layout manager props
  layout,
  onLayoutChange,
  participants,
  onToggleParticipantActive,
  transitionType,
  onTransitionTypeChange,

  // QR Code & Notes props
  showQrCode,
  setShowQrCode,
  qrCodeText,
  setQrCodeText,
  qrCodeConfig,
  onUpdateQrCodeConfig,
  onOpenQrCodeModal,
  presenterNotes,
  setPresenterNotes,

  // Teleprompter props
  teleprompterText = "Sejam todos muito bem-vindos à nossa transmissão ao vivo!\n\nHoje vamos abordar os tópicos mais importantes do dia, apresentar novidades exclusivas e responder às principais dúvidas no chat.\n\nFiquem à vontade para interagir, mandar mensagens e compartilhar o link da live com seus amigos.\n\nVamos começar a nossa apresentação em 3, 2, 1...",
  onTeleprompterTextChange = () => {},
  isTeleprompterPlaying = false,
  onToggleTeleprompterPlaying = () => {},
  teleprompterSpeed = 3,
  onTeleprompterSpeedChange = () => {},
  teleprompterFontSize = 'lg',
  onTeleprompterFontSizeChange = () => {},
  teleprompterMirrored = false,
  onToggleTeleprompterMirrored = () => {},
  showTeleprompterOnStudio = false,
  onToggleShowTeleprompterOnStudio = () => {},

  // Camera Crop/Framing Controls
  cameraZoom,
  onCameraZoomChange,
  cameraOffsetX,
  onCameraOffsetXChange,
  cameraOffsetY,
  onCameraOffsetYChange,

  // Chroma Key Controls
  chromaKeyEnabled,
  onChromaKeyEnabledChange,
  chromaColor,
  onChromaColorChange,
  chromaTolerance,
  onChromaToleranceChange,
  chromaEdgeSoftness = 20,
  onChromaEdgeSoftnessChange,
  chromaSpillSuppression = 30,
  onChromaSpillSuppressionChange,

  transitionDuration,
  onTransitionDurationChange,
  snapshots,
  onDeleteSnapshot,

  mirrorCamera,
  onMirrorCameraChange,

  recordingFormat,
  setRecordingFormat,
  recordingQuality,
  setRecordingQuality,
  logoAnimation,
  setLogoAnimation,
  bannerAnimation,
  setBannerAnimation,
  webinars,
  setWebinars,
  isScreenSharing = false,
  onToggleScreenShare,
  isMuted = false,
  onToggleMute,
  rtmpServer = 'rtmp://stream.pwstreamer.com/live',
  setRtmpServer,
  streamKey = 'pw_live_68e29a10bc39e1a',
  setStreamKey,
  countdownDuration = 300,
  setCountdownDuration,
  countdownTimeLeft = 300,
  setCountdownTimeLeft,
  isCountdownActive = false,
  setIsCountdownActive,
  showCountdownOnScreen = false,
  setShowCountdownOnScreen,
  isSceneAutomationEnabled = false,
  onToggleSceneAutomation,
  activeSpeaker = 'p-local',
  isAiModerationEnabled = true,
  onToggleAiModeration = () => {},
  aiModerationMode = 'warn',
  onChangeAiModerationMode = () => {},
  onApproveComment = () => {},
  isAutoFadeEnabled = false,
  onToggleAutoFade = () => {},
  autoFadeVolumeFactor = 0.2,
  onChangeAutoFadeVolumeFactor = () => {},
  autoFadeSensitivity = 0.5,
  onChangeAutoFadeSensitivity = () => {},
  isPresenterSpeaking = false,
  isPresentationOverlayActive = true,
  onTogglePresentationOverlayActive = () => {},
  sceneTransitions = {},
  onUpdateSceneTransition = () => {},
  showWidgetChat = false,
  onToggleShowWidgetChat = () => {},
  chatWidgetOpacity = 95,
  onChatWidgetOpacityChange = () => {},
  showWidgetLousa = false,
  onToggleShowWidgetLousa = () => {},
  showWidgetSnapshot = false,
  onToggleShowWidgetSnapshot = () => {},
  isFloatingChatOpen = false,
  onToggleFloatingChatOpen = () => {},
  isStreamHealthOpen = false,
  onToggleStreamHealthOpen = () => {},
  isDrawingMode = false,
  onToggleDrawingMode = () => {},
  onTakeSnapshot = () => {},
  isSmartSidebarEnabled = true,
  setIsSmartSidebarEnabled = () => {},
  onBatchAddComments,
  onClearComments,
  onOpenCloudflareModal,
  onOpenCustomDestinationsModal,
  onOpenAddChannelsModal,
  userId
}: LeftSidebarProps) {
  const { 
    activeLogo, setActiveLogo, 
    activeWatermark, setActiveWatermark,
    activeOverlay, setActiveOverlay, 
    activeBackground, setActiveBackground,
    customLogos, customWatermarks, customOverlays, customBackgrounds, customAudios,
    uploadCustomLogo, uploadCustomWatermark, uploadCustomOverlay, uploadCustomBackground, uploadCustomAudio,
    deleteCustomLogo, deleteCustomWatermark, deleteCustomOverlay, deleteCustomBackground, deleteCustomAudio, hiddenTemplates, hideTemplate,
    videoClips, activeVideoClip, playVideoClip, uploadVideoClip, deleteVideoClip, isCloudUploading 
  } = useMediaManager();

  const { theme, setTheme } = useTheme();

  // Speaker Card Draggable Position state in LeftSidebar
  const [sidebarSpeakerPos, setSidebarSpeakerPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('pw_speaker_pip_pos');
      return saved ? JSON.parse(saved) : { x: 74, y: 68 };
    } catch {
      return { x: 74, y: 68 };
    }
  });
  const [sidebarSpeakerScale, setSidebarSpeakerScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pw_speaker_pip_scale');
      return saved ? parseFloat(saved) : 1.0;
    } catch {
      return 1.0;
    }
  });
  const [sidebarSpeakerShape, setSidebarSpeakerShape] = useState<'rounded' | 'circle' | 'compact'>(() => {
    try {
      const saved = localStorage.getItem('pw_speaker_pip_shape') as any;
      return (saved === 'rounded' || saved === 'circle' || saved === 'compact') ? saved : 'rounded';
    } catch {
      return 'rounded';
    }
  });

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (!e.detail) return;
      if (e.detail.pos) setSidebarSpeakerPos(e.detail.pos);
      if (e.detail.scale !== undefined) setSidebarSpeakerScale(e.detail.scale);
      if (e.detail.shape) setSidebarSpeakerShape(e.detail.shape);
    };
    window.addEventListener('studio-speaker-pos-updated', handleUpdate);
    return () => window.removeEventListener('studio-speaker-pos-updated', handleUpdate);
  }, []);

  const updateSpeakerSettings = (pos?: { x: number; y: number }, scale?: number, shape?: 'rounded' | 'circle' | 'compact') => {
    const newPos = pos || sidebarSpeakerPos;
    const newScale = scale !== undefined ? scale : sidebarSpeakerScale;
    const newShape = shape || sidebarSpeakerShape;
    if (pos) setSidebarSpeakerPos(pos);
    if (scale !== undefined) setSidebarSpeakerScale(scale);
    if (shape) setSidebarSpeakerShape(shape);

    window.dispatchEvent(new CustomEvent('studio-speaker-pos-change', {
      detail: { pos: newPos, scale: newScale, shape: newShape }
    }));
  };

  // Drag & drop state for Videos tab
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);

  // Local state for Ticker (Barra de Rolagem)
  const [newTickerText, setNewTickerText] = useState('');
  const [newTickerBadge, setNewTickerBadge] = useState('ALERTA');
  const [isTickersOpen, setIsTickersOpen] = useState(true);

  // Teleprompter scroll ref and animation effect for Sidebar
  const sidebarPrompterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab !== 'third' || !isTeleprompterPlaying) return;

    const interval = setInterval(() => {
      if (sidebarPrompterRef.current) {
        const el = sidebarPrompterRef.current;
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
  }, [activeTab, isTeleprompterPlaying, teleprompterSpeed]);

  // Word count & estimated time for Teleprompter
  const teleprompterWordCount = teleprompterText.trim() ? teleprompterText.trim().split(/\s+/).length : 0;
  const teleprompterEstSeconds = Math.ceil((teleprompterWordCount / 150) * 60);
  const teleprompterEstMin = Math.floor(teleprompterEstSeconds / 60);
  const teleprompterEstSec = teleprompterEstSeconds % 60;
  const teleprompterEstTime = `${teleprompterEstMin}m ${teleprompterEstSec < 10 ? '0' : ''}${teleprompterEstSec}s`;

  const handleTickerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTickerText.trim()) return;
    if (onAddTicker) {
      onAddTicker(newTickerText.trim(), newTickerBadge);
    }
    setNewTickerText('');
  };

  const handleVideoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingVideo) setIsDraggingVideo(true);
  };

  const handleVideoDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingVideo(false);
  };

  const handleVideoDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingVideo(false);

    const files = Array.from(e.dataTransfer.files).filter((file: File) => 
      file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(file.name)
    );

    if (files.length > 0) {
      for (const file of files) {
        await uploadVideoClip(file);
      }
    }
  };
  
  // Local state for adding and managing banners
  const [newBannerText, setNewBannerText] = useState('');
  const [isBannersOpen, setIsBannersOpen] = useState(true);
  const [isAddBannerModalOpen, setIsAddBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerInputTitle, setBannerInputTitle] = useState('');
  const [bannerInputSubtitle, setBannerInputSubtitle] = useState('');
  const [selectedThemeColor, setSelectedThemeColor] = useState('#1d273b');
  const [selectedAccentColor, setSelectedAccentColor] = useState('#84cc16');

  const handleOpenAddBannerModal = (bannerToEdit?: Banner) => {
    if (bannerToEdit) {
      setEditingBanner(bannerToEdit);
      setBannerInputTitle(bannerToEdit.text);
      setBannerInputSubtitle(bannerToEdit.subtitle || '');
      setSelectedThemeColor(bannerToEdit.themeColor || '#1d273b');
      setSelectedAccentColor(bannerToEdit.accentColor || '#84cc16');
    } else {
      setEditingBanner(null);
      setBannerInputTitle('');
      setBannerInputSubtitle('Stream like a Pro - OneStream Live Studio');
      setSelectedThemeColor('#1d273b');
      setSelectedAccentColor('#84cc16');
    }
    setIsAddBannerModalOpen(true);
  };

  const handleSaveBannerFromModal = () => {
    if (!bannerInputTitle.trim()) return;
    if (editingBanner) {
      if (onUpdateBanner) {
        onUpdateBanner({
          ...editingBanner,
          text: bannerInputTitle.trim(),
          subtitle: bannerInputSubtitle.trim() || undefined,
          themeColor: selectedThemeColor,
          accentColor: selectedAccentColor
        });
      }
    } else {
      onAddBanner(
        bannerInputTitle.trim(),
        bannerInputSubtitle.trim() || undefined,
        selectedThemeColor,
        selectedAccentColor
      );
    }
    setIsAddBannerModalOpen(false);
    setEditingBanner(null);
    setBannerInputTitle('');
    setBannerInputSubtitle('');
  };
  const [selectedSceneConfigId, setSelectedSceneConfigId] = useState<string>('scene-1');
  const [settingsSubTab, setSettingsSubTab] = useState<'devices' | 'transmission' | 'transitions'>('devices');
  const [copiedServer, setCopiedServer] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [streamDelay, setStreamDelay] = useState<number>(0);

  // Advanced Scene Transitions Config state
  const [showSceneTransitions, setShowSceneTransitions] = useState(false);
  const [selectedSceneForTransition, setSelectedSceneForTransition] = useState<string>('scene-1');

  // Layout Templates & Scene Templates state
  const [layoutTemplateName, setLayoutTemplateName] = useState('');
  const [savedLayoutTemplates, setSavedLayoutTemplates] = useState<{id: string, name: string}[]>([]);

  // Scene Templates Section State
  const [isSceneTemplatesOpen, setIsSceneTemplatesOpen] = useState(true);
  const [newSceneTemplateName, setNewSceneTemplateName] = useState('');
  const [sceneTemplates, setSceneTemplates] = useState<SceneTemplateItem[]>(() => {
    try {
      const saved = localStorage.getItem('pwstream_scene_templates_v2');
      return saved ? JSON.parse(saved) : DEFAULT_SCENE_TEMPLATES;
    } catch {
      return DEFAULT_SCENE_TEMPLATES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pwstream_scene_templates_v2', JSON.stringify(sceneTemplates));
    } catch (err) {
      console.warn('Failed to persist scene templates:', err);
    }
  }, [sceneTemplates]);

  const handleApplySceneTemplate = (tmpl: SceneTemplateItem) => {
    if (onLayoutChange) {
      onLayoutChange(tmpl.layout);
    }
    if (onToggleParticipantActive && participants) {
      participants.forEach(p => {
        const shouldBeActive = tmpl.activeParticipantIds.includes(p.id);
        if (shouldBeActive && !p.isActive) {
          onToggleParticipantActive(p.id);
        } else if (!shouldBeActive && p.isActive) {
          onToggleParticipantActive(p.id);
        }
      });
    }
    if (onSetActiveBanner) {
      onSetActiveBanner(tmpl.activeBannerId);
    }
    if (tmpl.activeLogo && setActiveLogo) {
      setActiveLogo(tmpl.activeLogo);
    }
    if (tmpl.activeOverlay !== undefined && setActiveOverlay) {
      setActiveOverlay(tmpl.activeOverlay);
    }
    if (tmpl.activeBackground && setActiveBackground) {
      setActiveBackground(tmpl.activeBackground);
    }
  };

  const handleSaveCurrentSceneTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSceneTemplateName.trim()) {
      alert('Por favor, digite um nome para a cena!');
      return;
    }
    const activePartIds = participants.filter(p => p.isActive).map(p => p.id);
    const newTmpl: SceneTemplateItem = {
      id: `scntmpl-custom-${Date.now()}`,
      name: newSceneTemplateName.trim(),
      description: `Layout ${layout.toUpperCase()} com ${activePartIds.length} participante(s)`,
      layout: layout,
      activeParticipantIds: activePartIds,
      activeBannerId: activeBannerId,
      activeLogo: activeLogo,
      activeOverlay: activeOverlay,
      activeBackground: activeBackground,
      isCustom: true
    };
    setSceneTemplates(prev => [newTmpl, ...prev]);
    setNewSceneTemplateName('');
  };

  const handleDeleteSceneTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSceneTemplates(prev => prev.filter(t => t.id !== id));
  };

  // Brand Presets States
  const [customPresets, setCustomPresets] = useState<BrandPreset[]>(() => {
    try {
      const saved = localStorage.getItem('pwstream_custom_presets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newPresetName, setNewPresetName] = useState('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const presetFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('pwstream_custom_presets', JSON.stringify(customPresets));
  }, [customPresets]);

  const handleSaveCurrentPreset = () => {
    if (!newPresetName.trim()) {
      alert("Por favor, digite um nome para o preset!");
      return;
    }
    const newPreset: BrandPreset = {
      id: `preset-custom-${Date.now()}`,
      name: newPresetName.trim(),
      streamColor,
      textStyle,
      activeLogo,
      isCustom: true
    };
    setCustomPresets(prev => [newPreset, ...prev]);
    setNewPresetName('');
    setIsSavingPreset(false);
  };

  const handleApplyPreset = (p: BrandPreset) => {
    onStreamColorChange(p.streamColor);
    setTextStyle(p.textStyle);
    setActiveLogo(p.activeLogo);
  };

  const handleDeleteCustomPreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomPresets(prev => prev.filter(p => p.id !== id));
  };

  const handleExportCurrentPreset = () => {
    const config = {
      name: "Meu Preset Customizado",
      streamColor,
      textStyle
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `preset-brand-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportPreset = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.streamColor && parsed.textStyle) {
          onStreamColorChange(parsed.streamColor);
          setTextStyle(parsed.textStyle);
          if (parsed.activeLogo) {
            setActiveLogo(parsed.activeLogo);
          }
          const newPreset: BrandPreset = {
            id: `preset-custom-${Date.now()}`,
            name: parsed.name || file.name.replace('.json', ''),
            streamColor: parsed.streamColor,
            textStyle: parsed.textStyle,
            activeLogo: parsed.activeLogo || activeLogo,
            isCustom: true
          };
          setCustomPresets(prev => [newPreset, ...prev]);
          alert("Preset importado e aplicado com sucesso!");
        } else {
          alert("Arquivo JSON inválido. Deve conter pelo menos 'streamColor' e 'textStyle'.");
        }
      } catch (err) {
        alert("Erro ao ler o arquivo JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Real-time viewer count simulation states
  const [viewerHistory, setViewerHistory] = useState<{ time: string; viewers: number }[]>(() => {
    const data = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const past = new Date(now.getTime() - i * 15 * 1000);
      data.push({
        time: past.toTimeString().split(' ')[0].substring(3), // "MM:SS" format
        viewers: Math.floor(100 + Math.random() * 50)
      });
    }
    return data;
  });

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setViewerHistory(prev => {
        const lastValue = prev[prev.length - 1]?.viewers ?? 120;
        // Fluctuates slightly, with slightly positive trend overall
        const change = Math.floor(Math.random() * 11) - 4; // -4 to +6
        const newValue = Math.max(10, lastValue + change);
        const nowStr = new Date().toTimeString().split(' ')[0].substring(3); // "MM:SS"

        const nextHistory = [...prev, { time: nowStr, viewers: newValue }];
        if (nextHistory.length > 12) {
          nextHistory.shift();
        }
        return nextHistory;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isLive]);

  const currentViewers = isLive && viewerHistory.length > 0 ? viewerHistory[viewerHistory.length - 1].viewers : 0;
  const activeViewersArray = isLive ? viewerHistory.map(h => h.viewers) : [0];
  const minViewers = isLive ? Math.min(...activeViewersArray) : 0;
  const maxViewers = isLive ? Math.max(...activeViewersArray) : 0;
  const avgViewers = isLive ? Math.round(activeViewersArray.reduce((a, b) => a + b, 0) / activeViewersArray.length) : 0;
  
  // Local state for comments filter
  const [commentFilter, setCommentFilter] = useState<'all' | 'facebook' | 'youtube'>('all');
  const [typedComment, setTypedComment] = useState('');

  // Local state for music subtab ('library' | 'upload')
  const [musicSubtab, setMusicSubtab] = useState<'library' | 'upload'>('library');

  // Local state for apps tab ('qrcode' | 'notes' | 'widgets')
  const [appsSubtab, setAppsSubtab] = useState<'qrcode' | 'notes' | 'widgets'>('qrcode');

  // Form states for scheduling new webinars directly from studio
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDesc, setScheduleDesc] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleType, setScheduleType] = useState<'live' | 'webinar' | 'pre-recorded'>('webinar');
  const [isSchedulingFormOpen, setIsSchedulingFormOpen] = useState(false);

  // Graphics folder dropdown state
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('Powerstar7');

  // Collapsible section states for Graphics panel
  const [isLogoOpen, setIsLogoOpen] = useState(true);
  const [isWatermarkOpen, setIsWatermarkOpen] = useState(true);
  const [isOverlayOpen, setIsOverlayOpen] = useState(true);
  const [isVideoOpen, setIsVideoOpen] = useState(true);
  const [isBgOpen, setIsBgOpen] = useState(true);
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(true);

  // References for custom file uploads
  const logoInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);
  const overlayInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Thumbnail modal state
  const [isThumbnailModalOpen, setIsThumbnailModalOpen] = useState(false);

  // Screen and Audio sidebar-specific state tools
  const [shareIn1080p, setShareIn1080p] = useState(false);
  const [autoAddScreen, setAutoAddScreen] = useState(true);
  const [selectedMicSidebar, setSelectedMicSidebar] = useState('Microfone Padrão (Yeti Stereo Microphone)');

  const handleBannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBannerText.trim()) {
      onAddBanner(newBannerText.trim());
      setNewBannerText('');
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedComment.trim()) {
      onPostComment(typedComment.trim());
      setTypedComment('');
    }
  };

  // Custom mock file upload handlers
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadCustomLogo(file);
      e.target.value = '';
    }
  };

  const handleWatermarkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadCustomWatermark(file);
      e.target.value = '';
    }
  };

  const handleOverlayUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadCustomOverlay(file);
      e.target.value = '';
    }
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadCustomBackground(file);
      e.target.value = '';
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadCustomAudio(file);
      e.target.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        await uploadVideoClip(files[i]);
      }
      e.target.value = '';
    }
  };

  // Preset Colors
  const PRESET_COLORS = [
    '#4683E0', // Sleek Royal Blue
    '#3b82f6', // Facebook Blue
    '#10b981', // Emerald Green
    '#8b5cf6', // Indigo Purple
    '#ff8f4b', // Studio Orange
    '#FF3D38', // Hot Red
    '#ffffff'  // Pure White
  ];

  return (
    <div className={`h-full bg-[var(--surface)] p-4 flex flex-col text-white selection:bg-blue-500 selection:text-white ${activeTab === 'seven' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
      
      {/* WIDGETS TAB PANEL */}
      {activeTab === 'widgets' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Section Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
                <LayoutGrid size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--ink-hi)] leading-tight">Widgets do Estúdio</h2>
                <p className="text-[11px] text-[var(--ink-lo)]">Ative ferramentas flutuantes, lousa, chat e atalhos</p>
              </div>
            </div>
          </div>

          {/* List of Studio Widgets */}
          <div className="space-y-3">

            {/* 1. Botão Chat Flutuante */}
            <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--line)]/80 hover:border-[var(--line-ctl)] transition-all flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${showWidgetChat ? 'bg-blue-500/20 text-blue-400' : 'bg-[var(--panel)] text-[var(--ink-lo)]'}`}>
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--ink-hi)]">Botão Chat Flutuante</h4>
                    <p className="text-[10px] text-[var(--ink-lo)]">Exibe o botão de chat no preview do estúdio</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleShowWidgetChat}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 shrink-0 ${
                    showWidgetChat ? 'bg-blue-600' : 'bg-[var(--panel)]'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    showWidgetChat ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
              
              {/* Opacity Control */}
              <div className="bg-[var(--surface)] rounded-lg p-2.5 border border-[var(--line)]/50">
                <div className="flex items-center justify-between mb-2 text-[10px]">
                  <span className="text-[var(--ink-lo)] font-medium">Transparência do Fundo</span>
                  <span className="text-blue-400 font-mono font-bold">{chatWidgetOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={chatWidgetOpacity}
                  onChange={(e) => onChatWidgetOpacityChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-[var(--panel)] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            {/* 2. Botão Lousa Digital */}
            <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--line)]/80 hover:border-[var(--line-ctl)] transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${showWidgetLousa ? 'bg-rose-500/20 text-rose-400' : 'bg-[var(--panel)] text-[var(--ink-lo)]'}`}>
                    <Pencil size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--ink-hi)]">Botão Lousa Digital</h4>
                    <p className="text-[10px] text-[var(--ink-lo)]">Exibe o botão de desenho na tela do estúdio</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleShowWidgetLousa}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                    showWidgetLousa ? 'bg-rose-600' : 'bg-[var(--panel)]'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    showWidgetLousa ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* 3. Botão Capturar Snapshot */}
            <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--line)]/80 hover:border-[var(--line-ctl)] transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${showWidgetSnapshot ? 'bg-amber-500/20 text-amber-400' : 'bg-[var(--panel)] text-[var(--ink-lo)]'}`}>
                    <Camera size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--ink-hi)]">Botão Capturar Snapshot</h4>
                    <p className="text-[10px] text-[var(--ink-lo)]">Exibe o botão de snapshot no preview do estúdio</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleShowWidgetSnapshot}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                    showWidgetSnapshot ? 'bg-amber-600' : 'bg-[var(--panel)]'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    showWidgetSnapshot ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 1. BROADCAST & STAGE TAB PANEL (Transmissão & Palco) */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[var(--ink-hi)] mb-1 flex items-center gap-2">
              <Tv size={18} className="text-blue-500" />
              Transmissão & Palco
            </h2>
            <p className="text-xs text-[var(--ink-lo)]">Configure as telas de transmissão, organize o palco e os destinos.</p>
          </div>

          {/* Segmented Control for Sub-tabs */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-1 bg-[var(--bg)] p-1 rounded-xl border border-[var(--line)]/80">
            <button
              type="button"
              onClick={() => setSettingsSubTab('devices')}
              className={`flex-none px-4 py-2 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                settingsSubTab === 'devices'
                  ? 'bg-[var(--color-brand-deep)] text-white shadow-md'
                  : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
              }`}
            >
              <Sliders size={14} />
              Palco & Disp.
            </button>
            <button
              type="button"
              onClick={() => setSettingsSubTab('transitions')}
              className={`flex-none px-4 py-2 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                settingsSubTab === 'transitions'
                  ? 'bg-[var(--color-brand-deep)] text-white shadow-md'
                  : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
              }`}
            >
              <Film size={14} />
              Cenas
            </button>
            <button
              type="button"
              onClick={() => setSettingsSubTab('transmission')}
              className={`flex-none px-4 py-2 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                settingsSubTab === 'transmission'
                  ? 'bg-[var(--color-brand-deep)] text-white shadow-md'
                  : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
              }`}
            >
              <Tv size={14} />
              Destinos & RTMP
            </button>
          </div>

          {settingsSubTab === 'devices' && (
            <div className="space-y-6">

          {/* FERRAMENTA DE COMPARTILHAMENTO DE TELA & SLIDES */}
          <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-3.5" id="screen-share-settings-tool">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider flex items-center gap-1.5">
                <Monitor size={14} className="text-blue-400" />
                Compartilhamento de Tela
              </h3>
              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-1 ${
                isScreenSharing 
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                  : 'bg-[var(--panel)] text-[var(--ink-dim)]'
              }`}>
                <span className={`w-1 h-1 rounded-full ${isScreenSharing ? 'bg-green-400 animate-ping' : 'bg-gray-500'}`}></span>
                {isScreenSharing ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <p className="text-[10px] text-[var(--ink-lo)] leading-normal">
              Compartilhe sua tela inteira, uma janela ou guias do navegador diretamente com os espectadores do webinar.
            </p>

            <button
              type="button"
              onClick={onToggleScreenShare}
              className={`w-full touch-action-btn py-2.5 px-4 rounded-xl border text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer touch-action-btn hover:scale-[1.02] active:scale-[0.98] ${
                isScreenSharing
                  ? 'bg-red-600/10 border-red-500 text-red-400 hover:bg-red-600/20 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                  : 'bg-[var(--color-brand-deep)]/15 border-[var(--color-brand)]/40 text-[var(--color-brand)] hover:bg-[var(--color-brand-deep)] hover:text-white shadow-md'
              }`}
            >
              <Monitor size={14} />
              {isScreenSharing ? 'Parar Compartilhamento' : 'Compartilhar Tela Agora'}
            </button>

            {/* Screen Share toggles */}
            <div className="space-y-2 pt-2.5 border-t border-[var(--line)]/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[var(--ink)]">Transmitir em 1080p (Full HD)</p>
                  <p className="text-[9px] text-[var(--ink-dim)]">Qualidade de compartilhamento máxima</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShareIn1080p(!shareIn1080p)}
                  className={`w-8 h-4.5 rounded-full p-0.5 transition-colors relative flex items-center ${
                    shareIn1080p ? 'bg-blue-500' : 'bg-[var(--raise)]'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform shadow ${
                    shareIn1080p ? 'translate-x-3.5' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--line)]/30">
                <div>
                  <p className="text-xs font-semibold text-[var(--ink)]">Auto-adicionar ao Palco</p>
                  <p className="text-[9px] text-[var(--ink-dim)]">Adicionar feed de tela à live na hora</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoAddScreen(!autoAddScreen)}
                  className={`w-8 h-4.5 rounded-full p-0.5 transition-colors relative flex items-center ${
                    autoAddScreen ? 'bg-blue-500' : 'bg-[var(--raise)]'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform shadow ${
                    autoAddScreen ? 'translate-x-3.5' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>
            </div>
          </div>

          {/* CONTROLE DE ENTRADA DE ÁUDIO & MICROFONE */}
          <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-3.5" id="audio-settings-tool">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 size={14} className="text-blue-400" />
                Controle de Áudio & Mic
              </h3>
              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-1 ${
                !isMuted 
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                  : 'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}>
                <span className={`w-1 h-1 rounded-full ${!isMuted ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></span>
                {!isMuted ? 'Microfone Ativo' : 'Mutado'}
              </span>
            </div>

            {/* Quick Mic Mute Toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onToggleMute}
                className={`w-full touch-action-btn py-2 px-3 rounded-xl border text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isMuted
                    ? 'bg-red-600/10 border-red-500 text-white'
                    : 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink)] hover:text-[var(--ink-hi)] hover:border-[var(--line-ctl)]'
                }`}
              >
                {!isMuted ? <Mic size={14} className="text-blue-400" /> : <MicOff size={14} className="text-red-500" />}
                {isMuted ? 'Ativar Microfone' : 'Mutar Microfone'}
              </button>
            </div>

            {/* Input VU Meter */}
            <div className="p-2.5 bg-[var(--surface)] border border-[var(--line)]/80 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[8.5px] font-bold text-[var(--ink-lo)] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Monitor de Sinal de Voz
                </span>
                <span className="text-[8px] text-[var(--ink-dim)] font-mono">Real-time</span>
              </div>
              <AudioVUMeter isMuted={isMuted} isActive={true} simulationType="speech" />
            </div>

            {/* Microphone Selector Dropdown inside the panel */}
            <div className="space-y-1.5">
              <label htmlFor="mic-select-sidebar" className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block text-left">
                Selecione o Dispositivo de Entrada
              </label>
              <select
                id="mic-select-sidebar"
                value={selectedMicSidebar}
                onChange={(e) => setSelectedMicSidebar(e.target.value)}
                className="w-full bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--ink)] font-semibold px-2.5 py-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="Microfone Padrão (Yeti Stereo Microphone)">Microfone Padrão (Yeti Stereo Mic)</option>
                <option value="c922 Pro Stream Webcam Mic">c922 Pro Stream Webcam Mic</option>
                <option value="Microfone Interno (Built-in Audio)">Microfone Interno (Built-in Audio)</option>
                <option value="ByteCast VirtualAudioDriver">ByteCast VirtualAudioDriver</option>
                <option value="Auscultadores Virtuais (WebinarGG Line)">Auscultadores Virtuais (WebinarGG Line)</option>
              </select>
            </div>

            {/* Soundtrack/Synthesizer volume controller inside settings panel */}
            <div className="space-y-2 pt-2.5 border-t border-[var(--line)]/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider">Volume da Trilha Sonora</span>
                <span className="text-xs text-blue-400 font-mono font-bold">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer h-1.5 rounded-lg bg-[var(--panel)]"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider">Loop da Música de Fundo</span>
                <button
                  type="button"
                  onClick={() => setMusicLoop(!musicLoop)}
                  className={`w-8 h-4.5 rounded-full p-0.5 transition-colors relative flex items-center ${
                    musicLoop ? 'bg-blue-500' : 'bg-[var(--raise)]'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform shadow ${
                    musicLoop ? 'translate-x-3.5' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>

              {/* AUTO-FADE (DUCKING) CONFIGURATION */}
              <div className="pt-2.5 border-t border-[var(--line)]/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block">Auto-fade (Ducking de Áudio)</span>
                    <span className="text-[9px] text-[var(--ink-lo)]">Abaixa a música ao detectar fala</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleAutoFade(!isAutoFadeEnabled)}
                    className={`w-8 h-4.5 rounded-full p-0.5 transition-colors relative flex items-center ${
                      isAutoFadeEnabled ? 'bg-blue-500' : 'bg-[var(--raise)]'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform shadow ${
                      isAutoFadeEnabled ? 'translate-x-3.5' : 'translate-x-0'
                    }`}></div>
                  </button>
                </div>

                {isAutoFadeEnabled && (
                  <div className="space-y-2.5 pt-1.5 border-t border-[var(--line)]/50 animate-in fade-in slide-in-from-top-1 duration-250 text-left">
                    {/* Volume Factor Slider */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[var(--ink-lo)] font-medium">Volume da Música com Fala</span>
                        <span className="font-mono text-blue-400 font-bold">{Math.round(autoFadeVolumeFactor * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.8"
                        step="0.05"
                        value={autoFadeVolumeFactor}
                        onChange={(e) => onChangeAutoFadeVolumeFactor(parseFloat(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer h-1 rounded-lg bg-[var(--panel)]"
                      />
                    </div>

                    {/* Voice Sensitivity Slider */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[var(--ink-lo)] font-medium">Sensibilidade de Voz</span>
                        <span className="font-mono text-blue-400 font-bold">{Math.round(autoFadeSensitivity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={autoFadeSensitivity}
                        onChange={(e) => onChangeAutoFadeSensitivity(parseFloat(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer h-1 rounded-lg bg-[var(--panel)]"
                      />
                    </div>

                    {/* Dynamic Real-time Ducking Status Badge */}
                    <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[9px] transition-all duration-300 ${
                      isPresenterSpeaking 
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                        : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400'
                    }`}>
                      <span className="font-medium text-[var(--ink-lo)]">Voz do Apresentador:</span>
                      <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${isPresenterSpeaking ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                        {isPresenterSpeaking ? 'Falando (Ducking)' : 'Silêncio (Normal)'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>



          {/* AUTOMAÇÃO DE CENAS POR VOZ */}
          <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-3.5" id="scene-automation-panel">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={14} className="text-blue-400" />
                Automação de Cenas
              </h3>
              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-1 ${
                isSceneAutomationEnabled 
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_8px_rgba(70,131,224,0.15)]' 
                  : 'bg-[var(--panel)] text-[var(--ink-dim)]'
              }`}>
                <span className={`w-1 h-1 rounded-full ${isSceneAutomationEnabled ? 'bg-blue-400 animate-pulse' : 'bg-gray-500'}`}></span>
                {isSceneAutomationEnabled ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <p className="text-[10px] text-[var(--ink-lo)] leading-normal">
              Alterna o layout principal automaticamente entre <strong>Solo</strong>, <strong>Duo</strong> ou <strong>Apresentação</strong> com base em quem está falando na transmissão por detecção de áudio.
            </p>

            <div className="flex items-center justify-between p-2.5 bg-[var(--surface)]/60 border border-[var(--line)]/80 rounded-xl">
              <div>
                <p className="text-xs font-semibold text-[var(--ink)]">Alternar por Voz</p>
                <p className="text-[9px] text-[var(--ink-dim)]">Ativa a detecção inteligente</p>
              </div>
              <button
                type="button"
                onClick={() => onToggleSceneAutomation && onToggleSceneAutomation(!isSceneAutomationEnabled)}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors relative flex items-center ${
                  isSceneAutomationEnabled ? 'bg-blue-500' : 'bg-[var(--raise)]'
                }`}
              >
                <div className={`w-4.5 h-4.5 bg-white rounded-full transition-transform shadow ${
                  isSceneAutomationEnabled ? 'translate-x-4.5' : 'translate-x-0'
                }`}></div>
              </button>
            </div>

            {isSceneAutomationEnabled && (
              <div className="p-3 bg-[var(--surface)] border border-blue-500/20 rounded-xl space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-[var(--ink-lo)] uppercase tracking-wider">Atividade de Áudio</span>
                  <span className="text-[8px] text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    LIVE SENSING
                  </span>
                </div>
                
                <div className="space-y-1.5 text-left pt-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--ink-lo)]">Palestrante Ativo:</span>
                    <span className="font-bold text-[var(--ink-hi)] flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {activeSpeaker === 'p-local' ? 'Marcos (Você)' : 'Ana Silva (Convidada)'}
                    </span>
                  </div>
                  <p className="text-[9px] text-[var(--ink-dim)] leading-normal">
                    {activeSpeaker === 'p-local' 
                      ? 'Marcos está falando agora. O estúdio focou no layout Solo/Apresentação.' 
                      : 'Ana Silva está falando agora. O estúdio expandiu para o layout Duo.'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Moved from StudioPreview: Gerenciar Fontes */}
          <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-semibold text-[var(--ink-lo)] uppercase tracking-wider text-left">
              Gerenciar Fontes (Palco)
            </h3>
            <p className="text-[10px] text-[var(--ink-lo)] -mt-1 leading-normal">Adicione ou remova participantes do webinar com um único clique.</p>
            
            <div className="space-y-2">
              {participants.map(p => (
                <button 
                  key={p.id}
                  onClick={() => onToggleParticipantActive(p.id)}
                  className={`w-full text-left rounded-xl p-2.5 border transition-all relative flex items-center justify-between ${
                    p.isActive 
                      ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500/30 text-white' 
                      : 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink-lo)] hover:border-[var(--line-ctl)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {p.isScreenShare ? (
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                        <Monitor size={16} />
                      </div>
                    ) : (
                      <img 
                        src={p.avatarUrl} 
                        alt={p.name} 
                        className="w-8 h-8 rounded-full object-cover border border-[var(--line)] shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="overflow-hidden">
                      <p className={`text-xs font-bold truncate ${p.isActive ? 'text-[var(--ink-hi)]' : 'text-[var(--ink)]'}`}>{p.name}</p>
                      <p className="text-[9px] text-[var(--ink-dim)]">
                        {p.isLocal ? 'Apresentador Principal' : p.isScreenShare ? 'Slide Compartilhado' : 'Convidado Externo'}
                      </p>
                      
                      {/* Mini visual mic level VU meter */}
                      {!p.isScreenShare && (
                        <div className="w-24 mt-1.5" onClick={(e) => e.stopPropagation()}>
                          <AudioVUMeter 
                            isMuted={p.id === 'p-local' ? isMuted : false} 
                            isActive={true} 
                            simulationType={
                              isSceneAutomationEnabled 
                                ? (activeSpeaker === p.id ? 'speech' : 'ambient')
                                : 'speech'
                            } 
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {p.isActive ? (
                      <span className="text-[9px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                        No Palco
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-[var(--ink-lo)] hover:text-[var(--ink-hi)] border border-[var(--line-ctl)] bg-[var(--bg)] px-2 py-0.5 rounded">
                        + Add
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* TRANSIÇÕES DO STUDIO */}
          <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-3.5" id="studio-transitions-tool">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-blue-400" />
                Transições do Studio
              </h3>
              <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Estilo Ativo
              </span>
            </div>

            <p className="text-[10px] text-[var(--ink-lo)] leading-normal text-left">
              Escolha o efeito visual de transição ao mudar de layout ou ao alternar feeds no palco.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'cut', label: 'Corte', desc: 'Instantâneo' },
                { id: 'fade', label: 'Fusão', desc: 'Fade' },
                { id: 'slide', label: 'Slide', desc: 'Deslizar' },
                { id: 'zoom', label: 'Zoom', desc: 'Aproximar' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onTransitionTypeChange && onTransitionTypeChange(t.id as any)}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all flex flex-col justify-center items-center h-11 cursor-pointer touch-action-btn hover:scale-[1.02] active:scale-[0.98] ${
                    transitionType === t.id 
                      ? 'bg-blue-500/10 border-blue-500 text-blue-400 ring-1 ring-blue-500/30 font-bold' 
                      : 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink-lo)] hover:border-[var(--line-ctl)] hover:text-[var(--ink-hi)]'
                  }`}
                >
                  <span className="text-xs font-extrabold tracking-wide">{t.label}</span>
                  <span className="text-[8px] opacity-70 scale-90 whitespace-nowrap leading-none mt-0.5">{t.desc}</span>
                </button>
              ))}
            </div>

            {/* Slider duration */}
            <div className="space-y-2 pt-2.5 border-t border-[var(--line)]/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider">Velocidade da Transição</span>
                <span className="text-xs text-blue-400 font-mono font-bold">{transitionDuration} ms</span>
              </div>
              <input
                type="range"
                min="100"
                max="1500"
                step="50"
                value={transitionDuration}
                onChange={(e) => onTransitionDurationChange && onTransitionDurationChange(parseInt(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer h-1.5 rounded-lg bg-[var(--panel)]"
              />
            </div>
          </div>

          {/* CONFIGURAÇÃO DE TRANSIÇÕES POR CENA */}
          <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-3.5">
            <div>
              <h3 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={14} className="text-blue-400" />
                Transições Automáticas por Cena
              </h3>
              <p className="text-[10px] text-[var(--ink-lo)] mt-0.5 leading-normal">Configure a transição automática e a duração específica ao alternar para cada cena.</p>
            </div>

            {/* Scene Selector Inside Panel */}
            <div className="space-y-3">
              <div className="flex bg-[var(--surface)] p-1 rounded-lg border border-[var(--line)]/80">
                {[
                  { id: 'scene-1', name: 'Abertura' },
                  { id: 'scene-2', name: 'Solo' },
                  { id: 'scene-3', name: 'Duo' },
                  { id: 'scene-4', name: 'Slides' },
                  { id: 'scene-5', name: 'Vídeo' }
                ].map(sc => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setSelectedSceneConfigId(sc.id)}
                    className={`flex-1 py-1 text-[9px] font-bold rounded transition-all cursor-pointer ${
                      selectedSceneConfigId === sc.id 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                    }`}
                  >
                    {sc.name}
                  </button>
                ))}
              </div>

              {/* Selected Scene Transition Editor */}
              {(() => {
                const config = sceneTransitions[selectedSceneConfigId] || { type: 'fade', duration: 300 };
                return (
                  <div className="space-y-3 bg-[var(--surface)]/40 p-3 rounded-lg border border-[var(--line)]/60 text-left animate-in fade-in duration-250">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block">Tipo de Transição</label>
                      <select
                        value={config.type}
                        onChange={(e) => onUpdateSceneTransition(selectedSceneConfigId, e.target.value as any, config.duration)}
                        className="w-full bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--ink)] font-semibold px-2 py-1.5 rounded-lg focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                      >
                        <option value="cut">Corte Seco (Cut)</option>
                        <option value="fade">Desvanecer Suave (Fade)</option>
                        <option value="slide">Deslizar Lateral (Slide)</option>
                        <option value="zoom">Aproximação (Zoom)</option>
                        <option value="dip-to-color">Cor de Fundo (Dip to Color)</option>
                        <option value="slide-wipe">Varredura Lateral (Slide Wipe)</option>
                        <option value="shutter-wipe">Obturador (Shutter Wipe)</option>
                        <option value="radial-wipe">Circular (Radial Wipe)</option>
                        <option value="flash">Clarão Branco (Flash)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-[var(--ink-lo)] uppercase tracking-wider">Duração</span>
                        <span className="font-mono text-blue-400 font-bold">{config.duration} ms</span>
                      </div>
                      <input
                        type="range"
                        min={config.type === 'cut' ? 0 : 100}
                        max={1500}
                        step={50}
                        value={config.duration}
                        onChange={(e) => onUpdateSceneTransition(selectedSceneConfigId, config.type, parseInt(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer h-1 rounded-lg bg-[var(--panel)]"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Configurações de Gravação Local */}
          <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-semibold text-[var(--ink-lo)] uppercase tracking-wider text-left flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Film size={14} className="text-blue-500" />
                Gravação Local da Transmissão
              </span>
              <span className="text-[10px] text-green-500 font-extrabold lowercase bg-green-500/10 px-2 py-0.5 rounded">Ativo</span>
            </h3>
            <p className="text-[10px] text-[var(--ink-lo)] -mt-1 leading-normal">Defina a qualidade e o formato preferido para salvar a transmissão no seu disco local.</p>

            <div className="grid grid-cols-2 gap-4 pt-1">
              {/* Formato de Gravação */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block text-left">Formato de Saída</label>
                <div className="flex bg-[var(--surface)] p-0.5 rounded-lg border border-[var(--line)]">
                  {(['mp4', 'webm'] as const).map(fmt => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setRecordingFormat(fmt)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all uppercase cursor-pointer ${
                        recordingFormat === fmt 
                          ? 'bg-blue-500 text-white shadow-md' 
                          : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Qualidade da Gravação */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block text-left">Resolução / Qualidade</label>
                <div className="flex bg-[var(--surface)] p-0.5 rounded-lg border border-[var(--line)]">
                  {(['720p', '1080p'] as const).map(qual => (
                    <button
                      key={qual}
                      type="button"
                      onClick={() => setRecordingQuality(qual)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        recordingQuality === qual 
                          ? 'bg-blue-500 text-white shadow-md' 
                          : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                      }`}
                    >
                      {qual}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-1.5 border-t border-[var(--line)]/60 flex items-center justify-between text-[9px] text-[var(--ink-dim)]">
              <span className="flex items-center gap-1 font-semibold text-[var(--ink-lo)]">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Salvar automático no encerramento
              </span>
              <span className="font-mono bg-[var(--bg)]/60 px-2 py-0.5 rounded text-blue-400 font-bold">Bitrate: {recordingQuality === '1080p' ? '6.0' : '3.5'} Mbps</span>
            </div>
          </div>
          </div>
          )}

          {settingsSubTab === 'transitions' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Scene Transitions Config */}
              <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider flex items-center gap-1.5">
                    <Film size={14} className="text-blue-400" />
                    Transições de Cena
                  </h3>
                </div>
                
                <p className="text-[10px] text-[var(--ink-lo)] leading-normal">
                  Configure o tipo e duração da transição para cada cena ao alternar para ela.
                </p>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block text-left">Cena Alvo</label>
                    <select
                      value={selectedSceneForTransition}
                      onChange={(e) => setSelectedSceneForTransition(e.target.value)}
                      className="w-full bg-[var(--surface)] border border-[var(--line)] text-[var(--ink-hi)] text-xs rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="scene-1">Cena 1 (Apresentador)</option>
                      <option value="scene-2">Cena 2 (Entrevista)</option>
                      <option value="scene-3">Cena 3 (Tela Cheia)</option>
                      <option value="scene-4">Cena 4 (Layout Lado-a-Lado)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block text-left">Tipo de Transição</label>
                    <div className="grid grid-cols-2 gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--line)]">
                      {([
                        { id: 'cut', label: 'Corte Seco (Cut)' },
                        { id: 'fade', label: 'Esmaecer (Fade)' },
                        { id: 'slide', label: 'Deslizar (Slide)' },
                        { id: 'zoom', label: 'Aproximar (Zoom)' },
                        { id: 'dip-to-color', label: 'Dip to Color' },
                        { id: 'slide-wipe', label: 'Slide Wipe' },
                        { id: 'shutter-wipe', label: 'Shutter Wipe' },
                        { id: 'radial-wipe', label: 'Radial Wipe' },
                        { id: 'flash', label: 'Flash' }
                      ] as const).map(anim => {
                        const currentTransition = sceneTransitions[selectedSceneForTransition]?.type || 'fade';
                        const currentDuration = sceneTransitions[selectedSceneForTransition]?.duration || 300;
                        return (
                          <button
                            key={anim.id}
                            type="button"
                            onClick={() => onUpdateSceneTransition(selectedSceneForTransition, anim.id, currentDuration)}
                            className={`py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                              currentTransition === anim.id 
                                ? 'bg-blue-500 text-white shadow-md' 
                                : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                            }`}
                          >
                            {anim.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block text-left">Duração da Transição</label>
                      <span className="text-[10px] text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded">{sceneTransitions[selectedSceneForTransition]?.duration || 300}ms</span>
                    </div>
                    <input 
                      type="range" 
                      min="100" 
                      max="2000" 
                      step="100"
                      value={sceneTransitions[selectedSceneForTransition]?.duration || 300}
                      onChange={(e) => {
                        const currentTransition = sceneTransitions[selectedSceneForTransition]?.type || 'fade';
                        onUpdateSceneTransition(selectedSceneForTransition, currentTransition, parseInt(e.target.value));
                      }}
                      className="w-full accent-blue-500"
                    />
                    <div className="flex justify-between text-[8px] text-[var(--ink-dim)] font-medium">
                      <span>Rápido (100ms)</span>
                      <span>Lento (2000ms)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Salvar Layout como Template */}
              <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider flex items-center gap-1.5">
                    <Save size={14} className="text-emerald-400" />
                    Templates de Layout
                  </h3>
                </div>
                
                <p className="text-[10px] text-[var(--ink-lo)] leading-normal">
                  Salve a configuração atual de participações e ativos como um template para reaproveitar em futuros webinars.
                </p>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Nome do Template..."
                      value={layoutTemplateName}
                      onChange={(e) => setLayoutTemplateName(e.target.value)}
                      className="flex-1 bg-[var(--surface)] border border-[var(--line)] text-[var(--ink-hi)] text-[10px] font-bold rounded-lg px-3 py-2 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-[var(--ink-dim)]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (layoutTemplateName.trim()) {
                          setSavedLayoutTemplates([...savedLayoutTemplates, { id: Date.now().toString(), name: layoutTemplateName.trim() }]);
                          setLayoutTemplateName('');
                        }
                      }}
                      disabled={!layoutTemplateName.trim()}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      Salvar
                    </button>
                  </div>
                  
                  {savedLayoutTemplates.length > 0 && (
                    <div className="space-y-1.5 mt-3 pt-3 border-t border-[var(--line)]/50">
                      <label className="text-[9px] font-bold text-[var(--ink-dim)] uppercase tracking-wider block">Templates Salvos</label>
                      <div className="space-y-1.5">
                        {savedLayoutTemplates.map(template => (
                          <div key={template.id} className="flex justify-between items-center bg-[var(--surface)] border border-[var(--line)]/80 px-2.5 py-2 rounded-lg">
                            <span className="text-[10px] font-bold text-[var(--ink)]">{template.name}</span>
                            <button
                               type="button"
                               className="text-[9px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1.5 rounded cursor-pointer transition-colors"
                               onClick={() => alert(`Layout '${template.name}' carregado com sucesso!`)}
                            >
                               Carregar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {settingsSubTab === 'transmission' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Destinations Selection */}
              <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-3" id="streaming-destinations-panel">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider text-left">
                      Transmitir para:
                    </h3>
                    <span className="text-[9px] font-black text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                      {destinations.filter(d => d.selected).length} selecionado(s)
                    </span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenAddChannelsModal) {
                        onOpenAddChannelsModal();
                      } else if (onOpenCustomDestinationsModal) {
                        onOpenCustomDestinationsModal();
                      }
                    }}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                    title="Adicionar novos canais de transmissão (YouTube, Facebook, Instagram, TikTok, Twitch, Kick, LinkedIn, Rumble)"
                  >
                    <Plus size={12} /> + Adicionar Canais
                  </button>
                </div>
                
                <div className="space-y-2">
                  {destinations.map(dest => {
                    const isCustomType = dest.isCustom || dest.platform === 'nginx' || dest.platform === 'srs' || dest.platform === 'kick' || dest.platform === 'restream';
                    return (
                      <button
                        key={dest.id}
                        onClick={() => onToggleDestination(dest.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all text-left group cursor-pointer ${
                          dest.selected 
                            ? 'bg-blue-500/10 border-blue-500 text-white ring-1 ring-blue-500/20' 
                            : 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink-lo)] hover:border-[var(--line-ctl)]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <img 
                            src={dest.avatarUrl} 
                            alt={dest.name} 
                            className="w-7 h-7 rounded-full object-cover shrink-0 border border-[var(--line-ctl)]"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className={`text-xs font-bold truncate ${dest.selected ? 'text-[var(--ink-hi)]' : 'text-[var(--ink)]'}`}>
                                {dest.name}
                              </p>
                              {isCustomType && (
                                <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  RTMP
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[8px] text-[var(--ink-lo)] uppercase font-bold">{dest.platform}</p>
                              {dest.streamUrl && (
                                <span className="text-[8px] text-[var(--ink-dim)] font-mono truncate max-w-[140px]">
                                  {dest.streamUrl.replace(/^rtmps?:\/\//, '').split('/')[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors ${
                            dest.selected ? 'bg-blue-500 border-blue-500 text-white' : 'border-[var(--line-ctl)] bg-[var(--panel)]'
                          }`}>
                            {dest.selected && <Check size={10} />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Quick manage button */}
                <button
                  type="button"
                  onClick={() => onOpenCustomDestinationsModal && onOpenCustomDestinationsModal()}
                  className="w-full py-2 px-3 bg-[var(--surface)] hover:bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--line-ctl)] rounded-lg text-xs font-bold text-[var(--ink)] hover:text-[var(--ink-hi)] transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <Settings size={13} className="text-blue-400" />
                  Gerenciar URLs, Chaves & NGINX RTMP
                </button>
              </div>

              {/* CLOUDFLARE STREAM GLOBAL CDN PANEL */}
              <div className="bg-gradient-to-br from-blue-950/40 via-[var(--bg)] to-[var(--surface)]/60 border border-blue-500/30 p-4 rounded-xl space-y-4" id="cloudflare-stream-panel">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <h3 className="text-xs font-bold text-[var(--ink-hi)] uppercase tracking-wider">
                      Cloudflare Stream Ingest
                    </h3>
                  </div>
                  <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Live Input Ativo
                  </span>
                </div>

                <p className="text-[10px] text-[var(--ink)] leading-normal text-left">
                  Pipeline global com ingestão RTMPS, SRT e WebRTC WHIP para streaming de ultra-baixa latência com distribuição em CDN mundial.
                </p>

                {/* Quick Action Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (setRtmpServer && setStreamKey) {
                        setRtmpServer(CLOUDFLARE_STREAM_CONFIG.rtmpsUrl);
                        setStreamKey(CLOUDFLARE_STREAM_CONFIG.rtmpsKey);
                        setCopiedServer(true);
                        setTimeout(() => setCopiedServer(false), 2500);
                      }
                    }}
                    className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    <CheckCircle2 size={12} />
                    Usar RTMPS no Studio
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenCloudflareModal && onOpenCloudflareModal()}
                    className="p-2 bg-[var(--panel)] hover:bg-[var(--raise)] text-blue-300 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 border border-[var(--line-ctl)] cursor-pointer"
                  >
                    <Sparkles size={12} className="text-orange-400" />
                    Central Cloudflare
                  </button>
                </div>

                {/* Cloudflare Quick URLs List */}
                <div className="space-y-2 pt-1 border-t border-[var(--line)]/80 text-left">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--ink-lo)] font-semibold">Live Input ID:</span>
                    <code className="text-blue-400 font-mono text-[9px] bg-[var(--bg)] px-1.5 py-0.5 rounded border border-[var(--line)]">
                      {CLOUDFLARE_STREAM_CONFIG.liveInputId.slice(0, 14)}...
                    </code>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--ink-lo)] font-semibold">WebRTC WHIP Ingest:</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(CLOUDFLARE_STREAM_CONFIG.whipPublishUrl);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="text-purple-400 hover:text-purple-300 text-[9px] font-mono flex items-center gap-1 cursor-pointer"
                      title="Copiar URL WebRTC WHIP"
                    >
                      <Copy size={10} /> Copiar WHIP
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--ink-lo)] font-semibold">Manifesto HLS (.m3u8):</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(CLOUDFLARE_STREAM_CONFIG.hlsManifestUrl);
                        setCopiedServer(true);
                        setTimeout(() => setCopiedServer(false), 2000);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 text-[9px] font-mono flex items-center gap-1 cursor-pointer"
                      title="Copiar Manifesto HLS"
                    >
                      <Copy size={10} /> Copiar HLS
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--ink-lo)] font-semibold">Stream Player Iframe:</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(CLOUDFLARE_STREAM_CONFIG.embedIframeCode);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="text-orange-400 hover:text-orange-300 text-[9px] font-mono flex items-center gap-1 cursor-pointer"
                      title="Copiar Código Iframe"
                    >
                      <Copy size={10} /> Copiar Embed
                    </button>
                  </div>
                </div>
              </div>

              {/* OBS / RTMP EXTERNO CONFIGURATION PANEL */}
              <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-4" id="rtmp-external-obs-config">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-blue-400" />
                    OBS / Transmissão Externa
                  </h3>
                  <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Fornecido pelo Admin Principal
                  </span>
                </div>

                <p className="text-[10px] text-[var(--ink-lo)] leading-normal text-left">
                  Chave e servidor de entrada para seu OBS/vMix. Para gerenciar chaves adicionais, acesse o <strong>Admin Principal (/admin)</strong>.
                </p>

                {/* RTMP Server URL Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block text-left">
                    Servidor / URL de Ingestão (RTMP)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={rtmpServer}
                      onChange={(e) => setRtmpServer && setRtmpServer(e.target.value)}
                      placeholder="rtmps://live.cloudflare.com:443/live/"
                      className="flex-1 bg-[var(--surface)] border border-[var(--line)] rounded-lg px-2.5 py-2 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(rtmpServer);
                        setCopiedServer(true);
                        setTimeout(() => setCopiedServer(false), 2000);
                      }}
                      className={`px-3 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                        copiedServer 
                          ? 'bg-green-500/10 border-green-500 text-green-400' 
                          : 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:border-[var(--line-ctl)]'
                      }`}
                      title="Copiar URL do Servidor"
                    >
                      {copiedServer ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  {copiedServer && <p className="text-[8px] text-green-400 text-left font-semibold">URL Copiada para a área de transferência!</p>}
                </div>

                {/* Stream Key Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block text-left">
                    Chave de Transmissão / Stream Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={streamKey}
                      onChange={(e) => setStreamKey && setStreamKey(e.target.value)}
                      placeholder="Chave de Stream"
                      className="flex-1 bg-[var(--surface)] border border-[var(--line)] rounded-lg px-2.5 py-2 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(streamKey);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className={`px-3 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                        copiedKey 
                          ? 'bg-green-500/10 border-green-500 text-green-400' 
                          : 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:border-[var(--line-ctl)]'
                      }`}
                      title="Copiar Chave de Stream"
                    >
                      {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  {copiedKey && <p className="text-[8px] text-green-400 text-left font-semibold">Chave Copiada para a área de transferência!</p>}
                </div>

                {/* Stream Delay Input */}
                <div className="space-y-1.5 pt-2 border-t border-[var(--line)]/60 mt-2">
                  <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block text-left flex items-center gap-1.5">
                    <Clock size={12} className="text-[var(--ink-lo)]" />
                    Atraso de Transmissão (Stream Delay)
                  </label>
                  <p className="text-[9px] text-[var(--ink-lo)] leading-normal text-left mb-2">
                    Adicione um atraso customizado (em segundos) para proteger sua transmissão contra "stream sniping".
                  </p>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={streamDelay}
                      onChange={(e) => setStreamDelay(Number(e.target.value) || 0)}
                      className="w-24 bg-[var(--surface)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-blue-500 transition-all font-mono"
                    />
                    <span className="text-[10px] text-[var(--ink-lo)] font-semibold">segundos</span>
                  </div>
                </div>

                {/* Quick Help Guide */}
                <div className="p-3 bg-[var(--surface)] border border-[var(--line)]/60 rounded-xl space-y-2 text-left">
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-wider block">
                    Guia rápido para OBS Studio:
                  </span>
                  <ol className="list-decimal list-inside text-[9px] text-[var(--ink-lo)] space-y-1 leading-normal pl-0.5">
                    <li>Abra as <b className="text-[var(--ink)]">Configurações</b> no OBS.</li>
                    <li>Vá para a aba <b className="text-[var(--ink)]">Transmissão</b>.</li>
                    <li>Em Serviço, selecione <b className="text-[var(--ink)]">Personalizado...</b>.</li>
                    <li>Cole o <b className="text-[var(--ink)]">Servidor</b> e a <b className="text-[var(--ink)]">Chave de Transmissão</b>.</li>
                    <li>Clique em <b className="text-[var(--ink)]">Iniciar Transmissão</b> no OBS.</li>
                  </ol>
                </div>
              </div>

              {/* Title & Description Form */}
              <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-4">
                <div>
                  <label htmlFor="title-input" className="block text-xs font-medium text-[var(--ink-lo)] mb-1">Título do Webinar</label>
                  <input
                    id="title-input"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Insira o título da transmissão"
                    className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="desc-input" className="block text-xs font-medium text-[var(--ink-lo)] mb-1">Descrição</label>
                  <textarea
                    id="desc-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Diga algo sobre esta transmissão..."
                    rows={3}
                    className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Extra options */}
              <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-3">
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[var(--ink-hi)]">Thumbnail personalizada</p>
                      <p className="text-[9px] text-[var(--ink-lo)]">Adicionar capa para redes sociais</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isThumbnailEnabled}
                        onChange={(e) => setIsThumbnailEnabled(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-8 h-4.5 bg-[var(--surface)] border border-[var(--line)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-[var(--ink-lo)] peer-checked:after:bg-blue-500 after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-500/20 peer-checked:border-blue-500"></div>
                    </label>
                  </div>

                  {isThumbnailEnabled && (
                    <div className="mt-1 p-2.5 bg-[var(--surface)] rounded-xl border border-[var(--line)] flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      <p className="text-[10px] text-[var(--ink-lo)] text-left">Gere ou baixe capas de alta resolução de 1280x720 para a sua live:</p>
                      <button
                        type="button"
                        onClick={() => setIsThumbnailModalOpen(true)}
                        className="w-full touch-action-btn py-2 bg-blue-500/15 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/30 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit size={12} /> Personalizar Thumbnail (Capa)
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-[var(--line)]/80 pt-3">
                  <div>
                    <p className="text-xs font-semibold text-[var(--ink-hi)]">Agendar Webinar</p>
                    <p className="text-[9px] text-[var(--ink-lo)]">Marcar horário e data de início</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isScheduleEnabled}
                      onChange={(e) => setIsScheduleEnabled(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-8 h-4.5 bg-[var(--surface)] border border-[var(--line)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-[var(--ink-lo)] peer-checked:after:bg-blue-500 after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-500/20 peer-checked:border-blue-500"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. GRAPHICS TAB PANEL (Gráficos) - Styled EXACTLY like the Restream reference image! */}
      {(activeTab === 'design' || activeTab === 'video') && (
        <div className="space-y-4 flex flex-col h-full">
          
          {/* Header section with brand dropdown */}
          <div className="flex items-center justify-between bg-[var(--bg)] border border-[var(--line)] p-2.5 rounded-xl relative">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400">
                <Folder size={16} />
              </div>
              <div className="text-left relative">
                <p className="text-[10px] uppercase font-bold text-[var(--ink-dim)] leading-none">Pasta de Ativos</p>
                <button 
                  onClick={() => setIsFolderOpen(!isFolderOpen)}
                  className="text-xs font-bold text-[var(--ink-hi)] flex items-center gap-1 mt-1 hover:text-blue-400 transition-colors"
                >
                  {selectedFolder}
                  <ChevronDown size={12} />
                </button>
              </div>
            </div>
            
            {/* Folder Dropdown selector */}
            {isFolderOpen && (
              <div className="absolute top-12 left-2 z-50 w-48 bg-[var(--panel)] border border-[var(--line-ctl)] rounded-xl shadow-2xl p-1.5 text-left">
                {['Powerstar7', 'Webinar Studio', 'Marca Pessoal', 'Lançamentos', 'Marketing'].map(folder => (
                  <button
                    key={folder}
                    onClick={() => {
                      setSelectedFolder(folder);
                      setIsFolderOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between ${
                      selectedFolder === folder ? 'bg-blue-500 text-white' : 'text-[var(--ink)] hover:bg-[var(--panel)]'
                    }`}
                  >
                    {folder}
                    {selectedFolder === folder && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}

            <button 
              onClick={() => alert("Criar nova pasta de ativos gráficos para organizar outros webinar-packs!")}
              className="p-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--panel)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)] border border-[var(--line)] transition-all"
              title="Nova Coleção"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Edit Theme wide button */}
          <button 
            onClick={() => alert("As cores principais da marca e os estilos tipográficos dos letreiros foram movidos para a aba dedicada 'Temas' no menu vertical do painel!")}
            className="w-full touch-action-btn py-2.5 bg-[var(--raise)] hover:bg-[var(--raise)] text-[var(--ink-hi)] text-xs font-bold rounded-xl transition-all border border-[var(--line-ctl)]/80 flex items-center justify-center gap-1.5 shadow-md"
          >
            <Settings size={14} className="text-[var(--color-brand)]" />
            Editar Aparência (Tema)
          </button>

          {/* Collapsible Graphics subsections */}
          <div className="space-y-3 flex-1">
            
            {/* LOGO SECTION */}
            {activeTab === 'design' && (
              <div className="bg-[var(--bg)] border border-[var(--line)]/80 rounded-xl overflow-hidden">
                <div 
                  onClick={() => setIsLogoOpen(!isLogoOpen)}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-[var(--panel)]/30 transition-all select-none cursor-pointer"
                >
                  <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5 uppercase tracking-wider">
                    {isLogoOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    Logotipo
                    <span title="Exibido no canto superior direito do seu webinar. Clique no logo ativo para esconder do estúdio." className="inline-flex"><HelpCircle size={12} className="text-[var(--ink-dim)]" /></span>
                  </span>
                  
                  {/* Action buttons in header */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {/* Toggle show/hide logo button */}
                    <button
                      type="button"
                      onClick={() => setActiveLogo(activeLogo ? '' : (customLogos[0]?.url || LOGO_TEMPLATES[0]?.url || ''))}
                      className={`px-1.5 py-0.5 rounded border text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        activeLogo 
                          ? 'bg-blue-500/20 border-blue-500/60 text-blue-400 hover:bg-blue-500/30' 
                          : 'bg-[var(--surface)] border-[var(--line-ctl)] text-[var(--ink-dim)] hover:text-[var(--ink)] hover:border-[var(--line-ctl)]'
                      }`}
                      title={activeLogo ? "Clique para esconder o logotipo do estúdio" : "Clique para exibir o logotipo no estúdio"}
                    >
                      {activeLogo ? <Eye size={10} /> : <EyeOff size={10} />}
                      <span>{activeLogo ? 'Visível' : 'Oculto'}</span>
                    </button>

                    {/* Alignment shortcut buttons */}
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('studio-logo-pos-set', { detail: { pos: { x: 86, y: 4 } } }))}
                        className="w-4 h-4 rounded border border-[var(--line-ctl)] hover:border-blue-500 hover:text-blue-400 flex items-center justify-center text-[8px] font-bold text-[var(--ink-lo)] transition-colors cursor-pointer"
                        title="Fixar no Topo Direito (TR)"
                      >
                        TR
                      </button>
                      <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('studio-logo-pos-set', { detail: { pos: { x: 4, y: 4 } } }))}
                        className="w-4 h-4 rounded border border-[var(--line-ctl)] hover:border-blue-500 hover:text-blue-400 flex items-center justify-center text-[8px] font-bold text-[var(--ink-lo)] transition-colors cursor-pointer"
                        title="Fixar no Topo Esquerdo (TL)"
                      >
                        TL
                      </button>
                    </div>
                  </div>
                </div>

                {isLogoOpen && (
                  <div className="p-3 bg-[var(--surface)]/30 border-t border-[var(--line)]/60 space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-[var(--ink-lo)] pb-0.5">
                      <span>Clique na logo para <strong>exibir ou esconder</strong> do estúdio</span>
                      {activeLogo && (
                        <button
                          type="button"
                          onClick={() => setActiveLogo('')}
                          className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer underline text-[9px]"
                        >
                          Esconder logo
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {/* Upload card */}
                      <button 
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="aspect-square bg-[var(--bg)] hover:bg-blue-500/10 rounded-lg border-2 border-dashed border-[var(--line)] flex flex-col items-center justify-center text-[var(--ink-dim)] hover:text-blue-400 transition-all group cursor-pointer"
                        title="Enviar novo logotipo"
                      >
                        <Plus size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] mt-1 font-bold">Enviar</span>
                      </button>
                      <input 
                        type="file" 
                        ref={logoInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*" 
                        className="hidden" 
                      />

                      {/* Custom uploaded logos */}
                      {customLogos.map(tmpl => {
                        const isActive = activeLogo === tmpl.url;
                        return (
                          <button
                            key={tmpl.id}
                            type="button"
                            onClick={() => setActiveLogo(isActive ? '' : tmpl.url)}
                            className={`group aspect-square bg-[var(--bg)] rounded-lg p-1.5 border flex items-center justify-center transition-all overflow-hidden relative cursor-pointer ${
                              isActive 
                                ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-500/5' 
                                : 'border-[var(--line)] hover:border-[var(--line-ctl)]'
                            }`}
                            title={isActive ? "Ativo no estúdio - Clique para esconder" : "Clique para exibir no estúdio"}
                          >
                            <img 
                              src={tmpl.url} 
                              alt={tmpl.name} 
                              className="max-w-full max-h-full object-contain"
                            />
                            {isActive && (
                              <div className="absolute top-1 left-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-[var(--bg)] shadow"></div>
                            )}
                            <div 
                              onClick={(e) => { e.stopPropagation(); deleteCustomLogo(tmpl.id); }}
                              className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white rounded w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110"
                              title="Excluir da biblioteca"
                            >
                              <Trash2 size={10} />
                            </div>
                          </button>
                        );
                      })}

                      {/* Preloaded logo templates */}
                      {LOGO_TEMPLATES.filter(t => !hiddenTemplates.includes(t.id)).map(tmpl => {
                        const isActive = activeLogo === tmpl.url;
                        return (
                          <button
                            key={tmpl.id}
                            type="button"
                            onClick={() => setActiveLogo(isActive ? '' : tmpl.url)}
                            className={`group aspect-square bg-[var(--bg)] rounded-lg p-1.5 border flex items-center justify-center transition-all overflow-hidden relative cursor-pointer ${
                              isActive 
                                ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-500/5' 
                                : 'border-[var(--line)] hover:border-[var(--line-ctl)]'
                            }`}
                            title={isActive ? "Ativo no estúdio - Clique para esconder" : "Clique para exibir no estúdio"}
                          >
                            <img 
                              src={tmpl.url} 
                              alt={tmpl.name} 
                              className="max-h-full max-w-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                            {isActive && (
                              <div className="absolute top-1 left-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-[var(--bg)] shadow"></div>
                            )}
                            <div 
                              onClick={(e) => { e.stopPropagation(); hideTemplate(tmpl.id); }}
                              className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white rounded w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110"
                              title="Remover template"
                            >
                              <Trash2 size={12} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* WATERMARK SECTION */}
            {activeTab === 'design' && (
              <div className="bg-[var(--bg)] border border-[var(--line)]/80 rounded-xl overflow-hidden">
                <div 
                  onClick={() => setIsWatermarkOpen(!isWatermarkOpen)}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-[var(--panel)]/30 transition-all select-none cursor-pointer"
                >
                  <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5 uppercase tracking-wider">
                    {isWatermarkOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    Marca D'água
                    <span title="Logo semitransparente fixado no canto. Clique na marca ativa para esconder do estúdio." className="inline-flex"><HelpCircle size={12} className="text-[var(--ink-dim)]" /></span>
                  </span>

                  {/* Header action button */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setActiveWatermark(activeWatermark ? '' : (customWatermarks[0]?.url || ''))}
                      className={`px-1.5 py-0.5 rounded border text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        activeWatermark 
                          ? 'bg-blue-500/20 border-blue-500/60 text-blue-400 hover:bg-blue-500/30' 
                          : 'bg-[var(--surface)] border-[var(--line-ctl)] text-[var(--ink-dim)] hover:text-[var(--ink)] hover:border-[var(--line-ctl)]'
                      }`}
                      title={activeWatermark ? "Clique para esconder a marca d'água do estúdio" : "Clique para exibir a marca d'água no estúdio"}
                    >
                      {activeWatermark ? <Eye size={10} /> : <EyeOff size={10} />}
                      <span>{activeWatermark ? 'Visível' : 'Oculto'}</span>
                    </button>
                  </div>
                </div>

                {isWatermarkOpen && (
                  <div className="p-3 bg-[var(--surface)]/30 border-t border-[var(--line)]/60 space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-[var(--ink-lo)] pb-0.5">
                      <span>Clique na marca d'água para <strong>exibir ou esconder</strong> do estúdio</span>
                      {activeWatermark && (
                        <button
                          type="button"
                          onClick={() => setActiveWatermark('')}
                          className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer underline text-[9px]"
                        >
                          Esconder marca
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <button 
                        type="button"
                        onClick={() => watermarkInputRef.current?.click()}
                        className="aspect-square bg-[var(--bg)] hover:bg-blue-500/10 rounded-lg border-2 border-dashed border-[var(--line)] flex flex-col items-center justify-center text-[var(--ink-dim)] hover:text-blue-400 transition-all group cursor-pointer"
                        title="Enviar nova marca d'água"
                      >
                        <Plus size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] mt-1 font-bold">Enviar</span>
                      </button>
                      <input 
                        type="file" 
                        ref={watermarkInputRef}
                        onChange={handleWatermarkUpload}
                        accept="image/png, image/jpeg" 
                        className="hidden" 
                      />

                      {customWatermarks.map(tmpl => {
                        const isActive = activeWatermark === tmpl.url;
                        return (
                          <button
                            key={tmpl.id}
                            type="button"
                            onClick={() => setActiveWatermark(isActive ? '' : tmpl.url)}
                            className={`group aspect-square bg-[var(--bg)] rounded-lg p-1.5 border flex items-center justify-center transition-all overflow-hidden relative cursor-pointer ${
                              isActive 
                                ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-500/5' 
                                : 'border-[var(--line)] hover:border-[var(--line-ctl)]'
                            }`}
                            title={isActive ? "Ativo no estúdio - Clique para esconder" : "Clique para exibir no estúdio"}
                          >
                            <img 
                              src={tmpl.url} 
                              alt={tmpl.name} 
                              className="max-w-full max-h-full object-contain opacity-50"
                            />
                            {isActive && (
                              <div className="absolute top-1 left-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-[var(--bg)] shadow"></div>
                            )}
                            <div 
                              onClick={(e) => { e.stopPropagation(); deleteCustomWatermark(tmpl.id); }}
                              className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white rounded w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110"
                              title="Excluir da biblioteca"
                            >
                              <Trash2 size={10} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* OVERLAY SECTION */}
            {activeTab === 'design' && (
              <div className="bg-[var(--bg)] border border-[var(--line)]/80 rounded-xl overflow-hidden">
                <div 
                  onClick={() => setIsOverlayOpen(!isOverlayOpen)}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-[var(--panel)]/30 transition-all select-none cursor-pointer"
                >
                  <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5 uppercase tracking-wider">
                    {isOverlayOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    Overlay Transparente
                    <span title="Molduras e elementos transparentes que cobrem a stream inteira. Clique no overlay ativo para esconder do estúdio." className="inline-flex"><HelpCircle size={12} className="text-[var(--ink-dim)]" /></span>
                  </span>

                  {/* Header action button */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setActiveOverlay(activeOverlay ? '' : (customOverlays[0]?.url || OVERLAY_TEMPLATES[0]?.url || ''))}
                      className={`px-1.5 py-0.5 rounded border text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        activeOverlay 
                          ? 'bg-blue-500/20 border-blue-500/60 text-blue-400 hover:bg-blue-500/30' 
                          : 'bg-[var(--surface)] border-[var(--line-ctl)] text-[var(--ink-dim)] hover:text-[var(--ink)] hover:border-[var(--line-ctl)]'
                      }`}
                      title={activeOverlay ? "Clique para esconder o overlay do estúdio" : "Clique para exibir o overlay no estúdio"}
                    >
                      {activeOverlay ? <Eye size={10} /> : <EyeOff size={10} />}
                      <span>{activeOverlay ? 'Visível' : 'Oculto'}</span>
                    </button>
                  </div>
                </div>

                {isOverlayOpen && (
                  <div className="p-3 bg-[var(--surface)]/30 border-t border-[var(--line)]/60 space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-[var(--ink-lo)] pb-0.5">
                      <span>Clique na moldura para <strong>aplicar ou esconder</strong> do estúdio</span>
                      {activeOverlay && (
                        <button
                          type="button"
                          onClick={() => setActiveOverlay('')}
                          className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer underline text-[9px]"
                        >
                          Esconder overlay
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Upload card */}
                      <button 
                        type="button"
                        onClick={() => overlayInputRef.current?.click()}
                        className="aspect-video bg-[var(--bg)] hover:bg-blue-500/10 rounded-lg border-2 border-dashed border-[var(--line)] flex flex-col items-center justify-center text-[var(--ink-dim)] hover:text-blue-400 transition-all group p-1 cursor-pointer"
                        title="Enviar nova moldura"
                      >
                        <Plus size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] mt-0.5 font-bold">Adicionar Moldura</span>
                      </button>
                      <input 
                        type="file" 
                        ref={overlayInputRef}
                        onChange={handleOverlayUpload}
                        accept="image/*" 
                        className="hidden" 
                      />

                      {/* Semi-transparent none overlay button */}
                      <button
                        type="button"
                        onClick={() => setActiveOverlay('')}
                        className={`aspect-video rounded-lg border transition-all flex flex-col items-center justify-center text-[10px] font-bold cursor-pointer ${
                          activeOverlay === '' 
                            ? 'bg-blue-500/10 border-blue-500 text-blue-400' 
                            : 'bg-[var(--bg)] border-[var(--line)] text-[var(--ink-dim)] hover:border-[var(--line-ctl)] hover:text-[var(--ink-hi)]'
                        }`}
                      >
                        Nenhum overlay
                      </button>

                      {/* Custom uploaded overlays */}
                      {customOverlays.map(tmpl => {
                        const isActive = activeOverlay === tmpl.url;
                        return (
                          <button
                            key={tmpl.id}
                            type="button"
                            onClick={() => setActiveOverlay(isActive ? '' : tmpl.url)}
                            className={`group aspect-video bg-[var(--bg)] rounded-lg p-1 border flex flex-col items-center justify-center transition-all relative overflow-hidden cursor-pointer ${
                              isActive ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-500/5' : 'border-[var(--line)] hover:border-[var(--line-ctl)]'
                            }`}
                            title={isActive ? "Ativo no estúdio - Clique para esconder" : `Aplicar: ${tmpl.name}`}
                          >
                            <img src={tmpl.url} alt={tmpl.name} className="w-full h-full object-contain bg-[var(--panel)]/30 rounded" onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement?.classList.add('error-state');
                              }} />
                            <div className="hidden [.error-state_&]:flex absolute inset-0">
                              <ImagePlaceholder onReupload={() => bgInputRef.current?.click()} className="w-full h-full rounded-none border-none p-1" />
                            </div>
                            <div className={`absolute top-1 left-1 w-3.5 h-2.5 rounded bg-[var(--raise)]/80 border border-[var(--line-ctl)] flex items-center justify-center`}>
                              <div className={`w-1.5 h-1 rounded-sm ${isActive ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
                            </div>
                            <div 
                              onClick={(e) => { e.stopPropagation(); deleteCustomOverlay(tmpl.id); }}
                              className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white rounded w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110"
                              title="Excluir da biblioteca"
                            >
                              <Trash2 size={12} />
                            </div>
                          </button>
                        );
                      })}

                      {/* Predefined overlays */}
                      {OVERLAY_TEMPLATES.filter(t => !hiddenTemplates.includes(t.id)).map(tmpl => {
                        const isActive = activeOverlay === tmpl.url;
                        return (
                          <button
                            key={tmpl.id}
                            type="button"
                            onClick={() => setActiveOverlay(isActive ? '' : tmpl.url)}
                            className={`group aspect-video bg-[var(--bg)] rounded-lg p-1 border flex flex-col items-center justify-center transition-all relative overflow-hidden cursor-pointer ${
                              isActive ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-500/5' : 'border-[var(--line)] hover:border-[var(--line-ctl)]'
                            }`}
                            title={isActive ? "Ativo no estúdio - Clique para esconder" : `Aplicar: ${tmpl.name}`}
                          >
                            <div className="w-full h-full bg-[var(--panel)]/30 flex items-center justify-center rounded">
                              <span className="text-[9px] font-bold text-[var(--ink-lo)] truncate max-w-[120px] px-1">{tmpl.name}</span>
                            </div>
                            {/* Layout mini overlay webcam icon on top-right as seen in Restream UI */}
                            <div className="absolute top-1 left-1 w-3.5 h-2.5 rounded bg-[var(--raise)]/80 border border-[var(--line-ctl)] flex items-center justify-center">
                              <div className="w-1.5 h-1 bg-blue-500 rounded-sm"></div>
                            </div>
                            <div 
                              onClick={(e) => { e.stopPropagation(); hideTemplate(tmpl.id); }}
                              className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white rounded w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110"
                              title="Remover template"
                            >
                              <Trash2 size={12} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIDEO CLIPS SECTION */}
            {activeTab === 'video' && (
              <div className="space-y-4">
                <div className="bg-[var(--bg)] border border-[var(--line)]/80 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => setIsVideoOpen(!isVideoOpen)}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-[var(--panel)]/30 transition-all select-none"
                  >
                    <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5 uppercase tracking-wider">
                      {isVideoOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      Videoclipes (Intro/Outro)
                      <span title="Clipes curtos que cobrem todo o palco, como contagens e intros." className="inline-flex"><HelpCircle size={12} className="text-[var(--ink-dim)]" /></span>
                    </span>
                  </button>

                  {isVideoOpen && (
                    <div className="p-3 bg-[var(--surface)]/30 border-t border-[var(--line)]/60 space-y-3">
                      {/* Drag & Drop Upload Zone */}
                      <div
                        onDragOver={handleVideoDragOver}
                        onDragLeave={handleVideoDragLeave}
                        onDrop={handleVideoDrop}
                        onClick={() => videoInputRef.current?.click()}
                        className={`relative rounded-xl border-2 border-dashed p-3.5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 select-none ${
                          isDraggingVideo
                            ? 'border-blue-500 bg-blue-500/15 ring-2 ring-blue-500/30 scale-[1.01]'
                            : 'border-[var(--line)] bg-[var(--bg)] hover:border-blue-500/50 hover:bg-[var(--panel)]/40'
                        }`}
                      >
                        <input 
                          type="file" 
                          ref={videoInputRef}
                          onChange={handleVideoUpload}
                          accept="video/*" 
                          multiple
                          className="hidden" 
                        />

                        {isCloudUploading ? (
                          <div className="flex flex-col items-center gap-1 py-1">
                            <Upload size={18} className="text-blue-400 animate-bounce" />
                            <span className="text-xs font-bold text-[var(--ink-hi)]">Carregando vídeo...</span>
                            <span className="text-[10px] text-[var(--ink-lo)]">Adicionando à biblioteca de mídia</span>
                          </div>
                        ) : isDraggingVideo ? (
                          <div className="flex flex-col items-center gap-1 py-1">
                            <Upload size={22} className="text-blue-400 animate-bounce" />
                            <span className="text-xs font-black text-blue-400 uppercase tracking-wider">Solte os vídeos aqui</span>
                            <span className="text-[10px] text-[var(--ink)]">Suporta MP4, WebM, MOV, AVI</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-0.5">
                              <Film size={16} />
                            </div>
                            <span className="text-xs font-bold text-[var(--ink-hi)]">Arraste seus vídeos aqui</span>
                            <span className="text-[10px] text-[var(--ink-lo)]">ou clique para escolher do PC (MP4, WebM, MOV)</span>
                          </div>
                        )}
                      </div>

                      {/* Video list grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {videoClips.length === 0 ? (
                          <div className="col-span-2 text-center py-4 px-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-[var(--ink-lo)] text-xs">
                            <Film size={18} className="mx-auto mb-1 text-[var(--ink-dim)]" />
                            <p className="font-semibold text-[var(--ink)]">Nenhum vídeo salvo</p>
                            <p className="text-[10px] text-[var(--ink-dim)] mt-0.5">Faça upload de vídeos (MP4, WebM, MOV) para transmitir no estúdio.</p>
                          </div>
                        ) : (
                          videoClips.map(clip => {
                            const isPlaying = activeVideoClip?.id === clip.id && activeVideoClip?.isPlaying;
                            return (
                            <div
                              key={clip.id}
                              className={`group aspect-video bg-[var(--bg)] rounded-lg p-1 border flex flex-col items-center justify-between transition-all relative overflow-hidden text-left ${
                                isPlaying 
                                  ? 'border-blue-500 ring-1 ring-blue-500/20' 
                                  : 'border-[var(--line)] hover:border-[var(--line-ctl)]'
                              }`}
                            >
                              {/* Video Mock Thumbnail with dark cover */}
                              <div className="absolute inset-0 z-0 bg-cover bg-center opacity-40 filter brightness-50" style={{ backgroundImage: `url(${clip.thumbnail})` }}></div>
                              
                              {/* Delete button if custom clip */}
                              {clip.isCustom && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteVideoClip(clip.id);
                                  }}
                                  className="absolute top-1 right-1 z-20 w-5 h-5 rounded bg-black/80 hover:bg-red-600 text-[var(--ink)] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                                  title="Excluir vídeo da biblioteca"
                                >
                                  <Trash2 size={10} />
                                </button>
                              )}

                              {/* Video label metadata overlay */}
                              <span className="relative z-10 text-[8px] bg-black/60 text-[var(--ink-hi)] px-1 py-0.5 rounded-sm font-mono mt-1 ml-1">
                                {clip.duration}
                              </span>

                              <button
                                type="button"
                                onClick={() => playVideoClip(clip.id)}
                                className="relative z-10 w-full flex items-end justify-between p-1 cursor-pointer"
                                title={`Clique para transmitir: ${clip.name}`}
                              >
                                <p className="text-[9px] font-bold text-[var(--ink-hi)] truncate max-w-[90px] leading-tight drop-shadow">
                                  {clip.name}
                                </p>
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${isPlaying ? 'bg-red-600 text-white animate-pulse' : 'bg-blue-500 text-white'}`}>
                                  {isPlaying ? <Pause size={8} /> : <Play size={8} className="ml-0.5" />}
                                </div>
                              </button>
                            </div>
                          );
                        }))}
                      </div>
                    </div>
                  )}
                </div>

                {/* TRILHA SONORA INTEGRADA */}
                <div className="bg-[var(--bg)] border border-[var(--line)]/80 rounded-xl overflow-hidden text-left">
                  <div className="p-3 border-b border-[var(--line)]/60 bg-[var(--surface)]/25">
                    <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5 uppercase tracking-wider">
                      <Music size={14} className="text-blue-500" />
                      Trilha Sonora
                    </span>
                  </div>

                  <div className="p-3 bg-[var(--surface)]/30 space-y-4">
                    {/* Music Controller Block */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider">Volume do Áudio</span>
                        <span className="text-xs text-[var(--ink-lo)] font-mono">{Math.round(volume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                        className="w-full accent-[var(--color-brand)] cursor-pointer h-1.5 rounded-lg bg-[var(--raise)]"
                      />

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider">Loop Contínuo</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={musicLoop}
                            onChange={(e) => setMusicLoop(e.target.checked)}
                            className="sr-only peer" 
                          />
                          <div className="w-8 h-4.5 bg-[var(--surface)] border border-[var(--line)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-[var(--ink-lo)] peer-checked:after:bg-[var(--color-brand-deep)] after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-500/20 peer-checked:border-blue-500"></div>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => audioInputRef.current?.click()}
                          className="flex-1 p-2 bg-[var(--bg)] hover:bg-blue-500/10 rounded-lg border-2 border-dashed border-[var(--line)] flex items-center justify-center text-[var(--ink-dim)] hover:text-blue-400 transition-all text-xs font-bold gap-2"
                        >
                          <Plus size={14} /> Upload Audio
                        </button>
                        <input 
                          type="file" 
                          ref={audioInputRef}
                          onChange={handleAudioUpload}
                          accept="audio/*" 
                          className="hidden" 
                        />
                      </div>
                      
                      {[...customAudios, ...AUDIO_LIBRARY].length === 0 ? (
                        <div className="text-center py-4 px-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-[var(--ink-lo)] text-xs">
                          <Music size={18} className="mx-auto mb-1 text-[var(--ink-dim)]" />
                          <p className="font-semibold text-[var(--ink)]">Nenhum áudio enviado</p>
                          <p className="text-[10px] text-[var(--ink-dim)] mt-0.5">Faça upload do seu arquivo de áudio (MP3, WAV) para reproduzir na transmissão.</p>
                        </div>
                      ) : (
                        [...customAudios, ...AUDIO_LIBRARY].map(track => {
                          const isCurrent = currentPlayingTrackId === track.id;
                          return (
                            <div
                              key={track.id}
                              onClick={() => onPlayTrack(track.id)}
                              className={`group flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                                isCurrent 
                                  ? 'bg-blue-500/15 border-blue-500 text-white' 
                                  : 'bg-[var(--bg)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--line-ctl)]'
                              }`}
                            >
                              <div className="flex items-center gap-2 overflow-hidden flex-1">
                                <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                                  isCurrent ? 'bg-blue-500 text-white' : 'bg-[var(--surface)] text-[var(--color-brand)]'
                                }`}>
                                  <Music size={11} />
                                </div>
                                <div className="overflow-hidden text-left flex-1">
                                  <p className="text-[10px] font-semibold truncate">{track.name}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {customAudios.find(a => a.id === track.id) && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); deleteCustomAudio(track.id); }}
                                    className="w-6 h-6 bg-[var(--bg)] hover:bg-red-500 hover:text-white rounded flex items-center justify-center transition-colors text-red-400 opacity-0 group-hover:opacity-100"
                                    title="Remover"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); onPlayTrack(isCurrent ? null : track.id); }}
                                  className={`p-1 rounded-full transition-all shrink-0 ${
                                    isCurrent 
                                      ? 'bg-blue-500 text-white hover:bg-blue-400' 
                                      : 'bg-[var(--surface)] hover:bg-blue-500 hover:text-white text-[var(--ink)]'
                                  }`}
                                >
                                  {isCurrent ? <Pause size={10} /> : <Play size={10} className="ml-[1px]" />}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BACKGROUND SECTION */}
            {activeTab === 'design' && (
              <>
                <div className="bg-[var(--bg)] border border-[var(--line)]/80 rounded-xl overflow-hidden">
                  <div 
                    onClick={() => setIsBgOpen(!isBgOpen)}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-[var(--panel)]/30 transition-all select-none cursor-pointer"
                  >
                    <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5 uppercase tracking-wider">
                      {isBgOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      Plano de Fundo (Backdrops)
                      <span title="Exibido atrás das câmeras dos palestrantes. Clique no plano ativo para esconder do estúdio." className="inline-flex"><HelpCircle size={12} className="text-[var(--ink-dim)]" /></span>
                    </span>

                    {/* Action buttons in header */}
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setActiveBackground(activeBackground ? '' : (customBackgrounds[0]?.url || BACKGROUND_TEMPLATES[0]?.url || ''))}
                        className={`px-1.5 py-0.5 rounded border text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          activeBackground 
                            ? 'bg-blue-500/20 border-blue-500/60 text-blue-400 hover:bg-blue-500/30' 
                            : 'bg-[var(--surface)] border-[var(--line-ctl)] text-[var(--ink-dim)] hover:text-[var(--ink)] hover:border-[var(--line-ctl)]'
                        }`}
                        title={activeBackground ? "Clique para esconder o plano de fundo do estúdio" : "Clique para exibir o plano de fundo no estúdio"}
                      >
                        {activeBackground ? <Eye size={10} /> : <EyeOff size={10} />}
                        <span>{activeBackground ? 'Visível' : 'Oculto'}</span>
                      </button>
                    </div>
                  </div>

                  {isBgOpen && (
                    <div className="p-3 bg-[var(--surface)]/30 border-t border-[var(--line)]/60 space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-[var(--ink-lo)] pb-0.5">
                        <span>Clique no plano de fundo para <strong>aplicar ou esconder</strong> do estúdio</span>
                        {activeBackground && (
                          <button
                            type="button"
                            onClick={() => setActiveBackground('')}
                            className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer underline text-[9px]"
                          >
                            Esconder fundo
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {/* Upload card */}
                        <button 
                          type="button"
                          onClick={() => bgInputRef.current?.click()}
                          className="aspect-video bg-[var(--bg)] hover:bg-blue-500/10 rounded-lg border-2 border-dashed border-[var(--line)] flex flex-col items-center justify-center text-[var(--ink-dim)] hover:text-blue-400 transition-all group cursor-pointer"
                          title="Enviar novo plano de fundo"
                        >
                          <Plus size={14} className="group-hover:scale-110 transition-transform" />
                          <span className="text-[8px] mt-0.5 font-bold">Enviar</span>
                        </button>
                        <input 
                          type="file" 
                          ref={bgInputRef}
                          onChange={handleBgUpload}
                          accept="image/*" 
                          className="hidden" 
                        />

                        {/* Custom uploaded backgrounds */}
                        {customBackgrounds.map(tmpl => {
                          const isActive = activeBackground === tmpl.url;
                          return (
                            <button
                              key={tmpl.id}
                              type="button"
                              onClick={() => setActiveBackground(isActive ? '' : tmpl.url)}
                              style={{ backgroundImage: `url(${tmpl.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                              className={`group aspect-video rounded-lg border transition-all relative overflow-hidden cursor-pointer ${
                                isActive ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-md' : 'border-[var(--line)] hover:border-[var(--line-ctl)]'
                              }`}
                              title={isActive ? "Ativo no estúdio - Clique para esconder" : `Aplicar: ${tmpl.name}`}
                            >
                              {isActive && (
                                <span className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                  <span className="bg-blue-500 text-white rounded-full p-0.5 shadow"><Check size={8} /></span>
                                </span>
                              )}
                              <div 
                                onClick={(e) => { e.stopPropagation(); deleteCustomBackground(tmpl.id); }}
                                className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white rounded w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110"
                                title="Excluir da biblioteca"
                              >
                                <Trash2 size={12} />
                              </div>
                            </button>
                          );
                        })}

                        {/* Preset Backgrounds */}
                        {BACKGROUND_TEMPLATES.filter(t => !hiddenTemplates.includes(t.id)).map(tmpl => {
                          const isActive = activeBackground === tmpl.url;
                          return (
                            <button
                              key={tmpl.id}
                              type="button"
                              onClick={() => setActiveBackground(isActive ? '' : tmpl.url)}
                              style={{ background: tmpl.css }}
                              className={`group aspect-video rounded-lg border transition-all relative overflow-hidden cursor-pointer ${
                                isActive ? "border-blue-500 ring-2 ring-blue-500/30 shadow-md" : "border-[var(--line)] hover:border-[var(--line-ctl)]"
                              }`}
                              title={isActive ? "Ativo no estúdio - Clique para esconder" : `Aplicar: ${tmpl.name}`}
                            >
                              {isActive && (
                                <span className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                  <span className="bg-blue-500 text-white rounded-full p-0.5 shadow"><Check size={8} /></span>
                                </span>
                              )}
                              <div 
                                onClick={(e) => { e.stopPropagation(); hideTemplate(tmpl.id); }}
                                className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white rounded w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110"
                                title="Remover template"
                              >
                                <Trash2 size={12} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* SNAPSHOTS SECTION */}
                <div className="bg-[var(--bg)] border border-[var(--line)]/80 rounded-xl overflow-hidden">
                  <button 
                    type="button"
                    onClick={() => setIsSnapshotOpen(!isSnapshotOpen)}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-[var(--panel)]/30 transition-all select-none"
                  >
                    <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5 uppercase tracking-wider">
                      <Camera size={14} className="text-blue-500" />
                      Capturas da Stream ({snapshots.length})
                    </span>
                    {isSnapshotOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {isSnapshotOpen && (
                    <div className="p-3 bg-[var(--surface)]/30 border-t border-[var(--line)]/60 space-y-2">
                      {snapshots.length === 0 ? (
                        <p className="text-[10px] text-[var(--ink-dim)] text-center py-4 leading-normal">
                          Nenhuma captura de tela tirada ainda.<br />Clique no botão <span className="text-blue-400 font-bold">"SNAPSHOT"</span> no topo do player para capturar o preview!
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {snapshots.map(snap => (
                            <div key={snap.id} className="group aspect-video bg-[var(--bg)] rounded-lg border border-[var(--line)] overflow-hidden relative flex flex-col justify-between">
                              <img src={snap.url} alt={snap.name} className="absolute inset-0 w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                                <a 
                                  href={snap.url} 
                                  download={snap.name}
                                  className="p-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-400 transition-colors cursor-pointer flex items-center justify-center"
                                  title="Baixar imagem"
                                >
                                  <Download size={12} />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => onDeleteSnapshot(snap.id)}
                                  className="p-1.5 bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors cursor-pointer flex items-center justify-center"
                                  title="Excluir captura"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                              <div className="absolute bottom-1 left-1 bg-black/75 px-1 py-0.5 rounded text-[8px] text-[var(--ink)] font-mono z-10">
                                {snap.timestamp}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* BANNERS SECTION */}
                <div className="bg-[var(--bg)] border border-[var(--line)]/80 rounded-xl overflow-hidden">
                  <button 
                    type="button"
                    onClick={() => setIsBannersOpen(!isBannersOpen)}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-[var(--panel)]/30 transition-all select-none"
                  >
                    <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5 uppercase tracking-wider">
                      <Bookmark size={14} className="text-indigo-400" />
                      Banners & Terços Inferiores ({banners.length})
                      <span title="Crie e gerencie banners que podem ser arrastados e redimensionados na tela." className="inline-flex"><HelpCircle size={12} className="text-[var(--ink-dim)]" /></span>
                    </span>
                    {isBannersOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {isBannersOpen && (
                    <div className="p-3 bg-[var(--surface)]/30 border-t border-[var(--line)]/60 space-y-3">
                      {/* Banner Position Controls */}
                      <div className="bg-[var(--well)] p-2.5 rounded-xl border border-[var(--line)]/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider flex items-center gap-1.5">
                            <Move size={11} className="text-indigo-400" />
                            Posição na Tela
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (onBannerPositionChange) onBannerPositionChange('bottom');
                              window.dispatchEvent(new CustomEvent('studio-banner-pos-set', { detail: { pos: { x: 3, y: 76 } } }));
                            }}
                            className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
                          >
                            Padrão
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { id: 'bottom', label: 'Inferior', pos: { x: 3, y: 76 } },
                            { id: 'top', label: 'Superior', pos: { x: 3, y: 4 } },
                            { id: 'lateral', label: 'Lateral', pos: { x: 3, y: 35 } },
                            { id: 'bottom-right', label: 'Direita', pos: { x: 55, y: 76 } }
                          ].map(opt => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                if (onBannerPositionChange) onBannerPositionChange(opt.id as BannerPosition);
                                window.dispatchEvent(new CustomEvent('studio-banner-pos-set', { detail: { pos: opt.pos } }));
                                if (opt.id === 'lateral' && qrCodeConfig && onUpdateQrCodeConfig) {
                                  onUpdateQrCodeConfig({ ...qrCodeConfig, orientation: 'vertical' });
                                } else if (opt.id === 'bottom' && qrCodeConfig && onUpdateQrCodeConfig) {
                                  onUpdateQrCodeConfig({ ...qrCodeConfig, orientation: 'horizontal' });
                                }
                              }}
                              className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer text-center ${
                                bannerPosition === opt.id
                                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                                  : 'bg-[var(--bg)] border-[var(--line)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:border-[var(--line-ctl)]'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Dashed "+ Add banner" button with badge counter */}
                      <button
                        type="button"
                        onClick={() => handleOpenAddBannerModal()}
                        className="w-full py-3 px-3.5 rounded-xl border-2 border-dashed border-[var(--line-ctl)]/80 hover:border-indigo-500 bg-[var(--bg)] hover:bg-indigo-500/10 text-[var(--ink-hi)] hover:text-white text-xs font-bold transition-all flex items-center justify-between group shadow-sm cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
                            <Plus size={15} />
                          </div>
                          <span>Add banner</span>
                        </div>
                        <span className="text-[10px] font-mono bg-[var(--panel)] text-[var(--ink-lo)] group-hover:bg-indigo-600 group-hover:text-white px-2 py-0.5 rounded font-bold transition-colors">
                          {banners.length}/50
                        </span>
                      </button>

                      {/* Banner Items List */}
                      {banners.length === 0 ? (
                        <p className="text-xs text-[var(--ink-dim)] text-center py-4 bg-[var(--bg)] border border-[var(--line)]/80 rounded-xl">
                          Nenhum banner cadastrado. Clique em <strong className="text-indigo-400">Add banner</strong> para criar!
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-0.5">
                          {banners.map((banner) => {
                            const isSelected = activeBannerId === banner.id;
                            return (
                              <div
                                key={banner.id}
                                onClick={() => onSetActiveBanner(isSelected ? null : banner.id)}
                                className={`relative p-3 rounded-xl border transition-all cursor-pointer text-left flex flex-col gap-1.5 ${
                                  isSelected
                                    ? 'bg-[var(--bg)] border-indigo-500 ring-1 ring-indigo-500/40 shadow-md shadow-indigo-500/10'
                                    : 'bg-[var(--well)] border-[var(--line)]/90 hover:border-[var(--line-ctl)]'
                                }`}
                              >
                                {/* Header Row: Title & Badge */}
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-xs font-bold text-[var(--ink-hi)] leading-snug break-words flex-1 pr-2">
                                    {banner.text}
                                  </h4>
                                  {isSelected && (
                                    <span className="shrink-0 bg-indigo-600 text-white font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                                      SELECTED
                                    </span>
                                  )}
                                </div>

                                {/* Subtitle */}
                                {banner.subtitle && (
                                  <p className="text-[11px] font-medium text-[var(--ink-lo)] leading-tight break-words">
                                    {banner.subtitle}
                                  </p>
                                )}

                                {/* Bottom Row */}
                                <div className="flex items-center justify-between border-t border-[var(--line)]/60 pt-2 mt-1">
                                  <span className={`text-[10px] font-bold flex items-center gap-1.5 ${isSelected ? 'text-indigo-400' : 'text-[var(--ink-dim)]'}`}>
                                    {isSelected ? <Eye size={12} /> : <EyeOff size={12} />}
                                    {isSelected ? 'Ativo no Studio' : 'Clique para Exibir'}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenAddBannerModal(banner);
                                      }}
                                      className="p-1 text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:bg-[var(--panel)] rounded transition-colors"
                                      title="Editar banner"
                                    >
                                      <Edit3 size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteBanner(banner.id);
                                      }}
                                      className="p-1 text-[var(--ink-lo)] hover:text-red-400 hover:bg-[var(--panel)] rounded transition-colors"
                                      title="Excluir banner"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* TICKERS / BARRA DE ROLAGEM SECTION */}
                <div className="bg-[var(--bg)] border border-[var(--line)]/80 rounded-xl overflow-hidden mt-3">
                  <button 
                    type="button"
                    onClick={() => setIsTickersOpen(!isTickersOpen)}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-[var(--panel)]/30 transition-all select-none"
                  >
                    <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5 uppercase tracking-wider">
                      <Activity size={14} className="text-blue-400" />
                      Barra de Rolagem / Tickers ({tickers.length})
                      <span title="Crie frases ou letreiros que rolam continuamente na barra inferior do preview do studio." className="inline-flex"><HelpCircle size={12} className="text-[var(--ink-dim)]" /></span>
                    </span>
                    {isTickersOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {isTickersOpen && (
                    <div className="p-3 bg-[var(--surface)]/30 border-t border-[var(--line)]/60 space-y-3">
                      {/* Input to add new scrolling ticker */}
                      <form onSubmit={handleTickerSubmit} className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newTickerBadge}
                            onChange={(e) => setNewTickerBadge(e.target.value)}
                            placeholder="Selo (ex: ALERTA)"
                            className="w-1/3 bg-[var(--bg)] border border-[var(--line-ctl)]/80 rounded-xl px-2.5 py-2 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500 font-bold uppercase text-center"
                          />
                          <input
                            type="text"
                            value={newTickerText}
                            onChange={(e) => setNewTickerText(e.target.value)}
                            placeholder="Texto da barra de rolagem..."
                            className="w-2/3 bg-[var(--bg)] border border-[var(--line-ctl)]/80 rounded-xl px-3 py-2 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Plus size={14} /> Adicionar Barra de Rolagem
                        </button>
                      </form>

                      {/* Speed and Direction Controls */}
                      <div className="grid grid-cols-2 gap-2 bg-[var(--bg)] p-2.5 rounded-xl border border-[var(--line)]/80">
                        {/* Speed */}
                        <div>
                          <label className="block text-[9px] font-bold text-[var(--ink-lo)] uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Gauge size={10} className="text-blue-400" /> Velocidade
                          </label>
                          <div className="flex bg-[var(--surface)] p-0.5 rounded-lg border border-[var(--line)]">
                            <button
                              type="button"
                              onClick={() => onSetTickerSpeed?.('slow')}
                              className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${
                                tickerSpeed === 'slow' ? 'bg-blue-600 text-white shadow-sm' : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                              }`}
                            >
                              Lenta
                            </button>
                            <button
                              type="button"
                              onClick={() => onSetTickerSpeed?.('normal')}
                              className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${
                                tickerSpeed === 'normal' ? 'bg-blue-600 text-white shadow-sm' : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                              }`}
                            >
                              Normal
                            </button>
                            <button
                              type="button"
                              onClick={() => onSetTickerSpeed?.('fast')}
                              className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${
                                tickerSpeed === 'fast' ? 'bg-blue-600 text-white shadow-sm' : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                              }`}
                            >
                              Rápida
                            </button>
                          </div>
                        </div>

                        {/* Direction */}
                        <div>
                          <label className="block text-[9px] font-bold text-[var(--ink-lo)] uppercase tracking-wider mb-1 flex items-center gap-1">
                            <FastForward size={10} className="text-blue-400" /> Direção
                          </label>
                          <div className="flex bg-[var(--surface)] p-0.5 rounded-lg border border-[var(--line)]">
                            <button
                              type="button"
                              onClick={() => onSetTickerDirection?.('left')}
                              className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors flex items-center justify-center gap-1 ${
                                tickerDirection === 'left' ? 'bg-blue-600 text-white shadow-sm' : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                              }`}
                              title="Rolagem da direita para a esquerda"
                            >
                              <ArrowLeft size={11} /> Esq
                            </button>
                            <button
                              type="button"
                              onClick={() => onSetTickerDirection?.('right')}
                              className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors flex items-center justify-center gap-1 ${
                                tickerDirection === 'right' ? 'bg-blue-600 text-white shadow-sm' : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                              }`}
                              title="Rolagem da esquerda para a direita"
                            >
                              Dir <ArrowRight size={11} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* List of Tickers */}
                      {tickers.length === 0 ? (
                        <p className="text-xs text-[var(--ink-dim)] text-center py-3 bg-[var(--bg)] border border-[var(--line)]/80 rounded-xl">
                          Nenhuma barra de rolagem cadastrada.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-0.5">
                          {tickers.map((ticker) => {
                            const isSelected = activeTickerId === ticker.id;
                            return (
                              <div
                                key={ticker.id}
                                onClick={() => onSetActiveTicker?.(isSelected ? null : ticker.id)}
                                className={`p-3 rounded-xl border transition-all cursor-pointer text-left flex flex-col gap-1.5 ${
                                  isSelected
                                    ? 'bg-[var(--surface)] border-blue-500 ring-1 ring-blue-500/40 shadow-md shadow-blue-500/10'
                                    : 'bg-[var(--well)] border-[var(--line)]/90 hover:border-[var(--line-ctl)]'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="shrink-0 text-[9px] font-black uppercase px-2 py-0.5 rounded bg-blue-600 text-white">
                                    {ticker.badgeText || 'ALERTA'}
                                  </span>
                                  {isSelected && (
                                    <span className="shrink-0 bg-emerald-600 text-white font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                                      ROLANDO AO VIVO
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs font-semibold text-[var(--ink-hi)] leading-snug break-words">
                                  {ticker.text}
                                </p>

                                <div className="flex items-center justify-between border-t border-[var(--line)]/60 pt-2 mt-1">
                                  <span className={`text-[10px] font-bold flex items-center gap-1.5 ${isSelected ? 'text-blue-400' : 'text-[var(--ink-dim)]'}`}>
                                    {isSelected ? <Eye size={12} /> : <EyeOff size={12} />}
                                    {isSelected ? 'Ocultar Rolagem' : 'Exibir na Barra Inferior'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteTicker?.(ticker.id);
                                    }}
                                    className="p-1 text-[var(--ink-lo)] hover:text-red-400 hover:bg-[var(--panel)] rounded transition-colors"
                                    title="Excluir ticker"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* 3. TELEPROMPTER TAB PANEL */}
      {activeTab === 'third' && (
        <div className="space-y-4 text-left">
          {/* Section Header */}
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[var(--ink-hi)] mb-1 flex items-center gap-2">
              <FileText size={18} className="text-blue-500" />
              Teleprompter do Apresentador
            </h2>
            <p className="text-xs text-[var(--ink-lo)]">Script de leitura ao vivo com rolagem automática, controle de velocidade e exibição no estúdio.</p>
          </div>

          {/* Interactive Teleprompter Reader Window */}
          <div className="bg-[var(--bg)] border border-[var(--line)]/90 rounded-2xl p-3.5 space-y-3 shadow-xl">
            {/* Header / Status bar */}
            <div className="flex items-center justify-between border-b border-[var(--line)]/80 pb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isTeleprompterPlaying ? 'bg-emerald-500 animate-ping' : 'bg-slate-600'}`} />
                <span className={`text-[10px] font-black uppercase tracking-wider ${isTeleprompterPlaying ? 'text-emerald-400' : 'text-[var(--ink-lo)]'}`}>
                  {isTeleprompterPlaying ? 'Leitura em Andamento' : 'Prompter Pausado'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--ink-lo)] font-mono bg-[var(--surface)] border border-[var(--line)] px-2 py-0.5 rounded-md">
                  {teleprompterWordCount} palavras • ~{teleprompterEstTime}
                </span>
              </div>
            </div>

            {/* Reader Box */}
            <div className="relative bg-[var(--well)] border border-[var(--line)] rounded-xl overflow-hidden h-48 shadow-inner group">
              {/* Center Reading Guide Line */}
              <div className="absolute top-1/2 left-0 right-0 h-8 -translate-y-1/2 bg-blue-500/15 border-y border-blue-500/30 pointer-events-none z-10 flex items-center justify-between px-2">
                <span className="text-[8px] font-black uppercase tracking-widest text-blue-400/80">GUIA DE LEITURA</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-blue-400/80">{teleprompterSpeed}x</span>
              </div>

              <div
                ref={sidebarPrompterRef}
                style={{
                  transform: teleprompterMirrored ? 'scaleX(-1)' : 'none'
                }}
                className={`h-full overflow-y-auto p-4 space-y-3 text-center font-medium leading-relaxed transition-all select-none ${
                  teleprompterFontSize === 'sm' ? 'text-xs' :
                  teleprompterFontSize === 'md' ? 'text-sm' :
                  teleprompterFontSize === 'xl' ? 'text-xl font-bold' :
                  'text-base font-semibold'
                } ${isTeleprompterPlaying ? 'text-yellow-300' : 'text-[var(--ink-hi)]'}`}
              >
                <div className="h-14" />
                <p className="whitespace-pre-line tracking-wide">
                  {teleprompterText || 'Digite ou cole o seu script na área de texto abaixo para iniciar.'}
                </p>
                <div className="h-20" />
              </div>
            </div>

            {/* Main Playback Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onToggleTeleprompterPlaying?.()}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                  isTeleprompterPlaying
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {isTeleprompterPlaying ? <Pause size={15} /> : <Play size={15} />}
                {isTeleprompterPlaying ? 'Pausar Rolagem' : 'Iniciar Leitura'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (sidebarPrompterRef.current) sidebarPrompterRef.current.scrollTop = 0;
                }}
                className="py-2.5 px-3 bg-[var(--surface)] hover:bg-[var(--panel)] border border-[var(--line)] text-[var(--ink)] hover:text-[var(--ink-hi)] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={14} /> Voltar ao Topo
              </button>
            </div>
          </div>

          {/* Configuration Settings Panel */}
          <div className="bg-[var(--bg)] border border-[var(--line)]/90 rounded-2xl p-3.5 space-y-3.5">
            <h3 className="text-xs font-bold text-[var(--ink-hi)] uppercase tracking-wider flex items-center gap-1.5">
              <Sliders size={13} className="text-blue-400" /> Ajustes de Leitura
            </h3>

            {/* Speed Control */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink)]">
                <span className="flex items-center gap-1 text-[11px]">
                  <Gauge size={12} className="text-blue-400" /> Velocidade de Rolagem
                </span>
                <span className="text-[10px] text-blue-400 font-mono font-bold">{teleprompterSpeed}x</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 bg-[var(--surface)] p-1 rounded-xl border border-[var(--line)]">
                {[
                  { speed: 2, label: 'Lenta' },
                  { speed: 4, label: 'Normal' },
                  { speed: 7, label: 'Rápida' },
                  { speed: 10, label: 'Turbo' },
                ].map((item) => (
                  <button
                    key={item.speed}
                    type="button"
                    onClick={() => onTeleprompterSpeedChange?.(item.speed)}
                    className={`py-1.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                      teleprompterSpeed === item.speed 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:bg-[var(--panel)]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size & Mirror Mode */}
            <div className="grid grid-cols-2 gap-2">
              {/* Font Size */}
              <div className="space-y-1.5">
                <span className="block text-[11px] font-semibold text-[var(--ink)]">Tamanho da Fonte</span>
                <div className="flex bg-[var(--surface)] p-1 rounded-xl border border-[var(--line)]">
                  {[
                    { size: 'sm', label: 'P' },
                    { size: 'md', label: 'M' },
                    { size: 'lg', label: 'G' },
                    { size: 'xl', label: 'GG' },
                  ].map((item) => (
                    <button
                      key={item.size}
                      type="button"
                      onClick={() => onTeleprompterFontSizeChange?.(item.size as any)}
                      className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                        teleprompterFontSize === item.size 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mirror Toggle */}
              <div className="space-y-1.5">
                <span className="block text-[11px] font-semibold text-[var(--ink)]">Espelhamento H</span>
                <button
                  type="button"
                  onClick={() => onToggleTeleprompterMirrored?.()}
                  className={`w-full py-1.5 px-2 rounded-xl border text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    teleprompterMirrored
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                  }`}
                >
                  <Move size={12} /> {teleprompterMirrored ? 'Espelhado' : 'Normal'}
                </button>
              </div>
            </div>

            {/* Show on Studio Preview Toggle */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-3 flex items-center justify-between">
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-[var(--ink-hi)] flex items-center gap-1.5">
                  <Tv size={13} className="text-blue-400" />
                  Exibir no Preview do Studio
                </span>
                <span className="text-[10px] text-[var(--ink-lo)]">Projeta o teleprompter sobre o vídeo da transmissão</span>
              </div>

              <button
                type="button"
                onClick={() => onToggleShowTeleprompterOnStudio?.()}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  showTeleprompterOnStudio ? 'bg-blue-600' : 'bg-[var(--panel)]'
                }`}
                title="Ativar teleprompter flutuante no palco"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    showTeleprompterOnStudio ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Script Editor & Preset Templates */}
          <div className="bg-[var(--bg)] border border-[var(--line)]/90 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[var(--ink-hi)] uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 size={13} className="text-blue-400" />
                Editar Script do Roteiro
              </h3>
              <span className="text-[9px] text-[var(--ink-lo)] font-mono">
                {teleprompterText.length} caracteres
              </span>
            </div>

            {/* Presets Selector Dropdown */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider">
                Carregar Modelo de Roteiro (Preset)
              </label>
              <select
                onChange={(e) => {
                  const preset = TELEPROMPTER_PRESETS.find(p => p.id === e.target.value);
                  if (preset) {
                    onTeleprompterTextChange?.(preset.text);
                  }
                }}
                defaultValue=""
                className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3 py-2 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="" disabled>Selecione um modelo pronto...</option>
                {TELEPROMPTER_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.category}] {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Script Text Area */}
            <textarea
              value={teleprompterText}
              onChange={(e) => onTeleprompterTextChange?.(e.target.value)}
              placeholder="Digite ou cole aqui o seu roteiro completo de apresentação..."
              rows={6}
              className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl p-3 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500 font-medium leading-relaxed resize-y"
            />

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(teleprompterText);
                }}
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
              >
                <Copy size={11} /> Copiar Texto
              </button>

              <button
                type="button"
                onClick={() => onTeleprompterTextChange?.('')}
                className="text-[10px] font-bold text-[var(--ink-dim)] hover:text-red-400 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={11} /> Limpar Script
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. APPS & WIDGETS TAB PANEL */}
      {activeTab === 'apps' && (
        <div className="space-y-5 flex flex-col h-full">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[var(--ink-hi)] mb-1 flex items-center gap-2">
              <Puzzle size={18} className="text-blue-500" />
              Apps & Integrações
            </h2>
            <p className="text-xs text-[var(--ink-lo)]">QR Codes dinâmicos de produtos e notas privadas para o seu estúdio.</p>
          </div>

          {/* Apps Sub-navigation Tabs */}
          <div className="flex bg-[var(--bg)] border border-[var(--line)] rounded-xl p-1 shrink-0">
            {([
              { id: 'qrcode', label: 'QR Code', icon: QrCode },
              { id: 'notes', label: 'Notas', icon: FileText }
            ] as const).map(sub => {
              const Icon = sub.icon;
              return (
                <button
                  key={sub.id}
                  onClick={() => setAppsSubtab(sub.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    appsSubtab === sub.id 
                      ? 'bg-[var(--color-brand-deep)] text-white shadow-md' 
                      : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                  }`}
                >
                  <Icon size={12} />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto pr-0.5 space-y-4">
            {appsSubtab === 'qrcode' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-150">
                
                {/* Main CTA to open complete modal */}
                <button
                  type="button"
                  onClick={() => onOpenQrCodeModal && onOpenQrCodeModal()}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 cursor-pointer active:scale-[0.98]"
                >
                  <Sparkles size={16} className="text-amber-300 animate-pulse" />
                  <span>Abrir Configurador Completo de Produtos (Modal)</span>
                </button>

                {/* Stage Visibility & Quick Orientation */}
                <div className="bg-[var(--bg)] border border-[var(--line)] p-4 rounded-xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[var(--ink-hi)]">Exibir QR Code no Palco</p>
                      <p className="text-[9px] text-[var(--ink-lo)]">Card flutuante com QR Code e link para os espectadores</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={showQrCode}
                        onChange={(e) => setShowQrCode(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-[var(--surface)] border border-[var(--line)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-[var(--ink-lo)] peer-checked:after:bg-blue-500 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500/20 peer-checked:border-blue-500"></div>
                    </label>
                  </div>

                  {/* Orientation switch */}
                  <div className="space-y-1.5 pt-2 border-t border-[var(--line)]">
                    <label className="block text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider text-left">
                      Orientação do Card no Estúdio
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (qrCodeConfig && onUpdateQrCodeConfig) {
                            onUpdateQrCodeConfig({ ...qrCodeConfig, orientation: 'horizontal' });
                          }
                          if (onBannerPositionChange) onBannerPositionChange('bottom');
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          (qrCodeConfig?.orientation || 'horizontal') === 'horizontal'
                            ? 'bg-blue-600/20 border-blue-500 text-white font-bold ring-1 ring-blue-500/30'
                            : 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink-lo)] hover:border-[var(--line-ctl)] hover:text-[var(--ink-hi)]'
                        }`}
                      >
                        <span className="text-xs font-bold">⇄ Centro Inferior</span>
                        <span className="text-[8px] opacity-70 px-1 py-0.5 rounded bg-[var(--panel)]">Sobe com Ticker</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (qrCodeConfig && onUpdateQrCodeConfig) {
                            onUpdateQrCodeConfig({ ...qrCodeConfig, orientation: 'vertical' });
                          }
                          if (onBannerPositionChange) onBannerPositionChange('lateral');
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          qrCodeConfig?.orientation === 'vertical' || bannerPosition === 'lateral'
                            ? 'bg-blue-600/20 border-blue-500 text-white font-bold ring-1 ring-blue-500/30'
                            : 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink-lo)] hover:border-[var(--line-ctl)] hover:text-[var(--ink-hi)]'
                        }`}
                      >
                        <span className="text-xs font-bold">⇅ Lateral Direita</span>
                        <span className="text-[8px] opacity-70 px-1 py-0.5 rounded bg-[var(--panel)]">Reduz Apresentador</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Store Links & Information */}
                <div className="bg-[var(--bg)] border border-[var(--line)] p-4 rounded-xl space-y-3 text-left">
                  <h3 className="text-xs font-bold text-[var(--ink-hi)] uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag size={14} className="text-blue-400" />
                    Dados do Produto & Loja
                  </h3>

                  {/* Store presets */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider">
                      Plataforma da Loja
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {['Shopee', 'Mercado Livre', 'Amazon', 'Hotmart', 'Kiwify', 'Nuvemshop', 'Shopify'].map(store => (
                        <button
                          key={store}
                          type="button"
                          onClick={() => {
                            if (qrCodeConfig && onUpdateQrCodeConfig) {
                              onUpdateQrCodeConfig({ ...qrCodeConfig, storeName: store });
                            }
                          }}
                          className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-colors cursor-pointer ${
                            qrCodeConfig?.storeName === store
                              ? 'bg-blue-600 text-white border-blue-500'
                              : 'bg-[var(--surface)] text-[var(--ink-lo)] border-[var(--line)] hover:text-[var(--ink-hi)]'
                          }`}
                        >
                          {store}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="qr-store-url" className="block text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider mb-1">
                      Link da Loja / URL do Produto (QR Code)
                    </label>
                    <div className="relative">
                      <input
                        id="qr-store-url"
                        type="text"
                        value={qrCodeConfig?.storeUrl || qrCodeText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQrCodeText(val);
                          if (qrCodeConfig && onUpdateQrCodeConfig) {
                            onUpdateQrCodeConfig({ ...qrCodeConfig, storeUrl: val });
                          }
                        }}
                        placeholder="https://sualoja.com.br/produto"
                        className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-blue-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="qr-prod-title" className="block text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider mb-1">
                      Título do Produto
                    </label>
                    <input
                      id="qr-prod-title"
                      type="text"
                      value={qrCodeConfig?.title || ''}
                      onChange={(e) => {
                        if (qrCodeConfig && onUpdateQrCodeConfig) {
                          onUpdateQrCodeConfig({ ...qrCodeConfig, title: e.target.value });
                        }
                      }}
                      placeholder="Ex: Smartphone Pro Max 256GB"
                      className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="qr-prod-price" className="block text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider mb-1">
                        Preço Promocional
                      </label>
                      <input
                        id="qr-prod-price"
                        type="text"
                        value={qrCodeConfig?.price || ''}
                        onChange={(e) => {
                          if (qrCodeConfig && onUpdateQrCodeConfig) {
                            onUpdateQrCodeConfig({ ...qrCodeConfig, price: e.target.value });
                          }
                        }}
                        placeholder="R$ 1.899,00"
                        className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-blue-500 transition-all font-semibold"
                      />
                    </div>

                    <div>
                      <label htmlFor="qr-prod-badge" className="block text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider mb-1">
                        Selo de Desconto
                      </label>
                      <input
                        id="qr-prod-badge"
                        type="text"
                        value={qrCodeConfig?.discountBadge || ''}
                        onChange={(e) => {
                          if (qrCodeConfig && onUpdateQrCodeConfig) {
                            onUpdateQrCodeConfig({ ...qrCodeConfig, discountBadge: e.target.value });
                          }
                        }}
                        placeholder="24% OFF"
                        className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Card Preview Box */}
                {qrCodeConfig && (
                  <div className="bg-[var(--bg)] border border-[var(--line)] p-4 rounded-xl space-y-2 text-left">
                    <div className="flex items-center justify-between text-[10px] text-[var(--ink-lo)]">
                      <span className="font-bold uppercase tracking-wider">Prévia do Card na Tela</span>
                      <span className="font-bold text-blue-400">
                        {qrCodeConfig.orientation === 'vertical' ? 'Card Vertical' : 'Card Horizontal'}
                      </span>
                    </div>

                    {/* Render according to orientation */}
                    {qrCodeConfig.orientation === 'vertical' ? (
                      <div className="max-w-[220px] mx-auto bg-[var(--surface)] border border-[var(--line-ctl)] rounded-2xl p-3 shadow-2xl space-y-2 text-center">
                        {qrCodeConfig.discountBadge && (
                          <span className="inline-block text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                            {qrCodeConfig.discountBadge}
                          </span>
                        )}

                        {qrCodeConfig.imageUrl && (
                          <div className="w-full aspect-video rounded-lg overflow-hidden bg-[var(--surface)] border border-[var(--line)]">
                            <img src={qrCodeConfig.imageUrl} alt={qrCodeConfig.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}

                        <p className="text-xs font-bold text-[var(--ink-hi)] leading-tight">{qrCodeConfig.title}</p>
                        {qrCodeConfig.price && (
                          <p className="text-sm font-black text-emerald-400">{qrCodeConfig.price}</p>
                        )}

                        <div className="bg-white p-2 rounded-xl inline-block shadow-md">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrCodeConfig.storeUrl || qrCodeText)}`} 
                            alt="QR Code" 
                            className="w-20 h-20 object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <p className="text-[8px] text-[var(--ink-lo)] font-bold uppercase tracking-wider">Aponte a câmera para comprar</p>
                      </div>
                    ) : (
                      <div className="w-full bg-[var(--surface)] border border-[var(--line-ctl)] rounded-2xl p-3 shadow-2xl flex items-center gap-3">
                        <div className="bg-white p-1.5 rounded-xl shrink-0 shadow-md">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrCodeConfig.storeUrl || qrCodeText)}`} 
                            alt="QR Code" 
                            className="w-18 h-18 object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="min-w-0 flex-1 text-left space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400">
                              {qrCodeConfig.storeName || 'Loja'}
                            </span>
                            {qrCodeConfig.discountBadge && (
                              <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-red-500/20 text-red-400">
                                {qrCodeConfig.discountBadge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-[var(--ink-hi)] truncate leading-tight">{qrCodeConfig.title}</p>
                          {qrCodeConfig.price && (
                            <p className="text-xs font-black text-emerald-400">{qrCodeConfig.price}</p>
                          )}
                          <p className="text-[8px] text-[var(--ink-lo)] font-mono truncate">{qrCodeConfig.storeUrl || qrCodeText}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {appsSubtab === 'notes' && (
              <div className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-4 flex flex-col space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                <label htmlFor="notes-area" className="block text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider text-left">Roteiro Privado (Apenas para você)</label>
                <textarea
                  id="notes-area"
                  value={presenterNotes}
                  onChange={(e) => setPresenterNotes(e.target.value)}
                  placeholder="Digite suas anotações de apoio..."
                  className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500 transition-all resize-none font-sans leading-relaxed min-h-[250px]"
                />
                <p className="text-[9px] text-[var(--ink-dim)] text-left">Nota: As anotações são salvas localmente e NÃO são visíveis para os espectadores da transmissão.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. AUDIENCE TAB PANEL */}
      {activeTab === 'audience' && (
        <AudiencePanel />
      )}

      {/* 6. CHAT/COMMENTS TAB PANEL (VIRTUALIZED HIGH PERFORMANCE) */}
      {activeTab === 'seven' && (
        <VirtualizedChat
          comments={comments}
          pinnedComment={pinnedComment}
          onPinComment={onPinComment}
          onPostComment={onPostComment}
          onApproveComment={onApproveComment}
          isAiModerationEnabled={isAiModerationEnabled}
          aiModerationMode={aiModerationMode}
          isLive={isLive}
          onBatchAddComments={onBatchAddComments}
          onClearComments={onClearComments}
        />
      )}

      {/* 8. WEBINAR SCHEDULE TAB PANEL */}
      {activeTab === 'schedule' && (
        <div className="space-y-5 flex flex-col h-full">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[var(--ink-hi)] mb-1 flex items-center gap-2">
              <Calendar size={18} className="text-blue-500" />
              Agendamento de Webinars
            </h2>
            <p className="text-xs text-[var(--ink-lo)]">Agende transmissões futuras ou selecione um evento agendado para iniciar.</p>
          </div>

          {/* New Event Form Toggle button */}
          {!isSchedulingFormOpen ? (
            <button
              onClick={() => setIsSchedulingFormOpen(true)}
              className="w-full touch-action-btn py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shrink-0"
            >
              <Plus size={14} /> Agendar Novo Webinar
            </button>
          ) : (
            <div className="bg-[var(--bg)] border border-[var(--line)] p-4 rounded-xl space-y-3 shrink-0 text-left">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-2 mb-1">
                <span className="text-xs font-bold text-[var(--ink-hi)] uppercase tracking-wider">Novo Agendamento</span>
                <button
                  onClick={() => setIsSchedulingFormOpen(false)}
                  className="text-[var(--ink-lo)] hover:text-[var(--ink-hi)]"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider mb-1">Título</label>
                  <input
                    type="text"
                    value={scheduleTitle}
                    onChange={(e) => setScheduleTitle(e.target.value)}
                    placeholder="Ex: Lançamento Oficial do Produto"
                    className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider mb-1">Descrição</label>
                  <textarea
                    value={scheduleDesc}
                    onChange={(e) => setScheduleDesc(e.target.value)}
                    placeholder="Descrição do webinar..."
                    className="w-full h-12 bg-[var(--surface)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider mb-1">Data / Horário</label>
                    <input
                      type="text"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      placeholder="Quinta, às 20h"
                      className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider mb-1">Tipo</label>
                    <select
                      value={scheduleType}
                      onChange={(e) => setScheduleType(e.target.value as any)}
                      className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-lg px-2 py-1.5 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-blue-500"
                    >
                      <option value="webinar">Webinar Interativo</option>
                      <option value="live">Transmissão Direta</option>
                      <option value="pre-recorded">Pré-gravado</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!scheduleTitle || !scheduleTime) {
                      alert("Por favor, preencha o Título e a Data/Horário!");
                      return;
                    }
                    const newWebinar = {
                      id: `webinar-${Date.now()}`,
                      title: scheduleTitle,
                      desc: scheduleDesc || "Nenhuma descrição fornecida.",
                      time: scheduleTime,
                      channels: ['YouTube', 'Facebook'],
                      type: scheduleType,
                      videoName: ''
                    };
                    setWebinars(prev => [newWebinar, ...prev]);
                    setScheduleTitle('');
                    setScheduleDesc('');
                    setScheduleTime('');
                    setIsSchedulingFormOpen(false);
                  }}
                  className="w-full touch-action-btn py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check size={12} /> Confirmar Agendamento
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto pr-0.5 space-y-3">
            {webinars.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center text-[var(--ink-dim)]">
                <Calendar size={24} className="mb-2 text-[var(--ink-dim)]" />
                <p className="text-xs">Nenhum webinar agendado.</p>
              </div>
            ) : (
              webinars.map(webinar => (
                <div 
                  key={webinar.id} 
                  className="bg-[var(--bg)] border border-[var(--line)] hover:border-[var(--line-ctl)]/80 p-3.5 rounded-xl text-left space-y-2.5 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md uppercase">
                        {webinar.type}
                      </span>
                      <h3 className="font-bold text-[var(--ink-hi)] text-xs mt-1.5 leading-normal">{webinar.title}</h3>
                    </div>
                    <button
                      onClick={() => setWebinars(prev => prev.filter(w => w.id !== webinar.id))}
                      className="text-[var(--ink-dim)] hover:text-red-400 p-1 rounded-lg hover:bg-[var(--surface)] transition-all shrink-0"
                      title="Excluir agendamento"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <p className="text-[10px] text-[var(--ink-lo)] line-clamp-2 leading-relaxed">{webinar.desc}</p>

                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--ink-lo)] font-medium">
                    <Calendar size={11} className="text-[var(--ink-dim)]" />
                    <span>{webinar.time}</span>
                  </div>

                  <div className="pt-2 border-t border-[var(--line)]/80 flex items-center justify-between gap-2">
                    <span className="text-[9px] text-[var(--ink-dim)] truncate">
                      Canais: {webinar.channels.join(', ')}
                    </span>
                    <button
                      onClick={() => {
                        setTitle(webinar.title);
                        setDescription(webinar.desc);
                        alert(`Estúdio configurado com os dados do Webinar:\n"${webinar.title}"! Pronto para transmitir.`);
                      }}
                      className="px-2.5 py-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 font-bold rounded-lg text-[10px] transition-all flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Play size={10} /> Carregar no Estúdio
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}



      {/* 8. VISUAL THEME PARAMETERS (Temas) */}
      {activeTab === 'theme' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[var(--ink-hi)] mb-1 flex items-center gap-2">
              <Sliders size={18} className="text-blue-500" />
              Temas & Aparência
            </h2>
            <p className="text-xs text-[var(--ink-lo)]">Escolha o modo visual do estúdio e personalize as cores e marcas das suas transmissões.</p>
          </div>

          {/* STUDIO THEME MODE (MODO CLARO / MODO ESCURO) */}
          <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-3.5" id="studio-theme-mode-section">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[var(--ink-hi)] uppercase tracking-wider flex items-center gap-1.5">
                {theme === 'dark' ? <Moon size={14} className="text-blue-400" /> : <Sun size={14} className="text-amber-500" />}
                Esquema de Cores do Estúdio
              </h3>
              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                theme === 'light' 
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              }`}>
                {theme === 'light' ? 'Modo Claro Ativo' : 'Modo Escuro Ativo'}
              </span>
            </div>

            <p className="text-[10px] text-[var(--ink-lo)] leading-normal text-left">
              Alterne entre o visual Escuro (Dark Studio) e o novo Tema Claro (Light Studio) de alta legibilidade para todas as barras, menus e painéis.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Dark Theme Option Card */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                  theme === 'dark'
                    ? 'bg-blue-600/10 border-blue-500 ring-2 ring-blue-500/30'
                    : 'bg-[var(--surface)] border-[var(--line)] hover:border-[var(--line-ctl)] text-[var(--ink)]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[var(--surface)] border border-[var(--line-ctl)] flex items-center justify-center text-blue-400 shadow-sm">
                      <Moon size={13} />
                    </div>
                    <span className="font-bold text-xs text-[var(--ink-hi)]">Escuro</span>
                  </div>
                  {theme === 'dark' && (
                    <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center">
                      <Check size={10} />
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-[var(--ink-lo)] leading-tight">Ideal para estúdios escuros e transmissões noturnas.</p>
              </button>

              {/* Light Theme Option Card */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                  theme === 'light'
                    ? 'bg-blue-600/10 border-blue-500 ring-2 ring-blue-500/30'
                    : 'bg-[var(--surface)] border-[var(--line)] hover:border-[var(--line-ctl)] text-[var(--ink)]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shadow-sm">
                      <Sun size={13} />
                    </div>
                    <span className="font-bold text-xs text-[var(--ink-hi)]">Claro</span>
                  </div>
                  {theme === 'light' && (
                    <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center">
                      <Check size={10} />
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-[var(--ink-lo)] leading-tight">Alta nitidez, fundo limpo e contraste aprimorado.</p>
              </button>
            </div>
          </div>

          {/* BRAND PRESETS PANEL */}
          <div className="bg-[var(--bg)] border border-[var(--line)]/80 p-4 rounded-xl space-y-4" id="brand-presets-section">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider flex items-center gap-1.5">
                <Palette size={14} className="text-pink-400" />
                Presets de Identidade Visual
              </h3>
              <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20">
                Brand Kit
              </span>
            </div>

            <p className="text-[10px] text-[var(--ink-lo)] leading-normal text-left">
              Alterne instantaneamente entre marcas pré-configuradas ou salve seu próprio tema para usar depois.
            </p>

            {/* Presets Grid */}
            <div className="space-y-2.5 text-left">
              <span className="text-[9px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block">Estilos Prontos</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEFAULT_PRESETS.map(preset => {
                  const isActive = streamColor.toLowerCase() === preset.streamColor.toLowerCase() && 
                                   textStyle === preset.textStyle && 
                                   activeLogo === preset.activeLogo;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-blue-500/10 border-blue-500 hover:border-blue-400' 
                          : 'bg-[var(--surface)] border-[var(--line)]/80 hover:border-[var(--line-ctl)] text-[var(--ink)] hover:text-[var(--ink-hi)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span 
                          className="w-3 h-3 rounded-full shrink-0 border border-white/10 shadow" 
                          style={{ backgroundColor: preset.streamColor }} 
                        />
                        <div className="truncate">
                          <p className="font-bold text-[11px] leading-tight truncate">{preset.name}</p>
                          <p className="text-[9px] text-[var(--ink-lo)] capitalize leading-none mt-0.5">{preset.textStyle}</p>
                        </div>
                      </div>
                      {isActive && (
                        <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                          <Check size={10} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Saved Presets Section */}
            <div className="space-y-2.5 text-left pt-2.5 border-t border-[var(--line)]/60">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-[var(--ink-lo)] uppercase tracking-wider">Meus Presets Salvos</span>
                <span className="text-[9px] font-mono text-[var(--ink-dim)]">{customPresets.length} salvos</span>
              </div>

              {customPresets.length === 0 ? (
                <div className="py-3 bg-[var(--surface)]/40 rounded-xl border border-dashed border-[var(--line)] flex flex-col items-center justify-center text-center text-[var(--ink-dim)]">
                  <span className="text-[10px]">Nenhum preset personalizado salvo.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-0.5">
                  {customPresets.map(preset => {
                    const isActive = streamColor.toLowerCase() === preset.streamColor.toLowerCase() && 
                                     textStyle === preset.textStyle && 
                                     activeLogo === preset.activeLogo;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs text-left transition-all cursor-pointer group relative ${
                          isActive 
                            ? 'bg-blue-500/10 border-blue-500 hover:border-blue-400' 
                            : 'bg-[var(--surface)] border-[var(--line)]/80 hover:border-[var(--line-ctl)] text-[var(--ink)] hover:text-[var(--ink-hi)]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-5">
                          <span 
                            className="w-3 h-3 rounded-full shrink-0 border border-white/10 shadow" 
                            style={{ backgroundColor: preset.streamColor }} 
                          />
                          <div className="truncate">
                            <p className="font-bold text-[11px] leading-tight truncate">{preset.name}</p>
                            <p className="text-[9px] text-[var(--ink-lo)] capitalize leading-none mt-0.5">{preset.textStyle}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isActive && (
                            <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center">
                              <Check size={10} />
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomPreset(preset.id, e)}
                            className="text-[var(--ink-dim)] hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-all cursor-pointer"
                            title="Excluir Preset"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Save / Export / Import Action Panel */}
              <div className="space-y-2 pt-1.5">
                {isSavingPreset ? (
                  <div className="flex gap-1.5 animate-in slide-in-from-bottom-1 duration-150">
                    <input
                      type="text"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      placeholder="Nome da sua marca..."
                      className="flex-1 bg-[var(--surface)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500 transition-colors"
                      maxLength={24}
                    />
                    <button
                      type="button"
                      onClick={handleSaveCurrentPreset}
                      className="px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center cursor-pointer"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSavingPreset(false);
                        setNewPresetName('');
                      }}
                      className="px-2.5 bg-[var(--surface)] border border-[var(--line)] hover:bg-[var(--panel)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)] rounded-lg text-xs transition-colors flex items-center justify-center cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsSavingPreset(true)}
                      className="flex-1 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 font-bold rounded-xl text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} /> Salvar Tema Atual
                    </button>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={handleExportCurrentPreset}
                        className="py-2 px-3 bg-[var(--panel)]/60 hover:bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--line-ctl)] text-[var(--ink)] hover:text-[var(--ink-hi)] font-bold rounded-xl text-[10px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Exportar Marca como JSON"
                      >
                        <Download size={12} /> Exportar JSON
                      </button>
                      <button
                        type="button"
                        onClick={() => presetFileRef.current?.click()}
                        className="py-2 px-3 bg-[var(--panel)]/60 hover:bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--line-ctl)] text-[var(--ink)] hover:text-[var(--ink-hi)] font-bold rounded-xl text-[10px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Importar Marca do JSON"
                      >
                        <Upload size={12} /> Importar JSON
                      </button>
                      <input
                        type="file"
                        ref={presetFileRef}
                        onChange={handleImportPreset}
                        accept="application/json"
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Theme Stream Color */}
          <div className="bg-[var(--bg)] border border-[var(--line)] p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-semibold text-[var(--ink-lo)] uppercase tracking-wider text-left">Cor Principal da Marca</h3>
            
            <div className="flex flex-wrap gap-2 justify-start">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => onStreamColorChange(color)}
                  style={{ backgroundColor: color }}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    streamColor.toLowerCase() === color.toLowerCase() 
                      ? 'border-white scale-110 shadow-lg' 
                      : 'border-transparent hover:scale-105'
                  }`}
                  title={color}
                />
              ))}
              
              {/* HTML custom color input */}
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-600 hover:scale-105 transition-all">
                <input
                  type="color"
                  value={streamColor}
                  onChange={(e) => onStreamColorChange(e.target.value)}
                  className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                />
                <div 
                  className="w-full h-full flex items-center justify-center text-xs font-bold text-black"
                  style={{ backgroundColor: streamColor }}
                >
                  +
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[var(--ink-lo)] text-left">Cor ativa: <span className="font-mono font-semibold text-[var(--ink-hi)]">{streamColor}</span></p>
          </div>

          {/* Text Style selection */}
          <div className="bg-[var(--bg)] border border-[var(--line)] p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-semibold text-[var(--ink-lo)] uppercase tracking-wider text-left">Estilo dos Textos (Banners)</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['default', 'news', 'rounded'] as const).map(style => (
                <button
                  key={style}
                  onClick={() => setTextStyle(style)}
                  className={`py-2 text-[11px] font-bold rounded-lg capitalize border transition-all ${
                    textStyle === style 
                      ? 'bg-blue-500/10 border-blue-500 text-blue-400' 
                      : 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--line-ctl)]'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Animação de Entrada para Elementos */}
          <div className="bg-[var(--bg)] border border-[var(--line)] p-4 rounded-xl space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-[var(--ink-lo)] uppercase tracking-wider text-left flex items-center gap-1.5">
                <Sparkles size={14} className="text-blue-500" />
                Animações de Entrada de Elementos
              </h3>
              <p className="text-[10px] text-[var(--ink-lo)] mt-0.5 leading-normal">Escolha os efeitos visuais de entrada para banners e logos ao serem ativados no palco.</p>
            </div>

            <div className="space-y-3">
              {/* Logo entrance animation */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block text-left">Efeito de Entrada do Logo</label>
                <div className="grid grid-cols-2 gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--line)]">
                  {([
                    { id: 'none', label: 'Nenhum' },
                    { id: 'fade', label: 'Surgir (Fade)' },
                    { id: 'slide', label: 'Deslizar (Slide)' },
                    { id: 'pop', label: 'Pop / Zoom' }
                  ] as const).map(anim => (
                    <button
                      key={anim.id}
                      type="button"
                      onClick={() => setLogoAnimation(anim.id)}
                      className={`py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                        logoAnimation === anim.id 
                          ? 'bg-blue-500 text-white shadow-md' 
                          : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                      }`}
                    >
                      {anim.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Banner entrance animation */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block text-left">Efeito de Entrada do Letreiro</label>
                <div className="grid grid-cols-2 gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--line)]">
                  {([
                    { id: 'none', label: 'Nenhum' },
                    { id: 'fade', label: 'Surgir (Fade)' },
                    { id: 'slide', label: 'Deslizar (Slide)' },
                    { id: 'typewriter', label: 'Máquina Escrever' },
                    { id: 'pop', label: 'Pop / Zoom' }
                  ] as const).map(anim => (
                    <button
                      key={anim.id}
                      type="button"
                      onClick={() => setBannerAnimation(anim.id)}
                      className={`py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                        bannerAnimation === anim.id 
                          ? 'bg-blue-500 text-white shadow-md' 
                          : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                      }`}
                    >
                      {anim.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Posicionamento do Card do Palestrante (PIP & Apresentação) */}
          <div className="bg-[var(--bg)] border border-[var(--line)] p-4 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-xs font-semibold text-[var(--ink-lo)] uppercase tracking-wider flex items-center gap-1.5">
                  <Move size={14} className="text-blue-500" />
                  Posição do Card do Palestrante
                </h3>
                <p className="text-[10px] text-[var(--ink-lo)] mt-0.5 leading-normal">
                  Arraste livremente no palco ou selecione os atalhos para posicionar a sua câmera sobre os slides e telas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateSpeakerSettings({ x: 74, y: 68 }, 1.0, 'rounded')}
                className="px-2 py-1 bg-[var(--surface)] hover:bg-[var(--panel)] border border-[var(--line-ctl)] text-[var(--ink)] rounded text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Resetar
              </button>
            </div>

            {/* Presets Grid */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block text-left">
                Posições Rápidas (Cantos & Centro)
              </label>
              <div className="grid grid-cols-4 gap-1.5 bg-[var(--surface)] p-1.5 rounded-lg border border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => updateSpeakerSettings({ x: 3, y: 4 })}
                  className={`py-1.5 px-2 rounded flex flex-col items-center justify-center gap-0.5 text-[9px] font-bold transition-all ${
                    sidebarSpeakerPos.x < 20 && sidebarSpeakerPos.y < 20
                      ? 'bg-blue-500 text-white shadow'
                      : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:bg-[var(--panel)]'
                  }`}
                  title="Topo Esquerdo"
                >
                  <ArrowUpLeft size={13} />
                  <span>Topo Esq</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateSpeakerSettings({ x: 38, y: 4 })}
                  className={`py-1.5 px-2 rounded flex flex-col items-center justify-center gap-0.5 text-[9px] font-bold transition-all ${
                    sidebarSpeakerPos.x > 25 && sidebarSpeakerPos.x < 50 && sidebarSpeakerPos.y < 20
                      ? 'bg-blue-500 text-white shadow'
                      : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:bg-[var(--panel)]'
                  }`}
                  title="Topo Centro"
                >
                  <ArrowUp size={13} />
                  <span>Topo Ctr</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateSpeakerSettings({ x: 74, y: 4 })}
                  className={`py-1.5 px-2 rounded flex flex-col items-center justify-center gap-0.5 text-[9px] font-bold transition-all ${
                    sidebarSpeakerPos.x > 60 && sidebarSpeakerPos.y < 20
                      ? 'bg-blue-500 text-white shadow'
                      : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:bg-[var(--panel)]'
                  }`}
                  title="Topo Direito"
                >
                  <ArrowUpRight size={13} />
                  <span>Topo Dir</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateSpeakerSettings({ x: 38, y: 36 })}
                  className={`py-1.5 px-2 rounded flex flex-col items-center justify-center gap-0.5 text-[9px] font-bold transition-all ${
                    sidebarSpeakerPos.x > 25 && sidebarSpeakerPos.x < 50 && sidebarSpeakerPos.y > 25 && sidebarSpeakerPos.y < 55
                      ? 'bg-blue-500 text-white shadow'
                      : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:bg-[var(--panel)]'
                  }`}
                  title="Centro da Tela"
                >
                  <Move size={13} />
                  <span>Centro</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateSpeakerSettings({ x: 3, y: 68 })}
                  className={`py-1.5 px-2 rounded flex flex-col items-center justify-center gap-0.5 text-[9px] font-bold transition-all ${
                    sidebarSpeakerPos.x < 20 && sidebarSpeakerPos.y > 55
                      ? 'bg-blue-500 text-white shadow'
                      : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:bg-[var(--panel)]'
                  }`}
                  title="Base Esquerda"
                >
                  <ArrowDownLeft size={13} />
                  <span>Base Esq</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateSpeakerSettings({ x: 38, y: 68 })}
                  className={`py-1.5 px-2 rounded flex flex-col items-center justify-center gap-0.5 text-[9px] font-bold transition-all ${
                    sidebarSpeakerPos.x > 25 && sidebarSpeakerPos.x < 50 && sidebarSpeakerPos.y > 55
                      ? 'bg-blue-500 text-white shadow'
                      : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:bg-[var(--panel)]'
                  }`}
                  title="Base Centro"
                >
                  <ArrowDown size={13} />
                  <span>Base Ctr</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateSpeakerSettings({ x: 74, y: 68 })}
                  className={`py-1.5 px-2 rounded flex flex-col items-center justify-center gap-0.5 text-[9px] font-bold transition-all ${
                    sidebarSpeakerPos.x > 60 && sidebarSpeakerPos.y > 55
                      ? 'bg-blue-500 text-white shadow'
                      : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)] hover:bg-[var(--panel)]'
                  }`}
                  title="Base Direita (Padrão)"
                >
                  <ArrowDownRight size={13} />
                  <span>Base Dir</span>
                </button>
                <div className="flex flex-col items-center justify-center p-1 rounded bg-[var(--bg)] border border-[var(--line)]/80 text-[8px] font-mono text-blue-400">
                  <span>X: {Math.round(sidebarSpeakerPos.x)}%</span>
                  <span>Y: {Math.round(sidebarSpeakerPos.y)}%</span>
                </div>
              </div>
            </div>

            {/* Shape Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block text-left">
                Formato do Card
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-[var(--surface)] p-1 rounded-lg border border-[var(--line)]">
                {[
                  { id: 'rounded', label: 'Retângulo Arredondado' },
                  { id: 'circle', label: 'Circular (Avatar PIP)' },
                  { id: 'compact', label: 'Compacto' }
                ].map(shape => (
                  <button
                    key={shape.id}
                    type="button"
                    onClick={() => updateSpeakerSettings(undefined, undefined, shape.id as any)}
                    className={`py-1.5 px-2 text-[10px] font-bold rounded-md transition-all ${
                      sidebarSpeakerShape === shape.id
                        ? 'bg-blue-500 text-white shadow'
                        : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                    }`}
                  >
                    {shape.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--ink)] font-medium">Tamanho / Escala do Card</span>
                <span className="font-mono text-blue-400 font-bold">{Math.round(sidebarSpeakerScale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.8"
                step="0.05"
                value={sidebarSpeakerScale}
                onChange={(e) => updateSpeakerSettings(undefined, parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer h-1 rounded-lg bg-[var(--panel)]"
              />
            </div>
          </div>

          {/* Ajuste de Enquadramento da Câmera (Crop) */}
          <div className="bg-[var(--bg)] border border-[var(--line)] p-4 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-xs font-semibold text-[var(--ink-lo)] uppercase tracking-wider">Enquadramento da Câmera</h3>
                <p className="text-[10px] text-[var(--ink-lo)] mt-0.5 leading-normal">Ajuste o zoom e o crop da sua câmera principal ao vivo.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onCameraZoomChange(1);
                  onCameraOffsetXChange(0);
                  onCameraOffsetYChange(0);
                }}
                className="px-2 py-1 bg-[var(--surface)] hover:bg-[var(--panel)] border border-[var(--line-ctl)] text-[var(--ink)] rounded text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Resetar
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Zoom Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--ink)] font-medium">Zoom (Crop)</span>
                  <span className="font-mono text-blue-400 font-bold">{Math.round(cameraZoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={cameraZoom}
                  onChange={(e) => onCameraZoomChange(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1 rounded-lg bg-[var(--panel)]"
                />
              </div>

              {/* Offset X Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--ink)] font-medium">Posição Horizontal (X)</span>
                  <span className="font-mono text-blue-400 font-bold">
                    {cameraOffsetX > 0 ? `+${cameraOffsetX}` : cameraOffsetX}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={cameraOffsetX}
                  onChange={(e) => onCameraOffsetXChange(parseInt(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1 rounded-lg bg-[var(--panel)]"
                />
              </div>

              {/* Offset Y Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--ink)] font-medium">Posição Vertical (Y)</span>
                  <span className="font-mono text-blue-400 font-bold">
                    {cameraOffsetY > 0 ? `+${cameraOffsetY}` : cameraOffsetY}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={cameraOffsetY}
                  onChange={(e) => onCameraOffsetYChange(parseInt(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1 rounded-lg bg-[var(--panel)]"
                />
              </div>

              {/* Espelhar Câmera (Flip Horizontal) Toggle */}
              <div className="pt-3.5 border-t border-[var(--line)]/60 flex items-center justify-between">
                <div className="text-left pr-2">
                  <span className="text-[11px] text-[var(--ink)] font-bold flex items-center gap-1">
                    Espelhar Câmera (Mirror)
                  </span>
                  <p className="text-[9px] text-[var(--ink-lo)] leading-tight mt-0.5">Mantenha habilitado para visualização natural ou desative para que textos em slides ou no fundo fiquem legíveis.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={mirrorCamera}
                    onChange={(e) => onMirrorCameraChange(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-8 h-4.5 bg-[var(--surface)] border border-[var(--line)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-[var(--ink-lo)] peer-checked:after:bg-blue-500 after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-500/20 peer-checked:border-blue-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Croma Key (Green Screen) Controls */}
          <div className="bg-[var(--bg)] border border-[var(--line)] p-4 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-xs font-semibold text-[var(--ink-lo)] uppercase tracking-wider">Croma Key (Fundo Verde)</h3>
                <p className="text-[10px] text-[var(--ink-lo)] mt-0.5 leading-normal">Remova ou substitua o fundo da sua câmera principal.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={chromaKeyEnabled}
                  onChange={(e) => onChromaKeyEnabledChange(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-8 h-4.5 bg-[var(--surface)] border border-[var(--line)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-[var(--ink-lo)] peer-checked:after:bg-blue-500 after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-500/20 peer-checked:border-blue-500"></div>
              </label>
            </div>

            {chromaKeyEnabled && (
              <div className="space-y-3.5 border-t border-[var(--line)]/60 pt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Chroma Color Picker */}
                <div className="space-y-1.5 text-left">
                  <span className="text-[11px] text-[var(--ink)] font-medium">Cor de Chave (Background a remover)</span>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5 flex-1">
                      {[
                        { hex: '#00ff00', label: 'Verde' },
                        { hex: '#0000ff', label: 'Azul' },
                        { hex: '#ff0000', label: 'Vermelho' }
                      ].map(preset => (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => onChromaColorChange(preset.hex)}
                          className={`flex-1 py-1 px-1.5 rounded text-[9px] font-bold border transition-all ${
                            chromaColor.toLowerCase() === preset.hex 
                              ? 'bg-blue-500/10 border-blue-500 text-blue-400' 
                              : 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                          }`}
                        >
                          <div className="flex items-center gap-1 justify-center">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.hex }}></span>
                            {preset.label}
                          </div>
                        </button>
                      ))}
                    </div>
                    {/* HTML color picker */}
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-600 hover:scale-105 transition-all shrink-0">
                      <input
                        type="color"
                        value={chromaColor}
                        onChange={(e) => onChromaColorChange(e.target.value)}
                        className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                      />
                      <div 
                        className="w-full h-full flex items-center justify-center text-xs font-bold text-black"
                        style={{ backgroundColor: chromaColor }}
                      >
                        +
                      </div>
                    </div>
                  </div>
                  <p className="text-[9px] text-[var(--ink-dim)]">Cor selecionada: <span className="font-mono text-[var(--ink)]">{chromaColor}</span></p>
                </div>

                {/* Tolerance slider */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--ink)] font-medium">Tolerância da Cor</span>
                    <span className="font-mono text-blue-400 font-bold">{chromaTolerance}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="1"
                    value={chromaTolerance}
                    onChange={(e) => onChromaToleranceChange(parseInt(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer h-1 rounded-lg bg-[var(--panel)]"
                  />
                  <p className="text-[9px] text-[var(--ink-dim)] leading-normal">
                    Valores mais altos removem mais tons próximos da cor escolhida.
                  </p>
                </div>

                {/* Edge Softness slider */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--ink)] font-medium">Suavização das Bordas</span>
                    <span className="font-mono text-blue-400 font-bold">{chromaEdgeSoftness}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={chromaEdgeSoftness}
                    onChange={(e) => onChromaEdgeSoftnessChange && onChromaEdgeSoftnessChange(parseInt(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer h-1 rounded-lg bg-[var(--panel)]"
                  />
                  <p className="text-[9px] text-[var(--ink-dim)] leading-normal">
                    Suaviza o contorno do corte da câmera para evitar bordas serrilhadas.
                  </p>
                </div>

                {/* Spill Suppression slider */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--ink)] font-medium">Descarte de Brilho (Spill)</span>
                    <span className="font-mono text-blue-400 font-bold">{chromaSpillSuppression}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={chromaSpillSuppression}
                    onChange={(e) => onChromaSpillSuppressionChange && onChromaSpillSuppressionChange(parseInt(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer h-1 rounded-lg bg-[var(--panel)]"
                  />
                  <p className="text-[9px] text-[var(--ink-dim)] leading-normal">
                    Reduz reflexos esverdeados ou azulados nas bordas do cabelo e ombros.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Cronômetro Regressivo Panel */}
          <div className="bg-[var(--bg)] border border-[var(--line)] p-4 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-xs font-bold text-[var(--ink-hi)] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={14} className="text-blue-500 animate-pulse" />
                  Cronômetro de Espera / Intervalo
                </h3>
                <p className="text-[10px] text-[var(--ink-lo)] mt-0.5 leading-normal">
                  Exiba um cronômetro na tela para intervalos ou contagem regressiva.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showCountdownOnScreen}
                  onChange={(e) => setShowCountdownOnScreen && setShowCountdownOnScreen(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-8 h-4.5 bg-[var(--surface)] border border-[var(--line)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-[var(--ink-lo)] peer-checked:after:bg-blue-500 after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-500/20 peer-checked:border-blue-500"></div>
              </label>
            </div>

            {showCountdownOnScreen && (
              <div className="space-y-4 border-t border-[var(--line)]/60 pt-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Timer Controls (Start, Pause, Reset) */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCountdownActive && setIsCountdownActive(!isCountdownActive)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isCountdownActive
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400 hover:bg-amber-500/20'
                        : 'bg-green-500/10 border-green-500 text-green-400 hover:bg-green-500/20'
                    }`}
                  >
                    {isCountdownActive ? (
                      <>
                        <Pause size={12} /> Pausar
                      </>
                    ) : (
                      <>
                        <Play size={12} /> Iniciar
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (setIsCountdownActive && setCountdownTimeLeft) {
                        setIsCountdownActive(false);
                        setCountdownTimeLeft(countdownDuration);
                      }
                    }}
                    className="px-3 py-2 bg-[var(--surface)] hover:bg-[var(--panel)] border border-[var(--line-ctl)] text-[var(--ink)] rounded-lg text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1"
                    title="Resetar Cronômetro"
                  >
                    <RotateCcw size={12} /> Reset
                  </button>
                </div>

                {/* Duration Config Preset Buttons */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider block">Atalhos de Duração</label>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: '1 min', sec: 60 },
                      { label: '3 min', sec: 180 },
                      { label: '5 min', sec: 300 },
                      { label: '10 min', sec: 600 }
                    ].map(preset => (
                      <button
                        key={preset.sec}
                        type="button"
                        onClick={() => {
                          if (setCountdownDuration && setCountdownTimeLeft) {
                            setCountdownDuration(preset.sec);
                            setCountdownTimeLeft(preset.sec);
                          }
                        }}
                        className={`py-1.5 text-[10px] font-bold rounded border transition-all cursor-pointer ${
                          countdownDuration === preset.sec 
                            ? 'bg-blue-500 text-white border-blue-500' 
                            : 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Duration Slider */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--ink)] font-medium">Duração Personalizada</span>
                    <span className="font-mono text-blue-400 font-bold">
                      {Math.floor(countdownDuration / 60)}m {countdownDuration % 60}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="1800"
                    step="30"
                    value={countdownDuration}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (setCountdownDuration && setCountdownTimeLeft) {
                        setCountdownDuration(val);
                        if (!isCountdownActive) {
                          setCountdownTimeLeft(val);
                        }
                      }
                    }}
                    className="w-full accent-blue-500 cursor-pointer h-1 rounded-lg bg-[var(--panel)]"
                  />
                  <p className="text-[9px] text-[var(--ink-dim)]">
                    Ajuste entre 30 segundos e 30 minutos.
                  </p>
                </div>

                {/* Live Remaining Time Display */}
                <div className="p-3 bg-[var(--surface)] border border-[var(--line)]/80 rounded-xl text-center space-y-1">
                  <div className="text-[9px] font-bold text-[var(--ink-lo)] uppercase tracking-wider">Tempo Restante</div>
                  <div className="text-2xl font-mono font-black text-[var(--ink-hi)] tracking-widest animate-pulse">
                    {Math.floor(countdownTimeLeft / 60).toString().padStart(2, '0')}:
                    {(countdownTimeLeft % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-[8px] text-[var(--ink-dim)] uppercase font-semibold">
                    {isCountdownActive ? 'Contagem ativa' : 'Pausado'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Thumbnail Editor Modal */}
      {isThumbnailModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[var(--surface)] border border-[var(--line)] w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[var(--bg)]">
              <div className="text-left">
                <h3 className="text-sm font-bold text-[var(--ink-hi)] flex items-center gap-2">
                  <Edit size={16} className="text-blue-500" /> Editor de Capas (Thumbnail)
                </h3>
                <p className="text-xs text-[var(--ink-lo)]">Configure a imagem e os textos e faça o download da thumbnail final</p>
              </div>
              <button 
                onClick={() => setIsThumbnailModalOpen(false)}
                className="text-[var(--ink-lo)] hover:text-[var(--ink-hi)] p-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <ThumbnailEditor 
                initialTitle={title} 
                onSave={(dataUrl) => {
                  console.log("Capa salva com sucesso!");
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal for Creating or Editing Banner */}
      {isAddBannerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg)] border border-[var(--line-ctl)] w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
              <h3 className="text-sm font-bold text-[var(--ink-hi)] flex items-center gap-2">
                <Bookmark size={16} className="text-indigo-400" />
                {editingBanner ? 'Editar Banner' : 'Criar Novo Banner'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddBannerModalOpen(false);
                  setEditingBanner(null);
                }}
                className="text-[var(--ink-lo)] hover:text-[var(--ink-hi)] p-1.5 rounded-lg hover:bg-[var(--panel)] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-[var(--ink)] uppercase tracking-wider mb-1">
                  Título Principal (Banner)
                </label>
                <input
                  type="text"
                  value={bannerInputTitle}
                  onChange={(e) => setBannerInputTitle(e.target.value)}
                  placeholder="Ex: Multistreaming upto 40+ social media platforms at once"
                  className="w-full bg-[var(--well)] border border-[var(--line-ctl)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--ink)] uppercase tracking-wider mb-1">
                  Subtítulo / Cabeçalho Superior
                </label>
                <input
                  type="text"
                  value={bannerInputSubtitle}
                  onChange={(e) => setBannerInputSubtitle(e.target.value)}
                  placeholder="Ex: Stream like a Pro - OneStream Live Studio"
                  className="w-full bg-[var(--well)] border border-[var(--line-ctl)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--ink)] uppercase tracking-wider mb-1.5">
                  Tema de Cores
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'onestream', label: 'OneStream Green', theme: '#1d273b', accent: '#84cc16' },
                    { id: 'indigo', label: 'Indigo Pro', theme: '#1e1b4b', accent: '#6366f1' },
                    { id: 'pink', label: 'Pink Wine', theme: '#31102b', accent: '#ec4899' },
                    { id: 'gold', label: 'Gold Navy', theme: '#0f172a', accent: '#eab308' }
                  ].map(preset => (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => {
                        setSelectedThemeColor(preset.theme);
                        setSelectedAccentColor(preset.accent);
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] font-bold transition-all cursor-pointer ${
                        selectedThemeColor === preset.theme ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-sm' : 'border-[var(--line)] bg-[var(--well)] text-[var(--ink-lo)] hover:border-[var(--line-ctl)]'
                      }`}
                    >
                      <span>{preset.label}</span>
                      <div className="flex gap-1">
                        <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: preset.accent }} />
                        <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: preset.theme }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => {
                  setIsAddBannerModalOpen(false);
                  setEditingBanner(null);
                }}
                className="px-4 py-2 bg-[var(--panel)] hover:bg-[var(--raise)] text-[var(--ink)] text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveBannerFromModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md cursor-pointer"
              >
                {editingBanner ? 'Atualizar Banner' : 'Salvar Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
