import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const deploySecret = Deno.env.get("DEPLOY_SHARED_SECRET");
  const githubToken = Deno.env.get("GITHUB_TOKEN");
  const githubRepo = Deno.env.get("GITHUB_REPO");
  const githubWorkflowFile = Deno.env.get("GITHUB_WORKFLOW_FILE") ?? "deploy.yml";
  const githubRef = Deno.env.get("GITHUB_REF") ?? "main";

  const clientSecret = req.headers.get("x-deploy-secret");
  if (!deploySecret || !clientSecret || clientSecret !== deploySecret) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  if (!githubToken || !githubRepo) {
    return jsonResponse({ error: "Server configuration error: missing GitHub secrets" }, 500);
  }

  const repoParts = githubRepo.split("/").filter(Boolean);
  if (repoParts.length !== 2) {
    return jsonResponse(
      { error: "Server configuration error: GITHUB_REPO must be owner/repo" },
      500
    );
  }

  const [owner, repo] = repoParts;
  const workflowUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(githubWorkflowFile)}/dispatches`;

  const ghResponse = await fetch(workflowUrl, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${githubToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref: githubRef }),
  });

  if (!ghResponse.ok) {
    const detail = await ghResponse.text();
    return jsonResponse(
      {
        error: "GitHub API error",
        status: ghResponse.status,
        detail,
      },
      502
    );
  }

  return jsonResponse(
    {
      ok: true,
      message: "Deploy workflow started",
      ref: githubRef,
      workflow: githubWorkflowFile,
      repository: githubRepo,
    },
    200
  );
});
