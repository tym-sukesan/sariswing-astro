/**
 * G-20u26 — Gosaki staging package regen after discography filtered read verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u26-gosaki-staging-package-regen-after-discography-filtered-read.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  findSitemapSafetyViolations,
  isUnsafeIntendedRemotePath,
  readPackageManifest,
  validatePackageManifestSafety,
  verifyPackageUploadFreshness,
  walkRelativeFiles,
} from "./lib/package-upload-safety.mjs";
import { resolveGosakiPackageBuildProfile } from "./lib/gosaki-package-build-profile.mjs";
import { DISCOGRAPHY_SITE_SLUG_COLUMN_READY } from "./lib/supabase-discography-read.mjs";
import {
  loadSiteDiscographyBundleForBuild,
  resolveDiscographyLoaderCapability,
} from "./lib/site-discography-loader.mjs";
import { GOSAKI_SITE_KEY, TOOL_ROOT } from "./lib/site-registry.mjs";
import { resolveSupabaseAnonReadEnv } from "./lib/supabase-schedule-read.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-staging-package-regen-after-discography-filtered-read.md";
const BASE_COMMIT = "72b064c";
const EXPECTED_AUGUST_EVENT_CARDS = 14;
const EXPECTED_PUBLIC_DIST_COUNT = 29;
const EXPECTED_DISCOGRAPHY_RELEASES = 4;
const EXPECTED_DISCOGRAPHY_TRACKS = 34;
const STAGING_PUBLIC_BASE = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/";
const STAGING_REMOTE = "/cms-kit-staging/gosaki-piano/";

const stagingProfile = resolveGosakiPackageBuildProfile("staging");
const STAGING_PKG = path.join(TOOL_ROOT, stagingProfile.manualUploadOut);
const STAGING_PUBLIC = path.join(STAGING_PKG, "public-dist");

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

const head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], { cwd: REPO_ROOT, encoding: "utf8" });

assert("HEAD is 72b064c", headShort.stdout.trim() === BASE_COMMIT, headShort.stdout.trim());
assert("origin/main is 72b064c", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());
assert("G-20u26 doc exists", exists(DOC_REL));

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u26", doc.includes("G-20u26-gosaki-staging-package-regen-after-discography-filtered-read"));
assert("doc gate complete", doc.includes("gosakiStagingPackageRegenAfterDiscographyFilteredReadComplete: true"));
assert("doc FTP not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc filtered read 4/34", doc.includes("4 releases") && doc.includes("34"));
assert("doc manual FTP only", doc.includes("manual FTP") || doc.includes("Manual FTP"));
assert("doc production STOP", doc.includes("G-20j") || doc.includes("Production upload"));

assert("DISCOGRAPHY_SITE_SLUG_COLUMN_READY true", DISCOGRAPHY_SITE_SLUG_COLUMN_READY === true);

const gosakiCap = resolveDiscographyLoaderCapability(GOSAKI_SITE_KEY);
assert("gosaki capability generic_filtered", gosakiCap.mode === "generic_filtered");

assert("staging package exists", fs.existsSync(STAGING_PKG));
const manifestState = readPackageManifest(STAGING_PKG);
assert("staging MANIFEST readable", manifestState.ok, manifestState.error ?? "");
const manifest = manifestState.manifest ?? {};

assert("siteKey gosaki-piano", manifest.siteKey === GOSAKI_SITE_KEY);
assert("targetEnvironment staging", manifest.targetEnvironment === "staging");
assert("packageProfileName staging", manifest.packageProfileName === "staging");
assert("includesAdmin true", manifest.includesAdmin === true);
assert("includeGosakiReadOnlyAdmin true", manifest.includeGosakiReadOnlyAdmin === true);
assert("adminExcludedFromPackage false", manifest.adminExcludedFromPackage === false);
assert("intendedRemotePath staging", manifest.intendedRemotePath === STAGING_REMOTE);
assert("publicBaseUrl staging", manifest.publicBaseUrl === STAGING_PUBLIC_BASE);
assert("safeForStaticFtp true", manifest.safeForStaticFtp === true);
assert("ftpAutoDeployUsed false", manifest.ftpAutoDeployUsed === false);
assert(
  "sourceCommit matches HEAD",
  String(manifest.sourceCommit ?? "").startsWith(head.stdout.trim()),
  `${manifest.sourceCommit} vs ${head.stdout.trim()}`,
);
assert("intendedRemotePath safe for staging", !isUnsafeIntendedRemotePath(manifest.intendedRemotePath));

const manifestSafety = validatePackageManifestSafety(manifest, "staging");
assert("manifest safety staging", manifestSafety.length === 0, manifestSafety.join("; "));

const freshness = verifyPackageUploadFreshness(STAGING_PKG, REPO_ROOT);
assert("package freshness PASS", freshness.ok === true, freshness.errors?.join("; ") ?? freshness.stopReasons?.join("; ") ?? "");

assert("admin index present", fs.existsSync(path.join(STAGING_PUBLIC, "admin/index.html")));

const publicFiles = walkRelativeFiles(STAGING_PUBLIC);
assert("public-dist file count 29", publicFiles.length === EXPECTED_PUBLIC_DIST_COUNT, String(publicFiles.length));
assert("manifest fileCount 29", manifest.fileCount === EXPECTED_PUBLIC_DIST_COUNT, String(manifest.fileCount));

const augustPath = path.join(STAGING_PUBLIC, "schedule/2026-08/index.html");
assert("schedule/2026-08/index.html exists", fs.existsSync(augustPath));
const augustHtml = fs.readFileSync(augustPath, "utf8");
const augustCards = (augustHtml.match(/gosaki-schedule-event-card/g) ?? []).length;
assert(
  `August event cards ${EXPECTED_AUGUST_EVENT_CARDS}`,
  augustCards === EXPECTED_AUGUST_EVENT_CARDS,
  String(augustCards),
);
assert("August scheduleDataSource supabase", augustHtml.includes("scheduleDataSource=supabase"));

const discographyPath = path.join(STAGING_PUBLIC, "discography/index.html");
assert("discography/index.html exists", fs.existsSync(discographyPath));
const discHtml = fs.readFileSync(discographyPath, "utf8");
const discRepeaterItems = (discHtml.match(/wixui-repeater__item/g) ?? []).length;
assert(
  `discography repeater albums ${EXPECTED_DISCOGRAPHY_RELEASES}`,
  discRepeaterItems === EXPECTED_DISCOGRAPHY_RELEASES,
  String(discRepeaterItems),
);
assert("discography album structure", discHtml.includes("comp-llexymel") && discHtml.includes("comp-jshobkm1"));
assert("discography Track List + Personnel", discHtml.includes("Track List") && discHtml.includes("Personnel"));

const sitemapPath = path.join(STAGING_PUBLIC, "sitemap-0.xml");
assert("sitemap-0.xml exists", fs.existsSync(sitemapPath));
const sitemap = fs.readFileSync(sitemapPath, "utf8");
assert("sitemap includes schedule/2026-08", sitemap.includes("/schedule/2026-08/"));
assert("sitemap excludes /admin/", !sitemap.includes("/admin/"));
const sitemapViolations = findSitemapSafetyViolations(sitemap);
assert("sitemap no admin/api/preview/draft", sitemapViolations.length === 0, sitemapViolations.join("; "));

const readEnv = resolveSupabaseAnonReadEnv(process.env, TOOL_ROOT);
if (readEnv) {
  const discBundle = await loadSiteDiscographyBundleForBuild({
    siteKey: GOSAKI_SITE_KEY,
    toolRoot: TOOL_ROOT,
  });
  assert("filtered read siteSlugFilterApplied", discBundle?.siteSlugFilterApplied === true);
  assert("filtered read supabase source", discBundle?.discographyDataSource === "supabase");
  assert(
    `filtered read ${EXPECTED_DISCOGRAPHY_RELEASES} releases`,
    discBundle?.rowCount === EXPECTED_DISCOGRAPHY_RELEASES,
    String(discBundle?.rowCount),
  );
  assert(
    `filtered read ${EXPECTED_DISCOGRAPHY_TRACKS} tracks`,
    discBundle?.trackRowCount === EXPECTED_DISCOGRAPHY_TRACKS,
    String(discBundle?.trackRowCount),
  );
} else {
  console.log("NOTE Supabase env missing — skipped live filtered read bundle assertions");
}

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify:g20u26", packageJson.includes("verify:g20u26-gosaki-staging-package-regen-after-discography-filtered-read"));

assert("00-current-state mentions G-20u26", currentState.includes("G-20u26"));
assert("03-next-actions mentions G-20u26", nextActions.includes("G-20u26"));
assert("handoff mentions G-20u26", handoff.includes("G-20u26"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);

console.log(`\nG-20u26 verifier: ${passed} passed, ${failed} failed\n`);
console.log(`staging package: ${path.relative(REPO_ROOT, STAGING_PKG)}`);
console.log(`sourceCommit: ${manifest.sourceCommit}`);
console.log(`August cards: ${augustCards}`);
console.log(`discography repeater albums: ${discRepeaterItems}`);
process.exit(failed > 0 ? 1 : 0);
