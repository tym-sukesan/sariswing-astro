/**
 * Gosaki site adapter — schedule static fallback + build wrapper.
 * Owns Wix extractor dependency so Core supabase-schedule-read stays site-agnostic.
 * No DB writes.
 */

import {
  extractAllGosakiScheduleSeeds,
} from "./gosaki-wix-schedule-extractor.mjs";
import {
  GOSAKI_SCHEDULE_SITE_CONFIG,
  loadScheduleDataForBuild,
  normalizeScheduleRecord,
} from "./supabase-schedule-read.mjs";

/**
 * Static fallback: crawl fixture / Wix HTML → normalized schedule rows.
 * @param {string} inputAbs
 * @returns {ReturnType<typeof normalizeScheduleRecord>[]}
 */
export function gosakiScheduleStaticFallback(inputAbs) {
  const extracted = extractAllGosakiScheduleSeeds(inputAbs);
  return extracted.schedules.map((row) => normalizeScheduleRecord(row));
}

/**
 * Gosaki pilot wrapper — uses generic loadScheduleDataForBuild (G-9e).
 * @param {{ inputDir: string, siteSlug?: string, env?: NodeJS.ProcessEnv, toolRoot?: string }} opts
 */
export async function loadGosakiScheduleDataForBuild({
  inputDir,
  siteSlug = GOSAKI_SCHEDULE_SITE_CONFIG.siteSlug,
  env = process.env,
  toolRoot,
}) {
  return loadScheduleDataForBuild({
    siteSlug,
    inputDir,
    env,
    ...(toolRoot !== undefined ? { toolRoot } : {}),
    canonicalRoutePrefix: GOSAKI_SCHEDULE_SITE_CONFIG.canonicalRoutePrefix,
    months: null,
    optionalMonthOverride: GOSAKI_SCHEDULE_SITE_CONFIG.optionalMonthOverride,
    logPrefix: "gosaki-schedule",
    staticFallback: async (inputAbs) => gosakiScheduleStaticFallback(inputAbs),
  });
}

export { GOSAKI_SCHEDULE_SITE_CONFIG };
