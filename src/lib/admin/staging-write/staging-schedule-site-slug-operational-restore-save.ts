/**
 * G-9g3g5 — Gosaki site_slug operational restore non-dry-run save (staging shell only).
 * Reverts G-9g3g4 description marker; description changedFields only.
 */

import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import {
  G9G3H1_PREVIEW_CONSUMED_MSG,
  STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
} from "../staging-data/staging-schedule-site-slug-config";
import { getG9G3g5OperationalRestoreConfig } from "../staging-data/staging-schedule-site-slug-operational-restore-config";
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
  assertG9G3g5RestorePayloadOnly,
  assertG9G3g5RestoreWritableRow,
  assertOperationalCandidatePreviewMatch,
  assertOperationalPreviewIdentityPresent,
  assertOperationalPreviewNotConsumed,
  assertOperationalPreviewTargetIdentity,
} from "./schedule-write-guards";
import {
  G9G3G5_SCHEDULE_OPERATIONAL_RESTORE_NON_DRY_RUN_APPROVAL_ID,
  type ScheduleUpdateWritePayload,
  type ScheduleWriteAdapterResult,
  type ScheduleWriteClient,
} from "./schedule-write-types";
import type { G9G3gOperationalPreviewBinding } from "./staging-schedule-site-slug-operational-general-edit-save";

export type G9G3g5OperationalRestoreSaveOutcome = {
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

export async function executeG9G3g5OperationalRestoreSave(options: {
  url: string;
  anonKey: string;
  beforeSnapshot: ScheduleDryRunSource;
  payload: ScheduleUpdateWritePayload;
  changedFields: string[];
  previewBinding: G9G3gOperationalPreviewBinding;
  candidateValues: Record<string, string>;
}): Promise<G9G3g5OperationalRestoreSaveOutcome> {
  const config = getG9G3g5OperationalRestoreConfig();
  const lockConfig = getScheduleOptimisticLockConfig();
  const lockEnabled = lockConfig.enabled;

  if (!config.saveEnabled) {
    return {
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: null,
      warnings: [],
      errorCode: "restore_not_armed",
      errorMessage: config.armFailureReason ?? config.defaultDisabledReason,
    };
  }

  if (!options.previewBinding.hostGatePassed) {
    return {
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: null,
      warnings: [],
      errorCode: "host_gate_failed",
      errorMessage: "Supabase host gate failed — restore Save blocked.",
    };
  }

  if (options.previewBinding.optimisticLockStale) {
    return {
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: options.previewBinding.expectedBeforeUpdatedAt,
      warnings: [],
      errorCode: "optimistic_lock_stale",
      errorMessage: "Optimistic lock stale — re-run G-9 preview before restore Save.",
    };
  }

  if (!options.previewBinding.previewIdentity?.trim()) {
    return {
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: options.previewBinding.expectedBeforeUpdatedAt,
      warnings: [],
      errorCode: "preview_identity_missing",
      errorMessage: "previewIdentity required for restore Save.",
    };
  }

  if (
    options.previewBinding.consumedPreviewIdentity &&
    options.previewBinding.consumedPreviewIdentity ===
      options.previewBinding.previewIdentity
  ) {
    return {
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: options.previewBinding.expectedBeforeUpdatedAt,
      warnings: [],
      errorCode: "preview_consumed",
      errorMessage: G9G3H1_PREVIEW_CONSUMED_MSG,
    };
  }

  try {
    assertOperationalPreviewIdentityPresent(options.previewBinding.previewIdentity);
    assertOperationalPreviewNotConsumed({
      previewIdentity: options.previewBinding.previewIdentity,
      consumedPreviewIdentity: options.previewBinding.consumedPreviewIdentity,
    });
    assertG9G3g5RestoreWritableRow(options.beforeSnapshot);
    assertOperationalPreviewTargetIdentity({
      beforeSnapshot: options.beforeSnapshot,
      previewTargetId: options.previewBinding.targetId,
      previewLegacyId: options.previewBinding.legacyId,
      previewSiteSlug: options.previewBinding.siteSlug,
      label: "G-9g3g5",
    });
    assertBeforeSnapshotSiteSlugScope(options.beforeSnapshot, {
      siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
      legacyId: options.beforeSnapshot.legacy_id ?? "",
      targetId: options.beforeSnapshot.id,
    });
    assertG9G3g5RestorePayloadOnly(options.payload, options.changedFields);
    assertOperationalCandidatePreviewMatch({
      changedFields: options.changedFields,
      candidateValues: options.candidateValues,
      previewValues: options.previewBinding.fieldValues,
      label: "G-9g3g5",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: options.previewBinding.expectedBeforeUpdatedAt,
      warnings: [],
      errorCode: "write_guard_failed",
      errorMessage: message,
    };
  }

  if (
    options.changedFields.length !== 1 ||
    options.changedFields[0] !== "description"
  ) {
    return {
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: options.previewBinding.expectedBeforeUpdatedAt,
      warnings: [],
      errorCode: "invalid_changed_fields",
      errorMessage: "G-9g3g5 restore changedFields must be description only.",
    };
  }

  const auth = await getStagingAuthSessionDetails(options.url, options.anonKey);
  const mockRole = formatMockRoleDisplay(auth);
  const authStatus = auth.session.status;
  const authWarnings = collectScheduleNonDryRunPocAuthWarnings(auth);

  if (!isSignedInStagingAuth(auth)) {
    return {
      warnings: authWarnings,
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: options.previewBinding.expectedBeforeUpdatedAt,
      errorCode: "auth_session_missing",
      errorMessage: "Sign in as staging admin before restore Save.",
      authStatus,
      mockRole,
    };
  }

  const writeClient = getStagingSupabaseClient(
    options.url,
    options.anonKey,
  ) as unknown as ScheduleWriteClient;

  const request = {
    ...buildScheduleLockedWriteRequest({
      client: writeClient,
      approvalId: G9G3G5_SCHEDULE_OPERATIONAL_RESTORE_NON_DRY_RUN_APPROVAL_ID,
      targetId: options.beforeSnapshot.id,
      beforeSnapshot: options.beforeSnapshot,
      payload: options.payload,
      optimisticLockEnabled: lockEnabled,
    }),
    writeScope: {
      siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
      legacyId: options.beforeSnapshot.legacy_id ?? "",
    },
  };

  if (
    lockEnabled &&
    options.previewBinding.expectedBeforeUpdatedAt != null &&
    request.expectedBeforeUpdatedAt !== options.previewBinding.expectedBeforeUpdatedAt
  ) {
    return {
      authEmail: auth.rawEmail,
      authStatus,
      mockRole,
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: request.expectedBeforeUpdatedAt ?? null,
      warnings: authWarnings,
      errorCode: "preview_lock_mismatch",
      errorMessage:
        "expectedBeforeUpdatedAt does not match latest G-9 preview optimistic lock.",
    };
  }

  const result = await updateScheduleWrite(request);

  return {
    authEmail: auth.rawEmail,
    authStatus,
    mockRole,
    optimisticLockEnabled: lockEnabled,
    expectedBeforeUpdatedAt: request.expectedBeforeUpdatedAt ?? null,
    warnings: authWarnings,
    result,
    errorCode: result && "errorCode" in result ? result.errorCode : undefined,
    errorMessage: result && "errorMessage" in result ? result.errorMessage : undefined,
  };
}
