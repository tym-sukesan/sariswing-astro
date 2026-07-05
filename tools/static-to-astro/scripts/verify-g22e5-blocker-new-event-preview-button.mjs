/**
 * G-22e5-blocker — Gosaki Schedule new event「変更を確認」preview button verifier.
 * Confirms the button exists (SSR + template), the scroll-discoverability fix is in place,
 * and that no write/DB path was touched.
 * Run: node tools/static-to-astro/scripts/verify-g22e5-blocker-new-event-preview-button.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-new-event-insert-preview-button-blocker.md";
const SCHEDULE_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const SCHEDULE_OPERATOR_TS =
  "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";

const PROD_REF = "vsbvndwuajjhnzpohghh";
const SCHEDULE_URL =
  "http://127.0.0.1:4321/__admin-staging-shell/musician-basic/admin/schedule/";

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

assert("blocker doc exists", exists(DOC_REL));

const doc = read(DOC_REL);
const ui = read(SCHEDULE_UI);
const ts = read(SCHEDULE_OPERATOR_TS);

// Doc assertions
assert("doc phase G-22e5-blocker", doc.includes("G-22e5-blocker-new-event-preview-button-missing-investigation"));
assert("doc button not missing from DOM", doc.includes("previewButtonMissingFromDom: false"));
assert("doc blocker resolved", doc.includes("gosakiScheduleNewEventInsertPreviewButtonBlockerResolved: true"));
assert("doc fix type scroll only", doc.includes("fixType: scroll-discoverability-only"));
assert("doc save not clicked", doc.includes("Save button: **not clicked**"));
assert("doc no db write", doc.includes("DB write / INSERT / UPDATE / DELETE / UPSERT: **not executed**"));
assert("doc write-armed server stopped", doc.includes("Write-armed dev server: **stopped**"));
assert("doc ready to resume", doc.includes("readyToResumeG22e5AfterOperatorReupload: true"));
assert("doc base commit d068566", doc.includes("d068566"));

// Template: button still present, still dry-run-only, still in editor form
assert("template dry-run btn id present", ui.includes('id="gosaki-schedule-edit-dry-run-btn"'));
assert("template dry-run btn label", ui.includes("変更を確認"));
assert("template dry-run-only attr", ui.includes("data-gosaki-dry-run-only"));
assert("template edit form hidden default", /id="gosaki-schedule-edit-form"[\s\S]{0,120}\bhidden\b/.test(ui));
assert("template add btn present", ui.includes('id="gosaki-schedule-add-btn"'));

// TS: scroll fix in place, still on new-event path
assert("ts scroll helper defined", ts.includes("function scrollNewEventDraftIntoView"));
assert(
  "ts scroll helper called",
  ts.includes("  scrollNewEventDraftIntoView();") &&
    (ts.match(/scrollNewEventDraftIntoView/g) ?? []).length >= 2,
);
assert("ts scroll block start", ts.includes('block: "start"'));
assert("ts scroll centers dry-run btn", /gosaki-schedule-edit-dry-run-btn[\s\S]{0,160}block: "center"/.test(ts));
assert("ts dry-run btn wired", /getElementById\("gosaki-schedule-edit-dry-run-btn"\)[\s\S]{0,120}runEditDryRunPreview/.test(ts));
assert("ts renderEditForm reveals form", ts.includes("formEl.hidden = false"));

// Safety: fix must not introduce any write/insert call in the operator UI
assert("ts no insert call added", !ts.includes(".insert("));
assert("ts no upsert call", !ts.includes(".upsert("));
assert("ts no delete call", !ts.includes(".delete("));

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
    assert("live HTML dry-run btn present", body.includes('id="gosaki-schedule-edit-dry-run-btn"'));
    assert("live HTML 変更を確認 present", body.includes("変更を確認"));
    assert("live HTML edit form hidden default", /id="gosaki-schedule-edit-form"[^>]*\bhidden\b/.test(body));
    assert("live HTML add btn label", body.includes("新規追加案を作成"));
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
assert("00-current-state mentions G-22e5-blocker", currentState.includes("G-22e5-blocker"));
assert("03-next-actions mentions G-22e5-blocker", nextActions.includes("G-22e5-blocker"));
assert("handoff mentions G-22e5-blocker", handoff.includes("G-22e5-blocker"));

console.log(
  `\nG-22e5-blocker new event preview button verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
