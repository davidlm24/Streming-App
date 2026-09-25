import { auth } from './firebase';

/**
 * `fetch` para a API do próprio app, com o token de login.
 *
 * As rotas que gastam cota paga (Gemini, Cloudflare), cobram (checkout) ou
 * fazem o servidor conectar em endereço externo exigem
 * `Authorization: Bearer <ID token do Firebase>` — o servidor confere o token
 * e tira dele quem está chamando, em vez de acreditar no corpo da requisição.
 *
 * Sem sessão do Firebase (login de desenvolvimento, sem Google) a chamada vai
 * sem token e o servidor responde 401; os chamadores já tratam `!res.ok`.
 */
export async function apiFetch(caminho: string, init: RequestInit = {}): Promise<Response> {
  const token = await auth.currentUser?.getIdToken().catch(() => undefined);
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(caminho, { ...init, headers });
}
