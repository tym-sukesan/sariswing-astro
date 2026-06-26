/**
 * G-13d1 / G-13c1 — Gosaki Event A PoC visible text cleanup (staging shell only).
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
  G13C1_SCHEDULE_EVENT_A_POC_CLEANUP_NON_DRY_RUN_APPROVAL_ID,
} from "./schedule-write-types";
import {
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
} from "./schedule-non-dry-run-poc-config";

const GOSAKI_EXISTING_EVENT_SAVE_BUTTON_ARM_ENV =
  "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED";

export const G13D1_PHASE =
  "G-13d1-gosaki-schedule-event-a-poc-cleanup-local-implementation";

export const G13C1_EVENT_A_POC_CLEANUP_OPERATION_ID =
  "gosaki-schedule-event-a-poc-cleanup";

export const SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED";

export const G13C1_EVENT_A_POC_CLEANUP_TARGET_ROW_ID =
  "f687ebf3-407c-49d0-9ab8-58040c499b8e";

export const G13C1_EVENT_A_POC_CLEANUP_TARGET_LEGACY_ID = "schedule-2026-03-007";

export const G13C1_EVENT_A_POC_CLEANUP_TARGET_DATE = "2026-03-15";

export const G13C1_EVENT_A_POC_CLEANUP_CHANGED_FIELDS = [
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
] as const;

export const G13C1_EVENT_A_POC_CLEANUP_EXPECTED_TITLE = "<Duo>";

export const G13C1_EVENT_A_POC_CLEANUP_EXPECTED_VENUE = "川崎 ぴあにしも";

export const G13C1_EVENT_A_POC_CLEANUP_EXPECTED_OPEN_TIME = "15:00";

export const G13C1_EVENT_A_POC_CLEANUP_EXPECTED_START_TIME = "15:30";

export const G13C1_EVENT_A_POC_CLEANUP_EXPECTED_PRICE = "3,000円";

export const G13C1_EVENT_A_POC_CLEANUP_EXPECTED_DESCRIPTION =
  "出演：長谷川薫vo 後藤沙紀pf\n会場website: http://pubhpp.com/";

export const G13C1_EVENT_A_POC_CLEANUP_SAVE_DISABLED_DEFAULT_REASON =
  "G-13c1 Event A PoC cleanup Save disabled — arm not configured (routine dev safety).";

export const G13C1_SAVE_PHASE = "G-13c1-gosaki-schedule-event-a-poc-cleanup-save";

/** Runtime compile gate env — default off (routine dev). */
export const G13C1_SAVE_ENABLED_ENV =
  "PUBLIC_ADMIN_G13C1_EVENT_A_POC_CLEANUP_SAVE_ENABLED";

export function isG13c1SaveCompileGateEnabled(env: ImportMetaEnv): boolean {
  return String(env[G13C1_SAVE_ENABLED_ENV] ?? "").trim() === "true";
}

export const G13C1_PREVIEW_BTN_ID = "gosaki-g13c1-event-a-poc-cleanup-preview-btn";

export const G13C1_PREVIEW_RESULT_ID = "gosaki-g13c1-event-a-poc-cleanup-preview-result";

export const G13C1_SAVE_BTN_ID = "gosaki-g13c1-event-a-poc-cleanup-save-btn";

export const G13C1_SAVE_RESULT_ID = "gosaki-g13c1-event-a-poc-cleanup-save-result";

export type G13c1EventAPocCleanupSafeField =
  (typeof G13C1_EVENT_A_POC_CLEANUP_CHANGED_FIELDS)[number];

export type G13c1EventAPocCleanupFormValues = Record<
  G13c1EventAPocCleanupSafeField,
  string
>;

