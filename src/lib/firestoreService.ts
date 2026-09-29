import { 
  signInWithPopup, 
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
  where, 
  deleteDoc,
  getDocs,
  updateDoc,
  setDoc as setDocFs
} from 'firebase/firestore';
import { auth, googleAuthProvider, db, storage, disableNetwork } from './firebase.ts';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Banner, Destination } from '../types.ts';

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
  desc: string;
  time: string;
  channels: string[];
  type: 'live' | 'webinar' | 'pre-recorded';
  videoName: string;
  ownerId?: string;
  /** Horário em ISO 8601 (webinars agendados pelo formulário). `time` fica como texto por extenso. */
  startsAt?: string;
}

/** Um disparo de teste de webhook como fica guardado: sem resposta nem cabeçalhos. */
export interface WebhookLogItem {
  id: string;
  time: string;
  method: string;
  path: string;
  /** `null` quando não houve resposta HTTP (pré-visualização, falha antes do envio). */
  status: number | null;
  payload: string;
  platform: string;
  statusText?: string;
  latencyMs?: number | null;
  eventType?: string;
  isSuccess?: boolean;
  /** Por que não houve resposta (destino recusado, conexão que falhou). */
  error?: string;
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
export async function loginWithGoogle(): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const user = result.user;
    
    let profile: UserProfile;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        profile = {
          uid: user.uid,
          email: user.email || '',
          name: data.name || user.displayName || 'Usuário PwStreamer',
          photoURL: user.photoURL || '',
          plan: data.plan || 'Free Trial',
          isExpired: data.isExpired || false,
          trialDays: data.trialDays ?? 30,
          role: data.role || (user.email === 'mgdlms@gmail.com' ? 'super-admin' : 'client'),
          subscriptionStatus: data.subscriptionStatus || 'trial',
          trialEndsAt: data.trialEndsAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          stripeCustomerId: data.stripeCustomerId || '',
        };
      } else {
        profile = {
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || 'Usuário PwStreamer',
          photoURL: user.photoURL || '',
          plan: 'Free Trial',
          isExpired: false,
          trialDays: 30,
          role: user.email === 'mgdlms@gmail.com' ? 'super-admin' : 'client',
          subscriptionStatus: 'trial',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
        await safeFirestoreWrite(() => setDoc(userRef, profile));
      }
    } catch (dbErr: any) {
      if (isQuotaExceededError(dbErr)) {
        markQuotaExceeded();
      }
      profile = {
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || 'Usuário PwStreamer',
        photoURL: user.photoURL || '',
        plan: 'Free Trial',
        isExpired: false,
        trialDays: 30,
        role: user.email === 'mgdlms@gmail.com' ? 'super-admin' : 'client',
        subscriptionStatus: 'trial',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    localStorage.setItem('pwstream_user', JSON.stringify(profile));
    return profile;
  } catch (err: any) {
    if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
      console.warn('Firebase Auth unauthorized domain warning for host:', window.location.hostname);
      const customErr: any = new Error('unauthorized-domain');
      customErr.code = 'auth/unauthorized-domain';
      customErr.domain = window.location.hostname;
      throw customErr;
    }
    throw err;
  }
}

