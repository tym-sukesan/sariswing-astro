/**
 * G-20u14 — Resolve URL-to-staging pipeline config from site registry.
 * Maps siteKey → staging profile paths + convert metadata. No secrets · no FTP.
 */

import fs from "node:fs";
import path from "node:path";
import {
  TOOL_ROOT,
  getSiteRegistryEntry,
  resolveSitePackageBuildProfile,
} from "./site-registry.mjs";
import {
  loadUrlToStagingConfig,
  mergeConfigWithCli,
  normalizeUrlToStagingConfig,
  validateUrlToStagingConfig,
} from "./url-to-staging-config-loader.mjs";

/**
 * @param {string} siteKey
 * @param {string} [toolRoot]
 */
export function resolveUrlToStagingConfigPath(siteKey, toolRoot = TOOL_ROOT) {
  return path.join(toolRoot, "config/sites", `${siteKey}.url-to-staging.json`);
}

/**
 * @param {string} siteKey
 * @param {string} [toolRoot]
 */
export function siteHasUrlToStagingConfig(siteKey, toolRoot = TOOL_ROOT) {
  return fs.existsSync(resolveUrlToStagingConfigPath(siteKey, toolRoot));
}

/**
 * Build normalized URL-to-staging config from registry staging profile.
 *
 * @param {string} siteKey
 * @param {string} [toolRoot]
 * @param {Record<string, unknown>} [cliOverrides]
 */
export function buildUrlToStagingConfigFromSite(siteKey, toolRoot = TOOL_ROOT, cliOverrides = {}) {
  getSiteRegistryEntry(siteKey, toolRoot);

  const dedicatedConfigPath = resolveUrlToStagingConfigPath(siteKey, toolRoot);
  if (fs.existsSync(dedicatedConfigPath)) {
    let config = loadUrlToStagingConfig(dedicatedConfigPath, toolRoot);
    config = mergeConfigWithCli(config, cliOverrides);
    config.siteKey = siteKey;
    return config;
  }

  const entry = getSiteRegistryEntry(siteKey, toolRoot);
  const profile = resolveSitePackageBuildProfile(siteKey, "staging", { toolRoot });
  const urlToStaging = entry.urlToStaging ?? {};

  const raw = {
    siteKey,
    siteSlug: profile.supabaseSiteSlug ?? siteKey,
    startUrl:
      cliOverrides.url ??
      urlToStaging.startUrl ??
      profile.stagingBaseUrl ??
      profile.baseUrl ??
      profile.publicBaseUrl.replace(/\/$/, ""),
    fixtureOut: profile.fixtureDir,
    projectOut: profile.astroOut,
    staticPublicOut: profile.staticPublicOut,
    deployBase: profile.deployBase,
    stagingBaseUrl: profile.stagingBaseUrl ?? profile.baseUrl,
    productionBaseUrl: urlToStaging.productionBaseUrl ?? null,
    siteProfile: entry.convertSiteProfile ?? "musician",
    maxPages: urlToStaging.maxPages ?? 20,
    sameOriginOnly: urlToStaging.sameOriginOnly !== false,
    respectRobots: urlToStaging.respectRobots !== false,
    seo: urlToStaging.seo ?? {
      stagingNoindex: profile.seo?.stagingNoindex !== false,
      robotsDisallowAll: profile.seo?.robotsDisallowAll !== false,
      canonicalMode: "staging-url",
    },
  };

  const validation = validateUrlToStagingConfig(raw);
  if (!validation.ok) {
    throw new Error(
      `URL-to-staging config from registry invalid for site "${siteKey}": ${validation.errors.join("; ")}`,
    );
  }

  let config = normalizeUrlToStagingConfig(raw, toolRoot);
  config = mergeConfigWithCli(config, cliOverrides);
  config.siteKey = siteKey;
  return config;
}

/**
 * @param {ReturnType<typeof normalizeUrlToStagingConfig>} config
 */
export function resolveEffectiveUrlToStagingSiteKey(config) {
  return config.siteKey ?? config.siteSlug ?? null;
}

/**
 * Default gosaki-piano config path for backward-compatible docs/examples.
 */
export const GOSAKI_URL_TO_STAGING_CONFIG_REL = "config/sites/gosaki-piano.url-to-staging.json";

/**
 * @param {string} siteKey
 * @param {string} [toolRoot]
 */
export function isKnownUrlToStagingSiteKey(siteKey, toolRoot = TOOL_ROOT) {
  try {
    getSiteRegistryEntry(siteKey, toolRoot);
    return true;
  } catch {
    return false;
  }
}
