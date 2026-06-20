/**
 * G-9j5 — Gosaki operator existing event one-row description non-dry-run save.
 * Fixed target row / field only — not a general Save opener.
 */

import { getStagingAuthSessionDetails, signInStagingAuth } from "../staging-auth/staging-auth-session";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "../staging-data/staging-schedule-site-slug-config";
import {
  assertStaticToAstroCmsStagingSupabaseProject,
  evaluateSupabaseHostGate,
} from "../staging-data/staging-schedule-site-slug-host-gate";
import {
  GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED_ENV,
} from "./gosaki-schedule-existing-event-update-config";
import {
  buildG9j5DescriptionPayload,
  G9J5_CHANGED_FIELDS,
  G9J5_DESCRIPTION_BEFORE,
  G9J5_EXPECTED_BEFORE_UPDATED_AT,
  G9J5_PHASE,
  G9J5_TARGET_LEGACY_ID,
  G9J5_TARGET_ROW_ID,
  G9J5_TARGET_SITE_SLUG,
} from "./gosaki-schedule-existing-event-update-g9j5-config";
import { executeG9jExistingEventUpdateDryRun } from "./gosaki-schedule-existing-event-update-dry-run";
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
  assertG9jExistingEventUpdatePayloadOnly,
  assertG9jExistingEventUpdateWritableRow,
} from "./schedule-write-guards";
import {
  G9J_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_APPROVAL_ID,
  type ScheduleUpdateWritePayload,
  type ScheduleWriteAdapterResult,
  type ScheduleWriteClient,
} from "./schedule-write-types";

export type G9j5ExistingEventDescriptionSaveOutcome = {
  phase: typeof G9J5_PHASE;
  optimisticLockEnabled: boolean;
  expectedBeforeUpdatedAt: string | null;
  authEmail?: string;
  authStatus?: string;
  mockRole?: string;
  warnings: string[];
  errorCode?: string;
  errorMessage?: string;
  result?: ScheduleWriteAdapterResult;
};

function isG9j5ArmEnvTrue(env: Record<string, string | undefined>): boolean {
  return String(env[GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED_ENV] ?? "")
    .trim() === "true";
}

function assertG9j5FixedTargetRow(beforeSnapshot: ScheduleDryRunSource): void {
  if (beforeSnapshot.id !== G9J5_TARGET_ROW_ID) {
    throw new Error(
      `G-9j5 target id mismatch (expected ${G9J5_TARGET_ROW_ID}, got ${beforeSnapshot.id}).`,
    );
  }
  if (beforeSnapshot.site_slug !== G9J5_TARGET_SITE_SLUG) {
    throw new Error(
      `G-9j5 site_slug mismatch (expected ${G9J5_TARGET_SITE_SLUG}, got ${beforeSnapshot.site_slug}).`,
    );
  }
  if ((beforeSnapshot.legacy_id ?? "") !== G9J5_TARGET_LEGACY_ID) {
    throw new Error(
      `G-9j5 legacy_id mismatch (expected ${G9J5_TARGET_LEGACY_ID}, got ${beforeSnapshot.legacy_id ?? "null"}).`,
    );
  }
  const description = String(beforeSnapshot.description ?? "");
  if (description !== G9J5_DESCRIPTION_BEFORE) {
    throw new Error("G-9j5 description before mismatch — abort before write.");
  }
  const updatedAt = String(beforeSnapshot.updated_at ?? "");
  if (updatedAt !== G9J5_EXPECTED_BEFORE_UPDATED_AT) {
    throw new Error(
      `G-9j5 expectedBeforeUpdatedAt mismatch (expected ${G9J5_EXPECTED_BEFORE_UPDATED_AT}, got ${updatedAt || "null"}).`,
    );
  }
}

function buildG9j5FormValues(
  beforeSnapshot: ScheduleDryRunSource,
): Record<string, string> {
  return {
    title: String(beforeSnapshot.title ?? ""),
    venue: String(beforeSnapshot.venue ?? ""),
    open_time: String(beforeSnapshot.open_time ?? ""),
    start_time: String(beforeSnapshot.start_time ?? ""),
    price: String(beforeSnapshot.price ?? ""),
    description: buildG9j5DescriptionPayload().description,
  };
}

