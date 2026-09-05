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
import { 
  doc, 
  setDoc, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  deleteDoc,
  getDocs,
  setDoc as setDocFs
} from 'firebase/firestore';
import { auth, googleAuthProvider, db, storage, disableNetwork } from './firebase.ts';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Banner, Destination } from '../types.ts';
import { authenticatedFetch } from './api.ts';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  plan: 'Standard' | 'Professional' | 'Business' | 'Free Trial';
  isExpired: boolean;
  trialDays: number;
  role?: 'super-admin' | 'client';
  subscriptionStatus?: 'trial' | 'active' | 'past_due' | 'canceled';
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
}

export interface WebhookLogItem {
  id: string;
  time: string;
  method: string;
  path: string;
  status: number;
  payload: string;
  platform: string;
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
  const response = await authenticatedFetch('/api/auth/profile');
  if (!response.ok) {
    throw new Error(response.status === 503
      ? 'O serviço de perfil está temporariamente indisponível.'
      : 'Não foi possível validar o perfil autenticado.');
  }
  let profile = await response.json();
  if (profile.tokenRefreshRequired) {
    await user.getIdToken(true);
    const refreshedResponse = await authenticatedFetch('/api/auth/profile');
    if (!refreshedResponse.ok) throw new Error('Não foi possível atualizar as permissões da conta.');
    profile = await refreshedResponse.json();
  }
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

export async function validateUserTrialStatus(user: UserProfile): Promise<{
  isExpired: boolean;
  trialDays: number;
  canBroadcast: boolean;
  canRecord: boolean;
  trialEndsAt?: string;
  plan: string;
}> {
  const res = await authenticatedFetch('/api/validate-trial', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Unable to verify subscription status (${res.status}).`);
  }
  return res.json();
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
        onUser(await loadAuthenticatedProfile(fbUser));
      } catch (err) {
        console.error('Error fetching user profile:', err);
        onUser(null);
      }
    } else {
      localStorage.removeItem('pwstream_user');
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

const stripDestinationSecrets = (destination: Destination): Destination => {
  const { streamKey: _streamKey, password: _password, ...safeDestination } = destination;
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

const stripWebhookSecrets = (config: any): any => {
  if (Array.isArray(config)) return config.map(stripWebhookSecrets);
  if (!config || typeof config !== 'object') return config;

  return Object.fromEntries(
    Object.entries(config)
      .filter(([key]) => !['secret', 'secretKey', 'password', 'authorization'].includes(key))
      .map(([key, value]) => [key, stripWebhookSecrets(value)])
  );
};

export function subscribeTransmissionSettings(userId: string, onUpdate: (settings: TransmissionSettings) => void) {
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
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = stripTransmissionSecrets(snapshot.data() as TransmissionSettings);
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

// Webhooks and Event Logs Persistence
export function subscribeWebhooksConfig(userId: string, onUpdate: (config: any) => void) {
  const docRef = doc(db, 'users', userId, 'studioSettings', 'webhooksConfig');
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate(stripWebhookSecrets(snapshot.data()));
    }
  }, (err) => {
    if (isQuotaExceededError(err)) {
      markQuotaExceeded();
    } else {
      console.warn('Firestore webhooks config error:', err?.message || err);
    }
  });
}

export async function saveWebhooksConfigToFirestore(userId: string, config: any) {
  const safeConfig = stripWebhookSecrets(config);
  await safeFirestoreWrite(() => {
    const docRef = doc(db, 'users', userId, 'studioSettings', 'webhooksConfig');
    return setDoc(docRef, { ...safeConfig, uid: userId });
  });
}

export function subscribeWebhookLogs(userId: string, onUpdate: (logs: WebhookLogItem[]) => void) {
  const colRef = collection(db, 'users', userId, 'webhookLogs');
  return onSnapshot(colRef, (snapshot) => {
    const list: WebhookLogItem[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as WebhookLogItem);
    });
    if (list.length > 0) {
      onUpdate(list);
    }
  }, (err) => {
    if (isQuotaExceededError(err)) {
      markQuotaExceeded();
    } else {
      console.warn('Firestore webhook logs error:', err?.message || err);
    }
  });
}

export async function addWebhookLogToFirestore(userId: string, log: WebhookLogItem) {
  await safeFirestoreWrite(() => {
    const docRef = doc(db, 'users', userId, 'webhookLogs', log.id);
    return setDoc(docRef, { ...log, uid: userId });
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
}

export function subscribeAuditLogs(onUpdate: (logs: AuditLogEntry[]) => void) {
  const colRef = collection(db, 'auditLogs');
  return onSnapshot(colRef, (snapshot) => {
    const list: AuditLogEntry[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as AuditLogEntry);
    });
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    onUpdate(list);
  }, (err) => {
    if (isQuotaExceededError(err)) {
      markQuotaExceeded();
    } else {
      console.warn('Firestore audit logs error:', err?.message || err);
    }
  });
}

export async function addAuditLogToFirestore(entry: Omit<AuditLogEntry, 'id' | 'timestamp'> & { timestamp?: string }) {
  await safeFirestoreWrite(() => {
    const docRef = doc(collection(db, 'auditLogs'));
    const logItem: AuditLogEntry = {
      ...entry,
      id: docRef.id,
      timestamp: entry.timestamp || new Date().toISOString()
    };
    return setDoc(docRef, logItem);
  });
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
  const newStreamKey = `pw_live_${crypto.randomUUID().replaceAll('-', '')}`;
  await safeFirestoreWrite(async () => {
    const docRef = doc(db, 'rtmpKeys', keyId);
    await setDoc(docRef, { key: newStreamKey, createdAt: new Date().toISOString() }, { merge: true });

    await addAuditLogToFirestore({
      action: 'REGENERATE_RTMP_KEY',
      actorEmail,
      targetEmail: clientEmail,
      details: `Regenerada chave de transmissão RTMP do cliente ${clientEmail} (Rótulo: '${currentLabel || keyId}').`
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
