/**
 * G-13c2d1 / G-13c2 — Gosaki Event B PoC cleanup dry-run (no DB write).
 */

import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "../staging-data/staging-schedule-site-slug-config";
import { assertStaticToAstroCmsStagingSupabaseProject } from "../staging-data/staging-schedule-site-slug-host-gate";
import {
  G13C2D1_PHASE,
  G13C2_EVENT_B_POC_CLEANUP_CHANGED_FIELDS,
  type G13c2EventBPocCleanupFormValues,
  type G13c2EventBPocCleanupSafeField,
  resolveG13c2EventBPocCleanupSaveEnabled,
} from "./gosaki-schedule-event-b-poc-cleanup-config";
import {
  assertG13c2EventBPocCleanupChangedFieldsOnly,
  assertG13c2EventBPocCleanupPayloadOnly,
  assertG13c2EventBPocCleanupWritableRow,
  assertG13c2OptimisticLockBaseline,
  buildG13c2EventBPocCleanupPayload,
} from "./gosaki-schedule-event-b-poc-cleanup-guards";
import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import {
  G13C2_SCHEDULE_EVENT_B_POC_AUDIT_CLEANUP_NON_DRY_RUN_APPROVAL_ID,
  type ScheduleUpdateWritePayload,
} from "./schedule-write-types";

export const G13C2_DRY_RUN_PHASE = "G-13c2-gosaki-schedule-event-b-poc-cleanup-dry-run";

export type G13c2EventBPocCleanupDryRunSafety = {
  supabaseWriteCalled: false;
  writeAdapterUsed: false;
  scheduleMonthsTouched: false;
  serviceRoleUsed: false;
  actualWrite: false;
};

export type G13c2EventBPocCleanupDryRunSaveReadiness =
  | "no_changes"
  | "guard_error"
  | "ready_but_save_disabled"
  | "ready_to_save";

export type G13c2EventBPocCleanupDryRunResult = {
  ok: boolean;
  dryRun: true;
  phase: typeof G13C2_DRY_RUN_PHASE;
  operationPhase: typeof G13C2D1_PHASE;
  approvalId: typeof G13C2_SCHEDULE_EVENT_B_POC_AUDIT_CLEANUP_NON_DRY_RUN_APPROVAL_ID;
  target: {
    id: string;
    legacy_id: string;
    title: string;
    date: string;
    site_slug: string;
  };
  changedFields: string[];
  payloadKeys: string[];
  before: Partial<Record<G13c2EventBPocCleanupSafeField, string | null>>;
  after: Partial<Record<G13c2EventBPocCleanupSafeField, string | null>>;
  payload: ScheduleUpdateWritePayload;
  expectedBeforeUpdatedAt: string | null;
  optimisticLockStale: boolean;
  guardErrors: string[];
  saveReadiness: G13c2EventBPocCleanupDryRunSaveReadiness;
  saveAllowed: boolean;
  rowsAffectedRequired: 1;
  safety: G13c2EventBPocCleanupDryRunSafety;
};

