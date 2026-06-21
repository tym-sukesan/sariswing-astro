/**
 * G-5y-d — Staging shell Auth env gate (not /admin/, not production).
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import {
  isStagingAuthInteractiveFromPageConfig,
  readStagingAuthPageConfigFromDom,
} from "./staging-auth-page-config";

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

  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
  const pageConfig = readStagingAuthPageConfigFromDom();
  const pageInteractive = pageConfig
    ? isStagingAuthInteractiveFromPageConfig(pageConfig)
    : false;

  const stagingAuthEnabled = pageInteractive
    ? dev && pageConfig!.adminAuthProvider === "supabase" && supabaseConfigured
    : dev &&
      stagingShellEnabled &&
      stagingAuthFlag &&
      provider === "supabase";

  const effectiveStagingShellEnabled = pageInteractive || stagingShellEnabled;
  const effectiveStagingAuthFlag = pageInteractive || stagingAuthFlag;
  const effectiveProvider = pageConfig?.adminAuthProvider || provider;
  const configMissing =
    dev &&
    effectiveStagingShellEnabled &&
    effectiveStagingAuthFlag &&
    effectiveProvider === "supabase" &&
    !supabaseConfigured;

  let authMode: StagingAuthMode = "mock";
  if (!dev || !effectiveStagingShellEnabled) {
    authMode = "disabled";
  } else if (stagingAuthEnabled && supabaseConfigured) {
    authMode = "supabase-staging";
  } else if (configMissing) {
    authMode = "disabled";
  } else if (effectiveProvider === "mock" || !effectiveStagingAuthFlag) {
    authMode = "mock";
  }

  return {
    approvalId: G5Y_D_APPROVAL_ID,
    dev,
    stagingShellEnabled: effectiveStagingShellEnabled,
    stagingAuthFlag: effectiveStagingAuthFlag,
    provider: effectiveProvider,
    supabaseUrl,
    supabaseAnonKey,
    stagingAuthEnabled,
    supabaseConfigured,
    configMissing,
    authMode,
  };
}
