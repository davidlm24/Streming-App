import type { CantoDoPalco, GeometriaDoCard } from '../types';

/**
 * As cenas do estúdio: cada uma é um layout do palco e as fontes que entram
 * nele. Só existem cenas que dá para montar com o que o estúdio tem hoje,
 * a câmera e a tela compartilhada.
 *
 * Com a câmera e a tela cabem seis composições: só uma, uma sobre a outra
 * (o card) e três divisões lado a lado (a tela maior, as duas iguais, a
 * câmera maior). Com convidados no palco (a sala, lib/sala) entra a sétima,
 * a Grade, montada na hora porque as fontes dela mudam com quem está no
 * palco.
 */

export type LayoutDoPalco = '1-cam' | 'dual' | 'screen-share' | 'camera-em-destaque' | 'picture-in-picture' | 'presentation' | 'grid' | 'gallery';

/** Os ids dos participantes que o App mantém: a câmera de quem opera e a tela compartilhada. */
export const FONTE_CAMERA = 'p-local';
export const FONTE_TELA = 'p-screen';

export interface Cena {
  id: string;
  nome: string;
  layout: LayoutDoPalco;
  fontes: string[];
}

export const CENAS: Cena[] = [
  { id: 'cena-camera', nome: 'Câmera', layout: '1-cam', fontes: [FONTE_CAMERA] },
  { id: 'cena-tela-e-camera', nome: 'Tela com câmera', layout: 'picture-in-picture', fontes: [FONTE_CAMERA, FONTE_TELA] },
  { id: 'cena-lado-a-lado', nome: 'Câmera e tela lado a lado', layout: 'screen-share', fontes: [FONTE_CAMERA, FONTE_TELA] },
  { id: 'cena-metades', nome: 'Câmera e tela iguais', layout: 'dual', fontes: [FONTE_CAMERA, FONTE_TELA] },
  { id: 'cena-camera-em-destaque', nome: 'Câmera grande e tela', layout: 'camera-em-destaque', fontes: [FONTE_CAMERA, FONTE_TELA] },
  { id: 'cena-tela', nome: 'Tela', layout: 'screen-share', fontes: [FONTE_TELA] },
];

export const CENA_INICIAL = CENAS[0];

/**
 * A grade: todos os que estão no palco (quem opera e os convidados da sala)
 * em caixas iguais, como numa chamada. Só aparece na lista com convidado no
 * palco; as fontes de verdade são montadas na hora da escolha, porque mudam
 * com quem está no palco.
 */
export const CENA_GRADE: Cena = { id: 'cena-grade', nome: 'Grade', layout: 'grid', fontes: [FONTE_CAMERA] };

export const cenaPeloId = (id: string | undefined) => (id === CENA_GRADE.id ? CENA_GRADE : CENAS.find((c) => c.id === id));

/** A cena precisa da tela compartilhada para mostrar alguma coisa. */
export const precisaDaTela = (cena: Cena) => cena.fontes.includes(FONTE_TELA);

/**
 * O card da câmera sobre a tela. A largura é uma fração da largura do palco,
 * e não px: o preview é menor que o programa, e com px o mesmo card cobria
 * 26% de um e 39% do outro, e vazava pela borda do preview.
 */
export const FORMATOS_DO_CARD = {
  rounded: { largura: 26, proporcao: 3 / 2 },
  compact: { largura: 21.6, proporcao: 20 / 13 },
  circle: { largura: 19.4, proporcao: 1 },
} as const;

/** No canto de baixo à direita, com a mesma margem à vista dos dois lados. */
export const CARD_PADRAO: GeometriaDoCard = { x: 71, y: 64, escala: 1, formato: 'rounded' };

export const layoutUsaCard = (layout: LayoutDoPalco) => layout === 'picture-in-picture' || layout === 'presentation';

/** A largura e a altura do card, em % do palco (16:9). */
export function medidasDoCard(card: GeometriaDoCard) {
  const formato = FORMATOS_DO_CARD[card.formato];
  const largura = formato.largura * card.escala;
  return { largura, altura: (largura * 16) / 9 / formato.proporcao };
}

// A margem do card nos cantos, a mesma à vista dos dois lados: 3% da largura, 5,33% da altura (16:9)
const MARGEM_X = 3;
const MARGEM_Y = (3 * 16) / 9;

/** Onde o canto do card fica, pelo tamanho que ele tem agora. */
export function lugarDoCanto(card: GeometriaDoCard, canto: CantoDoPalco): { x: number; y: number } {
  const { largura, altura } = medidasDoCard(card);
  return {
    x: canto.endsWith('esquerda') ? MARGEM_X : 100 - largura - MARGEM_X,
    y: canto.startsWith('cima') ? MARGEM_Y : 100 - altura - MARGEM_Y,
  };
}

/** Em que canto o card está, ou null se ele está solto no palco. */
export function cantoDoCard(card: GeometriaDoCard): CantoDoPalco | null {
  const cantos: CantoDoPalco[] = ['cima-esquerda', 'cima-direita', 'baixo-esquerda', 'baixo-direita'];
  return (
    cantos.find((canto) => {
      const lugar = lugarDoCanto(card, canto);
      return Math.abs(lugar.x - card.x) < 0.5 && Math.abs(lugar.y - card.y) < 0.5;
    }) ?? null
  );
}

/** O card inteiro dentro do palco, qualquer que seja o ajuste que o levou para fora. */
export function dentroDoPalco(card: GeometriaDoCard): GeometriaDoCard {
  const { largura, altura } = medidasDoCard(card);
  return {
    ...card,
    x: Math.max(0, Math.min(100 - largura, card.x)),
    y: Math.max(0, Math.min(100 - altura, card.y)),
  };
}

/** O que muda no card do programa ao preview, em palavras; null se nada muda. */
export function mudancaNoCard(de: GeometriaDoCard, para: GeometriaDoCard): string | null {
  const partes: string[] = [];
  if (Math.round(de.x) !== Math.round(para.x) || Math.round(de.y) !== Math.round(para.y)) partes.push('posição');
  if (Math.abs(de.escala - para.escala) > 0.001) partes.push('tamanho');
  if (de.formato !== para.formato) partes.push('formato');
  const ultima = partes.pop();
  if (!ultima) return null;
  return partes.length > 0 ? `${partes.join(', ')} e ${ultima}` : ultima;
}

// As chaves são as de antes, que a barra lateral também lê.
export function lerCardSalvo(): GeometriaDoCard {
  try {
    const pos = JSON.parse(localStorage.getItem('pw_speaker_pip_pos') || 'null');
    const escala = parseFloat(localStorage.getItem('pw_speaker_pip_scale') || '');
    const formato = localStorage.getItem('pw_speaker_pip_shape');
    return dentroDoPalco({
      x: typeof pos?.x === 'number' ? pos.x : CARD_PADRAO.x,
      y: typeof pos?.y === 'number' ? pos.y : CARD_PADRAO.y,
      escala: escala >= 0.6 && escala <= 1.8 ? escala : CARD_PADRAO.escala,
      formato: formato === 'rounded' || formato === 'circle' || formato === 'compact' ? formato : CARD_PADRAO.formato,
    });
  } catch {
    return CARD_PADRAO;
  }
}

export function salvarCard(card: GeometriaDoCard) {
  try {
    localStorage.setItem('pw_speaker_pip_pos', JSON.stringify({ x: card.x, y: card.y }));
    localStorage.setItem('pw_speaker_pip_scale', String(card.escala));
    localStorage.setItem('pw_speaker_pip_shape', card.formato);
  } catch {
    // Sem armazenamento, o card volta ao padrão na próxima visita.
  }
}
