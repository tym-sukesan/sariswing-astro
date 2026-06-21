/**
 * G-9k4a — Gosaki operator save button non-dry-run save (UI path; not G-9j5 runner).
 */

import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "../staging-data/staging-schedule-site-slug-config";
import {
  assertStaticToAstroCmsStagingSupabaseProject,
  evaluateSupabaseHostGate,
} from "../staging-data/staging-schedule-site-slug-host-gate";
import {
  G9K4A_PHASE,
  getG9kExistingEventSaveButtonConfig,
} from "./gosaki-schedule-existing-event-save-button-config";
import {
  executeG9kExistingEventSaveButtonDryRun,
  type G9kExistingEventSaveButtonFormValues,
} from "./gosaki-schedule-existing-event-save-button-dry-run";
import {
  assertG9kExistingEventSaveButtonChangedFieldsOnly,
  assertG9kExistingEventSaveButtonPayloadOnly,
  assertG9kExistingEventSaveButtonWritableRow,
  assertG9kOptimisticLockBaseline,
  assertG9kRowsAffectedExactlyOne,
  assertG9kSaveButtonApproval,
  buildG9kExistingEventSaveButtonPayload,
} from "./gosaki-schedule-existing-event-save-button-guards";
import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import {
  collectScheduleNonDryRunPocAuthWarnings,
  formatMockRoleDisplay,
  isSignedInStagingAuth,
} from "./schedule-non-dry-run-poc-auth";
import { buildScheduleLockedWriteRequest } from "./schedule-general-update-trigger";
import { getScheduleOptimisticLockConfig } from "./schedule-optimistic-lock-config";
import { updateScheduleWrite } from "./schedule-write-adapter";
import {
  assertBeforeSnapshotSiteSlugScope,
} from "./schedule-write-guards";
import {
  G9K_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_APPROVAL_ID,
  type ScheduleUpdateWritePayload,
  type ScheduleWriteAdapterResult,
  type ScheduleWriteClient,
  type ScheduleWriteResult,
} from "./schedule-write-types";

export type G9kSaveButtonSaveBinding = {
  changedFields: string[];
  payloadKeys: string[];
  expectedBeforeUpdatedAt: string | null;
  dryRunOk: boolean;
};

export type G9kSaveButtonSaveRecordSummary = {
  id: string;
  legacy_id: string | null;
  title: string;
  date: string;
  venue: string | null;
  updated_at: string | null;
};

export type G9kExistingEventSaveButtonSaveOutcome = {
  phase: typeof G9K4A_PHASE;
  approvalId: typeof G9K_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_APPROVAL_ID;
  optimisticLockEnabled: boolean;
  expectedBeforeUpdatedAt: string | null;
  changedFields: string[];
  payloadKeys: string[];
  beforeRecord?: G9kSaveButtonSaveRecordSummary;
  afterRecord?: G9kSaveButtonSaveRecordSummary;
  beforeAfterDiff?: Array<{ field: string; before: string; after: string }>;
  authEmail?: string;
  authStatus?: string;
  mockRole?: string;
  warnings: string[];
  errorCode?: string;
  errorMessage?: string;
  result?: ScheduleWriteAdapterResult;
};

function toRecordSummary(row: ScheduleDryRunSource): G9kSaveButtonSaveRecordSummary {
  return {
    id: row.id,
    legacy_id: row.legacy_id ?? null,
    title: String(row.title ?? ""),
    date: String(row.date ?? ""),
    venue: row.venue != null ? String(row.venue) : null,
    updated_at: row.updated_at ?? null,
  };
}

