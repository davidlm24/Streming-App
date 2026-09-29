import { Destination, AudioTrack, Banner, Comment, Participant, TickerItem } from './types';

// Começa vazio. Eram quatro canais semeados ("YouTube Principal", "Facebook
// Live", "Instagram Oficial", "TikTok Live") que todo usuário novo via como
// seus, sem ter conectado nenhum.
export const INITIAL_DESTINATIONS: Destination[] = [];

export const AUDIO_LIBRARY: AudioTrack[] = [];

// O estúdio começa vazio. Vinham um ticker "Campanha de Oração - ( O Senhor
// pelejará por ti )", já ativo, e dois banners com "1080p60 e Baixa
// Latência", que o produto não entrega.
export const INITIAL_TICKERS: TickerItem[] = [];

export const INITIAL_BANNERS: Banner[] = [];

export const INITIAL_COMMENTS: Comment[] = [];

// Sem modelos de fundo, sobreposição e logo: eram fotos do Unsplash, uma
// imagem de demonstração da Wikimedia repetida duas vezes e ícones do
// Flaticon, oferecidos como se fossem da marca de quem transmite. As
// respostas de robô de chat que ficavam aqui também saíram.
export const BACKGROUND_TEMPLATES: { id: string; name: string; css: string; url: string }[] = [];

export const OVERLAY_TEMPLATES: { id: string; name: string; url: string }[] = [];

export const LOGO_TEMPLATES: { id: string; name: string; url: string }[] = [];
