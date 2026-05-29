import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  fetchLatestWorkflowRun,
  fetchWorkflowRun,
  getGitHubConfig,
  normalizeRunStatus,
  parseRepo,
} from "../_shared/github.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-deploy-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function checkDeploySecret(req: Request): boolean {
  const deploySecret = Deno.env.get("DEPLOY_SHARED_SECRET");
  const clientSecret = req.headers.get("x-deploy-secret");
  return Boolean(deploySecret && clientSecret && clientSecret === deploySecret);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!checkDeploySecret(req)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

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
