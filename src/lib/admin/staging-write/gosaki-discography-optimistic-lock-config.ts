/**
 * G-15b — Discography optimistic lock feature config (staging shell).
 */

export const DISCOGRAPHY_OPTIMISTIC_LOCK_ENABLED_ENV =
  "PUBLIC_ADMIN_DISCOGRAPHY_OPTIMISTIC_LOCK";

export type DiscographyOptimisticLockConfig = {
  enabled: boolean;
  dryRunStaleCheckEnabled: boolean;
};

export function getDiscographyOptimisticLockConfig(
  env: ImportMetaEnv = import.meta.env,
): DiscographyOptimisticLockConfig {
  const raw = String(env[DISCOGRAPHY_OPTIMISTIC_LOCK_ENABLED_ENV] ?? "true")
    .trim()
    .toLowerCase();
  const enabled = raw !== "false" && raw !== "0" && raw !== "off";
  return {
    enabled,
    dryRunStaleCheckEnabled: enabled,
  };
}
