#!/usr/bin/env node
/**
 * Gosaki ciao-preview profile implementation verifier (offline).
 * No package generation · no FTP · no DB.
 *
 * Run: node tools/static-to-astro/scripts/verify-gosaki-ciao-jp-preview-profile-implementation.mjs
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyBaseUrlToSeo } from "./lib/base-url.mjs";
import { buildDeployOrigin, detectCanonicalModeFromHtml } from "./lib/deploy-base.mjs";
import { generateRobotsTxt } from "./lib/seo-publish.mjs";
import {
  CIAO_PREVIEW_PROFILE_NAME,
  GOSAKI_CIAO_PREVIEW_BASE_URL,
  GOSAKI_CIAO_PREVIEW_DEPLOY_BASE,
  GOSAKI_CIAO_PREVIEW_MANUAL_UPLOAD_OUT,
  GOSAKI_CIAO_PREVIEW_ORIGIN,
  GOSAKI_CIAO_PREVIEW_PUBLIC_URL,
  GOSAKI_SITE_KEY,
  resolvePackageAdminFlags,
  resolveSitePackageBuildProfile,
} from "./lib/site-registry.mjs";
import { buildConvertCliArgs, planSitePackageBuild } from "./lib/build-site-package-core.mjs";
import { isUnsafeIntendedRemotePath } from "./lib/package-upload-safety.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

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

const staging = resolveSitePackageBuildProfile(GOSAKI_SITE_KEY, "staging");
const production = resolveSitePackageBuildProfile(GOSAKI_SITE_KEY, "production");
const preview = resolveSitePackageBuildProfile(GOSAKI_SITE_KEY, CIAO_PREVIEW_PROFILE_NAME);

assert("profile name ciao-preview", preview.profileName === "ciao-preview");
assert("deployBase /gosaki-piano/", preview.deployBase === GOSAKI_CIAO_PREVIEW_DEPLOY_BASE);
assert("origin gotosaki.ciao.jp", preview.origin === GOSAKI_CIAO_PREVIEW_ORIGIN);
assert("baseUrl ciao path", preview.baseUrl === GOSAKI_CIAO_PREVIEW_BASE_URL);
assert("publicUrl trailing slash", preview.publicUrl === GOSAKI_CIAO_PREVIEW_PUBLIC_URL);
assert("publicBaseUrl", preview.publicBaseUrl === GOSAKI_CIAO_PREVIEW_PUBLIC_URL);
assert("remotePath /gosaki-piano/", preview.remotePath === "/gosaki-piano/");
assert("intendedRemotePath /gosaki-piano/", preview.intendedRemotePath === "/gosaki-piano/");
assert("intendedRemotePath safe", isUnsafeIntendedRemotePath(preview.intendedRemotePath) === false);
assert("subdir build (noindex path)", preview.isStagingSubdirBuild === true);
assert("seo.stagingNoindex", preview.seo.stagingNoindex === true);
assert("seo.robotsDisallowAll", preview.seo.robotsDisallowAll === true);
assert("seo.productionIndexable false", preview.seo.productionIndexable === false);
assert("Admin excluded", preview.includeReadOnlyAdmin === false && preview.includesAdmin === false);
assert("stagingBaseUrl not weblike", preview.stagingBaseUrl == null);
assert("output tree distinct from staging", preview.manualUploadOut !== staging.manualUploadOut);
assert("output tree distinct from production", preview.manualUploadOut !== production.manualUploadOut);
assert("manualUploadOut path", preview.manualUploadOut === GOSAKI_CIAO_PREVIEW_MANUAL_UPLOAD_OUT);
assert("astroOut distinct", preview.astroOut !== staging.astroOut && preview.astroOut !== production.astroOut);
assert("staticPublicOut distinct", preview.staticPublicOut !== staging.staticPublicOut);
assert("supabase staging Kit SoT", preview.supabaseProjectRef === "kmjqppxjdnwwrtaeqjta");
assert("targetEnvironment ciao-preview", preview.targetEnvironment === "ciao-preview");

assert("staging deployBase unchanged", staging.deployBase === "/cms-kit-staging/gosaki-piano/");
assert("staging Admin still included", staging.includeReadOnlyAdmin === true);
assert("staging publicBaseUrl weblike", staging.publicBaseUrl === "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/");
assert("production deployBase /", production.deployBase === "/");
assert("production Admin excluded", production.includeReadOnlyAdmin === false);
assert("production publicBaseUrl www", production.publicBaseUrl === "https://www.gosaki-piano.com/");
assert("production remote TBD", production.intendedRemotePath === "TBD_G-20i");

const previewAdmin = resolvePackageAdminFlags(GOSAKI_SITE_KEY, CIAO_PREVIEW_PROFILE_NAME, {
  packageOverlay: { includeReadOnlyAdmin: false },
  deployProfile: { includeReadOnlyAdmin: false },
});
assert("resolvePackageAdminFlags ciao-preview false", previewAdmin.includeReadOnlyAdmin === false);
assert(
  "resolvePackageAdminFlags ciao-preview always false",
  resolvePackageAdminFlags(GOSAKI_SITE_KEY, CIAO_PREVIEW_PROFILE_NAME, {
    packageOverlay: { includeReadOnlyAdmin: true },
  }).includeReadOnlyAdmin === false,
);
assert(
  "resolvePackageAdminFlags staging still true",
  resolvePackageAdminFlags(GOSAKI_SITE_KEY, "staging", {
    packageOverlay: { includeReadOnlyAdmin: true },
  }).includeReadOnlyAdmin === true,
);
assert(
  "resolvePackageAdminFlags production always false",
  resolvePackageAdminFlags(GOSAKI_SITE_KEY, "production", {
    packageOverlay: { includeReadOnlyAdmin: true },
  }).includeReadOnlyAdmin === false,
);

const origin = buildDeployOrigin(preview.baseUrl, preview.deployBase);
assert("buildDeployOrigin no double prefix", origin === GOSAKI_CIAO_PREVIEW_BASE_URL);

const aboutSeo = applyBaseUrlToSeo({}, "/about/", preview.baseUrl, preview.deployBase);
assert(
  "canonical about",
  aboutSeo.canonical === "https://gotosaki.ciao.jp/gosaki-piano/about/",
);
assert("og:url about", aboutSeo.ogUrl === aboutSeo.canonical);
assert("canonicalMode staging-url", aboutSeo.canonicalMode === "staging-url");
assert("canonical not www", !/www\.gosaki-piano\.com/i.test(aboutSeo.canonical));
assert("canonical not weblike", !/weblike\.jp/i.test(aboutSeo.canonical));

const homeSeo = applyBaseUrlToSeo({}, "/", preview.baseUrl, preview.deployBase);
assert("canonical home", homeSeo.canonical === "https://gotosaki.ciao.jp/gosaki-piano/");

const robots = generateRobotsTxt(preview.baseUrl, preview.deployBase);
assert("robots Disallow /", /Disallow:\s*\/\s*$/m.test(robots ?? ""));
assert("robots no Sitemap line", !/Sitemap:/i.test(robots ?? ""));
assert("robots no www", !/www\.gosaki-piano\.com/i.test(robots ?? ""));
assert("robots no weblike", !/weblike\.jp/i.test(robots ?? ""));

const prodRobots = generateRobotsTxt(production.baseUrl, production.deployBase);
assert("production robots still Allow", /Allow:\s*\/\s*$/m.test(prodRobots ?? ""));
assert("production robots still Sitemap www", (prodRobots ?? "").includes("www.gosaki-piano.com"));

const stagingRobots = generateRobotsTxt(staging.baseUrl, staging.deployBase);
assert("staging robots still Disallow", /Disallow:\s*\/\s*$/m.test(stagingRobots ?? ""));

const ciaoHead = `<head><link rel="canonical" href="https://gotosaki.ciao.jp/gosaki-piano/about/"><meta property="og:url" content="https://gotosaki.ciao.jp/gosaki-piano/about/"></head>`;
assert("detectCanonicalMode ciao = staging-url", detectCanonicalModeFromHtml(ciaoHead) === "staging-url");
const wwwHead = `<head><link rel="canonical" href="https://www.gosaki-piano.com/about/"></head>`;
assert("detectCanonicalMode www leak", detectCanonicalModeFromHtml(wwwHead) === "production-leak");
const weblikeHead = `<head><link rel="canonical" href="https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/about/"></head>`;
assert("detectCanonicalMode weblike staging-url", detectCanonicalModeFromHtml(weblikeHead) === "staging-url");

const convertArgs = buildConvertCliArgs(GOSAKI_SITE_KEY, CIAO_PREVIEW_PROFILE_NAME);
assert("convert --base-url ciao", convertArgs.includes(GOSAKI_CIAO_PREVIEW_BASE_URL));
assert("convert --deploy-base /gosaki-piano/", convertArgs.includes(GOSAKI_CIAO_PREVIEW_DEPLOY_BASE));
assert("convert astroOut ciao-preview", convertArgs.includes("output/gosaki-piano-astro-ciao-preview"));
assert("convert not weblike base-url", !convertArgs.includes(staging.baseUrl));
assert("convert not www base-url", !convertArgs.includes(production.baseUrl));

const plan = planSitePackageBuild(GOSAKI_SITE_KEY, CIAO_PREVIEW_PROFILE_NAME);
assert("plan includeReadOnlyAdmin false", plan.profile.includeReadOnlyAdmin === false);
assert(
  "plan output ciao-preview",
  plan.profile.manualUploadOut === GOSAKI_CIAO_PREVIEW_MANUAL_UPLOAD_OUT,
);
assert("plan verifier verify-site-package", plan.verifierRel.includes("verify-site-package.mjs"));

const stagingPlan = planSitePackageBuild(GOSAKI_SITE_KEY, "staging");
const productionPlan = planSitePackageBuild(GOSAKI_SITE_KEY, "production");
assert("staging plan output unchanged", stagingPlan.profile.manualUploadOut === "output/manual-upload/gosaki-piano");
assert(
  "production plan output unchanged",
  productionPlan.profile.manualUploadOut === "output/manual-upload/gosaki-piano-production",
);

let threw = false;
try {
  resolveSitePackageBuildProfile(GOSAKI_SITE_KEY, "invalid-preview");
} catch {
  threw = true;
}
assert("unknown profile still throws", threw);

const dry = spawnSync(
  "node",
  ["scripts/build-site-package.mjs", "--site", "gosaki-piano", "--profile", "ciao-preview", "--dry-run"],
  { cwd: TOOL_ROOT, encoding: "utf8" },
);
assert("ciao-preview dry-run exit 0", dry.status === 0, dry.stderr);
assert("dry-run deployBase logged", (dry.stdout ?? "").includes("deployBase: /gosaki-piano/"));
assert("dry-run Admin false", (dry.stdout ?? "").includes("includeReadOnlyAdmin: false"));
assert("dry-run ciao baseUrl", (dry.stdout ?? "").includes("https://gotosaki.ciao.jp/gosaki-piano"));
assert("dry-run no convert executed", (dry.stdout ?? "").includes("DRY-RUN PASS"));
assert("dry-run no weblike base", !(dry.stdout ?? "").includes("yskcreate.weblike.jp"));

const stagingDry = spawnSync(
  "node",
  ["scripts/build-site-package.mjs", "--site", "gosaki-piano", "--profile", "staging", "--dry-run"],
  { cwd: TOOL_ROOT, encoding: "utf8" },
);
assert("staging dry-run still PASS", stagingDry.status === 0);
assert(
  "staging dry-run still weblike",
  (stagingDry.stdout ?? "").includes("/cms-kit-staging/gosaki-piano/"),
);
assert("staging dry-run Admin true", (stagingDry.stdout ?? "").includes("includeReadOnlyAdmin: true"));

const productionDry = spawnSync(
  "node",
  ["scripts/build-site-package.mjs", "--site", "gosaki-piano", "--profile", "production", "--dry-run"],
  { cwd: TOOL_ROOT, encoding: "utf8" },
);
assert("production dry-run still PASS", productionDry.status === 0);
assert("production dry-run still www", (productionDry.stdout ?? "").includes("https://www.gosaki-piano.com"));
assert("production dry-run deployBase /", (productionDry.stdout ?? "").includes("deployBase: /"));
assert("production dry-run Admin false", (productionDry.stdout ?? "").includes("includeReadOnlyAdmin: false"));

const pkg = JSON.parse(fs.readFileSync(path.join(TOOL_ROOT, "package.json"), "utf8"));
assert("npm build ciao-preview dry-run", Boolean(pkg.scripts["build:gosaki:ciao-preview:dry-run"]));
assert("npm preflight ciao-preview", Boolean(pkg.scripts["preflight:gosaki:ciao-preview"]));

console.log("");
console.log(`verify-gosaki-ciao-jp-preview-profile-implementation: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
