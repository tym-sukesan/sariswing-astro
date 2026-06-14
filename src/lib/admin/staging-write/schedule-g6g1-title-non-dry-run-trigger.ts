/**
 * G-6-g1 — Title non-dry-run slice trigger (product path).
 * Uses executeScheduleGeneralUpdateWrite + assertG6G1TitlePayloadOnly.
 * Separate from G-6-e5 / G-6-f6 PoC triggers.
 */

import {
  G6G1_SCHEDULE_TITLE_SLICE_EXPECTED_DESCRIPTION,
  G6G1_SCHEDULE_TITLE_SLICE_EXPECTED_VENUE,
  G6G1_SCHEDULE_TITLE_SLICE_LEGACY_ID,
  G6G1_SCHEDULE_TITLE_SLICE_TARGET_ID,
  getScheduleGeneralEditConfig,
} from "./schedule-general-edit-config";
import { executeScheduleGeneralUpdateWrite } from "./schedule-general-update-trigger";
import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import { assertG6G1TitlePayloadOnly } from "./schedule-write-guards";
import {
  G6G1_SCHEDULE_TITLE_NON_DRY_RUN_SLICE_APPROVAL_ID,
  type ScheduleUpdateWritePayload,
  type ScheduleWriteAdapterResult,
} from "./schedule-write-types";

export type G6G1TitleBeforeSnapshotCheckResult = {
  ok: boolean;
  abortReason?: string;
  warnings: string[];
  row?: ScheduleDryRunSource;
};

export function validateG6G1TitleBeforeSnapshot(
  row: ScheduleDryRunSource,
): G6G1TitleBeforeSnapshotCheckResult {
  const warnings: string[] = [];

  if (row.id !== G6G1_SCHEDULE_TITLE_SLICE_TARGET_ID) {
    return {
      ok: false,
      abortReason: `id mismatch (expected ${G6G1_SCHEDULE_TITLE_SLICE_TARGET_ID}, got ${row.id}).`,
      warnings,
    };
  }

  if (row.legacy_id !== G6G1_SCHEDULE_TITLE_SLICE_LEGACY_ID) {
    return {
      ok: false,
      abortReason: `legacy_id mismatch (expected ${G6G1_SCHEDULE_TITLE_SLICE_LEGACY_ID}, got ${row.legacy_id ?? "null"}).`,
      warnings,
    };
  }

  if (row.venue !== G6G1_SCHEDULE_TITLE_SLICE_EXPECTED_VENUE) {
    return {
      ok: false,
      abortReason: `venue mismatch (expected G-6-f6 value, got "${row.venue ?? ""}").`,
      warnings,
    };
  }

  if (row.description !== G6G1_SCHEDULE_TITLE_SLICE_EXPECTED_DESCRIPTION) {
    return {
      ok: false,
      abortReason: `description mismatch (expected G-6-f6 value).`,
      warnings,
    };
  }

  if (row.title !== "<>") {
    warnings.push(`title is "${row.title ?? ""}" (expected "<>").`);
  }

  if (row.show_on_home !== false) {
    warnings.push(`show_on_home is ${String(row.show_on_home)} (expected false).`);
  }

  if (row.published !== true) {
    warnings.push(`published is ${String(row.published)} (expected true).`);
  }

  return { ok: true, warnings, row };
}

export type G6G1TitleNonDryRunSaveOutcome = {
  preCheck: G6G1TitleBeforeSnapshotCheckResult;
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

export async function executeG6G1TitleNonDryRunSave(options: {
  url: string;
  anonKey: string;
  beforeSnapshot: ScheduleDryRunSource;
  payload: ScheduleUpdateWritePayload;
}): Promise<G6G1TitleNonDryRunSaveOutcome> {
  const config = getScheduleGeneralEditConfig();
  if (!config.saveEnabled) {
    return {
      preCheck: {
        ok: false,
        abortReason: config.armFailureReason ?? "G-6-g1 slice gates not satisfied.",
        warnings: [],
      },
      optimisticLockEnabled: false,
      expectedBeforeUpdatedAt: null,
      warnings: [],
      errorCode: "slice_not_armed",
      errorMessage: config.armFailureReason ?? "G-6-g1 slice not armed.",
    };
  }

  const preCheck = validateG6G1TitleBeforeSnapshot(options.beforeSnapshot);
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
    assertG6G1TitlePayloadOnly(options.payload);
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
    approvalId: G6G1_SCHEDULE_TITLE_NON_DRY_RUN_SLICE_APPROVAL_ID,
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
