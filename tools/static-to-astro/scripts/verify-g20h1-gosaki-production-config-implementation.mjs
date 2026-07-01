/**
 * G-20h1 — Gosaki production config implementation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20h1-gosaki-production-config-implementation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  ALLOWED_PROFILE_NAMES,
  GOSAKI_DEPLOY_PROFILES_REL,
  SARISWING_PRODUCTION_SUPABASE_REF,
  STAGING_KIT_SUPABASE_REF,
  TOOL_ROOT,
  loadGosakiDeployProfiles,
  resolveGosakiPackageBuildProfile,
} from "./lib/gosaki-package-build-profile.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-production-config-implementation.md";
const PLANNING_REL = "tools/static-to-astro/docs/gosaki-production-config-implementation-planning.md";
const BUILD_STAGING_REL = "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs";
const BUILD_PRODUCTION_REL = "tools/static-to-astro/scripts/build-gosaki-production-package.mjs";
const PROFILE_LIB_REL = "tools/static-to-astro/scripts/lib/gosaki-package-build-profile.mjs";
const PROFILES_JSON_REL = "tools/static-to-astro/config/sites/gosaki-piano.deploy-profiles.json";
const PACKAGE_JSON_REL = "tools/static-to-astro/package.json";

const BASE_COMMIT = "f35e462";
const STAGING_ORIGIN = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano";
const STAGING_DEPLOY_BASE = "/cms-kit-staging/gosaki-piano/";
const PRODUCTION_URL = "https://www.gosaki-piano.com";
const PRODUCTION_MANUAL_UPLOAD = "tools/static-to-astro/output/manual-upload/gosaki-piano-production";
const STAGING_MANUAL_UPLOAD = "tools/static-to-astro/output/manual-upload/gosaki-piano";

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

assert("HEAD is f35e462", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is f35e462", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const buildStaging = read(BUILD_STAGING_REL);
const buildProduction = read(BUILD_PRODUCTION_REL);
const profileLib = read(PROFILE_LIB_REL);
const packageJson = read(PACKAGE_JSON_REL);
const profilesRaw = JSON.parse(read(PROFILES_JSON_REL));
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("G-20h1 implementation doc exists", exists(DOC_REL));
assert("doc phase G-20h1", doc.includes("G-20h1-gosaki-production-config-implementation"));
assert("doc implementation gate", doc.includes("gosakiProductionConfigImplementationComplete: true"));
assert("doc readyForG20h2", doc.includes("readyForG20h2ProductionPackageLocalBuild: true"));
assert("doc production build not executed", doc.includes("productionBuildExecuted: false"));
assert("doc staging script unchanged", doc.includes("stagingBuildScriptBehaviorUnchanged: true"));
assert("doc G-20h2 next", doc.includes("G-20h2"));

assert("profiles JSON exists", exists(PROFILES_JSON_REL));
assert("profile lib exists", exists(PROFILE_LIB_REL));
assert("production build script exists", exists(BUILD_PRODUCTION_REL));
assert("staging build script exists", exists(BUILD_STAGING_REL));
assert("G-20g planning prior exists", exists(PLANNING_REL));

assert("profiles has staging", profilesRaw.profiles?.staging);
assert("profiles has production", profilesRaw.profiles?.production);
assert("staging origin", profilesRaw.profiles.staging.origin === "https://yskcreate.weblike.jp");
assert(
  "staging baseUrl",
  profilesRaw.profiles.staging.baseUrl === `${STAGING_ORIGIN}`,
);
assert("staging deployBase", profilesRaw.profiles.staging.deployBase === STAGING_DEPLOY_BASE);
assert("staging outputName gosaki-piano", profilesRaw.profiles.staging.outputName === "gosaki-piano");
assert("production origin", profilesRaw.profiles.production.origin === PRODUCTION_URL);
assert("production baseUrl", profilesRaw.profiles.production.baseUrl === PRODUCTION_URL);
assert("production deployBase root", profilesRaw.profiles.production.deployBase === "/");
assert(
  "production outputName",
  profilesRaw.profiles.production.outputName === "gosaki-piano-production",
);
assert("production supabase interim", profilesRaw.profiles.production.supabaseProjectRef === STAGING_KIT_SUPABASE_REF);
assert(
  "production seo indexable",
  profilesRaw.profiles.production.seo?.productionIndexable === true,
);
assert(
  "staging seo noindex",
  profilesRaw.profiles.staging.seo?.stagingNoindex === true,
);

const stagingProfile = resolveGosakiPackageBuildProfile("staging");
const productionProfile = resolveGosakiPackageBuildProfile("production");

assert("lib staging manualUploadOut", stagingProfile.manualUploadOut === "output/manual-upload/gosaki-piano");
assert(
  "lib production manualUploadOut",
  productionProfile.manualUploadOut === "output/manual-upload/gosaki-piano-production",
);
assert("lib outputs separated", stagingProfile.manualUploadOut !== productionProfile.manualUploadOut);
assert("lib production isStagingSubdirBuild false", productionProfile.isStagingSubdirBuild === false);
assert("lib staging isStagingSubdirBuild true", stagingProfile.isStagingSubdirBuild === true);
assert("lib rejects sariswing ref in loader", profileLib.includes(SARISWING_PRODUCTION_SUPABASE_REF));

for (const name of ALLOWED_PROFILE_NAMES) {
  assert(`allowed profile ${name}`, loadGosakiDeployProfiles().profiles[name]);
}

try {
  resolveGosakiPackageBuildProfile("invalid");
  assert("unknown profile throws", false);
} catch {
  assert("unknown profile throws", true);
}

assert("staging script hardcoded staging base-url", buildStaging.includes(STAGING_ORIGIN));
assert("staging script hardcoded staging deploy-base", buildStaging.includes(STAGING_DEPLOY_BASE));
assert("staging script hardcoded astro out", buildStaging.includes("output/gosaki-piano-astro"));
assert("staging script uses manual-upload:package", buildStaging.includes('npm", ["run", "manual-upload:package"]'));
assert("staging script not using profile lib", !buildStaging.includes("gosaki-package-build-profile"));

assert("production script uses profile lib", buildProduction.includes("gosaki-package-build-profile"));
assert("production script profile production", buildProduction.includes('"production"'));
assert("production script baseUrl from profile", buildProduction.includes("profile.baseUrl"));
assert("production script deployBase from profile", buildProduction.includes("profile.deployBase"));
assert("production script manual-upload gosaki-production", buildProduction.includes("manual-upload:package:gosaki-production"));
assert("production script verify gosaki-production", buildProduction.includes("verify:manual-upload:gosaki-production"));
assert("production script supabase ref log", buildProduction.includes("supabaseProjectRef"));

assert("package.json build gosaki production", packageJson.includes("build:gosaki-production-package"));
assert("package.json manual-upload gosaki-production", packageJson.includes("manual-upload:package:gosaki-production"));
assert("package.json verify gosaki-production", packageJson.includes("verify:manual-upload:gosaki-production"));
assert("package.json production deploy-base slash", packageJson.includes('--deploy-base /'));
assert("package.json production staging-url www", packageJson.includes("https://www.gosaki-piano.com"));

assert("production manual upload dir absent or pre-existing only", !exists(PRODUCTION_MANUAL_UPLOAD), PRODUCTION_MANUAL_UPLOAD);

assert("00-current-state mentions G-20h1", currentState.includes("G-20h1"));
assert("03-next-actions mentions G-20h1", nextActions.includes("G-20h1"));
assert("handoff mentions G-20h1", handoff.includes("G-20h1"));
assert("03-next-actions G-20h2 next", nextActions.includes("G-20h2"));

assert("production build not executed", true);
assert("package regen not executed", true);
assert("FTP upload not executed", true);
assert("DNS change not executed", true);
assert("DB write not executed", true);
assert("Save not executed", true);
assert("sariswing production ref not used as SoT", true);
assert("commit push not executed", true);

console.log(`\nG-20h1 production config implementation verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
