// Proteções compartilhadas pela API de produção (api/index.ts, na Vercel) e
// pelo servidor local (server.ts). O `_` no nome da pasta impede a Vercel de
// transformar este arquivo numa função própria.
//
// Importar com extensão `.js` (o pacote é "type": "module"): é o caminho que
// funciona na Vercel, no tsx e no esbuild.
import type { NextFunction, Request, Response } from 'express';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';

// Identificadores públicos do projeto — os mesmos de firebase-applet-config.json.
// Variáveis de ambiente sobrepõem.
export const PROJETO_FIREBASE = process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0356999908';
export const BANCO_FIRESTORE =
  process.env.FIRESTORE_DATABASE_ID || 'ai-studio-pwstreamer-d116304c-f3fc-41ee-8b60-b6de39028c06';

const DIA_MS = 24 * 60 * 60 * 1000;
export const DIAS_DE_TESTE = 30;
export const PLANOS_PAGOS = ['Standard', 'Professional', 'Business'] as const;

/**
 * App do Admin SDK. Verificar token só precisa do projectId (chaves públicas
 * do Google). GRAVAR no Firestore — o que o webhook do Stripe faz — precisa
 * de credencial de serviço (GOOGLE_APPLICATION_CREDENTIALS).
 */
export function appAdmin() {
  return getApps().length ? getApp() : initializeApp({ projectId: PROJETO_FIREBASE });
}

function authAdmin() {
  return getAuth(appAdmin());
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export interface ReqComLogin extends Request {
  usuario?: DecodedIdToken;
  idToken?: string;
}

/**
 * Exige `Authorization: Bearer <ID token do Firebase>`. Sem isto as rotas
 * atendiam qualquer pessoa na internet — inclusive as que gastam cota paga
 * (Gemini, Cloudflare) ou fazem o servidor conectar em endereços externos.
 */
export async function exigirLogin(req: ReqComLogin, res: Response, next: NextFunction) {
  const cabecalho = req.headers.authorization || '';
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7).trim() : '';
  if (!token) {
    return res.status(401).json({ error: 'Login necessário.' });
  }
  try {
    req.usuario = await authAdmin().verifyIdToken(token);
    req.idToken = token;
    return next();
  } catch {
    return res.status(401).json({ error: 'Sessão inválida ou expirada. Entre de novo.' });
  }
}

// ---------------------------------------------------------------------------
// Destinos externos (SSRF)
// ---------------------------------------------------------------------------

function ipv4Interno(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number);
  return a === 0 || a === 10 || a === 127
    || (a === 100 && b >= 64 && b <= 127)   // CGNAT
    || (a === 169 && b === 254)             // link-local — metadados de nuvem
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 192 && b === 0)
    || (a === 198 && (b === 18 || b === 19))
    || a >= 224;                            // multicast e reservado
}

/** Os 8 grupos de 16 bits de um IPv6 — `::` expandido, IPv4 no fim convertido. */
function gruposIPv6(ip: string): number[] | null {
  let s = ip.toLowerCase().replace(/%.*$/, '');
  const v4 = s.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (v4) {
    const [a, b, c, d] = v4.slice(1).map(Number);
    s = s.slice(0, -v4[0].length) + ((a << 8) | b).toString(16) + ':' + ((c << 8) | d).toString(16);
  }
  const temAbreviacao = s.includes('::');
  const [cabeca, cauda] = s.split('::');
  const partes = (x?: string) => (x ? x.split(':').filter(Boolean) : []);
  const inicio = partes(cabeca);
  const fim = temAbreviacao ? partes(cauda) : [];
  const zeros = temAbreviacao ? 8 - inicio.length - fim.length : 0;
  const grupos = [...inicio, ...Array(Math.max(0, zeros)).fill('0'), ...fim].map((g) => parseInt(g, 16));
  return grupos.length === 8 && grupos.every((n) => n >= 0 && n <= 0xffff) ? grupos : null;
}

const ipv4DosGrupos = (alto: number, baixo: number) =>
  `${alto >> 8}.${alto & 255}.${baixo >> 8}.${baixo & 255}`;

/**
 * IPv6 interno — inclusive os que carregam um IPv4 dentro. O parser de URL
 * normaliza `[::ffff:127.0.0.1]` para `[::ffff:7f00:1]`; conferir só a forma
 * com pontos deixava o loopback passar (o teste pegou).
 */
function ipv6Interno(ip: string): boolean {
  const g = gruposIPv6(ip);
  if (!g) return true; // ininteligível: recusa
  const zerosAte = (n: number) => g.slice(0, n).every((x) => x === 0);
  if (zerosAte(8)) return true;                                         // ::
  if (zerosAte(7) && g[7] === 1) return true;                           // ::1
  if (zerosAte(5) && g[5] === 0xffff) return ipv4Interno(ipv4DosGrupos(g[6], g[7])); // mapeado
  if (zerosAte(6)) return ipv4Interno(ipv4DosGrupos(g[6], g[7]));      // compatível (obsoleto)
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) {
    return ipv4Interno(ipv4DosGrupos(g[6], g[7]));                      // NAT64
  }
  if (g[0] === 0x2002) return ipv4Interno(ipv4DosGrupos(g[1], g[2]));   // 6to4
  return (g[0] & 0xfe00) === 0xfc00                                     // fc00::/7, rede privada
    || (g[0] & 0xffc0) === 0xfe80                                       // fe80::/10, link-local
    || (g[0] & 0xff00) === 0xff00;                                      // multicast
}

