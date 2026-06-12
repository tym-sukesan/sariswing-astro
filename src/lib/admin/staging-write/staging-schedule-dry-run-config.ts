/**
 * G-6-e2 — Schedule dry-run UI config (staging shell only; always dry-run).
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";

export const G6E2_SCHEDULE_DRY_RUN_APPROVAL_ID = "G-6-e2-schedule-dry-run-ui";
export const G6E2_SCHEDULE_DRY_RUN_PHASE = "G-6-e2-schedule-dry-run-ui-scaffold";

export interface StagingScheduleDryRunConfig {
  phase: typeof G6E2_SCHEDULE_DRY_RUN_PHASE;
  approvalId: typeof G6E2_SCHEDULE_DRY_RUN_APPROVAL_ID;
  enabled: boolean;
  dryRunOnly: true;
  scheduleMonthsMode: "read_only_derived_model";
  writeAdapterImplemented: false;
  deleteEnabled: false;
  nonDryRunEnabled: false;
  canUseSupabaseRead: boolean;
  disabledReason?: string;
  dev: boolean;
  stagingShellEnabled: boolean;
  productionBlocked: boolean;
}

function looksLikeProductionBlocked(env: ImportMetaEnv): boolean {
  if (String(env.ADMIN_AUTH_ENV ?? "").trim().toLowerCase() === "production") {
    return true;
  }
  if (env.PROD === true) {
    return true;
  }
  return false;
}

export function getStagingScheduleDryRunConfig(
  env: ImportMetaEnv = import.meta.env,
): StagingScheduleDryRunConfig {
  const mergedEnv = mergeStagingShellEnv(env);
  const dev = mergedEnv.DEV === true;
  const stagingShellEnabled = mergedEnv.ENABLE_ADMIN_STAGING_SHELL === "true";
  const supabaseUrl = String(mergedEnv.PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseAnonKey = String(mergedEnv.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const canUseSupabaseRead = Boolean(supabaseUrl && supabaseAnonKey);
  const productionBlocked = looksLikeProductionBlocked(mergedEnv);

  const base = {
    phase: G6E2_SCHEDULE_DRY_RUN_PHASE,
    approvalId: G6E2_SCHEDULE_DRY_RUN_APPROVAL_ID,
    dryRunOnly: true as const,
    scheduleMonthsMode: "read_only_derived_model" as const,
    writeAdapterImplemented: false as const,
    deleteEnabled: false,
    nonDryRunEnabled: false,
    canUseSupabaseRead,
    dev,
    stagingShellEnabled,
    productionBlocked,
  };

  if (!dev) {
    return {
      ...base,
      enabled: false,
      disabledReason: "Schedule dry-run UI is available in DEV only.",
    };
  }

  if (!stagingShellEnabled) {
    return {
      ...base,
      enabled: false,
      disabledReason: "ENABLE_ADMIN_STAGING_SHELL is not true.",
    };
  }

  if (productionBlocked) {
    return {
      ...base,
      enabled: false,
      disabledReason: "Production environment is blocked for schedule dry-run UI.",
    };
  }

  return {
    ...base,
    enabled: true,
  };
}
