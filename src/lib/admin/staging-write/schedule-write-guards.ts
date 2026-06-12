/**
 * G-6-e4 — Schedule write adapter guards (staging only; no dry-run mode).
 */

import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import {
  SCHEDULE_WRITE_APPROVAL_ID,
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
): asserts approvalId is typeof SCHEDULE_WRITE_APPROVAL_ID {
  if (approvalId !== SCHEDULE_WRITE_APPROVAL_ID) {
    throw new Error(
      `Approval ID mismatch. Expected ${SCHEDULE_WRITE_APPROVAL_ID}, got ${approvalId || "(empty)"}.`,
    );
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