function buildBeforeAfterDiff(
  before: ScheduleDryRunSource,
  after: ScheduleDryRunSource,
  changedFields: string[],
): Array<{ field: string; before: string; after: string }> {
  return changedFields.map((field) => ({
    field,
    before: String(before[field as keyof ScheduleDryRunSource] ?? ""),
    after: String(after[field as keyof ScheduleDryRunSource] ?? ""),
  }));
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

export async function executeG9kExistingEventSaveButtonSave(options: {
  url: string;
  anonKey: string;
  beforeSnapshot: ScheduleDryRunSource;
  formValues: G9kExistingEventSaveButtonFormValues;
  saveBinding: G9kSaveButtonSaveBinding;
  env?: ImportMetaEnv;
}): Promise<G9kExistingEventSaveButtonSaveOutcome> {
  const config = getG9kExistingEventSaveButtonConfig(options.env ?? import.meta.env);
  const lockConfig = getScheduleOptimisticLockConfig();
  const lockEnabled = lockConfig.enabled;
  const approvalId = G9K_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_APPROVAL_ID;
  const baseOutcome = {
    phase: G9K4A_PHASE,
    approvalId,
    optimisticLockEnabled: lockEnabled,
    expectedBeforeUpdatedAt: options.saveBinding.expectedBeforeUpdatedAt,
    changedFields: [...options.saveBinding.changedFields],
    payloadKeys: [...options.saveBinding.payloadKeys],
    beforeRecord: toRecordSummary(options.beforeSnapshot),
    warnings: [] as string[],
  };

  if (!config.saveEnabled) {
    return {
      ...baseOutcome,
      errorCode: "save_not_enabled",
      errorMessage:
        config.armFailureReason ??
        "G-9k Save path disabled — env arm / approval stack not satisfied or compile-time gate off.",
    };
  }

  if (!options.saveBinding.dryRunOk) {
    return {
      ...baseOutcome,
      errorCode: "dry_run_not_ok",
      errorMessage: "Dry-run must succeed before Save.",
    };
  }

  if (options.saveBinding.changedFields.length === 0) {
    return {
      ...baseOutcome,
      errorCode: "no_changed_fields",
      errorMessage: "No changedFields — Save blocked.",
    };
  }

  try {
    assertG9kSaveButtonApproval(approvalId);
    assertStaticToAstroCmsStagingSupabaseProject(options.url);
    const hostGate = evaluateSupabaseHostGate(options.url);
    if (!hostGate.hostGatePassed) {
      throw new Error(hostGate.warningMessage ?? "Supabase host gate failed.");
    }
    assertG9kExistingEventSaveButtonWritableRow(options.beforeSnapshot);
    assertBeforeSnapshotSiteSlugScope(options.beforeSnapshot, {
      siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
      legacyId: options.beforeSnapshot.legacy_id ?? "",
      targetId: options.beforeSnapshot.id,
    });
    assertG9kOptimisticLockBaseline(options.beforeSnapshot.updated_at);

    const dryRun = executeG9kExistingEventSaveButtonDryRun({
      beforeSnapshot: options.beforeSnapshot,
      formValues: options.formValues,
      signedIn: true,
      supabaseUrl: options.url,
    });
    if (!dryRun.ok) {
      throw new Error(
        `G-9k dry-run re-check failed: ${dryRun.guardErrors.join("; ") || "unknown"}`,
      );
    }
    if (!arraysEqual(dryRun.changedFields, options.saveBinding.changedFields)) {
      throw new Error("G-9k Save: changedFields mismatch vs latest dry-run.");
    }
    if (!arraysEqual(dryRun.payloadKeys, options.saveBinding.payloadKeys)) {
      throw new Error("G-9k Save: payload keys mismatch vs latest dry-run.");
    }

    assertG9kExistingEventSaveButtonChangedFieldsOnly(dryRun.changedFields);
    const payload: ScheduleUpdateWritePayload = buildG9kExistingEventSaveButtonPayload(
      dryRun.changedFields,
      options.formValues,
    );
    assertG9kExistingEventSaveButtonPayloadOnly(payload, dryRun.changedFields);

    const expectedBeforeUpdatedAt = String(options.beforeSnapshot.updated_at ?? "");
    if (
      options.saveBinding.expectedBeforeUpdatedAt != null &&
      expectedBeforeUpdatedAt !== options.saveBinding.expectedBeforeUpdatedAt
    ) {
      throw new Error("G-9k Save: optimistic lock baseline stale.");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ...baseOutcome,
      errorCode: "preflight_failed",
      errorMessage: message,
    };
  }

  const auth = await getStagingAuthSessionDetails(options.url, options.anonKey);
  const mockRole = formatMockRoleDisplay(auth);
  const authStatus = auth.session.status;
  const authWarnings = collectScheduleNonDryRunPocAuthWarnings(auth);

  if (!isSignedInStagingAuth(auth)) {
    return {
      ...baseOutcome,
      warnings: authWarnings,
      errorCode: "auth_session_missing",
      errorMessage: "Sign in as staging admin before Save.",
      authStatus,
      mockRole,
    };
  }

  const payload = buildG9kExistingEventSaveButtonPayload(
    options.saveBinding.changedFields,
    options.formValues,
  );

  const writeClient = getStagingSupabaseClient(
    options.url,
    options.anonKey,
  ) as unknown as ScheduleWriteClient;

  const request = {
    ...buildScheduleLockedWriteRequest({
      client: writeClient,
      approvalId,
      targetId: options.beforeSnapshot.id,
      beforeSnapshot: options.beforeSnapshot,
      payload,
      optimisticLockEnabled: lockEnabled,
    }),
    writeScope: {
      siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
      legacyId: options.beforeSnapshot.legacy_id ?? "",
    },
  };

  const result = await updateScheduleWrite(request);

  if (result && "errorCode" in result) {
    return {
      ...baseOutcome,
      warnings: authWarnings,
      authEmail: auth.rawEmail,
      authStatus,
      mockRole,
      result,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
    };
  }

  const success = result as ScheduleWriteResult;
  try {
    assertG9kRowsAffectedExactlyOne(success.rowsAffected ?? 0);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ...baseOutcome,
      warnings: authWarnings,
      authEmail: auth.rawEmail,
      authStatus,
      mockRole,
      result,
      errorCode: "rows_affected_invalid",
      errorMessage: message,
    };
  }

  const afterSnapshot = success.afterSnapshot ?? options.beforeSnapshot;
  const postChangedFields = success.changedFields ?? options.saveBinding.changedFields;
  if (!arraysEqual(postChangedFields, options.saveBinding.changedFields)) {
    return {
      ...baseOutcome,
      warnings: authWarnings,
      authEmail: auth.rawEmail,
      authStatus,
      mockRole,
      result,
      afterRecord: toRecordSummary(afterSnapshot),
      errorCode: "post_save_changed_fields_mismatch",
      errorMessage: "Post-save changedFields verification failed.",
    };
  }

  return {
    ...baseOutcome,
    warnings: authWarnings,
    authEmail: auth.rawEmail,
    authStatus,
    mockRole,
    result,
    afterRecord: toRecordSummary(afterSnapshot),
    beforeAfterDiff: buildBeforeAfterDiff(
      options.beforeSnapshot,
      afterSnapshot,
      options.saveBinding.changedFields,
    ),
    expectedBeforeUpdatedAt: afterSnapshot.updated_at ?? null,
  };
}
