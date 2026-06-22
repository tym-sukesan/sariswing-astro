/**
 * G-9k2 — Gosaki operator save button dry-run (no DB write).
 */

import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "../staging-data/staging-schedule-site-slug-config";
import { assertStaticToAstroCmsStagingSupabaseProject } from "../staging-data/staging-schedule-site-slug-host-gate";
import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import {
  G9K2_PHASE,
  resolveG9kOperatorSaveButtonSaveEnabled,
} from "./gosaki-schedule-existing-event-save-button-config";
import {
  G9K_EXISTING_EVENT_SAVE_BUTTON_SAFE_FIELDS,
  assertG9kAuthSessionPresent,
  assertG9kExistingEventSaveButtonChangedFieldsOnly,
  assertG9kExistingEventSaveButtonPayloadOnly,
  assertG9kExistingEventSaveButtonWritableRow,
  assertG9kOptimisticLockBaseline,
  buildG9kExistingEventSaveButtonPayload,
  type G9kExistingEventSaveButtonSafeField,
} from "./gosaki-schedule-existing-event-save-button-guards";
import { G9K_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_APPROVAL_ID } from "./schedule-write-types";
import type { ScheduleUpdateWritePayload } from "./schedule-write-types";

export type G9kExistingEventSaveButtonFormValues = Record<
  G9kExistingEventSaveButtonSafeField,
  string
>;

export type G9kSaveButtonDryRunSafety = {
  supabaseWriteCalled: false;
  writeAdapterUsed: false;
  scheduleMonthsTouched: false;
  serviceRoleUsed: false;
  actualWrite: false;
};

export type G9kSaveButtonDryRunSaveReadiness =
  | "no_changes"
  | "guard_error"
  | "ready_but_save_disabled"
  | "ready_to_save";

export type G9kExistingEventSaveButtonDryRunResult = {
  ok: boolean;
  dryRun: true;
  phase: typeof G9K2_PHASE;
  approvalId: typeof G9K_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_APPROVAL_ID;
  target: {
    id: string;
    title: string;
    date: string;
    site_slug: string;
  };
  changedFields: string[];
  payloadKeys: string[];
  before: Partial<Record<G9kExistingEventSaveButtonSafeField, string | null>>;
  after: Partial<Record<G9kExistingEventSaveButtonSafeField, string | null>>;
  payload: ScheduleUpdateWritePayload;
  expectedBeforeUpdatedAt: string | null;
  optimisticLockStale: boolean;
  guardErrors: string[];
  saveReadiness: G9kSaveButtonDryRunSaveReadiness;
  saveAllowed: false;
  rowsAffectedRequired: 1;
  safety: G9kSaveButtonDryRunSafety;
};

function normalizeCompare(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function snapshotSafeField(
  row: ScheduleDryRunSource,
  field: G9kExistingEventSaveButtonSafeField,
): string | null {
  const value = row[field];
  if (value === null || value === undefined) return null;
  return String(value);
}

export function computeG9kExistingEventSaveButtonChangedFields(
  beforeSnapshot: ScheduleDryRunSource,
  formValues: G9kExistingEventSaveButtonFormValues,
): string[] {
  const changedFields: string[] = [];
  for (const field of G9K_EXISTING_EVENT_SAVE_BUTTON_SAFE_FIELDS) {
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
  formValues: G9kExistingEventSaveButtonFormValues,
  changedFields: string[],
): {
  before: Partial<Record<G9kExistingEventSaveButtonSafeField, string | null>>;
  after: Partial<Record<G9kExistingEventSaveButtonSafeField, string | null>>;
} {
  const before: Partial<Record<G9kExistingEventSaveButtonSafeField, string | null>> = {};
  const after: Partial<Record<G9kExistingEventSaveButtonSafeField, string | null>> = {};
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
  saveReadiness: G9kSaveButtonDryRunSaveReadiness,
  optimisticLockStale = false,
): G9kExistingEventSaveButtonDryRunResult {
  return {
    ok: false,
    dryRun: true,
    phase: G9K2_PHASE,
    approvalId: G9K_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_APPROVAL_ID,
    target: {
      id: beforeSnapshot?.id ?? "",
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
    saveAllowed: resolveG9kOperatorSaveButtonSaveEnabled(),
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
 * Pure dry-run preview for Gosaki operator save button path (G-9k).
 * Does not call updateScheduleWrite or any Supabase mutation.
 */
export function executeG9kExistingEventSaveButtonDryRun(input: {
  beforeSnapshot: ScheduleDryRunSource;
  formValues: G9kExistingEventSaveButtonFormValues;
  signedIn?: boolean;
  optimisticLockStale?: boolean;
  supabaseUrl?: string;
}): G9kExistingEventSaveButtonDryRunResult {
  const guardErrors: string[] = [];
  const optimisticLockStale = input.optimisticLockStale === true;

  if (input.signedIn === false) {
    guardErrors.push("G-9k authenticated admin session required.");
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
    assertG9kExistingEventSaveButtonWritableRow(input.beforeSnapshot);
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
    assertG9kOptimisticLockBaseline(input.beforeSnapshot.updated_at);
  } catch (error) {
    guardErrors.push(error instanceof Error ? error.message : String(error));
    return emptyDryRunResult(
      input.beforeSnapshot,
      guardErrors,
      "guard_error",
      optimisticLockStale,
    );
  }

  if (input.signedIn === true) {
    try {
      assertG9kAuthSessionPresent(true);
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

  const changedFields = computeG9kExistingEventSaveButtonChangedFields(
    input.beforeSnapshot,
    input.formValues,
  );

  if (changedFields.length === 0) {
    guardErrors.push("G-9k dry-run: no safe-field changes detected.");
    return emptyDryRunResult(
      input.beforeSnapshot,
      guardErrors,
      "no_changes",
      optimisticLockStale,
    );
  }

  try {
    assertG9kExistingEventSaveButtonChangedFieldsOnly(changedFields);
    const payload = buildG9kExistingEventSaveButtonPayload(changedFields, input.formValues);
    assertG9kExistingEventSaveButtonPayloadOnly(payload, changedFields);
    const { before, after } = buildChangedFieldSnapshots(
      input.beforeSnapshot,
      input.formValues,
      changedFields,
    );

    if (optimisticLockStale) {
      guardErrors.push(
        "G-9k dry-run: optimistic lock stale — expectedBeforeUpdatedAt no longer matches row.",
      );
    }

    const ok = guardErrors.length === 0;
    const saveReadiness: G9kSaveButtonDryRunSaveReadiness = !ok
      ? "guard_error"
      : resolveG9kOperatorSaveButtonSaveEnabled()
        ? "ready_to_save"
        : "ready_but_save_disabled";

    return {
      ok,
      dryRun: true,
      phase: G9K2_PHASE,
      approvalId: G9K_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_APPROVAL_ID,
      target: {
        id: input.beforeSnapshot.id,
        title: String(input.beforeSnapshot.title ?? ""),
        date: String(input.beforeSnapshot.date ?? ""),
        site_slug: String(
          input.beforeSnapshot.site_slug ?? STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        ),
      },
      changedFields: [...changedFields],
      payloadKeys: Object.keys(payload),
      before,
      after,
      payload,
      expectedBeforeUpdatedAt: input.beforeSnapshot.updated_at ?? null,
      optimisticLockStale,
      guardErrors,
      saveReadiness,
      saveAllowed: resolveG9kOperatorSaveButtonSaveEnabled(),
      rowsAffectedRequired: 1,
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
    return emptyDryRunResult(
      input.beforeSnapshot,
      guardErrors,
      "guard_error",
      optimisticLockStale,
    );
  }
}
