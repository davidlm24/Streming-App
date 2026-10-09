/**
 * A gravação local do programa: o stream do compositor num arquivo que o
 * navegador baixa. Nada sobe para a conta — é o primeiro valor real do
 * vídeo composto, e a prova de ponta a ponta antes da transmissão existir.
 *
 * Os pedaços ficam na memória (cerca de 35 MB por minuto a 720p): uma live
 * de uma hora cabe, mas é bom dizer isso na dica da bandeja um dia. O
 * MediaRecorder recebe pedaços de 1 s para o arquivo sobreviver a um laço
 * que engasgue no meio.
 */

const TIPOS = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];

export interface GravacaoEmCurso {
  /** Em ms desde a época (Date.now), para o tempo da bandeja. */
  inicioEm: number;
  /** O arquivo leva o som do programa; sem ele, a bandeja diz "sem som" ao lado do tempo. */
  comSom: boolean;
  /** Date.now() do último pedaço entregue: parado há segundos, a gravação travou. */
  ultimoPedacoEm(): number;
  /** Encerra e devolve o arquivo; null se nada foi captado. Chamar de novo devolve o mesmo. */
  parar(): Promise<Blob | null>;
}

interface OpcoesDaGravacao {
  comSom: boolean;
  /** O navegador parou a gravação sem ninguém pedir (erro do codificador, trilha que acabou). */
  aoParar: (erro: unknown) => void;
}

/**
 * Começa a gravar. Sem som (`comSom` falso), grava só a trilha de vídeo: uma
 * trilha de áudio parada faz o MediaRecorder esperar e nunca entregar dados.
 * Lança se o navegador não grava (sem MediaRecorder, tipo recusado): quem
 * chama diz isso a quem opera.
 */
export function comecarGravacao(stream: MediaStream, { comSom, aoParar }: OpcoesDaGravacao): GravacaoEmCurso {
  const trilhas = comSom ? stream.getTracks() : stream.getVideoTracks();
  const tipos = comSom ? TIPOS : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  const tipo = tipos.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
  const gravador = new MediaRecorder(new MediaStream(trilhas), {
    ...(tipo ? { mimeType: tipo } : {}),
    videoBitsPerSecond: 4_500_000,
    ...(comSom ? { audioBitsPerSecond: 128_000 } : {}),
  });
  const pedacos: Blob[] = [];
  let ultimoPedacoEm = Date.now();
  let pedido = false;
  gravador.ondataavailable = (evento) => {
    if (evento.data.size > 0) {
      pedacos.push(evento.data);
      ultimoPedacoEm = Date.now();
    }
  };
  // O fim é ouvido desde o começo: um gravador que o navegador para sozinho
  // também entrega o que juntou, e quem opera fica sabendo
  const terminou = new Promise<Blob | null>((resolve) => {
    gravador.onstop = () => {
      resolve(pedacos.length ? new Blob(pedacos, { type: gravador.mimeType }) : null);
      if (!pedido) aoParar(new Error('A gravação parou sem ser pedida.'));
    };
  });
  gravador.onerror = (evento) => aoParar((evento as Event & { error?: unknown }).error ?? evento);
  gravador.start(1000);

  return {
    inicioEm: Date.now(),
    comSom,
    ultimoPedacoEm: () => ultimoPedacoEm,
    parar: () => {
      pedido = true;
      if (gravador.state !== 'inactive') gravador.stop();
      return terminou;
    },
  };
}

/** Baixa a gravação como pwstreamer-AAAA-MM-DD-HHMM, com a extensão do formato que o navegador gravou. */
export function baixarGravacao(arquivo: Blob, agora = new Date()) {
  const dois = (n: number) => String(n).padStart(2, '0');
  const extensao = arquivo.type.includes('mp4') ? 'mp4' : 'webm';
  const nome = `pwstreamer-${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}-${dois(agora.getHours())}${dois(agora.getMinutes())}.${extensao}`;
  const url = URL.createObjectURL(arquivo);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  // O revoke espera o clique virar download; na hora, o Chrome às vezes baixa um arquivo vazio
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return nome;
}
