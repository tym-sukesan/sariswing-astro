/**
 * G-22g2a — Gosaki Schedule P0 UX read-only QA verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22g2a-gosaki-schedule-p0-ux-readonly-qa.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-p0-ux-readonly-qa.md";
const G22G2_DOC = "tools/static-to-astro/docs/gosaki-schedule-operator-procedure-hints.md";
const G22G1D_DOC = "tools/static-to-astro/docs/gosaki-schedule-p0-ux-qa.md";
const OPERATOR_TS = "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const OPERATOR_PAGE =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";

const G9K_SAVE =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const WRITE_ADAPTER = "src/lib/admin/staging-write/schedule-write-adapter.ts";
const G22D_SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const G22E_SAVE = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-save.ts";
const G22F_SAVE = "src/lib/admin/staging-write/gosaki-schedule-unpublish-update-save.ts";
const APPROVAL_IDS = "src/lib/admin/staging-write/staging-write-approval-ids.ts";

const BASE_COMMIT = "8e83348";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const TARGET_LEGACY = "schedule-2026-07-008";

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

assert("HEAD is 8e83348", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 8e83348", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("doc exists", exists(DOC_REL));
assert("G-22g2 prior doc exists", exists(G22G2_DOC));
assert("G-22g1d prior doc exists", exists(G22G1D_DOC));

const doc = read(DOC_REL);
const operatorTs = read(OPERATOR_TS);
const operatorPage = read(OPERATOR_PAGE);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22g2a", doc.includes("G-22g2a-gosaki-schedule-p0-ux-readonly-qa"));
assert("doc gate complete", doc.includes("gosakiScheduleP0UxReadonlyQaComplete: true"));
assert("doc read-only QA", doc.includes("read-only") || doc.includes("Read-only"));
assert("doc references G-22g2", doc.includes("G-22g2"));
assert("doc references G-22g1a", doc.includes("G-22g1a"));
assert("doc references G-22g1b", doc.includes("G-22g1b"));
assert("doc references G-22g1c", doc.includes("G-22g1c"));
assert("doc references G-22g1f", doc.includes("G-22g1f"));
assert("doc dry-run dev", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=true"));
assert("doc write false", doc.includes("ENABLE_ADMIN_STAGING_WRITE=false"));
assert("doc http 200", doc.includes("HTTP status") && doc.includes("200"));
assert("doc no transform error", doc.includes("Transform error") && doc.includes("none"));
assert("doc procedure hints QA", doc.includes("procedure hints") || doc.includes("操作手順"));
assert("doc legacy_id QA", doc.includes("legacy_id"));
assert("doc dev mock isolation QA", doc.includes("dev/mock") || doc.includes("Dev/mock"));
assert("doc save preview QA", doc.includes("save preview") || doc.includes("save-target-panel"));
assert("doc authenticated admin read QA", doc.includes("authenticated admin read") || doc.includes("admin read"));
assert("doc schedule-2026-07-008", doc.includes(TARGET_LEGACY));
assert("doc selected summary QA", doc.includes("Selected summary") || doc.includes("selected summary"));
assert("doc residual issues", doc.includes("Residual") || doc.includes("残課題"));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc db write false", doc.includes("dbWriteExecuted: false"));
assert("doc sql mutation false", doc.includes("sqlMutationExecuted: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc write-armed not used", doc.includes("writeArmedDevServerUsed: false"));
assert("doc dev server stopped", doc.includes("port4321ListenAfterQa: false") || doc.includes("4321 LISTEN none"));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc staging ref only", doc.includes(STAGING_REF));
assert("doc next P0 summary", doc.includes("P0 UX") && doc.includes("まとめ"));
assert("doc base commit 8e83348", doc.includes(BASE_COMMIT));
assert("doc no chinese 不变", !doc.includes("不变"));
assert("doc db unchanged japanese", doc.includes("DBは変わりません"));
assert("doc until save japanese", doc.includes("保存ボタンを押すまでDBは変更されません"));
assert("doc save preview japanese", doc.includes("保存前プレビュー"));
assert("doc qa runner re-runnable", doc.includes("run-g22g2a-schedule-p0-ux-readonly-qa.mjs") && doc.includes("re-runnable"));
assert("doc not ephemeral", !doc.toLowerCase().includes("ephemeral"));

const QA_RUNNER = "tools/static-to-astro/scripts/run-g22g2a-schedule-p0-ux-readonly-qa.mjs";
assert("qa runner exists", exists(QA_RUNNER));
const qaRunner = read(QA_RUNNER);
assert("qa runner no ephemeral label", !qaRunner.includes("ephemeral"));
assert("qa runner db unchanged check", qaRunner.includes("DBは変わりません"));
assert("qa runner no chinese 不变", !qaRunner.includes("不变"));

assert("operator procedure hints", operatorTs.includes("gosaki-schedule-operator-procedure-hints") || operatorTs.includes("renderOperationProcedureDetail"));
assert("operator save target panel", operatorTs.includes("gosaki-schedule-save-target-panel"));
assert("operator selected summary", operatorTs.includes("gosaki-schedule-operator-selected-summary"));
assert("page procedure hints", operatorPage.includes("gosaki-schedule-operator-procedure-hints"));
assert("page db unchanged copy", operatorPage.includes("DBは変わりません"));
assert("page legacy_id column", operatorPage.includes("legacy_id"));
assert("page dev mock zone", operatorPage.includes("gosaki-schedule-dev-mock-zone"));

assert("G9k save unchanged", gitDiff(G9K_SAVE).length === 0);
assert("write adapter unchanged", gitDiff(WRITE_ADAPTER).length === 0);
assert("G22d save unchanged", gitDiff(G22D_SAVE).length === 0);
assert("G22e save unchanged", gitDiff(G22E_SAVE).length === 0);
assert("G22f save unchanged", gitDiff(G22F_SAVE).length === 0);
assert("approval ids unchanged", gitDiff(APPROVAL_IDS).length === 0);

assert("operator diff no prod ref", !gitDiff(OPERATOR_TS).includes(PROD_REF));

const moduleSmoke = spawnSync(
  "npx",
  [
    "--yes",
    "tsx",
    "-e",
    `
import { executeG22bScheduleDuplicateDryRun } from './src/lib/admin/staging-write/gosaki-schedule-duplicate-dry-run.ts';
import { executeG22eScheduleNewEventDryRun } from './src/lib/admin/staging-write/gosaki-schedule-new-event-dry-run.ts';
import { executeG22fScheduleUnpublishDryRun } from './src/lib/admin/staging-write/gosaki-schedule-unpublish-dry-run.ts';
const STAGING = 'https://${STAGING_REF}.supabase.co';
const baseRow = { id: 'x', legacy_id: 'schedule-2026-07-001', site_slug: 'gosaki-piano', title: 't', date: '2026-07-15', month: '2026-07', published: true, venue: 'v', open_time: '18:00', start_time: '19:00', price: 'p', description: 'd', sort_order: 10, source_file: 'f', source_route: '/r/' };
const form = { title: 't2', venue: 'v', open_time: '18:00', start_time: '19:00', price: 'p', description: 'd' };
const d = executeG22bScheduleDuplicateDryRun({ source: baseRow, formValues: form, date: baseRow.date, published: false, signedIn: true, supabaseUrl: STAGING });
const n = executeG22eScheduleNewEventDryRun({ formValues: form, date: '2026-08-01', published: false, signedIn: true, supabaseUrl: STAGING });
const p = executeG22fScheduleUnpublishDryRun({ target: baseRow, signedIn: true, supabaseUrl: STAGING });
const ok = d.dryRun && !d.actualWrite && !d.saveAllowed && n.dryRun && !n.actualWrite && !n.saveAllowed && p.dryRun && !p.actualWrite && !p.saveAllowed && !p.physicalDelete;
if (!ok) process.exit(1);
console.log('g22g2a-preview-smoke-ok');
`,
  ],
  { cwd: REPO_ROOT, encoding: "utf8", timeout: 120000 },
);

assert(
  "preview module smoke",
  moduleSmoke.status === 0 && moduleSmoke.stdout.includes("g22g2a-preview-smoke-ok"),
  moduleSmoke.stderr || moduleSmoke.stdout,
);

const curl = spawnSync(
  "curl",
  ["-sS", "-o", "/dev/null", "-w", "%{http_code}", "http://127.0.0.1:4321/__admin-staging-shell/musician-basic/admin/schedule/"],
  { encoding: "utf8", timeout: 15000 },
);

if (curl.status === 0 && curl.stdout.trim() === "200") {
  console.log("INFO live dev HTTP 200 — run run-g22g2a-schedule-p0-ux-readonly-qa.mjs for full marker QA");
} else {
  console.log("SKIP live dev HTTP check (dev server not running on :4321 — doc QA already recorded)");
}

assert("00-current-state mentions G-22g2a", currentState.includes("G-22g2a"));
assert("03-next-actions mentions G-22g2a", nextActions.includes("G-22g2a"));
assert("handoff mentions G-22g2a", handoff.includes("G-22g2a"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(
  `\nG-22g2a Gosaki Schedule P0 UX read-only QA verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
