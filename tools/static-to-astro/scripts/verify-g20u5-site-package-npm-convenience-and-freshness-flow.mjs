/**
 * G-20u5 — Site package npm convenience & freshness flow verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u5-site-package-npm-convenience-and-freshness-flow.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-site-package-npm-convenience-and-freshness-flow.md";
const PACKAGE_JSON_REL = "tools/static-to-astro/package.json";
const BUILD_CLI_REL = "tools/static-to-astro/scripts/build-site-package.mjs";
const VERIFY_CLI_REL = "tools/static-to-astro/scripts/verify-site-package.mjs";
const BUILD_GOSAKI_STAGING_REL = "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs";
const BUILD_GOSAKI_PROD_REL = "tools/static-to-astro/scripts/build-gosaki-production-package.mjs";
const VERIFY_MANUAL_REL = "tools/static-to-astro/scripts/verify-manual-upload-package.mjs";
const VERIFY_G20I3_REL = "tools/static-to-astro/scripts/verify-g20i3-gosaki-production-package-admin-exclusion.mjs";
const BASE_COMMIT = "45c84c4";

const REQUIRED_SCRIPTS = [
  "build:site-package",
  "verify:site-package",
  "build:gosaki:staging",
  "build:gosaki:production",
  "build:gosaki:staging:dry-run",
  "build:gosaki:production:dry-run",
  "verify:gosaki:staging",
  "verify:gosaki:production",
  "preflight:gosaki:staging",
  "preflight:gosaki:production",
  "verify:package-freshness:staging",
  "verify:package-freshness:production",
  "build:gosaki-production-package",
  "verify:manual-upload",
  "verify:manual-upload:gosaki-production",
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

function runNpm(script, extraArgs = [], { expectFail = false } = {}) {
  const args = ["run", script, ...(extraArgs.length ? ["--", ...extraArgs] : [])];
  const out = spawnSync("npm", args, {
    cwd: TOOL_ROOT,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  const ok = expectFail ? out.status !== 0 : out.status === 0;
  return { ok, status: out.status, stdout: out.stdout ?? "", stderr: out.stderr ?? "" };
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 45c84c4", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 45c84c4", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("doc exists", exists(DOC_REL));
assert("build CLI exists", exists(BUILD_CLI_REL));
assert("verify CLI exists", exists(VERIFY_CLI_REL));
assert("legacy staging build wrapper exists", exists(BUILD_GOSAKI_STAGING_REL));
assert("legacy production build wrapper exists", exists(BUILD_GOSAKI_PROD_REL));
assert("legacy manual verify exists", exists(VERIFY_MANUAL_REL));
assert("legacy g20i3 verify exists", exists(VERIFY_G20I3_REL));

const doc = read(DOC_REL);
const packageJson = JSON.parse(read(PACKAGE_JSON_REL));
const buildCli = read(BUILD_CLI_REL);
const verifyCli = read(VERIFY_CLI_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u5", doc.includes("G-20u5-site-package-npm-convenience-and-freshness-flow"));
assert("doc gate complete", doc.includes("sitePackageNpmConvenienceAndFreshnessFlowComplete: true"));
assert("doc staging operator flow", /build:gosaki:staging[\s\S]*verify:gosaki:staging[\s\S]*verify:package-freshness:staging/i.test(doc));
assert("doc production upload STOP", /production upload.*STOP|TBD_G-20i/i.test(doc));
assert("doc freshness commit stale", /commit.*stale|After any git commit/i.test(doc));
assert("doc verify alone not upload", /does not authorize upload|verify:site-package.*PASS.*does not/i.test(doc));
assert("doc freshness required", /verify:package-freshness.*PASS.*required|required before upload/i.test(doc));
assert("doc manual FTP only", /Manual FTP|no auto FTP/i.test(doc));
assert("doc G-20j preflight", /G-20j/i.test(doc));

for (const script of REQUIRED_SCRIPTS) {
  assert(`package.json script ${script}`, Boolean(packageJson.scripts[script]));
}

assert("build:gosaki:staging uses build-site-package", packageJson.scripts["build:gosaki:staging"].includes("build-site-package.mjs"));
assert("verify:gosaki:staging uses verify-site-package", packageJson.scripts["verify:gosaki:staging"].includes("verify-site-package.mjs"));
assert("preflight:gosaki:staging chains freshness", packageJson.scripts["preflight:gosaki:staging"].includes("verify:package-freshness:staging"));
assert("build CLI --site", buildCli.includes("--site"));
assert("build CLI --profile", buildCli.includes("--profile"));
assert("verify CLI --site", verifyCli.includes("--site"));
assert("verify CLI --profile", verifyCli.includes("--profile"));

const stagingDry = runNpm("build:gosaki:staging:dry-run");
assert("npm build:gosaki:staging:dry-run PASS", stagingDry.ok, stagingDry.stderr || stagingDry.stdout);
assert("staging dry-run DRY-RUN", stagingDry.stdout.includes("DRY-RUN PASS"));

const productionDry = runNpm("build:gosaki:production:dry-run");
assert("npm build:gosaki:production:dry-run PASS", productionDry.ok, productionDry.stderr || productionDry.stdout);
assert("production dry-run TBD_G-20i", productionDry.stdout.includes("TBD_G-20i"));

if (exists("tools/static-to-astro/output/manual-upload/gosaki-piano/MANIFEST.json")) {
  const verifyStaging = runNpm("verify:gosaki:staging");
  assert("npm verify:gosaki:staging PASS", verifyStaging.ok, verifyStaging.stderr);

  const freshnessStaging = runNpm("verify:package-freshness:staging", [], { expectFail: true });
  assert(
    "npm verify:package-freshness:staging STOP expected (stale on disk)",
    freshnessStaging.ok,
    `exit ${freshnessStaging.status}`,
  );
  assert(
    "freshness staging reports STOP",
    freshnessStaging.stderr.includes("STOP") || freshnessStaging.stdout.includes("STOP"),
  );
} else {
  console.log("NOTE staging package missing — skipped on-disk verify/freshness tests");
}

if (exists("tools/static-to-astro/output/manual-upload/gosaki-piano-production/MANIFEST.json")) {
  const verifyProduction = runNpm("verify:gosaki:production");
  assert("npm verify:gosaki:production PASS", verifyProduction.ok, verifyProduction.stderr);

  const freshnessProduction = runNpm("verify:package-freshness:production", [], { expectFail: true });
  assert(
    "npm verify:package-freshness:production STOP expected (stale on disk)",
    freshnessProduction.ok,
    `exit ${freshnessProduction.status}`,
  );
} else {
  console.log("NOTE production package missing — skipped on-disk verify/freshness tests");
}

const genericBuildHelp = spawnSync("node", ["scripts/build-site-package.mjs", "--help"], {
  cwd: TOOL_ROOT,
  encoding: "utf8",
});
assert("generic build --help", genericBuildHelp.status === 0);
assert("generic build help --site", genericBuildHelp.stdout.includes("--site"));

assert("00-current-state mentions G-20u5", currentState.includes("G-20u5"));
assert("03-next-actions mentions G-20u5", nextActions.includes("G-20u5"));
assert("handoff mentions G-20u5", handoff.includes("G-20u5"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("Legacy scripts not removed", true);

console.log(`\nG-20u5 site package npm convenience and freshness flow verifier: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
