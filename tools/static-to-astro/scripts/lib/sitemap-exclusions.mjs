/**
 * CMS Kit sitemap exclusion rules for @astrojs/sitemap filter.
 * Shared by astro-generator, verifiers, and generated-site policy docs.
 */

import { isLegacyWixScheduleMonthPath } from "./schedule-pages.mjs";

/**
 * Path segments excluded from public sitemaps (CMS admin, staging shell, APIs).
 * Matched against full URL pathname (may include deploy base prefix).
 */
export const CMS_KIT_SITEMAP_EXCLUDED_SEGMENT_PATTERNS = [
  /\/admin(\/|$)/,
  /\/__admin-staging-shell(\/|$)/,
  /\/api(\/|$)/,
];

/** Optional preview-only routes */
export const CMS_KIT_SITEMAP_EXCLUDED_PREVIEW_PATTERNS = [/\/preview(\/|$)/, /\/draft(\/|$)/];

/**
 * @param {string} pathname URL pathname (may include deploy base)
 */
export function normalizeSitemapPathname(pathname) {
  if (!pathname) return "/";
  let p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (!p.endsWith("/")) p = `${p}/`;
  return p;
}

/**
 * @param {string} pathname
 */
export function isCmsKitSitemapExcludedPath(pathname) {
  const p = normalizeSitemapPathname(pathname);
  for (const re of CMS_KIT_SITEMAP_EXCLUDED_SEGMENT_PATTERNS) {
    if (re.test(p)) return true;
  }
  for (const re of CMS_KIT_SITEMAP_EXCLUDED_PREVIEW_PATTERNS) {
    if (re.test(p)) return true;
  }
  return false;
}

/**
 * @param {string} pageUrl absolute page URL passed to @astrojs/sitemap filter
 */
export function shouldIncludePageInSitemap(pageUrl) {
  try {
    const pathname = new URL(pageUrl).pathname;
    if (isLegacyWixScheduleMonthPath(pathname)) return false;
    if (isCmsKitSitemapExcludedPath(pathname)) return false;
    return true;
  } catch {
    return true;
  }
}

/**
 * Inline @astrojs/sitemap integration block for generated astro.config.mjs.
 * Logic must stay aligned with shouldIncludePageInSitemap().
 */
export function buildSitemapIntegrationBlock() {
  return `  integrations: [sitemap({
    filter: (page) => {
      try {
        const pathname = new URL(page).pathname;
        const p = pathname.endsWith("/") ? pathname : \`\${pathname}/\`;
        if (/^\\/\\d{4}-\\d{2}\\/$/.test(p)) return false;
        if (/\\/\\d{4}-\\d{2}\\/$/.test(p) && !/\\/schedule\\/\\d{4}-\\d{2}\\/$/.test(p)) return false;
        if (/\\/admin(\\/|$)/.test(p)) return false;
        if (/\\/__admin-staging-shell(\\/|$)/.test(p)) return false;
        if (/\\/api(\\/|$)/.test(p)) return false;
        if (/\\/preview(\\/|$)/.test(p) || /\\/draft(\\/|$)/.test(p)) return false;
        return true;
      } catch {
        return true;
      }
    },
  })],`;
}
