/**
 * G-6-f3 — Schedule description dry-run prototype config (staging shell only).
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";

export const G6F3_SCHEDULE_DESCRIPTION_DRY_RUN_APPROVAL_ID =
  "G-6-f3-schedule-description-edit-dry-run-prototype";
export const G6F3_SCHEDULE_DESCRIPTION_DRY_RUN_PHASE =
  "G-6-f3-schedule-description-edit-dry-run-prototype";

export interface StagingScheduleDescriptionDryRunConfig {
  phase: typeof G6F3_SCHEDULE_DESCRIPTION_DRY_RUN_PHASE;
  approvalId: typeof G6F3_SCHEDULE_DESCRIPTION_DRY_RUN_APPROVAL_ID;
  enabled: boolean;
  dryRunOnly: true;
  writeAdapterUsed: false;
  targetField: "description";
  canUseSupabaseRead: boolean;
  dataReadEnabled: boolean;
  disabledReason?: string;
  dev: boolean;
  stagingShellEnabled: boolean;
}

export function getStagingScheduleDescriptionDryRunConfig(
  env: ImportMetaEnv = import.meta.env,
): StagingScheduleDescriptionDryRunConfig {
  const mergedEnv = mergeStagingShellEnv(env);
  const dev = mergedEnv.DEV === true;
  const stagingShellEnabled = mergedEnv.ENABLE_ADMIN_STAGING_SHELL === "true";
  const dataReadFlag = mergedEnv.ENABLE_ADMIN_STAGING_DATA_READ === "true";
  const provider = String(mergedEnv.PUBLIC_ADMIN_DATA_PROVIDER ?? "mock").trim();
  const supabaseUrl = String(mergedEnv.PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseAnonKey = String(mergedEnv.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const canUseSupabaseRead = Boolean(supabaseUrl && supabaseAnonKey);
  const dataReadEnabled =
    dev && stagingShellEnabled && dataReadFlag && provider === "supabase" && canUseSupabaseRead;

  const base = {
    phase: G6F3_SCHEDULE_DESCRIPTION_DRY_RUN_PHASE,
    approvalId: G6F3_SCHEDULE_DESCRIPTION_DRY_RUN_APPROVAL_ID,
    dryRunOnly: true as const,
    writeAdapterUsed: false as const,
    targetField: "description" as const,
    canUseSupabaseRead,
    dataReadEnabled,
    dev,
    stagingShellEnabled,
  };

  if (!dev) {
    return {
      ...base,
      enabled: false,
      disabledReason: "Description dry-run prototype is available in DEV only.",
    };
  }

  if (!stagingShellEnabled) {
    return {
      ...base,
      enabled: false,
      disabledReason: "ENABLE_ADMIN_STAGING_SHELL is not true.",
    };
  }

  return {
    ...base,
    enabled: true,
  };
}
