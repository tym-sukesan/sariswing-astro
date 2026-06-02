import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireAdminUser, corsHeaders, jsonResponse } from "../_shared/admin-auth.ts";
import {
  fetchLatestWorkflowRun,
  fetchWorkflowRun,
  getGitHubConfig,
  normalizeRunStatus,
  parseRepo,
} from "../_shared/github.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const adminResult = await requireAdminUser(req);
  if (adminResult instanceof Response) return adminResult;

  const config = getGitHubConfig();
  if (!config) {
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  const parsed = parseRepo(config.repo);
  if (!parsed) {
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  const [owner, repo] = parsed;

  let runId: number | null = null;
  try {
    const body = await req.json();
    if (body && typeof body.runId === "number") {
      runId = body.runId;
    }
  } catch {
    // empty body is allowed
  }

  const run =
    runId !== null
      ? await fetchWorkflowRun(config, owner, repo, runId)
      : await fetchLatestWorkflowRun(config, owner, repo);

  if (!run) {
    return jsonResponse({ error: "Run not found" }, 404);
  }

  const status = normalizeRunStatus(run);

  return jsonResponse(
    {
      ok: true,
      runId: run.id,
      status,
      runCreatedAt: run.created_at,
      runUpdatedAt: run.updated_at,
      completedAt: status !== "running" ? run.updated_at : null,
    },
    200
  );
});
