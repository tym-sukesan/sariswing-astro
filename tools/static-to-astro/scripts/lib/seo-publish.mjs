import { normalizeBaseUrl } from "./base-url.mjs";

/**
 * @param {string | null} baseUrl
 * @returns {string | null} robots.txt body, or null if baseUrl omitted
 */
export function generateRobotsTxt(baseUrl) {
  const site = normalizeBaseUrl(baseUrl);
  if (!site) return null;

  return `User-agent: *
Allow: /

Sitemap: ${site}/sitemap-index.xml
`;
}

/**
 * @param {string | null} baseUrl
 */
export function sitemapIndexUrl(baseUrl) {
  const site = normalizeBaseUrl(baseUrl);
  if (!site) return null;
  return `${site}/sitemap-index.xml`;
}

/**
 * @param {string | null} baseUrl
 */
export function buildSeoPublishReadiness(baseUrl, { trailingSlash, buildVerification = null } = {}) {
  const baseUrlApplied = Boolean(normalizeBaseUrl(baseUrl));
  const site = normalizeBaseUrl(baseUrl);
  const sitemapFiles = buildVerification?.sitemapFiles ?? [];

  return {
    baseUrlApplied,
    baseUrl: site,
    astroSiteConfigured: baseUrlApplied,
    trailingSlash: trailingSlash ?? "always",
    robotsTxtGenerated: baseUrlApplied,
    robotsTxtPolicy: baseUrlApplied
      ? "generated at public/robots.txt with Sitemap line"
      : "not generated (--base-url not specified)",
    robotsTxtSitemapUrl: sitemapIndexUrl(baseUrl),
    sitemapIntegrationEnabled: baseUrlApplied,
    sitemapRequirement:
      "Requires --base-url (sets astro.config site) and @astrojs/sitemap integration",
    sitemapBuilt: sitemapFiles.length > 0,
    sitemapBuildFiles: sitemapFiles,
    canonicalNormalization: baseUrlApplied
      ? "canonical / og:url / local og:image normalized via --base-url on convert"
      : "not applied — re-run convert with --base-url before production",
  };
}
