/**
 * G-11c1 — Gosaki YouTube URL dry-run (runtime GitHub Contents GET · no writes).
 */

import {
  assertExactObjectKeys,
  assertGosakiYoutubeStagingSupabaseHost,
  buildYoutubeSaveFingerprint,
  loadYoutubeEmbedJsonFromGithub,
  planYoutubeEmbedCodePatch,
  serializeYoutubeSaveFingerprint,
  GOSAKI_YOUTUBE_GITHUB_BRANCH,
  GOSAKI_YOUTUBE_GITHUB_FILE_PATH,
  GOSAKI_YOUTUBE_TARGET_ITEM_ID,
} from "./gosaki-youtube-github-json.ts";

export const G11C1_OPERATION_ID = "G-11c1-gosaki-youtube-url-web-save-dry-run-poc";
export const G11C1_APPROVAL_ID = "G-11c1-youtube-url-dry-run";
export const G11C1_SITE_SLUG = "gosaki-piano";
export const G11C1_MODULE = "youtube-embed";
export const G11C1_FIELD = "embedCode";
export const G11C1_SAVE_READINESS = "dry_run_only_ready";

export const G11C1_DRY_RUN_ALLOWED_KEYS = [
  "siteSlug",
  "module",
  "field",
  "nextValue",
  "dryRun",
  "operationId",
  "approvalId",
] as const;

const FORBIDDEN_INPUT_PATTERNS = [
  /javascript:/i,
  /data:/i,
  /<iframe/i,
  /<script/i,
  /<[^>]+>/,
  /on\w+\s*=/i,
];

export type G11c1DryRunRequest = {
  siteSlug?: string;
  module?: string;
  field?: string;
  nextValue?: string;
  dryRun?: boolean;
  operationId?: string;
  approvalId?: string;
};

export type YoutubeGithubRuntimeDeps = {
  fetchImpl?: typeof fetch;
  auth?: { token: string; repo: string; ref: string } | null;
  stagingHostCheck?: () => string | null;
};

