/**
 * G-9k1 — Gosaki operator save button config (staging shell only).
 * Save remains disabled until G-9k2+; separate from G-9j5 fixed-row runner.
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
import {
  G9K_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_APPROVAL_ID,
} from "./schedule-write-types";
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
import {
  evaluateStagingProjectAllowlist,
  evaluateSupabaseHostGate,
} from "../staging-data/staging-schedule-site-slug-host-gate";
import {
  applyG9kSaveButtonPageConfigToEnv,
  G9K_SAVE_BUTTON_SAVE_ENABLED_ENV,
  readG9kSaveButtonPageConfigFromDom,
} from "./gosaki-schedule-save-button-page-config";

export const G9K1_PHASE =
  "G-9k1-gosaki-schedule-existing-event-save-button-guard-config-verifier";

export const G9K2_PHASE =
  "G-9k2-gosaki-schedule-existing-event-save-button-ui-wiring-dry-run-gate";

export const G9K4A_PHASE =
  "G-9k4a-gosaki-schedule-existing-event-ui-save-enable-implementation-preflight";

export const GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED";

export const G9K_SAVE_BUTTON_SAVE_DISABLED_DEFAULT_REASON =
  "G-9k operator save button disabled until G-9k4 explicit approval and env arm stack.";

/** G-9k4a: compile-time default — runtime gate uses server bridge + env. */
export const G9K_SAVE_BUTTON_SAVE_ENABLED = false as const;

export function isG9kSaveCompileGateEnabled(env: ImportMetaEnv): boolean {
  return String(env[G9K_SAVE_BUTTON_SAVE_ENABLED_ENV] ?? "").trim() === "true";
}

export function resolveG9kOperatorSaveButtonSaveEnabled(
  env: ImportMetaEnv = import.meta.env,
): boolean {
  return getG9kExistingEventSaveButtonConfig(env).saveEnabled;
}

export interface G9kExistingEventSaveButtonConfig {
  phase: typeof G9K1_PHASE;
  approvalId: typeof G9K_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_APPROVAL_ID;
  siteSlug: typeof STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG;
  envArm: typeof GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED_ENV;
  armed: boolean;
  saveEnabled: boolean;
  armFailureReason?: string;
  defaultDisabledReason: typeof G9K_SAVE_BUTTON_SAVE_DISABLED_DEFAULT_REASON;
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
  authSessionRequired: true;
  optimisticLockRequired: true;
  rowsAffectedMustBeOne: true;
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

export function getG9kExistingEventSaveButtonConfig(
  env: ImportMetaEnv = import.meta.env,
): G9kExistingEventSaveButtonConfig {
  let mergedEnv = mergeStagingShellEnv(env);
  const pageConfig = readG9kSaveButtonPageConfigFromDom();
  if (pageConfig) {
    mergedEnv = applyG9kSaveButtonPageConfigToEnv(mergedEnv, pageConfig);
  }
  const dev = mergedEnv.DEV === true;
  const stagingShellEnabled = mergedEnv.ENABLE_ADMIN_STAGING_SHELL === "true";
  const stagingWriteFlag = mergedEnv.ENABLE_ADMIN_STAGING_WRITE === "true";
  const armedFlagMatch = isEnvArmTrue(
    mergedEnv,
    GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED_ENV,
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
    phase: G9K1_PHASE,
    approvalId: G9K_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_APPROVAL_ID,
    siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    envArm: GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED_ENV,
    defaultDisabledReason: G9K_SAVE_BUTTON_SAVE_DISABLED_DEFAULT_REASON,
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
    authSessionRequired: true as const,
    optimisticLockRequired: true as const,
    rowsAffectedMustBeOne: true as const,
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
  if (approvalIdEnv !== G9K_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_APPROVAL_ID) {
    armFailures.push(
      `PUBLIC_ADMIN_WRITE_APPROVAL_ID=${G9K_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_APPROVAL_ID}`,
    );
  }
  if (dryRun) armFailures.push("PUBLIC_ADMIN_WRITE_DRY_RUN=false");
  if (!armedFlagMatch) {
    armFailures.push(`${GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED_ENV}=true`);
  }
  if (isEnvArmTrue(mergedEnv, "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED")) {
    armFailures.push("PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED must be off (G-9j5 runner arm)");
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

  const armed = armFailures.length === 0;
  const saveEnabled = isG9kSaveCompileGateEnabled(mergedEnv) && armed;

  return {
    ...base,
    armed,
    saveEnabled,
    armFailureReason: armed ? undefined : armFailures.join("; "),
  };
}

export function evaluateG9kOperatorSaveButtonUiGate(input: {
  signedIn: boolean;
  selectedRow: { site_slug?: string | null; updated_at?: string | null } | null;
  dryRunResult: {
    ok: boolean;
    saveReadiness: string;
    changedFields: string[];
    expectedBeforeUpdatedAt: string | null;
  } | null;
  env?: ImportMetaEnv;
}): { enabled: boolean; reason: string } {
  const config = getG9kExistingEventSaveButtonConfig(input.env ?? import.meta.env);
  if (!config.saveEnabled) {
    return {
      enabled: false,
      reason: config.armFailureReason ?? G9K_SAVE_BUTTON_SAVE_DISABLED_DEFAULT_REASON,
    };
  }
  if (!input.signedIn) {
    return { enabled: false, reason: "Staging admin session required." };
  }
  if (!input.selectedRow) {
    return { enabled: false, reason: "Select an existing event first." };
  }
  if (input.selectedRow.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    return { enabled: false, reason: "site_slug must be gosaki-piano." };
  }
  if (!String(input.selectedRow.updated_at ?? "").trim()) {
    return { enabled: false, reason: "optimistic lock updated_at missing on selected row." };
  }
  if (!input.dryRunResult?.ok) {
    return { enabled: false, reason: "Dry-run must succeed before Save." };
  }
  if (input.dryRunResult.saveReadiness !== "ready_to_save") {
    return { enabled: false, reason: "Save readiness not satisfied." };
  }
  if (input.dryRunResult.changedFields.length === 0) {
    return { enabled: false, reason: "No changedFields — Save blocked." };
  }
  if (!String(input.dryRunResult.expectedBeforeUpdatedAt ?? "").trim()) {
    return { enabled: false, reason: "expectedBeforeUpdatedAt required." };
  }
  return { enabled: true, reason: "" };
}
