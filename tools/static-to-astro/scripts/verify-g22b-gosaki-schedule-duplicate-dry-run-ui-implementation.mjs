/**
 * G-22b — Gosaki Schedule duplicate dry-run UI implementation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22b-gosaki-schedule-duplicate-dry-run-ui-implementation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-duplicate-dry-run-ui-implementation.md";
const BASE_COMMIT = "f8580ec";

const G22B_MODULE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-dry-run.ts";
const SCHEDULE_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const SCHEDULE_OPERATOR_TS =
  "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const DRY_RUN_ADAPTER = "src/lib/admin/staging-write/schedule-dry-run-adapter.ts";
const G9K_SAVE = "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const WRITE_ADAPTER = "src/lib/admin/staging-write/schedule-write-adapter.ts";
const ADMIN_CSS = "tools/static-to-astro/templates/admin-cms/styles/admin.css";

const PROD_REF = "vsbvndwuajjhnzpohghh";

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

assert("G-22b doc exists", exists(DOC_REL));
assert("G-22b module exists", exists(G22B_MODULE));

const doc = read(DOC_REL);
const g22bModule = read(G22B_MODULE);
const scheduleUi = read(SCHEDULE_UI);
const scheduleTs = read(SCHEDULE_OPERATOR_TS);
const g9kSave = read(G9K_SAVE);
const writeAdapter = read(WRITE_ADAPTER);

assert("doc phase G-22b", doc.includes("G-22b-gosaki-schedule-duplicate-dry-run-ui-implementation"));
assert("doc gate complete", doc.includes("gosakiScheduleDuplicateDryRunUiImplementationComplete: true"));
assert("doc no save executed", doc.includes("saveExecuted: false"));
assert("doc no db write", doc.includes("dbWriteExecuted: false"));
assert("doc G-22d deferred", doc.includes("G-22d"));
assert("doc readyForG22c", doc.includes("readyForG22cScheduleDuplicateDryRunLocalQa: true"));

assert("module approvalId", g22bModule.includes("G-22b-gosaki-schedule-duplicate-dry-run"));
assert("module buildGosakiScheduleDuplicateDraft", g22bModule.includes("buildGosakiScheduleDuplicateDraft"));
assert("module executeG22bScheduleDuplicateDryRun", g22bModule.includes("executeG22bScheduleDuplicateDryRun"));
assert("module wraps buildScheduleDuplicateDryRunResult", g22bModule.includes("buildScheduleDuplicateDryRunResult"));
assert("module saveAllowed false type", g22bModule.includes("saveAllowed: false"));
assert("module actualWrite false type", g22bModule.includes("actualWrite: false"));
assert("module wouldInsert", g22bModule.includes("wouldInsert"));
assert("module site_slug gosaki-piano", g22bModule.includes("STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG"));
assert("module no insert call", !g22bModule.includes(".insert("));

assert("duplicate button not markup-disabled", !scheduleUi.includes('id="gosaki-schedule-duplicate-btn"\n            data-gosaki-schedule-action-disabled'));
assert("duplicate button operator label", scheduleUi.includes("複製案を作成"));
assert("duplicate draft banner", scheduleUi.includes("gosaki-schedule-duplicate-draft-banner"));
assert("duplicate draft banner copy", scheduleUi.includes("複製案"));
assert("operator note updated", scheduleUi.includes("複製案の作成はできます"));
assert("add still disabled", scheduleUi.includes('id="gosaki-schedule-add-btn"') && scheduleUi.includes("data-gosaki-schedule-action-disabled"));
assert("delete still disabled", scheduleUi.includes('id="gosaki-schedule-delete-btn"') && scheduleUi.includes("data-gosaki-schedule-action-disabled"));

assert("UI editDraftMode", scheduleTs.includes('editDraftMode'));
assert("UI duplicateSourceSnapshot", scheduleTs.includes("duplicateSourceSnapshot"));
assert("UI wireDuplicateButton", scheduleTs.includes("wireDuplicateButton"));
assert("UI enterDuplicateDraftFromSelectedRow", scheduleTs.includes("enterDuplicateDraftFromSelectedRow"));
assert("UI executeG22bScheduleDuplicateDryRun", scheduleTs.includes("executeG22bScheduleDuplicateDryRun"));
assert("UI renderDuplicateDryRunResult", scheduleTs.includes("renderDuplicateDryRunResult"));
assert("UI duplicate mode save guard", scheduleTs.includes("isDuplicateDraftMode()") && scheduleTs.includes("複製案はまだ保存できません"));
assert("UI duplicate mode update disabled", scheduleTs.includes("更新する（複製案）"));
assert("UI operator duplicate copy", scheduleTs.includes("まだ保存されていません"));

assert("dry-run adapter duplicate op", read(DRY_RUN_ADAPTER).includes('operation: "duplicate"'));

assert("G9k save adapter unchanged (no diff)", gitDiff(G9K_SAVE).length === 0);
assert("write adapter unchanged (no diff)", gitDiff(WRITE_ADAPTER).length === 0);
assert("G9k save no insert", !g9kSave.includes(".insert("));
assert("write adapter no insert in gosaki path", !writeAdapter.match(/export function.*insert/i));

assert("no prod ref in new module", !g22bModule.includes(PROD_REF));
assert("no prod ref in operator UI diff", !gitDiff(SCHEDULE_OPERATOR_TS).includes(PROD_REF));

assert("admin css duplicate banner", read(ADMIN_CSS).includes("gosaki-schedule-duplicate-draft-banner"));

assert("doc package regen not executed", doc.includes("packageRegenExecuted: false"));
assert("doc FTP not executed", doc.includes("ftpUploadExecuted: false"));

console.log(`\nG-22b Gosaki schedule duplicate dry-run UI verifier: ${passed} passed, ${failed} failed`);
console.log(`HEAD: ${head.stdout.trim()} (base ${BASE_COMMIT})`);
process.exit(failed > 0 ? 1 : 0);
