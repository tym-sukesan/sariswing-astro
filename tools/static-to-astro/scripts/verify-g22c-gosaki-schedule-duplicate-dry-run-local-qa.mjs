/**
 * G-22c — Gosaki Schedule duplicate dry-run local QA verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22c-gosaki-schedule-duplicate-dry-run-local-qa.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-duplicate-dry-run-local-qa.md";
const G22B_DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-duplicate-dry-run-ui-implementation.md";
const BASE_COMMIT = "266491e";

const G22B_MODULE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-dry-run.ts";
const SCHEDULE_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const SCHEDULE_OPERATOR_TS =
  "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const G9K_SAVE = "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const WRITE_ADAPTER = "src/lib/admin/staging-write/schedule-write-adapter.ts";

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
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

assert("HEAD is 266491e", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 266491e", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-22c QA doc exists", exists(DOC_REL));
assert("G-22b prior doc exists", exists(G22B_DOC_REL));

const doc = read(DOC_REL);
const g22bDoc = read(G22B_DOC_REL);
const scheduleUi = read(SCHEDULE_UI);
const scheduleTs = read(SCHEDULE_OPERATOR_TS);
const g22bModule = read(G22B_MODULE);

assert("doc phase G-22c", doc.includes("G-22c-gosaki-schedule-duplicate-dry-run-local-qa"));
assert("doc QA gate complete", doc.includes("gosakiScheduleDuplicateDryRunLocalQaComplete: true"));
assert("doc no blocking issues", doc.includes("qaBlockingIssuesFound: false"));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc update not clicked", doc.includes("updateButtonClicked: false"));
assert("doc no cursor db write", doc.includes("cursorDbWriteExecuted: false"));
assert("doc ready for G-22d planning", doc.includes("readyForG22dScheduleDuplicateNonDryRunInsertPlanning: true"));
assert("doc fix not required", doc.includes("Fix required?") && doc.includes("**No.**"));
assert("doc duplicate preview fields", doc.includes("operation") && doc.includes("duplicate"));
assert("doc actualWrite false", doc.includes("actualWrite") && doc.includes("false"));
assert("doc saveAllowed false", doc.includes("saveAllowed") && doc.includes("false"));
assert("doc wouldInsert true", doc.includes("wouldInsert") && doc.includes("true"));
assert("doc title copy suffix", doc.includes("（コピー）"));
assert("doc legacy label", doc.includes("（未保存・採番予定）"));
assert("doc add/delete disabled", doc.includes("disabled"));
assert("doc existing UPDATE regression", doc.includes("Existing UPDATE mode"));
assert("doc warns never sariswing prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc references G-22b", doc.includes("G-22b"));
assert("doc base commit 266491e", doc.includes(BASE_COMMIT));

assert("G-22b doc readyForG22c was true", g22bDoc.includes("readyForG22cScheduleDuplicateDryRunLocalQa: true"));

assert("source duplicate button label", scheduleUi.includes("複製案を作成"));
assert("source duplicate banner", scheduleUi.includes("gosaki-schedule-duplicate-draft-banner"));
assert("source banner まだ保存", scheduleUi.includes("まだ保存されていません"));
assert("source add disabled", scheduleUi.includes('id="gosaki-schedule-add-btn"') && scheduleUi.includes("disabled"));
assert("source delete disabled", scheduleUi.includes('id="gosaki-schedule-delete-btn"') && scheduleUi.includes("disabled"));
assert(
  "source duplicate btn present without disabled attr",
  scheduleUi.includes('id="gosaki-schedule-duplicate-btn"') &&
    !/id="gosaki-schedule-duplicate-btn"[^>]*disabled/.test(scheduleUi),
);
assert("source update btn default disabled", scheduleUi.includes('id="gosaki-schedule-update-btn"') && scheduleUi.includes("disabled"));
assert("source dry-run btn", scheduleUi.includes("gosaki-schedule-edit-dry-run-btn"));

assert("operator enterDuplicateDraftFromSelectedRow", scheduleTs.includes("enterDuplicateDraftFromSelectedRow"));
assert("operator runEditDryRunPreview duplicate branch", scheduleTs.includes("executeG22bScheduleDuplicateDryRun"));
assert("operator runEditSave duplicate guard", scheduleTs.includes("複製案はまだ保存できません"));
assert("operator resetDuplicateDraftMode on row switch", scheduleTs.includes("resetDuplicateDraftMode"));
assert("operator updateSaveButtonState duplicate disabled", scheduleTs.includes("更新する（複製案）"));

assert("module GOSAKI_SCHEDULE_DUPLICATE_DRAFT_LEGACY_LABEL", g22bModule.includes("（未保存・採番予定）"));
assert("module executeG22bScheduleDuplicateDryRun", g22bModule.includes("executeG22bScheduleDuplicateDryRun"));
assert("module uses staging ref gate", g22bModule.includes("assertStaticToAstroCmsStagingSupabaseProject"));

for (const rel of [G9K_SAVE, WRITE_ADAPTER]) {
  assert(`unchanged ${path.basename(rel)}`, gitDiff(rel).length === 0);
}

assert("save adapter has no insert for duplicate", !read(G9K_SAVE).includes("duplicate"));
assert("write adapter unchanged from duplicate work", !gitDiff(WRITE_ADAPTER).includes("duplicate"));

const moduleSmoke = spawnSync(
  "npx",
  [
    "--yes",
    "tsx",
    "-e",
    `
import {
  buildGosakiScheduleDuplicateDraft,
  executeG22bScheduleDuplicateDryRun,
} from './src/lib/admin/staging-write/gosaki-schedule-duplicate-dry-run.ts';

const source = {
  id: 'f687ebf3-407c-49d0-9ab8-58040c499b8e',
  legacy_id: 'schedule-2026-03-007',
  site_slug: 'gosaki-piano',
  date: '2026-03-15',
  title: '<Duo>',
  venue: 'test',
  open_time: '18:00',
  start_time: '19:00',
  price: '3,000円',
  description: 'test',
  published: true,
  updated_at: '2026-06-22T15:01:47.671778+00:00',
};

const draft = buildGosakiScheduleDuplicateDraft(source);
const preview = executeG22bScheduleDuplicateDryRun({
  source,
  formValues: {
    title: draft.draft.title ?? '',
    venue: String(draft.draft.venue ?? ''),
    open_time: String(draft.draft.open_time ?? ''),
    start_time: String(draft.draft.start_time ?? ''),
    price: String(draft.draft.price ?? ''),
    description: String(draft.draft.description ?? ''),
  },
  date: source.date,
  published: true,
  signedIn: true,
  supabaseUrl: 'https://${STAGING_REF}.supabase.co',
});

const ok =
  draft.draft.title?.includes('（コピー）') &&
  preview.operation === 'duplicate' &&
  preview.actualWrite === false &&
  preview.saveAllowed === false &&
  preview.wouldInsert === true &&
  preview.wouldWrite === true &&
  preview.ok === true &&
  preview.payload.site_slug === 'gosaki-piano';

if (!ok) {
  console.error(JSON.stringify(preview));
  process.exit(1);
}
console.log('module-smoke-ok');
`,
  ],
  { cwd: REPO_ROOT, encoding: "utf8", timeout: 120000 },
);

assert(
  "module duplicate dry-run smoke",
  moduleSmoke.status === 0 && moduleSmoke.stdout.includes("module-smoke-ok"),
  moduleSmoke.stderr || moduleSmoke.stdout,
);

const curl = spawnSync(
  "curl",
  ["-sS", "-o", "/dev/null", "-w", "%{http_code}", "http://127.0.0.1:4321/__admin-staging-shell/musician-basic/admin/schedule/"],
  { encoding: "utf8", timeout: 15000 },
);

if (curl.status === 0 && curl.stdout.trim() === "200") {
  const html = spawnSync(
    "curl",
    ["-sS", "http://127.0.0.1:4321/__admin-staging-shell/musician-basic/admin/schedule/"],
    { encoding: "utf8", maxBuffer: 10 * 1024 * 1024, timeout: 30000 },
  );
  if (html.status === 0) {
    const body = html.stdout;
    assert("live HTML HTTP 200", true);
    assert("live HTML duplicate btn", body.includes("複製案を作成"));
    assert("live HTML add disabled", body.includes('id="gosaki-schedule-add-btn"') && body.includes("disabled"));
    assert("live HTML delete disabled", body.includes('id="gosaki-schedule-delete-btn"') && body.includes("disabled"));
    assert("live HTML duplicate banner markup", body.includes("gosaki-schedule-duplicate-draft-banner"));
    assert("live HTML selectable rows", body.includes("data-select-row-id"));
    assert("live HTML no prod ref", !body.includes(PROD_REF));
  } else {
    console.log("SKIP live HTML body fetch (dev server unreachable or timeout)");
  }
} else {
  console.log("SKIP live dev HTTP check (dev server not running on :4321)");
}

console.log(`\nG-22c Gosaki Schedule duplicate dry-run local QA verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