export function createDirectUserProfile(email = 'mgdlms@gmail.com', name = 'Marcos Gonçalves'): UserProfile {
  // Somente o email oficial autorizado é reconhecido como super-admin inicialmente
  const isAuthorizedSuperAdmin = email.trim().toLowerCase() === 'mgdlms@gmail.com';
  const profile: UserProfile = {
    uid: 'google-user-' + Math.random().toString(36).substr(2, 9),
    email,
    name,
    photoURL: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
    plan: 'Free Trial',
    isExpired: false,
    trialDays: 30,
    role: isAuthorizedSuperAdmin ? 'super-admin' : 'client',
    subscriptionStatus: 'trial',
    trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };
  localStorage.setItem('pwstream_user', JSON.stringify(profile));
  return profile;
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
  // 1. Paid subscriptions have unlimited access
  if (user.plan && user.plan !== 'Free Trial') {
    return {
      isExpired: false,
      trialDays: 30,
      canBroadcast: true,
      canRecord: true,
      plan: user.plan
    };
  }

  // 2. Query the backend validation service
  try {
    // O servidor lê o perfil no banco com o token de login; não recebe
    // (nem aceitaria) plano ou datas do cliente.
    const res = await apiFetch('/api/validate-trial', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (apiErr) {
    console.warn('Backend validate-trial API not reachable, running client validation:', apiErr);
  }

  // 3. Fallback validation directly against stored dates
  let trialEndsAt = user.trialEndsAt;
  const endsAtMs = trialEndsAt ? new Date(trialEndsAt).getTime() : Date.now() - 1000;
  const now = Date.now();
  const diffDays = Math.ceil((endsAtMs - now) / (1000 * 60 * 60 * 24));
  const isExpired = user.isExpired === true || user.trialDays === 0 || diffDays <= 0;
  const remainingDays = isExpired ? 0 : Math.max(0, diffDays);

  return {
    isExpired,
    trialDays: remainingDays,
    canBroadcast: !isExpired,
    canRecord: !isExpired,
    trialEndsAt,
    plan: user.plan || 'Free Trial'
  };
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
  if (!uid) throw new ErroAoSalvar('sem-login');
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

/** Se a sessão atual entrou pelo Google, de onde vem o e-mail da conta. */
export function entrouComGoogle(): boolean {
  return auth.currentUser?.providerData.some((p) => p.providerId === 'google.com') ?? false;
}

export async function logoutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Sign out warning:', e);
  }
  localStorage.removeItem('pwstream_user');
}

export function subscribeAuth(onUser: (user: UserProfile | null) => void) {
  return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
    if (fbUser) {
      try {
        let profile: UserProfile;
        const saved = localStorage.getItem('pwstream_user');
        const defaultProfile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          name: fbUser.displayName || 'Usuário PwStreamer',
          photoURL: fbUser.photoURL || '',
          plan: 'Free Trial',
          isExpired: false,
          trialDays: 30,
          role: fbUser.email === 'mgdlms@gmail.com' ? 'super-admin' : 'client',
          subscriptionStatus: 'trial',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };

        if (saved) {
          try {
            profile = { ...defaultProfile, ...JSON.parse(saved) };
          } catch {
            profile = defaultProfile;
          }
        } else {
          profile = defaultProfile;
        }
        // O uid e o e-mail são sempre os do login. O formulário de cadastro
        // antigo deixava trocar o e-mail, e o valor guardado aqui passava por
        // cima do login: o app mostrava e usava um e-mail que não era o da conta.
        profile = { ...profile, uid: fbUser.uid, email: fbUser.email || profile.email };

        if (!isQuotaExceededFlag) {
          try {
            const userRef = doc(db, 'users', fbUser.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const data = userSnap.data();
              profile = {
                ...profile,
                name: data.name || profile.name,
                plan: data.plan || profile.plan,
                isExpired: data.isExpired ?? profile.isExpired,
                trialDays: data.trialDays ?? profile.trialDays,
                role: data.role || profile.role,
                subscriptionStatus: data.subscriptionStatus || profile.subscriptionStatus,
                trialEndsAt: data.trialEndsAt || profile.trialEndsAt,
                stripeCustomerId: data.stripeCustomerId || profile.stripeCustomerId,
              };
            }
          } catch (err: any) {
            if (isQuotaExceededError(err)) {
              markQuotaExceeded();
            }
          }
        }

        localStorage.setItem('pwstream_user', JSON.stringify(profile));
        onUser(profile);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        const saved = localStorage.getItem('pwstream_user');
        if (saved) {
          try { onUser(JSON.parse(saved)); } catch { onUser(null); }
        }
      }
    } else {
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

// Banners Persistence
export function subscribeBanners(userId: string, onUpdate: (banners: Banner[]) => void) {
  const localKey = `pwstream_banners_${userId}`;
  const localSaved = localStorage.getItem(localKey);
  if (localSaved) {
    try {
      const parsed = JSON.parse(localSaved);
      if (Array.isArray(parsed) && parsed.length > 0) onUpdate(parsed);
    } catch {}
  }

  const docRef = doc(db, 'users', userId, 'studioSettings', 'bannersDoc');
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data?.banners && Array.isArray(data.banners)) {
        localStorage.setItem(localKey, JSON.stringify(data.banners));
        onUpdate(data.banners);
      }
    }
  }, (err) => {
    if (isQuotaExceededError(err)) {
      markQuotaExceeded();
    } else {
      console.warn('Firestore banners snapshot error:', err?.message || err);
    }
  });
}

