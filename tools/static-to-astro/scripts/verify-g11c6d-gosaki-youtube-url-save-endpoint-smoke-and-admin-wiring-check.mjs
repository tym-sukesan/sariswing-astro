/**
 * G-11c6d — Gosaki YouTube URL save endpoint smoke and admin wiring check.
 * Run: node tools/static-to-astro/scripts/verify-g11c6d-gosaki-youtube-url-save-endpoint-smoke-and-admin-wiring-check.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const FUNCTION_NAME = "gosaki-youtube-url-save";
const DRY_RUN_FUNCTION = "gosaki-youtube-url-dry-run";
const FUNCTION_URL = `https://${STAGING_REF}.supabase.co/functions/v1/${FUNCTION_NAME}`;

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-youtube-url-save-endpoint-smoke-and-admin-wiring-check.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const ADMIN_LIB_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts";
const SAVE_SHARED_REL = "supabase/functions/_shared/gosaki-youtube-url-save.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const G11C6C_VERIFIER =
  "tools/static-to-astro/scripts/verify-g11c6c-gosaki-youtube-url-save-edge-function-deploy-execution-result.mjs";

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

const doc = read(DOC_REL);
const adminPage = read(ADMIN_PAGE_REL);
const adminLib = read(ADMIN_LIB_REL);
const saveShared = read(SAVE_SHARED_REL);

assert("G-11c6d doc exists", exists(DOC_REL));
assert("doc phase G-11c6d", doc.includes("G-11c6d-gosaki-youtube-url-save-endpoint-smoke-and-admin-wiring-check"));
assert("doc function URL save", doc.includes(FUNCTION_URL));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production not operation target", doc.includes(PRODUCTION_REF) && doc.includes("not used"));
assert("doc unauth 401", doc.includes("401") && doc.includes("UNAUTHORIZED_NO_AUTH_HEADER"));
assert("doc Save disabled", doc.includes("disabled"));
assert("doc saveEnabled true not sent", doc.includes("saveEnabled:true") && doc.includes("not sent"));
assert("doc no deploy", doc.includes("supabaseFunctionsDeployExecuted: false"));
assert("doc no secrets set", doc.includes("supabaseSecretsSetExecuted: false"));
assert("doc no workflow_dispatch", doc.includes("workflowDispatchExecuted: false"));
assert("doc no DB JSON FTP", doc.includes("cursorDbWriteExecuted: false") && doc.includes("cursorJsonWriteExecuted: false"));
assert("doc dry-run unchanged", doc.includes(DRY_RUN_FUNCTION));
assert("doc next G-11c7", doc.includes("G-11c7"));
assert(
  "doc no real email",
  !/@(?!example\.com)[a-z0-9.-]+\.[a-z]{2,}/i.test(doc.replace(/example\.com/g, "")),
);

assert("admin lib save endpoint", adminLib.includes(`/functions/v1/${FUNCTION_NAME}`));
assert("admin lib dry-run endpoint", adminLib.includes(`/functions/v1/${DRY_RUN_FUNCTION}`));
assert("admin lib save default false", adminLib.includes("G11C6_SAVE_ENABLED_DEFAULT = false"));
assert("admin page save endpoint attr", adminPage.includes("data-gosaki-youtube-save-endpoint"));
assert("admin page dry-run endpoint attr", adminPage.includes("data-gosaki-youtube-dry-run-endpoint"));
assert("admin page save btn disabled", adminPage.includes('id="gra-youtube-save-btn"') && adminPage.includes("disabled"));
assert(
  "admin page no save btn listener",
  !/gra-youtube-save-btn[\s\S]{0,200}addEventListener/.test(adminPage),
);
assert("admin page dry-run listener exists", adminPage.includes("gra-youtube-dry-run-btn"));
assert("save shared saveEnabled gate", saveShared.includes("saveEnabled must be true"));
assert("save shared save_not_armed", saveShared.includes("save_not_armed"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "--", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", !adminDiff.stdout?.trim());

const envDiff = spawnSync("git", ["diff", "--name-only", "--", ".env", ".env.local"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert(".env unchanged", !envDiff.stdout?.trim());

console.log("");
console.log("Running G-11c6c verifier...");
const g11c6c = spawnSync("node", [path.join(REPO_ROOT, G11C6C_VERIFIER)], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
if (g11c6c.stdout) process.stdout.write(g11c6c.stdout);
if (g11c6c.stderr) process.stderr.write(g11c6c.stderr);
assert("G-11c6c verifier PASS", g11c6c.status === 0);

console.log("");
console.log(`G-11c6d verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
