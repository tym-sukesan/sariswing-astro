/**
 * G-11c6a — Gosaki YouTube URL web-save non-dry-run (Edge Function shared).
 * Reuses G-11c1 validation; no workflow_dispatch in G-11c6a local-only phase.
 */

import {
  G11C1_FIELD,
  G11C1_MODULE,
  G11C1_SITE_SLUG,
  assertG11c1NextValueAllowed,
  executeG11c1YoutubeUrlDryRun,
  parseYoutubeVideoId,
  resolveGosakiYoutubeStagingCurrent,
} from "./gosaki-youtube-url-dry-run.ts";

export const G11C6_OPERATION_ID = "G-11c6-gosaki-youtube-url-web-save-non-dry-run-slice";
export const G11C6_APPROVAL_ID = "G-11c6-gosaki-youtube-url-web-save-non-dry-run-slice";
export const G11C6_STAGING_PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
export const G11C6_PRODUCTION_PROJECT_REF = "vsbvndwuajjhnzpohghh";
export const G11C6_SAVE_ARMED_ENV = "GOSAKI_YOUTUBE_URL_SAVE_ARMED";
export const G11C6_WORKFLOW_FILE = "gosaki-youtube-url-save-staging.yml";
export const G11C6_SAVE_READINESS_DISABLED = "save_disabled";
export const G11C6_SAVE_READINESS_NOT_ARMED = "save_not_armed";
export const G11C6_SAVE_READINESS_DISPATCH_DEFERRED = "dispatch_deferred_g11c6a";

export type G11c6SaveRequest = {
  siteSlug?: string;
  module?: string;
  field?: string;
  nextValue?: string;
  dryRun?: boolean;
  saveEnabled?: boolean;
  operationId?: string;
  approvalId?: string;
  expectedBefore?: {
    embedCode?: string;
    videoId?: string | null;
  };
};

export function assertG11c6StagingSupabaseHost(): string | null {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  if (!url) return "SUPABASE_URL is not configured";
  if (url.includes(G11C6_PRODUCTION_PROJECT_REF)) {
    return "production Supabase project blocked";
  }
  if (!url.includes(G11C6_STAGING_PROJECT_REF)) {
    return `staging project ref ${G11C6_STAGING_PROJECT_REF} required`;
  }
  return null;
}

export function isG11c6SaveArmed(): boolean {
  return Deno.env.get(G11C6_SAVE_ARMED_ENV) === "true";
}

export function parseG11c6SaveRequest(
  body: unknown,
): { ok: true; request: Required<Pick<G11c6SaveRequest, "nextValue">> & G11c6SaveRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "request body must be a JSON object" };
  }
  const record = body as G11c6SaveRequest;

  if (record.siteSlug !== G11C1_SITE_SLUG) {
    return { ok: false, error: `siteSlug must be ${G11C1_SITE_SLUG}` };
  }
  if (record.module !== G11C1_MODULE) {
    return { ok: false, error: `module must be ${G11C1_MODULE}` };
  }
  if (record.field !== G11C1_FIELD) {
    return { ok: false, error: `field must be ${G11C1_FIELD}` };
  }
  if (record.dryRun !== false) {
    return { ok: false, error: "dryRun must be false for save" };
  }
  if (record.saveEnabled !== true) {
    return { ok: false, error: "saveEnabled must be true" };
  }
  if (record.operationId !== G11C6_OPERATION_ID) {
    return { ok: false, error: `operationId must be ${G11C6_OPERATION_ID}` };
  }
  if (record.approvalId !== G11C6_APPROVAL_ID) {
    return { ok: false, error: `approvalId must be ${G11C6_APPROVAL_ID}` };
  }
  if (typeof record.nextValue !== "string") {
    return { ok: false, error: "nextValue must be a string" };
  }
  if (!record.expectedBefore || typeof record.expectedBefore !== "object") {
    return { ok: false, error: "expectedBefore is required" };
  }
  if (typeof record.expectedBefore.embedCode !== "string") {
    return { ok: false, error: "expectedBefore.embedCode must be a string" };
  }

  return { ok: true, request: record as Required<Pick<G11c6SaveRequest, "nextValue">> & G11c6SaveRequest };
}

function normalizeVideoId(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return parseYoutubeVideoId(trimmed) ?? ( /^[a-zA-Z0-9_-]{11}$/.test(trimmed) ? trimmed : null );
}

