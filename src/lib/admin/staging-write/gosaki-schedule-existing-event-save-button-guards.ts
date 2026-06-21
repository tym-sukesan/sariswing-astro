/**
 * G-9k1 — Gosaki operator save button guards (reuse G-9j field set; G-9k approval label).
 */

import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import {
  G9J_EXISTING_EVENT_UPDATE_SAFE_FIELDS,
  assertG9jExistingEventUpdateChangedFieldsOnly,
  assertG9jExistingEventUpdatePayloadOnly,
  assertG9jExistingEventUpdateWritableRow,
  buildG9jExistingEventUpdatePayload,
} from "./schedule-write-guards";
import type { ScheduleUpdateWritePayload } from "./schedule-write-types";
import { G9K_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_APPROVAL_ID } from "./schedule-write-types";

const G9K_LABEL = "G-9k";

export const G9K_EXISTING_EVENT_SAVE_BUTTON_SAFE_FIELDS =
  G9J_EXISTING_EVENT_UPDATE_SAFE_FIELDS;

export type G9kExistingEventSaveButtonSafeField =
  (typeof G9K_EXISTING_EVENT_SAVE_BUTTON_SAFE_FIELDS)[number];

export function assertG9kSaveButtonApproval(approvalId: string): void {
  if (approvalId !== G9K_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_APPROVAL_ID) {
    throw new Error(`${G9K_LABEL} approval ID mismatch.`);
  }
}

export function assertG9kExistingEventSaveButtonChangedFieldsOnly(
  changedFields: string[],
): void {
  assertG9jExistingEventUpdateChangedFieldsOnly(changedFields);
}

export function assertG9kExistingEventSaveButtonPayloadOnly(
  payload: ScheduleUpdateWritePayload,
  expectedChangedFields: string[],
): void {
  assertG9jExistingEventUpdatePayloadOnly(payload, expectedChangedFields);
}

export function assertG9kExistingEventSaveButtonWritableRow(
  row: ScheduleDryRunSource,
): void {
  assertG9jExistingEventUpdateWritableRow(row);
}

export function buildG9kExistingEventSaveButtonPayload(
  changedFields: string[],
  rawValues: Record<string, string>,
): ScheduleUpdateWritePayload {
  return buildG9jExistingEventUpdatePayload(changedFields, rawValues);
}

export function assertG9kRowsAffectedExactlyOne(rowsAffected: number): void {
  if (rowsAffected !== 1) {
    throw new Error(
      `${G9K_LABEL} rowsAffected must be exactly 1 (got ${String(rowsAffected)}).`,
    );
  }
}

export function assertG9kOptimisticLockBaseline(
  expectedBeforeUpdatedAt: string | undefined | null,
): void {
  if (!String(expectedBeforeUpdatedAt ?? "").trim()) {
    throw new Error(`${G9K_LABEL} expectedBeforeUpdatedAt is required.`);
  }
}

export function assertG9kAuthSessionPresent(signedIn: boolean): void {
  if (!signedIn) {
    throw new Error(`${G9K_LABEL} authenticated admin session required.`);
  }
}
