/**
 * G-6-g2 — Time fields non-dry-run slice trigger (product path).
 * Uses executeScheduleGeneralUpdateWrite + assertG6G2TimeFieldsPayloadOnly.
 * Separate from G-6-e5 / G-6-f6 / G-6-g1 PoC triggers.
 */

import {
  G6G2_SCHEDULE_TIME_FIELDS_SLICE_EXPECTED_DESCRIPTION,
  G6G2_SCHEDULE_TIME_FIELDS_SLICE_EXPECTED_TITLE,
  G6G2_SCHEDULE_TIME_FIELDS_SLICE_EXPECTED_VENUE,
  G6G2_SCHEDULE_TIME_FIELDS_SLICE_LEGACY_ID,
  G6G2_SCHEDULE_TIME_FIELDS_SLICE_TARGET_ID,
  getScheduleG6G2TimeFieldsEditConfig,
} from "./schedule-general-edit-config";
import { executeScheduleGeneralUpdateWrite } from "./schedule-general-update-trigger";
import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import { assertG6G2TimeFieldsPayloadOnly } from "./schedule-write-guards";
import {
  G6G2_SCHEDULE_TIME_FIELDS_NON_DRY_RUN_SLICE_APPROVAL_ID,
  type ScheduleUpdateWritePayload,
  type ScheduleWriteAdapterResult,
} from "./schedule-write-types";

export type G6G2TimeFieldsBeforeSnapshotCheckResult = {
  ok: boolean;
  abortReason?: string;
  warnings: string[];
  row?: ScheduleDryRunSource;
};

export function validateG6G2TimeFieldsBeforeSnapshot(
  row: ScheduleDryRunSource,
): G6G2TimeFieldsBeforeSnapshotCheckResult {
  const warnings: string[] = [];

  if (row.id !== G6G2_SCHEDULE_TIME_FIELDS_SLICE_TARGET_ID) {
    return {
      ok: false,
      abortReason: `id mismatch (expected ${G6G2_SCHEDULE_TIME_FIELDS_SLICE_TARGET_ID}, got ${row.id}).`,
      warnings,
    };
  }

  if (row.legacy_id !== G6G2_SCHEDULE_TIME_FIELDS_SLICE_LEGACY_ID) {
    return {
      ok: false,
      abortReason: `legacy_id mismatch (expected ${G6G2_SCHEDULE_TIME_FIELDS_SLICE_LEGACY_ID}, got ${row.legacy_id ?? "null"}).`,
      warnings,
    };
  }

  if (row.title !== G6G2_SCHEDULE_TIME_FIELDS_SLICE_EXPECTED_TITLE) {
    return {
      ok: false,
      abortReason: `title mismatch (expected G-6-g1 post-value, got "${row.title ?? ""}").`,
      warnings,
    };
  }

  if (row.venue !== G6G2_SCHEDULE_TIME_FIELDS_SLICE_EXPECTED_VENUE) {
    return {
      ok: false,
      abortReason: `venue mismatch (expected G-6-f6 value, got "${row.venue ?? ""}").`,
      warnings,
    };
  }

  if (row.description !== G6G2_SCHEDULE_TIME_FIELDS_SLICE_EXPECTED_DESCRIPTION) {
    return {
      ok: false,
      abortReason: "description mismatch (expected G-6-f6 value).",
      warnings,
    };
  }

  if (row.open_time !== null) {
    warnings.push(`open_time is "${row.open_time}" (expected null).`);
  }

  if (row.start_time !== null) {
    warnings.push(`start_time is "${row.start_time}" (expected null).`);
  }

  if (row.show_on_home !== false) {
    warnings.push(`show_on_home is ${String(row.show_on_home)} (expected false).`);
  }

  if (row.published !== true) {
    warnings.push(`published is ${String(row.published)} (expected true).`);
  }

  return { ok: true, warnings, row };
}

export type G6G2TimeFieldsNonDryRunSaveOutcome = {
  preCheck: G6G2TimeFieldsBeforeSnapshotCheckResult;
  authEmail?: string;
  authStatus?: string;
  mockRole?: string;
  optimisticLockEnabled: boolean;
  expectedBeforeUpdatedAt: string | null;
  warnings: string[];
  errorCode?: string;
  errorMessage?: string;
  result?: ScheduleWriteAdapterResult;
};

export async function executeG6G2TimeFieldsNonDryRunSave(options: {
  url: string;
  anonKey: string;
  beforeSnapshot: ScheduleDryRunSource;
  payload: ScheduleUpdateWritePayload;
}): Promise<G6G2TimeFieldsNonDryRunSaveOutcome> {
  const config = getScheduleG6G2TimeFieldsEditConfig();
  if (!config.saveEnabled) {
    return {
      preCheck: {
        ok: false,
        abortReason: config.armFailureReason ?? "G-6-g2 slice gates not satisfied.",
        warnings: [],
      },
      optimisticLockEnabled: false,
      expectedBeforeUpdatedAt: null,
      warnings: [],
      errorCode: "slice_not_armed",
      errorMessage: config.armFailureReason ?? "G-6-g2 slice not armed.",
    };
  }

  const preCheck = validateG6G2TimeFieldsBeforeSnapshot(options.beforeSnapshot);
  if (!preCheck.ok) {
    return {
      preCheck,
      optimisticLockEnabled: false,
      expectedBeforeUpdatedAt: null,
      warnings: preCheck.warnings,
      errorCode: "before_snapshot_mismatch",
      errorMessage: preCheck.abortReason,
    };
  }

  try {
    assertG6G2TimeFieldsPayloadOnly(options.payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      preCheck,
      optimisticLockEnabled: false,
      expectedBeforeUpdatedAt: null,
      warnings: preCheck.warnings,
      errorCode: "write_guard_failed",
      errorMessage: message,
    };
  }

  const outcome = await executeScheduleGeneralUpdateWrite({
    url: options.url,
    anonKey: options.anonKey,
    approvalId: G6G2_SCHEDULE_TIME_FIELDS_NON_DRY_RUN_SLICE_APPROVAL_ID,
    targetId: options.beforeSnapshot.id,
    beforeSnapshot: options.beforeSnapshot,
    payload: options.payload,
  });

  return {
    preCheck,
    authEmail: outcome.authEmail,
    authStatus: outcome.authStatus,
    mockRole: outcome.mockRole,
    optimisticLockEnabled: outcome.optimisticLockEnabled,
    expectedBeforeUpdatedAt: outcome.expectedBeforeUpdatedAt,
    warnings: [...preCheck.warnings, ...outcome.warnings],
    errorCode: outcome.errorCode,
    errorMessage: outcome.errorMessage,
    result: outcome.result,
  };
}
