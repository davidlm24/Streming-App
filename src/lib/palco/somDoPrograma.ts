/**
 * O som do programa: microfone, o clipe que toca no programa e o som da tela
 * compartilhada, mixados por WebAudio numa trilha de áudio só — a que vai
 * junto do vídeo composto para a gravação e, depois, para a transmissão.
 *
 * O que cada fonte respeita:
 * - O microfone entra sempre: é a voz de quem opera. O mudo da bandeja
 *   desliga a trilha (`enabled = false`), e uma trilha muda produz silêncio
 *   no grafo — o mudo vale aqui sem código a mais.
 * - O clipe é tomado por `captureStream()` do próprio elemento, e NÃO por
 *   MediaElementSource: a fonte de elemento rouba o som do alto-falante para
 *   o grafo, e o operador deixaria de ouvir o clipe que está no ar.
 * - A tela só entra enquanto está no programa (quem decide é o compositor,
 *   por `telaNoAr`), e nunca vai ao alto-falante: o som da própria tela
 *   ecoaria na sala.
 */
interface ClipeCapturado {
  captura: MediaStream;
  /** A fonte no grafo, quando a trilha de áudio já chegou. */
  fonte: MediaStreamAudioSourceNode | null;
  trilha: MediaStreamTrack | null;
}

export class SomDoPrograma {
  private contexto: AudioContext | null = null;
  private destino: MediaStreamAudioDestinationNode | null = null;

  private microfone: MediaStreamAudioSourceNode | null = null;
  private trilhaDoMicrofone: MediaStreamTrack | null = null;

  private tela: MediaStreamAudioSourceNode | null = null;
  private ganhoDaTela: GainNode | null = null;
  private streamDaTela: MediaStream | null = null;

  /** A captura de cada elemento de clipe, uma por elemento; `null` onde o navegador não captura. */
  private clipes = new WeakMap<HTMLVideoElement, ClipeCapturado | null>();
  /** Os elementos de clipe que já avisam quando a trilha chega; os ouvintes ficam no elemento. */
  private elementosOuvidos = new WeakSet<HTMLVideoElement>();

  /** Liga o grafo e devolve a trilha mixada. O par de soltar(); os dois podem se alternar. */
  iniciar(): MediaStreamTrack {
    this.contexto = new AudioContext();
    this.destino = this.contexto.createMediaStreamDestination();
    if (this.trilhaDoMicrofone) this.ligarMicrofone(this.trilhaDoMicrofone);
    if (this.streamDaTela) this.ligarTela(this.streamDaTela);
    return this.destino.stream.getAudioTracks()[0];
  }

  soltar() {
    void this.contexto?.close().catch(() => {});
    this.contexto = null;
    this.destino = null;
    this.microfone = null;
    this.tela = null;
    this.ganhoDaTela = null;
    this.clipes = new WeakMap();
  }

  /**
   * O Chrome só deixa o contexto tocar depois de um gesto da pessoa, ou com a
   * câmera e o microfone capturando. Suspenso, ele não entrega som nenhum, e o
   * gravador fica esperando a trilha de áudio para sempre. Diz se o som roda.
   */
  async retomar(): Promise<boolean> {
    // O contexto fica numa variável: soltar() no meio do prazo não o apaga daqui
    const contexto = this.contexto;
    if (!contexto) return false;
    if (contexto.state === 'suspended') {
      // Sem permissão, o resume() não falha: fica pendente até um gesto futuro.
      // Quem grava não pode esperar por ele: 2 s cobrem o resume legítimo, que
      // no Chrome sem janela passa de meio segundo, sem prender quem não tem
      // permissão. O pedido é novo a cada chamada: só o feito dentro do gesto
      // libera o som, e um pedido antigo, de antes do clique, não o libera.
      const prazo = new Promise<void>((pronto) => window.setTimeout(pronto, 2000));
      await Promise.race([contexto.resume().catch(() => {}), prazo]);
    }
    return contexto.state === 'running';
  }

