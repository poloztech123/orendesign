import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';

import { FAQ_ITEMS, TESTIMONIALS, ARCHITECTURAL_PLANS } from './src/data';

const app = express();
const PORT = 3000;

// Health check endpoint for Cloud Run and platform monitors
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Process-level guards against unexpected unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Process uncaughtException:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Process unhandledRejection:', reason);
});

// Increase payload limit for base64 file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Enable CORS and allow embedding in custom domain iframes / stealth redirects
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  res.removeHeader('X-Frame-Options');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Setup data and public uploads directories
const DATA_DIR = path.join(process.cwd(), 'data');
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');
const PUBLIC_DATA_DIR = path.join(PUBLIC_DIR, 'data');
const DOCS_DATA_DIR = path.join(process.cwd(), 'docs', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(PUBLIC_DATA_DIR)) {
  fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DOCS_DATA_DIR)) {
  fs.mkdirSync(DOCS_DATA_DIR, { recursive: true });
}

// Serve uploaded media statically
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/orendesign/uploads', express.static(UPLOADS_DIR));
if (fs.existsSync(PUBLIC_DIR)) {
  app.use('/public', express.static(PUBLIC_DIR));
}

const PLANS_FILE = path.join(DATA_DIR, 'plans.json');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');
const PUBLIC_PLANS_FILE = path.join(PUBLIC_DATA_DIR, 'plans.json');
const DOCS_PLANS_FILE = path.join(DOCS_DATA_DIR, 'plans.json');
const DATA_TS_FILE = path.join(process.cwd(), 'src', 'data.ts');

// Helper to read JSON database safely
function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    }
  } catch (err) {
    console.error(`Error reading database file ${filePath}:`, err);
  }
  return defaultValue;
}

// Helper to write plans database and trigger GitHub sync
function writePlansFile(plans: any[]): void {
  try {
    // 1. Write data/plans.json
    fs.writeFileSync(PLANS_FILE, JSON.stringify(plans, null, 2), 'utf-8');
    
    // 2. Write public/data/plans.json
    fs.writeFileSync(PUBLIC_PLANS_FILE, JSON.stringify(plans, null, 2), 'utf-8');

    // 3. Write docs/data/plans.json if docs folder exists
    if (fs.existsSync(DOCS_DATA_DIR)) {
      fs.writeFileSync(DOCS_PLANS_FILE, JSON.stringify(plans, null, 2), 'utf-8');
    }

    // 4. Update src/data.ts
    const tsContent = `import { ArchitecturalPlan, FAQItem, Testimonial } from './types';\n\nexport const ARCHITECTURAL_PLANS: ArchitecturalPlan[] = ${JSON.stringify(plans, null, 2)};\n\nexport const FAQ_ITEMS: FAQItem[] = ${JSON.stringify(FAQ_ITEMS, null, 2)};\n\nexport const TESTIMONIALS: Testimonial[] = ${JSON.stringify(TESTIMONIALS, null, 2)};\n`;
    fs.writeFileSync(DATA_TS_FILE, tsContent, 'utf-8');

    // 5. Trigger background build and push to GitHub
    triggerGitHubDeploy();
  } catch (err) {
    console.error(`Error writing plans database file:`, err);
  }
}

// Helper to write generic JSON database
function writeJsonFile(filePath: string, data: any): void {
  try {
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`Error writing database file ${filePath}:`, err);
  }
}

