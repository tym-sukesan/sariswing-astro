/**
 * G-20u36b — Gosaki Discography Edge dry-run endpoint inert implementation.
 * Deploy-inert · no HTTP server binding · no Supabase client · no network · no DB write · no privileged keys.
 * Local verifier only — not deployed to root supabase/functions/**.
 */

import {
  GOSAKI_DISCOGRAPHY_SAVE_SITE_SLUG,
  lookupDiscographySaveApprovalEntry,
} from "./gosaki-discography-save-approval-registry.mjs";
import {
  buildDiscographySaveDryRunEndpointResponse,
  buildSampleDiscographySaveDryRunCurrentSnapshot,
  buildSampleDiscographySaveDryRunEndpointRequest,
  DISCOGRAPHY_SAVE_DRY_RUN_ENDPOINT_OPERATION,
  GOSAKI_DISCOGRAPHY_SAVE_DRY_RUN_ENDPOINT_NAME,
  simulateDiscographySaveDryRunEndpoint,
} from "./gosaki-discography-save-dry-run-endpoint-draft.mjs";

export const G20U36B_EDGE_DRY_RUN_INERT_PHASE =
  "G-20u36b-edge-dry-run-endpoint-inert-implementation";

/** Allowed HTTP method for inert handler (POST equivalent). */
export const INERT_ALLOWED_HTTP_METHOD = "POST";

/** Allowed Content-Type for inert handler (application/json equivalent). */
export const INERT_ALLOWED_CONTENT_TYPE = "application/json";

/** Registered dry-run approval ID (G-20u32 registry). */
export const DRY_RUN_APPROVAL_ID = "G-20u31-gosaki-discography-save-dry-run-endpoint";

/** Registered save approval ID — must be rejected on dry-run endpoint. */
export const SAVE_APPROVAL_ID = "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice";

/**
 * @typedef {object} InertHttpInput
 * @property {string} [method]
 * @property {string} [contentType]
 * @property {Record<string, unknown>} [body]
 * @property {import("./gosaki-discography-save-dry-run-endpoint-draft.mjs").DiscographySaveDryRunCurrentSnapshot} [currentSnapshot]
 */

/**
 * Approval requirements returned on rejection (dry-run endpoint only).
 *
 * @returns {object}
 */
export function getDryRunApprovalRequirements() {
  const entry = lookupDiscographySaveApprovalEntry(DRY_RUN_APPROVAL_ID);
  return {
    operation: DISCOGRAPHY_SAVE_DRY_RUN_ENDPOINT_OPERATION,
    approvalId: DRY_RUN_APPROVAL_ID,
    siteSlug: GOSAKI_DISCOGRAPHY_SAVE_SITE_SLUG,
    endpoint: GOSAKI_DISCOGRAPHY_SAVE_DRY_RUN_ENDPOINT_NAME,
    humanConfirmationRequired: entry?.humanConfirmationRequired ?? true,
    description: entry?.description ?? "Server dry-run endpoint wiring (G-20u33+)",
  };
}

/**
 * Validate HTTP envelope (method + content-type + JSON body shape).
 *
 * @param {{ method?: string, contentType?: string, body?: unknown }} input
 * @returns {{ ok: boolean, errors: string[], status: number }}
 */
