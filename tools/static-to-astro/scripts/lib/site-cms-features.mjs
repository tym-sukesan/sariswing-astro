/**
 * G-20u20 — Site CMS / Supabase feature flags from registry.
 * Read-only resolution only — no DB writes.
 */

import {
  GOSAKI_SITE_KEY,
  TOOL_ROOT,
  getSiteRegistryEntry,
  resolveSupabaseSiteSlug,
} from "./site-registry.mjs";

/** @typedef {'schedule' | 'discography' | 'siteEmbeds'} SupabaseFeatureId */
/** @typedef {'youtube' | 'contact' | 'aboutBandProfiles' | 'aboutContent'} CmsFeatureId */

/**
 * @typedef {object} SupabaseFeatures
 * @property {boolean} schedule
 * @property {boolean} discography
 * @property {boolean} siteEmbeds
 */

/**
 * @typedef {object} CmsFeatures
 * @property {boolean} youtube
 * @property {boolean} contact
 * @property {boolean} aboutBandProfiles
 * @property {boolean} aboutContent
 */

/**
 * @typedef {object} SiteCmsFeaturePlan
 * @property {string} siteKey
 * @property {string} supabaseSiteSlug
 * @property {string} cmsSiteSlug
 * @property {SupabaseFeatures} supabaseFeatures
 * @property {CmsFeatures} cmsFeatures
 */

export const SUPABASE_FEATURE_IDS = /** @type {const} */ (["schedule", "discography", "siteEmbeds"]);
export const CMS_FEATURE_IDS = /** @type {const} */ ([
  "youtube",
  "contact",
  "aboutBandProfiles",
  "aboutContent",
]);

/** @type {SupabaseFeatures} */
const GOSAKI_SUPABASE_DEFAULTS = { schedule: true, discography: true, siteEmbeds: false };
/** @type {SupabaseFeatures} */
const PILOT_SUPABASE_DEFAULTS = { schedule: false, discography: false, siteEmbeds: false };
/** @type {CmsFeatures} */
const GOSAKI_CMS_DEFAULTS = {
  youtube: true,
  contact: true,
  aboutBandProfiles: true,
  aboutContent: true,
};
/** @type {CmsFeatures} */
const PILOT_CMS_DEFAULTS = {
  youtube: false,
  contact: false,
  aboutBandProfiles: false,
  aboutContent: false,
};

/**
 * @param {string} siteKey
 * @returns {SupabaseFeatures}
 */
function supabaseFeatureDefaults(siteKey) {
  if (siteKey === GOSAKI_SITE_KEY) return { ...GOSAKI_SUPABASE_DEFAULTS };
  return { ...PILOT_SUPABASE_DEFAULTS };
}

/**
 * @param {string} siteKey
 * @returns {CmsFeatures}
 */
function cmsFeatureDefaults(siteKey) {
  if (siteKey === GOSAKI_SITE_KEY) return { ...GOSAKI_CMS_DEFAULTS };
  return { ...PILOT_CMS_DEFAULTS };
}

/**
 * @param {unknown} raw
 * @param {string} siteKey
 * @returns {SupabaseFeatures}
 */
export function normalizeSupabaseFeatures(raw, siteKey) {
  const defaults = supabaseFeatureDefaults(siteKey);
  if (!raw || typeof raw !== "object") {
    return defaults;
  }
  const obj = /** @type {Record<string, unknown>} */ (raw);
  return {
    schedule: obj.schedule === true,
    discography: obj.discography === true,
    siteEmbeds: obj.siteEmbeds === true,
  };
}

/**
 * @param {unknown} raw
 * @param {string} siteKey
 * @returns {CmsFeatures}
 */
export function normalizeCmsFeatures(raw, siteKey) {
  const defaults = cmsFeatureDefaults(siteKey);
  if (!raw || typeof raw !== "object") {
    return defaults;
  }
  const obj = /** @type {Record<string, unknown>} */ (raw);
  return {
    youtube: obj.youtube === true,
    contact: obj.contact === true,
    aboutBandProfiles: obj.aboutBandProfiles === true,
    aboutContent: obj.aboutContent === true,
  };
}

/**
 * @param {string} siteKey
 * @param {string} [toolRoot]
 * @returns {SupabaseFeatures}
 */
export function resolveSupabaseFeatures(siteKey, toolRoot = TOOL_ROOT) {
  const entry = getSiteRegistryEntry(siteKey, toolRoot);
  return normalizeSupabaseFeatures(entry.supabaseFeatures, siteKey);
}

/**
 * @param {string} siteKey
 * @param {string} [toolRoot]
 * @returns {CmsFeatures}
 */
export function resolveCmsFeatures(siteKey, toolRoot = TOOL_ROOT) {
  const entry = getSiteRegistryEntry(siteKey, toolRoot);
  return normalizeCmsFeatures(entry.cmsFeatures, siteKey);
}

/**
 * @param {string} siteKey
 * @param {SupabaseFeatureId} feature
 * @param {string} [toolRoot]
 */
export function isSupabaseFeatureEnabled(siteKey, feature, toolRoot = TOOL_ROOT) {
  return resolveSupabaseFeatures(siteKey, toolRoot)[feature] === true;
}

/**
 * @param {string} siteKey
 * @param {CmsFeatureId} feature
 * @param {string} [toolRoot]
 */
export function isCmsFeatureEnabled(siteKey, feature, toolRoot = TOOL_ROOT) {
  return resolveCmsFeatures(siteKey, toolRoot)[feature] === true;
}

/**
 * @param {string} siteKey
 * @param {string} [toolRoot]
 * @returns {SiteCmsFeaturePlan}
 */
export function resolveSiteCmsFeaturePlan(siteKey, toolRoot = TOOL_ROOT) {
  const entry = getSiteRegistryEntry(siteKey, toolRoot);
  const slug = entry.slugSemantics ?? {};
  return {
    siteKey,
    supabaseSiteSlug: resolveSupabaseSiteSlug(siteKey, toolRoot),
    cmsSiteSlug: String(slug.cmsSiteSlug ?? siteKey),
    supabaseFeatures: resolveSupabaseFeatures(siteKey, toolRoot),
    cmsFeatures: resolveCmsFeatures(siteKey, toolRoot),
  };
}

/**
 * Read-only stub until `public.site_embeds` migration (G-9f).
 * Returns null when feature disabled — no Supabase call.
 *
 * @param {{ siteKey: string, toolRoot?: string }} opts
 */
export async function loadSiteEmbedsDataForBuild(opts) {
  const { siteKey, toolRoot = TOOL_ROOT } = opts;
  if (!isSupabaseFeatureEnabled(siteKey, "siteEmbeds", toolRoot)) {
    return null;
  }
  return {
    embedDataSource: "not-configured",
    fallbackReason: "site_embeds_table_migration_pending_G-9f",
    embeds: [],
    siteSlug: resolveSupabaseSiteSlug(siteKey, toolRoot),
    rowCount: 0,
  };
}