function ipInterno(ip: string): boolean {
  return isIP(ip) === 4 ? ipv4Interno(ip) : ipv6Interno(ip);
}

/**
 * O servidor só conecta em host PÚBLICO. Sem isto, qualquer um usava o
 * servidor para alcançar a rede interna e os metadados da nuvem (SSRF).
 * Resta a janela de DNS rebinding entre esta resolução e a conexão — por isso
 * quem chama também não segue redirecionamento.
 */
export async function hostPublico(host: string): Promise<boolean> {
  const h = host.replace(/^\[|\]$/g, '').toLowerCase();
  if (!h || h === 'localhost' || /\.(localhost|local|internal)$/.test(h)) return false;
  if (isIP(h)) return !ipInterno(h);
  try {
    const enderecos = await lookup(h, { all: true, verbatim: true });
    return enderecos.length > 0 && enderecos.every((e) => !ipInterno(e.address));
  } catch {
    return false;
  }
}

/** URL de webhook que o servidor aceita chamar: https, porta comum, host público. */
export async function urlDeWebhookPermitida(bruta: unknown): Promise<URL | null> {
  if (typeof bruta !== 'string' || bruta.length > 2048) return null;
  let url: URL;
  try {
    url = new URL(bruta);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.username || url.password) return null;
  if (url.port && !['443', '8443'].includes(url.port)) return null;
  return (await hostPublico(url.hostname)) ? url : null;
}

/** Cabeçalhos extras do usuário, sem os que mexem no transporte. */
export function cabecalhosExtras(brutos: unknown): Record<string, string> {
  if (!brutos || typeof brutos !== 'object') return {};
  const proibidos = new Set(['host', 'connection', 'content-length', 'transfer-encoding', 'cookie', 'proxy-authorization']);
  const saida: Record<string, string> = {};
  for (const [nome, valor] of Object.entries(brutos as Record<string, unknown>).slice(0, 30)) {
    if (typeof valor !== 'string' || proibidos.has(nome.toLowerCase())) continue;
    saida[nome] = valor.slice(0, 2048);
  }
  return saida;
}

/** Lê no máximo `limite` bytes da resposta — um endpoint lento ou enorme não segura o servidor. */
export async function lerTextoLimitado(resposta: globalThis.Response, limite = 20_000): Promise<string> {
  const leitor = resposta.body?.getReader();
  if (!leitor) return '';
  const partes: Uint8Array[] = [];
  let total = 0;
  while (total < limite) {
    const { done, value } = await leitor.read();
    if (done) break;
    partes.push(value);
    total += value.length;
  }
  leitor.cancel().catch(() => {});
  return new TextDecoder().decode(Buffer.concat(partes)).slice(0, limite);
}

// ---------------------------------------------------------------------------
// Período de teste
// ---------------------------------------------------------------------------

/**
 * Lê o perfil do PRÓPRIO usuário com o token dele, pela API REST do
 * Firestore. A leitura passa pelas regras do banco como qualquer leitura do
 * app — sem credencial de serviço. `createTime` vem do banco, não do cliente.
 */
export async function lerProprioPerfil(idToken: string, uid: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJETO_FIREBASE}`
    + `/databases/${encodeURIComponent(BANCO_FIRESTORE)}/documents/users/${encodeURIComponent(uid)}`;
  const resposta = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
  if (resposta.status === 404) return null;
  if (!resposta.ok) throw new Error(`Firestore respondeu ${resposta.status}`);
  const doc = (await resposta.json()) as {
    fields?: Record<string, { stringValue?: string }>;
    createTime: string;
  };
  return {
    plan: doc.fields?.plan?.stringValue || 'Free Trial',
    trialEndsAt: doc.fields?.trialEndsAt?.stringValue,
    criadoEm: doc.createTime,
  };
}

/**
 * Acesso a partir do perfil gravado no banco — antes a rota devolvia o que o
 * cliente mandava (`isExpired`, `trialEndsAt`, `plan` no corpo da requisição).
 * O teste dura DIAS_DE_TESTE a partir da criação do perfil; o `trialEndsAt`
 * gravado pelo cliente só pode encurtar esse prazo, nunca estender.
 */
export function avaliarAcesso(perfil: NonNullable<Awaited<ReturnType<typeof lerProprioPerfil>>>) {
  if ((PLANOS_PAGOS as readonly string[]).includes(perfil.plan)) {
    return { isExpired: false, trialDays: DIAS_DE_TESTE, canBroadcast: true, canRecord: true, plan: perfil.plan };
  }
  const limite = new Date(perfil.criadoEm).getTime() + DIAS_DE_TESTE * DIA_MS;
  const declarado = perfil.trialEndsAt ? new Date(perfil.trialEndsAt).getTime() : NaN;
  const fim = Number.isFinite(declarado) ? Math.min(limite, declarado) : limite;
  const dias = Math.ceil((fim - Date.now()) / DIA_MS);
  const expirado = dias <= 0;
  return {
    isExpired: expirado,
    trialDays: Math.max(0, dias),
    canBroadcast: !expirado,
    canRecord: !expirado,
    trialEndsAt: new Date(fim).toISOString(),
    plan: 'Free Trial',
  };
}
