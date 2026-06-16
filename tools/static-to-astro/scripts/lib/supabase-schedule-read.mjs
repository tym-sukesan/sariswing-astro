/**
 * G-9d — read-only Gosaki schedule fetch for Astro convert/build (anon key only).
 * No DB writes. Falls back to static fixture extractor when env missing or read fails.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  cmsKitScheduleMonthRoute,
  scheduleMonthDisplayLabel,
} from "./schedule-pages.mjs";
import {
  extractAllGosakiScheduleSeeds,
  GOSAKI_SITE_SLUG,
} from "./gosaki-wix-schedule-extractor.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

export const GOSAKI_SCHEDULE_SELECT =
  "legacy_id,site_slug,date,year,month,title,venue,open_time,start_time,price,description,image_url,source_file,source_route,show_on_home,home_order,published,sort_order";

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
    label: yearStr && monthNum ? scheduleMonthDisplayLabel(yearStr, monthNum) : month,
  };
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
 * @param {string} toolRoot
 */
function loadDotEnvLocal(toolRoot) {
  const envPath = path.join(toolRoot, ".env.local");
  if (!fs.existsSync(envPath)) return {};
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/**
 * Resolve anon read env (no service_role).
 * @param {NodeJS.ProcessEnv} processEnv
 * @param {string | null} toolRoot
 */
export function resolveSupabaseAnonReadEnv(processEnv = process.env, toolRoot = DEFAULT_TOOL_ROOT) {
  const local = toolRoot ? loadDotEnvLocal(toolRoot) : {};
  const merged = { ...local, ...processEnv };
  const supabaseUrl = String(merged.PUBLIC_SUPABASE_URL || merged.SUPABASE_URL || "").trim();
  const anonKey = String(
    merged.PUBLIC_SUPABASE_ANON_KEY || merged.SUPABASE_ANON_KEY || "",
  ).trim();
  if (!supabaseUrl || !anonKey) return null;
  if (/service[_-]?role/i.test(anonKey)) return null;
  return { supabaseUrl, anonKey };
}

/**
 * @param {{ supabaseUrl: string, anonKey: string }} env
 * @param {string} siteSlug
 */
export async function fetchGosakiSchedulesFromSupabase(env, siteSlug = GOSAKI_SITE_SLUG) {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(env.supabaseUrl, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("schedules")
    .select(GOSAKI_SCHEDULE_SELECT)
    .eq("site_slug", siteSlug)
    .eq("published", true)
    .order("date", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Supabase schedules read failed: ${error.message}`);
  }

  const rows = (data ?? []).filter((row) => {
    const route = String(row.source_route ?? "");
    return route.startsWith("/schedule/") && /^\/schedule\/\d{4}-\d{2}\/$/.test(route);
  });

  return rows;
}

/**
 * @param {{ inputDir: string, siteSlug?: string, env?: NodeJS.ProcessEnv, toolRoot?: string }} opts
 */
export async function loadGosakiScheduleDataForBuild({
  inputDir,
  siteSlug = GOSAKI_SITE_SLUG,
  env = process.env,
  toolRoot = DEFAULT_TOOL_ROOT,
}) {
  const readEnv = resolveSupabaseAnonReadEnv(env, toolRoot);

  if (readEnv) {
    try {
      const rows = await fetchGosakiSchedulesFromSupabase(readEnv, siteSlug);
      if (rows.length > 0) {
        const schedules = rows.map((row) => normalizeScheduleRecord(row));
        return {
          scheduleDataSource: "supabase",
          fallbackReason: null,
          schedules,
          months: deriveScheduleMonthsFromSchedules(schedules),
          siteSlug,
          rowCount: schedules.length,
        };
      }
      console.warn(
        "[gosaki-schedule] Supabase returned 0 canonical rows; using static-fallback",
      );
    } catch (err) {
      console.warn(
        `[gosaki-schedule] Supabase read failed (${err.message}); using static-fallback`,
      );
    }
  } else {
    console.log(
      "[gosaki-schedule] scheduleDataSource=static-fallback (Supabase env not configured)",
    );
  }

  const extracted = extractAllGosakiScheduleSeeds(path.resolve(inputDir));
  if (extracted.schedules.length > 0) {
    const schedules = extracted.schedules.map((row) => normalizeScheduleRecord(row));
    return {
      scheduleDataSource: "static-fallback",
      fallbackReason: readEnv ? "supabase_empty_or_error" : "supabase_env_missing",
      schedules,
      months: deriveScheduleMonthsFromSchedules(schedules),
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
