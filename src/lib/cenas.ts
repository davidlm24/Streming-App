import type { GeometriaDoCard } from '../types';

/**
 * As cenas do estúdio: cada uma é um layout do palco e as fontes que entram
 * nele. Só existem cenas que dá para montar com o que o estúdio tem hoje,
 * a câmera e a tela compartilhada.
 *
 * Eram cinco, em ScenesPanel, e nenhuma podia ser escolhida em lugar nenhum.
 * "Entrevista Duo" dependia de um convidado que não existe, e "Abertura" só
 * se diferenciava por uma foto do Unsplash e um banner de boas-vindas que o
 * estúdio não traz mais. Voltam quando houver convidados de verdade.
 */

export type LayoutDoPalco = '1-cam' | 'dual' | 'screen-share' | 'picture-in-picture' | 'presentation' | 'grid' | 'gallery';

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
  { id: 'cena-tela', nome: 'Tela', layout: 'screen-share', fontes: [FONTE_TELA] },
];

export const CENA_INICIAL = CENAS[0];

export const cenaPeloId = (id: string | undefined) => CENAS.find((c) => c.id === id);

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
