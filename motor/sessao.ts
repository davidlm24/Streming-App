import { spawn, type ChildProcessByStdio } from 'node:child_process';
import type { Readable, Writable } from 'node:stream';
import type { DestinoDaTransmissao, EstadoDoDestino, EventoDaSessao, VideoDaTransmissao } from '../src/server/protocoloDoMotor';
import { LINHA_DE_NO_AR, argumentosDoCodificador, argumentosDoEmpurrador, semAChave } from './ffmpeg';

/** O que o motor conta à sessão e ao mundo. */
export interface AmbienteDaSessao {
  /** O binário do ffmpeg. */
  ffmpeg: string;
  /** Uma mudança de estado de um canal, ou o fim, para o navegador e para a API. */
  aoEvento: (evento: EventoDaSessao) => void;
  registrar: (mensagem: string) => void;
}

export interface PedidoDaSessao {
  comSom: boolean;
  video: VideoDaTransmissao;
  destinos: DestinoDaTransmissao[];
}

/** Quanto um empurrador pode acumular sem entregar antes de ser reiniciado (um canal lento não pode segurar a memória). */
const ACUMULO_MAXIMO_DO_EMPURRADOR = 8 * 1024 * 1024;
/** Quanto o codificador pode acumular na entrada: além disso o motor não acompanha o navegador. */
const ACUMULO_MAXIMO_DO_CODIFICADOR = 16 * 1024 * 1024;
/** Quantas quedas seguidas um canal pode ter antes de o motor desistir dele. */
const QUEDAS_ATE_DESISTIR = 5;
/** Quanto tempo no ar faz uma queda anterior deixar de contar: cair logo depois de conectar é a mesma queda. */
const TEMPO_PARA_ZERAR_QUEDAS_MS = 60_000;
/** O tempo para o ffmpeg terminar sozinho antes do SIGKILL, e o teto absoluto da espera. */
const PRAZO_PARA_SAIR_MS = 5000;

type Processo = ChildProcessByStdio<Writable, Readable, Readable>;

interface Empurrador {
  destino: DestinoDaTransmissao;
  processo: Processo | null;
  estado: EstadoDoDestino;
  quedas: number;
  /** As últimas linhas do stderr, já sem a chave, para dizer por que caiu. */
  ultimasLinhas: string[];
  /** O motivo que o motor já sabe (ele mesmo derrubou o processo), no lugar da linha do ffmpeg. */
  motivoDaProximaQueda: string | null;
  religar: ReturnType<typeof setTimeout> | null;
  /** Conta o tempo no ar; disparado, as quedas anteriores deixam de contar. */
  estavel: ReturnType<typeof setTimeout> | null;
}

/**
 * Uma transmissão no motor: o codificador e os empurradores de uma pessoa,
 * do `comecar` ao `encerrado`.
 */
export class Sessao {
  private codificador: Processo | null = null;
  private empurradores: Empurrador[] = [];
  private encerrando = false;
  private encerrada: Promise<void> | null = null;
  private readonly inicioEm = Date.now();
  private bytesRecebidos = 0;

  constructor(
    readonly id: string,
    private readonly pedido: PedidoDaSessao,
    private readonly ambiente: AmbienteDaSessao,
  ) {}

