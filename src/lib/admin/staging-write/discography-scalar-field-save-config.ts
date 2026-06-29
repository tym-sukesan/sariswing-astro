/**
 * G-17b — Generic Discography scalar field slice Save config (staging shell).
 */

import {
  evaluateStagingProjectAllowlist,
  evaluateSupabaseHostGate,
} from "../staging-data/staging-schedule-site-slug-host-gate";
import {
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
} from "./schedule-non-dry-run-poc-config";
import { getDiscographyOptimisticLockConfig } from "./gosaki-discography-optimistic-lock-config";
import {
  collectOtherDiscographyScalarSliceEnvArmFailures,
  detectMultipleDiscographyScalarSliceEnvArms,
  isDiscographyScalarSliceEnvArmTrue,
  type DiscographyScalarFieldSliceEntry,
} from "./discography-scalar-field-slice-registry";

export type DiscographyScalarSliceSaveConfig = {
  sliceId: string;
  phase: string;
  approvalId: string;
  envArm: string;
  saveEnabled: boolean;
  armFailureReason: string | null;
  defaultDisabledReason: string;
  dev: boolean;
  stagingShellEnabled: boolean;
  stagingDataReadEnabled: boolean;
  stagingWriteFlag: boolean;
  envArmArmed: boolean;
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
  optimisticLockEnabled: boolean;
  rowsAffectedMustBeOne: true;
  writeProvider: string;
  writeModule: string;
  writeApprovalIdEnv: string;
  closed: boolean;
  field: string;
  legacyId: string;
};

function looksLikeProductionBlocked(env: ImportMetaEnv): boolean {
  if (String(env.ADMIN_AUTH_ENV ?? "").trim().toLowerCase() === "production") {
    return true;
  }
  return env.PROD === true;
}

export function getDiscographyScalarSliceSaveConfig(
  entry: DiscographyScalarFieldSliceEntry,
  env: ImportMetaEnv = import.meta.env,
): DiscographyScalarSliceSaveConfig {
  const dev = env.DEV === true;
  const stagingShellEnabled = env.ENABLE_ADMIN_STAGING_SHELL === "true";
  const stagingDataReadEnabled = env.ENABLE_ADMIN_STAGING_DATA_READ === "true";
  const stagingWriteFlag = env.ENABLE_ADMIN_STAGING_WRITE === "true";
  const envArmArmed = isDiscographyScalarSliceEnvArmTrue(env, entry.armedEnvName);
  const dryRun = String(env.PUBLIC_ADMIN_WRITE_DRY_RUN ?? "true").trim() !== "false";
  const supabaseUrl = String(env.PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseAnonKey = String(env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
  const productionBlocked = looksLikeProductionBlocked(env);
  const hostGate = evaluateSupabaseHostGate(supabaseUrl);
  const projectAllowlist = evaluateStagingProjectAllowlist(supabaseUrl);
  const providerRaw = String(env.PUBLIC_ADMIN_WRITE_PROVIDER ?? "").trim();
  const module = String(env.PUBLIC_ADMIN_WRITE_MODULE ?? "").trim();
  const approvalIdEnv = String(env.PUBLIC_ADMIN_WRITE_APPROVAL_ID ?? "").trim();
  const optimisticLockEnabled = getDiscographyOptimisticLockConfig(env).enabled;

  const base = {
    sliceId: entry.sliceId,
    phase: entry.phase,
    approvalId: entry.approvalId,
    envArm: entry.armedEnvName,
    defaultDisabledReason: entry.defaultDisabledReason,
    dev,
    stagingShellEnabled,
    stagingDataReadEnabled,
    stagingWriteFlag,
    envArmArmed,
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
    optimisticLockEnabled,
    rowsAffectedMustBeOne: true as const,
    writeProvider: providerRaw,
    writeModule: module,
    writeApprovalIdEnv: approvalIdEnv,
    closed: entry.closed,
    field: entry.field,
    legacyId: entry.legacyId,
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
  if (!stagingDataReadEnabled) armFailures.push("ENABLE_ADMIN_STAGING_DATA_READ");
  if (!stagingWriteFlag) armFailures.push("ENABLE_ADMIN_STAGING_WRITE");
  if (productionBlocked) armFailures.push("production blocked");
  if (providerRaw !== "supabase") {
    armFailures.push("PUBLIC_ADMIN_WRITE_PROVIDER=supabase");
  }
  if (module !== "discography") {
    armFailures.push("PUBLIC_ADMIN_WRITE_MODULE=discography");
  }
  if (approvalIdEnv !== entry.approvalId) {
    armFailures.push(`PUBLIC_ADMIN_WRITE_APPROVAL_ID=${entry.approvalId}`);
  }
  if (dryRun) armFailures.push("PUBLIC_ADMIN_WRITE_DRY_RUN=false");
  if (!envArmArmed) {
    armFailures.push(`${entry.armedEnvName}=true`);
  }

  const multipleArms = detectMultipleDiscographyScalarSliceEnvArms(env);
  if (multipleArms) {
    armFailures.push(multipleArms);
  }
  armFailures.push(...collectOtherDiscographyScalarSliceEnvArmFailures(env, entry.sliceId));

  if (!optimisticLockEnabled) {
    armFailures.push("PUBLIC_ADMIN_DISCOGRAPHY_OPTIMISTIC_LOCK=true");
  }
  if (!supabaseConfigured) armFailures.push("PUBLIC_SUPABASE_URL + PUBLIC_SUPABASE_ANON_KEY");

  const compileSaveEnabled = String(env[entry.enabledEnvName] ?? "").trim() === "true";
  const saveEnabled = compileSaveEnabled && armFailures.length === 0;

  return {
    ...base,
    saveEnabled,
    armFailureReason: armFailures.length > 0 ? armFailures.join("; ") : null,
  };
}

export type DiscographyScalarSliceOperatorSaveUiGate = {
  enabled: boolean;
  reason: string;
};

export function evaluateDiscographyScalarSliceOperatorSaveUiGate(
  entry: DiscographyScalarFieldSliceEntry,
  input: {
    signedIn: boolean;
    dryRunOk: boolean;
    stale: boolean;
    saveReadiness: string;
  },
  env: ImportMetaEnv = import.meta.env,
): DiscographyScalarSliceOperatorSaveUiGate {
  const config = getDiscographyScalarSliceSaveConfig(entry, env);
  if (!config.saveEnabled) {
    return {
      enabled: false,
      reason: config.armFailureReason ?? config.defaultDisabledReason,
    };
  }
  if (!input.signedIn) {
    return { enabled: false, reason: "Staging auth session required." };
  }
  if (!input.dryRunOk) {
    return { enabled: false, reason: "Dry-run preview must succeed first." };
  }
  if (input.stale) {
    return { enabled: false, reason: "Stale row — refresh and re-run preview." };
  }
  if (input.saveReadiness !== "ready_to_save") {
    return { enabled: false, reason: `Save readiness: ${input.saveReadiness}` };
  }
  return { enabled: true, reason: "Ready to save (operator only)." };
}
