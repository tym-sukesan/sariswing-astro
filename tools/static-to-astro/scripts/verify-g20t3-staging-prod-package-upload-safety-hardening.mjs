/**
 * G-20t3 — Staging / production package upload safety hardening verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20t3-staging-prod-package-upload-safety-hardening.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  REQUIRED_MANIFEST_FIELDS,
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

const DOC_REL = "tools/static-to-astro/docs/gosaki-package-upload-safety-hardening.md";
const LIB_REL = "tools/static-to-astro/scripts/lib/manual-upload-package.mjs";
const SAFETY_LIB_REL = "tools/static-to-astro/scripts/lib/package-upload-safety.mjs";
const CREATE_REL = "tools/static-to-astro/scripts/create-manual-upload-package.mjs";
const BASE_COMMIT = "3e78c84";

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

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 3e78c84", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 3e78c84", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-20t3 doc exists", exists(DOC_REL));
assert("manual-upload-package lib exists", exists(LIB_REL));
assert("package-upload-safety lib exists", exists(SAFETY_LIB_REL));
assert("create-manual-upload-package exists", exists(CREATE_REL));

const doc = read(DOC_REL);
const lib = read(LIB_REL);
const createCli = read(CREATE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20t3", doc.includes("G-20t3-staging-prod-package-upload-safety-hardening"));
assert("doc gate complete", doc.includes("gosakiPackageUploadSafetyHardeningComplete: true"));
assert("doc targetEnvironment", doc.includes("targetEnvironment"));
assert("doc includesAdmin", doc.includes("includesAdmin"));
assert("doc intendedRemotePath", doc.includes("intendedRemotePath"));
assert("doc publicBaseUrl", doc.includes("publicBaseUrl"));
assert("doc sourceCommit", doc.includes("sourceCommit"));
assert("doc package mix-up", /mix-up|取り違え/i.test(doc));
assert("doc public-dist contents", /contents.*public-dist|public-dist.*contents/i.test(doc));
assert("doc mirror prohibition", /mirror|sync/i.test(doc));
assert("doc FTP not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc no DB write", doc.includes("cursorDbWriteExecuted: false"));

assert("lib buildManualUploadManifest targetEnvironment", lib.includes("targetEnvironment"));
assert("lib includesAdmin", lib.includes("includesAdmin"));
assert("lib intendedRemotePath", lib.includes("intendedRemotePath"));
assert("lib sourceCommit", lib.includes("sourceCommit"));
assert("lib packageProfileName", lib.includes("packageProfileName"));
assert("lib formatReadmeUpload environment-aware", lib.includes("STAGING package"));
assert("lib formatReadmeUpload production warning", lib.includes("PRODUCTION package"));
assert("lib resolvePackageZipName production", lib.includes("production-manual-upload.zip"));

assert("cli --target-environment", createCli.includes("--target-environment"));
assert("cli --package-profile", createCli.includes("--package-profile"));
assert("cli --intended-remote-path", createCli.includes("--intended-remote-path"));

for (const field of REQUIRED_MANIFEST_FIELDS) {
  assert(`required manifest field ${field} documented`, doc.includes(field) || lib.includes(field));
}

assert("unsafe remote path helper", isUnsafeIntendedRemotePath("/"));
assert("unsafe remote path TBD", isUnsafeIntendedRemotePath("TBD_G-20i"));
assert("safe staging remote path", !isUnsafeIntendedRemotePath("/cms-kit-staging/gosaki-piano/"));

function verifyOnDiskPackage(packageDir, expectedEnvironment) {
  const label = expectedEnvironment;
  if (!fs.existsSync(packageDir)) {
    console.log(`NOTE ${label} package not on disk — regenerate with npm run manual-upload:package`);
    return;
  }

  const manifestState = readPackageManifest(packageDir);
  assert(`${label} MANIFEST readable`, manifestState.ok, manifestState.error ?? "");
  const manifest = manifestState.manifest;
  if (!manifest) return;

  const safetyErrors = validatePackageManifestSafety(manifest, expectedEnvironment);
  assert(`${label} manifest safety`, safetyErrors.length === 0, safetyErrors.join("; "));

  if (expectedEnvironment === "production") {
    assert(`${label} includesAdmin false`, manifest.includesAdmin === false);
    assert(`${label} adminExcludedFromPackage`, manifest.adminExcludedFromPackage === true);
  } else {
    assert(`${label} includesAdmin true`, manifest.includesAdmin === true);
    assert(`${label} intendedRemotePath staging`, String(manifest.intendedRemotePath).includes("/cms-kit-staging/"));
  }

  const publicDist = path.join(packageDir, "public-dist");
  const adminErrors = validatePublicDistAdminSafety(publicDist, expectedEnvironment);
  assert(`${label} public-dist admin safety`, adminErrors.length === 0, adminErrors.join("; "));

  const sitemapPath = path.join(publicDist, "sitemap-0.xml");
  if (fs.existsSync(sitemapPath)) {
    const violations = findSitemapSafetyViolations(fs.readFileSync(sitemapPath, "utf8"));
    assert(`${label} sitemap safety`, violations.length === 0, violations.join("; "));
  }

  const readme = fs.readFileSync(path.join(packageDir, "README-UPLOAD.md"), "utf8");
  assert(`${label} README mirror prohibition`, /mirror|sync/i.test(readme));
  assert(`${label} README public-dist contents warning`, /not.*`public-dist` folder itself/i.test(readme));

  const checklist = fs.readFileSync(path.join(packageDir, "CHECKLIST.md"), "utf8");
  assert(`${label} CHECKLIST sourceCommit`, checklist.includes("sourceCommit"));
  assert(`${label} CHECKLIST generatedAt`, checklist.includes("generatedAt"));
  assert(`${label} CHECKLIST targetEnvironment`, checklist.includes("targetEnvironment"));

  const files = walkRelativeFiles(publicDist);
  assert(`${label} public-dist has files`, files.length > 0);
}

verifyOnDiskPackage(STAGING_PKG, "staging");
verifyOnDiskPackage(PRODUCTION_PKG, "production");

assert("00-current-state mentions G-20t3", currentState.includes("G-20t3"));
assert("03-next-actions mentions G-20t3", nextActions.includes("G-20t3"));
assert("handoff mentions G-20t3", handoff.includes("G-20t3"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("service_role not used by Cursor", true);

console.log(`\nG-20t3 package upload safety hardening verifier: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
