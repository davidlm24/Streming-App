import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  getDocs
} from 'firebase/firestore';
import { storage, db, auth } from './firebase';
import { safeFirestoreWrite, markQuotaExceeded, isQuotaExceededError } from './firestoreService';

export interface CloudMediaAsset {
  id: string;
  name: string;
  url: string;
  type: 'logo' | 'watermark' | 'overlay' | 'background' | 'video' | 'audio';
  ownerEmail: string;
  storagePath: string;
  createdAt: string;
  sizeBytes?: number;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * Uploads a file to Firebase Cloud Storage and persists metadata in Firestore.
 * Falls back gracefully to base64 + local storage / Firestore if Firebase Storage fails.
 */
export async function uploadMediaToCloudStorage(
  file: File, 
  type: 'logo' | 'watermark' | 'overlay' | 'background' | 'video' | 'audio',
  userEmail?: string
): Promise<CloudMediaAsset> {
  const email = userEmail || auth.currentUser?.email || 'mgdlms@gmail.com';
  const cleanEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
  const fileExtension = file.name.split('.').pop() || 'png';
  const timestamp = Date.now();
  const assetId = `${type}-${timestamp}`;
  const storagePath = `media_assets/${cleanEmail}/${type}/${timestamp}_${file.name}`;

  let downloadUrl = '';

  try {
    const storageRef = ref(storage, storagePath);
    // Add a 5 second timeout so it doesn't hang forever if Firebase config is wrong/blocked
    const uploadPromise = uploadBytes(storageRef, file);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase Storage timeout')), 5000));
    const snapshot = await Promise.race([uploadPromise, timeoutPromise]) as any;
    downloadUrl = await getDownloadURL(snapshot.ref);
  } catch (storageError) {
    console.warn('Firebase Storage direct upload fallback:', storageError);
    // Fallback to base64 for small files, blob URL for large files (like video/backgrounds)
    if (file.size > 800 * 1024) {
      downloadUrl = URL.createObjectURL(file);
    } else {
      downloadUrl = await fileToBase64(file);
    }
  }

  const newAsset: CloudMediaAsset = {
    id: assetId,
    name: file.name,
    url: downloadUrl,
    type,
    ownerEmail: email,
    storagePath,
    createdAt: new Date().toISOString(),
    sizeBytes: file.size
  };

  // Safe persist metadata in Firestore if quota allows
  await safeFirestoreWrite(() => {
    const assetRef = doc(db, 'media_assets', assetId);
    return setDoc(assetRef, newAsset);
  });

  return newAsset;
}

/**
 * Deletes a media asset from both Firebase Storage and Firestore.
 */
export async function deleteMediaFromCloudStorage(id: string, storagePath?: string): Promise<void> {
  if (storagePath) {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn('Failed to delete from Firebase Storage:', err);
    }
  }

  await safeFirestoreWrite(() => {
    const assetRef = doc(db, 'media_assets', id);
    return deleteDoc(assetRef);
  });
}

/**
 * Real-time subscription to user's media assets in Firestore Cloud DB.
 */
export function subscribeUserMediaAssets(
  userEmail: string,
  onAssetsUpdate: (assets: CloudMediaAsset[]) => void
) {
  if (!userEmail) return () => {};

  const q = query(
    collection(db, 'media_assets'),
    where('ownerEmail', '==', userEmail)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const assets: CloudMediaAsset[] = [];
      snapshot.forEach((docSnap) => {
        assets.push(docSnap.data() as CloudMediaAsset);
      });
      onAssetsUpdate(assets);
    },
    (error) => {
      if (isQuotaExceededError(error)) {
        markQuotaExceeded();
      } else {
        console.warn('Error subscribing to media_assets in Firestore:', error?.message || error);
      }
    }
  );
}
