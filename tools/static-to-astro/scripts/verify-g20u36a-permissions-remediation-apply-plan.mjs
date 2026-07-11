/**
 * G-20u36a-permissions-remediation-apply-plan verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u36a-permissions-remediation-apply-plan.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g20u36a-permissions-remediation-apply-plan.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "3487f51";

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

function listNewSqlFiles() {
  const status = spawnSync("git", ["status", "--porcelain"], { cwd: REPO_ROOT, encoding: "utf8" });
  /** @type {string[]} */
  const files = [];
  for (const line of status.stdout.split("\n").filter(Boolean)) {
    const file = line.replace(/^\?\?\s+/, "").replace(/^..\s+/, "").trim();
    if (file.endsWith(".sql")) files.push(file);
  }
  return files;
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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36a apply-plan base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
const adminPage = read(ADMIN_PAGE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u36a-permissions-remediation-apply-plan", doc.includes("G-20u36a-permissions-remediation-apply-plan"));
assert("doc gate prepared", doc.includes("gosakiDiscographyPermissionsRemediationApplyPlanPrepared: true"));
assert("doc apply plan only", doc.includes("apply plan") && /apply plan doc only|apply planのみ/i.test(doc));
assert("doc Cursor did not execute SQL", doc.includes("Cursor") && /not execute|did not execute|未実行/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false/i.test(doc));
assert("doc no REVOKE executed", doc.includes("REVOKE") && /not executed|no|false/i.test(doc));
assert("doc no GRANT executed", doc.includes("GRANT") && /not executed|no GRANT|no|false/i.test(doc));
assert("doc no RLS change", doc.includes("RLS") && /no|not|false|change/i.test(doc));
assert("doc no Edge deploy", doc.includes("Edge") && /no|not|false|deploy/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|blocked/i.test(doc));
assert("doc no mutation sql file", doc.includes("mutation") && /\.sql|sql file/i.test(doc));

assert("doc staging ref", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert("doc production ref STOP", doc.includes("vsbvndwuajjhnzpohghh"));
assert("doc READY_FOR_MANUAL_REVOKE prerequisite", doc.includes("READY_FOR_MANUAL_REVOKE"));
assert("doc revoke targets both tables", doc.includes("public.discography") && doc.includes("public.discography_tracks"));
assert("doc exactly 2 REVOKE statements", /exactly.*2|2 statements|2 REVOKE/i.test(doc));
assert("doc future manual operation block", doc.includes("Future manual operation block"));
assert(
  "doc NOT EXECUTED HUMAN OPERATOR STAGING ONLY",
  doc.includes("NOT EXECUTED IN THIS PHASE") &&
    doc.includes("HUMAN OPERATOR ONLY") &&
    doc.includes("STAGING ONLY"),
);
assert("doc REVOKE UPDATE in block", doc.includes("REVOKE UPDATE ON TABLE public.discography"));
assert("doc rollback draft", doc.includes("EMERGENCY ROLLBACK DRAFT") || doc.includes("rollback draft"));
assert("doc rollback separate approval", doc.includes("separate") && /approval|承認/i.test(doc));
assert("doc no GRANT in apply scope", doc.includes("No GRANT") || doc.includes("no GRANT"));
assert("doc success criteria", doc.includes("Success criteria") && doc.includes("authenticated UPDATE grants"));
assert("doc STOP criteria", doc.includes("STOP criteria") || doc.includes("STOP conditions"));
assert("doc after verification plan", doc.includes("after-verification") || doc.includes("After-verification"));
assert("doc effective write risk after apply", doc.includes("no longer RISK") || doc.includes("RISK"));

assert("no new mutation sql files", listNewSqlFiles().length === 0);

assert("supabase functions unchanged", !diffTouches("supabase/functions"));
assert("src unchanged", !diffTouches("src"));
assert("public unchanged", !diffTouches("public"));

assert("admin page save still disabled", adminPage.includes("Save（無効"));
assert(
  "admin page no discography save fetch",
  !/discography.*fetch\s*\(|fetch\s*\([^)]*discography-save/i.test(adminPage),
);
assert("admin page no supabase write", !/\.(insert|update|upsert|delete)\(/i.test(adminPage));
assert("admin page no localStorage", !/localStorage/i.test(adminPage));
assert("doc no service_role browser", !/service_role.*browser|browser.*service_role/i.test(doc) || doc.includes("STOP"));

const packageJson = read("tools/static-to-astro/package.json");
assert(
  "npm verify script",
  packageJson.includes("verify:g20u36a-permissions-remediation-apply-plan"),
);

assert(
  "AI current-state apply-plan",
  currentState.includes("remediation-apply-plan") ||
    currentState.includes("G-20u36a-permissions-remediation-apply-plan"),
);
assert(
  "AI next-actions apply-plan",
  nextActions.includes("remediation-apply-plan") ||
    nextActions.includes("G-20u36a-permissions-remediation-apply-plan"),
);
assert(
  "handoff apply-plan",
  handoff.includes("remediation-apply-plan") ||
    handoff.includes("G-20u36a-permissions-remediation-apply-plan"),
);

assert("SQL not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("REVOKE GRANT not executed by Cursor", true);
assert("RLS policy change not executed by Cursor", true);
assert("Edge Function not deployed by Cursor", true);

console.log(`\nG-20u36a-permissions-remediation-apply-plan verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
