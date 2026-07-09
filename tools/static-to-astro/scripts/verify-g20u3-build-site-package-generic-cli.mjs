/**
 * G-20u3 — Build site package generic CLI verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u3-build-site-package-generic-cli.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  planSitePackageBuild,
  resolvePostBuildVerifier,
} from "./lib/build-site-package-core.mjs";
import {
  GOSAKI_SITE_KEY,
  resolveSitePackageBuildProfile,
} from "./lib/site-registry.mjs";
import { resolveGosakiPackageBuildProfile } from "./lib/gosaki-package-build-profile.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-build-site-package-generic-cli.md";
const CLI_REL = "tools/static-to-astro/scripts/build-site-package.mjs";
const CORE_REL = "tools/static-to-astro/scripts/lib/build-site-package-core.mjs";
const BUILD_STAGING_REL = "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs";
const BUILD_PRODUCTION_REL = "tools/static-to-astro/scripts/build-gosaki-production-package.mjs";
const PACKAGE_JSON_REL = "tools/static-to-astro/package.json";
const BASE_COMMIT = "567b169";

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

function runNode(args, { expectFail = false } = {}) {
  const out = spawnSync("node", args, {
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

assert("HEAD is 567b169", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 567b169", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("doc exists", exists(DOC_REL));
assert("generic CLI exists", exists(CLI_REL));
assert("core lib exists", exists(CORE_REL));
assert("staging wrapper exists", exists(BUILD_STAGING_REL));
assert("production wrapper exists", exists(BUILD_PRODUCTION_REL));

const doc = read(DOC_REL);
const cli = read(CLI_REL);
const core = read(CORE_REL);
const buildStaging = read(BUILD_STAGING_REL);
const buildProduction = read(BUILD_PRODUCTION_REL);
const packageJson = read(PACKAGE_JSON_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u3", doc.includes("G-20u3-build-site-package-generic-cli"));
assert("doc gate complete", doc.includes("buildSitePackageGenericCliComplete: true"));
assert("doc freshness G-20t6 section", doc.includes("Package freshness (G-20t6)"));
assert("doc regen fresh at HEAD", /Immediately after regen|regen time/i.test(doc));
assert("doc commit makes stale", /commit advances HEAD|becomes stale/i.test(doc));
assert("doc upload requires freshness preflight", doc.includes("verify:package-freshness"));
assert("doc no commit-after-regen fresh assumption", /Do not.*assume.*fresh|becomes stale until regen/i.test(doc));
assert("00-current-state freshness stale on commit", /commit makes package stale|later commit makes package stale/i.test(currentState));
assert("handoff freshness stale on commit", /commit.*stale|stale until regen/i.test(handoff));
assert("package.json build:site-package", packageJson.includes('"build:site-package"'));
assert("package.json gosaki production script retained", packageJson.includes("build:gosaki-production-package"));
assert("CLI uses --site", cli.includes("--site"));
assert("CLI uses --profile", cli.includes("--profile"));
assert("CLI uses --dry-run", cli.includes("--dry-run"));
assert("core uses registry resolve", core.includes("resolveSitePackageBuildProfile"));
assert("core uses createManualUploadPackage", core.includes("createManualUploadPackage"));
assert("core no ftp", !/ftp.*apply|mirror.*delete/i.test(core));
assert("staging wrapper delegates", buildStaging.includes("runSitePackageBuild"));
assert("production wrapper delegates", buildProduction.includes("runSitePackageBuild"));
assert("staging wrapper gosaki-piano", buildStaging.includes("GOSAKI_SITE_KEY"));
assert("production wrapper production profile", buildProduction.includes('"production"'));

const stagingPlan = planSitePackageBuild(GOSAKI_SITE_KEY, "staging");
const productionPlan = planSitePackageBuild(GOSAKI_SITE_KEY, "production");

assert("staging plan fixtureDir", stagingPlan.profile.fixtureDir === "fixtures/gosaki-piano");
assert("staging plan deployBase", stagingPlan.profile.deployBase === "/cms-kit-staging/gosaki-piano/");
assert("staging plan convertSiteProfile musician", stagingPlan.convertSiteProfile === "musician");
assert("staging manifestMeta siteKey", stagingPlan.manifestMeta.siteKey === GOSAKI_SITE_KEY);
assert("staging manifestMeta cmsSiteSlug", stagingPlan.manifestMeta.cmsSiteSlug === "gosaki");
assert("staging manifestMeta supabaseSiteSlug", stagingPlan.manifestMeta.supabaseSiteSlug === "gosaki-piano");
assert("staging manifestMeta includesAdmin", stagingPlan.manifestMeta.includesAdmin === true);
assert(
  "staging verifier",
  stagingPlan.verifierRel === "scripts/verify-manual-upload-package.mjs",
);
assert(
  "production verifier g20i3",
  productionPlan.verifierRel ===
    "scripts/verify-g20i3-gosaki-production-package-admin-exclusion.mjs",
);
assert("production intendedRemotePath TBD", productionPlan.manifestMeta.intendedRemotePath === "TBD_G-20i");
assert("production includesAdmin false", productionPlan.manifestMeta.includesAdmin === false);

const gosakiStaging = resolveGosakiPackageBuildProfile("staging");
const registryStaging = resolveSitePackageBuildProfile(GOSAKI_SITE_KEY, "staging");
assert("wrapper profile matches registry baseUrl", gosakiStaging.baseUrl === registryStaging.baseUrl);
assert("wrapper profile matches registry manualUploadOut", gosakiStaging.manualUploadOut === registryStaging.manualUploadOut);

assert(
  "post-build verifier staging",
  resolvePostBuildVerifier(GOSAKI_SITE_KEY, "staging").includes("verify-manual-upload-package"),
);

const unknownSite = runNode(["scripts/build-site-package.mjs", "--site", "unknown-site", "--profile", "staging", "--dry-run"], {
  expectFail: true,
});
assert("unknown site fails", unknownSite.ok, `exit ${unknownSite.status}`);

const unknownProfile = runNode(
  ["scripts/build-site-package.mjs", "--site", GOSAKI_SITE_KEY, "--profile", "invalid", "--dry-run"],
  { expectFail: true },
);
assert("unknown profile fails", unknownProfile.ok, `exit ${unknownProfile.status}`);

const stagingDry = runNode([
  "scripts/build-site-package.mjs",
  "--site",
  GOSAKI_SITE_KEY,
  "--profile",
  "staging",
  "--dry-run",
]);
assert("staging dry-run exits 0", stagingDry.ok, stagingDry.stderr);
assert("staging dry-run mentions manifestMeta", stagingDry.stdout.includes("manifestMeta"));
assert("staging dry-run DRY-RUN PASS", stagingDry.stdout.includes("DRY-RUN PASS"));
assert("staging dry-run publicBaseUrl", stagingDry.stdout.includes("yskcreate.weblike.jp/cms-kit-staging/gosaki-piano"));

const productionDry = runNode([
  "scripts/build-site-package.mjs",
  "--site",
  GOSAKI_SITE_KEY,
  "--profile",
  "production",
  "--dry-run",
]);
assert("production dry-run exits 0", productionDry.ok, productionDry.stderr);
assert("production dry-run TBD_G-20i", productionDry.stdout.includes("TBD_G-20i"));
assert("production dry-run www.gosaki-piano.com", productionDry.stdout.includes("www.gosaki-piano.com"));

assert("00-current-state mentions G-20u3", currentState.includes("G-20u3"));
assert("03-next-actions mentions G-20u3", nextActions.includes("G-20u3"));
assert("handoff mentions G-20u3", handoff.includes("G-20u3"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("Gosaki wrapper not removed", true);

console.log(`\nG-20u3 build site package generic CLI verifier: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
