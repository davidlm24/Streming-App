import { apiFetch } from '../apiFetch';

/**
 * Os servidores ICE da sala: o STUN de sempre e, quando o servidor tem TURN
 * (src/server/turnDaSala.ts), um relay da Cloudflare para quem está numa rede
 * fechada. O TURN só vem para um link assinado pelo servidor; qualquer falha
 * aqui volta ao STUN, e a sala funciona como antes para quem conecta direto.
 */

/** O que a sala usa sem TURN. O mesmo que STUN_PADRAO no servidor. */
export const ICE_PADRAO: RTCIceServer[] = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }];

export const ASSINATURA_DA_SALA = /^[0-9a-f]{32}$/;

/** Quem opera pede ao servidor a assinatura do token da sala; null sem TURN configurado ou se o pedido falhar. */
export async function assinarSala(token: string): Promise<string | null> {
  try {
    const resposta = await apiFetch('/api/sala/assinatura', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const { assinatura } = (await resposta.json()) as { assinatura?: unknown };
    return typeof assinatura === 'string' && ASSINATURA_DA_SALA.test(assinatura) ? assinatura : null;
  } catch (erro) {
    console.warn('A sala segue sem a assinatura do TURN:', erro);
    return null;
  }
}

/**
 * Os servidores ICE para esta sala. Sem assinatura, nem pergunta: o servidor
 * só daria o STUN. Espera no máximo 5 s; quem conecta direto não precisa
 * esperar pelo TURN para entrar.
 */
export async function obterIceDaSala(token: string, assinatura: string | null): Promise<RTCIceServer[]> {
  if (!assinatura) return ICE_PADRAO;
  try {
    const resposta = await fetch('/api/sala/ice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, assinatura }),
      signal: AbortSignal.timeout(5000),
    });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const { iceServers } = (await resposta.json()) as { iceServers?: unknown };
    if (!Array.isArray(iceServers) || iceServers.length === 0) throw new Error('resposta sem iceServers');
    return iceServers as RTCIceServer[];
  } catch (erro) {
    console.warn('A sala segue só com STUN:', erro);
    return ICE_PADRAO;
  }
}