export async function executeG9j5ExistingEventDescriptionOneRowSave(options: {
  url: string;
  anonKey: string;
  beforeSnapshot: ScheduleDryRunSource;
  env?: Record<string, string | undefined>;
  adminEmail: string;
  adminPassword: string;
}): Promise<G9j5ExistingEventDescriptionSaveOutcome> {
  const lockConfig = getScheduleOptimisticLockConfig();
  const lockEnabled = lockConfig.enabled;
  const env = options.env ?? {};
  const changedFields = [...G9J5_CHANGED_FIELDS];
  const payload: ScheduleUpdateWritePayload = buildG9j5DescriptionPayload();

  try {
    assertStaticToAstroCmsStagingSupabaseProject(options.url);
    const hostGate = evaluateSupabaseHostGate(options.url);
    if (!hostGate.hostGatePassed) {
      throw new Error(hostGate.warningMessage ?? "Supabase host gate failed.");
    }
    if (!isG9j5ArmEnvTrue(env)) {
      throw new Error(
        `${GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED_ENV}=true required for G-9j5.`,
      );
    }
    assertG9j5FixedTargetRow(options.beforeSnapshot);
    assertG9jExistingEventUpdateWritableRow(options.beforeSnapshot);
    assertBeforeSnapshotSiteSlugScope(options.beforeSnapshot, {
      siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
      legacyId: options.beforeSnapshot.legacy_id ?? "",
      targetId: options.beforeSnapshot.id,
    });
    assertG9jExistingEventUpdatePayloadOnly(payload, changedFields);

    const dryRun = executeG9jExistingEventUpdateDryRun({
      beforeSnapshot: options.beforeSnapshot,
      formValues: buildG9j5FormValues(options.beforeSnapshot),
      supabaseUrl: options.url,
    });
    if (!dryRun.ok) {
      throw new Error(
        `G-9j5 dry-run gate failed: ${dryRun.guardErrors.join("; ") || "unknown"}`,
      );
    }
    if (dryRun.changedFields.join(",") !== changedFields.join(",")) {
      throw new Error("G-9j5 dry-run changedFields mismatch.");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      phase: G9J5_PHASE,
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: G9J5_EXPECTED_BEFORE_UPDATED_AT,
      warnings: [],
      errorCode: "preflight_failed",
      errorMessage: message,
    };
  }

  try {
    await signInStagingAuth(
      options.url,
      options.anonKey,
      options.adminEmail,
      options.adminPassword,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      phase: G9J5_PHASE,
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: G9J5_EXPECTED_BEFORE_UPDATED_AT,
      warnings: [],
      errorCode: "auth_sign_in_failed",
      errorMessage: message,
    };
  }

  const auth = await getStagingAuthSessionDetails(options.url, options.anonKey);
  const mockRole = formatMockRoleDisplay(auth);
  const authStatus = auth.session.status;
  const authWarnings = collectScheduleNonDryRunPocAuthWarnings(auth);

  if (!isSignedInStagingAuth(auth)) {
    return {
      phase: G9J5_PHASE,
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: G9J5_EXPECTED_BEFORE_UPDATED_AT,
      warnings: authWarnings,
      errorCode: "auth_session_missing",
      errorMessage: "Sign in as staging admin before G-9j5 Save.",
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
      approvalId: G9J_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_APPROVAL_ID,
      targetId: options.beforeSnapshot.id,
      beforeSnapshot: options.beforeSnapshot,
      payload,
      optimisticLockEnabled: lockEnabled,
    }),
    writeScope: {
      siteSlug: G9J5_TARGET_SITE_SLUG,
      legacyId: options.beforeSnapshot.legacy_id ?? "",
    },
  };

  if (
    lockEnabled &&
    request.expectedBeforeUpdatedAt !== G9J5_EXPECTED_BEFORE_UPDATED_AT
  ) {
    return {
      phase: G9J5_PHASE,
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: request.expectedBeforeUpdatedAt ?? null,
      warnings: authWarnings,
      errorCode: "preview_lock_mismatch",
      errorMessage: "expectedBeforeUpdatedAt does not match G-9j5 baseline.",
      authEmail: auth.rawEmail,
      authStatus,
      mockRole,
    };
  }

  const result = await updateScheduleWrite(request);

  return {
    phase: G9J5_PHASE,
    optimisticLockEnabled: lockEnabled,
    expectedBeforeUpdatedAt: request.expectedBeforeUpdatedAt ?? null,
    warnings: authWarnings,
    authEmail: auth.rawEmail,
    authStatus,
    mockRole,
    result,
    errorCode: result && "errorCode" in result ? result.errorCode : undefined,
    errorMessage: result && "errorMessage" in result ? result.errorMessage : undefined,
  };
}
