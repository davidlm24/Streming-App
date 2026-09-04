export interface Destination {
  id: string;
  name: string;
  platform: 'facebook' | 'youtube' | 'twitch' | 'linkedin' | 'instagram' | 'x' | 'tiktok' | 'cloudflare' | 'nginx' | 'srs' | 'kick' | 'restream' | 'custom' | string;
  avatarUrl: string;
  selected: boolean;
  streamUrl?: string;
  streamKey?: string;
  alternativeIngestUrl?: string;
  backupStreamUrl?: string;
  latencyMs?: number;
  latencyStatus?: 'optimal' | 'good' | 'fair' | 'poor' | 'offline';
  lastLatencyCheck?: string;
  username?: string;
  password?: string;
  port?: number;
  notes?: string;
  isCustom?: boolean;
  serverType?: 'nginx-rtmp' | 'srs' | 'owncast' | 'mistserver' | 'generic-rtmp' | 'rtmps' | 'other';
  createdAt?: string;
  updatedAt?: string;
}

export interface AudioTrack {
  id: string;
  name: string;
  url?: string;
  duration?: string;
}

export interface TickerItem {
  id: string;
  text: string;
  badgeText?: string;
  speed?: 'slow' | 'normal' | 'fast';
  direction?: 'left' | 'right';
}

export interface Banner {
  id: string;
  text: string;
  subtitle?: string;
  themeColor?: string;
  accentColor?: string;
  x?: number;
  y?: number;
  scale?: number;
}

export type BannerPosition = 'bottom' | 'top' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'lateral';

export interface Comment {
  id: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  platform: 'facebook' | 'youtube' | 'twitch' | 'studio';
  timestamp: string;
  isAbusive?: boolean;
  isIrrelevant?: boolean;
  isModerated?: boolean;
  moderationReason?: string;
  isApprovedByUser?: boolean;
}

export interface Participant {
  id: string;
  name: string;
  avatarUrl: string;
  isLocal: boolean;
  isActive: boolean; // Added to stream?
  hasVideo: boolean;
  hasAudio: boolean;
  isScreenShare?: boolean;
  stream?: MediaStream | null;
}

export type WebhookPlatform = 'twitch' | 'facebook' | 'youtube' | 'cloudflare' | 'stripe' | 'discord' | 'custom';

export interface WebhookEventLog {
  id: string;
  timestamp: string;
  platform: WebhookPlatform;
  eventType: string;
  method: 'POST' | 'GET' | 'PUT';
  endpointUrl: string;
  status: number;
  statusText: string;
  latencyMs: number;
  requestHeaders: Record<string, string>;
  requestPayload: any;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
  mode: 'manual_test' | 'incoming' | 'automated';
  isSuccess: boolean;
  error?: string;
}

export interface WebhookTriggerConfig {
  platform: WebhookPlatform;
  eventType: string;
  endpointUrl: string;
  payload: string;
  secretKey?: string;
  headers?: Record<string, string>;
}

export interface StudioSceneState {
  sceneId?: string;
  layout: '1-cam' | 'dual' | 'screen-share' | 'picture-in-picture' | 'presentation' | 'grid' | 'gallery';
  activeParticipantIds: string[];
  activeBannerId: string | null;
  activeTickerId: string | null;
  pinnedComment: Comment | null;
  bannerPosition: BannerPosition;
  activeOverlay?: string;
  activeBackground?: string;
  activeLogo?: string;
  activeSlide?: { name: string; currentPage: number; totalPages: number } | null;
  selectedSharedSourceName?: string | null;
  showQrCode?: boolean;
  qrCodeText?: string;
  qrCodeConfig?: QrCodeConfig;
  timestamp?: number;
}

export interface QrCodeConfig {
  id?: string;
  title: string;
  subtitle?: string;
  price?: string;
  originalPrice?: string;
  discountBadge?: string;
  storeUrl: string;
  storeName?: string;
  ctaLabel?: string;
  imageUrl?: string;
  orientation: 'horizontal' | 'vertical';
  cardTheme: 'dark' | 'light' | 'brand' | 'glass' | 'neon' | 'gold';
  qrColor?: string;
  qrBgColor?: string;
  showProductImage: boolean;
  showPrice: boolean;
  showDiscountBadge: boolean;
  showStoreName: boolean;
  showScanPrompt: boolean;
  scale?: number;
  x?: number;
  y?: number;
}
