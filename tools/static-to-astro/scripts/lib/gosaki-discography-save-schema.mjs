/**
 * G-20u32 — Gosaki Discography Save API request/response schema + validation helpers.
 * Design / verifier only — no DB · no network · no Supabase client · no Save execution.
 */

import {
  GOSAKI_DISCOGRAPHY_SAVE_SITE_SLUG,
  GOSAKI_DISCOGRAPHY_SAVE_STAGING_PROJECT_REF,
  validateApprovalIdShape,
} from "./gosaki-discography-save-approval-registry.mjs";
import { parseDiscographyTrackListLines } from "./gosaki-staging-read-only-admin.mjs";

export const G20U32_DISCOGRAPHY_SAVE_SCHEMA_PHASE =
  "G-20u32-gosaki-discography-save-api-schema-approval-registry";

/** @typedef {"dryRun" | "save"} DiscographySaveOperation */

/** Allowed operations for Save API contract. */
export const DISCOGRAPHY_SAVE_OPERATIONS = Object.freeze(["dryRun", "save"]);

/** Default track policy for Save requests. */
export const DEFAULT_DISCOGRAPHY_SAVE_TRACK_POLICY = Object.freeze({
  oneLineOneTrack: true,
  blankLinesIgnored: true,
  allowDuplicateTitles: true,
  allowEmptyTrackList: false,
});

/** Release metadata field names (snake_case — DB aligned). */
export const DISCOGRAPHY_SAVE_RELEASE_FIELDS = Object.freeze([
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
]);

/** Request schema shape keys (documentation + validation). */
export const DISCOGRAPHY_SAVE_REQUEST_SCHEMA_KEYS = Object.freeze([
  "operation",
  "siteSlug",
  "legacyId",
  "approvalId",
  "expectedBeforeUpdatedAt",
  "release",
  "tracksText",
  "trackPolicy",
  "clientDryRun",
]);

/** Response schema shape keys (documentation + validation). */
export const DISCOGRAPHY_SAVE_RESPONSE_SCHEMA_KEYS = Object.freeze([
  "ok",
  "operation",
  "siteSlug",
  "legacyId",
  "approvalId",
  "wouldWrite",
  "didWrite",
  "changedCounts",
  "diff",
  "backupToken",
  "errors",
  "warnings",
  "readBack",
  "serverTime",
]);

/** Production Supabase refs that must never receive Save writes. */
export const DISCOGRAPHY_SAVE_FORBIDDEN_PROJECT_REFS = Object.freeze([
  "production-blocked",
]);

/**
 * Build a sample valid dry-run request for verifiers / docs.
 *
 * @returns {object}
 */
export function buildSampleDiscographySaveDryRunRequest() {
  return {
    operation: "dryRun",
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
    tracksText: "Nature Boy\nWaters Of March\n",
    trackPolicy: { ...DEFAULT_DISCOGRAPHY_SAVE_TRACK_POLICY },
    clientDryRun: {
      totalBefore: 8,
      totalAfter: 8,
      added: [],
      removed: [],
      reordered: false,
      wouldWrite: false,
    },
  };
}

/**
 * Build a sample valid dry-run response (no write executed).
 *
 * @returns {object}
 */
export function buildSampleDiscographySaveDryRunResponse() {
  return {
    ok: true,
    operation: "dryRun",
    siteSlug: GOSAKI_DISCOGRAPHY_SAVE_SITE_SLUG,
    legacyId: "discography-002",
    approvalId: "G-20u31-gosaki-discography-save-dry-run-endpoint",
    wouldWrite: true,
    didWrite: false,
    changedCounts: {
      releaseFields: [],
      tracksAdded: 0,
      tracksRemoved: 0,
      tracksReordered: false,
    },
    diff: {
      totalBefore: 8,
      totalAfter: 8,
      added: [],
      removed: [],
      unchanged: 8,
      reordered: false,
    },
    backupToken: null,
    errors: [],
    warnings: [],
    readBack: null,
    serverTime: "2026-07-11T09:36:00.000Z",
  };
}

