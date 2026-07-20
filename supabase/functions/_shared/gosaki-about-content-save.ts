/**
 * G-12a — Gosaki About content web-save (GitHub Contents API commit · no workflow_dispatch).
 */

import {
  G12A_DRY_RUN_APPROVAL_ID,
  G12A_MODULE,
  type AboutGithubRuntimeDeps,
} from "./gosaki-about-content-dry-run.ts";
import {
  assertExactObjectKeys,
  assertGosakiAboutStagingSupabaseHost,
  buildAboutCommitMessage,
  buildAboutSaveFingerprint,
  commitAboutContentPatch,
  fingerprintsEqual,
  loadAboutContentJsonFromGithub,
  parseAboutSaveFingerprint,
  planAboutContentPatch,
  serializeAboutSaveFingerprint,
  GOSAKI_ABOUT_GITHUB_FILE_PATH,
  GOSAKI_ABOUT_SITE_SLUG,
  type AboutContentSnapshot,
} from "./gosaki-about-github-json.ts";
import { normalizeAboutNext } from "./gosaki-about-html-patch.ts";

export const G12A_SAVE_OPERATION_ID = "G-12a-gosaki-about-content-web-save-non-dry-run-slice";
export const G12A_SAVE_APPROVAL_ID = "G-12a-gosaki-about-content-web-save-non-dry-run-slice";
export const G12A_SAVE_ARMED_ENV = "GOSAKI_ABOUT_CONTENT_SAVE_ARMED";
export const G12A_SAVE_READINESS_NOT_ARMED = "save_not_armed";
export const G12A_SAVE_READINESS_COMMITTED = "committed";

export const G12A_SAVE_ALLOWED_KEYS = [
  "siteSlug",
  "module",
  "next",
  "dryRun",
  "saveEnabled",
  "operationId",
  "approvalId",
  "expectedBefore",
  "fingerprint",
  "requestId",
] as const;

export function isG12aSaveArmed(): boolean {
  return Deno.env.get(G12A_SAVE_ARMED_ENV) === "true";
}

export function parseG12aSaveRequest(
  body: unknown,
):
  | {
      ok: true;
      request: {
        next: AboutContentSnapshot;
        fingerprint: string;
        requestId: string;
        expectedBefore: AboutContentSnapshot;
      };
    }
  | { ok: false; error: string; httpStatus: number } {
  const keyError = assertExactObjectKeys(body, G12A_SAVE_ALLOWED_KEYS);
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
  if (record.dryRun !== false) {
    return { ok: false, error: "dryRun must be false for save", httpStatus: 422 };
  }
  if (record.saveEnabled !== true) {
    return { ok: false, error: "saveEnabled must be true", httpStatus: 422 };
  }
  if (record.operationId !== G12A_SAVE_OPERATION_ID) {
    return { ok: false, error: `operationId must be ${G12A_SAVE_OPERATION_ID}`, httpStatus: 403 };
  }
  if (record.approvalId !== G12A_SAVE_APPROVAL_ID) {
    return { ok: false, error: `approvalId must be ${G12A_SAVE_APPROVAL_ID}`, httpStatus: 403 };
  }
  if (typeof record.fingerprint !== "string" || !record.fingerprint.trim()) {
    return { ok: false, error: "fingerprint is required", httpStatus: 422 };
  }

  const normalized = normalizeAboutNext(record.next);
  if (!normalized.ok) {
    return { ok: false, error: normalized.error, httpStatus: 422 };
  }
  const expectedNorm = normalizeAboutNext(record.expectedBefore);
  if (!expectedNorm.ok) {
    return { ok: false, error: `expectedBefore: ${expectedNorm.error}`, httpStatus: 422 };
  }

  const requestId =
    typeof record.requestId === "string" && record.requestId.trim()
      ? record.requestId.trim()
      : `g12a-${crypto.randomUUID()}`;

  return {
    ok: true,
    request: {
      next: normalized.next,
      fingerprint: record.fingerprint.trim(),
      requestId,
      expectedBefore: expectedNorm.next,
    },
  };
}

function failBase(error: string, httpStatus: number, extra: Record<string, unknown> = {}) {
  return {
    ok: false,
    dryRun: false as const,
    operation: "save" as const,
    wouldWrite: false as const,
    siteSlug: GOSAKI_ABOUT_SITE_SLUG,
    module: G12A_MODULE,
    error,
    errors: [error],
    didWrite: false as const,
    dbWrite: false as const,
    networkWrite: false as const,
    workflowDispatchExecuted: false as const,
    httpStatus,
    ...extra,
  };
}

