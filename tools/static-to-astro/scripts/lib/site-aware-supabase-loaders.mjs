/**
 * G-20u13 — Site-aware Supabase read loaders for convert/build.
 * Resolves siteKey → registry.supabaseSiteSlug + feature flags.
 * Gosaki wrappers delegate here. No DB writes.
 */

import {
  GOSAKI_SITE_KEY,
  TOOL_ROOT,
  resolveSupabaseFeatures,
  resolveSupabaseSiteSlug,
} from "./site-registry.mjs";
import {
  GOSAKI_SCHEDULE_SITE_CONFIG,
  loadGosakiScheduleDataForBuild,
  loadScheduleDataForBuild,
} from "./supabase-schedule-read.mjs";
import { loadGosakiDiscographyDataForBuild } from "./supabase-discography-read.mjs";

/**
 * @typedef {object} SiteSupabaseLoadPlan
 * @property {string} siteKey
 * @property {string} supabaseSiteSlug
 * @property {{ schedule: boolean, discography: boolean }} features
 */

/**
 * @param {string} siteKey
 * @param {string} [toolRoot]
 * @returns {SiteSupabaseLoadPlan}
 */
export function resolveSiteSupabaseLoadPlan(siteKey, toolRoot = TOOL_ROOT) {
  return {
    siteKey,
    supabaseSiteSlug: resolveSupabaseSiteSlug(siteKey, toolRoot),
    features: resolveSupabaseFeatures(siteKey, toolRoot),
  };
}

/**
 * @param {{
 *   siteKey: string,
 *   inputDir: string,
 *   env?: NodeJS.ProcessEnv,
 *   toolRoot?: string,
 * }} opts
 */
export async function loadSiteScheduleDataForBuild(opts) {
  const { siteKey, inputDir, env = process.env, toolRoot = TOOL_ROOT } = opts;
  const plan = resolveSiteSupabaseLoadPlan(siteKey, toolRoot);

  if (!plan.features.schedule) {
    return null;
  }

  if (siteKey === GOSAKI_SITE_KEY) {
    return loadGosakiScheduleDataForBuild({
      inputDir,
      siteSlug: plan.supabaseSiteSlug,
      env,
      toolRoot,
    });
  }

  return loadScheduleDataForBuild({
    siteSlug: plan.supabaseSiteSlug,
    inputDir,
    env,
    toolRoot,
    canonicalRoutePrefix: GOSAKI_SCHEDULE_SITE_CONFIG.canonicalRoutePrefix,
    months: null,
    optionalMonthOverride: null,
    logPrefix: `${siteKey}-schedule`,
    staticFallback: async () => [],
  });
}

/**
 * @param {{
 *   siteKey: string,
 *   env?: NodeJS.ProcessEnv,
 *   toolRoot?: string,
 * }} opts
 */
export async function loadSiteDiscographyDataForBuild(opts) {
  const { siteKey, env = process.env, toolRoot = TOOL_ROOT } = opts;
  const plan = resolveSiteSupabaseLoadPlan(siteKey, toolRoot);

  if (!plan.features.discography) {
    return null;
  }

  if (siteKey === GOSAKI_SITE_KEY) {
    return loadGosakiDiscographyDataForBuild({ env, toolRoot });
  }

  return {
    discographyDataSource: "wix-html",
    fallbackReason: "site_discography_loader_not_implemented",
    releases: [],
    tracks: [],
    tracksByLegacyId: {},
    rowCount: 0,
    trackRowCount: 0,
    siteSlug: plan.supabaseSiteSlug,
  };
}

/**
 * @param {{
 *   siteKey: string,
 *   inputDir: string,
 *   env?: NodeJS.ProcessEnv,
 *   toolRoot?: string,
 * }} opts
 */
export async function loadSiteSupabaseDataForBuild(opts) {
  const schedule = await loadSiteScheduleDataForBuild(opts);
  const discography = await loadSiteDiscographyDataForBuild(opts);
  return { schedule, discography, plan: resolveSiteSupabaseLoadPlan(opts.siteKey, opts.toolRoot) };
}
