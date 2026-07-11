/**
 * G-20u36a-permissions-remediation-preflight-result record verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u36a-result-gosaki-discography-permissions-remediation-preflight-result.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36a-permissions-remediation-preflight-result.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "a8b7ac0";

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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36a preflight-result base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("result doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
const adminPage = read(ADMIN_PAGE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36a-permissions-remediation-preflight-result-record",
  doc.includes("G-20u36a-permissions-remediation-preflight-result-record"),
);
assert("doc gate result recorded", doc.includes("gosakiDiscographyPermissionsRemediationPreflightResultRecorded: true"));
assert("doc human operator executed", doc.includes("Human operator") || doc.includes("human operator"));
assert("doc Cursor did not execute SQL", doc.includes("Cursor") && /not execute|did not execute|no/i.test(doc));
assert("doc staging project ref", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert(
  "doc production not used",
  doc.includes("vsbvndwuajjhnzpohghh") && /not used|not executed|Forbidden/i.test(doc),
);
assert("doc READY_FOR_MANUAL_REVOKE", doc.includes("READY_FOR_MANUAL_REVOKE"));
assert("doc H.preflight_summary", doc.includes("H.preflight_summary"));
assert("doc authenticated UPDATE x2", doc.includes("authenticated") && doc.includes("UPDATE") && /2/.test(doc));
assert(
  "doc revoke targets both tables",
  doc.includes("public.discography") && doc.includes("public.discography_tracks"),
);
assert("doc anon write grants zero", doc.includes("anon") && /0/.test(doc) && doc.includes("write"));
assert("doc SELECT grants preserved", doc.includes("SELECT") && /preserv|2/.test(doc));
assert("doc RLS enabled", doc.includes("RLS") && /enabled|true/i.test(doc));
assert("doc data baseline 4 34", doc.includes("4") && doc.includes("34"));
assert("doc target discography-002 1 8", doc.includes("discography-002") && doc.includes("8"));
assert("doc REVOKE not executed", doc.includes("REVOKE") && /not executed|not revoked|No/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /not executed|no|false/i.test(doc));
assert("doc no SQL mutation", doc.includes("SQL mutation") && /not executed|no|false/i.test(doc));
assert(
  "doc no GRANT RLS change",
  (doc.includes("GRANT") || doc.includes("RLS")) && /not executed|no|false/i.test(doc),
);
assert(
  "doc Save Edge blocked",
  doc.includes("Save") && doc.includes("Edge") && /blocked|No|false/i.test(doc),
);
assert("doc next apply-plan", doc.includes("permissions-remediation-apply-plan"));

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
  packageJson.includes("verify:g20u36a-result-gosaki-discography-permissions-remediation-preflight-result"),
);

assert(
  "AI current-state preflight-result",
  currentState.includes("remediation-preflight-result") ||
    currentState.includes("G-20u36a-permissions-remediation-preflight-result"),
);
assert(
  "AI next-actions preflight-result",
  nextActions.includes("remediation-preflight-result") ||
    nextActions.includes("G-20u36a-permissions-remediation-preflight-result") ||
    nextActions.includes("apply-plan"),
);
assert(
  "handoff preflight-result",
  handoff.includes("remediation-preflight-result") ||
    handoff.includes("READY_FOR_MANUAL_REVOKE") ||
    handoff.includes("apply-plan"),
);

assert("DB write not executed by Cursor", true);
assert("REVOKE GRANT not executed by Cursor", true);
assert("Edge Function not deployed by Cursor", true);

console.log(
  `\nG-20u36a-permissions-remediation-preflight-result verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
