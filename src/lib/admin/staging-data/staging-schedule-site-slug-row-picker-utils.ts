/**
 * G-9g3f1 — Row picker helpers (read-only; site_slug scoped).
 */

import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";
import {
  G9G1_TARGET_ROW_ID,
  G9G3G4_OPERATIONAL_DESCRIPTION_MARKER,
  G9G3G4_OPERATIONAL_TARGET_LEGACY_ID,
  G9G3G4_OPERATIONAL_TARGET_ROW_ID,
  G9G3H1A_RESTORE_LOCK_BASELINE_UPDATED_AT,
  G9G3H1A_RESTORE_TARGET_LEGACY_ID,
  G9G3H1A_RESTORE_TARGET_ROW_ID,
  G9G3H1A_SMOKE_MARKER,
  POC_AUDIT_STAGING_MARKER,
  STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
} from "./staging-schedule-site-slug-config";

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

/** G-9g3g4 operational restore target — marker row; selectable for restore only. */
export function isG9G3g4OperationalRestoreTargetRow(row: ScheduleRecord): boolean {
  return (
    row.id === G9G3G4_OPERATIONAL_TARGET_ROW_ID &&
    row.legacy_id === G9G3G4_OPERATIONAL_TARGET_LEGACY_ID &&
    String(row.description ?? "").includes(G9G3G4_OPERATIONAL_DESCRIPTION_MARKER)
  );
}

/** G-9g3h1b1 — narrow exception: G-9g3h1a smoke marker row selectable for restore only. */
export function isG9g3h1aSmokeMarkerRestoreTargetRow(row: ScheduleRecord): boolean {
  return (
    row.id === G9G3H1A_RESTORE_TARGET_ROW_ID &&
    row.legacy_id === G9G3H1A_RESTORE_TARGET_LEGACY_ID &&
    row.site_slug === STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG &&
    String(row.description ?? "").includes(G9G3H1A_SMOKE_MARKER) &&
    String(row.updated_at ?? "") === G9G3H1A_RESTORE_LOCK_BASELINE_UPDATED_AT
  );
}

export function isPocAuditScheduleRow(row: ScheduleRecord): boolean {
  if (row.id === G9G1_TARGET_ROW_ID) return true;
  if (isG9G3g4OperationalRestoreTargetRow(row)) return false;
  if (isG9g3h1aSmokeMarkerRestoreTargetRow(row)) return false;
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
