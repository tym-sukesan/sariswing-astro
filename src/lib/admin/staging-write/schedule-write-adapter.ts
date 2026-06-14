/**
 * G-6-e4 — Schedule write adapter (staging only; update-only; not wired to UI in this phase).
 * Separate module from schedule-dry-run-adapter. No runScheduleWrite({ dryRun }) mode flag.
 */

import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import {
  assertBeforeSnapshotMatchesTarget,
  assertScheduleUpdatePayloadAllowed,
  assertScheduleWriteApprovalId,
  assertScheduleWriteTargetId,
  getScheduleWriteSafety,
} from "./schedule-write-guards";
import type {
  ScheduleUpdateWritePayload,
  ScheduleWriteAdapterResult,
  ScheduleWriteClient,
  ScheduleWriteFailureResult,
  ScheduleWriteResult,
  ScheduleWriteVerificationRequiredResult,
  ScheduleWriteApprovalIdUnion,
} from "./schedule-write-types";

const SUCCESS_ROLLBACK_HINT =
  "Manual rollback required if needed. Restore beforeSnapshot fields on public.schedules by id.";
const NO_ROLLBACK_HINT =
  "No rollback required because actualWrite is false.";

function buildFailure(
  partial: Pick<
    ScheduleWriteFailureResult,
    "errorCode" | "errorMessage" | "targetId" | "approvalId" | "beforeSnapshot" | "payload"
  >,
): ScheduleWriteFailureResult {
  return {
    module: "schedule",
    operation: "update",
    targetTable: "schedules",
    dryRun: false,
    actualWrite: false,
    rollbackHint: NO_ROLLBACK_HINT,
    safety: getScheduleWriteSafety(),
    ...partial,
  };
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  return String(a) === String(b);
}

function computeChangedFields(
  before: ScheduleDryRunSource,
  after: ScheduleDryRunSource,
  payload: ScheduleUpdateWritePayload,
): string[] {
  const changed: string[] = [];
  for (const key of Object.keys(payload) as (keyof ScheduleUpdateWritePayload)[]) {
    if (!valuesEqual(before[key], after[key])) {
      changed.push(key);
    }
  }
  return changed;
}

function toScheduleSource(row: Record<string, unknown>): ScheduleDryRunSource {
  return row as unknown as ScheduleDryRunSource;
}

export async function updateScheduleWrite(input: {
  client: ScheduleWriteClient;
  approvalId: ScheduleWriteApprovalIdUnion;
  targetId: string;
  beforeSnapshot: ScheduleDryRunSource;
  payload: ScheduleUpdateWritePayload;
  expectedBeforeUpdatedAt?: string | null;
}): Promise<ScheduleWriteAdapterResult> {
  const {
    client,
    approvalId,
    targetId,
    beforeSnapshot,
    payload,
    expectedBeforeUpdatedAt,
  } = input;

  try {
    assertScheduleWriteApprovalId(approvalId);
    assertScheduleWriteTargetId(targetId);
    assertBeforeSnapshotMatchesTarget(beforeSnapshot, targetId);
    assertScheduleUpdatePayloadAllowed(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return buildFailure({
      approvalId,
      targetId: targetId || undefined,
      beforeSnapshot,
      payload,
      errorCode: "guard_failed",
      errorMessage: message,
    });
  }

  if (expectedBeforeUpdatedAt != null && expectedBeforeUpdatedAt !== "") {
    const { data: currentRow, error: selectError } = await client
      .from("schedules")
      .select("*")
      .eq("id", beforeSnapshot.id)
      .single();

    if (selectError) {
      return buildFailure({
        approvalId,
        targetId: beforeSnapshot.id,
        beforeSnapshot,
        payload,
        errorCode: "optimistic_lock_select_failed",
        errorMessage: selectError.message,
      });
    }

    const currentUpdatedAt = currentRow?.updated_at ?? null;
    if (currentUpdatedAt !== expectedBeforeUpdatedAt) {
      return buildFailure({
        approvalId,
        targetId: beforeSnapshot.id,
        beforeSnapshot,
        payload,
        errorCode: "optimistic_lock_failed",
        errorMessage: `expectedBeforeUpdatedAt (${expectedBeforeUpdatedAt}) does not match current updated_at (${currentUpdatedAt ?? "null"}).`,
      });
    }
  }

  const { data: updatedRow, error: updateError } = await client
    .from("schedules")
    .update(payload)
    .eq("id", beforeSnapshot.id)
    .select("*")
    .single();

  if (updateError) {
    return buildFailure({
      approvalId,
      targetId: beforeSnapshot.id,
      beforeSnapshot,
      payload,
      errorCode: "update_failed",
      errorMessage: updateError.message,
    });
  }

  if (!updatedRow) {
    const verificationRequired: ScheduleWriteVerificationRequiredResult = {
      module: "schedule",
      operation: "update",
      targetTable: "schedules",
      targetId: beforeSnapshot.id,
      dryRun: false,
      actualWrite: true,
      approvalId,
      beforeSnapshot,
      payload,
      errorCode: "after_select_failed",
      errorMessage:
        "Update may have succeeded but afterSnapshot could not be loaded. Manual verification required.",
      rollbackHint: SUCCESS_ROLLBACK_HINT,
      safety: getScheduleWriteSafety(),
    };
    return verificationRequired;
  }

  const afterSnapshot = toScheduleSource(
    updatedRow as unknown as Record<string, unknown>,
  );
  const changedFields = computeChangedFields(
    beforeSnapshot,
    afterSnapshot,
    payload,
  );

  const result: ScheduleWriteResult = {
    module: "schedule",
    operation: "update",
    targetTable: "schedules",
    targetId: beforeSnapshot.id,
    dryRun: false,
    actualWrite: true,
    approvalId,
    rowsAffected: 1,
    beforeSnapshot,
    payload,
    afterSnapshot,
    changedFields,
    rollbackHint: SUCCESS_ROLLBACK_HINT,
    safety: getScheduleWriteSafety(),
  };

  return result;
}
