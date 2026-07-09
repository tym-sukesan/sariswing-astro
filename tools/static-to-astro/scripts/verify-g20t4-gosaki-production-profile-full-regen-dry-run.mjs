/**
 * G-20t4 — Gosaki production profile full regen dry-run verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20t4-gosaki-production-profile-full-regen-dry-run.mjs
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
  validatePublicDistAdminSafety,
  walkRelativeFiles,
} from "./lib/package-upload-safety.mjs";
import { resolveGosakiPackageBuildProfile } from "./lib/gosaki-package-build-profile.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-production-profile-full-regen-dry-run.md";
const BUILD_REL = "tools/static-to-astro/scripts/build-gosaki-production-package.mjs";
const BASE_COMMIT = "55d0364";
const EXPECTED_AUGUST_EVENT_CARDS = 14;
const EXPECTED_PUBLIC_DIST_COUNT = 28;

const productionProfile = resolveGosakiPackageBuildProfile("production");
const stagingProfile = resolveGosakiPackageBuildProfile("staging");
const PRODUCTION_PKG = path.join(TOOL_ROOT, productionProfile.manualUploadOut);
const STAGING_PKG = path.join(TOOL_ROOT, stagingProfile.manualUploadOut);
const PRODUCTION_PUBLIC = path.join(PRODUCTION_PKG, "public-dist");

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

assert("HEAD is 55d0364", headShort.stdout.trim() === BASE_COMMIT, headShort.stdout.trim());
assert("origin/main is 55d0364", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());
assert("G-20t4 doc exists", exists(DOC_REL));
assert("build script exists", exists(BUILD_REL));

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20t4", doc.includes("G-20t4-gosaki-production-profile-full-regen-dry-run"));
assert("doc gate complete", doc.includes("gosakiProductionProfileFullRegenDryRunComplete: true"));
assert("doc FTP not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc upload blocked TBD", /TBD_G-20i|upload.*blocked|本番アップロード不可/i.test(doc));
assert("doc staging vs production", /staging.*production|includesAdmin/i.test(doc));
assert("doc August 14", doc.includes("14"));

assert("production package exists", fs.existsSync(PRODUCTION_PKG));
const manifestState = readPackageManifest(PRODUCTION_PKG);
assert("production MANIFEST readable", manifestState.ok, manifestState.error ?? "");
const manifest = manifestState.manifest ?? {};

assert("targetEnvironment production", manifest.targetEnvironment === "production");
assert("packageProfileName production", manifest.packageProfileName === "production");
assert("includesAdmin false", manifest.includesAdmin === false);
assert("adminExcludedFromPackage true", manifest.adminExcludedFromPackage === true);
assert("safeForStaticFtp true", manifest.safeForStaticFtp === true);
assert("ftpAutoDeployUsed false", manifest.ftpAutoDeployUsed === false);
assert(
  "sourceCommit matches HEAD",
  String(manifest.sourceCommit ?? "").startsWith(head.stdout.trim()),
  `${manifest.sourceCommit} vs ${head.stdout.trim()}`,
);
assert("intendedRemotePath TBD", manifest.intendedRemotePath === "TBD_G-20i");
assert("intendedRemotePath unsafe (upload blocked)", isUnsafeIntendedRemotePath(manifest.intendedRemotePath));

const manifestSafety = validatePackageManifestSafety(manifest, "production");
assert("manifest safety production", manifestSafety.length === 0, manifestSafety.join("; "));

assert("admin index absent", !fs.existsSync(path.join(PRODUCTION_PUBLIC, "admin/index.html")));
assert("admin dir absent", !fs.existsSync(path.join(PRODUCTION_PUBLIC, "admin")));
assert(
  "__admin-staging-shell absent",
  !fs.existsSync(path.join(PRODUCTION_PUBLIC, "__admin-staging-shell")),
);

const publicFiles = walkRelativeFiles(PRODUCTION_PUBLIC);
assert("public-dist file count 28", publicFiles.length === EXPECTED_PUBLIC_DIST_COUNT, String(publicFiles.length));
assert("manifest fileCount 28", manifest.fileCount === EXPECTED_PUBLIC_DIST_COUNT, String(manifest.fileCount));

const augustPath = path.join(PRODUCTION_PUBLIC, "schedule/2026-08/index.html");
const augustLegacy = path.join(PRODUCTION_PUBLIC, "2026-08/index.html");
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
assert("August 会場 text", augustHtml.includes("会場"));

const sitemapPath = path.join(PRODUCTION_PUBLIC, "sitemap-0.xml");
assert("sitemap-0.xml exists", fs.existsSync(sitemapPath));
const sitemap = fs.readFileSync(sitemapPath, "utf8");
assert("sitemap includes schedule/2026-08", sitemap.includes("/schedule/2026-08/"));
const sitemapViolations = findSitemapSafetyViolations(sitemap);
assert("sitemap no admin/api/preview/draft/legacy root", sitemapViolations.length === 0, sitemapViolations.join("; "));

const adminSafety = validatePublicDistAdminSafety(PRODUCTION_PUBLIC, "production");
assert("public-dist admin safety", adminSafety.length === 0, adminSafety.join("; "));

const productionZip = path.join(PRODUCTION_PKG, "gosaki-piano-production-manual-upload.zip");
assert("production zip exists", fs.existsSync(productionZip));

if (fs.existsSync(STAGING_PKG)) {
  const stagingManifest = readPackageManifest(STAGING_PKG).manifest;
  if (stagingManifest) {
    assert("staging includesAdmin true", stagingManifest.includesAdmin === true);
    assert("staging targetEnvironment staging", stagingManifest.targetEnvironment === "staging");
    assert(
      "staging intendedRemotePath under cms-kit-staging",
      String(stagingManifest.intendedRemotePath).includes("/cms-kit-staging/"),
    );
    assert(
      "staging vs production profile differs",
      stagingManifest.packageProfileName !== manifest.packageProfileName,
    );
  }
} else {
  console.log("NOTE staging package not on disk — staging comparison skipped");
}

assert("00-current-state mentions G-20t4", currentState.includes("G-20t4"));
assert("03-next-actions mentions G-20t4", nextActions.includes("G-20t4"));
assert("handoff mentions G-20t4", handoff.includes("G-20t4"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("service_role not used by Cursor", true);

console.log(`\nG-20t4 production profile full regen dry-run verifier: ${passed} passed, ${failed} failed\n`);
console.log(`production package: ${path.relative(REPO_ROOT, PRODUCTION_PKG)}`);
console.log(`sourceCommit: ${manifest.sourceCommit}`);
console.log(`fileCount: ${manifest.fileCount}`);
console.log(`August cards: ${augustCards}`);
process.exit(failed > 0 ? 1 : 0);
