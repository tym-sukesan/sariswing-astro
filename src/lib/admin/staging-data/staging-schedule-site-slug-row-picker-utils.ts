/**
 * G-9g3f1 — Row picker helpers (read-only; site_slug scoped).
 */

import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";
import {
  G9G1_TARGET_ROW_ID,
  POC_AUDIT_STAGING_MARKER,
} from "./staging-schedule-site-slug-config";
import {
  getActiveRestoreExceptionForRow,
  isActiveRestoreExceptionRow,
  isG9G3g4OperationalRestoreTargetRow,
  isG9g3h1aSmokeMarkerRestoreTargetRow,
  STAGING_SCHEDULE_RESTORE_EXCEPTION_REGISTRY,
} from "./staging-schedule-site-slug-restore-exception-registry";

export {
  getActiveRestoreExceptionForRow,
  isActiveRestoreExceptionRow,
  isG9G3g4OperationalRestoreTargetRow,
  isG9g3h1aSmokeMarkerRestoreTargetRow,
  STAGING_SCHEDULE_RESTORE_EXCEPTION_REGISTRY,
};

export function rowContainsPocAuditMarker(row: ScheduleRecord): boolean {
  const fields = [
    row.title,
    row.venue,
    row.open_time,
    row.start_time,
    row.price,
    row.description,
  ];
  return fields.some((value) => String(value ?? "").includes(POC_AUDIT_STAGING_MARKER));
}

export function isPocAuditScheduleRow(row: ScheduleRecord): boolean {
  if (row.id === G9G1_TARGET_ROW_ID) return true;
  if (isActiveRestoreExceptionRow(row)) return false;
  return rowContainsPocAuditMarker(row);
}

export function splitSelectableAndAuditRows(rows: ScheduleRecord[]): {
  selectableRows: ScheduleRecord[];
  auditRows: ScheduleRecord[];
} {
  const selectableRows: ScheduleRecord[] = [];
  const auditRows: ScheduleRecord[] = [];
  for (const row of rows) {
    if (isPocAuditScheduleRow(row)) {
      auditRows.push(row);
    } else {
      selectableRows.push(row);
    }
  }
  return { selectableRows, auditRows };
}

export function deriveMonthOptions(rows: ScheduleRecord[]): string[] {
  const months = new Set<string>();
  for (const row of rows) {
    const month = String(row.month ?? "").trim();
    if (month) months.add(month);
  }
  return [...months].sort((a, b) => a.localeCompare(b));
}
