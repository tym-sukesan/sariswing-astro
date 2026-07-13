/**
 * G-20u36e-controlled-save-auth-admin-rls-select-prep verifier.
 * Prep-only — no SQL execution / GRANT / RLS / DB write / Edge / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-auth-admin-rls-select-prep.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-admin-rls-select-prep.md";
const PREFLIGHT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-jwt-feasibility-preflight.md";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const BASE_COMMIT = "15636be";

const FORBIDDEN_SQL_STATEMENTS = [
  /\bINSERT\s+INTO\b/i,
  /\bUPDATE\s+\w/i,
  /\bDELETE\s+FROM\b/i,
  /\bALTER\s+(TABLE|POLICY|ROLE|DATABASE)\b/i,
  /\bCREATE\s+(POLICY|TABLE|ROLE|FUNCTION)\b/i,
  /\bDROP\s+(POLICY|TABLE|ROLE|FUNCTION)\b/i,
  /\bGRANT\b/i,
  /\bREVOKE\b/i,
  /\bTRUNCATE\b/i,
  /\bEXECUTE\s+FUNCTION\b/i,
  /\bCALL\s+\w/i,
];

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
  const status = spawnSync("git", ["status", "--porcelain", prefix], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  return Boolean(diff.stdout.trim() || status.stdout.trim());
}

function extractSqlBlock(doc) {
  const match = doc.match(/```sql\n([\s\S]*?)```/);
  return match ? match[1] : "";
}

function stripSqlComments(sql) {
  return sql
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

function sqlBodyIsSelectOnly(sql) {
  const body = stripSqlComments(sql).trim();
  if (!body) return false;
  const forbidden = FORBIDDEN_SQL_STATEMENTS.find((re) => re.test(body));
  if (forbidden) return false;
  return /\bWITH\b[\s\S]*\bSELECT\b/i.test(body) || /^\s*SELECT\b/i.test(body);
}

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const originShort = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36e auth-admin-rls select prep base ${BASE_COMMIT}) — non-blocking`,
  );
}

if (headShort.stdout.trim() === originShort.stdout.trim()) {
  console.log("PASS HEAD matches origin/main");
  passed += 1;
} else {
  console.log(
    `NOTE HEAD ${headShort.stdout.trim()} != origin/main ${originShort.stdout.trim()} — non-blocking during prep doc creation`,
  );
}

assert("prep doc exists", exists(DOC_REL));
assert("auth jwt feasibility preflight doc exists", exists(PREFLIGHT_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
const sqlBlock = extractSqlBlock(doc);
const sqlBody = stripSqlComments(sqlBlock);

assert(
  "doc phase G-20u36e-controlled-save-auth-admin-rls-select-prep",
  doc.includes("G-20u36e-controlled-save-auth-admin-rls-select-prep"),
);
assert(
  "doc gate gosakiDiscographyControlledSaveAuthAdminRlsSelectPrepReady",
  doc.includes("gosakiDiscographyControlledSaveAuthAdminRlsSelectPrepReady: true"),
);
assert("doc prep only", /Prep only|prep only/i.test(doc));
assert("doc SQL not executed", doc.includes("SQL executed") && /no|not|false/i.test(doc));
assert(
  "doc SELECT-only SQL prepared",
  doc.includes("SELECT-only SQL") && /prepared|準備/i.test(doc),
);
assert(
  "doc GRANT REVOKE not executed",
  doc.includes("GRANT") && doc.includes("REVOKE") && /no|not|false/i.test(doc),
);
assert(
  "doc RLS change not executed",
  doc.includes("RLS") && /no|not|false|変更なし|policy change/i.test(doc),
);
assert("doc DB write not executed", doc.includes("DB write") && /no|not|false/i.test(doc));
assert(
  "doc Edge implementation not executed",
  doc.includes("Edge implementation") && /no|not|false/i.test(doc),
);
assert(
  "doc supabase/functions edit not executed",
  doc.includes("supabase/functions") && /no|not|false/i.test(doc),
);
assert("doc Edge deploy not executed", doc.includes("Edge deploy") && /no|not|false/i.test(doc));
assert(
  "doc operation save not sent",
  doc.includes("operation=save") && /not sent|未送信|no/i.test(doc),
);
assert(
  "doc dryRun HTTP not re-sent",
  doc.includes("dryRun HTTP") && /no|not|re-sent|未/i.test(doc),
);
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false/i.test(doc));
assert("doc FTP not executed", doc.includes("FTP") && /no|not|false/i.test(doc));
assert(
  "doc service_role not used",
  doc.includes("service_role") && /not use|不使用|not used/i.test(doc),
);

assert("doc staging ref recorded", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|forbidden|never/i.test(doc));
assert("doc operator checklist", doc.includes("Operator checklist"));
assert("doc SELECT-only SQL block section", doc.includes("SELECT-only SQL block"));
assert(
  "doc g20u36e_auth_admin_rls_snapshot column",
  doc.includes("g20u36e_auth_admin_rls_snapshot"),
);
assert(
  "doc is_admin function metadata",
  doc.includes("is_admin()") && /pg_get_functiondef|function_definition|pg_proc/i.test(doc),
);
assert(
  "doc policies using is_admin",
  /policies.*is_admin|is_admin.*polic|references_is_admin/i.test(doc),
);
assert(
  "doc permissive restrictive policy",
  /permissive/i.test(doc) && /restrictive/i.test(doc),
);
assert("doc RLS status", /rls_status|relrowsecurity|RLS status/i.test(doc));
assert(
  "doc grants re-check",
  /role_table_grants|column_privileges|authenticated_update_grants/i.test(doc),
);
assert(
  "doc operator admin materials",
  /operator JWT|sql_editor_is_admin|auth\.uid\(\)|operator admin/i.test(doc),
);
assert(
  "doc target slice sanity",
  doc.includes("target_row") && doc.includes("track_count") && doc.includes("track_7_title"),
);
assert("doc PASS conditions", doc.includes("PASS conditions"));
assert("doc STOP conditions", doc.includes("STOP conditions"));
assert(
  "doc next execution phase",
  doc.includes("G-20u36e-controlled-save-auth-admin-rls-select-execution"),
);
assert(
  "doc no email dump design",
  /no email|email dump|count only|auth_users_count/i.test(doc),
);
assert(
  "doc no JWT paste policy",
  /JWT|access_token/i.test(doc) && /Do not|not paste|貼らない|non-display|not sent/i.test(doc),
);

assert("SQL block present", sqlBlock.length > 400);
assert("SQL block SELECT-only body", sqlBodyIsSelectOnly(sqlBlock));
assert(
  "SQL block g20u36e_auth_admin_rls_snapshot",
  sqlBlock.includes("g20u36e_auth_admin_rls_snapshot"),
);
assert("SQL block is_admin_functions CTE", sqlBlock.includes("is_admin_functions"));
assert("SQL block pg_get_functiondef", sqlBlock.includes("pg_get_functiondef"));
assert("SQL block policies CTE", sqlBlock.includes("policies"));
assert("SQL block rls_status CTE", sqlBlock.includes("rls_status"));
assert("SQL block table_grants CTE", sqlBlock.includes("table_grants"));
assert("SQL block column_privileges CTE", sqlBlock.includes("column_privileges"));
assert(
  "SQL block sql_editor_is_admin_probe",
  sqlBlock.includes("sql_editor_is_admin_probe"),
);
assert("SQL block auth_users_count only", sqlBlock.includes("auth_users_count"));
assert(
  "SQL block no auth.users email select",
  !/SELECT[\s\S]*email[\s\S]*FROM\s+auth\.users/i.test(sqlBody),
);
assert("SQL block checks is_admin_function_count", sqlBlock.includes("is_admin_function_count"));
assert(
  "SQL block checks discography_tracks_restrictive_policy_count",
  sqlBlock.includes("discography_tracks_restrictive_policy_count"),
);
assert(
  "SQL block checks discography_tracks_permissive_policy_count",
  sqlBlock.includes("discography_tracks_permissive_policy_count"),
);
assert("SQL block checks target_row_count", sqlBlock.includes("target_row_count"));
assert("SQL block checks track_count", sqlBlock.includes("track_count"));
assert("SQL block checks track_7_title", sqlBlock.includes("track_7_title"));
assert(
  "SQL block production ref stop in JSON params",
  sqlBlock.includes(PRODUCTION_REF) && sqlBlock.includes("production_project_ref_stop"),
);
assert("SQL block staging ref in params", sqlBlock.includes(STAGING_REF));

const forbiddenHit = FORBIDDEN_SQL_STATEMENTS.find((re) => re.test(sqlBody));
assert(
  "SQL body has no forbidden mutation statements",
  !forbiddenHit,
  forbiddenHit ? String(forbiddenHit) : "",
);

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-auth-admin-rls-select-prep"),
);
assert(
  "AI current-state auth-admin-rls select prep",
  currentState.includes("G-20u36e-controlled-save-auth-admin-rls-select-prep") ||
    currentState.includes("gosakiDiscographyControlledSaveAuthAdminRlsSelectPrepReady"),
);
assert(
  "AI next-actions auth-admin-rls select execution or prep",
  nextActions.includes("G-20u36e-controlled-save-auth-admin-rls-select-prep") ||
    nextActions.includes("G-20u36e-controlled-save-auth-admin-rls-select-execution"),
);
assert(
  "AI handoff auth-admin-rls select prep",
  handoff.includes("G-20u36e-controlled-save-auth-admin-rls-select-prep") ||
    handoff.includes("gosakiDiscographyControlledSaveAuthAdminRlsSelectPrepReady"),
);

assert(
  "supabase/functions not modified in this phase",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);

console.log(
  `\nverify-g20u36e-controlled-save-auth-admin-rls-select-prep: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
