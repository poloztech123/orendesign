import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ArchitecturalPlan } from '../types';

let supabaseInstance: SupabaseClient | null = null;

export function getCleanSupabaseConfig(): { url: string; key: string } {
  let rawUrl = import.meta.env.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env.SUPABASE_URL : '') || '';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : '') || '';

  // Auto-convert dashboard URLs like https://supabase.com/dashboard/project/rbqjcalcoaavuxqsyave
  if (rawUrl.includes('supabase.com/dashboard/project/')) {
    const match = rawUrl.match(/project\/([a-z0-9]+)/i);
    if (match && match[1]) {
      rawUrl = `https://${match[1]}.supabase.co`;
    }
  }

  // Auto-correct domain if someone provided just the project ref
  if (rawUrl && !rawUrl.startsWith('http') && !rawUrl.includes('.')) {
    rawUrl = `https://${rawUrl}.supabase.co`;
  } else if (rawUrl && !rawUrl.startsWith('http')) {
    rawUrl = `https://${rawUrl}`;
  }

  const url = rawUrl.replace(/\/$/, '');
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getCleanSupabaseConfig();
  return Boolean(url && key && url.length > 5 && key.length > 5);
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!supabaseInstance) {
    const { url, key } = getCleanSupabaseConfig();
    if (url && key) {
      supabaseInstance = createClient(url, key);
    }
  }
  return supabaseInstance;
}

// Convert DB row to ArchitecturalPlan
export function mapRowToPlan(row: any): ArchitecturalPlan {
  const imageUrl = row.image_url || row.image || '';
  return {
    id: String(row.id),
    name: row.title || row.name || 'Untitled Design',
    subtitle: row.subtitle || row.description?.substring(0, 60) || 'Architectural Blueprint',
    description: row.description || '',
    price: Number(row.price || 0),
    sqft: typeof row.sqft === 'number' ? row.sqft : parseInt(String(row.sqft)) || 0,
    beds: Number(row.beds || 0),
    baths: Number(row.baths || 0),
    stories: Number(row.stories || row.floors_count || 1),
    garageBays: Number(row.garage_bays || row.garageBays || 0),
    width: row.width || "40'-0\"",
    depth: row.depth || "50'-0\"",
    style: row.style || 'Modern Minimalist',
    category: row.category || 'Residential',
    image: imageUrl,
    images: Array.isArray(row.images) && row.images.length > 0 ? row.images : (imageUrl ? [imageUrl] : []),
    videos: Array.isArray(row.videos) ? row.videos : [],
    features: Array.isArray(row.features) && row.features.length > 0 ? row.features : ['3D Architectural Renderings', 'CAD Blueprint Drawings', 'Structural Floor Plans'],
    ceilingHeights: row.ceiling_heights || row.ceilingHeights || "9' Main",
    roofPitch: row.roof_pitch || row.roofPitch || "4:12",
    framingType: row.framing_type || row.framingType || "2x6 Wood Framing",
    floors: Array.isArray(row.floors) ? row.floors : [],
    isTrending: Boolean(row.is_trending ?? row.isTrending),
    isMostViewed: Boolean(row.is_most_viewed ?? row.isMostViewed),
    projectNo: row.project_no || row.projectNo || `ORD-${row.id}`
  };
}

// Convert ArchitecturalPlan to DB Row
export function mapPlanToRow(plan: ArchitecturalPlan): Record<string, any> {
  const imageUrl = plan.image || (plan.images && plan.images[0]) || '';
  return {
    id: String(plan.id),
    title: plan.name,
    name: plan.name,
    description: plan.description,
    price: Number(plan.price || 0),
    image_url: imageUrl,
    image: imageUrl,
    images: plan.images || [imageUrl],
    videos: plan.videos || [],
    sqft: typeof plan.sqft === 'number' ? plan.sqft : parseInt(String(plan.sqft)) || 0,
    beds: Number(plan.beds || 0),
    baths: Number(plan.baths || 0),
    stories: Number(plan.stories || 1),
    garage_bays: Number(plan.garageBays || 0),
    width: plan.width || "40'-0\"",
    depth: plan.depth || "50'-0\"",
    style: plan.style || 'Modern Minimalist',
    category: plan.category || 'Residential',
    features: plan.features || [],
    floors: plan.floors || [],
    is_trending: Boolean(plan.isTrending),
    is_most_viewed: Boolean(plan.isMostViewed),
    project_no: plan.projectNo || `ORD-${plan.id}`,
    created_at: new Date().toISOString()
  };
}

