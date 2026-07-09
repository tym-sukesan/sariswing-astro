/**
 * G-20t2 — CMS Kit schedule month discovery from published rows.
 * Auto-discovers /schedule/YYYY-MM/ from schedule data; optional override for empty months.
 */

import {
  cmsKitScheduleMonthRoute,
  scheduleMonthDisplayLabel,
} from "./schedule-pages.mjs";
import { deriveScheduleMonthsFromSchedules } from "./supabase-schedule-read.mjs";

/**
 * @param {string} monthKey YYYY-MM
 */
function emptyMonthMeta(monthKey) {
  const [year, monthNum] = monthKey.split("-");
  if (!year || !monthNum) return null;
  return {
    month: monthKey,
    year: Number(year),
    label: scheduleMonthDisplayLabel(year, monthNum),
    route: cmsKitScheduleMonthRoute(year, monthNum),
    count: 0,
    sort_order: 0,
    published: true,
    heading: `Schedule ${year}.${monthNum}`,
  };
}

/**
 * Discover public schedule months from published rows, optionally union empty override months.
 * @param {Array<{ month?: string }>} schedules normalized published schedule rows
 * @param {string[] | null | undefined} optionalMonthOverride YYYY-MM keys to keep on hub with 0 events
 */
export function resolveScheduleMonthsForBuild(schedules, optionalMonthOverride = null) {
  const discovered = deriveScheduleMonthsFromSchedules(schedules);
  /** @type {Map<string, (typeof discovered)[number]>} */
  const byMonth = new Map(discovered.map((entry) => [entry.month, entry]));

  for (const monthKey of optionalMonthOverride ?? []) {
    if (byMonth.has(monthKey)) continue;
    const empty = emptyMonthMeta(monthKey);
    if (empty) byMonth.set(monthKey, empty);
  }

  return [...byMonth.values()]
    .sort((a, b) => b.month.localeCompare(a.month))
    .map((entry, index) => ({ ...entry, sort_order: index + 1 }));
}

/**
 * @param {string[] | null | undefined} optionalMonthOverride
 */
export function isValidScheduleMonthOverride(optionalMonthOverride) {
  if (optionalMonthOverride == null) return true;
  if (!Array.isArray(optionalMonthOverride)) return false;
  return optionalMonthOverride.every((m) => /^\d{4}-\d{2}$/.test(String(m)));
}
