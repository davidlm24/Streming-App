// A mídia do estúdio (logos, fundos, sobreposições e clipes) fica neste
// navegador, no IndexedDB, separada por conta: cada registro leva o uid, e cada
// conta lê só os seus. Nada sai daqui. O Storage do Firebase deste projeto
// nunca existiu, e o "envio para a nuvem" caía, calado, numa cópia em base64 no
// localStorage, a mesma para todas as contas, ou num endereço que sumia ao
// recarregar. A nuvem vem com o Storage do Supabase, na migração.

export type TipoDeMidia = 'logo' | 'fundo' | 'sobreposicao' | 'clipe';

export interface MidiaGuardada {
  /** O uid da conta dona do arquivo. */
  conta: string;
  id: string;
  tipo: TipoDeMidia;
  nome: string;
  /** Quando foi guardada, em ISO 8601: dá a ordem da biblioteca. */
  guardadaEm: string;
  arquivo: Blob;
}

/** Por que o navegador não leu, não guardou ou não apagou um arquivo. */
export type MotivoDaFalha = 'sem-espaco' | 'indisponivel';

export class FalhaDaMidia extends Error {
  constructor(readonly motivo: MotivoDaFalha) {
    super(motivo);
    this.name = 'FalhaDaMidia';
  }
}

export const motivoDaFalha = (erro: unknown): MotivoDaFalha =>
  erro instanceof FalhaDaMidia ? erro.motivo : 'indisponivel';

const BANCO = 'pwstreamer-midia';
const ARQUIVOS = 'arquivos';

let abertura: Promise<IDBDatabase> | null = null;

function abrir(): Promise<IDBDatabase> {
  if (!abertura) {
    abertura = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new FalhaDaMidia('indisponivel'));
        return;
      }
      const pedido = indexedDB.open(BANCO, 1);
      pedido.onupgradeneeded = () => {
        const arquivos = pedido.result.createObjectStore(ARQUIVOS, { keyPath: ['conta', 'id'] });
        arquivos.createIndex('conta', 'conta');
      };
      pedido.onsuccess = () => {
        const banco = pedido.result;
        // Fechado pelo navegador (os dados do site apagados) ou por uma versão nova:
        // a próxima leitura abre de novo, em vez de tentar sempre a conexão morta
        const esquecer = () => {
          banco.close();
          abertura = null;
        };
        banco.onclose = esquecer;
        banco.onversionchange = esquecer;
        resolve(banco);
      };
      pedido.onerror = () => reject(new FalhaDaMidia('indisponivel'));
    });
    // Uma falha não fica guardada: a próxima leitura tenta abrir de novo
    abertura.catch(() => {
      abertura = null;
    });
  }
  return abertura;
}

// O erro de espaço chega como QuotaExceededError, no aborto da transação
const falhaDe = (erro: DOMException | null) =>
  new FalhaDaMidia(erro?.name === 'QuotaExceededError' ? 'sem-espaco' : 'indisponivel');

/** A mídia de uma conta, na ordem em que foi guardada. */
export async function lerMidiaDaConta(conta: string): Promise<MidiaGuardada[]> {
  const banco = await abrir();
  return new Promise((resolve, reject) => {
    const pedido = banco.transaction(ARQUIVOS, 'readonly').objectStore(ARQUIVOS).index('conta').getAll(conta);
    pedido.onsuccess = () =>
      resolve(
        (pedido.result as MidiaGuardada[])
          .filter((m) => m.arquivo instanceof Blob)
          .sort((a, b) => a.guardadaEm.localeCompare(b.guardadaEm)),
      );
    pedido.onerror = () => reject(falhaDe(pedido.error));
  });
}

/** Guarda e só resolve quando o navegador confirma a gravação (Regra do Salvo de Verdade). */
export async function guardarMidia(midia: MidiaGuardada): Promise<void> {
  const banco = await abrir();
  return new Promise((resolve, reject) => {
    const transacao = banco.transaction(ARQUIVOS, 'readwrite');
    transacao.objectStore(ARQUIVOS).put(midia);
    transacao.oncomplete = () => resolve();
    transacao.onabort = () => reject(falhaDe(transacao.error));
  });
}

/** Apaga e só resolve quando o navegador confirma. */
export async function apagarMidia(conta: string, id: string): Promise<void> {
  const banco = await abrir();
  return new Promise((resolve, reject) => {
    const transacao = banco.transaction(ARQUIVOS, 'readwrite');
    transacao.objectStore(ARQUIVOS).delete([conta, id]);
    transacao.oncomplete = () => resolve();
    transacao.onabort = () => reject(falhaDe(transacao.error));
  });
}
