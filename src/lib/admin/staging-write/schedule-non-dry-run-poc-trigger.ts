/**
 * G-6-e5 — Hidden staging schedule non-dry-run PoC trigger (browser; authenticated session only).
 * No service_role. Payload and target are fixed. DB write via updateScheduleWrite only.
 */

import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import {
  getScheduleNonDryRunPocConfig,
  SCHEDULE_NON_DRY_RUN_POC_TARGET_ID,
} from "./schedule-non-dry-run-poc-config";
import { updateScheduleWrite } from "./schedule-write-adapter";
import {
  SCHEDULE_WRITE_APPROVAL_ID,
  type ScheduleUpdateWritePayload,
  type ScheduleWriteAdapterResult,
  type ScheduleWriteClient,
} from "./schedule-write-types";

export const SCHEDULE_NON_DRY_RUN_POC_LEGACY_ID = "schedule-2026-07-010";

export const SCHEDULE_NON_DRY_RUN_POC_BEFORE_DESCRIPTION = "出演：";

export const SCHEDULE_NON_DRY_RUN_POC_EXPECTED_UPDATED_AT =
  "2026-06-05 17:39:44.140168+00";

export const SCHEDULE_NON_DRY_RUN_POC_FIXED_PAYLOAD: ScheduleUpdateWritePayload =
  {
    description: "出演： [G-6-e5 non-dry-run PoC]",
  };

const SELECT_COLUMNS =
  "id,legacy_id,date,year,month,title,venue,open_time,start_time,price,description,image_url,home_image_url,source_file,source_route,show_on_home,home_order,published,sort_order,created_at,updated_at";

export type BeforeSnapshotCheckResult = {
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

function normalizeUpdatedAt(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\.\d{3}/, "").replace("T", " ").replace(/\+00$/, "+00");
}

export function validateScheduleNonDryRunPocBeforeSnapshot(
  row: ScheduleDryRunSource,
): BeforeSnapshotCheckResult {
  const warnings: string[] = [];

  if (row.id !== SCHEDULE_NON_DRY_RUN_POC_TARGET_ID) {
    return {
      ok: false,
      abortReason: `id mismatch (expected ${SCHEDULE_NON_DRY_RUN_POC_TARGET_ID}, got ${row.id}).`,
      warnings,
    };
  }

  if (row.legacy_id !== SCHEDULE_NON_DRY_RUN_POC_LEGACY_ID) {
    return {
      ok: false,
      abortReason: `legacy_id mismatch (expected ${SCHEDULE_NON_DRY_RUN_POC_LEGACY_ID}, got ${row.legacy_id ?? "null"}).`,
      warnings,
    };
  }

  if (row.description !== SCHEDULE_NON_DRY_RUN_POC_BEFORE_DESCRIPTION) {
    return {
      ok: false,
      abortReason: `description mismatch (expected "${SCHEDULE_NON_DRY_RUN_POC_BEFORE_DESCRIPTION}", got "${row.description ?? ""}").`,
      warnings,
    };
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

  const currentUpdatedAt = row.updated_at ?? "";
  const expected = SCHEDULE_NON_DRY_RUN_POC_EXPECTED_UPDATED_AT;
  if (
    currentUpdatedAt !== expected &&
    normalizeUpdatedAt(currentUpdatedAt) !== normalizeUpdatedAt(expected)
  ) {
    warnings.push(
      `updated_at differs (expected ${expected}, got ${currentUpdatedAt || "null"}). Proceeding without optimistic lock.`,
    );
  }

  return { ok: true, warnings, row };
}

export type ScheduleNonDryRunPocExecutionOutcome = {
  preCheck: BeforeSnapshotCheckResult;
  authEmail?: string;
  result?: ScheduleWriteAdapterResult;
  errorMessage?: string;
};

export async function executeScheduleNonDryRunPoc(options: {
  url: string;
  anonKey: string;
}): Promise<ScheduleNonDryRunPocExecutionOutcome> {
  const config = getScheduleNonDryRunPocConfig();
  if (!config.enabled) {
    return {
      preCheck: {
        ok: false,
        abortReason: config.disabledReason ?? "PoC trigger gates not satisfied.",
        warnings: [],
      },
      errorMessage: config.disabledReason ?? "PoC trigger disabled.",
    };
  }

  const auth = await getStagingAuthSessionDetails(options.url, options.anonKey);
  if (auth.session.status !== "signed-in" || !auth.rawEmail) {
    return {
      preCheck: { ok: false, abortReason: "Authenticated admin session required.", warnings: [] },
      errorMessage: "Sign in as staging admin before running the PoC.",
    };
  }

  if (auth.session.role !== "admin") {
    return {
      preCheck: {
        ok: false,
        abortReason: `User ${auth.rawEmail} is not an admin.`,
        warnings: [],
      },
      errorMessage: "Admin role required.",
      authEmail: auth.rawEmail,
    };
  }

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
        warnings: [],
      },
      errorMessage: error?.message ?? "Target row not found.",
      authEmail: auth.rawEmail,
    };
  }

  const row = mapRow(data as Record<string, unknown>);
  const preCheck = validateScheduleNonDryRunPocBeforeSnapshot(row);
  if (!preCheck.ok) {
    return {
      preCheck,
      errorMessage: preCheck.abortReason,
      authEmail: auth.rawEmail,
    };
  }

  const writeClient = client as unknown as ScheduleWriteClient;
  const result = await updateScheduleWrite({
    client: writeClient,
    approvalId: SCHEDULE_WRITE_APPROVAL_ID,
    targetId: SCHEDULE_NON_DRY_RUN_POC_TARGET_ID,
    beforeSnapshot: row,
    payload: SCHEDULE_NON_DRY_RUN_POC_FIXED_PAYLOAD,
  });

  return {
    preCheck,
    authEmail: auth.rawEmail,
    result,
  };
}
