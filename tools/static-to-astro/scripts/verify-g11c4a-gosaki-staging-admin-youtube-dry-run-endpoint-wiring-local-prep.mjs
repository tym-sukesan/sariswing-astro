/**
 * G-11c4a — Gosaki staging admin YouTube dry-run endpoint wiring local prep.
 * Run: node tools/static-to-astro/scripts/verify-g11c4a-gosaki-staging-admin-youtube-dry-run-endpoint-wiring-local-prep.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const FUNCTION_NAME = "gosaki-youtube-url-dry-run";
const FUNCTION_URL = `https://${STAGING_REF}.supabase.co/functions/v1/${FUNCTION_NAME}`;
const STAGING_SUPABASE_URL = `https://${STAGING_REF}.supabase.co`;

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-staging-admin-youtube-dry-run-endpoint-wiring-local-prep.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const ADMIN_LIB_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts";
const ADMIN_HTML_REL =
  "tools/static-to-astro/output/static-public/gosaki-piano/public-dist/admin/index.html";
const MANUAL_ADMIN_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/admin/index.html";
const PACKAGE_REL = "tools/static-to-astro/output/manual-upload/gosaki-piano";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

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

const doc = exists(DOC_REL) ? read(DOC_REL) : "";
const adminPage = read(ADMIN_PAGE_REL);
const adminLib = read(ADMIN_LIB_REL);
const adminHtml = exists(ADMIN_HTML_REL) ? read(ADMIN_HTML_REL) : "";
const manualAdminHtml = exists(MANUAL_ADMIN_REL) ? read(MANUAL_ADMIN_REL) : "";

assert("G-11c4a doc exists", exists(DOC_REL));
assert(
  "G-11c4a doc phase",
  doc.includes("G-11c4a-gosaki-staging-admin-youtube-dry-run-endpoint-wiring-local-prep"),
);
assert("doc staging function URL", doc.includes(FUNCTION_URL));
assert("doc blocks production ref in endpoint", !doc.includes(`https://${PRODUCTION_REF}.supabase.co`));
assert("doc no FTP executed", doc.includes("cursorFtpUploadExecuted: false"));
assert("doc no deploy re-run", doc.includes("supabaseEdgeFunctionDeployExecuted: false") || doc.includes("no additional deploy"));

assert("admin page G-11c4a phase", adminPage.includes("G-11c4a"));
assert("admin page resolve endpoint", adminPage.includes("resolveG11c4aDryRunEndpoint"));
assert("admin page Bearer Authorization", adminPage.includes("Authorization"));
assert("admin page apikey header", adminPage.includes("apikey"));
assert("admin page auth required error", adminPage.includes("auth_required"));
assert("admin page dry-run only note", adminPage.includes("保存されません"));
assert("admin page endpoint configured UI", adminPage.includes("dry-run endpoint: configured"));
assert("admin page no service_role", !/service_role/i.test(adminPage));
assert("admin page no GITHUB_TOKEN", !/GITHUB_TOKEN/i.test(adminPage));
assert("admin page Save disabled", adminPage.includes("Save（無効）") && /disabled/.test(adminPage));
assert("admin page Publish disabled", adminPage.includes("Publish（無効）"));
assert("admin page Deploy disabled", adminPage.includes("Deploy（無効）"));

assert(
  "admin lib staging endpoint default",
  adminLib.includes("G11C4A_STAGING_DRY_RUN_ENDPOINT") &&
    adminLib.includes("gosaki-youtube-url-dry-run") &&
    adminLib.includes(STAGING_REF),
);
assert("admin lib staging ref only", adminLib.includes(STAGING_REF) && !adminLib.includes(PRODUCTION_REF));

assert("public-dist admin exists", exists(ADMIN_HTML_REL));
assert("built admin has staging endpoint URL", adminHtml.includes(FUNCTION_URL));
assert("built admin no production ref", !adminHtml.includes(PRODUCTION_REF));
assert("built admin endpoint configured", adminHtml.includes("dry-run endpoint: configured"));
assert("built admin dry-run button", adminHtml.includes("Dry-run（保存前チェック）"));
assert("built admin Bearer in script", adminHtml.includes("Authorization"));
assert("built admin auth panel", adminHtml.includes("gra-auth-status"));
assert("built admin Save disabled", adminHtml.includes("Save（無効）") && /disabled/.test(adminHtml));
assert("built admin no service_role", !/service_role/i.test(adminHtml));
assert("built admin no GITHUB_TOKEN", !/GITHUB_TOKEN/i.test(adminHtml));
assert("built admin no FTP secret patterns", !/FTP_PASS|LOLLIPOP|mirror\s+--delete/i.test(adminHtml));

assert("manual-upload admin exists", exists(MANUAL_ADMIN_REL));
assert("manual-upload has staging endpoint", manualAdminHtml.includes(FUNCTION_URL));
assert("manual-upload package dir", exists(PACKAGE_REL));
assert("manual-upload zip", exists(`${PACKAGE_REL}/gosaki-piano-manual-upload.zip`));

const adminDiff = spawnSync("git", ["diff", "--name-only", "--", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const adminStatus = spawnSync("git", ["status", "--short", "--", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert(
  "src/pages/admin unchanged",
  !adminDiff.stdout?.trim() && !adminStatus.stdout?.trim(),
);

console.log("");
console.log(`G-11c4a verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
