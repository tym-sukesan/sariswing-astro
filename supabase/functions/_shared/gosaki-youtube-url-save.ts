/**
 * G-11c6 — Gosaki YouTube URL web-save (GitHub Contents API commit · no workflow_dispatch).
 */

import {
  assertG11c1NextValueAllowed,
  G11C1_FIELD,
  G11C1_MODULE,
  G11C1_SITE_SLUG,
  type YoutubeGithubRuntimeDeps,
} from "./gosaki-youtube-url-dry-run.ts";
import {
  assertExactObjectKeys,
  assertGosakiYoutubeStagingSupabaseHost,
  buildYoutubeCommitMessage,
  buildYoutubeSaveFingerprint,
  commitYoutubeEmbedCodePatch,
  fingerprintsEqual,
  loadYoutubeEmbedJsonFromGithub,
  parseYoutubeSaveFingerprint,
  planYoutubeEmbedCodePatch,
  serializeYoutubeSaveFingerprint,
  GOSAKI_YOUTUBE_GITHUB_FILE_PATH,
  GOSAKI_YOUTUBE_TARGET_ITEM_ID,
} from "./gosaki-youtube-github-json.ts";

export const G11C6_OPERATION_ID = "G-11c6-gosaki-youtube-url-web-save-non-dry-run-slice";
export const G11C6_APPROVAL_ID = "G-11c6-gosaki-youtube-url-web-save-non-dry-run-slice";
export const G11C6_STAGING_PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
export const G11C6_PRODUCTION_PROJECT_REF = "vsbvndwuajjhnzpohghh";
export const G11C6_SAVE_ARMED_ENV = "GOSAKI_YOUTUBE_URL_SAVE_ARMED";
export const G11C6_WORKFLOW_FILE = "gosaki-youtube-url-save-staging.yml";
export const G11C6_SAVE_READINESS_DISABLED = "save_disabled";
export const G11C6_SAVE_READINESS_NOT_ARMED = "save_not_armed";
export const G11C6_SAVE_READINESS_COMMITTED = "committed";

export const G11C6_SAVE_ALLOWED_KEYS = [
  "siteSlug",
  "module",
  "field",
  "nextValue",
  "dryRun",
  "saveEnabled",
  "operationId",
  "approvalId",
  "expectedBefore",
  "fingerprint",
  "requestId",
] as const;

export type G11c6SaveRequest = {
  siteSlug?: string;
  module?: string;
  field?: string;
  nextValue?: string;
  dryRun?: boolean;
  saveEnabled?: boolean;
  operationId?: string;
  approvalId?: string;
  fingerprint?: string;
  requestId?: string;
  expectedBefore?: {
    embedCode?: string;
    videoId?: string | null;
  };
};

export function assertG11c6StagingSupabaseHost(): string | null {
  return assertGosakiYoutubeStagingSupabaseHost();
}

export function isG11c6SaveArmed(): boolean {
  return Deno.env.get(G11C6_SAVE_ARMED_ENV) === "true";
}

