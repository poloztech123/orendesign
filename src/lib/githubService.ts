import { ArchitecturalPlan } from '../types';

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  path: string;
  branch: string;
}

const STORAGE_KEYS = {
  TOKEN: 'oren_gh_token',
  OWNER: 'oren_gh_owner',
  REPO: 'oren_gh_repo',
  PATH: 'oren_gh_path',
  BRANCH: 'oren_gh_branch',
};

const DEFAULT_CONFIG: GitHubConfig = {
  token: '',
  owner: 'poloztech123',
  repo: 'orendesign',
  path: 'data/plans.json',
  branch: 'main',
};

/**
 * Retrieve GitHub configuration from localStorage
 */
export function getGitHubConfig(): GitHubConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_CONFIG };

  return {
    token: localStorage.getItem(STORAGE_KEYS.TOKEN) || localStorage.getItem('oren_github_token') || DEFAULT_CONFIG.token,
    owner: localStorage.getItem(STORAGE_KEYS.OWNER) || localStorage.getItem('oren_github_owner') || DEFAULT_CONFIG.owner,
    repo: localStorage.getItem(STORAGE_KEYS.REPO) || localStorage.getItem('oren_github_repo') || DEFAULT_CONFIG.repo,
    path: localStorage.getItem(STORAGE_KEYS.PATH) || localStorage.getItem('oren_github_path') || DEFAULT_CONFIG.path,
    branch: localStorage.getItem(STORAGE_KEYS.BRANCH) || DEFAULT_CONFIG.branch,
  };
}

/**
 * Save GitHub configuration to localStorage
 */
export function saveGitHubConfig(config: Partial<GitHubConfig>): void {
  if (typeof window === 'undefined') return;

  if (config.token !== undefined) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, config.token.trim());
  }
  if (config.owner !== undefined) {
    localStorage.setItem(STORAGE_KEYS.OWNER, config.owner.trim());
  }
  if (config.repo !== undefined) {
    localStorage.setItem(STORAGE_KEYS.REPO, config.repo.trim());
  }
  if (config.path !== undefined) {
    localStorage.setItem(STORAGE_KEYS.PATH, config.path.trim());
  }
  if (config.branch !== undefined) {
    localStorage.setItem(STORAGE_KEYS.BRANCH, config.branch.trim());
  }
}

/**
 * Safe UTF-8 to Base64 encoder for browser environments
 */
function utf8ToBase64(str: string): string {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
  } catch (e) {
    return btoa(unescape(encodeURIComponent(str)));
  }
}

/**
 * Safe Base64 to UTF-8 decoder for browser environments
 */
