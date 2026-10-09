/**
 * O que o navegador e o motor de transmissão dizem um ao outro pelo
 * WebSocket. Mensagens de texto são JSON com `tipo`; as de bytes são os
 * pedaços WebM do MediaRecorder, na ordem, sem moldura própria.
 *
 * Compartilhado pelo estúdio (src/lib/palco/transmissor.ts), pelo motor
 * (motor/) e pela API (os eventos que o motor devolve), para os três
 * concordarem nos nomes.
 */

/** O estado de um canal, nas palavras que a tela usa. */
export type EstadoDoDestino = 'conectando' | 'no-ar' | 'reconectando' | 'falhou' | 'parado';

export interface DestinoDaTransmissao {
  /** stream_destinations.id, que a API devolveu ao criar a transmissão. */
  id: string;
  /** O nome do canal, só para os registros do motor ("YouTube Principal"). */
  nome: string;
  /** rtmp:// ou rtmps://, sem a chave. */
  url: string;
  /** A chave de transmissão. Só existe aqui e na memória do motor. */
  chave: string;
}

export interface VideoDaTransmissao {
  largura: number;
  altura: number;
  qps: number;
}

/** Navegador → motor. */
export type MensagemDoNavegador =
  | { tipo: 'comecar'; bilhete: string; comSom: boolean; video: VideoDaTransmissao; destinos: DestinoDaTransmissao[] }
  | { tipo: 'parar' };

/** Motor → navegador. */
export type MensagemDoMotor =
  /** O motor aceitou o bilhete e os canais: pode mandar vídeo. */
  | { tipo: 'pronto' }
  | { tipo: 'destino'; id: string; estado: EstadoDoDestino; detalhe?: string }
  /** A transmissão acabou (a pedido, ou por falha: `motivo`). O motor fecha em seguida. */
  | { tipo: 'encerrado'; duracaoS: number; motivo?: string }
  /** Recusa antes de começar. O motor fecha em seguida. */
  | { tipo: 'erro'; mensagem: string };

/** O que acontece numa sessão do motor. */
export type EventoDaSessao =
  | { evento: 'inicio' }
  | { evento: 'destino'; destino: string; estado: EstadoDoDestino; detalhe?: string }
  | { evento: 'fim'; motivo?: string };

/** Motor → API (POST /api/motor/eventos), com o segredo no Authorization. */
export type EventoDoMotor = EventoDaSessao & { sessao: string };

/** O máximo de canais numa transmissão, acima de qualquer plano (o maior dá 8, em src/lib/plans.ts). */
export const MAX_DESTINOS = 10;

/**
 * A forma de uma URL de canal: rtmp(s)://, um host de letras, dígitos, pontos
 * e hífens (ou um IPv6 entre colchetes), porta opcional, e um caminho sem
 * espaço nem barra invertida. É o que garante que o host conferido antes de
 * conectar (new URL) é o mesmo que o ffmpeg vai procurar: o ffmpeg separa o
 * host pelo que vem depois do último "@" e não trata "\\" como "/", então
 * uma URL com "\@" ou usuário enganaria a conferência e chegaria à rede
 * interna. Sem "@", sem "\\", sem caracteres de controle, não há dois hosts.
 */
export const URL_DE_CANAL =
  /^rtmps?:\/\/(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*|\[[0-9A-Fa-f:.]+\])(?::\d{1,5})?\/[^\s\\@\x00-\x1f\x7f]*$/;

/** A chave de transmissão vai colada ao fim da URL: nada que mude o caminho ou escape de um registro. */
export const chaveValida = (chave: string) => chave.length >= 1 && chave.length <= 1024 && !/[\s/\\@\x00-\x1f\x7f]/.test(chave);
