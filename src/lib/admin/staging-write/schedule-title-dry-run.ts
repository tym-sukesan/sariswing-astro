/**
 * G-6-g1 — Title-only dry-run preview (client-side; no Supabase write).
 */

import type { ScheduleAdminReadSource } from "./schedule-admin-ui-binding";
import type { ScheduleOptimisticLockDryRunState } from "./schedule-optimistic-lock-types";
import type { ScheduleRecord } from "./schedule-dry-run-types";
import type { ScheduleUpdateWritePayload } from "./schedule-write-types";

export type ScheduleTitleDryRunSafety = {
  supabaseWriteCalled: false;
  writeAdapterUsed: false;
  scheduleMonthsTouched: false;
  nonDryRunEnabled: false;
};

export type ScheduleTitleDryRunResult = {
  module: "schedule";
  operation: "dry-run-update-preview";
  targetTable: "schedules";
  targetFields: ["title"];
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
    title: string | null;
    updated_at: string | null;
  };
  payload: ScheduleUpdateWritePayload;
  afterPreview: {
    id: string;
    legacy_id?: string | null;
    date: string;
    title: string;
  };
  changedFields: string[];
  optimisticLock?: ScheduleOptimisticLockDryRunState;
  message: string;
  rollbackHint: string;
  safety: ScheduleTitleDryRunSafety;
};

const ROLLBACK_HINT =
  "Rollback: update public.schedules set title = '<>' where id = target id (staging only).";

export function formatTitleDisplay(value: string | null | undefined): string {
  if (value === null) return "(null)";
  if (value === undefined) return "(undefined)";
  if (value === "") return "(empty)";
  return value;
}

export function buildScheduleTitleDryRunResult(input: {
  source: ScheduleRecord;
  title: string;
  approvalId: string;
  readSource: ScheduleAdminReadSource;
  optimisticLock?: ScheduleOptimisticLockDryRunState;
}): ScheduleTitleDryRunResult {
  const beforeTitle = input.source.title ?? null;
  const changedFields =
    beforeTitle !== input.title ? (["title"] as string[]) : [];

  return {
    module: "schedule",
    operation: "dry-run-update-preview",
    targetTable: "schedules",
    targetFields: ["title"],
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
      title: beforeTitle,
      updated_at: input.source.updated_at ?? null,
    },
    payload: { title: input.title },
    afterPreview: {
      id: input.source.id,
      legacy_id: input.source.legacy_id,
      date: input.source.date,
      title: input.title,
    },
    changedFields,
    optimisticLock: input.optimisticLock,
    message: changedFields.length
      ? "Dry-run preview: title would change."
      : "Dry-run preview: no title change detected.",
    rollbackHint: ROLLBACK_HINT,
    safety: {
      supabaseWriteCalled: false,
      writeAdapterUsed: false,
      scheduleMonthsTouched: false,
      nonDryRunEnabled: false,
    },
  };
}

export function buildScheduleTitleSelectionError(input: {
  message: string;
  approvalId: string;
  readSource: ScheduleAdminReadSource;
}): ScheduleTitleDryRunResult {
  return {
    module: "schedule",
    operation: "dry-run-update-preview",
    targetTable: "schedules",
    targetFields: ["title"],
    targetId: "",
    dryRun: true,
    wouldWrite: false,
    actualWrite: false,
    approvalId: input.approvalId,
    readSource: input.readSource,
    beforeSnapshot: {
      id: "",
      date: "",
      title: null,
      updated_at: null,
    },
    payload: { title: "" },
    afterPreview: { id: "", date: "", title: "" },
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
