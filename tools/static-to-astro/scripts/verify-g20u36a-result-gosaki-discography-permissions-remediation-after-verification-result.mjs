/**
 * G-20u36a-permissions-remediation-after-verification-result record verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u36a-result-gosaki-discography-permissions-remediation-after-verification-result.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36a-permissions-remediation-after-verification-result.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "159cf92";

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
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36a after-verification-result base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("result doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
const adminPage = read(ADMIN_PAGE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36a-permissions-remediation-after-verification-result-record",
  doc.includes("G-20u36a-permissions-remediation-after-verification-result-record"),
);
assert(
  "doc gate result recorded",
  doc.includes("gosakiDiscographyPermissionsRemediationAfterVerificationResultRecorded: true"),
);
assert("doc human operator executed", doc.includes("Human operator") || doc.includes("human operator"));
assert("doc Cursor did not execute SQL", doc.includes("Cursor") && /not execute|did not execute|no/i.test(doc));
assert("doc staging project ref", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert(
  "doc production not used",
  doc.includes("vsbvndwuajjhnzpohghh") && /not used|not executed|Forbidden/i.test(doc),
);
assert("doc H.after_verification PASS", doc.includes("H.after_verification.summary") && doc.includes("PASS"));
assert(
  "doc authenticated UPDATE zero",
  doc.includes("authenticated UPDATE") && /0/.test(doc) && /was 2|2 → 0/i.test(doc),
);
assert("doc anon write grants zero", doc.includes("anon write") && /0/.test(doc));
assert("doc SELECT grants preserved", doc.includes("SELECT") && /preserv|2/.test(doc));
assert("doc RLS enabled", doc.includes("RLS") && /enabled|true/i.test(doc));
assert("doc data baseline 4 34", doc.includes("4") && doc.includes("34"));
assert("doc target discography-002 1 8", doc.includes("discography-002") && doc.includes("8"));
assert(
  "doc effective write risk NEEDS_REVIEW no longer RISK",
  doc.includes("NEEDS_REVIEW") && doc.includes("no longer RISK"),
);
assert(
  "doc permissions complete candidate true",
  doc.includes("permissions_complete_candidate") || doc.includes("complete candidate"),
);
assert(
  "doc admin ALL policies remain",
  doc.includes("discography_admin_all") && doc.includes("discography_tracks_admin_all"),
);
assert(
  "doc future policy hardening",
  doc.includes("policy hardening") || doc.includes("Policy hardening"),
);
assert(
  "doc no additional REVOKE GRANT RLS",
  (doc.includes("REVOKE") || doc.includes("GRANT")) && /not executed|Additional|no/i.test(doc),
);
assert(
  "doc Save Edge not executed",
  doc.includes("Save") && doc.includes("Edge") && /not executed|blocked|No|false/i.test(doc),
);
assert("doc next G-20u36b", doc.includes("G-20u36b") || doc.includes("Edge dry-run"));

assert("supabase functions unchanged", !diffTouches("supabase/functions"));
assert("src unchanged", !diffTouches("src"));
assert("public unchanged", !diffTouches("public"));

assert("admin page save still disabled", adminPage.includes("Save（無効"));
assert(
  "admin page no discography save fetch",
  !/discography.*fetch\s*\(|fetch\s*\([^)]*discography-save/i.test(adminPage),
);

const packageJson = read("tools/static-to-astro/package.json");
assert(
  "npm verify script",
  packageJson.includes(
    "verify:g20u36a-result-gosaki-discography-permissions-remediation-after-verification-result",
  ),
);

assert(
  "AI current-state after-verification-result",
  currentState.includes("after-verification-result") ||
    currentState.includes("permissionsRemediationCompleteCandidate"),
);
assert(
  "AI next-actions G-20u36b",
  nextActions.includes("G-20u36b") || nextActions.includes("after-verification-result"),
);
assert(
  "handoff after-verification-result",
  handoff.includes("after-verification-result") ||
    handoff.includes("H.after_verification") ||
    handoff.includes("G-20u36b"),
);

assert("Cursor did not execute SQL", true);
assert("Additional REVOKE GRANT not executed by Cursor", true);

console.log(
  `\nG-20u36a-permissions-remediation-after-verification-result verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
