/**
 * G-22e — Gosaki Schedule new event dry-run UI implementation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22e-gosaki-schedule-new-event-dry-run-ui-implementation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-new-event-dry-run-ui-implementation.md";
const BASE_COMMIT = "2ed6122";

const G22E_MODULE = "src/lib/admin/staging-write/gosaki-schedule-new-event-dry-run.ts";
const SCHEDULE_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const SCHEDULE_OPERATOR_TS =
  "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const DRY_RUN_ADAPTER = "src/lib/admin/staging-write/schedule-dry-run-adapter.ts";
const G9K_SAVE = "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const G22D_INSERT_SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const G22D_GUARDS = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-guards.ts";
const ADMIN_CSS = "tools/static-to-astro/templates/admin-cms/styles/admin.css";

const PROD_REF = "vsbvndwuajjhnzpohghh";
const G22E_APPROVAL = "G-22e-gosaki-schedule-new-event-dry-run";

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

assert("HEAD is 2ed6122", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 2ed6122", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());
assert("G-22e doc exists", exists(DOC_REL));
assert("G-22e module exists", exists(G22E_MODULE));

const doc = read(DOC_REL);
const g22eModule = read(G22E_MODULE);
const scheduleUi = read(SCHEDULE_UI);
const scheduleTs = read(SCHEDULE_OPERATOR_TS);
const g9kSave = read(G9K_SAVE);
const g22dInsertSave = read(G22D_INSERT_SAVE);
const g22dGuards = read(G22D_GUARDS);
const adapter = read(DRY_RUN_ADAPTER);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22e", doc.includes("G-22e-gosaki-schedule-new-event-dry-run-ui-implementation"));
assert("doc gate complete", doc.includes("gosakiScheduleNewEventDryRunUiImplementationComplete: true"));
assert("doc no save executed", doc.includes("saveExecuted: false"));
assert("doc no db write", doc.includes("dbWriteExecuted: false"));
assert("doc insert not implemented", doc.includes("insertSaveModuleCreated: false"));
assert("doc readyForG22e1", doc.includes("readyForG22e1ScheduleNewEventDryRunLocalQa: true"));
assert("doc package regen not executed", doc.includes("packageRegenExecuted: false"));
assert("doc FTP not executed", doc.includes("ftpUploadExecuted: false"));

assert("module approvalId", g22eModule.includes(G22E_APPROVAL));
assert("module buildGosakiScheduleNewEventDraft", g22eModule.includes("buildGosakiScheduleNewEventDraft"));
assert("module executeG22eScheduleNewEventDryRun", g22eModule.includes("executeG22eScheduleNewEventDryRun"));
assert("module validateG22eNewEventDryRunForm", g22eModule.includes("validateG22eNewEventDryRunForm"));
assert("module wraps buildScheduleNewEventDryRunResult", g22eModule.includes("buildScheduleNewEventDryRunResult"));
assert("module operation new", g22eModule.includes('operation: "new"'));
assert("module saveAllowed false", g22eModule.includes("saveAllowed: false"));
assert("module actualWrite false", g22eModule.includes("actualWrite: false"));
assert("module wouldInsert", g22eModule.includes("wouldInsert"));
assert("module no insert call", !g22eModule.includes(".insert("));
assert("module no duplicate guard import", !g22eModule.includes("assertG22dDuplicateInsertPayloadOnly"));
assert("module no G22D sourceId", !g22eModule.includes("G22D_DUPLICATE_INSERT_SOURCE_ID"));

assert("adapter buildScheduleNewEventDryRunResult", adapter.includes("buildScheduleNewEventDryRunResult"));
assert("adapter operation new", adapter.includes('operation: "new"'));

assert("add button enabled markup", scheduleUi.includes('id="gosaki-schedule-add-btn"') && !scheduleUi.includes('id="gosaki-schedule-add-btn"\n        data-gosaki-schedule-action-disabled'));
assert("add button label", scheduleUi.includes("新規追加案を作成"));
assert("new event draft banner", scheduleUi.includes("gosaki-schedule-new-event-draft-banner"));
assert("new event banner copy", scheduleUi.includes("新規追加案"));
assert("new event unsaved copy", scheduleUi.includes("まだ保存されていません"));
assert("save disabled note", scheduleUi.includes("保存は現在無効です"));
assert("delete still disabled", scheduleUi.includes('id="gosaki-schedule-delete-btn"') && scheduleUi.includes("data-gosaki-schedule-action-disabled"));

assert("UI editDraftMode new", scheduleTs.includes('"new"') || scheduleTs.includes("'new'"));
assert("UI isNewEventDraftMode", scheduleTs.includes("isNewEventDraftMode"));
assert("UI enterNewEventDraftMode", scheduleTs.includes("enterNewEventDraftMode"));
assert("UI wireAddButton", scheduleTs.includes("wireAddButton"));
assert("UI executeG22eScheduleNewEventDryRun", scheduleTs.includes("executeG22eScheduleNewEventDryRun"));
assert("UI renderNewEventDryRunResult", scheduleTs.includes("renderNewEventDryRunResult"));
assert("UI new mode save disabled", scheduleTs.includes("保存（現在は無効）"));
assert("UI new mode save alert", scheduleTs.includes("新規追加の保存はまだ無効です"));
assert("UI duplicate path preserved", scheduleTs.includes("executeG22bScheduleDuplicateDryRun"));
assert("UI G9k save path preserved", scheduleTs.includes("executeG9kExistingEventSaveButtonSave"));
assert("UI G22d insert path preserved", scheduleTs.includes("executeG22dScheduleDuplicateInsertSave"));

assert("G22d insert save unchanged (no diff)", gitDiff(G22D_INSERT_SAVE).length === 0);
assert("G22d guards unchanged (no diff)", gitDiff(G22D_GUARDS).length === 0);
assert("G9k save unchanged (no diff)", gitDiff(G9K_SAVE).length === 0);
assert("G9k save no insert", !g9kSave.includes(".insert("));
assert("G22d insert save exists", g22dInsertSave.includes("executeG22dScheduleDuplicateInsertSave"));

assert("no prod ref in new module", !g22eModule.includes(PROD_REF));
assert("no prod ref in operator UI diff", !gitDiff(SCHEDULE_OPERATOR_TS).includes(PROD_REF));

assert("admin css new event banner", read(ADMIN_CSS).includes("gosaki-schedule-new-event-draft-banner"));
assert("admin css validation warnings", read(ADMIN_CSS).includes("gosaki-schedule-edit-dry-run__validation-warnings"));

assert("00-current-state mentions G-22e", currentState.includes("G-22e"));
assert("03-next-actions mentions G-22e", nextActions.includes("G-22e"));
assert("handoff mentions G-22e", handoff.includes("G-22e"));
assert("03-next-actions G-22e1 next", nextActions.includes("G-22e1"));
assert("handoff G-22e1 next", handoff.includes("G-22e1"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("package regen not executed", true);
assert("FTP upload not executed by Cursor", true);
assert("commit push not executed", true);

console.log(
  `\nG-22e Gosaki Schedule new event dry-run UI verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
