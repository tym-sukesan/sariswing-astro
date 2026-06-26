/**
 * G-13d1 / G-13c1 — Gosaki Event A PoC cleanup guards (staging shell only).
 */

import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "../staging-data/staging-schedule-site-slug-config";
import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import {
  G13C1_EVENT_A_POC_CLEANUP_CHANGED_FIELDS,
  G13C1_EVENT_A_POC_CLEANUP_EXPECTED_DESCRIPTION,
  G13C1_EVENT_A_POC_CLEANUP_EXPECTED_OPEN_TIME,
  G13C1_EVENT_A_POC_CLEANUP_EXPECTED_PRICE,
  G13C1_EVENT_A_POC_CLEANUP_EXPECTED_START_TIME,
  G13C1_EVENT_A_POC_CLEANUP_EXPECTED_TITLE,
  G13C1_EVENT_A_POC_CLEANUP_EXPECTED_VENUE,
  G13C1_EVENT_A_POC_CLEANUP_TARGET_LEGACY_ID,
  G13C1_EVENT_A_POC_CLEANUP_TARGET_ROW_ID,
  type G13c1EventAPocCleanupFormValues,
  type G13c1EventAPocCleanupSafeField,
} from "./gosaki-schedule-event-a-poc-cleanup-config";
import {
  buildG9G3dGeneralEditPayload,
  normalizeG9G3dGeneralEditFieldValue,
} from "./schedule-write-guards";
import {
  G13C1_SCHEDULE_EVENT_A_POC_CLEANUP_NON_DRY_RUN_APPROVAL_ID,
  type ScheduleUpdateWritePayload,
} from "./schedule-write-types";

const G13C1_LABEL = "G-13c1";

const EXPECTED_BY_FIELD: Record<G13c1EventAPocCleanupSafeField, string> = {
  title: G13C1_EVENT_A_POC_CLEANUP_EXPECTED_TITLE,
  venue: G13C1_EVENT_A_POC_CLEANUP_EXPECTED_VENUE,
  open_time: G13C1_EVENT_A_POC_CLEANUP_EXPECTED_OPEN_TIME,
  start_time: G13C1_EVENT_A_POC_CLEANUP_EXPECTED_START_TIME,
  price: G13C1_EVENT_A_POC_CLEANUP_EXPECTED_PRICE,
  description: G13C1_EVENT_A_POC_CLEANUP_EXPECTED_DESCRIPTION,
};

export function assertG13c1EventAPocCleanupApproval(approvalId: string): void {
  if (approvalId !== G13C1_SCHEDULE_EVENT_A_POC_CLEANUP_NON_DRY_RUN_APPROVAL_ID) {
    throw new Error(`${G13C1_LABEL} approval ID mismatch.`);
  }
}

export function assertG13c1EventAPocCleanupWritableRow(row: ScheduleDryRunSource): void {
  if (row.id !== G13C1_EVENT_A_POC_CLEANUP_TARGET_ROW_ID) {
    throw new Error(`${G13C1_LABEL} target id mismatch.`);
  }
  if (row.legacy_id !== G13C1_EVENT_A_POC_CLEANUP_TARGET_LEGACY_ID) {
    throw new Error(`${G13C1_LABEL} target legacy_id mismatch.`);
  }
  if (row.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    throw new Error(`${G13C1_LABEL} site_slug must be ${STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG}.`);
  }
}

export function assertG13c1EventAPocCleanupChangedFieldsOnly(
  changedFields: string[],
): void {
  if (changedFields.length === 0) {
    throw new Error(`${G13C1_LABEL} changedFields must include at least one field.`);
  }
  const allowed = new Set<string>(G13C1_EVENT_A_POC_CLEANUP_CHANGED_FIELDS);
  for (const field of changedFields) {
    if (!allowed.has(field)) {
      throw new Error(`${G13C1_LABEL} changed field not allowed: ${field}`);
    }
  }
}

export function assertG13c1EventAPocCleanupBundleChangedFields(
  changedFields: string[],
): void {
  assertG13c1EventAPocCleanupChangedFieldsOnly(changedFields);
  const expected = [...G13C1_EVENT_A_POC_CLEANUP_CHANGED_FIELDS].sort();
  const actual = [...changedFields].sort();
  if (expected.length !== actual.length || !expected.every((field, i) => field === actual[i])) {
    throw new Error(
      `${G13C1_LABEL} Save requires full cleanup bundle: ${expected.join(", ")}.`,
    );
  }
}

export function assertG13c1EventAPocCleanupPayloadMatchesTargets(
  payload: ScheduleUpdateWritePayload,
  changedFields: string[],
): void {
  for (const field of changedFields) {
    const expected = EXPECTED_BY_FIELD[field as G13c1EventAPocCleanupSafeField];
    const actual = payload[field as keyof ScheduleUpdateWritePayload];
    const normalizedExpected = normalizeG9G3dGeneralEditFieldValue(field, expected);
    if (actual !== normalizedExpected) {
      throw new Error(`${G13C1_LABEL} payload ${field} must equal cleanup target.`);
    }
  }
}

export function assertG13c1EventAPocCleanupPayloadOnly(
  payload: ScheduleUpdateWritePayload,
  expectedChangedFields: string[],
): void {
  const keys = Object.keys(payload);
  const expected = new Set(expectedChangedFields);
  if (keys.length !== expected.size) {
    throw new Error(`${G13C1_LABEL} payload keys must match changedFields exactly.`);
  }
  for (const key of keys) {
    if (!expected.has(key)) {
      throw new Error(`${G13C1_LABEL} payload field ${key} not in changedFields`);
    }
  }
  assertG13c1EventAPocCleanupPayloadMatchesTargets(payload, expectedChangedFields);
}

export function buildG13c1EventAPocCleanupPayload(
  changedFields: string[],
  formValues: G13c1EventAPocCleanupFormValues,
): ScheduleUpdateWritePayload {
  return buildG9G3dGeneralEditPayload(changedFields, formValues);
}

export function assertG13c1RowsAffectedExactlyOne(rowsAffected: number): void {
  if (rowsAffected !== 1) {
    throw new Error(
      `${G13C1_LABEL} rowsAffected must be exactly 1 (got ${String(rowsAffected)}).`,
    );
  }
}

export function assertG13c1OptimisticLockBaseline(
  expectedBeforeUpdatedAt: string | undefined | null,
): void {
  if (!String(expectedBeforeUpdatedAt ?? "").trim()) {
    throw new Error(`${G13C1_LABEL} expectedBeforeUpdatedAt is required.`);
  }
}
