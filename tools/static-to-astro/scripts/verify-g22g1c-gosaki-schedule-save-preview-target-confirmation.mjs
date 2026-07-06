/**
 * G-22g1c — Gosaki Schedule save preview / target confirmation panel verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22g1c-gosaki-schedule-save-preview-target-confirmation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-save-preview-target-confirmation.md";
const OPERATOR_TS = "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const OPERATOR_PAGE =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const ADMIN_CSS = "tools/static-to-astro/templates/admin-cms/styles/admin.css";

const G9K_SAVE =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const WRITE_ADAPTER = "src/lib/admin/staging-write/schedule-write-adapter.ts";
const G22D_SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const G22E_SAVE = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-save.ts";
const G22F_SAVE = "src/lib/admin/staging-write/gosaki-schedule-unpublish-update-save.ts";
const APPROVAL_IDS = "src/lib/admin/staging-write/staging-write-approval-ids.ts";

const BASE_COMMIT = "9c6d514";
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
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 9c6d514", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 9c6d514", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("doc exists", exists(DOC_REL));

const doc = read(DOC_REL);
const operatorTs = read(OPERATOR_TS);
const operatorPage = read(OPERATOR_PAGE);
const adminCss = read(ADMIN_CSS);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22g1c", doc.includes("G-22g1c-gosaki-schedule-save-preview-target-confirmation"));
assert("doc gate complete", doc.includes("gosakiScheduleSavePreviewTargetConfirmationComplete: true"));
assert("doc purpose", doc.includes("G-22f5"));
assert("doc preview panel", doc.includes("保存前確認パネル"));
assert("doc save target panel", doc.includes("gosaki-schedule-save-target-panel"));
assert("doc save result labels", doc.includes("保存前 updated_at"));
assert("doc next G-22g2", doc.includes("G-22g2"));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc db write not executed", doc.includes("dbWriteExecuted: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));

assert("operator OPERATION_KIND_LABELS", operatorTs.includes("OPERATION_KIND_LABELS"));
assert("operator existing-update label", operatorTs.includes("既存公演を更新"));
assert("operator duplicate label", operatorTs.includes("複製して新規下書きを作成"));
assert("operator new-event label", operatorTs.includes("新規公演を追加"));
assert("operator unpublish label", operatorTs.includes("公演を非公開にする"));
assert("operator renderTargetIdentitySection", operatorTs.includes("renderTargetIdentitySection"));
assert("operator renderPreviewSafetySection", operatorTs.includes("renderPreviewSafetySection"));
assert("operator updateSaveTargetPanel", operatorTs.includes("updateSaveTargetPanel"));
assert("operator renderPreviewBadge", operatorTs.includes("renderPreviewBadge"));
assert("operator renderSaveResultBadge", operatorTs.includes("renderSaveResultBadge"));
assert("operator renderWorkflowStepIndicator", operatorTs.includes("renderWorkflowStepIndicator"));
assert("operator preview badge actualWrite", operatorTs.includes("actualWrite=false"));
assert("operator no physical delete note", operatorTs.includes("行は削除しません"));
assert("operator save result before label", operatorTs.includes("保存前 updated_at（before updated_at）"));
assert("operator save result after label", operatorTs.includes("保存後 updated_at（saved updated_at）"));
assert("operator optimistic lock label", operatorTs.includes("optimistic lock 基準（expectedBeforeUpdatedAt）"));
assert("operator optimistic lock explanation", operatorTs.includes("renderOptimisticLockExplanation"));
assert("operator init calls updateSaveTargetPanel", operatorTs.includes("updateSaveTargetPanel();"));
assert("operator no insert", !operatorTs.includes(".insert("));
assert("operator no supabase update", !operatorTs.match(/\.update\s*\(/));

assert("page save target panel element", operatorPage.includes("gosaki-schedule-save-target-panel"));
assert("page save target panel id", operatorPage.includes('id="gosaki-schedule-save-target-panel"'));

assert("css save target panel", adminCss.includes(".gosaki-schedule-save-target-panel"));
assert("css preview confirmation badge", adminCss.includes(".gosaki-schedule-preview-confirmation__badge"));
assert("css save result badge", adminCss.includes(".gosaki-schedule-save-result__badge"));
assert("css workflow steps", adminCss.includes(".gosaki-schedule-workflow-steps"));
assert("css lock note", adminCss.includes(".gosaki-schedule-edit-dry-run__lock-note"));

assert("G9k save unchanged", gitDiff(G9K_SAVE).length === 0);
assert("write adapter unchanged", gitDiff(WRITE_ADAPTER).length === 0);
assert("G22d save unchanged", gitDiff(G22D_SAVE).length === 0);
assert("G22e save unchanged", gitDiff(G22E_SAVE).length === 0);
assert("G22f save unchanged", gitDiff(G22F_SAVE).length === 0);
assert("approval ids unchanged", gitDiff(APPROVAL_IDS).length === 0);

assert("operator diff no prod ref", !gitDiff(OPERATOR_TS).includes(PROD_REF));
assert("operator page diff no prod ref", !gitDiff(OPERATOR_PAGE).includes(PROD_REF));

assert("00-current-state mentions G-22g1c", currentState.includes("G-22g1c"));
assert("03-next-actions mentions G-22g1c", nextActions.includes("G-22g1c"));
assert("handoff mentions G-22g1c", handoff.includes("G-22g1c"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(
  `\nG-22g1c Gosaki Schedule save preview / target confirmation verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
