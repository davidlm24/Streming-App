import type {
  CantoDoPalco,
  GraficosDoPalco,
  LogoNoPalco,
  QrNoPalco,
  StudioSceneState,
  TickerNoPalco,
} from '../types';
import { CARD_PADRAO, cenaPeloId, layoutUsaCard, mudancaNoCard } from './cenas';

/** A cor dos gráficos de quem ainda não escolheu: neutra, porque no estúdio o vermelho é do ar. */
export const COR_PADRAO = '#202429';

/** Cores prontas para os gráficos. Qualquer outra entra pelo seletor. */
export const CORES_DOS_GRAFICOS = [
  { cor: '#202429', nome: 'Grafite' },
  { cor: '#FFFFFF', nome: 'Branco' },
  { cor: '#1F6FEB', nome: 'Azul' },
  { cor: '#0F9D58', nome: 'Verde' },
  { cor: '#F4B400', nome: 'Amarelo' },
  { cor: '#7C3AED', nome: 'Roxo' },
] as const;

export const graficosVazios = (cor: string = COR_PADRAO): GraficosDoPalco => ({
  cor,
  logo: null,
  banner: null,
  ticker: null,
  qr: null,
  cronometro: null,
});

export const LOGO_PADRAO: Omit<LogoNoPalco, 'url'> = { canto: 'cima-direita', tamanho: 12, opacidade: 1 };
// Em cima à esquerda: o canto que o card da câmera (embaixo à direita), o logo
// (em cima à direita) e o banner (embaixo à esquerda) deixam livre
export const QR_PADRAO: Omit<QrNoPalco, 'url' | 'titulo' | 'preco'> = { canto: 'cima-esquerda', tamanho: 14 };

export const CANTOS: { valor: CantoDoPalco; rotulo: string }[] = [
  { valor: 'cima-esquerda', rotulo: 'Em cima, à esquerda' },
  { valor: 'cima-direita', rotulo: 'Em cima, à direita' },
  { valor: 'baixo-esquerda', rotulo: 'Embaixo, à esquerda' },
  { valor: 'baixo-direita', rotulo: 'Embaixo, à direita' },
];

/**
 * Quanto tempo o ticker leva para atravessar o palco, em segundos. Cresce
 * com o texto, para a leitura ter o mesmo ritmo em frases curtas e longas, e
 * não depende do tamanho do monitor: o preview e o programa andam igual.
 */
export function duracaoDoTicker(ticker: TickerNoPalco): number {
  const fator = { lenta: 1.5, normal: 1, rapida: 0.65 }[ticker.velocidade];
  return Math.round((12 + ticker.texto.length * 0.22) * fator);
}

/**
 * O relógio do cronômetro: um só, que anda nos dois monitores. Parado, guarda
 * o que resta; andando, guarda a hora em que acaba, e o resto sai da conta
 * com o relógio do sistema. Antes a contagem descia 1 a cada setInterval de
 * 1 s e atrasava.
 */
export interface RelogioDoCronometro {
  /** Em segundos. */
  duracao: number;
  /** Em ms desde a época, enquanto anda; null parado. */
  fimEm: number | null;
  /** Em segundos, enquanto parado. */
  restante: number;
}

export const relogioParado = (duracao: number): RelogioDoCronometro => ({ duracao, fimEm: null, restante: duracao });

export const restanteDoRelogio = (r: RelogioDoCronometro, agora = Date.now()) =>
  r.fimEm !== null ? Math.max(0, (r.fimEm - agora) / 1000) : r.restante;

