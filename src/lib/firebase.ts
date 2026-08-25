import { ArchitecturalPlan } from '../types';
import { ARCHITECTURAL_PLANS } from '../data';
import { saveProjectsToGitHub, fetchProjectsFromGitHub } from './githubService';

const PLANS_STORAGE_KEY = 'oren_catalog_plans_store';
const INQUIRIES_STORAGE_KEY = 'oren_inquiries_store';
const DELETED_PLANS_KEY = 'oren_deleted_plan_ids';

let memoryPlansCache: ArchitecturalPlan[] | null = null;

const DB_NAME = 'OrenPlansDB';
const STORE_NAME = 'plans_store';

function openIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveToIndexedDB(plans: ArchitecturalPlan[]): Promise<void> {
  const db = await openIndexedDB();
  if (!db) return;
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ key: 'catalog_plans', data: plans });
  } catch (e) {}
}

export async function loadFromIndexedDB(): Promise<ArchitecturalPlan[] | null> {
  const db = await openIndexedDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('catalog_plans');
      req.onsuccess = () => {
        if (req.result && Array.isArray(req.result.data) && req.result.data.length > 0) {
          resolve(req.result.data);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

if (typeof window !== 'undefined') {
  loadFromIndexedDB().then((idbPlans) => {
    if (idbPlans && idbPlans.length > 0) {
      if (!memoryPlansCache || idbPlans.length >= memoryPlansCache.length) {
        memoryPlansCache = idbPlans;
      }
    }
  }).catch(() => {});
}

export function getDeletedPlanIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_PLANS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function markPlanAsDeleted(id: string): void {
  try {
    const deleted = getDeletedPlanIds();
    if (!deleted.includes(id)) {
      deleted.push(id);
      localStorage.setItem(DELETED_PLANS_KEY, JSON.stringify(deleted));
    }
  } catch (e) {}
}

export function unmarkPlanAsDeleted(id: string): void {
  try {
    const deleted = getDeletedPlanIds();
    const next = deleted.filter(d => d !== id);
    localStorage.setItem(DELETED_PLANS_KEY, JSON.stringify(next));
  } catch (e) {}
}

/**
 * Fetch plans from server API, static JSON files, or GitHub raw CDN / REST API with local storage fallback
 */
export async function fetchPlansFromApi(): Promise<ArchitecturalPlan[]> {
  let remotePlans: ArchitecturalPlan[] | null = null;

  // 1. Try Express server API first if running full-stack
  try {
    const res = await fetch(`/api/plans?t=${Date.now()}`);
    if (res.ok) {
      const body = await res.json();
      if (body.success && Array.isArray(body.data)) {
        remotePlans = body.data;
      }
    }
  } catch (err) {
    // Expected on static hosts like GitHub Pages
  }

  // 2. Try fetching live directly from GitHub REST API / Raw CDN
  if (!remotePlans) {
    try {
      const ghPlans = await fetchProjectsFromGitHub();
      if (ghPlans && Array.isArray(ghPlans)) {
        remotePlans = ghPlans;
      }
    } catch (err) {
      // Ignore
    }
  }

  // 3. Try static data/plans.json on current domain (e.g., GitHub Pages site)
  if (!remotePlans) {
    try {
      const staticRes = await fetch(`./data/plans.json?t=${Date.now()}`);
      if (staticRes.ok) {
        const staticData = await staticRes.json();
        if (Array.isArray(staticData)) {
          remotePlans = staticData;
        }
      }
    } catch (err) {
      // Ignore
    }
  }

  // If server/remote returned valid plan array (even empty array), overwrite local cache so all devices stay identical
  if (remotePlans !== null && Array.isArray(remotePlans)) {
    saveStoredPlans(remotePlans);
    return remotePlans;
  }

  return getStoredPlans();
}

/**
 * Synchronous local storage reader for initial rendering before network fetch completes
 */
export function getStoredPlans(): ArchitecturalPlan[] {
  if (memoryPlansCache !== null && Array.isArray(memoryPlansCache)) {
    return memoryPlansCache;
  }
  try {
    const raw = localStorage.getItem(PLANS_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryPlansCache = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to read plans from localStorage:", err);
  }
  return [];
}

export function saveStoredPlans(plans: ArchitecturalPlan[]): void {
  if (Array.isArray(plans)) {
    memoryPlansCache = plans;
  }
  try {
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
  } catch (err) {
    console.warn("Failed to write plans to localStorage, using IndexedDB fallback:", err);
  }
  saveToIndexedDB(plans).catch(() => {});
}

/**
 * Seed initial catalog plans if server/local is empty
 */
export async function seedInitialPlansIfNeeded(): Promise<ArchitecturalPlan[]> {
  return await fetchPlansFromApi();
}

/**
 * Publish plans to GitHub repository and GitHub Pages
 */
export async function publishPlansToGitHubApi(plans: ArchitecturalPlan[]): Promise<{ success: boolean; message: string }> {
  // 1. Try server endpoint first if running full-stack
  try {
    const serverRes = await fetch('/api/deploy-github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plans }),
    });
    if (serverRes.ok) {
      const result = await serverRes.json();
      if (result.success) {
        saveStoredPlans(plans);
        // Also ensure client-side GitHub direct commit runs if configured
        saveProjectsToGitHub(plans).catch(() => {});
        return { success: true, message: result.message || 'Published live successfully!' };
      }
    }
  } catch (err) {
    // Server deployment endpoint unavailable, attempting direct API commit
  }

  // 2. Direct GitHub REST API integration for static / GitHub Pages environments
  const ghResult = await saveProjectsToGitHub(plans);
  saveStoredPlans(plans);
  return ghResult;
}

/**
 * Add a new plan to server database & local cache
 */
export async function addPlanToFirestore(plan: ArchitecturalPlan): Promise<ArchitecturalPlan> {
  unmarkPlanAsDeleted(plan.id);

  // 1. Save locally immediately so it appears instantly
  const existing = getStoredPlans();
  const updatedPlans = [plan, ...existing.filter(p => p && p.id !== plan.id)];
  saveStoredPlans(updatedPlans);

  // 2. Persist to server API if available
  try {
    const res = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    });
    if (res.ok) {
      const body = await res.json();
      if (body.success && Array.isArray(body.data)) {
        saveStoredPlans(body.data);
        publishPlansToGitHubApi(body.data).catch(() => {});
        return plan;
      }
    }
  } catch (err) {
    console.warn("Server API save fallback to background sync:", err);
  }

  // 3. Trigger GitHub sync in background
  publishPlansToGitHubApi(updatedPlans).catch(() => {});
  return plan;
}

/**
 * Update an existing plan in server database & local cache
 */
export async function updatePlanInFirestore(plan: ArchitecturalPlan): Promise<ArchitecturalPlan> {
  unmarkPlanAsDeleted(plan.id);

  // 1. Update locally immediately
  const existing = getStoredPlans();
  let updatedPlans = existing.map(p => p.id === plan.id ? plan : p);
  if (!existing.some(p => p.id === plan.id)) {
    updatedPlans = [plan, ...existing];
  }
  saveStoredPlans(updatedPlans);

  // 2. Persist to server API
  try {
    const res = await fetch(`/api/plans/${encodeURIComponent(plan.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    });
    if (res.ok) {
      const body = await res.json();
      if (body.success && Array.isArray(body.data)) {
        saveStoredPlans(body.data);
        publishPlansToGitHubApi(body.data).catch(() => {});
        return body.data.find((p: any) => p.id === plan.id) || plan;
      }
    }
  } catch (err) {
    console.warn("Server API update fallback to background sync:", err);
  }

  // 3. Trigger GitHub sync
  publishPlansToGitHubApi(updatedPlans).catch(() => {});
  return plan;
}

/**
 * Delete a plan from server database & local cache
 */
export async function deletePlanFromFirestore(id: string): Promise<void> {
  markPlanAsDeleted(id);

  // Remove locally immediately
  const existing = getStoredPlans();
  const updated = existing.filter(p => p.id !== id);
  saveStoredPlans(updated);

  // Call server API
  try {
    const res = await fetch(`/api/plans/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const body = await res.json();
      if (body.success && Array.isArray(body.data)) {
        saveStoredPlans(body.data);
        publishPlansToGitHubApi(body.data).catch(() => {});
        return;
      }
    }
  } catch (err) {
    console.warn("Failed to delete plan from server database:", err);
  }

  publishPlansToGitHubApi(updated).catch(() => {});
}

/**
 * Clear all plans from server database & local cache
 */
export async function clearAllPlansFromFirestore(): Promise<void> {
  saveStoredPlans([]);

  try {
    const res = await fetch('/api/plans', { method: 'DELETE' });
    if (res.ok) {
      saveStoredPlans([]);
    }
  } catch (err) {
    console.warn("Failed to clear plans on server database:", err);
  }
  publishPlansToGitHubApi([]).catch(() => {});
}

/**
 * Helper to convert Blob or File to Data URL
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Fast client-side image compression helper
 */
export async function optimizeImageForUpload(fileOrBlob: File | Blob, maxDimension = 1400, quality = 0.8): Promise<string> {
  if (typeof window === 'undefined') return '';
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;

        if (w > maxDimension || h > maxDimension) {
          if (w > h) {
            h = Math.round((h * maxDimension) / w);
            w = maxDimension;
          } else {
            w = Math.round((w * maxDimension) / h);
            h = maxDimension;
          }
        }

        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(e.target?.result as string || '');
        }
      };
      img.onerror = () => resolve(e.target?.result as string || '');
      img.src = e.target?.result as string || '';
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(fileOrBlob);
  });
}

