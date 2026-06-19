/**
 * G-9g4a2a — Gosaki site_slug open_time-only operational non-dry-run save (staging shell only).
 *
 * Safety: serviceRoleUsed false — anon staging client only (no elevated DB role).
 * Safety: productionBlocked true — refused when operational config reports production.
 */

import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import {
  G9G3H1_PREVIEW_CONSUMED_MSG,
  STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
} from "../staging-data/staging-schedule-site-slug-config";
import { getG9G4a2aOpenTimeOnlyOperationalConfig } from "../staging-data/staging-schedule-site-slug-open-time-only-operational-config";
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
  assertG9G4a2aOpenTimeOnlyApproval,
  assertG9G4a2aOpenTimeOnlyPayloadOnly,
  assertG9G4a2aOpenTimeOnlyWritableRow,
  assertOperationalCandidatePreviewMatch,
  assertOperationalPreviewIdentityPresent,
  assertOperationalPreviewNotConsumed,
  assertOperationalPreviewTargetIdentity,
} from "./schedule-write-guards";
import {
  G9G4A2A_SCHEDULE_OPEN_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID,
  type ScheduleUpdateWritePayload,
  type ScheduleWriteAdapterResult,
  type ScheduleWriteClient,
} from "./schedule-write-types";

export type G9G4a2aOpenTimeOnlyPreviewBinding = {
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

export type G9G4a2aOpenTimeOnlySaveOutcome = {
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

export async function executeG9G4a2aOpenTimeOnlyNonDryRunSave(options: {
  url: string;
  anonKey: string;
  beforeSnapshot: ScheduleDryRunSource;
  payload: ScheduleUpdateWritePayload;
  changedFields: string[];
  previewBinding: G9G4a2aOpenTimeOnlyPreviewBinding;
  candidateValues: Record<string, string>;
}): Promise<G9G4a2aOpenTimeOnlySaveOutcome> {
  const config = getG9G4a2aOpenTimeOnlyOperationalConfig();
  const lockConfig = getScheduleOptimisticLockConfig();
  const lockEnabled = lockConfig.enabled;

  if (!config.saveEnabled) {
    return {
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: null,
      warnings: [],
      errorCode: "open_time_only_not_armed",
      errorMessage: config.armFailureReason ?? config.defaultDisabledReason,
    };
  }

  if (config.productionBlocked) {
    return {
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: null,
      warnings: [],
      errorCode: "production_blocked",
      errorMessage: "productionBlocked: true — G-9g4a2a open_time-only Save refused.",
    };
  }

  if (!options.previewBinding.hostGatePassed) {
    return {
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: null,
      warnings: [],
      errorCode: "host_gate_failed",
      errorMessage: "Supabase host gate failed — G-9g4a2a open-time-only Save blocked.",
    };
  }

  if (options.previewBinding.optimisticLockStale) {
    return {
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: options.previewBinding.expectedBeforeUpdatedAt,
      warnings: [],
      errorCode: "optimistic_lock_stale",
      errorMessage: "Optimistic lock stale — re-run G-9g4a2a open-time-only Preview before Save.",
    };
  }

  if (!options.previewBinding.previewIdentity?.trim()) {
    return {
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: options.previewBinding.expectedBeforeUpdatedAt,
      warnings: [],
      errorCode: "preview_identity_missing",
      errorMessage: "previewIdentity required for G-9g4a2a open-time-only Save.",
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
    assertG9G4a2aOpenTimeOnlyApproval(G9G4A2A_SCHEDULE_OPEN_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID);
    assertOperationalPreviewIdentityPresent(options.previewBinding.previewIdentity);
    assertOperationalPreviewNotConsumed({
      previewIdentity: options.previewBinding.previewIdentity,
      consumedPreviewIdentity: options.previewBinding.consumedPreviewIdentity,
    });
    assertG9G4a2aOpenTimeOnlyWritableRow(options.beforeSnapshot);
    assertOperationalPreviewTargetIdentity({
      beforeSnapshot: options.beforeSnapshot,
      previewTargetId: options.previewBinding.targetId,
      previewLegacyId: options.previewBinding.legacyId,
      previewSiteSlug: options.previewBinding.siteSlug,
      label: "G-9g4a2a",
    });
    assertBeforeSnapshotSiteSlugScope(options.beforeSnapshot, {
      siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
      legacyId: options.beforeSnapshot.legacy_id ?? "",
      targetId: options.beforeSnapshot.id,
    });
    assertG9G4a2aOpenTimeOnlyPayloadOnly(options.payload, options.changedFields);
    assertOperationalCandidatePreviewMatch({
      changedFields: options.changedFields,
      candidateValues: options.candidateValues,
      previewValues: options.previewBinding.fieldValues,
      label: "G-9g4a2a",
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
      approvalId: G9G4A2A_SCHEDULE_OPEN_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID,
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
        "expectedBeforeUpdatedAt does not match latest G-9g4a2a open-time-only preview optimistic lock.",
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
