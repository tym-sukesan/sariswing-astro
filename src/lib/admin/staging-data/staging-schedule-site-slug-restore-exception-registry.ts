/**
 * G-9g3h2b — Centralized restore-only row-picker exception registry (lifecycle-aware).
 * Historical matchers remain for docs/verifiers; only `active` entries affect live UI/guards.
 */

import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";
import {
  G9G3G4_OPERATIONAL_DESCRIPTION_MARKER,
  G9G3G4_OPERATIONAL_TARGET_LEGACY_ID,
  G9G3G4_OPERATIONAL_TARGET_ROW_ID,
  G9G3G4_PHASE,
  G9G3H1A_RESTORE_LOCK_BASELINE_UPDATED_AT,
  G9G3H1A_RESTORE_SELECTABLE_HINT,
  G9G3H1A_RESTORE_TARGET_LEGACY_ID,
  G9G3H1A_RESTORE_TARGET_ROW_ID,
  G9G3H1A_RESTORE_TARGET_UI_LABEL,
  G9G3H1A_SMOKE_MARKER,
  G9G3H1B1_PHASE,
  STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
} from "./staging-schedule-site-slug-config";

export type RestoreExceptionLifecycleStatus = "active" | "completed" | "expired";

export type RestoreExceptionRegistryEntry = {
  id: string;
  phase: string;
  status: RestoreExceptionLifecycleStatus;
  uiLabel: string;
  selectableHint: string;
  matchesRow: (row: ScheduleRecord) => boolean;
};

function matchesG9g3g4OperationalRestoreTargetRow(row: ScheduleRecord): boolean {
  return (
    row.id === G9G3G4_OPERATIONAL_TARGET_ROW_ID &&
    row.legacy_id === G9G3G4_OPERATIONAL_TARGET_LEGACY_ID &&
    String(row.description ?? "").includes(G9G3G4_OPERATIONAL_DESCRIPTION_MARKER)
  );
}

function matchesG9g3h1aSmokeMarkerRestoreTargetRow(row: ScheduleRecord): boolean {
  return (
    row.id === G9G3H1A_RESTORE_TARGET_ROW_ID &&
    row.legacy_id === G9G3H1A_RESTORE_TARGET_LEGACY_ID &&
    row.site_slug === STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG &&
    String(row.description ?? "").includes(G9G3H1A_SMOKE_MARKER) &&
    String(row.updated_at ?? "") === G9G3H1A_RESTORE_LOCK_BASELINE_UPDATED_AT
  );
}

/** Registry — add future restore exceptions here with explicit lifecycle status. */
export const STAGING_SCHEDULE_RESTORE_EXCEPTION_REGISTRY: readonly RestoreExceptionRegistryEntry[] =
  [
    {
      id: "g9g3g4-operational-restore",
      phase: G9G3G4_PHASE,
      status: "completed",
      uiLabel: "G-9g3g4 restore target",
      selectableHint:
        "temporary selectable for operational marker restore — restore only — operator manual only",
      matchesRow: matchesG9g3g4OperationalRestoreTargetRow,
    },
    {
      id: "g9g3h1a-smoke-marker-restore",
      phase: G9G3H1B1_PHASE,
      status: "completed",
      uiLabel: G9G3H1A_RESTORE_TARGET_UI_LABEL,
      selectableHint: G9G3H1A_RESTORE_SELECTABLE_HINT,
      matchesRow: matchesG9g3h1aSmokeMarkerRestoreTargetRow,
    },
  ];

export function getActiveRestoreExceptionForRow(
  row: ScheduleRecord,
): RestoreExceptionRegistryEntry | null {
  for (const entry of STAGING_SCHEDULE_RESTORE_EXCEPTION_REGISTRY) {
    if (entry.status === "active" && entry.matchesRow(row)) {
      return entry;
    }
  }
  return null;
}

export function isActiveRestoreExceptionRow(row: ScheduleRecord): boolean {
  return getActiveRestoreExceptionForRow(row) !== null;
}

/** Historical matcher — G-9g3g4 marker row (completed; no live match after G-9g3g5c). */
export function isG9G3g4OperationalRestoreTargetRow(row: ScheduleRecord): boolean {
  return matchesG9g3g4OperationalRestoreTargetRow(row);
}

/** Historical matcher — G-9g3h1a smoke marker row (completed; no live match after G-9g3h1c). */
export function isG9g3h1aSmokeMarkerRestoreTargetRow(row: ScheduleRecord): boolean {
  return matchesG9g3h1aSmokeMarkerRestoreTargetRow(row);
}

export function findRestoreExceptionRegistryEntry(
  id: string,
): RestoreExceptionRegistryEntry | undefined {
  return STAGING_SCHEDULE_RESTORE_EXCEPTION_REGISTRY.find((entry) => entry.id === id);
}
