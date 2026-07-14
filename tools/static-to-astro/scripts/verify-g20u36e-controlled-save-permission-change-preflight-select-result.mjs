/**
 * G-20u36e-controlled-save-permission-change-preflight-select-result verifier.
 * Result record only — no Apply / GRANT / POLICY / Save execution.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-permission-change-preflight-select-result.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-permission-change-preflight-select-result.md";
const SQL_PREP_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-permission-change-sql-prep.md";
const PHASE =
  "G-20u36e-controlled-save-permission-change-preflight-select-result-record";
const GATE =
  "gosakiDiscographyControlledSavePermissionChangePreflightSelectResultRecorded: true";
const NEXT_PHASE =
  "G-20u36e-controlled-save-permission-change-apply-sql-extract";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const TARGET_ID = "e30c5ea9-2857-492b-8a78-58cbfcbe7929";
const CAPTURED_AT = "2026-07-14T13:23:45.361706+00:00";

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

assert("result doc exists", exists(DOC_REL));
assert("sql-prep doc exists", exists(SQL_PREP_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "doc Preflight SELECT-only executed",
  /Preflight SELECT-only/i.test(doc) &&
    /executed by operator|preflightSelectExecutedByOperator:\s*true/i.test(doc),
);
assert(
  "doc Preflight SELECT PASS",
  /Preflight SELECT\s*\|\s*\*\*PASS\*\*|preflightSelectPass:\s*true|Preflight SELECT PASS/i.test(
    doc,
  ),
);
assert(
  "doc data_mutation=false",
  /data_mutation\s*\|\s*\*\*false\*\*|dataMutation:\s*false|`data_mutation`\s*\|\s*\*\*false\*\*/i.test(
    doc,
  ) || /data_mutation.*false/i.test(doc),
);
assert("doc target_row_count=1", /target_row_count.*\*\*1\*\*|target_row_count.*=\s*1/i.test(doc));
assert(
  "doc target_title=On a Clear Day",
  /target_title.*On a Clear Day|title.*On a Clear Day/i.test(doc),
);
assert("doc target_row_id", doc.includes(TARGET_ID));
assert("doc track_count=8", /track_count.*\*\*8\*\*|track_count.*=\s*8/i.test(doc));
assert(
  "doc track_7_title=Like a Lover",
  /track_7_title.*Like a Lover|Like a Lover/i.test(doc),
);
assert(
  "doc anon_write_grants_count=0",
  /anon_write_grants_count.*\*\*0\*\*|anon_write_grants_count.*=\s*0/i.test(doc),
);
assert(
  "doc authenticated_table_update_grants_count=0",
  /authenticated_table_update_grants_count.*\*\*0\*\*|authenticated_table_update_grants_count.*=\s*0/i.test(
    doc,
  ),
);
assert(
  "doc authenticated_title_update_column_grants_count=0",
  /authenticated_title_update_column_grants_count.*\*\*0\*\*|authenticated_title_update_column_grants_count.*=\s*0/i.test(
    doc,
  ),
);
assert(
  "doc rls_enabled_discography=true",
  /rls_enabled_discography.*\*\*true\*\*|rls_enabled_discography.*=\s*true/i.test(doc),
);
assert(
  "doc rls_enabled_discography_tracks=true",
  /rls_enabled_discography_tracks.*\*\*true\*\*|rls_enabled_discography_tracks.*=\s*true/i.test(
    doc,
  ),
);
assert(
  "doc admin_all_policy_count=2",
  /admin_all_policy_count.*\*\*2\*\*|admin_all_policy_count.*=\s*2/i.test(doc),
);
assert(
  "doc restrictive_update_policy_count=0",
  /restrictive_update_policy_count.*\*\*0\*\*|restrictive_update_policy_count.*=\s*0/i.test(
    doc,
  ),
);
assert(
  "doc restrictive_policy_name_collision_count=0",
  /restrictive_policy_name_collision_count.*\*\*0\*\*|restrictive_policy_name_collision_count.*=\s*0/i.test(
    doc,
  ),
);
assert(
  "doc is_admin_function_exists=true",
  /is_admin_function_exists.*\*\*true\*\*|is_admin_function_exists.*=\s*true/i.test(doc),
);
assert(
  "doc Apply SQL未実行",
  /Apply SQL executed.*\*\*no\*\*|applySqlExecuted:\s*false|Apply SQL.*未実行/i.test(doc),
);
assert(
  "doc GRANT/REVOKE未実行",
  /GRANT \/ REVOKE executed.*\*\*no\*\*|grantRevokeExecuted:\s*false/i.test(doc),
);
assert(
  "doc CREATE POLICY未実行",
  /CREATE POLICY executed.*\*\*no\*\*|createPolicyExecuted:\s*false/i.test(doc),
);
assert("doc DB writeなし", /DB write.*\*\*no\*\*|dbWriteExecuted:\s*false/i.test(doc));
assert(
  "doc operation=save未送信",
  /operation=save.*not sent|operationSaveSent:\s*false|operation=save.*未送信/i.test(doc),
);
assert(
  "doc Save有効化なし",
  /Save enablement.*\*\*no\*\*|saveEnablementExecuted:\s*false/i.test(doc),
);
assert(
  "doc service_role不使用",
  /service_role.*not used|serviceRoleUsed:\s*false|service_role.*不使用/i.test(doc),
);
assert(
  "doc First controlled Save still not allowed",
  /First controlled Save.*still not allowed|firstControlledSaveStillNotAllowed:\s*true/i.test(
    doc,
  ),
);
assert("doc next phase apply SQL extract", doc.includes(NEXT_PHASE));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF));
assert("doc captured_at", doc.includes(CAPTURED_AT));

assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u36e-controlled-save-permission-change-preflight-select-result",
  ),
);
assert(
  "AI current-state preflight result",
  currentState.includes(PHASE) ||
    currentState.includes(
      "gosakiDiscographyControlledSavePermissionChangePreflightSelectResultRecorded",
    ),
);
assert(
  "AI next-actions apply extract or preflight result",
  nextActions.includes(NEXT_PHASE) || nextActions.includes(PHASE),
);
assert(
  "AI handoff preflight result",
  handoff.includes(PHASE) ||
    handoff.includes(
      "gosakiDiscographyControlledSavePermissionChangePreflightSelectResultRecorded",
    ),
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
  `\nverify-g20u36e-controlled-save-permission-change-preflight-select-result: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
