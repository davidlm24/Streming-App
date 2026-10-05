import { getSupabaseBrowserClient } from './supabase';

/**
 * `fetch` para a API do próprio app, com o token de login. É o único: a
 * remediação de segurança tinha criado um segundo (`authenticatedFetch`) que
 * fazia o mesmo.
 *
 * As rotas da API (exceto a de saúde e o webhook do Stripe) exigem
 * `Authorization: Bearer <token da sessão do Supabase>`: o servidor valida o
 * token no Supabase e tira dele quem está chamando, em vez de acreditar no
 * corpo da requisição.
 *
 * `getSession` espera a sessão salva ser lida e renova o token vencido. Sem
 * sessão, a chamada vai sem token e o servidor responde 401; quem chama trata
 * `!res.ok`.
 */
export async function apiFetch(caminho: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await getSupabaseBrowserClient().auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(caminho, { ...init, headers });
}
