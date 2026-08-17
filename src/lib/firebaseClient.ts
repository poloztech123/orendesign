import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  Firestore 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { ArchitecturalPlan } from '../types';
import { mapRowToPlan, mapPlanToRow } from './supabase';

let firebaseAppInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

export function isFirebaseConfigured(): boolean {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || (typeof process !== 'undefined' ? process.env.FIREBASE_API_KEY : '');
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || (typeof process !== 'undefined' ? process.env.FIREBASE_PROJECT_ID : '');
  return Boolean(apiKey && projectId && apiKey.length > 5 && projectId.length > 2);
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  if (!firebaseAppInstance) {
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
    };
    if (getApps().length === 0) {
      firebaseAppInstance = initializeApp(config);
    } else {
      firebaseAppInstance = getApp();
    }
  }
  return firebaseAppInstance;
}

export function getFirestoreDb(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) return null;
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(app);
  }
  return firestoreInstance;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  const app = getFirebaseApp();
  if (!app) return null;
  if (!storageInstance) {
    storageInstance = getStorage(app);
  }
  return storageInstance;
}

// Upload file or base64 dataUrl to Firebase Cloud Storage bucket
export async function uploadToFirebaseStorage(
  fileOrDataUrl: File | string,
  fileName?: string
): Promise<string | null> {
  const storage = getFirebaseStorage();
  if (!storage) return null;

  try {
    let blob: Blob;
    let ext = 'jpg';

    if (typeof fileOrDataUrl === 'string') {
      if (fileOrDataUrl.startsWith('data:')) {
        const matches = fileOrDataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          blob = new Blob([byteArray], { type: mimeType });

          if (mimeType.includes('png')) ext = 'png';
          else if (mimeType.includes('webp')) ext = 'webp';
          else if (mimeType.includes('gif')) ext = 'gif';
          else if (mimeType.includes('pdf')) ext = 'pdf';
        } else {
          return fileOrDataUrl;
        }
      } else {
        return fileOrDataUrl;
      }
    } else {
      blob = fileOrDataUrl;
      const parts = fileOrDataUrl.name.split('.');
      if (parts.length > 1) ext = parts.pop() || 'jpg';
    }

    const safeName = fileName 
      ? fileName.replace(/[^a-zA-Z0-9_.-]/g, '_')
      : `project_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const storageRef = ref(storage, `projects/${safeName}`);
    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (err) {
    console.error("Failed to upload to Firebase storage:", err);
    return null;
  }
}

// Fetch all projects from Firebase Firestore
export async function fetchProjectsFromFirebase(): Promise<ArchitecturalPlan[] | null> {
  const db = getFirestoreDb();
  if (!db) return null;

  try {
    const q = query(collection(db, 'projects'), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    const plans: ArchitecturalPlan[] = [];
    snapshot.forEach((docSnap) => {
      plans.push(mapRowToPlan({ id: docSnap.id, ...docSnap.data() }));
    });
    return plans;
  } catch (err) {
    console.warn("Error fetching projects from Firebase Firestore:", err);
    return null;
  }
}

// Add or update project in Firebase Firestore
export async function saveProjectToFirebase(plan: ArchitecturalPlan): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) return false;

  try {
    const row = mapPlanToRow(plan);
    const docRef = doc(db, 'projects', plan.id);
    await setDoc(docRef, row, { merge: true });
    return true;
  } catch (err) {
    console.error("Firebase setDoc failed:", err);
    return false;
  }
}

// Delete project from Firebase Firestore
export async function deleteProjectFromFirebase(id: string): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) return false;

  try {
    const docRef = doc(db, 'projects', id);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error("Firebase deleteDoc failed:", err);
    return false;
  }
}

// Subscribe to real-time project changes in Firebase Firestore
export function subscribeToFirebaseProjects(onUpdate: (plans: ArchitecturalPlan[]) => void): () => void {
  const db = getFirestoreDb();
  if (!db) return () => {};

  try {
    const q = query(collection(db, 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plans: ArchitecturalPlan[] = [];
      snapshot.forEach((docSnap) => {
        plans.push(mapRowToPlan({ id: docSnap.id, ...docSnap.data() }));
      });
      if (plans.length > 0) {
        onUpdate(plans);
      }
    }, (err) => {
      console.warn("Firebase onSnapshot error:", err);
    });

    return unsubscribe;
  } catch (err) {
    console.error("Failed to set up Firebase onSnapshot listener:", err);
    return () => {};
  }
}
