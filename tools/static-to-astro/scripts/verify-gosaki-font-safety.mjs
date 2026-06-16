#!/usr/bin/env node
/**
 * G-9b1 / G-9b2 — Verify Wix font safety sanitizer (no network, no DB).
 * Run: node scripts/verify-gosaki-font-safety.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateHeaderAstro } from "./lib/header-transform.mjs";
import { buildGosakiPianoSiteOverridesCss } from "./lib/site-specific-overrides/gosaki-piano-overrides.mjs";
import { buildWixStagingVisualOverridesCss } from "./lib/wix-staging-visual-overrides.mjs";
import {
  auditFontSafety,
  countFontSafetyBlockedPatterns,
  GOSAKI_SAFE_BODY_FONT_STACK,
  GOSAKI_SAFE_DISPLAY_FONT_STACK,
  isBlockedExternalStylesheetHref,
  isFontSafeForStaticExport,
  sanitizeWixFontCss,
  sanitizeWixFontHtml,
  sanitizeWixInlineStyleValue,
  scanDirectoryForFontSafetyViolations,
  containsWixProprietaryFont,
} from "./lib/wix-font-safety.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const FIXTURE_INDEX = path.join(TOOL_ROOT, "fixtures/gosaki-piano/index.html");
const GENERATED_ASTRO = path.join(TOOL_ROOT, "output/gosaki-piano-astro");
const PUBLIC_DIST = path.join(TOOL_ROOT, "output/manual-upload/gosaki-piano/public-dist");
const STATIC_PUBLIC_DIST = path.join(TOOL_ROOT, "output/static-public/gosaki-piano/public-dist");

let passed = 0;
let failed = 0;

function assert(name, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}`);
  }
}

function assertEqualish(name, actual, expected) {
  assert(name, actual === expected);
  if (actual !== expected) {
    console.error(`  expected: ${expected}`);
    console.error(`  actual:   ${actual}`);
  }
}

const SAMPLE_FONT_FACE = `
@font-face {
  font-family: 'futura-lt-w01-book';
  src: url('https://static.parastorage.com/services/santa-resources/dist/viewer/futura-lt-w01-book.woff2') format('woff2');
}
.nav { font-family: futura-lt-w01-book, sans-serif; }
.body { font-family: avenir-lt-w01_35-light1475496, sans-serif; }
`;

const sanitized = sanitizeWixFontCss(SAMPLE_FONT_FACE);
assert("stripFontFaceBlocks removes @font-face", auditFontSafety(sanitized).fontFaceCount === 0);
assert("sanitize removes futura token", !/futura-lt-w01-book/i.test(sanitized));
assert("sanitize removes avenir-lt-w token", !/avenir-lt-w01/i.test(sanitized));
assert("sanitize uses display stack for futura", sanitized.includes(GOSAKI_SAFE_DISPLAY_FONT_STACK));
assert("sanitize uses body stack for avenir", sanitized.includes(GOSAKI_SAFE_BODY_FONT_STACK));
assert("isFontSafeForStaticExport on sanitized sample", isFontSafeForStaticExport(sanitized));

assert("containsWixProprietaryFont detects futura", containsWixProprietaryFont("futura-lt-w01-book, sans-serif"));
assert(
  "containsWixProprietaryFont detects avenir",
  containsWixProprietaryFont("avenir-lt-w01_35-light1475496, sans-serif"),
);
assert(
  "containsWixProprietaryFont ignores system stack",
  !containsWixProprietaryFont('"Helvetica Neue", Arial, sans-serif'),
);

const inlineNoSpace = sanitizeWixFontHtml(
  '<span style="font-family:futura-lt-w01-book,sans-serif">Title</span>',
);
assert("inline sanitizer rewrites futura (no spaces)", !/futura/i.test(inlineNoSpace));
assert("inline sanitizer keeps span (no spaces)", inlineNoSpace.includes("<span"));

const inlineSpaced = sanitizeWixFontHtml(
  '<span style="font-family: futura-lt-w01-book, sans-serif;">Title</span>',
);
assert("inline sanitizer rewrites futura (spaced)", !/futura/i.test(inlineSpaced));
assert("inline sanitizer uses display stack (spaced)", inlineSpaced.includes("Avenir Next"));

const inlineQuoted = sanitizeWixFontHtml(
  `<span class="wixui-rich-text__text" style="font-family: 'futura-lt-w01-book', sans-serif;">SAKI GOTO Website</span>`,
);
assert("inline sanitizer rewrites quoted futura", !/futura/i.test(inlineQuoted));
assert("inline sanitizer rewrites logo span", inlineQuoted.includes("Avenir Next"));

const inlineAvenir = sanitizeWixFontHtml(
  '<span style="font-family:avenir-lt-w01_35-light1475496,sans-serif">Body</span>',
);
assert("inline sanitizer rewrites avenir", !/avenir-lt-w01/i.test(inlineAvenir));
assert("inline sanitizer uses body stack for avenir", inlineAvenir.includes("Hiragino"));

const fntVar = sanitizeWixInlineStyleValue(
  "--fnt: normal normal normal 25px/1.4em futura-lt-w01-book,sans-serif;",
);
assert("inline --fnt rewrites futura", !/futura/i.test(fntVar));
assert("inline --fnt keeps size tokens", fntVar.includes("25px/1.4em"));

const fontShorthand = sanitizeWixInlineStyleValue(
  "font: normal normal normal 25px/1.4em futura-lt-w01-book,sans-serif;",
);
assert("inline font shorthand rewrites futura", !/futura/i.test(fontShorthand));

const nestedSpans = sanitizeWixFontHtml(
  '<div><span style="font-size:25px"><span style="font-family:futura-lt-w01-book,sans-serif;">Nested</span></span></div>',
);
assert("nested span inline styles sanitized", !/futura/i.test(nestedSpans));

assert(
  "blocked google fonts href",
  isBlockedExternalStylesheetHref("https://fonts.googleapis.com/css2?family=Roboto"),
);
assert(
  "blocked gstatic href",
  isBlockedExternalStylesheetHref("https://fonts.gstatic.com/s/roboto/v1/woff2.css"),
);
assert(
  "allows non-font external css",
  !isBlockedExternalStylesheetHref("https://cdn.example.com/site.css"),
);

const gosakiOverrides = buildGosakiPianoSiteOverridesCss();
assert("gosaki overrides omit futura", !/futura/i.test(gosakiOverrides));
assert(
  "gosaki overrides use safe display stack",
  gosakiOverrides.includes(GOSAKI_SAFE_DISPLAY_FONT_STACK),
);

const composed = buildWixStagingVisualOverridesCss({ siteSlug: "gosaki-piano" });
assert("composed overrides omit futura", !/futura-lt-w01-book/i.test(composed));
assert("composed overrides omit @font-face", !/@font-face/i.test(composed));

if (fs.existsSync(FIXTURE_INDEX)) {
  const html = fs.readFileSync(FIXTURE_INDEX, "utf8");
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  if (styleMatch) {
    const fixtureSanitized = sanitizeWixFontCss(styleMatch[1]);
    const audit = auditFontSafety(fixtureSanitized);
    assert("fixture inline css safe after sanitize", isFontSafeForStaticExport(fixtureSanitized));
    assertEqualish("fixture sanitized no font-face", audit.fontFaceCount, 0);
  }

  const headerMatch = html.match(/<header[^>]*id="SITE_HEADER"[\s\S]*?<\/header>/i);
  if (headerMatch) {
    const headerResult = generateHeaderAstro(headerMatch[0], "Header", {
      scheduleHub: true,
      productionOrigin: "https://www.gosaki-piano.com",
    });
    assert(
      "header astro omits futura-lt-w01",
      !/futura-lt-w01/i.test(headerResult.content),
    );
    assert(
      "header astro uses display stack for logo area",
      headerResult.content.includes("Avenir Next"),
    );
  }
}

{
  const { analyzeStaticSite, collectInlineHeadStyles } = await import("./lib/static-site-analyzer.mjs");
  const { appendWixStagingVisualOverrides } = await import("./lib/wix-staging-visual-overrides.mjs");
  const analysis = analyzeStaticSite(path.join(TOOL_ROOT, "fixtures/gosaki-piano"));
  const inlineHeadStyles = collectInlineHeadStyles(analysis.rawPages);
  const parts = inlineHeadStyles.map((s) => sanitizeWixFontCss(s.content));
  const simulatedGlobal = sanitizeWixFontCss(
    appendWixStagingVisualOverrides(parts.join("\n"), {
      inlineHeadStyleCount: inlineHeadStyles.length,
      siteSlug: "gosaki-piano",
    }),
  );
  assert("simulated global.css font-safe", isFontSafeForStaticExport(simulatedGlobal));
}

function assertDirectoryFontSafe(label, dir) {
  if (!fs.existsSync(dir)) {
    console.log(`SKIP ${label} (missing ${dir})`);
    return;
  }
  const violations = scanDirectoryForFontSafetyViolations(dir);
  assert(
    `${label} has zero blocked font patterns`,
    violations.length === 0,
  );
  if (violations.length > 0) {
    for (const v of violations.slice(0, 5)) {
      console.error(`  ${v.file}: ${v.count} match(es)`);
    }
  }
}

assertDirectoryFontSafe("generated astro src", path.join(GENERATED_ASTRO, "src"));
assertDirectoryFontSafe("static-public dist", STATIC_PUBLIC_DIST);
assertDirectoryFontSafe("manual-upload public-dist", PUBLIC_DIST);

if (fs.existsSync(PUBLIC_DIST)) {
  const totalBlocked = countFontSafetyBlockedPatterns(
    walkTextFiles(PUBLIC_DIST, [".html", ".css"]).join("\n"),
  );
  assertEqualish("manual-upload public-dist blocked pattern total", totalBlocked, 0);
}

function walkTextFiles(dir, extensions) {
  /** @type {string[]} */
  const chunks = [];
  if (!fs.existsSync(dir)) return chunks;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      chunks.push(...walkTextFiles(full, extensions));
      continue;
    }
    if (!extensions.some((ext) => entry.name.endsWith(ext))) continue;
    chunks.push(fs.readFileSync(full, "utf8"));
  }
  return chunks;
}

console.log("");
console.log(`verify-gosaki-font-safety: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
