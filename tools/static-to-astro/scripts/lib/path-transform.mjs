import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { htmlFileToAstroRoute, resolveRef } from "./static-site-analyzer.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../../..");
const require = createRequire(path.join(REPO_ROOT, "package.json"));
const cheerio = require("cheerio");

/** Map internal HTML paths to Astro routes. */
export function htmlHrefToRoute(href, pageRelPath) {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("#") || /^(mailto:|tel:|javascript:|data:)/i.test(trimmed)) {
    return trimmed;
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const resolved = resolveRef(trimmed, pageRelPath);
  if (resolved.kind !== "internal") return trimmed;

  const withoutSlash = resolved.href.replace(/^\//, "");
  if (/\.html?$/i.test(withoutSlash)) {
    return htmlFileToAstroRoute(withoutSlash);
  }
  return resolved.href.endsWith("/") ? resolved.href : `${resolved.href}/`;
}

export function imageSrcToPublic(src, pageRelPath) {
  const trimmed = src.trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) return trimmed;

  const resolved = resolveRef(trimmed, pageRelPath);
  if (resolved.kind !== "internal") return trimmed;

  let p = resolved.href.replace(/^\//, "");
  if (p.startsWith("images/")) return `/${p}`;
  if (p.startsWith("assets/")) return `/${p}`;
  if (/\.(png|jpe?g|gif|svg|webp|avif|ico)$/i.test(p)) {
    return `/images/${path.posix.basename(p)}`;
  }
  return `/images/${p}`;
}

/**
 * Rewrite HTML fragment paths for Astro output.
 * @param {string} htmlFragment
 * @param {string} pageRelPath
 * @param {{ htmlFiles: string[] }} context
 */
export function transformHtmlFragment(htmlFragment, pageRelPath, context = {}) {
  if (!htmlFragment?.trim()) return "";

  const $ = cheerio.load(`<div id="__wrap">${htmlFragment}</div>`, { decodeEntities: false });
  const root = $("#__wrap");

  root.find("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    $(el).attr("href", htmlHrefToRoute(href, pageRelPath));
  });

  root.find("img[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (!src) return;
    $(el).attr("src", imageSrcToPublic(src, pageRelPath));
  });

  root.find('link[rel*="stylesheet"]').remove();
  root.find("script").remove();

  return root.html() ?? "";
}

export function escapeAstroPropString(value) {
  if (value == null) return "";
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
