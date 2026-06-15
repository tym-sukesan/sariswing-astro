/**
 * Map URLs to fixture-relative paths (compatible with analyze-static-site / convert).
 */

import path from "node:path";
import { parseUrlSafe } from "./static-site-crawler-url.mjs";

/**
 * Map page URL to fixture-relative HTML path.
 * Single-segment paths → `{name}.html` (gosaki-style flat files).
 * Multi-segment → `{a}/{b}/index.html`.
 */
export function urlToPageRelativePath(urlString) {
  const url = parseUrlSafe(urlString);
  if (!url) throw new Error(`Invalid URL: ${urlString}`);

  let pathname = url.pathname;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  if (pathname === "" || pathname === "/") {
    return "index.html";
  }

  const withoutLeading = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  if (/\.html?$/i.test(withoutLeading)) {
    return withoutLeading;
  }

  const segments = withoutLeading.split("/").filter(Boolean);
  if (segments.length === 1) {
    return `${segments[0]}.html`;
  }
  return path.posix.join(...segments, "index.html");
}

/** Map same-origin asset URL to fixture-relative path (preserve path under site root). */
export function urlToAssetRelativePath(urlString, origin) {
  const url = parseUrlSafe(urlString, origin);
  if (!url) throw new Error(`Invalid asset URL: ${urlString}`);
  if (url.origin !== origin) {
    throw new Error(`Cross-origin asset not supported: ${urlString}`);
  }

  let pathname = url.pathname;
  if (pathname.startsWith("/")) pathname = pathname.slice(1);
  if (!pathname) throw new Error(`Empty asset path: ${urlString}`);
  return pathname.split("/").join("/");
}

/** Compute relative href from one fixture file to another URL on same origin. */
export function relativeLink(fromRelativePath, targetUrl, origin) {
  const targetPath = urlToPageRelativePath(targetUrl);
  const fromDir = path.posix.dirname(fromRelativePath);
  const rel = path.posix.relative(fromDir === "." ? "" : fromDir, targetPath);
  return rel.startsWith(".") ? rel : `./${rel}`;
}
