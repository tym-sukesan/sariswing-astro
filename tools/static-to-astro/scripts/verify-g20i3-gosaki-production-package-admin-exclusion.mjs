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
const CURRENT_EXPECTED_HEAD = "3e78c84";

const PRODUCTION_URL = "https://www.gosaki-piano.com";
const STAGING_HOST = "yskcreate.weblike.jp";
const STAGING_DEPLOY_BASE = "/cms-kit-staging/gosaki-piano";

const EXPECTED_PUBLIC_DIST_COUNT = 28;

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

import {
  findSitemapSafetyViolations,
  validatePackageManifestSafety,
  validatePublicDistAdminSafety,
  walkRelativeFiles,
} from "./lib/package-upload-safety.mjs";

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

if (head.stdout.trim() === BASE_COMMIT) {
  console.log("PASS HEAD is d34646d (G-20i3 original)");
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${head.stdout.trim()} (G-20i3 original ${BASE_COMMIT}) — non-blocking`);
}
if (origin.stdout.trim() === BASE_COMMIT) {
  console.log("PASS origin/main is d34646d (G-20i3 original)");
  passed += 1;
} else {
  console.log(`NOTE origin/main is ${origin.stdout.trim()} (G-20i3 original ${BASE_COMMIT}) — non-blocking`);
}
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
if (doc.includes("uploadFileCount: 26")) {
  console.log("PASS doc upload 26 (G-20i3 historical)");
  passed += 1;
} else {
  console.log("NOTE G-20i3 doc uploadFileCount: 26 not found — G-20t4 uses 28 — non-blocking");
}
assert("doc FTP not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc G-20j blocked", doc.includes("readyForG20jManualProductionUpload: false"));
assert("doc G-20ui1 next", doc.includes("G-20ui1"));

assert("production package exists", exists(packageRel));
assert("public-dist exists", exists(publicDistRel));
assert("admin index absent", !exists(path.join(publicDistRel, "admin/index.html")));
assert("admin dir absent", !exists(path.join(publicDistRel, "admin")));

const publicFiles = walkRelativeFiles(publicDistAbs);
assert(`public-dist file count ${EXPECTED_PUBLIC_DIST_COUNT}`, publicFiles.length === EXPECTED_PUBLIC_DIST_COUNT, String(publicFiles.length));
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
assert("manifest fileCount 28", manifest.fileCount === EXPECTED_PUBLIC_DIST_COUNT, String(manifest.fileCount));
assert("manifest adminExcludedFromPackage", manifest.adminExcludedFromPackage === true);
assert("manifest includeGosakiReadOnlyAdmin false", manifest.includeGosakiReadOnlyAdmin === false);
assert("manifest includesAdmin false", manifest.includesAdmin === false);
assert("manifest targetEnvironment production", manifest.targetEnvironment === "production");
assert("manifest packageProfileName production", manifest.packageProfileName === "production");
assert("manifest sourceCommit present", Boolean(manifest.sourceCommit));
const manifestSafetyErrors = validatePackageManifestSafety(manifest, "production");
if (manifestSafetyErrors.length === 0) {
  assert("manifest safety production", true);
} else {
  for (const err of manifestSafetyErrors) {
    assert(`manifest safety: ${err}`, false, err);
  }
}

const productionZip = path.join(packageRel, "gosaki-piano-production-manual-upload.zip");
const legacyZip = path.join(packageRel, "gosaki-piano-manual-upload.zip");
assert(
  "production zip name",
  exists(productionZip) || exists(legacyZip),
  "expected gosaki-piano-production-manual-upload.zip",
);

const sitemap0 = read(path.join(packageRel, "public-dist/sitemap-0.xml"));
const sitemapViolations = findSitemapSafetyViolations(sitemap0);
if (sitemapViolations.length === 0) {
  assert("sitemap excludes admin/api/preview/draft/legacy root", true);
} else {
  for (const violation of sitemapViolations) {
    assert(`sitemap safety: ${violation}`, false, violation);
  }
}

const publicDistSafetyErrors = validatePublicDistAdminSafety(publicDistAbs, "production");
if (publicDistSafetyErrors.length === 0) {
  assert("public-dist admin safety", true);
} else {
  for (const err of publicDistSafetyErrors) {
    assert(`public-dist safety: ${err}`, false, err);
  }
}

const packageTree = walkRelativeFiles(packageAbs).join("\n");
assert("no sariswing production ref", !packageTree.includes(SARISWING_PRODUCTION_SUPABASE_REF));

assert("no FTP upload evidence", !doc.includes("ftpUploadExecuted: true"));
assert("no DNS change evidence", !doc.includes("dnsChangeExecuted: true"));
assert("no DB write evidence", !doc.includes("cursorDbWriteExecuted: true"));

console.log(`\nG-20i3 production package admin exclusion verifier: ${passed} passed, ${failed} failed`);
console.log(`public-dist files: ${publicFiles.length}`);
process.exit(failed > 0 ? 1 : 0);
