/**
 * G-20u34 — Gosaki Discography Save UI arm design (pure state module).
 * Design-only — no DB · no network · no fetch · no env mutation · no Supabase client.
 * executableSaveAllowed is ALWAYS false in this phase.
 */

import { GOSAKI_DISCOGRAPHY_SAVE_SITE_SLUG } from "./gosaki-discography-save-approval-registry.mjs";
import { GOSAKI_DISCOGRAPHY_SAVE_DRY_RUN_ENDPOINT_NAME } from "./gosaki-discography-save-dry-run-endpoint-draft.mjs";

export const G20U34_DISCOGRAPHY_SAVE_UI_ARM_PHASE =
  "G-20u34-gosaki-discography-save-ui-arm-design";

/** Allowed phase for G-20u34 — design preview only. */
export const DISCOGRAPHY_SAVE_UI_ALLOWED_PHASE = "designOnly";

/**
 * Proposed PUBLIC_* env gate names (documentation — not added in G-20u34).
 * Even if set in a future phase, G-20u34 module keeps executableSaveAllowed false.
 */
export const PROPOSED_GOSAKI_DISCOGRAPHY_SAVE_UI_GATES = Object.freeze({
  PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED: {
    purpose: "Master arm switch — Save UI visible but still gated",
    defaultValue: "false",
  },
  PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_ENDPOINT_ENABLED: {
    purpose: "Allow server dry-run / Save endpoint calls from admin",
    defaultValue: "false",
  },
  PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_REQUIRE_DRY_RUN: {
    purpose: "Require client + server dry-run PASS before Save button arms",
    defaultValue: "true",
  },
  PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_STAGING_ONLY: {
    purpose: "Hard block non-staging Save targets",
    defaultValue: "true",
  },
});

/** UI state labels for future phases. */
export const DISCOGRAPHY_SAVE_UI_STATES = Object.freeze([
  "disabled",
  "design-only-armed-preview",
  "server-dry-run-required",
  "approval-required",
  "blocked",
  "future-executable",
]);

/** Safety copy strings for admin UI (read-only display). */
export const DISCOGRAPHY_SAVE_UI_SAFETY_COPY = Object.freeze({
  saveDisabled: "Save disabled",
  dryRunOnly: "Dry-run only",
  noDbWrite: "No DB write",
  noNetworkWrite: "No network write",
  productionStop: "Production STOP (G-20j)",
  designOnly: "Save UI arm design — not executable",
});

/**
 * @typedef {object} DiscographySaveUiArmInput
 * @property {boolean} [clientDryRunPass]
 * @property {boolean} [serverDryRunPass]
 * @property {boolean} [approvalIdValid]
 * @property {boolean} [operatorAuthVerified]
 * @property {boolean} [edgeEndpointDeployed]
 * @property {boolean} [blockingWarnings]
 * @property {boolean} [rollbackPlanReady]
 * @property {boolean} [oneAlbumPlanApproved]
 * @property {boolean} [optimisticLockReady]
 * @property {string} [siteSlug]
 * @property {string} [approvalId]
 * @property {Record<string, string>} [env]
 */

/**
 * Build prerequisite checklist for Save UI arm (design / future gating).
 *
 * @param {DiscographySaveUiArmInput} [input]
 * @returns {Array<{ id: string, label: string, required: boolean, met: boolean, blocking: boolean }>}
 */
export function buildDiscographySaveUiGateChecklist(input = {}) {
  const siteSlug = String(input.siteSlug ?? GOSAKI_DISCOGRAPHY_SAVE_SITE_SLUG);
  const stagingOk = siteSlug === GOSAKI_DISCOGRAPHY_SAVE_SITE_SLUG;

  return [
    {
      id: "staging-only",
      label: `Staging only (siteSlug=${GOSAKI_DISCOGRAPHY_SAVE_SITE_SLUG})`,
      required: true,
      met: stagingOk,
      blocking: !stagingOk,
    },
    {
      id: "edge-dry-run-deployed",
      label: `Edge Function dry-run endpoint deployed (${GOSAKI_DISCOGRAPHY_SAVE_DRY_RUN_ENDPOINT_NAME})`,
      required: true,
      met: input.edgeEndpointDeployed === true,
      blocking: input.edgeEndpointDeployed !== true,
    },
    {
      id: "operator-auth",
      label: "Operator auth verified (Supabase session JWT)",
      required: true,
      met: input.operatorAuthVerified === true,
      blocking: input.operatorAuthVerified !== true,
    },
    {
      id: "approval-id",
      label: "Valid approvalId registered",
      required: true,
      met: input.approvalIdValid === true,
      blocking: input.approvalIdValid !== true,
    },
    {
      id: "client-dry-run",
      label: "Latest client dry-run PASS",
      required: true,
      met: input.clientDryRunPass === true,
      blocking: input.clientDryRunPass !== true,
    },
    {
      id: "server-dry-run",
      label: "Server dry-run PASS (wouldWrite reviewed)",
      required: true,
      met: input.serverDryRunPass === true,
      blocking: input.serverDryRunPass !== true,
    },
    {
      id: "no-blocking-warnings",
      label: "No blocking warnings",
      required: true,
      met: input.blockingWarnings !== true,
      blocking: input.blockingWarnings === true,
    },
    {
      id: "optimistic-lock",
      label: "expectedBeforeUpdatedAt / optimistic lock ready or deferred",
      required: false,
      met: input.optimisticLockReady === true,
      blocking: false,
    },
    {
      id: "rollback-plan",
      label: "Backup / rollback plan ready",
      required: true,
      met: input.rollbackPlanReady === true,
      blocking: input.rollbackPlanReady !== true,
    },
    {
      id: "one-album-plan",
      label: "One-album controlled Save plan approved (G-20u36)",
      required: true,
      met: input.oneAlbumPlanApproved === true,
      blocking: input.oneAlbumPlanApproved !== true,
    },
  ];
}