import { uploadProjectImage } from './projectService';

/**
 * Uploads media (images, floor plans, videos) to Cloud Storage or server filesystem
 */
export async function uploadMediaToStorage(
  file: File | Blob,
  folder = 'images',
  onProgress?: (progress: number) => void
): Promise<string> {
  if (onProgress) onProgress(20);

  let dataUrl = '';
  // Check if image or default to image optimization
  if (!file.type || file.type.startsWith('image/')) {
    dataUrl = await optimizeImageForUpload(file, 1200, 0.75);
  } else {
    dataUrl = await blobToDataUrl(file);
  }

  if (onProgress) onProgress(50);

  const originalName = (file as File).name;
  const ext = originalName && originalName.includes('.') ? originalName.split('.').pop() : 'jpg';
  const filename = originalName 
    ? originalName.replace(/[^a-zA-Z0-9_.-]/g, '_')
    : `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

  try {
    const cloudUrl = await uploadProjectImage(dataUrl || (file as File), filename);
    if (cloudUrl && !cloudUrl.startsWith('data:')) {
      if (onProgress) onProgress(100);
      return cloudUrl;
    }
  } catch (err) {
    console.warn("Failed to upload file to cloud storage, attempting /api/upload fallback:", err);
  }

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, folder, filename }),
    });

    if (res.ok) {
      const body = await res.json();
      if (body.success && body.url) {
        if (onProgress) onProgress(100);
        return body.url;
      }
    }
  } catch (err) {
    console.warn("Failed to upload file to server, using Data URL fallback:", err);
  }

  if (onProgress) onProgress(100);
  return dataUrl;
}

/**
 * Fetch stored inquiries from server
 */
export async function getStoredInquiries(): Promise<any[]> {
  try {
    const res = await fetch('/api/inquiries');
    if (res.ok) {
      const body = await res.json();
      if (body.success && Array.isArray(body.data)) {
        return body.data;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch inquiries from server API:", e);
  }

  // Fallback to local
  try {
    const raw = localStorage.getItem(INQUIRIES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save an inquiry to server
 */
export async function saveInquiry(inquiry: any): Promise<void> {
  try {
    await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiry),
    });
  } catch (e) {
    console.warn("Failed to save inquiry to server API:", e);
  }

  try {
    const existingRaw = localStorage.getItem(INQUIRIES_STORAGE_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    const updated = [{ id: `inq-${Date.now()}`, timestamp: new Date().toISOString(), ...inquiry }, ...existing];
    localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Failed to save inquiry to localStorage:", e);
  }
}

// Stubs for backward compatibility
export const db = null;
export const storage = null;
export const plansCollectionRef = null;
export const inquiriesCollectionRef = null;
