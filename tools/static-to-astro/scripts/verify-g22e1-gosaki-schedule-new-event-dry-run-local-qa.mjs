/**
 * G-22e1 — Gosaki Schedule new event dry-run local QA verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22e1-gosaki-schedule-new-event-dry-run-local-qa.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-new-event-dry-run-local-qa.md";
const G22E_DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-new-event-dry-run-ui-implementation.md";
const BASE_COMMIT = "c716891";

const G22E_MODULE = "src/lib/admin/staging-write/gosaki-schedule-new-event-dry-run.ts";
const SCHEDULE_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const SCHEDULE_OPERATOR_TS =
  "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const G9K_SAVE = "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const G22D_INSERT_SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const G22D_GUARDS = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-guards.ts";

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const SCHEDULE_URL = "http://127.0.0.1:4321/__admin-staging-shell/musician-basic/admin/schedule/";

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

assert("HEAD is c716891", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is c716891", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-22e1 QA doc exists", exists(DOC_REL));
assert("G-22e prior doc exists", exists(G22E_DOC_REL));

const doc = read(DOC_REL);
const g22eDoc = read(G22E_DOC_REL);
const scheduleUi = read(SCHEDULE_UI);
const scheduleTs = read(SCHEDULE_OPERATOR_TS);
const g22eModule = read(G22E_MODULE);

assert("doc phase G-22e1", doc.includes("G-22e1-gosaki-schedule-new-event-dry-run-local-qa"));
assert("doc QA gate complete", doc.includes("gosakiScheduleNewEventDryRunLocalQaComplete: true"));
assert("doc no blocking issues", doc.includes("qaBlockingIssuesFound: false"));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc update not clicked", doc.includes("updateButtonClicked: false"));
assert("doc db write false", doc.includes("dbWriteExecuted: false"));
assert("doc no cursor db write", doc.includes("cursorDbWriteExecuted: false"));
assert("doc ready for G-22e2 planning", doc.includes("readyForG22e2ScheduleNewEventInsertPlanning: true"));
assert("doc fix not required", doc.includes("Fix required?") && doc.includes("**No.**"));
assert("doc operation new", doc.includes("operation") && doc.includes("new"));
assert("doc actualWrite false", doc.includes("actualWrite") && doc.includes("false"));
assert("doc saveAllowed false", doc.includes("saveAllowed") && doc.includes("false"));
assert("doc wouldInsert false empty", doc.includes("wouldInsert") && doc.includes("`false`"));
assert("doc wouldInsert true valid", doc.includes("`true`"));
assert("doc warnings listed", doc.includes("日付が未入力です") && doc.includes("タイトルが未入力です"));
assert("doc legacy label", doc.includes("（未保存・採番予定）"));
assert("doc add enabled", doc.includes("新規追加案を作成"));
assert("doc delete disabled maintained", doc.includes("Delete") && doc.includes("disabled"));
assert("doc existing/duplicate regression", doc.includes("Existing / duplicate mode"));
assert("doc warns never sariswing prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc references G-22e", doc.includes("G-22e"));
assert("doc base commit c716891", doc.includes(BASE_COMMIT));

assert(
  "G-22e doc readyForG22e1 was true",
  g22eDoc.includes("readyForG22e1ScheduleNewEventDryRunLocalQa: true"),
);

assert("source add button label", scheduleUi.includes("新規追加案を作成"));
assert("source new event banner", scheduleUi.includes("gosaki-schedule-new-event-draft-banner"));
assert("source banner まだ保存", scheduleUi.includes("まだ保存されていません"));
assert(
  "source add btn present without disabled attr",
  scheduleUi.includes('id="gosaki-schedule-add-btn"') &&
    !/id="gosaki-schedule-add-btn"[^>]*\bdisabled/.test(scheduleUi),
);
assert(
  "source delete disabled",
  /id="gosaki-schedule-delete-btn"[\s\S]{0,120}data-gosaki-schedule-action-disabled/.test(scheduleUi),
);
assert("source duplicate btn present", scheduleUi.includes('id="gosaki-schedule-duplicate-btn"'));

assert("operator enterNewEventDraftMode", scheduleTs.includes("enterNewEventDraftMode"));
assert("operator isNewEventDraftMode", scheduleTs.includes("isNewEventDraftMode"));
assert("operator wireAddButton", scheduleTs.includes("wireAddButton"));
assert("operator runEditDryRunPreview new branch", scheduleTs.includes("executeG22eScheduleNewEventDryRun"));
assert("operator renderNewEventDryRunResult", scheduleTs.includes("renderNewEventDryRunResult"));
assert("operator new mode save disabled label", scheduleTs.includes("保存（現在は無効）"));
assert("operator new mode save alert", scheduleTs.includes("新規追加の保存はまだ無効です"));
assert("operator duplicate path preserved", scheduleTs.includes("executeG22bScheduleDuplicateDryRun"));
assert("operator existing save path preserved", scheduleTs.includes("executeG9kExistingEventSaveButtonSave"));

assert("module operation new", g22eModule.includes('operation: "new"'));
assert("module saveAllowed false", g22eModule.includes("saveAllowed: false"));
assert("module actualWrite false", g22eModule.includes("actualWrite: false"));
assert("module validate warnings", g22eModule.includes("validateG22eNewEventDryRunForm"));
assert("module no insert call", !g22eModule.includes(".insert("));
assert("module uses staging ref gate", g22eModule.includes("assertStaticToAstroCmsStagingSupabaseProject"));
assert("module no duplicate guard", !g22eModule.includes("assertG22dDuplicateInsertPayloadOnly"));

for (const rel of [G9K_SAVE, G22D_INSERT_SAVE, G22D_GUARDS]) {
  assert(`unchanged ${path.basename(rel)}`, gitDiff(rel).length === 0);
}

// Module smoke: empty form (warnings) + valid form (wouldInsert)
const moduleSmoke = spawnSync(
  "npx",
  [
    "--yes",
    "tsx",
    "-e",
    `
import {
  buildGosakiScheduleNewEventDraft,
  executeG22eScheduleNewEventDryRun,
} from './src/lib/admin/staging-write/gosaki-schedule-new-event-dry-run.ts';

const empty = { title: "", venue: "", open_time: "", start_time: "", price: "", description: "" };
const draft = buildGosakiScheduleNewEventDraft();
const a = executeG22eScheduleNewEventDryRun({ formValues: empty, date: "", published: false, signedIn: true, supabaseUrl: 'https://${STAGING_REF}.supabase.co' });
const b = executeG22eScheduleNewEventDryRun({
  formValues: { title: "テスト公演", venue: "テスト会場", open_time: "18:00", start_time: "19:00", price: "3,000円", description: "備考" },
  date: "2026-09-12", published: false, signedIn: true, supabaseUrl: 'https://${STAGING_REF}.supabase.co',
});
const ok =
  draft.draft.id === '__gosaki-new-event-draft-unsaved__' &&
  draft.draft.legacy_id === null &&
  draft.draft.published === false &&
  draft.draft.site_slug === 'gosaki-piano' &&
  a.operation === 'new' && a.actualWrite === false && a.saveAllowed === false &&
  a.wouldInsert === false && a.validation.warnings.length >= 2 && a.ok === true &&
  b.operation === 'new' && b.wouldInsert === true && b.actualWrite === false &&
  b.saveAllowed === false && b.payload.published === false &&
  b.payload.site_slug === 'gosaki-piano' && b.payload.legacy_id === null &&
  b.payload.sort_order === null && b.derivedPreview?.recalculatedMonth === '2026-09' &&
  b.safety.supabaseWriteCalled === false;
if (!ok) { console.error('A', JSON.stringify(a), 'B', JSON.stringify(b)); process.exit(1); }
console.log('new-event-module-smoke-ok');
`,
  ],
  { cwd: REPO_ROOT, encoding: "utf8", timeout: 120000 },
);

assert(
  "module new event dry-run smoke",
  moduleSmoke.status === 0 && moduleSmoke.stdout.includes("new-event-module-smoke-ok"),
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
    assert("live HTML add btn label", body.includes("新規追加案を作成"));
    assert(
      "live HTML add btn not disabled",
      /id="gosaki-schedule-add-btn"[^>]*/.test(body) &&
        !/id="gosaki-schedule-add-btn"[^>]*\bdisabled/.test(body),
    );
    assert("live HTML new event banner", body.includes("gosaki-schedule-new-event-draft-banner"));
    assert(
      "live HTML delete disabled",
      /id="gosaki-schedule-delete-btn"[^>]*disabled/.test(body),
    );
    assert("live HTML duplicate banner intact", body.includes("gosaki-schedule-duplicate-draft-banner"));
    assert("live HTML selectable rows", body.includes("data-select-row-id"));
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
assert("00-current-state mentions G-22e1", currentState.includes("G-22e1"));
assert("03-next-actions mentions G-22e1", nextActions.includes("G-22e1"));
assert("handoff mentions G-22e1", handoff.includes("G-22e1"));
assert("03-next-actions G-22e2 next", nextActions.includes("G-22e2"));
assert("handoff G-22e2 next", handoff.includes("G-22e2"));

console.log(
  `\nG-22e1 Gosaki Schedule new event dry-run local QA verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
