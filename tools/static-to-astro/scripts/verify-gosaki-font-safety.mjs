#!/usr/bin/env node
/**
 * G-9b1 — Verify Wix font safety sanitizer (no network, no DB).
 * Run: node scripts/verify-gosaki-font-safety.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildGosakiPianoSiteOverridesCss } from "./lib/site-specific-overrides/gosaki-piano-overrides.mjs";
import { buildWixStagingVisualOverridesCss } from "./lib/wix-staging-visual-overrides.mjs";
import {
  auditFontSafety,
  GOSAKI_SAFE_BODY_FONT_STACK,
  GOSAKI_SAFE_DISPLAY_FONT_STACK,
  isBlockedExternalStylesheetHref,
  isFontSafeForStaticExport,
  sanitizeWixFontCss,
  sanitizeWixInlineFontStyles,
  containsWixProprietaryFont,
} from "./lib/wix-font-safety.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const FIXTURE_INDEX = path.join(TOOL_ROOT, "fixtures/gosaki-piano/index.html");

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

const inline = sanitizeWixInlineFontStyles(
  '<span style="font-family:futura-lt-w01-book,sans-serif">Title</span>',
);
assert("inline sanitizer rewrites futura", !/futura/i.test(inline));
assert("inline sanitizer keeps span", inline.includes("<span"));

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

function assertEqualish(name, actual, expected) {
  assert(name, actual === expected);
  if (actual !== expected) {
    console.error(`  expected: ${expected}`);
    console.error(`  actual:   ${actual}`);
  }
}

console.log("");
console.log(`verify-gosaki-font-safety: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
