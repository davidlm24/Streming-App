import { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider,
  User as FirebaseUser 
} from 'firebase/auth';
import { apiFetch } from './apiFetch';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot, 
  query,
  deleteDoc,
  updateDoc,
  setDoc as setDocFs
} from 'firebase/firestore';
import { auth, googleAuthProvider, db, storage, disableNetwork } from './firebase.ts';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Banner, Destination, TickerItem } from '../types.ts';

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
  stripeCustomerId?: string;
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

// -------------------------------------------------------------
// FIRESTORE QUOTA EXHAUSTION & RESILIENCE HANDLER
// -------------------------------------------------------------
export const FIRESTORE_PROJECT_ID = 'gen-lang-client-0356999908';
export const FIRESTORE_DATABASE_ID = 'ai-studio-pwstreamer-d116304c-f3fc-41ee-8b60-b6de39028c06';
export const FIRESTORE_UPGRADE_URL = `https://console.firebase.google.com/project/${FIRESTORE_PROJECT_ID}/firestore/databases/${FIRESTORE_DATABASE_ID}/data?openUpgradeDialog=true`;

let isQuotaExceededFlag = false;
try {
  if (typeof window !== 'undefined' && sessionStorage.getItem('pwstream_quota_exceeded') === 'true') {
    isQuotaExceededFlag = true;
    try {
      disableNetwork(db).catch(() => {});
    } catch {}
  }
} catch {}

const quotaListeners = new Set<(isExceeded: boolean) => void>();

export function isQuotaExceededError(err: any): boolean {
  if (!err) return false;
  const code = err.code || '';
  const msg = err.message || String(err);
  return (
    code === 'resource-exhausted' ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('resource-exhausted') ||
    msg.includes('Quota exceeded') ||
    msg.includes('Free daily write units')
  );
}

export function markQuotaExceeded() {
  if (!isQuotaExceededFlag) {
    isQuotaExceededFlag = true;
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pwstream_quota_exceeded', 'true');
      }
    } catch {}
    try {
      disableNetwork(db).catch(() => {});
    } catch {}
    console.warn('[Firestore Quota] Free tier daily write quota limit reached. Network sync paused and seamlessly utilizing local storage caching for all studio operations.');
    quotaListeners.forEach(cb => {
      try { cb(true); } catch (e) { console.error(e); }
    });
  }
}

export function getIsQuotaExceeded(): boolean {
  return isQuotaExceededFlag;
}

export function subscribeQuotaStatus(callback: (isExceeded: boolean) => void): () => void {
  callback(isQuotaExceededFlag);
  quotaListeners.add(callback);
  return () => quotaListeners.delete(callback);
}

// Safe Firestore Write Helper that prevents infinite backoff and falls back to local storage
export async function safeFirestoreWrite<T>(
  writeFn: () => Promise<T>,
  fallbackLocalFn?: () => void
): Promise<T | undefined> {
  if (isQuotaExceededFlag) {
    if (fallbackLocalFn) fallbackLocalFn();
    return undefined;
  }
  try {
    const res = await writeFn();
    if (fallbackLocalFn) fallbackLocalFn();
    return res;
  } catch (err: any) {
    if (isQuotaExceededError(err)) {
      markQuotaExceeded();
    } else {
      console.warn('Firestore write warning:', err?.message || err);
    }
    if (fallbackLocalFn) fallbackLocalFn();
    return undefined;
  }
}

