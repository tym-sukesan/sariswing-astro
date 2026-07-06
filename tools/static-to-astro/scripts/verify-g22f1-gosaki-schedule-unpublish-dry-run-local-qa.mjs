/**
 * G-22f1 — Gosaki Schedule unpublish dry-run local QA verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22f1-gosaki-schedule-unpublish-dry-run-local-qa.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-unpublish-dry-run-local-qa.md";
const G22F_DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-unpublish-dry-run-ui-implementation.md";
const BASE_COMMIT = "9f495b4";

const G22F_MODULE = "src/lib/admin/staging-write/gosaki-schedule-unpublish-dry-run.ts";
const SCHEDULE_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const SCHEDULE_OPERATOR_TS =
  "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const G9K_SAVE = "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const G22D_INSERT_SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const G22E_INSERT_SAVE = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-save.ts";
const G22D_GUARDS = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-guards.ts";
const G22E_GUARDS = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-guards.ts";

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const SCHEDULE_URL = "http://127.0.0.1:4321/__admin-staging-shell/musician-basic/admin/schedule/";
const PROTECTED_LEGACY_014 = "schedule-2026-03-014";
const PROTECTED_LEGACY_001 = "schedule-2026-09-001";
const G22F_APPROVAL = "G-22f-gosaki-schedule-unpublish-dry-run";

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

assert("HEAD is 9f495b4", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 9f495b4", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-22f1 QA doc exists", exists(DOC_REL));
assert("G-22f prior doc exists", exists(G22F_DOC_REL));

const doc = read(DOC_REL);
const g22fDoc = read(G22F_DOC_REL);
const scheduleUi = read(SCHEDULE_UI);
const scheduleTs = read(SCHEDULE_OPERATOR_TS);
const g22fModule = read(G22F_MODULE);

assert("doc phase G-22f1", doc.includes("G-22f1-gosaki-schedule-unpublish-dry-run-local-qa"));
assert("doc QA gate complete", doc.includes("gosakiScheduleUnpublishDryRunLocalQaComplete: true"));
assert("doc no blocking issues", doc.includes("qaBlockingIssuesFound: false"));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc update not clicked", doc.includes("updateButtonClicked: false"));
assert("doc db write false", doc.includes("dbWriteExecuted: false"));
assert("doc no cursor db write", doc.includes("cursorDbWriteExecuted: false"));
assert("doc physical delete not executed", doc.includes("physicalDeleteExecuted: false"));
assert(
  "doc ready for G-22f2 planning",
  doc.includes("readyForG22f2ScheduleUnpublishUpdatePlanning: true"),
);
assert("doc fix not required", doc.includes("Fix required?") && doc.includes("**No.**"));
assert("doc operation unpublish", doc.includes("operation") && doc.includes("unpublish"));
assert("doc dryRun true", doc.includes("dryRun") && doc.includes("true"));
assert("doc actualWrite false", doc.includes("actualWrite") && doc.includes("false"));
assert("doc saveAllowed false", doc.includes("saveAllowed") && doc.includes("false"));
assert("doc wouldUpdate true", doc.includes("wouldUpdate") && doc.includes("true"));
assert("doc wouldDelete false", doc.includes("wouldDelete") && doc.includes("false"));
assert("doc physicalDelete false", doc.includes("physicalDelete") && doc.includes("false"));
assert("doc before published true", doc.includes("before.published") && doc.includes("true"));
assert("doc after published false", doc.includes("after.published") && doc.includes("false"));
assert("doc unpublish btn label", doc.includes("非公開化案を作成"));
assert("doc データベースからは削除しません", doc.includes("データベースからは削除しません"));
assert("doc すでに非公開", doc.includes("すでに非公開"));
assert("doc delete disabled maintained", doc.includes("削除（準備中）"));
assert("doc existing/duplicate/new regression", doc.includes("Existing / duplicate / new mode"));
assert("doc protected 014", doc.includes(PROTECTED_LEGACY_014));
assert("doc protected 001", doc.includes(PROTECTED_LEGACY_001));
assert("doc warns never sariswing prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc references G-22f", doc.includes("G-22f"));
assert("doc base commit 9f495b4", doc.includes(BASE_COMMIT));

assert(
  "G-22f doc readyForG22f1 was true",
  g22fDoc.includes("readyForG22f1ScheduleUnpublishDryRunLocalQa: true"),
);

assert("source unpublish btn label", scheduleUi.includes("非公開化案を作成"));
assert("source unpublish banner", scheduleUi.includes("gosaki-schedule-unpublish-draft-banner"));
assert("source banner まだ保存", scheduleUi.includes("まだ保存されていません"));
assert("source banner データベースからは削除しません", scheduleUi.includes("データベースからは削除しません"));
assert("source unpublish btn present", scheduleUi.includes('id="gosaki-schedule-unpublish-btn"'));
assert(
  "source delete disabled",
  /id="gosaki-schedule-delete-btn"[\s\S]{0,120}data-gosaki-schedule-action-disabled/.test(scheduleUi),
);
assert("source delete 準備中", scheduleUi.includes("削除（準備中）"));
assert("source add btn present", scheduleUi.includes('id="gosaki-schedule-add-btn"'));
assert("source duplicate btn present", scheduleUi.includes('id="gosaki-schedule-duplicate-btn"'));

assert("operator enterUnpublishDraftFromSelectedRow", scheduleTs.includes("enterUnpublishDraftFromSelectedRow"));
assert("operator isUnpublishDraftMode", scheduleTs.includes("isUnpublishDraftMode"));
assert("operator updateUnpublishButtonState", scheduleTs.includes("updateUnpublishButtonState"));
assert("operator runEditDryRunPreview unpublish branch", scheduleTs.includes("executeG22fScheduleUnpublishDryRun"));
assert("operator renderUnpublishDryRunResult", scheduleTs.includes("renderUnpublishDryRunResult"));
assert("operator unpublish mode save disabled label", scheduleTs.includes("非公開化を保存（現在は無効）"));
assert("operator unpublish mode save alert", scheduleTs.includes("非公開化の保存はまだ無効です"));
assert("operator すでに非公開", scheduleTs.includes("すでに非公開"));
assert("operator duplicate path preserved", scheduleTs.includes("executeG22bScheduleDuplicateDryRun"));
assert("operator new event path preserved", scheduleTs.includes("executeG22eScheduleNewEventDryRun"));
assert("operator existing save path preserved", scheduleTs.includes("executeG9kExistingEventSaveButtonSave"));

assert("module operation unpublish", g22fModule.includes('operation: "unpublish"'));
assert("module saveAllowed false", g22fModule.includes("saveAllowed: false"));
assert("module actualWrite false", g22fModule.includes("actualWrite: false"));
assert("module physicalDelete false", g22fModule.includes("physicalDelete: false"));
assert("module validate unpublished blocked", g22fModule.includes("すでに非公開"));
assert("module no update call", !g22fModule.includes(".update("));
assert("module no delete call", !g22fModule.includes(".delete("));
assert("module uses staging ref gate", g22fModule.includes("assertStaticToAstroCmsStagingSupabaseProject"));
assert("module approval id", g22fModule.includes(G22F_APPROVAL));

for (const rel of [G9K_SAVE, G22D_INSERT_SAVE, G22E_INSERT_SAVE, G22D_GUARDS, G22E_GUARDS, G22F_MODULE]) {
  assert(`unchanged ${path.basename(rel)}`, gitDiff(rel).length === 0);
}

// Module smoke: published=true preview + published=false blocked
const moduleSmoke = spawnSync(
  "npx",
  [
    "--yes",
    "tsx",
    "-e",
    `
import {
  buildGosakiScheduleUnpublishDraft,
  executeG22fScheduleUnpublishDryRun,
  validateG22fUnpublishDryRunTarget,
} from './src/lib/admin/staging-write/gosaki-schedule-unpublish-dry-run.ts';

const STAGING = 'https://${STAGING_REF}.supabase.co';
const publishedRow = {
  id: 'sample-published-id',
  legacy_id: 'schedule-2026-07-001',
  site_slug: 'gosaki-piano',
  title: 'テスト公演',
  date: '2026-07-15',
  month: '2026-07',
  published: true,
  venue: 'テスト会場',
  open_time: '18:00',
  start_time: '19:00',
  price: '3,000円',
  description: '',
  sort_order: 10,
  source_file: 'schedule-2026-07.html',
  source_route: '/2026-07/',
};

const test014 = {
  id: '434e4051-86c3-473e-9ad0-39d2e5042fb8',
  legacy_id: '${PROTECTED_LEGACY_014}',
  site_slug: 'gosaki-piano',
  title: 'G-22d duplicate test',
  date: '2026-03-14',
  month: '2026-03',
  published: false,
  venue: 'test',
  open_time: '', start_time: '', price: '', description: '',
  sort_order: 70,
  source_file: 'schedule-2026-03.html',
  source_route: '/2026-03/',
};

const test001 = {
  id: '18b48259-9a9a-4b00-b136-6c0c4ff3b2f3',
  legacy_id: '${PROTECTED_LEGACY_001}',
  site_slug: 'gosaki-piano',
  title: 'G-22e new event test',
  date: '2026-09-12',
  month: '2026-09',
  published: false,
  venue: 'test',
  open_time: '', start_time: '', price: '', description: '',
  sort_order: 10,
  source_file: 'schedule-2026-09.html',
  source_route: '/2026-09/',
};

const draft = buildGosakiScheduleUnpublishDraft(publishedRow);
const preview = executeG22fScheduleUnpublishDryRun({ target: publishedRow, signedIn: true, supabaseUrl: STAGING });
const blocked014 = validateG22fUnpublishDryRunTarget(test014);
const blocked001 = validateG22fUnpublishDryRunTarget(test001);
const previewBlocked = executeG22fScheduleUnpublishDryRun({ target: test014, signedIn: true, supabaseUrl: STAGING });

const ok =
  draft.mode === 'unpublish' &&
  preview.operation === 'unpublish' &&
  preview.dryRun === true &&
  preview.actualWrite === false &&
  preview.wouldUpdate === true &&
  preview.wouldDelete === false &&
  preview.saveAllowed === false &&
  preview.physicalDelete === false &&
  preview.before.published === true &&
  preview.after.published === false &&
  preview.approvalId === '${G22F_APPROVAL}' &&
  preview.safety.supabaseWriteCalled === false &&
  blocked014.ok === false &&
  blocked001.ok === false &&
  previewBlocked.wouldUpdate === false;

if (!ok) { console.error('smoke fail', { draft, preview, blocked014, blocked001, previewBlocked }); process.exit(1); }
console.log('unpublish-module-smoke-ok');
`,
  ],
  { cwd: REPO_ROOT, encoding: "utf8", timeout: 120000 },
);

assert(
  "module unpublish dry-run smoke",
  moduleSmoke.status === 0 && moduleSmoke.stdout.includes("unpublish-module-smoke-ok"),
  moduleSmoke.stderr || moduleSmoke.stdout,
);

// Live HTTP check (optional — skips if dev server not running)
const curl = spawnSync(
  "curl",
  ["-sS", "-o", "/dev/null", "-w", "%{http_code}", SCHEDULE_URL],
  { encoding: "utf8", timeout: 15000 },
);

if (curl.status === 0 && curl.stdout.trim() === "200") {
  const html = spawnSync("curl", ["-sS", SCHEDULE_URL], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    timeout: 30000,
  });
  if (html.status === 0) {
    const body = html.stdout;
    assert("live HTML HTTP 200", true);
    assert("live HTML unpublish btn label", body.includes("非公開化案を作成"));
    assert("live HTML unpublish banner", body.includes("gosaki-schedule-unpublish-draft-banner"));
    assert("live HTML データベースからは削除しません", body.includes("データベースからは削除しません"));
    assert(
      "live HTML delete disabled",
      /id="gosaki-schedule-delete-btn"[^>]*disabled/.test(body),
    );
    assert("live HTML delete 準備中", body.includes("削除（準備中）"));
    assert("live HTML duplicate banner intact", body.includes("gosaki-schedule-duplicate-draft-banner"));
    assert("live HTML new event banner intact", body.includes("gosaki-schedule-new-event-draft-banner"));
    assert("live HTML read source supabase", body.includes('data-read-source="supabase"'));
    assert("live HTML no prod ref", !body.includes(PROD_REF));
  } else {
    console.log("SKIP live HTML body fetch (dev server unreachable or timeout)");
  }
} else {
  console.log("SKIP live dev HTTP check (dev server not running on :4321)");
}

// AI context
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
assert("00-current-state mentions G-22f1", currentState.includes("G-22f1"));
assert("03-next-actions mentions G-22f1", nextActions.includes("G-22f1"));
assert("handoff mentions G-22f1", handoff.includes("G-22f1"));
assert("03-next-actions G-22f2 next", nextActions.includes("G-22f2"));
assert("handoff G-22f2 next", handoff.includes("G-22f2"));

console.log(
  `\nG-22f1 Gosaki Schedule unpublish dry-run local QA verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