export function parseG11c6SaveRequest(
  body: unknown,
):
  | {
      ok: true;
      request: {
        nextValue: string;
        fingerprint: string;
        requestId: string;
        expectedBefore: { embedCode: string; videoId: string | null };
      };
    }
  | { ok: false; error: string; httpStatus: number } {
  const keyError = assertExactObjectKeys(body, G11C6_SAVE_ALLOWED_KEYS);
  if (keyError) {
    return { ok: false, error: keyError, httpStatus: 422 };
  }
  const record = body as G11c6SaveRequest;

  if (record.siteSlug !== G11C1_SITE_SLUG) {
    return { ok: false, error: `siteSlug must be ${G11C1_SITE_SLUG}`, httpStatus: 422 };
  }
  if (record.module !== G11C1_MODULE) {
    return { ok: false, error: `module must be ${G11C1_MODULE}`, httpStatus: 422 };
  }
  if (record.field !== G11C1_FIELD) {
    return { ok: false, error: `field must be ${G11C1_FIELD}`, httpStatus: 422 };
  }
  if (record.dryRun !== false) {
    return { ok: false, error: "dryRun must be false for save", httpStatus: 422 };
  }
  if (record.saveEnabled !== true) {
    return { ok: false, error: "saveEnabled must be true", httpStatus: 422 };
  }
  if (record.operationId !== G11C6_OPERATION_ID) {
    return { ok: false, error: `operationId must be ${G11C6_OPERATION_ID}`, httpStatus: 403 };
  }
  if (record.approvalId !== G11C6_APPROVAL_ID) {
    return { ok: false, error: `approvalId must be ${G11C6_APPROVAL_ID}`, httpStatus: 403 };
  }
  if (typeof record.nextValue !== "string") {
    return { ok: false, error: "nextValue must be a string", httpStatus: 422 };
  }
  if (typeof record.fingerprint !== "string" || !record.fingerprint.trim()) {
    return { ok: false, error: "fingerprint is required", httpStatus: 422 };
  }
  if (!record.expectedBefore || typeof record.expectedBefore !== "object") {
    return { ok: false, error: "expectedBefore is required", httpStatus: 422 };
  }
  const expectedKeys = Object.keys(record.expectedBefore).sort();
  const allowedExpected = ["embedCode", "videoId"];
  if (
    expectedKeys.length !== 2 ||
    expectedKeys[0] !== "embedCode" ||
    expectedKeys[1] !== "videoId"
  ) {
    // allow embedCode-only? User said expectedBefore.embedCode and videoId — require both keys
    if (!(expectedKeys.length === 2 && expectedKeys.includes("embedCode") && expectedKeys.includes("videoId"))) {
      return {
        ok: false,
        error: "expectedBefore must contain exact keys embedCode, videoId",
        httpStatus: 422,
      };
    }
  }
  if (typeof record.expectedBefore.embedCode !== "string") {
    return { ok: false, error: "expectedBefore.embedCode must be a string", httpStatus: 422 };
  }
  if (
    record.expectedBefore.videoId != null &&
    typeof record.expectedBefore.videoId !== "string"
  ) {
    return { ok: false, error: "expectedBefore.videoId must be string or null", httpStatus: 422 };
  }

  const requestId =
    typeof record.requestId === "string" && record.requestId.trim()
      ? record.requestId.trim()
      : `g11c6-${crypto.randomUUID()}`;

  return {
    ok: true,
    request: {
      nextValue: record.nextValue,
      fingerprint: record.fingerprint.trim(),
      requestId,
      expectedBefore: {
        embedCode: record.expectedBefore.embedCode,
        videoId:
          record.expectedBefore.videoId == null
            ? null
            : String(record.expectedBefore.videoId).trim() || null,
      },
    },
  };
}

