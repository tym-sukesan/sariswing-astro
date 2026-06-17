/**
 * G-9g3b — Gosaki site_slug venue + description non-dry-run PoC save (staging shell only).
 */

import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import {
  G9G1_TARGET_LEGACY_ID,
  G9G1_TARGET_ROW_ID,
  STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
} from "../staging-data/staging-schedule-site-slug-config";
import { getG9G3bVenueDescriptionPocConfig } from "../staging-data/staging-schedule-site-slug-venue-description-poc-config";
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
  assertG9G3bVenueDescriptionPayloadOnly,
} from "./schedule-write-guards";
import {
  G9G3B_SCHEDULE_VENUE_DESCRIPTION_NON_DRY_RUN_POC_APPROVAL_ID,
  type ScheduleUpdateWritePayload,
  type ScheduleWriteAdapterResult,
  type ScheduleWriteClient,
} from "./schedule-write-types";

export type G9G3bVenueDescriptionBeforeSnapshotCheckResult = {
  ok: boolean;
  abortReason?: string;
  warnings: string[];
  row?: ScheduleDryRunSource;
};

export function validateG9G3bVenueDescriptionBeforeSnapshot(
  row: ScheduleDryRunSource,
): G9G3bVenueDescriptionBeforeSnapshotCheckResult {
  const warnings: string[] = [];

  try {
    assertBeforeSnapshotSiteSlugScope(row, {
      siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
      legacyId: G9G1_TARGET_LEGACY_ID,
      targetId: G9G1_TARGET_ROW_ID,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, abortReason: message, warnings };
  }

  if (row.show_on_home !== false) {
    warnings.push(`show_on_home is ${String(row.show_on_home)} (expected false).`);
  }
  if (row.published !== true) {
    warnings.push(`published is ${String(row.published)} (expected true).`);
  }

  return { ok: true, warnings, row };
}

export type G9G3bVenueDescriptionNonDryRunSaveOutcome = {
  preCheck: G9G3bVenueDescriptionBeforeSnapshotCheckResult;
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

export async function executeG9G3bVenueDescriptionNonDryRunSave(options: {
  url: string;
  anonKey: string;
  beforeSnapshot: ScheduleDryRunSource;
  payload: ScheduleUpdateWritePayload;
}): Promise<G9G3bVenueDescriptionNonDryRunSaveOutcome> {
  const config = getG9G3bVenueDescriptionPocConfig();
  const lockConfig = getScheduleOptimisticLockConfig();
  const lockEnabled = lockConfig.enabled;

  if (!config.saveEnabled) {
    return {
      preCheck: {
        ok: false,
        abortReason:
          config.armFailureReason ?? "G-9g3b venue+description PoC gates not satisfied.",
        warnings: [],
      },
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: null,
      warnings: [],
      errorCode: "slice_not_armed",
      errorMessage:
        config.armFailureReason ?? "G-9g3b venue+description PoC not armed.",
    };
  }

  const preCheck = validateG9G3bVenueDescriptionBeforeSnapshot(options.beforeSnapshot);
  if (!preCheck.ok) {
    return {
      preCheck,
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: null,
      warnings: preCheck.warnings,
      errorCode: "before_snapshot_mismatch",
      errorMessage: preCheck.abortReason,
    };
  }

  try {
    assertG9G3bVenueDescriptionPayloadOnly(options.payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      preCheck,
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: null,
      warnings: preCheck.warnings,
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
      preCheck,
      warnings: [...preCheck.warnings, ...authWarnings],
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: null,
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
      approvalId: G9G3B_SCHEDULE_VENUE_DESCRIPTION_NON_DRY_RUN_POC_APPROVAL_ID,
      targetId: options.beforeSnapshot.id,
      beforeSnapshot: options.beforeSnapshot,
      payload: options.payload,
      optimisticLockEnabled: lockEnabled,
    }),
    writeScope: {
      siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
      legacyId: G9G1_TARGET_LEGACY_ID,
    },
  };

  const result = await updateScheduleWrite(request);

  return {
    preCheck,
    authEmail: auth.rawEmail,
    authStatus,
    mockRole,
    optimisticLockEnabled: lockEnabled,
    expectedBeforeUpdatedAt: request.expectedBeforeUpdatedAt ?? null,
    warnings: [...preCheck.warnings, ...authWarnings],
    result,
    errorCode: result && "errorCode" in result ? result.errorCode : undefined,
    errorMessage: result && "errorMessage" in result ? result.errorMessage : undefined,
  };
}
