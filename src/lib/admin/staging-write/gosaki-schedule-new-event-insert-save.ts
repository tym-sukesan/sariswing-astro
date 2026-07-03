/**
 * G-22e3 — Gosaki Schedule new event INSERT save (staging shell; single slice).
 */

import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import {
  assertStaticToAstroCmsStagingSupabaseProject,
  evaluateSupabaseHostGate,
} from "../staging-data/staging-schedule-site-slug-host-gate";
import type { G9kExistingEventSaveButtonFormValues } from "./gosaki-schedule-existing-event-save-button-dry-run";
import {
  G22E3_PHASE,
  getG22eNewEventInsertConfig,
} from "./gosaki-schedule-new-event-insert-config";
import {
  assertG22eNewEventInsertPayloadOnly,
  buildG22eNewEventInsertPayload,
  collectG22eNewEventInsertGuardFailures,
  type G22eMonthAllocationRow,
} from "./gosaki-schedule-new-event-insert-guards";
import {
  collectScheduleNonDryRunPocAuthWarnings,
  formatMockRoleDisplay,
  isSignedInStagingAuth,
} from "./schedule-non-dry-run-poc-auth";
import {
  insertNewEventScheduleWrite,
  type ScheduleInsertWriteAdapterResult,
  type ScheduleInsertWriteClient,
  type ScheduleInsertWriteResult,
} from "./schedule-insert-write-adapter";
import { G22E_SCHEDULE_NEW_EVENT_INSERT_NON_DRY_RUN_APPROVAL_ID } from "./schedule-write-types";

export type G22eNewEventInsertSaveOutcome = {
  phase: typeof G22E3_PHASE;
  ok: boolean;
  operation: "new-event-insert";
  actualWrite: boolean;
  approvalId: typeof G22E_SCHEDULE_NEW_EVENT_INSERT_NON_DRY_RUN_APPROVAL_ID;
  insertedId?: string;
  legacy_id?: string;
  sort_order?: number;
  source_route?: string;
  source_file?: string;
  guardReasons: string[];
  rollbackHint?: string;
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

type MonthAllocationReadClient = {
  from: (table: "schedules") => {
    select: (columns?: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        eq: (
          column: string,
          value: string,
        ) => Promise<{
          data: G22eMonthAllocationRow[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

async function loadMonthAllocationRows(options: {
  url: string;
  anonKey: string;
  siteSlug: string;
  month: string;
}): Promise<{ rows: G22eMonthAllocationRow[]; error?: string }> {
  const client = getStagingSupabaseClient(
    options.url,
    options.anonKey,
  ) as unknown as MonthAllocationReadClient;

  const { data, error } = await client
    .from("schedules")
    .select("legacy_id,sort_order,month")
    .eq("site_slug", options.siteSlug)
    .eq("month", options.month);

  if (error) {
    return { rows: [], error: error.message };
  }

  return { rows: data ?? [] };
}

export async function executeG22eScheduleNewEventInsertSave(options: {
  url: string;
  anonKey: string;
  formValues: G9kExistingEventSaveButtonFormValues;
  date: string;
  newEventMode: boolean;
  newEventDryRunOk: boolean;
  newEventDryRunOperation?: string;
  hasExistingScheduleId: boolean;
  hasDuplicateSourceId: boolean;
  env?: ImportMetaEnv;
}): Promise<G22eNewEventInsertSaveOutcome> {
  const config = getG22eNewEventInsertConfig(options.env ?? import.meta.env);
  const approvalId = G22E_SCHEDULE_NEW_EVENT_INSERT_NON_DRY_RUN_APPROVAL_ID;
  const guardReasons = collectG22eNewEventInsertGuardFailures({
    newEventMode: options.newEventMode,
    newEventDryRunOk: options.newEventDryRunOk,
    newEventDryRunOperation: options.newEventDryRunOperation,
    hasExistingScheduleId: options.hasExistingScheduleId,
    hasDuplicateSourceId: options.hasDuplicateSourceId,
    approvalId,
    env: options.env,
  });

  const baseOutcome: G22eNewEventInsertSaveOutcome = {
    phase: G22E3_PHASE,
    ok: false,
    operation: "new-event-insert",
    actualWrite: false,
    approvalId,
    guardReasons,
    warnings: [],
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
        "G-22e new event INSERT Save disabled — env arm / approval stack not satisfied.",
    };
  }

  let payload;
  try {
    assertStaticToAstroCmsStagingSupabaseProject(options.url);
    const hostGate = evaluateSupabaseHostGate(options.url);
    if (!hostGate.hostGatePassed) {
      throw new Error(hostGate.warningMessage ?? "Supabase host gate failed.");
    }

    const date = options.date.trim();
    const month = date.slice(0, 7);
    const allocationRead = await loadMonthAllocationRows({
      url: options.url,
      anonKey: options.anonKey,
      siteSlug: config.siteSlug,
      month,
    });
    if (allocationRead.error) {
      throw new Error(`G-22e month allocation read failed: ${allocationRead.error}`);
    }

    payload = buildG22eNewEventInsertPayload({
      formValues: options.formValues,
      date,
      monthRows: allocationRead.rows,
    });
    assertG22eNewEventInsertPayloadOnly(payload);
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

  const result = await insertNewEventScheduleWrite({
    client: writeClient,
    approvalId,
    payload,
  });

  if ("errorCode" in result) {
    return {
      ...baseOutcome,
      legacy_id: payload.legacy_id,
      sort_order: payload.sort_order ?? undefined,
      source_route: payload.source_route ?? undefined,
      source_file: payload.source_file ?? undefined,
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
    sort_order: success.afterSnapshot.sort_order ?? payload.sort_order ?? undefined,
    source_route: success.afterSnapshot.source_route ?? payload.source_route ?? undefined,
    source_file: success.afterSnapshot.source_file ?? payload.source_file ?? undefined,
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
