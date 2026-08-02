/**
 * G-9d / G-9e / CMS Core v2 Schedule TBD date_status read-wiring —
 * read-only CMS Kit schedule fetch for Astro convert/build (anon key only).
 * Generic site_slug loader + Gosaki thin wrapper. No DB writes.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  cmsKitScheduleMonthRoute,
  scheduleMonthDisplayLabel,
} from "./schedule-pages.mjs";
import {
  SCHEDULE_DATE_STATUS_CONFIRMED,
  SCHEDULE_DATE_STATUS_TBD,
  compareScheduleDateContract,
  normalizeScheduleDateContract,
  scheduleRowToDateContractInput,
} from "./schedule-date-contract.mjs";
import { GOSAKI_SITE_KEY } from "./site-registry.mjs";
import { resolveScheduleMonthsForBuild } from "./schedule-month-discovery.mjs";
import { resolveSupabaseAnonReadEnv } from "./supabase-anon-read-env-utils.mjs";
import {
  PRODUCTION_REF_STOP,
  STAGING_PROJECT_REF,
  stringContainsProductionRef,
  stringContainsStagingRef,
} from "./supabase-staging-ref-utils.mjs";

export { resolveSupabaseAnonReadEnv } from "./supabase-anon-read-env-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

/** Legacy confirmed-only SELECT — safe on production / pre-migration schemas. */
export const GOSAKI_SCHEDULE_SELECT =
  "id,legacy_id,site_slug,date,year,month,title,venue,open_time,start_time,price,description,image_url,source_file,source_route,show_on_home,home_order,published,sort_order,updated_at";

/** @deprecated alias — prefer SCHEDULE_SELECT_LEGACY / resolveScheduleSelectClause */
export const SCHEDULE_SELECT_LEGACY = GOSAKI_SCHEDULE_SELECT;

/** TBD v1 SELECT — includes date_status; only when schemaSupportsTbdRead === true on staging Kit. */
export const SCHEDULE_SELECT_TBD_V1 =
  "id,legacy_id,site_slug,date,date_status,year,month,title,venue,open_time,start_time,price,description,image_url,source_file,source_route,show_on_home,home_order,published,sort_order,updated_at";

/** Default export alias remains legacy (no date_status) for production-safe callers. */
export const SCHEDULE_SELECT = SCHEDULE_SELECT_LEGACY;

export const SCHEDULE_SELECT_MODE_LEGACY = "legacy";
export const SCHEDULE_SELECT_MODE_TBD_V1 = "tbd-v1";

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
 * Exact boolean true only — string "true" / 1 / "TRUE" are false.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isSchemaSupportsTbdRead(value) {
  return value === true;
}

/**
 * Staging Kit path may arm TBD read capability (exact boolean true).
 * Production / unknown / unset → false.
 * @param {string | null | undefined} supabaseUrl
 * @returns {boolean}
 */
export function resolveSchemaSupportsTbdReadForSupabaseUrl(supabaseUrl) {
  const raw = String(supabaseUrl ?? "");
  if (!raw) return false;
  if (stringContainsProductionRef(raw)) return false;
  if (!stringContainsStagingRef(raw)) return false;
  // Exact staging Kit ref only (substring already true for Kit host).
  if (!raw.includes(STAGING_PROJECT_REF)) return false;
  return true;
}

/**
 * Resolve SELECT clause for schedules read.
 * - schemaSupportsTbdRead must be boolean exact true for TBD v1
 * - production ref never uses TBD v1 (STOP if exact true requested)
 * - missing column on TBD v1 is not auto-fallbacked (caller sees Supabase error)
 *
 * @param {{
 *   schemaSupportsTbdRead?: unknown,
 *   supabaseUrl?: string | null,
 * }} [options]
 * @returns {{
 *   select: string,
 *   mode: typeof SCHEDULE_SELECT_MODE_LEGACY | typeof SCHEDULE_SELECT_MODE_TBD_V1,
 *   schemaSupportsTbdRead: boolean,
 * }}
 */
