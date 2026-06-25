/**
 * G-11c1 — Gosaki YouTube URL dry-run validation (Edge Function shared).
 */

import { GOSAKI_YOUTUBE_STAGING_CURRENT } from "./gosaki-youtube-staging-current.ts";

export const G11C1_OPERATION_ID = "G-11c1-gosaki-youtube-url-web-save-dry-run-poc";
export const G11C1_APPROVAL_ID = "G-11c1-youtube-url-dry-run";
export const G11C1_SITE_SLUG = "gosaki-piano";
export const G11C1_MODULE = "youtube-embed";
export const G11C1_FIELD = "embedCode";
export const G11C1_SAVE_READINESS = "dry_run_only_ready";

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
): { ok: true; nextValue: string } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "request body must be a JSON object" };
  }
  const record = body as G11c1DryRunRequest;

  if (record.siteSlug !== G11C1_SITE_SLUG) {
    return { ok: false, error: `siteSlug must be ${G11C1_SITE_SLUG}` };
  }
  if (record.module !== G11C1_MODULE) {
    return { ok: false, error: `module must be ${G11C1_MODULE}` };
  }
  if (record.field !== G11C1_FIELD) {
    return { ok: false, error: `field must be ${G11C1_FIELD}` };
  }
  if (record.dryRun !== true) {
    return { ok: false, error: "dryRun must be true" };
  }
  if (record.operationId !== G11C1_OPERATION_ID) {
    return { ok: false, error: `operationId must be ${G11C1_OPERATION_ID}` };
  }
  if (record.approvalId !== G11C1_APPROVAL_ID) {
    return { ok: false, error: `approvalId must be ${G11C1_APPROVAL_ID}` };
  }
  if (typeof record.nextValue !== "string") {
    return { ok: false, error: "nextValue must be a string" };
  }

  return { ok: true, nextValue: record.nextValue };
}

export function resolveGosakiYoutubeStagingCurrent() {
  return { ...GOSAKI_YOUTUBE_STAGING_CURRENT };
}

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
      saveReadiness: "guard_error",
    };
  }

  const nextVideoId = parseYoutubeVideoId(nextValue);
  const currentEmbed = String(input.current.embedCode ?? "").trim();
  const currentVideoId = input.current.videoId ?? parseYoutubeVideoId(currentEmbed);

  const current = { embedCode: currentEmbed, videoId: currentVideoId };
  const next = { embedCode: nextValue, videoId: nextVideoId };

  if (currentEmbed === nextValue) {
    return {
      ok: true,
      dryRun: true as const,
      wouldWrite: false as const,
      siteSlug: G11C1_SITE_SLUG,
      module: G11C1_MODULE,
      changedFields: [] as string[],
      noChange: true,
      current,
      next,
      saveReadiness: "no_change",
    };
  }

  const changedFields: string[] = [];
  if (currentEmbed !== nextValue) changedFields.push("embedCode");
  if (currentVideoId !== nextVideoId) changedFields.push("videoId");

  return {
    ok: true,
    dryRun: true as const,
    wouldWrite: false as const,
    siteSlug: G11C1_SITE_SLUG,
    module: G11C1_MODULE,
    changedFields,
    current,
    next,
    saveReadiness: G11C1_SAVE_READINESS,
  };
}

export function handleG11c1YoutubeUrlDryRunBody(body: unknown) {
  const parsed = parseG11c1DryRunRequest(body);
  if (!parsed.ok) {
    return { ok: false, dryRun: true, wouldWrite: false, error: parsed.error };
  }
  const current = resolveGosakiYoutubeStagingCurrent();
  return executeG11c1YoutubeUrlDryRun({
    nextValue: parsed.nextValue,
    current: { embedCode: current.embedCode, videoId: current.videoId },
  });
}
