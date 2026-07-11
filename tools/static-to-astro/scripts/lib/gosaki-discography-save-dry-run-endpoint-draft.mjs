/**
 * G-20u33 — Gosaki Discography Save dry-run endpoint draft (non-deployable).
 * Pure Node draft — non-deployable · no Supabase client · no network · no DB write · no privileged keys.
 */

import {
  GOSAKI_DISCOGRAPHY_SAVE_SITE_SLUG,
} from "./gosaki-discography-save-approval-registry.mjs";
import {
  assertDiscographySaveIsStagingOnly,
  assertNoBrowserServiceRole,
  validateDiscographySaveRequest,
} from "./gosaki-discography-save-schema.mjs";
import {
  parseDiscographyTrackListLines,
  validateDiscographyTrackListDryRun,
} from "./gosaki-staging-read-only-admin.mjs";

export const G20U33_DISCOGRAPHY_SAVE_DRY_RUN_ENDPOINT_PHASE =
  "G-20u33-gosaki-discography-save-dry-run-endpoint-draft";

/** Edge Function endpoint name (documentation — not deployed in G-20u33). */
export const GOSAKI_DISCOGRAPHY_SAVE_DRY_RUN_ENDPOINT_NAME = "gosaki-discography-save-dry-run";

/** Staging URL pattern (documentation only). */
export const GOSAKI_DISCOGRAPHY_SAVE_DRY_RUN_ENDPOINT_URL =
  "https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run";

/** Allowed operation for this endpoint draft. */
export const DISCOGRAPHY_SAVE_DRY_RUN_ENDPOINT_OPERATION = "dryRun";

/**
 * @typedef {object} DiscographySaveDryRunCurrentSnapshot
 * @property {string} [tracksText] Original track list from read-only SELECT (future)
 * @property {Record<string, unknown>} [release] Current release row (future)
 */

/**
 * Validate request for dry-run endpoint (operation must be dryRun).
 *
 * @param {Record<string, unknown>} request
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function validateDiscographySaveDryRunEndpointRequest(request) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  if (!request || typeof request !== "object") {
    return { ok: false, errors: ["request must be an object"], warnings: [] };
  }

  const operation = request.operation;
  if (operation === "save") {
    errors.push('operation "save" is rejected by dry-run endpoint — use dryRun only');
    return { ok: false, errors, warnings };
  }

  if (operation !== DISCOGRAPHY_SAVE_DRY_RUN_ENDPOINT_OPERATION) {
    errors.push(`operation must be "${DISCOGRAPHY_SAVE_DRY_RUN_ENDPOINT_OPERATION}"`);
  }

  const schemaResult = validateDiscographySaveRequest(request);
  errors.push(...schemaResult.errors);
  warnings.push(...schemaResult.warnings);

  const staging = assertDiscographySaveIsStagingOnly({ siteSlug: String(request.siteSlug ?? "") });
  errors.push(...staging.errors);
  warnings.push(...staging.warnings);

  const noServiceRole = assertNoBrowserServiceRole({ payload: request });
  errors.push(...noServiceRole.errors);

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Compare release metadata fields for wouldWrite detection.
 *
 * @param {Record<string, unknown>} before
 * @param {Record<string, unknown>} after
 * @returns {string[]}
 */
function diffReleaseFields(before, after) {
  /** @type {string[]} */
  const changed = [];
  const fields = [
    "title",
    "artist",
    "release_date",
    "label",
    "catalog_number",
    "published",
    "cover_image_url",
    "purchase_url",
    "streaming_url",
    "description",
  ];
  for (const field of fields) {
    const b = before?.[field] ?? null;
    const a = after?.[field] ?? null;
    if (String(b ?? "") !== String(a ?? "")) {
      changed.push(field);
    }
  }
  return changed;
}

/**
 * Find duplicate track titles.
 *
 * @param {string[]} lines
 * @returns {string[]}
 */
function findDuplicateTitles(lines) {
  const seen = new Set();
  /** @type {string[]} */
  const dupes = [];
  for (const line of lines) {
    if (seen.has(line)) {
      if (!dupes.includes(line)) dupes.push(line);
    } else {
      seen.add(line);
    }
  }
  return dupes;
}

/**
 * Build dry-run endpoint response object (no write).
 *
 * @param {object} input
 * @param {boolean} input.ok
 * @param {string} input.legacyId
 * @param {string} input.approvalId
 * @param {boolean} input.wouldWrite
 * @param {object} input.diff
 * @param {object} input.changedCounts
 * @param {string[]} [input.errors]
 * @param {string[]} [input.warnings]
 * @param {string} [input.serverTime]
 * @returns {object}
 */
export function buildDiscographySaveDryRunEndpointResponse(input) {
  return {
    ok: input.ok,
    operation: DISCOGRAPHY_SAVE_DRY_RUN_ENDPOINT_OPERATION,
    endpoint: GOSAKI_DISCOGRAPHY_SAVE_DRY_RUN_ENDPOINT_NAME,
    siteSlug: GOSAKI_DISCOGRAPHY_SAVE_SITE_SLUG,
    legacyId: input.legacyId,
    approvalId: input.approvalId,
    wouldWrite: input.wouldWrite,
    didWrite: false,
    dbWrite: false,
    networkWrite: false,
    saveEnabled: false,
    changedCounts: input.changedCounts,
    diff: input.diff,
    backupToken: null,
    backupPreview: null,
    errors: input.errors ?? [],
    warnings: input.warnings ?? [],
    readBack: null,
    serverTime: input.serverTime ?? new Date().toISOString(),
  };
}

