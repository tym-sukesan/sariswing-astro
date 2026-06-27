/**
 * G-9j — Gosaki operator existing event update config (staging shell only).
 * G-9j1: guards + dry-run only — Save remains disabled until G-9j5.
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import {
  SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED_ENV,
} from "./schedule-general-edit-config";
import {
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
} from "./schedule-non-dry-run-poc-config";
import { G9J_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_APPROVAL_ID } from "./schedule-write-types";
import {
  SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED_ENV,
  STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
} from "../staging-data/staging-schedule-site-slug-config";
import { collectOtherRegistryEnvArmFailures } from "../staging-data/staging-schedule-single-text-field-operational-registry";
import { collectG13c1EventAPocCleanupArmOffFailures } from "./gosaki-schedule-event-a-poc-cleanup-config";
import { collectG13c2EventBPocCleanupArmOffFailures } from "./gosaki-schedule-event-b-poc-cleanup-config";
import {
  evaluateStagingProjectAllowlist,
  evaluateSupabaseHostGate,
} from "../staging-data/staging-schedule-site-slug-host-gate";

export const G9J1_PHASE =
  "G-9j1-gosaki-schedule-existing-event-update-guards-and-dry-run-implementation";

export const GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED";

export const G9J_EXISTING_EVENT_UPDATE_SAVE_DISABLED_DEFAULT_REASON =
  "G-9j operator existing event Save disabled until G-9j5 explicit approval.";

/** G-9j1–G-9j4: Save path not exposed even when arm gates would pass. */
export const G9J_EXISTING_EVENT_UPDATE_SAVE_ENABLED = false as const;

export interface G9jExistingEventUpdateConfig {
  phase: typeof G9J1_PHASE;
  approvalId: typeof G9J_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_APPROVAL_ID;
  siteSlug: typeof STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG;
  envArm: typeof GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED_ENV;
  armed: boolean;
  saveEnabled: false;
  armFailureReason?: string;
  defaultDisabledReason: typeof G9J_EXISTING_EVENT_UPDATE_SAVE_DISABLED_DEFAULT_REASON;
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
}

function looksLikeProductionBlocked(env: ImportMetaEnv): boolean {
  if (String(env.ADMIN_AUTH_ENV ?? "").trim().toLowerCase() === "production") {
    return true;
  }
  return env.PROD === true;
}

function isEnvArmTrue(env: ImportMetaEnv, key: string): boolean {
  return String(env[key] ?? "").trim() === "true";
}

export function getG9jExistingEventUpdateConfig(
  env: ImportMetaEnv = import.meta.env,
): G9jExistingEventUpdateConfig {
  const mergedEnv = mergeStagingShellEnv(env);
  const dev = mergedEnv.DEV === true;
  const stagingShellEnabled = mergedEnv.ENABLE_ADMIN_STAGING_SHELL === "true";
  const stagingWriteFlag = mergedEnv.ENABLE_ADMIN_STAGING_WRITE === "true";
  const armedFlagMatch = isEnvArmTrue(
    mergedEnv,
    GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED_ENV,
  );
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

  const base = {
    phase: G9J1_PHASE,
    approvalId: G9J_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_APPROVAL_ID,
    siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    envArm: GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED_ENV,
    defaultDisabledReason: G9J_EXISTING_EVENT_UPDATE_SAVE_DISABLED_DEFAULT_REASON,
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
  };

  const armFailures: string[] = [];
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
  if (approvalIdEnv !== G9J_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_APPROVAL_ID) {
    armFailures.push(
      `PUBLIC_ADMIN_WRITE_APPROVAL_ID=${G9J_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_APPROVAL_ID}`,
    );
  }
  if (dryRun) armFailures.push("PUBLIC_ADMIN_WRITE_DRY_RUN=false");
  if (!armedFlagMatch) {
    armFailures.push(`${GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED_ENV}=true`);
  }
  if (isEnvArmTrue(mergedEnv, "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED")) {
    armFailures.push("PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED must be off (G-9k save button arm)");
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
  armFailures.push(...collectG13c1EventAPocCleanupArmOffFailures(mergedEnv));
  armFailures.push(...collectG13c2EventBPocCleanupArmOffFailures(mergedEnv));
  if (!supabaseConfigured) armFailures.push("Supabase URL/anon key");

  const armed = armFailures.length === 0;

  return {
    ...base,
    armed,
    saveEnabled: G9J_EXISTING_EVENT_UPDATE_SAVE_ENABLED,
    armFailureReason: armed ? undefined : armFailures.join("; "),
  };
}