export function resolveScheduleSelectClause(options = {}) {
  const supabaseUrl = options.supabaseUrl ?? null;
  const armed = isSchemaSupportsTbdRead(options.schemaSupportsTbdRead);

  if (stringContainsProductionRef(supabaseUrl)) {
    if (armed) {
      throw new Error(
        `STOP: TBD v1 schedule SELECT is forbidden on production Supabase ref (${PRODUCTION_REF_STOP})`,
      );
    }
    return {
      select: SCHEDULE_SELECT_LEGACY,
      mode: SCHEDULE_SELECT_MODE_LEGACY,
      schemaSupportsTbdRead: false,
    };
  }

  if (!armed) {
    return {
      select: SCHEDULE_SELECT_LEGACY,
      mode: SCHEDULE_SELECT_MODE_LEGACY,
      schemaSupportsTbdRead: false,
    };
  }

  if (!stringContainsStagingRef(supabaseUrl)) {
    throw new Error(
      `STOP: TBD v1 schedule SELECT requires staging Kit ref (${STAGING_PROJECT_REF}) when schemaSupportsTbdRead===true`,
    );
  }

  return {
    select: SCHEDULE_SELECT_TBD_V1,
    mode: SCHEDULE_SELECT_MODE_TBD_V1,
    schemaSupportsTbdRead: true,
  };
}

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
 * Explicit date_status / dateStatus / extensions.dateStatus only (no null-date inference).
 * @param {Record<string, unknown>} row
 * @returns {string | null}
 */
export function readExplicitScheduleDateStatus(row) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return null;
  if (row.date_status != null && row.date_status !== "") return String(row.date_status);
  if (row.dateStatus != null && row.dateStatus !== "") return String(row.dateStatus);
  const ext =
    row.extensions && typeof row.extensions === "object" && !Array.isArray(row.extensions)
      ? /** @type {Record<string, unknown>} */ (row.extensions)
      : null;
  if (!ext) return null;
  if (ext.date_status != null && ext.date_status !== "") return String(ext.date_status);
  if (ext.dateStatus != null && ext.dateStatus !== "") return String(ext.dateStatus);
  return null;
}

/**
 * Legacy confirmed mapping for rows that already have a calendar date.
 * Null/empty date is skipped (no auto-TBD). Does not mutate `row`.
 *
 * @param {Record<string, unknown>} row
 * @returns {{ ok: true, skipped: true, reason: string } | import("./schedule-date-contract.mjs").ScheduleDateContractResult}
 */
export function validateLegacyConfirmedScheduleDateContract(row) {
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    return {
      ok: false,
      errors: ["row must be a plain object"],
      codes: ["input_type"],
    };
  }
  const date = row.date;
  if (date == null || date === "") {
    return { ok: true, skipped: true, reason: "no_date_legacy_path" };
  }
  const monthRaw = row.month;
  const yearRaw = row.year;
  const sortRaw = row.sort_order ?? row.sortOrder;
  return normalizeScheduleDateContract({
    dateStatus: SCHEDULE_DATE_STATUS_CONFIRMED,
    date,
    month: monthRaw == null || monthRaw === "" ? null : monthRaw,
    year: yearRaw == null || yearRaw === "" ? null : yearRaw,
    sortOrder: typeof sortRaw === "number" && Number.isFinite(sortRaw) ? sortRaw : 0,
    legacyId: row.legacy_id ?? row.legacyId ?? null,
    sourceRoute: row.source_route ?? row.sourceRoute ?? null,
  });
}

/**
 * @param {Record<string, unknown>} row
 * @param {import("./schedule-date-contract.mjs").ScheduleDateContract} contract
 * @param {string} dateDisplay
 */
function buildNormalizedScheduleRecord(row, contract, dateDisplay) {
  const month =
    contract.month == null || contract.month === ""
      ? contract.month == null
        ? null
        : ""
      : contract.month;
  const year =
    contract.year ??
    (typeof month === "string" && month.includes("-")
      ? Number(month.split("-")[0])
      : row.year ?? null);
  const label =
    typeof month === "string" && /^\d{4}-\d{2}$/.test(month)
      ? scheduleMonthDisplayLabel(month.slice(0, 4), month.slice(5, 7))
      : month == null
        ? ""
        : String(month);

  return {
    id: row.id ?? null,
    legacy_id: row.legacy_id ?? null,
    site_slug: row.site_slug ?? null,
    date: contract.date,
    date_display: dateDisplay,
    dateDisplay,
    dateStatus: contract.dateStatus,
    date_status: contract.dateStatus,
    year,
    month: month == null ? null : month,
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
    sort_order: row.sort_order ?? contract.sortOrder ?? 0,
    updated_at: row.updated_at ?? null,
    label,
    monthMembership: contract.monthMembership,
    dateContract: contract,
  };
}

/**
 * Soft legacy path: null date + no explicit status (no auto-TBD).
 * Preserves historical normalize for incomplete static rows.
 * @param {Record<string, unknown>} row
 */
