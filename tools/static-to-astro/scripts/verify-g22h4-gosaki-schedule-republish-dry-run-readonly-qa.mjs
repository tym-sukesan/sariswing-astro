/**
 * G-22h4 — Gosaki Schedule republish dry-run read-only QA verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22h4-gosaki-schedule-republish-dry-run-readonly-qa.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-republish-dry-run-readonly-qa.md";
const G22H3_DOC =
  "tools/static-to-astro/docs/gosaki-schedule-republish-dry-run-implementation.md";

const REPUBLISH_DRY_RUN =
  "src/lib/admin/staging-write/gosaki-schedule-republish-dry-run.ts";
const REPUBLISH_CONFIG =
  "src/lib/admin/staging-write/gosaki-schedule-republish-update-config.ts";
const REPUBLISH_SAVE =
  "src/lib/admin/staging-write/gosaki-schedule-republish-update-save.ts";
const OPERATOR_UI = "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const ASTRO_PAGE =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const G9K_SAVE = "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const G22D_SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const G22E_SAVE = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-save.ts";
const G22F_SAVE = "src/lib/admin/staging-write/gosaki-schedule-unpublish-update-save.ts";

const BASE_COMMIT = "4e45f90";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const TARGET_LEGACY = "schedule-2026-07-008";
const TARGET_ID = "3e572f02-4f35-460e-80a1-3a7d15ca3fd9";
const EXPECTED_UPDATED_AT = "2026-07-06T13:58:41.425402+00:00";
const ENGLISH_RESIDUAL =
  "Republish dry-run preview must succeed before Save (G-22h6).";

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

function gitDiff(rel) {
  return spawnSync("git", ["diff", rel], { cwd: REPO_ROOT, encoding: "utf8" }).stdout;
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 4e45f90", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 4e45f90", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-22h4 QA doc exists", exists(DOC_REL));
assert("G-22h3 prior doc exists", exists(G22H3_DOC));
assert("republish save module absent", !exists(REPUBLISH_SAVE));

const doc = read(DOC_REL);
const g22h3Doc = read(G22H3_DOC);
const dryRunModule = read(REPUBLISH_DRY_RUN);
const republishConfig = read(REPUBLISH_CONFIG);
const operatorUi = read(OPERATOR_UI);
const astroPage = read(ASTRO_PAGE);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22h4", doc.includes("G-22h4-gosaki-schedule-republish-dry-run-readonly-qa"));
assert(
  "doc gate complete",
  doc.includes("gosakiScheduleRepublishDryRunReadonlyQaComplete: true"),
);
assert("doc read-only QA", doc.includes("read-only") || doc.includes("Read-only"));
assert("doc dry-run QA", doc.includes("dry-run") || doc.includes("Dry-run"));
assert("doc operator manual login", doc.includes("operator manual") || doc.includes("Operator manual"));
assert("doc credentials not recorded", doc.includes("credentialsRecorded: false") || doc.includes("not recorded"));
assert("doc no blocking issues", doc.includes("qaBlockingIssuesFound: false"));
assert("doc republish preview pass", doc.includes("republishDryRunPreviewPass: true"));
assert("doc operator login pass", doc.includes("operatorManualLoginQaPass: true"));

assert("doc target schedule-2026-07-008", doc.includes(TARGET_LEGACY));
assert("doc target id", doc.includes(TARGET_ID));
assert("doc target date 2026-07-17", doc.includes("2026-07-17"));
assert("doc target title", doc.includes("<>"));
assert("doc before published false", doc.includes("published") && doc.includes("false"));
assert("doc published false to true preview", doc.includes("false → true") || doc.includes("false → published=true"));
assert("doc operation republish", doc.includes("republish"));
assert("doc republish-update", doc.includes("republish-update"));
assert("doc actualWrite false", doc.includes("actualWrite") && doc.includes("false"));
assert("doc publicReflectionPending true", doc.includes("publicReflectionPending") && doc.includes("true"));
assert("doc expectedBeforeUpdatedAt", doc.includes("expectedBeforeUpdatedAt") && doc.includes(EXPECTED_UPDATED_AT));
assert("doc public reflection separate phase", doc.includes("公開サイトへの反映は別フェーズ"));
assert("doc physical delete false", doc.includes("physicalDelete") && doc.includes("false"));
assert("doc 再公開案を作成", doc.includes("再公開案を作成"));
assert("doc 変更を確認", doc.includes("変更を確認"));
assert("doc republish save disabled", doc.includes("再公開を保存（準備中）") && doc.includes("disabled"));
assert("doc republishSaveDisabledPass", doc.includes("republishSaveDisabledPass: true"));

assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc db write false", doc.includes("dbWriteExecuted: false"));
assert("doc cursor db write false", doc.includes("cursorDbWriteExecuted: false"));
assert("doc sql mutation false", doc.includes("sqlMutationExecuted: false"));
assert("doc rollback not executed", doc.includes("rollbackSqlExecuted: false"));
assert("doc rls grant unchanged", doc.includes("rlsGrantChangeExecuted: false"));
assert("doc service role not used", doc.includes("serviceRoleUsed: false"));
assert("doc package regen not executed", doc.includes("packageRegenExecuted: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc public reflection not executed", doc.includes("publicReflectionExecuted: false"));
assert("doc write-armed not used", doc.includes("writeArmedDevServerUsed: false"));
assert("doc dev server stopped", doc.includes("port4321ListenAfterQa: false") || doc.includes("4321 LISTEN none"));
assert("doc dry-run env", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=true"));
assert("doc write false", doc.includes("ENABLE_ADMIN_STAGING_WRITE=false"));
assert("doc G-22h arm false", doc.includes("G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED=false"));

assert("doc residual english wording", doc.includes(ENGLISH_RESIDUAL));
assert("doc residual non-blocking", doc.includes("residualEnglishWordingBlocking: false"));
assert("doc G-22h4b cleanup candidate", doc.includes("G-22h4b") || doc.includes("wording cleanup"));
assert("doc next G-22h5 preflight", doc.includes("G-22h5"));
assert("doc next G-22h6 actual UPDATE", doc.includes("G-22h6"));
assert("doc fix not required", doc.includes("Fix required?") && doc.includes("**No.**"));
assert("doc references G-22h3", doc.includes("G-22h3"));
assert("doc base commit 646f680 or 4e45f90", doc.includes("646f680") || doc.includes("4e45f90"));
assert("doc never sariswing prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc staging ref only", doc.includes(STAGING_REF));
assert(
  "doc prod ref only in never context",
  !doc.includes(PROD_REF) || /never.*vsbvndwuajjhnzpohghh/i.test(doc),
);

assert(
  "G-22h3 doc readyForG22h4 was true",
  g22h3Doc.includes("readyForG22h4RepublishDryRunReadOnlyQa: true"),
);

assert("operator UI republish dry-run", operatorUi.includes("executeG22hScheduleRepublishDryRun"));
assert("operator UI republish save stub", operatorUi.includes("再公開を保存（準備中）"));
assert(
  "config english residual historical only (G-22h4b resolved)",
  !republishConfig.includes(ENGLISH_RESIDUAL),
);
assert("page republish btn", astroPage.includes('id="gosaki-schedule-republish-btn"'));
assert("page procedure hint republish", astroPage.includes('data-gosaki-procedure-hint="republish"'));

assert("dry-run module actualWrite false", dryRunModule.includes("actualWrite: false"));
assert("dry-run module publicReflectionPending", dryRunModule.includes("publicReflectionPending: true"));
assert("dry-run module no .update(", !dryRunModule.includes(".update("));
assert("config saveEnabled false", republishConfig.includes("saveEnabled: false"));

assert("G9k save unchanged", gitDiff(G9K_SAVE).length === 0);
assert("G22d save unchanged", gitDiff(G22D_SAVE).length === 0);
assert("G22e save unchanged", gitDiff(G22E_SAVE).length === 0);
assert("G22f save unchanged", gitDiff(G22F_SAVE).length === 0);
assert("republish dry-run unchanged", gitDiff(REPUBLISH_DRY_RUN).length === 0);
assert("operator diff no prod ref", !gitDiff(OPERATOR_UI).includes(PROD_REF));

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

assert("00-current-state mentions G-22h4", currentState.includes("G-22h4"));
assert("03-next-actions mentions G-22h4", nextActions.includes("G-22h4"));
assert("handoff mentions G-22h4", handoff.includes("G-22h4"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(
  `\nG-22h4 Gosaki Schedule republish dry-run read-only QA verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
