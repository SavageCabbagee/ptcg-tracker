import { parseCollectionManifest, serializeSplitCollection } from './collectionIO';
import type { CollectionFile, GitHubStorageConfig, GitHubStorageSession } from './types';

const apiVersion = '2022-11-28';

type GitHubRefResponse = {
  object: {
    sha: string;
  };
};

type GitHubCommitResponse = {
  sha: string;
  tree: {
    sha: string;
  };
};

type GitHubContentResponse = {
  content: string;
  encoding: string;
  type: string;
};

type GitHubTreeResponse = {
  sha: string;
};

type GitHubCreateCommitResponse = {
  sha: string;
  tree: {
    sha: string;
  };
};

export async function loadGitHubCollection(
  config: GitHubStorageConfig,
  token: string,
): Promise<{ collection: CollectionFile; session: GitHubStorageSession }> {
  const branch = await getBranchHead(config, token);
  const manifest = await readJsonFile(config, token, 'collection.json');
  const collection = await parseCollectionManifest(manifest, (path) => readJsonFile(config, token, path));

  return {
    collection,
    session: {
      commitSha: branch.commitSha,
      treeSha: branch.treeSha,
    },
  };
}

export async function saveGitHubCollection(
  config: GitHubStorageConfig,
  token: string,
  collection: CollectionFile,
  baseline: GitHubStorageSession | null,
): Promise<GitHubStorageSession> {
  const branch = await getBranchHead(config, token);

  if (baseline && branch.commitSha !== baseline.commitSha) {
    throw new Error('Remote data changed since the last load or save. Load from GitHub before saving again.');
  }

  const serialized = serializeSplitCollection(collection, config.dataRoot);
  const tree = await request<GitHubTreeResponse>(config, token, 'POST', 'git/trees', {
    base_tree: branch.treeSha,
    tree: serialized.files.map((file) => ({
      path: file.path,
      mode: '100644',
      type: 'blob',
      content: file.content,
    })),
  });
  const commit = await request<GitHubCreateCommitResponse>(config, token, 'POST', 'git/commits', {
    message: 'Update collection data',
    tree: tree.sha,
    parents: [branch.commitSha],
  });

  await request(config, token, 'PATCH', `git/refs/heads/${encodePath(config.branch)}`, {
    sha: commit.sha,
    force: false,
  });

  return {
    commitSha: commit.sha,
    treeSha: commit.tree.sha,
  };
}

export function normalizeGitHubConfig(config: GitHubStorageConfig): GitHubStorageConfig {
  return {
    owner: config.owner.trim(),
    repo: config.repo.trim().replace(/\.git$/i, ''),
    branch: config.branch.trim() || 'main',
    dataRoot: config.dataRoot.trim().replace(/^\/+|\/+$/g, ''),
  };
}

export function isGitHubConfigComplete(config: GitHubStorageConfig, token: string) {
  const normalized = normalizeGitHubConfig(config);

  return Boolean(normalized.owner && normalized.repo && normalized.branch && token.trim());
}

function readJsonFile(config: GitHubStorageConfig, token: string, path: string) {
  return readTextFile(config, token, path).then((content) => {
    try {
      return JSON.parse(content) as unknown;
    } catch {
      throw new Error(`${path} is not valid JSON.`);
    }
  });
}

async function readTextFile(config: GitHubStorageConfig, token: string, path: string) {
  const file = await request<GitHubContentResponse>(
    config,
    token,
    'GET',
    `contents/${encodePath(joinPath(config.dataRoot, path))}?ref=${encodeURIComponent(config.branch)}`,
  );

  if (file.type !== 'file' || file.encoding !== 'base64') {
    throw new Error(`${path} is not a readable file.`);
  }

  return decodeBase64(file.content);
}

async function getBranchHead(config: GitHubStorageConfig, token: string) {
  const ref = await request<GitHubRefResponse>(config, token, 'GET', `git/ref/heads/${encodePath(config.branch)}`);
  const commit = await request<GitHubCommitResponse>(config, token, 'GET', `git/commits/${ref.object.sha}`);

  return {
    commitSha: commit.sha,
    treeSha: commit.tree.sha,
  };
}

async function request<T>(
  config: GitHubStorageConfig,
  token: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const normalized = normalizeGitHubConfig(config);
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(normalized.owner)}/${encodeURIComponent(normalized.repo)}/${path}`,
    {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': apiVersion,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
  );

  if (!response.ok) {
    throw new Error(await errorMessage(response));
  }

  return response.json() as Promise<T>;
}

async function errorMessage(response: Response) {
  let message = '';

  try {
    const input = (await response.json()) as { message?: string };
    message = input.message || '';
  } catch {
    message = '';
  }

  if (response.status === 401 || response.status === 403) {
    return message || 'GitHub rejected the token or repository permissions.';
  }

  if (response.status === 404) {
    return message || 'GitHub repository, branch, or data path was not found.';
  }

  if (response.status === 409) {
    return message || 'GitHub could not update the branch because the remote changed.';
  }

  return message || `GitHub request failed (${response.status}).`;
}

function joinPath(...parts: string[]) {
  return parts
    .map((part) => part.trim().replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
}

function encodePath(path: string) {
  return path.split('/').map(encodeURIComponent).join('/');
}

function decodeBase64(input: string) {
  const binary = atob(input.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}
