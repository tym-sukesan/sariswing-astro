/**
 * G-9b1 — Strip Wix proprietary @font-face / webfont references from static export.
 * No external Google Fonts loading; system/generic fallbacks only.
 */

/** Headings / brand (replaces Futura LT W01). */
export const GOSAKI_SAFE_DISPLAY_FONT_STACK =
  '"Avenir Next", "Helvetica Neue", Arial, sans-serif';

/** Body copy (replaces Avenir LT W01 Wix faces). */
export const GOSAKI_SAFE_BODY_FONT_STACK =
  '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif';

const WIX_PROPRIETARY_FONT_TOKEN =
  /(?:^|[\s,"'])(?:futura(?:-lt)?(?:-w\d+)?(?:-[a-z0-9_-]+)?|avenir(?:-lt)?(?:-w\d+)?(?:_[a-z0-9_-]+)?|helvetica-neue-w\d+|wix-madefor[a-z0-9_-]*|madefor-display[a-z0-9_-]*)/i;

const WIX_FONT_URL_RE =
  /url\(\s*['"]?https?:\/\/[^)'"]*(?:wixstatic|parastorage)[^)'"]*\.(?:woff2?|ttf|otf|eot)[^)'"]*['"]?\s*\)/gi;

const WIX_FONT_NAME_RE =
  /\b(?:futura-lt-w\d+-[a-z0-9-]+|avenir-lt-w\d+[_a-z0-9-]+|helvetica-neue-w\d+-[a-z0-9-]+|wix-madefor[a-z0-9-]+|madefor-display[a-z0-9-]*)\b/gi;

/**
 * Replace standalone Wix font face names (e.g. in --fnt shorthand or font:).
 * @param {string} css
 */
export function rewriteWixFontNameTokens(css) {
  return (css ?? "").replace(WIX_FONT_NAME_RE, (token) => {
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

  return (css ?? "").replace(/font-family\s*:\s*([^;}{]+)/gi, (match, families) => {
    if (!containsWixProprietaryFont(families)) return match;
    const stack = /avenir/i.test(families) ? bodyStack : displayStack;
    const important = /\s*!important\s*$/i.test(families) ? " !important" : "";
    return `font-family: ${stack}${important}`;
  });
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
  out = rewriteWixFontNameTokens(out);
  return out;
}

/**
 * Rewrite inline style="font-family:…" attributes in HTML fragments.
 * @param {string} html
 */
export function sanitizeWixInlineFontStyles(html) {
  if (!html) return html;
  let out = html.replace(/font-family\s*:\s*([^;"']+)/gi, (match, families) => {
    if (!containsWixProprietaryFont(families)) return match;
    const stack = /avenir/i.test(families)
      ? GOSAKI_SAFE_BODY_FONT_STACK
      : GOSAKI_SAFE_DISPLAY_FONT_STACK;
    return `font-family: ${stack}`;
  });
  out = rewriteWixFontNameTokens(out);
  return out;
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