export async function executeG12aAboutContentSave(
  input: {
    next: AboutContentSnapshot;
    expectedBefore: AboutContentSnapshot;
    fingerprint: string;
    requestId: string;
    saveArmed: boolean;
  },
  deps: AboutGithubRuntimeDeps = {},
) {
  const hostError = (deps.stagingHostCheck ?? assertGosakiAboutStagingSupabaseHost)();
  if (hostError) {
    return failBase(hostError, 403, { saveReadiness: "forbidden_host" });
  }

  if (!input.saveArmed) {
    return failBase("Save is not armed on server (GOSAKI_ABOUT_CONTENT_SAVE_ARMED=false)", 403, {
      saveReadiness: G12A_SAVE_READINESS_NOT_ARMED,
    });
  }

  const fpParsed = parseAboutSaveFingerprint(input.fingerprint);
  if (!fpParsed.ok) {
    return failBase(fpParsed.error, 422, { saveReadiness: "invalid_fingerprint" });
  }

  const loaded = await loadAboutContentJsonFromGithub({
    fetchImpl: deps.fetchImpl,
    auth: deps.auth,
  });
  if (!loaded.ok) {
    return failBase(loaded.error, loaded.httpStatus === 404 || loaded.httpStatus === 409
      ? loaded.httpStatus
      : 502, {
      saveReadiness: "github_read_failed",
    });
  }

  if (loaded.file.sha !== fpParsed.fingerprint.githubFileSha) {
    return failBase("GitHub file SHA does not match dry-run fingerprint", 409, {
      saveReadiness: "conflict",
      currentFileSha: loaded.file.sha,
      expectedFileSha: fpParsed.fingerprint.githubFileSha,
      current: loaded.snapshot,
    });
  }

  const plan = planAboutContentPatch({
    config: loaded.config,
    next: input.next,
    expectedBefore: input.expectedBefore,
    enforceExpectedBefore: true,
  });
  if (!plan.ok) {
    return failBase(plan.error, plan.httpStatus, {
      saveReadiness: plan.httpStatus === 409 ? "conflict" : "invalid_input",
      current: plan.current,
      currentFileSha: loaded.file.sha,
    });
  }

  const expectedFp = serializeAboutSaveFingerprint(
    buildAboutSaveFingerprint({
      githubFileSha: loaded.file.sha,
      before: plan.current,
      after: plan.next,
    }),
  );
  if (!fingerprintsEqual(expectedFp, fpParsed.serialized)) {
    return failBase("dry-run fingerprint does not match current GitHub state / next", 409, {
      saveReadiness: "conflict",
      currentFileSha: loaded.file.sha,
      current: plan.current,
      next: plan.next,
    });
  }

  if (plan.saveReadiness === "no_change" || !plan.patchedContentText) {
    return {
      ok: true,
      dryRun: false as const,
      operation: "save" as const,
      wouldWrite: false as const,
      siteSlug: GOSAKI_ABOUT_SITE_SLUG,
      module: G12A_MODULE,
      targetFilePath: GOSAKI_ABOUT_GITHUB_FILE_PATH,
      changedFields: [] as string[],
      saveReadiness: "no_change",
      noChange: true as const,
      current: plan.current,
      next: plan.next,
      currentFileSha: loaded.file.sha,
      fingerprint: expectedFp,
      didWrite: false as const,
      dbWrite: false as const,
      networkWrite: false as const,
      workflowDispatchExecuted: false as const,
      httpStatus: 200,
      approvalId: G12A_SAVE_APPROVAL_ID,
      // dry-run approval must not be reused for save
      dryRunApprovalIdUnused: G12A_DRY_RUN_APPROVAL_ID,
    };
  }

  const committed = await commitAboutContentPatch({
    patchedContentText: plan.patchedContentText,
    previousFileSha: loaded.file.sha,
    message: buildAboutCommitMessage({
      requestId: input.requestId,
      approvalId: G12A_SAVE_APPROVAL_ID,
      operationId: G12A_SAVE_OPERATION_ID,
    }),
    fetchImpl: deps.fetchImpl,
    auth: deps.auth,
  });

  if (!committed.ok) {
    if (committed.indeterminate) {
      return failBase(committed.error || "GitHub write outcome indeterminate", 504, {
        saveReadiness: "verification_required",
        indeterminate: true,
        currentFileSha: loaded.file.sha,
        current: plan.current,
        next: plan.next,
        retryForbidden: true,
      });
    }
    return failBase(committed.error, committed.conflict ? 409 : committed.httpStatus, {
      saveReadiness: committed.conflict ? "conflict" : "github_write_failed",
      currentFileSha: loaded.file.sha,
      current: plan.current,
      next: plan.next,
    });
  }

  if (!committed.commitSha) {
    return failBase("GitHub commit SHA missing after PUT — verification_required", 504, {
      saveReadiness: "verification_required",
      indeterminate: true,
      retryForbidden: true,
      currentFileSha: loaded.file.sha,
      newFileSha: committed.newFileSha,
    });
  }

  return {
    ok: true,
    dryRun: false as const,
    operation: "save" as const,
    wouldWrite: true as const,
    siteSlug: GOSAKI_ABOUT_SITE_SLUG,
    module: G12A_MODULE,
    targetFilePath: GOSAKI_ABOUT_GITHUB_FILE_PATH,
    changedFields: plan.changedFields,
    saveReadiness: G12A_SAVE_READINESS_COMMITTED,
    current: plan.current,
    next: plan.next,
    before: plan.current,
    after: plan.next,
    currentFileSha: loaded.file.sha,
    newFileSha: committed.newFileSha,
    commitSha: committed.commitSha,
    commitUrl: committed.commitUrl,
    fingerprint: expectedFp,
    requestId: input.requestId,
    approvalId: G12A_SAVE_APPROVAL_ID,
    didWrite: true as const,
    dbWrite: false as const,
    networkWrite: true as const,
    workflowDispatchExecuted: false as const,
    httpStatus: 200,
  };
}

export async function handleG12aAboutContentSaveBody(
  body: unknown,
  deps: AboutGithubRuntimeDeps = {},
) {
  const parsed = parseG12aSaveRequest(body);
  if (!parsed.ok) {
    return failBase(parsed.error, parsed.httpStatus);
  }
  return executeG12aAboutContentSave(
    {
      next: parsed.request.next,
      expectedBefore: parsed.request.expectedBefore,
      fingerprint: parsed.request.fingerprint,
      requestId: parsed.request.requestId,
      saveArmed: isG12aSaveArmed(),
    },
    deps,
  );
}
