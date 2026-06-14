/**
 * G-6-e4 — Schedule write adapter guards (staging only; no dry-run mode).
 */

import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import {
  G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_APPROVAL_ID,
  SCHEDULE_WRITE_APPROVAL_ID,
  SCHEDULE_WRITE_APPROVAL_IDS,
  type ScheduleWriteApprovalIdUnion,
  type ScheduleUpdateWritePayload,
  type ScheduleWriteSafety,
} from "./schedule-write-types";

const ALLOWED_PAYLOAD_KEYS = new Set([
  "date",
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
  "published",
  "show_on_home",
  "home_order",
  "sort_order",
  "updated_at",
]);

const FORBIDDEN_PAYLOAD_KEYS = new Set([
  "id",
  "legacy_id",
  "year",
  "month",
  "image_url",
  "home_image_url",
  "source_file",
  "source_route",
  "created_at",
  "updated_by",
]);

export function getScheduleWriteSafety(): ScheduleWriteSafety {
  return {
    stagingOnly: true,
    productionBlocked: true,
    serviceRoleUsed: false,
    scheduleMonthsTouched: false,
    deleteEnabled: false,
    publishTriggered: false,
  };
}

export function assertScheduleWriteApprovalId(
  approvalId: string,
): asserts approvalId is ScheduleWriteApprovalIdUnion {
  if (!SCHEDULE_WRITE_APPROVAL_IDS.includes(approvalId as ScheduleWriteApprovalIdUnion)) {
    throw new Error(
      `Approval ID mismatch. Expected one of ${SCHEDULE_WRITE_APPROVAL_IDS.join(", ")}, got ${approvalId || "(empty)"}.`,
    );
  }
}

export function assertG6F6SafeFieldsPayloadOnly(
  payload: ScheduleUpdateWritePayload,
): void {
  const allowedKeys = new Set(["venue", "description"]);
  const keys = Object.keys(payload);
  if (keys.length === 0) {
    throw new Error("G-6-f6 payload must include venue and description.");
  }
  for (const key of keys) {
    if (!allowedKeys.has(key)) {
      throw new Error(`G-6-f6 payload field not allowed: ${key}`);
    }
  }
  if (!keys.includes("venue") || !keys.includes("description")) {
    throw new Error("G-6-f6 payload must include both venue and description.");
  }
}

export function assertScheduleWriteTargetId(targetId: string): void {
  if (typeof targetId !== "string" || targetId.trim() === "") {
    throw new Error("targetId must be a non-empty string.");
  }
}

export function assertBeforeSnapshotMatchesTarget(
  beforeSnapshot: ScheduleDryRunSource,
  targetId: string,
): void {
  const normalizedTarget = targetId.trim();
  const idMatches = beforeSnapshot.id === normalizedTarget;
  const legacyMatches =
    beforeSnapshot.legacy_id != null &&
    String(beforeSnapshot.legacy_id) === normalizedTarget;

  if (!idMatches && !legacyMatches) {
    throw new Error(
      `beforeSnapshot id (${beforeSnapshot.id}) does not match targetId (${normalizedTarget}).`,
    );
  }
}

export function assertScheduleUpdatePayloadAllowed(
  payload: ScheduleUpdateWritePayload,
): void {
  const keys = Object.keys(payload);
  if (keys.length === 0) {
    throw new Error("payload must include at least one allowed field.");
  }

  for (const key of keys) {
    if (FORBIDDEN_PAYLOAD_KEYS.has(key)) {
      throw new Error(`Forbidden payload field: ${key}`);
    }
    if (!ALLOWED_PAYLOAD_KEYS.has(key)) {
      throw new Error(`Disallowed payload field: ${key}`);
    }
  }
}