export function validateInertHttpEnvelope(input = {}) {
  /** @type {string[]} */
  const errors = [];
  const method = String(input.method ?? "").toUpperCase();
  const contentType = String(input.contentType ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  if (method !== INERT_ALLOWED_HTTP_METHOD) {
    errors.push(`HTTP method must be ${INERT_ALLOWED_HTTP_METHOD}`);
  }

  if (contentType !== INERT_ALLOWED_CONTENT_TYPE) {
    errors.push(`Content-Type must be ${INERT_ALLOWED_CONTENT_TYPE}`);
  }

  if (input.body != null && (typeof input.body !== "object" || Array.isArray(input.body))) {
    errors.push("request body must be a JSON object");
  }

  let status = 200;
  if (errors.length > 0) {
    status = method !== INERT_ALLOWED_HTTP_METHOD ? 405 : 415;
  }

  return { ok: errors.length === 0, errors, status };
}

/**
 * Validate approval ID is dry-run only (reject save approval IDs).
 *
 * @param {string} approvalId
 * @returns {{ ok: boolean, errors: string[], approvalRequirements: object }}
 */
export function validateDryRunEndpointApprovalId(approvalId) {
  /** @type {string[]} */
  const errors = [];
  const id = String(approvalId ?? "").trim();
  const approvalRequirements = getDryRunApprovalRequirements();

  if (!id) {
    errors.push("approvalId is required");
    return { ok: false, errors, approvalRequirements };
  }

  const entry = lookupDiscographySaveApprovalEntry(id);
  if (entry?.operation === "save") {
    errors.push("save approval ID is not accepted on dry-run endpoint");
  }

  return { ok: errors.length === 0, errors, approvalRequirements };
}

/**
 * Build inert rejection response (no write · includes approvalRequirements).
 *
 * @param {object} input
 * @param {string} [input.legacyId]
 * @param {string} [input.approvalId]
 * @param {string[]} input.errors
 * @param {string[]} [input.warnings]
 * @param {number} [input.status]
 * @param {object} [input.approvalRequirements]
 * @returns {object}
 */
export function buildInertRejectionResponse(input) {
  const base = buildDiscographySaveDryRunEndpointResponse({
    ok: false,
    legacyId: String(input.legacyId ?? ""),
    approvalId: String(input.approvalId ?? ""),
    wouldWrite: false,
    diff: {},
    changedCounts: {},
    errors: input.errors,
    warnings: input.warnings ?? [],
  });

  return {
    ...base,
    status: input.status ?? 400,
    approvalRequirements: input.approvalRequirements ?? getDryRunApprovalRequirements(),
  };
}

/**
 * Inert Edge dry-run handler — pure function, no HTTP server binding, no Supabase runtime.
 *
 * @param {InertHttpInput} input
 * @returns {object}
 */
export function handleDiscographyEdgeDryRunInert(input = {}) {
  const envelope = validateInertHttpEnvelope({
    method: input.method,
    contentType: input.contentType,
    body: input.body,
  });

  if (!envelope.ok) {
    return buildInertRejectionResponse({
      legacyId: "",
      approvalId: "",
      errors: envelope.errors,
      status: envelope.status,
    });
  }

  const request = /** @type {Record<string, unknown>} */ (input.body ?? {});

  if (request.operation === "save") {
    return buildInertRejectionResponse({
      legacyId: String(request.legacyId ?? ""),
      approvalId: String(request.approvalId ?? ""),
      errors: ['operation "save" is rejected by dry-run endpoint — use dryRun only'],
      status: 400,
    });
  }

  const approvalCheck = validateDryRunEndpointApprovalId(String(request.approvalId ?? ""));
  if (!approvalCheck.ok) {
    return buildInertRejectionResponse({
      legacyId: String(request.legacyId ?? ""),
      approvalId: String(request.approvalId ?? ""),
      errors: approvalCheck.errors,
      status: 400,
      approvalRequirements: approvalCheck.approvalRequirements,
    });
  }

  const result = simulateDiscographySaveDryRunEndpoint(
    request,
    input.currentSnapshot ?? {},
  );

  return {
    ...result,
    status: result.ok ? 200 : 400,
    ...(result.ok ? {} : { approvalRequirements: getDryRunApprovalRequirements() }),
  };
}

/**
 * Build sample inert HTTP input for verifiers (valid dryRun with diff).
 *
 * @returns {InertHttpInput}
 */
export function buildSampleInertDryRunInput() {
  return {
    method: INERT_ALLOWED_HTTP_METHOD,
    contentType: INERT_ALLOWED_CONTENT_TYPE,
    body: buildSampleDiscographySaveDryRunEndpointRequest(),
    currentSnapshot: buildSampleDiscographySaveDryRunCurrentSnapshot(),
  };
}

/**
 * Build sample inert HTTP input with no track changes (wouldWrite false).
 *
 * @returns {InertHttpInput}
 */
export function buildSampleInertNoChangeInput() {
  const snapshot = buildSampleDiscographySaveDryRunCurrentSnapshot();
  const body = buildSampleDiscographySaveDryRunEndpointRequest();
  return {
    method: INERT_ALLOWED_HTTP_METHOD,
    contentType: INERT_ALLOWED_CONTENT_TYPE,
    body: {
      ...body,
      tracksText: snapshot.tracksText,
    },
    currentSnapshot: snapshot,
  };
}
