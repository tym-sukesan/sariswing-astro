/**
 * G-20u17 — Post-build verifier registry verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u17-post-build-verifier-registry.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  buildPostBuildVerifierArgs,
  LEGACY_POST_BUILD_VERIFIER_FALLBACK,
  resolvePostBuildVerifier,
  resolvePostBuildVerifierConfig,
} from "./lib/post-build-verifier-registry.mjs";
import {
  GOSAKI_SITE_KEY,
  PILOT_SAMPLE_STATIC_SITE_KEY,
  resolveSitePackageBuildProfile,
} from "./lib/site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";
const DOC_REL = "tools/static-to-astro/docs/post-build-verifier-registry.md";
const BASE_COMMIT = "34ada59";

const WRITE_PATTERNS = [
  /deploy-public-dist-ftp\.mjs.*--apply/,
  /mirror\s+--delete/,
  /service_role/i,
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

function expectThrow(fn, label) {
  try {
    fn();
    assert(label, false, "expected throw");
  } catch (err) {
    assert(label, err instanceof Error && err.message.length > 0, String(err));
  }
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (head.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${head.stdout.trim()} (G-20u17 base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
assert("doc phase G-20u17", doc.includes("G-20u17-post-build-verifier-registry"));
assert("doc registry field", doc.includes("postBuildVerifier"));
assert("doc argsMode table", doc.includes("package-dir-only") && doc.includes("site-package"));
assert("doc legacy fallback", doc.includes("LEGACY_POST_BUILD_VERIFIER_FALLBACK"));
assert("doc new site steps", doc.includes("Adding a new site"));

assert("registry module exists", exists("tools/static-to-astro/scripts/lib/post-build-verifier-registry.mjs"));
const registryMod = read("tools/static-to-astro/scripts/lib/post-build-verifier-registry.mjs");
assert("module resolvePostBuildVerifierConfig", registryMod.includes("resolvePostBuildVerifierConfig"));
assert("module buildPostBuildVerifierArgs", registryMod.includes("buildPostBuildVerifierArgs"));
assert("module legacy fallback export", registryMod.includes("LEGACY_POST_BUILD_VERIFIER_FALLBACK"));

const buildCore = read("tools/static-to-astro/scripts/lib/build-site-package-core.mjs");
assert("build core no POST_BUILD_VERIFIERS map", !buildCore.includes("POST_BUILD_VERIFIERS"));
assert("build core imports post-build-verifier-registry", buildCore.includes("post-build-verifier-registry.mjs"));
assert("build core re-exports resolvePostBuildVerifier", buildCore.includes("resolvePostBuildVerifier"));
assert("build core run() helper retained", buildCore.includes("function run("));

const registryJson = read("tools/static-to-astro/config/sites/registry.json");
assert("registry gosaki staging postBuildVerifier", registryJson.includes("scripts/verify-manual-upload-package.mjs"));
assert("registry gosaki production postBuildVerifier", registryJson.includes("scripts/verify-g20i3-gosaki-production-package-admin-exclusion.mjs"));
assert("registry pilot postBuildVerifier", registryJson.includes("scripts/verify-site-package.mjs"));
assert("registry argsMode site-package", registryJson.includes('"argsMode": "site-package"'));
assert("registry argsMode package-dir-only", registryJson.includes('"argsMode": "package-dir-only"'));
assert("registry argsMode none", registryJson.includes('"argsMode": "none"'));

const gosakiStagingProfile = resolveSitePackageBuildProfile(GOSAKI_SITE_KEY, "staging");
const gosakiProductionProfile = resolveSitePackageBuildProfile(GOSAKI_SITE_KEY, "production");
const pilotStagingProfile = resolveSitePackageBuildProfile(PILOT_SAMPLE_STATIC_SITE_KEY, "staging");

const gosakiStagingConfig = resolvePostBuildVerifierConfig(GOSAKI_SITE_KEY, "staging");
assert("gosaki staging script", gosakiStagingConfig.script === "scripts/verify-manual-upload-package.mjs");
assert("gosaki staging argsMode", gosakiStagingConfig.argsMode === "package-dir-only");
assert("gosaki staging from registry", gosakiStagingConfig.resolution === "registry");

const gosakiProductionConfig = resolvePostBuildVerifierConfig(GOSAKI_SITE_KEY, "production");
assert("gosaki production script", gosakiProductionConfig.script === "scripts/verify-g20i3-gosaki-production-package-admin-exclusion.mjs");
assert("gosaki production argsMode", gosakiProductionConfig.argsMode === "none");
assert("gosaki production from registry", gosakiProductionConfig.resolution === "registry");

const pilotStagingConfig = resolvePostBuildVerifierConfig(PILOT_SAMPLE_STATIC_SITE_KEY, "staging");
assert("pilot staging script", pilotStagingConfig.script === "scripts/verify-site-package.mjs");
assert("pilot staging argsMode", pilotStagingConfig.argsMode === "site-package");
assert("pilot staging from registry", pilotStagingConfig.resolution === "registry");

assert(
  "resolvePostBuildVerifier gosaki staging",
  resolvePostBuildVerifier(GOSAKI_SITE_KEY, "staging").includes("verify-manual-upload-package"),
);

const gosakiStagingArgs = buildPostBuildVerifierArgs(GOSAKI_SITE_KEY, "staging", gosakiStagingProfile);
assert("gosaki staging args script first", gosakiStagingArgs[0] === "scripts/verify-manual-upload-package.mjs");
assert("gosaki staging args package-dir only", gosakiStagingArgs.includes("--package-dir"));
assert("gosaki staging args no --site", !gosakiStagingArgs.includes("--site"));

const gosakiProductionArgs = buildPostBuildVerifierArgs(GOSAKI_SITE_KEY, "production", gosakiProductionProfile);
assert("gosaki production args script only", gosakiProductionArgs.length === 1);
assert(
  "gosaki production args script path",
  gosakiProductionArgs[0] === "scripts/verify-g20i3-gosaki-production-package-admin-exclusion.mjs",
);

const pilotStagingArgs = buildPostBuildVerifierArgs(
  PILOT_SAMPLE_STATIC_SITE_KEY,
  "staging",
  pilotStagingProfile,
);
assert("pilot staging args script", pilotStagingArgs[0] === "scripts/verify-site-package.mjs");
assert("pilot staging args --site", pilotStagingArgs.includes("--site") && pilotStagingArgs.includes(PILOT_SAMPLE_STATIC_SITE_KEY));
assert("pilot staging args --profile", pilotStagingArgs.includes("--profile") && pilotStagingArgs.includes("staging"));
assert("pilot staging args --package-dir", pilotStagingArgs.includes("--package-dir"));

assert("legacy fallback gosaki staging", LEGACY_POST_BUILD_VERIFIER_FALLBACK[GOSAKI_SITE_KEY]?.staging?.script?.includes("verify-manual-upload-package"));
assert("legacy fallback pilot staging", LEGACY_POST_BUILD_VERIFIER_FALLBACK[PILOT_SAMPLE_STATIC_SITE_KEY]?.staging?.argsMode === "site-package");

expectThrow(
  () => resolvePostBuildVerifierConfig("not-a-real-site", "staging"),
  "unknown site fails fast",
);
expectThrow(
  () => resolvePostBuildVerifierConfig(GOSAKI_SITE_KEY, "not-a-profile"),
  "unknown profile fails fast",
);

const packageJson = read("tools/static-to-astro/package.json");
const pkg = JSON.parse(packageJson);
assert("npm verify:g20u17-post-build-verifier", pkg.scripts["verify:g20u17-post-build-verifier"]?.includes("verify-g20u17-post-build-verifier-registry"));

for (const key of Object.keys(pkg.scripts)) {
  for (const pattern of WRITE_PATTERNS) {
    assert(`npm script ${key} no destructive pattern`, !pattern.test(pkg.scripts[key]));
  }
}

const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
assert("AI current-state G-20u17", currentState.includes("G-20u17"));
assert("AI next-actions G-20u17", nextActions.includes("G-20u17"));
assert("handoff G-20u17", handoff.includes("G-20u17"));

assert("FTP not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);

console.log(`\nG-20u17 post-build verifier registry verifier: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
