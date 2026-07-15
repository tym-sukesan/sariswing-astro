/**
 * G-20u38 Gosaki production package prep planning verifier.
 * Planning only — no implementation / Save / SQL / package / FTP.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-production-package-prep-planning.md";
const PRIOR_DOC_REL =
  "tools/static-to-astro/docs/gosaki-public-readiness-final-p0-review.md";
const DEPLOY_PROFILES_REL =
  "tools/static-to-astro/config/sites/gosaki-piano.deploy-profiles.json";
const PHASE = "G-20u38-gosaki-production-package-prep-planning";
const GATE = "gosakiProductionPackagePrepPlanned: true";
const NEXT = "G-20u38a-gosaki-production-profile-static-preflight";
const PLANNING_HEAD = "9944164";
const STG_SOURCE_COMMIT = "e3616a3ab0fbda280d75278b0a6275205ae74763";
const PROD_URL = "https://www.gosaki-piano.com";
const STG_URL = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_STOP_REF = "vsbvndwuajjhnzpohghh";
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

assert("planning doc exists", exists(DOC_REL));
assert("prior G-20u37c doc exists", exists(PRIOR_DOC_REL));
assert("deploy profiles JSON exists", exists(DEPLOY_PROFILES_REL));

const doc = read(DOC_REL);
const priorDoc = read(PRIOR_DOC_REL);
const deployProfiles = JSON.parse(read(DEPLOY_PROFILES_REL));
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

const production = deployProfiles.profiles?.production ?? {};

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "PRODUCTION_PACKAGE_PREP_PLANNED true",
  /PRODUCTION_PACKAGE_PREP_PLANNED:\s*true|productionPackagePrepPlanned:\s*true/i.test(
    doc,
  ),
);
assert(
  "PRODUCTION_PACKAGE_GENERATION_READY CONDITIONAL",
  /PRODUCTION_PACKAGE_GENERATION_READY:\s*CONDITIONAL|productionPackageGenerationReady:\s*conditional/i.test(
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
  "no implementation",
  /Implementation.*\*\*no\*\*|implementationExecuted:\s*false/i.test(doc),
);
assert(
  "no Save",
  /Save.*\*\*no\*\*|saveExecuted:\s*false/i.test(doc),
);
assert(
  "no package generation",
  /Package generation.*\*\*no\*\*|packageGenerationExecuted:\s*false/i.test(doc),
);
assert(
  "no FTP upload",
  /FTP.*\*\*no\*\*|ftpUploadExecuted:\s*false/i.test(doc),
);
assert(
  "service_role unused",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(doc),
);
assert("planning HEAD 9944164", doc.includes(PLANNING_HEAD));
assert("STG sourceCommit e3616a3 documented", doc.includes(STG_SOURCE_COMMIT));
assert(
  "e3616a3 not for production",
  /Do not upload.*e3616a3|e3616a3.*not.*production|Do not.*staging package to production/i.test(
    doc,
  ),
);
assert(`next ${NEXT}`, doc.includes(NEXT));
assert("P0 conditions section", /Production package P0 conditions/i.test(doc));
assert("STOP conditions section", /STOP conditions/i.test(doc));
assert(
  "admin exclude P0",
  /Package.*excludes.*\/admin\/|excludes.*\/admin\//i.test(doc),
);
assert(
  "robots production-ready",
  /robots.*production|not.*Disallow:\s*\//i.test(doc),
);
assert(
  "sitemap prod URLs",
  /sitemap.*production|production URLs/i.test(doc),
);
assert(
  "FileZilla manual only",
  /FileZilla.*manual|manual.*FileZilla/i.test(doc),
);
assert(
  "no CLI mirror delete",
  /mirror|sync|--delete|CLI FTP/i.test(doc) && /禁止|STOP|no/i.test(doc),
);
assert(
  "remote path TBD",
  doc.includes(TBD_REMOTE),
);
assert(
  "production profile baseUrl",
  production.baseUrl === PROD_URL || production.baseUrl === `${PROD_URL}/`,
);
assert("production profile deployBase /", production.deployBase === "/");
assert(
  "production includeReadOnlyAdmin false",
  production.includeReadOnlyAdmin === false,
);
assert(
  "production manualUploadOut separate",
  production.manualUploadOut === "output/manual-upload/gosaki-piano-production",
);
assert(
  "staging manualUploadOut separate",
  deployProfiles.profiles?.staging?.manualUploadOut ===
    "output/manual-upload/gosaki-piano",
);
assert(
  "production supabase ref staging kit",
  production.supabaseProjectRef === STAGING_REF,
);
assert(
  "Sariswing prod ref STOP documented",
  doc.includes(PRODUCTION_STOP_REF),
);
assert(
  "next phases G-20u38a through G-20u38e",
  doc.includes("G-20u38a") &&
    doc.includes("G-20u38b") &&
    doc.includes("G-20u38c") &&
    doc.includes("G-20u38d") &&
    doc.includes("G-20u38e"),
);
assert(
  "preflight:gosaki:production in doc or package.json",
  doc.includes("preflight:gosaki:production") ||
    packageJson.includes("preflight:gosaki:production"),
);
assert(
  "build:gosaki:production in package.json",
  packageJson.includes("build:gosaki:production"),
);
assert(
  "verify:manual-upload:gosaki-production in package.json",
  packageJson.includes("verify:manual-upload:gosaki-production"),
);
assert(
  "verify:package-freshness:gosaki:production in package.json",
  packageJson.includes("verify:package-freshness:gosaki:production"),
);
assert(
  "prior G-20u37c gate",
  priorDoc.includes("gosakiPublicReadinessFinalP0Reviewed: true"),
);
assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u38-gosaki-production-package-prep-planning",
  ),
);
assert(
  "00-current-state mentions G-20u38",
  currentState.includes("G-20u38") || currentState.includes(PHASE),
);
assert(
  "03-next-actions mentions G-20u38",
  nextActions.includes("G-20u38") || nextActions.includes(PHASE),
);
assert(
  "handoff mentions G-20u38",
  handoff.includes("G-20u38") || handoff.includes(PHASE),
);
assert("STG URL in doc", doc.includes(STG_URL));
assert("production URL in doc", doc.includes(PROD_URL));

console.log(
  `\nverify-g20u38-gosaki-production-package-prep-planning: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
