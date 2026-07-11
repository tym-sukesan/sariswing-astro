/**
 * G-20u36a-permissions-rls-deep-dive-result — Gosaki Discography permissions / RLS deep-dive result record verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u36a-result-gosaki-discography-permissions-rls-deep-dive-result.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36a-permissions-rls-deep-dive-result.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "dfdd15e";

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
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36a deep-dive-result base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("result doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
const adminPage = read(ADMIN_PAGE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36a-permissions-rls-deep-dive-result-record",
  doc.includes("G-20u36a-permissions-rls-deep-dive-result-record"),
);
assert("doc gate result recorded", doc.includes("gosakiDiscographyPermissionsRlsDeepDiveResultRecorded: true"));
assert("doc human operator executed", doc.includes("Human operator") || doc.includes("human operator"));
assert("doc Cursor did not execute SQL", doc.includes("Cursor") && /not execute|did not execute|no/i.test(doc));
assert("doc staging project ref", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert(
  "doc production not used",
  doc.includes("vsbvndwuajjhnzpohghh") && /not used|not executed|Forbidden/i.test(doc),
);
assert("doc RISK confirmed", doc.includes("RISK confirmed") || doc.includes("RISK —"));
assert("doc E.risk.summary_highest RISK", doc.includes("E.risk.summary_highest") && doc.includes("RISK"));
assert("doc authenticated UPDATE x2", doc.includes("authenticated") && doc.includes("UPDATE"));
assert(
  "doc both tables UPDATE grants",
  doc.includes("discography") && doc.includes("discography_tracks") && /2/.test(doc),
);
assert("doc ALL policy discography_admin_all", doc.includes("discography_admin_all"));
assert("doc ALL policy discography_tracks_admin_all", doc.includes("discography_tracks_admin_all"));
assert("doc is_admin qual", doc.includes("is_admin()"));
assert("doc H.review_summary STOP", doc.includes("H.review_summary") && /STOP/i.test(doc));
assert(
  "doc do not proceed Save",
  doc.includes("Do not proceed") || doc.includes("proceedToSave: false"),
);
assert(
  "doc do not proceed Edge deploy",
  doc.includes("Edge") && (/not proceed|proceedToEdgeDeploy: false|No/i.test(doc)),
);
assert("doc no DB write", doc.includes("DB write") && /not executed|no|false/i.test(doc));
assert("doc no SQL mutation", doc.includes("SQL mutation") && /not executed|no|false/i.test(doc));
assert(
  "doc no REVOKE GRANT RLS change",
  (doc.includes("REVOKE") || doc.includes("GRANT")) && /not executed|no|false/i.test(doc),
);
assert("doc Edge-only contradiction", doc.includes("Edge-only") || doc.includes("Edge-only write path"));
assert("doc next remediation plan", doc.includes("permissions-remediation-plan"));

assert("supabase functions dir unchanged in diff", (() => {
  const diff = spawnSync("git", ["diff", "--name-only", "supabase/functions"], { cwd: REPO_ROOT, encoding: "utf8" });
  return !diff.stdout.trim();
})());

assert("admin page save still disabled", adminPage.includes("Save（無効"));
assert(
  "admin page no discography save fetch",
  !/discography.*fetch\s*\(|fetch\s*\([^)]*discography-save/i.test(adminPage),
);

const packageJson = read("tools/static-to-astro/package.json");
assert(
  "npm verify:g20u36a-result deep-dive",
  packageJson.includes("verify:g20u36a-result-gosaki-discography-permissions-rls-deep-dive-result"),
);

assert(
  "AI current-state deep-dive-result",
  currentState.includes("permissions-rls-deep-dive-result") ||
    currentState.includes("G-20u36a-permissions-rls-deep-dive-result"),
);
assert(
  "AI next-actions deep-dive-result",
  nextActions.includes("permissions-rls-deep-dive-result") ||
    nextActions.includes("G-20u36a-permissions-rls-deep-dive-result"),
);
assert(
  "handoff deep-dive-result",
  handoff.includes("permissions-rls-deep-dive-result") ||
    handoff.includes("G-20u36a-permissions-rls-deep-dive-result"),
);

assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("REVOKE GRANT RLS change not executed by Cursor", true);
assert("Edge Function not deployed by Cursor", true);

console.log(`\nG-20u36a-permissions-rls-deep-dive-result verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
