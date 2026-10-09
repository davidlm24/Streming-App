import crypto from 'node:crypto';

/**
 * O bilhete que a API dá ao navegador para entrar no motor de transmissão.
 *
 * A API (Vercel) e o motor (Fly.io) são processos diferentes com um segredo
 * em comum (MOTOR_SEGREDO). A API confere o login no Supabase, grava a
 * transmissão no banco e assina este bilhete; o motor só confere a assinatura
 * e o prazo, sem falar com o Supabase. É um JWT compacto de verdade (HS256),
 * para qualquer ferramenta decodificar, feito só com o crypto do Node para o
 * motor não carregar dependência.
 *
 * Vale por pouco tempo (o bastante para o navegador abrir o WebSocket): quem
 * o roubasse de um log só poderia abrir a transmissão que ele nomeia, nos
 * segundos seguintes, e ainda assim sem as chaves dos canais.
 */
export interface BilheteDoMotor {
  /** A transmissão (stream_sessions.id). */
  sid: string;
  /** Quem opera (auth.users.id). */
  uid: string;
  /** Quantos canais a API gravou para esta transmissão: o motor não aceita mais que isso. */
  n: number;
  /** Vence em (segundos desde a época). */
  exp: number;
}

export const PRAZO_DO_BILHETE_S = 120;

const b64 = (dados: Buffer | string) => Buffer.from(dados).toString('base64url');
const CABECALHO = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

function assinar(corpo: string, segredo: string) {
  return crypto.createHmac('sha256', segredo).update(corpo).digest('base64url');
}

export function emitirBilhete(dados: Omit<BilheteDoMotor, 'exp'>, segredo: string, agora = Date.now()): string {
  const carga: BilheteDoMotor = { ...dados, exp: Math.floor(agora / 1000) + PRAZO_DO_BILHETE_S };
  const corpo = `${CABECALHO}.${b64(JSON.stringify(carga))}`;
  return `${corpo}.${assinar(corpo, segredo)}`;
}

/** O bilhete válido, ou null: assinatura errada, vencido ou malformado. */
export function conferirBilhete(bilhete: string, segredo: string, agora = Date.now()): BilheteDoMotor | null {
  const partes = bilhete.split('.');
  if (partes.length !== 3) return null;
  const corpo = `${partes[0]}.${partes[1]}`;
  const esperada = Buffer.from(assinar(corpo, segredo));
  const recebida = Buffer.from(partes[2]);
  if (esperada.length !== recebida.length || !crypto.timingSafeEqual(esperada, recebida)) return null;
  let carga: unknown;
  try {
    carga = JSON.parse(Buffer.from(partes[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!carga || typeof carga !== 'object') return null;
  const { sid, uid, n, exp } = carga as Record<string, unknown>;
  if (typeof sid !== 'string' || typeof uid !== 'string' || !Number.isInteger(n) || !Number.isInteger(exp)) return null;
  if ((exp as number) * 1000 < agora) return null;
  return { sid, uid, n: n as number, exp: exp as number };
}

/** O segredo que o motor manda de volta à API (Authorization: Bearer), comparado sem vazar o tempo. */
export function segredoConfere(recebido: string | undefined, segredo: string): boolean {
  if (!recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(segredo);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
