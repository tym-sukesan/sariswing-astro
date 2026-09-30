/**
 * Deterministic Wix crawl HTML sanitizer for the tracked Gosaki CI snapshot.
 * Same rules as the gosaki-ci-fixture-sanitization-proof:
 * strip scripts / preload / Sentry+pixel iframes / noscript; keep head styles and DOM.
 */

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TOOL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(TOOL_ROOT, "package.json"));
const cheerio = require("cheerio");

/**
 * @param {string} html
 * @returns {string}
 */
export function sanitizeGosakiWixCrawlHtml(html) {
  const $ = cheerio.load(html, { decodeEntities: false });
  $("script").remove();
  $(
    'link[rel="preload"], link[rel="modulepreload"], link[rel="prefetch"], link[rel="dns-prefetch"], link[rel="preconnect"]',
  ).remove();
  $('iframe[src*="sentry"], iframe[src*="facebook.com/tr"]').remove();
  $("noscript").remove();
  return $.html({ decodeEntities: false });
}
