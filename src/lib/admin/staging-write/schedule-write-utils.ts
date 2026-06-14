/**
 * G-6-f10 — Shared schedule write utilities (optimistic lock timestamp compare).
 */

/** User-facing message when optimistic lock blocks a save. */
export const SCHEDULE_OPTIMISTIC_LOCK_CONFLICT_MESSAGE_JA =
  "別の編集が入った可能性があるため、再読み込みしてから再試行してください。";

/** Dry-run stale warning (preview only — no write). */
export const SCHEDULE_OPTIMISTIC_LOCK_STALE_WARNING_JA =
  "別の編集が入った可能性があります。保存前に再読み込みしてください。（ドライラン — 書き込みは行いません）";

export const SCHEDULE_OPTIMISTIC_LOCK_SELECT_FAILED_MESSAGE_JA =
  "保存前の確認に失敗しました。接続とログイン状態を確認し、再読み込みしてください。";

export const SCHEDULE_OPTIMISTIC_LOCK_ERROR_CODES = {
  OPTIMISTIC_LOCK_FAILED: "optimistic_lock_failed",
  OPTIMISTIC_LOCK_SELECT_FAILED: "optimistic_lock_select_failed",
} as const;

/**
 * Normalize Supabase timestamptz strings for comparison.
 * Handles ISO `T` vs space and millisecond truncation (G-6-e5 pattern).
 */
export function normalizeScheduleUpdatedAt(value: string | null | undefined): string {
  if (value == null || value === "") return "";
  return value
    .trim()
    .replace(/\.\d{3}/, "")
    .replace("T", " ")
    .replace(/\+00:00$/, "+00")
    .replace(/\+00$/, "+00");
}

export function scheduleUpdatedAtEquals(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  const na = normalizeScheduleUpdatedAt(a);
  const nb = normalizeScheduleUpdatedAt(b);
  if (na === "" && nb === "") return true;
  return na === nb;
}

/** Resolve lock token from edit-session beforeSnapshot. Empty → lock skipped in adapter. */
export function resolveExpectedBeforeUpdatedAt(
  beforeSnapshot: { updated_at?: string | null },
): string | null {
  const token = beforeSnapshot.updated_at;
  if (token == null || token === "") return null;
  return token;
}

export function mapScheduleWriteErrorToUserMessage(errorCode: string): string | null {
  switch (errorCode) {
    case SCHEDULE_OPTIMISTIC_LOCK_ERROR_CODES.OPTIMISTIC_LOCK_FAILED:
      return SCHEDULE_OPTIMISTIC_LOCK_CONFLICT_MESSAGE_JA;
    case SCHEDULE_OPTIMISTIC_LOCK_ERROR_CODES.OPTIMISTIC_LOCK_SELECT_FAILED:
      return SCHEDULE_OPTIMISTIC_LOCK_SELECT_FAILED_MESSAGE_JA;
    default:
      return null;
  }
}

export type ScheduleStaleEvaluateResult = {
  staleCheckPerformed: boolean;
  staleDetected: boolean;
  baselineUpdatedAt: string | null;
  currentUpdatedAt: string | null;
  message: string | null;
  selectError: string | null;
};

/** Pure stale evaluation — no Supabase (used by dry-run UI and tests). */
export function evaluateScheduleStaleState(input: {
  baselineUpdatedAt: string | null | undefined;
  currentUpdatedAt: string | null | undefined;
  selectError?: string | null;
  staleCheckPerformed?: boolean;
}): ScheduleStaleEvaluateResult {
  const baseline =
    input.baselineUpdatedAt != null && input.baselineUpdatedAt !== ""
      ? String(input.baselineUpdatedAt)
      : null;
  const current =
    input.currentUpdatedAt != null && input.currentUpdatedAt !== ""
      ? String(input.currentUpdatedAt)
      : null;
  const performed = input.staleCheckPerformed ?? true;

  if (input.selectError) {
    return {
      staleCheckPerformed: performed,
      staleDetected: false,
      baselineUpdatedAt: baseline,
      currentUpdatedAt: current,
      message: null,
      selectError: input.selectError,
    };
  }

  if (!baseline) {
    return {
      staleCheckPerformed: performed,
      staleDetected: false,
      baselineUpdatedAt: null,
      currentUpdatedAt: current,
      message: null,
      selectError: null,
    };
  }

  const staleDetected = !scheduleUpdatedAtEquals(baseline, current);

  return {
    staleCheckPerformed: performed,
    staleDetected,
    baselineUpdatedAt: baseline,
    currentUpdatedAt: current,
    message: staleDetected ? SCHEDULE_OPTIMISTIC_LOCK_STALE_WARNING_JA : null,
    selectError: null,
  };
}