export function parseYoutubeVideoId(input: string | null | undefined): string | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

  const embedSrc = raw.match(/src=["']([^"']+)["']/i)?.[1];
  if (embedSrc) {
    const fromEmbed = parseYoutubeVideoId(embedSrc);
    if (fromEmbed) return fromEmbed;
  }

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.replace(/^\//, "").split("/")[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname.startsWith("/embed/")) {
        const id = url.pathname.split("/")[2];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
      const v = url.searchParams.get("v");
      return v && /^[a-zA-Z0-9_-]{11}$/.test(v) ? v : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function assertG11c1NextValueAllowed(nextValue: string): string | null {
  const trimmed = String(nextValue ?? "").trim();
  if (!trimmed) return "nextValue must not be empty";
  for (const pattern of FORBIDDEN_INPUT_PATTERNS) {
    if (pattern.test(trimmed)) {
      return "nextValue contains forbidden HTML or script patterns";
    }
  }
  if (!parseYoutubeVideoId(trimmed)) {
    return "nextValue must be a valid YouTube URL, embed URL, or 11-char videoId";
  }
  return null;
}

export function parseG11c1DryRunRequest(
  body: unknown,
): { ok: true; nextValue: string } | { ok: false; error: string; httpStatus: number } {
  const keyError = assertExactObjectKeys(body, G11C1_DRY_RUN_ALLOWED_KEYS);
  if (keyError) {
    return { ok: false, error: keyError, httpStatus: 422 };
  }
  const record = body as G11c1DryRunRequest;

  if (record.siteSlug !== G11C1_SITE_SLUG) {
    return { ok: false, error: `siteSlug must be ${G11C1_SITE_SLUG}`, httpStatus: 422 };
  }
  if (record.module !== G11C1_MODULE) {
    return { ok: false, error: `module must be ${G11C1_MODULE}`, httpStatus: 422 };
  }
  if (record.field !== G11C1_FIELD) {
    return { ok: false, error: `field must be ${G11C1_FIELD}`, httpStatus: 422 };
  }
  if (record.dryRun !== true) {
    return { ok: false, error: "dryRun must be true", httpStatus: 422 };
  }
  if (record.operationId !== G11C1_OPERATION_ID) {
    return { ok: false, error: `operationId must be ${G11C1_OPERATION_ID}`, httpStatus: 422 };
  }
  if (record.approvalId !== G11C1_APPROVAL_ID) {
    return { ok: false, error: `approvalId must be ${G11C1_APPROVAL_ID}`, httpStatus: 422 };
  }
  if (typeof record.nextValue !== "string") {
    return { ok: false, error: "nextValue must be a string", httpStatus: 422 };
  }

  return { ok: true, nextValue: record.nextValue };
}

/** Pure preview helper (no GitHub) — used by Save after runtime current is loaded. */
export function executeG11c1YoutubeUrlDryRun(input: {
  nextValue: string;
  current: { embedCode: string; videoId: string | null };
}) {
  const nextValue = String(input.nextValue ?? "").trim();
  const valueError = assertG11c1NextValueAllowed(nextValue);
  if (valueError) {
    return {
      ok: false,
      dryRun: true as const,
      wouldWrite: false as const,
      siteSlug: G11C1_SITE_SLUG,
      module: G11C1_MODULE,
      changedFields: [] as string[],
      error: valueError,
      errors: [valueError],
      saveReadiness: "guard_error",
      httpStatus: 422,
      didWrite: false as const,
      dbWrite: false as const,
      networkWrite: false as const,
    };
  }

  const plan = planYoutubeEmbedCodePatch({
    config: {
      siteSlug: G11C1_SITE_SLUG,
      items: [
        {
          id: GOSAKI_YOUTUBE_TARGET_ITEM_ID,
          published: true,
          embedCode: input.current.embedCode,
        },
      ],
    },
    nextEmbedCode: nextValue,
    enforceExpectedBefore: false,
  });

  if (!plan.ok) {
    return {
      ok: false,
      dryRun: true as const,
      wouldWrite: false as const,
      siteSlug: G11C1_SITE_SLUG,
      module: G11C1_MODULE,
      changedFields: [] as string[],
      error: plan.error,
      errors: [plan.error],
      saveReadiness: "guard_error",
      httpStatus: plan.httpStatus,
      didWrite: false as const,
      dbWrite: false as const,
      networkWrite: false as const,
      current: plan.current,
    };
  }

  return {
    ok: true,
    dryRun: true as const,
    wouldWrite: false as const,
    siteSlug: G11C1_SITE_SLUG,
    module: G11C1_MODULE,
    changedFields: plan.changedFields,
    noChange: plan.saveReadiness === "no_change",
    current: plan.current,
    next: plan.next,
    before: plan.current,
    after: plan.next,
    saveReadiness: plan.saveReadiness === "no_change" ? "no_change" : G11C1_SAVE_READINESS,
    didWrite: false as const,
    dbWrite: false as const,
    networkWrite: false as const,
    errors: [] as string[],
    httpStatus: 200,
  };
}

export async function handleG11c1YoutubeUrlDryRunBody(
  body: unknown,
  deps: YoutubeGithubRuntimeDeps = {},
) {
  const hostError = (deps.stagingHostCheck ?? assertGosakiYoutubeStagingSupabaseHost)();
  if (hostError) {
    return {
      ok: false,
      dryRun: true as const,
      wouldWrite: false as const,
      error: hostError,
      errors: [hostError],
      didWrite: false as const,
      dbWrite: false as const,
      networkWrite: false as const,
      saveReadiness: "forbidden_host",
      httpStatus: 403,
    };
  }

  const parsed = parseG11c1DryRunRequest(body);
  if (!parsed.ok) {
    return {
      ok: false,
      dryRun: true as const,
      wouldWrite: false as const,
      error: parsed.error,
      errors: [parsed.error],
      didWrite: false as const,
      dbWrite: false as const,
      networkWrite: false as const,
      saveReadiness: "invalid_input",
      httpStatus: parsed.httpStatus,
    };
  }

  const valueError = assertG11c1NextValueAllowed(parsed.nextValue);
  if (valueError) {
    return {
      ok: false,
      dryRun: true as const,
      wouldWrite: false as const,
      error: valueError,
      errors: [valueError],
      didWrite: false as const,
      dbWrite: false as const,
      networkWrite: false as const,
      saveReadiness: "invalid_input",
      httpStatus: 422,
    };
  }

  const loaded = await loadYoutubeEmbedJsonFromGithub({
    fetchImpl: deps.fetchImpl,
    auth: deps.auth,
  });
  if (!loaded.ok) {
    return {
      ok: false,
      dryRun: true as const,
      wouldWrite: false as const,
      error: loaded.error,
      errors: [loaded.error],
      didWrite: false as const,
      dbWrite: false as const,
      networkWrite: false as const,
      saveReadiness: "github_read_failed",
      httpStatus: loaded.httpStatus,
    };
  }

  const plan = planYoutubeEmbedCodePatch({
    config: loaded.config,
    nextEmbedCode: parsed.nextValue,
    enforceExpectedBefore: false,
  });
  if (!plan.ok) {
    return {
      ok: false,
      dryRun: true as const,
      wouldWrite: false as const,
      error: plan.error,
      errors: [plan.error],
      didWrite: false as const,
      dbWrite: false as const,
      networkWrite: false as const,
      saveReadiness: "guard_error",
      httpStatus: plan.httpStatus,
      current: plan.current,
      before: plan.current,
    };
  }

  const fingerprintObj = buildYoutubeSaveFingerprint({
    githubFileSha: loaded.file.sha,
    before: plan.current,
    after: plan.next,
  });
  const fingerprint = serializeYoutubeSaveFingerprint(fingerprintObj);
  const noChange = plan.saveReadiness === "no_change";

  return {
    ok: true,
    dryRun: true as const,
    operation: "dryRun" as const,
    wouldWrite: false as const,
    siteSlug: G11C1_SITE_SLUG,
    module: G11C1_MODULE,
    changedFields: plan.changedFields,
    noChange,
    current: plan.current,
    next: plan.next,
    before: plan.current,
    after: plan.next,
    currentFileSha: loaded.file.sha,
    targetFilePath: GOSAKI_YOUTUBE_GITHUB_FILE_PATH,
    targetItemId: GOSAKI_YOUTUBE_TARGET_ITEM_ID,
    branch: GOSAKI_YOUTUBE_GITHUB_BRANCH,
    fingerprint,
    fingerprintObject: fingerprintObj,
    saveReadiness: noChange ? "no_change" : G11C1_SAVE_READINESS,
    saveEnabled: false as const,
    didWrite: false as const,
    dbWrite: false as const,
    networkWrite: false as const,
    errors: [] as string[],
    httpStatus: 200,
  };
}
