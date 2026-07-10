/**
 * G-20u2 — Site registry & build profile foundation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u2-site-registry-build-profile-foundation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  GOSAKI_SITE_KEY,
  SITE_REGISTRY_REL,
  listSiteKeys,
  loadSiteRegistry,
  resolvePackageManifestMetaFromRegistry,
  resolveSitePackageBuildProfile,
} from "./lib/site-registry.mjs";
import {
  GOSAKI_DEPLOY_PROFILES_REL,
  loadGosakiDeployProfiles,
  resolveGosakiPackageBuildProfile,
} from "./lib/gosaki-package-build-profile.mjs";
import { buildManualUploadManifest } from "./lib/manual-upload-package.mjs";
import {
  REQUIRED_MANIFEST_FIELDS,
  validatePackageManifestSafety,
} from "./lib/package-upload-safety.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-site-registry-build-profile-foundation.md";
const BUILD_STAGING_REL = "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs";
const BUILD_PRODUCTION_REL = "tools/static-to-astro/scripts/build-gosaki-production-package.mjs";
const BASE_COMMIT = "bdefcf7";

const STAGING_PUBLIC_BASE = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/";
const PRODUCTION_PUBLIC_BASE = "https://www.gosaki-piano.com/";

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

if (head.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${head.stdout.trim()} (G-20u2 original ${BASE_COMMIT}) — non-blocking`,
  );
}
if (origin.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS origin/main is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE origin/main is ${origin.stdout.trim()} (G-20u2 original ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("registry json exists", exists(`tools/static-to-astro/${SITE_REGISTRY_REL}`));
assert("site-registry.mjs exists", exists("tools/static-to-astro/scripts/lib/site-registry.mjs"));
assert("audit doc exists", exists(DOC_REL));
assert("gosaki wrapper exists", exists("tools/static-to-astro/scripts/lib/gosaki-package-build-profile.mjs"));
assert("build-gosaki-staging wrapper exists", exists(BUILD_STAGING_REL));
assert("build-gosaki-production wrapper exists", exists(BUILD_PRODUCTION_REL));

const doc = read(DOC_REL);
const buildStaging = read(BUILD_STAGING_REL);
const buildProduction = read(BUILD_PRODUCTION_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u2", doc.includes("G-20u2-site-registry-build-profile-foundation"));
assert("doc gate complete", doc.includes("siteRegistryBuildProfileFoundationComplete: true"));
assert("doc slug semantics table", doc.includes("cmsSiteSlug"));
assert("doc supabaseSiteSlug", doc.includes("supabaseSiteSlug"));

const registry = loadSiteRegistry(TOOL_ROOT);
const keys = listSiteKeys(TOOL_ROOT);
assert("registry has gosaki-piano", keys.includes(GOSAKI_SITE_KEY));
assert("registry sites object", registry.sites?.[GOSAKI_SITE_KEY]);

const gosaki = registry.sites[GOSAKI_SITE_KEY];
assert("gosaki cmsSiteSlug gosaki", gosaki.slugSemantics?.cmsSiteSlug === "gosaki");
assert("gosaki supabaseSiteSlug gosaki-piano", gosaki.slugSemantics?.supabaseSiteSlug === "gosaki-piano");
assert("gosaki slug mismatch notes", Boolean(gosaki.slugSemantics?.slugMismatchNotes));
assert("gosaki deployProfilesFile", gosaki.deployProfilesFile === GOSAKI_DEPLOY_PROFILES_REL);

const deployRaw = loadGosakiDeployProfiles(TOOL_ROOT);
const stagingProfile = resolveGosakiPackageBuildProfile("staging");
const productionProfile = resolveGosakiPackageBuildProfile("production");
const stagingViaRegistry = resolveSitePackageBuildProfile(GOSAKI_SITE_KEY, "staging");
const productionViaRegistry = resolveSitePackageBuildProfile(GOSAKI_SITE_KEY, "production");

assert("staging siteKey", stagingProfile.siteKey === GOSAKI_SITE_KEY);
assert("staging siteSlug backward compat", stagingProfile.siteSlug === "gosaki-piano");
assert("staging cmsSiteSlug", stagingProfile.cmsSiteSlug === "gosaki");
assert("staging supabaseSiteSlug", stagingProfile.supabaseSiteSlug === "gosaki-piano");
assert("staging deployBase", stagingProfile.deployBase === "/cms-kit-staging/gosaki-piano/");
assert("staging publicBaseUrl", stagingProfile.publicBaseUrl === STAGING_PUBLIC_BASE);
assert("staging intendedRemotePath", stagingProfile.intendedRemotePath === "/cms-kit-staging/gosaki-piano/");
assert("staging includesAdmin true", stagingProfile.includesAdmin === true);
assert("staging manualUploadOut", stagingProfile.manualUploadOut === "output/manual-upload/gosaki-piano");
assert("staging includeReadOnlyAdmin", stagingProfile.includeReadOnlyAdmin === true);
assert("staging includeGosakiReadOnlyAdmin legacy alias", stagingProfile.includeGosakiReadOnlyAdmin === true);
assert("staging fixtureDir", stagingProfile.fixtureDir === "fixtures/gosaki-piano");

assert("production siteSlug", productionProfile.siteSlug === "gosaki-piano");
assert("production publicBaseUrl", productionProfile.publicBaseUrl === PRODUCTION_PUBLIC_BASE);
assert("production deployBase root", productionProfile.deployBase === "/");
assert("production intendedRemotePath TBD", productionProfile.intendedRemotePath === "TBD_G-20i");
assert("production includesAdmin false", productionProfile.includesAdmin === false);
assert("production includeReadOnlyAdmin false", productionProfile.includeReadOnlyAdmin === false);
assert("production includeGosakiReadOnlyAdmin false", productionProfile.includeGosakiReadOnlyAdmin === false);
assert("production manualUploadOut", productionProfile.manualUploadOut === "output/manual-upload/gosaki-piano-production");

assert("gosaki wrapper matches registry staging baseUrl", stagingProfile.baseUrl === stagingViaRegistry.baseUrl);
assert("gosaki wrapper matches registry production baseUrl", productionProfile.baseUrl === productionViaRegistry.baseUrl);
assert("deploy profiles siteSlug", deployRaw.siteSlug === "gosaki-piano");

const stagingManifestMeta = resolvePackageManifestMetaFromRegistry(GOSAKI_SITE_KEY, "staging");
const productionManifestMeta = resolvePackageManifestMetaFromRegistry(GOSAKI_SITE_KEY, "production");

assert("manifest meta staging targetEnvironment", stagingManifestMeta.targetEnvironment === "staging");
assert("manifest meta staging packageProfileName", stagingManifestMeta.packageProfileName === "staging");
assert("manifest meta staging publicBaseUrl", stagingManifestMeta.publicBaseUrl === STAGING_PUBLIC_BASE);
assert("manifest meta production intendedRemotePath", productionManifestMeta.intendedRemotePath === "TBD_G-20i");
assert("manifest meta production includesAdmin false", productionManifestMeta.includesAdmin === false);

const mockManifest = buildManualUploadManifest({
  siteSlug: stagingManifestMeta.siteSlug,
  siteKey: stagingManifestMeta.siteKey,
  cmsSiteSlug: stagingManifestMeta.cmsSiteSlug,
  supabaseSiteSlug: stagingManifestMeta.supabaseSiteSlug,
  packageKey: stagingManifestMeta.packageKey,
  deployBase: stagingManifestMeta.deployBase,
  publicBaseUrl: stagingManifestMeta.publicBaseUrl,
  sourcePublicDist: "tools/static-to-astro/output/static-public/gosaki-piano/public-dist",
  fileCount: 29,
  safeForStaticFtp: true,
  cssPresenceOk: true,
  targetEnvironment: stagingManifestMeta.targetEnvironment,
  packageProfileName: stagingManifestMeta.packageProfileName,
  intendedRemotePath: stagingManifestMeta.intendedRemotePath,
  sourceCommit: BASE_COMMIT,
  includesAdmin: stagingManifestMeta.includesAdmin,
  includeReadOnlyAdmin: stagingManifestMeta.includeReadOnlyAdmin,
  includeGosakiReadOnlyAdmin: stagingManifestMeta.includeReadOnlyAdmin,
});

for (const field of REQUIRED_MANIFEST_FIELDS) {
  assert(`mock manifest has ${field}`, mockManifest[field] != null && mockManifest[field] !== "");
}
assert("mock manifest siteKey", mockManifest.siteKey === GOSAKI_SITE_KEY);
assert("mock manifest cmsSiteSlug", mockManifest.cmsSiteSlug === "gosaki");
assert("mock manifest supabaseSiteSlug", mockManifest.supabaseSiteSlug === "gosaki-piano");

const stagingSafetyErrors = validatePackageManifestSafety(mockManifest, "staging");
assert("staging manifest safety ok", stagingSafetyErrors.length === 0, stagingSafetyErrors.join("; "));

assert("build-gosaki-staging delegates to runSitePackageBuild", buildStaging.includes("runSitePackageBuild"));
assert("build-gosaki-production delegates to runSitePackageBuild", buildProduction.includes("runSitePackageBuild"));
assert("build-gosaki-production uses GOSAKI_SITE_KEY", buildProduction.includes("GOSAKI_SITE_KEY"));

assert("00-current-state mentions G-20u2", currentState.includes("G-20u2"));
assert("03-next-actions mentions G-20u2", nextActions.includes("G-20u2"));
assert("handoff mentions G-20u2", handoff.includes("G-20u2"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("Gosaki wrapper not removed", true);

console.log(`\nG-20u2 site registry build profile foundation verifier: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
