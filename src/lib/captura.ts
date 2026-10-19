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

// ── Pedir os aparelhos sem perder um pelo outro ─────────────────────────────
// Um pedido de vídeo e áudio juntos falha inteiro se UM dos dois falha: quem
// não tem webcam (ou a deixou presa em outro programa) ficava também sem
// microfone. Aqui, se o par falha, cada aparelho é pedido sozinho, e cada
// falha guarda o motivo, para a frase dizer o conserto certo.

/** Por que um aparelho não veio. */
export type FalhaDoAparelho = 'negado' | 'ausente' | 'ocupado' | 'sem-suporte' | 'outro';

export function motivoDaFalha(erro: unknown): FalhaDoAparelho {
  const nome = erro instanceof Error || (typeof erro === 'object' && erro !== null && 'name' in erro) ? String((erro as { name: unknown }).name) : '';
  if (nome === 'NotAllowedError' || nome === 'SecurityError' || nome === 'PermissionDeniedError') return 'negado';
  if (nome === 'NotFoundError' || nome === 'OverconstrainedError' || nome === 'DevicesNotFoundError') return 'ausente';
  if (nome === 'NotReadableError' || nome === 'AbortError' || nome === 'TrackStartError') return 'ocupado';
  return 'outro';
}

/** A frase de cada falha, com o conserto. */
export function fraseDaFalha(aparelho: 'camera' | 'microfone' | 'os-dois', falha: FalhaDoAparelho): string {
  const o = { camera: 'a câmera', microfone: 'o microfone', 'os-dois': 'a câmera e o microfone' }[aparelho];
  const O = o.charAt(0).toUpperCase() + o.slice(1);
  const plural = aparelho === 'os-dois';
  switch (falha) {
    case 'negado':
      return `O navegador não liberou ${o}. Permita no cadeado da barra de endereço e tente de novo.`;
    case 'ausente':
      return { camera: 'Nenhuma câmera encontrada neste aparelho.', microfone: 'Nenhum microfone encontrado neste aparelho.', 'os-dois': 'Nenhuma câmera nem microfone encontrados neste aparelho.' }[aparelho];
    case 'ocupado':
      return `${O} ${plural ? 'estão' : 'está'} em uso por outro programa. Feche o programa e tente de novo.`;
    case 'sem-suporte':
      return 'Este navegador não dá acesso a câmera e microfone. Abra o link no Chrome ou no Safari.';
    default:
      return `${O} não ${plural ? 'responderam' : 'respondeu'}. Tente de novo.`;
  }
}

export interface CapturaPedida {
  /** O que veio: as duas trilhas, uma só, ou null. */
  stream: MediaStream | null;
  falhaDaCamera: FalhaDoAparelho | null;
  falhaDoMicrofone: FalhaDoAparelho | null;
}

/**
 * Pede câmera e microfone; se o par falhar, pede cada um sozinho e junta o
 * que vier. Sem `mediaDevices` (navegador de dentro de app, página sem
 * HTTPS), devolve as duas falhas como 'sem-suporte' em vez de nunca voltar.
 */
export async function pedirCaptura(
  video: MediaTrackConstraints | boolean,
  audio: MediaTrackConstraints | boolean,
  aparelhos: Pick<MediaDevices, 'getUserMedia'> | undefined = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined,
): Promise<CapturaPedida> {
  if (!aparelhos?.getUserMedia) return { stream: null, falhaDaCamera: 'sem-suporte', falhaDoMicrofone: 'sem-suporte' };
  try {
    const stream = await aparelhos.getUserMedia({ video, audio });
    return { stream, falhaDaCamera: null, falhaDoMicrofone: null };
  } catch {
    // Cada um sozinho: um aparelho que falha não leva o outro junto
  }
  const um = async (pedido: MediaStreamConstraints) => {
    try {
      return { trilhas: (await aparelhos.getUserMedia(pedido)).getTracks(), falha: null };
    } catch (erro) {
      return { trilhas: [] as MediaStreamTrack[], falha: motivoDaFalha(erro) };
    }
  };
  const nada = { trilhas: [] as MediaStreamTrack[], falha: null };
  const so = audio ? await um({ audio }) : nada;
  const sv = video ? await um({ video }) : nada;
  const trilhas = [...sv.trilhas, ...so.trilhas];
  return {
    stream: trilhas.length ? new MediaStream(trilhas) : null,
    falhaDaCamera: sv.falha,
    falhaDoMicrofone: so.falha,
  };
}