function buildSoftNullDateScheduleRecord(row) {
  const monthRaw = row.month;
  const month =
    monthRaw == null || monthRaw === ""
      ? monthRaw == null
        ? null
        : String(monthRaw)
      : String(monthRaw);
  const [yearStr, monthNum] =
    typeof month === "string" && month.includes("-") ? month.split("-") : ["", ""];
  const dateDisplay =
    row.date_display != null ? String(row.date_display) : formatScheduleDateDisplay(row.date);
  return {
    id: row.id ?? null,
    legacy_id: row.legacy_id ?? null,
    site_slug: row.site_slug ?? null,
    date: row.date ?? null,
    date_display: dateDisplay,
    dateDisplay,
    year: row.year ?? (yearStr ? Number(yearStr) : null),
    month: month == null ? "" : month,
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
    label: yearStr && monthNum ? scheduleMonthDisplayLabel(yearStr, monthNum) : month == null ? "" : String(month),
  };
}

/**
 * @param {Record<string, unknown>} row
 */
export function normalizeScheduleRecord(row) {
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    throw new Error("Schedule normalize failed: row must be a plain object");
  }

  const explicitStatus = readExplicitScheduleDateStatus(row);

  if (explicitStatus != null) {
    const input = scheduleRowToDateContractInput({
      ...row,
      date_status: explicitStatus,
      dateStatus: explicitStatus,
    });
    const contract = normalizeScheduleDateContract(input);
    if (!contract.ok) {
      const detail = (contract.errors || []).join("; ") || "unknown";
      throw new Error(`Schedule date contract failed: ${detail}`);
    }
    const dateDisplay =
      row.date_display != null && row.date_display !== ""
        ? String(row.date_display)
        : contract.value.display;
    return buildNormalizedScheduleRecord(row, contract.value, dateDisplay);
  }

  if (row.date != null && row.date !== "") {
    const contract = validateLegacyConfirmedScheduleDateContract(row);
    if (!contract.ok) {
      const detail = (contract.errors || []).join("; ") || "unknown";
      throw new Error(
        `Schedule date contract failed (legacy confirmed): ${detail}`,
      );
    }
    if (contract.skipped) {
      return buildSoftNullDateScheduleRecord(row);
    }
    const dateDisplay =
      row.date_display != null && row.date_display !== ""
        ? String(row.date_display)
        : contract.value.display;
    return buildNormalizedScheduleRecord(row, contract.value, dateDisplay);
  }

  return buildSoftNullDateScheduleRecord(row);
}

/**
 * Hub membership: confirmed + month-known TBD + month-unknown TBD.
 * @param {Record<string, unknown>} row
 * @returns {boolean}
 */
export function scheduleBelongsOnHub(row) {
  if (!row || typeof row !== "object") return false;
  if (row.published === false) return false;
  return true;
}

/**
 * Month page membership: confirmed + month-known TBD for that month; hub-only TBD excluded.
 * @param {Record<string, unknown>} row
 * @param {string} monthKey YYYY-MM
 * @returns {boolean}
 */
