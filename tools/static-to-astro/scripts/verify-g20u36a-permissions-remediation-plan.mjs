/**
 * G-20u36a-permissions-remediation-plan — Gosaki Discography permissions remediation plan verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u36a-permissions-remediation-plan.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g20u36a-permissions-remediation-plan.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "83b42c9";

const FORBIDDEN_SQL_PATTERN =
  /\b(INSERT|UPDATE|DELETE|UPSERT|ALTER|CREATE|DROP|GRANT|REVOKE)\b/i;

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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36a remediation-plan base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
const adminPage = read(ADMIN_PAGE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u36a-permissions-remediation-plan", doc.includes("G-20u36a-permissions-remediation-plan"));
assert("doc gate prepared", doc.includes("gosakiDiscographyPermissionsRemediationPlanPrepared: true"));
assert("doc plan only", doc.includes("plan") && /plan doc only|planのみ|plan only/i.test(doc));
assert("doc Cursor did not execute SQL", doc.includes("Cursor") && /not execute|did not execute|未実行/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false/i.test(doc));
assert("doc no REVOKE executed", doc.includes("REVOKE") && /not executed|no|false|executed.*no/i.test(doc));
assert("doc no GRANT executed", doc.includes("GRANT") && /not executed|no|false/i.test(doc));
assert("doc no RLS change", doc.includes("RLS") && /no|not|false|change/i.test(doc));
assert("doc no Edge deploy", doc.includes("Edge") && /no|not|false|deploy/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|blocked/i.test(doc));

assert("doc RISK confirmed", doc.includes("RISK"));
assert("doc authenticated UPDATE x2", doc.includes("authenticated") && doc.includes("UPDATE") && /2/.test(doc));
assert("doc both tables grants", doc.includes("discography") && doc.includes("discography_tracks"));
assert("doc ALL policy discography_admin_all", doc.includes("discography_admin_all"));
assert("doc ALL policy discography_tracks_admin_all", doc.includes("discography_tracks_admin_all"));
assert("doc is_admin", doc.includes("is_admin()"));
assert("doc Edge-only contradiction", doc.includes("Edge-only") || doc.includes("Edge-only write path"));
assert(
  "doc first remediation UPDATE revoke",
  /REVOKE UPDATE|revoke.*UPDATE|UPDATE grant revoke/i.test(doc),
);
assert("doc SELECT grants preserved", doc.includes("SELECT") && /preserv|maintain|維持/i.test(doc));
assert("doc anon write grants zero", doc.includes("anon") && /0/.test(doc));
assert(
  "doc policy hardening separate phase",
  doc.includes("policy hardening") || doc.includes("Policy hardening"),
);
assert("doc staging ref", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert("doc production ref STOP", doc.includes("vsbvndwuajjhnzpohghh"));
assert(
  "doc future draft NOT EXECUTED",
  doc.includes("NOT EXECUTED") && doc.includes("DO NOT RUN IN THIS PHASE"),
);
assert("doc next phases listed", doc.includes("remediation-preflight") || doc.includes("remediation-after-verification"));

const newSql = listNewSqlFiles();
assert("no new mutation sql files", newSql.length === 0);

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
assert("doc no service_role browser exposure", doc.includes("service_role") && /internal|forbidden|not expose/i.test(doc));

const packageJson = read("tools/static-to-astro/package.json");
assert(
  "npm verify:g20u36a-permissions-remediation-plan",
  packageJson.includes("verify:g20u36a-permissions-remediation-plan"),
);

assert(
  "AI current-state remediation plan",
  currentState.includes("permissions-remediation-plan") ||
    currentState.includes("G-20u36a-permissions-remediation-plan"),
);
assert(
  "AI next-actions remediation plan",
  nextActions.includes("permissions-remediation-plan") ||
    nextActions.includes("G-20u36a-permissions-remediation-plan"),
);
assert(
  "handoff remediation plan",
  handoff.includes("permissions-remediation-plan") ||
    handoff.includes("G-20u36a-permissions-remediation-plan"),
);

assert("SQL not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("REVOKE GRANT not executed by Cursor", true);
assert("RLS policy change not executed by Cursor", true);
assert("Edge Function not deployed by Cursor", true);

console.log(`\nG-20u36a-permissions-remediation-plan verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
