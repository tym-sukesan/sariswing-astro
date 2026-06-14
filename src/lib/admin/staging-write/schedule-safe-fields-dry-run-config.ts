/**
 * G-6-f4 — Schedule safe-fields dry-run prototype config (staging shell only).
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";

export const G6F4_SCHEDULE_SAFE_FIELDS_DRY_RUN_APPROVAL_ID =
  "G-6-f4-schedule-safe-fields-dry-run-prototype";
export const G6F4_SCHEDULE_SAFE_FIELDS_DRY_RUN_PHASE =
  "G-6-f4-schedule-safe-fields-dry-run-prototype";

export const SCHEDULE_SAFE_DRY_RUN_FIELDS = [
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
] as const;

export type ScheduleSafeDryRunField = typeof SCHEDULE_SAFE_DRY_RUN_FIELDS[number];

export interface StagingScheduleSafeFieldsDryRunConfig {
  phase: typeof G6F4_SCHEDULE_SAFE_FIELDS_DRY_RUN_PHASE;
  approvalId: typeof G6F4_SCHEDULE_SAFE_FIELDS_DRY_RUN_APPROVAL_ID;
  enabled: boolean;
  dryRunOnly: true;
  writeAdapterUsed: false;
  targetFields: readonly ScheduleSafeDryRunField[];
  canUseSupabaseRead: boolean;
  dataReadEnabled: boolean;
  disabledReason?: string;
  dev: boolean;
  stagingShellEnabled: boolean;
}

export function getStagingScheduleSafeFieldsDryRunConfig(
  env: ImportMetaEnv = import.meta.env,
): StagingScheduleSafeFieldsDryRunConfig {
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
    phase: G6F4_SCHEDULE_SAFE_FIELDS_DRY_RUN_PHASE,
    approvalId: G6F4_SCHEDULE_SAFE_FIELDS_DRY_RUN_APPROVAL_ID,
    dryRunOnly: true as const,
    writeAdapterUsed: false as const,
    targetFields: SCHEDULE_SAFE_DRY_RUN_FIELDS,
    canUseSupabaseRead,
    dataReadEnabled,
    dev,
    stagingShellEnabled,
  };

  if (!dev) {
    return {
      ...base,
      enabled: false,
      disabledReason: "Safe-fields dry-run prototype is available in DEV only.",
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
