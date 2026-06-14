/**
 * G-6-f6 — Safe-fields non-dry-run PoC error codes and panel snapshot.
 */

export const SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_ERROR_CODES = {
  AUTH_SESSION_MISSING: "auth_session_missing",
  BEFORE_SNAPSHOT_MISMATCH: "before_snapshot_mismatch",
  TARGET_ROW_NOT_FOUND: "target_row_not_found",
  WRITE_GUARD_FAILED: "write_guard_failed",
  UPDATE_FAILED: "update_failed",
  UNEXPECTED_EXCEPTION: "unexpected_exception",
  POC_NOT_ARMED: "poc_not_armed",
} as const;

export const SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_SESSION_STORAGE_KEY =
  "schedule-safe-fields-non-dry-run-poc-last-result";

export interface ScheduleSafeFieldsNonDryRunPocPanelSnapshot {
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
  beforeVenue: string;
  beforeDescription: string;
  afterVenue: string;
  afterDescription: string;
  changedFields: string;
  timestamp: string;
}

export function mapSafeFieldsAdapterErrorCode(adapterCode: string | undefined): string {
  if (!adapterCode) return "—";
  if (adapterCode === "guard_failed") {
    return SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_ERROR_CODES.WRITE_GUARD_FAILED;
  }
  if (adapterCode === "update_failed") {
    return SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_ERROR_CODES.UPDATE_FAILED;
  }
  return adapterCode;
}

export function saveScheduleSafeFieldsNonDryRunPocPanelSnapshot(
  snapshot: ScheduleSafeFieldsNonDryRunPocPanelSnapshot,
): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_SESSION_STORAGE_KEY,
      JSON.stringify(snapshot),
    );
  } catch {
    /* ignore */
  }
}

export function loadScheduleSafeFieldsNonDryRunPocPanelSnapshot():
  | ScheduleSafeFieldsNonDryRunPocPanelSnapshot
  | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(
      SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_SESSION_STORAGE_KEY,
    );
    if (!raw) return null;
    return JSON.parse(raw) as ScheduleSafeFieldsNonDryRunPocPanelSnapshot;
  } catch {
    return null;
  }
}
