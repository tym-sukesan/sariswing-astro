/**
 * G-22d1 — Gosaki Schedule duplicate INSERT save (staging shell; single slice).
 */

import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import {
  assertStaticToAstroCmsStagingSupabaseProject,
  evaluateSupabaseHostGate,
} from "../staging-data/staging-schedule-site-slug-host-gate";
import type { G9kExistingEventSaveButtonFormValues } from "./gosaki-schedule-existing-event-save-button-dry-run";
import {
  G22D1_PHASE,
  getG22dDuplicateInsertConfig,
} from "./gosaki-schedule-duplicate-insert-config";
import {
  assertG22dDuplicateInsertPayloadOnly,
  buildG22dDuplicateInsertPayload,
  collectG22dDuplicateInsertGuardFailures,
} from "./gosaki-schedule-duplicate-insert-guards";
import {
  collectScheduleNonDryRunPocAuthWarnings,
  formatMockRoleDisplay,
  isSignedInStagingAuth,
} from "./schedule-non-dry-run-poc-auth";
import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import {
  insertScheduleWrite,
  type ScheduleInsertWriteAdapterResult,
  type ScheduleInsertWriteClient,
  type ScheduleInsertWriteResult,
} from "./schedule-insert-write-adapter";
import { G22D_SCHEDULE_DUPLICATE_INSERT_NON_DRY_RUN_APPROVAL_ID } from "./schedule-write-types";

export type G22dDuplicateInsertSaveOutcome = {
  phase: typeof G22D1_PHASE;
  ok: boolean;
  operation: "duplicate-insert";
  actualWrite: boolean;
  approvalId: typeof G22D_SCHEDULE_DUPLICATE_INSERT_NON_DRY_RUN_APPROVAL_ID;
  sourceId: string;
  sourceLegacyId: string | null;
  insertedId?: string;
  legacy_id?: string;
  guardReasons: string[];
  rollbackHint?: string;
  beforeSource?: {
    id: string;
    legacy_id: string | null;
    title: string;
    date: string;
  };
  afterRecord?: {
    id: string;
    legacy_id: string | null;
    title: string;
    date: string;
    published: boolean | null;
    sort_order: number | null;
    updated_at: string | null;
  };
  authEmail?: string;
  authStatus?: string;
  mockRole?: string;
  warnings: string[];
  errorCode?: string;
  errorMessage?: string;
  result?: ScheduleInsertWriteAdapterResult;
};

export async function executeG22dScheduleDuplicateInsertSave(options: {
  url: string;
  anonKey: string;
  source: ScheduleDryRunSource;
  formValues: G9kExistingEventSaveButtonFormValues;
  date: string;
  duplicateMode: boolean;
  duplicateDryRunOk: boolean;
  env?: ImportMetaEnv;
}): Promise<G22dDuplicateInsertSaveOutcome> {
  const config = getG22dDuplicateInsertConfig(options.env ?? import.meta.env);
  const approvalId = G22D_SCHEDULE_DUPLICATE_INSERT_NON_DRY_RUN_APPROVAL_ID;
  const guardReasons = collectG22dDuplicateInsertGuardFailures({
    duplicateMode: options.duplicateMode,
    source: options.source,
    duplicateDryRunOk: options.duplicateDryRunOk,
    approvalId,
    env: options.env,
  });

  const baseOutcome: G22dDuplicateInsertSaveOutcome = {
    phase: G22D1_PHASE,
    ok: false,
    operation: "duplicate-insert",
    actualWrite: false,
    approvalId,
    sourceId: options.source.id,
    sourceLegacyId: options.source.legacy_id ?? null,
    guardReasons,
    warnings: [],
    beforeSource: {
      id: options.source.id,
      legacy_id: options.source.legacy_id ?? null,
      title: String(options.source.title ?? ""),
      date: String(options.source.date ?? ""),
    },
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
      guardReasons: [
        config.armFailureReason ?? config.defaultDisabledReason,
      ],
      errorCode: "save_not_enabled",
      errorMessage:
        config.armFailureReason ??
        "G-22d duplicate INSERT Save disabled — env arm / approval stack not satisfied.",
    };
  }

  let payload;
  try {
    assertStaticToAstroCmsStagingSupabaseProject(options.url);
    const hostGate = evaluateSupabaseHostGate(options.url);
    if (!hostGate.hostGatePassed) {
      throw new Error(hostGate.warningMessage ?? "Supabase host gate failed.");
    }
    payload = buildG22dDuplicateInsertPayload({
      source: options.source,
      formValues: options.formValues,
      date: options.date,
    });
    assertG22dDuplicateInsertPayloadOnly(payload);
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

  const writeClient = getStagingSupabaseClient(
    options.url,
    options.anonKey,
  ) as unknown as ScheduleInsertWriteClient;

  const result = await insertScheduleWrite({
    client: writeClient,
    approvalId,
    sourceId: options.source.id,
    payload,
  });

  if ("errorCode" in result) {
    return {
      ...baseOutcome,
      warnings: authWarnings,
      authEmail: auth.rawEmail,
      authStatus,
      mockRole,
      result,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
      rollbackHint: result.rollbackHint,
    };
  }

  const success = result as ScheduleInsertWriteResult;
  return {
    ...baseOutcome,
    ok: true,
    actualWrite: true,
    insertedId: success.insertedId,
    legacy_id: success.afterSnapshot.legacy_id ?? payload.legacy_id,
    rollbackHint: success.rollbackHint,
    warnings: authWarnings,
    authEmail: auth.rawEmail,
    authStatus,
    mockRole,
    result,
    afterRecord: {
      id: success.insertedId,
      legacy_id: success.afterSnapshot.legacy_id ?? null,
      title: String(success.afterSnapshot.title ?? ""),
      date: String(success.afterSnapshot.date ?? ""),
      published: success.afterSnapshot.published ?? null,
      sort_order: success.afterSnapshot.sort_order ?? null,
      updated_at: success.afterSnapshot.updated_at ?? null,
    },
  };
}
