import type { PDFDocumentProxy } from 'pdfjs-dist';

/**
 * A apresentação em PDF do estúdio: o arquivo abre neste navegador, e cada
 * página é desenhada uma vez na medida do palco (até 1920 × 1080) e mostrada
 * como imagem nos dois monitores. O PDF não vai para a conta: fecha com o
 * estúdio.
 *
 * O pdf.js (~1,8 MB com o Worker) só é baixado quando alguém abre um PDF;
 * quem nunca usa a apresentação não o carrega ao entrar no estúdio. É o build
 * `legacy`: o moderno do pdf.js 6 chama `Map.prototype.getOrInsertComputed`,
 * `Math.sumPrecise` e `Promise.try` sem polyfill, e no Safari 18 o PDF abria
 * e nenhuma página desenhava.
 */

/** Um PDF maior que isto vira memória demais no navegador para uma apresentação. */
export const LIMITE_DO_PDF = 100 * 1024 * 1024;

export type FalhaDoPdf = 'grande-demais' | 'nao-e-pdf' | 'com-senha' | 'nao-carregou' | 'ilegivel';

export class ErroDoPdf extends Error {
  constructor(readonly motivo: FalhaDoPdf) {
    super(motivo);
  }
}

export function fraseDaFalhaDoPdf(motivo: FalhaDoPdf): string {
  switch (motivo) {
    case 'grande-demais':
      return 'Este PDF passa de 100 MB. Exporte a apresentação com imagens menores e abra de novo.';
    case 'nao-e-pdf':
      return 'Este arquivo não é um PDF que o navegador consiga ler.';
    case 'com-senha':
      return 'Este PDF pede senha. Salve uma cópia sem senha e abra de novo.';
    case 'nao-carregou':
      return 'O leitor de PDF não carregou. Confira a conexão e tente de novo.';
    case 'ilegivel':
      return 'Não deu para ler este PDF. Ele pode estar corrompido.';
  }
}

type PdfJs = typeof import('pdfjs-dist/legacy/build/pdf.mjs');
let biblioteca: Promise<PdfJs> | null = null;

function carregarBiblioteca(): Promise<PdfJs> {
  biblioteca ??= Promise.all([import('pdfjs-dist/legacy/build/pdf.mjs'), import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')])
    .then(([pdf, worker]) => {
      pdf.GlobalWorkerOptions.workerSrc = worker.default;
      return pdf;
    })
    .catch((err) => {
      // Uma falha de rede não pode ficar guardada: a próxima tentativa baixa de novo
      biblioteca = null;
      throw err;
    });
  return biblioteca;
}

export interface ApresentacaoAberta {
  id: string;
  nome: string;
  paginas: number;
  documento: PDFDocumentProxy;
  /** Fecha o documento e o Worker dele. No pdf.js 6 é a tarefa de carga que solta, não o documento. */
  soltar: () => void;
}

export async function abrirPdf(arquivo: File): Promise<ApresentacaoAberta> {
  if (arquivo.size > LIMITE_DO_PDF) throw new ErroDoPdf('grande-demais');
  if (arquivo.type !== 'application/pdf' && !/\.pdf$/i.test(arquivo.name)) throw new ErroDoPdf('nao-e-pdf');
  let pdf: PdfJs;
  try {
    pdf = await carregarBiblioteca();
  } catch {
    throw new ErroDoPdf('nao-carregou');
  }
  let tarefa: ReturnType<PdfJs['getDocument']> | null = null;
  try {
    tarefa = pdf.getDocument({ data: new Uint8Array(await arquivo.arrayBuffer()) });
    const documento = await tarefa.promise;
    const aberta = tarefa;
    return {
      id: crypto.randomUUID(),
      nome: arquivo.name.replace(/\.pdf$/i, ''),
      paginas: documento.numPages,
      documento,
      soltar: () => void aberta.destroy(),
    };
  } catch (err) {
    // Um PDF que não abriu ainda tem um Worker com o arquivo inteiro na memória
    void tarefa?.destroy();
    if (err instanceof pdf.PasswordException) throw new ErroDoPdf('com-senha');
    if (err instanceof pdf.InvalidPDFException) throw new ErroDoPdf('nao-e-pdf');
    throw new ErroDoPdf('ilegivel');
  }
}

/** A página inteira dentro de 1920 × 1080, num object URL de PNG. Quem pede solta a URL. */
export async function desenharPagina(documento: PDFDocumentProxy, numero: number): Promise<string> {
  const pagina = await documento.getPage(numero);
  try {
    const base = pagina.getViewport({ scale: 1 });
    const viewport = pagina.getViewport({ scale: Math.min(1920 / base.width, 1080 / base.height) });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    await pagina.render({ canvas, viewport }).promise;
    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!png) throw new ErroDoPdf('ilegivel');
    return URL.createObjectURL(png);
  } finally {
    pagina.cleanup();
  }
}
