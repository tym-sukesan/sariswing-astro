/**
 * G-20u21 — Generic read-only admin flag verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u21-generic-read-only-admin-flag.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  GOSAKI_SITE_KEY,
  PILOT_SAMPLE_STATIC_SITE_KEY,
  TOOL_ROOT,
  resolvePackageAdminFlags,
  resolveSitePackageBuildProfile,
  resolvePackageManifestMetaFromRegistry,
} from "./lib/site-registry.mjs";
import {
  isCmsFeatureEnabled,
  resolveCmsFeatures,
} from "./lib/site-cms-features.mjs";
import {
  isCmsKitSitemapExcludedPath,
  shouldIncludePageInSitemap,
} from "./lib/sitemap-exclusions.mjs";
import { resolveSiteGeneratorHooks } from "./lib/site-generator-hooks.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";
const DOC_REL = "tools/static-to-astro/docs/generic-read-only-admin-flag.md";
const BASE_COMMIT = "7c0a939";

const WRITE_PATTERNS = [
  /\.insert\s*\(/,
  /\.update\s*\(/,
  /\.upsert\s*\(/,
  /\.delete\s*\(/,
  /service_role/i,
  /mirror\s+--delete/i,
  /lftp/i,
  /workflow_dispatch/i,
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

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (head.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${head.stdout.trim()} (G-20u21 base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
assert("doc phase G-20u21", doc.includes("G-20u21-generic-read-only-admin-flag"));
assert("doc includeReadOnlyAdmin", doc.includes("includeReadOnlyAdmin"));
assert("doc legacy alias", doc.includes("includeGosakiReadOnlyAdmin"));
assert("doc cmsFeatures readOnlyAdmin", doc.includes("readOnlyAdmin"));
assert("doc sitemap exclusion", doc.includes("sitemap") && doc.includes("/admin/"));
assert("doc production STOP", doc.includes("G-20j") || doc.includes("production upload"));
assert("doc no FTP", doc.includes("No FTP") || doc.includes("no FTP"));

assert("site-admin-features module", exists("tools/static-to-astro/scripts/lib/site-admin-features.mjs"));
const adminMod = read("tools/static-to-astro/scripts/lib/site-admin-features.mjs");
assert("resolvePackageAdminFlags export", adminMod.includes("resolvePackageAdminFlags"));
assert("resolveIncludeReadOnlyAdminOption export", adminMod.includes("resolveIncludeReadOnlyAdminOption"));
assert("legacy alias helper", adminMod.includes("withLegacyAdminFlagAliases"));

for (const pattern of WRITE_PATTERNS) {
  assert(`admin module no destructive pattern ${pattern}`, !pattern.test(adminMod));
}

const registry = JSON.parse(read("tools/static-to-astro/config/sites/registry.json"));
const gosakiStaging = registry.sites[GOSAKI_SITE_KEY].packageProfiles.staging;
const gosakiProduction = registry.sites[GOSAKI_SITE_KEY].packageProfiles.production;
const pilotStaging = registry.sites[PILOT_SAMPLE_STATIC_SITE_KEY].packageProfiles.staging;

assert("gosaki staging includeReadOnlyAdmin true", gosakiStaging.includeReadOnlyAdmin === true);
assert("gosaki staging includesAdmin true", gosakiStaging.includesAdmin === true);
assert("gosaki staging legacy alias true", gosakiStaging.includeGosakiReadOnlyAdmin === true);
assert("gosaki production includeReadOnlyAdmin false", gosakiProduction.includeReadOnlyAdmin === false);
assert("gosaki production includesAdmin false", gosakiProduction.includesAdmin === false);
assert("pilot staging includeReadOnlyAdmin false", pilotStaging.includeReadOnlyAdmin === false);
assert("pilot staging includesAdmin false", pilotStaging.includesAdmin === false);
assert("gosaki cmsFeatures readOnlyAdmin true", registry.sites[GOSAKI_SITE_KEY].cmsFeatures?.readOnlyAdmin === true);
assert("pilot cmsFeatures readOnlyAdmin false", registry.sites[PILOT_SAMPLE_STATIC_SITE_KEY].cmsFeatures?.readOnlyAdmin === false);

const gosakiStagingProfile = resolveSitePackageBuildProfile(GOSAKI_SITE_KEY, "staging");
const gosakiProductionProfile = resolveSitePackageBuildProfile(GOSAKI_SITE_KEY, "production");
const pilotStagingProfile = resolveSitePackageBuildProfile(PILOT_SAMPLE_STATIC_SITE_KEY, "staging");

assert("resolve staging includeReadOnlyAdmin true", gosakiStagingProfile.includeReadOnlyAdmin === true);
assert("resolve staging includesAdmin true", gosakiStagingProfile.includesAdmin === true);
assert("resolve staging legacy alias mirrors generic", gosakiStagingProfile.includeGosakiReadOnlyAdmin === gosakiStagingProfile.includeReadOnlyAdmin);
assert("resolve production includeReadOnlyAdmin false", gosakiProductionProfile.includeReadOnlyAdmin === false);
assert("resolve production includesAdmin false", gosakiProductionProfile.includesAdmin === false);
assert("resolve pilot includeReadOnlyAdmin false", pilotStagingProfile.includeReadOnlyAdmin === false);
assert("resolve pilot includesAdmin false", pilotStagingProfile.includesAdmin === false);

const stagingMeta = resolvePackageManifestMetaFromRegistry(GOSAKI_SITE_KEY, "staging");
const productionMeta = resolvePackageManifestMetaFromRegistry(GOSAKI_SITE_KEY, "production");
assert("manifest meta staging includesAdmin true", stagingMeta.includesAdmin === true);
assert("manifest meta production includesAdmin false", productionMeta.includesAdmin === false);

const directFlags = resolvePackageAdminFlags(GOSAKI_SITE_KEY, "staging", {
  packageOverlay: gosakiStaging,
});
assert("resolvePackageAdminFlags staging true", directFlags.includeReadOnlyAdmin === true && directFlags.includesAdmin === true);
const prodFlags = resolvePackageAdminFlags(GOSAKI_SITE_KEY, "production", {
  packageOverlay: gosakiProduction,
});
assert("resolvePackageAdminFlags production forced false", prodFlags.includeReadOnlyAdmin === false && prodFlags.includesAdmin === false);

const gosakiCms = resolveCmsFeatures(GOSAKI_SITE_KEY);
const pilotCms = resolveCmsFeatures(PILOT_SAMPLE_STATIC_SITE_KEY);
assert("gosaki readOnlyAdmin cms feature", gosakiCms.readOnlyAdmin === true);
assert("pilot readOnlyAdmin cms feature off", pilotCms.readOnlyAdmin === false);
assert("gosaki isCmsFeatureEnabled readOnlyAdmin", isCmsFeatureEnabled(GOSAKI_SITE_KEY, "readOnlyAdmin") === true);
assert("pilot isCmsFeatureEnabled readOnlyAdmin off", isCmsFeatureEnabled(PILOT_SAMPLE_STATIC_SITE_KEY, "readOnlyAdmin") === false);

const hooksSrc = read("tools/static-to-astro/scripts/lib/site-generator-hooks.mjs");
assert("hooks gated by readOnlyAdmin cms feature", hooksSrc.includes('isCmsFeatureEnabled(siteKey, "readOnlyAdmin"'));

const buildCore = read("tools/static-to-astro/scripts/lib/build-site-package-core.mjs");
assert("build core logs includeReadOnlyAdmin", buildCore.includes("includeReadOnlyAdmin:"));
assert("build core generic static-public flag", buildCore.includes("--include-read-only-admin"));

const staticPublicVerifier = read("tools/static-to-astro/scripts/lib/static-public-artifact-verifier.mjs");
assert("static-public uses resolveIncludeReadOnlyAdminOption", staticPublicVerifier.includes("resolveIncludeReadOnlyAdminOption"));

const manualPkg = read("tools/static-to-astro/scripts/lib/manual-upload-package.mjs");
assert("manual-upload manifest includesAdmin", manualPkg.includes("includesAdmin"));
assert("manual-upload includeReadOnlyAdmin", manualPkg.includes("includeReadOnlyAdmin"));

const verifyCore = read("tools/static-to-astro/scripts/lib/verify-site-package-core.mjs");
assert("verify core staging sitemap no admin", verifyCore.includes('sitemap must not include /admin/'));

assert("sitemap excludes /admin/", isCmsKitSitemapExcludedPath("/cms-kit-staging/gosaki-piano/admin/"));
assert("sitemap excludes admin subpath", isCmsKitSitemapExcludedPath("/admin/schedule/"));
assert(
  "shouldIncludePageInSitemap excludes admin URL",
  shouldIncludePageInSitemap("https://www.gosaki-piano.com/admin/") === false,
);
assert(
  "shouldIncludePageInSitemap allows schedule",
  shouldIncludePageInSitemap("https://www.gosaki-piano.com/schedule/2026-08/") === true,
);

const gosakiHooks = resolveSiteGeneratorHooks(GOSAKI_SITE_KEY, TOOL_ROOT);
const pilotHooks = resolveSiteGeneratorHooks(PILOT_SAMPLE_STATIC_SITE_KEY, TOOL_ROOT);
assert("gosaki hooks registered", typeof gosakiHooks.applyPostGenerate === "function");
assert("pilot hooks noop", typeof pilotHooks.applyPostGenerate === "function");

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify:g20u21", packageJson.includes("verify:g20u21-generic-read-only-admin-flag"));

const regression = read("tools/static-to-astro/scripts/verify-current-active-regression-suite.mjs");
assert("regression includes G-20u21", regression.includes("G-20u21"));

const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
assert("AI current-state G-20u21", currentState.includes("G-20u21"));
assert("AI next-actions G-20u21", nextActions.includes("G-20u21"));
assert("handoff G-20u21", handoff.includes("G-20u21"));

console.log(`\nG-20u21 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
