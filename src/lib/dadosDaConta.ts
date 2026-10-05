// Os dados da conta no Supabase: a sessão, o perfil, os webinars, os roteiros,
// as listas e as configurações do estúdio e a lista da administração. Cada
// tabela tem RLS: a conta só lê e grava as próprias linhas (supabase/migrations).
// As telas usam as mesmas funções de antes, quando os dados ficavam no Firestore.
import type { User } from '@supabase/supabase-js';
import { apiFetch } from './apiFetch';
import { apagarTodasAsCopias, pararDeCopiar } from './midiaDoNavegador';
import { getSupabaseBrowserClient } from './supabase';
import type { Banner, Destination, TickerItem } from '../types.ts';

const banco = () => getSupabaseBrowserClient();

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  plan: 'Standard' | 'Professional' | 'Business' | 'Free Trial';
  isExpired: boolean;
  trialDays: number;
  role?: 'super-admin' | 'client';
  // 'expired' é escrito pelo App quando o teste acaba; faltava na união.
  subscriptionStatus?: 'trial' | 'active' | 'past_due' | 'canceled' | 'expired';
  trialEndsAt?: string;
}

export interface WebinarData {
  id: string;
  title: string;
  /** Só em webinars antigos: a Descrição saiu do formulário com a página pública. */
  desc?: string;
  time: string;
  channels: string[];
  type: 'live' | 'webinar' | 'pre-recorded';
  videoName: string;
  ownerId?: string;
  /** Horário em ISO 8601 (webinars agendados pelo formulário). `time` fica como texto por extenso. */
  startsAt?: string;
}

// ── Falhas ──────────────────────────────────────────────────────────────────

/** Por que uma gravação não foi confirmada. A tela diz cada caso com a sua saída. */
export type FalhaAoSalvar = 'sem-login' | 'sem-conexao' | 'sem-confirmacao' | 'recusado';

export class ErroAoSalvar extends Error {
  readonly motivo: FalhaAoSalvar;
  constructor(motivo: FalhaAoSalvar) {
    super(motivo);
    this.motivo = motivo;
  }
}

/** Por que não deu para entrar. A tela de entrada diz cada caso. */
export type FalhaAoEntrar = 'google-desligado' | 'credenciais' | 'ja-existe' | 'confirmar-email' | 'sem-conexao' | 'outra';

export class ErroAoEntrar extends Error {
  readonly motivo: FalhaAoEntrar;
  constructor(motivo: FalhaAoEntrar) {
    super(motivo);
    this.motivo = motivo;
  }
}

function erroDeRede(erro: unknown): boolean {
  const e = erro as { name?: string; message?: string } | null;
  return /Failed to fetch|NetworkError|Load failed|fetch failed/i.test(`${e?.name ?? ''} ${e?.message ?? ''}`);
}

/** O motivo de uma falha do Supabase, na língua da tela. */
export function falhaDoSupabase(erro: unknown): FalhaAoSalvar {
  if (erroDeRede(erro)) return 'sem-conexao';
  // O token venceu ou foi recusado: a API responde com esses códigos
  const codigo = (erro as { code?: string } | null)?.code;
  if (codigo === 'PGRST301' || codigo === 'PGRST303') return 'sem-login';
  return 'recusado';
}

// ── Sessão ──────────────────────────────────────────────────────────────────

// Quem está na sessão agora, para as leituras que não podem esperar
// (entrouComGoogle). Atualizado por subscribeAuth e por esperarSessao.
let usuarioDaSessao: User | null = null;

/** Resolve quando a sessão salva foi lida (logo depois de recarregar a página). */
export async function esperarSessao(): Promise<void> {
  const { data } = await banco().auth.getSession();
  usuarioDaSessao = data.session?.user ?? null;
}

/** Se a sessão atual entrou pelo Google, de onde vem o e-mail da conta. */
export function entrouComGoogle(): boolean {
  return (
    usuarioDaSessao?.app_metadata?.provider === 'google' ||
    (usuarioDaSessao?.identities ?? []).some((identidade) => identidade.provider === 'google')
  );
}

// A conta que esta aba viu entrar, e se ela já saiu ou deu lugar a outra (ver
// subscribeAuth). Quando outra aba entra com outra conta, a sessão muda antes
// de o aviso chegar, e o app ainda tem na memória a conta anterior: uma
// gravação nesse intervalo levaria o roteiro, os banners ou os tickers de uma
// conta para a outra.
let contaDaAba: string | null = null;
let contaTrocada = false;

