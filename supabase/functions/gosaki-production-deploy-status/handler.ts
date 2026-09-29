/**
 * gosaki-production-deploy-status
 * JWT + can_write_site(gosaki-piano). Deploy arm not required (read-only poll).
 * Latest run of hardcoded gosaki-piano-production-public-dist.yml, or runId of that workflow only.
 * Client cannot specify workflow / repo / ref / site.
 */

import {
  authorizeGosakiProductionDeploy,
  fetchGosakiWorkflowRunById,
  fetchLatestGosakiWorkflowRun,
  normalizeRunStatus,
  rejectForbiddenClientFields,
  resolveHardcodedGitHubConfig,
  runMatchesHardcodedWorkflow,
  SITE_SLUG,
  WORKFLOW_FILE,
  type GosakiDeployEnv,
  type GosakiDeployHandlerResult,
} from "../_shared/gosaki-production-deploy-auth.ts";

export const ENDPOINT_NAME = "gosaki-production-deploy-status";

export async function handleGosakiProductionDeployStatusHttpAsync(
  req: {
    method: string;
    contentType?: string;
    body?: unknown;
    authorizationHeader?: string | null;
  },
  env: GosakiDeployEnv,
  fetchImpl: typeof fetch = fetch,
): Promise<GosakiDeployHandlerResult> {
  if (req.method !== "POST") {
    return { ok: false, httpStatus: 405, errors: ["Method not allowed"] };
  }

  const forbidden = rejectForbiddenClientFields(req.body ?? null);
  if (!forbidden.ok) {
    return { ok: false, httpStatus: forbidden.status, errors: forbidden.errors };
  }

  const authz = await authorizeGosakiProductionDeploy(req, env);
  if (!authz.ok) return authz.result;

  const config = resolveHardcodedGitHubConfig(env);
  if (!config.ok) {
    return { ok: false, httpStatus: config.status, errors: [config.error] };
  }

  let runId: number | null = null;
  if (req.body && typeof req.body === "object" && !Array.isArray(req.body)) {
    const raw = (req.body as Record<string, unknown>).runId;
    if (typeof raw === "number" && Number.isFinite(raw)) {
      runId = raw;
    }
  }

  const run =
    runId !== null
      ? await fetchGosakiWorkflowRunById(config, runId, fetchImpl)
      : await fetchLatestGosakiWorkflowRun(config, fetchImpl);

  if (!run) {
    return { ok: false, httpStatus: 404, errors: ["Run not found"], workflowFile: WORKFLOW_FILE };
  }
  if (runId !== null && !runMatchesHardcodedWorkflow(run)) {
    return {
      ok: false,
      httpStatus: 403,
      errors: ["runId is not the Gosaki production public-dist workflow"],
      workflowFile: WORKFLOW_FILE,
    };
  }

  const runStatus = normalizeRunStatus(run);
  return {
    ok: true,
    httpStatus: 200,
    runId: run.id,
    status: runStatus,
    workflowFile: WORKFLOW_FILE,
    siteSlug: SITE_SLUG,
    siteId: authz.siteId,
    runCreatedAt: run.created_at,
    runUpdatedAt: run.updated_at,
    completedAt: runStatus !== "running" ? run.updated_at : null,
  };
}
