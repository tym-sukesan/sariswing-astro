/**
 * G-20i3 — Gosaki production package admin exclusion verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20i3-gosaki-production-package-admin-exclusion.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { findDiscographyRepeaterItemBounds } from "./lib/supabase-discography-read.mjs";
import {
  STAGING_KIT_SUPABASE_REF,
  SARISWING_PRODUCTION_SUPABASE_REF,
  resolveGosakiPackageBuildProfile,
} from "./lib/gosaki-package-build-profile.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-production-package-admin-exclusion-result.md";
const G20I2_REL =
  "tools/static-to-astro/docs/gosaki-production-upload-finalization-admin-and-remote-path.md";
const BUILD_STAGING_REL = "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs";
const PROFILES_REL = "tools/static-to-astro/config/sites/gosaki-piano.deploy-profiles.json";
const BASE_COMMIT = "d34646d";

const PRODUCTION_URL = "https://www.gosaki-piano.com";
const STAGING_HOST = "yskcreate.weblike.jp";
const STAGING_DEPLOY_BASE = "/cms-kit-staging/gosaki-piano";

const EXPECTED_PUBLIC_DIST_COUNT = 26;

const TEST_A = "Like a Lover（テスト）";
const TEST_B = "Mary Ann（テスト）";
const AFTER_A = "Like a Lover";
const AFTER_B = "Mary Ann";

const KEY_ROUTES = [
  "public-dist/index.html",
  "public-dist/discography/index.html",
  "public-dist/schedule/index.html",
  "public-dist/about/index.html",
  "public-dist/contact/index.html",
  "public-dist/robots.txt",
  "public-dist/sitemap-index.xml",
  "public-dist/sitemap-0.xml",
];

const SEO_SAMPLE_ROUTES = [
  "public-dist/index.html",
  "public-dist/discography/index.html",
  "public-dist/schedule/index.html",
  "public-dist/about/index.html",
  "public-dist/contact/index.html",
];

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

function walkFiles(dir, base = dir) {
  /** @type {string[]} */
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(abs, base));
    else out.push(path.relative(base, abs).replace(/\\/g, "/"));
  }
  return out;
}

function extractTrackTitlesFromItem(itemHtml) {
  const tlIdx = itemHtml.indexOf("Track List");
  if (tlIdx < 0) return [];
  const after = itemHtml.slice(tlIdx);
  const endRel = after.search(/Personnel|Release/);
  const block = endRel > 0 ? after.slice(0, endRel) : after;
  /** @type {string[]} */
  const titles = [];
  const re = /<p class="font_(8|13)[^"]*"[^>]*>([\s\S]*?)<\/p>/g;
  let match;
  while ((match = re.exec(block)) !== null) {
    const text = match[2]
      .replace(/<[^>]+>/g, "")
      .replace(/\u200b/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
    if (text && !/track list/i.test(text)) titles.push(text);
  }
  return titles;
}

