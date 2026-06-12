/**
 * G-6-e2 — Schedule dry-run payload builders (no Supabase calls).
 */

import {
  deriveYearMonthFromDate,
  formStateToWritePayload,
  validateScheduleForm,
} from "./schedule-dry-run-validation";
import { G6E2_SCHEDULE_DRY_RUN_APPROVAL_ID } from "./staging-schedule-dry-run-config";
import type {
  ScheduleDryRunResult,
  ScheduleFormState,
  ScheduleRecord,
} from "./schedule-dry-run-types";

export function recordToFormState(record: ScheduleRecord): ScheduleFormState {
  return {
    date: record.date ?? "",
    title: record.title ?? "",
    venue: record.venue ?? "",
    open_time: record.open_time ?? "",
    start_time: record.start_time ?? "",
    price: record.price ?? "",
    description: record.description ?? "",
    published: record.published ?? false,
    show_on_home: record.show_on_home ?? false,
    home_order:
      record.home_order != null ? String(record.home_order) : "",
    sort_order:
      record.sort_order != null ? String(record.sort_order) : "0",
  };
}

export function buildUpdateDryRunResult(
  targetId: string,
  form: ScheduleFormState,
): ScheduleDryRunResult {
  const validation = validateScheduleForm(form);
  const payload = formStateToWritePayload(form);
  const { year, month } = deriveYearMonthFromDate(form.date.trim());

  return {
    operation: "update",
    targetTable: "schedules",
    targetId,
    dryRun: true,
    wouldWrite: true,
    actualWrite: false,
    approvalId: G6E2_SCHEDULE_DRY_RUN_APPROVAL_ID,
    validation,
    payload,
    recalculatedYear: year,
    recalculatedMonth: month,
    rollbackHint:
      "Keep a before snapshot of this schedule row. Manual rollback would restore previous field values by id.",
    message: validation.valid
      ? "Dry-run complete — no Supabase schedule update was called."
      : "Dry-run validation failed — no Supabase schedule update was called.",
  };
}

export function buildDuplicateDryRunResult(
  source: ScheduleRecord,
  form?: ScheduleFormState,
): ScheduleDryRunResult {
  const baseForm = form ?? recordToFormState(source);
  const duplicateForm: ScheduleFormState = {
    ...baseForm,
    published: false,
    show_on_home: false,
    home_order: "",
    sort_order: baseForm.sort_order || "0",
  };

  const validation = validateScheduleForm(duplicateForm);
  const payload: Record<string, unknown> = {
    legacy_id: null,
    ...formStateToWritePayload(duplicateForm),
    published: false,
    show_on_home: false,
    home_order: null,
  };

  const { year, month } = deriveYearMonthFromDate(duplicateForm.date.trim());

  return {
    operation: "duplicate",
    targetTable: "schedules",
    sourceId: source.id,
    dryRun: true,
    wouldWrite: true,
    actualWrite: false,
    approvalId: G6E2_SCHEDULE_DRY_RUN_APPROVAL_ID,
    validation,
    payload,
    recalculatedYear: year,
    recalculatedMonth: month,
    rollbackHint:
      "If this were a real insert, rollback would delete the created test row by id. No row was created in dry-run.",
    message: validation.valid
      ? "Dry-run complete — no Supabase schedule insert was called."
      : "Dry-run validation failed — no Supabase schedule insert was called.",
  };
}
