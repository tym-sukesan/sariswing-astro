/**
 * Extract links and assets from HTML for static-site crawler (G-7a).
 */

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isSkippableHref,
  looksLikeAsset,
  looksLikeHtmlPage,
  normalizeCrawlUrl,
} from "./static-site-crawler-url.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "../..");
const require = createRequire(path.join(TOOL_ROOT, "package.json"));
const cheerio = require("cheerio");

/**
 * @param {string} html
 * @param {string} pageUrl
 * @param {string} origin
 * @param {{ sameOriginOnly: boolean }} options
 */
export function extractFromHtml(html, pageUrl, origin, options) {
  const $ = cheerio.load(html);
  const pageLinks = new Set();
  const assetLinks = new Set();

  const addLink = (href) => {
    if (isSkippableHref(href)) return;
    const normalized = normalizeCrawlUrl(href, pageUrl);
    if (!normalized) return;
    if (options.sameOriginOnly && !normalized.startsWith(origin)) return;
    if (looksLikeAsset(normalized) || /\.(css|js|mjs|cjs)$/i.test(normalized)) {
      if (normalized.startsWith(origin)) assetLinks.add(normalized);
      return;
    }
    if (looksLikeHtmlPage(normalized, origin)) {
      pageLinks.add(normalized);
    }
  };

  $("a[href]").each((_, el) => addLink($(el).attr("href")));
  $("link[href]").each((_, el) => {
    const rel = ($(el).attr("rel") ?? "").toLowerCase();
    if (rel.includes("stylesheet") || rel.includes("icon") || rel.includes("preload")) {
      addLink($(el).attr("href"));
    }
  });
  $("script[src]").each((_, el) => addLink($(el).attr("src")));
  $("img[src]").each((_, el) => addLink($(el).attr("src")));
  $("source[src]").each((_, el) => addLink($(el).attr("src")));
  $("video[src], audio[src]").each((_, el) => addLink($(el).attr("src")));

  const canonical =
    $('link[rel="canonical"]').attr("href")?.trim() ||
    $('meta[property="og:url"]').attr("content")?.trim() ||
    null;
  const title = $("title").first().text().trim() || null;
  const description =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    null;

  return {
    pageLinks: [...pageLinks],
    assetLinks: [...assetLinks],
    meta: {
      title,
      description,
      canonical: canonical ? normalizeCrawlUrl(canonical, pageUrl, { stripQuery: false }) : null,
    },
  };
}

/**
 * Rewrite same-origin absolute URLs in HTML to relative paths (best-effort).
 * @param {string} html
 * @param {string} pageUrl
 * @param {string} origin
 * @param {(url: string) => string} toRelativePath
 */
export function rewriteSameOriginUrls(html, pageUrl, origin, toRelativePath) {
  const originEsc = origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${originEsc}(/[^"'\\s>]*)`, "g");
  return html.replace(re, (_, pathname) => {
    try {
      const abs = `${origin}${pathname}`;
      return toRelativePath(abs);
    } catch {
      return `${origin}${pathname}`;
    }
  });
}
