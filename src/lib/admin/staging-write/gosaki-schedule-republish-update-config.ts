/**
 * G-22h6a — Gosaki Schedule republish UPDATE config (staging shell; single slice; target 008 only).
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
import type { G22hScheduleRepublishDryRunResult } from "./gosaki-schedule-republish-dry-run";
import {
  G22H_FIXED_TARGET_ID,
  G22H_FIXED_TARGET_LEGACY,
  G22H_PREFLIGHT_EXPECTED_BEFORE_UPDATED_AT,
  G22H_REFERENCE_LEGACY_SCHEDULE_2026_03_014,
  G22H_REFERENCE_LEGACY_SCHEDULE_2026_09_001,
} from "./gosaki-schedule-republish-update-guards";
import { G22H_SCHEDULE_REPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID } from "./schedule-write-types";

export const G22H6A_PHASE = "G-22h6a-gosaki-schedule-republish-update-implementation";

/** @deprecated G-22h3 phase id — retained for dry-run module reference. */
export const G22H3_REPUBLISH_CONFIG_PHASE = "G-22h3-gosaki-schedule-republish-dry-run-ui-implementation";

export const GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED";

export const G22H_REPUBLISH_UPDATE_SAVE_DISABLED_DEFAULT_REASON =
  "再公開の保存は現在無効です。G-22h6b で env arm を有効化したうえで、戸山が確認してから1回だけ保存します。";

export interface G22hRepublishUpdateConfig {
  phase: typeof G22H6A_PHASE;
  approvalId: typeof G22H_SCHEDULE_REPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID;
  envArm: typeof GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED_ENV;
  siteSlug: typeof STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG;
  armed: boolean;
  saveEnabled: boolean;
  saveAllowed: boolean;
  armFailureReason?: string;
  defaultDisabledReason: typeof G22H_REPUBLISH_UPDATE_SAVE_DISABLED_DEFAULT_REASON;
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

/** Mutual exclusion — call from other schedule write configs. */
export function collectG22hRepublishUpdateArmOffFailures(env: ImportMetaEnv): string[] {
  if (isEnvArmTrue(env, GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED_ENV)) {
    return [`${GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED_ENV} must be off`];
  }
  return [];
}

export function isG22hRepublishUpdateEnvArmTrue(env: ImportMetaEnv): boolean {
  return isEnvArmTrue(env, GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED_ENV);
}

export function getG22hRepublishUpdateConfig(
  env: ImportMetaEnv = import.meta.env,
): G22hRepublishUpdateConfig {
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
  const dedicatedArm = isG22hRepublishUpdateEnvArmTrue(mergedEnv);

  const base = {
    phase: G22H6A_PHASE,
    approvalId: G22H_SCHEDULE_REPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID,
    envArm: GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED_ENV,
    siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    defaultDisabledReason: G22H_REPUBLISH_UPDATE_SAVE_DISABLED_DEFAULT_REASON,
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
    armFailures.push(`${GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED_ENV}=true`);
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
  if (approvalIdEnv !== G22H_SCHEDULE_REPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID) {
    armFailures.push(
      `PUBLIC_ADMIN_WRITE_APPROVAL_ID=${G22H_SCHEDULE_REPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID}`,
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
  if (isEnvArmTrue(mergedEnv, "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED")) {
    armFailures.push("PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED must be off");
  }
  if (isEnvArmTrue(mergedEnv, "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED")) {
    armFailures.push("PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED must be off");
  }
  if (isEnvArmTrue(mergedEnv, "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED")) {
    armFailures.push("PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED must be off");
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

export function evaluateG22hRepublishUpdateUiGate(input: {
  signedIn: boolean;
  republishMode: boolean;
  target: {
    id: string;
    legacy_id?: string | null;
    site_slug?: string | null;
    published?: boolean | null;
    updated_at?: string | null;
  } | null;
  republishDryRunResult: G22hScheduleRepublishDryRunResult | null;
  env?: ImportMetaEnv;
}): { enabled: boolean; reason: string; saveAllowed: boolean } {
  const config = getG22hRepublishUpdateConfig(input.env ?? import.meta.env);

  if (!input.republishMode) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: "Republish draft mode required.",
    };
  }

  if (!config.saveEnabled) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: config.armFailureReason ?? config.defaultDisabledReason,
    };
  }

  if (!input.signedIn) {
    return { enabled: false, saveAllowed: false, reason: "Staging admin session required." };
  }

  if (!input.target) {
    return { enabled: false, saveAllowed: false, reason: "Republish target row missing." };
  }

  if (input.target.id !== G22H_FIXED_TARGET_ID) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: `Target id must be ${G22H_FIXED_TARGET_ID}.`,
    };
  }

  if (input.target.legacy_id !== G22H_FIXED_TARGET_LEGACY) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: `Target legacy_id must be ${G22H_FIXED_TARGET_LEGACY}.`,
    };
  }

  if (input.target.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    return { enabled: false, saveAllowed: false, reason: "site_slug must be gosaki-piano." };
  }

  if (input.target.published !== false) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: "Target must have published=false before republish UPDATE.",
    };
  }

  if (
    input.target.legacy_id === G22H_REFERENCE_LEGACY_SCHEDULE_2026_03_014 ||
    input.target.legacy_id === G22H_REFERENCE_LEGACY_SCHEDULE_2026_09_001
  ) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: `Must not use reference test row ${input.target.legacy_id} as Save target.`,
    };
  }

  if (!input.republishDryRunResult?.ok) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: input.republishDryRunResult
        ? "Republish dry-run preview has blocking errors — review the preview panel."
        : "Republish dry-run preview required — click「変更を確認」before Save.",
    };
  }

  if (input.republishDryRunResult.operation !== "republish") {
    return {
      enabled: false,
      saveAllowed: false,
      reason: "Latest dry-run operation must be republish.",
    };
  }

  if (!input.republishDryRunResult.validation.ok) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: "Republish dry-run has blocking validation errors.",
    };
  }

  if (input.republishDryRunResult.guardErrors.length > 0) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: "Republish dry-run has blocking guard errors.",
    };
  }

  if (input.republishDryRunResult.before.published !== false) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: "before.published must be false.",
    };
  }

  if (input.republishDryRunResult.after.published !== true) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: "after.published must be true.",
    };
  }

  if (!input.republishDryRunResult.wouldUpdate) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: "wouldUpdate must be true.",
    };
  }

  if (input.republishDryRunResult.wouldDelete !== false) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: "wouldDelete must be false.",
    };
  }

  if (input.republishDryRunResult.physicalDelete !== false) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: "physicalDelete must be false.",
    };
  }

  if (!String(input.target.updated_at ?? "").trim()) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: "expectedBeforeUpdatedAt (target updated_at) required.",
    };
  }

  return {
    enabled: true,
    saveAllowed: true,
    reason: `再公開を1件だけ保存できます（${G22H_FIXED_TARGET_LEGACY} · G-22h6 single slice）。`,
  };
}

export {
  G22H_FIXED_TARGET_ID,
  G22H_FIXED_TARGET_LEGACY,
  G22H_PREFLIGHT_EXPECTED_BEFORE_UPDATED_AT,
};
