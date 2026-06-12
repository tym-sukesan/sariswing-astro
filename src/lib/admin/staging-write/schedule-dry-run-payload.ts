/**
 * G-6-e2/e3 — Schedule dry-run UI helpers (form state; delegates dry-run to adapter).
 */

import {
  buildScheduleDuplicateDryRunResult,
  buildScheduleUpdateDryRunResult,
} from "./schedule-dry-run-adapter";
import { formStateToDryRunInput } from "./schedule-dry-run-validation";
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

/** @deprecated Prefer buildScheduleUpdateDryRunResult from schedule-dry-run-adapter */
export function buildUpdateDryRunResult(
  targetId: string,
  form: ScheduleFormState,
  source?: ScheduleRecord,
): ScheduleDryRunResult {
  const row = source ?? { id: targetId, date: form.date };
  return buildScheduleUpdateDryRunResult({
    source: row,
    form: formStateToDryRunInput(form),
  });
}

/** @deprecated Prefer buildScheduleDuplicateDryRunResult from schedule-dry-run-adapter */
export function buildDuplicateDryRunResult(
  source: ScheduleRecord,
  form?: ScheduleFormState,
): ScheduleDryRunResult {
  return buildScheduleDuplicateDryRunResult({
    source,
    overrides: form ? formStateToDryRunInput(form) : undefined,
  });
}
