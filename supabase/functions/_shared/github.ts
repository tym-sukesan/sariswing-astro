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
