/**
 * G-20u36e post-close result-record verifier.
 * No SQL / Save / Rollback execution.
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-post-close-result.md";
const PHASE = "G-20u36e-controlled-save-post-close-result-record";
const GATE = "gosakiDiscographyControlledSavePostCloseCompleted: true";
const TITLE_NEW = "On a Clear Day [CMS Kit staging G-20u36e]";
const TARGET_ID = "e30c5ea9-2857-492b-8a78-58cbfcbe7929";
const STAGING = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION = "vsbvndwuajjhnzpohghh";
const NEXT_UI = "G-20u36e-controlled-save-ui-visible-verification";
const NEXT_HANDOFF = "Gosaki Discography controlled Save completion handoff";

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

assert("post-close result doc exists", exists(DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "First controlled Save PASS",
  /First controlled Save.*\*\*PASS\*\*|firstControlledSavePass:\s*true/i.test(doc),
);
assert(
  "permission close PASS",
  /Permission close.*\*\*PASS\*\*|permissionClosePass:\s*true/i.test(doc),
);
assert(
  "post-close SELECT PASS",
  /Post-close SELECT.*\*\*PASS\*\*|postCloseSelectPass:\s*true/i.test(doc),
);
assert("target_title new", doc.includes(TITLE_NEW));
assert(
  "old_title_count_for_target=0",
  /old_title_count_for_target.*\*\*0\*\*/i.test(doc),
);
assert(
  "target_row_count=1",
  /target_row_count.*\*\*1\*\*/i.test(doc),
);
assert(
  "target_row_id_matches=true",
  /target_row_id_matches.*\*\*true\*\*/i.test(doc),
);
assert("target row id", doc.includes(TARGET_ID));
assert(
  "track_count=8",
  /track_count.*\*\*8\*\*/i.test(doc),
);
assert(
  "track_7_title=Like a Lover",
  /track_7_title.*Like a Lover/i.test(doc),
);
assert(
  "authenticated_title_update_column_grants_count=0",
  /authenticated_title_update_column_grants_count.*\*\*0\*\*/i.test(doc),
);
assert(
  "authenticated_table_update_grants_count=0",
  /authenticated_table_update_grants_count.*\*\*0\*\*/i.test(doc),
);
assert(
  "anon_write_grants_count=0",
  /anon_write_grants_count.*\*\*0\*\*/i.test(doc),
);
assert(
  "actual_restrictive_policy_count=0",
  /actual_restrictive_policy_count.*\*\*0\*\*/i.test(doc),
);
assert(
  "any_g20u36e_restrictive_update_policy_count=0",
  /any_g20u36e_restrictive_update_policy_count.*\*\*0\*\*/i.test(doc),
);
assert(
  "admin_all_policy_count=2",
  /admin_all_policy_count.*\*\*2\*\*/i.test(doc),
);
assert(
  "rls_enabled_discography_tracks=true",
  /rls_enabled_discography_tracks.*\*\*true\*\*/i.test(doc),
);
assert(
  "additional Save not allowed",
  /Additional Save.*not allowed|additionalSaveNotAllowed:\s*true/i.test(doc),
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
assert("staging/production refs", doc.includes(STAGING) && doc.includes(PRODUCTION));
assert(
  "next phase ui or handoff",
  doc.includes(NEXT_UI) || doc.includes(NEXT_HANDOFF),
);
assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-post-close-result"),
);
assert(
  "AI current-state post-close",
  currentState.includes(PHASE) ||
    currentState.includes("gosakiDiscographyControlledSavePostCloseCompleted"),
);
assert(
  "AI next-actions ui or handoff or post-close",
  nextActions.includes(NEXT_UI) ||
    nextActions.includes(NEXT_HANDOFF) ||
    nextActions.includes(PHASE),
);
assert(
  "AI handoff post-close",
  handoff.includes(PHASE) ||
    handoff.includes(NEXT_UI) ||
    handoff.includes("gosakiDiscographyControlledSavePostCloseCompleted"),
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
  `\nverify-g20u36e-controlled-save-post-close-result: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
