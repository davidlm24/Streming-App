import { Destination, Comment } from './types';

// Começa vazio. Eram quatro canais semeados ("YouTube Principal", "Facebook
// Live", "Instagram Oficial", "TikTok Live") que todo usuário novo via como
// seus, sem ter conectado nenhum.
export const INITIAL_DESTINATIONS: Destination[] = [];

// O estúdio começa vazio. Vinham um ticker "Campanha de Oração - ( O Senhor
// pelejará por ti )", já ativo, dois banners com "1080p60 e Baixa Latência",
// que o produto não entrega, modelos de fundo, sobreposição e logo (fotos do
// Unsplash, uma imagem da Wikimedia e ícones do Flaticon) e respostas de robô
// de chat. Banners e tickers agora vêm da conta, pelo estúdio.
export const INITIAL_COMMENTS: Comment[] = [];
