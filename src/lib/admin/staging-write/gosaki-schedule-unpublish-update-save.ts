/**
 * G-22f3 — Gosaki Schedule unpublish UPDATE save (staging shell; single slice).
 */

import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import {
  assertStaticToAstroCmsStagingSupabaseProject,
  evaluateSupabaseHostGate,
} from "../staging-data/staging-schedule-site-slug-host-gate";
import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "../staging-data/staging-schedule-site-slug-config";
import {
  G22F3_PHASE,
  getG22fUnpublishUpdateConfig,
} from "./gosaki-schedule-unpublish-update-config";
import {
  assertG22fUnpublishUpdatePayloadOnly,
  assertG22fUnpublishUpdateWritableTarget,
  buildG22fUnpublishUpdatePayload,
  collectG22fUnpublishUpdateGuardFailures,
} from "./gosaki-schedule-unpublish-update-guards";
import { assertG9kOptimisticLockBaseline, assertG9kRowsAffectedExactlyOne } from "./gosaki-schedule-existing-event-save-button-guards";
import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import {
  collectScheduleNonDryRunPocAuthWarnings,
  formatMockRoleDisplay,
  isSignedInStagingAuth,
} from "./schedule-non-dry-run-poc-auth";
import { buildScheduleLockedWriteRequest } from "./schedule-general-update-trigger";
import { getScheduleOptimisticLockConfig } from "./schedule-optimistic-lock-config";
import { updateScheduleWrite } from "./schedule-write-adapter";
import { assertBeforeSnapshotSiteSlugScope } from "./schedule-write-guards";
import {
  G22F_SCHEDULE_UNPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID,
  type ScheduleWriteAdapterResult,
  type ScheduleWriteClient,
  type ScheduleWriteResult,
} from "./schedule-write-types";

export type G22fUnpublishUpdateSaveRecordSummary = {
  id: string;
  legacy_id: string | null;
  title: string;
  date: string;
  published: boolean | null;
  updated_at: string | null;
};

export type G22fUnpublishUpdateSaveOutcome = {
  phase: typeof G22F3_PHASE;
  ok: boolean;
  operation: "unpublish-update";
  actualWrite: boolean;
  approvalId: typeof G22F_SCHEDULE_UNPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID;
  targetId: string;
  targetLegacyId: string | null;
  wouldDelete: false;
  physicalDelete: false;
  expectedBeforeUpdatedAt: string | null;
  changedFields: string[];
  payloadKeys: string[];
  guardReasons: string[];
  rollbackHint?: string;
  beforeRecord?: G22fUnpublishUpdateSaveRecordSummary;
  afterRecord?: G22fUnpublishUpdateSaveRecordSummary;
  authEmail?: string;
  authStatus?: string;
  mockRole?: string;
  warnings: string[];
  errorCode?: string;
  errorMessage?: string;
  result?: ScheduleWriteAdapterResult;
};

function toRecordSummary(row: ScheduleDryRunSource): G22fUnpublishUpdateSaveRecordSummary {
  return {
    id: row.id,
    legacy_id: row.legacy_id ?? null,
    title: String(row.title ?? ""),
    date: String(row.date ?? ""),
    published: row.published != null ? Boolean(row.published) : null,
    updated_at: row.updated_at ?? null,
  };
}

