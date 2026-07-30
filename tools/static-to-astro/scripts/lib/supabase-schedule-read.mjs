/**
 * G-9d / G-9e — read-only CMS Kit schedule fetch for Astro convert/build (anon key only).
 * Generic site_slug loader + Gosaki thin wrapper. No DB writes.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  cmsKitScheduleMonthRoute,
  scheduleMonthDisplayLabel,
} from "./schedule-pages.mjs";
import { GOSAKI_SITE_KEY } from "./site-registry.mjs";
import { resolveScheduleMonthsForBuild } from "./schedule-month-discovery.mjs";
import { resolveSupabaseAnonReadEnv } from "./supabase-anon-read-env-utils.mjs";

export { resolveSupabaseAnonReadEnv } from "./supabase-anon-read-env-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

/** @deprecated use SCHEDULE_SELECT */
export const GOSAKI_SCHEDULE_SELECT =
  "id,legacy_id,site_slug,date,year,month,title,venue,open_time,start_time,price,description,image_url,source_file,source_route,show_on_home,home_order,published,sort_order,updated_at";

export const SCHEDULE_SELECT = GOSAKI_SCHEDULE_SELECT;

export const DEFAULT_CANONICAL_ROUTE_PREFIX = "/schedule/";

/**
 * Gosaki pilot — site_slug read config (G-9e / G-20t2).
 * Slug from site-registry (not gosaki-wix extractor).
 */
export const GOSAKI_SCHEDULE_SITE_CONFIG = {
  siteSlug: GOSAKI_SITE_KEY,
  canonicalRoutePrefix: DEFAULT_CANONICAL_ROUTE_PREFIX,
  /**
   * Optional YYYY-MM keys to include on hub/month routes even when no published rows exist.
   * Default null — months are auto-discovered from published schedule rows (G-20t2).
   */
  optionalMonthOverride: null,
};

/**
 * @param {string | null | undefined} iso YYYY-MM-DD
 */
export function formatScheduleDateDisplay(iso) {
  const m = String(iso ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso ?? "";
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getUTCDay()];
  return `${m[1]}.${m[2]}.${m[3]} (${dow})`;
}

/**
 * @param {Record<string, unknown>} row
 */
export function normalizeScheduleRecord(row) {
  const month = String(row.month ?? "");
  const [yearStr, monthNum] = month.split("-");
  return {
    id: row.id ?? null,
    legacy_id: row.legacy_id ?? null,
    site_slug: row.site_slug ?? null,
    date: row.date ?? null,
    date_display: row.date_display ?? formatScheduleDateDisplay(row.date),
    year: row.year ?? (yearStr ? Number(yearStr) : null),
    month,
    title: row.title ?? null,
    venue: row.venue ?? null,
    open_time: row.open_time ?? null,
    start_time: row.start_time ?? null,
    price: row.price ?? null,
    description: row.description ?? null,
    image_url: row.image_url ?? row.image ?? null,
    source_file: row.source_file ?? null,
    source_route: row.source_route ?? null,
    show_on_home: row.show_on_home ?? false,
    home_order: row.home_order ?? null,
    published: row.published !== false,
    sort_order: row.sort_order ?? 0,
    updated_at: row.updated_at ?? null,
    label: yearStr && monthNum ? scheduleMonthDisplayLabel(yearStr, monthNum) : month,
  };
}

/**
 * @param {string} route
 * @param {string} [canonicalRoutePrefix]
 */
export function isCanonicalScheduleSourceRoute(
  route,
  canonicalRoutePrefix = DEFAULT_CANONICAL_ROUTE_PREFIX,
) {
  const prefix = canonicalRoutePrefix.endsWith("/")
    ? canonicalRoutePrefix
    : `${canonicalRoutePrefix}/`;
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}\\d{4}-\\d{2}/$`).test(String(route ?? ""));
}

/**
 * Stable sort: date → sort_order → legacy_id
 * @param {ReturnType<typeof normalizeScheduleRecord>} a
 * @param {ReturnType<typeof normalizeScheduleRecord>} b
 */
export function compareScheduleRecords(a, b) {
  const da = a.date || "";
  const db = b.date || "";
  if (da !== db) return da.localeCompare(db);
  const sortDelta = (a.sort_order ?? 0) - (b.sort_order ?? 0);
  if (sortDelta !== 0) return sortDelta;
  return String(a.legacy_id ?? "").localeCompare(String(b.legacy_id ?? ""));
}

/**
 * @param {Array<ReturnType<typeof normalizeScheduleRecord>>} schedules
 */
export function sortScheduleRecords(schedules) {
  return [...schedules].sort(compareScheduleRecords);
}

/**
 * @param {Array<ReturnType<typeof normalizeScheduleRecord>>} schedules
 */
export function deriveScheduleMonthsFromSchedules(schedules) {
  /** @type {Map<string, { month: string, year: number, count: number }>} */
  const map = new Map();
  for (const row of schedules) {
    if (!row.month) continue;
    const existing = map.get(row.month) ?? {
      month: row.month,
      year: row.year ?? Number(row.month.split("-")[0]),
      count: 0,
    };
    existing.count += 1;
    map.set(row.month, existing);
  }

  return [...map.values()]
    .sort((a, b) => b.month.localeCompare(a.month))
    .map((entry, index) => {
      const [year, monthNum] = entry.month.split("-");
      return {
        month: entry.month,
        year: entry.year,
        label: scheduleMonthDisplayLabel(year, monthNum),
        route: cmsKitScheduleMonthRoute(year, monthNum),
        count: entry.count,
        sort_order: index + 1,
        published: true,
        heading: `Schedule ${year}.${monthNum}`,
      };
    });
}

/**
 * @param {{
 *   env: { supabaseUrl: string, anonKey: string },
 *   siteSlug: string,
 *   months?: string[] | null,
 *   canonicalRoutePrefix?: string,
 * }} opts
 */
export async function loadScheduleRowsFromSupabase({
  env,
  siteSlug,
  months = null,
  canonicalRoutePrefix = DEFAULT_CANONICAL_ROUTE_PREFIX,
}) {
  if (!siteSlug) {
    throw new Error("siteSlug is required for loadScheduleRowsFromSupabase");
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(env.supabaseUrl, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("schedules")
    .select(SCHEDULE_SELECT)
    .eq("site_slug", siteSlug)
    .eq("published", true)
    .order("date", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Supabase schedules read failed: ${error.message}`);
  }

  const monthSet = months?.length ? new Set(months) : null;

  const rows = (data ?? []).filter((row) => {
    if (!isCanonicalScheduleSourceRoute(row.source_route, canonicalRoutePrefix)) {
      return false;
    }
    if (monthSet && !monthSet.has(String(row.month ?? ""))) {
      return false;
    }
    return true;
  });

  return sortScheduleRecords(rows.map((row) => normalizeScheduleRecord(row)));
}