export async function saveBannersToFirestore(userId: string, banners: Banner[]) {
  // Update local storage cache immediately
  const localKey = `pwstream_banners_${userId}`;
  try {
    localStorage.setItem(localKey, JSON.stringify(banners));
  } catch {}

  // Single doc write instead of looping through all banners
  await safeFirestoreWrite(() => {
    const docRef = doc(db, 'users', userId, 'studioSettings', 'bannersDoc');
    return setDoc(docRef, { banners, uid: userId, updatedAt: new Date().toISOString() });
  });
}

// Snapshots Persistence
export function subscribeSnapshots(userId: string, onUpdate: (snapshots: { id: string; name: string; url: string; timestamp: string }[]) => void) {
  const localKey = `pwstream_snapshots_${userId}`;
  const localSaved = localStorage.getItem(localKey);
  if (localSaved) {
    try {
      const parsed = JSON.parse(localSaved);
      if (Array.isArray(parsed) && parsed.length > 0) onUpdate(parsed);
    } catch {}
  }

  const colRef = collection(db, 'users', userId, 'snapshots');
  return onSnapshot(colRef, (snapshot) => {
    const list: { id: string; name: string; url: string; timestamp: string }[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as any);
    });
    if (list.length > 0) {
      localStorage.setItem(localKey, JSON.stringify(list));
      onUpdate(list);
    }
  }, (err) => {
    if (isQuotaExceededError(err)) {
      markQuotaExceeded();
    } else {
      console.warn('Firestore snapshots error:', err?.message || err);
    }
  });
}

export async function addSnapshotToFirestore(userId: string, snap: { id: string; name: string; url: string; timestamp: string }) {
  const localKey = `pwstream_snapshots_${userId}`;
  try {
    const localSaved = localStorage.getItem(localKey);
    const list = localSaved ? JSON.parse(localSaved) : [];
    list.unshift(snap);
    localStorage.setItem(localKey, JSON.stringify(list));
  } catch {}

  await safeFirestoreWrite(() => {
    const docRef = doc(db, 'users', userId, 'snapshots', snap.id);
    return setDoc(docRef, { ...snap, uid: userId });
  });
}

export async function deleteSnapshotFromFirestore(userId: string, snapId: string) {
  const localKey = `pwstream_snapshots_${userId}`;
  try {
    const localSaved = localStorage.getItem(localKey);
    if (localSaved) {
      const list = JSON.parse(localSaved);
      const filtered = list.filter((s: any) => s.id !== snapId);
      localStorage.setItem(localKey, JSON.stringify(filtered));
    }
  } catch {}

  await safeFirestoreWrite(() => {
    return deleteDoc(doc(db, 'users', userId, 'snapshots', snapId));
  });
}

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

export function subscribeTransmissionSettings(userId: string, onUpdate: (settings: TransmissionSettings) => void) {
  const localKey = `pwstream_transmission_settings_${userId}`;
  const localSaved = localStorage.getItem(localKey);
  if (localSaved) {
    try {
      const parsed = JSON.parse(localSaved);
      onUpdate(parsed);
    } catch {}
  }

  const docRef = doc(db, 'users', userId, 'studioSettings', 'transmission');
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as TransmissionSettings;
      localStorage.setItem(localKey, JSON.stringify(data));
      onUpdate(data);
    }
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
  try {
    localStorage.setItem(localKey, JSON.stringify(settings));
  } catch {}

  await safeFirestoreWrite(() => {
    const docRef = doc(db, 'users', userId, 'studioSettings', 'transmission');
    return setDoc(docRef, { ...settings, uid: userId, updatedAt: new Date().toISOString() }, { merge: true });
  });
}