  /**
   * A cada render do estúdio: pede para o som tocar, sem esperar nem armar
   * prazo. Vale assim que o navegador deixar (a captura da câmera e do
   * microfone costuma bastar); quem precisa da resposta chama retomar().
   */
  acordar() {
    if (this.contexto?.state === 'suspended') void this.contexto.resume().catch(() => {});
  }

  setMicrofone(trilha: MediaStreamTrack | null) {
    this.trilhaDoMicrofone = trilha;
    this.ligarMicrofone(trilha);
  }

  setTela(stream: MediaStream | null) {
    this.streamDaTela = stream;
    this.ligarTela(stream);
  }

  /** A tela compartilhada está no programa agora (e não um clipe ou um PDF no lugar dela). */
  telaNoAr(noAr: boolean) {
    if (this.ganhoDaTela) this.ganhoDaTela.gain.value = noAr ? 1 : 0;
  }

  /**
   * Liga o som de um clipe. A trilha de áudio do `captureStream` chega depois
   * do play (no `loadedmetadata`), quando nenhum render do estúdio acontece:
   * por isso a ligação também segue os eventos da captura e do elemento.
   * Voltar a tocar depois do fim pode encerrar a trilha capturada; aí a
   * captura é refeita.
   */
  ligarClipe(video: HTMLVideoElement) {
    if (!this.contexto || !this.destino) return;
    let clipe = this.clipes.get(video);
    if (clipe === null) return; // este navegador não captura o elemento; não tenta a cada render
    if (clipe?.trilha?.readyState === 'ended') {
      clipe.fonte?.disconnect();
      clipe = undefined;
    }
    if (!clipe) {
      const capturavel = video as HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream };
      const capturar = capturavel.captureStream ?? capturavel.mozCaptureStream;
      let captura: MediaStream;
      try {
        if (!capturar) throw new Error('sem captureStream');
        captura = capturar.call(video);
      } catch (erro) {
        console.warn('O som do clipe não entra na gravação neste navegador:', erro);
        this.clipes.set(video, null);
        return;
      }
      clipe = { captura, fonte: null, trilha: null };
      this.clipes.set(video, clipe);
      captura.addEventListener('addtrack', () => this.ligarClipe(video));
      if (!this.elementosOuvidos.has(video)) {
        this.elementosOuvidos.add(video);
        video.addEventListener('loadedmetadata', () => this.ligarClipe(video));
        video.addEventListener('playing', () => this.ligarClipe(video));
      }
    }
    this.conectarClipe(clipe);
  }

  private conectarClipe(clipe: ClipeCapturado) {
    if (clipe.fonte || !this.contexto || !this.destino) return;
    const trilha = clipe.captura.getAudioTracks()[0];
    if (!trilha) return;
    clipe.fonte = this.contexto.createMediaStreamSource(new MediaStream([trilha]));
    clipe.fonte.connect(this.destino);
    clipe.trilha = trilha;
  }

  private ligarMicrofone(trilha: MediaStreamTrack | null) {
    if (!this.contexto || !this.destino) return;
    this.microfone?.disconnect();
    this.microfone = null;
    if (!trilha) return;
    this.microfone = this.contexto.createMediaStreamSource(new MediaStream([trilha]));
    this.microfone.connect(this.destino);
  }

  private ligarTela(stream: MediaStream | null) {
    if (!this.contexto || !this.destino) return;
    this.tela?.disconnect();
    this.ganhoDaTela?.disconnect();
    this.tela = null;
    this.ganhoDaTela = null;
    const trilha = stream?.getAudioTracks()[0];
    if (!trilha) return;
    this.tela = this.contexto.createMediaStreamSource(new MediaStream([trilha]));
    this.ganhoDaTela = this.contexto.createGain();
    this.ganhoDaTela.gain.value = 0;
    this.tela.connect(this.ganhoDaTela);
    this.ganhoDaTela.connect(this.destino);
  }
}
