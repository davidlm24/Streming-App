// A mídia do estúdio na conta: o arquivo no bucket `media-assets`, na pasta da
// conta, e a ficha dele em `media_assets`, com o tipo e o nome. As regras do
// banco e do bucket (supabase/migrations) deixam cada conta ler, enviar e
// apagar só o que é dela, até 50 MB por arquivo, 200 MB e 300 arquivos
// somados. Um arquivo nunca é substituído: cada envio tem um caminho novo.
import { ErroAoSalvar, contaParaGravar, falhaDoSupabase, gravarComConfirmacao, type FalhaAoSalvar } from './dadosDaConta';
import { getSupabaseBrowserClient, getSupabaseBrowserConfig } from './supabase';

const banco = () => getSupabaseBrowserClient();
const BUCKET = 'media-assets';

export type TipoDeMidia = 'logo' | 'fundo' | 'sobreposicao' | 'clipe';
const TIPOS: readonly TipoDeMidia[] = ['logo', 'fundo', 'sobreposicao', 'clipe'];

export const MB = 1024 * 1024;
/** O maior arquivo que o bucket aceita: o limite do plano grátis do Supabase. */
export const LIMITE_DO_ARQUIVO = 50 * MB;
/** Quanto a conta guarda, somados os arquivos. */
export const LIMITE_DA_CONTA = 200 * MB;
/** Quantos arquivos a conta guarda. */
export const LIMITE_DE_ARQUIVOS = 300;

/**
 * Os formatos que a tela aceita em cada tipo. O logo aceita SVG, mas ele vira
 * PNG antes de sair do navegador (svgEmPng): o bucket não guarda SVG.
 */
export const FORMATOS: Record<TipoDeMidia, readonly string[]> = {
  logo: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
  fundo: ['image/png', 'image/jpeg', 'image/webp'],
  // A sobreposição fica por cima do palco: só formatos com transparência
  sobreposicao: ['image/png', 'image/webp'],
  clipe: ['video/mp4', 'video/webm'],
};

/** Os formatos que vão para o bucket, com a extensão do caminho. */
const EXTENSOES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

export interface FichaDaMidia {
  id: string;
  tipo: TipoDeMidia;
  /** O nome do arquivo, sem a extensão. */
  nome: string;
  /** Onde o arquivo está no bucket: `{uid}/{id}.{extensão}`. */
  caminho: string;
  bytes: number;
}

/** Por que a mídia não abriu, não foi enviada ou não foi excluída. A tela diz cada caso. */
export type MotivoDaFalha = FalhaAoSalvar | 'grande-demais' | 'formato' | 'sem-espaco' | 'muitos-arquivos' | 'svg-invalido';

export class FalhaDaMidia extends Error {
  readonly motivo: MotivoDaFalha;
  constructor(motivo: MotivoDaFalha) {
    super(motivo);
    this.motivo = motivo;
  }
}

export const motivoDaFalha = (erro: unknown): MotivoDaFalha =>
  erro instanceof FalhaDaMidia || erro instanceof ErroAoSalvar ? erro.motivo : 'recusado';

const semExtensao = (nome: string) => nome.replace(/\.[^/.]+$/, '') || nome;

/** Até 255 caracteres, sem partir um emoji ao meio: o banco recusaria o nome. */
const nomeParaFicha = (nome: string) => Array.from(nome).slice(0, 255).join('');

/** As fichas da conta, na ordem do envio. Uma ficha de tipo desconhecido fica de fora. */
export async function lerFichas(conta: string): Promise<FichaDaMidia[]> {
  const { data, error } = await banco()
    .from('media_assets')
    .select('id, storage_path, filename, byte_size, metadata')
    .eq('owner_id', conta)
    .order('created_at');
  if (error) throw new FalhaDaMidia(falhaDoSupabase(error));
  return (data ?? []).flatMap((linha) => {
    const tipo = (linha.metadata as { tipo?: unknown } | null)?.tipo as TipoDeMidia;
    if (!TIPOS.includes(tipo)) return [];
    return [{ id: linha.id, tipo, nome: semExtensao(linha.filename), caminho: linha.storage_path, bytes: Number(linha.byte_size) }];
  });
}

/** O maior lado do PNG que substitui um logo em SVG. */
const LADO_DO_PNG = 2048;

/** As medidas de um SVG: as do viewBox, ou a largura e a altura; sem nenhum, um quadrado. */
function medidasDoSvg(raiz: Element): [number, number] {
  const caixa = (raiz.getAttribute('viewBox') ?? '').trim().split(/[\s,]+/).map(Number);
  if (caixa.length === 4 && caixa[2] > 0 && caixa[3] > 0) return [caixa[2], caixa[3]];
  const largura = parseFloat(raiz.getAttribute('width') ?? '');
  const altura = parseFloat(raiz.getAttribute('height') ?? '');
  if (largura > 0 && altura > 0) return [largura, altura];
  return [1, 1];
}

