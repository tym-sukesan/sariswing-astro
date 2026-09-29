/**
 * gosaki-production-deploy-trigger
 * JWT + can_write_site(gosaki-piano) + GOSAKI_PRODUCTION_DEPLOY_ARMED === "true"
 * Dispatches hardcoded gosaki-piano-production-public-dist.yml on main.
 * Client cannot specify repo / workflow / ref / site.
 */

import {
  authorizeGosakiProductionDeploy,
  dispatchGosakiWorkflow,
  normalizeRunStatus,
  rejectForbiddenClientFields,
  resolveHardcodedGitHubConfig,
  waitForLatestGosakiWorkflowRun,
  DEPLOY_NOT_ARMED,
  SITE_SLUG,
  WORKFLOW_FILE,
  DISPATCH_REF,
  type GosakiDeployEnv,
  type GosakiDeployHandlerResult,
} from "../_shared/gosaki-production-deploy-auth.ts";

export const ENDPOINT_NAME = "gosaki-production-deploy-trigger";

export async function handleGosakiProductionDeployTriggerHttpAsync(
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

  if (String(env.deployArmed ?? "") !== "true") {
    return {
      ok: false,
      httpStatus: 403,
      reasonCode: DEPLOY_NOT_ARMED,
      errors: ["Gosaki production Deploy is not armed"],
      siteSlug: SITE_SLUG,
      workflowFile: WORKFLOW_FILE,
      ref: DISPATCH_REF,
    };
  }

  const config = resolveHardcodedGitHubConfig(env);
  if (!config.ok) {
    return { ok: false, httpStatus: config.status, errors: [config.error] };
  }

  const startedAt = new Date().toISOString();
  const dispatchedAfterMs = Date.now();
  const dispatched = await dispatchGosakiWorkflow(config, fetchImpl);
  if (!dispatched.ok) {
    return {
      ok: false,
      httpStatus: 502,
      errors: ["Deploy start failed"],
      githubStatus: dispatched.status,
    };
  }

  const run = await waitForLatestGosakiWorkflowRun(config, dispatchedAfterMs, fetchImpl);
  return {
    ok: true,
    httpStatus: 200,
    startedAt,
    runId: run?.id ?? null,
    status: run ? normalizeRunStatus(run) : "running",
    workflowFile: WORKFLOW_FILE,
    ref: DISPATCH_REF,
    siteSlug: SITE_SLUG,
    siteId: authz.siteId,
    runCreatedAt: run?.created_at ?? startedAt,
    runUpdatedAt: run?.updated_at ?? startedAt,
  };
}
