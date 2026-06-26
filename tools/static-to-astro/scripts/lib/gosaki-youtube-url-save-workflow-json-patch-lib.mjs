/**
 * G-11c8 — Gosaki YouTube URL save workflow JSON patch library.
 * embedCode-only patch on gosaki-piano-youtube-embed.json — no videoId/published writes.
 */

import fs from "node:fs";
import path from "node:path";
import {
  GOSAKI_YOUTUBE_URL_SAVE_WORKFLOW_APPROVAL_IDS,
  GOSAKI_YOUTUBE_URL_SAVE_WORKFLOW_OPERATION_IDS,
} from "./gosaki-youtube-url-save-constants.mjs";
import {
  assertG11c1NextValueAllowed,
  parseYoutubeVideoId,
} from "./gosaki-youtube-url-dry-run-validation.mjs";

export const G11C8_CONFIG_REL = "tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json";
export const G11C8_SITE_SLUG = "gosaki-piano";
export const G11C8_MODULE = "youtube-embed";
export const G11C8_TARGET_ITEM_ID = "yt-placeholder-01";
export const G11C8_PATCH_FIELD = "embedCode";
export const G11C8_FORBIDDEN_PATCH_FIELDS = ["published", "sortOrder", "sectionTitle", "id"];

/**
 * @typedef {Object} G11c8WorkflowPatchInput
 * @property {string} siteSlug
 * @property {string} module
 * @property {string} itemId
 * @property {string} youtubeUrl
 * @property {string} expectedBeforeEmbedCode
 * @property {string} expectedBeforeVideoId
 * @property {string} approvalId
 * @property {string} operationId
 * @property {string} [requestId]
 * @property {string} [actorIdHash]
 */

/**
 * @param {unknown} raw
 * @returns {{ ok: true, input: G11c8WorkflowPatchInput } | { ok: false, error: string, saveReadiness: string }}
 */
export function parseG11c8WorkflowPatchInput(raw) {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "input must be an object", saveReadiness: "invalid_input" };
  }
  const record = /** @type {Record<string, unknown>} */ (raw);

  const siteSlug = String(record.site_slug ?? record.siteSlug ?? "").trim();
  const moduleName = String(record.module ?? "").trim();
  const itemId = String(record.item_id ?? record.itemId ?? "").trim();
  const youtubeUrl = String(record.youtube_url ?? record.youtubeUrl ?? "").trim();
  const expectedBeforeEmbedCode = String(
    record.expected_before_embed_code ?? record.expectedBeforeEmbedCode ?? "",
  ).trim();
  const expectedBeforeVideoId = String(
    record.expected_before_video_id ?? record.expectedBeforeVideoId ?? "",
  ).trim();
  const approvalId = String(record.approval_id ?? record.approvalId ?? "").trim();
  const operationId = String(record.operation_id ?? record.operationId ?? "").trim();

  if (siteSlug !== G11C8_SITE_SLUG) {
    return { ok: false, error: `site_slug must be ${G11C8_SITE_SLUG}`, saveReadiness: "invalid_input" };
  }
  if (moduleName !== G11C8_MODULE) {
    return { ok: false, error: `module must be ${G11C8_MODULE}`, saveReadiness: "invalid_input" };
  }
  if (itemId !== G11C8_TARGET_ITEM_ID) {
    return { ok: false, error: `item_id must be ${G11C8_TARGET_ITEM_ID}`, saveReadiness: "invalid_input" };
  }
  if (!GOSAKI_YOUTUBE_URL_SAVE_WORKFLOW_APPROVAL_IDS.includes(approvalId)) {
    return {
      ok: false,
      error: `approval_id must be one of: ${GOSAKI_YOUTUBE_URL_SAVE_WORKFLOW_APPROVAL_IDS.join(", ")}`,
      saveReadiness: "invalid_input",
    };
  }
  if (!GOSAKI_YOUTUBE_URL_SAVE_WORKFLOW_OPERATION_IDS.includes(operationId)) {
    return {
      ok: false,
      error: `operation_id must be one of: ${GOSAKI_YOUTUBE_URL_SAVE_WORKFLOW_OPERATION_IDS.join(", ")}`,
      saveReadiness: "invalid_input",
    };
  }
  if (!youtubeUrl) {
    return { ok: false, error: "youtube_url is required", saveReadiness: "invalid_input" };
  }
  if (!expectedBeforeEmbedCode) {
    return { ok: false, error: "expected_before_embed_code is required", saveReadiness: "invalid_input" };
  }
  if (!expectedBeforeVideoId) {
    return { ok: false, error: "expected_before_video_id is required", saveReadiness: "invalid_input" };
  }

  const urlError = assertG11c1NextValueAllowed(youtubeUrl);
  if (urlError) {
    return { ok: false, error: urlError, saveReadiness: "invalid_input" };
  }

  return {
    ok: true,
    input: {
      siteSlug,
      module: moduleName,
      itemId,
      youtubeUrl,
      expectedBeforeEmbedCode,
      expectedBeforeVideoId,
      approvalId,
      operationId,
      requestId: String(record.request_id ?? record.requestId ?? "").trim() || undefined,
      actorIdHash: String(record.actor_id_hash ?? record.actorIdHash ?? "").trim() || undefined,
    },
  };
}

/**
 * @param {string | null | undefined} value
 */
function normalizeVideoId(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  return parseYoutubeVideoId(trimmed) ?? (/^[a-zA-Z0-9_-]{11}$/.test(trimmed) ? trimmed : null);
}

/**
 * @param {unknown} config
 * @param {string} itemId
 */