// Custom RTMP & Third-Party Platforms Persistence
export async function saveDestinationsToFirestore(userId: string, destinations: Destination[]) {
  const localKey = `pwstream_destinations_${userId}`;
  try {
    localStorage.setItem(localKey, JSON.stringify(destinations));
  } catch {}

  await safeFirestoreWrite(() => {
    const docRef = doc(db, 'users', userId, 'studioSettings', 'transmission');
    return setDoc(docRef, { destinations, uid: userId, updatedAt: new Date().toISOString() }, { merge: true });
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

// Webhook Event Logs Persistence
//
// O histórico fica no Firestore da conta e numa cópia local, como os
// webinars. A cópia é o que guarda o histórico do login de desenvolvimento:
// ele não tem sessão no Firebase, e as regras recusam leitura e gravação.
// Diferente dos webinars, quem mostra o histórico não tem estado próprio, então
// a cópia avisa quem escuta quando muda — até o Firestore responder.
const MAXIMO_DE_WEBHOOK_LOGS_LOCAIS = 200;
const chaveDosWebhookLogs = (userId: string) => `pwstream_webhook_logs_${userId}`;
const ouvintesDosWebhookLogs = new Map<string, Set<(logs: WebhookLogItem[]) => void>>();

function lerWebhookLogsLocais(userId: string): WebhookLogItem[] {
  try {
    const salvos = JSON.parse(localStorage.getItem(chaveDosWebhookLogs(userId)) || '[]');
    return Array.isArray(salvos) ? salvos : [];
  } catch {
    return [];
  }
}

function gravarWebhookLogsLocais(userId: string, logs: WebhookLogItem[], avisar: boolean) {
  const recentes = logs.slice(-MAXIMO_DE_WEBHOOK_LOGS_LOCAIS);
  try {
    localStorage.setItem(chaveDosWebhookLogs(userId), JSON.stringify(recentes));
  } catch {}
  if (avisar) ouvintesDosWebhookLogs.get(userId)?.forEach((ouvir) => ouvir(recentes));
}

export function subscribeWebhookLogs(userId: string, onUpdate: (logs: WebhookLogItem[]) => void) {
  // Até o Firestore responder vale a cópia local; se ele recusar (login de
  // desenvolvimento), ela vale sempre.
  let firestoreRespondeu = false;
  const ouvirCopiaLocal = (logs: WebhookLogItem[]) => {
    if (!firestoreRespondeu) onUpdate(logs);
  };
  const ouvintes = ouvintesDosWebhookLogs.get(userId) ?? new Set();
  ouvintes.add(ouvirCopiaLocal);
  ouvintesDosWebhookLogs.set(userId, ouvintes);
  onUpdate(lerWebhookLogsLocais(userId));

  const colRef = collection(db, 'users', userId, 'webhookLogs');
  const pararDeOuvir = onSnapshot(colRef, (snapshot) => {
    firestoreRespondeu = true;
    const list: WebhookLogItem[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as WebhookLogItem);
    });
    gravarWebhookLogsLocais(userId, list, false);
    // Vazio também avisa: depois de limpar, a lista tem de esvaziar. O filtro
    // de lista vazia protegia os registros de exemplo, que já não existem.
    onUpdate(list);
  }, (err) => {
    if (isQuotaExceededError(err)) {
      markQuotaExceeded();
    } else {
      console.warn('Firestore webhook logs error:', err?.message || err);
    }
  });

  return () => {
    ouvintes.delete(ouvirCopiaLocal);
    pararDeOuvir();
  };
}

export async function addWebhookLogToFirestore(userId: string, log: WebhookLogItem) {
  const registro = { ...log, uid: userId };
  gravarWebhookLogsLocais(userId, [...lerWebhookLogsLocais(userId).filter((l) => l.id !== log.id), registro], true);
  await safeFirestoreWrite(() => {
    const docRef = doc(db, 'users', userId, 'webhookLogs', log.id);
    return setDoc(docRef, registro);
  });
}

/** Apaga todo o histórico de disparos de webhook guardado na conta (e a cópia local). */
export async function clearWebhookLogsInFirestore(userId: string) {
  gravarWebhookLogsLocais(userId, [], true);
  await safeFirestoreWrite(async () => {
    const registros = await getDocs(collection(db, 'users', userId, 'webhookLogs'));
    await Promise.all(registros.docs.map((registro) => deleteDoc(registro.ref)));
  });
}

// Scene Layout Auto-save
export interface SceneLayoutSettings {
  currentSceneId?: string;
  scenes?: any[];
  sceneTransitions?: any;
  layout?: string;
}

export function subscribeSceneLayouts(userId: string, onUpdate: (data: SceneLayoutSettings) => void) {
  const docRef = doc(db, 'users', userId, 'studioSettings', 'scenes');
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate(snapshot.data() as SceneLayoutSettings);
    }
  }, (err) => {
    if (isQuotaExceededError(err)) {
      markQuotaExceeded();
    } else {
      console.warn('Firestore scene layouts error:', err?.message || err);
    }
  });
}

