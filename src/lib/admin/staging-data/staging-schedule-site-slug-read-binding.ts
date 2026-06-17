/**
 * G-9f — Staging shell Gosaki site_slug schedule read binding (SSR, read-only).
 */

import { getReadOnlyDataConfig } from "./read-only-data-config";
import {
  extractSupabaseHost,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
} from "../staging-write/schedule-non-dry-run-poc-config";
import { loadSchedulesForSiteSlugRead } from "../staging-write/staging-schedule-read";
import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";
import {
  G9F_PHASE,
  GOSAKI_STAGING_CANONICAL_ROUTE_PREFIX,
  GOSAKI_STAGING_EXPECTED_MONTHS,
  STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
} from "./staging-schedule-site-slug-config";

export type SiteSlugScheduleReadSource = "supabase" | "unavailable";

export interface SiteSlugMonthCount {
  month: string;
  count: number;
}

export interface SiteSlugScheduleReadBinding {
  phase: string;
  siteSlug: string;
  source: SiteSlugScheduleReadSource;
  rowCount: number;
  monthCounts: SiteSlugMonthCount[];
  rows: ScheduleRecord[];
  message?: string;
  readOnly: true;
  dataReadEnabled: boolean;
  supabaseHost?: string;
  expectedProject: string;
  expectedHost: string;
  selectOnly: true;
}

function deriveMonthCounts(rows: ScheduleRecord[]): SiteSlugMonthCount[] {
  /** @type {Map<string, number>} */
  const map = new Map();
  for (const row of rows) {
    const month = String(row.month ?? "");
    if (!month) continue;
    map.set(month, (map.get(month) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

export async function resolveGosakiScheduleSiteSlugReadBinding(): Promise<SiteSlugScheduleReadBinding> {
  const dataConfig = getReadOnlyDataConfig();
  const siteSlug = STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG;

  const base = {
    phase: G9F_PHASE,
    siteSlug,
    readOnly: true as const,
    selectOnly: true as const,
    expectedProject: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
    expectedHost: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
    supabaseHost: dataConfig.supabaseUrl
      ? extractSupabaseHost(dataConfig.supabaseUrl)
      : undefined,
    dataReadEnabled: dataConfig.supabaseDataEnabled,
  };

  if (!dataConfig.stagingShellEnabled) {
    return {
      ...base,
      source: "unavailable",
      rowCount: 0,
      monthCounts: [],
      rows: [],
      message: "Staging shell disabled — site_slug read unavailable.",
    };
  }

  if (!dataConfig.dataReadFlag || dataConfig.provider !== "supabase") {
    return {
      ...base,
      source: "unavailable",
      rowCount: 0,
      monthCounts: [],
      rows: [],
      message:
        "ENABLE_ADMIN_STAGING_DATA_READ + PUBLIC_ADMIN_DATA_PROVIDER=supabase required.",
    };
  }

  if (!dataConfig.supabaseConfigured) {
    return {
      ...base,
      source: "unavailable",
      rowCount: 0,
      monthCounts: [],
      rows: [],
      message: "Supabase URL/anon key missing — site_slug read unavailable.",
    };
  }

  const result = await loadSchedulesForSiteSlugRead({
    url: dataConfig.supabaseUrl,
    anonKey: dataConfig.supabaseAnonKey,
    siteSlug,
    useSupabase: true,
    canonicalRoutePrefix: GOSAKI_STAGING_CANONICAL_ROUTE_PREFIX,
    months: GOSAKI_STAGING_EXPECTED_MONTHS,
  });

  const rows = result.records;
  const monthCounts = deriveMonthCounts(rows);

  return {
    ...base,
    source: result.source === "supabase" && rows.length > 0 ? "supabase" : "unavailable",
    rowCount: rows.length,
    monthCounts,
    rows,
    message:
      result.error ??
      (rows.length > 0
        ? "Supabase read-only SELECT for site_slug=gosaki-piano."
        : "No rows returned for site_slug."),
  };
}
