/**
 * G-6-f10 — Optimistic lock types for edit sessions and stale checks.
 */

export type ScheduleEditSessionBaseline = {
  scheduleId: string;
  /** Lock token captured when the row was loaded or selected for edit. */
  baselineUpdatedAt: string | null;
  loadedAt: string;
};

export type ScheduleOptimisticLockStaleCheckResult = {
  staleCheckPerformed: boolean;
  staleDetected: boolean;
  baselineUpdatedAt: string | null;
  currentUpdatedAt: string | null;
  message: string | null;
  selectError: string | null;
};

export type ScheduleOptimisticLockDryRunState = {
  baselineUpdatedAt: string | null;
  staleCheckPerformed: boolean;
  staleDetected: boolean;
  currentUpdatedAt?: string | null;
  message?: string | null;
  optimisticLockEnabled: boolean;
};
