/**
 * G-6-f10 — Optimistic lock feature config (staging shell / general write path).
 */

export const SCHEDULE_OPTIMISTIC_LOCK_ENABLED_ENV =
  "PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK";

export type ScheduleOptimisticLockConfig = {
  /** When true, general / next-slice write path passes expectedBeforeUpdatedAt. */
  enabled: boolean;
  /** Dry-run UI performs SELECT-only stale checks when live Supabase read is active. */
  dryRunStaleCheckEnabled: boolean;
};

export function getScheduleOptimisticLockConfig(
  env: ImportMetaEnv = import.meta.env,
): ScheduleOptimisticLockConfig {
  const raw = String(env[SCHEDULE_OPTIMISTIC_LOCK_ENABLED_ENV] ?? "true").trim().toLowerCase();
  const enabled = raw !== "false" && raw !== "0" && raw !== "off";
  return {
    enabled,
    dryRunStaleCheckEnabled: enabled,
  };
}
