import express from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';

import { FAQ_ITEMS, TESTIMONIALS, ARCHITECTURAL_PLANS } from './src/data';

const app = express();
const PORT = 3000;

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
    const token = process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN || '';
    if (!token) {
      console.warn("GITHUB_TOKEN environment variable not configured. Skipping background git push.");
      return resolve(false);
    }
    const remoteUrl = `https://poloztech123:${token}@github.com/poloztech123/orendesign.git`;

    const cmd = `VITE_GITHUB_TOKEN="" npx vite build --outDir docs && touch docs/.nojekyll && git add . && (git commit -m "Auto-sync Admin catalog changes to GitHub Pages" || true) && git push -u ${remoteUrl} main --force && git subtree push --prefix docs ${remoteUrl} gh-pages`;

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

// Read stored database plans
function getDatabasePlans() {
  const stored = readJsonFile<any[]>(PLANS_FILE, []);
  return stored || [];
}

// ================= API ENDPOINTS =================

// GET /api/plans - Fetch all architectural plans
app.get('/api/plans', (req, res) => {
  const plans = getDatabasePlans();
  res.json({ success: true, data: plans });
});

// POST /api/plans - Create a new plan
app.post('/api/plans', (req, res) => {
  try {
    const newPlan = req.body;
    if (!newPlan || !newPlan.id) {
      return res.status(400).json({ success: false, error: 'Invalid plan schema' });
    }
    const plans = getDatabasePlans();
    const filtered = plans.filter((p: any) => p.id !== newPlan.id);
    const updated = [newPlan, ...filtered];
    writePlansFile(updated);
    res.json({ success: true, data: newPlan });
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
    res.json({ success: true, data: updatedPlan });
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
    res.json({ success: true, message: 'Plan removed successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/plans - Reset/clear database to defaults
app.delete('/api/plans', (req, res) => {
  try {
    writePlansFile(ARCHITECTURAL_PLANS || []);
    res.json({ success: true, data: ARCHITECTURAL_PLANS });
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
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
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

        const publicUrl = `/uploads/${safeFolder}/${safeName}`;
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
