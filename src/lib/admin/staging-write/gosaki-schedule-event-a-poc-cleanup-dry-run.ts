/**
 * G-13d1 / G-13c1 — Gosaki Event A PoC cleanup dry-run (no DB write).
 */

import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "../staging-data/staging-schedule-site-slug-config";
import { assertStaticToAstroCmsStagingSupabaseProject } from "../staging-data/staging-schedule-site-slug-host-gate";
import {
  G13C1_EVENT_A_POC_CLEANUP_CHANGED_FIELDS,
  G13D1_PHASE,
  type G13c1EventAPocCleanupFormValues,
  type G13c1EventAPocCleanupSafeField,
  resolveG13c1EventAPocCleanupSaveEnabled,
} from "./gosaki-schedule-event-a-poc-cleanup-config";
import {
  assertG13c1EventAPocCleanupChangedFieldsOnly,
  assertG13c1EventAPocCleanupPayloadOnly,
  assertG13c1EventAPocCleanupWritableRow,
  assertG13c1OptimisticLockBaseline,
  buildG13c1EventAPocCleanupPayload,
} from "./gosaki-schedule-event-a-poc-cleanup-guards";
import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import {
  G13C1_SCHEDULE_EVENT_A_POC_CLEANUP_NON_DRY_RUN_APPROVAL_ID,
  type ScheduleUpdateWritePayload,
} from "./schedule-write-types";
export const G13C1_DRY_RUN_PHASE = "G-13c1-gosaki-schedule-event-a-poc-cleanup-dry-run";

export type G13c1EventAPocCleanupDryRunSafety = {
  supabaseWriteCalled: false;
  writeAdapterUsed: false;
  scheduleMonthsTouched: false;
  serviceRoleUsed: false;
  actualWrite: false;
};

export type G13c1EventAPocCleanupDryRunSaveReadiness =
  | "no_changes"
  | "guard_error"
  | "ready_but_save_disabled"
  | "ready_to_save";

export type G13c1EventAPocCleanupDryRunResult = {
  ok: boolean;
  dryRun: true;
  phase: typeof G13C1_DRY_RUN_PHASE;
  operationPhase: typeof G13D1_PHASE;
  approvalId: typeof G13C1_SCHEDULE_EVENT_A_POC_CLEANUP_NON_DRY_RUN_APPROVAL_ID;
  target: {
    id: string;
    legacy_id: string;
    title: string;
    date: string;
    site_slug: string;
  };
  changedFields: string[];
  payloadKeys: string[];
  before: Partial<Record<G13c1EventAPocCleanupSafeField, string | null>>;
  after: Partial<Record<G13c1EventAPocCleanupSafeField, string | null>>;
  payload: ScheduleUpdateWritePayload;
  expectedBeforeUpdatedAt: string | null;
  optimisticLockStale: boolean;
  guardErrors: string[];
  saveReadiness: G13c1EventAPocCleanupDryRunSaveReadiness;
  saveAllowed: boolean;
  rowsAffectedRequired: 1;
  safety: G13c1EventAPocCleanupDryRunSafety;
};

function normalizeCompare(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function snapshotSafeField(
  row: ScheduleDryRunSource,
  field: G13c1EventAPocCleanupSafeField,
): string | null {
  const value = row[field];
  if (value === null || value === undefined) return null;
  return String(value);
}

export function computeG13c1EventAPocCleanupChangedFields(
  beforeSnapshot: ScheduleDryRunSource,
  formValues: G13c1EventAPocCleanupFormValues,
): string[] {
  const changedFields: string[] = [];
  for (const field of G13C1_EVENT_A_POC_CLEANUP_CHANGED_FIELDS) {
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
  formValues: G13c1EventAPocCleanupFormValues,
  changedFields: string[],
): {
  before: Partial<Record<G13c1EventAPocCleanupSafeField, string | null>>;
  after: Partial<Record<G13c1EventAPocCleanupSafeField, string | null>>;
} {
  const before: Partial<Record<G13c1EventAPocCleanupSafeField, string | null>> = {};
  const after: Partial<Record<G13c1EventAPocCleanupSafeField, string | null>> = {};
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
  saveReadiness: G13c1EventAPocCleanupDryRunSaveReadiness,
  optimisticLockStale = false,
): G13c1EventAPocCleanupDryRunResult {
  return {
    ok: false,
    dryRun: true,
    phase: G13C1_DRY_RUN_PHASE,
    operationPhase: G13D1_PHASE,
    approvalId: G13C1_SCHEDULE_EVENT_A_POC_CLEANUP_NON_DRY_RUN_APPROVAL_ID,
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
    saveAllowed: resolveG13c1EventAPocCleanupSaveEnabled(),
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
 * Pure dry-run preview for G-13c1 Event A PoC cleanup.
 * Does not call updateScheduleWrite or any Supabase mutation.
 */
export function executeG13c1EventAPocCleanupDryRun(input: {
  beforeSnapshot: ScheduleDryRunSource;
  formValues: G13c1EventAPocCleanupFormValues;
  signedIn?: boolean;
  optimisticLockStale?: boolean;
  supabaseUrl?: string;
}): G13c1EventAPocCleanupDryRunResult {
  const guardErrors: string[] = [];
  const optimisticLockStale = input.optimisticLockStale === true;

  if (input.signedIn === false) {
    guardErrors.push("G-13c1 authenticated admin session required.");
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
    assertG13c1EventAPocCleanupWritableRow(input.beforeSnapshot);
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
    assertG13c1OptimisticLockBaseline(input.beforeSnapshot.updated_at);
  } catch (error) {
    guardErrors.push(error instanceof Error ? error.message : String(error));
    return emptyDryRunResult(
      input.beforeSnapshot,
      guardErrors,
      "guard_error",
      optimisticLockStale,
    );
  }

  const changedFields = computeG13c1EventAPocCleanupChangedFields(
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
    assertG13c1EventAPocCleanupChangedFieldsOnly(changedFields);
    const payload = buildG13c1EventAPocCleanupPayload(changedFields, input.formValues);
    assertG13c1EventAPocCleanupPayloadOnly(payload, changedFields);
  } catch (error) {
    guardErrors.push(error instanceof Error ? error.message : String(error));
    return emptyDryRunResult(
      input.beforeSnapshot,
      guardErrors,
      "guard_error",
      optimisticLockStale,
    );
  }

  const payload = buildG13c1EventAPocCleanupPayload(changedFields, input.formValues);
  const snapshots = buildChangedFieldSnapshots(
    input.beforeSnapshot,
    input.formValues,
    changedFields,
  );
  const saveEnabled = resolveG13c1EventAPocCleanupSaveEnabled();
  const saveReadiness: G13c1EventAPocCleanupDryRunSaveReadiness = saveEnabled
    ? "ready_to_save"
    : "ready_but_save_disabled";

  return {
    ok: true,
    dryRun: true,
    phase: G13C1_DRY_RUN_PHASE,
    operationPhase: G13D1_PHASE,
    approvalId: G13C1_SCHEDULE_EVENT_A_POC_CLEANUP_NON_DRY_RUN_APPROVAL_ID,
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
