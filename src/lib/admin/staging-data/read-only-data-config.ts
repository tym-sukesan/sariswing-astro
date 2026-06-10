/**
 * G-5z-c — Staging shell read-only data env gate (not /admin/, not production).
 */

export const G5Z_C_APPROVAL_ID = "G-5z-c-staging-read-only-data-connect";
export const G5Z_C_PHASE = "G-5z-c";

export type ReadOnlyDataMode = "mock" | "supabase-read-only" | "disabled";

export interface ReadOnlyDataConfig {
  phase: string;
  approvalId: string;
  dev: boolean;
  stagingShellEnabled: boolean;
  dataReadFlag: boolean;
  provider: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseDataEnabled: boolean;
  supabaseConfigured: boolean;
  configMissing: boolean;
  dataMode: ReadOnlyDataMode;
}

export function getReadOnlyDataConfig(
  env: ImportMetaEnv = import.meta.env,
): ReadOnlyDataConfig {
  const dev = env.DEV === true;
  const stagingShellEnabled = env.ENABLE_ADMIN_STAGING_SHELL === "true";
  const dataReadFlag = env.ENABLE_ADMIN_STAGING_DATA_READ === "true";
  const provider = String(env.PUBLIC_ADMIN_DATA_PROVIDER ?? "mock").trim();
  const supabaseUrl = String(env.PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseAnonKey = String(env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  const stagingDataReadEnabled =
    dev &&
    stagingShellEnabled &&
    dataReadFlag &&
    provider === "supabase";

  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
  const configMissing =
    dev &&
    stagingShellEnabled &&
    dataReadFlag &&
    provider === "supabase" &&
    !supabaseConfigured;

  let dataMode: ReadOnlyDataMode = "mock";
  if (!dev || !stagingShellEnabled) {
    dataMode = "disabled";
  } else if (stagingDataReadEnabled && supabaseConfigured) {
    dataMode = "supabase-read-only";
  } else if (configMissing) {
    dataMode = "disabled";
  } else if (provider === "mock" || !dataReadFlag) {
    dataMode = "mock";
  }

  return {
    phase: G5Z_C_PHASE,
    approvalId: G5Z_C_APPROVAL_ID,
    dev,
    stagingShellEnabled,
    dataReadFlag,
    provider,
    supabaseUrl,
    supabaseAnonKey,
    supabaseDataEnabled: stagingDataReadEnabled && supabaseConfigured,
    supabaseConfigured,
    configMissing,
    dataMode,
  };
}
