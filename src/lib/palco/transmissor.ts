import type { DestinoDaTransmissao, EstadoDoDestino, MensagemDoMotor, MensagemDoNavegador } from '../../server/protocoloDoMotor';
import { ALTURA_DO_PALCO, LARGURA_DO_PALCO, QPS_DO_PALCO } from './medidas';

/**
 * A transmissão, do lado do navegador: o stream do compositor vira pedaços
 * WebM (o mesmo MediaRecorder da gravação) que vão por WebSocket ao motor de
 * transmissão, e o motor diz de volta como está cada canal.
 *
 * O WebM sai em VP8: o motor decodifica o que recebe antes de codificar em
 * H.264, e o VP8 custa menos de decodificar que o VP9, numa máquina que
 * precisa sobrar para o x264. Pedaços de meio segundo, para o atraso até o
 * canal ficar no mínimo que o caminho permite.
 *
 * Uma conexão que cai encerra a transmissão: religar exigiria o motor
 * recomeçar o codificador sem derrubar os canais, e isso fica para a etapa
 * seguinte. A pessoa fica sabendo na hora pelo `aoEncerrar`.
 */

const TIPOS = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm'];
const TIPOS_SEM_SOM = ['video/webm;codecs=vp8', 'video/webm;codecs=vp9', 'video/webm'];
const PEDACO_MS = 500;
/** O motor pode estar desligado (o Fly.io para a máquina sem uso) e levar alguns segundos para subir. */
const PRAZO_PARA_ABRIR_MS = 20_000;
/** O que pode ficar à espera na conexão (uns 8 s de vídeo) antes de a subida ser dada como parada. */
const FILA_MAXIMA_BYTES = 4 * 1024 * 1024;
/** A taxa pedida ao navegador; o motor recodifica a 3000 kbit/s, então mais que isto só pesa na subida. */
const TAXA_DE_VIDEO = 3_500_000;

export interface PedidoDeTransmissao {
  stream: MediaStream;
  comSom: boolean;
  /** `wss://…/transmitir`, que a API devolveu. */
  motor: string;
  bilhete: string;
  destinos: DestinoDaTransmissao[];
  aoDestino: (id: string, estado: EstadoDoDestino, detalhe?: string) => void;
  /** O fim que não foi pedido por `parar()`: a conexão caiu ou o motor encerrou (`motivo`). */
  aoEncerrar: (motivo: string, duracaoS: number) => void;
}

export interface TransmissaoEmCurso {
  /** Em ms desde a época (Date.now), quando o motor aceitou e o vídeo começou a ir. */
  inicioEm: number;
  /** Pede o fim ao motor. `confirmado` diz se o motor respondeu que encerrou (ou se a conexão já estava fechada, ou 5 s passaram). */
  parar(): Promise<{ confirmado: boolean }>;
}

