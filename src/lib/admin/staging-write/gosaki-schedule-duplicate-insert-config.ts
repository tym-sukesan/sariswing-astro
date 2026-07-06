/**
 * G-22d1 — Gosaki Schedule duplicate INSERT config (staging shell; single slice).
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "../staging-data/staging-schedule-site-slug-config";
import {
  evaluateStagingProjectAllowlist,
  evaluateSupabaseHostGate,
} from "../staging-data/staging-schedule-site-slug-host-gate";
import { collectOtherRegistryEnvArmFailures } from "../staging-data/staging-schedule-single-text-field-operational-registry";
import {
  SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED_ENV,
} from "./schedule-general-edit-config";
import { collectG13c1EventAPocCleanupArmOffFailures } from "./gosaki-schedule-event-a-poc-cleanup-config";
import { collectG13c2EventBPocCleanupArmOffFailures } from "./gosaki-schedule-event-b-poc-cleanup-config";
import {
  GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED_ENV,
} from "./gosaki-schedule-existing-event-save-button-config";
import { collectG14b1aPracticalEditArmOffFailures } from "./gosaki-schedule-routine-edit-practical-save-enablement-config";
import {
  SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED_ENV,
} from "../staging-data/staging-schedule-site-slug-config";
import {
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
} from "./schedule-non-dry-run-poc-config";
import { G22D_SCHEDULE_DUPLICATE_INSERT_NON_DRY_RUN_APPROVAL_ID } from "./schedule-write-types";

export const G22D1_PHASE = "G-22d1-gosaki-schedule-duplicate-insert-implementation";

export const GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED";

export const G22D_DUPLICATE_INSERT_SOURCE_ID =
  "eb1f1898-5107-4deb-a6d5-a792e0ec3f69";

export const G22D_DUPLICATE_INSERT_SOURCE_LEGACY_ID = "schedule-2026-03-003";

export const G22D_DUPLICATE_INSERT_SOURCE_TITLE = "<Live & Session>";

export const G22D_DUPLICATE_INSERT_PLANNED_LEGACY_ID = "schedule-2026-03-014";

/** Live staging 2026-03 max(sort_order)=60 (G-22d3a) → max+10. */
export const G22D_DUPLICATE_INSERT_PLANNED_SORT_ORDER = 70;

export const G22D_DUPLICATE_INSERT_EXPECTED_TITLE = "<Live & Session>（コピー）";

export const G22D_DUPLICATE_INSERT_SAVE_DISABLED_DEFAULT_REASON =
  "G-22d duplicate INSERT Save disabled — dedicated env arm / approval stack not satisfied (routine dev safety).";

export interface G22dDuplicateInsertConfig {
  phase: typeof G22D1_PHASE;
  approvalId: typeof G22D_SCHEDULE_DUPLICATE_INSERT_NON_DRY_RUN_APPROVAL_ID;
  envArm: typeof GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED_ENV;
  sourceId: typeof G22D_DUPLICATE_INSERT_SOURCE_ID;
  sourceLegacyId: typeof G22D_DUPLICATE_INSERT_SOURCE_LEGACY_ID;
  plannedLegacyId: typeof G22D_DUPLICATE_INSERT_PLANNED_LEGACY_ID;
  siteSlug: typeof STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG;
  armed: boolean;
  saveEnabled: boolean;
  saveAllowed: boolean;
  armFailureReason?: string;
  defaultDisabledReason: typeof G22D_DUPLICATE_INSERT_SAVE_DISABLED_DEFAULT_REASON;
  dev: boolean;
  stagingShellEnabled: boolean;
  stagingWriteFlag: boolean;
  dryRun: boolean;
  supabaseConfigured: boolean;
  productionBlocked: boolean;
  expectedProject: string;
  expectedSupabaseHost: string;
  activeSupabaseHost: string;
  hostGatePassed: boolean;
  hostGateWarning?: string;
  projectAllowlistPassed: boolean;
}

function isEnvArmTrue(env: ImportMetaEnv, key: string): boolean {
  return String(env[key] ?? "").trim() === "true";
}

function looksLikeProductionBlocked(env: ImportMetaEnv): boolean {
  if (String(env.ADMIN_AUTH_ENV ?? "").trim().toLowerCase() === "production") {
    return true;
  }
  return env.PROD === true;
}

export function isG22dDuplicateInsertEnvArmTrue(env: ImportMetaEnv): boolean {
  return isEnvArmTrue(env, GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED_ENV);
}

