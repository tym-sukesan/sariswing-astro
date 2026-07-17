export type GitHubConfig = {
  token: string;
  repo: string;
  workflowFile: string;
  ref: string;
};

export type WorkflowRun = {
  id: number;
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  html_url?: string;
};

export type DeployRunStatus = "running" | "success" | "failure";

export type GitHubContentsFile = {
  path: string;
  sha: string;
  contentText: string;
  encoding: string;
  htmlUrl?: string;
};

export type GitHubContentsUpdateResult = {
  contentSha: string;
  commitSha: string;
  commitHtmlUrl: string | null;
  contentHtmlUrl: string | null;
};

export function getGitHubConfig(): GitHubConfig | null {
  const token = Deno.env.get("GITHUB_TOKEN");
  const repo = Deno.env.get("GITHUB_REPO");
  if (!token || !repo) return null;

  return {
    token,
    repo,
    workflowFile: Deno.env.get("GITHUB_WORKFLOW_FILE") ?? "deploy.yml",
    ref: Deno.env.get("GITHUB_REF") ?? "main",
  };
}

/** Token + repo only (Contents API path — no workflow file required). */
export function getGitHubContentsAuth(): { token: string; repo: string; ref: string } | null {
  const token = Deno.env.get("GITHUB_TOKEN");
  const repo = Deno.env.get("GITHUB_REPO");
  if (!token || !repo) return null;
  return {
    token,
    repo,
    ref: Deno.env.get("GITHUB_REF") ?? "main",
  };
}

export function parseRepo(repo: string): [string, string] | null {
  const parts = repo.split("/").filter(Boolean);
  if (parts.length !== 2) return null;
  return [parts[0], parts[1]];
}

export function githubHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export function normalizeRunStatus(run: Pick<WorkflowRun, "status" | "conclusion">): DeployRunStatus {
  if (run.status === "completed") {
    return run.conclusion === "success" ? "success" : "failure";
  }

  return "running";
}

function decodeBase64Utf8(b64: string): string {
  const normalized = b64.replace(/\n/g, "");
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeUtf8Base64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/**
 * GET a single file via GitHub Contents API.
 * Does not create commits. Does not dispatch workflows.
 */
export async function getGithubContentsFile(input: {
  path: string;
  ref?: string;
  fetchImpl?: typeof fetch;
  auth?: { token: string; repo: string; ref: string } | null;
}): Promise<
  | { ok: true; file: GitHubContentsFile }
  | { ok: false; error: string; httpStatus: number; indeterminate?: boolean }
> {
  const auth = input.auth === undefined ? getGitHubContentsAuth() : input.auth;
  if (!auth) {
    return { ok: false, error: "GITHUB_TOKEN / GITHUB_REPO not configured", httpStatus: 502 };
  }
  const parsed = parseRepo(auth.repo);
  if (!parsed) {
    return { ok: false, error: "GITHUB_REPO must be owner/name", httpStatus: 502 };
  }
  const [owner, repo] = parsed;
  const ref = input.ref ?? auth.ref;
  const fetchImpl = input.fetchImpl ?? fetch;
  const url =
    `https://api.github.com/repos/${owner}/${repo}/contents/${input.path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(ref)}`;

  let response: Response;
  try {
    response = await fetchImpl(url, { headers: githubHeaders(auth.token) });
  } catch {
    return { ok: false, error: "GitHub Contents GET network failure", httpStatus: 502, indeterminate: false };
  }

  if (response.status === 404) {
    return { ok: false, error: "GitHub Contents file not found", httpStatus: 502 };
  }
  if (!response.ok) {
    return {
      ok: false,
      error: `GitHub Contents GET failed (${response.status})`,
      httpStatus: 502,
    };
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "GitHub Contents GET non-JSON response", httpStatus: 502 };
  }

  if (Array.isArray(payload)) {
    return { ok: false, error: "GitHub Contents path resolved to a directory", httpStatus: 502 };
  }

  const sha = String(payload.sha ?? "").trim();
  const encoding = String(payload.encoding ?? "").trim();
  const content = typeof payload.content === "string" ? payload.content : "";
  if (!sha || encoding !== "base64" || !content) {
    return { ok: false, error: "GitHub Contents GET missing sha/content", httpStatus: 502 };
  }

  return {
    ok: true,
    file: {
      path: String(payload.path ?? input.path),
      sha,
      contentText: decodeBase64Utf8(content),
      encoding,
      htmlUrl: typeof payload.html_url === "string" ? payload.html_url : undefined,
    },
  };
}