/**
 * Assert Save target is staging-only (no production).
 *
 * @param {{ siteSlug?: string, projectRef?: string }} ctx
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function assertDiscographySaveIsStagingOnly(ctx = {}) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  const siteSlug = String(ctx.siteSlug ?? "").trim();
  const projectRef = String(ctx.projectRef ?? "").trim();

  if (siteSlug && siteSlug !== GOSAKI_DISCOGRAPHY_SAVE_SITE_SLUG) {
    errors.push(`Save is staging-only; siteSlug must be "${GOSAKI_DISCOGRAPHY_SAVE_SITE_SLUG}"`);
  }

  if (projectRef && projectRef !== GOSAKI_DISCOGRAPHY_SAVE_STAGING_PROJECT_REF) {
    if (DISCOGRAPHY_SAVE_FORBIDDEN_PROJECT_REFS.includes(projectRef) || /prod/i.test(projectRef)) {
      errors.push("production Supabase project is forbidden for Discography Save");
    } else {
      warnings.push(`unexpected projectRef "${projectRef}" — expected staging ${GOSAKI_DISCOGRAPHY_SAVE_STAGING_PROJECT_REF}`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Reject service_role exposure in browser/admin static context.
 *
 * @param {{ env?: Record<string, string>, payload?: Record<string, unknown> }} ctx
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function assertNoBrowserServiceRole(ctx = {}) {
  /** @type {string[]} */
  const errors = [];
  const env = ctx.env ?? {};
  const payload = ctx.payload ?? {};

  for (const [key, value] of Object.entries(env)) {
    if (/service.?role/i.test(key) && value) {
      errors.push(`service_role must not appear in browser env (${key})`);
    }
  }

  const serialized = JSON.stringify(payload);
  if (/service_role/i.test(serialized)) {
    errors.push("service_role must not appear in Save request/response payload exposed to browser");
  }

  return { ok: errors.length === 0, errors, warnings: [] };
}

/**
 * Validate release metadata object.
 *
 * @param {Record<string, unknown>} release
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
function validateReleaseObject(release) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  if (!release || typeof release !== "object" || Array.isArray(release)) {
    errors.push("release must be an object");
    return { ok: false, errors, warnings };
  }

  for (const field of DISCOGRAPHY_SAVE_RELEASE_FIELDS) {
    if (!(field in release)) {
      errors.push(`release.${field} is required`);
    }
  }

  if (typeof release.title !== "string" || !release.title.trim()) {
    errors.push("release.title must be a non-empty string");
  }

  if (typeof release.artist !== "string" || !release.artist.trim()) {
    errors.push("release.artist must be a non-empty string");
  }

  if (typeof release.published !== "boolean") {
    errors.push("release.published must be boolean");
  }

  if (release.release_date != null && typeof release.release_date !== "string") {
    errors.push("release.release_date must be string or null");
  }

  for (const urlField of ["cover_image_url", "purchase_url", "streaming_url"]) {
    const val = release[urlField];
    if (val != null && typeof val !== "string") {
      errors.push(`release.${urlField} must be string or null`);
    }
  }

  if (typeof release.description === "string" && release.description.length > 10000) {
    warnings.push("release.description exceeds recommended 10000 chars");
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Validate trackPolicy object.
 *
 * @param {Record<string, unknown>} trackPolicy
 */