function base64ToUtf8(str: string): string {
  try {
    return decodeURIComponent(Array.prototype.map.call(atob(str.replace(/\s/g, '')), (c: string) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  } catch (e) {
    return atob(str.replace(/\s/g, ''));
  }
}

/**
 * Test connection and permissions for the configured GitHub repository
 */
export async function testGitHubConnection(configOverrides?: Partial<GitHubConfig>): Promise<{
  success: boolean;
  message: string;
  repoFullName?: string;
  defaultBranch?: string;
  hasWritePermission?: boolean;
  fileExists?: boolean;
  filePlanCount?: number;
}> {
  const config = { ...getGitHubConfig(), ...configOverrides };

  if (!config.token) {
    return {
      success: false,
      message: 'GitHub Personal Access Token (PAT) is required.',
    };
  }

  if (!config.owner || !config.repo) {
    return {
      success: false,
      message: 'Repository owner and repository name are required.',
    };
  }

  const cleanOwner = config.owner.trim();
  const cleanRepo = config.repo.trim();
  const cleanPath = config.path.trim();
  const cleanBranch = config.branch.trim() || 'main';

  try {
    // 1. Check repository access & permissions
    const repoRes = await fetch(`https://api.github.com/repos/${cleanOwner}/${cleanRepo}`, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!repoRes.ok) {
      if (repoRes.status === 401) {
        return { success: false, message: 'Invalid or expired Personal Access Token (401 Unauthorized).' };
      }
      if (repoRes.status === 404) {
        return { success: false, message: `Repository "${cleanOwner}/${cleanRepo}" not found (404). Check owner, repo name, and token scopes.` };
      }
      return { success: false, message: `GitHub API error: ${repoRes.status} ${repoRes.statusText}` };
    }

    const repoData = await repoRes.json();
    const hasPush = repoData.permissions?.push !== false;

    // 2. Check if target JSON file exists in the specified branch
    let fileExists = false;
    let filePlanCount = 0;
    try {
      const fileRes = await fetch(`https://api.github.com/repos/${cleanOwner}/${cleanRepo}/contents/${cleanPath}?ref=${cleanBranch}`, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (fileRes.ok) {
        const fileData = await fileRes.json();
        fileExists = true;
        if (fileData.content) {
          const raw = base64ToUtf8(fileData.content);
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            filePlanCount = parsed.length;
          }
        }
      }
    } catch (e) {
      // File might not exist yet; that's acceptable
    }

    return {
      success: true,
      message: `Successfully connected to ${repoData.full_name}! ${hasPush ? 'Write permissions verified.' : 'Warning: Token may lack push permission.'}`,
      repoFullName: repoData.full_name,
      defaultBranch: repoData.default_branch,
      hasWritePermission: hasPush,
      fileExists,
      filePlanCount,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Network connection failed: ${err?.message || String(err)}`,
    };
  }
}

/**
 * Save projects array directly to GitHub repository using REST API PUT /repos/{owner}/{repo}/contents/{path}
 */
export async function saveProjectsToGitHub(
  plans: ArchitecturalPlan[],
  configOverrides?: Partial<GitHubConfig>
): Promise<{ success: boolean; message: string; updatedPaths: string[] }> {
  const config = { ...getGitHubConfig(), ...configOverrides };

  if (!config.token) {
    return {
      success: false,
      message: 'GitHub Personal Access Token (PAT) not configured. Enter it in Admin Settings to persist changes to GitHub.',
      updatedPaths: [],
    };
  }

  const cleanOwner = config.owner.trim();
  const cleanRepo = config.repo.trim();
  const cleanBranch = config.branch.trim() || 'main';
  const primaryPath = config.path.trim() || 'data/plans.json';

  const jsonContent = JSON.stringify(plans, null, 2);
  const base64Content = utf8ToBase64(jsonContent);

  // If primary path is data/plans.json, also update docs/data/plans.json and public/data/plans.json so GitHub Pages updates synchronously
  const pathsToUpdate = [primaryPath];
  if (primaryPath === 'data/plans.json') {
    if (!pathsToUpdate.includes('docs/data/plans.json')) pathsToUpdate.push('docs/data/plans.json');
    if (!pathsToUpdate.includes('public/data/plans.json')) pathsToUpdate.push('public/data/plans.json');
  }

  const updatedPaths: string[] = [];
  let lastError = '';

  for (const path of pathsToUpdate) {
    try {
      // 1. Fetch current file SHA if exists
      let sha: string | undefined = undefined;
      const getRes = await fetch(`https://api.github.com/repos/${cleanOwner}/${cleanRepo}/contents/${path}?ref=${cleanBranch}&t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (getRes.ok) {
        const fileInfo = await getRes.json();
        sha = fileInfo.sha;
      }

      // 2. Commit file update via PUT /repos/{owner}/{repo}/contents/{path}
      const putRes = await fetch(`https://api.github.com/repos/${cleanOwner}/${cleanRepo}/contents/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          message: `Admin update catalog projects: ${path} (${plans.length} items)`,
          content: base64Content,
          sha: sha,
          branch: cleanBranch,
        }),
      });

      if (putRes.ok) {
        updatedPaths.push(path);
      } else {
        const errJson = await putRes.json().catch(() => ({}));
        lastError = errJson.message || `${putRes.status} ${putRes.statusText}`;
      }
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }

  if (updatedPaths.length > 0) {
    return {
      success: true,
      message: `Successfully saved ${plans.length} project${plans.length === 1 ? '' : 's'} to GitHub (${updatedPaths.join(', ')}) on branch ${cleanBranch}.`,
      updatedPaths,
    };
  }

  return {
    success: false,
    message: `Failed to commit to GitHub: ${lastError || 'Unknown error'}. Please verify token scopes (repo / contents:write).`,
    updatedPaths: [],
  };
}

/**
 * Fetch live projects JSON file directly from GitHub CDN or REST API
 */
export async function fetchProjectsFromGitHub(configOverrides?: Partial<GitHubConfig>): Promise<ArchitecturalPlan[] | null> {
  const config = { ...getGitHubConfig(), ...configOverrides };
  const cleanOwner = config.owner.trim() || 'poloztech123';
  const cleanRepo = config.repo.trim() || 'orendesign';
  const cleanBranch = config.branch.trim() || 'main';
  const cleanPath = config.path.trim() || 'data/plans.json';

  // 1. Try GitHub Raw CDN (fast, unauthenticated for public repos)
  try {
    const rawUrl = `https://raw.githubusercontent.com/${cleanOwner}/${cleanRepo}/${cleanBranch}/${cleanPath}?t=${Date.now()}`;
    const rawRes = await fetch(rawUrl);
    if (rawRes.ok) {
      const data = await rawRes.json();
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (e) {
    // Ignore and fallback
  }

  // 2. Try GitHub REST API (works for private repos if token is present)
  if (config.token) {
    try {
      const apiRes = await fetch(`https://api.github.com/repos/${cleanOwner}/${cleanRepo}/contents/${cleanPath}?ref=${cleanBranch}&t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (apiRes.ok) {
        const fileData = await apiRes.json();
        if (fileData.content) {
          const raw = base64ToUtf8(fileData.content);
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      }
    } catch (e) {
      // Ignore and fallback
    }
  }

  // 3. Try relative static file on current domain (e.g. GitHub Pages /orendesignandbuild.com)
  try {
    const localRes = await fetch(`./${cleanPath}?t=${Date.now()}`);
    if (localRes.ok) {
      const localData = await localRes.json();
      if (Array.isArray(localData)) {
        return localData;
      }
    }
  } catch (e) {
    // Ignore
  }

  return null;
}
