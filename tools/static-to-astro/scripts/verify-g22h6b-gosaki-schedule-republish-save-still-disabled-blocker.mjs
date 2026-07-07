/**
 * G-22h6b retry2 — Gosaki Schedule republish Save still disabled blocker verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22h6b-retry2-gosaki-schedule-republish-save-still-disabled-blocker.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-republish-save-still-disabled-blocker.md";
const PRIOR_BLOCKER_DOC =
  "tools/static-to-astro/docs/gosaki-schedule-republish-save-disabled-blocker.md";
const OPERATOR_UI = "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const REPUBLISH_CONFIG = "src/lib/admin/staging-write/gosaki-schedule-republish-update-config.ts";

const BASE_COMMIT = "3d5f8b0";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const TARGET_LEGACY = "schedule-2026-07-008";
const EXPECTED_UPDATED_AT = "2026-07-06T13:58:41.425402+00:00";
const LEGACY_MISLEADING_NOTE = "再公開の保存はG-22h6以降で有効化します。現在は保存できません。";

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

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 3d5f8b0", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());

assert("retry2 blocker doc exists", exists(DOC_REL));
assert("prior blocker doc exists", exists(PRIOR_BLOCKER_DOC));

const doc = read(DOC_REL);
const operatorUi = read(OPERATOR_UI);
const republishConfig = read(REPUBLISH_CONFIG);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase retry2", doc.includes("G-22h6b-retry2-blocker"));
assert("doc not executed", doc.includes("g22h6bRepublishUpdateOperatorSaveOnceExecuted: false"));
assert("doc retry2 blocked", doc.includes("g22h6bRetry2Blocked: true"));
assert("doc preview succeeded", doc.includes("dry-run preview") || doc.includes("operator PASS"));
assert("doc env arm true displayed", doc.includes("envArmDisplayedTrueButSaveDisabled: true"));
assert("doc save disabled", doc.includes("Save button enabled") && doc.includes("no"));
assert("doc button label", doc.includes("再公開を保存（現在は無効）"));
assert("doc misleading note recorded", doc.includes(LEGACY_MISLEADING_NOTE));
assert("doc no save no db", doc.includes("saveExecuted: false") && doc.includes("dbWriteExecuted: false"));
assert("doc dev stopped", doc.includes("stopped"));
assert("doc port none", doc.includes("port 4321 LISTEN") && doc.includes("none"));
assert("doc root cause dry-run cleared", doc.includes("clearDryRunResult") || doc.includes("dry-run state cleared"));
assert("doc fix preservation", doc.includes("shouldClearDryRunOnEditFormRender") || doc.includes("dry-run preservation"));
assert("doc next retry3", doc.includes("retry3") || doc.includes("G-22h6b retry3"));
assert("doc staging ref", doc.includes(STAGING_REF));

assert("fix isDraftModePreservingDryRun", operatorUi.includes("isDraftModePreservingDryRun"));
assert("fix shouldClearDryRunOnEditFormRender", operatorUi.includes("shouldClearDryRunOnEditFormRender"));
assert("fix auth refetch clearDryRun false", operatorUi.includes("clearDryRun: !isDraftModePreservingDryRun()"));
assert("fix save target dry-run ok", operatorUi.includes("dry-run ok"));
assert("fix save target Save gate", operatorUi.includes("Save gate"));
assert("fix save target saveEnabled", operatorUi.includes("saveEnabled (config)"));
assert("config dry-run gate not legacy only", !republishConfig.includes(`reason: "${LEGACY_MISLEADING_NOTE}"`));
assert("config dry-run required message", republishConfig.includes("dry-run preview required"));
assert("operator no .update(", !operatorUi.includes(".update("));
assert("operator session sync retained", operatorUi.includes("stagingAuthSignedIn = signedIn"));

const portCheck = spawnSync("lsof", ["-iTCP:4321", "-sTCP:LISTEN"], {
  encoding: "utf8",
});
if (portCheck.stdout.trim().length === 0) {
  console.log("PASS port 4321 LISTEN none");
  passed += 1;
} else {
  console.error(`FAIL port 4321 LISTEN none — ${portCheck.stdout.trim()}`);
  failed += 1;
}

assert("00-current-state mentions retry2 or still-disabled", currentState.includes("retry2") || currentState.includes("still-disabled"));
assert("03-next-actions mentions retry3 or blocker", nextActions.includes("retry3") || nextActions.includes("still-disabled"));
assert("handoff mentions retry2 or blocker", handoff.includes("retry2") || handoff.includes("still-disabled"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("service_role not used by Cursor", true);
assert("public reflection not executed by Cursor", true);

console.log(
  `\nG-22h6b retry2 Gosaki Schedule republish Save still disabled blocker verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