export function scheduleBelongsToMonthPage(row, monthKey) {
  if (!row || typeof row !== "object") return false;
  if (row.published === false) return false;
  const membership = row.monthMembership;
  if (membership && typeof membership === "object") {
    if (/** @type {any} */ (membership).kind === "hub-only") return false;
    if (/** @type {any} */ (membership).kind === "month-page") {
      return String(/** @type {any} */ (membership).month) === String(monthKey);
    }
  }
  if (row.dateStatus === SCHEDULE_DATE_STATUS_TBD || row.date_status === SCHEDULE_DATE_STATUS_TBD) {
    if (row.month == null || row.month === "") return false;
  }
  return String(row.month ?? "") === String(monthKey);
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
 * Build a date-contract-shaped object for sorting from a normalized (or soft) row.
 * @param {Record<string, unknown>} row
 * @returns {import("./schedule-date-contract.mjs").ScheduleDateContract}
 */
export function scheduleRecordToSortContract(row) {
  if (row?.dateContract && typeof row.dateContract === "object") {
    return /** @type {import("./schedule-date-contract.mjs").ScheduleDateContract} */ (
      row.dateContract
    );
  }
  const sortOrder =
    typeof row.sort_order === "number" && Number.isFinite(row.sort_order)
      ? row.sort_order
      : typeof row.sortOrder === "number" && Number.isFinite(row.sortOrder)
        ? row.sortOrder
        : 0;
  const legacyId =
    row.legacy_id == null || row.legacy_id === ""
      ? row.legacyId == null || row.legacyId === ""
        ? null
        : String(row.legacyId)
      : String(row.legacy_id);
  const sourceRoute =
    row.source_route == null || row.source_route === ""
      ? null
      : String(row.source_route);
  const status =
    row.dateStatus === SCHEDULE_DATE_STATUS_TBD ||
    row.date_status === SCHEDULE_DATE_STATUS_TBD
      ? SCHEDULE_DATE_STATUS_TBD
      : row.date != null && row.date !== ""
        ? SCHEDULE_DATE_STATUS_CONFIRMED
        : SCHEDULE_DATE_STATUS_TBD;
  const month =
    row.month == null || row.month === ""
      ? null
      : String(row.month);
  if (status === SCHEDULE_DATE_STATUS_CONFIRMED) {
    const date = String(row.date);
    const derivedMonth = month ?? date.slice(0, 7);
    return {
      dateStatus: SCHEDULE_DATE_STATUS_CONFIRMED,
      date,
      month: derivedMonth,
      year: row.year == null ? Number(derivedMonth.slice(0, 4)) : Number(row.year),
      sortOrder,
      legacyId,
      sourceRoute,
      display: String(row.date_display ?? row.dateDisplay ?? ""),
      monthMembership: { kind: "month-page", month: derivedMonth },
    };
  }
  return {
    dateStatus: SCHEDULE_DATE_STATUS_TBD,
    date: null,
    month,
    year: month ? Number(String(month).slice(0, 4)) : null,
    sortOrder,
    legacyId,
    sourceRoute,
    display: String(row.date_display ?? row.dateDisplay ?? ""),
    monthMembership: month
      ? { kind: "month-page", month }
      : { kind: "hub-only" },
  };
}

/**
 * Kit TBD sort contract (wired): month ASC → confirmed before tbd → …
 * @param {ReturnType<typeof normalizeScheduleRecord>} a
 * @param {ReturnType<typeof normalizeScheduleRecord>} b
 */
export function compareScheduleRecords(a, b) {
  return compareScheduleDateContract(
    scheduleRecordToSortContract(a),
    scheduleRecordToSortContract(b),
  );
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
    if (row.monthMembership?.kind === "hub-only") continue;
    if (!row.month) continue;
    const existing = map.get(row.month) ?? {
      month: row.month,
      year: row.year ?? Number(String(row.month).split("-")[0]),
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
 *   schemaSupportsTbdRead?: unknown,
 * }} opts
 */
export async function loadScheduleRowsFromSupabase({
  env,
  siteSlug,
  months = null,
  canonicalRoutePrefix = DEFAULT_CANONICAL_ROUTE_PREFIX,
  schemaSupportsTbdRead,
}) {
  if (!siteSlug) {
    throw new Error("siteSlug is required for loadScheduleRowsFromSupabase");
  }

  const resolvedCapability =
    schemaSupportsTbdRead !== undefined
      ? schemaSupportsTbdRead
      : resolveSchemaSupportsTbdReadForSupabaseUrl(env.supabaseUrl);

  const selectResolved = resolveScheduleSelectClause({
    schemaSupportsTbdRead: resolvedCapability,
    supabaseUrl: env.supabaseUrl,
  });

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(env.supabaseUrl, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("schedules")
    .select(selectResolved.select)
    .eq("site_slug", siteSlug)
    .eq("published", true)
    .order("date", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true });

  if (error) {
    // Fail-closed: never hide TBD v1 column errors behind legacy SELECT.
    throw new Error(
      `Supabase schedules read failed (${selectResolved.mode}): ${error.message}`,
    );
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
 *   schemaSupportsTbdRead?: unknown,
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
  schemaSupportsTbdRead,
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
      const capability =
        schemaSupportsTbdRead !== undefined
          ? schemaSupportsTbdRead
          : resolveSchemaSupportsTbdReadForSupabaseUrl(readEnv.supabaseUrl);
      const schedules = await loadScheduleRowsFromSupabase({
        env: readEnv,
        siteSlug,
        months,
        canonicalRoutePrefix,
        schemaSupportsTbdRead: capability,
      });
      if (schedules.length > 0) {
        return {
          scheduleDataSource: "supabase",
          fallbackReason: null,
          schedules,
          months: resolveScheduleMonthsForBuild(schedules, optionalMonthOverride),
          siteSlug,
          rowCount: schedules.length,
          scheduleSelectMode: resolveScheduleSelectClause({
            schemaSupportsTbdRead: capability,
            supabaseUrl: readEnv.supabaseUrl,
          }).mode,
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
