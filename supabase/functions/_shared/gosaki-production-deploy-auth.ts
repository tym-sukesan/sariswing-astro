/**
 * Gosaki production Deploy Edge shared auth + GitHub dispatch helpers.
 * Hardcoded workflow/ref. can_write_site after sites.site_slug=gosaki-piano.
 * Owner/editor authz (not Sariswing ADMIN_EMAILS).
 * GitHub workflow file and ref are source constants (not env-default deploy.yml).
 */

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export const SITE_SLUG = "gosaki-piano";
export const STAGING_PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
export const PRODUCTION_REF_STOP = "vsbvndwuajjhnzpohghh";
export const WORKFLOW_FILE = "gosaki-piano-production-public-dist.yml";
export const DISPATCH_REF = "main";
export const DEPLOY_ARMED_ENV = "GOSAKI_PRODUCTION_DEPLOY_ARMED";
export const DEPLOY_NOT_ARMED = "deploy_not_armed";
export const SUPABASE_SERVICE_ROLE_CONNECTED = false;

export const FORBIDDEN_CLIENT_KEYS = [
  "workflow",
  "ref",
  "repo",
  "site",
  "site_slug",
  "workflowFile",
  "workflow_file",
  "githubRepo",
  "github_repo",
  "GITHUB_REPO",
  "GITHUB_WORKFLOW_FILE",
  "GITHUB_REF",
] as const;

export type DeployRunStatus = "running" | "success" | "failure";

export type GosakiDeployHandlerResult = Record<string, unknown> & {
  httpStatus?: number;
  status?: number | string;
};

export type GosakiDeployEnv = {
  supabaseUrl: string;
  anonKey: string;
  githubToken?: string;
  githubRepo?: string;
  githubWorkflowFileEnv?: string;
  githubRefEnv?: string;
  deployArmed?: string;
};

export type WorkflowRun = {
  id: number;
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  html_url?: string;
  path?: string;
  name?: string;
};

export function assertStagingSupabaseUrl(supabaseUrl: string) {
  const url = String(supabaseUrl ?? "");
  if (!url) throw new Error("SUPABASE_URL is required");
  if (url.includes(PRODUCTION_REF_STOP)) {
    throw new Error("production Supabase ref is blocked");
  }
  if (!url.includes(STAGING_PROJECT_REF)) {
    throw new Error("Gosaki production Deploy Edge is kmjq-only");
  }
}

export function extractBearerToken(authorizationHeader: string | null | undefined): string | null {
  const raw = String(authorizationHeader ?? "").trim();
  if (!raw) return null;
  const match = /^Bearer\s+(.+)$/i.exec(raw);
  const token = match?.[1]?.trim() ?? "";
  return token.length > 0 ? token : null;
}

