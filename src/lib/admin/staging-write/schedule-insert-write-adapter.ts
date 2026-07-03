/**
 * G-22d1 — Schedule INSERT write adapter (staging only; separate from update adapter).
 */

import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import { assertScheduleWriteApprovalId, getScheduleWriteSafety } from "./schedule-write-guards";
import type {
  ScheduleInsertWritePayload,
  ScheduleWriteApprovalIdUnion,
} from "./schedule-write-types";

const INSERT_SUCCESS_ROLLBACK_HINT =
  "Manual rollback: DELETE FROM public.schedules WHERE id = <inserted_id> (staging only).";
const NO_ROLLBACK_HINT = "No rollback required because actualWrite is false.";

export type ScheduleInsertWriteOperation = "duplicate-insert" | "new-event-insert";

export type ScheduleInsertWriteQueryResult = {
  data: ScheduleDryRunSource | null;
  error: { message: string; code?: string } | null;
};

export type ScheduleInsertWriteSelectBuilder = {
  select: (columns?: string) => ScheduleInsertWriteSelectBuilder;
  single: () => Promise<ScheduleInsertWriteQueryResult>;
};

export type ScheduleInsertWriteTableBuilder = {
  insert: (payload: ScheduleInsertWritePayload) => ScheduleInsertWriteSelectBuilder;
};

export type ScheduleInsertWriteClient = {
  from: (table: "schedules") => ScheduleInsertWriteTableBuilder;
};

export type ScheduleInsertWriteFailureResult = {
  module: "schedule";
  operation: ScheduleInsertWriteOperation;
  targetTable: "schedules";
  dryRun: false;
  actualWrite: false;
  approvalId?: string;
  sourceId?: string;
  errorCode: string;
  errorMessage: string;
  payload?: ScheduleInsertWritePayload;
  rollbackHint: string;
  safety: ReturnType<typeof getScheduleWriteSafety>;
};

export type ScheduleInsertWriteResult = {
  module: "schedule";
  operation: ScheduleInsertWriteOperation;
  targetTable: "schedules";
  dryRun: false;
  actualWrite: true;
  approvalId: ScheduleWriteApprovalIdUnion;
  sourceId?: string;
  insertedId: string;
  payload: ScheduleInsertWritePayload;
  afterSnapshot: ScheduleDryRunSource;
  rollbackHint: string;
  safety: ReturnType<typeof getScheduleWriteSafety>;
};

export type ScheduleInsertWriteAdapterResult =
  | ScheduleInsertWriteResult
  | ScheduleInsertWriteFailureResult;

function toScheduleSource(row: Record<string, unknown>): ScheduleDryRunSource {
  return row as unknown as ScheduleDryRunSource;
}

function buildFailure(
  operation: ScheduleInsertWriteOperation,
  partial: Pick<
    ScheduleInsertWriteFailureResult,
    "errorCode" | "errorMessage" | "approvalId" | "sourceId" | "payload"
  >,
): ScheduleInsertWriteFailureResult {
  return {
    module: "schedule",
    operation,
    targetTable: "schedules",
    dryRun: false,
    actualWrite: false,
    rollbackHint: NO_ROLLBACK_HINT,
    safety: getScheduleWriteSafety(),
    ...partial,
  };
}

async function executeScheduleInsertWrite(input: {
  client: ScheduleInsertWriteClient;
  approvalId: ScheduleWriteApprovalIdUnion;
  operation: ScheduleInsertWriteOperation;
  sourceId?: string;
  payload: ScheduleInsertWritePayload;
}): Promise<ScheduleInsertWriteAdapterResult> {
  const { client, approvalId, operation, sourceId, payload } = input;

  try {
    assertScheduleWriteApprovalId(approvalId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return buildFailure(operation, {
      approvalId,
      sourceId,
      payload,
      errorCode: "guard_failed",
      errorMessage: message,
    });
  }

  const { data: insertedRow, error: insertError } = await client
    .from("schedules")
    .insert(payload)
    .select("*")
    .single();

  if (insertError) {
    return buildFailure(operation, {
      approvalId,
      sourceId,
      payload,
      errorCode: "insert_failed",
      errorMessage: insertError.message,
    });
  }

  if (!insertedRow) {
    return buildFailure(operation, {
      approvalId,
      sourceId,
      payload,
      errorCode: "after_select_failed",
      errorMessage: "INSERT may have succeeded but inserted row could not be loaded.",
    });
  }

  const afterSnapshot = toScheduleSource(
    insertedRow as unknown as Record<string, unknown>,
  );
  const insertedId = String(afterSnapshot.id ?? "").trim();
  if (!insertedId) {
    return buildFailure(operation, {
      approvalId,
      sourceId,
      payload,
      errorCode: "inserted_id_missing",
      errorMessage: "INSERT succeeded but inserted id is missing.",
    });
  }

  return {
    module: "schedule",
    operation,
    targetTable: "schedules",
    dryRun: false,
    actualWrite: true,
    approvalId,
    sourceId,
    insertedId,
    payload,
    afterSnapshot,
    rollbackHint: INSERT_SUCCESS_ROLLBACK_HINT.replace("<inserted_id>", insertedId),
    safety: getScheduleWriteSafety(),
  };
}

export async function insertScheduleWrite(input: {
  client: ScheduleInsertWriteClient;
  approvalId: ScheduleWriteApprovalIdUnion;
  sourceId: string;
  payload: ScheduleInsertWritePayload;
}): Promise<ScheduleInsertWriteAdapterResult> {
  return executeScheduleInsertWrite({
    ...input,
    operation: "duplicate-insert",
  });
}

export async function insertNewEventScheduleWrite(input: {
  client: ScheduleInsertWriteClient;
  approvalId: ScheduleWriteApprovalIdUnion;
  payload: ScheduleInsertWritePayload;
}): Promise<ScheduleInsertWriteAdapterResult> {
  return executeScheduleInsertWrite({
    ...input,
    operation: "new-event-insert",
  });
}
