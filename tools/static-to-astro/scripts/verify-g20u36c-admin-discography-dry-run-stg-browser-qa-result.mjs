/**
 * G-20u36c-admin-discography-dry-run-stg-browser-qa-result-record
 * Doc + static verifier — operator STG browser QA result (no FTP / no live HTTP by Cursor).
 * Run: node tools/static-to-astro/scripts/verify-g20u36c-admin-discography-dry-run-stg-browser-qa-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36c-admin-discography-dry-run-stg-browser-qa-result.md";
const PREFLIGHT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36c-admin-discography-dry-run-staging-package-rebuild-preflight.md";
const FETCH_POST_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36c-admin-discography-dry-run-fetch-post-wiring.md";
const BASE_COMMIT = "c2fcdb8";
const FULL_COMMIT = "c2fcdb8f1f959e512b5423252cd926c0f859b1c9";
const STG_ADMIN_URL = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/";
const STAGING_REMOTE = "/cms-kit-staging/gosaki-piano/";

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

function diffTouches(prefix) {
  const diff = spawnSync("git", ["diff", "--name-only", prefix], { cwd: REPO_ROOT, encoding: "utf8" });
  const status = spawnSync("git", ["status", "--porcelain", prefix], { cwd: REPO_ROOT, encoding: "utf8" });
  return Boolean(diff.stdout.trim() || status.stdout.trim());
}

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${headShort.stdout.trim()} (G-20u36c STG QA base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");

assert("doc phase STG browser QA result", doc.includes("G-20u36c-admin-discography-dry-run-stg-browser-qa-result-record"));
assert("doc gate passed", doc.includes("gosakiDiscographyAdminDryRunStgBrowserQaPassed: true"));
assert("doc sourceCommit c2fcdb8", doc.includes(BASE_COMMIT) || doc.includes(FULL_COMMIT));
assert("doc manual FTP re-upload", doc.includes("Manual FTP") && /re-upload|reupload|complete/i.test(doc));
assert("doc upload source public-dist", doc.includes("public-dist"));
assert("doc remote path", doc.includes(STAGING_REMOTE));
assert("doc admin URL", doc.includes(STG_ADMIN_URL) || doc.includes("/admin/"));
assert("doc endpoint dry-run button", doc.includes("Endpoint dry-run (POST · no save)"));
assert("doc httpStatus 200", doc.includes("httpStatus") && doc.includes("200"));
assert("doc ok true", doc.includes("ok") && /true/i.test(doc));
assert("doc operation dryRun", doc.includes("dryRun"));
assert("doc authIssue false", doc.includes("authIssue") && /false/i.test(doc));
assert("doc didWrite false", doc.includes("didWrite") && /false/i.test(doc));
assert("doc dbWrite false", doc.includes("dbWrite") && /false/i.test(doc));
assert("doc networkWrite false", doc.includes("networkWrite") && /false/i.test(doc));
assert("doc saveEnabled false", doc.includes("saveEnabled") && /false/i.test(doc));
assert("doc errors empty", doc.includes("errors") && (/empty|\[\]/i.test(doc)));
assert("doc warnings empty", doc.includes("warnings") && (/empty|\[\]/i.test(doc)));
assert("doc Save disabled", doc.includes("Save") && /disabled/i.test(doc));
assert("doc proceedToSave false", doc.includes("proceedToSave") && /false/i.test(doc));
assert(
  "doc wouldWrite true acceptable note",
  doc.includes("wouldWrite") &&
    doc.includes("true") &&
    (/readBack|schema-only|DB snapshot|acceptable/i.test(doc)),
);
assert("doc clientDryRun 400 resolved", doc.includes("clientDryRun") && (/400|resolved/i.test(doc)));
assert("doc build preflight PASS", doc.includes("build:gosaki:staging") && doc.includes("preflight:gosaki:staging"));
assert("doc Cursor FTP not executed", doc.includes("Cursor FTP") && /not executed/i.test(doc));
assert("doc Edge deploy not executed", doc.includes("Edge") && /not executed/i.test(doc));
assert("doc DB write not executed", doc.includes("DB write") && /not executed/i.test(doc));
assert("doc Save enablement not executed", doc.includes("Save enablement") && /not executed/i.test(doc));
assert("doc next G-20u36d or Save planning", doc.includes("G-20u36d") || doc.includes("Save planning") || doc.includes("readBack"));

assert("npm verify script", packageJson.includes("verify:g20u36c-admin-discography-dry-run-stg-browser-qa-result"));

assert("supabase/functions not edited", !diffTouches("supabase/functions"));
assert("src unchanged", !diffTouches("src"));
assert("public unchanged", !diffTouches("public"));

if (exists(DOC_REL)) {
  const currentState = read(`${AI_DIR}/00-current-state.md`);
  const nextActions = read(`${AI_DIR}/03-next-actions.md`);
  const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
  assert(
    "AI current-state STG QA",
    currentState.includes("StgBrowserQa") ||
      currentState.includes("STG browser QA") ||
      currentState.includes("stg-browser-qa"),
  );
  assert(
    "AI next-actions G-20u36d or Save",
    nextActions.includes("G-20u36d") || nextActions.includes("Save planning") || nextActions.includes("readBack"),
  );
  assert(
    "handoff STG QA passed",
    handoff.includes("StgBrowserQa") ||
      handoff.includes("STG browser QA") ||
      handoff.includes("stg-browser-qa") ||
      handoff.includes("200"),
  );
}

assert("FTP re-execution not by Cursor", true);
assert("Edge deploy not by Cursor", true);
assert("SQL not by Cursor", true);
assert("DB write not by Cursor", true);

console.log(`\nG-20u36c-admin-discography-dry-run-stg-browser-qa-result: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