function normalizeCompare(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function snapshotSafeField(
  row: ScheduleDryRunSource,
  field: G13c2EventBPocCleanupSafeField,
): string | null {
  const value = row[field];
  if (value === null || value === undefined) return null;
  return String(value);
}

export function computeG13c2EventBPocCleanupChangedFields(
  beforeSnapshot: ScheduleDryRunSource,
  formValues: G13c2EventBPocCleanupFormValues,
): string[] {
  const changedFields: string[] = [];
  for (const field of G13C2_EVENT_B_POC_CLEANUP_CHANGED_FIELDS) {
    const beforeValue = normalizeCompare(snapshotSafeField(beforeSnapshot, field));
    const afterValue = normalizeCompare(formValues[field]);
    if (beforeValue !== afterValue) {
      changedFields.push(field);
    }
  }
  return changedFields;
}

function buildChangedFieldSnapshots(
  beforeSnapshot: ScheduleDryRunSource,
  formValues: G13c2EventBPocCleanupFormValues,
  changedFields: string[],
): {
  before: Partial<Record<G13c2EventBPocCleanupSafeField, string | null>>;
  after: Partial<Record<G13c2EventBPocCleanupSafeField, string | null>>;
} {
  const before: Partial<Record<G13c2EventBPocCleanupSafeField, string | null>> = {};
  const after: Partial<Record<G13c2EventBPocCleanupSafeField, string | null>> = {};
  for (const field of changedFields) {
    before[field] = snapshotSafeField(beforeSnapshot, field);
    const raw = formValues[field] ?? "";
    after[field] = raw.trim() === "" && field !== "title" ? null : raw.trim() || null;
  }
  return { before, after };
}

function emptyDryRunResult(
  beforeSnapshot: ScheduleDryRunSource | null,
  guardErrors: string[],
  saveReadiness: G13c2EventBPocCleanupDryRunSaveReadiness,
  optimisticLockStale = false,
): G13c2EventBPocCleanupDryRunResult {
  return {
    ok: false,
    dryRun: true,
    phase: G13C2_DRY_RUN_PHASE,
    operationPhase: G13C2D1_PHASE,
    approvalId: G13C2_SCHEDULE_EVENT_B_POC_AUDIT_CLEANUP_NON_DRY_RUN_APPROVAL_ID,
    target: {
      id: beforeSnapshot?.id ?? "",
      legacy_id: beforeSnapshot?.legacy_id ?? "",
      title: String(beforeSnapshot?.title ?? ""),
      date: String(beforeSnapshot?.date ?? ""),
      site_slug: String(beforeSnapshot?.site_slug ?? STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG),
    },
    changedFields: [],
    payloadKeys: [],
    before: {},
    after: {},
    payload: {},
    expectedBeforeUpdatedAt: beforeSnapshot?.updated_at ?? null,
    optimisticLockStale,
    guardErrors,
    saveReadiness,
    saveAllowed: resolveG13c2EventBPocCleanupSaveEnabled(),
    rowsAffectedRequired: 1,
    safety: {
      supabaseWriteCalled: false,
      writeAdapterUsed: false,
      scheduleMonthsTouched: false,
      serviceRoleUsed: false,
      actualWrite: false,
    },
  };
}

/**
 * Pure dry-run preview for G-13c2 Event B PoC cleanup.
 * Does not call updateScheduleWrite or any Supabase mutation.
 */
export function executeG13c2EventBPocCleanupDryRun(input: {
  beforeSnapshot: ScheduleDryRunSource;
  formValues: G13c2EventBPocCleanupFormValues;
  signedIn?: boolean;
  optimisticLockStale?: boolean;
  supabaseUrl?: string;
}): G13c2EventBPocCleanupDryRunResult {
  const guardErrors: string[] = [];
  const optimisticLockStale = input.optimisticLockStale === true;

  if (input.signedIn === false) {
    guardErrors.push("G-13c2 authenticated admin session required.");
    return emptyDryRunResult(
      input.beforeSnapshot,
      guardErrors,
      "guard_error",
      optimisticLockStale,
    );
  }

  if (input.supabaseUrl !== undefined) {
    try {
      assertStaticToAstroCmsStagingSupabaseProject(input.supabaseUrl);
    } catch (error) {
      guardErrors.push(error instanceof Error ? error.message : String(error));
      return emptyDryRunResult(
        input.beforeSnapshot,
        guardErrors,
        "guard_error",
        optimisticLockStale,
      );
    }
  }

  try {
    assertG13c2EventBPocCleanupWritableRow(input.beforeSnapshot);
  } catch (error) {
    guardErrors.push(error instanceof Error ? error.message : String(error));
    return emptyDryRunResult(
      input.beforeSnapshot,
      guardErrors,
      "guard_error",
      optimisticLockStale,
    );
  }

  try {
    assertG13c2OptimisticLockBaseline(input.beforeSnapshot.updated_at);
  } catch (error) {
    guardErrors.push(error instanceof Error ? error.message : String(error));
    return emptyDryRunResult(
      input.beforeSnapshot,
      guardErrors,
      "guard_error",
      optimisticLockStale,
    );
  }

  const changedFields = computeG13c2EventBPocCleanupChangedFields(
    input.beforeSnapshot,
    input.formValues,
  );

  if (changedFields.length === 0) {
    return {
      ...emptyDryRunResult(input.beforeSnapshot, [], "no_changes", optimisticLockStale),
      ok: true,
      saveReadiness: "no_changes",
    };
  }

  try {
    assertG13c2EventBPocCleanupChangedFieldsOnly(changedFields);
    const payload = buildG13c2EventBPocCleanupPayload(changedFields, input.formValues);
    assertG13c2EventBPocCleanupPayloadOnly(payload, changedFields);
  } catch (error) {
    guardErrors.push(error instanceof Error ? error.message : String(error));
    return emptyDryRunResult(
      input.beforeSnapshot,
      guardErrors,
      "guard_error",
      optimisticLockStale,
    );
  }

  const payload = buildG13c2EventBPocCleanupPayload(changedFields, input.formValues);
  const snapshots = buildChangedFieldSnapshots(
    input.beforeSnapshot,
    input.formValues,
    changedFields,
  );
  const saveEnabled = resolveG13c2EventBPocCleanupSaveEnabled();
  const saveReadiness: G13c2EventBPocCleanupDryRunSaveReadiness = saveEnabled
    ? "ready_to_save"
    : "ready_but_save_disabled";

  return {
    ok: true,
    dryRun: true,
    phase: G13C2_DRY_RUN_PHASE,
    operationPhase: G13C2D1_PHASE,
    approvalId: G13C2_SCHEDULE_EVENT_B_POC_AUDIT_CLEANUP_NON_DRY_RUN_APPROVAL_ID,
    target: {
      id: input.beforeSnapshot.id,
      legacy_id: input.beforeSnapshot.legacy_id ?? "",
      title: String(input.beforeSnapshot.title ?? ""),
      date: String(input.beforeSnapshot.date ?? ""),
      site_slug: String(input.beforeSnapshot.site_slug ?? STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG),
    },
    changedFields,
    payloadKeys: Object.keys(payload),
    before: snapshots.before,
    after: snapshots.after,
    payload,
    expectedBeforeUpdatedAt: input.beforeSnapshot.updated_at ?? null,
    optimisticLockStale,
    guardErrors: [],
    saveReadiness,
    saveAllowed: saveEnabled,
    rowsAffectedRequired: 1,
    safety: {
      supabaseWriteCalled: false,
      writeAdapterUsed: false,
      scheduleMonthsTouched: false,
      serviceRoleUsed: false,
      actualWrite: false,
    },
  };
}