function extractRepeaterItem(html, title) {
  const bounds = findDiscographyRepeaterItemBounds(html, title);
  if (!bounds) return "";
  return html.slice(bounds.start, bounds.end);
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const stagingDiff = spawnSync("git", ["diff", BUILD_STAGING_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is d34646d", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is d34646d", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());
assert("staging build script unchanged", stagingDiff.stdout.length === 0);

const profiles = JSON.parse(read(PROFILES_REL));
assert("production profile admin exclusion", profiles.profiles.production.includeGosakiReadOnlyAdmin === false);

const profile = resolveGosakiPackageBuildProfile("production");
assert("profile includeGosakiReadOnlyAdmin false", profile.includeGosakiReadOnlyAdmin === false);

const packageRel = path.join("tools/static-to-astro", profile.manualUploadOut);
const packageAbs = path.join(REPO_ROOT, packageRel);
const publicDistRel = path.join(packageRel, "public-dist");
const publicDistAbs = path.join(packageAbs, "public-dist");

assert("G-20i3 doc exists", exists(DOC_REL));
assert("G-20i2 prior doc exists", exists(G20I2_REL));

const doc = read(DOC_REL);
assert("doc phase G-20i3", doc.includes("G-20i3-gosaki-production-package-admin-exclusion"));
assert("doc exclusion gate", doc.includes("gosakiProductionPackageAdminExclusionComplete: true"));
assert("doc admin excluded", doc.includes("adminExcludedFromPackage: true"));
assert("doc upload 26", doc.includes("uploadFileCount: 26"));
assert("doc FTP not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc G-20j blocked", doc.includes("readyForG20jManualProductionUpload: false"));
assert("doc G-20ui1 next", doc.includes("G-20ui1"));

assert("production package exists", exists(packageRel));
assert("public-dist exists", exists(publicDistRel));
assert("admin index absent", !exists(path.join(publicDistRel, "admin/index.html")));
assert("admin dir absent", !exists(path.join(publicDistRel, "admin")));

const publicFiles = walkFiles(publicDistAbs);
assert("public-dist file count 26", publicFiles.length === EXPECTED_PUBLIC_DIST_COUNT, String(publicFiles.length));
assert("no admin in file list", !publicFiles.some((f) => f.startsWith("admin/")));

for (const rel of KEY_ROUTES) {
  assert(`key route ${rel}`, exists(path.join(packageRel, rel)));
}

const astroAssets = publicFiles.filter((f) => f.startsWith("_astro/"));
assert("_astro assets exist", astroAssets.length > 0, String(astroAssets.length));

for (const rel of SEO_SAMPLE_ROUTES) {
  const html = read(path.join(packageRel, rel));
  const headHtml = html.match(/<head[^>]*>[\s\S]*?<\/head>/i)?.[0] ?? html.slice(0, 8000);
  assert(`${rel} no noindex`, !/noindex/i.test(headHtml));
  assert(
    `${rel} no staging host`,
    !headHtml.includes(STAGING_HOST) && !headHtml.includes(STAGING_DEPLOY_BASE),
  );
  assert(`${rel} canonical production`, /rel="canonical" href="https:\/\/www\.gosaki-piano\.com/i.test(headHtml));
  assert(`${rel} og:url production`, /property="og:url" content="https:\/\/www\.gosaki-piano\.com/i.test(headHtml));
}

const robots = read(path.join(packageRel, "public-dist/robots.txt"));
assert("robots sitemap production", robots.includes(`${PRODUCTION_URL}/sitemap-index.xml`));

const sitemapIndex = read(path.join(packageRel, "public-dist/sitemap-index.xml"));
assert("sitemap-index production URLs", sitemapIndex.includes(PRODUCTION_URL));
assert("sitemap-index no staging", !sitemapIndex.includes(STAGING_HOST));

const discHtml = read(path.join(packageRel, "public-dist/discography/index.html"));
assert("discography test A absent", !discHtml.includes(TEST_A));
assert("discography test B absent", !discHtml.includes(TEST_B));
assert("discography Like a Lover present", discHtml.includes(AFTER_A));
assert("discography Mary Ann present", discHtml.includes(AFTER_B));

const manifest = JSON.parse(read(path.join(packageRel, "MANIFEST.json")));
assert("manifest fileCount 26", manifest.fileCount === 26, String(manifest.fileCount));
assert("manifest adminExcludedFromPackage", manifest.adminExcludedFromPackage === true);
assert("manifest includeGosakiReadOnlyAdmin false", manifest.includeGosakiReadOnlyAdmin === false);

const packageTree = walkFiles(packageAbs).join("\n");
assert("no sariswing production ref", !packageTree.includes(SARISWING_PRODUCTION_SUPABASE_REF));

assert("no FTP upload evidence", !doc.includes("ftpUploadExecuted: true"));
assert("no DNS change evidence", !doc.includes("dnsChangeExecuted: true"));
assert("no DB write evidence", !doc.includes("cursorDbWriteExecuted: true"));

console.log(`\nG-20i3 production package admin exclusion verifier: ${passed} passed, ${failed} failed`);
console.log(`public-dist files: ${publicFiles.length}`);
process.exit(failed > 0 ? 1 : 0);