/**
 * Validate prerequisites — returns errors/warnings; never enables Save in G-20u34.
 *
 * @param {DiscographySaveUiArmInput} [input]
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function validateDiscographySaveUiArmPrerequisites(input = {}) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];
  const checklist = buildDiscographySaveUiGateChecklist(input);

  for (const item of checklist) {
    if (item.required && item.blocking) {
      errors.push(`prerequisite not met: ${item.label}`);
    }
  }

  if (input.approvalId && !input.approvalIdValid) {
    errors.push("approvalId is required and must be valid before Save can arm");
  }

  const env = input.env ?? {};
  for (const gateName of Object.keys(PROPOSED_GOSAKI_DISCOGRAPHY_SAVE_UI_GATES)) {
    if (env[gateName] === "true") {
      warnings.push(
        `${gateName}=true detected in input env — ignored in G-20u34 design phase (executableSaveAllowed stays false)`,
      );
    }
  }

  warnings.push("G-20u34: executableSaveAllowed is always false — design-only phase");

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Resolve Save UI arm state — G-20u34 always returns disabled / designOnly.
 *
 * @param {DiscographySaveUiArmInput} [input]
 * @returns {object}
 */
export function resolveDiscographySaveUiArmState(input = {}) {
  const checklist = buildDiscographySaveUiGateChecklist(input);
  const prerequisites = validateDiscographySaveUiArmPrerequisites(input);
  const unmetRequired = checklist.filter((item) => item.required && !item.met);

  /** @type {string} */
  let uiState = "disabled";
  if (input.env?.PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED === "true") {
    uiState = "design-only-armed-preview";
    // Still not executable in G-20u34
  } else if (unmetRequired.some((item) => item.id === "server-dry-run")) {
    uiState = "server-dry-run-required";
  } else if (unmetRequired.some((item) => item.id === "approval-id")) {
    uiState = "approval-required";
  } else if (unmetRequired.length > 0) {
    uiState = "blocked";
  }

  return {
    phase: G20U34_DISCOGRAPHY_SAVE_UI_ARM_PHASE,
    allowedPhase: DISCOGRAPHY_SAVE_UI_ALLOWED_PHASE,
    uiState,
    futureUiStateWhenAllMet: "future-executable",
    executableSaveAllowed: false,
    saveButtonDisabled: true,
    armButtonDisabled: true,
    dbWrite: false,
    networkWrite: false,
    fetchPostAllowed: false,
    edgeFunctionCallAllowed: false,
    productionAllowed: false,
    siteSlug: GOSAKI_DISCOGRAPHY_SAVE_SITE_SLUG,
    proposedGates: PROPOSED_GOSAKI_DISCOGRAPHY_SAVE_UI_GATES,
    safetyCopy: DISCOGRAPHY_SAVE_UI_SAFETY_COPY,
    checklist,
    prerequisites,
    unmetRequiredCount: unmetRequired.length,
    rollbackRequiredBeforeSave: true,
    readBackRequiredAfterSave: true,
    backupTokenOrJsonRequired: true,
    buttonBehavior: {
      thisPhase: "disabled-only",
      futureArmButton: "separate from Save — operator explicit",
      futureSaveButton: "requires server dry-run PASS + approval + explicit click",
    },
  };
}

/**
 * Sample input where all future gates would be met (still not executable in G-20u34).
 *
 * @returns {DiscographySaveUiArmInput}
 */
export function buildSampleDiscographySaveUiArmInputAllMet() {
  return {
    siteSlug: GOSAKI_DISCOGRAPHY_SAVE_SITE_SLUG,
    approvalId: "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice",
    clientDryRunPass: true,
    serverDryRunPass: true,
    approvalIdValid: true,
    operatorAuthVerified: true,
    edgeEndpointDeployed: true,
    blockingWarnings: false,
    rollbackPlanReady: true,
    oneAlbumPlanApproved: true,
    optimisticLockReady: true,
    env: {
      PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED: "true",
      PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_ENDPOINT_ENABLED: "true",
    },
  };
}

/**
 * Build design snapshot for docs / verifiers.
 *
 * @param {DiscographySaveUiArmInput} [input]
 * @returns {object}
 */
export function buildDiscographySaveUiArmDesignSnapshot(input = {}) {
  const state = resolveDiscographySaveUiArmState(input);
  return {
    phase: G20U34_DISCOGRAPHY_SAVE_UI_ARM_PHASE,
    generatedAt: "design-only",
    ...state,
  };
}
