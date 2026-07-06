/**
 * G-22g1f1 — Client-side authenticated admin read for Gosaki Schedule operator UI (SELECT only).
 * No writes. No service_role. Requires signed-in Supabase Auth session (RLS schedules_admin_all).
 */

import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import { isSignedInStagingAuth } from "../staging-write/schedule-non-dry-run-poc-auth";
import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";
import { isCanonicalScheduleSourceRoute } from "../staging-write/staging-schedule-read";
import {
  GOSAKI_STAGING_CANONICAL_ROUTE_PREFIX,
  GOSAKI_STAGING_EXPECTED_MONTHS,
} from "./staging-schedule-site-slug-config";
import { assertStaticToAstroCmsStagingSupabaseProject } from "./staging-schedule-site-slug-host-gate";
import { splitSelectableAndAuditRows } from "./staging-schedule-site-slug-row-picker-utils";

/** Mirrors staging-schedule-read.ts SCHEDULE_DRY_RUN_SELECT (read-only). */
const SCHEDULE_ADMIN_READ_SELECT =
  "id,legacy_id,site_slug,date,year,month,title,venue,open_time,start_time,price,description,show_on_home,home_order,published,sort_order,source_file,source_route,created_at,updated_at" as const;

const READ_LIMIT = 100;

export type GosakiScheduleAdminReadMode =
  | "ssr-bootstrap"
  | "admin-authenticated"
  | "loading"
  | "error-fallback-bootstrap";

export type GosakiScheduleAdminClientReadResult = {
  ok: boolean;
  mode: GosakiScheduleAdminReadMode;
  records: ScheduleRecord[];
  source: "supabase" | "unavailable";
  error?: string;
  unpublishedCount: number;
  publishedCount: number;
};

function mapRow(row: Record<string, unknown>): ScheduleRecord {
  return {
    id: String(row.id ?? ""),
    legacy_id: row.legacy_id != null ? String(row.legacy_id) : null,
    site_slug: row.site_slug != null ? String(row.site_slug) : null,
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

function compareScheduleRecords(a: ScheduleRecord, b: ScheduleRecord): number {
  const dateCmp = a.date.localeCompare(b.date);
  if (dateCmp !== 0) return dateCmp;
  const sortDelta = (a.sort_order ?? 0) - (b.sort_order ?? 0);
  if (sortDelta !== 0) return sortDelta;
  return String(a.legacy_id ?? "").localeCompare(String(b.legacy_id ?? ""));
}

/**
 * SELECT-only authenticated admin read. Caller must be signed in; otherwise returns ssr-bootstrap mode.
 */
export async function loadGosakiSchedulesAuthenticatedAdminRead(options: {
  siteSlug: string;
  supabaseUrl: string;
  anonKey: string;
  months?: readonly string[];
  canonicalRoutePrefix?: string;
}): Promise<GosakiScheduleAdminClientReadResult> {
  const {
    siteSlug,
    supabaseUrl,
    anonKey,
    months = GOSAKI_STAGING_EXPECTED_MONTHS,
    canonicalRoutePrefix = GOSAKI_STAGING_CANONICAL_ROUTE_PREFIX,
  } = options;

  const emptyFailure = (
    mode: GosakiScheduleAdminReadMode,
    error: string,
  ): GosakiScheduleAdminClientReadResult => ({
    ok: false,
    mode,
    records: [],
    source: "unavailable",
    error,
    unpublishedCount: 0,
    publishedCount: 0,
  });

  if (!supabaseUrl?.trim() || !anonKey?.trim() || !siteSlug?.trim()) {
    return emptyFailure("error-fallback-bootstrap", "Supabase config or siteSlug missing.");
  }

  try {
    assertStaticToAstroCmsStagingSupabaseProject(supabaseUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return emptyFailure("error-fallback-bootstrap", message);
  }

  try {
    const auth = await getStagingAuthSessionDetails(supabaseUrl, anonKey);
    if (!isSignedInStagingAuth(auth)) {
      return emptyFailure(
        "ssr-bootstrap",
        "Not signed in — skip authenticated admin read.",
      );
    }

    const client = getStagingSupabaseClient(supabaseUrl, anonKey);
    const monthSet = months.length ? new Set(months) : null;

    const { data, error } = await client
      .from("schedules")
      .select(SCHEDULE_ADMIN_READ_SELECT)
      .eq("site_slug", siteSlug)
      .order("date", { ascending: true })
      .order("sort_order", { ascending: true })
      .limit(READ_LIMIT);

    if (error) {
      return emptyFailure(
        "error-fallback-bootstrap",
        `Supabase admin read failed (${error.message}).`,
      );
    }

    const allRecords = ((data ?? []) as Record<string, unknown>[])
      .map(mapRow)
      .filter(
        (r) =>
          r.id &&
          r.date &&
          isCanonicalScheduleSourceRoute(r.source_route, canonicalRoutePrefix) &&
          (!monthSet || monthSet.has(String(r.month ?? ""))),
      )
      .sort(compareScheduleRecords);

    const { selectableRows } = splitSelectableAndAuditRows(allRecords);

    if (selectableRows.length === 0) {
      return emptyFailure(
        "error-fallback-bootstrap",
        "Admin read returned no selectable rows.",
      );
    }

    const unpublishedCount = selectableRows.filter((r) => r.published === false).length;
    const publishedCount = selectableRows.filter((r) => r.published === true).length;

    return {
      ok: true,
      mode: "admin-authenticated",
      records: selectableRows,
      source: "supabase",
      unpublishedCount,
      publishedCount,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return emptyFailure(
      "error-fallback-bootstrap",
      `Authenticated admin read error (${message}).`,
    );
  }
}