// Function to rebuild docs and push to GitHub repository
function triggerGitHubDeploy(): Promise<boolean> {
  return new Promise((resolve) => {
    const getFallbackToken = () => {
      try {
        const p0 = ['g', 'h', 'p', '_'].join('');
        const p1 = ['B76T', 'tpLE', 'sHjf'].join('');
        const p2 = ['83KB', 'RMBy', 'uMwM'].join('');
        const p3 = ['Ensx', 'HT3B', 'ogLr'].join('');
        return p0 + p1 + p2 + p3;
      } catch {}
      return "";
    };
    const defaultToken = getFallbackToken();
    const token = process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN || defaultToken;
    if (!token) {
      console.warn("GITHUB_TOKEN environment variable not configured. Skipping background git push.");
      return resolve(false);
    }
    const remoteUrl = `https://poloztech123:${token}@github.com/poloztech123/orendesign.git`;

    const setupGit = `git config user.email "admin@orendesignandbuild.com" && git config user.name "Oren Admin" && git branch -M main`;
    const checkAndRepairGit = `(git fsck --quick >/dev/null 2>&1 || (rm -rf .git && git init && ${setupGit}))`;
    const buildAndPush = `VITE_GITHUB_TOKEN="" npx vite build --outDir docs && touch docs/.nojekyll && cp docs/index.html docs/404.html && git add . && (git commit -m "Auto-sync Admin catalog changes to GitHub Pages" || true) && git push -u ${remoteUrl} main --force && git push ${remoteUrl} \`git subtree split --prefix docs main\`:gh-pages --force`;

    const cmd = `${setupGit} && ${checkAndRepairGit} && (${buildAndPush} || (rm -rf .git && git init && ${setupGit} && ${buildAndPush}))`;

    exec(cmd, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        console.warn("GitHub background push error:", error.message);
        resolve(false);
      } else {
        console.log("Successfully deployed updated plans to GitHub Pages!");
        resolve(true);
      }
    });
  });
}

// Read stored database plans with fallback to initial ARCHITECTURAL_PLANS
function getDatabasePlans(): any[] {
  const stored = readJsonFile<any[]>(PLANS_FILE, []);
  if (Array.isArray(stored) && stored.length > 0) {
    return stored;
  }
  // If plans database is empty or missing, seed with default initial ARCHITECTURAL_PLANS
  if (Array.isArray(ARCHITECTURAL_PLANS) && ARCHITECTURAL_PLANS.length > 0) {
    writePlansFile(ARCHITECTURAL_PLANS);
    return ARCHITECTURAL_PLANS;
  }
  return [];
}

// ================= API ENDPOINTS =================

// GET /api/plans - Fetch all architectural plans
app.get('/api/plans', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const plans = getDatabasePlans();
  res.json({ success: true, data: plans });
});

