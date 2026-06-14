/**
 * G-6-f3 — Pure client-side schedule description dry-run (no Supabase write).
 */

import type { ScheduleAdminReadSource } from "./schedule-admin-ui-binding";
import type { ScheduleOptimisticLockDryRunState } from "./schedule-optimistic-lock-types";
import type { ScheduleRecord } from "./schedule-dry-run-types";

export type ScheduleDescriptionDryRunSafety = {
  supabaseWriteCalled: false;
  writeAdapterUsed: false;
  scheduleMonthsTouched: false;
  nonDryRunEnabled: false;
};

export type ScheduleDescriptionDryRunResult = {
  module: "schedule";
  operation: "update";
  targetTable: "schedules";
  targetField: "description";
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
    title?: string | null;
    venue?: string | null;
    description: string | null;
  };
  payload: { description: string };
  afterPreview: {
    id: string;
    legacy_id?: string | null;
    date: string;
    title?: string | null;
    venue?: string | null;
    description: string;
  };
  changedFields: string[];
  optimisticLock?: ScheduleOptimisticLockDryRunState;
  message: string;
  rollbackHint: string;
  safety: ScheduleDescriptionDryRunSafety;
};

const ROLLBACK_HINT =
  "If this were a real update, rollback would restore the previous description value for this schedule id.";

export function buildScheduleDescriptionDryRunResult(input: {
  source: ScheduleRecord;
  newDescription: string;
  approvalId: string;
  readSource: ScheduleAdminReadSource;
  optimisticLock?: ScheduleOptimisticLockDryRunState;
}): ScheduleDescriptionDryRunResult {
  const beforeDescription = input.source.description ?? null;
  const afterDescription = input.newDescription;
  const changedFields =
    beforeDescription !== afterDescription ? (["description"] as string[]) : [];

  const wouldWrite = changedFields.length > 0;
  const staleMessage = input.optimisticLock?.staleDetected
    ? input.optimisticLock.message
    : null;

  return {
    module: "schedule",
    operation: "update",
    targetTable: "schedules",
    targetField: "description",
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
      title: input.source.title ?? null,
      venue: input.source.venue ?? null,
      description: beforeDescription,
    },
    payload: { description: afterDescription },
    afterPreview: {
      id: input.source.id,
      legacy_id: input.source.legacy_id ?? null,
      date: input.source.date,
      title: input.source.title ?? null,
      venue: input.source.venue ?? null,
      description: afterDescription,
    },
    changedFields,
    optimisticLock: input.optimisticLock,
    message: staleMessage
      ? `${staleMessage} Description dry-run preview only — no database write.`
      : wouldWrite
        ? "Description dry-run complete — client-side preview only. No database write."
        : "No changes detected — description unchanged. No database write.",
    rollbackHint: ROLLBACK_HINT,
    safety: {
      supabaseWriteCalled: false,
      writeAdapterUsed: false,
      scheduleMonthsTouched: false,
      nonDryRunEnabled: false,
    },
  };
}

export function buildScheduleDescriptionSelectionError(input: {
  message: string;
  approvalId: string;
  readSource: ScheduleAdminReadSource;
}): ScheduleDescriptionDryRunResult {
  return {
    module: "schedule",
    operation: "update",
    targetTable: "schedules",
    targetField: "description",
    targetId: "",
    dryRun: true,
    wouldWrite: false,
    actualWrite: false,
    approvalId: input.approvalId,
    readSource: input.readSource,
    beforeSnapshot: {
      id: "",
      date: "",
      description: null,
    },
    payload: { description: "" },
    afterPreview: {
      id: "",
      date: "",
      description: "",
    },
    changedFields: [],
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
