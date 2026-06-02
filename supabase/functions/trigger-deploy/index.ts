import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireAdminUser, corsHeaders, jsonResponse } from "../_shared/admin-auth.ts";
import {
  getGitHubConfig,
  normalizeRunStatus,
  parseRepo,
  waitForLatestWorkflowRun,
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
  const startedAt = new Date().toISOString();
  const dispatchedAfterMs = Date.now();

  const workflowUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(config.workflowFile)}/dispatches`;

  const ghResponse = await fetch(workflowUrl, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref: config.ref }),
  });

  if (!ghResponse.ok) {
    const detail = await ghResponse.text();
    return jsonResponse(
      {
        error: "Deploy start failed",
        status: ghResponse.status,
        detail,
      },
      502
    );
  }

  const run = await waitForLatestWorkflowRun(config, owner, repo, dispatchedAfterMs);

  return jsonResponse(
    {
      ok: true,
      startedAt,
      runId: run?.id ?? null,
      status: run ? normalizeRunStatus(run) : "running",
      runCreatedAt: run?.created_at ?? startedAt,
      runUpdatedAt: run?.updated_at ?? startedAt,
    },
    200
  );
});
