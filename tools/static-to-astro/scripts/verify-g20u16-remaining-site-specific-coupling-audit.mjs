/**
 * G-20u16 — Remaining site-specific coupling audit verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u16-remaining-site-specific-coupling-audit.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { CURRENT_ACTIVE_VERIFIERS, HISTORICAL_VERIFIERS } from "./verify-current-active-regression-suite.mjs";
import { GOSAKI_SITE_KEY, PILOT_SAMPLE_STATIC_SITE_KEY } from "./lib/site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";
const DOC_REL = "tools/static-to-astro/docs/remaining-site-specific-coupling-audit.md";
const G20U1_DOC = "tools/static-to-astro/docs/gosaki-hardcode-generalization-audit.md";
const REGRESSION_DOC = "tools/static-to-astro/docs/current-active-regression-suite.md";
const BASE_COMMIT = "90f732d";

const NEXT_PHASE_IDS = ["G-20u17", "G-20u18", "G-20u19", "G-20u20", "G-20u21"];

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

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (head.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${head.stdout.trim()} (G-20u16 base ${BASE_COMMIT}) — non-blocking`);
}

assert("audit doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
assert("doc phase G-20u16", doc.includes("G-20u16-remaining-site-specific-coupling-audit"));
assert("doc classification A-E", doc.includes("**A**") && doc.includes("**E**"));
assert("doc G-20u1 delta section", doc.includes("G-20u1 → G-20u16 delta"));
assert("doc non-schedule Discography", doc.includes("### 4.5 Discography"));
assert("doc non-schedule About", doc.includes("### 4.6 About"));
assert("doc non-schedule Contact", doc.includes("### 4.7 Contact"));
assert("doc non-schedule Link", doc.includes("### 4.8 Link"));
assert("doc non-schedule YouTube", doc.includes("### 4.9 YouTube"));
assert("doc non-schedule Home/Footer", doc.includes("### 4.10 Home"));
assert("doc non-schedule Admin", doc.includes("### 4.11 Admin"));
assert("doc verifier vs implementation", doc.includes("Verifier vs implementation"));
assert("doc recommended order", doc.includes("Recommended order"));
assert("doc references current regression", doc.includes("verify:current-active-regression"));

for (const id of NEXT_PHASE_IDS) {
  assert(`doc next phase ${id}`, doc.includes(id));
}

assert("G-20u1 prior audit doc exists", exists(G20U1_DOC));
assert("regression suite doc exists", exists(REGRESSION_DOC));
assert("regression suite runner exists", exists("tools/static-to-astro/scripts/verify-current-active-regression-suite.mjs"));

assert("active verifier count 17", CURRENT_ACTIVE_VERIFIERS.length === 17);
assert("historical verifiers documented", HISTORICAL_VERIFIERS.length >= 4);
assert("historical excludes mega url-staging", HISTORICAL_VERIFIERS.some((v) => v.script.includes("verify-url-to-staging-pipeline")));

const registry = read("tools/static-to-astro/config/sites/registry.json");
assert("registry gosaki-piano", registry.includes('"gosaki-piano"'));
assert("registry pilot-sample-static", registry.includes('"pilot-sample-static"'));
assert("registry supabaseFeatures", registry.includes("supabaseFeatures"));

const hooksSrc = read("tools/static-to-astro/scripts/lib/site-generator-hooks.mjs");
assert("hooks registry resolveSiteGeneratorHooks", hooksSrc.includes("resolveSiteGeneratorHooks"));
assert("hooks gosaki factory retained", hooksSrc.includes("createGosakiPianoHookMethods"));
assert("hooks matchRegistryFixtureDir", hooksSrc.includes("matchRegistryFixtureDir"));
assert("hooks no isGosakiPianoFixture in matchFixture", !/matchFixture[\s\S]{0,80}isGosakiPianoFixture/.test(hooksSrc));
assert("fixture registry module exists", exists("tools/static-to-astro/scripts/lib/site-fixture-match.mjs"));

const buildCore = read("tools/static-to-astro/scripts/lib/build-site-package-core.mjs");
assert("build core post-build verifier registry import (G-20u17)", buildCore.includes("post-build-verifier-registry.mjs"));
assert("build core no hardcoded POST_BUILD_VERIFIERS", !buildCore.includes("POST_BUILD_VERIFIERS"));
assert("build core generic resolveSitePackageBuildProfile", buildCore.includes("resolveSitePackageBuildProfile"));
assert("registry postBuildVerifier field (G-20u17)", registry.includes("postBuildVerifier"));
assert("post-build verifier registry module exists", exists("tools/static-to-astro/scripts/lib/post-build-verifier-registry.mjs"));

const loadersSrc = read("tools/static-to-astro/scripts/lib/site-aware-supabase-loaders.mjs");
assert("loaders site-aware entry", loadersSrc.includes("loadSiteSupabaseDataForBuild"));
assert("loaders gosaki delegate retained", loadersSrc.includes("GOSAKI_SITE_KEY"));

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify:current-active-regression", packageJson.includes("verify:current-active-regression"));
assert("manual-upload:package legacy alias to gosaki staging", packageJson.includes('"manual-upload:package": "npm run manual-upload:package:gosaki:staging"'));
assert("manual-upload:package:gosaki:staging explicit site-key", packageJson.includes("manual-upload:package:gosaki:staging"));

const gosakiExt = read("tools/static-to-astro/scripts/lib/verify-site-package-gosaki-extensions.mjs");
assert("gosaki extensions schedule months", gosakiExt.includes("2026-06"));
assert("gosaki extensions discography strings", gosakiExt.includes("Like a Lover"));

for (const mod of [
  "gosaki-home-youtube-embed.mjs",
  "gosaki-contact-hubspot-embed.mjs",
  "gosaki-about-band-profiles.mjs",
  "gosaki-footer-social.mjs",
  "gosaki-staging-read-only-admin.mjs",
]) {
  assert(`gosaki module exists ${mod}`, exists(`tools/static-to-astro/scripts/lib/${mod}`));
}

assert("pilot noop in registry", registry.includes(PILOT_SAMPLE_STATIC_SITE_KEY));
assert("gosaki site key constant", GOSAKI_SITE_KEY === "gosaki-piano");

const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
assert("AI current-state G-20u16", currentState.includes("G-20u16"));
assert("AI next-actions G-20u16", nextActions.includes("G-20u16"));
assert("handoff G-20u16", handoff.includes("G-20u16"));

console.log(`\nG-20u16 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
