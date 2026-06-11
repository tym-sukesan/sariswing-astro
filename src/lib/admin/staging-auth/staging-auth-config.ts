/**
 * G-5y-d — Staging shell Auth env gate (not /admin/, not production).
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";

export const G5Y_D_APPROVAL_ID = "G-5y-d-staging-auth-connect";

export type StagingAuthMode = "mock" | "supabase-staging" | "disabled";

export interface StagingAuthConfig {
  approvalId: string;
  dev: boolean;
  stagingShellEnabled: boolean;
  stagingAuthFlag: boolean;
  provider: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  stagingAuthEnabled: boolean;
  supabaseConfigured: boolean;
  configMissing: boolean;
  authMode: StagingAuthMode;
}

export function getStagingAuthConfig(
  env: ImportMetaEnv = import.meta.env,
): StagingAuthConfig {
  const mergedEnv = mergeStagingShellEnv(env);
  const dev = mergedEnv.DEV === true;
  const stagingShellEnabled = mergedEnv.ENABLE_ADMIN_STAGING_SHELL === "true";
  const stagingAuthFlag = mergedEnv.ENABLE_ADMIN_STAGING_AUTH === "true";
  const provider = String(mergedEnv.PUBLIC_ADMIN_AUTH_PROVIDER ?? "mock").trim();
  const supabaseUrl = String(mergedEnv.PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseAnonKey = String(mergedEnv.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  const stagingAuthEnabled =
    dev &&
    stagingShellEnabled &&
    stagingAuthFlag &&
    provider === "supabase";

  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
  const configMissing =
    dev &&
    stagingShellEnabled &&
    stagingAuthFlag &&
    provider === "supabase" &&
    !supabaseConfigured;

  let authMode: StagingAuthMode = "mock";
  if (!dev || !stagingShellEnabled) {
    authMode = "disabled";
  } else if (stagingAuthEnabled && supabaseConfigured) {
    authMode = "supabase-staging";
  } else if (configMissing) {
    authMode = "disabled";
  } else if (provider === "mock" || !stagingAuthFlag) {
    authMode = "mock";
  }

  return {
    approvalId: G5Y_D_APPROVAL_ID,
    dev,
    stagingShellEnabled,
    stagingAuthFlag,
    provider,
    supabaseUrl,
    supabaseAnonKey,
    stagingAuthEnabled,
    supabaseConfigured,
    configMissing,
    authMode,
  };
}
