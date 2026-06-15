#!/usr/bin/env node
/**
 * G-7a — Verify static-site crawler (no external network, no DB).
 * Run: node tools/static-to-astro/scripts/verify-crawl-static-site.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractFromHtml } from "./lib/static-site-crawler-extract.mjs";
import { runStaticSiteCrawl } from "./lib/static-site-crawler.mjs";
import {
  isPathAllowedByRobots,
} from "./lib/static-site-crawler-robots.mjs";
import {
  urlToAssetRelativePath,
  urlToPageRelativePath,
} from "./lib/static-site-crawler-path.mjs";
import {
  getOrigin,
  isSameOrigin,
  looksLikeHtmlPage,
  normalizeCrawlUrl,
} from "./lib/static-site-crawler-url.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

function assertEqual(name, actual, expected) {
  assert(name, actual === expected);
  if (actual !== expected) {
    console.error(`  expected: ${expected}`);
    console.error(`  actual:   ${actual}`);
  }
}

const MOCK_ORIGIN = "https://mock.test";
const ABOUT_HTML = `<!DOCTYPE html><html><head><title>About</title></head><body>
    <a href="/">Home</a>
    <script src="/js/main.js"></script>
  </body></html>`;

const MOCK_PAGES = {
  [`${MOCK_ORIGIN}/`]: `<!DOCTYPE html><html><head>
    <title>Mock Home</title>
    <meta name="description" content="Home desc">
    <link rel="stylesheet" href="/css/style.css">
  </head><body>
    <a href="/about/">About</a>
    <a href="https://external.test/nope">External</a>
    <img src="/images/logo.png" alt="">
  </body></html>`,
  [`${MOCK_ORIGIN}/about/`]: ABOUT_HTML,
  [`${MOCK_ORIGIN}/about`]: ABOUT_HTML,
  [`${MOCK_ORIGIN}/css/style.css`]: `body { color: black; }`,
  [`${MOCK_ORIGIN}/js/main.js`]: `console.log("mock");`,
  [`${MOCK_ORIGIN}/images/logo.png`]: "PNG_MOCK",
  [`${MOCK_ORIGIN}/robots.txt`]: `User-agent: *\nDisallow: /private/\n`,
};

/** @type {typeof fetch} */
function mockFetch(url, _init) {
  const href = typeof url === "string" ? url : url.href;
  const candidates = [
    href,
    normalizeCrawlUrl(href, href),
    href.endsWith("/") ? href.slice(0, -1) : `${href}/`,
  ].filter(Boolean);
  let body;
  let resolved = href;
  for (const key of candidates) {
    if (MOCK_PAGES[key] !== undefined) {
      body = MOCK_PAGES[key];
      resolved = key;
      break;
    }
  }
  if (body === undefined) {
    return Promise.resolve(
      new Response("Not Found", { status: 404, headers: { "content-type": "text/plain" } }),
    );
  }
  const contentType = resolved.endsWith(".css")
    ? "text/css"
    : resolved.endsWith(".js")
      ? "application/javascript"
      : resolved.endsWith(".png")
        ? "image/png"
        : resolved.endsWith("robots.txt")
          ? "text/plain"
          : "text/html";
  return Promise.resolve(
    new Response(body, { status: 200, headers: { "content-type": contentType } }),
  );
}

// --- URL normalization ---

assertEqual(
  "normalizeCrawlUrl strips hash",
  normalizeCrawlUrl("https://mock.test/a#section", MOCK_ORIGIN),
  "https://mock.test/a",
);

assertEqual(
  "getOrigin",
  getOrigin("https://www.gosaki-piano.com/path"),
  "https://www.gosaki-piano.com",
);

assert(
  "isSameOrigin true",
  isSameOrigin("https://mock.test/about/", MOCK_ORIGIN),
);

assert(
  "isSameOrigin false for external",
  !isSameOrigin("https://external.test/", MOCK_ORIGIN),
);

assert(
  "looksLikeHtmlPage for path without extension",
  looksLikeHtmlPage("https://mock.test/about/", MOCK_ORIGIN),
);

// --- Path mapping ---

