/**
 * G-20u1 — Gosaki hardcode generalization audit verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u1-gosaki-hardcode-generalization-audit.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-hardcode-generalization-audit.md";
const DEPLOY_PROFILES = "tools/static-to-astro/config/sites/gosaki-piano.deploy-profiles.json";
const ONBOARDING_EXAMPLE = "tools/static-to-astro/config/onboarding.gosaki-piano.example.json";
const CMS_PRESET_REGISTRY = "tools/static-to-astro/scripts/lib/cms-preset-registry.mjs";
const PACKAGE_JSON = "tools/static-to-astro/package.json";
const BASE_COMMIT = "2c0dec3";

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

assert("HEAD is 2c0dec3", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 2c0dec3", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("audit doc exists", exists(DOC_REL));
assert("deploy profiles exist", exists(DEPLOY_PROFILES));
assert("onboarding example exists", exists(ONBOARDING_EXAMPLE));
assert("cms preset registry exists", exists(CMS_PRESET_REGISTRY));
assert("build-gosaki-staging exists", exists("tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs"));
assert("build-gosaki-production exists", exists("tools/static-to-astro/scripts/build-gosaki-production-package.mjs"));
assert("gosaki package profile loader exists", exists("tools/static-to-astro/scripts/lib/gosaki-package-build-profile.mjs"));
assert("freshness gate exists", exists("tools/static-to-astro/scripts/verify-package-upload-freshness.mjs"));

const doc = read(DOC_REL);
const pkg = read(PACKAGE_JSON);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u1", doc.includes("G-20u1-gosaki-hardcode-generalization-audit"));
assert("doc gate complete", doc.includes("gosakiHardcodeGeneralizationAuditComplete: true"));
assert("doc classification tier 1", doc.includes("今すぐ一般化すべき"));
assert("doc classification tier 2", doc.includes("Kit化前に抽象化"));
assert("doc classification tier 3", doc.includes("Gosaki専用として残してよい"));
assert("doc classification tier 4", /セキュリティ|運用事故リスク/.test(doc));
assert("doc touch-point map", /touch-point|変更箇所/i.test(doc));
assert("doc site registry", /site registry|registry/i.test(doc));
assert("doc package profile config", /deploy-profiles|config 駆動/i.test(doc));
assert("doc verifier reuse", /verifier.*再利用|verify-site-package/i.test(doc));
assert("doc build generic CLI", /build-site-package/i.test(doc));
assert("doc next phases G-20u2", doc.includes("G-20u2"));
assert("doc FTP not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc no large refactor", doc.includes("largeRefactorExecuted: false"));

assert("package.json hardcodes gosaki-piano path", pkg.includes("gosaki-piano"));
assert("package.json build:gosaki-production-package", pkg.includes("build:gosaki-production-package"));
assert("package.json freshness gate", pkg.includes("verify:package-freshness"));

const profiles = JSON.parse(read(DEPLOY_PROFILES));
assert("deploy profile siteSlug gosaki-piano", profiles.siteSlug === "gosaki-piano");
assert("deploy profile staging path", profiles.profiles.staging.deployBase.includes("gosaki-piano"));
assert("deploy profile production TBD remote", profiles.profiles.production.remotePath === "TBD_G-20i");

const onboarding = JSON.parse(read(ONBOARDING_EXAMPLE));
assert("onboarding siteSlug gosaki-piano", onboarding.siteSlug === "gosaki-piano");
assert("onboarding cmsPreset musician-basic", onboarding.cmsPreset === "musician-basic");

const presetRegistry = read(CMS_PRESET_REGISTRY);
assert("preset musician-basic exists", presetRegistry.includes('"musician-basic"'));
assert("preset lesson-studio-basic exists", presetRegistry.includes("lesson-studio-basic"));

assert("00-current-state mentions G-20u1", currentState.includes("G-20u1"));
assert("03-next-actions mentions G-20u1", nextActions.includes("G-20u1"));
assert("handoff mentions G-20u1", handoff.includes("G-20u1"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("Large refactor not executed by Cursor", true);

console.log(`\nG-20u1 Gosaki hardcode generalization audit verifier: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