export async function saveSceneLayoutsToFirestore(userId: string, data: SceneLayoutSettings) {
  await safeFirestoreWrite(() => {
    const docRef = doc(db, 'users', userId, 'studioSettings', 'scenes');
    return setDoc(docRef, { ...data, uid: userId }, { merge: true });
  });
}

// Audit Logs Persistence
export interface AuditLogEntry {
  id?: string;
  timestamp: string;
  action: 'DELETE_WEBINAR' | 'REGENERATE_RTMP_KEY' | 'CREATE_RTMP_KEY' | 'DELETE_RTMP_KEY' | 'CHANGE_PLAN' | 'TOGGLE_CLIENT_STATUS' | 'SUPER_ADMIN_LOGIN';
  actorEmail: string;
  targetEmail?: string;
  details: string;
  /** Só neste navegador: o Firestore recusou a gravação (login de desenvolvimento, cota). */
  local?: boolean;
  /** Sessão do Firebase de quem gravou, quando havia uma. Só ela sobe o registro depois. */
  autorUid?: string | null;
}

// Auditoria que o Firestore recusa. O login de desenvolvimento não tem sessão
// no Firebase e as regras recusam gravar em auditLogs; com a cota esgotada,
// também não grava. Antes o registro sumia; agora fica neste navegador,
// marcado como local. A cópia guarda só o que falhou: a auditoria de verdade,
// com as ações de outras pessoas, não é copiada para o navegador.
const CHAVE_DA_AUDITORIA_LOCAL = 'pwstream_audit_logs_local';
const MAXIMO_DA_AUDITORIA_LOCAL = 200;
const ouvintesDaAuditoriaLocal = new Set<(logs: AuditLogEntry[]) => void>();

function lerAuditoriaLocal(): AuditLogEntry[] {
  try {
    const salvos = JSON.parse(localStorage.getItem(CHAVE_DA_AUDITORIA_LOCAL) || '[]');
    return Array.isArray(salvos) ? salvos : [];
  } catch {
    return [];
  }
}

function gravarAuditoriaLocal(logs: AuditLogEntry[]) {
  const recentes = logs.slice(-MAXIMO_DA_AUDITORIA_LOCAL);
  try {
    localStorage.setItem(CHAVE_DA_AUDITORIA_LOCAL, JSON.stringify(recentes));
  } catch {}
  ouvintesDaAuditoriaLocal.forEach((ouvir) => ouvir(recentes));
}

function guardarNaAuditoriaLocal(entrada: AuditLogEntry) {
  gravarAuditoriaLocal([...lerAuditoriaLocal(), entrada]);
}

let subindoAuditoriaLocal: Promise<void> | null = null;

/**
 * Sobe para o Firestore o que ficou neste navegador, quando ele volta a
 * aceitar. Sobe só o que a sessão do Firebase aberta agora gravou: o login de
 * desenvolvimento usa o e-mail do dono, e sem essa checagem as ações de uma
 * sessão de teste entrariam na auditoria de verdade no primeiro login com
 * Google. Sobe com o id original; as regras não deixam regravar um registro,
 * então, se o Firestore recusa, confere se uma tentativa anterior já subiu.
 */
function subirAuditoriaLocal(): Promise<void> {
  // O trabalho começa no próximo tique: assim a trava já está posta se a
  // própria gravação avisar os ouvintes no meio e eles pedirem outra subida.
  subindoAuditoriaLocal ??= Promise.resolve().then(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || isQuotaExceededFlag) return;
    for (const entrada of lerAuditoriaLocal()) {
      if (entrada.autorUid !== uid || !entrada.id) continue;
      const { local, autorUid, ...registro } = entrada;
      const docRef = doc(db, 'auditLogs', entrada.id);
      let subiu = false;
      try {
        await setDoc(docRef, registro);
        subiu = true;
      } catch (err) {
        if (isQuotaExceededError(err)) {
          markQuotaExceeded();
          break;
        }
        try {
          subiu = (await getDoc(docRef)).exists();
        } catch {}
      }
      // Ainda recusado: fica para a próxima vez que o Firestore responder.
      if (!subiu) break;
      gravarAuditoriaLocal(lerAuditoriaLocal().filter((e) => e.id !== entrada.id));
    }
  }).finally(() => {
    subindoAuditoriaLocal = null;
  });
  return subindoAuditoriaLocal;
}

