/**
 * G-11c4b-fix — Gosaki staging admin auth configured login button enable.
 * Run: node tools/static-to-astro/scripts/verify-g11c4b-fix-gosaki-staging-admin-auth-configured-login-button-enable.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  STAGING_DRY_RUN_ENDPOINT,
  STAGING_SUPABASE_URL,
  PRODUCTION_PROJECT_REF,
} from "./lib/gosaki-staging-admin-public-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-staging-admin-auth-configured-login-button-enable-fix.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const ADMIN_HTML_REL =
  "tools/static-to-astro/output/static-public/gosaki-piano/public-dist/admin/index.html";
const MANUAL_ADMIN_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/admin/index.html";
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
const adminHtml = exists(ADMIN_HTML_REL) ? read(ADMIN_HTML_REL) : "";
const manualAdminHtml = exists(MANUAL_ADMIN_REL) ? read(MANUAL_ADMIN_REL) : "";

assert("G-11c4b-fix doc exists", exists(DOC_REL));
assert(
  "doc phase",
  doc.includes("G-11c4b-fix-gosaki-staging-admin-auth-configured-login-button-enable"),
);

assert("admin page G-11c4b-fix phase", adminPage.includes("G11C4B_FIX_PHASE"));
assert("admin page waitForSupabaseClient", adminPage.includes("waitForSupabaseClient"));
assert("admin page signedIn dry-run gate", adminPage.includes("signedIn"));
assert("admin page login not disabled when configured", adminPage.includes("disabled={!supabaseAuthConfigured}"));
assert("admin page dry-run initially disabled", adminPage.includes('id="gra-youtube-dry-run-btn"') && adminPage.includes("disabled"));

assert("public-dist admin exists", exists(ADMIN_HTML_REL));
assert("built auth configured true", adminHtml.includes('data-gosaki-supabase-auth-configured="true"'));
assert("built configured banner", adminHtml.includes("Supabase Auth: configured"));
assert(
  "built no static build-missing warn",
  !adminHtml.includes("Supabase Auth 未設定 — build 時に"),
);
assert("built staging supabase url", adminHtml.includes(`data-gosaki-supabase-url="${STAGING_SUPABASE_URL}"`));
assert("built staging dry-run endpoint", adminHtml.includes(STAGING_DRY_RUN_ENDPOINT));
assert("built login button without disabled attr", /id="gra-auth-sign-in-btn"[^>]*class="[^"]*btn--primary"/.test(adminHtml) && !/id="gra-auth-sign-in-btn"[^>]*disabled/.test(adminHtml));
assert("built logout button disabled", /id="gra-auth-sign-out-btn"[^>]*disabled/.test(adminHtml));
assert("built dry-run button disabled", /id="gra-youtube-dry-run-btn"[^>]*disabled/.test(adminHtml));
assert("built Save disabled", adminHtml.includes("Save（無効）") && /disabled/.test(adminHtml));
assert("built no production ref", !adminHtml.includes(PRODUCTION_PROJECT_REF));
assert("built no service_role", !/service_role/i.test(adminHtml));

assert("manual-upload auth fix", manualAdminHtml.includes("G-11c4b-fix") || manualAdminHtml.includes("waitForSupabaseClient"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "--", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", !adminDiff.stdout?.trim());

console.log("");
console.log(`G-11c4b-fix verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
