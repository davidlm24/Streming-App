// As cópias da mídia da conta neste navegador, no IndexedDB. A mídia fica na
// conta (midiaDaConta); a cópia deixa o estúdio abrir sem baixar cada arquivo
// de novo, o que gastaria o tráfego do plano e atrasaria os clipes. A chave é
// o caminho do arquivo no bucket, que começa pelo uid da conta e nunca muda:
// um arquivo novo tem outro caminho, então uma cópia nunca fica velha. As
// cópias saem quando a pessoa sai da conta ou a sessão acaba (dadosDaConta),
// como as outras cópias da conta.
//
// Até a etapa 4 da migração, este banco guardava a própria mídia, sem nuvem. A
// versão 2 apaga essa mídia: ela era das contas do Firebase, que não passam
// para o Supabase. Uma cópia que falha (sem espaço, navegador sem IndexedDB)
// não impede nada: o arquivo vem da conta.

const BANCO = 'pwstreamer-midia';
const VERSAO = 2;
const COPIAS = 'copias';
/** Quanto esperar o navegador: uma aba antiga pode segurar o banco aberto. */
const ESPERA_MS = 3000;

interface Copia {
  caminho: string;
  arquivo: Blob;
}

let abertura: Promise<IDBDatabase> | null = null;

// Depois de a conta sair, nada mais é copiado até a página recarregar: uma
// descida que termina nesse intervalo recriaria o banco com o arquivo dela
let copiasParadas = false;

/** Para de guardar cópias nesta página. A conta saiu ou deu lugar a outra, e a página vai recarregar. */
export function pararDeCopiar() {
  copiasParadas = true;
}

function abrir(): Promise<IDBDatabase> {
  if (!abertura) {
    abertura = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('Este navegador não tem IndexedDB.'));
        return;
      }
      const pedido = indexedDB.open(BANCO, VERSAO);
      pedido.onupgradeneeded = () => {
        const banco = pedido.result;
        // A mídia de antes, que ficava só aqui (versão 1)
        if (banco.objectStoreNames.contains('arquivos')) banco.deleteObjectStore('arquivos');
        if (!banco.objectStoreNames.contains(COPIAS)) banco.createObjectStore(COPIAS, { keyPath: 'caminho' });
      };
      pedido.onsuccess = () => {
        const banco = pedido.result;
        // Fechado pelo navegador (os dados do site apagados), por uma versão nova
        // ou para ser apagado: a próxima leitura abre de novo
        const esquecer = () => {
          banco.close();
          abertura = null;
        };
        banco.onclose = esquecer;
        banco.onversionchange = esquecer;
        resolve(banco);
      };
      pedido.onerror = () => reject(pedido.error);
    });
    // Uma falha não fica guardada: a próxima leitura tenta abrir de novo
    abertura.catch(() => {
      abertura = null;
    });
  }
  return abertura;
}

/** Uma operação nas cópias que, quando falha ou demora, dá `seFalhar` em silêncio. */
function semTravar<T>(operacao: () => Promise<T>, seFalhar: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const espera = setTimeout(() => resolve(seFalhar), ESPERA_MS);
    operacao()
      .then(resolve, () => resolve(seFalhar))
      .finally(() => clearTimeout(espera));
  });
}

function naLoja<T>(modo: IDBTransactionMode, fazer: (loja: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return abrir().then(
    (banco) =>
      new Promise<T | undefined>((resolve, reject) => {
        const transacao = banco.transaction(COPIAS, modo);
        const pedido = fazer(transacao.objectStore(COPIAS));
        transacao.oncomplete = () => resolve(pedido ? pedido.result : undefined);
        transacao.onabort = () => reject(transacao.error);
      }),
  );
}

/** A cópia de um arquivo da conta; null quando não há, ou quando o navegador não deixa ler. */
export function lerCopia(caminho: string): Promise<Blob | null> {
  return semTravar(async () => {
    const copia = (await naLoja<Copia | undefined>('readonly', (loja) => loja.get(caminho))) as Copia | undefined;
    return copia?.arquivo instanceof Blob ? copia.arquivo : null;
  }, null);
}

/** Guarda a cópia de um arquivo que a conta confirmou. Sem espaço, o arquivo fica sem cópia. */
export function guardarCopia(caminho: string, arquivo: Blob): Promise<void> {
  if (copiasParadas) return Promise.resolve();
  const copia: Copia = { caminho, arquivo };
  return semTravar(async () => {
    await naLoja('readwrite', (loja) => {
      loja.put(copia);
    });
  }, undefined);
}

export function apagarCopia(caminho: string): Promise<void> {
  return semTravar(async () => {
    await naLoja('readwrite', (loja) => {
      loja.delete(caminho);
    });
  }, undefined);
}

/**
 * Deixa só as cópias dos arquivos da lista da conta. Saem as de outras contas
 * (os caminhos delas não estão na lista) e as de arquivos excluídos em outro
 * aparelho.
 */
export function manterSoAsCopias(caminhos: string[]): Promise<void> {
  const ficam = new Set(caminhos);
  return semTravar(async () => {
    await naLoja('readwrite', (loja) => {
      const cursor = loja.openKeyCursor();
      cursor.onsuccess = () => {
        const atual = cursor.result;
        if (!atual) return;
        if (!ficam.has(String(atual.key))) loja.delete(atual.key);
        atual.continue();
      };
    });
  }, undefined);
}

/** Apaga todas as cópias. Resolve quando o navegador confirma, ou quando desiste de esperar por ele. */
export function apagarTodasAsCopias(): Promise<void> {
  return semTravar(
    () =>
      new Promise<void>((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
          resolve();
          return;
        }
        // Uma conexão aberta nesta ou em outra aba fecha sozinha (onversionchange)
        const pedido = indexedDB.deleteDatabase(BANCO);
        pedido.onsuccess = () => resolve();
        pedido.onerror = () => reject(pedido.error);
      }),
    undefined,
  );
}