export async function executeG22fScheduleUnpublishUpdateSave(options: {
  url: string;
  anonKey: string;
  target: ScheduleDryRunSource;
  unpublishMode: boolean;
  unpublishDryRunOk: boolean;
  unpublishDryRunOperation?: string;
  wouldUpdate?: boolean;
  wouldDelete?: boolean;
  physicalDelete?: boolean;
  beforePublished?: boolean;
  afterPublished?: boolean;
  duplicateMode?: boolean;
  newEventMode?: boolean;
  existingUpdateMode?: boolean;
  expectedBeforeUpdatedAt: string | null;
  env?: ImportMetaEnv;
}): Promise<G22fUnpublishUpdateSaveOutcome> {
  const config = getG22fUnpublishUpdateConfig(options.env ?? import.meta.env);
  const lockConfig = getScheduleOptimisticLockConfig();
  const lockEnabled = lockConfig.enabled;
  const approvalId = G22F_SCHEDULE_UNPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID;
  const guardReasons = collectG22fUnpublishUpdateGuardFailures({
    unpublishMode: options.unpublishMode,
    target: options.target,
    unpublishDryRunOk: options.unpublishDryRunOk,
    unpublishDryRunOperation: options.unpublishDryRunOperation,
    wouldUpdate: options.wouldUpdate,
    wouldDelete: options.wouldDelete,
    physicalDelete: options.physicalDelete,
    beforePublished: options.beforePublished,
    afterPublished: options.afterPublished,
    duplicateMode: options.duplicateMode,
    newEventMode: options.newEventMode,
    existingUpdateMode: options.existingUpdateMode,
    approvalId,
    env: options.env,
  });

  const baseOutcome: G22fUnpublishUpdateSaveOutcome = {
    phase: G22F3_PHASE,
    ok: false,
    operation: "unpublish-update",
    actualWrite: false,
    approvalId,
    targetId: options.target.id,
    targetLegacyId: options.target.legacy_id ?? null,
    wouldDelete: false,
    physicalDelete: false,
    expectedBeforeUpdatedAt: options.expectedBeforeUpdatedAt,
    changedFields: ["published"],
    payloadKeys: ["published"],
    guardReasons,
    warnings: [],
    beforeRecord: toRecordSummary(options.target),
    rollbackHint:
      "If rollback needed: UPDATE published=true WHERE id + legacy_id + site_slug match (staging only).",
  };

  if (guardReasons.length > 0) {
    return {
      ...baseOutcome,
      errorCode: "guard_failed",
      errorMessage: guardReasons.join("; "),
    };
  }

  if (!config.saveEnabled) {
    return {
      ...baseOutcome,
      guardReasons: [config.armFailureReason ?? config.defaultDisabledReason],
      errorCode: "save_not_enabled",
      errorMessage:
        config.armFailureReason ??
        "G-22f unpublish UPDATE Save disabled — env arm / approval stack not satisfied.",
    };
  }

  try {
    assertStaticToAstroCmsStagingSupabaseProject(options.url);
    const hostGate = evaluateSupabaseHostGate(options.url);
    if (!hostGate.hostGatePassed) {
      throw new Error(hostGate.warningMessage ?? "Supabase host gate failed.");
    }
    assertG22fUnpublishUpdateWritableTarget(options.target);
    assertBeforeSnapshotSiteSlugScope(options.target, {
      siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
      legacyId: options.target.legacy_id ?? "",
      targetId: options.target.id,
    });
    assertG9kOptimisticLockBaseline(options.target.updated_at);

    const expectedBeforeUpdatedAt = String(options.target.updated_at ?? "");
    if (
      options.expectedBeforeUpdatedAt != null &&
      expectedBeforeUpdatedAt !== options.expectedBeforeUpdatedAt
    ) {
      throw new Error("G-22f Save: optimistic lock baseline stale.");
    }

    const payload = buildG22fUnpublishUpdatePayload();
    assertG22fUnpublishUpdatePayloadOnly(payload);
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

  const payload = buildG22fUnpublishUpdatePayload();
  const writeClient = getStagingSupabaseClient(
    options.url,
    options.anonKey,
  ) as unknown as ScheduleWriteClient;

  const request = {
    ...buildScheduleLockedWriteRequest({
      client: writeClient,
      approvalId,
      targetId: options.target.id,
      beforeSnapshot: options.target,
      payload,
      optimisticLockEnabled: lockEnabled,
    }),
    writeScope: {
      siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
      legacyId: options.target.legacy_id ?? "",
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

  const afterSnapshot = success.afterSnapshot ?? options.target;
  const postChangedFields = success.changedFields ?? ["published"];
  if (postChangedFields.length !== 1 || postChangedFields[0] !== "published") {
    return {
      ...baseOutcome,
      warnings: authWarnings,
      authEmail: auth.rawEmail,
      authStatus,
      mockRole,
      result,
      afterRecord: toRecordSummary(afterSnapshot),
      errorCode: "post_save_changed_fields_mismatch",
      errorMessage: "Post-save changedFields must be [published] only.",
    };
  }

  if (afterSnapshot.published !== false) {
    return {
      ...baseOutcome,
      warnings: authWarnings,
      authEmail: auth.rawEmail,
      authStatus,
      mockRole,
      result,
      afterRecord: toRecordSummary(afterSnapshot),
      errorCode: "post_save_published_mismatch",
      errorMessage: "Post-save published must be false.",
    };
  }

  return {
    ...baseOutcome,
    ok: true,
    actualWrite: true,
    warnings: authWarnings,
    authEmail: auth.rawEmail,
    authStatus,
    mockRole,
    result,
    afterRecord: toRecordSummary(afterSnapshot),
    expectedBeforeUpdatedAt: afterSnapshot.updated_at ?? null,
  };
}
