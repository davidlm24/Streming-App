import crypto from 'node:crypto';

/**
 * O TURN da sala de convidados: um servidor que retransmite o vídeo quando
 * dois navegadores não conseguem se ver direto (redes de empresa, 4G com NAT
 * simétrico). É a Cloudflare Realtime TURN: a API pede credenciais de vida
 * curta com a chave da conta, e o navegador só recebe essas credenciais.
 *
 * Retransmitir custa, então nem todo link ganha credenciais. O token da sala
 * nasce no navegador de quem opera (o servidor não guarda salas), e o
 * servidor ASSINA esse token para quem tem login. O link do convidado leva a
 * assinatura (`/sala/<token>/<assinatura>`), e só um par token + assinatura
 * que confere recebe o TURN. Um token inventado, ou um link antigo sem
 * assinatura, segue só com STUN, como antes.
 *
 * A chave da assinatura deriva do token da API da Cloudflare: sem TURN
 * configurado não há o que assinar, e trocar o token da Cloudflare só faz os
 * links antigos voltarem ao STUN.
 */

export const TOKEN_DE_SALA = /^[0-9a-f]{32}$/;
export const ASSINATURA_DA_SALA = /^[0-9a-f]{32}$/;

/** Quanto as credenciais valem, em segundos: precisa cobrir a sala mais longa, ou a retransmissão cai no meio. */
export const VIDA_DAS_CREDENCIAIS_S = 12 * 60 * 60;

export interface ServidorIce {
  urls: string | string[];
  username?: string;
  credential?: string;
}

/** O que a sala usa sem TURN: os mesmos STUN de antes. */
export const STUN_PADRAO: ServidorIce[] = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }];

export interface ConfiguracaoDoTurn {
  idDaChave: string;
  tokenDaApi: string;
}

export function configuracaoDoTurn(env: NodeJS.ProcessEnv = process.env): ConfiguracaoDoTurn | null {
  const idDaChave = env.TURN_KEY_ID?.trim();
  const tokenDaApi = env.TURN_KEY_API_TOKEN?.trim();
  return idDaChave && tokenDaApi ? { idDaChave, tokenDaApi } : null;
}

// Uma chave só para isto, derivada do token da Cloudflare: a assinatura nunca usa o token em si
const chaveDaAssinatura = (tokenDaApi: string) => crypto.createHmac('sha256', tokenDaApi).update('pwstreamer:sala:v1').digest();

export function assinarSala(token: string, tokenDaApi: string): string {
  return crypto.createHmac('sha256', chaveDaAssinatura(tokenDaApi)).update(token).digest('hex').slice(0, 32);
}

/** O par token + assinatura confere, comparado sem vazar o tempo. */
export function salaConfere(token: unknown, assinatura: unknown, tokenDaApi: string): boolean {
  if (typeof token !== 'string' || typeof assinatura !== 'string') return false;
  if (!TOKEN_DE_SALA.test(token) || !ASSINATURA_DA_SALA.test(assinatura)) return false;
  const esperada = Buffer.from(assinarSala(token, tokenDaApi));
  const recebida = Buffer.from(assinatura);
  return esperada.length === recebida.length && crypto.timingSafeEqual(esperada, recebida);
}

/**
 * Tira as URLs na porta 53: os navegadores as bloqueiam, e a sala espera
 * todos os candidatos antes de mandar a oferta (sem gotejar), então uma URL
 * que nunca responde só atrasaria cada conexão até o prazo.
 */
export function semPorta53(servidores: ServidorIce[]): ServidorIce[] {
  const naPorta53 = (url: string) => /:53(?:[?/]|$)/.test(url);
  return servidores.flatMap((s) => {
    const urls = (Array.isArray(s.urls) ? s.urls : [s.urls]).filter((u) => typeof u === 'string' && !naPorta53(u));
    return urls.length ? [{ ...s, urls }] : [];
  });
}

/** Só o que tem a forma de um RTCIceServer passa adiante: a resposta vem de fora. */
function servidoresValidos(bruto: unknown): ServidorIce[] | null {
  if (!Array.isArray(bruto)) return null;
  const lista: ServidorIce[] = [];
  for (const item of bruto) {
    if (!item || typeof item !== 'object') return null;
    const { urls, username, credential } = item as Record<string, unknown>;
    const urlsOk = typeof urls === 'string' || (Array.isArray(urls) && urls.every((u) => typeof u === 'string'));
    if (!urlsOk) return null;
    lista.push({
      urls: urls as string | string[],
      ...(typeof username === 'string' ? { username } : {}),
      ...(typeof credential === 'string' ? { credential } : {}),
    });
  }
  return lista.length ? lista : null;
}

/** Pede à Cloudflare credenciais novas, já sem a porta 53. Lança se ela não responder como esperado. */
export async function gerarIceDaCloudflare(
  config: ConfiguracaoDoTurn,
  { buscar = fetch, vidaS = VIDA_DAS_CREDENCIAIS_S }: { buscar?: typeof fetch; vidaS?: number } = {},
): Promise<ServidorIce[]> {
  const resposta = await buscar(
    `https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(config.idDaChave)}/credentials/generate-ice-servers`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.tokenDaApi}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttl: vidaS }),
      signal: AbortSignal.timeout(5000),
    },
  );
  if (!resposta.ok) throw new Error(`A Cloudflare respondeu ${resposta.status} ao pedir credenciais de TURN.`);
  const corpo = (await resposta.json().catch(() => null)) as { iceServers?: unknown } | null;
  const servidores = servidoresValidos(corpo?.iceServers);
  if (!servidores) throw new Error('A Cloudflare respondeu sem uma lista de servidores ICE válida.');
  const filtrados = semPorta53(servidores);
  if (!filtrados.length) throw new Error('Sobrou nenhum servidor ICE depois de tirar a porta 53.');
  return filtrados;
}
