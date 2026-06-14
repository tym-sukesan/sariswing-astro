/**
 * G-6-f6 — Safe-fields non-dry-run PoC trigger (browser; authenticated session only).
 * Separate from G-6-e5. venue + description only. No service_role.
 */

import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import {
  collectScheduleNonDryRunPocAuthWarnings,
  formatMockRoleDisplay,
  isSignedInStagingAuth,
} from "./schedule-non-dry-run-poc-auth";
import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import { SCHEDULE_NON_DRY_RUN_POC_TARGET_ID } from "./schedule-non-dry-run-poc-config";
import {
  getScheduleSafeFieldsNonDryRunPocConfig,
} from "./schedule-safe-fields-non-dry-run-poc-config";
import { SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_ERROR_CODES } from "./schedule-safe-fields-non-dry-run-poc-error";
import { updateScheduleWrite } from "./schedule-write-adapter";
import {
  assertG6F6SafeFieldsPayloadOnly,
} from "./schedule-write-guards";
import {
  G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_APPROVAL_ID,
  type ScheduleUpdateWritePayload,
  type ScheduleWriteAdapterResult,
  type ScheduleWriteClient,
} from "./schedule-write-types";

export const G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_LEGACY_ID =
  "schedule-2026-07-010";

/** Post-G-6-e5 expected description before G-6-f6 execution */
export const G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_BEFORE_DESCRIPTION =
  "出演： [G-6-e5 non-dry-run PoC]";

export const G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_FIXED_PAYLOAD: ScheduleUpdateWritePayload =
  {
    venue: "[CMS Kit staging] G-6-f6 venue PoC",
    description:
      "出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]",
  };

const SELECT_COLUMNS =
  "id,legacy_id,date,year,month,title,venue,open_time,start_time,price,description,image_url,home_image_url,source_file,source_route,show_on_home,home_order,published,sort_order,created_at,updated_at";

export type G6F6BeforeSnapshotCheckResult = {
  ok: boolean;
  abortReason?: string;
  warnings: string[];
  row?: ScheduleDryRunSource;
};

function mapRow(row: Record<string, unknown>): ScheduleDryRunSource {
  return {
    id: String(row.id ?? ""),
    legacy_id: row.legacy_id != null ? String(row.legacy_id) : null,
    date: String(row.date ?? ""),
    year: typeof row.year === "number" ? row.year : null,
    month: row.month != null ? String(row.month) : null,
    title: row.title != null ? String(row.title) : null,
    venue: row.venue != null ? String(row.venue) : null,
    open_time: row.open_time != null ? String(row.open_time) : null,
    start_time: row.start_time != null ? String(row.start_time) : null,
    price: row.price != null ? String(row.price) : null,
    description: row.description != null ? String(row.description) : null,
    show_on_home: row.show_on_home != null ? Boolean(row.show_on_home) : null,
    home_order: typeof row.home_order === "number" ? row.home_order : null,
    published: row.published != null ? Boolean(row.published) : null,
    sort_order: typeof row.sort_order === "number" ? row.sort_order : null,
    source_file: row.source_file != null ? String(row.source_file) : null,
    source_route: row.source_route != null ? String(row.source_route) : null,
    created_at: row.created_at != null ? String(row.created_at) : null,
    updated_at: row.updated_at != null ? String(row.updated_at) : null,
  };
}

function isEmptyVenue(venue: string | null | undefined): boolean {
  return venue == null || venue === "";
}

export function validateG6F6SafeFieldsBeforeSnapshot(
  row: ScheduleDryRunSource,
): G6F6BeforeSnapshotCheckResult {
  const warnings: string[] = [];

  if (row.id !== SCHEDULE_NON_DRY_RUN_POC_TARGET_ID) {
    return {
      ok: false,
      abortReason: `id mismatch (expected ${SCHEDULE_NON_DRY_RUN_POC_TARGET_ID}, got ${row.id}).`,
      warnings,
    };
  }

  if (row.legacy_id !== G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_LEGACY_ID) {
    return {
      ok: false,
      abortReason: `legacy_id mismatch (expected ${G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_LEGACY_ID}, got ${row.legacy_id ?? "null"}).`,
      warnings,
    };
  }

  if (row.description !== G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_BEFORE_DESCRIPTION) {
    return {
      ok: false,
      abortReason: `description mismatch (expected "${G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_BEFORE_DESCRIPTION}", got "${row.description ?? ""}").`,
      warnings,
    };
  }

  if (!isEmptyVenue(row.venue)) {
    warnings.push(`venue is "${row.venue ?? ""}" (expected empty).`);
  }

  if (row.title !== "<>") {
    warnings.push(`title is "${row.title ?? ""}" (expected "<>").`);
  }

  if (row.published !== true) {
    warnings.push(`published is ${String(row.published)} (expected true).`);
  }

  if (row.show_on_home !== false) {
    warnings.push(`show_on_home is ${String(row.show_on_home)} (expected false).`);
  }

  return { ok: true, warnings, row };
}

