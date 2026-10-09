import type { VideoDaTransmissao } from '../src/server/protocoloDoMotor';

/**
 * Os comandos do ffmpeg do motor. Dois papéis:
 *
 * - O CODIFICADOR, um por transmissão: lê o WebM do navegador (VP8/VP9 +
 *   Opus) na entrada padrão, codifica UMA vez em H.264 + AAC, que é o que
 *   YouTube, Facebook, Twitch e os outros aceitam, e escreve MPEG-TS na saída
 *   padrão. É o processo caro (cerca de um núcleo em 720p30).
 * - O EMPURRADOR, um por canal: lê o MPEG-TS na entrada padrão e o entrega
 *   sem recodificar (`-c copy`) por RTMP ou RTMPS. Barato, e um por canal
 *   para cada um ter o seu estado e a sua queda: um canal que cai não leva os
 *   outros, e o motor sabe dizer qual caiu.
 *
 * O Node faz o meio: distribui cada pedaço da saída do codificador para a
 * entrada de cada empurrador.
 */

/** A taxa de vídeo por altura, em kbit/s: a faixa que o YouTube recomenda para 30 qps. */
export function taxaDeVideoKbps(altura: number): number {
  if (altura >= 1080) return 4500;
  if (altura >= 720) return 3000;
  return 1500;
}

export function argumentosDoCodificador(video: VideoDaTransmissao, comSom: boolean): string[] {
  const taxa = taxaDeVideoKbps(video.altura);
  const qps = [24, 25, 30, 50, 60].includes(video.qps) ? video.qps : 30;
  return [
    '-hide_banner',
    '-loglevel', 'warning',
    '-nostats',
    // O WebM do MediaRecorder chega em tempo real; os carimbos de tempo
    // vêm dele. `+genpts` repõe os que faltam nos pedaços do Chrome.
    '-fflags', '+genpts',
    '-i', 'pipe:0',
    // Sem som no navegador, silêncio: as plataformas recusam vídeo sem trilha
    // de áudio, e o canal cairia em segundos.
    ...(comSom ? [] : ['-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000']),
    '-map', '0:v:0',
    '-map', comSom ? '0:a:0?' : '1:a:0',
    ...(comSom ? [] : ['-shortest']),
    // H.264 main, quadro-chave a cada 2 s (as plataformas exigem ≤ 4 s),
    // taxa constante, o preset mais barato que ainda fica bem
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-tune', 'zerolatency',
    '-profile:v', 'main',
    '-pix_fmt', 'yuv420p',
    '-fps_mode', 'cfr',
    '-r', String(qps),
    '-g', String(qps * 2),
    '-keyint_min', String(qps * 2),
    '-sc_threshold', '0',
    '-b:v', `${taxa}k`,
    '-maxrate', `${Math.round(taxa * 1.1)}k`,
    '-bufsize', `${taxa * 2}k`,
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', '48000',
    '-ac', '2',
    '-f', 'mpegts',
    '-muxdelay', '0',
    'pipe:1',
  ];
}

export function argumentosDoEmpurrador(url: string, chave: string): string[] {
  return [
    '-hide_banner',
    // `info`, e não `warning`: é no nível info que o ffmpeg diz "Output #0"
    // depois de conectar, a única notícia de que o canal está no ar
    '-loglevel', 'info',
    '-nostats',
    '-i', 'pipe:0',
    '-c', 'copy',
    '-f', 'flv',
    '-flvflags', 'no_duration_filesize',
    enderecoComChave(url, chave),
  ];
}

/** `rtmp://servidor/app` + chave → `rtmp://servidor/app/chave`. */
export function enderecoComChave(url: string, chave: string): string {
  return `${url.replace(/\/+$/, '')}/${chave}`;
}

/**
 * Apaga a chave de um texto que vai para um registro ou para a tela. O ffmpeg
 * repete o endereço inteiro, com a chave, em quase toda linha de erro.
 */
export function semAChave(texto: string, chave: string): string {
  if (!chave) return texto;
  return texto.split(chave).join('•••');
}

/** A notícia de que o empurrador conectou e começou a escrever no canal. */
export const LINHA_DE_NO_AR = /^Output #0, flv, to /m;
