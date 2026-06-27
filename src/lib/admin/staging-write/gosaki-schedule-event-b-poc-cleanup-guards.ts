/**
 * G-13c2d1 / G-13c2 — Gosaki Event B PoC cleanup guards (staging shell only).
 */

import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "../staging-data/staging-schedule-site-slug-config";
import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import {
  G13C2_EVENT_B_POC_CLEANUP_CHANGED_FIELDS,
  G13C2_EVENT_B_POC_CLEANUP_EXPECTED_DESCRIPTION,
  G13C2_EVENT_B_POC_CLEANUP_EXPECTED_TITLE,
  G13C2_EVENT_B_POC_CLEANUP_NULL_FIELD_FORM_VALUE,
  G13C2_EVENT_B_POC_CLEANUP_TARGET_DATE,
  G13C2_EVENT_B_POC_CLEANUP_TARGET_LEGACY_ID,
  G13C2_EVENT_B_POC_CLEANUP_TARGET_ROW_ID,
  type G13c2EventBPocCleanupFormValues,
  type G13c2EventBPocCleanupSafeField,
} from "./gosaki-schedule-event-b-poc-cleanup-config";
import {
  buildG9G3dGeneralEditPayload,
  normalizeG9G3dGeneralEditFieldValue,
} from "./schedule-write-guards";
import {
  G13C2_SCHEDULE_EVENT_B_POC_AUDIT_CLEANUP_NON_DRY_RUN_APPROVAL_ID,
  type ScheduleUpdateWritePayload,
} from "./schedule-write-types";

const G13C2_LABEL = "G-13c2";

const EXPECTED_BY_FIELD: Record<G13c2EventBPocCleanupSafeField, string> = {
  title: G13C2_EVENT_B_POC_CLEANUP_EXPECTED_TITLE,
  venue: G13C2_EVENT_B_POC_CLEANUP_NULL_FIELD_FORM_VALUE,
  open_time: G13C2_EVENT_B_POC_CLEANUP_NULL_FIELD_FORM_VALUE,
  start_time: G13C2_EVENT_B_POC_CLEANUP_NULL_FIELD_FORM_VALUE,
  price: G13C2_EVENT_B_POC_CLEANUP_NULL_FIELD_FORM_VALUE,
  description: G13C2_EVENT_B_POC_CLEANUP_EXPECTED_DESCRIPTION,
};

export function assertG13c2EventBPocCleanupApproval(approvalId: string): void {
  if (approvalId !== G13C2_SCHEDULE_EVENT_B_POC_AUDIT_CLEANUP_NON_DRY_RUN_APPROVAL_ID) {
    throw new Error(`${G13C2_LABEL} approval ID mismatch.`);
  }
}

export function assertG13c2EventBPocCleanupWritableRow(row: ScheduleDryRunSource): void {
  if (row.id !== G13C2_EVENT_B_POC_CLEANUP_TARGET_ROW_ID) {
    throw new Error(`${G13C2_LABEL} target id mismatch.`);
  }
  if (row.legacy_id !== G13C2_EVENT_B_POC_CLEANUP_TARGET_LEGACY_ID) {
    throw new Error(`${G13C2_LABEL} target legacy_id mismatch.`);
  }
  if (row.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    throw new Error(`${G13C2_LABEL} site_slug must be ${STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG}.`);
  }
  if (row.date !== G13C2_EVENT_B_POC_CLEANUP_TARGET_DATE) {
    throw new Error(`${G13C2_LABEL} target date mismatch.`);
  }
}

export function assertG13c2EventBPocCleanupChangedFieldsOnly(
  changedFields: string[],
): void {
  if (changedFields.length === 0) {
    throw new Error(`${G13C2_LABEL} changedFields must include at least one field.`);
  }
  const allowed = new Set<string>(G13C2_EVENT_B_POC_CLEANUP_CHANGED_FIELDS);
  for (const field of changedFields) {
    if (!allowed.has(field)) {
      throw new Error(`${G13C2_LABEL} changed field not allowed: ${field}`);
    }
  }
}

export function assertG13c2EventBPocCleanupBundleChangedFields(
  changedFields: string[],
): void {
  assertG13c2EventBPocCleanupChangedFieldsOnly(changedFields);
  const expected = [...G13C2_EVENT_B_POC_CLEANUP_CHANGED_FIELDS].sort();
  const actual = [...changedFields].sort();
  if (expected.length !== actual.length || !expected.every((field, i) => field === actual[i])) {
    throw new Error(
      `${G13C2_LABEL} Save requires full cleanup bundle: ${expected.join(", ")}.`,
    );
  }
}

export function assertG13c2EventBPocCleanupPayloadMatchesTargets(
  payload: ScheduleUpdateWritePayload,
  changedFields: string[],
): void {
  for (const field of changedFields) {
    const expected = EXPECTED_BY_FIELD[field as G13c2EventBPocCleanupSafeField];
    const actual = payload[field as keyof ScheduleUpdateWritePayload];
    const normalizedExpected = normalizeG9G3dGeneralEditFieldValue(field, expected);
    if (actual !== normalizedExpected) {
      throw new Error(`${G13C2_LABEL} payload ${field} must equal cleanup target.`);
    }
    if (
      field !== "title" &&
      field !== "description" &&
      normalizedExpected === null &&
      actual === ""
    ) {
      throw new Error(`${G13C2_LABEL} payload ${field} must be DB null, not empty string.`);
    }
  }
}

export function assertG13c2EventBPocCleanupPayloadOnly(
  payload: ScheduleUpdateWritePayload,
  expectedChangedFields: string[],
): void {
  const keys = Object.keys(payload);
  const expected = new Set(expectedChangedFields);
  if (keys.length !== expected.size) {
    throw new Error(`${G13C2_LABEL} payload keys must match changedFields exactly.`);
  }
  for (const key of keys) {
    if (!expected.has(key)) {
      throw new Error(`${G13C2_LABEL} payload field ${key} not in changedFields`);
    }
  }
  assertG13c2EventBPocCleanupPayloadMatchesTargets(payload, expectedChangedFields);
}

export function buildG13c2EventBPocCleanupPayload(
  changedFields: string[],
  formValues: G13c2EventBPocCleanupFormValues,
): ScheduleUpdateWritePayload {
  return buildG9G3dGeneralEditPayload(changedFields, formValues);
}

export function assertG13c2RowsAffectedExactlyOne(rowsAffected: number): void {
  if (rowsAffected !== 1) {
    throw new Error(
      `${G13C2_LABEL} rowsAffected must be exactly 1 (got ${String(rowsAffected)}).`,
    );
  }
}

export function assertG13c2OptimisticLockBaseline(
  expectedBeforeUpdatedAt: string | undefined | null,
): void {
  if (!String(expectedBeforeUpdatedAt ?? "").trim()) {
    throw new Error(`${G13C2_LABEL} expectedBeforeUpdatedAt is required.`);
  }
}
