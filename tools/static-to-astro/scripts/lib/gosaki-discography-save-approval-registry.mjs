/**
 * G-20u32 — Gosaki Discography Save approval ID registry (shape + policy only).
 * No approval state persistence · no DB write · no ID issuance at runtime.
 */

/** @typedef {"dryRun" | "save"} DiscographySaveOperation */

export const G20U32_DISCOGRAPHY_SAVE_APPROVAL_PHASE =
  "G-20u32-gosaki-discography-save-api-schema-approval-registry";

export const GOSAKI_DISCOGRAPHY_SAVE_APPROVAL_PREFIX = "GOSAKI_DISCOGRAPHY_SAVE";

/** Staging-only site slug for Gosaki Discography Save. */
export const GOSAKI_DISCOGRAPHY_SAVE_SITE_SLUG = "gosaki-piano";

/** Staging Supabase project ref (documentation / guard only). */
export const GOSAKI_DISCOGRAPHY_SAVE_STAGING_PROJECT_REF = "kmjqppxjdnwwrtaeqjta";

/** Default approval TTL when issued in a future phase (hours). */
export const GOSAKI_DISCOGRAPHY_SAVE_APPROVAL_TTL_HOURS = 24;

/**
 * Registered approval ID entries — definitions only, not issued tokens.
 * @type {ReadonlyArray<{
 *   approvalId: string;
 *   operation: DiscographySaveOperation;
 *   environment: "staging";
 *   siteSlug: "gosaki-piano";
 *   legacyIdRequired: boolean;
 *   humanConfirmationRequired: boolean;
 *   description: string;
 *   status: "registered" | "planned";
 * }>}
 */
export const GOSAKI_DISCOGRAPHY_SAVE_APPROVAL_REGISTRY = Object.freeze([
  Object.freeze({
    approvalId: "G-20u31-gosaki-discography-save-dry-run-endpoint",
    operation: "dryRun",
    environment: "staging",
    siteSlug: "gosaki-piano",
    legacyIdRequired: true,
    humanConfirmationRequired: true,
    description: "Server dry-run endpoint wiring (G-20u33+)",
    status: "planned",
  }),
  Object.freeze({
    approvalId: "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice",
    operation: "save",
    environment: "staging",
    siteSlug: "gosaki-piano",
    legacyIdRequired: true,
    humanConfirmationRequired: true,
    description: "First controlled Save — one album track list pilot",
    status: "planned",
  }),
]);

/** Machine-readable approval ID shape (G-20u32 registry prefix). */
export const GOSAKI_DISCOGRAPHY_SAVE_APPROVAL_ID_PATTERN =
  /^GOSAKI_DISCOGRAPHY_SAVE__[A-Z0-9_]+$/;

/** Human phase-style approval ID (G-20uXX-gosaki-discography-…). */
export const GOSAKI_DISCOGRAPHY_PHASE_APPROVAL_ID_PATTERN =
  /^G-20u\d+[a-z]?-gosaki-discography-[a-z0-9-]+$/;

/**
 * @typedef {object} ApprovalIdShapeInput
 * @property {string} approvalId
 * @property {DiscographySaveOperation} operation
 * @property {string} siteSlug
 * @property {string} legacyId
 * @property {string} [generatedAt]
 * @property {string} [expiresAt]
 */

/**
 * Validate approval ID shape and registry membership policy.
 * Does not issue, store, or verify expiry at runtime.
 *
 * @param {ApprovalIdShapeInput} input
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function validateApprovalIdShape(input) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  const approvalId = String(input?.approvalId ?? "").trim();
  const operation = input?.operation;
  const siteSlug = String(input?.siteSlug ?? "").trim();
  const legacyId = String(input?.legacyId ?? "").trim();

  if (!approvalId) {
    errors.push("approvalId is required");
  } else {
    const shapeOk =
      GOSAKI_DISCOGRAPHY_SAVE_APPROVAL_ID_PATTERN.test(approvalId) ||
      GOSAKI_DISCOGRAPHY_PHASE_APPROVAL_ID_PATTERN.test(approvalId);
    if (!shapeOk) {
      errors.push(
        "approvalId must match GOSAKI_DISCOGRAPHY_SAVE__* or G-20uXX-gosaki-discography-* pattern",
      );
    }
  }

  if (operation !== "dryRun" && operation !== "save") {
    errors.push('operation must be "dryRun" or "save"');
  }

  if (siteSlug !== GOSAKI_DISCOGRAPHY_SAVE_SITE_SLUG) {
    errors.push(`siteSlug must be "${GOSAKI_DISCOGRAPHY_SAVE_SITE_SLUG}"`);
  }

  if (!legacyId) {
    errors.push("legacyId is required for all Save operations");
  } else if (!/^discography-\d{3}$/.test(legacyId)) {
    warnings.push("legacyId should match discography-NNN pattern");
  }

  if (input?.generatedAt && input?.expiresAt) {
    const gen = Date.parse(input.generatedAt);
    const exp = Date.parse(input.expiresAt);
    if (Number.isNaN(gen) || Number.isNaN(exp)) {
      errors.push("generatedAt and expiresAt must be valid ISO-8601 when provided");
    } else if (exp <= gen) {
      errors.push("expiresAt must be after generatedAt");
    }
  }

  const registryEntry = GOSAKI_DISCOGRAPHY_SAVE_APPROVAL_REGISTRY.find(
    (entry) => entry.approvalId === approvalId,
  );
  if (approvalId && !registryEntry) {
    warnings.push("approvalId is not in GOSAKI_DISCOGRAPHY_SAVE_APPROVAL_REGISTRY (planned IDs only)");
  } else if (registryEntry && registryEntry.operation !== operation) {
    errors.push(`approvalId ${approvalId} is registered for operation "${registryEntry.operation}", not "${operation}"`);
  }

  if (registryEntry?.humanConfirmationRequired) {
    warnings.push("human operator confirmation required before Save execution");
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Lookup registry entry by approval ID (read-only).
 *
 * @param {string} approvalId
 */
export function lookupDiscographySaveApprovalEntry(approvalId) {
  return (
    GOSAKI_DISCOGRAPHY_SAVE_APPROVAL_REGISTRY.find((entry) => entry.approvalId === approvalId) ??
    null
  );
}

/**
 * Forbidden operations for G-20u32 — registry documents policy only.
 */
export const GOSAKI_DISCOGRAPHY_SAVE_APPROVAL_FORBIDDEN = Object.freeze([
  "approval state persistence (localStorage / DB / file)",
  "automatic approval ID issuance without operator",
  "production environment Save",
  "Save without prior server dry-run",
  "anon-key direct Supabase write",
  "service_role in browser",
]);
