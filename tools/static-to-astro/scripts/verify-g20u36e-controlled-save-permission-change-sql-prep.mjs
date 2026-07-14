/**
 * G-20u36e-controlled-save-permission-change-sql-prep verifier.
 * SQL prep only — no SQL / GRANT / POLICY / Save execution.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-permission-change-sql-prep.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-permission-change-sql-prep.md";
const PLAN_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-permission-change-plan.md";
const PHASE = "G-20u36e-controlled-save-permission-change-sql-prep";
const GATE = "gosakiDiscographyControlledSavePermissionChangeSqlPrepared: true";
const NEXT_PHASE =
  "G-20u36e-controlled-save-permission-change-preflight-select-execution";
const BASE_COMMIT = "b5f9d86";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const POLICY_NAME =
  "discography_tracks_g20u36e_controlled_save_title_update_restrictive";
const TARGET_ID = "e30c5ea9-2857-492b-8a78-58cbfcbe7929";

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

function extractFencedSqlAfterHeading(doc, headingNeedle) {
  const headingIdx = doc.indexOf(headingNeedle);
  if (headingIdx < 0) return "";
  const after = doc.slice(headingIdx);
  const fenceStart = after.indexOf("```sql");
  if (fenceStart < 0) return "";
  const bodyStart = fenceStart + "```sql".length;
  const fenceEnd = after.indexOf("```", bodyStart);
  if (fenceEnd < 0) return "";
  return after.slice(bodyStart, fenceEnd);
}

/** Strip `--` line comments so Forbidden notes do not false-positive static checks. */
function stripSqlLineComments(sql) {
  return sql
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("--");
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join("\n");
}

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT} (sql-prep base; local edits expected)`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (sql-prep base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("SQL prep doc exists", exists(DOC_REL));
assert("permission change plan doc exists", exists(PLAN_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

const applySql = extractFencedSqlAfterHeading(doc, "## B. Apply SQL");
const rollbackSql = extractFencedSqlAfterHeading(doc, "## D. Rollback SQL");
const preflightSql = extractFencedSqlAfterHeading(
  doc,
  "## A. Preflight SELECT-only SQL",
);
const postApplySql = extractFencedSqlAfterHeading(
  doc,
  "## C. Post-apply verification SELECT-only SQL",
);
const postRollbackSql = extractFencedSqlAfterHeading(
  doc,
  "## E. Post-rollback verification SELECT-only SQL",
);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert("doc SQL prep only", /SQL prep only|sqlPrepOnly/i.test(doc));
assert("doc SQL executed no", /SQL executed|sqlExecuted/i.test(doc) && /no|未実行|false/i.test(doc));
assert(
  "doc GRANT REVOKE executed no",
  /GRANT \/ REVOKE executed|grantRevokeExecuted/i.test(doc) && /no|未実行|false/i.test(doc),
);
assert(
  "doc CREATE DROP POLICY executed no",
  /CREATE \/ DROP POLICY executed|createDropPolicyExecuted/i.test(doc) &&
    /no|未実行|false/i.test(doc),
);
assert("doc DB write no", doc.includes("DB write") && /no|false/i.test(doc));
assert(
  "doc operation=save not sent",
  doc.includes("operation=save") && /not sent|未送信|no/i.test(doc),
);
assert(
  "doc Save enablement no",
  /Save enablement|saveEnablement/i.test(doc) && /no|false/i.test(doc),
);
assert(
  "doc Edge implementation no",
  /Edge implementation|edgeImplementation/i.test(doc) && /no|false/i.test(doc),
);
assert(
  "doc service_role not used",
  doc.includes("service_role") && /not use|不使用|not used/i.test(doc),
);
assert(
  "doc production not changed",
  /Production changed|production未変更/i.test(doc) && /no|not/i.test(doc),
);
assert(
  "doc preflight SELECT-only SQL",
  /Preflight SELECT-only|g20u36e_permission_change_preflight_snapshot/i.test(doc) &&
    preflightSql.length > 100,
);
assert(
  "doc apply SQL",
  /## B\. Apply SQL/i.test(doc) && applySql.length > 50,
);
assert(
  "doc post-apply verification SQL",
  /Post-apply verification|g20u36e_permission_change_post_apply_snapshot/i.test(doc) &&
    postApplySql.length > 100,
);
assert(
  "doc rollback SQL",
  /## D\. Rollback SQL/i.test(doc) && rollbackSql.length > 50,
);
assert(
  "doc post-rollback verification SQL",
  /Post-rollback verification|g20u36e_permission_change_post_rollback_snapshot/i.test(
    doc,
  ) && postRollbackSql.length > 50,
);
assert(
  "doc UPDATE(title) grant",
  /GRANT UPDATE \(title\)|UPDATE \(title\)/i.test(doc),
);
assert(
  "doc RESTRICTIVE UPDATE policy",
  /AS RESTRICTIVE/i.test(doc) && doc.includes(POLICY_NAME),
);
assert(
  "doc USING old row",
  /USING/i.test(doc) && /title = 'On a Clear Day'/i.test(doc),
);
assert(
  "doc WITH CHECK new row",
  /WITH CHECK/i.test(doc) &&
    /On a Clear Day \[CMS Kit staging G-20u36e\]/i.test(doc),
);
assert(
  "doc target slice",
  doc.includes(TARGET_ID) &&
    doc.includes("discography-002") &&
    doc.includes("gosaki-piano"),
);
assert(
  "doc anon write none policy",
  /anon/i.test(doc) && /no.*write|write grant|不付与|なし方針|Forbidden.*anon/i.test(doc),
);
assert(
  "doc service_role不使用方針",
  /service_role/i.test(doc) && /not used|不使用|Forbidden|rejected/i.test(doc),
);
assert("doc STOP conditions", /STOP conditions|STOP条件/i.test(doc));
assert(
  "doc First controlled Save still not allowed",
  /First controlled Save/i.test(doc) && /still not allowed/i.test(doc),
);
assert("doc next preflight select execution", doc.includes(NEXT_PHASE));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF));
assert(
  "doc dropPolicyIfExists forbidden on apply",
  /dropPolicyIfExistsForbidden:\s*true|DROP POLICY IF EXISTS.*forbidden/i.test(doc),
);

// Static: apply SQL safety (executable text only — ignore -- comments)
const applySqlExec = stripSqlLineComments(applySql);
assert("apply SQL extracted", applySql.length > 50);
assert(
  "apply SQL has GRANT UPDATE (title)",
  /GRANT UPDATE\s*\(\s*title\s*\)/i.test(applySqlExec),
);
assert(
  "apply SQL has CREATE POLICY RESTRICTIVE",
  /CREATE POLICY/i.test(applySqlExec) && /AS RESTRICTIVE/i.test(applySqlExec),
);
assert(
  "apply SQL no data UPDATE/INSERT/DELETE",
  !/^\s*UPDATE\s+/im.test(applySqlExec) &&
    !/\bINSERT\s+INTO\b/i.test(applySqlExec) &&
    !/\bDELETE\s+FROM\b/i.test(applySqlExec),
);
assert(
  "apply SQL no service_role",
  !/service_role/i.test(applySqlExec),
);
assert(
  "apply SQL no GRANT to anon",
  !/GRANT\s+[^;]*\bTO\s+anon\b/i.test(applySqlExec),
);
assert(
  "apply SQL no DROP POLICY IF EXISTS",
  !/DROP POLICY IF EXISTS/i.test(applySqlExec),
);
assert(
  "rollback SQL has REVOKE and DROP POLICY",
  /REVOKE UPDATE\s*\(\s*title\s*\)/i.test(rollbackSql) &&
    /DROP POLICY/i.test(rollbackSql),
);
assert(
  "SELECT-only vs apply separated",
  /SELECT-ONLY/i.test(preflightSql) &&
    /GRANT UPDATE/i.test(applySql) &&
    !/GRANT UPDATE/i.test(preflightSql),
);

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-permission-change-sql-prep"),
);
assert(
  "AI current-state sql prep",
  currentState.includes(PHASE) ||
    currentState.includes("gosakiDiscographyControlledSavePermissionChangeSqlPrepared"),
);
assert(
  "AI next-actions preflight execution or sql prep",
  nextActions.includes(NEXT_PHASE) || nextActions.includes(PHASE),
);
assert(
  "AI handoff sql prep",
  handoff.includes(PHASE) ||
    handoff.includes("gosakiDiscographyControlledSavePermissionChangeSqlPrepared"),
);

assert(
  "supabase/functions not modified",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);
assert(
  "output/manual-upload not modified",
  !diffTouches("tools/static-to-astro/output/manual-upload"),
  "unexpected output/manual-upload changes",
);

console.log(
  `\nverify-g20u36e-controlled-save-permission-change-sql-prep: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
