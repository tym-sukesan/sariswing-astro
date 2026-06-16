/**
 * G-9b1 / G-9b2 — Strip Wix proprietary @font-face / webfont references from static export.
 * No external Google Fonts loading; system/generic fallbacks only.
 */

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "../..");
const require = createRequire(path.join(TOOL_ROOT, "package.json"));
const cheerio = require("cheerio");

/** Headings / brand (replaces Futura LT W01). */
export const GOSAKI_SAFE_DISPLAY_FONT_STACK =
  '"Avenir Next", "Helvetica Neue", Arial, sans-serif';

/** Body copy (replaces Avenir LT W01 Wix faces). */
export const GOSAKI_SAFE_BODY_FONT_STACK =
  '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif';

const WIX_PROPRIETARY_FONT_TOKEN =
  /(?:^|[\s,"'])(?:futura(?:\s+lt)?(?:\s+w\d+)?(?:\s+book)?|futura(?:-lt)?(?:-w\d+)?(?:-[a-z0-9_-]+)?|avenir(?:-lt)?(?:-w\d+)?(?:_[a-z0-9_-]+)?|helvetica-neue-w\d+|wix-madefor[a-z0-9_-]*|madefor-display[a-z0-9_-]*)/i;

const WIX_FONT_URL_RE =
  /url\(\s*['"]?https?:\/\/[^)'"]*(?:wixstatic|parastorage)[^)'"]*\.(?:woff2?|ttf|otf|eot)[^)'"]*['"]?\s*\)/gi;

const WIX_FONT_NAME_RE =
  /\b(?:futura(?:\s+lt(?:\s+w\d+)?(?:\s+book)?)?|futura-lt-w\d+-[a-z0-9-]+|avenir-lt-w\d+[_a-z0-9-]+|helvetica-neue-w\d+-[a-z0-9-]+|wix-madefor[a-z0-9-]+|madefor-display[a-z0-9-]*)\b/gi;

const WIX_FONT_NAME_TEST_RE = new RegExp(WIX_FONT_NAME_RE.source, "i");

/** Patterns that must be absent from generated public-dist (G-9b2). */
export const FONT_SAFETY_BLOCKED_OUTPUT_RE =
  /futura-lt-w01|avenir-lt-w01|@font-face|parastorage.*woff|wixstatic.*woff/gi;

/**
 * @param {string} text
 */
function needsWixFontRewrite(text) {
  const value = text ?? "";
  return (
    containsWixProprietaryFont(value) ||
    WIX_FONT_NAME_TEST_RE.test(value) ||
    /\bfutura\b/i.test(value)
  );
}

/**
 * Replace standalone Wix font face names (e.g. in --fnt shorthand or font:).
 * @param {string} css
 */
export function rewriteWixFontNameTokens(css) {
  const re = new RegExp(WIX_FONT_NAME_RE.source, "gi");
  return (css ?? "").replace(re, (token) => {
    if (/futura/i.test(token)) {
      return "Avenir Next, Helvetica Neue, Arial, sans-serif";
    }
    return "Helvetica Neue, Arial, sans-serif";
  });
}

/**
 * @param {string} familyList CSS font-family value (unquoted list segment)
 */
export function containsWixProprietaryFont(familyList) {
  return WIX_PROPRIETARY_FONT_TOKEN.test(familyList ?? "");
}

/**
 * @param {string} css
 */
export function stripFontFaceBlocks(css) {
  return (css ?? "").replace(
    /@font-face\s*\{[^}]*\}/gis,
    "/* wix proprietary font block removed (G-9b1) */",
  );
}

/**
 * @param {string} css
 */
export function stripWixFontUrls(css) {
  return (css ?? "").replace(WIX_FONT_URL_RE, "/* wix font url removed (G-9b1) */");
}

/**
 * @param {string} css
 * @param {{ displayStack?: string, bodyStack?: string }} [options]
 */
export function rewriteFontFamilyDeclarations(css, options = {}) {
  const displayStack = options.displayStack ?? GOSAKI_SAFE_DISPLAY_FONT_STACK;
  const bodyStack = options.bodyStack ?? GOSAKI_SAFE_BODY_FONT_STACK;

  return (css ?? "").replace(/font-family\s*:\s*((?:[^;"']|'[^']*')+)/gi, (match, families) => {
    if (!needsWixFontRewrite(families)) return match;
    const stack = /avenir/i.test(families) ? bodyStack : displayStack;
    const important = /\s*!important\s*$/i.test(families) ? " !important" : "";
    return `font-family: ${stack}${important}`;
  });
}

/**
 * Rewrite --fnt CSS variables and font: shorthand containing Wix face names.
 * @param {string} css
 * @param {{ displayStack?: string, bodyStack?: string }} [options]
 */
export function rewriteFntAndFontShorthand(css, options = {}) {
  const displayStack = options.displayStack ?? GOSAKI_SAFE_DISPLAY_FONT_STACK;
  const bodyStack = options.bodyStack ?? GOSAKI_SAFE_BODY_FONT_STACK;

  let out = css ?? "";

  out = out.replace(/(--fnt\s*:\s*)([^;}{]+)/gi, (match, prefix, value) => {
    if (!needsWixFontRewrite(value)) return match;
    let rewritten = rewriteWixFontNameTokens(value);
    if (needsWixFontRewrite(rewritten)) {
      const stack = /avenir/i.test(rewritten) ? bodyStack : displayStack;
      rewritten = rewritten.replace(
        /(?:'[^']*'|"[^"]*"|[\w-]+(?:\s+[\w-]+)*)(?:\s*,\s*(?:sans-serif|serif|monospace))?$/i,
        stack,
      );
    }
    return `${prefix}${rewritten}`;
  });

  out = out.replace(/\bfont\s*:\s*([^;}{]+)/gi, (match, value) => {
    if (!needsWixFontRewrite(value)) return match;
    let rewritten = rewriteWixFontNameTokens(value);
    if (needsWixFontRewrite(rewritten)) {
      const stack = /avenir/i.test(rewritten) ? bodyStack : displayStack;
      rewritten = rewritten.replace(
        /(?:'[^']*'|"[^"]*"|[\w-]+(?:\s+[\w-]+)*)(?:\s*,\s*(?:sans-serif|serif|monospace))?$/i,
        stack,
      );
    }
    return `font: ${rewritten}`;
  });

  return out;
}

/**
 * @param {string} css
 * @param {{ displayStack?: string, bodyStack?: string }} [options]
 */
export function sanitizeWixFontCss(css, options = {}) {
  if (!css?.trim()) return css ?? "";
  let out = stripFontFaceBlocks(css);
  out = stripWixFontUrls(out);
  out = rewriteFontFamilyDeclarations(out, options);
  out = rewriteFntAndFontShorthand(out, options);
  out = rewriteWixFontNameTokens(out);
  return out;
}

/**
 * Sanitize a single inline style attribute value.
 * @param {string} style
 */
export function sanitizeWixInlineStyleValue(style) {
  return sanitizeWixFontCss(style ?? "");
}

/**
 * Rewrite inline style attributes and embedded font tokens in HTML fragments.
 * @param {string} html
 */
export function sanitizeWixFontHtml(html) {
  if (!html?.trim()) return html ?? "";

  const wrapped = `<div id="__wix_font_sanitize">${html}</div>`;
  const $ = cheerio.load(wrapped, { decodeEntities: false });

  $("#__wix_font_sanitize")
    .find("[style]")
    .each((_, el) => {
      const style = $(el).attr("style");
      if (style) $(el).attr("style", sanitizeWixInlineStyleValue(style));
    });

  let out = $("#__wix_font_sanitize").html() ?? "";
  out = sanitizeWixFontCss(out);
  return out;
}

/**
 * @param {string} html
 * @deprecated Use sanitizeWixFontHtml — kept for existing imports.
 */
export function sanitizeWixInlineFontStyles(html) {
  return sanitizeWixFontHtml(html);
}

/**
 * Block third-party font CDN links in generated BaseLayout.
 * @param {string} href
 */
export function isBlockedExternalStylesheetHref(href) {
  if (!href) return false;
  const lower = href.toLowerCase();
  if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(lower)) return true;
  if (/static\.parastorage\.com/.test(lower) && /font|woff|typekit/.test(lower)) return true;
  if (/static\.wixstatic\.com/.test(lower) && /font|woff/.test(lower)) return true;
  return false;
}

/**
 * @param {string} css
 */
export function auditFontSafety(css) {
  const withoutComments = (css ?? "").replace(/\/\*[\s\S]*?\*\//g, "");
  return {
    fontFaceCount: (withoutComments.match(/@font-face/gi) ?? []).length,
    futuraCount: (withoutComments.match(/futura/gi) ?? []).length,
    futuraLtW01Count: (withoutComments.match(/futura-lt-w01/gi) ?? []).length,
    avenirWixCount: (withoutComments.match(/avenir-lt-w/gi) ?? []).length,
    wixFontUrlCount: (withoutComments.match(WIX_FONT_URL_RE) ?? []).length,
    googleFontsCount: (withoutComments.match(/fonts\.googleapis\.com|fonts\.gstatic\.com/gi) ?? []).length,
  };
}

/**
 * @param {string} css
 */
export function isFontSafeForStaticExport(css) {
  const a = auditFontSafety(css);
  return (
    a.fontFaceCount === 0 &&
    a.futuraCount === 0 &&
    a.avenirWixCount === 0 &&
    a.wixFontUrlCount === 0 &&
    a.googleFontsCount === 0
  );
}

/**
 * @param {string} text
 */
export function countFontSafetyBlockedPatterns(text) {
  const matches = (text ?? "").match(FONT_SAFETY_BLOCKED_OUTPUT_RE);
  return matches?.length ?? 0;
}

/**
 * @param {string} dir
 * @param {{ extensions?: string[] }} [options]
 * @returns {{ file: string, count: number }[]}
 */
export function scanDirectoryForFontSafetyViolations(dir, options = {}) {
  const extensions = options.extensions ?? [".html", ".css", ".astro", ".js"];
  /** @type {{ file: string, count: number }[]} */
  const violations = [];

  if (!fs.existsSync(dir)) return violations;

  /** @param {string} current */
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        walk(full);
        continue;
      }
      if (!extensions.some((ext) => entry.name.endsWith(ext))) continue;
      const text = fs.readFileSync(full, "utf8");
      const count = countFontSafetyBlockedPatterns(text);
      if (count > 0) violations.push({ file: full, count });
    }
  }

  walk(dir);
  return violations;
}
