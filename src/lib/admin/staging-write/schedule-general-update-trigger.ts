/**
 * G-6-f10 — General / next-slice schedule update trigger (product path).
 * Separate from frozen G-6-e5 / G-6-f6 PoCs. Passes expectedBeforeUpdatedAt when lock enabled.
 * No UI Save button in this phase — callable from future G-6-g slices only.
 */

import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import {
  collectScheduleNonDryRunPocAuthWarnings,
  formatMockRoleDisplay,
  isSignedInStagingAuth,
} from "./schedule-non-dry-run-poc-auth";
import { getScheduleOptimisticLockConfig } from "./schedule-optimistic-lock-config";
import { updateScheduleWrite } from "./schedule-write-adapter";
import {
  resolveExpectedBeforeUpdatedAt,
} from "./schedule-write-utils";
import type {
  ScheduleUpdateWritePayload,
  ScheduleWriteAdapterResult,
  ScheduleWriteApprovalIdUnion,
  ScheduleWriteClient,
} from "./schedule-write-types";

const SELECT_COLUMNS =
  "id,legacy_id,date,year,month,title,venue,open_time,start_time,price,description,image_url,home_image_url,source_file,source_route,show_on_home,home_order,published,sort_order,created_at,updated_at";

export type ScheduleGeneralUpdateWriteInput = {
  client: ScheduleWriteClient;
  approvalId: ScheduleWriteApprovalIdUnion;
  targetId: string;
  beforeSnapshot: ScheduleDryRunSource;
  payload: ScheduleUpdateWritePayload;
  optimisticLockEnabled?: boolean;
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

/**
 * Pure builder — product path always wires expectedBeforeUpdatedAt when lock is enabled.
 * Used by executeScheduleGeneralUpdateWrite and unit verification (no DB call).
 */
export function buildScheduleLockedWriteRequest(
  input: ScheduleGeneralUpdateWriteInput,
): Parameters<typeof updateScheduleWrite>[0] {
  const lockConfig = getScheduleOptimisticLockConfig();
  const lockEnabled = input.optimisticLockEnabled ?? lockConfig.enabled;
  const expectedBeforeUpdatedAt = lockEnabled
    ? resolveExpectedBeforeUpdatedAt(input.beforeSnapshot)
    : null;

  return {
    client: input.client,
    approvalId: input.approvalId,
    targetId: input.targetId,
    beforeSnapshot: input.beforeSnapshot,
    payload: input.payload,
    expectedBeforeUpdatedAt,
  };
}

export type ScheduleGeneralUpdateWriteOutcome = {
  authEmail?: string;
  authStatus?: string;
  mockRole?: string;
  warnings: string[];
  optimisticLockEnabled: boolean;
  expectedBeforeUpdatedAt: string | null;
  errorCode?: string;
  errorMessage?: string;
  result?: ScheduleWriteAdapterResult;
};

export async function loadScheduleBeforeSnapshot(options: {
  url: string;
  anonKey: string;
  targetId: string;
}): Promise<{ row?: ScheduleDryRunSource; error?: string }> {
  const client = getStagingSupabaseClient(options.url, options.anonKey);
  const { data, error } = await client
    .from("schedules")
    .select(SELECT_COLUMNS)
    .eq("id", options.targetId)
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Target row not found." };
  }

  return { row: mapRow(data as Record<string, unknown>) };
}

/**
 * General write entry — authenticated session + optimistic lock.
 * Requires a registered approval ID in schedule-write-guards (G-6-g slices).
 * Not exposed via UI in G-6-f10.
 */
export async function executeScheduleGeneralUpdateWrite(options: {
  url: string;
  anonKey: string;
  approvalId: ScheduleWriteApprovalIdUnion;
  targetId: string;
  beforeSnapshot?: ScheduleDryRunSource;
  payload: ScheduleUpdateWritePayload;
  optimisticLockEnabled?: boolean;
}): Promise<ScheduleGeneralUpdateWriteOutcome> {
  const lockConfig = getScheduleOptimisticLockConfig();
  const lockEnabled = options.optimisticLockEnabled ?? lockConfig.enabled;

  const auth = await getStagingAuthSessionDetails(options.url, options.anonKey);
  const mockRole = formatMockRoleDisplay(auth);
  const authStatus = auth.session.status;
  const authWarnings = collectScheduleNonDryRunPocAuthWarnings(auth);

  if (!isSignedInStagingAuth(auth)) {
    return {
      warnings: authWarnings,
      optimisticLockEnabled: lockEnabled,
      expectedBeforeUpdatedAt: null,
      errorCode: "auth_session_missing",
      errorMessage: "Sign in as staging admin before saving.",
      authStatus,
      mockRole,
    };
  }

  let beforeSnapshot = options.beforeSnapshot;
  if (!beforeSnapshot) {
    const loaded = await loadScheduleBeforeSnapshot({
      url: options.url,
      anonKey: options.anonKey,
      targetId: options.targetId,
    });
    if (!loaded.row) {
      return {
        warnings: authWarnings,
        optimisticLockEnabled: lockEnabled,
        expectedBeforeUpdatedAt: null,
        errorCode: "target_row_not_found",
        errorMessage: loaded.error ?? "Target row not found.",
        authEmail: auth.rawEmail,
        authStatus,
        mockRole,
      };
    }
    beforeSnapshot = loaded.row;
  }

  const writeClient = getStagingSupabaseClient(
    options.url,
    options.anonKey,
  ) as unknown as ScheduleWriteClient;

  const request = buildScheduleLockedWriteRequest({
    client: writeClient,
    approvalId: options.approvalId,
    targetId: options.targetId,
    beforeSnapshot,
    payload: options.payload,
    optimisticLockEnabled: lockEnabled,
  });

  const result = await updateScheduleWrite(request);

  return {
    warnings: authWarnings,
    optimisticLockEnabled: lockEnabled,
    expectedBeforeUpdatedAt: request.expectedBeforeUpdatedAt ?? null,
    authEmail: auth.rawEmail,
    authStatus,
    mockRole,
    result,
  };
}
