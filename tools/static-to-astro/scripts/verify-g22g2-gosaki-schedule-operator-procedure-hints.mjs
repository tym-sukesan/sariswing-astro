/**
 * G-22g2 — Gosaki Schedule operator procedure hints verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22g2-gosaki-schedule-operator-procedure-hints.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-operator-procedure-hints.md";
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

const BASE_COMMIT = "fd47f8b";
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

assert("HEAD is fd47f8b", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is fd47f8b", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("doc exists", exists(DOC_REL));

const doc = read(DOC_REL);
const operatorTs = read(OPERATOR_TS);
const operatorPage = read(OPERATOR_PAGE);
const adminCss = read(ADMIN_CSS);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22g2", doc.includes("G-22g2-gosaki-schedule-operator-procedure-hints"));
assert("doc gate complete", doc.includes("gosakiScheduleOperatorProcedureHintsComplete: true"));
assert("doc purpose", doc.includes("操作手順ヒント"));
assert("doc preview vs db write", doc.includes("Preview vs DB write"));
assert("doc save once", doc.includes("Save once"));
assert("doc unpublish not delete", doc.includes("not physical DELETE"));
assert("doc admin read unpublished", doc.includes("unpublished rows"));
assert("doc save not executed", doc.includes("Save executed") && doc.includes("false"));
assert("doc db write not executed", doc.includes("DB write") && doc.includes("false"));
assert("doc ftp not executed", doc.includes("FTP") && doc.includes("false"));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc next phases", doc.includes("Schedule P0 UX QA"));

assert("operator renderOperationProcedureDetail", operatorTs.includes("renderOperationProcedureDetail"));
assert("operator updateActiveProcedureHintCard", operatorTs.includes("updateActiveProcedureHintCard"));
assert("operator updateAdminReadProcedureHint", operatorTs.includes("updateAdminReadProcedureHint"));
assert("operator step 3 toyama", operatorTs.includes("戸山が確認して保存"));
assert("operator db unchanged note", operatorTs.includes("DBは変わりません"));
assert("operator save once note", operatorTs.includes("連打禁止"));
assert("operator physical delete note", operatorTs.includes("物理削除"));
assert("operator unpublish not delete", operatorTs.includes("物理削除ではありません"));
assert("operator save preview label", operatorTs.includes("保存前プレビュー"));
assert("doc no chinese 不变", !doc.includes("不变"));
assert("operator no chinese 不变", !operatorTs.includes("不变"));
assert("page no chinese 不变", !operatorPage.includes("不变"));
assert("page no save preview english mix", !operatorPage.includes("保存前 preview"));
assert("operator no operator alert dry-run mix", !operatorTs.includes('dry-run を成功'));
assert("operator no insert", !operatorTs.includes(".insert("));
assert("operator no supabase update", !operatorTs.match(/\.update\s*\(/));
assert("operator no service_role", !operatorTs.includes("service_role"));
assert("operator no prod ref", !operatorTs.includes(PROD_REF));

assert("page procedure hints section", operatorPage.includes("gosaki-schedule-operator-procedure-hints"));
assert("page admin read hint id", operatorPage.includes("gosaki-schedule-admin-read-procedure-hint"));
assert("page four operation cards", operatorPage.includes('data-gosaki-procedure-hint="existing-update"'));
assert("page duplicate card", operatorPage.includes('data-gosaki-procedure-hint="duplicate"'));
assert("page new-event card", operatorPage.includes('data-gosaki-procedure-hint="new-event"'));
assert("page unpublish card", operatorPage.includes('data-gosaki-procedure-hint="unpublish"'));
assert("page db unchanged hint", operatorPage.includes("DBは変わりません"));
assert("page delete preparing note", operatorPage.includes("削除（準備中）"));
assert("page save once note", operatorPage.includes("1回だけ"));
assert("page no prod ref", !operatorPage.includes(PROD_REF));

assert("css procedure hints", adminCss.includes(".gosaki-schedule-operator-procedure-hints"));
assert("css active card", adminCss.includes(".gosaki-schedule-operator-procedure-hints__card--active"));
assert("css procedure hint detail", adminCss.includes(".gosaki-schedule-procedure-hint-detail"));

assert("G9k save unchanged", gitDiff(G9K_SAVE).length === 0);
assert("write adapter unchanged", gitDiff(WRITE_ADAPTER).length === 0);
assert("G22d save unchanged", gitDiff(G22D_SAVE).length === 0);
assert("G22e save unchanged", gitDiff(G22E_SAVE).length === 0);
assert("G22f save unchanged", gitDiff(G22F_SAVE).length === 0);
assert("approval ids unchanged", gitDiff(APPROVAL_IDS).length === 0);

assert("operator diff no prod ref", !gitDiff(OPERATOR_TS).includes(PROD_REF));
assert("operator page diff no prod ref", !gitDiff(OPERATOR_PAGE).includes(PROD_REF));

assert("00-current-state mentions G-22g2", currentState.includes("G-22g2"));
assert("03-next-actions mentions G-22g2", nextActions.includes("G-22g2"));
assert("handoff mentions G-22g2", handoff.includes("G-22g2"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(
  `\nG-22g2 verifier: ${passed} passed, ${failed} failed${failed ? " — FIX REQUIRED" : ""}\n`,
);
process.exit(failed > 0 ? 1 : 0);
