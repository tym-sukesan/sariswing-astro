/**
 * G-9j1 — Gosaki operator existing event update dry-run (no DB write).
 */

import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "../staging-data/staging-schedule-site-slug-config";
import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import {
  G9J1_PHASE,
  G9J_EXISTING_EVENT_UPDATE_SAVE_ENABLED,
} from "./gosaki-schedule-existing-event-update-config";
import {
  G9J_EXISTING_EVENT_UPDATE_SAFE_FIELDS,
  assertG9jExistingEventUpdateChangedFieldsOnly,
  assertG9jExistingEventUpdatePayloadOnly,
  assertG9jExistingEventUpdateWritableRow,
  buildG9jExistingEventUpdatePayload,
  type G9jExistingEventUpdateSafeField,
} from "./schedule-write-guards";
import { G9J_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_APPROVAL_ID } from "./schedule-write-types";
import type { ScheduleUpdateWritePayload } from "./schedule-write-types";

export type G9jExistingEventUpdateFormValues = Record<
  G9jExistingEventUpdateSafeField,
  string
>;

export type G9jExistingEventUpdateDryRunSafety = {
  supabaseWriteCalled: false;
  writeAdapterUsed: false;
  scheduleMonthsTouched: false;
  serviceRoleUsed: false;
  actualWrite: false;
};

export type G9jExistingEventUpdateDryRunResult = {
  ok: boolean;
  dryRun: true;
  phase: typeof G9J1_PHASE;
  approvalId: typeof G9J_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_APPROVAL_ID;
  target: {
    id: string;
    title: string;
    date: string;
    site_slug: string;
  };
  changedFields: string[];
  before: Partial<Record<G9jExistingEventUpdateSafeField, string | null>>;
  after: Partial<Record<G9jExistingEventUpdateSafeField, string | null>>;
  payload: ScheduleUpdateWritePayload;
  expectedBeforeUpdatedAt: string | null;
  optimisticLockStale: boolean;
  guardErrors: string[];
  saveAllowed: false;
  safety: G9jExistingEventUpdateDryRunSafety;
};

function normalizeCompare(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function snapshotSafeField(
  row: ScheduleDryRunSource,
  field: G9jExistingEventUpdateSafeField,
): string | null {
  const value = row[field];
  if (value === null || value === undefined) return null;
  return String(value);
}

export function computeG9jExistingEventUpdateChangedFields(
  beforeSnapshot: ScheduleDryRunSource,
  formValues: G9jExistingEventUpdateFormValues,
): string[] {
  const changedFields: string[] = [];
  for (const field of G9J_EXISTING_EVENT_UPDATE_SAFE_FIELDS) {
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
  formValues: G9jExistingEventUpdateFormValues,
  changedFields: string[],
): {
  before: Partial<Record<G9jExistingEventUpdateSafeField, string | null>>;
  after: Partial<Record<G9jExistingEventUpdateSafeField, string | null>>;
} {
  const before: Partial<Record<G9jExistingEventUpdateSafeField, string | null>> = {};
  const after: Partial<Record<G9jExistingEventUpdateSafeField, string | null>> = {};
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
  optimisticLockStale = false,
): G9jExistingEventUpdateDryRunResult {
  return {
    ok: false,
    dryRun: true,
    phase: G9J1_PHASE,
    approvalId: G9J_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_APPROVAL_ID,
    target: {
      id: beforeSnapshot?.id ?? "",
      title: String(beforeSnapshot?.title ?? ""),
      date: String(beforeSnapshot?.date ?? ""),
      site_slug: String(beforeSnapshot?.site_slug ?? STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG),
    },
    changedFields: [],
    before: {},
    after: {},
    payload: {},
    expectedBeforeUpdatedAt: beforeSnapshot?.updated_at ?? null,
    optimisticLockStale,
    guardErrors,
    saveAllowed: false,
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
 * Pure dry-run preview for Gosaki operator existing event edit form.
 * Does not call updateScheduleWrite or any Supabase mutation.
 */
export function executeG9jExistingEventUpdateDryRun(input: {
  beforeSnapshot: ScheduleDryRunSource;
  formValues: G9jExistingEventUpdateFormValues;
  optimisticLockStale?: boolean;
}): G9jExistingEventUpdateDryRunResult {
  const guardErrors: string[] = [];
  const optimisticLockStale = input.optimisticLockStale === true;

  try {
    assertG9jExistingEventUpdateWritableRow(input.beforeSnapshot);
  } catch (error) {
    guardErrors.push(error instanceof Error ? error.message : String(error));
    return emptyDryRunResult(input.beforeSnapshot, guardErrors, optimisticLockStale);
  }

  const changedFields = computeG9jExistingEventUpdateChangedFields(
    input.beforeSnapshot,
    input.formValues,
  );

  if (changedFields.length === 0) {
    guardErrors.push("G-9j dry-run: no safe-field changes detected.");
    return emptyDryRunResult(input.beforeSnapshot, guardErrors, optimisticLockStale);
  }

  try {
    assertG9jExistingEventUpdateChangedFieldsOnly(changedFields);
    const payload = buildG9jExistingEventUpdatePayload(changedFields, input.formValues);
    assertG9jExistingEventUpdatePayloadOnly(payload, changedFields);
    const { before, after } = buildChangedFieldSnapshots(
      input.beforeSnapshot,
      input.formValues,
      changedFields,
    );

    if (optimisticLockStale) {
      guardErrors.push(
        "G-9j dry-run: optimistic lock stale — expectedBeforeUpdatedAt no longer matches row.",
      );
    }

    const ok = guardErrors.length === 0;

    return {
      ok,
      dryRun: true,
      phase: G9J1_PHASE,
      approvalId: G9J_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_APPROVAL_ID,
      target: {
        id: input.beforeSnapshot.id,
        title: String(input.beforeSnapshot.title ?? ""),
        date: String(input.beforeSnapshot.date ?? ""),
        site_slug: String(
          input.beforeSnapshot.site_slug ?? STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        ),
      },
      changedFields: [...changedFields],
      before,
      after,
      payload,
      expectedBeforeUpdatedAt: input.beforeSnapshot.updated_at ?? null,
      optimisticLockStale,
      guardErrors,
      saveAllowed: G9J_EXISTING_EVENT_UPDATE_SAVE_ENABLED,
      safety: {
        supabaseWriteCalled: false,
        writeAdapterUsed: false,
        scheduleMonthsTouched: false,
        serviceRoleUsed: false,
        actualWrite: false,
      },
    };
  } catch (error) {
    guardErrors.push(error instanceof Error ? error.message : String(error));
    return emptyDryRunResult(input.beforeSnapshot, guardErrors, optimisticLockStale);
  }
}
