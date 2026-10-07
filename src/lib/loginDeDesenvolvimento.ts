// Entrar no estúdio sem digitar login, em desenvolvimento.
//
// Recarregar a página custava um login a cada vez. Aqui o app entra sozinho
// com uma conta de teste, para o trabalho no estúdio não ser interrompido.
//
// Três travas, e todas precisam passar:
//  1. `import.meta.env.DEV`. O Vite apaga o ramo inteiro no build de
//     produção, e com ele as credenciais abaixo — o pacote não as carrega.
//  2. O Supabase tem de ser o local (127.0.0.1 ou localhost). Um build de
//     desenvolvimento apontado para a nuvem não entra em conta nenhuma.
//  3. A conta é de semente, criada por `npm run db:contas`, e só existe no
//     banco local. A senha está em `scripts/contas-de-teste.mjs`, de onde
//     esta cópia veio.
//
// Sair continua funcionando: a saída desliga a entrada automática, senão a
// próxima carga entraria de novo e não haveria como testar o logout. A tela
// de entrar mostra como religar.
import { getSupabaseBrowserClient } from './supabase';

/** A conta de semente, igual à de `scripts/contas-de-teste.mjs`. Trocável pelo `.env`. */
const EMAIL = import.meta.env.VITE_DEV_LOGIN_EMAIL?.trim() || "dona@example.test";
const SENHA = import.meta.env.VITE_DEV_LOGIN_SENHA?.trim() || "senha-local-da-dona";

/** Quem saiu de propósito não é trazido de volta na recarga seguinte. */
const DESLIGADA = 'pw_dev_entrada_automatica_desligada';

const ehLocal = (url: string | undefined) => /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url?.trim() ?? '');

/** Em desenvolvimento, contra o Supabase local: as duas primeiras travas. */
export function entradaAutomaticaDisponivel(): boolean {
  return import.meta.env.DEV && ehLocal(import.meta.env.VITE_SUPABASE_URL);
}

function lerDesligada(): boolean {
  try {
    return localStorage.getItem(DESLIGADA) === 'sim';
  } catch {
    // Sem armazenamento, vale como ligada
    return false;
  }
}

/** A entrada automática está disponível, mas desligada por uma saída? */
export function entradaAutomaticaDesligada(): boolean {
  return entradaAutomaticaDisponivel() && lerDesligada();
}

/** Chamado ao sair: a próxima carga não entra sozinha. */
export function desligarEntradaAutomatica(): void {
  if (!entradaAutomaticaDisponivel()) return;
  try {
    localStorage.setItem(DESLIGADA, 'sim');
  } catch {
    // Sem armazenamento, a saída já vale só nesta visita
  }
}

export function religarEntradaAutomatica(): void {
  try {
    localStorage.removeItem(DESLIGADA);
  } catch {
    // Sem armazenamento, não havia o que desligar
  }
}

/**
 * Entra com a conta de teste, se as travas deixarem e ainda não houver
 * sessão. Dá false quando não era o caso, ou quando o banco local recusou —
 * aí a tela de entrar aparece normalmente, com o formulário de
 * desenvolvimento.
 */
export async function entrarSozinho(): Promise<boolean> {
  if (!entradaAutomaticaDisponivel() || lerDesligada()) return false;
  const banco = getSupabaseBrowserClient();
  const { data } = await banco.auth.getSession();
  if (data.session) return false;
  const { error } = await banco.auth.signInWithPassword({ email: EMAIL, password: SENHA });
  if (error) {
    // O banco local pode estar parado, ou sem as contas de semente
    console.info(`Entrada automática de desenvolvimento não funcionou (${error.message}). Rode npm run db:start e npm run db:contas, ou entre pelo formulário.`);
    return false;
  }
  return true;
}