/**
 * Um logo em SVG vira PNG antes de sair do navegador. Um SVG pode levar
 * script, que rodaria com o acesso da conta se alguém abrisse a imagem numa
 * aba nova; o PNG não roda nada. O SVG é desenhado como imagem (que não roda
 * script) no tamanho do maior lado de LADO_DO_PNG, e nunca entra na página.
 */
async function svgEmPng(svg: File): Promise<File> {
  const texto = await svg.text();
  // Um documento lido pelo DOMParser não roda nada; ele só dá as medidas
  const documento = new DOMParser().parseFromString(texto, 'image/svg+xml');
  const raiz = documento.documentElement;
  if (raiz.nodeName !== 'svg' || documento.querySelector('parsererror')) throw new FalhaDaMidia('svg-invalido');
  const [largura, altura] = medidasDoSvg(raiz);
  const escala = LADO_DO_PNG / Math.max(largura, altura);
  const w = Math.max(1, Math.round(largura * escala));
  const h = Math.max(1, Math.round(altura * escala));
  // Com a largura e a altura no próprio SVG, o desenho sai nítido e sem sobra
  raiz.setAttribute('width', String(w));
  raiz.setAttribute('height', String(h));
  const endereco = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(documento)], { type: 'image/svg+xml' }));
  try {
    const imagem = new Image();
    imagem.src = endereco;
    await imagem.decode();
    const tela = document.createElement('canvas');
    tela.width = w;
    tela.height = h;
    const contexto = tela.getContext('2d');
    if (!contexto) throw new FalhaDaMidia('svg-invalido');
    contexto.drawImage(imagem, 0, 0, w, h);
    const png = await new Promise<Blob | null>((resolve) => tela.toBlob(resolve, 'image/png'));
    if (!png) throw new FalhaDaMidia('svg-invalido');
    return new File([png], `${semExtensao(svg.name)}.png`, { type: 'image/png' });
  } catch (erro) {
    if (erro instanceof FalhaDaMidia) throw erro;
    throw new FalhaDaMidia('svg-invalido');
  } finally {
    URL.revokeObjectURL(endereco);
  }
}

/** Sem notícia de um envio ou de uma descida por este tempo, a conexão caiu. */
const ESPERA_SEM_PROGRESSO_MS = 30_000;

/**
 * O motivo de uma resposta de erro do Storage. O código vem no corpo:
 * 413 e 415 para o tamanho e o formato, 403 para a sessão recusada, e os
 * limites da conta chegam como "database error, code: MD001" (o espaço) ou
 * MD002 (os arquivos), os códigos do gatilho do banco.
 */
function falhaDoStorage(status: number, corpo: string): MotivoDaFalha {
  let resposta: { statusCode?: unknown; message?: unknown } = {};
  try {
    resposta = JSON.parse(corpo) ?? {};
  } catch {
    // Sem corpo em JSON, vale o status
  }
  const codigo = String(resposta.statusCode ?? status);
  const mensagem = String(resposta.message ?? '');
  if (/\bMD001\b/.test(mensagem)) return 'sem-espaco';
  if (/\bMD002\b/.test(mensagem)) return 'muitos-arquivos';
  if (codigo === '413') return 'grande-demais';
  if (codigo === '415') return 'formato';
  // A regra de envio recusa a pasta de outra conta: não é a sessão
  if (/row-level security/i.test(mensagem)) return 'recusado';
  if (codigo === '401' || codigo === '403') return 'sem-login';
  return 'recusado';
}

/** O token da sessão, só se ela ainda for a da conta: outra aba pode ter entrado com outra. */
async function tokenDaConta(conta: string): Promise<string> {
  const { data } = await banco().auth.getSession();
  const token = data.session?.access_token;
  if (!token || data.session?.user.id !== conta) throw new FalhaDaMidia('sem-login');
  return token;
}

/**
 * Envia o arquivo para o bucket, com o progresso de 0 a 100: o cliente do
 * Supabase não o dá. Uma falha depois do último byte é 'sem-confirmacao': o
 * arquivo pode ter ficado no bucket.
 */
