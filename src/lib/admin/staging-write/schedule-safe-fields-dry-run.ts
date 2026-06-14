/**
 * G-6-f4 — Pure client-side schedule safe-fields dry-run (no Supabase write).
 */

import type { ScheduleAdminReadSource } from "./schedule-admin-ui-binding";
import type { ScheduleOptimisticLockDryRunState } from "./schedule-optimistic-lock-types";
import {
  SCHEDULE_SAFE_DRY_RUN_FIELDS,
  type ScheduleSafeDryRunField,
} from "./schedule-safe-fields-dry-run-config";
import type { ScheduleRecord } from "./schedule-dry-run-types";

export type ScheduleSafeFieldsDryRunSafety = {
  supabaseWriteCalled: false;
  writeAdapterUsed: false;
  scheduleMonthsTouched: false;
  nonDryRunEnabled: false;
};

export type ScheduleSafeFieldsSnapshot = Record<ScheduleSafeDryRunField, string | null>;

export type ScheduleSafeFieldsFormInput = Record<ScheduleSafeDryRunField, string>;

export type ScheduleSafeFieldsDryRunValidation = {
  warnings: string[];
};

export type ScheduleSafeFieldsDryRunResult = {
  module: "schedule";
  operation: "dry-run-update-preview";
  targetTable: "schedules";
  targetFields: ScheduleSafeDryRunField[];
  targetId: string;
  legacyId?: string | null;
  dryRun: true;
  wouldWrite: boolean;
  actualWrite: false;
  approvalId: string;
  readSource: ScheduleAdminReadSource;
  beforeSnapshot: {
    id: string;
    legacy_id?: string | null;
    date: string;
    safeFields: ScheduleSafeFieldsSnapshot;
  };
  payload: ScheduleSafeFieldsFormInput;
  afterPreview: {
    id: string;
    legacy_id?: string | null;
    date: string;
    title: string;
    venue: string;
    open_time: string;
    start_time: string;
    price: string;
    description: string;
  };
  changedFields: string[];
  validation: ScheduleSafeFieldsDryRunValidation;
  optimisticLock?: ScheduleOptimisticLockDryRunState;
  message: string;
  rollbackHint: string;
  safety: ScheduleSafeFieldsDryRunSafety;
};

const ROLLBACK_HINT =
  "If this were a real update, rollback would restore previous safe-field values for this schedule id.";

export function normalizeSafeFieldForCompare(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  return value;
}

export function formatSafeFieldDisplay(value: string | null | undefined): string {
  if (value === null) return "(null)";
  if (value === undefined) return "(undefined)";
  if (value === "") return "(empty)";
  return value;
}

export function snapshotSafeFieldsFromRecord(record: ScheduleRecord): ScheduleSafeFieldsSnapshot {
  return {
    title: record.title ?? null,
    venue: record.venue ?? null,
    open_time: record.open_time ?? null,
    start_time: record.start_time ?? null,
    price: record.price ?? null,
    description: record.description ?? null,
  };
}

export function detectChangedSafeFields(
  before: ScheduleSafeFieldsSnapshot,
  form: ScheduleSafeFieldsFormInput,
): string[] {
  const changed: string[] = [];
  for (const field of SCHEDULE_SAFE_DRY_RUN_FIELDS) {
    if (normalizeSafeFieldForCompare(before[field]) !== form[field]) {
      changed.push(field);
    }
  }
  return changed;
}

export function buildSafeFieldsValidationWarnings(
  form: ScheduleSafeFieldsFormInput,
): ScheduleSafeFieldsDryRunValidation {
  const warnings: string[] = [];
  if (!form.title.trim()) {
    warnings.push("title is empty — legacy imported rows may use empty or placeholder titles.");
  }
  if (form.description.length > 2000) {
    warnings.push("description exceeds 2000 characters — review before any future non-dry-run phase.");
  }
  return { warnings };
}

export function buildScheduleSafeFieldsDryRunResult(input: {
  source: ScheduleRecord;
  form: ScheduleSafeFieldsFormInput;
  approvalId: string;
  readSource: ScheduleAdminReadSource;
  optimisticLock?: ScheduleOptimisticLockDryRunState;
}): ScheduleSafeFieldsDryRunResult {
  const beforeSafe = snapshotSafeFieldsFromRecord(input.source);
  const changedFields = detectChangedSafeFields(beforeSafe, input.form);
  const validation = buildSafeFieldsValidationWarnings(input.form);
  const wouldWrite = changedFields.length > 0;
  const staleMessage = input.optimisticLock?.staleDetected
    ? input.optimisticLock.message
    : null;

  return {
    module: "schedule",
    operation: "dry-run-update-preview",
    targetTable: "schedules",
    targetFields: [...SCHEDULE_SAFE_DRY_RUN_FIELDS],
    targetId: input.source.id,
    legacyId: input.source.legacy_id ?? null,
    dryRun: true,
    wouldWrite,
    actualWrite: false,
    approvalId: input.approvalId,
    readSource: input.readSource,
    beforeSnapshot: {
      id: input.source.id,
      legacy_id: input.source.legacy_id ?? null,
      date: input.source.date,
      safeFields: beforeSafe,
    },
    payload: { ...input.form },
    afterPreview: {
      id: input.source.id,
      legacy_id: input.source.legacy_id ?? null,
      date: input.source.date,
      title: input.form.title,
      venue: input.form.venue,
      open_time: input.form.open_time,
      start_time: input.form.start_time,
      price: input.form.price,
      description: input.form.description,
    },
    changedFields,
    validation,
    optimisticLock: input.optimisticLock,
    message: staleMessage
      ? `${staleMessage} Safe-fields dry-run preview only — no database write.`
      : wouldWrite
        ? "Safe-fields dry-run complete — client-side preview only. No database write."
        : "No changes detected — safe fields unchanged (no-op preview). No database write.",
    rollbackHint: ROLLBACK_HINT,
    safety: {
      supabaseWriteCalled: false,
      writeAdapterUsed: false,
      scheduleMonthsTouched: false,
      nonDryRunEnabled: false,
    },
  };
}

export function buildScheduleSafeFieldsSelectionError(input: {
  message: string;
  approvalId: string;
  readSource: ScheduleAdminReadSource;
}): ScheduleSafeFieldsDryRunResult {
  const emptyForm: ScheduleSafeFieldsFormInput = {
    title: "",
    venue: "",
    open_time: "",
    start_time: "",
    price: "",
    description: "",
  };

  return {
    module: "schedule",
    operation: "dry-run-update-preview",
    targetTable: "schedules",
    targetFields: [...SCHEDULE_SAFE_DRY_RUN_FIELDS],
    targetId: "",
    dryRun: true,
    wouldWrite: false,
    actualWrite: false,
    approvalId: input.approvalId,
    readSource: input.readSource,
    beforeSnapshot: {
      id: "",
      date: "",
      safeFields: {
        title: null,
        venue: null,
        open_time: null,
        start_time: null,
        price: null,
        description: null,
      },
    },
    payload: emptyForm,
    afterPreview: {
      id: "",
      date: "",
      title: "",
      venue: "",
      open_time: "",
      start_time: "",
      price: "",
      description: "",
    },
    changedFields: [],
    validation: { warnings: [] },
    message: input.message,
    rollbackHint: "",
    safety: {
      supabaseWriteCalled: false,
      writeAdapterUsed: false,
      scheduleMonthsTouched: false,
      nonDryRunEnabled: false,
    },
  };
}
