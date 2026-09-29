import { AcaoDeTexto } from './components/ui/AcaoDeTexto';
import { BotaoDeIcone } from './components/ui/BotaoDeIcone';
import { Button } from './components/ui/Button';
import { apiFetch } from './lib/apiFetch';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppHeader, type VisaoDoApp } from './components/AppHeader';
import { Dashboard } from './components/Dashboard';
import { CanaisPagina } from './components/CanaisPagina';
import { WebinarsPagina } from './components/WebinarsPagina';
import { CriarWebinarModal } from './components/CriarWebinarModal';
import { rotuloDoHorario } from './lib/horario';
import { ConfiguracoesPagina } from './components/ConfiguracoesPagina';
import { LeftSidebar } from './components/LeftSidebar';
import { StudioPreview } from './components/StudioPreview';
import { BarraDoEstudio } from './components/BarraDoEstudio';
import { TrilhoDeCenas, BotoesDeTransicao, DURACAO_DA_FUSAO, type Transicao } from './components/TrilhoDeCenas';
import { MesaDeMonitores, ProximoCorte } from './components/MonitoresDoEstudio';
import { PainelDoEstudio, FERRAMENTA_INICIAL, type Ferramenta } from './components/PainelDoEstudio';
import { BandejaDoEstudio } from './components/BandejaDoEstudio';
import { CARD_PADRAO, CENA_INICIAL, cenaPeloId, layoutUsaCard, lerCardSalvo, mudancaNoCard, precisaDaTela, salvarCard, type Cena } from './lib/cenas';
import { AuthAndPricing } from './components/AuthAndPricing';
import { ScreenSharePickerModal } from './components/ScreenSharePickerModal';
import { PwStreamLogo } from './components/PwStreamLogo';
import { WebinarPublicPage } from './components/WebinarPublicPage';
import { SuperAdminPanel } from './components/SuperAdminPanel';
import { PlansModal } from './components/PlansModal';
import { PlanoPagina } from './components/PlanoPagina';
import { CadastroPagina } from './components/CadastroPagina';
import { CloudflareStreamModal } from './components/CloudflareStreamModal';
import { CustomDestinationModal } from './components/CustomDestinationModal';
import { AddChannelsModal } from './components/AddChannelsModal';
import { QrCodeModal } from './components/QrCodeModal';
import { CLOUDFLARE_STREAM_CONFIG } from './lib/cloudflareStreamConfig';