/** Mutual exclusion — call from other schedule write configs. */
export function collectG22dDuplicateInsertArmOffFailures(env: ImportMetaEnv): string[] {
  if (isG22dDuplicateInsertEnvArmTrue(env)) {
    return [`${GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED_ENV} must be off`];
  }
  return [];
}

export function getG22dDuplicateInsertConfig(
  env: ImportMetaEnv = import.meta.env,
): G22dDuplicateInsertConfig {
  const mergedEnv = mergeStagingShellEnv(env);
  const dev = mergedEnv.DEV === true;
  const stagingShellEnabled = mergedEnv.ENABLE_ADMIN_STAGING_SHELL === "true";
  const stagingWriteFlag = mergedEnv.ENABLE_ADMIN_STAGING_WRITE === "true";
  const dryRun =
    String(mergedEnv.PUBLIC_ADMIN_WRITE_DRY_RUN ?? "true").trim() !== "false";
  const supabaseUrl = String(mergedEnv.PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseAnonKey = String(mergedEnv.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
  const productionBlocked = looksLikeProductionBlocked(mergedEnv);
  const hostGate = evaluateSupabaseHostGate(supabaseUrl);
  const projectAllowlist = evaluateStagingProjectAllowlist(supabaseUrl);
  const providerRaw = String(mergedEnv.PUBLIC_ADMIN_WRITE_PROVIDER ?? "").trim();
  const module = String(mergedEnv.PUBLIC_ADMIN_WRITE_MODULE ?? "").trim();
  const approvalIdEnv = String(mergedEnv.PUBLIC_ADMIN_WRITE_APPROVAL_ID ?? "").trim();
  const dedicatedArm = isG22dDuplicateInsertEnvArmTrue(mergedEnv);

  const base = {
    phase: G22D1_PHASE,
    approvalId: G22D_SCHEDULE_DUPLICATE_INSERT_NON_DRY_RUN_APPROVAL_ID,
    envArm: GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED_ENV,
    sourceId: G22D_DUPLICATE_INSERT_SOURCE_ID,
    sourceLegacyId: G22D_DUPLICATE_INSERT_SOURCE_LEGACY_ID,
    plannedLegacyId: G22D_DUPLICATE_INSERT_PLANNED_LEGACY_ID,
    siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    defaultDisabledReason: G22D_DUPLICATE_INSERT_SAVE_DISABLED_DEFAULT_REASON,
    dev,
    stagingShellEnabled,
    stagingWriteFlag,
    dryRun,
    supabaseConfigured,
    productionBlocked,
    expectedProject: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
    expectedSupabaseHost: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
    activeSupabaseHost: hostGate.activeHost,
    hostGatePassed: hostGate.hostGatePassed,
    hostGateWarning: hostGate.warningMessage ?? undefined,
    projectAllowlistPassed: projectAllowlist.allowlistPassed,
  };

  const armFailures: string[] = [];
  if (!dedicatedArm) {
    armFailures.push(`${GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED_ENV}=true`);
  }
  if (!hostGate.hostGatePassed) {
    armFailures.push(hostGate.warningMessage ?? "Supabase host gate failed");
  }
  if (!projectAllowlist.allowlistPassed) {
    armFailures.push(projectAllowlist.errorMessage ?? "Staging project allowlist failed");
  }
  if (!dev) armFailures.push("DEV only");
  if (!stagingShellEnabled) armFailures.push("ENABLE_ADMIN_STAGING_SHELL");
  if (!stagingWriteFlag) armFailures.push("ENABLE_ADMIN_STAGING_WRITE");
  if (productionBlocked) armFailures.push("production blocked");
  if (providerRaw !== "supabase") {
    armFailures.push("PUBLIC_ADMIN_WRITE_PROVIDER=supabase");
  }
  if (module !== "schedule") armFailures.push("PUBLIC_ADMIN_WRITE_MODULE=schedule");
  if (approvalIdEnv !== G22D_SCHEDULE_DUPLICATE_INSERT_NON_DRY_RUN_APPROVAL_ID) {
    armFailures.push(
      `PUBLIC_ADMIN_WRITE_APPROVAL_ID=${G22D_SCHEDULE_DUPLICATE_INSERT_NON_DRY_RUN_APPROVAL_ID}`,
    );
  }
  if (dryRun) armFailures.push("PUBLIC_ADMIN_WRITE_DRY_RUN=false");
  if (isEnvArmTrue(mergedEnv, GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED_ENV)) {
    armFailures.push(`${GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED_ENV} must be off`);
  }
  if (isEnvArmTrue(mergedEnv, "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED")) {
    armFailures.push("PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED must be off");
  }
  if (isEnvArmTrue(mergedEnv, SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED_ENV)) {
    armFailures.push(`${SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED_ENV} must be off`);
  }
  if (isEnvArmTrue(mergedEnv, SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED_ENV)) {
    armFailures.push(`${SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED_ENV} must be off`);
  }
  if (isEnvArmTrue(mergedEnv, SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED_ENV)) {
    armFailures.push(`${SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED_ENV} must be off`);
  }
  if (isEnvArmTrue(mergedEnv, SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED_ENV)) {
    armFailures.push(`${SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED_ENV} must be off`);
  }
  if (isEnvArmTrue(mergedEnv, SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED_ENV)) {
    armFailures.push(`${SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED_ENV} must be off`);
  }
  if (isEnvArmTrue(mergedEnv, SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV)) {
    armFailures.push(`${SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV} must be off`);
  }
  if (isEnvArmTrue(mergedEnv, SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV)) {
    armFailures.push(`${SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV} must be off`);
  }
  if (isEnvArmTrue(mergedEnv, SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED_ENV)) {
    armFailures.push(`${SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED_ENV} must be off`);
  }
  if (isEnvArmTrue(mergedEnv, SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED_ENV)) {
    armFailures.push(`${SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED_ENV} must be off`);
  }
  armFailures.push(...collectOtherRegistryEnvArmFailures(mergedEnv));
  armFailures.push(...collectG14b1aPracticalEditArmOffFailures(mergedEnv));
  armFailures.push(...collectG13c1EventAPocCleanupArmOffFailures(mergedEnv));
  armFailures.push(...collectG13c2EventBPocCleanupArmOffFailures(mergedEnv));
  if (isEnvArmTrue(mergedEnv, "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED")) {
    armFailures.push("PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED must be off");
  }
  if (isEnvArmTrue(mergedEnv, "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED")) {
    armFailures.push("PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED must be off");
  }
  if (isEnvArmTrue(mergedEnv, "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED")) {
    armFailures.push("PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED must be off");
  }
  if (!supabaseConfigured) armFailures.push("Supabase URL/anon key");

  const armed = armFailures.length === 0;
  const saveEnabled = armed;
  const saveAllowed = armed;

  return {
    ...base,
    armed,
    saveEnabled,
    saveAllowed,
    armFailureReason: armed ? undefined : armFailures.join("; "),
  };
}

export function evaluateG22dDuplicateInsertUiGate(input: {
  signedIn: boolean;
  duplicateMode: boolean;
  source: { id: string; legacy_id?: string | null; site_slug?: string | null } | null;
  duplicateDryRunResult: { ok: boolean } | null;
  env?: ImportMetaEnv;
}): { enabled: boolean; reason: string; saveAllowed: boolean } {
  const config = getG22dDuplicateInsertConfig(input.env ?? import.meta.env);
  if (!input.duplicateMode) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: "Duplicate draft mode required.",
    };
  }
  if (!config.saveEnabled) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: config.armFailureReason ?? G22D_DUPLICATE_INSERT_SAVE_DISABLED_DEFAULT_REASON,
    };
  }
  if (!input.signedIn) {
    return { enabled: false, saveAllowed: false, reason: "Staging admin session required." };
  }
  if (!input.source) {
    return { enabled: false, saveAllowed: false, reason: "Duplicate source row missing." };
  }
  if (input.source.id !== G22D_DUPLICATE_INSERT_SOURCE_ID) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: `sourceId must be ${G22D_DUPLICATE_INSERT_SOURCE_ID}.`,
    };
  }
  if (input.source.legacy_id !== G22D_DUPLICATE_INSERT_SOURCE_LEGACY_ID) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: `source legacy_id must be ${G22D_DUPLICATE_INSERT_SOURCE_LEGACY_ID}.`,
    };
  }
  if (input.source.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    return { enabled: false, saveAllowed: false, reason: "site_slug must be gosaki-piano." };
  }
  if (!input.duplicateDryRunResult?.ok) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: "Duplicate dry-run preview must succeed first.",
    };
  }
  return {
    enabled: true,
    saveAllowed: true,
    reason: "複製案を1件だけ追加できます（G-22d single slice）。",
  };
}
