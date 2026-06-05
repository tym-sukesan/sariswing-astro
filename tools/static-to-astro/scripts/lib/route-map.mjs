import fs from "node:fs";
import path from "node:path";
import { htmlFileToAstroRoute } from "./static-site-analyzer.mjs";
import { SCHEDULE_INDEX_ROUTE } from "./schedule-pages.mjs";

/**
 * Astro-style route → screenshot filename slug.
 * @param {string} route e.g. `/about/`
 */
export function routeToSlug(route) {
  const normalized = route.endsWith("/") ? route : `${route}/`;
  if (normalized === "/") return "index";
  return normalized.slice(1, -1).replace(/\//g, "-");
}

/**
 * @param {string} routesArg comma-separated routes
 * @returns {string[]}
 */
export function parseRoutesArg(routesArg) {
  if (!routesArg?.trim()) return [];
  return routesArg
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => (r.endsWith("/") ? r : `${r}/`));
}

/**
 * Default routes for gosaki-style sites.
 */
export function defaultGosakiRoutes() {
  return [
    "/",
    "/about/",
    "/contact/",
    "/discography/",
    "/link/",
    SCHEDULE_INDEX_ROUTE,
    "/schedule-2026-07/",
    "/schedule-2026-06/",
    "/schedule-2026-05/",
  ];
}

/**
 * Routes discoverable from flat static HTML (no generated schedule index).
 * @param {string} sourceDir
 * @returns {string[]}
 */
export function discoverRoutesFromSourceDir(sourceDir) {
  const routes = [];
  for (const file of fs.readdirSync(sourceDir)) {
    if (!/\.html?$/i.test(file)) continue;
    routes.push(htmlFileToAstroRoute(file));
  }
  return routes.sort((a, b) => a.localeCompare(b));
}

/**
 * Resolve route list: explicit --routes, or discover + merge schedule index for astro-only compare.
 * @param {string} sourceDir
 * @param {string[]} explicitRoutes
 */
export function resolveCompareRoutes(sourceDir, explicitRoutes = []) {
  if (explicitRoutes.length) {
    return explicitRoutes.map((r) => (r.endsWith("/") ? r : `${r}/`));
  }
  const discovered = discoverRoutesFromSourceDir(sourceDir);
  if (!discovered.includes(SCHEDULE_INDEX_ROUTE)) {
    discovered.push(SCHEDULE_INDEX_ROUTE);
  }
  return discovered.sort((a, b) => a.localeCompare(b));
}

/**
 * Map route to source flat HTML filename (gosaki-style root HTML files).
 * @param {string} route
 * @returns {string | null}
 */
export function routeToSourceHtmlFile(route) {
  const normalized = route.endsWith("/") ? route : `${route}/`;
  if (normalized === "/") return "index.html";
  if (normalized === SCHEDULE_INDEX_ROUTE) return null;
  const base = normalized.slice(1, -1);
  return `${base}.html`;
}

/**
 * Map route to Astro dist path segment.
 * @param {string} route
 */
export function routeToDistPath(route) {
  const normalized = route.endsWith("/") ? route : `${route}/`;
  if (normalized === "/") return "index.html";
  const base = normalized.slice(1, -1);
  return path.posix.join(base, "index.html");
}