export function buildG13c1EventAPocCleanupTargetFormValues(): G13c1EventAPocCleanupFormValues {
  return {
    title: G13C1_EVENT_A_POC_CLEANUP_EXPECTED_TITLE,
    venue: G13C1_EVENT_A_POC_CLEANUP_EXPECTED_VENUE,
    open_time: G13C1_EVENT_A_POC_CLEANUP_EXPECTED_OPEN_TIME,
    start_time: G13C1_EVENT_A_POC_CLEANUP_EXPECTED_START_TIME,
    price: G13C1_EVENT_A_POC_CLEANUP_EXPECTED_PRICE,
    description: G13C1_EVENT_A_POC_CLEANUP_EXPECTED_DESCRIPTION,
  };
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

export function isG13c1EventAPocCleanupEnvArmTrue(env: ImportMetaEnv): boolean {
  return isEnvArmTrue(env, SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED_ENV);
}

/** Mutual exclusion — call from other schedule write configs. */
export function collectG13c1EventAPocCleanupArmOffFailures(
  env: ImportMetaEnv,
): string[] {
  if (isG13c1EventAPocCleanupEnvArmTrue(env)) {
    return [`${SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED_ENV} must be off`];
  }
  return [];
}

export interface G13c1EventAPocCleanupConfig {
  phase: typeof G13D1_PHASE;
  operationId: typeof G13C1_EVENT_A_POC_CLEANUP_OPERATION_ID;
  approvalId: typeof G13C1_SCHEDULE_EVENT_A_POC_CLEANUP_NON_DRY_RUN_APPROVAL_ID;
  envArm: typeof SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED_ENV;
  targetRowId: typeof G13C1_EVENT_A_POC_CLEANUP_TARGET_ROW_ID;
  targetLegacyId: typeof G13C1_EVENT_A_POC_CLEANUP_TARGET_LEGACY_ID;
  siteSlug: typeof STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG;
  armed: boolean;
  saveEnabled: boolean;
  armFailureReason?: string;
  defaultDisabledReason: typeof G13C1_EVENT_A_POC_CLEANUP_SAVE_DISABLED_DEFAULT_REASON;
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

export function getG13c1EventAPocCleanupConfig(
  env: ImportMetaEnv = import.meta.env,
): G13c1EventAPocCleanupConfig {
  const mergedEnv = mergeStagingShellEnv(env);
  const dev = mergedEnv.DEV === true;
  const stagingShellEnabled = mergedEnv.ENABLE_ADMIN_STAGING_SHELL === "true";
  const stagingWriteFlag = mergedEnv.ENABLE_ADMIN_STAGING_WRITE === "true";
  const armedFlagMatch = isG13c1EventAPocCleanupEnvArmTrue(mergedEnv);
  const dryRun =
    String(mergedEnv.PUBLIC_ADMIN_WRITE_DRY_RUN ?? "true").trim() !== "false";
  const supabaseUrl = String(mergedEnv.PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(mergedEnv.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const supabaseConfigured = Boolean(supabaseUrl && anonKey);
  const productionBlocked = looksLikeProductionBlocked(mergedEnv);
  const hostGate = evaluateSupabaseHostGate(supabaseUrl);
  const projectAllowlist = evaluateStagingProjectAllowlist(supabaseUrl);
  const providerRaw = String(mergedEnv.PUBLIC_ADMIN_WRITE_PROVIDER ?? "").trim();
  const module = String(mergedEnv.PUBLIC_ADMIN_WRITE_MODULE ?? "").trim();
  const approvalIdEnv = String(mergedEnv.PUBLIC_ADMIN_WRITE_APPROVAL_ID ?? "").trim();

  const base: G13c1EventAPocCleanupConfig = {
    phase: G13D1_PHASE,
    operationId: G13C1_EVENT_A_POC_CLEANUP_OPERATION_ID,
    approvalId: G13C1_SCHEDULE_EVENT_A_POC_CLEANUP_NON_DRY_RUN_APPROVAL_ID,
    envArm: SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED_ENV,
    targetRowId: G13C1_EVENT_A_POC_CLEANUP_TARGET_ROW_ID,
    targetLegacyId: G13C1_EVENT_A_POC_CLEANUP_TARGET_LEGACY_ID,
    siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    armed: false,
    saveEnabled: false,
    defaultDisabledReason: G13C1_EVENT_A_POC_CLEANUP_SAVE_DISABLED_DEFAULT_REASON,
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
    hostGateWarning: hostGate.warningMessage,
    projectAllowlistPassed: projectAllowlist.passed,
  };

  const armFailures: string[] = [];
  if (!dev) armFailures.push("DEV only");
  if (!stagingShellEnabled) armFailures.push("ENABLE_ADMIN_STAGING_SHELL");
  if (!stagingWriteFlag) armFailures.push("ENABLE_ADMIN_STAGING_WRITE");
  if (productionBlocked) armFailures.push("production blocked");
  if (providerRaw !== "supabase") {
    armFailures.push("PUBLIC_ADMIN_WRITE_PROVIDER=supabase");
  }
  if (module !== "schedule") armFailures.push("PUBLIC_ADMIN_WRITE_MODULE=schedule");
  if (approvalIdEnv !== G13C1_SCHEDULE_EVENT_A_POC_CLEANUP_NON_DRY_RUN_APPROVAL_ID) {
    armFailures.push(
      `PUBLIC_ADMIN_WRITE_APPROVAL_ID=${G13C1_SCHEDULE_EVENT_A_POC_CLEANUP_NON_DRY_RUN_APPROVAL_ID}`,
    );
  }
  if (dryRun) armFailures.push("PUBLIC_ADMIN_WRITE_DRY_RUN=false");
  if (!armedFlagMatch) {
    armFailures.push(`${SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED_ENV}=true`);
  }
  if (isEnvArmTrue(mergedEnv, GOSAKI_EXISTING_EVENT_SAVE_BUTTON_ARM_ENV)) {
    armFailures.push(`${GOSAKI_EXISTING_EVENT_SAVE_BUTTON_ARM_ENV} must be off`);
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
  if (!supabaseConfigured) armFailures.push("Supabase URL/anon key");
  if (!hostGate.hostGatePassed) {
    armFailures.push(hostGate.warningMessage ?? "Supabase host gate failed");
  }
  if (!projectAllowlist.passed) {
    armFailures.push(projectAllowlist.failureReason ?? "project allowlist failed");
  }

  const armed = armFailures.length === 0;
  const saveEnabled = isG13c1SaveCompileGateEnabled(mergedEnv) && armed;

  return {
    ...base,
    armed,
    saveEnabled,
    armFailureReason: armed ? undefined : armFailures.join("; "),
  };
}

export function resolveG13c1EventAPocCleanupSaveEnabled(
  env: ImportMetaEnv = import.meta.env,
): boolean {
  return getG13c1EventAPocCleanupConfig(env).saveEnabled;
}
