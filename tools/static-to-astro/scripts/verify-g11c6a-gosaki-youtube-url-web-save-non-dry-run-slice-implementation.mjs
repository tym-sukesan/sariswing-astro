/**
 * G-11c6a — Gosaki YouTube URL web-save non-dry-run slice implementation (local-only).
 * Run: node tools/static-to-astro/scripts/verify-g11c6a-gosaki-youtube-url-web-save-non-dry-run-slice-implementation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  G11C6_APPROVAL_ID,
  G11C6_OPERATION_ID,
  G11C6_PRODUCTION_PROJECT_REF,
  G11C6_SAVE_ARMED_ENV,
  G11C6_SAVE_ENABLED_ENV,
  G11C6_SAVE_ENDPOINT_SUFFIX,
  G11C6_STAGING_PROJECT_REF,
  G11C6_WORKFLOW_FILE,
} from "./lib/gosaki-youtube-url-save-constants.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-youtube-url-web-save-non-dry-run-slice-implementation.md";
const EDGE_INDEX_REL = "supabase/functions/gosaki-youtube-url-save/index.ts";
const EDGE_SHARED_REL = "supabase/functions/_shared/gosaki-youtube-url-save.ts";
const CONFIG_REL = "supabase/config.toml";
const WORKFLOW_REL = ".github/workflows/gosaki-youtube-url-save-staging.yml";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const ADMIN_LIB_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts";
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

const doc = read(DOC_REL);
const edgeIndex = read(EDGE_INDEX_REL);
const edgeShared = read(EDGE_SHARED_REL);
const config = read(CONFIG_REL);
const workflow = read(WORKFLOW_REL);
const adminPage = read(ADMIN_PAGE_REL);
const adminLib = read(ADMIN_LIB_REL);

assert("G-11c6a doc exists", exists(DOC_REL));
assert("doc phase G-11c6a", doc.includes("G-11c6a"));
assert("doc no deploy", doc.includes("Deploy") && doc.includes("**no**"));
assert("doc Save UI disabled", doc.includes("disabled"));

assert("Edge save index exists", exists(EDGE_INDEX_REL));
assert("Edge save shared exists", exists(EDGE_SHARED_REL));
assert("Edge requireAdminUser", edgeIndex.includes("requireAdminUser"));
assert("Edge uses save handler", edgeIndex.includes("handleG11c6YoutubeUrlSaveBody"));
assert("shared staging ref", edgeShared.includes(G11C6_STAGING_PROJECT_REF));
assert("shared production block", edgeShared.includes(G11C6_PRODUCTION_PROJECT_REF));
assert("shared ADMIN_EMAILS path via requireAdminUser in index", edgeIndex.includes("requireAdminUser"));
assert("shared no service_role", !/service_role/i.test(edgeShared));
assert("shared dryRun false required", edgeShared.includes('dryRun must be false'));
assert("shared saveEnabled true required", edgeShared.includes("saveEnabled must be true"));
assert("shared approvalId", edgeShared.includes(G11C6_APPROVAL_ID));
assert("shared conflict 409", edgeShared.includes("httpStatus: 409"));
assert("shared no workflow dispatch call", !edgeShared.includes("api.github.com"));
assert("shared dispatch deferred", edgeShared.includes("workflowDispatchExecuted: false"));
assert("shared save armed env", edgeShared.includes(G11C6_SAVE_ARMED_ENV));
assert("shared reuses dry-run validation", edgeShared.includes("executeG11c1YoutubeUrlDryRun"));

assert("config.toml save function", config.includes("[functions.gosaki-youtube-url-save]"));
assert("config verify_jwt true", /\[functions\.gosaki-youtube-url-save\][\s\S]*verify_jwt = true/.test(config));

assert("workflow file exists", exists(WORKFLOW_REL));
assert("workflow workflow_dispatch only", workflow.includes("workflow_dispatch:"));
assert("workflow no push trigger", !/\bon:\s*\n[\s\S]*\bpush:/m.test(workflow));
assert("workflow no pull_request", !workflow.includes("pull_request:"));
assert("workflow no schedule", !workflow.includes("schedule:"));
assert("workflow no FTP", !/lftp|ftp:|mirror|--delete/i.test(workflow));
assert("workflow filename constant", workflow.includes(G11C6_WORKFLOW_FILE) || edgeShared.includes(G11C6_WORKFLOW_FILE));

assert("admin page save endpoint attr", adminPage.includes("data-gosaki-youtube-save-endpoint"));
assert("admin page save btn disabled", adminPage.includes('id="gra-youtube-save-btn"') && adminPage.includes("disabled"));
assert("admin page G-11c6a phase", adminPage.includes("G-11c6a"));
assert(
  "admin page save btn has no listener",
  !/gra-youtube-save-btn[\s\S]{0,200}addEventListener/.test(adminPage),
);
assert("admin lib save endpoint", adminLib.includes(G11C6_SAVE_ENDPOINT_SUFFIX));
assert("admin lib save default disabled env", adminLib.includes(G11C6_SAVE_ENABLED_ENV));
assert("admin lib staging ref only", adminLib.includes(G11C6_STAGING_PROJECT_REF));

const envDiff = spawnSync("git", ["diff", "--name-only", "--", ".env", ".env.local"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert(".env unchanged", !envDiff.stdout?.trim());

const adminDiff = spawnSync("git", ["diff", "--name-only", "--", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", !adminDiff.stdout?.trim());

assert(
  "no real email in implementation doc",
  !/@(?!example\.com)[a-z0-9.-]+\.[a-z]{2,}/i.test(doc.replace(/example\.com/g, "")),
);

console.log("");
console.log(`G-11c6a verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
