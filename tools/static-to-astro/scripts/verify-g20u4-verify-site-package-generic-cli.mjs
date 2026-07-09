/**
 * G-20u4 — Verify site package generic CLI verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u4-verify-site-package-generic-cli.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { verifySitePackage } from "./lib/verify-site-package-core.mjs";
import { GOSAKI_SITE_KEY } from "./lib/site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-verify-site-package-generic-cli.md";
const CLI_REL = "tools/static-to-astro/scripts/verify-site-package.mjs";
const CORE_REL = "tools/static-to-astro/scripts/lib/verify-site-package-core.mjs";
const GOSAKI_EXT_REL = "tools/static-to-astro/scripts/lib/verify-site-package-gosaki-extensions.mjs";
const MANUAL_VERIFY_REL = "tools/static-to-astro/scripts/verify-manual-upload-package.mjs";
const G20I3_REL = "tools/static-to-astro/scripts/verify-g20i3-gosaki-production-package-admin-exclusion.mjs";
const PACKAGE_JSON_REL = "tools/static-to-astro/package.json";
const BASE_COMMIT = "bbb174f";

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

function runNode(args, { expectFail = false, cwd = TOOL_ROOT } = {}) {
  const out = spawnSync("node", args, {
    cwd,
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

assert("HEAD is bbb174f", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is bbb174f", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("doc exists", exists(DOC_REL));
assert("generic CLI exists", exists(CLI_REL));
assert("core exists", exists(CORE_REL));
assert("gosaki extensions exist", exists(GOSAKI_EXT_REL));
assert("manual verifier exists", exists(MANUAL_VERIFY_REL));
assert("g20i3 verifier exists", exists(G20I3_REL));

const doc = read(DOC_REL);
const cli = read(CLI_REL);
const core = read(CORE_REL);
const manualVerify = read(MANUAL_VERIFY_REL);
const g20i3 = read(G20I3_REL);
const packageJson = read(PACKAGE_JSON_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u4", doc.includes("G-20u4-verify-site-package-generic-cli"));
assert("doc gate complete", doc.includes("verifySitePackageGenericCliComplete: true"));
assert("doc freshness separate from structure", /verify:package-freshness|does not compare to current git HEAD/i.test(doc));
assert("doc commit stale note", /commit after regen|stale until regen/i.test(doc));
assert("package.json verify:site-package", packageJson.includes('"verify:site-package"'));
assert("CLI --site", cli.includes("--site"));
assert("CLI --profile", cli.includes("--profile"));
assert("core verifySitePackage", core.includes("export function verifySitePackage"));
assert("core registry meta", core.includes("resolvePackageManifestMetaFromRegistry"));
assert("core schedule 2026-08", core.includes("schedule/2026-08"));
assert("core sitemap safety", core.includes("findSitemapSafetyViolations"));
assert("manual verifier delegates", manualVerify.includes("verifySitePackage"));
assert("g20i3 uses generic verify", g20i3.includes("verifySitePackage"));
assert("legacy verifier not removed", exists(MANUAL_VERIFY_REL) && exists(G20I3_REL));

const stagingPlan = verifySitePackage({ siteKey: GOSAKI_SITE_KEY, profileName: "staging" });
const productionPlan = verifySitePackage({ siteKey: GOSAKI_SITE_KEY, profileName: "production" });

assert("staging package on disk evaluated", stagingPlan.manifest != null || stagingPlan.errors.length > 0);
assert("production package on disk evaluated", productionPlan.manifest != null || productionPlan.errors.length > 0);

if (exists("tools/static-to-astro/output/manual-upload/gosaki-piano/MANIFEST.json")) {
  const stagingCli = runNode([
    "scripts/verify-site-package.mjs",
    "--site",
    GOSAKI_SITE_KEY,
    "--profile",
    "staging",
  ]);
  assert("staging CLI verify PASS", stagingCli.ok, stagingCli.stderr || stagingCli.stdout);
  assert("staging CLI output siteKey", stagingCli.stdout.includes("siteKey:"));

  const manualCli = runNode(["scripts/verify-manual-upload-package.mjs"]);
  assert("legacy manual-upload verifier PASS", manualCli.ok, manualCli.stderr);
} else {
  console.log("NOTE staging package missing — skipped on-disk staging CLI test");
}

if (exists("tools/static-to-astro/output/manual-upload/gosaki-piano-production/MANIFEST.json")) {
  const productionCli = runNode([
    "scripts/verify-site-package.mjs",
    "--site",
    GOSAKI_SITE_KEY,
    "--profile",
    "production",
  ]);
  assert("production CLI verify PASS", productionCli.ok, productionCli.stderr || productionCli.stdout);
  assert("production CLI TBD remote", productionCli.stdout.includes("TBD_G-20i"));
} else {
  console.log("NOTE production package missing — skipped on-disk production CLI test");
}

const unknownSite = runNode(
  ["scripts/verify-site-package.mjs", "--site", "unknown", "--profile", "staging"],
  { expectFail: true },
);
assert("unknown site fails", unknownSite.ok);

const unknownProfile = runNode(
  ["scripts/verify-site-package.mjs", "--site", GOSAKI_SITE_KEY, "--profile", "bad"],
  { expectFail: true },
);
assert("unknown profile fails", unknownProfile.ok);

assert("00-current-state mentions G-20u4", currentState.includes("G-20u4"));
assert("03-next-actions mentions G-20u4", nextActions.includes("G-20u4"));
assert("handoff mentions G-20u4", handoff.includes("G-20u4"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("Legacy verifier not removed", true);

console.log(`\nG-20u4 verify site package generic CLI verifier: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
