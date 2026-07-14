/**
 * G-20u36e pre-save result + controlled Save execution-prep verifier.
 * No HTTP / Save / SQL / Rollback execution.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const PRE_SAVE_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-pre-save-select-result.md";
const EXEC_PREP_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-execution-prep.md";
const PRE_SAVE_PHASE =
  "G-20u36e-controlled-save-pre-save-select-result-record";
const PRE_SAVE_GATE =
  "gosakiDiscographyControlledSavePreSaveSelectPassed: true";
const EXEC_PHASE = "G-20u36e-controlled-save-execution-prep";
const EXEC_GATE = "gosakiDiscographyControlledSaveExecutionPrepared: true";
const STAGING = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION = "vsbvndwuajjhnzpohghh";
const APPROVAL =
  "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice";
const SLICE = "G-20u36e1-discography-002-track-1-title-staging-marker";
const TARGET_ID = "e30c5ea9-2857-492b-8a78-58cbfcbe7929";
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

assert("pre-save result doc exists", exists(PRE_SAVE_REL));
assert("save execution prep doc exists", exists(EXEC_PREP_REL));

const preSave = read(PRE_SAVE_REL);
const execPrep = read(EXEC_PREP_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`pre-save phase ${PRE_SAVE_PHASE}`, preSave.includes(PRE_SAVE_PHASE));
assert(`pre-save gate ${PRE_SAVE_GATE}`, preSave.includes(PRE_SAVE_GATE));
assert(`exec prep phase ${EXEC_PHASE}`, execPrep.includes(EXEC_PHASE));
assert(`exec prep gate ${EXEC_GATE}`, execPrep.includes(EXEC_GATE));
assert(
  "Pre-save SELECT PASS",
  /Pre-save SELECT.*\*\*PASS\*\*|preSaveSelectPass:\s*true/i.test(preSave),
);
assert(
  "target_title=On a Clear Day",
  /target_title.*`On a Clear Day`|targetTitleStillOld:\s*true/i.test(preSave) &&
    preSave.includes(TITLE_OLD),
);
assert(
  "target_row_id_matches=true",
  /target_row_id_matches.*\*\*true\*\*|target_row_id_matches = true/i.test(
    preSave,
  ),
);
assert(
  "grants/policy/RLS PASS",
  /authenticated_title_update_column_grants_count.*\*\*1\*\*/i.test(preSave) &&
    /authenticated_table_update_grants_count.*\*\*0\*\*/i.test(preSave) &&
    /anon_write_grants_count.*\*\*0\*\*/i.test(preSave) &&
    /actual_restrictive_policy_count.*\*\*1\*\*/i.test(preSave) &&
    /rls_enabled_discography_tracks.*\*\*true\*\*/i.test(preSave),
);
assert(
  "controlled Save execution conditions satisfied",
  /execution conditions.*\*\*satisfied\*\*|controlledSaveExecutionConditionsSatisfied:\s*true/i.test(
    preSave,
  ),
);
assert(
  "operation=save未送信",
  /operation=save.*not sent|operationSaveSent:\s*false/i.test(preSave) &&
    /operation=save.*not sent|operationSaveSent:\s*false/i.test(execPrep),
);
assert(
  "Save未実行",
  /Save executed.*\*\*no\*\*|saveExecuted:\s*false/i.test(preSave) &&
    /Save executed.*\*\*no\*\*|saveExecuted:\s*false/i.test(execPrep),
);
assert(
  "DB writeなし",
  /DB write.*\*\*no\*\*|dbDataWriteExecuted:\s*false|dbWriteExecuted:\s*false/i.test(
    preSave,
  ) &&
    /DB write.*\*\*no\*\*|dbWriteExecuted:\s*false/i.test(execPrep),
);
assert(
  "Rollback未実行",
  /Rollback executed.*\*\*no\*\*|rollbackExecuted:\s*false/i.test(preSave) &&
    /Rollback executed.*\*\*no\*\*|rollbackExecuted:\s*false/i.test(execPrep),
);
assert(
  "service_role不使用",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(preSave) &&
    /service_role|serviceRoleUsed:\s*false/i.test(execPrep),
);
assert(
  "production未変更",
  /Production changed.*\*\*no\*\*|productionChanged:\s*false/i.test(preSave) &&
    /productionChanged:\s*false|production STOP/i.test(execPrep),
);
assert("staging refs", preSave.includes(STAGING) && execPrep.includes(STAGING));
assert(
  "production STOP",
  preSave.includes(PRODUCTION) && execPrep.includes(PRODUCTION),
);
assert(
  "controlled Save curl command",
  /curl -sS -X POST/i.test(execPrep) &&
    /"operation": "save"/i.test(execPrep),
);
assert(
  "OPERATOR_JWT placeholder",
  /Authorization: Bearer \$OPERATOR_JWT|"\$OPERATOR_JWT"|export OPERATOR_JWT/i.test(
    execPrep,
  ),
);
assert(
  "STAGING_ANON_KEY placeholder",
  /apikey: \$STAGING_ANON_KEY|"\$STAGING_ANON_KEY"|export STAGING_ANON_KEY/i.test(
    execPrep,
  ),
);
assert("Save approvalId in command", execPrep.includes(APPROVAL));
assert("sliceId in command", execPrep.includes(SLICE));
assert("target row id in command", execPrep.includes(TARGET_ID));
assert(
  "old/new title in command",
  execPrep.includes(TITLE_OLD) && execPrep.includes(TITLE_NEW),
);
assert(
  "no JWT/user/email/service_role values",
  !/eyJ[A-Za-z0-9_-]{20,}/.test(execPrep) &&
    !/Bearer [A-Za-z0-9._-]{20,}/.test(execPrep) &&
    !/service_role\s*[:=]\s*['"]?[A-Za-z0-9._-]{20,}/i.test(execPrep) &&
    !/@[a-z0-9.-]+\.[a-z]{2,}/i.test(execPrep),
);
assert("STOP conditions recorded", /STOP conditions/i.test(execPrep));
assert(
  "expected success fields",
  /updatedRows.*`1`|ok.*`true`|controlledSave.*`true`/i.test(execPrep),
);
assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u36e-controlled-save-pre-save-result-and-save-execution-prep",
  ),
);
assert(
  "AI current-state pre-save result or exec prep",
  currentState.includes(PRE_SAVE_PHASE) ||
    currentState.includes(EXEC_PHASE) ||
    currentState.includes("gosakiDiscographyControlledSavePreSaveSelectPassed") ||
    currentState.includes("gosakiDiscographyControlledSaveExecutionPrepared"),
);
assert(
  "AI next-actions execution or prep",
  nextActions.includes("G-20u36e-controlled-save-execution") ||
    nextActions.includes("G-20u36e-controlled-save-post-save-select-execution") ||
    nextActions.includes("G-20u36e-controlled-save-execution-result-record") ||
    nextActions.includes("G-20u36e-controlled-save-post-close-result-record") ||
    nextActions.includes("G-20u36e-controlled-save-ui-visible-verification") ||
    nextActions.includes(EXEC_PHASE) ||
    nextActions.includes(PRE_SAVE_PHASE),
);
assert(
  "AI handoff pre-save result or exec prep",
  handoff.includes(PRE_SAVE_PHASE) ||
    handoff.includes(EXEC_PHASE) ||
    handoff.includes("gosakiDiscographyControlledSaveExecutionPrepared"),
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
  `\nverify-g20u36e-controlled-save-pre-save-result-and-save-execution-prep: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
