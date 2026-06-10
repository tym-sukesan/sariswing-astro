/**
 * G-5z-b — Staging shell read-only data env gate (not /admin/, not production).
 */

export const G5Z_B_PHASE = "G-5z-b";

export type ReadOnlyDataMode = "mock" | "supabase-read-only" | "disabled";

export interface ReadOnlyDataConfig {
  phase: string;
  dev: boolean;
  stagingShellEnabled: boolean;
  dataReadFlag: boolean;
  provider: string;
  /** G-5z-b: always false — Supabase read adapter is G-5z-c+ */
  supabaseDataEnabled: boolean;
  dataMode: ReadOnlyDataMode;
}

export function getReadOnlyDataConfig(
  env: ImportMetaEnv = import.meta.env,
): ReadOnlyDataConfig {
  const dev = env.DEV === true;
  const stagingShellEnabled = env.ENABLE_ADMIN_STAGING_SHELL === "true";
  const dataReadFlag = env.ENABLE_ADMIN_STAGING_DATA_READ === "true";
  const provider = String(env.PUBLIC_ADMIN_DATA_PROVIDER ?? "mock").trim();

  // G-5z-b: Supabase read-only not implemented — stay on mock regardless of flag.
  const supabaseDataEnabled = false;

  let dataMode: ReadOnlyDataMode = "mock";
  if (!dev || !stagingShellEnabled) {
    dataMode = "disabled";
  } else if (dataReadFlag && provider === "supabase") {
    // Env requests supabase but G-5z-b falls back to mock until G-5z-c.
    dataMode = "mock";
  } else if (provider === "mock" || !dataReadFlag) {
    dataMode = "mock";
  }

  return {
    phase: G5Z_B_PHASE,
    dev,
    stagingShellEnabled,
    dataReadFlag,
    provider,
    supabaseDataEnabled,
    dataMode,
  };
}