// Auth functions
function defaultProfile(user: FirebaseUser): UserProfile {
  return {
    uid: user.uid,
    email: user.email || '',
    name: user.displayName || 'Usuário PwStreamer',
    photoURL: user.photoURL || '',
    plan: 'Free Trial',
    isExpired: false,
    trialDays: 30,
    role: 'client',
    subscriptionStatus: 'trial',
    trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

async function loadAuthenticatedProfile(user: FirebaseUser): Promise<UserProfile> {
  const response = await apiFetch('/api/auth/profile');
  if (!response.ok) {
    throw new Error(response.status === 503
      ? 'O serviço de perfil está temporariamente indisponível.'
      : 'Não foi possível validar o perfil autenticado.');
  }
  const profile = await response.json();
  return { ...defaultProfile(user), ...profile };
}

export async function loginWithGoogle(): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    return await loadAuthenticatedProfile(result.user);
  } catch (err: any) {
    if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
      const customErr: any = new Error('unauthorized-domain');
      customErr.code = 'auth/unauthorized-domain';
      customErr.domain = window.location.hostname;
      throw customErr;
    }
    throw err;
  }
}

export async function loginWithEmail(email: string, password: string): Promise<UserProfile> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return loadAuthenticatedProfile(result.user);
}

export async function registerWithEmail(email: string, password: string, name: string): Promise<UserProfile> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(result.user, { displayName: name.trim() });
  await result.user.getIdToken(true);
  return loadAuthenticatedProfile(result.user);
}

/**
 * Só lê email, plano, dias de teste e datas — `uid` vai adiante apenas como
 * campo do corpo do POST e tolera ausência. Pedir `UserProfile` inteiro
 * obrigava quem chama a ter um `uid` que a função nunca exige; o estado do
 * app guarda `uid` opcional (o localStorage antigo pode não ter).
 */