function validateTrackPolicy(trackPolicy) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  if (!trackPolicy || typeof trackPolicy !== "object") {
    errors.push("trackPolicy must be an object");
    return { ok: false, errors, warnings };
  }

  if (trackPolicy.oneLineOneTrack !== true) {
    errors.push("trackPolicy.oneLineOneTrack must be true");
  }
  if (trackPolicy.blankLinesIgnored !== true) {
    errors.push("trackPolicy.blankLinesIgnored must be true");
  }
  if (typeof trackPolicy.allowDuplicateTitles !== "boolean") {
    errors.push("trackPolicy.allowDuplicateTitles must be boolean");
  }
  if (typeof trackPolicy.allowEmptyTrackList !== "boolean") {
    errors.push("trackPolicy.allowEmptyTrackList must be boolean");
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Validate clientDryRun snapshot from browser (must not claim write).
 *
 * @param {Record<string, unknown>} clientDryRun
 */
function validateClientDryRun(clientDryRun) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  if (!clientDryRun || typeof clientDryRun !== "object") {
    errors.push("clientDryRun must be an object");
    return { ok: false, errors, warnings };
  }

  for (const key of ["totalBefore", "totalAfter"]) {
    if (typeof clientDryRun[key] !== "number" || clientDryRun[key] < 0) {
      errors.push(`clientDryRun.${key} must be a non-negative number`);
    }
  }

  for (const key of ["added", "removed"]) {
    if (!Array.isArray(clientDryRun[key])) {
      errors.push(`clientDryRun.${key} must be an array`);
    }
  }

  if (typeof clientDryRun.reordered !== "boolean") {
    errors.push("clientDryRun.reordered must be boolean");
  }

  if (clientDryRun.wouldWrite !== false) {
    errors.push("clientDryRun.wouldWrite must be false (browser never writes)");
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Validate Discography Save API request payload (schema only).
 *
 * @param {Record<string, unknown>} request
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function validateDiscographySaveRequest(request) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  if (!request || typeof request !== "object") {
    return { ok: false, errors: ["request must be an object"], warnings: [] };
  }

  const operation = request.operation;
  if (!DISCOGRAPHY_SAVE_OPERATIONS.includes(/** @type {string} */ (operation))) {
    errors.push('operation must be "dryRun" or "save"');
  }

  const staging = assertDiscographySaveIsStagingOnly({ siteSlug: String(request.siteSlug ?? "") });
  errors.push(...staging.errors);
  warnings.push(...staging.warnings);

  const legacyId = String(request.legacyId ?? "").trim();
  if (!legacyId) {
    errors.push("legacyId is required");
  }

  const approval = validateApprovalIdShape({
    approvalId: String(request.approvalId ?? ""),
    operation: /** @type {import("./gosaki-discography-save-approval-registry.mjs").DiscographySaveOperation} */ (
      operation
    ),
    siteSlug: String(request.siteSlug ?? ""),
    legacyId,
  });
  errors.push(...approval.errors);
  warnings.push(...approval.warnings);

  if (request.expectedBeforeUpdatedAt != null && typeof request.expectedBeforeUpdatedAt !== "string") {
    errors.push("expectedBeforeUpdatedAt must be string or null");
  }

  const releaseResult = validateReleaseObject(/** @type {Record<string, unknown>} */ (request.release));
  errors.push(...releaseResult.errors);
  warnings.push(...releaseResult.warnings);

  if (typeof request.tracksText !== "string") {
    errors.push("tracksText must be a string");
  } else {
    const trackPolicy = /** @type {Record<string, unknown>} */ (request.trackPolicy ?? {});
    const policyResult = validateTrackPolicy(trackPolicy);
    errors.push(...policyResult.errors);
    warnings.push(...policyResult.warnings);

    const lines = parseDiscographyTrackListLines(request.tracksText);
    if (lines.length === 0 && trackPolicy.allowEmptyTrackList !== true) {
      errors.push("empty track list blocked (trackPolicy.allowEmptyTrackList must be true to override)");
    }

    if (lines.length > 0) {
      const dupes = findDuplicateTitles(lines);
      if (dupes.length > 0 && trackPolicy.allowDuplicateTitles !== true) {
        errors.push(`duplicate track titles not allowed: ${dupes.join(", ")}`);
      } else if (dupes.length > 0) {
        warnings.push(`duplicate track titles: ${dupes.join(", ")}`);
      }

      for (const line of lines) {
        if (line.length > 500) {
          errors.push("track title exceeds 500 characters");
          break;
        }
        if (/[<>]/.test(line)) {
          errors.push("track titles must not contain < or >");
          break;
        }
      }
    }
  }

  const clientDryRun = validateClientDryRun(
    /** @type {Record<string, unknown>} */ (request.clientDryRun ?? {}),
  );
  errors.push(...clientDryRun.errors);
  warnings.push(...clientDryRun.warnings);

  if (operation === "save") {
    warnings.push("operation save accepted by schema only — didWrite remains false until Edge Function phase");
  }

  const noServiceRole = assertNoBrowserServiceRole({ payload: request });
  errors.push(...noServiceRole.errors);

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Validate Discography Save API response payload (schema only).
 * G-20u32: operation save must still have didWrite false (not implemented).
 *
 * @param {Record<string, unknown>} response
 * @param {{ allowDidWrite?: boolean }} [options]
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function validateDiscographySaveResponse(response, options = {}) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  if (!response || typeof response !== "object") {
    return { ok: false, errors: ["response must be an object"], warnings: [] };
  }

  if (typeof response.ok !== "boolean") {
    errors.push("ok must be boolean");
  }

  if (!DISCOGRAPHY_SAVE_OPERATIONS.includes(/** @type {string} */ (response.operation))) {
    errors.push('operation must be "dryRun" or "save"');
  }

  const staging = assertDiscographySaveIsStagingOnly({ siteSlug: String(response.siteSlug ?? "") });
  errors.push(...staging.errors);
  warnings.push(...staging.warnings);

  if (typeof response.wouldWrite !== "boolean") {
    errors.push("wouldWrite must be boolean");
  }

  if (typeof response.didWrite !== "boolean") {
    errors.push("didWrite must be boolean");
  } else if (response.didWrite === true && !options.allowDidWrite) {
    errors.push("didWrite must be false in G-20u32 schema phase (Save not implemented)");
  }

  if (response.operation === "dryRun" && response.didWrite === true) {
    errors.push("dryRun operation must have didWrite false");
  }

  if (response.operation === "save" && response.didWrite === true && !options.allowDidWrite) {
    errors.push("save operation didWrite true blocked in G-20u32 (Edge Function not implemented)");
  }

  if (!response.changedCounts || typeof response.changedCounts !== "object") {
    errors.push("changedCounts must be an object");
  }

  if (!response.diff || typeof response.diff !== "object") {
    errors.push("diff must be an object");
  }

  if (!Array.isArray(response.errors)) {
    errors.push("errors must be an array");
  }

  if (!Array.isArray(response.warnings)) {
    errors.push("warnings must be an array");
  }

  if (response.backupToken != null && typeof response.backupToken !== "string") {
    errors.push("backupToken must be string or null");
  }

  if (response.serverTime != null && typeof response.serverTime !== "string") {
    errors.push("serverTime must be ISO-8601 string");
  }

  const noServiceRole = assertNoBrowserServiceRole({ payload: response });
  errors.push(...noServiceRole.errors);

  return { ok: errors.length === 0, errors, warnings };
}

/**
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
