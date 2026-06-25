/**
 * G-11c1 — Gosaki YouTube URL dry-run validation (shared with local verifier).
 * Ported from gosaki-youtube-embed.ts + G-10c guards. No file writes.
 */

import {
  G11C1_APPROVAL_ID,
  G11C1_FIELD,
  G11C1_MODULE,
  G11C1_OPERATION_ID,
  G11C1_SAVE_READINESS,
  G11C1_SITE_SLUG,
} from "./gosaki-youtube-url-dry-run-constants.mjs";

const FORBIDDEN_INPUT_PATTERNS = [
  /javascript:/i,
  /data:/i,
  /<iframe/i,
  /<script/i,
  /<[^>]+>/,
  /on\w+\s*=/i,
];

/**
 * @param {string | null | undefined} input
 * @returns {string | null}
 */
export function parseYoutubeVideoId(input) {
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

/**
 * @param {string} nextValue
 * @returns {string | null}
 */
export function assertG11c1NextValueAllowed(nextValue) {
  const trimmed = String(nextValue ?? "").trim();
  if (!trimmed) {
    return "nextValue must not be empty";
  }
  for (const pattern of FORBIDDEN_INPUT_PATTERNS) {
    if (pattern.test(trimmed)) {
      return "nextValue contains forbidden HTML or script patterns";
    }
  }
  const videoId = parseYoutubeVideoId(trimmed);
  if (!videoId) {
    return "nextValue must be a valid YouTube URL, embed URL, or 11-char videoId";
  }
  return null;
}

/**
 * @param {unknown} body
 * @returns {{ ok: true, body: Record<string, unknown> } | { ok: false, error: string }}
 */
export function parseG11c1DryRunRequest(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "request body must be a JSON object" };
  }
  const record = /** @type {Record<string, unknown>} */ (body);

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

  return { ok: true, body: record };
}

/**
 * @param {{
 *   nextValue: string,
 *   current: { embedCode: string, videoId: string | null },
 * }} input
 */
export function executeG11c1YoutubeUrlDryRun(input) {
  const nextValue = String(input.nextValue ?? "").trim();
  const valueError = assertG11c1NextValueAllowed(nextValue);
  if (valueError) {
    return {
      ok: false,
      dryRun: true,
      wouldWrite: false,
      siteSlug: G11C1_SITE_SLUG,
      module: G11C1_MODULE,
      changedFields: [],
      error: valueError,
      saveReadiness: "guard_error",
    };
  }

  const nextVideoId = parseYoutubeVideoId(nextValue);
  const currentEmbed = String(input.current.embedCode ?? "").trim();
  const currentVideoId =
    input.current.videoId ?? parseYoutubeVideoId(currentEmbed);

  const current = {
    embedCode: currentEmbed,
    videoId: currentVideoId,
  };
  const next = {
    embedCode: nextValue,
    videoId: nextVideoId,
  };

  if (currentEmbed === nextValue) {
    return {
      ok: true,
      dryRun: true,
      wouldWrite: false,
      siteSlug: G11C1_SITE_SLUG,
      module: G11C1_MODULE,
      changedFields: [],
      noChange: true,
      current,
      next,
      saveReadiness: "no_change",
    };
  }

  /** @type {string[]} */
  const changedFields = [];
  if (currentEmbed !== nextValue) changedFields.push("embedCode");
  if (currentVideoId !== nextVideoId) changedFields.push("videoId");

  return {
    ok: true,
    dryRun: true,
    wouldWrite: false,
    siteSlug: G11C1_SITE_SLUG,
    module: G11C1_MODULE,
    changedFields,
    current,
    next,
    saveReadiness: G11C1_SAVE_READINESS,
  };
}

/**
 * Full request handler shape for local tests (mirrors Edge Function body).
 * @param {unknown} body
 * @param {{ embedCode: string, videoId?: string | null }} current
 */
export function handleG11c1YoutubeUrlDryRunRequest(body, current) {
  const parsed = parseG11c1DryRunRequest(body);
  if (!parsed.ok) {
    return { ok: false, dryRun: true, wouldWrite: false, error: parsed.error };
  }
  return executeG11c1YoutubeUrlDryRun({
    nextValue: String(parsed.body.nextValue),
    current: {
      embedCode: current.embedCode,
      videoId: current.videoId ?? parseYoutubeVideoId(current.embedCode),
    },
  });
}
