/**
 * G-6-e5 fix — Schedule non-dry-run PoC error codes and result panel snapshot.
 */

export const SCHEDULE_NON_DRY_RUN_POC_ERROR_CODES = {
  AUTH_SESSION_MISSING: "auth_session_missing",
  MOCK_ROLE_NOT_ADMIN_WARNING: "mock_role_not_admin_warning",
  BEFORE_SNAPSHOT_MISMATCH: "before_snapshot_mismatch",
  TARGET_ROW_NOT_FOUND: "target_row_not_found",
  WRITE_GUARD_FAILED: "write_guard_failed",
  UPDATE_FAILED: "update_failed",
  UNEXPECTED_EXCEPTION: "unexpected_exception",
  TRIGGER_DISABLED: "trigger_disabled",
} as const;

export type ScheduleNonDryRunPocErrorCode =
  (typeof SCHEDULE_NON_DRY_RUN_POC_ERROR_CODES)[keyof typeof SCHEDULE_NON_DRY_RUN_POC_ERROR_CODES];

export const SCHEDULE_NON_DRY_RUN_POC_SESSION_STORAGE_KEY =
  "schedule-non-dry-run-poc-last-result";

export interface ScheduleNonDryRunPocPanelSnapshot {
  status: string;
  actualWrite: string;
  operation: string;
  targetTable: string;
  targetId: string;
  authEmail: string;
  authStatus: string;
  mockRole: string;
  warnings: string[];
  errorCode: string;
  errorMessage: string;
  abortReason: string;
  beforeDescription: string;
  afterDescription: string;
  timestamp: string;
}

export function mapAdapterErrorCode(
  adapterCode: string | undefined,
): ScheduleNonDryRunPocErrorCode | string {
  if (!adapterCode) return "—";
  if (adapterCode === "guard_failed") {
    return SCHEDULE_NON_DRY_RUN_POC_ERROR_CODES.WRITE_GUARD_FAILED;
  }
  if (adapterCode === "update_failed") {
    return SCHEDULE_NON_DRY_RUN_POC_ERROR_CODES.UPDATE_FAILED;
  }
  return adapterCode;
}

export function saveScheduleNonDryRunPocPanelSnapshot(
  snapshot: ScheduleNonDryRunPocPanelSnapshot,
): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      SCHEDULE_NON_DRY_RUN_POC_SESSION_STORAGE_KEY,
      JSON.stringify(snapshot),
    );
  } catch {
    /* quota or private mode — ignore */
  }
}

export function loadScheduleNonDryRunPocPanelSnapshot():
  | ScheduleNonDryRunPocPanelSnapshot
  | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SCHEDULE_NON_DRY_RUN_POC_SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ScheduleNonDryRunPocPanelSnapshot;
  } catch {
    return null;
  }
}