/**
 * Simulate dry-run endpoint handler (no DB · no network).
 * Pass `currentSnapshot` to simulate server-side read-only baseline; omit for schema-only dry-run.
 *
 * @param {Record<string, unknown>} request
 * @param {DiscographySaveDryRunCurrentSnapshot} [currentSnapshot]
 * @returns {object}
 */
export function simulateDiscographySaveDryRunEndpoint(request, currentSnapshot = {}) {
  const validation = validateDiscographySaveDryRunEndpointRequest(request);
  const legacyId = String(request?.legacyId ?? "");
  const approvalId = String(request?.approvalId ?? "");

  if (!validation.ok) {
    return buildDiscographySaveDryRunEndpointResponse({
      ok: false,
      legacyId,
      approvalId,
      wouldWrite: false,
      diff: {},
      changedCounts: {},
      errors: validation.errors,
      warnings: validation.warnings,
    });
  }

  /** @type {string[]} */
  const warnings = [...validation.warnings];
  const tracksText = String(request.tracksText ?? "");
  const release = /** @type {Record<string, unknown>} */ (request.release ?? {});
  const trackPolicy = /** @type {Record<string, unknown>} */ (
    request.trackPolicy ?? { allowDuplicateTitles: true, allowEmptyTrackList: false }
  );

  const afterLines = parseDiscographyTrackListLines(tracksText);
  const beforeText = String(currentSnapshot.tracksText ?? "");
  const beforeLines = parseDiscographyTrackListLines(beforeText);

  const trackDiff = validateDiscographyTrackListDryRun(beforeText, tracksText, {
    legacyId,
    title: String(release.title ?? ""),
  });

  const dupes = findDuplicateTitles(afterLines);
  if (dupes.length > 0) {
    warnings.push(`duplicate track titles: ${dupes.join(", ")}`);
  }

  if (afterLines.length === 0 && trackPolicy.allowEmptyTrackList !== true) {
    return buildDiscographySaveDryRunEndpointResponse({
      ok: false,
      legacyId,
      approvalId,
      wouldWrite: false,
      diff: trackDiff,
      changedCounts: {
        releaseFields: [],
        tracksAdded: 0,
        tracksRemoved: 0,
        tracksReordered: false,
      },
      errors: ["empty track list blocked (allowEmptyTrackList must be true to override)"],
      warnings,
    });
  }

  const currentRelease = /** @type {Record<string, unknown>} */ (currentSnapshot.release ?? {});
  const releaseFieldsChanged = diffReleaseFields(currentRelease, release);

  const tracksChanged =
    trackDiff.added.length > 0 ||
    trackDiff.removed.length > 0 ||
    trackDiff.reordered ||
    trackDiff.changedLines.length > 0;

  const hasCurrentBaseline = Boolean(currentSnapshot.tracksText != null || currentSnapshot.release);
  const wouldWrite = hasCurrentBaseline
    ? tracksChanged || releaseFieldsChanged.length > 0
    : afterLines.length > 0 || releaseFieldsChanged.length > 0;

  return buildDiscographySaveDryRunEndpointResponse({
    ok: true,
    legacyId,
    approvalId,
    wouldWrite,
    diff: {
      totalBefore: trackDiff.totalBefore,
      totalAfter: trackDiff.totalAfter,
      added: trackDiff.added,
      removed: trackDiff.removed,
      unchanged: trackDiff.unchanged,
      changedLines: trackDiff.changedLines,
      reordered: trackDiff.reordered,
      releaseFieldsChanged,
    },
    changedCounts: {
      releaseFields: releaseFieldsChanged,
      tracksAdded: trackDiff.added.length,
      tracksRemoved: trackDiff.removed.length,
      tracksReordered: trackDiff.reordered,
    },
    errors: [],
    warnings,
  });
}

/**
 * Build sample dry-run endpoint request for verifiers.
 *
 * @returns {object}
 */
export function buildSampleDiscographySaveDryRunEndpointRequest() {
  return {
    operation: DISCOGRAPHY_SAVE_DRY_RUN_ENDPOINT_OPERATION,
    siteSlug: GOSAKI_DISCOGRAPHY_SAVE_SITE_SLUG,
    legacyId: "discography-002",
    approvalId: "G-20u31-gosaki-discography-save-dry-run-endpoint",
    expectedBeforeUpdatedAt: null,
    release: {
      title: "Continuous",
      artist: "ごさきりかこTrio Feat.石川周之介",
      release_date: "2023-07-26",
      label: null,
      catalog_number: "GSRT-0002",
      published: true,
      cover_image_url: "https://example.test/cover.png",
      purchase_url: "https://gosakirikako.base.shop/",
      streaming_url: null,
      description: "personnel notes…",
    },
    tracksText: "Nature Boy\nWaters Of March\nNew Track\n",
    trackPolicy: {
      oneLineOneTrack: true,
      blankLinesIgnored: true,
      allowDuplicateTitles: true,
      allowEmptyTrackList: false,
    },
    clientDryRun: {
      totalBefore: 8,
      totalAfter: 9,
      added: ["New Track"],
      removed: [],
      reordered: false,
      wouldWrite: false,
    },
  };
}

/**
 * Build sample current snapshot for simulation tests.
 *
 * @returns {DiscographySaveDryRunCurrentSnapshot}
 */
export function buildSampleDiscographySaveDryRunCurrentSnapshot() {
  return {
    tracksText: "Nature Boy\nWaters Of March\n",
    release: {
      title: "Continuous",
      artist: "ごさきりかこTrio Feat.石川周之介",
      release_date: "2023-07-26",
      label: null,
      catalog_number: "GSRT-0002",
      published: true,
      cover_image_url: "https://example.test/cover.png",
      purchase_url: "https://gosakirikako.base.shop/",
      streaming_url: null,
      description: "personnel notes…",
    },
  };
}
