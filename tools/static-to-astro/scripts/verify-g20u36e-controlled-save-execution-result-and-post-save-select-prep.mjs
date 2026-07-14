/**
 * G-20u36e Save execution-result + post-save SELECT prep verifier.
 * No SQL / additional Save / Rollback execution.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const EXEC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-execution-result.md";
const POST_PREP_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-post-save-select-prep.md";
const EXEC_PHASE = "G-20u36e-controlled-save-execution-result-record";
const EXEC_GATE = "gosakiDiscographyControlledSaveExecuted: true";
const POST_PHASE = "G-20u36e-controlled-save-post-save-select-prep";
const POST_GATE =
  "gosakiDiscographyControlledSavePostSaveSelectPrepared: true";
const STAGING = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION = "vsbvndwuajjhnzpohghh";
const TITLE_OLD = "On a Clear Day";
const TITLE_NEW = "On a Clear Day [CMS Kit staging G-20u36e]";
const SNAPSHOT = "g20u36e_controlled_save_post_save_snapshot";
const NEXT = "G-20u36e-controlled-save-post-save-select-execution";

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

assert("Save execution result doc exists", exists(EXEC_REL));
assert("post-save SELECT prep doc exists", exists(POST_PREP_REL));

const execDoc = read(EXEC_REL);
const postDoc = read(POST_PREP_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
const sql = extractFencedSql(postDoc);
const sqlBody = stripSqlStringLiterals(stripSqlLineComments(sql));

assert(`exec phase ${EXEC_PHASE}`, execDoc.includes(EXEC_PHASE));
assert(`exec gate ${EXEC_GATE}`, execDoc.includes(EXEC_GATE));
assert(`post phase ${POST_PHASE}`, postDoc.includes(POST_PHASE));
assert(`post gate ${POST_GATE}`, postDoc.includes(POST_GATE));
assert(
  "First controlled Save PASS",
  /First controlled Save.*\*\*PASS\*\*|firstControlledSavePass:\s*true/i.test(
    execDoc,
  ),
);
assert("ok=true", /ok.*\*\*true\*\*|`ok`.*`true`|ok:\s*true/i.test(execDoc));
assert(
  "operation=save",
  /operation.*\*\*save\*\*|operation:\s*save|"operation".*save/i.test(execDoc),
);
assert(
  "controlledSave=true",
  /controlledSave.*\*\*true\*\*|controlledSave:\s*true/i.test(execDoc),
);
assert(
  "updatedRows=1",
  /updatedRows.*\*\*1\*\*|updatedRows:\s*1|updatedRows.*`1`/i.test(execDoc),
);
assert("beforeTitle recorded", execDoc.includes(TITLE_OLD));
assert("afterTitle recorded", execDoc.includes(TITLE_NEW));
assert(
  "readBack targetTitle new",
  /targetTitle.*On a Clear Day \[CMS Kit staging G-20u36e\]/i.test(execDoc),
);
assert(
  "trackCount=8",
  /trackCount.*`8`|trackCount.*\*\*8\*\*|track_count.*8/i.test(execDoc),
);
assert(
  "track_7_title=Like a Lover",
  /track_7_title.*Like a Lover|Like a Lover/i.test(execDoc),
);
assert(
  "noAddedRemoved=true",
  /noAddedRemoved.*`true`|noAddedRemoved:\s*true/i.test(execDoc),
);
assert(
  "didWrite/dbWrite/networkWrite=true",
  /didWrite.*\*\*true\*\*|didWrite:\s*true/i.test(execDoc) &&
    /dbWrite.*\*\*true\*\*|dbWrite:\s*true/i.test(execDoc) &&
    /networkWrite.*\*\*true\*\*|networkWrite:\s*true/i.test(execDoc),
);
assert("status=200", /status.*\*\*200\*\*|status:\s*200|status.*`200`/i.test(execDoc));
assert(
  "errors=[] / warnings=[]",
  /errors.*`\[\]`|errorsEmpty:\s*true/i.test(execDoc) &&
    /warnings.*`\[\]`|warningsEmpty:\s*true/i.test(execDoc),
);
assert(
  "secrets not recorded",
  /secrets.*\*\*no\*\*|secretsNotRecorded:\s*true|not recorded/i.test(execDoc),
);
assert(
  "service_role不使用",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(execDoc),
);
assert(
  "production未変更",
  /Production changed.*\*\*no\*\*|productionChanged:\s*false/i.test(execDoc),
);
assert(
  "Permission/RLS still open",
  /still open|permissionRlsStillOpen:\s*true/i.test(execDoc),
);
assert(
  "additional Save not allowed",
  /Additional Save.*not allowed|additionalSaveNotAllowed:\s*true/i.test(
    execDoc,
  ),
);
assert("staging/production refs", execDoc.includes(STAGING) && execDoc.includes(PRODUCTION));
assert(
  "post-save SELECT SQL block",
  sql.includes(SNAPSHOT) && sql.includes("WITH params AS"),
);
assert(
  "SELECT-only",
  /SELECT-only|selectOnlyPrepAndExtract:\s*true/i.test(postDoc),
);
assert(
  "SQL未実行",
  /SQL executed.*\*\*no\*\*|sqlNotExecuted:\s*true|SQL未実行/i.test(postDoc),
);
assert(
  "Rollback未実行",
  /Rollback.*\*\*no\*\*|rollbackExecuted:\s*false|Rollback未実行/i.test(
    postDoc,
  ) && /rollbackExecuted:\s*false/i.test(execDoc),
);
assert(
  "additional Save未実行",
  /Additional Save.*\*\*no\*\*|additionalSaveNotExecuted:\s*true/i.test(
    postDoc,
  ),
);
assert("STOP conditions", /### STOP|STOP条件/i.test(postDoc));
assert(`next ${NEXT}`, postDoc.includes(NEXT) || execDoc.includes(NEXT));
assert(
  "SQL forbids mutations/DDL",
  !/\bINSERT\b/i.test(sqlBody) &&
    !/\bUPDATE\b/i.test(sqlBody) &&
    !/\bDELETE\b/i.test(sqlBody) &&
    !/\bGRANT\b/i.test(sqlBody) &&
    !/\bREVOKE\b/i.test(sqlBody) &&
    !/\bCREATE\b/i.test(sqlBody) &&
    !/\bDROP\b/i.test(sqlBody),
);
assert(
  "SQL expects new title + old_title_count",
  sql.includes("old_title_count_for_target") && sql.includes(TITLE_NEW),
);
assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u36e-controlled-save-execution-result-and-post-save-select-prep",
  ),
);
assert(
  "AI current-state execution result or post-save prep",
  currentState.includes(EXEC_PHASE) ||
    currentState.includes(POST_PHASE) ||
    currentState.includes("gosakiDiscographyControlledSaveExecuted") ||
    currentState.includes(
      "gosakiDiscographyControlledSavePostSaveSelectPrepared",
    ),
);
assert(
  "AI next-actions post-save select or execution",
  nextActions.includes(NEXT) ||
    nextActions.includes(EXEC_PHASE) ||
    nextActions.includes(POST_PHASE),
);
assert(
  "AI handoff execution result or post-save prep",
  handoff.includes(EXEC_PHASE) ||
    handoff.includes(POST_PHASE) ||
    handoff.includes("gosakiDiscographyControlledSaveExecuted"),
);
assert(
  "no live JWT in docs",
  !/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\./.test(execDoc) &&
    !/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\./.test(postDoc),
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
  `\nverify-g20u36e-controlled-save-execution-result-and-post-save-select-prep: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