export function assertExpectedBeforeMatchesCurrent(input: {
  expectedBefore: { embedCode: string; videoId?: string | null };
  current: { embedCode: string; videoId: string | null };
}): string | null {
  const expectedEmbed = String(input.expectedBefore.embedCode ?? "").trim();
  const currentEmbed = String(input.current.embedCode ?? "").trim();
  if (expectedEmbed !== currentEmbed) {
    return "expectedBefore.embedCode does not match server current";
  }

  const expectedVid = normalizeVideoId(input.expectedBefore.videoId);
  const currentVid = normalizeVideoId(input.current.videoId);
  if (expectedVid !== currentVid) {
    return "expectedBefore.videoId does not match server current";
  }

  return null;
}

export function executeG11c6YoutubeUrlSave(input: {
  nextValue: string;
  expectedBefore: { embedCode: string; videoId?: string | null };
  saveArmed: boolean;
}) {
  const hostError = assertG11c6StagingSupabaseHost();
  if (hostError) {
    return {
      ok: false,
      dryRun: false as const,
      wouldWrite: false as const,
      siteSlug: G11C1_SITE_SLUG,
      module: G11C1_MODULE,
      error: hostError,
      saveReadiness: "forbidden_host",
      httpStatus: 403,
    };
  }

  const currentSnapshot = resolveGosakiYoutubeStagingCurrent();
  const current = {
    embedCode: String(currentSnapshot.embedCode ?? "").trim(),
    videoId: currentSnapshot.videoId ?? parseYoutubeVideoId(currentSnapshot.embedCode),
  };

  const conflictError = assertExpectedBeforeMatchesCurrent({
    expectedBefore: input.expectedBefore,
    current,
  });
  if (conflictError) {
    return {
      ok: false,
      dryRun: false as const,
      wouldWrite: false as const,
      siteSlug: G11C1_SITE_SLUG,
      module: G11C1_MODULE,
      changedFields: [] as string[],
      error: conflictError,
      saveReadiness: "conflict",
      current,
      httpStatus: 409,
    };
  }

  const valueError = assertG11c1NextValueAllowed(input.nextValue);
  if (valueError) {
    return {
      ok: false,
      dryRun: false as const,
      wouldWrite: false as const,
      siteSlug: G11C1_SITE_SLUG,
      module: G11C1_MODULE,
      changedFields: [] as string[],
      error: valueError,
      saveReadiness: "invalid_input",
      httpStatus: 400,
    };
  }

  const preview = executeG11c1YoutubeUrlDryRun({
    nextValue: input.nextValue,
    current,
  });

  if (!preview.ok) {
    return {
      ...preview,
      dryRun: false as const,
      saveReadiness: preview.saveReadiness ?? "invalid_input",
      httpStatus: 400,
    };
  }

  if (preview.noChange) {
    return {
      ok: true,
      dryRun: false as const,
      wouldWrite: false as const,
      siteSlug: G11C1_SITE_SLUG,
      module: G11C1_MODULE,
      changedFields: [] as string[],
      noChange: true,
      current: preview.current,
      next: preview.next,
      saveReadiness: "no_change",
      workflowDispatchExecuted: false,
      httpStatus: 200,
    };
  }

  if (!input.saveArmed) {
    return {
      ok: false,
      dryRun: false as const,
      wouldWrite: false as const,
      siteSlug: G11C1_SITE_SLUG,
      module: G11C1_MODULE,
      changedFields: preview.changedFields,
      current: preview.current,
      next: preview.next,
      error: "Save is not armed on server (GOSAKI_YOUTUBE_URL_SAVE_ARMED=false)",
      saveReadiness: G11C6_SAVE_READINESS_NOT_ARMED,
      httpStatus: 403,
    };
  }

  // G-11c6a: dispatch path stubbed — workflow_dispatch deferred to G-11c7+ execution phase.
  return {
    ok: true,
    dryRun: false as const,
    wouldWrite: false as const,
    siteSlug: G11C1_SITE_SLUG,
    module: G11C1_MODULE,
    changedFields: preview.changedFields,
    current: preview.current,
    next: preview.next,
    saveReadiness: G11C6_SAVE_READINESS_DISPATCH_DEFERRED,
    workflowDispatchExecuted: false,
    workflowFile: G11C6_WORKFLOW_FILE,
    httpStatus: 200,
  };
}

export function handleG11c6YoutubeUrlSaveBody(body: unknown) {
  const parsed = parseG11c6SaveRequest(body);
  if (!parsed.ok) {
    return {
      ok: false,
      dryRun: false,
      wouldWrite: false,
      error: parsed.error,
      saveReadiness: G11C6_SAVE_READINESS_DISABLED,
      httpStatus: 400,
    };
  }

  return executeG11c6YoutubeUrlSave({
    nextValue: parsed.request.nextValue,
    expectedBefore: {
      embedCode: String(parsed.request.expectedBefore!.embedCode ?? ""),
      videoId: parsed.request.expectedBefore!.videoId ?? null,
    },
    saveArmed: isG11c6SaveArmed(),
  });
}
