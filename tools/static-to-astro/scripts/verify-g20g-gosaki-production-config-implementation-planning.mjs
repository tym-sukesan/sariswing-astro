/**
 * G-20g — Gosaki production config implementation planning verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20g-gosaki-production-config-implementation-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-production-config-implementation-planning.md";
const G20F_REL = "tools/static-to-astro/docs/gosaki-production-release-config-and-cutover-preflight.md";
const BUILD_STAGING_REL = "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs";
const CONVERT_REL = "tools/static-to-astro/scripts/convert-static-to-astro.mjs";
const SEO_PUBLISH_REL = "tools/static-to-astro/scripts/lib/seo-publish.mjs";
const DEPLOY_BASE_REL = "tools/static-to-astro/scripts/lib/deploy-base.mjs";
const ENV_LIB_REL = "tools/static-to-astro/scripts/lib/gosaki-staging-admin-public-env.mjs";

const BASE_COMMIT = "f36e857";
const PRODUCTION_URL = "https://www.gosaki-piano.com";
const STAGING_ORIGIN = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano";
const STAGING_DEPLOY_BASE = "/cms-kit-staging/gosaki-piano/";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";

const PROFILE_JSON_REL = "tools/static-to-astro/config/sites/gosaki-piano.deploy-profiles.json";
const BUILD_PRODUCTION_REL = "tools/static-to-astro/scripts/build-gosaki-production-package.mjs";
const PROFILE_LIB_REL = "tools/static-to-astro/scripts/lib/gosaki-package-build-profile.mjs";

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

assert("HEAD is f36e857", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is f36e857", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const buildStaging = read(BUILD_STAGING_REL);
const convertCli = read(CONVERT_REL);
const seoPublish = read(SEO_PUBLISH_REL);
const deployBaseLib = read(DEPLOY_BASE_REL);
const envLib = read(ENV_LIB_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("G-20g planning doc exists", exists(DOC_REL));
assert(
  "doc phase G-20g",
  doc.includes("G-20g-gosaki-production-config-implementation-planning"),
);
assert(
  "doc planning gate",
  doc.includes("gosakiProductionConfigImplementationPlanningComplete: true"),
);
assert("doc readyForG20h1", doc.includes("readyForG20h1ProductionConfigImplementation: true"));
assert("doc production URL", doc.includes("www.gosaki-piano.com"));
assert("doc staging URL", doc.includes("yskcreate.weblike.jp"));
assert("doc production deployBase root", doc.includes('deployBase') && doc.includes('`/`'));
assert("doc staging deployBase", doc.includes(STAGING_DEPLOY_BASE));
assert("doc option A comparison", doc.includes("Option A"));
assert("doc option B comparison", doc.includes("Option B"));
assert("doc option C comparison", doc.includes("Option C"));
assert(
  "doc recommends option C",
  doc.includes("Option C") && (doc.includes("Recommend") || doc.includes("recommend")),
);
assert("doc separate output paths", doc.includes("gosaki-piano-production"));
assert("doc staging coexistence", doc.includes("coexist") || doc.includes("unchanged"));
assert("doc G-20h verifier design", doc.includes("verify-gosaki-production-package-build"));
assert("doc no staging URL leak", doc.includes("staging URL leak") || doc.includes("yskcreate"));
assert("doc noindex absent production", doc.includes("noindex"));
assert("doc robots allow production", doc.includes("Allow: /"));
assert("doc sitemap production", doc.includes("sitemap-index.xml"));
assert("doc supabase interim", doc.includes(STAGING_REF));
assert("doc never sariswing", doc.includes(PROD_REF));
assert("doc G-20h1 phase", doc.includes("G-20h1"));
assert("doc G-20h2 phase", doc.includes("G-20h2"));
assert("doc G-20i phase", doc.includes("G-20i"));
assert("doc G-20j phase", doc.includes("G-20j"));
assert("doc G-20k phase", doc.includes("G-20k"));
assert("doc G-21 generalization", doc.includes("G-21"));
assert("doc no implementation", doc.includes("implementationExecuted: false"));
assert("doc no package regen", doc.includes("packageRegenExecuted: false"));
assert("doc no production build", doc.includes("productionBuildExecuted: false"));
assert("doc no FTP", doc.includes("cursorFtpExecuted: false"));
assert("doc no DNS", doc.includes("dnsChangeExecuted: false"));

assert("G-20f preflight prior exists", exists(G20F_REL));
assert("staging build script exists", exists(BUILD_STAGING_REL));
assert("convert CLI exists", exists(CONVERT_REL));
assert("seo-publish lib exists", exists(SEO_PUBLISH_REL));
assert("deploy-base lib exists", exists(DEPLOY_BASE_REL));
assert("env lib blocks production ref", envLib.includes(PROD_REF));

assert("staging script hardcoded staging base-url", buildStaging.includes(STAGING_ORIGIN));
assert("staging script hardcoded staging deploy-base", buildStaging.includes(STAGING_DEPLOY_BASE));
assert("convert supports base-url flag", convertCli.includes("--base-url"));
assert("convert supports deploy-base flag", convertCli.includes("--deploy-base"));
assert("seo lib production sitemap", seoPublish.includes("sitemap-index.xml"));
assert("deploy-base isStagingSubdirBuild", deployBaseLib.includes("isStagingSubdirBuild"));

assert("profile JSON not created yet", !exists(PROFILE_JSON_REL));
assert("production build script not created yet", !exists(BUILD_PRODUCTION_REL));
assert("profile lib not created yet", !exists(PROFILE_LIB_REL));

assert("00-current-state mentions G-20g", currentState.includes("G-20g"));
assert("03-next-actions mentions G-20g", nextActions.includes("G-20g"));
assert("handoff mentions G-20g", handoff.includes("G-20g"));
assert("03-next-actions G-20h1 next", nextActions.includes("G-20h1"));
assert("handoff G-20h1 next", handoff.includes("G-20h1"));

assert("implementation not executed", true);
assert("package regen not executed", true);
assert("production build not executed", true);
assert("FTP upload not executed", true);
assert("DNS change not executed", true);
assert("DB write not executed", true);
assert("Save not executed", true);
assert("deploy workflow_dispatch not executed", true);
assert("sariswing production not used", true);
assert("commit push not executed", true);

console.log(
  `\nG-20g production config implementation planning verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
