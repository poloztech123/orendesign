import { ArchitecturalPlan } from '../types';
import { ARCHITECTURAL_PLANS } from '../data';

const PLANS_STORAGE_KEY = 'oren_catalog_plans_store';
const INQUIRIES_STORAGE_KEY = 'oren_inquiries_store';

/**
 * Fetch plans from server API with local cache fallback
 */
export async function fetchPlansFromApi(): Promise<ArchitecturalPlan[]> {
  try {
    const res = await fetch('/api/plans');
    if (res.ok) {
      const body = await res.json();
      if (body.success && Array.isArray(body.data)) {
        saveStoredPlans(body.data);
        return body.data;
      }
    }
  } catch (err) {
    console.warn("API fetch failed, falling back to local storage:", err);
  }
  return getStoredPlans();
}

/**
 * Synchronous local storage reader for initial rendering
 */
export function getStoredPlans(): ArchitecturalPlan[] {
  try {
    const raw = localStorage.getItem(PLANS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to read plans from localStorage:", err);
  }
  return ARCHITECTURAL_PLANS;
}

export function saveStoredPlans(plans: ArchitecturalPlan[]): void {
  try {
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
  } catch (err) {
    console.warn("Failed to write plans to localStorage:", err);
  }
}

/**
 * Seed initial catalog plans if server/local is empty
 */
export async function seedInitialPlansIfNeeded(): Promise<ArchitecturalPlan[]> {
  const loaded = await fetchPlansFromApi();
  if (!loaded || loaded.length === 0) {
    saveStoredPlans(ARCHITECTURAL_PLANS);
    return ARCHITECTURAL_PLANS;
  }
  return loaded;
}

/**
 * Add a new plan to server database & local cache
 */
export async function addPlanToFirestore(plan: ArchitecturalPlan): Promise<ArchitecturalPlan> {
  try {
    const res = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    });
    if (res.ok) {
      const body = await res.json();
      if (body.success && body.data) {
        const existing = getStoredPlans();
        const updated = [body.data, ...existing.filter(p => p.id !== body.data.id)];
        saveStoredPlans(updated);
        return body.data;
      }
    }
  } catch (err) {
    console.warn("Failed to save plan to server database:", err);
  }

  // Fallback to local
  const existing = getStoredPlans();
  const updated = [plan, ...existing.filter(p => p.id !== plan.id)];
  saveStoredPlans(updated);
  return plan;
}

/**
 * Update an existing plan in server database & local cache
 */
export async function updatePlanInFirestore(plan: ArchitecturalPlan): Promise<ArchitecturalPlan> {
  try {
    const res = await fetch(`/api/plans/${encodeURIComponent(plan.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    });
    if (res.ok) {
      const body = await res.json();
      if (body.success && body.data) {
        const existing = getStoredPlans();
        const updated = existing.map(p => p.id === body.data.id ? body.data : p);
        saveStoredPlans(updated);
        return body.data;
      }
    }
  } catch (err) {
    console.warn("Failed to update plan on server database:", err);
  }

  // Fallback to local
  const existing = getStoredPlans();
  const updated = existing.map(p => p.id === plan.id ? plan : p);
  saveStoredPlans(updated);
  return plan;
}

/**
 * Delete a plan from server database & local cache
 */
export async function deletePlanFromFirestore(id: string): Promise<void> {
  try {
    await fetch(`/api/plans/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn("Failed to delete plan from server database:", err);
  }

  const existing = getStoredPlans();
  const updated = existing.filter(p => p.id !== id);
  saveStoredPlans(updated);
}

/**
 * Clear all plans from server database & local cache
 */
export async function clearAllPlansFromFirestore(): Promise<void> {
  try {
    await fetch('/api/plans', { method: 'DELETE' });
  } catch (err) {
    console.warn("Failed to clear plans on server database:", err);
  }
  localStorage.removeItem(PLANS_STORAGE_KEY);
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

/**
 * Uploads media (images, floor plans, videos) to server filesystem database
 */
export async function uploadMediaToStorage(
  file: File | Blob,
  folder = 'images',
  onProgress?: (progress: number) => void
): Promise<string> {
  if (onProgress) onProgress(20);

  let dataUrl = '';
  if (file.type && file.type.startsWith('image/')) {
    dataUrl = await optimizeImageForUpload(file, 1400, 0.8);
  } else {
    dataUrl = await blobToDataUrl(file);
  }

  if (onProgress) onProgress(50);

  const filename = (file as File).name || `upload_${Date.now()}`;

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