export function findG11c8TargetItem(config, itemId = G11C8_TARGET_ITEM_ID) {
  if (!config || typeof config !== "object") return null;
  const items = /** @type {{ items?: unknown[] }} */ (config).items;
  if (!Array.isArray(items)) return null;
  return items.find((item) => item && typeof item === "object" && item.id === itemId) ?? null;
}

/**
 * @param {unknown} config
 */
export function readG11c8CurrentSnapshot(config) {
  const item = findG11c8TargetItem(config);
  if (!item || typeof item !== "object") {
    return null;
  }
  const record = /** @type {Record<string, unknown>} */ (item);
  const embedCode = String(record.embedCode ?? "").trim();
  const videoId = normalizeVideoId(record.videoId) ?? normalizeVideoId(embedCode);
  const published = record.published;
  return { embedCode, videoId, published };
}

/**
 * @param {G11c8WorkflowPatchInput} input
 * @param {unknown} config
 */
export function planG11c8EmbedCodePatch(input, config) {
  const parsedConfig = config;
  if (!parsedConfig || typeof parsedConfig !== "object") {
    return { ok: false, error: "config must be a JSON object", saveReadiness: "invalid_input" };
  }

  const root = /** @type {Record<string, unknown>} */ (parsedConfig);
  if (String(root.siteSlug ?? "").trim() !== G11C8_SITE_SLUG) {
    return { ok: false, error: `config siteSlug must be ${G11C8_SITE_SLUG}`, saveReadiness: "invalid_input" };
  }

  const current = readG11c8CurrentSnapshot(parsedConfig);
  if (!current) {
    return { ok: false, error: `target item ${G11C8_TARGET_ITEM_ID} not found`, saveReadiness: "invalid_input" };
  }

  if (current.embedCode !== input.expectedBeforeEmbedCode.trim()) {
    return {
      ok: false,
      error: "expected_before_embed_code does not match current embedCode",
      saveReadiness: "conflict",
      current,
    };
  }

  const expectedVid = normalizeVideoId(input.expectedBeforeVideoId);
  if (expectedVid !== current.videoId) {
    return {
      ok: false,
      error: "expected_before_video_id does not match current derived videoId",
      saveReadiness: "conflict",
      current,
    };
  }

  const nextEmbedCode = input.youtubeUrl.trim();
  const nextVideoId = normalizeVideoId(nextEmbedCode);
  if (!nextVideoId) {
    return { ok: false, error: "youtube_url videoId extraction failed", saveReadiness: "invalid_input" };
  }

  if (current.embedCode === nextEmbedCode) {
    return {
      ok: true,
      saveReadiness: "no_change",
      changedFields: [],
      current,
      next: { embedCode: nextEmbedCode, videoId: nextVideoId },
      patchedConfig: null,
    };
  }

  const patched = JSON.parse(JSON.stringify(parsedConfig));
  const target = findG11c8TargetItem(patched);
  if (!target || typeof target !== "object") {
    return { ok: false, error: "patch target missing", saveReadiness: "invalid_input" };
  }

  const before = { ...target };
  /** @type {Record<string, unknown>} */ (target).embedCode = nextEmbedCode;

  for (const key of G11C8_FORBIDDEN_PATCH_FIELDS) {
    if (before[key] !== target[key]) {
      return {
        ok: false,
        error: `forbidden field would change: ${key}`,
        saveReadiness: "invalid_input",
      };
    }
  }
  if ("videoId" in target && before.videoId !== target.videoId) {
    return {
      ok: false,
      error: "videoId must not be written to JSON",
      saveReadiness: "invalid_input",
    };
  }

  return {
    ok: true,
    saveReadiness: "changed",
    changedFields: [G11C8_PATCH_FIELD],
    current,
    next: { embedCode: nextEmbedCode, videoId: nextVideoId },
    patchedConfig: patched,
  };
}

/**
 * @param {string} configPath
 */
export function loadG11c8Config(configPath) {
  const raw = fs.readFileSync(configPath, "utf8");
  return JSON.parse(raw);
}

/**
 * @param {string} configPath
 * @param {G11c8WorkflowPatchInput} input
 * @param {{ apply?: boolean }} [options]
 */
export function runG11c8WorkflowJsonPatch(configPath, input, options = {}) {
  const parsed = parseG11c8WorkflowPatchInput(input);
  if (!parsed.ok) {
    return { exitCode: 1, result: parsed };
  }

  const config = loadG11c8Config(configPath);
  const plan = planG11c8EmbedCodePatch(parsed.input, config);
  if (!plan.ok) {
    const exitCode = plan.saveReadiness === "conflict" ? 2 : 1;
    return { exitCode, result: plan };
  }

  if (plan.saveReadiness === "no_change") {
    return { exitCode: 0, result: plan };
  }

  if (options.apply && plan.patchedConfig) {
    const serialized = `${JSON.stringify(plan.patchedConfig, null, 2)}\n`;
    fs.writeFileSync(configPath, serialized, "utf8");
    return {
      exitCode: 0,
      result: { ...plan, applied: true, configPath },
    };
  }

  return {
    exitCode: 0,
    result: { ...plan, applied: false, checkOnly: true, configPath },
  };
}

/**
 * Safe log payload — no emails, tokens, or full URLs in error banners.
 * @param {Record<string, unknown>} result
 */
export function formatG11c8PatchResultForLog(result) {
  return {
    ok: result.ok ?? false,
    saveReadiness: result.saveReadiness,
    changedFields: result.changedFields ?? [],
    error: result.error ? String(result.error).slice(0, 200) : undefined,
    requestId: result.requestId,
    applied: result.applied ?? false,
    checkOnly: result.checkOnly ?? false,
  };
}