import { Destination, Banner, TickerItem, BannerPosition, Comment, Participant, StudioSceneState, GeometriaDoCard, QrCodeConfig, StudioTab, SceneTransitionType, isWipeTransition } from './types';
import { INITIAL_DESTINATIONS, INITIAL_BANNERS, INITIAL_TICKERS, INITIAL_COMMENTS, AUDIO_LIBRARY } from './data';
import { startSynth, stopSynth, setVolume as setSynthVolume } from './audioEngine';
import { CircleAlert, Play, Calendar, Users, Tv, BarChart3, Plus, ArrowRight, Settings, ExternalLink, Palette, ListTodo, QrCode, FileText, MessageSquare, Music, Sliders, ShieldAlert, Sparkles, X, Maximize2, Minimize2, CheckCircle2, Type, Film, Bell, Puzzle, Activity, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { ThumbnailEditor } from './components/ThumbnailEditor';
import { LegalModal } from './components/LegalModals';
import { useSceneTransition } from './hooks/useSceneTransition';
import { useMediaManager } from './context/MediaManagerContext';
import { Modal } from './components/ui/Modal';
import { useToast } from './components/ui/Toast';
import { limiteDeCanaisLigados } from './lib/plans';
import { cabeLigado, estadoDoCanal } from './lib/canais';
import { 
  loginWithGoogle, 
  logoutFirebase, 
  subscribeAuth,
  subscribeWebinars,
  saveWebinarToFirestore,
  agendarWebinar,
  deleteWebinarFromFirestore,
  subscribeBanners,
  saveBannersToFirestore,
  subscribeSnapshots,
  addSnapshotToFirestore,
  deleteSnapshotFromFirestore,
  subscribeTransmissionSettings,
  saveTransmissionSettingsToFirestore,
  saveDestinationsToFirestore,
  subscribeSceneLayouts,
  saveSceneLayoutsToFirestore,
  validateUserTrialStatus,
  subscribeQuotaStatus,
  FIRESTORE_UPGRADE_URL
} from './lib/firestoreService';

export default function App() {
  const { 
    activeOverlay, setActiveOverlay, 
    activeBackground, setActiveBackground, 
    videoClips, activeVideoClip, setActiveVideoClip,
    playVideoClip, uploadVideoClip,
    customAudios
  } = useMediaManager();
  
  // User state
  const [user, setUser] = useState<{
    uid?: string;
    email: string;
    name: string;
    plan: 'Standard' | 'Professional' | 'Business' | 'Free Trial';
    isExpired: boolean;
    trialDays: number;
    // `role` vem do perfil gravado no login e já era lido por SuperAdminPanel,
    // mas faltava neste tipo — então o campo existia em tempo de execução e
    // era invisível para quem lê o código.
    role?: 'super-admin' | 'client';
    subscriptionStatus?: 'trial' | 'active' | 'past_due' | 'canceled' | 'expired';
    trialEndsAt?: string;
  } | null>(() => {
    const saved = localStorage.getItem('pwstream_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const [isAddChannelsModalOpen, setIsAddChannelsModalOpen] = useState(false);
  // Plataforma em que o modal de canais abre direto (o "conserta num clique").
  const [plataformaDoModalDeCanais, setPlataformaDoModalDeCanais] = useState<string | undefined>(undefined);
  const [canalDoModalDeCanais, setCanalDoModalDeCanais] = useState<string | undefined>(undefined);
  const toast = useToast();
  const [plansModalReason, setPlansModalReason] = useState<'live' | 'record' | 'upgrade' | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancelled' | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeAuth((userProfile) => {
      if (userProfile) {
        setUser(userProfile);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logoutFirebase();
    setUser(null);
  };

  const handleRequirePlan = (feature: 'live' | 'record') => {
    setPlansModalReason(feature);
    setIsPlansModalOpen(true);
  };

  const isTrialExpired = Boolean(
    user && user.plan === 'Free Trial' && (user.isExpired || (user.trialDays !== undefined && user.trialDays <= 0))
  );

  const handleAuthSuccess = (newUser: { email: string; name: string; plan: 'Standard' | 'Professional' | 'Business' | 'Free Trial'; isExpired: boolean; trialDays: number }) => {
    setUser(newUser);
    localStorage.setItem('pwstream_user', JSON.stringify(newUser));
  };

  // Depois de o banco confirmar o nome (Dados de cadastro): o menu, o palco e
  // o cache do login passam a usar o nome novo sem esperar o próximo login.
  const atualizarNome = (nome: string) => {
    if (!user) return;
    const atualizado = { ...user, name: nome };
    setUser(atualizado);
    localStorage.setItem('pwstream_user', JSON.stringify(atualizado));
  };

  // Dados que telas apagadas guardavam só neste navegador e que nada lê mais:
  // os dados fiscais do cadastro antigo (razão social, CPF/CNPJ, endereço;
  // voltam com a cobrança), as faturas e o consumo inventados da cobrança
  // antiga e a configuração do painel de qualidade de vídeo, que não chegava
  // à live.
  useEffect(() => {
    try {
      ['pwstream_billing_profile', 'pwstream_invoices', 'pwstream_member_minutes', 'pwstream_member_storage', 'pwstream_video_quality_config'].forEach((chave) =>
        localStorage.removeItem(chave)
      );
    } catch {
      /* armazenamento indisponível: não há o que limpar */
    }
  }, []);

  // App views: 'dashboard' | 'studio' | 'super-admin' | 'public-webinar' | 'profile' | 'billing'
  const [currentView, setCurrentView] = useState<VisaoDoApp>('dashboard');

  // Handle direct URL route navigation for /admin or #admin
  useEffect(() => {
    const handleUrlRoute = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;

      // A rota /admin, #admin e ?mode=admin promoviam QUALQUER visitante à
      // visão de super-admin. Agora exigem o papel do perfil.
      //
      // Isto é defesa em profundidade, NÃO autorização: qualquer verificação
      // no cliente é contornável, e o PIN do painel está no bundle. A
      // autorização de verdade tem de ser feita no servidor, a cada request
      // — o SUPER_ADMIN_EMAILS do .env existe justamente para isso.
      const isSuperAdmin = user?.role === 'super-admin';
      if (pathname.endsWith('/admin') || hash === '#admin' || search.includes('mode=admin')) {
        if (isSuperAdmin) {
          setCurrentView('super-admin');
        } else {
          // Sem alarde: a rota simplesmente não existe para quem não é admin.
          setCurrentView('dashboard');
        }
      }

      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('payment') === 'success') {
        setPaymentStatus('success');
        // Clear params without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (urlParams.get('payment') === 'cancelled') {
        setPaymentStatus('cancelled');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleUrlRoute();
    window.addEventListener('hashchange', handleUrlRoute);
    window.addEventListener('popstate', handleUrlRoute);
    return () => {
      window.removeEventListener('hashchange', handleUrlRoute);
      window.removeEventListener('popstate', handleUrlRoute);
    };
    // Depende do papel: com [] o handler fechava sobre o `user` do primeiro
    // render, e um admin que entrasse DEPOIS da montagem seria devolvido ao
    // dashboard ao usar a própria rota.
  }, [user?.role]);

  // Dynamic webinars list
  const [webinars, setWebinars] = useState<Array<{
    id: string; title: string; desc: string; time: string;
    channels: string[]; type: string; videoName: string;
    /** Horario de inicio em ISO 8601. A contagem regressiva da pagina
     *  publica deriva DESTE campo — sem ele, nao ha contagem. Os webinares
     *  semeados nao tem porque sao demonstracao: a pagina entao mostra o
     *  horario anunciado em , que e o que de fato se sabe. */
    startsAt?: string;
  // Começa vazio. Eram dois webinars inventados ("Como Alavancar suas
  // Vendas...", "Webinar de Boas-vindas...") que ficavam na tela sempre que
  // o Firestore não respondia — e o painel novo os anunciaria como "a
  // próxima live". A lista real chega pela assinatura abaixo.
  }>>([]);
  const [selectedWebinarId, setSelectedWebinarId] = useState<string>('');

  const handleDeleteWebinar = async (id: string) => {
    setWebinars(prev => prev.filter(w => w.id !== id));
    try {
      if (user) {
        await deleteWebinarFromFirestore(user.uid, id);
      }
    } catch (e) {
      console.error('Error deleting webinar:', e);
    }
  };

  // Agendar webinar (o rascunho mora no próprio modal)
  const [isCreateWebinarOpen, setIsCreateWebinarOpen] = useState(false);

  // Studio Widgets state
  const [showWidgetChat, setShowWidgetChat] = useState<boolean>(false);
  const [chatWidgetOpacity, setChatWidgetOpacity] = useState<number>(95);
  const [showWidgetLousa, setShowWidgetLousa] = useState<boolean>(false);
  const [showWidgetSnapshot, setShowWidgetSnapshot] = useState<boolean>(false);
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState<boolean>(false);
  const [isStreamHealthOpen, setIsStreamHealthOpen] = useState<boolean>(false);
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);

  // Stream state
  // 'seven' é a aba Chat, a primeira do trilho. Era 'first', que não
  // correspondia a painel nenhum — barra lateral em branco na primeira visita.
  const [activeTab, setActiveTab] = useState<StudioTab>('seven');
  const [destinations, setDestinations] = useState<Destination[]>(INITIAL_DESTINATIONS);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isThumbnailEnabled, setIsThumbnailEnabled] = useState(false);
  const [isScheduleEnabled, setIsScheduleEnabled] = useState(false);

  // Dashboard Thumbnail Editor States
  const [isDashboardEditorOpen, setIsDashboardEditorOpen] = useState(false);
  const [dashboardEditorTitle, setDashboardEditorTitle] = useState('');

  // Banners
  const [banners, setBanners] = useState<Banner[]>(INITIAL_BANNERS);
  const [activeBannerId, setActiveBannerId] = useState<string | null>(null);

  // Tickers (Barra de Rolagem de Texto)
  const [tickers, setTickers] = useState<TickerItem[]>(INITIAL_TICKERS);
  const [activeTickerId, setActiveTickerId] = useState<string | null>(null);
  const [tickerSpeed, setTickerSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [tickerDirection, setTickerDirection] = useState<'left' | 'right'>('left');

  // Audio / Synth
  const [currentPlayingTrackId, setCurrentPlayingTrackId] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(0.5);
  const [musicLoop, setMusicLoop] = useState<boolean>(true);

  // Customization
  // A cor dos gráficos da live (nome no vídeo, banners) começa neutra. Era
  // vermelha, e no estúdio o vermelho quer dizer "no ar".
  const [streamColor, setStreamColor] = useState<string>('#202429');
  const [textStyle, setTextStyle] = useState<'default' | 'news' | 'rounded'>('default');

  // Chat/Comments
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [pinnedComment, setPinnedComment] = useState<Comment | null>(null);

  // New features states: QR Code & Notes
  const [showQrCode, setShowQrCode] = useState(false);
  const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);
  const [qrCodeConfig, setQrCodeConfig] = useState<QrCodeConfig>(() => {
    try {
      const saved = localStorage.getItem('pw_qrcode_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Começa vazio: vinha um "Smartphone Pro Max 256GB" da Shopee, com foto do Unsplash.
    return {
      id: 'qr-default',
      title: '',
      subtitle: '',
      price: '',
      originalPrice: '',
      discountBadge: '',
      storeUrl: '',
      storeName: '',
      ctaLabel: '',
      imageUrl: '',
      orientation: 'horizontal',
      cardTheme: 'dark',
      qrColor: '#000000',
      qrBgColor: '#ffffff',
      showProductImage: false,
      showPrice: false,
      showDiscountBadge: false,
      showStoreName: false,
      showScanPrompt: true,
      scale: 1,
      x: 75,
      y: 65
    };
  });
  const [qrCodeText, setQrCodeText] = useState(() => {
    try {
      const saved = localStorage.getItem('pw_qrcode_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.storeUrl) return parsed.storeUrl;
      }
    } catch (e) {}
    return '';
  });
  const [presenterNotes, setPresenterNotes] = useState(
    ''
  );

  // Teleprompter State
  const [teleprompterText, setTeleprompterText] = useState<string>(
    "Sejam todos muito bem-vindos à nossa transmissão ao vivo!\n\nHoje vamos abordar os tópicos mais importantes do dia, apresentar novidades exclusivas e responder às principais dúvidas no chat.\n\nFiquem à vontade para interagir, mandar mensagens e compartilhar o link da live com seus amigos.\n\nVamos começar a nossa apresentação em 3, 2, 1..."
  );
  const [isTeleprompterPlaying, setIsTeleprompterPlaying] = useState<boolean>(false);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState<number>(3); // 1 (slow) to 10 (fast)
  const [teleprompterFontSize, setTeleprompterFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');
  const [teleprompterMirrored, setTeleprompterMirrored] = useState<boolean>(false);
  const [showTeleprompterOnStudio, setShowTeleprompterOnStudio] = useState<boolean>(false);

  // Media Streams & Devices
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [selectedCamId, setSelectedCamId] = useState<string>('');
  
  // Controls Toggles
  const [isMuted, setIsMuted] = useState(false);
  const [isCamStopped, setIsCamStopped] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isScreenSharePickerOpen, setIsScreenSharePickerOpen] = useState(false);
  const [screenPickerInitialTab, setScreenPickerInitialTab] = useState<'tab' | 'window' | 'screen' | 'pdf' | 'video'>('screen');
  const [selectedSharedSource, setSelectedSharedSource] = useState<{ 
    type: 'tab' | 'window' | 'screen' | 'pdf' | 'video'; 
    name: string; 
    audioShared: boolean;
    fileUrl?: string;
    fileName?: string;
    pdfPageCount?: number;
    resolution?: '720p' | '1080p';
    frameRate?: '30fps' | '60fps';
    initialPage?: number;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('pwstreamer_selectedSharedSource');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.fileUrl && !parsed.fileUrl.startsWith('blob:')) {
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  });

  // Toggle for showing/hiding text overlay on StudioPreview (Modo Preparação)
  const [isPresentationOverlayActive, setIsPresentationOverlayActive] = useState<boolean>(true);

  // Firestore Quota Resilience state
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [isQuotaBannerVisible, setIsQuotaBannerVisible] = useState(true);

  useEffect(() => {
    const unsubQuota = subscribeQuotaStatus((exceeded) => {
      setIsQuotaExceeded(exceeded);
    });
    return () => unsubQuota();
  }, []);

  // Limite de canais ligados ao mesmo tempo, do plano (plans.ts)
  const limiteDeLigados = limiteDeCanaisLigados(user?.plan);
  // Fora do estúdio, "Ver planos" leva à página de plano. No estúdio, o modal
  // por cima não tira ninguém do palco — a câmera e uma live em andamento.
  const abrirPlanos = () => {
    if (currentView === 'studio') {
      setPlansModalReason('upgrade');
      setIsPlansModalOpen(true);
    } else {
      setCurrentView('billing');
    }
  };

  // Countdown Timer states
  const [countdownDuration, setCountdownDuration] = useState<number>(300);
  const [countdownTimeLeft, setCountdownTimeLeft] = useState<number>(300);
  const [isCountdownActive, setIsCountdownActive] = useState<boolean>(false);
  const [showCountdownOnScreen, setShowCountdownOnScreen] = useState<boolean>(false);

  // RTMP OBS External Settings & Cloudflare Stream Pipeline
  const [rtmpServer, setRtmpServer] = useState<string>(CLOUDFLARE_STREAM_CONFIG.rtmpsUrl);
  const [streamKey, setStreamKey] = useState<string>(CLOUDFLARE_STREAM_CONFIG.rtmpsKey);
  const [isCloudflareModalOpen, setIsCloudflareModalOpen] = useState(false);
  const [isCustomDestinationsModalOpen, setIsCustomDestinationsModalOpen] = useState(false);

  // Auto-fade (Ducking) feature states
  const [isAutoFadeEnabled, setIsAutoFadeEnabled] = useState<boolean>(false);
  const [autoFadeVolumeFactor, setAutoFadeVolumeFactor] = useState<number>(0.2);
  const [autoFadeSensitivity, setAutoFadeSensitivity] = useState<number>(0.5);
  const [isPresenterSpeaking, setIsPresenterSpeaking] = useState<boolean>(false);

  // Legal Modal States
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy'>('terms');

  // Layout Preset
  const [layout, setLayout] = useState<'1-cam' | 'dual' | 'screen-share' | 'picture-in-picture' | 'presentation' | 'grid' | 'gallery'>('1-cam');
  const [isFirestoreSettingsLoaded, setIsFirestoreSettingsLoaded] = useState(false);

  // Active video clip and slides presentation states
  const [activeSlide, setActiveSlide] = useState<{ name: string; currentPage: number; totalPages: number } | null>(null);

  const [playlist, setPlaylist] = useState<string[]>([]);
  const [isPlaylistActive, setIsPlaylistActive] = useState(false);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(-1);

  const handleVideoClipEnded = () => {
    if (isPlaylistActive && playlist.length > 0) {
      const nextIndex = currentPlaylistIndex + 1;
      if (nextIndex < playlist.length) {
        setCurrentPlaylistIndex(nextIndex);
        const nextClipId = playlist[nextIndex];
        const nextClip = videoClips.find(c => c.id === nextClipId);
        if (nextClip) {
          // Reconstruir o objeto campo a campo descartava `duration` e
          // `thumbnail`, então avançar a playlist perdia os dois. O spread
          // preserva o clipe inteiro e só troca o estado de reprodução.
          setActiveVideoClip({ ...nextClip, isPlaying: true });
        }
      } else {
        setIsPlaylistActive(false);
        setCurrentPlaylistIndex(-1);
        setActiveVideoClip(null);
      }
    }
  };

  // Scene transition type
  const [transitionType, setTransitionType] = useState<SceneTransitionType>('fade');
  const [transitionColor, setTransitionColor] = useState<string>('#FF3D38');

  // Smart Sidebar states
  const [isSmartSidebarEnabled, setIsSmartSidebarEnabled] = useState<boolean>(true);

  // Initialize scene transition hook
  const {
    isTransitioning,
    transitionStage,
    triggerTransition
  } = useSceneTransition({
    defaultColor: '#FF3D38',
    defaultDuration: 300,
    defaultType: 'dip-to-color'
  });

  const changeLayoutWithTransition = (nextLayout: any) => {
    const isColorTransition = ['dip-to-color', 'slide-wipe', 'shutter-wipe', 'radial-wipe', 'flash'].includes(transitionType);
    
    const applyLayoutChange = () => {
      setLayout(nextLayout);
    };

    if (isColorTransition) {
      triggerTransition(applyLayoutChange, {
        color: transitionColor,
        duration: transitionDuration,
        type: transitionType as any
      });
    } else {
      applyLayoutChange();
    }
  };

  // Camera framing (Crop/Zoom) states
  const [cameraZoom, setCameraZoom] = useState<number>(1);
  const [cameraOffsetX, setCameraOffsetX] = useState<number>(0);
  const [cameraOffsetY, setCameraOffsetY] = useState<number>(0);

  // Chroma Key states
  const [chromaKeyEnabled, setChromaKeyEnabled] = useState<boolean>(false);
  const [chromaColor, setChromaColor] = useState<string>('#00ff00');
  const [chromaTolerance, setChromaTolerance] = useState<number>(40);
  const [chromaEdgeSoftness, setChromaEdgeSoftness] = useState<number>(20);
  const [chromaSpillSuppression, setChromaSpillSuppression] = useState<number>(30);

  // Voice Scene Automation states
  const [isSceneAutomationEnabled, setIsSceneAutomationEnabled] = useState<boolean>(false);
  const [activeSpeaker, setActiveSpeaker] = useState<'p-local' | 'p-guest' | 'none'>('p-local');

  // Mirror camera state
  // Começa desligado: o espelho vale no programa também, e ligado de saída
  // o público via os textos atrás de quem fala ao contrário.
  const [mirrorCamera, setMirrorCamera] = useState<boolean>(false);

  // Transition duration state
  const [transitionDuration, setTransitionDuration] = useState<number>(300);

  // Scene-specific transitions state
  const [sceneTransitions, setSceneTransitions] = useState<Record<string, { type: SceneTransitionType; duration: number }>>({
    'scene-1': { type: 'dip-to-color', duration: 400 },
    'scene-2': { type: 'fade', duration: 300 },
    'scene-3': { type: 'slide-wipe', duration: 400 },
    'scene-4': { type: 'zoom', duration: 350 },
    'scene-5': { type: 'flash', duration: 300 },
  });

  const handleUpdateSceneTransition = (
    sceneId: string, 
    type: SceneTransitionType, 
    duration: number
  ) => {
    setSceneTransitions(prev => ({
      ...prev,
      [sceneId]: { type, duration }
    }));
  };

  // Local Recording options
  const [recordingFormat, setRecordingFormat] = useState<'mp4' | 'webm'>('mp4');
  const [recordingQuality, setRecordingQuality] = useState<'720p' | '1080p'>('1080p');

  // Element Animations config
  const [logoAnimation, setLogoAnimation] = useState<'none' | 'fade' | 'slide' | 'pop'>('fade');
  const [bannerAnimation, setBannerAnimation] = useState<'none' | 'fade' | 'slide' | 'typewriter' | 'pop'>('slide');
  const [bannerPosition, setBannerPosition] = useState<BannerPosition>('bottom');

  // AI Moderation states
  const [isAiModerationEnabled, setIsAiModerationEnabled] = useState<boolean>(true);
  const [aiModerationMode, setAiModerationMode] = useState<'warn' | 'hide'>('warn');

  // Auto-layout switching for immersive transmission tools
  useEffect(() => {
    if (activeSlide) {
      changeLayoutWithTransition('presentation');
    }
  }, [activeSlide]);

  useEffect(() => {
    if (activeVideoClip && activeVideoClip.isPlaying && activeVideoClip.url && !activeVideoClip.url.startsWith('blob:')) {
      const source = {
        type: 'video' as const,
        name: activeVideoClip.name,
        fileUrl: activeVideoClip.url,
        audioShared: true
      };
      setSelectedSharedSource(source);
      try {
        localStorage.setItem('pwstreamer_selectedSharedSource', JSON.stringify(source));
      } catch (e) {}
      // Keep layout in screen-share if current layout isn't another active presentation
      if (layout !== 'screen-share' && layout !== 'presentation') {
        changeLayoutWithTransition('screen-share');
      }
    } else if (!activeVideoClip || !activeVideoClip.isPlaying) {
      if (selectedSharedSource?.type === 'video') {
        setSelectedSharedSource(null);
        try {
          localStorage.removeItem('pwstreamer_selectedSharedSource');
        } catch (e) {}
      }
    }
  }, [activeVideoClip]);

  // Snapshots state
  const [snapshots, setSnapshots] = useState<{ id: string; name: string; url: string; timestamp: string }[]>([]);

  const handleAddSnapshot = (snap: { id: string; name: string; url: string; timestamp: string }) => {
    setSnapshots(prev => [snap, ...prev]);
    if (user?.uid) {
      addSnapshotToFirestore(user.uid, snap);
    }
  };

  const handleDeleteSnapshot = (id: string) => {
    setSnapshots(prev => prev.filter(s => s.id !== id));
    if (user?.uid) {
      deleteSnapshotFromFirestore(user.uid, id);
    }
  };

  // Scenes management
  const [currentSceneId, setCurrentSceneId] = useState<string>(CENA_INICIAL.id);

  // O card da câmera que o preview está montando; o do programa vai no estado do corte
  const [cardDaCamera, setCardDaCamera] = useState<GeometriaDoCard>(lerCardSalvo);
  useEffect(() => salvarCard(cardDaCamera), [cardDaCamera]);

  const [programSceneState, setProgramSceneState] = useState<StudioSceneState>(() => ({
    sceneId: CENA_INICIAL.id,
    cardDaCamera,
    layout: CENA_INICIAL.layout,
    activeParticipantIds: CENA_INICIAL.fontes,
    activeBannerId: null,
    activeTickerId: null,
    pinnedComment: null,
    bannerPosition: 'bottom',
    showQrCode: false,
    qrCodeText: ''
  }));
  // Durante a fusão, o programa que sai fica por cima e some em DURACAO_DA_FUSAO.
  const [programaQueSai, setProgramaQueSai] = useState<StudioSceneState | null>(null);
  const [mostrarGuias, setMostrarGuias] = useState(false);
  const [ferramenta, setFerramenta] = useState<Ferramenta>(FERRAMENTA_INICIAL);

  // Escolher uma cena monta o preview; quem leva ao programa é o corte.
  const handleSelectScene = (cena: Cena) => {
    setCurrentSceneId(cena.id);
    setLayout(cena.layout);
    setParticipants(prev => prev.map(p => ({ ...p, isActive: cena.fontes.includes(p.id) })));
  };

  // Participants (Sources on/off stage)
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: 'p-local',
      // Placeholder até a sessão carregar — o efeito abaixo põe o nome real.
      name: 'Apresentador',
      avatarUrl: '',
      isLocal: true,
      isActive: true,
      hasVideo: true,
      hasAudio: true
    },
    {
      id: 'p-screen',
      name: 'Compartilhamento de Tela',
      avatarUrl: '',
      isLocal: false,
      isScreenShare: true,
      isActive: false,
      hasVideo: true,
      hasAudio: false
    }
  ]);

  // O participante local é quem está logado. Era 'Marcos (Você)' fixo no
  // código: todo cliente aparecia no palco, na gravação e na lista de
  // participantes como Marcos. Nome puro aqui; o "(Você)" é das telas do
  // operador, não do que vai ao ar.
  useEffect(() => {
    const nome = user?.name?.trim().split(/\s+/)[0];
    if (!nome) return;
    setParticipants(prev => prev.map(p => (p.id === 'p-local' ? { ...p, name: nome } : p)));
  }, [user?.name]);

  // O que o próximo corte leva do preview ao programa, em palavras
  const pendingChanges = useMemo(() => {
    const changes: string[] = [];
    if (currentSceneId !== programSceneState.sceneId) {
      changes.push(`Cena: ${cenaPeloId(currentSceneId)?.nome ?? currentSceneId}`);
    } else if (layout !== programSceneState.layout) {
      changes.push('Layout do palco');
    }
    const currentActiveIds = participants.filter(p => p.isActive).map(p => p.id).sort().join(',');
    const programActiveIds = (programSceneState.activeParticipantIds || []).slice().sort().join(',');
    if (currentActiveIds !== programActiveIds && currentSceneId === programSceneState.sceneId) {
      changes.push('Fontes em cena');
    }
    if (activeBannerId !== programSceneState.activeBannerId) {
      changes.push(activeBannerId ? 'Entra o banner' : 'Sai o banner');
    }
    if (activeTickerId !== programSceneState.activeTickerId) {
      changes.push(activeTickerId ? 'Entra o ticker' : 'Sai o ticker');
    }
    if (bannerPosition !== programSceneState.bannerPosition) {
      changes.push('Posição do banner');
    }
    if (pinnedComment?.id !== programSceneState.pinnedComment?.id) {
      changes.push(pinnedComment ? 'Entra o comentário fixado' : 'Sai o comentário fixado');
    }
    if ((activeBackground || '') !== (programSceneState.activeBackground || '')) {
      changes.push('Fundo');
    }
    if (showQrCode !== (programSceneState.showQrCode ?? false)) {
      changes.push(showQrCode ? 'Entra o QR code' : 'Sai o QR code');
    }
    // O card só conta quando o programa e o preview são cenas com card
    if (layoutUsaCard(layout) && layoutUsaCard(programSceneState.layout)) {
      const mudanca = mudancaNoCard(programSceneState.cardDaCamera ?? CARD_PADRAO, cardDaCamera);
      if (mudanca) changes.push(`Card da câmera: ${mudanca}`);
    }
    return changes;
  }, [layout, participants, activeBannerId, activeTickerId, bannerPosition, pinnedComment, currentSceneId, activeBackground, showQrCode, cardDaCamera, programSceneState]);

  const hasPendingChanges = pendingChanges.length > 0;

  // O estado do preview, como ele iria ao programa
  const estadoDoPreview = (): StudioSceneState => ({
    sceneId: currentSceneId,
    layout,
    activeParticipantIds: participants.filter(p => p.isActive).map(p => p.id),
    activeBannerId,
    activeTickerId,
    pinnedComment,
    bannerPosition,
    activeBackground,
    activeOverlay,
    activeLogo: undefined,
    activeSlide,
    showQrCode,
    qrCodeText,
    cardDaCamera
  });

  // Corte: o preview vai ao programa na hora. Fusão: o programa que sai fica
  // por cima e some em DURACAO_DA_FUSAO. Antes o "take" desenhava cortinas no
  // monitor de preview e o programa cortava seco, qualquer que fosse a escolha.
  const fusaoRef = useRef<number | null>(null);
  const cortar = (transicao: Transicao) => {
    if (fusaoRef.current) window.clearTimeout(fusaoRef.current);
    if (transicao === 'fusao') {
      setProgramaQueSai(programSceneState);
      fusaoRef.current = window.setTimeout(() => {
        setProgramaQueSai(null);
        fusaoRef.current = null;
      }, DURACAO_DA_FUSAO);
    } else {
      setProgramaQueSai(null);
    }
    setProgramSceneState(estadoDoPreview());
  };

  // Câmera e microfone só no estúdio. Eram pedidos quando o app abria, antes
  // do login, e ficavam ligados no painel inteiro; a limpeza usava uma
  // referência antiga do stream e não desligava nada.
  const noEstudio = currentView === 'studio';
  const streamRef = useRef<MediaStream | null>(null);
  const telaRef = useRef<MediaStream | null>(null);
  useEffect(() => { streamRef.current = localStream; }, [localStream]);
  useEffect(() => { telaRef.current = screenStream; }, [screenStream]);
  useEffect(() => {
    if (!noEstudio) return;
    let saiu = false;
    navigator.mediaDevices?.getUserMedia({ video: { width: 1280, height: 720 }, audio: true })
      .then((stream) => {
        if (saiu) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        stream.getAudioTracks().forEach((t) => { t.enabled = !isMuted; });
        stream.getVideoTracks().forEach((t) => { t.enabled = !isCamStopped; });
        setLocalStream(stream);
        setParticipants(prev => prev.map(p => p.isLocal ? { ...p, stream } : p));
      })
      .catch((err) => console.warn('Câmera e microfone não liberados:', err));
    return () => {
      saiu = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      telaRef.current?.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
      setScreenStream(null);
      setIsScreenSharing(false);
      setParticipants(prev => prev.map(p => ({ ...p, stream: null })));
    };
  }, [noEstudio]);

  useEffect(() => () => stopSynth(), []);

  // Update volume in sound engine (taking into account auto-fade/ducking)
  useEffect(() => {
    const activeVolume = (isAutoFadeEnabled && isPresenterSpeaking)
      ? volume * autoFadeVolumeFactor
      : volume;
    setSynthVolume(activeVolume);
  }, [volume, isAutoFadeEnabled, isPresenterSpeaking, autoFadeVolumeFactor]);

  // Auto-fade Speech Detector (Microphone Level Analysis & Simulation)
  useEffect(() => {
    if (!isAutoFadeEnabled) {
      setIsPresenterSpeaking(false);
      return;
    }

    if (isMuted) {
      setIsPresenterSpeaking(false);
      return;
    }

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let intervalId: any = null;
    let speakingTime = 0;
    let silenceTime = 0;

    // Threshold mapping: higher sensitivity means lower threshold to trigger Speaking
    const threshold = (1.05 - autoFadeSensitivity) * 45;

    if (localStream && localStream.getAudioTracks().length > 0) {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        source = audioContext.createMediaStreamSource(localStream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        intervalId = setInterval(() => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          let maxVal = 0;
          for (let i = 0; i < dataArray.length; i++) {
            if (dataArray[i] > maxVal) {
              maxVal = dataArray[i];
            }
          }
          const percentageLevel = (maxVal / 255) * 100;

          if (percentageLevel > threshold) {
            speakingTime += 100;
            silenceTime = 0;
            if (speakingTime >= 100) {
              setIsPresenterSpeaking(true);
            }
          } else {
            silenceTime += 100;
            speakingTime = 0;
            if (silenceTime >= 600) {
              setIsPresenterSpeaking(false);
            }
          }
        }, 100);

        return () => {
          if (intervalId) clearInterval(intervalId);
          if (audioContext) {
            audioContext.close().catch(() => {});
          }
        };
      } catch (err) {
        console.warn("Failed to set up real AudioContext for auto-fade, using fallback simulation:", err);
      }
    }

    // Speech Simulation Mode
    let phraseTime = 0;
    let currentMode: 'talking' | 'silence' = 'talking';

    intervalId = setInterval(() => {
      phraseTime += 100;

      if (currentMode === 'talking') {
        const simulatedLevel = Math.random() * 55 + 15;
        if (simulatedLevel > threshold) {
          setIsPresenterSpeaking(true);
        } else {
          setIsPresenterSpeaking(false);
        }

        if (Math.random() < 0.1 && phraseTime > 2000) {
          currentMode = 'silence';
          phraseTime = 0;
          setIsPresenterSpeaking(false);
        }
      } else {
        setIsPresenterSpeaking(false);

        if (Math.random() < 0.35 && phraseTime > 800) {
          currentMode = 'talking';
          phraseTime = 0;
        }
      }
    }, 100);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [localStream, isMuted, isAutoFadeEnabled, autoFadeSensitivity]);

  // Listen to custom subtab switches (e.g. from the compact control tray)
  useEffect(() => {
    const handleSwitchSubtab = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab: string }>;
      const tabName = customEvent.detail?.tab;
      if (tabName === 'settings') {
        setActiveTab('settings');
      } else if (tabName === 'slides') {
        setActiveTab('apps');
      } else if (tabName === 'videos' || tabName === 'audios') {
        setActiveTab('video');
      }
    };
    window.addEventListener('switch-studio-subtab', handleSwitchSubtab);
    return () => {
      window.removeEventListener('switch-studio-subtab', handleSwitchSubtab);
    };
  }, []);

  // Countdown Timer Tick Logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isCountdownActive && countdownTimeLeft > 0) {
      interval = setInterval(() => {
        setCountdownTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (countdownTimeLeft === 0 && isCountdownActive) {
      setIsCountdownActive(false);
      // Play a beautiful sound or notification when completed
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
          osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
          osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.30); // G5
          osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.45); // C6
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 1.2);
        }
      } catch (e) {
        console.error(e);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCountdownActive, countdownTimeLeft, countdownDuration]);

  // AI Moderation fetcher and logic
  const moderateComment = async (text: string) => {
    try {
      const res = await apiFetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('Failed to moderate');
      return await res.json();
    } catch (err) {
      console.error('Moderation error, using offline backup:', err);
      const lowercaseText = text.toLowerCase();
      const isSpam = lowercaseText.includes("compre") || lowercaseText.includes("www.") || lowercaseText.includes("seguidores") || lowercaseText.includes("promoc") || lowercaseText.includes("grátis") || lowercaseText.includes("ganhe") || lowercaseText.includes("bitcoin");
      const isAbusive = lowercaseText.includes("merda") || lowercaseText.includes("idiota") || lowercaseText.includes("burro") || lowercaseText.includes("lixo") || lowercaseText.includes("tonto") || lowercaseText.includes("fdp") || lowercaseText.includes("imbecil") || lowercaseText.includes("bosta");
      const isIrrelevant = lowercaseText.includes("lol") || lowercaseText.includes("jogar") || lowercaseText.includes("futebol") || lowercaseText.includes("free fire");
      return {
        isAbusive,
        isIrrelevant: isSpam || isIrrelevant,
        reason: isAbusive 
          ? "Linguagem ofensiva (Regra local)" 
          : isSpam 
            ? "Propaganda/Spam (Regra local)" 
            : isIrrelevant 
              ? "Assunto fora do tema (Regra local)" 
              : "Comentário limpo",
        moderatedBy: "Local Rules"
      };
    }
  };

  const processNewComment = async (newComment: Comment) => {
    // Add instantly but with isModerated = false (loading state)
    setComments(prev => [...prev, { ...newComment, isModerated: false }]);

    if (!isAiModerationEnabled) {
      // If AI moderation is disabled, mark as moderated with no flags
      setComments(prev => prev.map(c => c.id === newComment.id ? { ...c, isModerated: true } : c));
      return;
    }

    const modResult = await moderateComment(newComment.text);
    setComments(prev => prev.map(c => {
      if (c.id === newComment.id) {
        return {
          ...c,
          isModerated: true,
          isAbusive: modResult.isAbusive,
          isIrrelevant: modResult.isIrrelevant,
          moderationReason: modResult.reason
        };
      }
      return c;
    }));
  };

  // Destinations toggler
  // Ligar além do plano não liga: o canal fica como estava e o aviso diz por
  // quê e o que fazer. Antes o interruptor de Canais e a lista do estúdio
  // ligavam qualquer quantidade.
  const avisarLimiteDeCanais = (nome: string) =>
    toast.info(
      `${nome} continua desligado`,
      `Seu plano transmite para ${limiteDeLigados} canais ao mesmo tempo. Desligue outro antes de ligar este.`,
      { label: 'Ver planos', onClick: abrirPlanos },
    );

  const handleToggleDestination = (id: string) => {
    const canal = destinations.find(d => d.id === id);
    if (canal && !canal.selected && !cabeLigado(destinations, id, limiteDeLigados)) {
      avisarLimiteDeCanais(canal.name);
      return;
    }
    setDestinations(prev => {
      const updated = prev.map(dest => dest.id === id ? { ...dest, selected: !dest.selected } : dest);
      if (user?.uid) {
        saveDestinationsToFirestore(user.uid, updated);
      }
      return updated;
    });
  };

  // Add or Update Destination (from AddChannelsModal)
  const handleAddOrUpdateDestination = (newDest: Destination) => {
    setDestinations(prev => {
      // Pelo id, só. Casar também pela plataforma sobrescrevia o primeiro canal
      // dela — com dois servidores RTMP, editar o segundo apagava o primeiro.
      const existingIdx = prev.findIndex(d => d.id === newDest.id);
      let updated: Destination[];
      if (existingIdx >= 0) {
        updated = [...prev];
        // Quem decide ligar é o modal: editar não liga um canal desligado, e
        // um canal novo além do limite do plano entra desligado.
        updated[existingIdx] = { ...updated[existingIdx], ...newDest };
      } else {
        updated = [newDest, ...prev];
      }
      if (user?.uid) {
        saveDestinationsToFirestore(user.uid, updated);
      }
      return updated;
    });
  };

  // Remover canal: não existia — um canal conectado ficava para sempre.
  const handleRemoveDestination = (id: string) => {
    setDestinations(prev => {
      const updated = prev.filter(dest => dest.id !== id);
      if (user?.uid) {
        saveDestinationsToFirestore(user.uid, updated);
      }
      return updated;
    });
  };

  // Ações das telas da casca (painel, canais, webinars)
  const conectarCanal = (plataforma?: string) => {
    setCanalDoModalDeCanais(undefined);
    setPlataformaDoModalDeCanais(plataforma);
    setIsAddChannelsModalOpen(true);
  };
  // Editar ESTE canal: pelo id, e não pela plataforma — um servidor RTMP
  // criado no estúdio (NGINX, SRS…) não tem linha própria no modal.
  const editarCanal = (id: string) => {
    setPlataformaDoModalDeCanais(undefined);
    setCanalDoModalDeCanais(id);
    setIsAddChannelsModalOpen(true);
  };
  const entrarNoEstudio = (webinar?: { title: string }) => {
    if (webinar) setTitle(webinar.title);
    setCurrentView('studio');
  };
  const abrirPaginaPublica = (webinar: { id: string }) => {
    setSelectedWebinarId(webinar.id);
    setCurrentView('public-webinar');
  };
  const abrirEditorDeCapa = (webinar: { title: string }) => {
    setDashboardEditorTitle(webinar.title);
    setIsDashboardEditorOpen(true);
  };

  // Add Banner text ticker
  const handleAddBanner = (text: string, subtitle?: string, themeColor?: string, accentColor?: string) => {
    const newBanner: Banner = {
      id: `banner-${Date.now()}`,
      text,
      subtitle: subtitle || '',
      themeColor: themeColor || '#1d273b',
      accentColor: accentColor || '#84cc16'
    };
    const updated = [...banners, newBanner];
    setBanners(updated);
    setActiveBannerId(newBanner.id);
    if (user?.uid) {
      saveBannersToFirestore(user.uid, updated);
    }
  };

  const handleUpdateBanner = (updatedBanner: Banner) => {
    const updated = banners.map(b => b.id === updatedBanner.id ? updatedBanner : b);
    setBanners(updated);
    if (user?.uid) {
      saveBannersToFirestore(user.uid, updated);
    }
  };

  // Delete Banner text ticker
  const handleDeleteBanner = (id: string) => {
    const updated = banners.filter(b => b.id !== id);
    setBanners(updated);
    if (activeBannerId === id) {
      setActiveBannerId(null);
    }
    if (user?.uid) {
      saveBannersToFirestore(user.uid, updated);
    }
  };

  // Ticker Handlers (Barra de Rolagem de Texto)
  const handleAddTicker = (text: string, badgeText?: string) => {
    const newTicker: TickerItem = {
      id: `ticker-${Date.now()}`,
      text,
      badgeText: badgeText || 'ALERTA'
    };
    const updated = [...tickers, newTicker];
    setTickers(updated);
    setActiveTickerId(newTicker.id);
  };

  const handleUpdateTicker = (updatedTicker: TickerItem) => {
    const updated = tickers.map(t => t.id === updatedTicker.id ? updatedTicker : t);
    setTickers(updated);
  };

  const handleDeleteTicker = (id: string) => {
    const updated = tickers.filter(t => t.id !== id);
    setTickers(updated);
    if (activeTickerId === id) {
      setActiveTickerId(null);
    }
  };

  // -------------------------------------------------------------
  // FIRESTORE SUBSCRIPTIONS & PERSISTENCE
  // -------------------------------------------------------------
  useEffect(() => {
    if (!user?.uid) return;

    setIsFirestoreSettingsLoaded(false);
    const timer = setTimeout(() => setIsFirestoreSettingsLoaded(true), 2000);

    const unsubWebinars = subscribeWebinars(user.uid, (firestoreWebinars) => {
      setWebinars(firestoreWebinars);
    });

    const unsubBanners = subscribeBanners(user.uid, (firestoreBanners) => {
      setBanners(firestoreBanners);
    });

    const unsubSnapshots = subscribeSnapshots(user.uid, (firestoreSnapshots) => {
      setSnapshots(firestoreSnapshots);
    });

    const unsubSettings = subscribeTransmissionSettings(user.uid, (settings) => {
      if (settings.destinations) setDestinations(prev => JSON.stringify(prev) === JSON.stringify(settings.destinations) ? prev : settings.destinations);
      if (settings.rtmpServer) setRtmpServer(settings.rtmpServer);
      if (settings.streamKey) setStreamKey(settings.streamKey);
      if (settings.recordingFormat) setRecordingFormat(settings.recordingFormat as any);
      if (settings.recordingQuality) setRecordingQuality(settings.recordingQuality as any);
      if (settings.logoAnimation) setLogoAnimation(settings.logoAnimation as any);
      if (settings.bannerAnimation) setBannerAnimation(settings.bannerAnimation as any);
      if (settings.streamColor) setStreamColor(settings.streamColor);
      if (settings.textStyle) setTextStyle(settings.textStyle as any);
    });

    const unsubScenes = subscribeSceneLayouts(user.uid, (data) => {
      if (data.sceneTransitions) setSceneTransitions(prev => JSON.stringify(prev) === JSON.stringify(data.sceneTransitions) ? prev : data.sceneTransitions);
      if (data.layout) setLayout(data.layout as any);
      if (data.currentSceneId) setCurrentSceneId(data.currentSceneId);
    });

    return () => {
      clearTimeout(timer);
      unsubWebinars();
      unsubBanners();
      unsubSnapshots();
      unsubSettings();
      unsubScenes();
    };
  }, [user?.uid]);

  // Debounced Auto-save Scene Layouts to Firestore
  useEffect(() => {
    if (!user?.uid || !isFirestoreSettingsLoaded) return;
    const timeout = setTimeout(() => {
      saveSceneLayoutsToFirestore(user.uid, {
        currentSceneId,
        layout,
        sceneTransitions
      });
    }, 1500);
    return () => clearTimeout(timeout);
  }, [user?.uid, currentSceneId, layout, sceneTransitions, isFirestoreSettingsLoaded]);

  // Debounced Auto-save Transmission/Stream settings to Firestore
  useEffect(() => {
    if (!user?.uid || !isFirestoreSettingsLoaded) return;
    const timeout = setTimeout(() => {
      saveTransmissionSettingsToFirestore(user.uid, {
        destinations,
        rtmpServer,
        streamKey,
        recordingFormat,
        recordingQuality,
        logoAnimation,
        bannerAnimation,
        streamColor,
        textStyle
      });
    }, 1500);
    return () => clearTimeout(timeout);
  }, [user?.uid, destinations, rtmpServer, streamKey, recordingFormat, recordingQuality, logoAnimation, bannerAnimation, streamColor, textStyle, isFirestoreSettingsLoaded]);

  // Synthesizer background music player and custom audio player
  const customAudioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!customAudioPlayerRef.current) {
      customAudioPlayerRef.current = new Audio();
      customAudioPlayerRef.current.onended = () => {
        if (!musicLoop) {
          setCurrentPlayingTrackId(null);
        }
      };
    }
  }, [musicLoop]);

  useEffect(() => {
    if (customAudioPlayerRef.current) {
      customAudioPlayerRef.current.loop = musicLoop;
    }
  }, [musicLoop]);

  useEffect(() => {
    if (customAudioPlayerRef.current) {
      customAudioPlayerRef.current.volume = volume;
    }
  }, [volume]);

  const handlePlayTrack = (trackId: string | null) => {
    if (trackId === null) {
      setCurrentPlayingTrackId(null);
      stopSynth();
      if (customAudioPlayerRef.current) {
        customAudioPlayerRef.current.pause();
        customAudioPlayerRef.current.currentTime = 0;
      }
    } else {
      const customTrack = customAudios.find(a => a.id === trackId);
      if (customTrack) {
        setCurrentPlayingTrackId(trackId);
        stopSynth();
        if (!customAudioPlayerRef.current) {
          customAudioPlayerRef.current = new Audio();
          customAudioPlayerRef.current.onended = () => {
            if (!musicLoop) {
              setCurrentPlayingTrackId(null);
            }
          };
        }
        const player = customAudioPlayerRef.current;
        player.pause();
        player.currentTime = 0;
        player.removeAttribute('crossorigin');
        player.src = customTrack.url;
        player.volume = volume;
        player.loop = musicLoop;

        const playPromise = player.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.warn('First play attempt failed, reloading src:', e);
            player.load();
            player.play().catch(err => console.error('Audio play error:', err));
          });
        }
      } else {
        const track = AUDIO_LIBRARY.find(t => t.id === trackId);
        if (track) {
          setCurrentPlayingTrackId(trackId);
          if (customAudioPlayerRef.current) customAudioPlayerRef.current.pause();
          startSynth(track.name);
        }
      }
    }
  };

  // Post chat comments manually
  const handlePostComment = (text: string) => {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newComment: Comment = {
      id: `user-comm-${Date.now()}`,
      authorName: user?.name ? `${user.name.split(' ')[0]} (Você)` : 'Você',
      authorAvatar: '',
      text,
      platform: 'studio',
      timestamp
    };
    processNewComment(newComment);
  };

  const handleApproveComment = (id: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, isApprovedByUser: true } : c));
  };

  const handleBatchAddComments = (newComments: Comment[]) => {
    setComments(prev => [...prev, ...newComments]);
  };

  const handleClearComments = () => {
    setComments([]);
    setPinnedComment(null);
  };

  // Toggle webcam stop/start
  const handleToggleCam = () => {
    setIsCamStopped(prev => {
      const next = !prev;
      if (localStream) {
        localStream.getVideoTracks().forEach(track => {
          track.enabled = !next;
        });
      }
      return next;
    });
  };

  // Toggle mic mute/unmute
  const handleToggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      if (localStream) {
        localStream.getAudioTracks().forEach(track => {
          track.enabled = !next;
        });
      }
      return next;
    });
  };

  // Switch physical camera/microphone source dynamically from browser list
  const handleSelectDevice = async (kind: 'audio' | 'video', deviceId: string, label: string) => {
    if (deviceId.startsWith('mock-')) {
      console.log(`Simulated switching ${kind} device to: ${label}`);
      return;
    }

    if (kind === 'audio') {
      setSelectedMicId(deviceId);
    } else {
      setSelectedCamId(deviceId);
    }

    try {
      const currentCamId = kind === 'video' ? deviceId : selectedCamId;
      const currentMicId = kind === 'audio' ? deviceId : selectedMicId;

      const videoConstraints: any = {
        width: 1280,
        height: 720
      };
      if (currentCamId) {
        videoConstraints.deviceId = { exact: currentCamId };
      }

      const audioConstraints: any = true;
      if (currentMicId) {
        audioConstraints.deviceId = { exact: currentMicId };
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints
      });

      // Ensure newly acquired tracks match current toggled state
      newStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
      newStream.getVideoTracks().forEach(track => {
        track.enabled = !isCamStopped;
      });

      // Update localStream and replace track-by-track
      setLocalStream(prevStream => {
        if (!prevStream) {
          setParticipants(prev => prev.map(p => p.isLocal ? { ...p, stream: newStream } : p));
          return newStream;
        }

        const oldTracks = prevStream.getTracks();
        const newTracks = newStream.getTracks();

        const mergedTracks = oldTracks.map(oldTrack => {
          const matchingNewTrack = newTracks.find(n => n.kind === oldTrack.kind);
          if (matchingNewTrack) {
            oldTrack.stop(); // release resources
            return matchingNewTrack;
          }
          return oldTrack;
        });

        newTracks.forEach(newTrack => {
          if (!mergedTracks.some(t => t.kind === newTrack.kind)) {
            mergedTracks.push(newTrack);
          }
        });

        const mergedStream = new MediaStream(mergedTracks);
        setParticipants(prev => prev.map(p => p.isLocal ? { ...p, stream: mergedStream } : p));
        return mergedStream;
      });

    } catch (err) {
      console.warn(`Error switching physical ${kind} device:`, err);
    }
  };

  // A cena do preview, para quem reage fora do render (o fim da tela pelo navegador)
  const cenaDoPreviewRef = useRef(currentSceneId);
  useEffect(() => { cenaDoPreviewRef.current = currentSceneId; }, [currentSceneId]);

  // Parar a tela, pela bandeja ou pelo "Parar compartilhamento" do próprio
  // navegador (esse caminho não era tratado). Se o preview mostrava a tela,
  // volta para a câmera.
  const pararTela = () => {
    telaRef.current?.getTracks().forEach(t => t.stop());
    setScreenStream(null);
    setIsScreenSharing(false);
    setSelectedSharedSource(null);
    setParticipants(prev => prev.map(p => p.isScreenShare ? { ...p, stream: null } : p));
    const cena = cenaPeloId(cenaDoPreviewRef.current);
    if (cena && precisaDaTela(cena)) handleSelectScene(CENA_INICIAL);
  };

  const handleToggleScreenShare = async (initialTab?: 'tab' | 'window' | 'screen' | 'pdf' | 'video') => {
    // A barra lateral chamava isto com o evento de clique no lugar da aba:
    // "Parar compartilhamento" abria o seletor em vez de parar.
    const aba = typeof initialTab === 'string' ? initialTab : undefined;
    if (isScreenSharing && !aba) {
      pararTela();
      return;
    }
    if (aba && aba !== 'screen') {
      setScreenPickerInitialTab(aba);
      setIsScreenSharePickerOpen(true);
      return;
    }
    // Cancelar o seletor do navegador não muda nada. Antes o palco "simulava"
    // o compartilhamento e dizia que a tela estava sendo transmitida.
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).catch(() => null);
    if (!stream) return;
    setScreenStream(stream);
    setIsScreenSharing(true);
    setSelectedSharedSource({ type: 'screen', name: 'Tela compartilhada', audioShared: true });
    setParticipants(prev => prev.map(p => p.isScreenShare ? { ...p, stream } : p));
    stream.getVideoTracks()[0]?.addEventListener('ended', pararTela);
    setIsScreenSharePickerOpen(false);
    // A tela entra no preview, pronta para o corte
    const comTela = cenaPeloId('cena-tela-e-camera');
    if (comTela) handleSelectScene(comTela);
  };

  const handleConfirmScreenShare = async (source: { 
    type: 'tab' | 'window' | 'screen' | 'pdf' | 'video'; 
    name: string; 
    audioShared: boolean;
    fileUrl?: string;
    fileName?: string;
    pdfPageCount?: number;
    resolution?: '720p' | '1080p';
    frameRate?: '30fps' | '60fps';
    initialPage?: number;
  }) => {
    setIsScreenSharePickerOpen(false);
    setSelectedSharedSource(source);

    // If sharing a presentation PDF or a custom Video, we handle rendering directly
    if (source.type === 'pdf') {
      setIsScreenSharing(true);
      setParticipants(prev => prev.map(p => p.isScreenShare ? { ...p, isActive: true, stream: null } : p));
      // Keep in Sandbox Mode, do NOT automatically switch layout.
      return;
    }

    if (source.type === 'video') {
      setIsScreenSharing(true);
      setParticipants(prev => prev.map(p => p.isScreenShare ? { ...p, isActive: true, stream: null } : p));
      changeLayoutWithTransition('screen-share');
      return;
    }

    try {
      // Try to get real display media as a background feed if allowed
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true }).catch(() => null);
      if (stream) {
        setScreenStream(stream);
        setIsScreenSharing(true);
        setParticipants(prev => prev.map(p => p.isScreenShare ? { ...p, isActive: true, stream } : p));
        changeLayoutWithTransition('screen-share');

        stream.getVideoTracks()[0].onended = () => {
          setScreenStream(null);
          setIsScreenSharing(false);
          setSelectedSharedSource(null);
          setParticipants(prev => prev.map(p => p.isScreenShare ? { ...p, isActive: false, stream: null } : p));
          changeLayoutWithTransition('1-cam');
        };
      }
    } catch (err) {
      console.warn('Compartilhamento de tela não iniciado:', err);
    }
  };

  // Participant activation toggle
  const handleToggleParticipantActive = (id: string) => {
    setParticipants(prev => prev.map(p => {
      if (p.id === id) {
        const nextActive = !p.isActive;
        // If screen share is disabled, stop the share stream cleanly
        if (p.isScreenShare && !nextActive && isScreenSharing) {
          if (screenStream) {
            screenStream.getTracks().forEach(t => t.stop());
            setScreenStream(null);
          }
          setIsScreenSharing(false);
        }
        return { ...p, isActive: nextActive };
      }
      return p;
    }));
  };

  const activeBanner = banners.find(b => b.id === activeBannerId) || null;
  const activeTicker = tickers.find(t => t.id === activeTickerId) || null;

  // O monitor de programa: a mesma composição do preview, com o que o
  // último corte levou (cena, fontes, banner, ticker, QR e fundo).
  const palcoDoPrograma = (estado: StudioSceneState) => (
    <StudioPreview
      papel="programa"
      fundoDoPrograma={estado.activeBackground ?? null}
      sobreposicaoDoPrograma={estado.activeOverlay ?? null}
      cardDaCamera={estado.cardDaCamera ?? CARD_PADRAO}
      mostrarGuias={mostrarGuias}
      semBarraDeLayouts
      layout={estado.layout}
      onLayoutChange={() => {}}
      streamColor={streamColor}
      textStyle={textStyle}
      activeBannerText={null}
      activeBanner={banners.find(b => b.id === estado.activeBannerId) || null}
      activeTicker={tickers.find(t => t.id === estado.activeTickerId) || null}
      tickerSpeed={tickerSpeed}
      tickerDirection={tickerDirection}
      onSetActiveTicker={() => {}}
      pinnedComment={estado.pinnedComment || null}
      participants={participants.map(p => ({ ...p, isActive: (estado.activeParticipantIds || []).includes(p.id) }))}
      onToggleParticipantActive={() => {}}
      localStream={localStream}
      screenStream={screenStream}
      isCamStopped={isCamStopped}
      isLive={false}
      liveTime={0}
      showQrCode={estado.showQrCode ?? false}
      qrCodeText={estado.qrCodeText ?? ''}
      qrCodeConfig={qrCodeConfig}
      onToggleShowQrCode={setShowQrCode}
      onOpenQrCodeModal={() => setIsQrCodeModalOpen(true)}
      teleprompterText={teleprompterText}
      isTeleprompterPlaying={isTeleprompterPlaying}
      onToggleTeleprompterPlaying={() => setIsTeleprompterPlaying(prev => !prev)}
      teleprompterSpeed={teleprompterSpeed}
      onTeleprompterSpeedChange={setTeleprompterSpeed}
      teleprompterFontSize={teleprompterFontSize}
      teleprompterMirrored={teleprompterMirrored}
      showTeleprompterOnStudio={false}
      onToggleShowTeleprompterOnStudio={() => setShowTeleprompterOnStudio(prev => !prev)}
      transitionType={transitionType}
      isTransitioning={isTransitioning}
      transitionStage={transitionStage}
      transitionColor={transitionColor}
      onTransitionColorChange={setTransitionColor}
      isMuted={isMuted}
      cameraZoom={cameraZoom}
      cameraOffsetX={cameraOffsetX}
      cameraOffsetY={cameraOffsetY}
      chromaKeyEnabled={chromaKeyEnabled}
      chromaColor={chromaColor}
      chromaTolerance={chromaTolerance}
      selectedSharedSource={selectedSharedSource}
      isPresentationOverlayActive={isPresentationOverlayActive}
      onTogglePresentationOverlayActive={() => setIsPresentationOverlayActive(true)}
      onPresentationOverlayActiveToggle={() => setIsPresentationOverlayActive(prev => !prev)}
      transitionDuration={transitionDuration}
      onAddSnapshot={handleAddSnapshot}
      // O espelho é da câmera, como o zoom e o enquadramento: vale nos dois
      // monitores. Antes o preview espelhava e o programa não, e o preview
      // deixava de mostrar o que o corte levava.
      mirrorCamera={mirrorCamera}
      logoAnimation={logoAnimation}
      bannerAnimation={bannerAnimation}
      activeSlide={estado.activeSlide ?? null}
      onTransitionTypeChange={setTransitionType}
      onTransitionDurationChange={setTransitionDuration}
      countdownTimeLeft={countdownTimeLeft}
      isCountdownActive={isCountdownActive}
      showCountdownOnScreen={showCountdownOnScreen}
      isPlaylistActive={isPlaylistActive}
      onVideoClipEnded={handleVideoClipEnded}
      chromaEdgeSoftness={chromaEdgeSoftness}
      chromaSpillSuppression={chromaSpillSuppression}
      isSceneAutomationEnabled={isSceneAutomationEnabled}
      activeSpeaker={activeSpeaker}
      comments={comments}
      onPinComment={(id) => setPinnedComment(id ? comments.find(c => c.id === id) || null : null)}
      bannerPosition={estado.bannerPosition || 'bottom'}
      onBannerPositionChange={setBannerPosition}
      showWidgetChat={showWidgetChat}
      onToggleShowWidgetChat={() => setShowWidgetChat(prev => !prev)}
      chatWidgetOpacity={chatWidgetOpacity}
      showWidgetLousa={showWidgetLousa}
      onToggleShowWidgetLousa={() => setShowWidgetLousa(prev => !prev)}
      showWidgetSnapshot={showWidgetSnapshot}
      onToggleShowWidgetSnapshot={() => setShowWidgetSnapshot(prev => !prev)}
      isFloatingChatOpen={isFloatingChatOpen}
      onToggleFloatingChatOpen={() => setIsFloatingChatOpen(prev => !prev)}
      isStreamHealthOpen={isStreamHealthOpen}
      onToggleStreamHealthOpen={() => setIsStreamHealthOpen(prev => !prev)}
      isDrawingMode={false}
      onToggleDrawingMode={() => setIsDrawingMode(prev => !prev)}
      isStudioPreviewMode
      onToggleStudioPreviewMode={() => {}}
      previewViewMode="split"
      onPreviewViewModeChange={() => {}}
      hasPendingChanges={hasPendingChanges}
      pendingChanges={pendingChanges}
      onPushToLive={() => cortar('corte')}
      onRevertToLive={() => {}}
      onSwapPreviewAndLive={() => {}}
      programSceneState={programSceneState}
      allBanners={banners}
      allTickers={tickers}
      />
  );

  if (!user) {
    return (
      <AuthAndPricing 
        onAuthSuccess={handleAuthSuccess} 
        initialView="landing"
      />
    );
  }

  return (
    <div
      /* No estúdio a tela INTEIRA é o console — cabeçalho incluído. Os chips
         escuros do cabeçalho (LIVE STREAM, 1080p, alternador de tema) ficavam
         fora do escopo e recebiam os tokens de texto do tema claro sobre
         fundo escuro: 2,24–3,55:1. */
      data-surface={currentView === 'studio' ? 'console' : undefined}
      className={`bg-[var(--bg)] font-sans text-[var(--ink-hi)] flex flex-col ${currentView === 'studio' ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'}`}>
      
      {/* O estúdio tem o cabeçalho de console (GO LIVE, gravação, canais do
          ar). As outras telas, a casca do app: quatro destinos e a conta. */}
      {currentView !== 'studio' ? (
        <AppHeader user={user} currentView={currentView} onNavigate={setCurrentView} onLogout={handleLogout} />
      ) : (
        <BarraDoEstudio
          sessao={title.trim() || undefined}
          canaisLigados={destinations.filter(d => d.selected).length}
          canaisProntos={destinations.filter(d => d.selected && estadoDoCanal(d) === 'pronto').length}
          onCanais={() => setIsAddChannelsModalOpen(true)}
          onSair={() => setCurrentView('dashboard')}
        />
      )}

      {/* Cota do banco esgotada. Era um aviso de desenvolvedor para o cliente
          ("Limite diário de gravações do Firestore (Spark Free Tier)"), em
          âmbar, com um link para o cliente fazer upgrade no Firebase — que
          não é dele. Agora diz o que acontece com as alterações; a cota fica
          só para o admin. */}
      {isQuotaExceeded && isQuotaBannerVisible && (
        <div id="firestore-quota-alert-banner" role="status" className="flex min-h-11 shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface)] pl-4 pr-1 text-xs text-[var(--ink-hi)]">
          <p className="flex items-start gap-2 py-2">
            <CircleAlert size={14} aria-hidden="true" className="mt-px shrink-0" />
            <span>
              Não foi possível salvar na nuvem agora. Suas alterações estão guardadas só neste navegador.
              {user?.role === 'super-admin' && (
                <>
                  {' '}
                  <AcaoDeTexto href={FIRESTORE_UPGRADE_URL} tamanho="xs" sublinhada>
                    Ver a cota no Firebase
                  </AcaoDeTexto>
                </>
              )}
            </span>
          </p>
          <BotaoDeIcone rotulo="Fechar aviso" onClick={() => setIsQuotaBannerVisible(false)}>
            <X size={16} aria-hidden="true" />
          </BotaoDeIcone>
        </div>
      )}

      {/* O console do estúdio: cenas e transição, programa e preview, chat e
          ferramentas, e a bandeja. Abaixo de lg vira uma coluna que rola. */}
      {currentView === 'studio' ? (
        <>
          <main className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[14rem_minmax(0,1fr)_23rem] lg:overflow-hidden">
            <aside aria-label="Cenas e transição" className="order-2 border-t border-[var(--line)] bg-[var(--surface)] lg:order-1 lg:overflow-y-auto lg:border-r lg:border-t-0">
              <TrilhoDeCenas
                idDoPrograma={programSceneState.sceneId || CENA_INICIAL.id}
                idDoPreview={currentSceneId}
                temTela={isScreenSharing}
                temMudanca={hasPendingChanges}
                cortando={programaQueSai !== null}
                onEscolher={handleSelectScene}
                onCortar={cortar}
              />
            </aside>

            <div className="order-1 min-w-0 p-3 sm:p-4 lg:order-2 lg:min-h-0">
              <MesaDeMonitores
                cenaDoPrograma={cenaPeloId(programSceneState.sceneId)?.nome ?? ''}
                cenaDoPreview={cenaPeloId(currentSceneId)?.nome ?? ''}
                programa={
                  <>
                    {palcoDoPrograma(programSceneState)}
                    {programaQueSai && (
                      <div aria-hidden="true" className="pointer-events-none absolute inset-0 animate-[fusao-sai_400ms_ease-out_forwards]">
                        {palcoDoPrograma(programaQueSai)}
                      </div>
                    )}
                  </>
                }
                preview={
                    <StudioPreview
                    papel="preview"
                    cardDaCamera={cardDaCamera}
                    onCardDaCamera={setCardDaCamera}
                    mostrarGuias={mostrarGuias}
                    semBarraDeLayouts
                    layout={layout}
                    onLayoutChange={changeLayoutWithTransition}
                    streamColor={streamColor}
                    textStyle={textStyle}
                    activeBannerText={null}
                    activeBanner={activeBanner}
                    activeTicker={activeTicker}
                    tickerSpeed={tickerSpeed}
                    tickerDirection={tickerDirection}
                    onSetActiveTicker={setActiveTickerId}
                    pinnedComment={pinnedComment}
                    participants={participants}
                    onToggleParticipantActive={handleToggleParticipantActive}
                    localStream={localStream}
                    screenStream={screenStream}
                    isCamStopped={isCamStopped}
                    isLive={false}
                    liveTime={0}
                    showQrCode={showQrCode}
                    qrCodeText={qrCodeText}
                    qrCodeConfig={qrCodeConfig}
                    onToggleShowQrCode={setShowQrCode}
                    onOpenQrCodeModal={() => setIsQrCodeModalOpen(true)}
                    teleprompterText={teleprompterText}
                    isTeleprompterPlaying={isTeleprompterPlaying}
                    onToggleTeleprompterPlaying={() => setIsTeleprompterPlaying(prev => !prev)}
                    teleprompterSpeed={teleprompterSpeed}
                    onTeleprompterSpeedChange={setTeleprompterSpeed}
                    teleprompterFontSize={teleprompterFontSize}
                    teleprompterMirrored={teleprompterMirrored}
                    showTeleprompterOnStudio={showTeleprompterOnStudio}
                    onToggleShowTeleprompterOnStudio={() => setShowTeleprompterOnStudio(prev => !prev)}
                    transitionType={transitionType}
                    isTransitioning={isTransitioning}
                    transitionStage={transitionStage}
                    transitionColor={transitionColor}
                    onTransitionColorChange={setTransitionColor}
                    isMuted={isMuted}
                    cameraZoom={cameraZoom}
                    cameraOffsetX={cameraOffsetX}
                    cameraOffsetY={cameraOffsetY}
                    chromaKeyEnabled={chromaKeyEnabled}
                    chromaColor={chromaColor}
                    chromaTolerance={chromaTolerance}
                    selectedSharedSource={selectedSharedSource}
                    isPresentationOverlayActive={isPresentationOverlayActive}
                    onTogglePresentationOverlayActive={() => setIsPresentationOverlayActive(true)}
                    onPresentationOverlayActiveToggle={() => setIsPresentationOverlayActive(prev => !prev)}
                    transitionDuration={transitionDuration}
                    onAddSnapshot={handleAddSnapshot}
                    mirrorCamera={mirrorCamera}
                    logoAnimation={logoAnimation}
                    bannerAnimation={bannerAnimation}
                    activeSlide={activeSlide}
                    onTransitionTypeChange={setTransitionType}
                    onTransitionDurationChange={setTransitionDuration}
                    countdownTimeLeft={countdownTimeLeft}
                    isCountdownActive={isCountdownActive}
                    showCountdownOnScreen={showCountdownOnScreen}
                    isPlaylistActive={isPlaylistActive}
                    onVideoClipEnded={handleVideoClipEnded}
                    chromaEdgeSoftness={chromaEdgeSoftness}
                    chromaSpillSuppression={chromaSpillSuppression}
                    isSceneAutomationEnabled={isSceneAutomationEnabled}
                    activeSpeaker={activeSpeaker}
                    comments={comments}
                    onPinComment={(id) => setPinnedComment(id ? comments.find(c => c.id === id) || null : null)}
                    bannerPosition={bannerPosition}
                    onBannerPositionChange={setBannerPosition}
                    showWidgetChat={showWidgetChat}
                    onToggleShowWidgetChat={() => setShowWidgetChat(prev => !prev)}
                    chatWidgetOpacity={chatWidgetOpacity}
                    showWidgetLousa={showWidgetLousa}
                    onToggleShowWidgetLousa={() => setShowWidgetLousa(prev => !prev)}
                    showWidgetSnapshot={showWidgetSnapshot}
                    onToggleShowWidgetSnapshot={() => setShowWidgetSnapshot(prev => !prev)}
                    isFloatingChatOpen={isFloatingChatOpen}
                    onToggleFloatingChatOpen={() => setIsFloatingChatOpen(prev => !prev)}
                    isStreamHealthOpen={isStreamHealthOpen}
                    onToggleStreamHealthOpen={() => setIsStreamHealthOpen(prev => !prev)}
                    isDrawingMode={isDrawingMode}
                    onToggleDrawingMode={() => setIsDrawingMode(prev => !prev)}
                    isStudioPreviewMode
                    onToggleStudioPreviewMode={() => {}}
                    previewViewMode="split"
                    onPreviewViewModeChange={() => {}}
                    hasPendingChanges={hasPendingChanges}
                    pendingChanges={pendingChanges}
                    onPushToLive={() => cortar('corte')}
                    onRevertToLive={() => {}}
                    onSwapPreviewAndLive={() => {}}
                    programSceneState={programSceneState}
                    allBanners={banners}
                    allTickers={tickers}
                    />
                }
                proximoCorte={<ProximoCorte mudancas={pendingChanges} />}
                transicaoNoCelular={
                  <BotoesDeTransicao temMudanca={hasPendingChanges} cortando={programaQueSai !== null} onCortar={cortar} />
                }
              />
            </div>

            <aside aria-label="Chat e ferramentas" className="order-3 h-[36rem] border-t border-[var(--line)] bg-[var(--surface)] lg:h-auto lg:min-h-0 lg:border-l lg:border-t-0">
              <PainelDoEstudio ativa={ferramenta} onEscolher={setFerramenta}>
                <LeftSidebar
                activeTab={ferramenta}
                destinations={destinations}
                onToggleDestination={handleToggleDestination}
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                isThumbnailEnabled={isThumbnailEnabled}
                setIsThumbnailEnabled={setIsThumbnailEnabled}
                isScheduleEnabled={isScheduleEnabled}
                setIsScheduleEnabled={setIsScheduleEnabled}
                banners={banners}
                onAddBanner={handleAddBanner}
                onUpdateBanner={handleUpdateBanner}
                onDeleteBanner={handleDeleteBanner}
                activeBannerId={activeBannerId}
                onSetActiveBanner={setActiveBannerId}
                tickers={tickers}
                onAddTicker={handleAddTicker}
                onUpdateTicker={handleUpdateTicker}
                onDeleteTicker={handleDeleteTicker}
                activeTickerId={activeTickerId}
                onSetActiveTicker={setActiveTickerId}
                tickerSpeed={tickerSpeed}
                onSetTickerSpeed={setTickerSpeed}
                tickerDirection={tickerDirection}
                onSetTickerDirection={setTickerDirection}
                bannerPosition={bannerPosition}
                onBannerPositionChange={setBannerPosition}
                isPresentationOverlayActive={isPresentationOverlayActive}
                onTogglePresentationOverlayActive={() => setIsPresentationOverlayActive(prev => !prev)}
                teleprompterText={teleprompterText}
                onTeleprompterTextChange={setTeleprompterText}
                isTeleprompterPlaying={isTeleprompterPlaying}
                onToggleTeleprompterPlaying={() => setIsTeleprompterPlaying(prev => !prev)}
                teleprompterSpeed={teleprompterSpeed}
                onTeleprompterSpeedChange={setTeleprompterSpeed}
                teleprompterFontSize={teleprompterFontSize}
                onTeleprompterFontSizeChange={setTeleprompterFontSize}
                teleprompterMirrored={teleprompterMirrored}
                onToggleTeleprompterMirrored={() => setTeleprompterMirrored(prev => !prev)}
                showTeleprompterOnStudio={showTeleprompterOnStudio}
                onToggleShowTeleprompterOnStudio={() => setShowTeleprompterOnStudio(prev => !prev)}
                currentPlayingTrackId={currentPlayingTrackId}
                onPlayTrack={handlePlayTrack}
                volume={volume}
                onVolumeChange={setVolume}
                musicLoop={musicLoop}
                setMusicLoop={setMusicLoop}
                streamColor={streamColor}
                onStreamColorChange={setStreamColor}
                textStyle={textStyle}
                setTextStyle={setTextStyle}
                comments={comments}
                pinnedComment={pinnedComment}
                onPinComment={(id) => setPinnedComment(id ? comments.find(c => c.id === id) || null : null)}
                onPostComment={handlePostComment}
                onBatchAddComments={handleBatchAddComments}
                onClearComments={handleClearComments}
                currentUserName={user?.name?.split(' ')[0]}
                isAiModerationEnabled={isAiModerationEnabled}
                onToggleAiModeration={setIsAiModerationEnabled}
                aiModerationMode={aiModerationMode}
                onChangeAiModerationMode={setAiModerationMode}
                onApproveComment={handleApproveComment}
                isLive={false}
                isScreenSharing={isScreenSharing}
                onToggleScreenShare={handleToggleScreenShare}
                isMuted={isMuted}
                onToggleMute={handleToggleMute}
                layout={layout}
                onLayoutChange={changeLayoutWithTransition}
                participants={participants}
                onToggleParticipantActive={handleToggleParticipantActive}
                transitionType={transitionType}
                onTransitionTypeChange={setTransitionType}
                showQrCode={showQrCode}
                setShowQrCode={setShowQrCode}
                qrCodeText={qrCodeText}
                setQrCodeText={setQrCodeText}
                qrCodeConfig={qrCodeConfig}
                onUpdateQrCodeConfig={(cfg) => {
                setQrCodeConfig(cfg);
                localStorage.setItem('pw_qrcode_config', JSON.stringify(cfg));
                if (cfg.storeUrl) setQrCodeText(cfg.storeUrl);
                }}
                onOpenQrCodeModal={() => setIsQrCodeModalOpen(true)}
                presenterNotes={presenterNotes}
                setPresenterNotes={setPresenterNotes}
                cameraZoom={cameraZoom}
                onCameraZoomChange={setCameraZoom}
                cameraOffsetX={cameraOffsetX}
                onCameraOffsetXChange={setCameraOffsetX}
                cameraOffsetY={cameraOffsetY}
                onCameraOffsetYChange={setCameraOffsetY}
                chromaKeyEnabled={chromaKeyEnabled}
                onChromaKeyEnabledChange={setChromaKeyEnabled}
                chromaColor={chromaColor}
                onChromaColorChange={setChromaColor}
                chromaTolerance={chromaTolerance}
                onChromaToleranceChange={setChromaTolerance}
                chromaEdgeSoftness={chromaEdgeSoftness}
                onChromaEdgeSoftnessChange={setChromaEdgeSoftness}
                chromaSpillSuppression={chromaSpillSuppression}
                onChromaSpillSuppressionChange={setChromaSpillSuppression}
                transitionDuration={transitionDuration}
                onTransitionDurationChange={setTransitionDuration}
                sceneTransitions={sceneTransitions}
                onUpdateSceneTransition={handleUpdateSceneTransition}
                snapshots={snapshots}
                onDeleteSnapshot={handleDeleteSnapshot}
                mirrorCamera={mirrorCamera}
                onMirrorCameraChange={setMirrorCamera}
                recordingFormat={recordingFormat}
                setRecordingFormat={setRecordingFormat}
                recordingQuality={recordingQuality}
                setRecordingQuality={setRecordingQuality}
                logoAnimation={logoAnimation}
                setLogoAnimation={setLogoAnimation}
                bannerAnimation={bannerAnimation}
                setBannerAnimation={setBannerAnimation}
                webinars={webinars}
                setWebinars={setWebinars}
                rtmpServer={rtmpServer}
                setRtmpServer={setRtmpServer}
                streamKey={streamKey}
                setStreamKey={setStreamKey}
                countdownDuration={countdownDuration}
                setCountdownDuration={setCountdownDuration}
                countdownTimeLeft={countdownTimeLeft}
                setCountdownTimeLeft={setCountdownTimeLeft}
                isCountdownActive={isCountdownActive}
                setIsCountdownActive={setIsCountdownActive}
                showCountdownOnScreen={showCountdownOnScreen}
                setShowCountdownOnScreen={setShowCountdownOnScreen}
                isSceneAutomationEnabled={isSceneAutomationEnabled}
                onToggleSceneAutomation={setIsSceneAutomationEnabled}
                activeSpeaker={activeSpeaker}
                showWidgetChat={showWidgetChat}
                onToggleShowWidgetChat={() => setShowWidgetChat(prev => !prev)}
                chatWidgetOpacity={chatWidgetOpacity}
                onChatWidgetOpacityChange={setChatWidgetOpacity}
                showWidgetLousa={showWidgetLousa}
                onToggleShowWidgetLousa={() => setShowWidgetLousa(prev => !prev)}
                showWidgetSnapshot={showWidgetSnapshot}
                onToggleShowWidgetSnapshot={() => setShowWidgetSnapshot(prev => !prev)}
                isFloatingChatOpen={isFloatingChatOpen}
                onToggleFloatingChatOpen={() => setIsFloatingChatOpen(prev => !prev)}
                isStreamHealthOpen={isStreamHealthOpen}
                onToggleStreamHealthOpen={() => setIsStreamHealthOpen(prev => !prev)}
                isDrawingMode={isDrawingMode}
                onToggleDrawingMode={() => setIsDrawingMode(prev => !prev)}
                onTakeSnapshot={() => handleAddSnapshot({ id: Date.now().toString(), name: `Snapshot ${snapshots.length + 1}`, url: '', timestamp: new Date().toLocaleTimeString() })}
                isSmartSidebarEnabled={false}
                setIsSmartSidebarEnabled={() => {}}
                onOpenCloudflareModal={() => setIsCloudflareModalOpen(true)}
                onOpenCustomDestinationsModal={() => setIsCustomDestinationsModalOpen(true)}
                onOpenAddChannelsModal={() => setIsAddChannelsModalOpen(true)}
                userId={user?.uid}
                />
              </PainelDoEstudio>
            </aside>
          </main>

          <BandejaDoEstudio
            stream={localStream}
            mudo={isMuted}
            onAlternarMicrofone={handleToggleMute}
            cameraDesligada={isCamStopped}
            onAlternarCamera={handleToggleCam}
            compartilhando={isScreenSharing}
            onAlternarTela={() => handleToggleScreenShare()}
            mostrarGuias={mostrarGuias}
            onAlternarGuias={() => setMostrarGuias(v => !v)}
            onEscolherDispositivo={handleSelectDevice}
          />
        </>
      ) : currentView === 'super-admin' ? (
        <SuperAdminPanel 
          onBack={() => setCurrentView('dashboard')} 
          user={user} 
          allWebinars={webinars}
          onDeleteWebinar={handleDeleteWebinar}
        />
      ) : currentView === 'public-webinar' ? (
        <WebinarPublicPage 
          webinarTitle={webinars.find(w => w.id === selectedWebinarId)?.title || title}
          webinarDesc={webinars.find(w => w.id === selectedWebinarId)?.desc || description}
          webinarDate={webinars.find(w => w.id === selectedWebinarId)?.time || 'Amanhã, às 19:30'}
          // `startsAt` é o horário em ISO, do qual a contagem regressiva
          // deriva. Os webinares semeados não têm — e sem ele a página
          // mostra o horário anunciado em vez de inventar uma contagem.
          startsAt={webinars.find(w => w.id === selectedWebinarId)?.startsAt}
          isLive={false}
          thumbnailUrl={activeBackground}
          onBackToDashboard={() => setCurrentView('dashboard')}
          streamColor={streamColor}
          comments={comments}
          onAddComment={(text, author) => {
            const now = new Date();
            const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const newComment: Comment = {
              id: `pub-comm-${Date.now()}`,
              authorName: author,
              authorAvatar: '',
              text,
              platform: 'youtube',
              timestamp
            };
            setComments(prev => [...prev, newComment]);
          }}
        />
      ) : currentView === 'billing' ? (
        <PlanoPagina user={user} />
      ) : currentView === 'profile' ? (
        <CadastroPagina user={user} onNomeSalvo={atualizarNome} onSair={handleLogout} />
      ) : currentView === 'channels' ? (
        <CanaisPagina
          canais={destinations}
          onConectarCanal={conectarCanal}
          onEditarCanal={editarCanal}
          onAlternarCanal={handleToggleDestination}
          onRemoverCanal={handleRemoveDestination}
          limiteDeLigados={limiteDeLigados}
        />
      ) : currentView === 'webinars' ? (
        <WebinarsPagina
          webinars={webinars}
          carregado={isFirestoreSettingsLoaded}
          onAgendar={() => setIsCreateWebinarOpen(true)}
          onEntrar={entrarNoEstudio}
          onPaginaPublica={abrirPaginaPublica}
          onCriarCapa={abrirEditorDeCapa}
          onExcluir={(webinar) => handleDeleteWebinar(webinar.id)}
        />
      ) : currentView === 'settings' ? (
        <ConfiguracoesPagina
          ehSuperAdmin={user?.role === 'super-admin'}
          onIrPara={setCurrentView}
        />
      ) : (
        <Dashboard
          webinars={webinars}
          carregado={isFirestoreSettingsLoaded}
          canais={destinations}
          onEntrarNoEstudio={entrarNoEstudio}
          onAgendar={() => setIsCreateWebinarOpen(true)}
          onPaginaPublica={abrirPaginaPublica}
          onCriarCapa={abrirEditorDeCapa}
          onConectarCanal={conectarCanal}
          onEditarCanal={editarCanal}
          onVerCanais={() => setCurrentView('channels')}
          onVerWebinars={() => setCurrentView('webinars')}
        />
      )}

      {/* Moravam dentro do painel antigo. O seletor de tela é aberto pelo
          ESTÚDIO — montado só no painel, ele nunca aparecia lá e surgia
          depois, ao voltar para o painel. Agora ficam na raiz. */}
      {/* Dashboard Capas Creator Modal */}
      {isDashboardEditorOpen && (
        <Modal isOpen onClose={() => setIsDashboardEditorOpen(false)} bare ariaLabel="Editor do painel">
          <div className="bg-[var(--surface)] border border-[var(--line)] w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[var(--bg)]">
              <div className="text-left">
                <h3 className="text-sm font-bold text-[var(--ink-hi)] flex items-center gap-2">
                  <Palette size={16} className="text-blue-500 animate-pulse" /> Gerador de Capas & Miniaturas (Thumbnail Editor)
                </h3>
                <p className="text-xs text-[var(--ink-lo)]">Desenhe e baixe capas em alta definição para as suas redes sociais e transmissões</p>
              </div>
              <button aria-label="Fechar gerador de capas" 
                onClick={() => setIsDashboardEditorOpen(false)}
                className="text-[var(--ink-lo)] hover:text-[var(--ink-hi)] p-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body with loaded ThumbnailEditor */}
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <ThumbnailEditor 
                initialTitle={dashboardEditorTitle} 
                onSave={(dataUrl) => {
                  console.log("Miniatura do dashboard gerada!");
                }}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Custom Chrome Screen Share Picker Modal */}
      <ScreenSharePickerModal
        isOpen={isScreenSharePickerOpen}
        onClose={() => setIsScreenSharePickerOpen(false)}
        initialTab={screenPickerInitialTab}
        onSelectShare={handleConfirmScreenShare}
      />

      {/* Rodapé da casca. Era em inglês ("All Rights Reserved... Developed and
          Maintained by"), com links em caixa alta, um segundo logo e um link
          de suporte para uma página que não existe. */}
      {currentView !== 'studio' && (
        <footer className="border-t border-[var(--line)]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-xs text-[var(--ink-lo)] sm:px-6">
            <p>© {new Date().getFullYear()} PW Stream Online</p>
            <div className="flex gap-5">
              <AcaoDeTexto tamanho="xs" onClick={() => { setLegalModalType('terms'); setLegalModalOpen(true); }}>
                Termos de uso
              </AcaoDeTexto>
              <AcaoDeTexto tamanho="xs" onClick={() => { setLegalModalType('privacy'); setLegalModalOpen(true); }}>
                Privacidade
              </AcaoDeTexto>
            </div>
          </div>
        </footer>
      )}

      {/* 4. Agendar webinar */}
      <CriarWebinarModal
        isOpen={isCreateWebinarOpen}
        onClose={() => setIsCreateWebinarOpen(false)}
        canais={destinations}
        onAgendar={async (webinar) => {
          // Só depois de o banco confirmar: se falhar, o modal fica aberto
          // com o rascunho e diz a saída.
          await agendarWebinar(webinar);
          setWebinars((prev) => [webinar, ...prev.filter((w) => w.id !== webinar.id)]);
          setIsCreateWebinarOpen(false);
          toast.success('Webinar agendado', rotuloDoHorario(webinar));
        }}
        onSair={handleLogout}
      />

      {/* Interactive Legal Document Modals */}
      <LegalModal 
        isOpen={legalModalOpen}
        type={legalModalType}
        onClose={() => setLegalModalOpen(false)}
      />

      {/* Cloudflare Stream Integration Modal */}
      <CloudflareStreamModal
        isOpen={isCloudflareModalOpen}
        onClose={() => setIsCloudflareModalOpen(false)}
        onApplyToStudio={(url, key) => {
          setRtmpServer(url);
          setStreamKey(key);
        }}
        isLive={false}
      />

      {/* Custom RTMP & NGINX Destinations Modal */}
      <CustomDestinationModal
        isOpen={isCustomDestinationsModalOpen}
        onClose={() => setIsCustomDestinationsModalOpen(false)}
        destinations={destinations}
        onUpdateDestinations={(updated) => {
          setDestinations(updated);
          if (user?.uid) {
            saveDestinationsToFirestore(user.uid, updated);
          }
        }}
        userId={user?.uid}
        limiteDeLigados={limiteDeLigados}
        onLimiteDeCanais={avisarLimiteDeCanais}
      />

      {/* Dynamic QR Code & Live Commerce Modal */}
      <QrCodeModal
        isOpen={isQrCodeModalOpen}
        onClose={() => setIsQrCodeModalOpen(false)}
        config={qrCodeConfig}
        onSaveConfig={(newConfig) => {
          setQrCodeConfig(newConfig);
          localStorage.setItem('pw_qrcode_config', JSON.stringify(newConfig));
          if (newConfig.storeUrl) {
            setQrCodeText(newConfig.storeUrl);
          }
        }}
        showQrCodeOnStream={showQrCode}
        onToggleShowQrCode={setShowQrCode}
        streamColor={streamColor}
      />

      {/* Add Channels / Multi-Platform Transmission Modal */}
      <AddChannelsModal
        isOpen={isAddChannelsModalOpen}
        onClose={() => { setIsAddChannelsModalOpen(false); setPlataformaDoModalDeCanais(undefined); setCanalDoModalDeCanais(undefined); }}
        plataformaInicial={plataformaDoModalDeCanais}
        canalInicialId={canalDoModalDeCanais}
        destinations={destinations}
        onAddOrUpdateDestination={handleAddOrUpdateDestination}
        currentPlan={user?.plan || 'Free Trial'}
        onOpenUpgrade={() => {
          setIsAddChannelsModalOpen(false);
          abrirPlanos();
        }}
      />

      {/* Plans Modal */}
      {(isPlansModalOpen || paymentStatus === 'success') && user && (
        <PlansModal
          onClose={() => {
            setIsPlansModalOpen(false);
            setPlansModalReason(null);
            setPaymentStatus(null);
          }}
          currentPlan={user.plan}
          reason={plansModalReason}
        />
      )}
    </div>
  );
}