/**
 * As medidas do palco em vídeo: 1280 × 720 a 30 qps (a decisão da etapa 1;
 * 1080p vem depois, atrás de um seletor). O CSS do palco mede os gráficos em
 * fração do palco (cqw/cqh); aqui a mesma fração vira px do canvas, para o
 * vídeo composto e os monitores HTML mostrarem a mesma imagem.
 */

export const LARGURA_DO_PALCO = 1280;
export const ALTURA_DO_PALCO = 720;
export const QPS_DO_PALCO = 30;

/** 1 cqw do CSS do palco, em px do canvas. */
export const umCqw = LARGURA_DO_PALCO / 100;
/** 1 cqh do CSS do palco, em px do canvas. */
export const umCqh = ALTURA_DO_PALCO / 100;

/**
 * O CSS fixa borda e raio do card em px, desenhados num monitor de ~640 de
 * largura; o canvas tem o dobro disso, então cada px fixo dobra.
 */
export const ESCALA_DE_PX_FIXO = LARGURA_DO_PALCO / 640;

/** Os tokens que o canvas não lê do CSS (o console, escuro sempre). */
export const TINTAS_DO_PALCO = {
  palco: '#000000',
  raise: '#161D29',
  inkHi: '#F0F5F9',
  ink: '#D9E1EA',
  inkLo: '#A2ACB7',
  fundoDeGrafico: 'rgb(11 13 16 / 0.92)',
  textoDeGrafico: 'rgb(255 255 255)',
  textoDeGrafico2: 'rgb(255 255 255 / 0.78)',
} as const;

export interface Caixa {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A fonte dos gráficos: a mesma Inter do palco HTML (`--font-sans`); a Poppins é só do logotipo. */
export const fonteDoPalco = (px: number, peso = 400) => `${peso} ${Math.round(px)}px Inter, system-ui, sans-serif`;

/** O recorte da origem para object-fit: cover numa caixa w × h. */
export function recorteDeCapa(nw: number, nh: number, w: number, h: number) {
  const escala = Math.max(w / nw, h / nh);
  return { sx: (nw - w / escala) / 2, sy: (nh - h / escala) / 2, sw: w / escala, sh: h / escala };
}

/** A caixa de object-fit: contain dentro de outra, centrada. */
export function caixaContida(nw: number, nh: number, dentro: Caixa): Caixa {
  const escala = Math.min(dentro.w / nw, dentro.h / nh);
  const w = nw * escala;
  const h = nh * escala;
  return { x: dentro.x + (dentro.w - w) / 2, y: dentro.y + (dentro.h - h) / 2, w, h };
}

/**
 * Onde cada fonte fica quando câmera e tela dividem o palco. As margens e o
 * vão são 1,6% da largura (o p-[1.6%] e o gap-[1.6%] do palco HTML), e a
 * fonte menor fica em 16:9, centrada na altura — as contas do StudioPreview.
 */
export function caixasDaDivisao(divisao: 'metades' | 'maior-e-menor'): { primeira: Caixa; segunda: Caixa } {
  const m = 1.6 * umCqw;
  const util = LARGURA_DO_PALCO - 3 * m;
  if (divisao === 'metades') {
    const w = util / 2;
    const h = (w * 9) / 16;
    const y = (ALTURA_DO_PALCO - h) / 2;
    return { primeira: { x: m, y, w, h }, segunda: { x: m + w + m, y, w, h } };
  }
  const maior = util * 0.75;
  const menor = util - maior;
  const hMenor = (menor * 9) / 16;
  return {
    primeira: { x: m, y: m, w: maior, h: ALTURA_DO_PALCO - 2 * m },
    segunda: { x: m + maior + m, y: (ALTURA_DO_PALCO - hMenor) / 2, w: menor, h: hMenor },
  };
}

/** Quebra um texto em linhas que cabem em maxW, com a fonte já posta no contexto. */
export function quebrarLinhas(ctx: CanvasRenderingContext2D, texto: string, maxW: number): string[] {
  const palavras = texto.split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return [];
  const linhas: string[] = [];
  let atual = '';
  for (const palavra of palavras) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra;
    if (!atual || ctx.measureText(tentativa).width <= maxW) atual = tentativa;
    else {
      linhas.push(atual);
      atual = palavra;
    }
  }
  linhas.push(atual);
  return linhas;
}