/** "5:00", "12:34" ou "1:02:03". */
export function formatarTempo(segundos: number): string {
  const s = Math.max(0, Math.ceil(segundos));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Preto ou branco, o que se lê melhor sobre a cor (luminância relativa da WCAG). */
export function corDoTextoSobre(cor: string): '#0B0D10' | '#FFFFFF' {
  const hex = cor.replace('#', '');
  const cheio = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex.padEnd(6, '0');
  const canal = (i: number) => {
    const v = parseInt(cheio.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const l = 0.2126 * canal(0) + 0.7152 * canal(2) + 0.0722 * canal(4);
  // O branco ganha até a luminância em que o preto passa a ter mais contraste
  return l > 0.179 ? '#0B0D10' : '#FFFFFF';
}

/**
 * O link do QR code, pronto para o celular abrir: sem esquema, ganha
 * https://. Devolve null se não for um endereço da web. Antes o link vazio
 * virava https://pwstreamer.com no QR.
 */
export function normalizarLink(texto: string): string | null {
  const t = texto.trim();
  if (!t) return null;
  const comEsquema = /^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(comEsquema);
    return (u.protocol === 'https:' || u.protocol === 'http:') && u.hostname.includes('.') ? u.toString() : null;
  } catch {
    return null;
  }
}

/** "a", "a e b", "a, b e c". */
export function juntar(partes: string[]): string {
  if (partes.length <= 1) return partes[0] ?? '';
  return `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`;
}

const mesma = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** O começo de um texto longo (o do ticker), cortado entre palavras, para caber na lista. */
function resumo(texto: string, max = 40): string {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max - 1);
  const espaco = corte.lastIndexOf(' ');
  return `${(espaco > max / 2 ? corte.slice(0, espaco) : corte).replace(/[\s,.;:]+$/, '')}…`;
}

/**
 * Entra, sai, troca ou muda: a frase de um gráfico que existe num monitor, no
 * outro ou nos dois. `troca` diz se o preview traz outro item no lugar (outro
 * banner, outro clipe, outra imagem) e devolve o nome dele, ou '' quando não
 * há nome curto; `partes` diz o que muda no mesmo item. Antes a troca de um
 * banner inteiro aparecia como "Banner: texto".
 */
function frase<T>(
  nome: string,
  artigo: 'o' | 'a',
  de: T | null,
  para: T | null,
  {
    nomeAoEntrar,
    troca,
    partes = () => [],
  }: {
    nomeAoEntrar?: (item: T) => string;
    troca?: (de: T, para: T) => string | null;
    partes?: (de: T, para: T) => string[];
  },
): string | null {
  if (!de && !para) return null;
  if (!de) {
    const qual = nomeAoEntrar?.(para as T);
    return qual ? `Entra ${artigo} ${nome}: ${qual}` : `Entra ${artigo} ${nome}`;
  }
  if (!para) return `Sai ${artigo} ${nome}`;
  const outro = troca?.(de, para) ?? null;
  if (outro !== null) return outro ? `Troca ${artigo} ${nome}: ${outro}` : `Troca ${artigo} ${nome}`;
  const mudou = partes(de, para);
  if (mudou.length === 0) return null;
  return `${nome[0].toUpperCase()}${nome.slice(1)}: ${juntar(mudou)}`;
}

/**
 * O que o próximo corte leva do preview ao programa, em palavras. Cada
 * gráfico diz se entra, se sai ou o que muda nele. É a lista de "No próximo
 * corte", e é por ela que Corte e Fusão se acendem.
 */
export function mudancasNoCorte(programa: StudioSceneState, preview: StudioSceneState): string[] {
  const mudancas: string[] = [];

  if (preview.sceneId !== programa.sceneId) {
    mudancas.push(`Cena: ${cenaPeloId(preview.sceneId)?.nome ?? preview.sceneId ?? ''}`);
  } else if (!mesma([...preview.activeParticipantIds].sort(), [...programa.activeParticipantIds].sort())) {
    mudancas.push('Fontes em cena');
  }

  // O card só conta quando o programa e o preview são cenas com card
  if (layoutUsaCard(preview.layout) && layoutUsaCard(programa.layout)) {
    const mudanca = mudancaNoCard(programa.cardDaCamera ?? CARD_PADRAO, preview.cardDaCamera ?? CARD_PADRAO);
    if (mudanca) mudancas.push(`Card da câmera: ${mudanca}`);
  }

  const clipe = frase('clipe', 'o', programa.clipe, preview.clipe, {
    nomeAoEntrar: (c) => c.nome,
    troca: (de, para) => (de.id !== para.id ? para.nome : null),
  });
  if (clipe) mudancas.push(clipe);

  const fundo = frase('fundo', 'o', programa.activeBackground || null, preview.activeBackground || null, {
    troca: (de, para) => (de !== para ? '' : null),
  });
  if (fundo) mudancas.push(fundo);

  const sobreposicao = frase('sobreposição', 'a', programa.activeOverlay || null, preview.activeOverlay || null, {
    troca: (de, para) => (de !== para ? '' : null),
  });
  if (sobreposicao) mudancas.push(sobreposicao);

  const g = preview.graficos;
  const p = programa.graficos;

  const logo = frase('logo', 'o', p.logo, g.logo, {
    troca: (de, para) => (de.url !== para.url ? '' : null),
    partes: (de, para) => {
      const partes: string[] = [];
      if (de.canto !== para.canto) partes.push('canto');
      if (de.tamanho !== para.tamanho) partes.push('tamanho');
      if (de.opacidade !== para.opacidade) partes.push('opacidade');
      return partes;
    },
  });
  if (logo) mudancas.push(logo);

  const banner = frase('banner', 'o', p.banner, g.banner, {
    nomeAoEntrar: (b) => b.titulo,
    troca: (de, para) => (de.id !== para.id ? para.titulo : null),
    partes: (de, para) => {
      const partes: string[] = [];
      if (de.titulo !== para.titulo || de.subtitulo !== para.subtitulo) partes.push('texto');
      if (de.posicao !== para.posicao) partes.push('posição');
      return partes;
    },
  });
  if (banner) mudancas.push(banner);

  const ticker = frase('ticker', 'o', p.ticker, g.ticker, {
    nomeAoEntrar: (t) => resumo(t.texto),
    troca: (de, para) => (de.id !== para.id ? resumo(para.texto) : null),
    partes: (de, para) => {
      const partes: string[] = [];
      if (de.texto !== para.texto || de.selo !== para.selo) partes.push('texto');
      if (de.velocidade !== para.velocidade) partes.push('velocidade');
      if (de.direcao !== para.direcao) partes.push('direção');
      return partes;
    },
  });
  if (ticker) mudancas.push(ticker);

  const qr = frase('QR code', 'o', p.qr, g.qr, {
    partes: (de, para) => {
      const partes: string[] = [];
      if (de.url !== para.url) partes.push('link');
      if (de.titulo !== para.titulo) partes.push('título');
      if (de.preco !== para.preco) partes.push('preço');
      if (de.canto !== para.canto) partes.push('canto');
      if (de.tamanho !== para.tamanho) partes.push('tamanho');
      return partes;
    },
  });
  if (qr) mudancas.push(qr);

  const cronometro = frase('cronômetro', 'o', p.cronometro, g.cronometro, {
    partes: (de, para) => (de.titulo !== para.titulo ? ['título'] : []),
  });
  if (cronometro) mudancas.push(cronometro);

  const comentario = frase('comentário fixado', 'o', programa.pinnedComment, preview.pinnedComment, {
    troca: (de, para) => (de.id !== para.id ? '' : null),
  });
  if (comentario) mudancas.push(comentario);

  // A cor só conta quando há, no preview, algo desenhado com ela
  const usaCor = !!(g.banner || g.ticker || g.qr || g.cronometro || layoutUsaCard(preview.layout));
  if (usaCor && p.cor.toLowerCase() !== g.cor.toLowerCase()) mudancas.push('Cor dos gráficos');

  return mudancas;
}