/**
 * PUT update file via GitHub Contents API (requires current SHA).
 * 409 from GitHub → conflict. Missing commit sha → indeterminate.
 */
export async function updateGithubContentsFile(input: {
  path: string;
  contentText: string;
  message: string;
  sha: string;
  branch?: string;
  fetchImpl?: typeof fetch;
  auth?: { token: string; repo: string; ref: string } | null;
}): Promise<
  | { ok: true; result: GitHubContentsUpdateResult }
  | {
      ok: false;
      error: string;
      httpStatus: number;
      conflict?: boolean;
      indeterminate?: boolean;
    }
> {
  const auth = input.auth === undefined ? getGitHubContentsAuth() : input.auth;
  if (!auth) {
    return { ok: false, error: "GITHUB_TOKEN / GITHUB_REPO not configured", httpStatus: 502 };
  }
  const parsed = parseRepo(auth.repo);
  if (!parsed) {
    return { ok: false, error: "GITHUB_REPO must be owner/name", httpStatus: 502 };
  }
  const [owner, repo] = parsed;
  const branch = input.branch ?? auth.ref;
  const fetchImpl = input.fetchImpl ?? fetch;
  const url =
    `https://api.github.com/repos/${owner}/${repo}/contents/${input.path.split("/").map(encodeURIComponent).join("/")}`;

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "PUT",
      headers: {
        ...githubHeaders(auth.token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: input.message,
        content: encodeUtf8Base64(input.contentText),
        sha: input.sha,
        branch,
      }),
    });
  } catch {
    return {
      ok: false,
      error: "GitHub Contents PUT network failure — verification_required",
      httpStatus: 502,
      indeterminate: true,
    };
  }

  if (response.status === 409) {
    return {
      ok: false,
      error: "GitHub Contents SHA conflict",
      httpStatus: 409,
      conflict: true,
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: `GitHub Contents PUT failed (${response.status})`,
      httpStatus: 502,
      indeterminate: response.status >= 500 || response.status === 0,
    };
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    return {
      ok: false,
      error: "GitHub Contents PUT non-JSON — verification_required",
      httpStatus: 502,
      indeterminate: true,
    };
  }

  const content = (payload.content && typeof payload.content === "object"
    ? payload.content
    : {}) as Record<string, unknown>;
  const commit = (payload.commit && typeof payload.commit === "object"
    ? payload.commit
    : {}) as Record<string, unknown>;
  const contentSha = String(content.sha ?? "").trim();
  const commitSha = String(commit.sha ?? "").trim();
  if (!contentSha || !commitSha) {
    return {
      ok: false,
      error: "GitHub Contents PUT missing commit/content sha — verification_required",
      httpStatus: 502,
      indeterminate: true,
    };
  }

  return {
    ok: true,
    result: {
      contentSha,
      commitSha,
      commitHtmlUrl: typeof commit.html_url === "string" ? commit.html_url : null,
      contentHtmlUrl: typeof content.html_url === "string" ? content.html_url : null,
    },
  };
}

export async function fetchWorkflowRun(
  config: GitHubConfig,
  owner: string,
  repo: string,
  runId: number
): Promise<WorkflowRun | null> {
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`;
  const response = await fetch(url, { headers: githubHeaders(config.token) });

  if (!response.ok) return null;

  return (await response.json()) as WorkflowRun;
}

export async function fetchLatestWorkflowRun(
  config: GitHubConfig,
  owner: string,
  repo: string
): Promise<WorkflowRun | null> {
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(config.workflowFile)}/runs?per_page=1`;
  const response = await fetch(url, { headers: githubHeaders(config.token) });

  if (!response.ok) return null;

  const payload = (await response.json()) as { workflow_runs?: WorkflowRun[] };
  return payload.workflow_runs?.[0] ?? null;
}

export async function waitForLatestWorkflowRun(
  config: GitHubConfig,
  owner: string,
  repo: string,
  dispatchedAfterMs: number,
  maxAttempts = 8,
  delayMs = 1500
): Promise<WorkflowRun | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    const run = await fetchLatestWorkflowRun(config, owner, repo);
    if (run && new Date(run.created_at).getTime() >= dispatchedAfterMs - 5000) {
      return run;
    }
  }

  return fetchLatestWorkflowRun(config, owner, repo);
}