export type G6F6SafeFieldsNonDryRunPocExecutionOutcome = {
  preCheck: G6F6BeforeSnapshotCheckResult;
  authEmail?: string;
  authStatus?: string;
  mockRole?: string;
  errorCode?: string;
  result?: ScheduleWriteAdapterResult;
  errorMessage?: string;
};

export async function executeG6F6SafeFieldsNonDryRunPoc(options: {
  url: string;
  anonKey: string;
}): Promise<G6F6SafeFieldsNonDryRunPocExecutionOutcome> {
  const config = getScheduleSafeFieldsNonDryRunPocConfig();
  if (!config.enabled) {
    return {
      preCheck: {
        ok: false,
        abortReason: config.disabledReason ?? "G-6-f6 PoC gates not satisfied.",
        warnings: [],
      },
      errorCode: SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_ERROR_CODES.POC_NOT_ARMED,
      errorMessage: config.disabledReason ?? "G-6-f6 PoC not armed.",
    };
  }

  const auth = await getStagingAuthSessionDetails(options.url, options.anonKey);
  const mockRole = formatMockRoleDisplay(auth);
  const authStatus = auth.session.status;

  if (!isSignedInStagingAuth(auth)) {
    return {
      preCheck: {
        ok: false,
        abortReason: "Authenticated admin session required.",
        warnings: [],
      },
      errorCode: SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_ERROR_CODES.AUTH_SESSION_MISSING,
      errorMessage: "Sign in as staging admin before running the PoC.",
      authStatus,
      mockRole,
    };
  }

  const authWarnings = collectScheduleNonDryRunPocAuthWarnings(auth);

  const client = getStagingSupabaseClient(options.url, options.anonKey);
  const { data, error } = await client
    .from("schedules")
    .select(SELECT_COLUMNS)
    .eq("id", SCHEDULE_NON_DRY_RUN_POC_TARGET_ID)
    .single();

  if (error || !data) {
    return {
      preCheck: {
        ok: false,
        abortReason: error?.message ?? "Target row not found.",
        warnings: authWarnings,
      },
      errorCode: SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_ERROR_CODES.TARGET_ROW_NOT_FOUND,
      errorMessage: error?.message ?? "Target row not found.",
      authEmail: auth.rawEmail,
      authStatus,
      mockRole,
    };
  }

  const row = mapRow(data as Record<string, unknown>);
  const preCheck = validateG6F6SafeFieldsBeforeSnapshot(row);
  const mergedWarnings = [...authWarnings, ...preCheck.warnings];

  if (!preCheck.ok) {
    return {
      preCheck: { ...preCheck, warnings: mergedWarnings },
      errorCode: SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_ERROR_CODES.BEFORE_SNAPSHOT_MISMATCH,
      errorMessage: preCheck.abortReason,
      authEmail: auth.rawEmail,
      authStatus,
      mockRole,
    };
  }

  const payload = { ...G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_FIXED_PAYLOAD };
  try {
    assertG6F6SafeFieldsPayloadOnly(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      preCheck: { ...preCheck, warnings: mergedWarnings },
      errorCode: SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_ERROR_CODES.WRITE_GUARD_FAILED,
      errorMessage: message,
      authEmail: auth.rawEmail,
      authStatus,
      mockRole,
    };
  }

  const writeClient = client as unknown as ScheduleWriteClient;
  const result = await updateScheduleWrite({
    client: writeClient,
    approvalId: G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_APPROVAL_ID,
    targetId: SCHEDULE_NON_DRY_RUN_POC_TARGET_ID,
    beforeSnapshot: row,
    payload,
  });

  return {
    preCheck: { ...preCheck, warnings: mergedWarnings },
    authEmail: auth.rawEmail,
    authStatus,
    mockRole,
    result,
  };
}