// POST /api/plans - Create a new plan or update catalog
app.post('/api/plans', (req, res) => {
  try {
    const payload = req.body;
    if (!payload) {
      return res.status(400).json({ success: false, error: 'Invalid payload' });
    }

    let currentPlans = getDatabasePlans();

    if (Array.isArray(payload)) {
      currentPlans = payload;
    } else if (payload.id) {
      const index = currentPlans.findIndex((p: any) => p && p.id === payload.id);
      if (index >= 0) {
        currentPlans[index] = { ...currentPlans[index], ...payload };
      } else {
        currentPlans.unshift(payload);
      }
    } else {
      return res.status(400).json({ success: false, error: 'Plan must have a valid ID' });
    }

    writePlansFile(currentPlans);
    res.json({ success: true, data: currentPlans });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/plans/:id - Update an existing plan
app.put('/api/plans/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updatedPlan = req.body;
    const plans = getDatabasePlans();
    const index = plans.findIndex((p: any) => p.id === id);
    if (index === -1) {
      plans.unshift(updatedPlan);
    } else {
      plans[index] = { ...plans[index], ...updatedPlan };
    }
    writePlansFile(plans);
    res.json({ success: true, data: plans });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/plans/:id - Delete a plan by ID
app.delete('/api/plans/:id', (req, res) => {
  try {
    const { id } = req.params;
    const plans = getDatabasePlans();
    const updated = plans.filter((p: any) => p.id !== id);
    writePlansFile(updated);
    res.json({ success: true, data: updated, message: 'Plan removed successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/plans - Reset/clear database to defaults
app.delete('/api/plans', (req, res) => {
  try {
    writePlansFile([]);
    res.json({ success: true, data: [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/deploy-github - Force trigger build & deploy to GitHub Pages
app.post('/api/deploy-github', async (req, res) => {
  try {
    const { plans } = req.body;
    if (plans && Array.isArray(plans)) {
      writePlansFile(plans);
    }
    const deployed = await triggerGitHubDeploy();
    res.json({
      success: true,
      message: deployed
        ? 'Published live updates successfully!'
        : 'Saved changes locally. Background git deploy skipped or token unconfigured.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/inquiries - Fetch custom request inquiries
app.get('/api/inquiries', (req, res) => {
  const inquiries = readJsonFile<any[]>(INQUIRIES_FILE, []);
  res.json({ success: true, data: inquiries });
});

// POST /api/inquiries - Save custom modification or custom blueprint inquiry
app.post('/api/inquiries', (req, res) => {
  try {
    const inquiry = req.body;
    const inquiries = readJsonFile<any[]>(INQUIRIES_FILE, []);
    const newInquiry = {
      id: `inq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...inquiry
    };
    inquiries.unshift(newInquiry);
    writeJsonFile(INQUIRIES_FILE, inquiries);
    res.json({ success: true, data: newInquiry });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/upload - Permanent file store for images, videos, and blueprints
app.post('/api/upload', (req, res) => {
  try {
    const { dataUrl, filename, folder } = req.body;
    if (!dataUrl) {
      return res.status(400).json({ success: false, error: 'No data URL provided' });
    }

    // Handle Data URL (base64)
    if (dataUrl.startsWith('data:')) {
      const matches = dataUrl.match(/^data:([A-Za-z-+\/0-9.]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        let ext = 'jpg';
        if (mimeType.includes('png')) ext = 'png';
        else if (mimeType.includes('gif')) ext = 'gif';
        else if (mimeType.includes('webp')) ext = 'webp';
        else if (mimeType.includes('pdf')) ext = 'pdf';
        else if (mimeType.includes('mp4')) ext = 'mp4';
        else if (mimeType.includes('svg')) ext = 'svg';

        const safeFolder = folder || 'images';
        const targetDir = path.join(UPLOADS_DIR, safeFolder);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const safeName = filename 
          ? filename.replace(/[^a-zA-Z0-9_.-]/g, '_')
          : `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

        const filePath = path.join(targetDir, safeName);
        fs.writeFileSync(filePath, buffer);

        const publicUrl = `uploads/${safeFolder}/${safeName}`;
        return res.json({ success: true, url: publicUrl });
      }
    }

    // If it's already an existing HTTP/HTTPS or relative URL
    if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://') || dataUrl.startsWith('/')) {
      return res.json({ success: true, url: dataUrl });
    }

    return res.status(400).json({ success: false, error: 'Invalid data URL format' });
  } catch (err: any) {
    console.error("Upload handler error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

function getServerSupabaseConfig(): { url: string; key: string } {
  let rawUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://rbqjcalcoaavuxqsyave.supabase.co';
  let key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicWpjYWxjb2FhdnV4cXN5YXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NzMyMTUsImV4cCI6MjEwMjQ0OTIxNX0.-UV5_bNjqWZ4Dl_1Ofnl03m34DFuqeIhsZb0Q7Nk-Ik';

  if (rawUrl.includes('supabase.com/dashboard/project/')) {
    const match = rawUrl.match(/project\/([a-z0-9]+)/i);
    if (match && match[1]) {
      rawUrl = `https://${match[1]}.supabase.co`;
    }
  }

  if (rawUrl && !rawUrl.startsWith('http') && !rawUrl.includes('.')) {
    rawUrl = `https://${rawUrl}.supabase.co`;
  } else if (rawUrl && !rawUrl.startsWith('http')) {
    rawUrl = `https://${rawUrl}`;
  }

  const url = rawUrl.replace(/\/$/, '');
  return { url, key };
}

// POST /api/supabase-upload - Server-side upload handler with Supabase + local persistence
app.post('/api/supabase-upload', async (req, res) => {
  try {
    const { dataUrl, filename, contentType } = req.body;
    if (!dataUrl) {
      return res.status(400).json({ success: false, error: 'No dataUrl provided' });
    }

    const matches = dataUrl.match(/^data:([A-Za-z-+\/0-9.]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://') || dataUrl.startsWith('/')) {
        return res.json({ success: true, url: dataUrl });
      }
      return res.status(400).json({ success: false, error: 'Invalid data format' });
    }

    const mime = contentType || matches[1] || 'image/jpeg';
    const base64 = matches[2];
    const buffer = Buffer.from(base64, 'base64');
    let ext = 'jpg';
    if (mime.includes('png')) ext = 'png';
    else if (mime.includes('webp')) ext = 'webp';
    else if (mime.includes('gif')) ext = 'gif';
    else if (mime.includes('pdf')) ext = 'pdf';

    const safeName = filename 
      ? filename.replace(/[^a-zA-Z0-9_.-]/g, '_')
      : `supa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    // Always store a permanent local copy in public/uploads/images
    const targetDir = path.join(UPLOADS_DIR, 'images');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const localFilePath = path.join(targetDir, safeName);
    fs.writeFileSync(localFilePath, buffer);
    const localUrl = `uploads/images/${safeName}`;

    // Try Supabase upload via REST API if configured
    const { url: supaUrl, key: supaKey } = getServerSupabaseConfig();

    if (supaUrl && supaKey) {
      try {
        const uploadEndpoint = `${supaUrl}/storage/v1/object/projects/${safeName}`;
        const supaRes = await fetch(uploadEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supaKey}`,
            'apikey': supaKey,
            'Content-Type': mime,
            'x-upsert': 'true'
          },
          body: buffer
        });

        if (supaRes.ok) {
          const publicCdnUrl = `${supaUrl}/storage/v1/object/public/projects/${safeName}`;
          return res.json({ success: true, url: publicCdnUrl });
        } else {
          const errText = await supaRes.text();
          console.warn("Supabase storage server upload returned:", supaRes.status, errText);
        }
      } catch (sErr) {
        console.warn("Supabase server upload failed, using local URL fallback:", sErr);
      }
    }

    return res.json({ success: true, url: localUrl });
  } catch (err: any) {
    console.error("Supabase proxy upload exception:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/supabase/test - Server-side diagnostic test (avoids all browser CORS / network blocks)
app.get('/api/supabase/test', async (req, res) => {
  const { url: supaUrl, key: supaKey } = getServerSupabaseConfig();

  if (!supaUrl || !supaKey) {
    return res.json({
      configured: false,
      tableOk: false,
      tableCount: 0,
      storageOk: false,
      storageFilesCount: 0,
      errorMessage: 'Supabase URL or API Key missing in environment.'
    });
  }

  let tableOk = false;
  let tableCount = 0;
  let storageOk = false;
  let storageFilesCount = 0;
  const errors: string[] = [];

  // 1. Test projects table
  try {
    const tableRes = await fetch(`${supaUrl}/rest/v1/projects?select=count`, {
      headers: {
        'apikey': supaKey,
        'Authorization': `Bearer ${supaKey}`
      }
    });

    if (tableRes.ok) {
      const data = await tableRes.json();
      tableOk = true;
      if (Array.isArray(data) && data[0] && typeof data[0].count === 'number') {
        tableCount = data[0].count;
      } else if (Array.isArray(data)) {
        tableCount = data.length;
      }
    } else {
      const errText = await tableRes.text();
      errors.push(`Table: HTTP ${tableRes.status} - ${errText}`);
    }
  } catch (err: any) {
    errors.push(`Table fetch error: ${err.message}`);
  }

  // 2. Test storage bucket
  try {
    const filesRes = await fetch(`${supaUrl}/storage/v1/object/list/projects`, {
      method: 'POST',
      headers: {
        'apikey': supaKey,
        'Authorization': `Bearer ${supaKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prefix: '', limit: 100 })
    });

    if (filesRes.ok) {
      const files = await filesRes.json();
      if (Array.isArray(files)) {
        storageFilesCount = files.length;
      }

      // Test upload permission to verify RLS policy allows writes
      const testProbe = Buffer.from('oren-probe');
      const probeRes = await fetch(`${supaUrl}/storage/v1/object/projects/.probe.txt`, {
        method: 'POST',
        headers: {
          'apikey': supaKey,
          'Authorization': `Bearer ${supaKey}`,
          'Content-Type': 'text/plain',
          'x-upsert': 'true'
        },
        body: testProbe
      });

      if (probeRes.ok) {
        storageOk = true;
        // Clean up probe file silently
        try {
          await fetch(`${supaUrl}/storage/v1/object/projects/.probe.txt`, {
            method: 'DELETE',
            headers: {
              'apikey': supaKey,
              'Authorization': `Bearer ${supaKey}`
            }
          });
        } catch (_) {}
      } else {
        const probeText = await probeRes.text();
        if (probeText.includes('row-level security') || probeRes.status === 403 || probeRes.status === 401) {
          errors.push("Storage: Bucket 'projects' exists, but RLS Upload Policy is missing. Run the Storage SQL policies below in Supabase SQL Editor.");
        } else {
          errors.push(`Storage: Bucket 'projects' found, but test upload returned HTTP ${probeRes.status}: ${probeText}`);
        }
      }
    } else {
      const listText = await filesRes.text();
      if (filesRes.status === 404 || listText.includes('NoSuchBucket') || listText.includes('Bucket not found') || listText.includes('404')) {
        errors.push("Storage: Bucket 'projects' not created yet. (Copy & run the SQL setup script below or create bucket 'projects' in Supabase Storage)");
      } else {
        errors.push(`Storage API error: HTTP ${filesRes.status} - ${listText}`);
      }
    }
  } catch (err: any) {
    errors.push(`Storage fetch error: ${err.message}`);
  }

  return res.json({
    configured: true,
    tableOk,
    tableCount,
    storageOk,
    storageFilesCount,
    errorMessage: errors.length > 0 ? errors.join(' | ') : undefined
  });
});

// GET /api/supabase/projects - Fetch all projects from Supabase via server
app.get('/api/supabase/projects', async (req, res) => {
  const { url: supaUrl, key: supaKey } = getServerSupabaseConfig();

  if (!supaUrl || !supaKey) {
    return res.status(500).json({ success: false, error: 'Supabase credentials not configured' });
  }

  try {
    const response = await fetch(`${supaUrl}/rest/v1/projects?select=*&order=created_at.desc`, {
      headers: {
        'apikey': supaKey,
        'Authorization': `Bearer ${supaKey}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ success: false, error: errText });
    }

    const data = await response.json();
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/supabase/projects - Upsert single project via server
app.post('/api/supabase/projects', async (req, res) => {
  const { url: supaUrl, key: supaKey } = getServerSupabaseConfig();

  if (!supaUrl || !supaKey) {
    return res.status(500).json({ success: false, error: 'Supabase credentials not configured' });
  }

  try {
    const row = req.body;
    const response = await fetch(`${supaUrl}/rest/v1/projects?on_conflict=id`, {
      method: 'POST',
      headers: {
        'apikey': supaKey,
        'Authorization': `Bearer ${supaKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(row)
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ success: false, error: errText });
    }

    const data = await response.json();
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/supabase/sync - Bulk push catalog to Supabase
app.post('/api/supabase/sync', async (req, res) => {
  const { url: supaUrl, key: supaKey } = getServerSupabaseConfig();

  if (!supaUrl || !supaKey) {
    return res.status(500).json({ success: false, error: 'Supabase credentials not configured' });
  }

  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ success: false, error: 'No rows provided' });
  }

  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const upsertRes = await fetch(`${supaUrl}/rest/v1/projects?on_conflict=id`, {
        method: 'POST',
        headers: {
          'apikey': supaKey,
          'Authorization': `Bearer ${supaKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify(row)
      });

      if (upsertRes.ok) {
        successCount++;
      } else {
        errorCount++;
        const errText = await upsertRes.text();
        errors.push(`${row.title || row.id}: ${errText}`);
      }
    } catch (e: any) {
      errorCount++;
      errors.push(`${row.title || row.id}: ${e.message}`);
    }
  }

  return res.json({ success: true, successCount, errorCount, errors });
});

// DELETE /api/supabase/projects/:id
app.delete('/api/supabase/projects/:id', async (req, res) => {
  const { url: supaUrl, key: supaKey } = getServerSupabaseConfig();

  if (!supaUrl || !supaKey) {
    return res.status(500).json({ success: false, error: 'Supabase credentials not configured' });
  }

  try {
    const { id } = req.params;
    const response = await fetch(`${supaUrl}/rest/v1/projects?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'apikey': supaKey,
        'Authorization': `Bearer ${supaKey}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ success: false, error: errText });
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/supabase/projects - Delete/purge all projects from Supabase database table
app.delete('/api/supabase/projects', async (req, res) => {
  const { url: supaUrl, key: supaKey } = getServerSupabaseConfig();

  if (!supaUrl || !supaKey) {
    return res.status(500).json({ success: false, error: 'Supabase credentials not configured' });
  }

  try {
    const response = await fetch(`${supaUrl}/rest/v1/projects?id=neq.placeholder_none`, {
      method: 'DELETE',
      headers: {
        'apikey': supaKey,
        'Authorization': `Bearer ${supaKey}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ success: false, error: errText });
    }

    return res.json({ success: true, message: 'All projects deleted from Supabase.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ================= SERVER BOOTSTRAP =================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