function failBase(error: string, httpStatus: number, extra: Record<string, unknown> = {}) {
  return {
    ok: false,
    dryRun: false as const,
    operation: "save" as const,
    wouldWrite: false as const,
    siteSlug: G11C1_SITE_SLUG,
    module: G11C1_MODULE,
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

export async function executeG11c6YoutubeUrlSave(
  input: {
    nextValue: string;
    expectedBefore: { embedCode: string; videoId?: string | null };
    fingerprint: string;
    requestId: string;
    saveArmed: boolean;
  },
  deps: YoutubeGithubRuntimeDeps = {},
) {
  const hostError = (deps.stagingHostCheck ?? assertG11c6StagingSupabaseHost)();
  if (hostError) {
    return failBase(hostError, 403, { saveReadiness: "forbidden_host" });
  }

  if (!input.saveArmed) {
    return failBase("Save is not armed on server (GOSAKI_YOUTUBE_URL_SAVE_ARMED=false)", 403, {
      saveReadiness: G11C6_SAVE_READINESS_NOT_ARMED,
    });
  }

  const fpParsed = parseYoutubeSaveFingerprint(input.fingerprint);
  if (!fpParsed.ok) {
    return failBase(fpParsed.error, 422, { saveReadiness: "invalid_fingerprint" });
  }

  const valueError = assertG11c1NextValueAllowed(input.nextValue);
  if (valueError) {
    return failBase(valueError, 422, { saveReadiness: "invalid_input" });
  }

  const loaded = await loadYoutubeEmbedJsonFromGithub({
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

  const plan = planYoutubeEmbedCodePatch({
    config: loaded.config,
    nextEmbedCode: input.nextValue,
    expectedBeforeEmbedCode: input.expectedBefore.embedCode,
    expectedBeforeVideoId: input.expectedBefore.videoId,
    enforceExpectedBefore: true,
  });
  if (!plan.ok) {
    return failBase(plan.error, plan.httpStatus, {
      saveReadiness: plan.httpStatus === 409 ? "conflict" : "invalid_input",
      current: plan.current,
      currentFileSha: loaded.file.sha,
    });
  }

  const expectedFp = serializeYoutubeSaveFingerprint(
    buildYoutubeSaveFingerprint({
      githubFileSha: loaded.file.sha,
      before: plan.current,
      after: plan.next,
    }),
  );
  if (!fingerprintsEqual(expectedFp, fpParsed.serialized)) {
    return failBase("dry-run fingerprint does not match current GitHub state / nextValue", 409, {
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
      siteSlug: G11C1_SITE_SLUG,
      module: G11C1_MODULE,
      changedFields: [] as string[],
      noChange: true,
      current: plan.current,
      next: plan.next,
      before: plan.current,
      after: plan.next,
      currentFileSha: loaded.file.sha,
      previousFileSha: loaded.file.sha,
      targetFilePath: GOSAKI_YOUTUBE_GITHUB_FILE_PATH,
      targetItemId: GOSAKI_YOUTUBE_TARGET_ITEM_ID,
      saveReadiness: "no_change",
      workflowDispatchExecuted: false as const,
      didWrite: false as const,
      dbWrite: false as const,
      networkWrite: false as const,
      errors: [] as string[],
      httpStatus: 200,
    };
  }

  const message = buildYoutubeCommitMessage({
    requestId: input.requestId,
    approvalId: G11C6_APPROVAL_ID,
    operationId: G11C6_OPERATION_ID,
  });

  const committed = await commitYoutubeEmbedCodePatch({
    patchedContentText: plan.patchedContentText,
    previousFileSha: loaded.file.sha,
    message,
    fetchImpl: deps.fetchImpl,
    auth: deps.auth,
  });

  if (!committed.ok) {
    return failBase(committed.error, committed.httpStatus, {
      saveReadiness: committed.indeterminate
        ? "verification_required"
        : committed.conflict
          ? "conflict"
          : "github_write_failed",
      indeterminate: committed.indeterminate === true,
      currentFileSha: loaded.file.sha,
      current: plan.current,
      next: plan.next,
      message: committed.indeterminate
        ? "GitHub write outcome unclear — re-run dry-run to verify current JSON; do not auto-retry"
        : undefined,
    });
  }

  return {
    ok: true,
    dryRun: false as const,
    operation: "save" as const,
    wouldWrite: true as const,
    siteSlug: G11C1_SITE_SLUG,
    module: G11C1_MODULE,
    changedFields: plan.changedFields,
    current: plan.current,
    next: plan.next,
    before: plan.current,
    after: plan.next,
    targetFilePath: GOSAKI_YOUTUBE_GITHUB_FILE_PATH,
    targetItemId: GOSAKI_YOUTUBE_TARGET_ITEM_ID,
    previousFileSha: committed.previousFileSha,
    newFileSha: committed.newFileSha,
    currentFileSha: committed.newFileSha,
    commitSha: committed.commitSha,
    commitUrl: committed.commitUrl,
    saveReadiness: G11C6_SAVE_READINESS_COMMITTED,
    workflowDispatchExecuted: false as const,
    didWrite: true as const,
    dbWrite: false as const,
    networkWrite: true as const,
    errors: [] as string[],
    httpStatus: 200,
  };
}

export async function handleG11c6YoutubeUrlSaveBody(
  body: unknown,
  deps: YoutubeGithubRuntimeDeps = {},
) {
  const parsed = parseG11c6SaveRequest(body);
  if (!parsed.ok) {
    return failBase(parsed.error, parsed.httpStatus, {
      saveReadiness: G11C6_SAVE_READINESS_DISABLED,
    });
  }

  return executeG11c6YoutubeUrlSave(
    {
      nextValue: parsed.request.nextValue,
      expectedBefore: parsed.request.expectedBefore,
      fingerprint: parsed.request.fingerprint,
      requestId: parsed.request.requestId,
      saveArmed: isG11c6SaveArmed(),
    },
    deps,
  );
}
