import { Destination, AudioTrack, Banner, Comment, Participant, TickerItem } from './types';

// Começa vazio. Eram quatro canais semeados ("YouTube Principal", "Facebook
// Live", "Instagram Oficial", "TikTok Live") que todo usuário novo via como
// seus, sem ter conectado nenhum.
export const INITIAL_DESTINATIONS: Destination[] = [];

export const AUDIO_LIBRARY: AudioTrack[] = [];

export const INITIAL_TICKERS: TickerItem[] = [
  { id: 'ticker-1', text: 'Campanha de Oração - ( O Senhor pelejará por ti )', badgeText: 'ALERTA' },
  { id: 'ticker-2', text: 'Sejam bem-vindos ao PwStreamer Studio! Deixe seu comentário e compartilhe a live.', badgeText: 'AVISO' },
  { id: 'ticker-3', text: 'Inscreva-se no canal para receber notificações de novas transmissões ao vivo!', badgeText: 'NOTÍCIA' }
];

export const INITIAL_BANNERS: Banner[] = [
  { 
    id: 'banner-1', 
    text: 'Multistreaming para redes sociais e plataformas personalizadas',
    subtitle: 'PwStreamer Studio Pro',
    themeColor: '#1d273b',
    accentColor: '#84cc16'
  },
  { 
    id: 'banner-2', 
    text: 'Transmissão ao Vivo em Alta Definição 1080p60 e Baixa Latência',
    subtitle: 'PwStreamer Studio Pro',
    themeColor: '#1e1b4b',
    accentColor: '#6366f1'
  }
];

export const INITIAL_COMMENTS: Comment[] = [];

export const BACKGROUND_TEMPLATES = [
  { id: 'bg-1', name: 'Deep Space', css: 'linear-gradient(135deg, #15092a 0%, #2f1160 50%, #0d061c 100%)', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80' },
  { id: 'bg-2', name: 'Cyberpunk Neon', css: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=80' },
  { id: 'bg-3', name: 'Sunset Glow', css: 'linear-gradient(135deg, #3a1c1c 0%, #5b2121 50%, #1a0808 100%)', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=80' },
  { id: 'bg-4', name: 'Retro Grid', css: 'linear-gradient(135deg, #090e21 0%, #1a224a 50%, #050711 100%)', url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80' }
];

export const OVERLAY_TEMPLATES = [
  { id: 'over-none', name: 'Sem Overlay', url: '' },
  { id: 'over-tech', name: 'Moldura Minimalista', url: 'https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png' },
  { id: 'over-webinar', name: 'Conference Border', url: 'https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png' }
];

export const LOGO_TEMPLATES = [
  { id: 'logo-1', name: 'PwStreamer Standard', url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&auto=format&fit=crop&q=80' },
  { id: 'logo-2', name: 'PwStreamer Icon', url: 'https://cdn-icons-png.flaticon.com/512/3220/3220554.png' },
  { id: 'logo-3', name: 'Live Tech Logo', url: 'https://cdn-icons-png.flaticon.com/512/4406/4406180.png' }
];

export const CHAT_BOT_RESPONSES = [
  "Incrível o conteúdo da transmissão de hoje!",
  "A tela de compartilhamento de slides está nítida demais.",
  "Estou assistindo diretamente de São Paulo!",
  "Olá, palestrante, como faço para ingressar no time de vocês?",
  "Muito bacana esse recurso de trocar as cores da live instantaneamente.",
  "Esse tema visual escuro com tons de azul e roxo está muito moderno.",
  "Parabéns pela qualidade técnica da transmissão!",
  "Estou testando a plataforma PwStreamer e achando fantástica!"
];
