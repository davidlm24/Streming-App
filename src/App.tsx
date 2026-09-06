import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { StudioPreview } from './components/StudioPreview';
import { ControlTray } from './components/ControlTray';
import { InviteModal } from './components/InviteModal';
import { AuthAndPricing } from './components/AuthAndPricing';
import { ScreenSharePickerModal } from './components/ScreenSharePickerModal';
import { PwStreamLogo } from './components/PwStreamLogo';
import { WebinarPublicPage } from './components/WebinarPublicPage';
import { AdminPanel } from './components/AdminPanel';
import { SuperAdminPanel } from './components/SuperAdminPanel';
import { BillingDashboard } from './components/BillingDashboard';
import { PlansModal } from './components/PlansModal';
import { VideoQualityPanel } from './components/VideoQualityPanel';
import { StreamReportModal, StreamReportData, downloadStreamReportJSON } from './components/StreamReportModal';
import { CloudflareStreamModal } from './components/CloudflareStreamModal';
import { CustomDestinationModal } from './components/CustomDestinationModal';
import { AddChannelsModal } from './components/AddChannelsModal';
import { WebhookPanel } from './components/WebhookPanel';
import { QrCodeModal } from './components/QrCodeModal';
import { StudioScenePreviewControls } from './components/StudioScenePreviewControls';
import { CLOUDFLARE_STREAM_CONFIG } from './lib/cloudflareStreamConfig';