async function subirArquivo(conta: string, caminho: string, arquivo: File, onProgresso: (progresso: number) => void): Promise<void> {
  const token = await tokenDaConta(conta);
  const { url, publishableKey } = getSupabaseBrowserConfig();
  return new Promise((resolve, reject) => {
    const pedido = new XMLHttpRequest();
    let parado: ReturnType<typeof setTimeout> | undefined;
    let enviouTudo = false;
    const vigiar = () => {
      clearTimeout(parado);
      parado = setTimeout(() => pedido.abort(), ESPERA_SEM_PROGRESSO_MS);
    };
    const falhou = () => {
      clearTimeout(parado);
      reject(new FalhaDaMidia(enviouTudo ? 'sem-confirmacao' : 'sem-conexao'));
    };
    pedido.open('POST', `${url}/storage/v1/object/${BUCKET}/${caminho}`);
    pedido.setRequestHeader('Authorization', `Bearer ${token}`);
    pedido.setRequestHeader('apikey', publishableKey);
    pedido.setRequestHeader('x-upsert', 'false');
    pedido.setRequestHeader('Content-Type', arquivo.type);
    pedido.upload.onprogress = (evento) => {
      vigiar();
      if (evento.lengthComputable) onProgresso(Math.floor((evento.loaded / evento.total) * 100));
    };
    // O último byte saiu: daqui em diante a espera é pela resposta do Storage
    pedido.upload.onload = () => {
      enviouTudo = true;
      vigiar();
    };
    pedido.onload = () => {
      clearTimeout(parado);
      if (pedido.status >= 200 && pedido.status < 300) resolve();
      else reject(new FalhaDaMidia(falhaDoStorage(pedido.status, pedido.responseText)));
    };
    pedido.onerror = falhou;
    pedido.onabort = falhou;
    vigiar();
    pedido.send(arquivo);
  });
}

/** O que a conta já guarda, e o que está sendo enviado agora, para recusar antes o que passaria dos limites. */
export interface UsoDaConta {
  bytes: number;
  arquivos: number;
}

/**
 * Envia o arquivo para a pasta da conta e grava a ficha dele. Só resolve
 * quando o Storage e o banco confirmam (Regra do Salvo de Verdade); se a
 * ficha não entra, o arquivo sai de novo do bucket. Um logo em SVG vai como
 * PNG: devolve a ficha e o arquivo que foi, para a cópia e a tela usarem o
 * PNG, e não o SVG.
 */
export async function enviarArquivo(
  conta: string,
  tipo: TipoDeMidia,
  original: File,
  uso: UsoDaConta,
  onProgresso: (progresso: number) => void,
): Promise<{ ficha: FichaDaMidia; arquivo: File }> {
  if (!FORMATOS[tipo].includes(original.type)) throw new FalhaDaMidia('formato');
  const arquivo = original.type === 'image/svg+xml' ? await svgEmPng(original) : original;
  if (arquivo.size > LIMITE_DO_ARQUIVO) throw new FalhaDaMidia('grande-demais');
  if (uso.arquivos >= LIMITE_DE_ARQUIVOS) throw new FalhaDaMidia('muitos-arquivos');
  if (uso.bytes + arquivo.size > LIMITE_DA_CONTA) throw new FalhaDaMidia('sem-espaco');
  if ((await contaParaGravar()) !== conta) throw new FalhaDaMidia('sem-login');

  const id = crypto.randomUUID();
  const caminho = `${conta}/${id}.${EXTENSOES[arquivo.type]}`;
  try {
    await subirArquivo(conta, caminho, arquivo, onProgresso);
  } catch (erro) {
    // Sem resposta depois do último byte, o arquivo pode ter ficado no bucket, sem ficha
    if (motivoDaFalha(erro) === 'sem-confirmacao') void banco().storage.from(BUCKET).remove([caminho]);
    throw erro;
  }
  // O nome do arquivo que foi: um logo em SVG vai como PNG, com a extensão dele
  const nome = nomeParaFicha(arquivo.name || tipo);
  try {
    await gravarComConfirmacao(async (dono) => {
      const { error } = await banco()
        .from('media_assets')
        .insert({
          id,
          owner_id: dono,
          storage_path: caminho,
          filename: nome,
          content_type: arquivo.type,
          byte_size: arquivo.size,
          metadata: { tipo },
        });
      if (error) throw error;
    });
  } catch (erro) {
    // Sem a ficha, ninguém vê o arquivo, e ele ocuparia o espaço da conta
    void banco().storage.from(BUCKET).remove([caminho]);
    throw erro;
  }
  return { ficha: { id, tipo, nome: semExtensao(nome), caminho, bytes: arquivo.size }, arquivo };
}

/**
 * Baixa um arquivo da conta, com o progresso de 0 a 100. Um arquivo que não
 * vem é só uma falha: nada é apagado por causa dela, porque um 404 pode ser de
 * um caminho, de um bucket ou de uma regra, e não do arquivo. Quem decide
 * excluir é a pessoa.
 */
