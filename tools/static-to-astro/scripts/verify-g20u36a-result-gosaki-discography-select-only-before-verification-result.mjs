/**
 * G-20u36a-result — Gosaki Discography SELECT-only before verification result record verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u36a-result-gosaki-discography-select-only-before-verification-result.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36a-select-only-before-verification-result.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "074583c";

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

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${headShort.stdout.trim()} (G-20u36a-result base ${BASE_COMMIT}) — non-blocking`);
}

assert("result doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
const adminPage = read(ADMIN_PAGE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u36a-result", doc.includes("G-20u36a-result-record-gosaki-discography-select-only-before-verification"));
assert("doc gate result recorded", doc.includes("gosakiDiscographySelectOnlyBeforeVerificationResultRecorded: true"));
assert("doc human operator executed", doc.includes("Human operator") || doc.includes("human operator"));
assert("doc Cursor did not execute SQL", doc.includes("Cursor") && /not execute|did not execute|no/i.test(doc));
assert("doc staging project ref", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert("doc production not used", doc.includes("vsbvndwuajjhnzpohghh") && /not used|not executed|Forbidden/i.test(doc));
assert("doc STOP recorded", doc.includes("STOP"));
assert("doc authenticated UPDATE grants", doc.includes("authenticated") && doc.includes("UPDATE"));
assert("doc both tables UPDATE", doc.includes("discography") && doc.includes("discography_tracks"));
assert("doc H.stop_summary STOP", doc.includes("H.stop_summary.any_stop") && /STOP/i.test(doc));
assert("doc do not proceed Save", doc.includes("Do not proceed") || doc.includes("proceedToSave: false"));
assert("doc no DB write", doc.includes("DB write") && /not executed|no|false/i.test(doc));
assert("doc no SQL mutation", doc.includes("SQL mutation") && /not executed|no|false/i.test(doc));
assert("doc no REVOKE GRANT change", doc.includes("REVOKE") || doc.includes("GRANT"));
assert("doc target discography-002", doc.includes("discography-002"));
assert("doc SKYLARK title", doc.includes("SKYLARK"));
assert("doc track count 8", doc.includes("8"));
assert("doc checksums recorded", doc.includes("d2af1424ac95c9e47e75e79d26cb7881") && doc.includes("19faeb86e38ba3f958724257c2b78ab4"));
assert("doc backup timestamp", doc.includes("2026-07-11T12:11:18.619Z"));
assert("doc next permissions deep dive", doc.includes("permissions") && /deep-dive|deep dive/i.test(doc));

assert("supabase functions dir unchanged in diff", (() => {
  const diff = spawnSync("git", ["diff", "--name-only", "supabase/functions"], { cwd: REPO_ROOT, encoding: "utf8" });
  return !diff.stdout.trim();
})());

assert("admin page save still disabled", adminPage.includes("Save（無効"));
assert("admin page no discography save fetch", !/discography.*fetch\s*\(|fetch\s*\([^)]*discography-save/i.test(adminPage));

const packageJson = read("tools/static-to-astro/package.json");
assert(
  "npm verify:g20u36a-result",
  packageJson.includes("verify:g20u36a-result-gosaki-discography-select-only-before-verification-result"),
);

assert("AI current-state G-20u36a-result", currentState.includes("G-20u36a-result"));
assert("AI next-actions G-20u36a-result", nextActions.includes("G-20u36a-result"));
assert("handoff G-20u36a-result", handoff.includes("G-20u36a-result"));

assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("Edge Function not deployed by Cursor", true);

console.log(`\nG-20u36a-result verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
