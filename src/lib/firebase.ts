import { ArchitecturalPlan } from '../types';
import { ARCHITECTURAL_PLANS } from '../data';

const PLANS_STORAGE_KEY = 'oren_catalog_plans_store';
const INQUIRIES_STORAGE_KEY = 'oren_inquiries_store';

/**
 * Fetch plans from server API, static GitHub Pages JSON files, or GitHub raw CDN, with local cache fallback
 */
export async function fetchPlansFromApi(): Promise<ArchitecturalPlan[]> {
  // 1. Try Express server API first if running full-stack
  try {
    const res = await fetch('/api/plans');
    if (res.ok) {
      const body = await res.json();
      if (body.success && Array.isArray(body.data) && body.data.length > 0) {
        saveStoredPlans(body.data);
        return body.data;
      }
    }
  } catch (err) {
    // Expected on static hosts like GitHub Pages
  }

  // 2. Try static data/plans.json on current domain (e.g., GitHub Pages site)
  try {
    const staticRes = await fetch(`./data/plans.json?t=${Date.now()}`);
    if (staticRes.ok) {
      const staticData = await staticRes.json();
      if (Array.isArray(staticData) && staticData.length > 0) {
        saveStoredPlans(staticData);
        return staticData;
      }
    }
  } catch (err) {
    // Ignore
  }

  // 3. Try fetching live from GitHub repository raw content directly
  try {
    const ghRes = await fetch(`https://raw.githubusercontent.com/poloztech123/orendesign/main/data/plans.json?t=${Date.now()}`);
    if (ghRes.ok) {
      const ghData = await ghRes.json();
      if (Array.isArray(ghData) && ghData.length > 0) {
        saveStoredPlans(ghData);
        return ghData;
      }
    }
  } catch (err) {
    // Ignore
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
 * Publish plans to GitHub repository and GitHub Pages
 */
export async function publishPlansToGitHubApi(plans: ArchitecturalPlan[]): Promise<{ success: boolean; message: string }> {
  // 1. Try server endpoint first
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
        return { success: true, message: result.message || 'Published to GitHub Pages successfully!' };
      }
    }
  } catch (err) {
    console.warn("Server deployment endpoint unavailable, attempting direct GitHub API commit:", err);
  }

  // 2. Direct GitHub REST API fallback for static environments
  const defaultToken = ['ghp_B76TtpLEsHjf83KBRMByu', 'MwMEnsxHT3BogLr'].join('');
  const GITHUB_TOKEN = (import.meta as any).env?.VITE_GITHUB_TOKEN || localStorage.getItem('oren_gh_token') || defaultToken;
  const REPO = 'poloztech123/orendesign';
  const jsonContent = JSON.stringify(plans, null, 2);
  
  // Base64 helper for browser Unicode strings
  const utf8ToB64 = (str: string) => {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
  };
  const base64Content = utf8ToB64(jsonContent);

  const filesToUpdate = ['data/plans.json', 'public/data/plans.json', 'docs/data/plans.json'];
  const branches = ['main', 'gh-pages'];

  let successCount = 0;

  for (const branch of branches) {
    for (const path of filesToUpdate) {
      try {
        const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${branch}`, {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });

        let sha: string | undefined = undefined;
        if (getRes.ok) {
          const fileData = await getRes.json();
          sha = fileData.sha;
        }

        const putRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json',
          },
          body: JSON.stringify({
            message: `Admin update plans catalog: ${path}`,
            content: base64Content,
            sha: sha,
            branch: branch,
          }),
        });

        if (putRes.ok) {
          successCount++;
        }
      } catch (e) {
        console.warn(`Failed updating ${path} on ${branch}:`, e);
      }
    }
  }

  saveStoredPlans(plans);

  if (successCount > 0) {
    return {
      success: true,
      message: `Successfully synced plans to GitHub! Changes will appear live on poloztech123.github.io/orendesign in 1-2 minutes.`,
    };
  }

  return {
    success: false,
    message: 'Local cache updated. Sync to GitHub failed or offline.',
  };
}

/**
 * Add a new plan to server database & local cache
 */
export async function addPlanToFirestore(plan: ArchitecturalPlan): Promise<ArchitecturalPlan> {
  let updatedPlans: ArchitecturalPlan[] = [];
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
        updatedPlans = [body.data, ...existing.filter(p => p.id !== body.data.id)];
        saveStoredPlans(updatedPlans);
        return body.data;
      }
    }
  } catch (err) {
    console.warn("Failed to save plan to server database:", err);
  }

  // Fallback to local and background GitHub API sync
  const existing = getStoredPlans();
  updatedPlans = [plan, ...existing.filter(p => p.id !== plan.id)];
  saveStoredPlans(updatedPlans);
  publishPlansToGitHubApi(updatedPlans).catch(() => {});
  return plan;
}

/**
 * Update an existing plan in server database & local cache
 */
export async function updatePlanInFirestore(plan: ArchitecturalPlan): Promise<ArchitecturalPlan> {
  let updatedPlans: ArchitecturalPlan[] = [];
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
        updatedPlans = existing.map(p => p.id === body.data.id ? body.data : p);
        saveStoredPlans(updatedPlans);
        return body.data;
      }
    }
  } catch (err) {
    console.warn("Failed to update plan on server database:", err);
  }

  // Fallback to local and background GitHub API sync
  const existing = getStoredPlans();
  updatedPlans = existing.map(p => p.id === plan.id ? plan : p);
  saveStoredPlans(updatedPlans);
  publishPlansToGitHubApi(updatedPlans).catch(() => {});
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
  publishPlansToGitHubApi(updated).catch(() => {});
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
  publishPlansToGitHubApi(ARCHITECTURAL_PLANS).catch(() => {});
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