/**
 * @deprecated use loadScheduleRowsFromSupabase
 */
export async function fetchGosakiSchedulesFromSupabase(
  env,
  siteSlug = GOSAKI_SCHEDULE_SITE_CONFIG.siteSlug,
) {
  return loadScheduleRowsFromSupabase({
    env,
    siteSlug,
    months: null,
    canonicalRoutePrefix: GOSAKI_SCHEDULE_SITE_CONFIG.canonicalRoutePrefix,
  });
}

/**
 * @param {{
 *   siteSlug: string,
 *   inputDir: string,
 *   staticFallback: (inputDir: string) => Promise<Array<ReturnType<typeof normalizeScheduleRecord>> | Array<ReturnType<typeof normalizeScheduleRecord>>>,
 *   env?: NodeJS.ProcessEnv,
 *   toolRoot?: string,
 *   canonicalRoutePrefix?: string,
 *   months?: string[] | null,
 *   optionalMonthOverride?: string[] | null,
 *   logPrefix?: string,
 * }} opts
 */
export async function loadScheduleDataForBuild({
  siteSlug,
  inputDir,
  staticFallback,
  env = process.env,
  toolRoot = DEFAULT_TOOL_ROOT,
  canonicalRoutePrefix = DEFAULT_CANONICAL_ROUTE_PREFIX,
  months = null,
  optionalMonthOverride = null,
  logPrefix = "schedule-read",
}) {
  if (!siteSlug) {
    throw new Error("siteSlug is required for loadScheduleDataForBuild");
  }
  if (typeof staticFallback !== "function") {
    throw new Error("staticFallback function is required for loadScheduleDataForBuild");
  }

  const readEnv = resolveSupabaseAnonReadEnv(env, toolRoot);
  const inputAbs = path.resolve(inputDir);

  if (readEnv) {
    try {
      const schedules = await loadScheduleRowsFromSupabase({
        env: readEnv,
        siteSlug,
        months,
        canonicalRoutePrefix,
      });
      if (schedules.length > 0) {
        return {
          scheduleDataSource: "supabase",
          fallbackReason: null,
          schedules,
          months: resolveScheduleMonthsForBuild(schedules, optionalMonthOverride),
          siteSlug,
          rowCount: schedules.length,
        };
      }
      console.warn(
        `[${logPrefix}] Supabase returned 0 canonical rows; using static-fallback`,
      );
    } catch (err) {
      console.warn(
        `[${logPrefix}] Supabase read failed (${err.message}); using static-fallback`,
      );
    }
  } else {
    console.log(
      `[${logPrefix}] scheduleDataSource=static-fallback (Supabase env not configured)`,
    );
  }

  const fallbackRows = await staticFallback(inputAbs);
  const schedules = sortScheduleRecords(
    (fallbackRows ?? []).map((row) =>
      row.month && row.date !== undefined ? row : normalizeScheduleRecord(row),
    ),
  );

  if (schedules.length > 0) {
    return {
      scheduleDataSource: "static-fallback",
      fallbackReason: readEnv ? "supabase_empty_or_error" : "supabase_env_missing",
      schedules,
      months: resolveScheduleMonthsForBuild(schedules, optionalMonthOverride),
      siteSlug,
      rowCount: schedules.length,
    };
  }

  return {
    scheduleDataSource: "wix-html",
    fallbackReason: "extractor_empty",
    schedules: [],
    months: [],
    siteSlug,
    rowCount: 0,
  };
}