/** Abre a transmissão. Rejeita se o motor recusar antes de aceitar vídeo; depois disso, só avisa por `aoEncerrar`. */
export function comecarTransmissao(pedido: PedidoDeTransmissao): Promise<TransmissaoEmCurso> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(pedido.motor);
    ws.binaryType = 'arraybuffer';
    let gravador: MediaRecorder | null = null;
    let aceita = false;
    let encerradaAPedido = false;
    let resolverParada: ((confirmado: boolean) => void) | null = null;

    const prazo = window.setTimeout(() => {
      if (aceita) return;
      ws.close();
      reject(new Error('O servidor de transmissão não respondeu. Tente de novo em instantes.'));
    }, PRAZO_PARA_ABRIR_MS);

    const enviar = (mensagem: MensagemDoNavegador) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(mensagem));
    };

    const soltar = () => {
      window.clearTimeout(prazo);
      if (gravador && gravador.state !== 'inactive') gravador.stop();
      gravador = null;
    };

    /** Um fim que o navegador decidiu: avisa o motor e fecha, para a vaga da conta não ficar presa 15 s. */
    const desligar = () => {
      enviar({ tipo: 'parar' });
      ws.close();
    };

    const encerrar = (motivo: string, duracaoS: number) => {
      soltar();
      if (encerradaAPedido) {
        resolverParada?.(true);
        resolverParada = null;
        return;
      }
      encerradaAPedido = true;
      pedido.aoEncerrar(motivo, duracaoS);
    };

    ws.onopen = () => {
      enviar({
        tipo: 'comecar',
        bilhete: pedido.bilhete,
        comSom: pedido.comSom,
        video: { largura: LARGURA_DO_PALCO, altura: ALTURA_DO_PALCO, qps: QPS_DO_PALCO },
        destinos: pedido.destinos,
      });
    };

    ws.onmessage = (evento) => {
      if (typeof evento.data !== 'string') return;
      let mensagem: MensagemDoMotor;
      try {
        mensagem = JSON.parse(evento.data);
      } catch {
        console.warn('Mensagem do motor ilegível:', evento.data);
        return;
      }
      if (mensagem.tipo === 'erro') {
        window.clearTimeout(prazo);
        if (!aceita) reject(new Error(mensagem.mensagem));
        else {
          encerrar(mensagem.mensagem, 0);
          ws.close();
        }
        return;
      }
      if (mensagem.tipo === 'pronto') {
        if (aceita) return;
        aceita = true;
        window.clearTimeout(prazo);
        const trilhas = pedido.comSom ? pedido.stream.getTracks() : pedido.stream.getVideoTracks();
        const tipo = (pedido.comSom ? TIPOS : TIPOS_SEM_SOM).find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
        try {
          gravador = new MediaRecorder(new MediaStream(trilhas), {
            ...(tipo ? { mimeType: tipo } : {}),
            videoBitsPerSecond: TAXA_DE_VIDEO,
            ...(pedido.comSom ? { audioBitsPerSecond: 128_000 } : {}),
          });
          gravador.ondataavailable = (e) => {
            if (e.data.size === 0 || ws.readyState !== WebSocket.OPEN) return;
            // Uma subida que não acompanha enche a fila sem erro nenhum: a live
            // atrasaria minutos e a memória cresceria até o fim. Melhor parar e dizer.
            if (ws.bufferedAmount > FILA_MAXIMA_BYTES) {
              desligar();
              encerrar('A conexão com o servidor de transmissão parou de responder: a internet não está dando conta da subida.', 0);
              return;
            }
            ws.send(e.data);
          };
          gravador.onerror = () => {
            desligar();
            encerrar('O navegador parou de gerar o vídeo da transmissão.', 0);
          };
          gravador.start(PEDACO_MS);
        } catch (erro) {
          desligar();
          reject(erro instanceof Error ? erro : new Error('O navegador não conseguiu gerar o vídeo da transmissão.'));
          return;
        }
        const inicioEm = Date.now();
        resolve({
          inicioEm,
          parar: () =>
            new Promise<{ confirmado: boolean }>((pronto) => {
              encerradaAPedido = true;
              if (ws.readyState !== WebSocket.OPEN) {
                soltar();
                pronto({ confirmado: false });
                return;
              }
              resolverParada = (confirmado) => {
                window.clearTimeout(espera);
                pronto({ confirmado });
              };
              const espera = window.setTimeout(() => {
                resolverParada = null;
                ws.close();
                pronto({ confirmado: false });
              }, 5000);
              // O último pedaço sai antes do pedido de parar: o motor ainda o recebe
              const atual = gravador;
              if (atual && atual.state !== 'inactive') {
                atual.onstop = () => enviar({ tipo: 'parar' });
                atual.stop();
              } else {
                enviar({ tipo: 'parar' });
              }
              gravador = null;
              window.clearTimeout(prazo);
            }),
        });
        return;
      }
      if (mensagem.tipo === 'destino') {
        pedido.aoDestino(mensagem.id, mensagem.estado, mensagem.detalhe);
        return;
      }
      if (mensagem.tipo === 'encerrado') {
        encerrar(mensagem.motivo ?? 'O servidor encerrou a transmissão.', mensagem.duracaoS);
        ws.close();
      }
    };

    ws.onclose = (evento) => {
      window.clearTimeout(prazo);
      if (!aceita) {
        reject(new Error('Não deu para chegar ao servidor de transmissão.'));
        return;
      }
      if (!encerradaAPedido) console.warn('A conexão com o motor fechou:', evento.code, evento.reason);
      encerrar('A conexão com o servidor de transmissão caiu.', 0);
    };
    ws.onerror = () => {
      // O onclose vem logo depois e trata
    };
  });
}
