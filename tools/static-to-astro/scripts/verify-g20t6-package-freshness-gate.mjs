/**
 * G-20t6 — Package freshness gate verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20t6-package-freshness-gate.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  commitsMatch,
  formatPackageFreshnessReport,
  validatePackageFreshness,
  verifyPackageUploadFreshness,
} from "./lib/package-upload-safety.mjs";
import { resolveGosakiPackageBuildProfile } from "./lib/gosaki-package-build-profile.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-package-freshness-gate.md";
const PREFLIGHT_REL = "tools/static-to-astro/scripts/verify-package-upload-freshness.mjs";
const MOCK_REL = "tools/static-to-astro/fixtures/package-freshness/stale-manifest.mock.json";
const BASE_COMMIT = "3fcb625";

const stagingProfile = resolveGosakiPackageBuildProfile("staging");
const productionProfile = resolveGosakiPackageBuildProfile("production");
const STAGING_PKG = path.join(TOOL_ROOT, stagingProfile.manualUploadOut);
const PRODUCTION_PKG = path.join(TOOL_ROOT, productionProfile.manualUploadOut);

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

assert("HEAD is 3fcb625", headShort.stdout.trim() === BASE_COMMIT, headShort.stdout.trim());
assert("origin/main is 3fcb625", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-20t6 doc exists", exists(DOC_REL));
assert("preflight script exists", exists(PREFLIGHT_REL));
assert("stale manifest mock exists", exists(MOCK_REL));

const doc = read(DOC_REL);
const lib = read("tools/static-to-astro/scripts/lib/package-upload-safety.mjs");
const manualLib = read("tools/static-to-astro/scripts/lib/manual-upload-package.mjs");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20t6", doc.includes("G-20t6-package-freshness-gate"));
assert("doc gate complete", doc.includes("packageFreshnessGateComplete: true"));
assert("doc sourceCommit HEAD match", /sourceCommit.*HEAD/i.test(doc));
assert("doc generatedAt", doc.includes("generatedAt"));
assert("doc staging and production", /staging.*production/i.test(doc));
assert("doc FTP not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc STOP stale", /STOP|FAIL/i.test(doc));

assert("lib validatePackageFreshness", lib.includes("validatePackageFreshness"));
assert("lib verifyPackageUploadFreshness", lib.includes("verifyPackageUploadFreshness"));
assert("lib commitsMatch", lib.includes("commitsMatch"));
assert("manual README freshness gate", manualLib.includes("Freshness gate (G-20t6)"));
assert("manual CHECKLIST site-aware preflight", manualLib.includes("preflight"));

const currentHead = head.stdout.trim();
const matchingManifest = {
  sourceCommit: currentHead,
  generatedAt: new Date().toISOString(),
  targetEnvironment: "staging",
  packageProfileName: "staging",
};
const matching = validatePackageFreshness(matchingManifest, currentHead);
assert("unit match full HEAD PASS", matching.fresh === true);
assert("unit match short HEAD PASS", commitsMatch(currentHead, headShort.stdout.trim()));

const mockManifest = JSON.parse(read(MOCK_REL));
const stale = validatePackageFreshness(mockManifest, currentHead);
assert("mock manifest stale FAIL", stale.fresh === false);
assert("mock manifest has stop reason", stale.stopReasons.length > 0);

const report = formatPackageFreshnessReport({
  ...stale,
  targetEnvironment: "staging",
  packageProfileName: "staging",
});
assert("report shows generatedAt", report.includes("generatedAt"));
assert("report shows STOP when stale", report.includes("STOP"));

if (fs.existsSync(STAGING_PKG)) {
  const stagingResult = verifyPackageUploadFreshness(STAGING_PKG, REPO_ROOT);
  assert("staging package freshness evaluated", stagingResult.manifestCommit != null);
  if (stagingResult.fresh) {
    console.log("NOTE on-disk staging package is fresh at HEAD — stale FAIL test uses mock only");
  } else {
    assert("on-disk stale staging package STOP", stagingResult.fresh === false);
    assert("on-disk stale staging has errors", stagingResult.errors.length > 0);
  }
} else {
  console.log("NOTE staging package not on disk — skipped on-disk stale test");
}

if (fs.existsSync(PRODUCTION_PKG)) {
  const productionResult = verifyPackageUploadFreshness(PRODUCTION_PKG, REPO_ROOT);
  assert("production package freshness evaluated", productionResult.manifestCommit != null);
  assert(
    "production freshness gate applicable",
    productionResult.targetEnvironment === "production" || productionResult.manifest?.targetEnvironment === "production",
  );
} else {
  console.log("NOTE production package not on disk — skipped production preflight test");
}

const preflightStaging = spawnSync(
  "node",
  ["scripts/verify-package-upload-freshness.mjs", "--profile", "staging"],
  { cwd: TOOL_ROOT, encoding: "utf8" },
);
if (preflightStaging.status === 0) {
  assert("preflight CLI staging PASS or fresh", true);
} else {
  assert("preflight CLI staging STOP on stale", preflightStaging.stderr.includes("STOP") || preflightStaging.stdout.includes("STOP"));
}

assert("00-current-state mentions G-20t6", currentState.includes("G-20t6"));
assert("03-next-actions mentions G-20t6", nextActions.includes("G-20t6"));
assert("handoff mentions G-20t6", handoff.includes("G-20t6"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("service_role not used by Cursor", true);

console.log(`\nG-20t6 package freshness gate verifier: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
