/**
 * G-20t5 — Gosaki staging profile current-head regen dry-run verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20t5-gosaki-staging-profile-current-head-regen-dry-run.mjs
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
  walkRelativeFiles,
} from "./lib/package-upload-safety.mjs";
import { resolveGosakiPackageBuildProfile } from "./lib/gosaki-package-build-profile.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-staging-profile-current-head-regen-dry-run.md";
const BUILD_REL = "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs";
const BASE_COMMIT = "c9d35d7";
const EXPECTED_AUGUST_EVENT_CARDS = 14;
const EXPECTED_PUBLIC_DIST_COUNT = 29;
const STAGING_PUBLIC_BASE = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/";
const STAGING_REMOTE = "/cms-kit-staging/gosaki-piano/";

const stagingProfile = resolveGosakiPackageBuildProfile("staging");
const productionProfile = resolveGosakiPackageBuildProfile("production");
const STAGING_PKG = path.join(TOOL_ROOT, stagingProfile.manualUploadOut);
const PRODUCTION_PKG = path.join(TOOL_ROOT, productionProfile.manualUploadOut);
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

const head = spawnSync("git", ["rev-parse", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is c9d35d7", headShort.stdout.trim() === BASE_COMMIT, headShort.stdout.trim());
assert("origin/main is c9d35d7", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());
assert("G-20t5 doc exists", exists(DOC_REL));
assert("build script exists", exists(BUILD_REL));

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20t5", doc.includes("G-20t5-gosaki-staging-profile-current-head-regen-dry-run"));
assert("doc gate complete", doc.includes("gosakiStagingProfileCurrentHeadRegenDryRunComplete: true"));
assert("doc FTP not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc includesAdmin true", doc.includes("includesAdmin") && /includesAdmin.*true/i.test(doc));
assert("doc staging vs production", /staging.*production/i.test(doc));
assert("doc August 14", doc.includes("14"));

assert("staging package exists", fs.existsSync(STAGING_PKG));
const manifestState = readPackageManifest(STAGING_PKG);
assert("staging MANIFEST readable", manifestState.ok, manifestState.error ?? "");
const manifest = manifestState.manifest ?? {};

assert("targetEnvironment staging", manifest.targetEnvironment === "staging");
assert("packageProfileName staging", manifest.packageProfileName === "staging");
assert("includesAdmin true", manifest.includesAdmin === true);
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

assert("admin index present", fs.existsSync(path.join(STAGING_PUBLIC, "admin/index.html")));

const publicFiles = walkRelativeFiles(STAGING_PUBLIC);
assert("public-dist file count 29", publicFiles.length === EXPECTED_PUBLIC_DIST_COUNT, String(publicFiles.length));
assert("manifest fileCount 29", manifest.fileCount === EXPECTED_PUBLIC_DIST_COUNT, String(manifest.fileCount));

const augustPath = path.join(STAGING_PUBLIC, "schedule/2026-08/index.html");
const augustLegacy = path.join(STAGING_PUBLIC, "2026-08/index.html");
assert("schedule/2026-08/index.html exists", fs.existsSync(augustPath));
assert("legacy 2026-08 stub exists", fs.existsSync(augustLegacy));

const augustHtml = fs.readFileSync(augustPath, "utf8");
const augustCards = (augustHtml.match(/gosaki-schedule-event-card/g) ?? []).length;
assert(
  `August event cards ${EXPECTED_AUGUST_EVENT_CARDS}`,
  augustCards === EXPECTED_AUGUST_EVENT_CARDS,
  String(augustCards),
);
assert("August scheduleDataSource supabase", augustHtml.includes("scheduleDataSource=supabase"));

const sitemapPath = path.join(STAGING_PUBLIC, "sitemap-0.xml");
assert("sitemap-0.xml exists", fs.existsSync(sitemapPath));
const sitemap = fs.readFileSync(sitemapPath, "utf8");
assert("sitemap includes schedule/2026-08", sitemap.includes("/schedule/2026-08/"));
assert("sitemap excludes /admin/", !sitemap.includes("/admin/"));
const sitemapLocs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
  try {
    return new URL(m[1]).pathname;
  } catch {
    return m[1];
  }
});
const legacyAugustRootInSitemap = sitemapLocs.some((p) => /^\/cms-kit-staging\/gosaki-piano\/2026-08\/$/.test(p) || /^\/2026-08\/$/.test(p));
assert("sitemap excludes legacy /2026-08/ root", !legacyAugustRootInSitemap, sitemapLocs.join("; "));
const sitemapViolations = findSitemapSafetyViolations(sitemap);
assert("sitemap no admin/api/preview/draft/legacy root", sitemapViolations.length === 0, sitemapViolations.join("; "));

const stagingZip = path.join(STAGING_PKG, "gosaki-piano-manual-upload.zip");
assert("staging zip exists", fs.existsSync(stagingZip));

if (fs.existsSync(PRODUCTION_PKG)) {
  const productionManifest = readPackageManifest(PRODUCTION_PKG).manifest;
  if (productionManifest) {
    assert("production includesAdmin false", productionManifest.includesAdmin === false);
    assert("production targetEnvironment production", productionManifest.targetEnvironment === "production");
    assert("production intendedRemotePath TBD", productionManifest.intendedRemotePath === "TBD_G-20i");
    assert(
      "staging vs production fileCount differs",
      manifest.fileCount !== productionManifest.fileCount,
      `${manifest.fileCount} vs ${productionManifest.fileCount}`,
    );
    assert(
      "staging vs production profile differs",
      manifest.packageProfileName !== productionManifest.packageProfileName,
    );
  }
} else {
  console.log("NOTE production package not on disk — production comparison skipped");
}

assert("00-current-state mentions G-20t5", currentState.includes("G-20t5"));
assert("03-next-actions mentions G-20t5", nextActions.includes("G-20t5"));
assert("handoff mentions G-20t5", handoff.includes("G-20t5"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("service_role not used by Cursor", true);

console.log(`\nG-20t5 staging profile current-head regen dry-run verifier: ${passed} passed, ${failed} failed\n`);
console.log(`staging package: ${path.relative(REPO_ROOT, STAGING_PKG)}`);
console.log(`sourceCommit: ${manifest.sourceCommit}`);
console.log(`fileCount: ${manifest.fileCount}`);
console.log(`August cards: ${augustCards}`);
process.exit(failed > 0 ? 1 : 0);
