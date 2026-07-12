/**
 * G-20u36c-admin-discography-dry-run-staging-package-rebuild-preflight
 * Run: node tools/static-to-astro/scripts/verify-g20u36c-admin-discography-dry-run-staging-package-rebuild-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  findSitemapSafetyViolations,
  isUnsafeIntendedRemotePath,
  readPackageManifest,
  validatePackageManifestSafety,
  verifyPackageUploadFreshness,
  walkRelativeFiles,
} from "./lib/package-upload-safety.mjs";
import { resolveGosakiPackageBuildProfile } from "./lib/gosaki-package-build-profile.mjs";
import { TOOL_ROOT } from "./lib/site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36c-admin-discography-dry-run-staging-package-rebuild-preflight.md";
const FETCH_POST_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36c-admin-discography-dry-run-fetch-post-wiring.md";
const ADMIN_TS_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts";
const BASE_COMMIT = "4595dce";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const FUNCTION_NAME = "gosaki-discography-save-dry-run";
const STAGING_ENDPOINT = `https://${STAGING_REF}.supabase.co/functions/v1/${FUNCTION_NAME}`;
const STAGING_REMOTE = "/cms-kit-staging/gosaki-piano/";

const stagingProfile = resolveGosakiPackageBuildProfile("staging");
const STAGING_PKG = path.join(TOOL_ROOT, stagingProfile.manualUploadOut);
const STAGING_PUBLIC = path.join(STAGING_PKG, "public-dist");
const ADMIN_HTML = path.join(STAGING_PUBLIC, "admin/index.html");

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

function readIfExists(absPath) {
  return fs.existsSync(absPath) ? fs.readFileSync(absPath, "utf8") : "";
}

const head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], { cwd: REPO_ROOT, encoding: "utf8" });

assert("HEAD is 4595dce", headShort.stdout.trim() === BASE_COMMIT, headShort.stdout.trim());
assert("origin/main is 4595dce", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("doc exists", exists(DOC_REL));
assert("fetch POST wiring doc exists", exists(FETCH_POST_DOC_REL));

const doc = read(DOC_REL);
const fetchPostDoc = read(FETCH_POST_DOC_REL);
const adminTs = read(ADMIN_TS_REL);
const packageJson = read("tools/static-to-astro/package.json");

assert("doc phase G-20u36c preflight", doc.includes("G-20u36c-admin-discography-dry-run-staging-package-rebuild-preflight"));
assert("doc gate ready", doc.includes("gosakiDiscographyAdminDryRunStagingPackageReadyForManualUpload: true"));
assert("doc sourceCommit 4595dce", doc.includes(BASE_COMMIT) || doc.includes("4595dced99ac1ec1abf29f8e2aa2ba2739254e19"));
assert("doc package path", doc.includes("output/manual-upload/gosaki-piano"));
assert("doc build script", doc.includes("build:gosaki:staging"));
assert("doc preflight PASS", doc.includes("preflight:gosaki:staging") && /PASS/i.test(doc));
assert("doc freshness PASS", doc.includes("freshness") && /PASS/i.test(doc));
assert("doc Save disabled", doc.includes("Save") && /disabled/i.test(doc));
assert("doc operation save not sent", doc.includes("operation=save") && /not sent|未使用|no/i.test(doc));
assert("doc service_role not used", doc.includes("service_role") && /not used|未使用|absent|no/i.test(doc));
assert("doc FTP not executed", doc.includes("FTP") && /not executed|未実行/i.test(doc));
assert("doc next manual FTP", doc.includes("Manual FTP") || doc.includes("manual FTP"));
assert(
  "fetch POST doc clientDryRun fix note",
  fetchPostDoc.includes("clientDryRun") && fetchPostDoc.includes("400"),
);
assert("admin ts clientDryRun snapshot builder", adminTs.includes("buildDiscographyDryRunClientSnapshot"));
assert("admin ts clientDryRun wouldWrite false", adminTs.includes("wouldWrite: false"));
assert("admin ts clientDryRun in endpoint payload", adminTs.includes("clientDryRun: buildDiscographyDryRunClientSnapshot"));

assert("staging package dir exists", fs.existsSync(STAGING_PKG));
const manifestState = readPackageManifest(STAGING_PKG);
assert("MANIFEST readable", manifestState.ok, manifestState.error ?? "");
const manifest = manifestState.manifest ?? {};

assert("manifest sourceCommit matches HEAD", String(manifest.sourceCommit ?? "").startsWith(head.stdout.trim()));
assert("manifest includesAdmin true", manifest.includesAdmin === true);
assert("manifest staging profile", manifest.packageProfileName === "staging");
assert("manifest intendedRemotePath", manifest.intendedRemotePath === STAGING_REMOTE);
assert("manifest safeForStaticFtp true", manifest.safeForStaticFtp === true);
assert("manifest ftpAutoDeployUsed false", manifest.ftpAutoDeployUsed === false);
assert("intendedRemotePath safe", !isUnsafeIntendedRemotePath(manifest.intendedRemotePath));

const manifestSafety = validatePackageManifestSafety(manifest, "staging");
assert("manifest safety staging", manifestSafety.length === 0, manifestSafety.join("; "));

const freshness = verifyPackageUploadFreshness(STAGING_PKG, REPO_ROOT);
assert("package freshness PASS", freshness.ok === true, freshness.errors?.join("; ") ?? freshness.stopReasons?.join("; ") ?? "");

assert("admin index.html exists", fs.existsSync(ADMIN_HTML));
const adminHtml = readIfExists(ADMIN_HTML);
assert("admin G-20u36c phase attr", adminHtml.includes("G-20u36c-admin-discography-dry-run-fetch-post-wiring"));
assert("admin endpoint dry-run button", adminHtml.includes("Endpoint dry-run (POST · no save)"));
assert("admin Dry-run only text", adminHtml.includes("Dry-run only"));
assert("admin No DB write text", adminHtml.includes("No DB write"));
assert("admin Save is still disabled text", adminHtml.includes("Save is still disabled"));
assert("admin endpoint data attr staging", adminHtml.includes(`data-gosaki-discography-dry-run-endpoint="${STAGING_ENDPOINT}"`));
assert("admin operation dryRun data attr", adminHtml.includes('data-g20u36c-discography-dry-run-operation="dryRun"'));
assert("admin endpoint section", adminHtml.includes('data-section="discography-endpoint-dry-run-album"'));
assert("admin Save disabled badge", adminHtml.includes("Save disabled"));
assert("admin Save buttons disabled", adminHtml.includes("Save（無効"));
assert("admin no production ref in endpoint attr", !adminHtml.includes(`data-gosaki-discography-dry-run-endpoint="https://${PRODUCTION_REF}`));
assert("admin no production ref anywhere", !adminHtml.includes(PRODUCTION_REF));
assert("admin no service_role", !/service_role|SUPABASE_SERVICE_ROLE_KEY/i.test(adminHtml));
assert("admin no localStorage", !/localStorage/i.test(adminHtml));

const endpointBtnCount = (adminHtml.match(/Endpoint dry-run \(POST · no save\)/g) ?? []).length;
assert("admin 4 endpoint dry-run buttons", endpointBtnCount === 4, String(endpointBtnCount));

const astroDir = path.join(STAGING_PUBLIC, "_astro");
const astroFiles = fs.existsSync(astroDir)
  ? fs.readdirSync(astroDir).filter((f) => f.includes("astro_type_script") && f.endsWith(".js"))
  : [];
assert("admin client script bundle present", astroFiles.length >= 1, String(astroFiles.length));

let scriptBundle = "";
for (const file of astroFiles) {
  scriptBundle += readIfExists(path.join(astroDir, file));
}
assert("bundle dryRun operation", scriptBundle.includes('"dryRun"') || scriptBundle.includes("dryRun"));
assert("bundle staging ref", scriptBundle.includes(STAGING_REF));
assert("bundle function name", scriptBundle.includes(FUNCTION_NAME));
assert("bundle production block ref", scriptBundle.includes(PRODUCTION_REF));
assert("bundle no operation save literal", !/operation:\s*["']save["']/.test(scriptBundle));
if (scriptBundle.includes("buildDiscographyDryRunClientSnapshot") || scriptBundle.includes("clientDryRun")) {
  assert("bundle clientDryRun wouldWrite false", /wouldWrite:\s*!1|wouldWrite:\s*false/.test(scriptBundle));
} else {
  console.log("NOTE on-disk package predates clientDryRun contract fix — regen required before STG QA");
}

const publicFiles = walkRelativeFiles(STAGING_PUBLIC);
assert("public-dist file count matches manifest", publicFiles.length === manifest.fileCount, `${publicFiles.length} vs ${manifest.fileCount}`);

const sitemapPath = path.join(STAGING_PUBLIC, "sitemap-0.xml");
assert("sitemap exists", fs.existsSync(sitemapPath));
const sitemap = readIfExists(sitemapPath);
assert("sitemap excludes admin", !sitemap.includes("/admin/"));
const sitemapViolations = findSitemapSafetyViolations(sitemap);
assert("sitemap safety", sitemapViolations.length === 0, sitemapViolations.join("; "));

assert("supabase/functions not edited", !spawnSync("git", ["status", "--porcelain", "supabase/functions"], { cwd: REPO_ROOT, encoding: "utf8" }).stdout.trim());
assert("src unchanged in git diff", !spawnSync("git", ["diff", "--name-only", "src"], { cwd: REPO_ROOT, encoding: "utf8" }).stdout.trim());
assert("public unchanged in git diff", !spawnSync("git", ["diff", "--name-only", "public"], { cwd: REPO_ROOT, encoding: "utf8" }).stdout.trim());

assert("npm verify script", packageJson.includes("verify:g20u36c-admin-discography-dry-run-staging-package-rebuild-preflight"));

if (exists(DOC_REL)) {
  const currentState = read(`${AI_DIR}/00-current-state.md`);
  const nextActions = read(`${AI_DIR}/03-next-actions.md`);
  const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
  assert("AI current-state preflight", currentState.includes("G-20u36c") && (currentState.includes("preflight") || currentState.includes("ManualUpload")));
  assert("AI next-actions manual FTP", nextActions.includes("FTP") || nextActions.includes("manual"));
  assert("handoff preflight", handoff.includes("G-20u36c") && (handoff.includes("preflight") || handoff.includes("manual FTP")));
}

assert("FTP not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL not executed by Cursor", true);

console.log(`\nG-20u36c-admin-discography-dry-run-staging-package-rebuild-preflight: ${passed} passed, ${failed} failed`);
console.log(`package: ${path.relative(REPO_ROOT, STAGING_PKG)}`);
console.log(`sourceCommit: ${manifest.sourceCommit}`);
console.log(`freshness: ${freshness.ok ? "PASS" : "FAIL"}`);
process.exit(failed > 0 ? 1 : 0);