export async function validateUserTrialStatus(
  user: Pick<UserProfile, 'email' | 'plan' | 'trialDays' | 'isExpired'> &
    Partial<Pick<UserProfile, 'uid' | 'trialEndsAt'>>
): Promise<{
  isExpired: boolean;
  trialDays: number;
  canBroadcast: boolean;
  canRecord: boolean;
  trialEndsAt?: string;
  plan: string;
}> {
  const res = await apiFetch('/api/validate-trial', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Unable to verify subscription status (${res.status}).`);
  }
  return res.json();
}

/** Por que uma gravação não foi confirmada. A tela diz cada caso com a sua saída. */
export type FalhaAoSalvar = 'sem-login' | 'sem-conexao' | 'sem-confirmacao' | 'recusado';

export class ErroAoSalvar extends Error {
  readonly motivo: FalhaAoSalvar;
  constructor(motivo: FalhaAoSalvar) {
    super(motivo);
    this.motivo = motivo;
  }
}

/** Quanto esperar o banco confirmar antes de dizer que não deu para confirmar. */
const ESPERA_DA_CONFIRMACAO_MS = 10_000;

/** Resolve quando o Firebase termina de restaurar a sessão salva (logo depois de recarregar a página). */
export const esperarSessao = () => auth.authStateReady();

// A conta que esta aba viu entrar, e se ela já saiu ou deu lugar a outra (ver
// subscribeAuth). Quando outra aba entra com outra conta, `auth.currentUser`
// muda antes de o aviso chegar, e o app ainda tem na memória a conta anterior:
// uma gravação nesse intervalo, que pega a conta da sessão, levaria o roteiro,
// os banners ou os tickers de uma conta para a outra.
let contaDaAba: string | null = null;
let contaTrocada = false;

/**
 * Grava e só resolve depois de o banco confirmar (Regra do Salvo de Verdade).
 * Este Firestore guarda escritas pendentes só em memória: uma escrita feita
 * sem conexão some quando a aba fecha, então dizer "salvo" antes da
 * confirmação seria mentira. Falha com o motivo, para a tela dizer a saída.
 */
async function gravarComConfirmacao(gravar: (uid: string) => Promise<unknown>): Promise<void> {
  // Logo depois de recarregar, `currentUser` ainda é null enquanto a sessão
  // volta, e o app já mostra o usuário do cache: sem esperar, uma sessão
  // válida seria dada como expirada.
  await esperarSessao();
  const uid = auth.currentUser?.uid;
  if (!uid || contaTrocada || (contaDaAba && uid !== contaDaAba)) throw new ErroAoSalvar('sem-login');
  if (isQuotaExceededFlag || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
    throw new ErroAoSalvar('sem-conexao');
  }

  let espera: ReturnType<typeof setTimeout> | undefined;
  const semConfirmacao = new Promise<never>((_, rejeitar) => {
    espera = setTimeout(() => rejeitar(new ErroAoSalvar('sem-confirmacao')), ESPERA_DA_CONFIRMACAO_MS);
  });
  try {
    await Promise.race([gravar(uid), semConfirmacao]);
  } catch (err) {
    if (err instanceof ErroAoSalvar) throw err;
    if (isQuotaExceededError(err)) {
      markQuotaExceeded();
      throw new ErroAoSalvar('sem-conexao');
    }
    console.warn('Gravação não confirmada:', (err as { code?: string })?.code ?? err);
    throw new ErroAoSalvar('recusado');
  } finally {
    clearTimeout(espera);
  }
}

/**
 * Troca o nome do perfil no banco (`users/{uid}.name`), de onde o login lê o
 * nome em qualquer aparelho. Grava só `name`: plano, papel e datas não são do
 * cliente, e o e-mail é o do login.
 */
export async function salvarNomeDoPerfil(nome: string): Promise<void> {
  await gravarComConfirmacao((uid) => updateDoc(doc(db, 'users', uid), { name: nome }));
}

/**
 * Agenda um webinar (`users/{uid}/webinars/{id}`), confirmado pelo banco. Numa
 * nova tentativa, o mesmo id: se a primeira escrita chegar atrasada, a segunda
 * só a repete, sem criar outro webinar. A lista e o cache local vêm da
 * assinatura de `subscribeWebinars`.
 */
export async function agendarWebinar(webinar: WebinarData): Promise<void> {
  await gravarComConfirmacao((uid) =>
    setDoc(doc(db, 'users', uid, 'webinars', webinar.id), {
      ...webinar,
      ownerId: uid,
      uid,
      createdAt: new Date().toISOString(),
    })
  );
}

/** O roteiro do teleprompter e as notas de quem apresenta, de um webinar ou o geral. */
export interface RoteiroSalvo {
  texto: string;
  notas: string;
  atualizadoEm: string;
}

/**
 * O roteiro de um webinar (`users/{uid}/roteiros/{id do webinar}`), ou o
 * geral (`…/roteiros/geral`) quando o estúdio abre sem webinar. Confirmado
 * pelo banco, pela Regra do Salvo de Verdade. Antes o roteiro não era salvo
 * em lugar nenhum e voltava ao texto padrão ao recarregar.
 */
export async function salvarRoteiro(id: string, dados: { texto: string; notas: string }): Promise<void> {
  await gravarComConfirmacao((uid) =>
    setDoc(doc(db, 'users', uid, 'roteiros', id), { ...dados, atualizadoEm: new Date().toISOString() })
  );
}

/** Lê o roteiro salvo; null se ainda não há. Falha com `ErroAoSalvar` sem sessão. */
export async function lerRoteiro(id: string): Promise<RoteiroSalvo | null> {
  await esperarSessao();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new ErroAoSalvar('sem-login');
  const snap = await getDoc(doc(db, 'users', uid, 'roteiros', id));
  return snap.exists() ? (snap.data() as RoteiroSalvo) : null;
}

/** Se a sessão atual entrou pelo Google, de onde vem o e-mail da conta. */
export function entrouComGoogle(): boolean {
  return auth.currentUser?.providerData.some((p) => p.providerId === 'google.com') ?? false;
}

// O que a conta deixa neste navegador: o perfil do login antigo e as cópias das
// listas e das configurações, com as chaves dos canais. Sai quando a pessoa sai
// da conta e quando a sessão acaba, para não ficar para o próximo num computador
// compartilhado.
const COPIAS_DA_CONTA = ['pwstream_user', 'pwstream_transmission_settings_', 'pwstream_destinations_', 'pwstream_webinars_', 'pwstream_banners_', 'pwstream_tickers_'];

function apagarCopiasDaConta() {
  try {
    Object.keys(localStorage)
      .filter((chave) => COPIAS_DA_CONTA.some((prefixo) => chave.startsWith(prefixo)))
      .forEach((chave) => localStorage.removeItem(chave));
  } catch {
    // Sem armazenamento, não há o que apagar
  }
}

export async function logoutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Sign out warning:', e);
  }
  apagarCopiasDaConta();
}

/**
 * Assina a sessão. `onContaTrocou` é chamado quando a conta desta aba sai ou dá
 * lugar a outra (sair da conta, a sessão acabar, outra aba entrar com outra
 * conta); a partir daí, nada mais é gravado pela sessão. A troca é vista aqui,
 * antes de esperar o perfil: durante a espera, `auth.currentUser` já é a conta
 * nova.
 */
export function subscribeAuth(onUser: (user: UserProfile | null) => void, onContaTrocou: () => void) {
  return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
    const conta = fbUser?.uid ?? null;
    if (contaTrocada || (contaDaAba && conta !== contaDaAba)) {
      contaTrocada = true;
      apagarCopiasDaConta();
      onContaTrocou();
      return;
    }
    contaDaAba = conta;
    if (fbUser) {
      try {
        onUser(await loadAuthenticatedProfile(fbUser));
      } catch (err) {
        console.error('Error fetching user profile:', err);
        onUser(null);
      }
    } else {
      apagarCopiasDaConta();
      onUser(null);
    }
  });
}

// Webinars Persistence
export function subscribeWebinars(userId: string, onUpdate: (webinars: WebinarData[]) => void) {
  // Check local storage first
  const localSaved = localStorage.getItem(`pwstream_webinars_${userId}`);
  if (localSaved) {
    try {
      const parsed = JSON.parse(localSaved);
      if (Array.isArray(parsed) && parsed.length > 0) onUpdate(parsed);
    } catch {}
  }

  const q = query(collection(db, 'users', userId, 'webinars'));
  return onSnapshot(q, (snapshot) => {
    const list: WebinarData[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as WebinarData);
    });
    if (list.length > 0) {
      localStorage.setItem(`pwstream_webinars_${userId}`, JSON.stringify(list));
      onUpdate(list);
    }
  }, (err) => {
    if (isQuotaExceededError(err)) {
      markQuotaExceeded();
    } else {
      console.warn('Firestore webinars snapshot error:', err?.message || err);
    }
  });
}

export async function saveWebinarToFirestore(userId: string, webinar: WebinarData) {
  // Update local storage cache immediately
  const localKey = `pwstream_webinars_${userId}`;
  try {
    const localSaved = localStorage.getItem(localKey);
    const list: WebinarData[] = localSaved ? JSON.parse(localSaved) : [];
    const idx = list.findIndex(w => w.id === webinar.id);
    if (idx >= 0) list[idx] = webinar; else list.unshift(webinar);
    localStorage.setItem(localKey, JSON.stringify(list));
  } catch {}

  await safeFirestoreWrite(() => {
    const docRef = doc(db, 'users', userId, 'webinars', webinar.id);
    return setDoc(docRef, {
      ...webinar,
      ownerId: userId,
      uid: userId,
      createdAt: new Date().toISOString()
    });
  });
}

export async function deleteWebinarFromFirestore(userId: string, webinarId: string) {
  const localKey = `pwstream_webinars_${userId}`;
  try {
    const localSaved = localStorage.getItem(localKey);
    if (localSaved) {
      const list: WebinarData[] = JSON.parse(localSaved);
      const filtered = list.filter(w => w.id !== webinarId);
      localStorage.setItem(localKey, JSON.stringify(filtered));
    }
  } catch {}

  await safeFirestoreWrite(() => {
    return deleteDoc(doc(db, 'users', userId, 'webinars', webinarId));
  });
}

// ── Listas do estúdio (banners e tickers) ──────────────────────────────────
// Cada lista é um documento em studioSettings. O aparelho guarda só a última
// lista que o banco confirmou, para ela abrir antes de a conta responder: uma
// mudança que não foi salva some ao recarregar, como a tela avisa. Antes a
// cópia do aparelho era escrita antes de o banco responder, e um banner que
// não chegou à conta parecia salvo neste navegador.

function guardarNoAparelho(chave: string, lista: unknown[]) {
  try {
    localStorage.setItem(chave, JSON.stringify(lista));
  } catch {
    // Sem armazenamento, a lista abre quando a conta responder
  }
}

/**
 * Assina uma lista do estúdio. Entrega a cópia do aparelho e, depois, só o
 * que o banco confirmou: as escritas deste aparelho ainda pendentes não
 * contam, para a tela não tomar por salvo o que o banco não viu.
 */
function assinarLista<T>(userId: string, documento: string, campo: string, onUpdate: (lista: T[]) => void) {
  const chave = `pwstream_${campo}_${userId}`;
  try {
    const salva = JSON.parse(localStorage.getItem(chave) ?? 'null');
    if (Array.isArray(salva)) onUpdate(salva);
  } catch {
    // Cópia ilegível: a lista abre quando a conta responder
  }

  return onSnapshot(
    doc(db, 'users', userId, 'studioSettings', documento),
    // Com os metadados, a confirmação de uma escrita que atrasou também chega
    { includeMetadataChanges: true },
    (snapshot) => {
      if (snapshot.metadata.hasPendingWrites) return;
      const lista = snapshot.exists() ? snapshot.data()[campo] : null;
      if (!Array.isArray(lista)) return;
      guardarNoAparelho(chave, lista);
      onUpdate(lista);
    },
    (err) => {
      if (isQuotaExceededError(err)) markQuotaExceeded();
      else console.warn(`Firestore ${campo} snapshot error:`, err?.message || err);
    },
  );
}

/** Grava a lista inteira e só resolve depois de o banco confirmar (Regra do Salvo de Verdade). */
async function gravarLista(documento: string, campo: string, lista: unknown[]): Promise<void> {
  await gravarComConfirmacao(async (uid) => {
    await setDoc(doc(db, 'users', uid, 'studioSettings', documento), { [campo]: lista, uid, updatedAt: new Date().toISOString() });
    guardarNoAparelho(`pwstream_${campo}_${uid}`, lista);
  });
}

export const subscribeBanners = (userId: string, onUpdate: (banners: Banner[]) => void) =>
  assinarLista(userId, 'bannersDoc', 'banners', onUpdate);

export const salvarBanners = (banners: Banner[]) => gravarLista('bannersDoc', 'banners', banners);

/** Os tickers, como os banners. Antes só existiam enquanto a página estava aberta. */
export const subscribeTickers = (userId: string, onUpdate: (tickers: TickerItem[]) => void) =>
  assinarLista(userId, 'tickersDoc', 'tickers', onUpdate);

export const salvarTickers = (tickers: TickerItem[]) => gravarLista('tickersDoc', 'tickers', tickers);

// Transmission Settings Persistence
export interface TransmissionSettings {
  destinations?: Destination[];
  rtmpServer?: string;
  streamKey?: string;
  streamDelay?: number;
  recordingFormat?: 'mp4' | 'webm';
  recordingQuality?: '720p' | '1080p';
  logoAnimation?: string;
  bannerAnimation?: string;
  streamColor?: string;
  textStyle?: string;
  customRtmpProfiles?: any[];
}

// A chave de transmissão de cada canal fica na conta: só o dono lê
// users/{uid}/studioSettings (firestore.rules), e a prontidão do canal
// (pendenciaDoCanal) depende dela. Tirá-la ao salvar deixava todo canal com
// "Falta a chave" logo depois de salvo, porque a lista volta do banco sem ela.
// A senha, que nenhuma tela usa, continua fora.
const stripDestinationSecrets = (destination: Destination): Destination => {
  const { password: _password, ...safeDestination } = destination;
  return safeDestination;
};

const stripTransmissionSecrets = (settings: TransmissionSettings): TransmissionSettings => {
  const { streamKey: _streamKey, destinations, customRtmpProfiles, ...safeSettings } = settings;
  return {
    ...safeSettings,
    destinations: destinations?.map(stripDestinationSecrets),
    customRtmpProfiles: Array.isArray(customRtmpProfiles)
      ? customRtmpProfiles.map((profile) => {
          const { streamKey: _profileStreamKey, password: _profilePassword, ...safeProfile } = profile || {};
          return safeProfile;
        })
      : customRtmpProfiles,
  };
};

/**
 * Assina as configurações de transmissão (canais e cor). `onBancoRespondeu` é
 * chamado quando a resposta vem do banco, com ou sem o documento: antes disso,
 * o que o app tem na memória não é a lista da conta.
 */
export function subscribeTransmissionSettings(
  userId: string,
  onUpdate: (settings: TransmissionSettings) => void,
  onBancoRespondeu?: () => void,
) {
  const localKey = `pwstream_transmission_settings_${userId}`;
  const localSaved = localStorage.getItem(localKey);
  if (localSaved) {
    try {
      const parsed = stripTransmissionSecrets(JSON.parse(localSaved));
      localStorage.setItem(localKey, JSON.stringify(parsed));
      onUpdate(parsed);
    } catch {}
  }

  const docRef = doc(db, 'users', userId, 'studioSettings', 'transmission');
  // Com os metadados, a resposta do banco chega mesmo quando só confirma o que
  // o cache já dizia (um documento que não existe, depois de voltar a conexão)
  return onSnapshot(docRef, { includeMetadataChanges: true }, (snapshot) => {
    if (snapshot.exists()) {
      const data = stripTransmissionSecrets(snapshot.data() as TransmissionSettings);
      localStorage.setItem(localKey, JSON.stringify(data));
      onUpdate(data);
    }
    if (!snapshot.metadata.fromCache) onBancoRespondeu?.();
  }, (err) => {
    if (isQuotaExceededError(err)) {
      markQuotaExceeded();
    } else {
      console.warn('Firestore transmission settings error:', err?.message || err);
    }
  });
}

export async function saveTransmissionSettingsToFirestore(userId: string, settings: TransmissionSettings) {
  const localKey = `pwstream_transmission_settings_${userId}`;
  const safeSettings = stripTransmissionSecrets(settings);
  try {
    localStorage.setItem(localKey, JSON.stringify(safeSettings));
  } catch {}

  await safeFirestoreWrite(() => {
    const docRef = doc(db, 'users', userId, 'studioSettings', 'transmission');
    return setDoc(docRef, { ...safeSettings, uid: userId, updatedAt: new Date().toISOString() });
  });
}

// Custom RTMP & Third-Party Platforms Persistence
export async function saveDestinationsToFirestore(userId: string, destinations: Destination[]) {
  const localKey = `pwstream_destinations_${userId}`;
  const safeDestinations = destinations.map(stripDestinationSecrets);
  try {
    localStorage.setItem(localKey, JSON.stringify(safeDestinations));
  } catch {}

  await safeFirestoreWrite(() => {
    const docRef = doc(db, 'users', userId, 'studioSettings', 'transmission');
    return setDoc(docRef, { destinations: safeDestinations, uid: userId, updatedAt: new Date().toISOString() }, { merge: true });
  });
}

export async function addCustomDestinationToFirestore(userId: string, currentDestinations: Destination[], newDest: Destination) {
  const updated = [...currentDestinations, newDest];
  await saveDestinationsToFirestore(userId, updated);
  return updated;
}

export async function updateCustomDestinationInFirestore(userId: string, currentDestinations: Destination[], updatedDest: Destination) {
  const updated = currentDestinations.map(d => d.id === updatedDest.id ? updatedDest : d);
  await saveDestinationsToFirestore(userId, updated);
  return updated;
}

export async function deleteCustomDestinationFromFirestore(userId: string, currentDestinations: Destination[], destId: string) {
  const updated = currentDestinations.filter(d => d.id !== destId);
  await saveDestinationsToFirestore(userId, updated);
  return updated;
}

// Perfis de todos os clientes, para a lista da administração. O papel e a
// situação gravados no documento não entram: nada atualiza a situação quando o
// teste vence, e o servidor grava o papel por conta própria. O teste sai de
// `trialEndsAt`, na hora de mostrar. As chaves de transmissão e o registro de
// auditoria saíram daqui: o navegador os gravava direto no banco, e eles
// voltam com o ingest, feitos pelo servidor.
export interface PerfilDeCliente {
  uid: string;
  name: string;
  email: string;
  plan: string;
  /** Até quando vai o teste, em ISO 8601, quando o perfil tem. */
  trialEndsAt?: string;
}

export function subscribeUserProfiles(
  // `doCache`: a lista veio do cache local, sem o banco (rede desligada pela
  // cota, por exemplo). Vazia assim, ela não prova que não há clientes.
  onUpdate: (perfis: PerfilDeCliente[], doCache: boolean) => void,
  // Cada falha com o seu motivo: recusa por permissão (sem sessão, ou sem o
  // papel nas regras) ou falta de conexão (cota, rede, banco fora do ar)
  onError?: (motivo: 'sem-login' | 'recusado' | 'sem-conexao') => void,
) {
  return onSnapshot(collection(db, 'users'), (snapshot) => {
    const perfis: PerfilDeCliente[] = [];
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      perfis.push({
        uid: docSnap.id,
        name: d.name || '',
        email: d.email || '',
        plan: d.plan || 'Free Trial',
        trialEndsAt: typeof d.trialEndsAt === 'string' ? d.trialEndsAt : undefined,
      });
    });
    perfis.sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email, 'pt-BR'));
    onUpdate(perfis, snapshot.metadata.fromCache);
  }, (err) => {
    if (isQuotaExceededError(err)) markQuotaExceeded();
    else console.warn('Firestore user profiles error:', (err as any)?.message || err);
    const codigo = (err as { code?: string })?.code;
    if (codigo !== 'permission-denied' && codigo !== 'unauthenticated') {
      onError?.('sem-conexao');
      return;
    }
    // Logo depois de recarregar, a sessão ainda está voltando: sem esperar,
    // uma sessão válida seria dada como expirada
    void esperarSessao().then(() => onError?.(auth.currentUser ? 'recusado' : 'sem-login'));
  });
}

/**
 * Uploads an image or video file to Firebase Storage and registers metadata in Firestore.
 */
export async function uploadMediaToStorage(
  file: File, 
  type: 'logo' | 'watermark' | 'overlay' | 'background' | 'video',
  _userEmail?: string
): Promise<{ id: string; name: string; url: string; storagePath: string }> {
  const email = auth.currentUser?.email;
  if (!email) throw new Error('Authentication is required to upload media');
  const ownerId = auth.currentUser.uid;
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const assetId = `${type}-${timestamp}`;
  const storagePath = `media_assets/${ownerId}/${type}/${timestamp}_${safeFileName}`;

  let downloadUrl = '';

  try {
    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, file);
    downloadUrl = await getDownloadURL(snapshot.ref);
  } catch (err) {
    console.warn('Firebase Storage upload fallback to base64:', err);
    downloadUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  }

  const asset = {
    id: assetId,
    name: file.name,
    url: downloadUrl,
    type,
    ownerEmail: email,
    ownerId,
    storagePath,
    createdAt: new Date().toISOString()
  };

  await safeFirestoreWrite(async () => {
    const docRef = doc(db, 'media_assets', assetId);
    await setDocFs(docRef, asset);
  });

  return asset;
}