const maisNovoPrimeiro = (a: AuditLogEntry, b: AuditLogEntry) =>
  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();

/** A auditoria do Firestore e, junto, o que só ficou neste navegador. */
export function subscribeAuditLogs(onUpdate: (logs: AuditLogEntry[]) => void) {
  let doFirestore: AuditLogEntry[] = [];
  let locais = lerAuditoriaLocal();
  const avisar = () => onUpdate([...doFirestore, ...locais].sort(maisNovoPrimeiro));
  const ouvirLocais = (logs: AuditLogEntry[]) => {
    locais = logs;
    avisar();
  };
  ouvintesDaAuditoriaLocal.add(ouvirLocais);
  avisar();

  const colRef = collection(db, 'auditLogs');
  const pararDeOuvir = onSnapshot(colRef, (snapshot) => {
    const list: AuditLogEntry[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as AuditLogEntry);
    });
    doFirestore = list;
    avisar();
    // Resposta do servidor, não do cache: o Firestore está no ar.
    if (!snapshot.metadata.fromCache) void subirAuditoriaLocal();
  }, (err) => {
    if (isQuotaExceededError(err)) {
      markQuotaExceeded();
    } else {
      console.warn('Firestore audit logs error:', err?.message || err);
    }
  });

  return () => {
    ouvintesDaAuditoriaLocal.delete(ouvirLocais);
    pararDeOuvir();
  };
}

// Perfis de todos os clientes, para a lista do painel de administração. As
// regras só deixam o admin ler a coleção inteira; para os demais, o erro
// chega aqui e a lista fica vazia. Era uma lista fixa de clientes inventados.
export interface PerfilDeCliente {
  uid: string;
  name: string;
  email: string;
  plan: string;
  role: string;
  subscriptionStatus: string;
  isExpired: boolean;
}

export function subscribeUserProfiles(
  // `doCache`: a lista veio do cache local, sem o banco (rede desligada pela
  // cota, por exemplo). Vazia assim, ela não prova que não há clientes.
  onUpdate: (perfis: PerfilDeCliente[], doCache: boolean) => void,
  onError?: (err: unknown) => void,
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
        role: d.role || 'client',
        subscriptionStatus: d.subscriptionStatus || 'trial',
        isExpired: Boolean(d.isExpired),
      });
    });
    perfis.sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email, 'pt-BR'));
    onUpdate(perfis, snapshot.metadata.fromCache);
  }, (err) => {
    if (isQuotaExceededError(err)) markQuotaExceeded();
    else console.warn('Firestore user profiles error:', (err as any)?.message || err);
    onError?.(err);
  });
}

export async function addAuditLogToFirestore(entry: Omit<AuditLogEntry, 'id' | 'timestamp'> & { timestamp?: string }) {
  const docRef = doc(collection(db, 'auditLogs'));
  const logItem: AuditLogEntry = {
    ...entry,
    id: docRef.id,
    timestamp: entry.timestamp || new Date().toISOString()
  };
  let gravou = false;
  await safeFirestoreWrite(async () => {
    await setDoc(docRef, logItem);
    gravou = true;
  });
  if (!gravou) {
    guardarNaAuditoriaLocal({ ...logItem, local: true, autorUid: auth.currentUser?.uid ?? null });
    return;
  }
  // O Firestore aceitou: é a hora de subir o que tinha ficado aqui.
  void subirAuditoriaLocal();
}

/**
 * Chave de transmissão aleatória de verdade (crypto), sem nada da pessoa nela.
 * As antigas eram o e-mail do cliente mais um carimbo de tempo, ou
 * `Math.random` — dá para adivinhar, e chave de transmissão é senha.
 */
