/**
 * URL normalization helpers for static-site crawler (G-7a).
 */

/** @returns {URL} */
export function parseUrlSafe(input, base) {
  try {
    return new URL(input, base);
  } catch {
    return null;
  }
}

/** Normalize crawl URL: strip hash, optional strip query. */
export function normalizeCrawlUrl(input, base, { stripQuery = true } = {}) {
  const url = parseUrlSafe(input, base);
  if (!url) return null;
  url.hash = "";
  if (stripQuery) url.search = "";
  return url.href;
}

export function getOrigin(urlString) {
  const url = parseUrlSafe(urlString);
  return url ? url.origin : null;
}

export function isSameOrigin(urlString, origin) {
  const url = parseUrlSafe(urlString);
  if (!url || !origin) return false;
  return url.origin === origin;
}

export function isHttpUrl(urlString) {
  const url = parseUrlSafe(urlString);
  if (!url) return false;
  return url.protocol === "http:" || url.protocol === "https:";
}

export function isSkippableHref(href) {
  if (!href || typeof href !== "string") return true;
  const trimmed = href.trim();
  if (!trimmed || trimmed === "#") return true;
  const lower = trimmed.toLowerCase();
  return (
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:") ||
    lower.startsWith("javascript:") ||
    lower.startsWith("data:")
  );
}

const HTML_LIKE =
  /\.(html?|php|asp|aspx|jsp)(?:[?#]|$)/i;

/** Heuristic: same-origin path may be an HTML page. */
export function looksLikeHtmlPage(urlString, origin) {
  if (!isHttpUrl(urlString) && !urlString.startsWith("/")) return false;
  const url = parseUrlSafe(urlString, origin);
  if (!url) return false;
  if (origin && url.origin !== origin) return false;
  const path = url.pathname;
  if (HTML_LIKE.test(path)) return true;
  if (path.endsWith("/") || path === "" || path === "/") return true;
  const last = path.split("/").filter(Boolean).pop() ?? "";
  return !last.includes(".") || last.endsWith("/");
}

const ASSET_EXT =
  /\.(css|js|mjs|cjs|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|eot|map)(?:[?#]|$)/i;

export function looksLikeAsset(urlString) {
  const url = parseUrlSafe(urlString);
  if (!url) return false;
  return ASSET_EXT.test(url.pathname);
}

export function matchPatterns(urlString, patterns) {
  if (!patterns?.length) return true;
  return patterns.some((pattern) => {
    try {
      return new RegExp(pattern).test(urlString);
    } catch {
      return urlString.includes(pattern);
    }
  });
}