assertEqual(
  "urlToPageRelativePath root",
  urlToPageRelativePath("https://mock.test/"),
  "index.html",
);

assertEqual(
  "urlToPageRelativePath single segment",
  urlToPageRelativePath("https://mock.test/about/"),
  "about.html",
);

assertEqual(
  "urlToPageRelativePath nested",
  urlToPageRelativePath("https://mock.test/schedule/2026-07/"),
  "schedule/2026-07/index.html",
);

assertEqual(
  "urlToAssetRelativePath css",
  urlToAssetRelativePath("https://mock.test/css/style.css", MOCK_ORIGIN),
  "css/style.css",
);

// --- Link extraction ---

const homeHtml = MOCK_PAGES[`${MOCK_ORIGIN}/`];
const extracted = extractFromHtml(homeHtml, `${MOCK_ORIGIN}/`, MOCK_ORIGIN, {
  sameOriginOnly: true,
});
assert("extract finds about page link", extracted.pageLinks.some((u) => u.includes("/about")));
assert("extract finds css asset", extracted.assetLinks.some((u) => u.includes("style.css")));
assertEqual("extract title", extracted.meta.title, "Mock Home");
assertEqual("extract description", extracted.meta.description, "Home desc");
assert(
  "extract excludes external page",
  !extracted.pageLinks.some((u) => u.includes("external.test")),
);

// --- Robots ---

assert(
  "robots allows /about",
  isPathAllowedByRobots(MOCK_PAGES[`${MOCK_ORIGIN}/robots.txt`], "/about/"),
);
assert(
  "robots disallows /private",
  !isPathAllowedByRobots(MOCK_PAGES[`${MOCK_ORIGIN}/robots.txt`], "/private/secret"),
);

// --- Dry-run (no writes, mock fetch unused) ---

async function runAsyncTests() {
  const dry = await runStaticSiteCrawl({
    startUrl: `${MOCK_ORIGIN}/`,
    siteSlug: "mock-test",
    outDir: "fixtures/mock-test",
    maxPages: 5,
    dryRun: true,
    respectRobots: true,
    fetchFn: mockFetch,
  });
  assert("dry-run sets dryRun flag", dry.manifest.dryRun === true);
  assert("dry-run no pages fetched", dry.manifest.stats.pagesFetched === 0);
  assert("dry-run report mentions wouldFetchFirstPage", dry.reportMarkdown.includes("wouldFetchFirstPage"));
  assert("dry-run robots skipped", dry.manifest.robots?.skippedInDryRun === true);

  const tmpOut = fs.mkdtempSync(path.join(os.tmpdir(), "crawl-verify-"));
  try {
    const live = await runStaticSiteCrawl({
      startUrl: `${MOCK_ORIGIN}/`,
      siteSlug: "mock-test",
      outDir: tmpOut,
      maxPages: 5,
      dryRun: false,
      respectRobots: true,
      delayMs: 0,
      fetchFn: mockFetch,
    });

    assert("live crawl fetched pages", live.manifest.stats.pagesFetched >= 2);
    assert("manifest.json written", fs.existsSync(path.join(tmpOut, "manifest.json")));
    assert("index.html written", fs.existsSync(path.join(tmpOut, "index.html")));
    assert("about.html written", fs.existsSync(path.join(tmpOut, "about.html")));
    assert("css asset written", fs.existsSync(path.join(tmpOut, "css", "style.css")));

    const manifest = JSON.parse(fs.readFileSync(path.join(tmpOut, "manifest.json"), "utf8"));
    assert("manifest has siteSlug", manifest.siteSlug === "mock-test");
    assert("manifest pages array", Array.isArray(manifest.pages) && manifest.pages.length >= 2);
    assert("manifest assets array", Array.isArray(manifest.assets) && manifest.assets.length >= 1);
    assert("manifest failed array", Array.isArray(manifest.failed));
    assert("manifest warnings array", Array.isArray(manifest.warnings));
  } finally {
    fs.rmSync(tmpOut, { recursive: true, force: true });
  }
}

await runAsyncTests();

console.log("");
console.log(`Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