  /**
   * Liga o codificador e um empurrador por canal. Um ffmpeg que não sobe
   * (binário ausente, sem memória) chega como evento `error`, não como
   * exceção: sem ouvi-lo, derrubava o motor inteiro com as outras lives.
   */
  iniciar() {
    const codificador = spawn(this.ambiente.ffmpeg, argumentosDoCodificador(this.pedido.video, this.pedido.comSom), {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    this.codificador = codificador;
    codificador.on('error', (erro: NodeJS.ErrnoException) => {
      this.ambiente.registrar(`o codificador não subiu: ${erro.code ?? erro.message}`);
      void this.encerrar('O servidor de transmissão não conseguiu iniciar o vídeo.');
    });
    codificador.stdin.on('error', (erro: NodeJS.ErrnoException) => {
      if (erro.code !== 'EPIPE') this.ambiente.registrar(`entrada do codificador: ${erro.code ?? erro.message}`);
    });
    const avisos: string[] = [];
    codificador.stderr.setEncoding('utf8');
    codificador.stderr.on('data', (texto: string) => {
      for (const linha of texto.split('\n')) if (linha.trim()) avisos.push(linha.trim());
      if (avisos.length > 20) avisos.splice(0, avisos.length - 20);
    });
    codificador.stdout.on('data', (pedaco: Buffer) => this.distribuir(pedaco));
    codificador.on('exit', (codigo, sinal) => {
      if (this.encerrando) return;
      this.ambiente.registrar(`o codificador saiu sozinho (${codigo ?? sinal}): ${avisos.slice(-3).join(' | ')}`);
      void this.encerrar('A codificação do vídeo falhou no servidor.');
    });

    this.empurradores = this.pedido.destinos.map((destino) => ({
      destino,
      processo: null,
      estado: 'conectando',
      quedas: 0,
      ultimasLinhas: [],
      motivoDaProximaQueda: null,
      religar: null,
      estavel: null,
    }));
    try {
      for (const e of this.empurradores) this.ligarEmpurrador(e);
    } catch (erro) {
      // Um argumento que o spawn recusa: o codificador já subiu e precisa descer com tudo
      void this.encerrar('O servidor de transmissão não conseguiu iniciar um canal.');
      throw erro;
    }
  }

  /** Um pedaço WebM do navegador. */
  receber(pedaco: Buffer) {
    const entrada = this.codificador?.stdin;
    if (!entrada || this.encerrando || entrada.destroyed) return;
    this.bytesRecebidos += pedaco.length;
    if (entrada.writableLength > ACUMULO_MAXIMO_DO_CODIFICADOR) {
      this.ambiente.registrar(`o codificador acumulou ${entrada.writableLength} bytes sem consumir`);
      void this.encerrar('O servidor não acompanhou o vídeo.');
      return;
    }
    entrada.write(pedaco);
  }

  get duracaoS() {
    return Math.round((Date.now() - this.inicioEm) / 1000);
  }

  get recebeuVideo() {
    return this.bytesRecebidos > 0;
  }

  /** Encerra tudo: fecha a entrada, espera o ffmpeg esvaziar, mata o que sobrar. Idempotente, e nunca fica pendurado. */
  encerrar(motivo?: string): Promise<void> {
    if (this.encerrada) return this.encerrada;
    this.encerrando = true;
    this.encerrada = (async () => {
      for (const e of this.empurradores) {
        if (e.religar) clearTimeout(e.religar);
        if (e.estavel) clearTimeout(e.estavel);
        e.religar = null;
        e.estavel = null;
      }
      const codificador = this.codificador;
      if (codificador) {
        if (!codificador.stdin.destroyed) codificador.stdin.end();
        await esperarSaida(codificador);
      }
      await Promise.all(
        this.empurradores.map(async (e) => {
          const processo = e.processo;
          if (processo) {
            if (!processo.stdin.destroyed) processo.stdin.end();
            await esperarSaida(processo);
          }
          // Um canal entre duas tentativas (sem processo) também para aqui
          if (e.estado !== 'falhou') this.mudarEstado(e, 'parado');
        }),
      );
      this.ambiente.aoEvento({ evento: 'fim', motivo });
    })();
    return this.encerrada;
  }

  private distribuir(pedaco: Buffer) {
    for (const e of this.empurradores) {
      const entrada = e.processo?.stdin;
      if (!entrada || entrada.destroyed) continue;
      if (entrada.writableLength > ACUMULO_MAXIMO_DO_EMPURRADOR) {
        // O canal não consome o que recebe: a conexão está presa. Derruba e religa.
        this.ambiente.registrar(`${e.destino.nome}: acumulou ${entrada.writableLength} bytes; religando`);
        e.motivoDaProximaQueda = 'O canal parou de receber o vídeo.';
        e.processo?.kill('SIGKILL');
        continue;
      }
      entrada.write(pedaco);
    }
  }

  private ligarEmpurrador(e: Empurrador) {
    if (this.encerrando) return;
    const { url, chave } = e.destino;
    const processo = spawn(this.ambiente.ffmpeg, argumentosDoEmpurrador(url, chave), { stdio: ['pipe', 'pipe', 'pipe'] });
    e.processo = processo;
    e.ultimasLinhas = [];
    processo.stdin.on('error', (erro: NodeJS.ErrnoException) => {
      if (erro.code !== 'EPIPE') this.ambiente.registrar(`${e.destino.nome}: entrada: ${erro.code ?? erro.message}`);
    });
    processo.stdout.resume();
    processo.stderr.setEncoding('utf8');
    processo.stderr.on('data', (texto: string) => {
      const limpo = semAChave(texto, chave);
      for (const linha of limpo.split('\n')) if (linha.trim()) e.ultimasLinhas.push(linha.trim());
      if (e.ultimasLinhas.length > 12) e.ultimasLinhas.splice(0, e.ultimasLinhas.length - 12);
      if (e.estado !== 'no-ar' && LINHA_DE_NO_AR.test(limpo)) {
        this.mudarEstado(e, 'no-ar');
        // Só uma conexão que durou conta como recuperação; cair logo depois de conectar é a mesma queda
        if (e.estavel) clearTimeout(e.estavel);
        e.estavel = setTimeout(() => {
          e.estavel = null;
          e.quedas = 0;
        }, TEMPO_PARA_ZERAR_QUEDAS_MS);
      }
    });
    const caiu = (motivoDoProcesso: string) => {
      if (e.processo !== processo) return;
      e.processo = null;
      if (e.estavel) clearTimeout(e.estavel);
      e.estavel = null;
      if (this.encerrando) return;
      e.quedas += 1;
      const detalhe = e.motivoDaProximaQueda ?? motivoDaQueda(e.ultimasLinhas);
      e.motivoDaProximaQueda = null;
      this.ambiente.registrar(`${e.destino.nome} caiu (${motivoDoProcesso}, queda ${e.quedas}): ${detalhe}`);
      if (e.quedas >= QUEDAS_ATE_DESISTIR) {
        this.mudarEstado(e, 'falhou', detalhe);
        // Sem canal nenhum, a live vai para ninguém: melhor dizer isso que seguir gastando
        if (this.empurradores.every((x) => x.estado === 'falhou')) void this.encerrar('Nenhum canal aceitou a live.');
        return;
      }
      this.mudarEstado(e, e.estado === 'conectando' && e.quedas === 1 ? 'conectando' : 'reconectando', detalhe);
      // Espera crescente entre as tentativas: 2, 4, 6, 8 s
      e.religar = setTimeout(() => {
        e.religar = null;
        this.ligarEmpurrador(e);
      }, 2000 * e.quedas);
    };
    processo.on('exit', (codigo, sinal) => caiu(String(codigo ?? sinal)));
    processo.on('error', (erro: NodeJS.ErrnoException) => {
      e.motivoDaProximaQueda ??= 'O ffmpeg não subiu no servidor.';
      caiu(erro.code ?? 'error');
    });
  }

  private mudarEstado(e: Empurrador, estado: EstadoDoDestino, detalhe?: string) {
    if (e.estado === estado && !detalhe) return;
    e.estado = estado;
    this.ambiente.aoEvento({ evento: 'destino', destino: e.destino.id, estado, detalhe });
  }
}

/** A frase do ffmpeg que explica a queda, em português quando a conhecemos. */
function motivoDaQueda(linhas: string[]): string {
  const texto = linhas.join('\n');
  if (/Connection refused|Connection timed out|Failed to resolve hostname|No route to host/i.test(texto)) {
    return 'O servidor do canal não respondeu.';
  }
  if (/Server error|NetStream\.Publish\.BadName|Stream.*(not found|invalid)|403|401/i.test(texto)) {
    return 'O canal recusou a chave de transmissão.';
  }
  if (/Broken pipe|Connection reset|I\/O error|End of file/i.test(texto)) {
    return 'A conexão com o canal caiu.';
  }
  const ultima = [...linhas].reverse().find((l) => /error|fail|refused|invalid/i.test(l)) ?? linhas[linhas.length - 1];
  return ultima ? ultima.slice(0, 160) : 'O ffmpeg encerrou sem dizer por quê.';
}

/** Espera o processo sair; um que nunca subiu (`error`) ou que não morre no prazo também libera a espera. */
function esperarSaida(processo: Processo): Promise<void> {
  if (processo.exitCode !== null || processo.signalCode !== null) return Promise.resolve();
  return new Promise((pronto) => {
    const prazo = setTimeout(() => processo.kill('SIGKILL'), PRAZO_PARA_SAIR_MS);
    const teto = setTimeout(terminar, PRAZO_PARA_SAIR_MS * 2);
    function terminar() {
      clearTimeout(prazo);
      clearTimeout(teto);
      pronto();
    }
    processo.once('exit', terminar);
    processo.once('error', terminar);
  });
}
