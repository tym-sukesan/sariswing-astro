/**
 * G-20u36e-controlled-save-permission-change-post-apply-result verifier.
 * Result record only — no Save / Rollback / additional SQL.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-permission-change-post-apply-result.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-permission-change-post-apply-result.md";
const PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-permission-change-preflight-select-result.md";
const PHASE =
  "G-20u36e-controlled-save-permission-change-post-apply-result-record";
const GATE =
  "gosakiDiscographyControlledSavePermissionChangePostApplyResultRecorded: true";
const OBSERVED_POLICY =
  "discography_tracks_g20u36e_controlled_save_title_update_restric";
const CAPTURED_AT = "2026-07-14T14:01:27.966199+00:00";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const NEXT_A = "G-20u36e-controlled-save-handler-permission-aware-planning";
const NEXT_B = "G-20u36e-controlled-save-rollback-name-adjustment-prep";

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
assert("preflight result doc exists", exists(PREFLIGHT_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "doc Apply SQL executed",
  /Apply SQL.*executed manually|applySqlExecutedManuallyInStaging:\s*true/i.test(
    doc,
  ),
);
assert(
  "doc Success. No rows returned",
  doc.includes("Success. No rows returned"),
);
assert(
  "doc Post-apply v2 PASS",
  /Post-apply v2.*\*\*PASS\*\*|postApplyV2SelectPass:\s*true/i.test(doc),
);
assert(
  "doc exact-name false negative due truncation",
  /false negative/i.test(doc) && /truncat/i.test(doc),
);
assert("doc actual truncated policy name", doc.includes(OBSERVED_POLICY));
assert(
  "doc policyname_length=63",
  /policyname_length.*\*\*63\*\*|policynameLength:\s*63|actual_restrictive_policy_name_length.*\*\*63\*\*/i.test(
    doc,
  ),
);
assert(
  "doc authenticated_title_update_column_grants_count=1",
  /authenticated_title_update_column_grants_count.*\*\*1\*\*/i.test(doc),
);
assert(
  "doc authenticated_table_update_grants_count=0",
  /authenticated_table_update_grants_count.*\*\*0\*\*/i.test(doc),
);
assert(
  "doc anon_write_grants_count=0",
  /anon_write_grants_count.*\*\*0\*\*/i.test(doc),
);
assert(
  "doc restrictive_policy_candidate_count=1",
  /restrictive_policy_candidate_count.*\*\*1\*\*/i.test(doc),
);
assert(
  "doc observed_truncated_policy_name_count=1",
  /observed_truncated_policy_name_count.*\*\*1\*\*/i.test(doc),
);
assert(
  "doc intended_full_policy_name_count=0",
  /intended_full_policy_name_count.*\*\*0\*\*/i.test(doc),
);
assert(
  "doc admin_all_policy_count=2",
  /admin_all_policy_count.*\*\*2\*\*/i.test(doc),
);
assert(
  "doc rls_enabled_discography_tracks=true",
  /rls_enabled_discography_tracks.*\*\*true\*\*/i.test(doc),
);
assert(
  "doc target_row_count=1",
  /target_row_count.*\*\*1\*\*/i.test(doc),
);
assert(
  "doc target_title=On a Clear Day",
  /target_title.*On a Clear Day/i.test(doc),
);
assert("doc track_count=8", /track_count.*\*\*8\*\*/i.test(doc));
assert(
  "doc track_7_title=Like a Lover",
  /track_7_title.*Like a Lover|Like a Lover/i.test(doc),
);
assert(
  "doc operation_save_involved=false",
  /operation_save_involved.*\*\*false\*\*/i.test(doc),
);
assert(
  "doc data_mutation=false",
  /data_mutation.*\*\*false\*\*|dbDataMutation:\s*false/i.test(doc),
);
assert(
  "doc service_role不使用",
  /service_role.*not used|serviceRoleUsed:\s*false|service_role.*不使用/i.test(
    doc,
  ),
);
assert(
  "doc production未変更",
  /Production changed.*\*\*no\*\*|productionChanged:\s*false|production未変更/i.test(
    doc,
  ),
);
assert(
  "doc Save未実行",
  /Save executed.*\*\*no\*\*|saveExecuted:\s*false|Save未実行/i.test(doc),
);
assert(
  "doc Rollback未実行",
  /Rollback executed.*\*\*no\*\*|rollbackExecuted:\s*false|Rollback未実行/i.test(
    doc,
  ),
);
assert(
  "doc First controlled Save still not executed",
  /First controlled Save.*still not executed|firstControlledSaveStillNotExecuted:\s*true/i.test(
    doc,
  ),
);
assert(
  "doc rollback should use observed truncated policy name",
  /rollback/i.test(doc) &&
    /observed truncated|observed policy name|actual observed/i.test(doc) &&
    doc.includes(OBSERVED_POLICY),
);
assert("doc captured_at v2", doc.includes(CAPTURED_AT));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF));
assert(
  "doc next phase options",
  doc.includes(NEXT_A) && doc.includes(NEXT_B),
);

assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u36e-controlled-save-permission-change-post-apply-result",
  ),
);
assert(
  "AI current-state post-apply result",
  currentState.includes(PHASE) ||
    currentState.includes(
      "gosakiDiscographyControlledSavePermissionChangePostApplyResultRecorded",
    ),
);
assert(
  "AI next-actions post-apply or next candidates",
  nextActions.includes(PHASE) ||
    nextActions.includes(NEXT_A) ||
    nextActions.includes(NEXT_B),
);
assert(
  "AI handoff post-apply result",
  handoff.includes(PHASE) ||
    handoff.includes(
      "gosakiDiscographyControlledSavePermissionChangePostApplyResultRecorded",
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
  `\nverify-g20u36e-controlled-save-permission-change-post-apply-result: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