import { Destination, Banner, TickerItem, BannerPosition, Comment, Participant, StudioSceneState, QrCodeConfig, StudioTab } from './types';
import { INITIAL_DESTINATIONS, INITIAL_BANNERS, INITIAL_TICKERS, INITIAL_COMMENTS, AUDIO_LIBRARY } from './data';
import { startSynth, stopSynth, setVolume as setSynthVolume } from './audioEngine';
import { Play, Calendar, Users, Tv, Radio, BarChart3, Plus, ArrowRight, Settings, ExternalLink, Palette, ListTodo, QrCode, FileText, MessageSquare, Music, Sliders, ShieldAlert, Sparkles, X, Maximize2, Minimize2, Server, CheckCircle2, Type, Film, Bell, Puzzle, Activity, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { ThumbnailEditor } from './components/ThumbnailEditor';
import { ScenesPanel, Scene, DEFAULT_STUDIO_SCENES } from './components/ScenesPanel';
import { LegalModal } from './components/LegalModals';
import { useSceneTransition } from './hooks/useSceneTransition';
import { useMediaManager } from './context/MediaManagerContext';
import { 
  loginWithGoogle, 
  logoutFirebase, 
  subscribeAuth,
  subscribeWebinars,
  saveWebinarToFirestore,
  deleteWebinarFromFirestore,
  subscribeBanners,
  saveBannersToFirestore,
  subscribeSnapshots,
  addSnapshotToFirestore,
  deleteSnapshotFromFirestore,
  subscribeTransmissionSettings,
  saveTransmissionSettingsToFirestore,
  saveDestinationsToFirestore,
  subscribeWebhooksConfig,
  saveWebhooksConfigToFirestore,
  subscribeWebhookLogs,
  addWebhookLogToFirestore,
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
    subscriptionStatus?: 'trial' | 'active' | 'past_due' | 'canceled';
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

  const handleSimulateExpiration = () => {
    if (user) {
      const updated = { ...user, isExpired: true, trialDays: 0 };
      setUser(updated);
      localStorage.setItem('pwstream_user', JSON.stringify(updated));
    }
  };

  const handleRestoreTrial = () => {
    if (user) {
      const updated = { ...user, plan: 'Free Trial' as const, isExpired: false, trialDays: 30 };
      setUser(updated);
      localStorage.setItem('pwstream_user', JSON.stringify(updated));
    }
  };

  const handlePlanUpgraded = (newPlan: 'Standard' | 'Professional' | 'Business') => {
    if (user) {
      const updated = { ...user, plan: newPlan, isExpired: false, trialDays: 30 };
      setUser(updated);
      localStorage.setItem('pwstream_user', JSON.stringify(updated));
      setIsPlansModalOpen(false);
      setPlansModalReason(null);
    }
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

  // App views: 'dashboard' | 'studio' | 'admin' | 'super-admin' | 'public-webinar' | 'profile' | 'billing'
  const [currentView, setCurrentView] = useState<'dashboard' | 'studio' | 'admin' | 'super-admin' | 'public-webinar' | 'profile' | 'billing'>('dashboard');

  // Handle direct URL route navigation for /admin or #admin
  useEffect(() => {
    const handleUrlRoute = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;

      if (pathname.endsWith('/admin') || hash === '#admin' || search.includes('mode=admin')) {
        setCurrentView('super-admin');
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
  }, []);

  // Dynamic webinars list
  const [webinars, setWebinars] = useState([
    {
      id: 'webinar-1',
      title: 'Como Alavancar suas Vendas com webinars interativos',
      desc: 'Aprenda os segredos e técnicas para engajar audiências com transmissões ao vivo de altíssimo nível, gerando conexões reais e impulsionando vendas.',
      time: 'Amanhã, às 19:30 (Horário de Brasília)',
      channels: ['Facebook', 'YouTube'],
      type: 'webinar',
      videoName: ''
    },
    {
      id: 'webinar-2',
      title: 'Webinar de Boas-vindas para Novos Membros da Equipe',
      desc: 'Sessão interna para novos colaboradores da VineaSX Solutions.',
      time: 'Quarta-feira, às 14:00',
      channels: ['YouTube (Canal Privado)'],
      type: 'live',
      videoName: ''
    }
  ]);
  const [selectedWebinarId, setSelectedWebinarId] = useState<string>('webinar-1');

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

  // Create webinar modal states
  const [isCreateWebinarOpen, setIsCreateWebinarOpen] = useState(false);
  const [newWebinarTitle, setNewWebinarTitle] = useState('');
  const [newWebinarDesc, setNewWebinarDesc] = useState('');
  const [newWebinarTime, setNewWebinarTime] = useState('');
  const [newWebinarType, setNewWebinarType] = useState<'live' | 'webinar' | 'pre-recorded'>('webinar');
  const [newWebinarVideoName, setNewWebinarVideoName] = useState('');
  const [newWebinarChannels, setNewWebinarChannels] = useState<string[]>(['YouTube']);

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
  const [title, setTitle] = useState<string>('Marcos');
  const [description, setDescription] = useState<string>('Marcos');
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
  const [activeTickerId, setActiveTickerId] = useState<string | null>('ticker-1');
  const [tickerSpeed, setTickerSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [tickerDirection, setTickerDirection] = useState<'left' | 'right'>('left');

  // Audio / Synth
  const [currentPlayingTrackId, setCurrentPlayingTrackId] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(0.5);
  const [musicLoop, setMusicLoop] = useState<boolean>(true);

  // Customization
  const [streamColor, setStreamColor] = useState<string>('#FF3D38');
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
    return {
      id: 'qr-default',
      title: 'Smartphone Pro Max 256GB',
      subtitle: 'Lançamento Exclusivo da Live',
      price: 'R$ 1.899,00',
      originalPrice: 'R$ 2.499,00',
      discountBadge: '24% OFF + FRETE GRÁTIS',
      storeUrl: 'https://shopee.com.br/smartphone-pro-max-live',
      storeName: 'Shopee',
      ctaLabel: 'Compre Agora',
      imageUrl: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&auto=format&fit=crop&q=80',
      orientation: 'horizontal',
      cardTheme: 'dark',
      qrColor: '#000000',
      qrBgColor: '#ffffff',
      showProductImage: true,
      showPrice: true,
      showDiscountBadge: true,
      showStoreName: true,
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
    return 'https://shopee.com.br/smartphone-pro-max-live';
  });
  const [presenterNotes, setPresenterNotes] = useState(
    "1. Introdução: Boas-vindas a todos os participantes!\n2. Apresentar o tema: Como criar webinars profissionais.\n3. Demonstração prática do painel.\n4. Sessão de perguntas e respostas."
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
  const [isInviteOpen, setIsInviteOpen] = useState(false);
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

  // Quick Settings / Integrations modal state
  const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState(false);
  const [integrationsModalTab, setIntegrationsModalTab] = useState<'rtmp' | 'social' | 'analysis' | 'webhooks'>('analysis');
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const [isMobileScenesOpen, setIsMobileScenesOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Studio column resizing states (Fixed standard proportions)
  const [scenesWidth, setScenesWidth] = useState<number>(() => {
    const saved = localStorage.getItem('pw_scenes_width');
    return saved ? Math.max(200, Math.min(parseInt(saved, 10), 300)) : 240;
  });
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('pw_sidebar_width');
    return saved ? Math.max(320, Math.min(parseInt(saved, 10), 420)) : 360;
  });
  const [isResizingScenes, setIsResizingScenes] = useState(false);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  // Webhooks Manager states
  const [selectedWebhookPlatform, setSelectedWebhookPlatform] = useState<'youtube' | 'facebook' | 'twitch'>('youtube');
  const [webhooksConfig, setWebhooksConfig] = useState({
    youtube: { active: true, url: 'https://api.pwstreamer.com/v1/webhooks/youtube', secret: 'whsec_yt_99b1a0f83', events: ['stream_state', 'chat_message'] },
    facebook: { active: true, url: 'https://api.pwstreamer.com/v1/webhooks/facebook', secret: 'whsec_fb_55c3a2f11', events: ['stream_state', 'chat_message', 'new_follower'] },
    twitch: { active: false, url: 'https://api.pwstreamer.com/v1/webhooks/twitch', secret: 'whsec_tw_77e4c1d22', events: ['stream_state'] }
  });
  const [webhookLogs, setWebhookLogs] = useState<Array<{ id: string; time: string; method: string; path: string; status: number; payload: string; platform: string }>>([
    { id: 'log-1', time: '12:01:05', method: 'POST', path: '/v1/webhooks/youtube', status: 200, payload: '{"event": "ping", "message": "Connection verification successful"}', platform: 'youtube' },
    { id: 'log-2', time: '12:05:40', method: 'POST', path: '/v1/webhooks/facebook', status: 200, payload: '{"event": "subscribe", "page_id": "1098273618"}', platform: 'facebook' },
    { id: 'log-3', time: '12:10:15', method: 'POST', path: '/v1/webhooks/youtube', status: 200, payload: '{"event": "stream_created", "broadcast_id": "yt_live_883"}', platform: 'youtube' },
  ]);

  // Firestore Quota Resilience state
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [isQuotaBannerVisible, setIsQuotaBannerVisible] = useState(true);

  useEffect(() => {
    const unsubQuota = subscribeQuotaStatus((exceeded) => {
      setIsQuotaExceeded(exceeded);
    });
    return () => unsubQuota();
  }, []);

  // Live state
  const [isLive, setIsLive] = useState(false);
  const [liveTime, setLiveTime] = useState(0);
  const [liveStartTime, setLiveStartTime] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeStreamReport, setActiveStreamReport] = useState<StreamReportData | null>(null);

  const handleToggleLive = async () => {
    if (!isLive) {
      if (user) {
        try {
          const validation = await validateUserTrialStatus(user);
          if (validation.isExpired || validation.trialDays === 0 || !validation.canBroadcast) {
            const updated = {
              ...user,
              isExpired: true,
              trialDays: 0,
              subscriptionStatus: 'expired' as const
            };
            setUser(updated);
            localStorage.setItem('pwstream_user', JSON.stringify(updated));
            setPlansModalReason('live');
            setIsPlansModalOpen(true);
            return;
          }
        } catch (err) {
          console.warn('Erro ao validar período de testes:', err);
          if (isTrialExpired) {
            setPlansModalReason('live');
            setIsPlansModalOpen(true);
            return;
          }
        }
      } else if (isTrialExpired) {
        setPlansModalReason('live');
        setIsPlansModalOpen(true);
        return;
      }
      setLiveStartTime(new Date().toISOString());
      setIsLive(true);
    } else {
      const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      };

      const activeChannels = destinations.filter(d => d.active).map(d => d.platform);
      const finalDestinations = activeChannels.length > 0 ? activeChannels : ["YouTube Live", "Facebook Live"];

      const report: StreamReportData = {
        app: "PwStreamer Studio Pro",
        version: "2.5.0",
        streamTitle: "Transmissão Ao Vivo PwStreamer",
        streamDescription: "Sessão ao vivo gravada e transmitida pelo PwStreamer Studio Pro",
        startTime: liveStartTime || new Date(Date.now() - (liveTime || 300) * 1000).toISOString(),
        endTime: new Date().toISOString(),
        durationSeconds: liveTime || 120,
        formattedDuration: formatTime(liveTime || 120),
        peakViewers: Math.max(148, Math.floor(Math.random() * 50) + 120),
        averageViewers: Math.max(92, Math.floor(Math.random() * 30) + 85),
        totalCommentsReceived: comments.length,
        destinations: finalDestinations,
        comments: comments.map(c => ({
          id: c.id,
          user: c.user,
          text: c.text,
          time: c.time,
          channel: c.channel,
          isHighlight: c.isHighlight
        })),
        systemPerformance: {
          averageCpuUsage: "18.4%",
          averageMemoryUsage: "1.85 GB / 8.00 GB",
          fps: 60,
          droppedFrames: 0,
          bitrateKbps: 8000,
          status: "Estável / Alta Performance"
        }
      };

      setActiveStreamReport(report);
      setIsReportModalOpen(true);
      setIsLive(false);
    }
  };

  // Recording state
  const [isRecording, setIsRecording] = useState(false);

  // Guarda de perda de dados. `beforeunload` não aparecia NENHUMA vez no app:
  // recarregar ou fechar a aba durante uma transmissão a derrubava em
  // silêncio — e, com a saída do estúdio ausente entre 768 e 1279 px,
  // recarregar era exatamente o que sobrava para o operador tentar.
  useEffect(() => {
    if (!isLive && !isRecording) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Navegadores modernos ignoram a mensagem e mostram texto próprio;
      // returnValue continua sendo o que dispara o diálogo.
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isLive, isRecording]);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const handleToggleRecording = () => {
    if (!isRecording) {
      if (isTrialExpired) {
        handleRequirePlan('record');
        return;
      }
      setIsRecording(true);
    } else {
      setIsRecording(false);
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
          setActiveVideoClip({
            id: nextClip.id,
            name: nextClip.name,
            url: nextClip.url,
            isPlaying: true
          });
        }
      } else {
        setIsPlaylistActive(false);
        setCurrentPlaylistIndex(-1);
        setActiveVideoClip(null);
      }
    }
  };

  // Scene transition type
  const [transitionType, setTransitionType] = useState<'cut' | 'fade' | 'slide' | 'zoom' | 'dip-to-color' | 'slide-wipe' | 'shutter-wipe' | 'radial-wipe' | 'flash'>('fade');
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
  const [mirrorCamera, setMirrorCamera] = useState<boolean>(true);

  // Transition duration state
  const [transitionDuration, setTransitionDuration] = useState<number>(300);

  // Scene-specific transitions state
  const [sceneTransitions, setSceneTransitions] = useState<Record<string, { type: 'cut' | 'fade' | 'slide' | 'zoom' | 'dip-to-color' | 'slide-wipe' | 'shutter-wipe' | 'radial-wipe' | 'flash'; duration: number }>>({
    'scene-1': { type: 'dip-to-color', duration: 400 },
    'scene-2': { type: 'fade', duration: 300 },
    'scene-3': { type: 'slide-wipe', duration: 400 },
    'scene-4': { type: 'zoom', duration: 350 },
    'scene-5': { type: 'flash', duration: 300 },
  });

  const handleUpdateSceneTransition = (
    sceneId: string, 
    type: 'cut' | 'fade' | 'slide' | 'zoom' | 'dip-to-color' | 'slide-wipe' | 'shutter-wipe' | 'radial-wipe' | 'flash', 
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
  const [currentSceneId, setCurrentSceneId] = useState<string>('scene-1');

  // Studio Preview Mode & Program Live state
  const [isStudioPreviewMode, setIsStudioPreviewMode] = useState<boolean>(false);
  const [previewViewMode, setPreviewViewMode] = useState<'split' | 'preview-only' | 'program-only'>('preview-only');
  
  const [programSceneState, setProgramSceneState] = useState<StudioSceneState>(() => ({
    sceneId: 'scene-1',
    layout: '1-cam',
    activeParticipantIds: ['p-local'],
    activeBannerId: 'b-1',
    activeTickerId: 'ticker-1',
    pinnedComment: null,
    bannerPosition: 'bottom',
    showQrCode: false,
    qrCodeText: 'https://pwstreamer.com'
  }));

  const handleSelectScene = (scene: Scene) => {
    const sceneConfig = sceneTransitions[scene.id] || { type: transitionType, duration: transitionDuration };
    const currentType = sceneConfig.type;
    const currentDuration = sceneConfig.duration;

    const isColorTransition = ['dip-to-color', 'slide-wipe', 'shutter-wipe', 'radial-wipe', 'flash'].includes(currentType);

    const applySceneChanges = () => {
      setCurrentSceneId(scene.id);
      setLayout(scene.layout);
      
      // Auto-update participants based on scene definition
      setParticipants(prev => prev.map(p => ({
        ...p,
        isActive: scene.activeParticipantIds.includes(p.id)
      })));

      // Handle background and branding settings matching specific scene types
      if (scene.type === 'welcome') {
        // Set a nice space background for the wait/welcome stage
        setActiveBackground('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80');
        const b = banners.find(x => x.text.toLowerCase().includes('bem-vindo') || x.text.toLowerCase().includes('começará'));
        if (b) {
          setActiveBannerId(b.id);
        }
      } else if (scene.type === 'video') {
        // Select institutional or promo screen-share placeholder
      }
    };

    if (currentType === 'cut') {
      applySceneChanges();
    } else if (isColorTransition) {
      triggerTransition(applySceneChanges, {
        color: transitionColor,
        duration: currentDuration,
        type: currentType as any
      });
    } else {
      applySceneChanges();
    }
  };

  // Participants (Sources on/off stage)
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: 'p-local',
      name: 'Marcos (Você)',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
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

  // Track pending changes between Studio Preview (editing stage) and Program (Live On Air output)
  const pendingChanges = useMemo(() => {
    const changes: string[] = [];
    if (layout !== programSceneState.layout) {
      changes.push(`Layout alterado para "${layout}"`);
    }
    const currentActiveIds = participants.filter(p => p.isActive).map(p => p.id).sort().join(',');
    const programActiveIds = (programSceneState.activeParticipantIds || []).slice().sort().join(',');
    if (currentActiveIds !== programActiveIds) {
      changes.push('Participantes em cena');
    }
    if (activeBannerId !== programSceneState.activeBannerId) {
      changes.push('Banner / GC inferior');
    }
    if (activeTickerId !== programSceneState.activeTickerId) {
      changes.push('Ticker de notícias');
    }
    if (bannerPosition !== programSceneState.bannerPosition) {
      changes.push('Posição do banner');
    }
    if (pinnedComment?.id !== programSceneState.pinnedComment?.id) {
      changes.push('Comentário em destaque');
    }
    if (currentSceneId !== programSceneState.sceneId) {
      const sceneObj = DEFAULT_STUDIO_SCENES.find(s => s.id === currentSceneId);
      changes.push(`Cena "${sceneObj?.name || currentSceneId}"`);
    }
    if (activeBackground !== programSceneState.activeBackground) {
      changes.push('Plano de fundo da cena');
    }
    return changes;
  }, [layout, participants, activeBannerId, activeTickerId, bannerPosition, pinnedComment, currentSceneId, activeBackground, programSceneState]);

  const hasPendingChanges = pendingChanges.length > 0;

  const handlePushToLive = () => {
    triggerTransition(() => {
      setProgramSceneState({
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
        qrCodeText
      });
    }, {
      color: transitionColor,
      duration: transitionDuration,
      type: transitionType
    });
  };

  const handleRevertToLive = () => {
    setLayout(programSceneState.layout);
    setCurrentSceneId(programSceneState.sceneId || 'scene-1');
    setParticipants(prev => prev.map(p => ({
      ...p,
      isActive: (programSceneState.activeParticipantIds || ['p-local']).includes(p.id)
    })));
    setActiveBannerId(programSceneState.activeBannerId || null);
    setActiveTickerId(programSceneState.activeTickerId || null);
    setPinnedComment(programSceneState.pinnedComment || null);
    setBannerPosition(programSceneState.bannerPosition || 'bottom');
    if (programSceneState.activeBackground !== undefined) {
      setActiveBackground(programSceneState.activeBackground);
    }
  };

  const handleSwapPreviewAndLive = () => {
    const currentPreview: StudioSceneState = {
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
      qrCodeText
    };

    // Apply old program to preview
    handleRevertToLive();

    // Push old preview to program
    setProgramSceneState(currentPreview);
  };

  // Request Web Camera & Microphone access on load
  useEffect(() => {
    async function requestCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true
        });
        setLocalStream(stream);
        // Bind to local participant stream
        setParticipants(prev => prev.map(p => p.isLocal ? { ...p, stream } : p));
      } catch (err) {
        console.warn("Camera and Mic access not granted or unavailable, showing high-end moving avatar placeholder instead.", err);
      }
    }
    requestCamera();

    return () => {
      // Release camera stream on unmount
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      stopSynth();
    };
  }, []);

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

  // Timer counting for Live mode
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isLive) {
      timer = setInterval(() => {
        setLiveTime(prev => prev + 1);
      }, 1000);
    } else {
      setLiveTime(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLive]);

  // Smart Sidebar: Auto switch tab to Chat when live
  useEffect(() => {
    if (isLive && isSmartSidebarEnabled) {
      setActiveTab('seven');
    }
  }, [isLive, isSmartSidebarEnabled]);

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

  // Listen to window resize to determine if we are on a mobile device
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Column manual resizing window events
  useEffect(() => {
    if (!isResizingScenes && !isResizingSidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingScenes) {
        const newWidth = Math.max(200, Math.min(450, e.clientX));
        setScenesWidth(newWidth);
        localStorage.setItem('pw_scenes_width', newWidth.toString());
      } else if (isResizingSidebar) {
        const newWidth = Math.max(300, Math.min(600, window.innerWidth - e.clientX));
        setSidebarWidth(newWidth);
        localStorage.setItem('pw_sidebar_width', newWidth.toString());
      }
    };

    const handleMouseUp = () => {
      setIsResizingScenes(false);
      setIsResizingSidebar(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingScenes, isResizingSidebar]);

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

  // Voice Scene Automation Logic
  useEffect(() => {
    if (!isSceneAutomationEnabled) {
      setActiveSpeaker('p-local');
      return;
    }

    // Auto-active Marcos and Ana on stage when automation is enabled
    setParticipants(prev => prev.map(p => {
      if (p.id === 'p-local' || p.id === 'p-guest') {
        return { ...p, isActive: true };
      }
      return p;
    }));

    const speakInterval = setInterval(() => {
      setActiveSpeaker(prev => {
        // Simulate speech activity or silence (1/3 chance of silence)
        const isSilent = Math.random() < 0.33;
        
        if (isSilent) {
          // Detect silence -> switch to gallery view
          changeLayoutWithTransition('gallery');
          return 'none';
        }

        const nextSpeaker = prev === 'p-local' ? 'p-guest' : 'p-local';
        
        // Auto-change layout depending on speaker
        if (nextSpeaker === 'p-local') {
          const isSharing = isScreenSharing || (activeSlide !== null);
          changeLayoutWithTransition(isSharing ? 'presentation' : '1-cam');
        } else {
          changeLayoutWithTransition('dual');
        }

        return nextSpeaker;
      });
    }, 6000);

    return () => {
      clearInterval(speakInterval);
    };
  }, [isSceneAutomationEnabled, isScreenSharing, activeSlide]);

  // AI Moderation fetcher and logic
  const moderateComment = async (text: string) => {
    try {
      const res = await fetch('/api/moderate', {
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

  // Simulated viewer comments generation when live
  useEffect(() => {
    let commentInterval: NodeJS.Timeout | null = null;
    if (isLive) {
      commentInterval = setInterval(() => {
        const names = ["Gabriel Lima", "Beatriz Rocha", "Lucas Mendes", "Renata Souza", "Thiago Silva", "Carla Dias", "Felipe Neto", "Patrícia Melo"];
        const avatars = [
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
        ];
        const responses = [
          "Incrível o conteúdo do webinar de hoje!",
          "O compartilhamento de tela está com excelente resolução.",
          "Boa noite Marcos! Assistindo direto de São Paulo.",
          "COMPRE SEGUIDORES AGORA! Acesse www.seguidoresrapidos.com para ganhar 5000 views grátis!!",
          "Marcos, onde podemos baixar os slides?",
          "Sua apresentação está uma bosta profunda, devolve meu tempo idiota!",
          "Esse cara é um completo imbecil, não sabe de nada, que lixo de aula!",
          "Alguém aí quer jogar Free fire agora?",
          "Consigo participar da transmissão e enviar uma pergunta por áudio?",
          "Sensacional a explicação, muito esclarecedora!",
          "Melhor estúdio de webinars que já vi."
        ];
        
        const randIdx = Math.floor(Math.random() * names.length);
        const randResponse = responses[Math.floor(Math.random() * responses.length)];
        const platform = Math.random() > 0.5 ? 'facebook' : 'youtube';

        const now = new Date();
        const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const newComment: Comment = {
          id: `bot-comm-${Date.now()}`,
          authorName: names[randIdx],
          authorAvatar: avatars[randIdx],
          text: randResponse,
          platform,
          timestamp
        };

        processNewComment(newComment);
      }, 12000); // Add chat every 12 seconds
    }
    return () => {
      if (commentInterval) clearInterval(commentInterval);
    };
  }, [isLive, isAiModerationEnabled]);

  // Webhook Event simulator effect
  useEffect(() => {
    let intervalId: any = null;
    if (isLive) {
      intervalId = setInterval(() => {
        const platforms: Array<'youtube' | 'facebook' | 'twitch'> = ['youtube', 'facebook', 'twitch'];
        const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
        
        // Check if platform webhook is active
        const isAct = webhooksConfig[randomPlatform].active;
        
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        const events = [
          { name: 'stream_metrics_update', payload: { viewers: Math.floor(Math.random() * 50 + 20), status: 'live', health: 'excellent' } },
          { name: 'chat_message_received', payload: { author: 'User_' + Math.floor(Math.random() * 100), text: 'Muito boa a transmissão!', timestamp: Date.now() } },
          { name: 'subscription_gained', payload: { plan: 'Professional', user_id: 'usr_' + Math.random().toString(36).substr(2, 5) } }
        ];
        const selectedEvent = events[Math.floor(Math.random() * events.length)];

        const newLog = {
          id: `wh-log-${Date.now()}`,
          time: timeStr,
          method: 'POST',
          path: webhooksConfig[randomPlatform].url,
          status: isAct ? 200 : 503,
          payload: JSON.stringify({ 
            event: selectedEvent.name, 
            platform: randomPlatform,
            data: selectedEvent.payload, 
            timestamp: Date.now() 
          }, null, 2),
          platform: randomPlatform
        };

        setWebhookLogs(prev => [newLog, ...prev].slice(0, 50));
      }, 8000); // add a webhook event log in state every 8 seconds if live
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLive, webhooksConfig]);

  // Destinations toggler
  const handleToggleDestination = (id: string) => {
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
      const existingIdx = prev.findIndex(d => d.id === newDest.id || d.platform === newDest.platform);
      let updated: Destination[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], ...newDest, selected: true };
      } else {
        updated = [newDest, ...prev];
      }
      if (user?.uid) {
        saveDestinationsToFirestore(user.uid, updated);
      }
      return updated;
    });
  };

  // Add Banner text ticker
  const handleAddBanner = (text: string, subtitle?: string, themeColor?: string, accentColor?: string) => {
    const newBanner: Banner = {
      id: `banner-${Date.now()}`,
      text,
      subtitle: subtitle || 'Stream like a Pro - OneStream Live Studio',
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

    const unsubWebhooksConf = subscribeWebhooksConfig(user.uid, (config) => {
      setWebhooksConfig(prev => JSON.stringify(prev) === JSON.stringify(config) ? prev : config);
    });

    const unsubWebhookLogs = subscribeWebhookLogs(user.uid, (logs) => {
      setWebhookLogs(logs);
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
      unsubWebhooksConf();
      unsubWebhookLogs();
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

  // Debounced Auto-save Webhooks config to Firestore
  useEffect(() => {
    if (!user?.uid || !isFirestoreSettingsLoaded) return;
    const timeout = setTimeout(() => {
      saveWebhooksConfigToFirestore(user.uid, webhooksConfig);
    }, 1500);
    return () => clearTimeout(timeout);
  }, [user?.uid, webhooksConfig, isFirestoreSettingsLoaded]);

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
      authorName: 'Marcos (Você)',
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
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

  // Screen sharing activation
  const handleToggleScreenShare = async (initialTab?: 'tab' | 'window' | 'screen' | 'pdf' | 'video') => {
    if (isScreenSharing && !initialTab) {
      if (screenStream) {
        screenStream.getTracks().forEach(t => t.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
      setSelectedSharedSource(null);
      setParticipants(prev => prev.map(p => p.isScreenShare ? { ...p, isActive: false, stream: null } : p));
      if (layout === 'screen-share' || layout === 'picture-in-picture' || layout === 'presentation') {
        changeLayoutWithTransition('1-cam');
      }
    } else {
      if (initialTab === 'screen' || !initialTab) {
        // Direct native screen share without opening the fake modal
        try {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).catch(() => null);
          if (stream) {
            setScreenStream(stream);
            setIsScreenSharing(true);
            setSelectedSharedSource({ type: 'screen', name: 'Tela Compartilhada', audioShared: true });
            setParticipants(prev => prev.map(p => p.isScreenShare ? { ...p, isActive: true, stream } : p));
            changeLayoutWithTransition('screen-share');
            // Ensure any picker modal is closed if it was open
            setIsScreenSharePickerOpen(false);
          }
        } catch (err) {
          console.error("Screen share cancelled", err);
        }
      } else {
        setScreenPickerInitialTab(initialTab);
        setIsScreenSharePickerOpen(true);
      }
    }
  };

  // Confirm screen share from picker modal
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
      } else {
        // Safe iframe fallback - toggle sharing without stream (simulates beautifully)
        setIsScreenSharing(true);
        setParticipants(prev => prev.map(p => p.isScreenShare ? { ...p, isActive: true } : p));
        changeLayoutWithTransition('screen-share');
      }
    } catch (err) {
      setIsScreenSharing(true);
      setParticipants(prev => prev.map(p => p.isScreenShare ? { ...p, isActive: true } : p));
      changeLayoutWithTransition('screen-share');
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
      className={`bg-[var(--bg)] font-sans text-[var(--ink-hi)] flex flex-col selection:bg-blue-500 selection:text-white ${currentView === 'studio' ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'}`}>
      
      {/* Dynamic Header */}
      <Header 
        onExit={() => setCurrentView('dashboard')} 
        user={user}
        onLogout={handleLogout}
        onSimulateExpiration={handleSimulateExpiration}
        onRestoreTrial={handleRestoreTrial}
        onOpenPricing={() => {
          setPlansModalReason('upgrade');
          setIsPlansModalOpen(true);
        }}
        onViewChange={setCurrentView}
        currentView={currentView}
        isLive={isLive}
        onToggleLive={handleToggleLive}
        liveTime={liveTime}
        isTrialExpired={isTrialExpired}
        onOpenAddChannelsModal={() => setIsAddChannelsModalOpen(true)}
        activeDestinationsCount={destinations.filter(d => d.selected).length}
        recordingQuality={recordingQuality}
        onQualityChange={setRecordingQuality}
        isRecording={isRecording}
        onToggleRecording={handleToggleRecording}
        recordingTime={recordingTime}
      />

      {/* Firestore Free Tier Quota Alert Banner */}
      {isQuotaExceeded && isQuotaBannerVisible && (
        <div id="firestore-quota-alert-banner" className="bg-amber-950/90 border-b border-amber-500/40 px-4 py-2 flex items-center justify-between text-xs text-amber-200 backdrop-blur-md shrink-0 z-40">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/30 text-amber-300 font-bold text-[10px]">!</span>
            <span>
              <strong>Limite diário de gravações do Firestore (Spark Free Tier) atingido:</strong> O estúdio está funcionando normalmente com persistência local em tempo real. As cotas são reiniciadas diariamente.
            </span>
            <a 
              href={FIRESTORE_UPGRADE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium px-2 py-0.5 rounded border border-amber-500/40 transition-colors"
            >
              <span>Gerenciar Cota / Upgrade no Firebase</span>
              <ExternalLink size={11} />
            </a>
          </div>
          <button 
            onClick={() => setIsQuotaBannerVisible(false)}
            className="p-1 text-amber-400/80 hover:text-amber-200 rounded hover:bg-amber-500/20 transition-colors ml-2"
            title="Fechar aviso"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. PRODUCTION CONTROL ROOM VIEW */}
      {currentView === 'studio' ? (
        <div
          data-surface="console"
          className="flex-1 overflow-hidden w-full max-w-none px-0 mx-0 relative bg-[var(--bg)] text-[var(--ink)]"
          style={{
            display: 'grid',
            gridTemplateAreas: isMobile
              ? '"preview"' 
              : isImmersiveMode 
                ? '"scenes preview sidebar"' 
                : '"scenes preview sidebar"',
            gridTemplateColumns: isMobile 
              ? '1fr' 
              : isImmersiveMode 
                ? '0px 1fr 0px' 
                : `${scenesWidth}px minmax(0, 1fr) ${sidebarWidth}px`,
            transition: (isResizingScenes || isResizingSidebar) ? 'none' : 'grid-template-columns 500ms cubic-bezier(0.4, 0, 0.2, 1)',
            height: '100%'
          }}
        >
          {/* Floating Expand Handles for Immersive Mode */}
          {isImmersiveMode && !isMobile && (
            <>
              <button
                onClick={() => setIsImmersiveMode(false)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-[var(--surface)]/95 hover:bg-blue-600 hover:text-white text-[var(--ink-lo)] p-2 rounded-r-xl border-y border-r border-[var(--line)]/80 shadow-2xl transition-all flex items-center justify-center h-16 cursor-pointer group"
                title="Expandir Painel de Participantes"
              >
                <ChevronRight size={16} className="transition-transform group-hover:scale-110" />
              </button>
              <button
                onClick={() => setIsImmersiveMode(false)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-50 bg-[var(--surface)]/95 hover:bg-blue-600 hover:text-white text-[var(--ink-lo)] p-2 rounded-l-xl border-y border-l border-[var(--line)]/80 shadow-2xl transition-all flex items-center justify-center h-16 cursor-pointer group"
                title="Expandir Painel de Configurações"
              >
                <ChevronLeft size={16} className="transition-transform group-hover:scale-110" />
              </button>
            </>
          )}
          
          {/* Scenes Sidebar Panel on the far left - Desktop Only */}
          {!isMobile && (
            <div 
              style={{ 
                gridArea: 'scenes',
                width: isImmersiveMode ? 0 : scenesWidth,
                transition: (isResizingScenes || isResizingSidebar) ? 'none' : 'width 500ms cubic-bezier(0.4, 0, 0.2, 1), opacity 500ms'
              }}
              className={`hidden md:flex shrink-0 overflow-hidden h-full ${isImmersiveMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
              <ScenesPanel
                participants={participants}
                onToggleParticipantActive={handleToggleParticipantActive}
                isMuted={isMuted}
                isSceneAutomationEnabled={isSceneAutomationEnabled}
                activeSpeaker={activeSpeaker}
                onToggleImmersiveMode={() => setIsImmersiveMode(true)}
                currentSceneId={currentSceneId}
                onSelectScene={handleSelectScene}
                sceneTransitions={sceneTransitions}
              />
            </div>
          )}

          {/* Mobile Overlay Drawer: Scenes/Participants Panel */}
          {isMobile && isMobileScenesOpen && (
            <>
              {/* Backdrop */}
              <div 
                onClick={() => setIsMobileScenesOpen(false)}
                className="absolute inset-0 bg-black/60 z-[98] backdrop-blur-sm transition-all"
              />
              <div className="absolute inset-y-0 left-0 w-[280px] z-[99] bg-[var(--surface)] shadow-2xl border-r border-[var(--line)] flex flex-col h-full animate-in slide-in-from-left duration-300">
                <ScenesPanel
                  participants={participants}
                  onToggleParticipantActive={handleToggleParticipantActive}
                  isMuted={isMuted}
                  isSceneAutomationEnabled={isSceneAutomationEnabled}
                  activeSpeaker={activeSpeaker}
                  onToggleImmersiveMode={() => setIsMobileScenesOpen(false)}
                  currentSceneId={currentSceneId}
                  onSelectScene={handleSelectScene}
                  sceneTransitions={sceneTransitions}
                />
              </div>
            </>
          )}

          {/* Mobile Overlay Drawer: Settings & Subpanels Right Sidebar */}
          {isMobile && isMobileSidebarOpen && (
            <>
              {/* Backdrop */}
              <div 
                onClick={() => setIsMobileSidebarOpen(false)}
                className="absolute inset-0 bg-black/60 z-[98] backdrop-blur-sm transition-all"
              />
              <div className="absolute inset-y-0 right-0 w-[330px] z-[99] bg-[var(--surface)] shadow-2xl border-l border-[var(--line)] flex flex-col h-full animate-in slide-in-from-right duration-300">
                <div className="flex w-full bg-[var(--surface)] h-full shrink-0">
                  
                  {/* LeftSidebar Content container */}
                  <div className="flex-1 h-full min-h-0 border-r border-[var(--line)]/60 overflow-y-auto">
                    <LeftSidebar
                      activeTab={activeTab}
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
                      isSmartSidebarEnabled={isSmartSidebarEnabled}
                      setIsSmartSidebarEnabled={setIsSmartSidebarEnabled}
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
                      isAiModerationEnabled={isAiModerationEnabled}
                      onToggleAiModeration={setIsAiModerationEnabled}
                      aiModerationMode={aiModerationMode}
                      onChangeAiModerationMode={setAiModerationMode}
                      onApproveComment={handleApproveComment}
                      isLive={isLive}
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
                      onOpenCloudflareModal={() => setIsCloudflareModalOpen(true)}
                      onOpenCustomDestinationsModal={() => setIsCustomDestinationsModalOpen(true)}
                      onOpenAddChannelsModal={() => setIsAddChannelsModalOpen(true)}
                      userId={user?.uid}
                    />
                  </div>

                  {/* Vertical Tabs Bar on the far right of the overlay */}
                  <div className="w-[60px] bg-[var(--bg)] flex flex-col items-center py-4 border-l border-[var(--line)]/60 gap-2 h-full shrink-0 justify-between">
                    <div className="flex flex-col gap-2 items-center w-full overflow-y-auto flex-1 no-scrollbar">
                      {/* Smart Sidebar Toggle */}
                      <button
                        onClick={() => setIsSmartSidebarEnabled(!isSmartSidebarEnabled)}
                        className={`w-11 h-11 md:w-10 md:h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all group shrink-0 border relative ${
                          isSmartSidebarEnabled 
                            ? 'bg-[var(--color-brand-deep)]/15 border-[var(--color-brand)]/35 text-[var(--color-brand)]' 
                            : 'bg-[var(--surface)]/40 border-[var(--line)] text-[var(--ink-dim)] hover:text-[var(--ink)]'
                        }`}
                        title="Smart Sidebar: Durante a Live, recolhe abas inativas mantendo o foco no Chat para economizar processamento e espaço visual."
                      >
                        <Sparkles size={14} className={`transition-transform group-hover:scale-105 ${isLive && isSmartSidebarEnabled ? 'animate-pulse text-amber-400' : ''}`} />
                        <span className="text-[6px] font-black uppercase tracking-wider">{isLive && isSmartSidebarEnabled ? 'SMART ON' : 'SMART'}</span>
                        {isLive && isSmartSidebarEnabled && (
                          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                        )}
                      </button>

                      {/* Divider */}
                      <div className="w-6 h-[1px] bg-[var(--panel)]/80 my-1" />

                      {[
                        { id: 'seven', label: 'Chat', icon: MessageSquare, desc: 'Chat' },
                        { id: 'widgets', label: 'Widgets', icon: LayoutGrid, desc: 'Widgets e ferramentas do estúdio' },
                        { id: 'schedule', label: 'Schedule', icon: Calendar, desc: 'Agenda' },
                        { id: 'design', label: 'Design', icon: Palette, desc: 'Logos, banners e tickers' },
                        { id: 'theme', label: 'Styles', icon: Sliders, desc: 'Cores' },
                        { id: 'third', label: 'Prompter', icon: FileText, desc: 'Teleprompter do apresentador' },
                        { id: 'video', label: 'Video', icon: Film, desc: 'Vídeos' },
                        { id: 'audience', label: 'Audience', icon: Users, desc: 'Usuários' },
                        { id: 'settings', label: 'Settings', icon: Settings, desc: 'Ajustes' },
                        { id: 'apps', label: 'Apps', icon: Puzzle, desc: 'Apps' },
                      ].filter(tab => !(isLive && isSmartSidebarEnabled) || tab.id === 'seven').map(tab => {
                        const isActive = activeTab === tab.id;
                        const IconComponent = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-11 h-11 md:w-10 md:h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all group shrink-0 ${
                              isActive 
                                ? 'bg-[var(--color-brand-deep)] text-white shadow-lg ring-1 ring-blue-400/20' 
                                : 'text-[var(--ink-lo)] hover:bg-[var(--surface)] hover:text-[var(--ink-hi)]'
                            }`}
                            title={`${tab.label}: ${tab.desc}`}
                          >
                            <IconComponent size={14} className="transition-transform group-hover:scale-105" />
                            <span className="text-[7px] font-bold uppercase tracking-wide truncate max-w-full px-0.5">{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Close overlay button */}
                    <div className="pt-2 border-t border-[var(--line)]/60 w-full flex justify-center shrink-0">
                      <button
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className="w-11 h-11 md:w-10 md:h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all group shrink-0 text-[var(--ink-dim)] hover:bg-[var(--surface)] hover:text-[var(--ink-hi)] cursor-pointer"
                        title="Fechar Painel"
                      >
                        <X size={14} />
                        <span className="text-[7px] font-bold uppercase tracking-wide">Fechar</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}

          
          {/* LEFT: Main Video Preview Area and bottom control tray */}
          <div 
            style={{ gridArea: 'preview' }}
            className="flex flex-col justify-between p-2 md:p-3 overflow-hidden h-full min-h-0 w-full"
          >
            {/* Mobile Drawer Toggles (only on mobile) */}
            {isMobile && (
              <div className="flex items-center justify-between gap-2 mb-2 px-1 shrink-0">
                <button
                  onClick={() => {
                    setIsMobileScenesOpen(!isMobileScenesOpen);
                    setIsMobileSidebarOpen(false); // close other drawer
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all border shadow-lg cursor-pointer touch-action-btn ${
                    isMobileScenesOpen
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-[var(--surface)] text-[var(--ink)] border-[var(--line)] hover:text-[var(--ink-hi)]'
                  }`}
                >
                  <Users size={16} className={isMobileScenesOpen ? 'text-[var(--ink-hi)]' : 'text-blue-400'} />
                  <span>Participantes ({participants.length})</span>
                </button>
                <button
                  onClick={() => {
                    setIsMobileSidebarOpen(!isMobileSidebarOpen);
                    setIsMobileScenesOpen(false); // close other drawer
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all border shadow-lg cursor-pointer touch-action-btn ${
                    isMobileSidebarOpen
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-[var(--surface)] text-[var(--ink)] border-[var(--line)] hover:text-[var(--ink-hi)]'
                  }`}
                >
                  <Sliders size={16} className={isMobileSidebarOpen ? 'text-[var(--ink-hi)]' : 'text-emerald-400'} />
                  <span>Painel & Ferramentas</span>
                </button>
              </div>
            )}

            {/* Top stream row */}
            <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden">
              <StudioPreview
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
                isLive={isLive}
                liveTime={liveTime}
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
                isStudioPreviewMode={isStudioPreviewMode}
                onToggleStudioPreviewMode={() => setIsStudioPreviewMode(prev => !prev)}
                previewViewMode={previewViewMode}
                onPreviewViewModeChange={setPreviewViewMode}
                hasPendingChanges={hasPendingChanges}
                pendingChanges={pendingChanges}
                onPushToLive={handlePushToLive}
                onRevertToLive={handleRevertToLive}
                onSwapPreviewAndLive={handleSwapPreviewAndLive}
                programSceneState={programSceneState}
                allBanners={banners}
                allTickers={tickers}
              />
            </div>

            {/* Bottom Console actions panel */}
            <div className="mt-3">
              <ControlTray
                isMuted={isMuted}
                onToggleMute={handleToggleMute}
                isCamStopped={isCamStopped}
                onToggleCam={handleToggleCam}
                isScreenSharing={isScreenSharing}
                onToggleScreenShare={handleToggleScreenShare}
                onInviteOpen={() => setIsInviteOpen(true)}
                isLive={isLive}
                onToggleLive={handleToggleLive}
                onExit={() => setCurrentView('dashboard')}
                onSelectDevice={handleSelectDevice}
                isTrialExpired={isTrialExpired}
                onRequirePlan={handleRequirePlan}
                isRecording={isRecording}
                onToggleRecording={handleToggleRecording}
                recordingTime={recordingTime}
              />
            </div>
          </div>

          {/* RIGHT SIDE: Subpanels & Vertical Tabs - Desktop Only */}
          {!isMobile && (
            <div 
              style={{ 
                gridArea: 'sidebar',
                width: isImmersiveMode ? 0 : sidebarWidth,
                transition: (isResizingScenes || isResizingSidebar) ? 'none' : 'width 500ms cubic-bezier(0.4, 0, 0.2, 1), opacity 500ms'
              }}
              className={`flex shrink-0 overflow-hidden h-full ${isImmersiveMode ? 'opacity-0 pointer-events-none border-l-0' : 'border-l border-[var(--line)]'}`}
            >
              <div 
                style={{ width: sidebarWidth }}
                className="flex bg-[var(--surface)] h-full shrink-0"
              >
                
                {/* 1. Subpanel container (takes full width of sidebar, minus tab bar width) */}
                <div className="flex-1 h-full min-h-0 border-r border-[var(--line)]/60 overflow-y-auto">
                  <LeftSidebar
                    activeTab={activeTab}
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
                    isAiModerationEnabled={isAiModerationEnabled}
                    onToggleAiModeration={setIsAiModerationEnabled}
                    aiModerationMode={aiModerationMode}
                    onChangeAiModerationMode={setAiModerationMode}
                    onApproveComment={handleApproveComment}
                    isLive={isLive}
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
                    isSmartSidebarEnabled={isSmartSidebarEnabled}
                    setIsSmartSidebarEnabled={setIsSmartSidebarEnabled}
                    onOpenCloudflareModal={() => setIsCloudflareModalOpen(true)}
                    onOpenCustomDestinationsModal={() => setIsCustomDestinationsModalOpen(true)}
                    onOpenAddChannelsModal={() => setIsAddChannelsModalOpen(true)}
                    userId={user?.uid}
                  />
                </div>

                {/* 2. Vertical Tabs Bar on the far right (styled like Restream vertical menu) */}
                <div className="w-[75px] bg-[var(--bg)] flex flex-col items-center py-4 border-l border-[var(--line)]/60 gap-2.5 h-full shrink-0 justify-between">
                  <div className="flex flex-col gap-2.5 items-center w-full overflow-y-auto flex-1 no-scrollbar">
                    {/* Smart Sidebar Toggle */}
                    <button
                      onClick={() => setIsSmartSidebarEnabled(!isSmartSidebarEnabled)}
                      className={`w-13 h-13 rounded-xl flex flex-col items-center justify-center gap-1 transition-all group shrink-0 border relative cursor-pointer ${
                        isSmartSidebarEnabled 
                          ? 'bg-[var(--color-brand-deep)]/15 border-[var(--color-brand)]/35 text-[var(--color-brand)]' 
                          : 'bg-[var(--surface)]/40 border-[var(--line)] text-[var(--ink-dim)] hover:text-[var(--ink)]'
                      }`}
                      title="Smart Sidebar: Durante a Live, recolhe abas inativas mantendo o foco no Chat para economizar processamento e espaço visual."
                    >
                      <Sparkles size={16} className={`transition-transform group-hover:scale-105 ${isLive && isSmartSidebarEnabled ? 'animate-pulse text-amber-400' : ''}`} />
                      <span className="text-[7px] font-black uppercase tracking-wider">{isLive && isSmartSidebarEnabled ? 'SMART ON' : 'SMART'}</span>
                      {isLive && isSmartSidebarEnabled && (
                        <span className="absolute top-0.5 right-0.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                      )}
                    </button>

                    {/* Divider */}
                    <div className="w-8 h-[1px] bg-[var(--panel)]/80 my-1" />

                    {[
                      { id: 'seven', label: 'Chat', icon: MessageSquare, desc: 'Chat unificado do webinar' },
                      { id: 'widgets', label: 'Widgets', icon: LayoutGrid, desc: 'Widgets e ferramentas do estúdio' },
                      { id: 'schedule', label: 'Schedule', icon: Calendar, desc: 'Agendar e gerenciar webinars' },
                      { id: 'design', label: 'Design', icon: Palette, desc: 'Logos, banners, tickers e overlays' },
                      { id: 'theme', label: 'Temas', icon: Sliders, desc: 'Tema Claro/Escuro do estúdio, cores da marca e tipografia' },
                      { id: 'third', label: 'Prompter', icon: FileText, desc: 'Teleprompter do apresentador' },
                      { id: 'video', label: 'Video', icon: Film, desc: 'Videoclipes e fundo virtual' },
                      { id: 'audience', label: 'Audience', icon: Users, desc: 'Base de Usuários e CRM do Estúdio' },
                      { id: 'settings', label: 'Settings', icon: Settings, desc: 'Configurações de transmissão e palco' },
                      { id: 'apps', label: 'Apps', icon: Puzzle, desc: 'Integrações, QR Code e Notas' },
                    ].filter(tab => !(isLive && isSmartSidebarEnabled) || tab.id === 'seven').map(tab => {
                      const isActive = activeTab === tab.id;
                      const IconComponent = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-13 h-13 rounded-xl flex flex-col items-center justify-center gap-1 transition-all group shrink-0 cursor-pointer ${
                            isActive 
                              ? 'bg-[var(--color-brand-deep)] text-white shadow-lg ring-1 ring-blue-400/20' 
                              : 'text-[var(--ink-lo)] hover:bg-[var(--surface)] hover:text-[var(--ink-hi)]'
                          }`}
                          title={`${tab.label}: ${tab.desc}`}
                        >
                          <IconComponent size={16} className="transition-transform group-hover:scale-105" />
                          <span className="text-[8px] font-bold uppercase tracking-wide truncate max-w-full px-0.5">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Fixed bottom collapse button */}
                  <div className="pt-2 border-t border-[var(--line)]/60 w-full flex justify-center shrink-0">
                    <button
                      onClick={() => setIsImmersiveMode(true)}
                      className="w-13 h-13 rounded-xl flex flex-col items-center justify-center gap-1 transition-all group shrink-0 text-[var(--ink-dim)] hover:bg-[var(--surface)] hover:text-[var(--ink-hi)] cursor-pointer"
                      title="Recuar Painel Lateral"
                    >
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                      <span className="text-[8px] font-bold uppercase tracking-wide">Recuar</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Invitation popup dialog */}
          <InviteModal
            isOpen={isInviteOpen}
            onClose={() => setIsInviteOpen(false)}
            inviteUrl={`https://stream.pwstreamer.com/guest-studio?id=5427`}
          />

          {/* Manual Resize partition handles */}
          {!isImmersiveMode && !isMobile && (
            <>
              {/* Left partition handle between Scenes and Preview */}
              <div
                onMouseDown={() => setIsResizingScenes(true)}
                style={{ left: `${scenesWidth - 4}px` }}
                className="absolute top-0 bottom-0 w-2 cursor-col-resize z-40 group select-none flex items-center justify-center transition-all"
                title="Arraste para redimensionar"
              >
                <div className={`w-[2px] h-full transition-colors duration-200 ${isResizingScenes ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-[var(--panel)]/80 group-hover:bg-blue-500/80 group-hover:shadow-[0_0_4px_#3b82f6]'}`} />
                
                {/* Visual grab dot accent indicator */}
                <div className="absolute top-1/2 -translate-y-1/2 w-4 h-6 rounded-full bg-[var(--panel)] border border-[var(--line-ctl)] flex flex-col gap-0.5 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-xl pointer-events-none">
                  <div className="w-1.5 h-0.5 bg-slate-400 rounded-full" />
                  <div className="w-1.5 h-0.5 bg-slate-400 rounded-full" />
                  <div className="w-1.5 h-0.5 bg-slate-400 rounded-full" />
                </div>
              </div>

              {/* Right partition handle between Preview and Sidebar */}
              <div
                onMouseDown={() => setIsResizingSidebar(true)}
                style={{ right: `${sidebarWidth - 4}px` }}
                className="absolute top-0 bottom-0 w-2 cursor-col-resize z-40 group select-none flex items-center justify-center transition-all"
                title="Arraste para redimensionar"
              >
                <div className={`w-[2px] h-full transition-colors duration-200 ${isResizingSidebar ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-[var(--panel)]/80 group-hover:bg-blue-500/80 group-hover:shadow-[0_0_4px_#3b82f6]'}`} />
                
                {/* Visual grab dot accent indicator */}
                <div className="absolute top-1/2 -translate-y-1/2 w-4 h-6 rounded-full bg-[var(--panel)] border border-[var(--line-ctl)] flex flex-col gap-0.5 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-xl pointer-events-none">
                  <div className="w-1.5 h-0.5 bg-slate-400 rounded-full" />
                  <div className="w-1.5 h-0.5 bg-slate-400 rounded-full" />
                  <div className="w-1.5 h-0.5 bg-slate-400 rounded-full" />
                </div>
              </div>
            </>
          )}

        </div>
      ) : currentView === 'super-admin' ? (
        <SuperAdminPanel 
          onBack={() => setCurrentView('dashboard')} 
          user={user} 
          allWebinars={webinars}
          onDeleteWebinar={handleDeleteWebinar}
        />
      ) : currentView === 'admin' ? (
        <AdminPanel 
          onBack={() => setCurrentView('dashboard')} 
          user={user} 
          onNavigateSuperAdmin={() => setCurrentView('super-admin')}
        />
      ) : currentView === 'public-webinar' ? (
        <WebinarPublicPage 
          webinarTitle={webinars.find(w => w.id === selectedWebinarId)?.title || title}
          webinarDesc={webinars.find(w => w.id === selectedWebinarId)?.desc || description}
          webinarDate={webinars.find(w => w.id === selectedWebinarId)?.time || 'Amanhã, às 19:30'}
          isLive={isLive}
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
              authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
              text,
              platform: 'youtube',
              timestamp
            };
            setComments(prev => [...prev, newComment]);
          }}
        />
      ) : currentView === 'profile' || currentView === 'billing' ? (
        <BillingDashboard 
          user={user}
          onUpdateUser={handleAuthSuccess}
          onBackToDashboard={() => setCurrentView('dashboard')}
          initialTab={currentView}
        />
      ) : (
        /* 3. BUSINESS DASHBOARD VIEW */
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-200">
          
          {/* Welcome back user */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink-hi)]">Olá, Marcos Gonçalves</h1>
              <p className="text-sm text-[var(--ink-lo)] mt-1">Gerencie, agende e configure seus webinares e transmissões ao vivo.</p>
            </div>
            
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setCurrentView('admin')}
                className="flex items-center gap-2 px-5 py-3 border border-[var(--line)] hover:bg-[var(--surface)] text-[var(--ink)] font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <Server size={14} className="text-blue-500 animate-pulse" /> Painel de Administração
              </button>
              <button
                onClick={() => setIsCreateWebinarOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-[var(--color-brand-deep)] hover:bg-blue-600 text-white font-bold text-sm rounded-xl shadow-xl transition-all cursor-pointer"
              >
                <Plus size={16} /> Agendar Webinar
              </button>
            </div>
          </div>

          {/* Metrics summary widget card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Webinares Realizados', value: '14', change: '+2 este mês', icon: Radio },
              { label: 'Espectadores Únicos', value: '4.829', change: '+15% semana passada', icon: Users },
              { label: 'Minutos Transmitidos', value: '1.240m', change: 'Média 90m por live', icon: Tv },
              { label: 'Engajamento Médio', value: '87%', change: 'Altamente positivo', icon: BarChart3 }
            ].map((metric, i) => (
              <div key={i} className="bg-[var(--surface)] border border-[var(--line)] p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--ink-lo)] font-semibold">{metric.label}</p>
                  <p className="text-2xl font-bold text-[var(--ink-hi)] mt-1.5">{metric.value}</p>
                  <p className="text-[10px] text-blue-400 mt-1">{metric.change}</p>
                </div>
                <div className="w-11 h-11 bg-[var(--bg)] border border-[var(--line)] rounded-xl flex items-center justify-center text-[var(--color-brand)]">
                  <metric.icon size={20} />
                </div>
              </div>
            ))}
          </div>

          {/* Live webinar planning section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Stream room launcher trigger */}
            <div className="lg:col-span-2 bg-[var(--surface)] border border-[var(--line)] rounded-2xl overflow-hidden flex flex-col">
              <div className="p-6 border-b border-[var(--line)] flex items-center justify-between">
                <h2 className="text-base font-bold text-[var(--ink-hi)] flex items-center gap-2">
                  <Calendar size={18} className="text-[var(--color-brand)]" /> Próximos Webinares Agendados
                </h2>
                <span className="text-xs text-blue-400 hover:underline cursor-pointer">Ver todos</span>
              </div>

              <div className="p-6 flex-1 divide-y divide-[var(--line)]/40 space-y-4">
                {webinars.map((webinar, i) => (
                  <div key={webinar.id || i} className={`pt-4 first:pt-0 flex flex-col xl:flex-row justify-between items-start gap-4`}>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[var(--ink-hi)] hover:text-[var(--color-brand)] transition-colors cursor-pointer text-left">
                          {webinar.title}
                        </p>
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          webinar.type === 'pre-recorded' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {webinar.type === 'pre-recorded' ? 'Vídeo Gravado' : 'Transmissão Ao Vivo'}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--ink-lo)] text-left">{webinar.desc}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--ink-lo)] pt-1">
                        <span className="font-semibold text-blue-400">{webinar.time}</span>
                        <span>•</span>
                        <span>Canais: {webinar.channels.join(', ')}</span>
                        {webinar.videoName && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-400">Vídeo: {webinar.videoName}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0 w-full xl:w-auto">
                      <button
                        onClick={() => {
                          setSelectedWebinarId(webinar.id);
                          setCurrentView('public-webinar');
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[var(--bg)] hover:bg-[var(--panel)] text-xs font-semibold rounded-lg text-emerald-400 border border-[var(--line)] transition-all cursor-pointer"
                        title="Ver landing page pública de inscrição do webinar"
                      >
                        <ExternalLink size={12} /> Inscrições
                      </button>

                      <button
                        onClick={() => {
                          setDashboardEditorTitle(webinar.title);
                          setIsDashboardEditorOpen(true);
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[var(--bg)] hover:bg-[var(--panel)] text-xs font-semibold rounded-lg text-blue-400 border border-[var(--line)] transition-all cursor-pointer"
                        title="Criar ou personalizar a thumbnail da live"
                      >
                        <Palette size={12} /> Criar Capa
                      </button>
                      
                      <button
                        onClick={() => {
                          setTitle(webinar.title);
                          setCurrentView('studio');
                        }}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[var(--color-brand-deep)] hover:bg-blue-600 text-xs font-semibold rounded-lg text-white transition-all cursor-pointer"
                      >
                        Acessar Estúdio <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick settings & support */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h2 className="text-base font-bold text-[var(--ink-hi)] flex items-center gap-2">
                  <Settings size={18} className="text-[var(--color-brand)]" /> Configurações & Chaves
                </h2>
                
                <div className="space-y-2">
                  <div 
                    onClick={() => {
                      setIntegrationsModalTab('rtmp');
                      setIsIntegrationsModalOpen(true);
                    }}
                    className="flex items-center justify-between p-3 bg-[var(--bg)] hover:bg-blue-500/10 hover:border-blue-500/20 rounded-xl border border-[var(--line)]/40 cursor-pointer transition-all text-xs text-left"
                  >
                    <div>
                      <p className="text-[var(--ink-hi)] font-semibold">Integração com OBS / RTMP Externo</p>
                      <p className="text-[10px] text-[var(--ink-lo)]">Ver chaves de ingestão, URLs de servidores e OBS</p>
                    </div>
                    <ExternalLink size={12} className="text-[var(--ink-dim)]" />
                  </div>

                  <div 
                    onClick={() => {
                      setIntegrationsModalTab('social');
                      setIsIntegrationsModalOpen(true);
                    }}
                    className="flex items-center justify-between p-3 bg-[var(--bg)] hover:bg-blue-500/10 hover:border-blue-500/20 rounded-xl border border-[var(--line)]/40 cursor-pointer transition-all text-xs text-left"
                  >
                    <div>
                      <p className="text-[var(--ink-hi)] font-semibold">Gerenciar Redes Sociais & OAuth</p>
                      <p className="text-[10px] text-[var(--ink-lo)]">Configurações para YouTube, Facebook e Twitch</p>
                    </div>
                    <ExternalLink size={12} className="text-[var(--ink-dim)]" />
                  </div>

                  <div 
                    onClick={() => {
                      setIntegrationsModalTab('analysis');
                      setIsIntegrationsModalOpen(true);
                    }}
                    className="flex items-center justify-between p-3 bg-[var(--bg)] hover:bg-emerald-500/10 hover:border-emerald-500/20 rounded-xl border border-[var(--line)]/40 cursor-pointer transition-all text-xs text-left"
                  >
                    <div>
                      <p className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Sparkles size={11} className="animate-pulse text-emerald-400" />
                        Análise de Requisitos & Chaves
                      </p>
                      <p className="text-[10px] text-[var(--ink-lo)]">Mapeamento completo do SaaS e chaves do sistema</p>
                    </div>
                    <ExternalLink size={12} className="text-emerald-500" />
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--line)] pt-4 mt-6 text-xs text-[var(--ink-lo)] text-left space-y-1.5">
                <p>Precisa de ajuda imediata?</p>
                <p className="text-blue-400 hover:underline cursor-pointer font-semibold flex items-center gap-1">
                  PWstreamer <ArrowRight size={12} />
                </p>
              </div>
            </div>

          </div>

          {/* Video Quality Control Panel Section */}
          <VideoQualityPanel 
            userPlan={user?.plan || 'Standard'} 
            onNavigateToBilling={() => setCurrentView('billing')} 
          />

          {/* Dashboard Capas Creator Modal */}
          {isDashboardEditorOpen && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-[var(--surface)] border border-[var(--line)] w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[var(--bg)]">
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-[var(--ink-hi)] flex items-center gap-2">
                      <Palette size={16} className="text-blue-500 animate-pulse" /> Gerador de Capas & Miniaturas (Thumbnail Editor)
                    </h3>
                    <p className="text-xs text-[var(--ink-lo)]">Desenhe e baixe capas em alta definição para as suas redes sociais e transmissões</p>
                  </div>
                  <button 
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
            </div>
          )}

          {/* Custom Chrome Screen Share Picker Modal */}
          <ScreenSharePickerModal
            isOpen={isScreenSharePickerOpen}
            onClose={() => setIsScreenSharePickerOpen(false)}
            initialTab={screenPickerInitialTab}
            onSelectShare={handleConfirmScreenShare}
          />

        </div>
      )}

      {/* Styled Footer - Visible only on main page / dashboard */}
      {currentView !== 'studio' && (
        <footer className="bg-[var(--bg)] border-t border-[var(--line)] py-6 text-xs text-[var(--ink-lo)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex gap-6">
              <button 
                onClick={() => { setLegalModalType('terms'); setLegalModalOpen(true); }}
                className="hover:text-[var(--ink-hi)] transition-colors uppercase font-semibold cursor-pointer"
              >
                TERMOS
              </button>
              <button 
                onClick={() => { setLegalModalType('privacy'); setLegalModalOpen(true); }}
                className="hover:text-[var(--ink-hi)] transition-colors uppercase font-semibold cursor-pointer"
              >
                PRIVACIDADE
              </button>
              <a href="https://pwstreamer.com/support" target="_blank" rel="noreferrer" className="hover:text-[var(--ink-hi)] transition-colors uppercase font-semibold">PWstreamer</a>
            </div>

            <div className="text-center text-[var(--ink-dim)]">
              <p>© 2026, All Rights Reserved to <span className="text-[var(--ink-hi)]">PwStreamer Online.</span> Developed and Maintained by <span className="text-blue-400">PWstreamer</span></p>
            </div>

            <div className="shrink-0">
              <PwStreamLogo showText={false} iconSize={28} />
            </div>
          </div>
        </footer>
      )}

      {/* 4. CREATION WEBINAR / LIVE EVENT MODAL */}
      {isCreateWebinarOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--bg)]/80 backdrop-blur-sm animate-in fade-in duration-200" id="create-webinar-modal">
          <div className="relative w-full max-w-xl bg-[var(--bg)] border border-[var(--line)] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-left">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[var(--line)] flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-[var(--ink-hi)] flex items-center gap-2">
                  <Calendar size={18} className="text-blue-500" /> Agendar Nova Transmissão
                </h3>
                <p className="text-xs text-[var(--ink-lo)]">Preencha os dados do webinar, canais de streaming e tipo de conteúdo.</p>
              </div>
              <button 
                onClick={() => setIsCreateWebinarOpen(false)}
                className="p-1.5 hover:bg-[var(--panel)] rounded-lg text-[var(--ink-lo)] hover:text-[var(--ink-hi)] transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!newWebinarTitle.trim()) return;

                const nWeb = {
                  id: `webinar-${Date.now()}`,
                  title: newWebinarTitle,
                  desc: newWebinarDesc || 'Nenhuma descrição fornecida.',
                  time: newWebinarTime || 'Hoje, às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                  channels: newWebinarChannels.length > 0 ? newWebinarChannels : ['YouTube'],
                  type: newWebinarType,
                  videoName: newWebinarVideoName
                };

                setWebinars(prev => [nWeb, ...prev]);
                if (user?.uid) {
                  saveWebinarToFirestore(user.uid, nWeb);
                }
                
                // Reset states
                setNewWebinarTitle('');
                setNewWebinarDesc('');
                setNewWebinarTime('');
                setNewWebinarType('webinar');
                setNewWebinarVideoName('');
                setNewWebinarChannels(['YouTube']);
                setIsCreateWebinarOpen(false);
              }}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              {/* Event Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--ink)]">Título do Webinar / Transmissão</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Como dominar o tráfego pago em 2026"
                  value={newWebinarTitle}
                  onChange={(e) => setNewWebinarTitle(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              {/* Event Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--ink)]">Descrição Detalhada</label>
                <textarea
                  placeholder="Ex: Neste webinar exclusivo, abordaremos as novas tendências de audiência..."
                  value={newWebinarDesc}
                  onChange={(e) => setNewWebinarDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500 transition-all resize-none"
                />
              </div>

              {/* Time & Type Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--ink)]">Data e Hora do Início</label>
                  <input
                    type="text"
                    placeholder="Ex: Amanhã, às 20:00"
                    value={newWebinarTime}
                    onChange={(e) => setNewWebinarTime(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink-hi)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--ink)]">Tipo de Conteúdo</label>
                  <select
                    value={newWebinarType}
                    onChange={(e) => setNewWebinarType(e.target.value as any)}
                    className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink-hi)] focus:outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="webinar">Webinar Interativo (Ao Vivo)</option>
                    <option value="live">Stream Convencional (Ao Vivo)</option>
                    <option value="pre-recorded">Transmissão Gravada (Simulada)</option>
                  </select>
                </div>
              </div>

              {/* Pre-recorded video uploader (Shows only when pre-recorded selected) */}
              {newWebinarType === 'pre-recorded' && (
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-3">
                  <label className="text-xs font-bold text-blue-400 uppercase tracking-wider block">Upload do Vídeo Pré-gravado</label>
                  <p className="text-[10px] text-[var(--ink-lo)] leading-relaxed">Arraste e solte o arquivo de vídeo (.mp4, .mov) para que nossos servidores façam o transcoding automático e iniciem o fluxo RTMP no horário programado.</p>
                  
                  <div className="border border-dashed border-[var(--line-ctl)] hover:border-blue-500/50 rounded-lg p-5 text-center transition-all cursor-pointer bg-[var(--bg)]">
                    {newWebinarVideoName ? (
                      <div className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                        <CheckCircle2 size={16} /> {newWebinarVideoName}
                      </div>
                    ) : (
                      <div 
                        onClick={() => setNewWebinarVideoName('aula_introducao_marketing_v2.mp4')}
                        className="text-xs text-[var(--ink-lo)] hover:text-[var(--ink-hi)] transition-colors"
                      >
                        Clique para simular o upload de <span className="text-blue-400 font-semibold underline">aula_introducao_marketing_v2.mp4</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Destination channels checkbox selections */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--ink)]">Canais de Transmissão Simultânea</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {['YouTube', 'Facebook', 'Instagram', 'Twitch', 'LinkedIn', 'X / Twitter'].map(chan => {
                    const isChecked = newWebinarChannels.includes(chan);
                    return (
                      <label 
                        key={chan} 
                        className={`flex items-center gap-2 p-2.5 bg-[var(--bg)] border rounded-xl cursor-pointer text-xs transition-all ${
                          isChecked ? 'border-blue-500/40 bg-blue-500/5 text-white' : 'border-[var(--line)] text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewWebinarChannels(prev => [...prev, chan]);
                            } else {
                              setNewWebinarChannels(prev => prev.filter(c => c !== chan));
                            }
                          }}
                          className="accent-blue-500"
                        />
                        <span>{chan}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Form submit button */}
              <button
                type="submit"
                className="w-full py-3 bg-[var(--color-brand-deep)] hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition-all shadow-lg mt-4 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus size={14} /> Salvar e Agendar Webinar
              </button>

            </form>

          </div>
        </div>
      )}

      {/* Interactive Legal Document Modals */}
      <LegalModal 
        isOpen={legalModalOpen}
        type={legalModalType}
        onClose={() => setLegalModalOpen(false)}
      />

      {/* 5. INTERACTIVE INTEGRATIONS, API KEYS & REQUIREMENTS ANALYSIS MODAL */}
      {isIntegrationsModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[var(--surface)] border border-[var(--line)] w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--line)] bg-[var(--bg)]">
              <div className="text-left">
                <h3 className="text-sm sm:text-base font-bold text-[var(--ink-hi)] flex items-center gap-2">
                  <Sparkles size={18} className="text-emerald-400 animate-pulse" />
                  Manual de Integração, Chaves de API e Análise do SaaS
                </h3>
                <p className="text-xs text-[var(--ink-lo)] mt-0.5">Analise o mapeamento completo de requisitos de produção e variáveis de ambiente.</p>
              </div>
              <button 
                onClick={() => setIsIntegrationsModalOpen(false)}
                className="text-[var(--ink-lo)] hover:text-[var(--ink-hi)] p-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab Switched Header */}
            <div className="flex border-b border-[var(--line)] bg-[var(--bg)]/50 px-6 py-2 gap-2">
              {[
                { id: 'analysis', label: 'Análise de Requisitos (SaaS)', icon: CheckCircle2 },
                { id: 'rtmp', label: 'Ingestão OBS & RTMP', icon: Server },
                { id: 'social', label: 'Mídias Sociais & OAuth', icon: Users },
                { id: 'webhooks', label: 'Gerenciador de Webhooks', icon: Radio }
              ].map(tab => {
                const Icon = tab.icon;
                const active = integrationsModalTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setIntegrationsModalTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      active ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-[var(--ink-lo)] hover:text-[var(--ink-hi)]'
                    }`}
                  >
                    <Icon size={14} /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content Body */}
            <div className="p-6 max-h-[65vh] overflow-y-auto text-xs text-[var(--ink)] space-y-4">
              {integrationsModalTab === 'analysis' && (
                <div className="space-y-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Mapeamento Geral do SaaS (Requisitos vs. Código)</p>
                    <p className="text-[11px] text-[var(--ink)] leading-relaxed">Confrontamos as 45 seções e requisitos técnicos de seu plano de negócios com a implementação atual do MVP do PwStreamer. O resultado demonstra as áreas prontas e o roteiro de banco de dados e servidores para a migração para nuvem.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { title: 'Estúdio Virtual do Navegador', state: 'Pronto / Implementado', desc: 'Captura de câmera, microfone, compartilhamento de tela, controle de layouts de palco e mixers de áudio real via Web Audio API.', done: true },
                      { title: 'Gerenciador de Transição de Câmeras', state: 'Pronto / Implementado', desc: 'Transições suaves reais de vídeo (Fade, Slide, Zoom, Cut) usando animações Motion integradas diretamente nas trocas de layout.', done: true },
                      { title: 'Moderação Automática com IA', state: 'Pronto / Integrado', desc: 'Filtro inteligente de abusos e spams conectado diretamente no backend Express com a SDK oficial @google/genai (Gemini 3.5 Flash).', done: true },
                      { title: 'Painel de Cobranças e Faturas', state: 'Pronto / Simulação Premium', desc: 'Componente Billing completo que simula pagamentos Stripe, PayPal, Mercado Pago (PIX), gera histórico de faturamento e emite faturas em texto.', done: true },
                      { title: 'Gerador de Capas & Captação', state: 'Pronto / Implementado', desc: 'Criação de miniaturas / thumbnails para mídias sociais diretamente pelo painel e landing pages públicas interativas de captação de leads.', done: true },
                      { title: 'Monitoramento & Painel Admin', state: 'Pronto / Implementado', desc: 'Painel administrativo com monitoramento em tempo real de CPU do servidor, banda e egress/ingress de dados usando gráficos Recharts.', done: true },
                      { title: 'Chroma-key (Tela Verde)', state: 'Pronto / Implementado', desc: 'Substituição em tempo real de fundos utilizando tolerância cromática configurável direto na visualização da câmera.', done: true },
                      { title: 'Durable Database (PostgreSQL)', state: 'Requer Produção', desc: 'Substituir a persistência de LocalState/localStorage atual por tabelas relacionais do PostgreSQL (tabelas users, subscriptions, broadcasts, etc.)', done: false },
                      { title: 'Servidores de Ingestão RTMP/SRT', state: 'Requer Produção', desc: 'Substituir as chaves simuladas por ingestão real de sinal rodando MediaMTX ou OvenMediaEngine sob Docker.', done: false },
                      { title: 'Email Marketing & transactional SMTP', state: 'Requer Produção', desc: 'Disparo real de convites e certificados pós-transmissão utilizando chaves de API da Brevo, SendGrid ou Mailchimp.', done: false },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-[var(--bg)] border border-[var(--line)] p-4 rounded-xl space-y-1.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[var(--ink-hi)] text-xs">{item.title}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              item.done ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>{item.state}</span>
                          </div>
                          <p className="text-[10px] text-[var(--ink-lo)] leading-relaxed mt-1">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl space-y-2">
                    <p className="font-bold text-blue-400 text-xs flex items-center gap-1">Chaves Necessárias para o Sistema Completo</p>
                    <p className="text-[10px] text-[var(--ink)] leading-relaxed">As seguintes variáveis devem ser declaradas no arquivo <code className="bg-[var(--bg)] px-1 py-0.5 rounded font-mono text-[var(--ink-hi)]">.env</code> de produção para que o ecossistema SaaS opere plenamente:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono pt-1 text-[var(--ink-lo)]">
                      <div>• <code className="text-[var(--ink-hi)]">GEMINI_API_KEY</code> (Moderação do chat)</div>
                      <div>• <code className="text-[var(--ink-hi)]">STRIPE_SECRET_KEY</code> (Assinaturas e planos)</div>
                      <div>• <code className="text-[var(--ink-hi)]">MERCADO_PAGO_ACCESS_TOKEN</code> (PIX / Boleto)</div>
                      <div>• <code className="text-[var(--ink-hi)]">AWS_ACCESS_KEY_ID</code> (Streaming AWS IVS)</div>
                      <div>• <code className="text-[var(--ink-hi)]">CLOUDFLARE_API_TOKEN</code> (Armazenamento R2)</div>
                      <div>• <code className="text-[var(--ink-hi)]">BREVO_SMTP_KEY</code> (Disparo de emails)</div>
                    </div>
                  </div>
                </div>
              )}

              {integrationsModalTab === 'rtmp' && (
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl">
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Configuração de Transmissão Externa (OBS / Streamlabs)</p>
                    <p className="text-[11px] text-[var(--ink)] leading-relaxed">Você pode conectar encoders físicos ou softwares externos (como OBS Studio, vMix ou Streamlabs) ao PwStreamer. O servidor de ingestão recebe seu sinal em alta definição e faz o multicast simultâneo.</p>
                  </div>

                  <div className="space-y-3 bg-[var(--bg)] border border-[var(--line)] p-5 rounded-2xl">
                    <p className="text-xs font-bold text-[var(--ink-hi)] uppercase tracking-wider">Parâmetros de Conexão Ativos</p>
                    
                    <div className="space-y-2.5">
                      <div>
                        <p className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider">URL do Servidor RTMP Primário (Ingestion)</p>
                        <div className="flex gap-2 mt-1">
                          <input 
                            type="text" 
                            readOnly 
                            value="rtmp://stream.pwstreamer.com:1935/live" 
                            className="flex-1 bg-[var(--bg)] border border-[var(--line)] rounded-lg px-3 py-1.5 font-mono text-[11px] text-blue-400 focus:outline-none"
                          />
                          <button 
                            type="button"
                            onClick={() => navigator.clipboard.writeText('rtmp://stream.pwstreamer.com:1935/live')}
                            className="px-3 bg-[var(--panel)] hover:bg-[var(--raise)] text-[var(--ink-hi)] rounded-lg transition-colors text-[10px] font-bold cursor-pointer"
                          >
                            Copiar
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-[var(--ink-lo)] uppercase tracking-wider">Chave de Transmissão (Stream Key)</p>
                        <div className="flex gap-2 mt-1">
                          <input 
                            type="password" 
                            readOnly 
                            value="live_5427901_pw_prod_99a8x72cd" 
                            className="flex-1 bg-[var(--bg)] border border-[var(--line)] rounded-lg px-3 py-1.5 font-mono text-[11px] text-blue-400 focus:outline-none"
                          />
                          <button 
                            type="button"
                            onClick={() => navigator.clipboard.writeText('live_5427901_pw_prod_99a8x72cd')}
                            className="px-3 bg-[var(--panel)] hover:bg-[var(--raise)] text-[var(--ink-hi)] rounded-lg transition-colors text-[10px] font-bold cursor-pointer"
                          >
                            Copiar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-xl">
                    <p className="text-xs font-bold text-[var(--ink-hi)]">Requisitos Recomendados para o OBS:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-[var(--ink-lo)] text-[10px] leading-relaxed">
                      <li><strong>Encoder de Vídeo:</strong> NVIDIA NVENC H.264 ou x264</li>
                      <li><strong>Taxa de Bits (Bitrate):</strong> 3500 kbps a 6000 kbps (para 720p / 1080p a 30fps)</li>
                      <li><strong>Intervalo de Keyframe:</strong> 2 segundos (Obrigatório para Facebook e YouTube)</li>
                      <li><strong>Perfil de Áudio:</strong> AAC, Stereo, 128 kbps, 48 kHz</li>
                    </ul>
                  </div>
                </div>
              )}

              {integrationsModalTab === 'social' && (
                <div className="space-y-4">
                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl">
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Social Media APIs & Conexão por OAuth</p>
                    <p className="text-[11px] text-[var(--ink)] leading-relaxed">Para habilitar a retransmissão direta de um clique para canais e páginas, a plataforma utiliza o padrão de autenticação OAuth 2.0. Abaixo listamos as configurações necessárias para os portais de desenvolvedores de cada rede.</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        name: 'YouTube Live Streaming API',
                        developer: 'Google Developers Console',
                        scopes: 'https://www.googleapis.com/auth/youtube.force-ssl',
                        desc: 'Permite criar eventos de transmissão ao vivo diretamente no canal do usuário, gerenciar títulos e capas de lives e capturar a caixa de comentários ao vivo em tempo real para o chat unificado.'
                      },
                      {
                        name: 'Facebook Live Video API',
                        developer: 'Meta for Developers (Facebook Graph API)',
                        scopes: 'publish_video, pages_manage_posts, pages_read_engagement',
                        desc: 'Necessário para listar as páginas e grupos gerenciados pelo usuário final e autorizar a postagem automática da live com título e link customizado diretamente na timeline.'
                      },
                      {
                        name: 'Twitch API & Webhooks',
                        developer: 'Twitch Developer Console',
                        scopes: 'channel:manage:broadcast, channel:read:subscriptions',
                        desc: 'Habilita o envio de chaves de transmissão e monitoramento dinâmico de status técnico do canal do streamer, bem como integração direta com chats IRC.'
                      }
                    ].map((platform, idx) => (
                      <div key={idx} className="bg-[var(--bg)] border border-[var(--line)] p-4 rounded-xl space-y-2 text-left">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                          <p className="text-xs font-bold text-[var(--ink-hi)]">{platform.name}</p>
                          <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono font-bold">{platform.developer}</span>
                        </div>
                        <p className="text-[10px] text-[var(--ink-lo)] leading-relaxed">{platform.desc}</p>
                        <div className="p-2.5 bg-[var(--bg)] rounded-lg">
                          <p className="text-[9px] font-bold text-[var(--ink-dim)] uppercase tracking-wider">Escopos e Permissões OAuth Requeridas:</p>
                          <code className="text-[9px] text-indigo-300 block font-mono break-all mt-1">{platform.scopes}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {integrationsModalTab === 'webhooks' && (
                <WebhookPanel 
                  userId={user?.uid} 
                  isLive={isLive}
                  onSaveToFirestore={async (logItem) => {
                    if (user?.uid) {
                      await addWebhookLogToFirestore(user.uid, logItem);
                    }
                  }}
                  initialLogs={webhookLogs}
                />
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[var(--line)] bg-[var(--bg)] flex items-center justify-between">
              <span className="text-[10px] text-[var(--ink-dim)]">Desenvolvido por PWstreamer Solutions - PwStreamer Cloud Integration Manual</span>
              <button
                type="button"
                onClick={() => setIsIntegrationsModalOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stream JSON Statistics Report Modal */}
      <StreamReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        reportData={activeStreamReport} 
      />

      {/* Cloudflare Stream Integration Modal */}
      <CloudflareStreamModal
        isOpen={isCloudflareModalOpen}
        onClose={() => setIsCloudflareModalOpen(false)}
        onApplyToStudio={(url, key) => {
          setRtmpServer(url);
          setStreamKey(key);
        }}
        isLive={isLive}
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
        onClose={() => setIsAddChannelsModalOpen(false)}
        destinations={destinations}
        onAddOrUpdateDestination={handleAddOrUpdateDestination}
        onToggleDestination={handleToggleDestination}
        currentPlan={user?.plan || 'Free Trial'}
        onOpenUpgrade={() => {
          setIsAddChannelsModalOpen(false);
          setPlansModalReason('upgrade');
          setIsPlansModalOpen(true);
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
          userEmail={user.email}
          userId={user.uid || ''}
          currentPlan={user.plan}
          reason={plansModalReason}
          onPlanUpgraded={handlePlanUpgraded}
        />
      )}
    </div>
  );
}