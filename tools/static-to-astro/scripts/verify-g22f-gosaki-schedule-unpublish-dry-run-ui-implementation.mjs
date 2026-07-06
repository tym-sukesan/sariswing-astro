/**
 * G-22f — Gosaki Schedule unpublish dry-run UI implementation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22f-gosaki-schedule-unpublish-dry-run-ui-implementation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-unpublish-dry-run-ui-implementation.md";
const BASE_COMMIT = "215f638";

const G22F_MODULE = "src/lib/admin/staging-write/gosaki-schedule-unpublish-dry-run.ts";
const SCHEDULE_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const SCHEDULE_OPERATOR_TS =
  "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const DRY_RUN_ADAPTER = "src/lib/admin/staging-write/schedule-dry-run-adapter.ts";
const DRY_RUN_TYPES = "src/lib/admin/staging-write/schedule-dry-run-types.ts";
const G9K_SAVE = "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const G22D_INSERT_SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const G22E_INSERT_SAVE = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-save.ts";
const ADMIN_CSS = "tools/static-to-astro/templates/admin-cms/styles/admin.css";

const PROD_REF = "vsbvndwuajjhnzpohghh";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const G22F_APPROVAL = "G-22f-gosaki-schedule-unpublish-dry-run";
const PROTECTED_LEGACY_014 = "schedule-2026-03-014";
const PROTECTED_LEGACY_001 = "schedule-2026-09-001";

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

assert("HEAD is 215f638", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 215f638", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-22f doc exists", exists(DOC_REL));
assert("G-22f module exists", exists(G22F_MODULE));

const doc = read(DOC_REL);
const g22fModule = read(G22F_MODULE);
const scheduleUi = read(SCHEDULE_UI);
const scheduleTs = read(SCHEDULE_OPERATOR_TS);
const adapter = read(DRY_RUN_ADAPTER);
const types = read(DRY_RUN_TYPES);
const g9kSave = read(G9K_SAVE);
const g22dInsertSave = read(G22D_INSERT_SAVE);
const g22eInsertSave = read(G22E_INSERT_SAVE);
const adminCss = read(ADMIN_CSS);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22f", doc.includes("G-22f-gosaki-schedule-unpublish-dry-run-ui-implementation"));
assert("doc implementation gate complete", doc.includes("gosakiScheduleUnpublishDryRunUiImplementationComplete: true"));
assert("doc ready for G-22f1", doc.includes("readyForG22f1ScheduleUnpublishDryRunLocalQa: true"));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc db write false", doc.includes("dbWriteExecuted: false"));
assert("doc physical delete not implemented", doc.includes("physicalDeleteImplemented: false"));
assert("doc why unpublish before delete", doc.includes("Why unpublish before physical DELETE"));
assert("doc no delete from database", doc.includes("データベースからは削除しません"));
assert("doc next G-22f1", doc.includes("G-22f1"));

assert("module operation unpublish", g22fModule.includes('operation: "unpublish"'));
assert("module wouldUpdate", g22fModule.includes("wouldUpdate"));
assert("module wouldDelete false", g22fModule.includes("wouldDelete: false"));
assert("module saveAllowed false", g22fModule.includes("saveAllowed: false"));
assert("module physicalDelete false", g22fModule.includes("physicalDelete: false"));
assert("module actualWrite false", g22fModule.includes("actualWrite: false"));
assert("module before published", g22fModule.includes("before:") && g22fModule.includes("published"));
assert("module after published false", g22fModule.includes("after:") && g22fModule.includes("published: false"));
assert("module already unpublished error", g22fModule.includes("すでに非公開"));
assert("module no update call", !g22fModule.includes(".update("));
assert("module no delete call", !g22fModule.includes(".delete("));
assert("module staging gate", g22fModule.includes("assertStaticToAstroCmsStagingSupabaseProject"));
assert("module approval id", g22fModule.includes(G22F_APPROVAL));

assert("types operation unpublish", types.includes('"unpublish"'));
assert("types draft mode unpublish", types.includes('"unpublish"'));
assert("adapter buildScheduleUnpublishDryRunResult", adapter.includes("buildScheduleUnpublishDryRunResult"));
assert("adapter operation unpublish", /operation: "unpublish"/.test(adapter));

assert("ui unpublish banner", scheduleUi.includes("gosaki-schedule-unpublish-draft-banner"));
assert("ui 非公開化案 title", scheduleUi.includes("非公開化案"));
assert("ui データベースからは削除しません", scheduleUi.includes("データベースからは削除しません"));
assert("ui unpublish btn", scheduleUi.includes('id="gosaki-schedule-unpublish-btn"'));
assert("ui 非公開化案を作成", scheduleUi.includes("非公開化案を作成"));
assert("ui delete disabled", /id="gosaki-schedule-delete-btn"[^>]*disabled/.test(scheduleUi));
assert("ui delete 準備中", scheduleUi.includes("削除（準備中）"));

assert("operator isUnpublishDraftMode", scheduleTs.includes("isUnpublishDraftMode"));
assert("operator enterUnpublishDraftFromSelectedRow", scheduleTs.includes("enterUnpublishDraftFromSelectedRow"));
assert("operator executeG22fScheduleUnpublishDryRun", scheduleTs.includes("executeG22fScheduleUnpublishDryRun"));
assert("operator renderUnpublishDryRunResult", scheduleTs.includes("renderUnpublishDryRunResult"));
assert("operator wireUnpublishButton", scheduleTs.includes("wireUnpublishButton"));
assert("operator updateUnpublishButtonState", scheduleTs.includes("updateUnpublishButtonState"));
assert("operator setEditFormFieldsReadOnly", scheduleTs.includes("setEditFormFieldsReadOnly"));
assert("operator unpublish save disabled", scheduleTs.includes("非公開化を保存（現在は無効）"));
assert("operator unpublish save alert", scheduleTs.includes("非公開化の保存はまだ無効です"));
assert("operator runEditDryRunPreview unpublish branch", /isUnpublishDraftMode\(\)[\s\S]{0,400}executeG22fScheduleUnpublishDryRun/.test(scheduleTs));
assert("operator existing path preserved", scheduleTs.includes("executeG9kExistingEventSaveButtonDryRun"));
assert("operator duplicate path preserved", scheduleTs.includes("executeG22bScheduleDuplicateDryRun"));
assert("operator new event path preserved", scheduleTs.includes("executeG22eScheduleNewEventDryRun"));

assert("css unpublish banner", adminCss.includes("gosaki-schedule-unpublish-draft-banner"));
assert("css unpublish dry-run", adminCss.includes("gosaki-schedule-edit-dry-run--unpublish"));

assert("g9k save unchanged", gitDiff(G9K_SAVE).length === 0);
assert("g22d insert save unchanged", gitDiff(G22D_INSERT_SAVE).length === 0);
assert("g22e insert save unchanged", gitDiff(G22E_INSERT_SAVE).length === 0);

assert("doc no prod ref usage in module", !g22fModule.includes(PROD_REF));
assert("schedule ts no prod ref", !scheduleTs.includes(PROD_REF));

// Module smoke: published true → wouldUpdate; published false → error
const moduleSmoke = spawnSync(
  "npx",
  [
    "--yes",
    "tsx",
    "-e",
    `
import { executeG22fScheduleUnpublishDryRun } from './src/lib/admin/staging-write/gosaki-schedule-unpublish-dry-run.ts';

const publishedRow = {
  id: 'test-published-id',
  legacy_id: 'schedule-2026-10-001',
  site_slug: 'gosaki-piano',
  date: '2026-10-01',
  title: '公開テスト',
  published: true,
};
const unpublishedRow = {
  ...publishedRow,
  id: 'test-unpublished-id',
  legacy_id: '${PROTECTED_LEGACY_001}',
  published: false,
};

const ok = executeG22fScheduleUnpublishDryRun({
  target: publishedRow,
  signedIn: true,
  supabaseUrl: 'https://${STAGING_REF}.supabase.co',
});
const blocked = executeG22fScheduleUnpublishDryRun({
  target: unpublishedRow,
  signedIn: true,
  supabaseUrl: 'https://${STAGING_REF}.supabase.co',
});

const pass =
  ok.operation === 'unpublish' &&
  ok.dryRun === true &&
  ok.actualWrite === false &&
  ok.wouldUpdate === true &&
  ok.wouldDelete === false &&
  ok.saveAllowed === false &&
  ok.physicalDelete === false &&
  ok.before.published === true &&
  ok.after.published === false &&
  ok.target.site_slug === 'gosaki-piano' &&
  blocked.wouldUpdate === false &&
  blocked.guardErrors.some((e) => e.includes('すでに非公開'));

if (!pass) {
  console.error('ok', JSON.stringify(ok), 'blocked', JSON.stringify(blocked));
  process.exit(1);
}
console.log('g22f-unpublish-module-smoke-ok');
`,
  ],
  { cwd: REPO_ROOT, encoding: "utf8", timeout: 120000 },
);

assert(
  "module unpublish dry-run smoke",
  moduleSmoke.status === 0 && moduleSmoke.stdout.includes("g22f-unpublish-module-smoke-ok"),
  moduleSmoke.stderr || moduleSmoke.stdout,
);

assert("00-current-state mentions G-22f", currentState.includes("G-22f"));
assert("03-next-actions mentions G-22f", nextActions.includes("G-22f"));
assert("handoff mentions G-22f", handoff.includes("G-22f"));
assert("03-next-actions G-22f1 next", nextActions.includes("G-22f1"));

console.log(
  `\nG-22f Gosaki Schedule unpublish dry-run UI implementation verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
