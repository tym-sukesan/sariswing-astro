/**
 * G-6-d — Staging shell write env gate (profile update PoC only; not /admin/).
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";

export const G6D_APPROVAL_ID = "G-6-d-staging-profile-update-poc";
export const G6D_PHASE = "G-6-d";

export type StagingWriteProvider = "disabled" | "supabase";

export interface StagingWriteConfig {
  phase: typeof G6D_PHASE;
  approvalId: typeof G6D_APPROVAL_ID;
  enabled: boolean;
  provider: StagingWriteProvider;
  module: "profile";
  dryRun: boolean;
  canWrite: boolean;
  writeOperationsEnabled: boolean;
  disabledReason?: string;
  dev: boolean;
  stagingShellEnabled: boolean;
  writeFlag: boolean;
  approvalIdMatch: boolean;
  supabaseConfigured: boolean;
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

export function getStagingWriteConfig(
  env: ImportMetaEnv = import.meta.env,
): StagingWriteConfig {
  const mergedEnv = mergeStagingShellEnv(env);
  const dev = mergedEnv.DEV === true;
  const stagingShellEnabled = mergedEnv.ENABLE_ADMIN_STAGING_SHELL === "true";
  const writeFlag = mergedEnv.ENABLE_ADMIN_STAGING_WRITE === "true";
  const providerRaw = String(mergedEnv.PUBLIC_ADMIN_WRITE_PROVIDER ?? "disabled").trim();
  const module = String(mergedEnv.PUBLIC_ADMIN_WRITE_MODULE ?? "").trim();
  const approvalIdEnv = String(mergedEnv.PUBLIC_ADMIN_WRITE_APPROVAL_ID ?? "").trim();
  const dryRun =
    String(mergedEnv.PUBLIC_ADMIN_WRITE_DRY_RUN ?? "true").trim() !== "false";
  const supabaseUrl = String(mergedEnv.PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseAnonKey = String(mergedEnv.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
  const productionBlocked = looksLikeProductionBlocked(mergedEnv);
  const approvalIdMatch = approvalIdEnv === G6D_APPROVAL_ID;

  const base = {
    phase: G6D_PHASE,
    approvalId: G6D_APPROVAL_ID,
    module: "profile" as const,
    dryRun,
    dev,
    stagingShellEnabled,
    writeFlag,
    approvalIdMatch,
    supabaseConfigured,
    productionBlocked,
  };

  if (!dev) {
    return {
      ...base,
      enabled: false,
      provider: "disabled",
      canWrite: false,
      writeOperationsEnabled: false,
      disabledReason: "Write PoC is available in DEV only.",
    };
  }

  if (!stagingShellEnabled) {
    return {
      ...base,
      enabled: false,
      provider: "disabled",
      canWrite: false,
      writeOperationsEnabled: false,
      disabledReason: "ENABLE_ADMIN_STAGING_SHELL is not true.",
    };
  }

  if (productionBlocked) {
    return {
      ...base,
      enabled: false,
      provider: "disabled",
      canWrite: false,
      writeOperationsEnabled: false,
      disabledReason: "Production environment is blocked for staging write PoC.",
    };
  }

  if (!writeFlag) {
    return {
      ...base,
      enabled: false,
      provider: "disabled",
      canWrite: false,
      writeOperationsEnabled: false,
      disabledReason: "ENABLE_ADMIN_STAGING_WRITE is not true.",
    };
  }

  if (providerRaw !== "supabase") {
    return {
      ...base,
      enabled: false,
      provider: "disabled",
      canWrite: false,
      writeOperationsEnabled: false,
      disabledReason: "PUBLIC_ADMIN_WRITE_PROVIDER must be supabase.",
    };
  }

  if (module !== "profile") {
    return {
      ...base,
      enabled: false,
      provider: "disabled",
      canWrite: false,
      writeOperationsEnabled: false,
      disabledReason: "PUBLIC_ADMIN_WRITE_MODULE must be profile.",
    };
  }

  if (!approvalIdMatch) {
    return {
      ...base,
      enabled: false,
      provider: "disabled",
      canWrite: false,
      writeOperationsEnabled: false,
      disabledReason: `PUBLIC_ADMIN_WRITE_APPROVAL_ID must be ${G6D_APPROVAL_ID}.`,
    };
  }

  if (!supabaseConfigured) {
    return {
      ...base,
      enabled: false,
      provider: "disabled",
      canWrite: false,
      writeOperationsEnabled: false,
      disabledReason:
        "Supabase config missing. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  return {
    ...base,
    enabled: true,
    provider: "supabase",
    canWrite: true,
    writeOperationsEnabled: true,
  };
}
