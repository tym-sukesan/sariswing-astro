/**
 * G-20u22 — Site-aware discography loader readiness (read-only).
 * Routes siteKey → registry feature flags → safe Supabase read or noop.
 * No DB writes. Non-Gosaki sites skip unfiltered reads until site_slug column exists.
 */

import {
  GOSAKI_SITE_KEY,
  TOOL_ROOT,
  resolveSiteCmsFeaturePlan,
} from "./site-registry.mjs";
import {
  DISCOGRAPHY_SITE_SLUG_COLUMN_READY,
  GOSAKI_DISCOGRAPHY_SITE_CONFIG,
  loadDiscographyDataForBuild,
  loadGosakiDiscographyDataForBuild,
} from "./supabase-discography-read.mjs";

export { DISCOGRAPHY_SITE_SLUG_COLUMN_READY, GOSAKI_DISCOGRAPHY_SITE_CONFIG };

/**
 * @typedef {object} DiscographyLoaderCapability
 * @property {DiscographyLoaderMode} mode
 * @property {string} siteKey
 * @property {string} siteSlug
 * @property {boolean} supabaseCallAllowed
 * @property {string | null} fallbackReason
 * @property {boolean} legacyUnfilteredRead
 */

/** @typedef {'noop_feature_off' | 'noop_site_slug_pending' | 'gosaki_legacy_unfiltered' | 'generic_filtered'} DiscographyLoaderMode */

/**
 * Resolve whether a site may perform a Supabase discography read at build time.
 *
 * @param {string} siteKey
 * @param {string} [toolRoot]
 * @returns {DiscographyLoaderCapability}
 */
export function resolveDiscographyLoaderCapability(siteKey, toolRoot = TOOL_ROOT) {
  const plan = resolveSiteCmsFeaturePlan(siteKey, toolRoot);
  const siteSlug = plan.supabaseSiteSlug;
  const features = plan.supabaseFeatures;

  if (!features.discography) {
    return {
      mode: "noop_feature_off",
      siteKey,
      siteSlug,
      supabaseCallAllowed: false,
      fallbackReason: null,
      legacyUnfilteredRead: false,
    };
  }

  if (siteKey === GOSAKI_SITE_KEY) {
    return {
      mode: "gosaki_legacy_unfiltered",
      siteKey,
      siteSlug,
      supabaseCallAllowed: true,
      fallbackReason: null,
      legacyUnfilteredRead: true,
    };
  }

  if (!DISCOGRAPHY_SITE_SLUG_COLUMN_READY) {
    return {
      mode: "noop_site_slug_pending",
      siteKey,
      siteSlug,
      supabaseCallAllowed: false,
      fallbackReason: "discography_site_slug_column_pending",
      legacyUnfilteredRead: false,
    };
  }

  return {
    mode: "generic_filtered",
    siteKey,
    siteSlug,
    supabaseCallAllowed: true,
    fallbackReason: null,
    legacyUnfilteredRead: false,
  };
}

/**
 * @param {string} fallbackReason
 * @param {string} siteSlug
 */
export function createDiscographyNoopBundle(fallbackReason, siteSlug) {
  return {
    discographyDataSource: "wix-html",
    fallbackReason,
    releases: [],
    tracks: [],
    tracksByLegacyId: {},
    rowCount: 0,
    trackRowCount: 0,
    siteSlug,
  };
}

/**
 * Site-aware discography bundle loader for convert/build.
 *
 * @param {{
 *   siteKey: string,
 *   env?: NodeJS.ProcessEnv,
 *   toolRoot?: string,
 * }} opts
 */
export async function loadSiteDiscographyBundleForBuild(opts) {
  const { siteKey, env = process.env, toolRoot = TOOL_ROOT } = opts;
  const capability = resolveDiscographyLoaderCapability(siteKey, toolRoot);

  if (capability.mode === "noop_feature_off") {
    return null;
  }

  if (!capability.supabaseCallAllowed) {
    return createDiscographyNoopBundle(capability.fallbackReason ?? "discography_read_blocked", capability.siteSlug);
  }

  if (capability.mode === "gosaki_legacy_unfiltered") {
    const bundle = await loadGosakiDiscographyDataForBuild({ env, toolRoot });
    return { ...bundle, siteSlug: capability.siteSlug };
  }

  return loadDiscographyDataForBuild({
    siteSlug: capability.siteSlug,
    env,
    toolRoot,
    logPrefix: `${siteKey}-discography`,
    legacyUnfilteredRead: false,
    requireSiteSlugFilter: true,
  });
}

