import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  cmsKitScheduleMonthRoute,
  parseScheduleMonthSourcePath,
  isScheduleMonthSourcePath,
} from "./schedule-pages.mjs";
import { sanitizeWixFontHtml } from "./wix-font-safety.mjs";
import { htmlFileToAstroRoute, resolveRef } from "./static-site-analyzer.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "../..");
const require = createRequire(path.join(TOOL_ROOT, "package.json"));
const cheerio = require("cheerio");

/**
 * Map same-origin production absolute URL to Astro route (Wix nav links).
 * @param {string} href
 * @param {string | null | undefined} productionOrigin
 * @returns {string | null}
 */
export function productionAbsoluteUrlToRoute(href, productionOrigin) {
  if (!productionOrigin?.trim()) return null;
  const trimmed = href.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  const origin = productionOrigin.trim().replace(/\/+$/, "");
  const withoutQuery = trimmed.split("?")[0].split("#")[0].replace(/\/+$/, "") || origin;
  if (!withoutQuery.toLowerCase().startsWith(origin.toLowerCase())) return null;
  let suffix = withoutQuery.slice(origin.length);
  if (!suffix || suffix === "") return "/";
  if (!suffix.startsWith("/")) suffix = `/${suffix}`;
  const monthMatch = suffix.match(/^\/(\d{4})-(\d{2})\/?$/);
  if (monthMatch) {
    return cmsKitScheduleMonthRoute(monthMatch[1], monthMatch[2]);
  }
  if (/\.html?$/i.test(suffix)) {
    const file = suffix.replace(/^\//, "");
    const parsed = parseScheduleMonthSourcePath(file);
    if (parsed) {
      return cmsKitScheduleMonthRoute(parsed.year, parsed.month);
    }
    return htmlFileToAstroRoute(file);
  }
  return suffix.endsWith("/") ? suffix : `${suffix}/`;
}

/** Map internal HTML paths to Astro routes. */
export function htmlHrefToRoute(href, pageRelPath, options = {}) {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("#") || /^(mailto:|tel:|javascript:|data:)/i.test(trimmed)) {
    return trimmed;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    const internal = productionAbsoluteUrlToRoute(trimmed, options.productionOrigin);
    return internal ?? trimmed;
  }

  const resolved = resolveRef(trimmed, pageRelPath);
  if (resolved.kind !== "internal") return trimmed;
  const monthMatch = resolved.href.match(/^\/(\d{4})-(\d{2})\/?$/);
  if (monthMatch) {
    return cmsKitScheduleMonthRoute(monthMatch[1], monthMatch[2]);
  }

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
 * Expose Wix schedule repeater SSR markup and add gosaki month-page hooks (G-8g4).
 * @param {import("cheerio").CheerioAPI} $
 * @param {import("cheerio").Cheerio<import("domhandler").Element>} root
 */
function transformScheduleMonthFragment($, root) {
  root.find("fluid-columns-repeater").each((_, el) => {
    const $el = $(el);
    const style = $el.attr("style") || "";
    const cleaned = style.replace(/visibility\s*:\s*hidden\s*;?/gi, "").trim();
    if (cleaned) $el.attr("style", cleaned);
    else $el.removeAttr("style");
    $el.addClass("gosaki-schedule-month-repeater");
  });

  root.find(".wixui-repeater__item").each((_, el) => {
    const $item = $(el);
    $item.addClass("gosaki-schedule-event-card");
    $item.find("h1").first().addClass("gosaki-schedule-event-date");
    $item.find(".wixui-rich-text").not(".gosaki-schedule-event-date").addClass("gosaki-schedule-event-body");
  });
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
    $(el).attr("href", htmlHrefToRoute(href, pageRelPath, context));
  });

  root.find("img[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (!src) return;
    $(el).attr("src", imageSrcToPublic(src, pageRelPath));
  });

  root.find('link[rel*="stylesheet"]').remove();
  root.find("script").remove();

  if (isScheduleMonthSourcePath(pageRelPath)) {
    transformScheduleMonthFragment($, root);
    return sanitizeWixFontHtml(
      `<div class="gosaki-schedule-month">${root.html() ?? ""}</div>`,
    );
  }

  return sanitizeWixFontHtml(root.html() ?? "");
}

export function escapeAstroPropString(value) {
  if (value == null) return "";
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