export async function baixarArquivo(
  conta: string,
  caminho: string,
  onProgresso: (progresso: number) => void,
  sinal: AbortSignal,
): Promise<Blob> {
  const token = await tokenDaConta(conta);
  const { url, publishableKey } = getSupabaseBrowserConfig();
  const controle = new AbortController();
  const parar = () => controle.abort();
  sinal.addEventListener('abort', parar);
  if (sinal.aborted) parar();
  let parado: ReturnType<typeof setTimeout> | undefined;
  const vigiar = () => {
    clearTimeout(parado);
    parado = setTimeout(parar, ESPERA_SEM_PROGRESSO_MS);
  };
  try {
    vigiar();
    const resposta = await fetch(`${url}/storage/v1/object/authenticated/${BUCKET}/${caminho}`, {
      headers: { Authorization: `Bearer ${token}`, apikey: publishableKey },
      signal: controle.signal,
    });
    if (!resposta.ok) throw new FalhaDaMidia(falhaDoStorage(resposta.status, await resposta.text()));
    const total = Number(resposta.headers.get('content-length')) || 0;
    const leitor = resposta.body?.getReader();
    if (!leitor) return await resposta.blob();
    const partes: Uint8Array[] = [];
    let recebidos = 0;
    let dito = -1;
    for (;;) {
      const { done, value } = await leitor.read();
      if (done) break;
      vigiar();
      partes.push(value);
      recebidos += value.length;
      const progresso = total ? Math.floor((recebidos / total) * 100) : -1;
      if (progresso >= 0 && progresso !== dito) {
        dito = progresso;
        onProgresso(progresso);
      }
    }
    return new Blob(partes as BlobPart[], { type: resposta.headers.get('content-type') ?? '' });
  } catch (erro) {
    if (erro instanceof FalhaDaMidia) throw erro;
    throw new FalhaDaMidia('sem-conexao');
  } finally {
    clearTimeout(parado);
    sinal.removeEventListener('abort', parar);
  }
}

/** Apaga o arquivo e a ficha, e só resolve quando os dois confirmam. */
export async function excluirArquivo(ficha: FichaDaMidia): Promise<void> {
  // Primeiro o arquivo: se a ficha não sair, o item fica e a exclusão pode ser
  // repetida; apagar de novo um arquivo que já saiu não falha
  await gravarComConfirmacao(async () => {
    const { error } = await banco().storage.from(BUCKET).remove([ficha.caminho]);
    if (error) throw error;
  });
  await gravarComConfirmacao(async () => {
    const { error } = await banco().from('media_assets').delete().eq('id', ficha.id);
    if (error) throw error;
  });
}

/** O nome que o estúdio dá a um arquivo no bucket: `{id}.{extensão}`. */
const NOME_DO_ESTUDIO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp|mp4|webm)$/;


/**
 * Tira da pasta os arquivos sem ficha, de envios que pararam no meio e não
 * conseguiram se desfazer: eles ocupariam o espaço da conta sem aparecer. É
 * arrumação, sem confirmar, e só quando não há dúvida:
 * - só a conta desta aba arruma a própria pasta;
 * - as fichas vêm todas, de qualquer tipo (lerFichas deixa de fora os tipos que
 *   esta versão não conhece), e sem nenhuma ficha, ou com a lista cortada (a
 *   API devolve até um teto de linhas, sem avisar), nada sai: uma leitura
 *   errada apagaria tudo;
 * - só arquivos com o nome que o estúdio dá, e com mais de um dia: um envio de
 *   agora pode estar gravando a ficha, e o relógio deste aparelho pode estar
 *   adiantado.
 */
export async function limparSobras(conta: string): Promise<void> {
  if ((await contaParaGravar().catch(() => null)) !== conta) return;
  const fichas = await banco().from('media_assets').select('storage_path', { count: 'exact' }).eq('owner_id', conta);
  if (fichas.error || fichas.data.length === 0 || fichas.count !== fichas.data.length) return;
  const { data, error } = await banco().storage.from(BUCKET).list(conta, { limit: 1000 });
  if (error || !data) return;
  const comFicha = new Set(fichas.data.map((linha) => linha.storage_path));
  const umDiaAtras = Date.now() - 24 * 60 * 60 * 1000;
  const sobras = data
    .filter(
      (objeto) =>
        objeto.id &&
        NOME_DO_ESTUDIO.test(objeto.name) &&
        !comFicha.has(`${conta}/${objeto.name}`) &&
        Date.parse(objeto.created_at) < umDiaAtras,
    )
    .map((objeto) => `${conta}/${objeto.name}`);
  if (sobras.length) await banco().storage.from(BUCKET).remove(sobras);
}
