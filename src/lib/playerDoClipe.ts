import type { ClipeNoPalco, StudioSceneState } from '../types';
import { FONTE_TELA } from './cenas';

/**
 * O clipe do programa toca num elemento de vídeo só, criado no corte que o
 * põe no programa e solto no corte que o tira. O compositor desenha os
 * quadros desse elemento na caixa da tela, e trocar de cena só muda a caixa. Antes o
 * `<video>` vivia dentro do desenho de cada cena, e o corte que mudava o
 * formato da cena o recriava: o clipe voltava ao começo.
 */
export interface PlayerDoClipe {
  id: string;
  video: HTMLVideoElement;
  /** O programa mostra o clipe e ele deve estar tocando (não numa cena sem tela, não no fim). */
  tocando: boolean;
  /** O navegador recusou o `play()`: o clipe fica parado até alguém mandar tocar. */
  bloqueado: boolean;
}

/** O que a Mídia diz do clipe do programa, além de onde ele está. */
export type SituacaoDoClipe = 'tocando' | 'pausado' | 'no fim' | 'bloqueado';

/** Os eventos do vídeo que mudam a situação (voltar ao começo tira o "no fim"); `bloqueado` é disparado aqui. */
export const EVENTOS_DO_PLAYER = ['play', 'pause', 'ended', 'seeked', 'bloqueado'] as const;

export function criarPlayer(clipe: ClipeNoPalco): PlayerDoClipe {
  const video = document.createElement('video');
  video.src = clipe.url;
  video.playsInline = true;
  video.preload = 'auto';
  video.style.cssText = 'display:block;width:100%;height:100%;object-fit:contain';
  const player: PlayerDoClipe = { id: clipe.id, video, tocando: false, bloqueado: false };
  // No fim, o clipe fica no último quadro: nada o manda tocar de novo sozinho.
  // Sem isso, uma caixa remontada (a janela passando do desktop ao celular)
  // via "tocando e pausado" e o recomeçava do zero, com som.
  video.addEventListener('ended', () => {
    player.tocando = false;
  });
  return player;
}

export function soltarPlayer(player: PlayerDoClipe) {
  player.tocando = false;
  player.video.pause();
  player.video.remove();
  player.video.removeAttribute('src');
  player.video.load();
}

/** O programa desenha a tela (e o clipe no lugar dela): Tela com câmera, lado a lado e Tela, mas não Câmera. */
export const desenhaATela = (estado: StudioSceneState) => estado.activeParticipantIds.includes(FONTE_TELA);

/** Manda tocar; se o navegador recusar, o clipe fica parado e a Mídia diz por quê. */
export function tocar(player: PlayerDoClipe) {
  player.tocando = true;
  player.bloqueado = false;
  void player.video.play().catch(() => {
    player.tocando = false;
    player.bloqueado = true;
    player.video.dispatchEvent(new Event('bloqueado'));
  });
}

/**
 * Toca ou pausa o clipe conforme o programa. Chamado no clique do corte, em
 * que o navegador deixa tocar com som. Numa cena sem tela, pausa e espera a
 * volta; no fim do clipe, fica no último quadro.
 */
export function ajustarPlayer(player: PlayerDoClipe, programa: StudioSceneState) {
  if (desenhaATela(programa) && !player.video.ended) tocar(player);
  else {
    // Parado de propósito, a recusa anterior do navegador não vale mais
    player.tocando = false;
    player.bloqueado = false;
    player.video.pause();
  }
}

/** Numa cena sem tela o clipe está pausado, mesmo que o navegador tenha recusado tocar antes. */
export function situacaoDoClipe(player: PlayerDoClipe, programa: StudioSceneState): SituacaoDoClipe {
  if (player.video.ended) return 'no fim';
  if (!desenhaATela(programa)) return 'pausado';
  if (player.bloqueado) return 'bloqueado';
  return player.video.paused ? 'pausado' : 'tocando';
}
