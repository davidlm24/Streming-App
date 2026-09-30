import { auth } from './firebase';

/**
 * `fetch` para a API do próprio app, com o token de login. É o único: a
 * remediação de segurança tinha criado um segundo (`authenticatedFetch`) que
 * fazia o mesmo.
 *
 * As rotas da API (exceto a de saúde e o webhook do Stripe) exigem
 * `Authorization: Bearer <ID token do Firebase>` — o servidor confere o token
 * e tira dele quem está chamando, em vez de acreditar no corpo da requisição.
 *
 * Espera a sessão salva ser restaurada antes de ler `currentUser`: logo depois
 * de recarregar a página ele ainda é null, e a chamada sairia sem token. Sem
 * sessão, a chamada vai sem token e o servidor responde 401; quem chama trata
 * `!res.ok`.
 */
export async function apiFetch(caminho: string, init: RequestInit = {}): Promise<Response> {
  await auth.authStateReady();
  const token = await auth.currentUser?.getIdToken().catch(() => undefined);
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(caminho, { ...init, headers });
}