export function createUserJwtSupabaseClient(input: {
  supabaseUrl: string;
  anonKey: string;
  authorizationHeader: string;
}): SupabaseClient {
  const supabaseUrl = String(input.supabaseUrl ?? "").replace(/\/+$/, "");
  const anonKey = String(input.anonKey ?? "");
  const authorizationHeader = String(input.authorizationHeader ?? "").trim();
  assertStagingSupabaseUrl(supabaseUrl);
  if (!anonKey) throw new Error("SUPABASE_ANON_KEY is required");
  if (!authorizationHeader.toLowerCase().startsWith("bearer ")) {
    throw new Error("Authorization Bearer token is required");
  }
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorizationHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function assertCanWriteSiteForSiteSlug(
  client: SupabaseClient,
  siteSlug: string,
): Promise<
  | { ok: true; siteId: string }
  | { ok: false; status: number; errors: string[] }
> {
  const slug = String(siteSlug ?? "").trim();
  if (!slug || slug !== SITE_SLUG) {
    return { ok: false, status: 400, errors: [`siteSlug must be "${SITE_SLUG}"`] };
  }

  const { data: siteRows, error: siteError } = await client
    .from("sites")
    .select("id,site_slug,status")
    .eq("site_slug", slug);

  if (siteError) {
    const msg = String(siteError.message ?? "");
    if (/jwt|token|auth/i.test(msg)) {
      return { ok: false, status: 401, errors: ["Invalid or expired Authorization"] };
    }
    return { ok: false, status: 503, errors: ["sites resolve failed"] };
  }

  const rows = Array.isArray(siteRows) ? siteRows : [];
  if (rows.length === 0) {
    return { ok: false, status: 403, errors: ["can_write_site denied — site not visible"] };
  }
  if (rows.length > 1) {
    return { ok: false, status: 409, errors: ["sites.site_slug must resolve to exactly one row"] };
  }

  const siteRow = rows[0] as { id?: unknown; site_slug?: unknown; status?: unknown };
  const siteId = String(siteRow.id ?? "").trim();
  if (!siteId) {
    return { ok: false, status: 503, errors: ["sites.id missing after resolve"] };
  }
  if (String(siteRow.site_slug ?? "").trim() !== SITE_SLUG) {
    return { ok: false, status: 409, errors: ["sites.site_slug does not match expected gosaki-piano"] };
  }
  if (String(siteRow.status ?? "").trim() !== "active") {
    return { ok: false, status: 403, errors: ["site is not active"] };
  }

  const { data, error } = await client.rpc("can_write_site", { p_site_id: siteId });
  if (error) {
    const msg = String(error.message ?? "");
    if (/jwt|token|auth/i.test(msg)) {
      return { ok: false, status: 401, errors: ["Invalid or expired Authorization"] };
    }
    return { ok: false, status: 403, errors: ["can_write_site probe failed"] };
  }
  if (data !== true) {
    return { ok: false, status: 403, errors: ["can_write_site(site_id) must be true"] };
  }
  return { ok: true, siteId };
}

export function isGosakiProductionDeployArmed(
  getEnv: (key: string) => string | undefined = (key) => Deno.env.get(key),
): boolean {
  return getEnv(DEPLOY_ARMED_ENV) === "true";
}

export function rejectForbiddenClientFields(
  body: unknown,
): { ok: true } | { ok: false; status: number; errors: string[] } {
  if (body == null) return { ok: true };
  if (typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, status: 400, errors: ["JSON object body required"] };
  }
  const record = body as Record<string, unknown>;
  const found = FORBIDDEN_CLIENT_KEYS.filter((key) => Object.prototype.hasOwnProperty.call(record, key));
  if (found.length > 0) {
    return {
      ok: false,
      status: 400,
      errors: ["client must not specify repo, workflow, ref, or site"],
    };
  }
  return { ok: true };
}

export function resolveHardcodedGitHubConfig(env: GosakiDeployEnv):
  | { ok: true; token: string; repo: string; workflowFile: string; ref: string }
  | { ok: false; status: number; error: string } {
  const token = String(env.githubToken ?? "").trim();
  const repo = String(env.githubRepo ?? "").trim();
  if (!token || !repo) {
    return { ok: false, status: 500, error: "Server configuration error" };
  }
  const workflowOverride = String(env.githubWorkflowFileEnv ?? "").trim();
  const refOverride = String(env.githubRefEnv ?? "").trim();
  if (workflowOverride && workflowOverride !== WORKFLOW_FILE) {
    return { ok: false, status: 500, error: "GITHUB_WORKFLOW_FILE must not override hardcoded workflow" };
  }
  if (refOverride && refOverride !== DISPATCH_REF) {
    return { ok: false, status: 500, error: "GITHUB_REF must not override hardcoded ref" };
  }
  return {
    ok: true,
    token,
    repo,
    workflowFile: WORKFLOW_FILE,
    ref: DISPATCH_REF,
  };
}

export function parseRepo(repo: string): [string, string] | null {
  const parts = repo.split("/").filter(Boolean);
  if (parts.length !== 2) return null;
  return [parts[0], parts[1]];
}

export function normalizeRunStatus(run: Pick<WorkflowRun, "status" | "conclusion">): DeployRunStatus {
  if (run.status === "completed") {
    return run.conclusion === "success" ? "success" : "failure";
  }
  return "running";
}

export function runMatchesHardcodedWorkflow(run: Pick<WorkflowRun, "path" | "name">): boolean {
  const path = String(run.path ?? "").trim();
  if (path === WORKFLOW_FILE) return true;
  if (path.endsWith(`/${WORKFLOW_FILE}`)) return true;
  if (path.endsWith(WORKFLOW_FILE)) return true;
  return false;
}

function githubHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function dispatchGosakiWorkflow(
  config: { token: string; repo: string; workflowFile: string; ref: string },
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true } | { ok: false; status: number; detail: string }> {
  const parsed = parseRepo(config.repo);
  if (!parsed) return { ok: false, status: 500, detail: "GITHUB_REPO must be owner/name" };
  const [owner, repo] = parsed;
  const workflowUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(config.workflowFile)}/dispatches`;
  const ghResponse = await fetchImpl(workflowUrl, {
    method: "POST",
    headers: {
      ...githubHeaders(config.token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref: config.ref }),
  });
  if (!ghResponse.ok) {
    const detail = await ghResponse.text();
    return { ok: false, status: ghResponse.status, detail };
  }
  return { ok: true };
}

export async function fetchLatestGosakiWorkflowRun(
  config: { token: string; repo: string; workflowFile: string },
  fetchImpl: typeof fetch = fetch,
): Promise<WorkflowRun | null> {
  const parsed = parseRepo(config.repo);
  if (!parsed) return null;
  const [owner, repo] = parsed;
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(config.workflowFile)}/runs?per_page=1`;
  const response = await fetchImpl(url, { headers: githubHeaders(config.token) });
  if (!response.ok) return null;
  const payload = (await response.json()) as { workflow_runs?: WorkflowRun[] };
  return payload.workflow_runs?.[0] ?? null;
}

export async function fetchGosakiWorkflowRunById(
  config: { token: string; repo: string },
  runId: number,
  fetchImpl: typeof fetch = fetch,
): Promise<WorkflowRun | null> {
  const parsed = parseRepo(config.repo);
  if (!parsed) return null;
  const [owner, repo] = parsed;
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`;
  const response = await fetchImpl(url, { headers: githubHeaders(config.token) });
  if (!response.ok) return null;
  return (await response.json()) as WorkflowRun;
}

export async function waitForLatestGosakiWorkflowRun(
  config: { token: string; repo: string; workflowFile: string },
  dispatchedAfterMs: number,
  fetchImpl: typeof fetch = fetch,
  maxAttempts = 8,
  delayMs = 1500,
): Promise<WorkflowRun | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    const run = await fetchLatestGosakiWorkflowRun(config, fetchImpl);
    if (run && new Date(run.created_at).getTime() >= dispatchedAfterMs - 5000) {
      return run;
    }
  }
  return fetchLatestGosakiWorkflowRun(config, fetchImpl);
}

export async function authorizeGosakiProductionDeploy(
  req: { authorizationHeader?: string | null },
  env: GosakiDeployEnv,
): Promise<
  | { ok: true; siteId: string }
  | { ok: false; result: GosakiDeployHandlerResult }
> {
  try {
    assertStagingSupabaseUrl(env.supabaseUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unsafe supabase url";
    return {
      ok: false,
      result: {
        ok: false,
        httpStatus: 403,
        errors: [message],
        vsbvndStop: String(env.supabaseUrl ?? "").includes(PRODUCTION_REF_STOP),
      },
    };
  }

  if (!extractBearerToken(req.authorizationHeader)) {
    return {
      ok: false,
      result: { ok: false, httpStatus: 401, errors: ["Authorization Bearer token is required"] },
    };
  }

  let client: SupabaseClient;
  try {
    client = createUserJwtSupabaseClient({
      supabaseUrl: env.supabaseUrl,
      anonKey: env.anonKey,
      authorizationHeader: String(req.authorizationHeader ?? ""),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "auth client failed";
    const httpStatus = /Bearer token is required|SUPABASE_ANON_KEY/i.test(message) ? 401 : 403;
    return { ok: false, result: { ok: false, httpStatus, errors: [message] } };
  }

  const write = await assertCanWriteSiteForSiteSlug(client, SITE_SLUG);
  if (!write.ok) {
    return {
      ok: false,
      result: { ok: false, httpStatus: write.status, errors: write.errors },
    };
  }
  return { ok: true, siteId: write.siteId };
}
