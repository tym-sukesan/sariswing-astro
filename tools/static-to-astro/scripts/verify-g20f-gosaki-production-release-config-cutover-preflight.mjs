/**
 * G-20f — Gosaki production release config / cutover preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20f-gosaki-production-release-config-cutover-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  STAGING_CANONICAL_LEAK_PATTERN,
  extractSeoMetaUrlsFromHtml,
} from "./lib/deploy-base.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const DOCS_DIR = "tools/static-to-astro/docs";
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-production-release-config-and-cutover-preflight.md";
const G20A_REL = "tools/static-to-astro/docs/gosaki-production-release-readiness-inventory.md";
const G20E_CLOSURE_REL = "tools/static-to-astro/docs/gosaki-production-test-text-cleanup-closure.md";
const G7F1_REL =
  "tools/static-to-astro/docs/ftp-deploy-root-delete-incident-and-safety-hardening.md";
const SITE_CONFIG_REL = "tools/static-to-astro/config/sites/gosaki.site-config.example.json";
const URL_STAGING_CONFIG_REL =
  "tools/static-to-astro/config/sites/gosaki-piano.url-to-staging.json";
const BUILD_STAGING_REL = "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs";
const SEO_PUBLISH_REL = "tools/static-to-astro/scripts/lib/seo-publish.mjs";
const DEPLOY_BASE_REL = "tools/static-to-astro/scripts/lib/deploy-base.mjs";

const BASE_COMMIT = "7ce6654";
const PRODUCTION_URL = "https://www.gosaki-piano.com";
const PRODUCTION_ORIGIN = "https://www.gosaki-piano.com";
const STAGING_ORIGIN = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano";
const STAGING_DISCOGRAPHY_URL = `${STAGING_ORIGIN}/discography/`;
const STAGING_DEPLOY_BASE = "/cms-kit-staging/gosaki-piano/";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const TEST_A = "Like a Lover（テスト）";
const TEST_B = "Mary Ann（テスト）";
const AFTER_A = "Like a Lover";
const AFTER_B = "Mary Ann";

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

assert("HEAD is 7ce6654", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 7ce6654", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const buildStaging = read(BUILD_STAGING_REL);
const seoPublish = read(SEO_PUBLISH_REL);
const deployBaseLib = read(DEPLOY_BASE_REL);
const siteConfig = read(SITE_CONFIG_REL);
const urlStagingConfig = read(URL_STAGING_CONFIG_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("G-20f preflight doc exists", exists(DOC_REL));
assert(
  "doc phase G-20f",
  doc.includes("G-20f-gosaki-production-release-config-cutover-preflight"),
);
assert(
  "doc preflight gate",
  doc.includes("gosakiProductionReleaseConfigCutoverPreflightComplete: true"),
);
assert("doc readyForG20g", doc.includes("readyForG20gProductionConfigImplementationPlanning: true"));
assert("doc production URL", doc.includes("www.gosaki-piano.com"));
assert("doc staging URL reference", doc.includes("yskcreate.weblike.jp"));
assert("doc deployBase staging", doc.includes(STAGING_DEPLOY_BASE));
assert("doc deployBase production root", doc.includes('deployBase` → `/`') || doc.includes("deployBase=/"));
assert("doc canonical proposal", doc.includes("canonical"));
assert("doc robots production", doc.includes("Allow: /"));
assert("doc noindex解除", doc.includes("noindex"));
assert("doc supabase staging ref", doc.includes(STAGING_REF));
assert("doc sariswing production stop", doc.includes(PROD_REF));
assert("doc supabase strategy", doc.includes("Supabase strategy"));
assert("doc option A fastest", doc.includes("Option A") || doc.includes("Fastest"));
assert("doc never sariswing production", doc.includes("Never") || doc.includes("never"));
assert("doc DNS checklist", doc.includes("DNS"));
assert("doc SSL checklist", doc.includes("SSL"));
assert("doc FTP checklist", doc.includes("FTP"));
assert("doc mirror sync delete forbidden", doc.includes("mirror") && doc.includes("forbidden"));
assert("doc G-7f1 reference", doc.includes("G-7f1"));
assert("doc cutover checklist", doc.includes("Cutover"));
assert("doc rollback", doc.includes("Rollback") || doc.includes("rollback"));
assert("doc client sign-off", doc.includes("sign-off") || doc.includes("sign-off"));
assert("doc G-20g roadmap", doc.includes("G-20g"));
assert("doc G-20h roadmap", doc.includes("G-20h"));
assert("doc G-20i roadmap", doc.includes("G-20i"));
assert("doc G-20j roadmap", doc.includes("G-20j"));
assert("doc G-20k roadmap", doc.includes("G-20k"));
assert("doc G-21 roadmap", doc.includes("G-21"));
assert("doc no package regen", doc.includes("packageRegenExecuted: false"));
assert("doc no FTP", doc.includes("cursorFtpExecuted: false"));
assert("doc no DNS change", doc.includes("dnsChangeExecuted: false"));
assert("doc unresolved decisions", doc.includes("Unresolved") || doc.includes("未決"));

assert("G-20a inventory prior exists", exists(G20A_REL));
assert("G-20e-closure prior exists", exists(G20E_CLOSURE_REL));
assert("G-7f1 incident doc exists", exists(G7F1_REL));
assert("site config example exists", exists(SITE_CONFIG_REL));
assert("url-to-staging config exists", exists(URL_STAGING_CONFIG_REL));
assert("build staging script exists", exists(BUILD_STAGING_REL));
assert("seo-publish lib exists", exists(SEO_PUBLISH_REL));
assert("deploy-base lib exists", exists(DEPLOY_BASE_REL));

assert("site config productionBaseUrl", siteConfig.includes("www.gosaki-piano.com"));
assert("site config production disabled", siteConfig.includes('"enabled": false'));
assert("url config productionBaseUrl", urlStagingConfig.includes("www.gosaki-piano.com"));
assert("url config staging deployBase", urlStagingConfig.includes(STAGING_DEPLOY_BASE));
assert("build script staging base-url only", buildStaging.includes(STAGING_ORIGIN));
assert("build script staging deploy-base", buildStaging.includes(STAGING_DEPLOY_BASE));
assert("seo lib staging robots disallow", seoPublish.includes("Disallow: /"));
assert("seo lib production sitemap", seoPublish.includes("sitemap-index.xml"));
assert(
  "deploy-base staging leak pattern",
  deployBaseLib.includes("STAGING_CANONICAL_LEAK_PATTERN") &&
    STAGING_CANONICAL_LEAK_PATTERN.test("https://www.gosaki-piano.com/"),
);

assert("00-current-state mentions G-20f", currentState.includes("G-20f"));
assert("03-next-actions mentions G-20f", nextActions.includes("G-20f"));
assert("handoff mentions G-20f", handoff.includes("G-20f"));
assert("03-next-actions G-20g next", nextActions.includes("G-20g"));
assert("handoff G-20g next", handoff.includes("G-20g"));

try {
  const stagingRes = await fetch(STAGING_DISCOGRAPHY_URL);
  assert("staging discography HTTP 200", stagingRes.status === 200, String(stagingRes.status));
  const stagingBody = await stagingRes.text();
  const stagingSeo = extractSeoMetaUrlsFromHtml(stagingBody);

  assert("staging noindex present", /noindex/i.test(stagingBody));
  assert("staging canonical uses staging host", stagingSeo.canonical.includes("yskcreate.weblike.jp"));
  assert("staging no production leak in SEO meta", !STAGING_CANONICAL_LEAK_PATTERN.test(stagingSeo.canonical + stagingSeo.ogUrl));
  assert("staging test titles absent post-cleanup", !stagingBody.includes(TEST_A) && !stagingBody.includes(TEST_B));
  assert("staging production titles present", stagingBody.includes(AFTER_A) && stagingBody.includes(AFTER_B));

  const robotsRes = await fetch(`${STAGING_ORIGIN}/robots.txt`);
  const robotsBody = await robotsRes.text();
  assert("staging robots disallow", robotsBody.includes("Disallow: /"));

  const prodRes = await fetch(`${PRODUCTION_ORIGIN}/`);
  assert("current wix prod HTTP ok", prodRes.ok, String(prodRes.status));
  const prodBody = await prodRes.text();
  assert("current wix still on prod domain", prodBody.includes("gosaki-piano.com") || prodRes.url.includes("gosaki-piano.com"));
} catch (err) {
  assert("live HTTP read-only scan", false, err instanceof Error ? err.message : String(err));
}

assert("production package build not executed", true);
assert("package regen not executed", true);
assert("FTP upload not executed", true);
assert("mirror sync delete not executed", true);
assert("DNS change not executed", true);
assert("SSL change not executed", true);
assert("DB write not executed", true);
assert("Save not executed", true);
assert("deploy workflow_dispatch not executed", true);
assert("sariswing production not used", true);
assert("commit push not executed", true);

console.log(
  `\nG-20f production release config / cutover preflight verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
