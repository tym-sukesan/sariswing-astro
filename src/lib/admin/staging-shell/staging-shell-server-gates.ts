/**
 * G-6-d-staging-env-gate-client-fix — Server-side ENABLE_* gate snapshot (staging shell only).
 * Non-PUBLIC env is read on Astro server and injected into the page for client diagnostics.
 */

export interface StagingShellServerGateSnapshot {
  stagingShellEnabled: boolean;
  stagingAuthFlag: boolean;
  stagingDataReadFlag: boolean;
  stagingWriteFlag: boolean;
  source: "server";
}

export function getStagingShellServerGateSnapshot(
  env: ImportMetaEnv,
): StagingShellServerGateSnapshot {
  return {
    stagingShellEnabled: env.ENABLE_ADMIN_STAGING_SHELL === "true",
    stagingAuthFlag: env.ENABLE_ADMIN_STAGING_AUTH === "true",
    stagingDataReadFlag: env.ENABLE_ADMIN_STAGING_DATA_READ === "true",
    stagingWriteFlag: env.ENABLE_ADMIN_STAGING_WRITE === "true",
    source: "server",
  };
}

export const STAGING_SHELL_SERVER_GATES_ELEMENT_ID = "staging-shell-server-gates";
