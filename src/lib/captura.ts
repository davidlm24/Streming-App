/**
 * Como a câmera e o microfone são captados: a resolução e os quadros por
 * segundo pedidos à câmera, e o processamento que o navegador faz no som do
 * microfone. São pedidos, não garantias: cada aparelho entrega o que pode, e
 * o estúdio mostra o que veio (`lerCaptura`), não o que pediu.
 */

export type Resolucao = '720p' | '1080p';
export type QuadrosPorSegundo = '30' | '60';

export interface AjustesDaCaptura {
  resolucao: Resolucao;
  quadros: QuadrosPorSegundo;
  reducaoDeRuido: boolean;
  cancelamentoDeEco: boolean;
  ganhoAutomatico: boolean;
}

/** O que o navegador liga sozinho no microfone, e o 720p que o estúdio sempre pediu. */
export const CAPTURA_PADRAO: AjustesDaCaptura = {
  resolucao: '720p',
  quadros: '30',
  reducaoDeRuido: true,
  cancelamentoDeEco: true,
  ganhoAutomatico: true,
};

const MEDIDAS: Record<Resolucao, { width: number; height: number }> = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
};

/** Um ajuste salvo em outra versão volta ao padrão no que não reconhece. */
export function capturaValida(salvo: Partial<AjustesDaCaptura>): AjustesDaCaptura {
  return {
    resolucao: salvo.resolucao === '1080p' ? '1080p' : '720p',
    quadros: salvo.quadros === '60' ? '60' : '30',
    reducaoDeRuido: salvo.reducaoDeRuido !== false,
    cancelamentoDeEco: salvo.cancelamentoDeEco !== false,
    ganhoAutomatico: salvo.ganhoAutomatico !== false,
  };
}

/** O vídeo pedido à câmera: `ideal`, para um aparelho que não chega lá entregar o mais perto. */
export function restricoesDeVideo(ajustes: AjustesDaCaptura, aparelho?: string): MediaTrackConstraints {
  const { width, height } = MEDIDAS[ajustes.resolucao];
  return {
    width: { ideal: width },
    height: { ideal: height },
    frameRate: { ideal: Number(ajustes.quadros) },
    ...(aparelho ? { deviceId: { exact: aparelho } } : {}),
  };
}

export function restricoesDeAudio(ajustes: AjustesDaCaptura, aparelho?: string): MediaTrackConstraints {
  return {
    noiseSuppression: ajustes.reducaoDeRuido,
    echoCancellation: ajustes.cancelamentoDeEco,
    autoGainControl: ajustes.ganhoAutomatico,
    ...(aparelho ? { deviceId: { exact: aparelho } } : {}),
  };
}

/** O que a câmera e o microfone estão entregando agora, lido das trilhas. */
export interface LeituraDaCaptura {
  camera: { nome: string; largura?: number; altura?: number; quadros?: number } | null;
  microfone: { nome: string; reducaoDeRuido?: boolean; cancelamentoDeEco?: boolean; ganhoAutomatico?: boolean } | null;
}

export function lerCaptura(stream: MediaStream | null): LeituraDaCaptura {
  // Uma trilha encerrada (o aparelho saiu, ou um ajuste não voltou) não entrega nada
  const viva = (t: MediaStreamTrack | undefined) => (t?.readyState === 'live' ? t : undefined);
  const video = viva(stream?.getVideoTracks()[0]);
  const audio = viva(stream?.getAudioTracks()[0]);
  const v = video?.getSettings();
  const a = audio?.getSettings();
  return {
    camera: video ? { nome: video.label, largura: v?.width, altura: v?.height, quadros: v?.frameRate } : null,
    microfone: audio
      ? { nome: audio.label, reducaoDeRuido: a?.noiseSuppression, cancelamentoDeEco: a?.echoCancellation, ganhoAutomatico: a?.autoGainControl }
      : null,
  };
}

/** "1280 × 720 a 30 quadros por segundo", ou o que der para dizer. */
export function fraseDaCamera(camera: LeituraDaCaptura['camera']): string | null {
  if (!camera?.largura || !camera.altura) return null;
  const quadros = camera.quadros ? ` a ${Math.round(camera.quadros)} quadros por segundo` : '';
  return `${camera.largura} × ${camera.altura}${quadros}`;
}
