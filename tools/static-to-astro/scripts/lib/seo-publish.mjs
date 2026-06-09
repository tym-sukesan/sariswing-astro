import { normalizeBaseUrl } from "./base-url.mjs";
import {
  buildDeployOrigin,
  isStagingSubdirBuild,
  shouldApplyStagingNoindex,
} from "./deploy-base.mjs";

/**
 * @param {string | null} baseUrl
 * @param {string | null | undefined} deployBase
 * @returns {string | null} robots.txt body, or null if baseUrl omitted
 */
export function generateRobotsTxt(baseUrl, deployBase = "/") {
  const origin = buildDeployOrigin(baseUrl, deployBase);
  if (!origin) return null;

  if (isStagingSubdirBuild(deployBase)) {
    return `User-agent: *
Disallow: /
`;
  }

  return `User-agent: *
Allow: /

Sitemap: ${origin}/sitemap-index.xml
`;
}

/**
 * @param {string | null} baseUrl
 * @param {string | null | undefined} deployBase
 */
export function sitemapIndexUrl(baseUrl, deployBase = "/") {
  const origin = buildDeployOrigin(baseUrl, deployBase);
  if (!origin) return null;
  return `${origin}/sitemap-index.xml`;
}

/**
 * @param {string | null} baseUrl
 */
export function buildSeoPublishReadiness(
  baseUrl,
  { trailingSlash, buildVerification = null, deployBase = "/" } = {},
) {
  const baseUrlApplied = Boolean(normalizeBaseUrl(baseUrl));
  const site = normalizeBaseUrl(baseUrl);
  const sitemapFiles = buildVerification?.sitemapFiles ?? [];
  const stagingBuild = shouldApplyStagingNoindex(deployBase);

  return {
    baseUrlApplied,
    baseUrl: site,
    astroSiteConfigured: baseUrlApplied,
    trailingSlash: trailingSlash ?? "always",
    robotsTxtGenerated: baseUrlApplied,
    robotsTxtPolicy: !baseUrlApplied
      ? "not generated (--base-url not specified)"
      : stagingBuild
        ? "staging — Disallow: / (no Sitemap line; all pages carry noindex meta)"
        : "production — Allow: / with Sitemap line",
    robotsTxtSitemapUrl: stagingBuild ? null : sitemapIndexUrl(baseUrl, deployBase),
    stagingNoindex: stagingBuild,
    robotsDisallowAll: stagingBuild,
    productionIndexable: baseUrlApplied && !stagingBuild,
    canonicalMode: stagingBuild ? "staging-url" : "production",
    sitemapStagingNote: stagingBuild
      ? "sitemap XML may still be built for QA URL checks; robots.txt blocks crawl and pages use noindex — do not submit to Search Console"
      : null,
    sitemapIntegrationEnabled: baseUrlApplied,
    sitemapRequirement:
      "Requires --base-url (sets astro.config site) and @astrojs/sitemap integration",
    sitemapBuilt: sitemapFiles.length > 0,
    sitemapBuildFiles: sitemapFiles,
    canonicalNormalization: baseUrlApplied
      ? stagingBuild
        ? "staging — canonical / og:url rewritten to staging deploy origin at render time"
        : "canonical / og:url / local og:image normalized via --base-url on convert"
      : "not applied — re-run convert with --base-url before production",
  };
}
