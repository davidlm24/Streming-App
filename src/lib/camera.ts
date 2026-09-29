/**
 * Os ajustes da câmera: enquadramento, espelho e croma. São da fonte, como o
 * aparelho escolhido: valem no preview e no programa ao mesmo tempo, sem
 * corte (DESIGN.md, Regra do Preview Fiel).
 */
export interface AjustesDaCamera {
  /** 1 a 2,5. */
  zoom: number;
  /** Deslocamento do quadro em % da largura e da altura, dentro do que o zoom permite. */
  x: number;
  y: number;
  espelhar: boolean;
  croma: AjustesDoCroma;
}

export interface AjustesDoCroma {
  ligado: boolean;
  cor: 'verde' | 'azul';
  /** 0 a 100: quanto da cor de fundo sai. */
  tolerancia: number;
  /** 0 a 100: o quanto a borda do recorte se desfaz. */
  suavizacao: number;
  /** 0 a 100: quanto do reflexo verde (ou azul) sai da pele e da roupa. */
  descarte: number;
}

export const AJUSTES_PADRAO: AjustesDaCamera = {
  zoom: 1,
  x: 0,
  y: 0,
  espelhar: false,
  croma: { ligado: false, cor: 'verde', tolerancia: 40, suavizacao: 20, descarte: 30 },
};

export const ZOOM_MINIMO = 1;
export const ZOOM_MAXIMO = 2.5;

/**
 * Até onde o quadro anda com este zoom, em % da largura (ou da altura) para
 * cada lado: a imagem ampliada passa (zoom − 1) ÷ 2 da borda de cada lado.
 * Com zoom 1 não sobra imagem, então não anda: antes ±100% tirava a câmera
 * do quadro inteiro.
 */
export const deslocamentoMaximo = (zoom: number) => Math.round(((zoom - 1) / 2) * 100);

/** O ajuste com o deslocamento dentro do que o zoom permite. */
export function dentroDoQuadro(ajustes: AjustesDaCamera): AjustesDaCamera {
  const limite = deslocamentoMaximo(ajustes.zoom);
  const prender = (v: number) => Math.max(-limite, Math.min(limite, v));
  return { ...ajustes, x: prender(ajustes.x), y: prender(ajustes.y) };
}

/**
 * A transformação do vídeo da câmera. O deslocamento vem antes do espelho,
 * para "direita" ser direita na imagem espelhada também, e é dividido pelo
 * zoom, para o mesmo valor andar a mesma parte do quadro em qualquer zoom.
 */
export function transformacaoDaCamera(a: AjustesDaCamera): string {
  const x = a.zoom > 1 ? -a.x / a.zoom : 0;
  const y = a.zoom > 1 ? -a.y / a.zoom : 0;
  return `scale(${a.zoom}) translate(${x}%, ${y}%) scaleX(${a.espelhar ? -1 : 1})`;
}

/**
 * A matriz que tira a cor de fundo: o alfa cai onde o canal da chave domina
 * os outros dois. Aplicada à imagem original, antes de qualquer correção de
 * cor. Antes o descarte de reflexo vinha primeiro e já tirava parte do verde
 * da chave: num verde comum, o fundo ficava com cerca de 40% de opacidade.
 */
export function matrizDaChave(croma: AjustesDoCroma): string {
  const t = (croma.tolerancia / 100) * 4;
  const [ar, ag, ab] = croma.cor === 'verde' ? [t, -2 * t, t] : [t, t, -2 * t];
  const ac = 2 - (croma.tolerancia / 100) * 1.5;
  return `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  ${ar} ${ag} ${ab} 0 ${ac}`;
}

/** A matriz que tira o reflexo da cor da chave do que ficou, sem mexer no alfa. */
export function matrizDoDescarte(croma: AjustesDoCroma): string {
  const s = croma.descarte / 100;
  if (croma.cor === 'verde') {
    return `1 0 0 0 0  ${s * 0.5} ${1 - s} ${s * 0.5} 0 0  0 0 1 0 0  0 0 0 1 0`;
  }
  return `1 0 0 0 0  0 1 0 0 0  ${s * 0.5} ${s * 0.5} ${1 - s} 0 0  0 0 0 1 0`;
}

/**
 * A suavização da borda em px do monitor: uma fração da largura do palco,
 * para a borda se desfazer igual no preview e no programa.
 */
export const suavizacaoEmPx = (croma: AjustesDoCroma, larguraDoPalco: number) =>
  (croma.suavizacao / 100) * 0.005 * larguraDoPalco;
