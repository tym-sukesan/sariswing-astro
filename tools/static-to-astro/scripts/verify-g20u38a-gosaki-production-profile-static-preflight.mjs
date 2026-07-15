/**
 * G-20u38a Gosaki production profile static preflight verifier.
 * Read-only preflight result record — no build / package / FTP.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  resolveSitePackageBuildProfile,
  resolvePackageManifestMetaFromRegistry,
  SARISWING_PRODUCTION_SUPABASE_REF,
  STAGING_KIT_SUPABASE_REF,
} from "./lib/site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-production-profile-static-preflight-result.md";
const PLAN_DOC_REL =
  "tools/static-to-astro/docs/gosaki-production-package-prep-planning.md";
const DEPLOY_PROFILES_REL =
  "tools/static-to-astro/config/sites/gosaki-piano.deploy-profiles.json";
const REGISTRY_REL = "tools/static-to-astro/config/sites/registry.json";
const PHASE = "G-20u38a-gosaki-production-profile-static-preflight";
const GATE = "gosakiProductionProfileStaticPreflightCompleted: true";
const NEXT = "G-20u38b-gosaki-production-package-generation-at-head";
const PREFLIGHT_HEAD = "51ae3fe";
const STG_SOURCE_COMMIT = "e3616a3ab0fbda280d75278b0a6275205ae74763";
const PROD_URL = "https://www.gosaki-piano.com";
const PROD_PUBLIC_BASE = "https://www.gosaki-piano.com/";
const TBD_REMOTE = "TBD_G-20i";

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

function headShort() {
  return spawnSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  })
    .stdout.trim();
}

assert("preflight result doc exists", exists(DOC_REL));
assert("G-20u38 planning doc exists", exists(PLAN_DOC_REL));
assert("deploy profiles exists", exists(DEPLOY_PROFILES_REL));
assert("site registry exists", exists(REGISTRY_REL));

const doc = read(DOC_REL);
const planDoc = read(PLAN_DOC_REL);
const deployProfiles = JSON.parse(read(DEPLOY_PROFILES_REL));
const registry = JSON.parse(read(REGISTRY_REL));
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

const productionDeploy = deployProfiles.profiles.production;
const productionRegistry =
  registry.sites["gosaki-piano"].packageProfiles.production;

let resolvedProfile;
let resolvedManifest;
try {
  resolvedProfile = resolveSitePackageBuildProfile("gosaki-piano", "production");
  resolvedManifest = resolvePackageManifestMetaFromRegistry(
    "gosaki-piano",
    "production",
  );
  assert("resolveSitePackageBuildProfile production", true);
} catch (err) {
  assert("resolveSitePackageBuildProfile production", false, String(err.message));
  resolvedProfile = {};
  resolvedManifest = {};
}

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "no package generation",
  /Package generation.*\*\*no\*\*|packageGenerationExecuted:\s*false/i.test(doc),
);
assert(
  "no implementation",
  /Implementation.*\*\*no\*\*|implementationExecuted:\s*false/i.test(doc),
);
assert(
  "no FTP upload",
  /FTP.*\*\*no\*\*|ftpUploadExecuted:\s*false/i.test(doc),
);
assert(
  "service_role unused",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(doc),
);
assert("preflight HEAD 51ae3fe", doc.includes(PREFLIGHT_HEAD));
assert(
  "ADMIN_EXCLUDED_IN_PRODUCTION_PROFILE true",
  /ADMIN_EXCLUDED_IN_PRODUCTION_PROFILE:\s*true|adminExcludedInProductionProfile:\s*true/i.test(
    doc,
  ),
);
assert(
  "PRODUCTION_ROBOTS_READY true",
  /PRODUCTION_ROBOTS_READY:\s*true|productionRobotsReady:\s*true/i.test(doc),
);
assert(
  "PRODUCTION_SITEMAP_READY true",
  /PRODUCTION_SITEMAP_READY:\s*true|productionSitemapReady:\s*true/i.test(doc),
);
assert(
  "PRODUCTION_SEO_URL_READY true",
  /PRODUCTION_SEO_URL_READY:\s*true|productionSeoUrlReady:\s*true/i.test(doc),
);
assert(
  "PRODUCTION_PACKAGE_GENERATION_READY true",
  /PRODUCTION_PACKAGE_GENERATION_READY:\s*true|productionPackageGenerationReady:\s*true/i.test(
    doc,
  ),
);
assert(
  "PRODUCTION_UPLOAD_READY false",
  /PRODUCTION_UPLOAD_READY:\s*false|productionUploadReady:\s*false/i.test(doc),
);
assert(
  "PUBLIC_READY CONDITIONAL",
  /PUBLIC_READY:\s*CONDITIONAL|publicReady:\s*conditional/i.test(doc),
);
assert(
  "P0_STOP_FOR_GENERATION false",
  /P0_STOP_FOR_GENERATION:\s*false|p0StopForGeneration:\s*false/i.test(doc),
);
assert(`next ${NEXT}`, doc.includes(NEXT));
assert(
  "e3616a3 not for production",
  doc.includes(STG_SOURCE_COMMIT) &&
    /must not|not.*production|Do not/i.test(doc),
);
assert(
  "TBD remote path",
  doc.includes(TBD_REMOTE),
);
assert(
  "FileZilla manual only",
  /FileZilla.*manual|manual.*FileZilla/i.test(doc),
);
assert("STOP conditions section", /STOP conditions/i.test(doc));

assert(
  "production baseUrl",
  resolvedProfile.baseUrl === PROD_URL,
);
assert(
  "production publicBaseUrl",
  resolvedProfile.publicBaseUrl === PROD_PUBLIC_BASE,
);
assert("production deployBase /", resolvedProfile.deployBase === "/");
assert(
  "production includeReadOnlyAdmin false",
  resolvedProfile.includeReadOnlyAdmin === false,
);
assert(
  "production includesAdmin false",
  resolvedProfile.includesAdmin === false,
);
assert(
  "production manualUploadOut separate",
  resolvedProfile.manualUploadOut === "output/manual-upload/gosaki-piano-production",
);
assert(
  "staging manualUploadOut separate",
  deployProfiles.profiles.staging.manualUploadOut ===
    "output/manual-upload/gosaki-piano",
);
assert(
  "production intendedRemotePath TBD",
  resolvedProfile.intendedRemotePath === TBD_REMOTE,
);
assert(
  "production robotsDisallowAll false",
  resolvedProfile.seo?.robotsDisallowAll === false,
);
assert(
  "production productionIndexable true",
  resolvedProfile.seo?.productionIndexable === true,
);
assert(
  "production supabase ref staging kit",
  resolvedProfile.supabaseProjectRef === STAGING_KIT_SUPABASE_REF,
);
assert(
  "deploy profile supabase not Sariswing prod",
  productionDeploy.supabaseProjectRef !== SARISWING_PRODUCTION_SUPABASE_REF,
);
assert(
  "registry production includesAdmin false",
  productionRegistry.includesAdmin === false,
);
assert(
  "registry production includeReadOnlyAdmin false",
  productionRegistry.includeReadOnlyAdmin === false,
);
assert(
  "manifest meta production targetEnvironment",
  resolvedManifest.targetEnvironment === "production",
);

assert(
  "build:gosaki:production script",
  packageJson.includes("build:gosaki:production"),
);
assert(
  "preflight:gosaki:production script",
  packageJson.includes("preflight:gosaki:production"),
);
assert(
  "verify:package-freshness:gosaki:production script",
  packageJson.includes("verify:package-freshness:gosaki:production"),
);
assert(
  "verify:manual-upload:gosaki-production script",
  packageJson.includes("verify:manual-upload:gosaki-production"),
);
assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u38a-gosaki-production-profile-static-preflight",
  ),
);
assert(
  "prior G-20u38 gate",
  planDoc.includes("gosakiProductionPackagePrepPlanned: true"),
);
assert(
  "00-current-state mentions G-20u38a",
  currentState.includes("G-20u38a") || currentState.includes(PHASE),
);
assert(
  "03-next-actions mentions G-20u38a",
  nextActions.includes("G-20u38a") || nextActions.includes(PHASE),
);
assert(
  "handoff mentions G-20u38a",
  handoff.includes("G-20u38a") || handoff.includes(PHASE),
);

const prodAdminPath = path.join(
  TOOL_ROOT,
  "output/manual-upload/gosaki-piano-production/public-dist/admin/index.html",
);
if (fs.existsSync(prodAdminPath)) {
  assert("stale prod package admin absent", false, "admin/index.html exists");
} else {
  assert("stale prod package admin absent or no package", true);
}

const stgManifestPath = path.join(
  TOOL_ROOT,
  "output/manual-upload/gosaki-piano/MANIFEST.json",
);
if (fs.existsSync(stgManifestPath)) {
  const stgManifest = JSON.parse(fs.readFileSync(stgManifestPath, "utf8"));
  assert(
    "on-disk STG manifest is staging",
    stgManifest.targetEnvironment === "staging",
  );
  assert(
    "on-disk STG manifest includes admin",
    stgManifest.includesAdmin === true,
  );
}

const prodManifestPath = path.join(
  TOOL_ROOT,
  "output/manual-upload/gosaki-piano-production/MANIFEST.json",
);
if (fs.existsSync(prodManifestPath)) {
  const prodManifest = JSON.parse(fs.readFileSync(prodManifestPath, "utf8"));
  assert(
    "on-disk prod manifest targetEnvironment production",
    prodManifest.targetEnvironment === "production",
  );
  assert(
    "on-disk prod manifest includesAdmin false",
    prodManifest.includesAdmin === false,
  );
  const head = headShort();
  if (prodManifest.sourceCommit?.startsWith(head)) {
    console.log(`NOTE on-disk prod sourceCommit matches HEAD ${head}`);
  } else {
    console.log(
      `NOTE on-disk prod sourceCommit ${prodManifest.sourceCommit?.slice(0, 7)} stale vs HEAD ${head} — expected until G-20u38b`,
    );
  }
}

console.log(
  `\nverify-g20u38a-gosaki-production-profile-static-preflight: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
