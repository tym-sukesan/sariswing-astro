/**
 * G-12a — Gosaki About content dry-run (runtime GitHub Contents GET · no writes).
 */

import {
  assertExactObjectKeys,
  assertGosakiAboutStagingSupabaseHost,
  buildAboutSaveFingerprint,
  loadAboutContentJsonFromGithub,
  planAboutContentPatch,
  serializeAboutSaveFingerprint,
  GOSAKI_ABOUT_GITHUB_BRANCH,
  GOSAKI_ABOUT_GITHUB_FILE_PATH,
  GOSAKI_ABOUT_SITE_SLUG,
  type AboutContentSnapshot,
} from "./gosaki-about-github-json.ts";
import { normalizeAboutNext } from "./gosaki-about-html-patch.ts";

export const G12A_DRY_RUN_OPERATION_ID = "G-12a-gosaki-about-content-dry-run";
export const G12A_DRY_RUN_APPROVAL_ID = "G-12a-gosaki-about-content-dry-run";
export const G12A_MODULE = "about-content";
export const G12A_SAVE_READINESS = "dry_run_only_ready";

export const G12A_DRY_RUN_ALLOWED_KEYS = [
  "siteSlug",
  "module",
  "next",
  "dryRun",
  "operationId",
  "approvalId",
] as const;

export type AboutGithubRuntimeDeps = {
  fetchImpl?: typeof fetch;
  auth?: { token: string; repo: string; ref: string } | null;
  stagingHostCheck?: () => string | null;
};

export function parseG12aDryRunRequest(
  body: unknown,
): { ok: true; next: AboutContentSnapshot } | { ok: false; error: string; httpStatus: number } {
  const keyError = assertExactObjectKeys(body, G12A_DRY_RUN_ALLOWED_KEYS);
  if (keyError) {
    return { ok: false, error: keyError, httpStatus: 422 };
  }
  const record = body as Record<string, unknown>;

  if (record.siteSlug !== GOSAKI_ABOUT_SITE_SLUG) {
    return { ok: false, error: `siteSlug must be ${GOSAKI_ABOUT_SITE_SLUG}`, httpStatus: 422 };
  }
  if (record.module !== G12A_MODULE) {
    return { ok: false, error: `module must be ${G12A_MODULE}`, httpStatus: 422 };
  }
  if (record.dryRun !== true) {
    return { ok: false, error: "dryRun must be true", httpStatus: 422 };
  }
  if (record.operationId !== G12A_DRY_RUN_OPERATION_ID) {
    return { ok: false, error: `operationId must be ${G12A_DRY_RUN_OPERATION_ID}`, httpStatus: 422 };
  }
  if (record.approvalId !== G12A_DRY_RUN_APPROVAL_ID) {
    return { ok: false, error: `approvalId must be ${G12A_DRY_RUN_APPROVAL_ID}`, httpStatus: 422 };
  }

  const normalized = normalizeAboutNext(record.next);
  if (!normalized.ok) {
    return { ok: false, error: normalized.error, httpStatus: 422 };
  }
  return { ok: true, next: normalized.next };
}

export async function handleG12aAboutContentDryRunBody(
  body: unknown,
  deps: AboutGithubRuntimeDeps = {},
) {
  const hostError = (deps.stagingHostCheck ?? assertGosakiAboutStagingSupabaseHost)();
  if (hostError) {
    return {
      ok: false,
      dryRun: true as const,
      operation: "dryRun" as const,
      wouldWrite: false as const,
      error: hostError,
      errors: [hostError],
      didWrite: false as const,
      dbWrite: false as const,
      networkWrite: false as const,
      httpStatus: 403,
    };
  }

  const parsed = parseG12aDryRunRequest(body);
  if (!parsed.ok) {
    return {
      ok: false,
      dryRun: true as const,
      operation: "dryRun" as const,
      wouldWrite: false as const,
      error: parsed.error,
      errors: [parsed.error],
      didWrite: false as const,
      dbWrite: false as const,
      networkWrite: false as const,
      httpStatus: parsed.httpStatus,
    };
  }

  const loaded = await loadAboutContentJsonFromGithub({
    fetchImpl: deps.fetchImpl,
    auth: deps.auth,
  });
  if (!loaded.ok) {
    return {
      ok: false,
      dryRun: true as const,
      operation: "dryRun" as const,
      wouldWrite: false as const,
      error: loaded.error,
      errors: [loaded.error],
      didWrite: false as const,
      dbWrite: false as const,
      networkWrite: false as const,
      httpStatus: loaded.httpStatus === 404 || loaded.httpStatus === 409
        ? loaded.httpStatus
        : 502,
    };
  }

  const plan = planAboutContentPatch({
    config: loaded.config,
    next: parsed.next,
    enforceExpectedBefore: false,
  });
  if (!plan.ok) {
    return {
      ok: false,
      dryRun: true as const,
      operation: "dryRun" as const,
      wouldWrite: false as const,
      error: plan.error,
      errors: [plan.error],
      didWrite: false as const,
      dbWrite: false as const,
      networkWrite: false as const,
      httpStatus: plan.httpStatus,
      current: plan.current,
      currentFileSha: loaded.file.sha,
    };
  }

  const fingerprint = serializeAboutSaveFingerprint(
    buildAboutSaveFingerprint({
      githubFileSha: loaded.file.sha,
      before: plan.current,
      after: plan.next,
    }),
  );

  return {
    ok: true,
    dryRun: true as const,
    operation: "dryRun" as const,
    wouldWrite: false as const,
    siteSlug: GOSAKI_ABOUT_SITE_SLUG,
    module: G12A_MODULE,
    branch: GOSAKI_ABOUT_GITHUB_BRANCH,
    targetFilePath: GOSAKI_ABOUT_GITHUB_FILE_PATH,
    changedFields: plan.changedFields,
    saveReadiness: plan.saveReadiness === "no_change" ? "no_change" : G12A_SAVE_READINESS,
    noChange: plan.saveReadiness === "no_change",
    current: plan.current,
    next: plan.next,
    before: plan.current,
    after: plan.next,
    currentFileSha: loaded.file.sha,
    fingerprint,
    didWrite: false as const,
    dbWrite: false as const,
    networkWrite: false as const,
    workflowDispatchExecuted: false as const,
    httpStatus: 200,
  };
}
