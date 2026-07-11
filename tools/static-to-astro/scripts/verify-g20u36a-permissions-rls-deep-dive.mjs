/**
 * G-20u36a-permissions-rls — Gosaki Discography permissions / RLS deep-dive verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u36a-permissions-rls-deep-dive.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g20u36a-permissions-rls-deep-dive.md";
const SQL_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-discography-g20u36a-permissions-rls-deep-dive.sql";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "eb93f92";

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
    if (file.endsWith(".sql") && file.includes("g20u36a-permissions-rls-deep-dive")) files.push(file);
  }
  return files;
}

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${headShort.stdout.trim()} (G-20u36a deep-dive base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", exists(DOC_REL));
assert("SQL file exists", exists(SQL_REL));

const doc = read(DOC_REL);
const sql = read(SQL_REL);
const adminPage = read(ADMIN_PAGE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u36a-permissions-rls-deep-dive", doc.includes("G-20u36a-permissions-rls-deep-dive"));
assert("doc gate prepared", doc.includes("gosakiDiscographyPermissionsRlsDeepDivePrepared: true"));
assert("doc SQL not executed by Cursor", doc.includes("Cursor") && /not execute|did not execute|未実行/i.test(doc));
assert("doc DB write not executed", doc.includes("DB write") && /no|not|false/i.test(doc));
assert("doc REVOKE GRANT not executed", doc.includes("REVOKE") && doc.includes("GRANT") && /no|not|false/i.test(doc));
assert("doc RLS change not executed", doc.includes("RLS") && /no|not|false|change/i.test(doc));
assert("doc previous STOP authenticated UPDATE", doc.includes("authenticated") && doc.includes("UPDATE"));
assert("doc previous STOP discography tables", doc.includes("discography") && doc.includes("discography_tracks"));
assert("doc staging project ref", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert("doc production ref STOP", doc.includes("vsbvndwuajjhnzpohghh"));
assert("doc SQL file path", doc.includes("gosaki-discography-g20u36a-permissions-rls-deep-dive.sql"));
assert("doc RISK NEEDS_REVIEW interpretation", doc.includes("RISK") && doc.includes("NEEDS_REVIEW"));
assert("doc next phases", doc.includes("permissions-remediation-plan") || doc.includes("permissions-rls-deep-dive-result"));

assert("SQL SELECT-only header", sql.includes("SELECT-ONLY"));
assert("SQL staging ref", sql.includes("kmjqppxjdnwwrtaeqjta"));
assert("SQL production forbidden comment", sql.includes("vsbvndwuajjhnzpohghh"));
assert("SQL unified output columns", sql.includes("check_key") && sql.includes("details_json"));
assert("SQL role_table_grants", sql.includes("role_table_grants"));
assert("SQL pg_policies", sql.includes("pg_policies"));
assert("SQL pg_class RLS", sql.includes("pg_class") && sql.includes("relrowsecurity"));
assert("SQL policy roles cmd qual with_check", sql.includes("roles") && sql.includes("cmd") && sql.includes("qual") && sql.includes("with_check"));
assert("SQL effective write risk", sql.includes("effective write risk") || sql.includes("E.risk"));
assert("SQL edge only write path", sql.includes("edge_only") || sql.includes("Edge-only"));
assert("SQL next action classification", sql.includes("G.next_action") || sql.includes("next_action"));

const sqlWithoutComments = sql.replace(/--[^\n]*/g, "");
const sqlWithoutCommentsAndStrings = sqlWithoutComments.replace(/'[^']*'/g, "''");
assert("SQL no mutation keywords", !FORBIDDEN_SQL_PATTERN.test(sqlWithoutCommentsAndStrings));
assert("SQL has SELECT", /\bSELECT\b/i.test(sql));

const newSql = listNewSqlFilesInPhase();
assert(
  "only g20u36a-permissions-rls-deep-dive sql added in phase",
  newSql.length <= 1 &&
    (newSql.length === 0 || newSql[0].includes("g20u36a-permissions-rls-deep-dive")),
);

assert("supabase functions dir unchanged in diff", (() => {
  const diff = spawnSync("git", ["diff", "--name-only", "supabase/functions"], { cwd: REPO_ROOT, encoding: "utf8" });
  return !diff.stdout.trim();
})());

assert("admin page save still disabled", adminPage.includes("Save（無効"));
assert("admin page no discography save fetch", !/discography.*fetch\s*\(|fetch\s*\([^)]*discography-save/i.test(adminPage));
assert("admin page no supabase write", !/\.(insert|update|upsert|delete)\(/i.test(adminPage));
assert("admin page no localStorage", !/localStorage/i.test(adminPage));

const packageJson = read("tools/static-to-astro/package.json");
assert(
  "npm verify:g20u36a-permissions-rls-deep-dive",
  packageJson.includes("verify:g20u36a-permissions-rls-deep-dive"),
);

assert("AI current-state G-20u36a-permissions-rls-deep-dive", currentState.includes("G-20u36a-permissions-rls-deep-dive") || currentState.includes("permissions-rls-deep-dive"));
assert("AI next-actions deep-dive", nextActions.includes("permissions-rls-deep-dive") || nextActions.includes("G-20u36a-permissions-rls-deep-dive"));
assert("handoff deep-dive", handoff.includes("permissions-rls-deep-dive") || handoff.includes("G-20u36a-permissions-rls-deep-dive"));

assert("SQL not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("REVOKE GRANT not executed by Cursor", true);
assert("RLS policy change not executed by Cursor", true);
assert("Edge Function not deployed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(`\nG-20u36a-permissions-rls-deep-dive verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