/** Quanto esperar o banco responder antes de dizer que não deu para confirmar. */
const ESPERA_DA_CONFIRMACAO_MS = 10_000;

/**
 * A conta desta aba, para gravar. Falha com 'sem-login' sem sessão ou depois de
 * a conta sair ou dar lugar a outra, e com 'sem-conexao' fora do ar.
 */
export async function contaParaGravar(): Promise<string> {
  // Logo depois de recarregar, a sessão ainda está sendo lida, e o app já
  // mostra o usuário: sem esperar, uma sessão válida seria dada como expirada.
  await esperarSessao();
  const uid = usuarioDaSessao?.id;
  if (!uid || contaTrocada || (contaDaAba && uid !== contaDaAba)) throw new ErroAoSalvar('sem-login');
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new ErroAoSalvar('sem-conexao');
  return uid;
}

/**
 * Grava e só resolve depois de o banco confirmar (Regra do Salvo de Verdade).
 * O Supabase só responde depois de gravar; a espera cobre a resposta que não
 * chega. Falha com o motivo, para a tela dizer a saída.
 */
export async function gravarComConfirmacao(gravar: (uid: string) => Promise<void>): Promise<void> {
  const uid = await contaParaGravar();

  let espera: ReturnType<typeof setTimeout> | undefined;
  const semConfirmacao = new Promise<never>((_, rejeitar) => {
    espera = setTimeout(() => rejeitar(new ErroAoSalvar('sem-confirmacao')), ESPERA_DA_CONFIRMACAO_MS);
  });
  try {
    await Promise.race([gravar(uid), semConfirmacao]);
  } catch (erro) {
    if (erro instanceof ErroAoSalvar) throw erro;
    console.warn('Gravação não confirmada:', (erro as { code?: string })?.code ?? erro);
    throw new ErroAoSalvar(falhaDoSupabase(erro));
  } finally {
    clearTimeout(espera);
  }
}

// ── Cópias neste navegador ──────────────────────────────────────────────────
// A última versão que o banco confirmou, para as listas abrirem antes de a
// conta responder, e as cópias da mídia do estúdio (midiaDoNavegador). Saem
// quando a pessoa sai da conta e quando a sessão acaba, para não ficarem para
// o próximo num computador compartilhado.
const COPIAS_DA_CONTA = ['pwstream_user', 'pwstream_transmission_settings_', 'pwstream_destinations_', 'pwstream_webinars_', 'pwstream_banners_', 'pwstream_tickers_'];

/** Resolve quando o navegador apagou as cópias, ou quando desistiu de esperar por ele. */
function apagarCopiasDaConta(): Promise<void> {
  try {
    Object.keys(localStorage)
      .filter((chave) => COPIAS_DA_CONTA.some((prefixo) => chave.startsWith(prefixo)))
      .forEach((chave) => localStorage.removeItem(chave));
  } catch {
    // Sem armazenamento, não há o que apagar
  }
  return apagarTodasAsCopias();
}

function guardarNoAparelho(chave: string, valor: unknown) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Sem armazenamento, a lista abre quando a conta responder
  }
}

function lerDoAparelho(chave: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(chave) ?? 'null');
  } catch {
    return null;
  }
}

// ── Tempo real ──────────────────────────────────────────────────────────────

/**
 * Ouve as linhas novas e alteradas de uma tabela, filtradas pela conta. A RLS
 * vale também aqui. As exclusões não chegam: o banco não as filtra por conta, e
 * quem exclui é esta própria aba, que já tira o item da lista.
 */
