import { ArchitecturalPlan } from '../types';
import { 
  isSupabaseConfigured, 
  uploadToSupabaseStorage, 
  fetchProjectsFromSupabase, 
  saveProjectToSupabase, 
  deleteProjectFromSupabase, 
  clearAllProjectsFromSupabase,
  subscribeToSupabaseProjects 
} from './supabase';
import { 
  isFirebaseConfigured, 
  uploadToFirebaseStorage, 
  fetchProjectsFromFirebase, 
  saveProjectToFirebase, 
  deleteProjectFromFirebase, 
  subscribeToFirebaseProjects 
} from './firebaseClient';
import { 
  fetchPlansFromApi, 
  addPlanToFirestore, 
  updatePlanInFirestore, 
  deletePlanFromFirestore, 
  clearAllPlansFromFirestore,
  getStoredPlans, 
  saveStoredPlans 
} from './firebase';
import { saveProjectsToGitHub } from './githubService';

/**
 * Upload an image (or file) to Cloud Storage (Supabase Storage or Firebase Storage),
 * fallback to Express server permanent uploads CDN. Returns public CDN URL.
 */
export async function uploadProjectImage(
  fileOrDataUrl: File | string,
  fileName?: string
): Promise<string> {
  // 1. Try Supabase Storage
  if (isSupabaseConfigured()) {
    const supabaseUrl = await uploadToSupabaseStorage(fileOrDataUrl, fileName);
    if (supabaseUrl) return supabaseUrl;
  }

  // 2. Try Firebase Storage
  if (isFirebaseConfigured()) {
    const firebaseUrl = await uploadToFirebaseStorage(fileOrDataUrl, fileName);
    if (firebaseUrl) return firebaseUrl;
  }

  // 3. Fallback to Express Server /api/upload
  try {
    let dataUrl = typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '';
    if (fileOrDataUrl instanceof File) {
      dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileOrDataUrl);
      });
    }

    if (dataUrl) {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, filename: fileName, folder: 'images' })
      });
      if (res.ok) {
        const body = await res.json();
        if (body.success && body.url) {
          return body.url;
        }
      }
    }
  } catch (err) {
    console.warn("Express upload error:", err);
  }

  return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '';
}

/**
 * Fetch live projects directly from Database (Supabase / Firebase / Server API)
 */
export async function fetchLiveProjects(): Promise<ArchitecturalPlan[]> {
  // 1. Supabase
  if (isSupabaseConfigured()) {
    const supabasePlans = await fetchProjectsFromSupabase();
    if (supabasePlans && supabasePlans.length > 0) {
      saveStoredPlans(supabasePlans);
      return supabasePlans;
    }
  }

  // 2. Firebase
  if (isFirebaseConfigured()) {
    const firebasePlans = await fetchProjectsFromFirebase();
    if (firebasePlans && firebasePlans.length > 0) {
      saveStoredPlans(firebasePlans);
      return firebasePlans;
    }
  }

  // 3. Server API + Local Cache
  return await fetchPlansFromApi();
}

/**
 * Add or Update Project in database
 */
export async function saveProject(plan: ArchitecturalPlan): Promise<ArchitecturalPlan> {
  // Ensure image URL is uploaded to storage if base64
  let imageUrl = plan.image;
  if (imageUrl && imageUrl.startsWith('data:')) {
    const cloudUrl = await uploadProjectImage(imageUrl, `${plan.id}_hero`);
    if (cloudUrl) imageUrl = cloudUrl;
  }

  let updatedImages = plan.images || [imageUrl];
  if (Array.isArray(plan.images) && plan.images.some(img => img.startsWith('data:'))) {
    updatedImages = await Promise.all(
      plan.images.map(async (img, i) => {
        if (img.startsWith('data:')) {
          const url = await uploadProjectImage(img, `${plan.id}_img_${i}`);
          return url || img;
        }
        return img;
      })
    );
  }

  const finalPlan: ArchitecturalPlan = {
    ...plan,
    image: imageUrl,
    images: updatedImages
  };

  // 1. Save to Supabase if configured
  if (isSupabaseConfigured()) {
    await saveProjectToSupabase(finalPlan);
  }

  // 2. Save to Firebase if configured
  if (isFirebaseConfigured()) {
    await saveProjectToFirebase(finalPlan);
  }

  // 3. Save to Express server DB & local cache
  await addPlanToFirestore(finalPlan);

  return finalPlan;
}

/**
 * Delete project from database
 */
export async function deleteProject(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await deleteProjectFromSupabase(id);
  }

  if (isFirebaseConfigured()) {
    await deleteProjectFromFirebase(id);
  }

  await deletePlanFromFirestore(id);
}

/**
 * Completely clear/purge all projects from all data sources (Supabase, Firebase, Server, GitHub, LocalStorage)
 */
export async function clearAllProjects(): Promise<void> {
  // 1. Supabase
  if (isSupabaseConfigured()) {
    try {
      await clearAllProjectsFromSupabase();
    } catch (e) {
      console.warn("Error clearing Supabase table:", e);
    }
  }

  // 2. Server & Local storage
  try {
    await clearAllPlansFromFirestore();
  } catch (e) {
    console.warn("Error clearing server/firestore plans:", e);
  }

  // 3. GitHub repository
  try {
    await saveProjectsToGitHub([]);
  } catch (e) {
    console.warn("Error syncing empty catalog to GitHub:", e);
  }

  saveStoredPlans([]);
}

/**
 * Real-time listener for live project updates across all devices
 */
export function subscribeToRealtimeProjects(onUpdate: (plans: ArchitecturalPlan[]) => void): () => void {
  // Supabase real-time
  if (isSupabaseConfigured()) {
    return subscribeToSupabaseProjects(onUpdate);
  }

  // Firebase real-time
  if (isFirebaseConfigured()) {
    return subscribeToFirebaseProjects(onUpdate);
  }

  // Server API polling fallback
  let isMounted = true;
  const poll = async () => {
    try {
      const plans = await fetchPlansFromApi();
      if (isMounted && plans) {
        onUpdate(plans);
      }
    } catch (err) {}
  };

  poll();
  const interval = setInterval(poll, 3000);

  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}
