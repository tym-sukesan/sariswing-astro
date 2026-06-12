/**
 * G-6-e3 — Schedule dry-run adapter (pure functions; no Supabase; no writes).
 */

import { assertDryRunOnlyResult, getScheduleDryRunSafety } from "./schedule-dry-run-guards";
import {
  deriveYearMonthFromDate,
  dryRunFormInputToWritePayload,
  validateDryRunFormInput,
} from "./schedule-dry-run-validation";
import type {
  ScheduleDryRunDerivedPreview,
  ScheduleDryRunFormInput,
  ScheduleDryRunResult,
  ScheduleDryRunSource,
} from "./schedule-dry-run-types";

export const G6E3_SCHEDULE_DRY_RUN_ADAPTER_APPROVAL_ID =
  "G-6-e3-schedule-dry-run-adapter-implementation";

const UPDATE_ROLLBACK_HINT =
  "Keep a before snapshot of this schedule row. Manual rollback would restore previous field values by id.";

const DUPLICATE_ROLLBACK_HINT =
  "If this were a real insert, rollback would delete the created test row by id. No row was created in dry-run.";

function todayIso(today: Date): string {
  return today.toISOString().slice(0, 10);
}

function derivePreview(date: string, today: Date): ScheduleDryRunDerivedPreview {
  const { year, month } = deriveYearMonthFromDate(date.trim());
  const iso = date.trim();
  let scheduleGroup: "future" | "past" | undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    scheduleGroup = iso >= todayIso(today) ? "future" : "past";
  }
  return {
    recalculatedYear: year,
    recalculatedMonth: month,
    scheduleGroup,
  };
}

function snapshotSource(source: ScheduleDryRunSource): ScheduleDryRunSource {
  return { ...source };
}

export function buildScheduleUpdateDryRunResult(input: {
  source: ScheduleDryRunSource;
  form: ScheduleDryRunFormInput;
  approvalId?: string;
  today?: Date;
}): ScheduleDryRunResult {
  const today = input.today ?? new Date();
  const validation = validateDryRunFormInput(input.form);
  const wouldWrite = validation.ok;
  const payload = dryRunFormInputToWritePayload(input.form);
  const derivedPreview = derivePreview(input.form.date, today);

  const result: ScheduleDryRunResult = {
    module: "schedule",
    operation: "update",
    targetTable: "schedules",
    targetId: input.source.id,
    dryRun: true,
    wouldWrite,
    actualWrite: false,
    approvalId: input.approvalId ?? G6E3_SCHEDULE_DRY_RUN_ADAPTER_APPROVAL_ID,
    validation,
    beforeSnapshot: snapshotSource(input.source),
    payload,
    derivedPreview,
    rollbackHint: UPDATE_ROLLBACK_HINT,
    message: validation.ok
      ? "Dry-run complete — no Supabase schedule update was called."
      : "Dry-run validation failed — no Supabase schedule update was called.",
    safety: getScheduleDryRunSafety(),
  };

  assertDryRunOnlyResult(result);
  return result;
}

export function buildScheduleDuplicateDryRunResult(input: {
  source: ScheduleDryRunSource;
  overrides?: Partial<ScheduleDryRunFormInput>;
  approvalId?: string;
  today?: Date;
}): ScheduleDryRunResult {
  const today = input.today ?? new Date();
  const baseFromSource: ScheduleDryRunFormInput = {
    date: input.source.date ?? "",
    title: input.source.title ?? "",
    venue: input.source.venue ?? "",
    open_time: input.source.open_time ?? "",
    start_time: input.source.start_time ?? "",
    price: input.source.price ?? "",
    description: input.source.description ?? "",
    published: input.source.published ?? false,
    show_on_home: input.source.show_on_home ?? false,
    home_order: input.source.home_order ?? null,
    sort_order: input.source.sort_order ?? 0,
  };

  const base: ScheduleDryRunFormInput = {
    ...baseFromSource,
    ...input.overrides,
    published: false,
    show_on_home: false,
    home_order: null,
  };

  const validation = validateDryRunFormInput(base);
  const wouldWrite = validation.ok;
  const payload: Record<string, unknown> = {
    legacy_id: null,
    ...dryRunFormInputToWritePayload({
      ...base,
      sort_order: base.sort_order ?? 0,
    }),
    published: false,
    show_on_home: false,
    home_order: null,
    sort_order: base.sort_order ?? 0,
  };

  const derivedPreview = derivePreview(base.date, today);

  const result: ScheduleDryRunResult = {
    module: "schedule",
    operation: "duplicate",
    targetTable: "schedules",
    sourceId: input.source.id,
    dryRun: true,
    wouldWrite,
    actualWrite: false,
    approvalId: input.approvalId ?? G6E3_SCHEDULE_DRY_RUN_ADAPTER_APPROVAL_ID,
    validation,
    beforeSnapshot: snapshotSource(input.source),
    payload,
    derivedPreview,
    rollbackHint: DUPLICATE_ROLLBACK_HINT,
    message: validation.ok
      ? "Dry-run complete — no Supabase schedule insert was called."
      : "Dry-run validation failed — no Supabase schedule insert was called.",
    safety: getScheduleDryRunSafety(),
  };

  assertDryRunOnlyResult(result);
  return result;
}

export function buildScheduleDryRunSelectionError(input: {
  operation: "update" | "duplicate";
  message: string;
  errors: string[];
  approvalId?: string;
}): ScheduleDryRunResult {
  const result: ScheduleDryRunResult = {
    module: "schedule",
    operation: input.operation,
    targetTable: "schedules",
    dryRun: true,
    wouldWrite: false,
    actualWrite: false,
    approvalId: input.approvalId ?? G6E3_SCHEDULE_DRY_RUN_ADAPTER_APPROVAL_ID,
    validation: { ok: false, errors: input.errors, warnings: [] },
    payload: {},
    rollbackHint: "",
    message: input.message,
    safety: getScheduleDryRunSafety(),
  };

  assertDryRunOnlyResult(result);
  return result;
}
