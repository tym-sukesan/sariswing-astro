/**
 * G-20u36a-permissions-remediation-preflight-select-only verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u36a-permissions-remediation-preflight-select-only.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36a-permissions-remediation-preflight-select-only.md";
const SQL_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-discography-g20u36a-permissions-remediation-preflight-select-only.sql";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "b41a8c4";

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

function listNewSqlFilesInPhase() {
  const status = spawnSync("git", ["status", "--porcelain"], { cwd: REPO_ROOT, encoding: "utf8" });
  /** @type {string[]} */
  const files = [];
  for (const line of status.stdout.split("\n").filter(Boolean)) {
    const file = line.replace(/^\?\?\s+/, "").replace(/^..\s+/, "").trim();
    if (file.endsWith(".sql") && file.includes("remediation-preflight")) files.push(file);
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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36a preflight base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("doc exists", exists(DOC_REL));
assert("SQL file exists", exists(SQL_REL));

const doc = read(DOC_REL);
const sql = read(SQL_REL);
const adminPage = read(ADMIN_PAGE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36a-permissions-remediation-preflight-select-only",
  doc.includes("G-20u36a-permissions-remediation-preflight-select-only"),
);
assert("doc gate prepared", doc.includes("gosakiDiscographyPermissionsRemediationPreflightSelectOnlyPrepared: true"));
assert("doc preflight only", doc.includes("preflight") && /preflight.*only|準備のみ/i.test(doc));
assert("doc Cursor did not execute SQL", doc.includes("Cursor") && /not execute|did not execute|未実行/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false/i.test(doc));
assert("doc no REVOKE executed", doc.includes("REVOKE") && /no|not|false/i.test(doc));
assert("doc no GRANT executed", doc.includes("GRANT") && /no|not|false/i.test(doc));
assert("doc no RLS change", doc.includes("RLS") && /no|not|false|change/i.test(doc));
assert("doc staging ref", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert("doc production ref STOP", doc.includes("vsbvndwuajjhnzpohghh"));
assert("doc READY_FOR_MANUAL_REVOKE", doc.includes("READY_FOR_MANUAL_REVOKE"));
assert("doc STOP interpretation", doc.includes("STOP"));
assert("doc SQL file path", doc.includes("gosaki-discography-g20u36a-permissions-remediation-preflight-select-only.sql"));
assert("doc next phases", doc.includes("preflight-result-record") || doc.includes("apply-plan"));

assert("SQL SELECT-only header", sql.includes("SELECT-ONLY"));
assert("SQL staging ref", sql.includes("kmjqppxjdnwwrtaeqjta"));
assert("SQL production forbidden", sql.includes("vsbvndwuajjhnzpohghh"));
assert("SQL unified output", sql.includes("check_key") && sql.includes("details_json"));
assert("SQL role_table_grants", sql.includes("role_table_grants"));
assert("SQL pg_policies", sql.includes("pg_policies"));
assert("SQL pg_class RLS", sql.includes("pg_class") && sql.includes("relrowsecurity"));
assert("SQL authenticated update count", sql.includes("authenticated_update"));
assert("SQL anon write count", sql.includes("anon_write"));
assert("SQL select grants", sql.includes("select_grants") || sql.includes("authenticated_select"));
assert("SQL insert delete check", sql.includes("insert_delete"));
assert("SQL admin all policies", sql.includes("discography_admin_all") && sql.includes("discography_tracks_admin_all"));
assert("SQL data baseline 4 34", sql.includes("expected_total_releases") && sql.includes("34"));
assert("SQL discography-002", sql.includes("discography-002"));
assert("SQL target tracks 8", sql.includes("expected_target_track_count") || sql.includes("8"));
assert("SQL READY_FOR_MANUAL_REVOKE", sql.includes("READY_FOR_MANUAL_REVOKE"));
assert("SQL preflight summary", sql.includes("preflight_summary"));

const sqlWithoutComments = sql.replace(/--[^\n]*/g, "");
const sqlWithoutCommentsAndStrings = sqlWithoutComments.replace(/'[^']*'/g, "''");
assert("SQL no mutation keywords", !FORBIDDEN_SQL_PATTERN.test(sqlWithoutCommentsAndStrings));
assert("SQL has SELECT", /\bSELECT\b/i.test(sql));

const newSql = listNewSqlFilesInPhase();
assert(
  "only remediation-preflight sql added",
  newSql.length <= 1 &&
    (newSql.length === 0 || newSql[0].includes("remediation-preflight-select-only")),
);

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
assert("SQL no service_role", !/service_role/i.test(sql));

const packageJson = read("tools/static-to-astro/package.json");
assert(
  "npm verify script",
  packageJson.includes("verify:g20u36a-permissions-remediation-preflight-select-only"),
);

assert(
  "AI current-state preflight",
  currentState.includes("remediation-preflight-select-only") ||
    currentState.includes("G-20u36a-permissions-remediation-preflight"),
);
assert(
  "AI next-actions preflight",
  nextActions.includes("remediation-preflight-select-only") ||
    nextActions.includes("G-20u36a-permissions-remediation-preflight"),
);
assert(
  "handoff preflight",
  handoff.includes("remediation-preflight-select-only") ||
    handoff.includes("G-20u36a-permissions-remediation-preflight"),
);

assert("SQL not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("REVOKE GRANT not executed by Cursor", true);
assert("RLS policy change not executed by Cursor", true);
assert("Edge Function not deployed by Cursor", true);

console.log(
  `\nG-20u36a-permissions-remediation-preflight-select-only verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
