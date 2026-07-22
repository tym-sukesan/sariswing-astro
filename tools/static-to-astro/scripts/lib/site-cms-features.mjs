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
/** @typedef {'youtube' | 'contact' | 'aboutBandProfiles' | 'aboutContent' | 'readOnlyAdmin'} CmsFeatureId */

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
 * @property {boolean} readOnlyAdmin
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
  "readOnlyAdmin",
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
  readOnlyAdmin: true,
};
/** @type {CmsFeatures} */
const PILOT_CMS_DEFAULTS = {
  youtube: false,
  contact: false,
  aboutBandProfiles: false,
  aboutContent: false,
  readOnlyAdmin: false,
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
    readOnlyAdmin: obj.readOnlyAdmin === true,
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
 * Read-only site_embeds loader for build/convert (CMS Core v2 Phase 2).
 * Default: null when registry.siteEmbeds=false and CMS_KIT_SITE_EMBEDS_BUILD_READ≠true
 * (JSON YouTube SoT remains convert fallback — no blank home).
 * When enabled: anon SELECT published youtube rows; empty/error → caller keeps JSON.
 * Never uses service_role. Production ref STOP.
 *
 * @param {{ siteKey: string, toolRoot?: string, env?: NodeJS.ProcessEnv }} opts
 */
export async function loadSiteEmbedsDataForBuild(opts) {
  const { siteKey, toolRoot = TOOL_ROOT, env = process.env } = opts;
  const featureOn = isSupabaseFeatureEnabled(siteKey, "siteEmbeds", toolRoot);
  const envOn = String(env.CMS_KIT_SITE_EMBEDS_BUILD_READ ?? "").trim() === "true";
  if (!featureOn && !envOn) {
    return null;
  }

  const siteSlug = resolveSupabaseSiteSlug(siteKey, toolRoot);
  const { resolveSupabaseAnonReadEnv } = await import("./supabase-schedule-read.mjs");
  const readEnv = resolveSupabaseAnonReadEnv(env, toolRoot);
  if (!readEnv) {
    // Historical G-20u20 stub reason retained until migration+env wired.
    return {
      embedDataSource: "not-configured",
      fallbackReason: "site_embeds_table_migration_pending_G-9f",
      embeds: [],
      siteSlug,
      rowCount: 0,
    };
  }
  if (readEnv.supabaseUrl.includes("vsbvndwuajjhnzpohghh")) {
    return {
      embedDataSource: "blocked",
      fallbackReason: "production_ref_stop",
      embeds: [],
      siteSlug,
      rowCount: 0,
    };
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(readEnv.supabaseUrl, readEnv.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client
      .from("site_embeds")
      .select(
        "id,site_id,site_slug,provider,legacy_item_id,title,source_url,embed_url,published,sort_order,updated_at",
      )
      .eq("site_slug", siteSlug)
      .eq("provider", "youtube")
      .eq("published", true)
      .order("sort_order", { ascending: true });
    if (error) {
      return {
        embedDataSource: "error",
        fallbackReason: error.message,
        embeds: [],
        siteSlug,
        rowCount: 0,
      };
    }
    const embeds = Array.isArray(data) ? data : [];
    if (embeds.length === 0) {
      return {
        embedDataSource: "supabase-empty",
        fallbackReason: "no_published_site_embeds_rows",
        embeds: [],
        siteSlug,
        rowCount: 0,
      };
    }
    return {
      embedDataSource: "supabase",
      fallbackReason: null,
      embeds,
      siteSlug,
      rowCount: embeds.length,
    };
  } catch (err) {
    return {
      embedDataSource: "error",
      fallbackReason: err instanceof Error ? err.message : String(err),
      embeds: [],
      siteSlug,
      rowCount: 0,
    };
  }
}
