/**
 * G-9g3g — Gosaki site_slug operational general edit non-dry-run save (staging shell only).
 * Picker-selected non-PoC rows; separate from frozen G-9g3d PoC Save.
 */

import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import {
  G9G3H1_PREVIEW_CONSUMED_MSG,
  STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
} from "../staging-data/staging-schedule-site-slug-config";
import { getG9G3gOperationalGeneralEditConfig } from "../staging-data/staging-schedule-site-slug-operational-general-edit-config";
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
  assertG9G3gOperationalGeneralEditPayloadOnly,
  assertOperationalCandidatePreviewMatch,
  assertOperationalNotPocAuditRow,
  assertOperationalPreviewIdentityPresent,
  assertOperationalPreviewNotConsumed,
  assertOperationalPreviewTargetIdentity,
} from "./schedule-write-guards";
import {
  G9G3G_SCHEDULE_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_APPROVAL_ID,
  type ScheduleUpdateWritePayload,
  type ScheduleWriteAdapterResult,
  type ScheduleWriteClient,
} from "./schedule-write-types";

export type G9G3gOperationalPreviewBinding = {
  targetId: string;
  legacyId: string | null;
  siteSlug: string;
  expectedBeforeUpdatedAt: string | null;
  changedFields: string[];
  fieldValues: Record<string, string>;
  hostGatePassed: boolean;
  optimisticLockStale: boolean;
  previewIdentity: string;
  consumedPreviewIdentity?: string | null;
};

export type G9G3gOperationalGeneralEditSaveOutcome = {
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

export async function executeG9G3gOperationalGeneralEditSave(options: {
  url: string;
  anonKey: string;
  beforeSnapshot: ScheduleDryRunSource;
  payload: ScheduleUpdateWritePayload;
  changedFields: string[];
  previewBinding: G9G3gOperationalPreviewBinding;
  candidateValues: Record<string, string>;
}): Promise<G9G3gOperationalGeneralEditSaveOutcome> {
  const config = getG9G3gOperationalGeneralEditConfig();
  const lockConfig = getScheduleOptimisticLockConfig();
  const lockEnabled = lockConfig.enabled;

  if (!config.saveEnabled) {
    return {
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: null,
      warnings: [],
      errorCode: "operational_not_armed",
      errorMessage:
        config.armFailureReason ?? config.defaultDisabledReason,
    };
  }

  if (!options.previewBinding.hostGatePassed) {
    return {
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: null,
      warnings: [],
      errorCode: "host_gate_failed",
      errorMessage: "Supabase host gate failed — operational Save blocked.",
    };
  }

  if (options.previewBinding.optimisticLockStale) {
    return {
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: options.previewBinding.expectedBeforeUpdatedAt,
      warnings: [],
      errorCode: "optimistic_lock_stale",
      errorMessage: "Optimistic lock stale — re-run G-9 preview before Save.",
    };
  }

  if (!options.previewBinding.previewIdentity?.trim()) {
    return {
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: options.previewBinding.expectedBeforeUpdatedAt,
      warnings: [],
      errorCode: "preview_identity_missing",
      errorMessage: "previewIdentity required for operational Save.",
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
    assertOperationalNotPocAuditRow(options.beforeSnapshot);
    assertOperationalPreviewTargetIdentity({
      beforeSnapshot: options.beforeSnapshot,
      previewTargetId: options.previewBinding.targetId,
      previewLegacyId: options.previewBinding.legacyId,
      previewSiteSlug: options.previewBinding.siteSlug,
    });
    assertBeforeSnapshotSiteSlugScope(options.beforeSnapshot, {
      siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
      legacyId: options.beforeSnapshot.legacy_id ?? "",
      targetId: options.beforeSnapshot.id,
    });
    assertG9G3gOperationalGeneralEditPayloadOnly(
      options.payload,
      options.changedFields,
    );
    assertOperationalCandidatePreviewMatch({
      changedFields: options.changedFields,
      candidateValues: options.candidateValues,
      previewValues: options.previewBinding.fieldValues,
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

  if (options.changedFields.length === 0) {
    return {
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: options.previewBinding.expectedBeforeUpdatedAt,
      warnings: [],
      errorCode: "no_changed_fields",
      errorMessage: "No changed fields — operational Save blocked.",
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
      errorMessage: "Sign in as staging admin before saving.",
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
      approvalId: G9G3G_SCHEDULE_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_APPROVAL_ID,
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
