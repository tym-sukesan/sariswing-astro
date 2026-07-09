import path from "node:path";
import { htmlFileToAstroRoute } from "./static-site-analyzer.mjs";

/** Matches `schedule-2026-03.html` (basename only). */
export const SCHEDULE_MONTH_FILENAME = /^schedule-(\d{4})-(\d{2})\.html$/i;

/** Matches live-crawl month pages like `2026-03.html` (basename only). */
export const LIVE_CRAWL_MONTH_FILENAME = /^(\d{4})-(\d{2})\.html$/i;

export const SCHEDULE_INDEX_ROUTE = "/schedule/";

/** Legacy Wix live-crawl month route at site root (compatibility only). */
export const LEGACY_WIX_MONTH_PATH_RE = /^\/(\d{4}-\d{2})\/?$/i;

/**
 * Canonical CMS Kit month route.
 * @param {string} year
 * @param {string} month two-digit
 */
export function cmsKitScheduleMonthRoute(year, month) {
  return `${SCHEDULE_INDEX_ROUTE}${year}-${month}/`;
}

/**
 * Legacy Wix month route at site root (G-9c0b compatibility stub target).
 * @param {string} year
 * @param {string} month two-digit
 */
export function legacyWixScheduleMonthRoute(year, month) {
  return `/${year}-${month}/`;
}

/**
 * @param {string} pathname site pathname (may include deploy base)
 */
export function isLegacyWixScheduleMonthPath(pathname) {
  const path = (pathname.endsWith("/") ? pathname : `${pathname}/`).replace(/\/+$/, "/");
  if (LEGACY_WIX_MONTH_PATH_RE.test(path)) return true;
  return /\/\d{4}-\d{2}\/$/.test(path) && !/\/schedule\/\d{4}-\d{2}\/$/.test(path);
}

/**
 * True when URL is a legacy Wix month route (not canonical /schedule/YYYY-MM/).
 * @param {string} pageUrl absolute page URL
 */
export function isLegacyWixScheduleMonthUrl(pageUrl) {
  try {
    const pathname = new URL(pageUrl).pathname;
    return isLegacyWixScheduleMonthPath(pathname);
  } catch {
    return false;
  }
}

export { shouldIncludePageInSitemap } from "./sitemap-exclusions.mjs";

/**
 * @param {string} relPath e.g. `schedule-2026-07.html` or `2026-07.html`
 */
export function parseScheduleMonthSourcePath(relPath) {
  const base = path.posix.basename(relPath.replace(/\\/g, "/"));
  let match = base.match(SCHEDULE_MONTH_FILENAME);
  if (!match) match = base.match(LIVE_CRAWL_MONTH_FILENAME);
  if (!match) return null;
  return { year: match[1], month: match[2], basename: base };
}

/**
 * @param {string} relPath
 */
export function isScheduleMonthSourcePath(relPath) {
  return Boolean(parseScheduleMonthSourcePath(relPath));
}

/**
 * @param {string} href raw href from HTML
 * @param {string} [route] Astro route after transform
 */
export function isScheduleMonthNavTarget(href, route = "") {
  const hrefBase = path.posix.basename((href ?? "").split("?")[0].split("#")[0]);
  if (SCHEDULE_MONTH_FILENAME.test(hrefBase)) return true;
  if (LIVE_CRAWL_MONTH_FILENAME.test(hrefBase)) return true;
  if (/^\d{4}-\d{2}$/i.test(hrefBase)) return true;
  const routeMatch = (route || "").match(/^\/schedule-(\d{4})-(\d{2})\/?$/i);
  if (routeMatch) return true;
  if (/^\/schedule\/(\d{4})-(\d{2})\/?$/i.test(route || "")) return true;
  return Boolean((route || "").match(/^\/(\d{4})-(\d{2})\/?$/i));
}

/**
 * @param {string} year
 * @param {string} month two-digit
 */
export function scheduleMonthDisplayLabel(year, month) {
  return `${year}.${month}`;
}

/**
 * @param {{ sourcePath: string, route?: string, astroRoute?: string, title?: string }} page
 */
export function scheduleMonthFromPage(page) {
  const parsed = parseScheduleMonthSourcePath(page.sourcePath);
  if (!parsed) return null;
  const route =
    page.route ??
    page.astroRoute ??
    (LIVE_CRAWL_MONTH_FILENAME.test(parsed.basename)
      ? cmsKitScheduleMonthRoute(parsed.year, parsed.month)
      : htmlFileToAstroRoute(page.sourcePath));
  return {
    sourcePath: page.sourcePath,
    route,
    year: parsed.year,
    month: parsed.month,
    label: scheduleMonthDisplayLabel(parsed.year, parsed.month),
    sortKey: Number(parsed.year) * 100 + Number(parsed.month),
  };
}

/**
 * Newest month first (matches typical source nav order).
 * @param {Array<{ sourcePath: string, route?: string, astroRoute?: string }>} pages
 */
export function detectScheduleMonthPages(pages) {
  const months = [];
  for (const page of pages) {
    const entry = scheduleMonthFromPage(page);
    if (entry) months.push(entry);
  }
  return months.sort((a, b) => b.sortKey - a.sortKey);
}

/**
 * @param {string} pathname
 */
export function isScheduleSectionPath(pathname) {
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`;
  if (path === SCHEDULE_INDEX_ROUTE) return true;
  if (/^\/schedule\/\d{4}-\d{2}\//i.test(path)) return true;
  if (/^\/schedule-\d{4}-\d{2}\//i.test(path)) return true;
  return /^\/\d{4}-\d{2}\//i.test(path);
}
