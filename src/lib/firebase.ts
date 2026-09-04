import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, setLogLevel, disableNetwork, enableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence verbose internal Firebase SDK backoff logs
try {
  setLogLevel('silent');
} catch {}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

export const GOOGLE_MEET_SCOPES = [
  'https://www.googleapis.com/auth/meetings.space.created',
  'https://www.googleapis.com/auth/meetings.space.readonly',
  'https://www.googleapis.com/auth/meetings.space.settings'
];

GOOGLE_MEET_SCOPES.forEach(scope => googleAuthProvider.addScope(scope));

export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
}, (firebaseConfig as any).firestoreDatabaseId || '(default)');

export { disableNetwork, enableNetwork };
export const storage = getStorage(app);