function ouvirMudancas(
  tabela: 'webinars' | 'studio_settings',
  filtro: string,
  aoMudar: (linha: Record<string, unknown>) => void,
): () => void {
  const cliente = banco();
  const canal = cliente
    .channel(`${tabela}:${filtro}:${crypto.randomUUID()}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: tabela, filter: filtro }, (mudanca) =>
      aoMudar(mudanca.new as Record<string, unknown>),
    )
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: tabela, filter: filtro }, (mudanca) =>
      aoMudar(mudanca.new as Record<string, unknown>),
    )
    .subscribe();
  return () => {
    void cliente.removeChannel(canal);
  };
}

// ── Entrar e sair ───────────────────────────────────────────────────────────

function perfilPadrao(usuario: User): UserProfile {
  const metadados = usuario.user_metadata ?? {};
  return {
    uid: usuario.id,
    email: usuario.email ?? '',
    name: String(metadados.full_name ?? metadados.name ?? 'Usuário PwStreamer'),
    photoURL: String(metadados.avatar_url ?? metadados.picture ?? ''),
    plan: 'Free Trial',
    isExpired: false,
    trialDays: 30,
    role: 'client',
    subscriptionStatus: 'trial',
  };
}

/** O perfil que o servidor monta (plano, teste e papel), para quem está na sessão. */
async function carregarPerfil(usuario: User): Promise<UserProfile> {
  const resposta = await apiFetch('/api/auth/profile');
  if (!resposta.ok) {
    throw new Error(resposta.status === 503
      ? 'O serviço de perfil está temporariamente indisponível.'
      : 'Não foi possível validar o perfil autenticado.');
  }
  return { ...perfilPadrao(usuario), ...(await resposta.json()) };
}

/**
 * Quais formas de entrar o projeto aceita. O projeto de produção só aceita o
 * Google; o local, de desenvolvimento, também aceita e-mail e senha. A
 * resposta é a mesma para todo mundo e não depende de sessão, então vale uma
 * consulta por visita.
 */
export interface FormasDeEntrar {
  google: boolean;
  email: boolean;
}

let formasPedidas: Promise<FormasDeEntrar> | null = null;

export function formasDeEntrar(): Promise<FormasDeEntrar> {
  formasPedidas ??= (async () => {
    const resposta = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '' },
    });
    // Sem a resposta dos ajustes, assume que as duas valem: o próprio Supabase
    // dirá o que houve na tentativa, com a frase da falha
    if (!resposta.ok) return { google: true, email: true };
    const ajustes = (await resposta.json()) as { external?: { google?: boolean; email?: boolean } };
    return { google: ajustes?.external?.google !== false, email: ajustes?.external?.email !== false };
  })();
  // Uma falha não fica guardada: a próxima tentativa pergunta de novo
  formasPedidas.catch(() => {
    formasPedidas = null;
  });
  return formasPedidas;
}

/**
 * O login do Google está ligado no projeto? Sem isso, o Supabase abriria uma
 * página de erro crua no lugar do Google.
 */
async function googleLigado(): Promise<boolean> {
  try {
    return (await formasDeEntrar()).google;
  } catch {
    throw new ErroAoEntrar('sem-conexao');
  }
}

/**
 * Leva ao Google. O navegador sai da página e volta com a sessão, que o App
 * recebe em subscribeAuth. Antes era uma janela por cima, do Firebase, e pedia
 * três permissões do Google Meet que o app nunca usou.
 */
export async function loginWithGoogle(): Promise<void> {
  if (!(await googleLigado())) throw new ErroAoEntrar('google-desligado');
  const { error } = await banco().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw new ErroAoEntrar(erroDeRede(error) ? 'sem-conexao' : 'outra');
}

/** Só em desenvolvimento: e-mail e senha. */
export async function loginWithEmail(email: string, senha: string): Promise<UserProfile> {
  const { data, error } = await banco().auth.signInWithPassword({ email: email.trim(), password: senha });
  if (error || !data.user) {
    throw new ErroAoEntrar(
      error?.code === 'invalid_credentials' ? 'credenciais' : erroDeRede(error) ? 'sem-conexao' : 'outra',
    );
  }
  return carregarPerfil(data.user);
}

/** Só em desenvolvimento: cadastro por e-mail e senha. */
export async function registerWithEmail(email: string, senha: string, nome: string): Promise<UserProfile> {
  const { data, error } = await banco().auth.signUp({
    email: email.trim(),
    password: senha,
    options: { data: { full_name: nome.trim() } },
  });
  if (error) {
    throw new ErroAoEntrar(
      error.code === 'user_already_exists' || error.code === 'email_exists'
        ? 'ja-existe'
        : erroDeRede(error)
          ? 'sem-conexao'
          : 'outra',
    );
  }
  // Com a confirmação de e-mail ligada, a conta nasce sem sessão até a pessoa confirmar
  if (!data.session || !data.user) throw new ErroAoEntrar('confirmar-email');
  return carregarPerfil(data.user);
}

/** Sai só deste navegador, e apaga o que a conta deixou nele. */
export async function sairDaConta(): Promise<void> {
  const { error } = await banco().auth.signOut({ scope: 'local' });
  if (error) {
    // Com o token vencido e a renovação falhando, a biblioteca desiste antes de
    // apagar a sessão, e ela voltaria depois de recarregar. Apaga aqui.
    console.warn('Sign out warning:', error);
    try {
      Object.keys(localStorage)
        .filter((chave) => chave.startsWith('sb-') && chave.includes('-auth-token'))
        .forEach((chave) => localStorage.removeItem(chave));
    } catch {
      // Sem armazenamento, não há sessão guardada
    }
  }
  // O app recarrega em seguida: as cópias da mídia saem antes
  pararDeCopiar();
  await apagarCopiasDaConta();
}

/**
 * Assina a sessão. `onContaTrocou` é chamado quando a conta desta aba sai ou dá
 * lugar a outra (sair da conta, a sessão acabar, outra aba entrar com outra
 * conta); a partir daí, nada mais é gravado pela sessão. A troca é vista aqui,
 * antes de esperar o perfil: durante a espera, a sessão já é a da conta nova.
 */
export function subscribeAuth(onUser: (user: UserProfile | null) => void, onContaTrocou: () => void) {
  // De quem o perfil já foi carregado: a renovação do token e a volta à aba
  // avisam de novo a mesma conta
  let perfilDe: string | null = null;
  const { data } = banco().auth.onAuthStateChange((_evento, sessao) => {
    usuarioDaSessao = sessao?.user ?? null;
    const conta = sessao?.user.id ?? null;
    if (contaTrocada || (contaDaAba && conta !== contaDaAba)) {
      contaTrocada = true;
      pararDeCopiar();
      void apagarCopiasDaConta();
      onContaTrocou();
      return;
    }
    contaDaAba = conta;
    if (!sessao) {
      void apagarCopiasDaConta();
      onUser(null);
      return;
    }
    if (perfilDe === conta) return;
    perfilDe = conta;
    // Fora do aviso: chamar o Supabase dentro dele trava o cliente
    setTimeout(() => {
      carregarPerfil(sessao.user).then(onUser, (erro) => {
        console.error('Error fetching user profile:', erro);
        perfilDe = null;
        onUser(null);
      });
    }, 0);
  });
  return () => data.subscription.unsubscribe();
}

// ── Perfil ──────────────────────────────────────────────────────────────────

/**
 * Troca o nome do perfil (`profiles.display_name`), de onde o login lê o nome
 * em qualquer aparelho. O app só pode trocar o nome e a foto: plano, papel e
 * datas são do servidor, e o e-mail é o do login.
 */
export async function salvarNomeDoPerfil(nome: string): Promise<void> {
  await gravarComConfirmacao(async (uid) => {
    const { data, error } = await banco().from('profiles').update({ display_name: nome }).eq('id', uid).select('id');
    if (error) throw error;
    // Nenhuma linha atualizada: a RLS recusou sem erro
    if (!data?.length) throw new ErroAoSalvar('recusado');
  });
}

// ── Webinars ────────────────────────────────────────────────────────────────

interface LinhaDeWebinar {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  scheduled_at: string | null;
  settings: Record<string, unknown> | null;
}

const COLUNAS_DO_WEBINAR = 'id, owner_id, title, description, scheduled_at, settings';

function webinarDoBanco(linha: LinhaDeWebinar): WebinarData {
  const ajustes = linha.settings ?? {};
  return {
    id: linha.id,
    title: linha.title,
    ...(linha.description ? { desc: linha.description } : {}),
    time: typeof ajustes.time === 'string' ? ajustes.time : '',
    channels: Array.isArray(ajustes.channels) ? ajustes.channels.filter((c): c is string => typeof c === 'string') : [],
    type: ajustes.type === 'live' || ajustes.type === 'pre-recorded' ? ajustes.type : 'webinar',
    videoName: typeof ajustes.videoName === 'string' ? ajustes.videoName : '',
    ownerId: linha.owner_id,
    ...(linha.scheduled_at ? { startsAt: linha.scheduled_at } : {}),
  };
}

export function subscribeWebinars(userId: string, onUpdate: (webinars: WebinarData[]) => void) {
  const chave = `pwstream_webinars_${userId}`;
  const copia = lerDoAparelho(chave);
  if (Array.isArray(copia)) onUpdate(copia as WebinarData[]);

  let viva = true;
  const buscar = async () => {
    const { data, error } = await banco()
      .from('webinars')
      .select(COLUNAS_DO_WEBINAR)
      .eq('owner_id', userId)
      .order('created_at');
    if (!viva) return;
    if (error) {
      console.warn('Supabase webinars error:', error.message);
      return;
    }
    const lista = (data as LinhaDeWebinar[]).map(webinarDoBanco);
    guardarNoAparelho(chave, lista);
    onUpdate(lista);
  };
  void buscar();
  const parar = ouvirMudancas('webinars', `owner_id=eq.${userId}`, () => void buscar());
  return () => {
    viva = false;
    parar();
  };
}

/**
 * Agenda um webinar, confirmado pelo banco. Numa nova tentativa, o mesmo id:
 * se a primeira escrita chegar atrasada, a segunda só a repete, sem criar
 * outro webinar. A lista e a cópia local vêm de `subscribeWebinars`.
 */
export async function agendarWebinar(webinar: WebinarData): Promise<void> {
  await gravarComConfirmacao(async (uid) => {
    const { error } = await banco()
      .from('webinars')
      .upsert(
        {
          id: webinar.id,
          owner_id: uid,
          title: webinar.title,
          description: webinar.desc ?? null,
          status: webinar.startsAt ? 'scheduled' : 'draft',
          scheduled_at: webinar.startsAt ?? null,
          settings: { time: webinar.time, channels: webinar.channels, type: webinar.type, videoName: webinar.videoName },
        },
        { onConflict: 'id' },
      );
    if (error) throw error;
  });
}

/** Exclui um webinar, e o roteiro dele junto (no banco, em cascata). */
export async function excluirWebinar(id: string): Promise<void> {
  await gravarComConfirmacao(async (uid) => {
    const { error } = await banco().from('webinars').delete().eq('id', id);
    if (error) throw error;
    const chave = `pwstream_webinars_${uid}`;
    const copia = lerDoAparelho(chave);
    if (Array.isArray(copia)) guardarNoAparelho(chave, (copia as WebinarData[]).filter((w) => w.id !== id));
  });
}

// ── Roteiros do teleprompter ────────────────────────────────────────────────

/** O roteiro do teleprompter e as notas de quem apresenta, de um webinar ou o geral. */
export interface RoteiroSalvo {
  texto: string;
  notas: string;
  atualizadoEm: string;
}

// O roteiro geral, para quando o estúdio abre sem webinar, é o de webinar nulo
const webinarDoRoteiro = (id: string) => (id === 'geral' ? null : id);

/** O roteiro de um webinar, ou o geral. Confirmado pelo banco, pela Regra do Salvo de Verdade. */
export async function salvarRoteiro(id: string, dados: { texto: string; notas: string }): Promise<void> {
  await gravarComConfirmacao(async (uid) => {
    const { error } = await banco()
      .from('teleprompter_scripts')
      .upsert(
        { owner_id: uid, webinar_id: webinarDoRoteiro(id), script: dados.texto, notes: dados.notas },
        { onConflict: 'owner_id,webinar_id' },
      );
    if (error) throw error;
  });
}

/** Lê o roteiro salvo; null se ainda não há. Falha com `ErroAoSalvar`. */
export async function lerRoteiro(id: string): Promise<RoteiroSalvo | null> {
  await esperarSessao();
  const uid = usuarioDaSessao?.id;
  if (!uid) throw new ErroAoSalvar('sem-login');
  const webinar = webinarDoRoteiro(id);
  const consulta = banco().from('teleprompter_scripts').select('script, notes, updated_at').eq('owner_id', uid);
  const { data, error } = await (webinar === null ? consulta.is('webinar_id', null) : consulta.eq('webinar_id', webinar)).maybeSingle();
  if (error) throw new ErroAoSalvar(falhaDoSupabase(error));
  return data ? { texto: data.script, notas: data.notes, atualizadoEm: data.updated_at } : null;
}

// ── Listas do estúdio (banners e tickers) ───────────────────────────────────
// Cada lista é uma coluna de studio_settings, gravada inteira. O aparelho
// guarda só a última lista que o banco confirmou, para ela abrir antes de a
// conta responder: uma mudança que não foi salva some ao recarregar, como a
// tela avisa.

type ListaDoEstudio = 'banners' | 'tickers';

/** Assina uma lista do estúdio: a cópia do aparelho, a do banco e as mudanças de outra aba. */
function assinarLista<T>(userId: string, campo: ListaDoEstudio, onUpdate: (lista: T[]) => void) {
  const chave = `pwstream_${campo}_${userId}`;
  const copia = lerDoAparelho(chave);
  if (Array.isArray(copia)) onUpdate(copia as T[]);

  let viva = true;
  // Uma mudança que chegou antes da leitura é mais nova que ela
  let recebeuMudanca = false;
  const entregar = (lista: unknown) => {
    if (!viva || !Array.isArray(lista)) return;
    guardarNoAparelho(chave, lista);
    onUpdate(lista as T[]);
  };
  void banco()
    .from('studio_settings')
    .select(campo)
    .eq('user_id', userId)
    .maybeSingle()
    .then(({ data, error }) => {
      if (error) {
        console.warn(`Supabase ${campo} error:`, error.message);
        return;
      }
      // Sem a linha, a conta ainda não tem a lista
      if (!recebeuMudanca) entregar(data ? (data as Record<string, unknown>)[campo] : []);
    });
  const parar = ouvirMudancas('studio_settings', `user_id=eq.${userId}`, (linha) => {
    // O tempo real deixa de fora uma coluna grande que não mudou: sem ela, a
    // mudança não é desta lista, e a leitura do banco continua valendo
    if (!(campo in linha)) return;
    recebeuMudanca = true;
    entregar(linha[campo]);
  });
  return () => {
    viva = false;
    parar();
  };
}

/** Grava a lista inteira e só resolve depois de o banco confirmar (Regra do Salvo de Verdade). */
async function gravarLista(campo: ListaDoEstudio, lista: unknown[]): Promise<void> {
  await gravarComConfirmacao(async (uid) => {
    const { error } = await banco().from('studio_settings').upsert({ user_id: uid, [campo]: lista }, { onConflict: 'user_id' });
    if (error) throw error;
    guardarNoAparelho(`pwstream_${campo}_${uid}`, lista);
  });
}

export const subscribeBanners = (userId: string, onUpdate: (banners: Banner[]) => void) =>
  assinarLista(userId, 'banners', onUpdate);

export const salvarBanners = (banners: Banner[]) => gravarLista('banners', banners);

/** Os tickers, como os banners. */
export const subscribeTickers = (userId: string, onUpdate: (tickers: TickerItem[]) => void) =>
  assinarLista(userId, 'tickers', onUpdate);

export const salvarTickers = (tickers: TickerItem[]) => gravarLista('tickers', tickers);

// ── Configurações de transmissão ────────────────────────────────────────────

/** Os canais, com as chaves, e a cor dos gráficos (studio_settings.transmission). */
export interface TransmissionSettings {
  destinations?: Destination[];
  streamColor?: string;
}

// A chave de transmissão de cada canal fica na conta: só o dono lê
// studio_settings (RLS), e a prontidão do canal (pendenciaDoCanal) depende
// dela. A senha, que nenhuma tela usa, fica fora.
const semSegredos = (ajustes: TransmissionSettings): TransmissionSettings => ({
  ...(ajustes.destinations ? { destinations: ajustes.destinations.map(({ password: _senha, ...canal }) => canal) } : {}),
  ...(ajustes.streamColor !== undefined ? { streamColor: ajustes.streamColor } : {}),
});

/**
 * Assina as configurações de transmissão (canais e cor). `onBancoRespondeu` é
 * chamado quando o banco responde, com ou sem a linha: antes disso, o que o
 * app tem na memória não é a lista da conta.
 */
export function subscribeTransmissionSettings(
  userId: string,
  onUpdate: (settings: TransmissionSettings) => void,
  onBancoRespondeu?: () => void,
) {
  const chave = `pwstream_transmission_settings_${userId}`;
  const copia = lerDoAparelho(chave);
  if (copia && typeof copia === 'object') onUpdate(semSegredos(copia as TransmissionSettings));

  let viva = true;
  let recebeuMudanca = false;
  const entregar = (transmissao: unknown) => {
    if (!viva || !transmissao || typeof transmissao !== 'object') return;
    const limpa = semSegredos(transmissao as TransmissionSettings);
    guardarNoAparelho(chave, limpa);
    onUpdate(limpa);
  };
  void banco()
    .from('studio_settings')
    .select('transmission')
    .eq('user_id', userId)
    .maybeSingle()
    .then(({ data, error }) => {
      if (!viva) return;
      if (error) {
        console.warn('Supabase transmission settings error:', error.message);
        return;
      }
      if (data && !recebeuMudanca) entregar(data.transmission);
      onBancoRespondeu?.();
    });
  const parar = ouvirMudancas('studio_settings', `user_id=eq.${userId}`, (linha) => {
    // Sem a coluna (grande e sem mudança, o tempo real a deixa de fora), a
    // leitura do banco continua valendo: descartá-la deixava os canais vazios
    // na memória, e o salvamento automático os gravava assim
    if (!('transmission' in linha)) return;
    recebeuMudanca = true;
    entregar(linha.transmission);
  });
  return () => {
    viva = false;
    parar();
  };
}

/**
 * Grava as partes dadas (os canais, a cor ou os dois) sem apagar as outras:
 * update_transmission junta ao que está no banco. Confirmado pelo banco.
 */
export async function salvarTransmissao(ajustes: TransmissionSettings): Promise<void> {
  await gravarComConfirmacao(async (uid) => {
    const { data, error } = await banco().rpc('update_transmission', { p_patch: semSegredos(ajustes) });
    if (error) throw error;
    guardarNoAparelho(`pwstream_transmission_settings_${uid}`, semSegredos((data ?? {}) as TransmissionSettings));
  });
}

export const salvarCanais = (destinations: Destination[]) => salvarTransmissao({ destinations });

// ── Administração ───────────────────────────────────────────────────────────

// Perfis de todos os clientes, para a lista da administração: a RLS só os
// entrega a um admin (app_private.is_super_admin(), pelo papel que o servidor
// mantém). O papel e a situação gravados não entram: o teste sai de
// `trialEndsAt`, na hora de mostrar.
export interface PerfilDeCliente {
  uid: string;
  name: string;
  email: string;
  plan: string;
  /** Até quando vai o teste, em ISO 8601, quando o perfil tem. */
  trialEndsAt?: string;
}

const NOME_DO_PLANO: Record<string, string> = {
  free_trial: 'Free Trial',
  standard: 'Standard',
  professional: 'Professional',
  business: 'Business',
};

export function subscribeUserProfiles(
  // `doCache`: a lista veio de uma cópia, sem o banco. Hoje ela sempre vem do banco.
  onUpdate: (perfis: PerfilDeCliente[], doCache: boolean) => void,
  // Cada falha com o seu motivo: sem sessão, recusa do banco ou falta de conexão
  onError?: (motivo: 'sem-login' | 'recusado' | 'sem-conexao') => void,
) {
  let viva = true;
  void (async () => {
    // Logo depois de recarregar, a sessão ainda está sendo lida
    await esperarSessao();
    if (!viva) return;
    if (!usuarioDaSessao) {
      onError?.('sem-login');
      return;
    }
    const { data, error } = await banco().from('profiles').select('id, email, display_name, plan, trial_ends_at');
    if (!viva) return;
    if (error) {
      console.warn('Supabase profiles error:', error.message);
      const falha = falhaDoSupabase(error);
      onError?.(falha === 'sem-login' ? 'sem-login' : falha === 'sem-conexao' ? 'sem-conexao' : 'recusado');
      return;
    }
    const perfis: PerfilDeCliente[] = (data ?? []).map((perfil) => ({
      uid: perfil.id,
      name: perfil.display_name ?? '',
      email: perfil.email ?? '',
      plan: NOME_DO_PLANO[perfil.plan] ?? 'Free Trial',
      trialEndsAt: perfil.trial_ends_at ?? undefined,
    }));
    perfis.sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email, 'pt-BR'));
    onUpdate(perfis, false);
  })();
  return () => {
    viva = false;
  };
}
