/**
 * G-20u36e-controlled-save-pre-save-select-prep-and-extract verifier.
 * SELECT-only prep/extract — no SQL / Save / Rollback execution.
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-pre-save-select-prep.md";
const PHASE = "G-20u36e-controlled-save-pre-save-select-prep-and-extract";
const GATE = "gosakiDiscographyControlledSavePreSaveSelectPrepared: true";
const NEXT = "G-20u36e-controlled-save-pre-save-select-execution";
const STAGING = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION = "vsbvndwuajjhnzpohghh";
const POLICY =
  "discography_tracks_g20u36e_controlled_save_title_update_restric";
const TARGET_ID = "e30c5ea9-2857-492b-8a78-58cbfcbe7929";
const SNAPSHOT_COL = "g20u36e_controlled_save_pre_save_snapshot";
const TITLE_OLD = "On a Clear Day";
const TITLE_NEW = "On a Clear Day [CMS Kit staging G-20u36e]";

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
  const diff = spawnSync("git", ["diff", "--name-only", "--", prefix], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  const status = spawnSync("git", ["status", "--porcelain", "--", prefix], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  return Boolean(diff.stdout.trim() || status.stdout.trim());
}

function extractFencedSql(doc) {
  const fenceStart = doc.indexOf("```sql");
  if (fenceStart < 0) return "";
  const bodyStart = fenceStart + "```sql".length;
  const fenceEnd = doc.indexOf("```", bodyStart);
  if (fenceEnd < 0) return "";
  return doc.slice(bodyStart, fenceEnd);
}

function stripSqlLineComments(sql) {
  return sql
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("--");
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join("\n");
}

function stripSqlStringLiterals(sql) {
  return sql.replace(/'(?:''|[^'])*'/g, "''");
}

assert("pre-save select prep doc exists", exists(DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
const sql = extractFencedSql(doc);
const sqlBody = stripSqlStringLiterals(stripSqlLineComments(sql));

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "SELECT-only prep/extract",
  /SELECT-only prep|selectOnlyPrepAndExtract:\s*true/i.test(doc),
);
assert(
  "SQL未実行",
  /SQL executed.*\*\*no\*\*|sqlNotExecuted:\s*true|SQL未実行/i.test(doc),
);
assert(
  "operation=save未送信",
  /operation=save.*not sent|operationSaveSent:\s*false|operation=save.*未送信/i.test(
    doc,
  ),
);
assert(
  "Save未実行",
  /Save executed.*\*\*no\*\*|saveExecuted:\s*false|Save未実行/i.test(doc),
);
assert(
  "DB writeなし",
  /DB write.*\*\*no\*\*|dbDataWriteExecuted:\s*false|DB writeなし/i.test(doc),
);
assert(
  "Rollback未実行",
  /Rollback executed.*\*\*no\*\*|rollbackExecuted:\s*false|Rollback未実行/i.test(
    doc,
  ),
);
assert(
  "service_role不使用",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(doc),
);
assert(
  "production未変更",
  /Production changed.*\*\*no\*\*|productionChanged:\s*false|production未変更/i.test(
    doc,
  ),
);
assert("staging ref", doc.includes(STAGING) && sql.includes(STAGING));
assert("production STOP", doc.includes(PRODUCTION) && sql.includes(PRODUCTION));
assert("actual restrictive policy name", doc.includes(POLICY) && sql.includes(POLICY));
assert("target row id", doc.includes(TARGET_ID) && sql.includes(TARGET_ID));
assert("title old", doc.includes(TITLE_OLD) && sql.includes(TITLE_OLD));
assert("title new", doc.includes(TITLE_NEW) && sql.includes(TITLE_NEW));
assert("snapshot column", sql.includes(SNAPSHOT_COL));
assert("PASS conditions recorded", /### PASS|PASS条件/i.test(doc));
assert("STOP conditions recorded", /### STOP|STOP条件/i.test(doc));
assert(`next phase ${NEXT}`, doc.includes(NEXT));
assert("SQL block present", sql.includes("WITH params AS"));
assert(
  "SQL is SELECT-shaped",
  /\bSELECT\b/i.test(sqlBody) && /\bWITH\b/i.test(sqlBody),
);
assert(
  "SQL forbids mutations (no INSERT/UPDATE/DELETE)",
  !/\bINSERT\b/i.test(sqlBody) &&
    !/\bUPDATE\b/i.test(sqlBody) &&
    !/\bDELETE\b/i.test(sqlBody),
);
assert(
  "SQL forbids DDL/DCL (no GRANT/REVOKE/CREATE/DROP)",
  !/\bGRANT\b/i.test(sqlBody) &&
    !/\bREVOKE\b/i.test(sqlBody) &&
    !/\bCREATE\b/i.test(sqlBody) &&
    !/\bDROP\b/i.test(sqlBody),
);
assert(
  "SQL checks include grants/policy/rls/target",
  sql.includes("authenticated_title_update_column_grants_count") &&
    sql.includes("authenticated_table_update_grants_count") &&
    sql.includes("anon_write_grants_count") &&
    sql.includes("actual_restrictive_policy_count") &&
    sql.includes("restrictive_policy_using_matches_expected") &&
    sql.includes("restrictive_policy_with_check_matches_expected") &&
    sql.includes("admin_all_policy_count") &&
    sql.includes("rls_enabled_discography_tracks") &&
    sql.includes("data_mutation") &&
    sql.includes("operation_save_involved"),
);
assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-pre-save-select-prep"),
);
assert(
  "AI current-state pre-save select prep",
  currentState.includes(PHASE) ||
    currentState.includes("gosakiDiscographyControlledSavePreSaveSelectPrepared"),
);
assert(
  "AI next-actions pre-save-select-execution or prep",
  nextActions.includes(NEXT) ||
    nextActions.includes("G-20u36e-controlled-save-execution") ||
    nextActions.includes("G-20u36e-controlled-save-pre-save-result-and-save-execution-prep") ||
    nextActions.includes(PHASE),
);
assert(
  "AI handoff pre-save select prep",
  handoff.includes(PHASE) ||
    handoff.includes(NEXT) ||
    handoff.includes("gosakiDiscographyControlledSavePreSaveSelectPrepared"),
);
assert(
  "supabase/functions not modified",
  !diffTouches("supabase/functions/"),
);
assert(
  "output/manual-upload not modified",
  !diffTouches("tools/static-to-astro/output/manual-upload"),
);

console.log(
  `\nverify-g20u36e-controlled-save-pre-save-select-prep: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
