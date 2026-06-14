/**
 * G-6-g2 — Time-fields-only dry-run preview (client-side; no Supabase write).
 */

import type { ScheduleAdminReadSource } from "./schedule-admin-ui-binding";
import type { ScheduleOptimisticLockDryRunState } from "./schedule-optimistic-lock-types";
import type { ScheduleRecord } from "./schedule-dry-run-types";
import type { ScheduleUpdateWritePayload } from "./schedule-write-types";

export type ScheduleTimeFieldsDryRunSafety = {
  supabaseWriteCalled: false;
  writeAdapterUsed: false;
  scheduleMonthsTouched: false;
  nonDryRunEnabled: false;
};

export type ScheduleTimeFieldsDryRunResult = {
  module: "schedule";
  operation: "dry-run-update-preview";
  targetTable: "schedules";
  targetFields: ["open_time", "start_time"];
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
    open_time: string | null;
    start_time: string | null;
    updated_at: string | null;
  };
  payload: ScheduleUpdateWritePayload;
  afterPreview: {
    id: string;
    legacy_id?: string | null;
    date: string;
    open_time: string;
    start_time: string;
  };
  changedFields: string[];
  optimisticLock?: ScheduleOptimisticLockDryRunState;
  message: string;
  rollbackHint: string;
  safety: ScheduleTimeFieldsDryRunSafety;
};

const ROLLBACK_HINT =
  "Rollback: update public.schedules set open_time = null, start_time = null where id = target id (staging only).";

export function formatTimeFieldDisplay(value: string | null | undefined): string {
  if (value === null) return "(null)";
  if (value === undefined) return "(undefined)";
  if (value === "") return "(empty)";
  return value;
}

export function buildScheduleTimeFieldsDryRunResult(input: {
  source: ScheduleRecord;
  openTime: string;
  startTime: string;
  approvalId: string;
  readSource: ScheduleAdminReadSource;
  optimisticLock?: ScheduleOptimisticLockDryRunState;
}): ScheduleTimeFieldsDryRunResult {
  const beforeOpen = input.source.open_time ?? null;
  const beforeStart = input.source.start_time ?? null;
  const changedFields: string[] = [];
  if (beforeOpen !== input.openTime) changedFields.push("open_time");
  if (beforeStart !== input.startTime) changedFields.push("start_time");

  return {
    module: "schedule",
    operation: "dry-run-update-preview",
    targetTable: "schedules",
    targetFields: ["open_time", "start_time"],
    targetId: input.source.id,
    legacyId: input.source.legacy_id,
    dryRun: true,
    wouldWrite: changedFields.length > 0,
    actualWrite: false,
    approvalId: input.approvalId,
    readSource: input.readSource,
    beforeSnapshot: {
      id: input.source.id,
      legacy_id: input.source.legacy_id,
      date: input.source.date,
      open_time: beforeOpen,
      start_time: beforeStart,
      updated_at: input.source.updated_at ?? null,
    },
    payload: { open_time: input.openTime, start_time: input.startTime },
    afterPreview: {
      id: input.source.id,
      legacy_id: input.source.legacy_id,
      date: input.source.date,
      open_time: input.openTime,
      start_time: input.startTime,
    },
    changedFields,
    optimisticLock: input.optimisticLock,
    message: changedFields.length
      ? "Dry-run preview: open_time and/or start_time would change."
      : "Dry-run preview: no time field change detected.",
    rollbackHint: ROLLBACK_HINT,
    safety: {
      supabaseWriteCalled: false,
      writeAdapterUsed: false,
      scheduleMonthsTouched: false,
      nonDryRunEnabled: false,
    },
  };
}

export function buildScheduleTimeFieldsSelectionError(input: {
  message: string;
  approvalId: string;
  readSource: ScheduleAdminReadSource;
}): ScheduleTimeFieldsDryRunResult {
  return {
    module: "schedule",
    operation: "dry-run-update-preview",
    targetTable: "schedules",
    targetFields: ["open_time", "start_time"],
    targetId: "",
    dryRun: true,
    wouldWrite: false,
    actualWrite: false,
    approvalId: input.approvalId,
    readSource: input.readSource,
    beforeSnapshot: {
      id: "",
      date: "",
      open_time: null,
      start_time: null,
      updated_at: null,
    },
    payload: { open_time: "", start_time: "" },
    afterPreview: { id: "", date: "", open_time: "", start_time: "" },
    changedFields: [],
    message: input.message,
    rollbackHint: ROLLBACK_HINT,
    safety: {
      supabaseWriteCalled: false,
      writeAdapterUsed: false,
      scheduleMonthsTouched: false,
      nonDryRunEnabled: false,
    },
  };
}