// Upload image file, blob, or base64 dataUrl with automatic fallback
export async function uploadToSupabaseStorage(
  fileOrDataUrl: File | Blob | string,
  fileName?: string
): Promise<string | null> {
  let blob: Blob | null = null;
  let ext = 'jpg';
  let contentType = 'image/jpeg';
  let dataUrlString = '';

  // 1. Process the input into a clean Blob and base64 string
  if (typeof fileOrDataUrl === 'string') {
    dataUrlString = fileOrDataUrl;
    if (fileOrDataUrl.startsWith('data:')) {
      const matches = fileOrDataUrl.match(/^data:([A-Za-z-+\/0-9.]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        contentType = matches[1];
        const base64Data = matches[2];
        try {
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          blob = new Blob([byteArray], { type: contentType });

          if (contentType.includes('png')) ext = 'png';
          else if (contentType.includes('webp')) ext = 'webp';
          else if (contentType.includes('gif')) ext = 'gif';
          else if (contentType.includes('pdf')) ext = 'pdf';
        } catch (e) {
          console.warn("Base64 decode warning:", e);
        }
      } else {
        return fileOrDataUrl;
      }
    } else if (fileOrDataUrl.startsWith('blob:')) {
      try {
        const res = await fetch(fileOrDataUrl);
        blob = await res.blob();
        contentType = blob.type || 'image/jpeg';
        if (contentType.includes('png')) ext = 'png';
        else if (contentType.includes('webp')) ext = 'webp';
      } catch (e) {
        console.warn("Blob fetch warning:", e);
      }
    } else if (fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://') || fileOrDataUrl.startsWith('/')) {
      return fileOrDataUrl; // Already a hosted URL
    }
  } else {
    blob = fileOrDataUrl;
    contentType = fileOrDataUrl.type || 'image/jpeg';
    if ('name' in fileOrDataUrl && typeof fileOrDataUrl.name === 'string') {
      const parts = fileOrDataUrl.name.split('.');
      if (parts.length > 1) ext = parts.pop() || 'jpg';
    } else {
      if (contentType.includes('png')) ext = 'png';
      else if (contentType.includes('webp')) ext = 'webp';
    }
  }

  const cleanFileName = fileName 
    ? `${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.${ext}`
    : `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

  // 2. Try proxy upload via server route (bypasses browser CORS / sandbox completely)
  try {
    if (!dataUrlString && blob) {
      dataUrlString = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob!);
      });
    }

    if (dataUrlString) {
      const proxyRes = await fetch('/api/supabase-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl: dataUrlString, filename: cleanFileName, contentType })
      });

      if (proxyRes.ok) {
        const json = await proxyRes.json();
        if (json.success && json.url) {
          return json.url;
        }
      }
    }
  } catch (proxyErr) {
    console.warn("Server proxy upload note:", proxyErr);
  }

  // 3. Try direct Supabase Storage upload
  const supabase = getSupabaseClient();
  if (supabase && blob) {
    try {
      const { data, error } = await supabase.storage.from('projects').upload(cleanFileName, blob, {
        contentType,
        cacheControl: '3600',
        upsert: true
      });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage.from('projects').getPublicUrl(cleanFileName);
        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    } catch (err: any) {
      console.warn("Direct storage upload failed:", err?.message || err);
    }
  }

  // 4. Final Fallback: Return dataUrl
  return dataUrlString || null;
}

// Fetch all projects from Supabase (server route first, client fallback)
export async function fetchProjectsFromSupabase(): Promise<ArchitecturalPlan[] | null> {
  // 1. Try server route
  try {
    const res = await fetch('/api/supabase/projects');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data.map(mapRowToPlan);
      }
    }
  } catch (_) {}

  // 2. Direct client fallback
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return null;
    if (!data || data.length === 0) return [];
    return data.map(mapRowToPlan);
  } catch (err) {
    return null;
  }
}

// Add or update project in Supabase
export async function saveProjectToSupabase(plan: ArchitecturalPlan): Promise<{ success: boolean; error?: string }> {
  const row = mapPlanToRow(plan);

  // 1. Try server route
  try {
    const res = await fetch('/api/supabase/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row)
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) return { success: true };
    }
  } catch (_) {}

  // 2. Direct client fallback
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Supabase client not configured' };

  try {
    const { error } = await supabase
      .from('projects')
      .upsert(row, { onConflict: 'id' });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// Delete project from Supabase
export async function deleteProjectFromSupabase(id: string): Promise<{ success: boolean; error?: string }> {
  // 1. Try server route
  try {
    const res = await fetch(`/api/supabase/projects/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) {
      const json = await res.json();
      if (json.success) return { success: true };
    }
  } catch (_) {}

  // 2. Direct client fallback
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Supabase client not configured' };

  try {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// Clear all projects from Supabase table
export async function clearAllProjectsFromSupabase(): Promise<{ success: boolean; error?: string }> {
  // 1. Try server route
  try {
    const res = await fetch('/api/supabase/projects', { method: 'DELETE' });
    if (res.ok) {
      const json = await res.json();
      if (json.success) return { success: true };
    }
  } catch (_) {}

  // 2. Direct client fallback
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Supabase client not configured' };

  try {
    const { error } = await supabase.from('projects').delete().neq('id', 'placeholder_none');
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// Subscribe to real-time project changes in Supabase
export function subscribeToSupabaseProjects(onUpdate: (plans: ArchitecturalPlan[]) => void): () => void {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  fetchProjectsFromSupabase().then((plans) => {
    if (plans && plans.length > 0) onUpdate(plans);
  });

  try {
    const channel = supabase
      .channel('public:projects')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        async () => {
          const freshPlans = await fetchProjectsFromSupabase();
          if (freshPlans && freshPlans.length > 0) onUpdate(freshPlans);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (e) {
    return () => {};
  }
}

// Diagnostic helper: Tests connection to Supabase database table and storage bucket
export async function testSupabaseConnection(): Promise<{
  configured: boolean;
  tableOk: boolean;
  tableCount: number;
  storageOk: boolean;
  storageFilesCount: number;
  errorMessage?: string;
}> {
  // 1. Always prefer Server-Side test route (eliminates browser CORS & network blocks)
  try {
    const res = await fetch('/api/supabase/test');
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err: any) {
    console.warn("Server-side test failed, trying direct:", err);
  }

  // 2. Direct Client fallback
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      tableOk: false,
      tableCount: 0,
      storageOk: false,
      storageFilesCount: 0,
      errorMessage: 'Supabase URL and API Key are missing or empty.'
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      configured: false,
      tableOk: false,
      tableCount: 0,
      storageOk: false,
      storageFilesCount: 0,
      errorMessage: 'Could not create Supabase client.'
    };
  }

  let tableOk = false;
  let tableCount = 0;
  let storageOk = false;
  let storageFilesCount = 0;
  const errors: string[] = [];

  try {
    const { data, error, count } = await supabase.from('projects').select('id', { count: 'exact' });
    if (error) errors.push(`Table: ${error.message}`);
    else {
      tableOk = true;
      tableCount = count ?? (data ? data.length : 0);
    }
  } catch (err: any) {
    errors.push(`Table: ${err?.message || err}`);
  }

  try {
    const { data, error } = await supabase.storage.from('projects').list('', { limit: 100 });
    if (error) errors.push(`Storage: ${error.message}`);
    else {
      storageOk = true;
      storageFilesCount = data ? data.length : 0;
    }
  } catch (err: any) {
    errors.push(`Storage: ${err?.message || err}`);
  }

  return {
    configured: true,
    tableOk,
    tableCount,
    storageOk,
    storageFilesCount,
    errorMessage: errors.length > 0 ? errors.join(' | ') : undefined
  };
}

// Batch Sync all current catalog plans to Supabase
export async function syncCatalogToSupabase(
  plans: ArchitecturalPlan[],
  onProgress?: (current: number, total: number, msg: string) => void
): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
  // 1. Try server-side bulk sync
  try {
    if (onProgress) onProgress(1, plans.length, `Sending ${plans.length} plans to Supabase via server...`);
    const rows = plans.map(mapPlanToRow);
    const res = await fetch('/api/supabase/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows })
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        if (onProgress) onProgress(plans.length, plans.length, `Completed! ${json.successCount} synced.`);
        return { successCount: json.successCount, errorCount: json.errorCount, errors: json.errors || [] };
      }
    }
  } catch (e: any) {
    console.warn("Server-side bulk sync exception:", e);
  }

  // 2. Direct client fallback loop
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i];
    if (onProgress) onProgress(i + 1, plans.length, `Syncing ${plan.name}...`);
    const res = await saveProjectToSupabase(plan);
    if (res.success) successCount++;
    else {
      errorCount++;
      if (res.error) errors.push(`${plan.name}: ${res.error}`);
    }
  }

  return { successCount, errorCount, errors };
}
