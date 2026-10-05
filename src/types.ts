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

/** Um ticker da lista do estúdio. A velocidade e o sentido são do estúdio e vão ao programa no corte. */
export interface TickerItem {
  id: string;
  text: string;
  badgeText?: string;
}

/**
 * Um banner da lista do estúdio: título e subtítulo. O desenho é um só, com a
 * cor dos gráficos; saíram as cores próprias de cada banner (o tema "OneStream
 * Green" era o padrão) e a posição e a escala que cada monitor guardava.
 */
export interface Banner {
  id: string;
  text: string;
  subtitle?: string;
}

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

/**
 * Onde e como o card da câmera fica sobre a tela, nas cenas com card: o canto
 * de cima à esquerda em % do palco, a escala e o formato. Vai ao programa no
 * corte, como o resto da cena.
 */
export interface GeometriaDoCard {
  x: number;
  y: number;
  escala: number;
  formato: 'rounded' | 'circle' | 'compact';
}

/** Um canto do palco, para os gráficos que moram num canto: o logo e o QR code. */
export type CantoDoPalco = 'cima-esquerda' | 'cima-direita' | 'baixo-esquerda' | 'baixo-direita';

/** O logo no palco. O tamanho é a largura em % do palco; a opacidade vai de 0,2 a 1. */
export interface LogoNoPalco {
  url: string;
  canto: CantoDoPalco;
  tamanho: number;
  opacidade: number;
}

/** O banner no palco: o texto dele, e não o id, para editar a lista não mudar o programa. */
export interface BannerNoPalco {
  /** De que banner da lista veio: só para os painéis dizerem onde ele está. O desenho usa o texto. */
  id?: string;
  titulo: string;
  subtitulo: string;
  posicao: 'embaixo' | 'em-cima';
}

export interface TickerNoPalco {
  /** De que ticker da lista veio: só para os painéis dizerem onde ele está. */
  id?: string;
  texto: string;
  selo: string;
  velocidade: 'lenta' | 'normal' | 'rapida';
  direcao: 'esquerda' | 'direita';
}

/** O QR code no palco, com título e preço opcionais. O tamanho é a largura do QR em % do palco. */
export interface QrNoPalco {
  url: string;
  titulo: string;
  preco: string;
  canto: CantoDoPalco;
  tamanho: number;
}

/** O cronômetro no palco. O relógio é um só e anda nos dois monitores; o corte leva o cronômetro e o título. */
export interface CronometroNoPalco {
  titulo: string;
}

/** Um clipe de vídeo no lugar da tela: parado no preview, tocando no programa a partir do corte. */
export interface ClipeNoPalco {
  id: string;
  nome: string;
  url: string;
}

/** Os gráficos de um monitor. Tudo aqui vai ao programa no corte, e só no corte. */
export interface GraficosDoPalco {
  /** A cor dos gráficos: a borda do card da câmera, o subtítulo do banner, o selo do ticker e o cronômetro. */
  cor: string;
  logo: LogoNoPalco | null;
  banner: BannerNoPalco | null;
  ticker: TickerNoPalco | null;
  qr: QrNoPalco | null;
  cronometro: CronometroNoPalco | null;
}

/**
 * O que um monitor mostra. O preview mostra o estado em edição e o programa,
 * o do último corte: os dois são desenhados pelo mesmo compositor a partir
 * deste estado. Antes o corte levava ids (do banner, do ticker) e o programa
 * buscava o conteúdo atual por eles, então editar a lista mudava o programa
 * sem corte.
 */
export interface StudioSceneState {
  sceneId?: string;
  layout: '1-cam' | 'dual' | 'screen-share' | 'picture-in-picture' | 'presentation' | 'grid' | 'gallery';
  activeParticipantIds: string[];
  cardDaCamera?: GeometriaDoCard;
  activeBackground?: string;
  activeOverlay?: string;
  pinnedComment: Comment | null;
  graficos: GraficosDoPalco;
  clipe: ClipeNoPalco | null;
}