export function gerarChaveDeTransmissao(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return 'pw_live_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// RTMP Transmission Keys Isolation Persistence
export interface RtmpKeyEntry {
  id: string;
  label: string;
  clientEmail: string;
  key: string;
  server: string;
  maxBitrate: string;
  active: boolean;
  createdAt: string;
}

export function subscribeClientRtmpKeys(clientEmail: string, onUpdate: (keys: RtmpKeyEntry[]) => void) {
  if (!clientEmail) {
    onUpdate([]);
    return () => {};
  }
  const q = query(collection(db, 'rtmpKeys'), where('clientEmail', '==', clientEmail));
  return onSnapshot(q, (snapshot) => {
    const list: RtmpKeyEntry[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as RtmpKeyEntry);
    });
    onUpdate(list);
  }, (err) => {
    if (isQuotaExceededError(err)) {
      markQuotaExceeded();
    } else {
      console.warn('Firestore client RTMP keys error:', err?.message || err);
    }
  });
}

export function subscribeAllRtmpKeys(onUpdate: (keys: RtmpKeyEntry[]) => void) {
  const colRef = collection(db, 'rtmpKeys');
  return onSnapshot(colRef, (snapshot) => {
    const list: RtmpKeyEntry[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as RtmpKeyEntry);
    });
    onUpdate(list);
  }, (err) => {
    if (isQuotaExceededError(err)) {
      markQuotaExceeded();
    } else {
      console.warn('Firestore all RTMP keys error:', err?.message || err);
    }
  });
}

export async function saveRtmpKeyToFirestore(key: RtmpKeyEntry, actorEmail?: string) {
  await safeFirestoreWrite(async () => {
    const docRef = doc(db, 'rtmpKeys', key.id);
    await setDoc(docRef, key, { merge: true });

    if (actorEmail) {
      // O registro diz o que aconteceu, nunca o segredo: a chave fica só no
      // documento dela, onde as regras decidem quem lê.
      await addAuditLogToFirestore({
        action: 'CREATE_RTMP_KEY',
        actorEmail,
        targetEmail: key.clientEmail,
        details: `Criada/atualizada chave RTMP '${key.label}' para ${key.clientEmail}`
      });
    }
  });
}

export async function deleteRtmpKeyFromFirestore(keyId: string, actorEmail?: string, clientEmail?: string, keyLabel?: string) {
  await safeFirestoreWrite(async () => {
    await deleteDoc(doc(db, 'rtmpKeys', keyId));

    if (actorEmail) {
      await addAuditLogToFirestore({
        action: 'DELETE_RTMP_KEY',
        actorEmail,
        targetEmail: clientEmail,
        details: `Excluída/revogada chave RTMP '${keyLabel || keyId}' do cliente ${clientEmail || 'N/A'}`
      });
    }
  });
}

export async function regenerateRtmpKeyInFirestore(keyId: string, clientEmail: string, actorEmail: string, currentLabel?: string): Promise<string> {
  const newStreamKey = gerarChaveDeTransmissao();
  await safeFirestoreWrite(async () => {
    const docRef = doc(db, 'rtmpKeys', keyId);
    await setDoc(docRef, { key: newStreamKey, createdAt: new Date().toISOString() }, { merge: true });

    await addAuditLogToFirestore({
      action: 'REGENERATE_RTMP_KEY',
      actorEmail,
      targetEmail: clientEmail,
      details: `Regenerada chave de transmissão RTMP do cliente ${clientEmail} (Rótulo: '${currentLabel || keyId}')`
    });
  });
  return newStreamKey;
}

/**
 * Uploads an image or video file to Firebase Storage and registers metadata in Firestore.
 */
export async function uploadMediaToStorage(
  file: File, 
  type: 'logo' | 'watermark' | 'overlay' | 'background' | 'video',
  userEmail?: string
): Promise<{ id: string; name: string; url: string; storagePath: string }> {
  // Sem conta, sem envio: o padrão antigo punha o arquivo na pasta do dono do app.
  const email = userEmail || auth.currentUser?.email;
  if (!email) throw new Error('Entre na sua conta para enviar arquivos.');
  const cleanEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = Date.now();
  const assetId = `${type}-${timestamp}`;
  const storagePath = `media_assets/${cleanEmail}/${type}/${timestamp}_${file.name}`;

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
    storagePath,
    createdAt: new Date().toISOString()
  };

  await safeFirestoreWrite(async () => {
    const docRef = doc(db, 'media_assets', assetId);
    await setDocFs(docRef, asset);
  });

  return asset;
}


