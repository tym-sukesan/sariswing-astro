/**
 * G-13c2d2b — Gosaki Event B PoC cleanup Preview UI visibility fix verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13c2d2b-gosaki-schedule-event-b-poc-cleanup-preview-ui-visibility-fix.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-b-poc-cleanup-preview-ui-visibility-fix.md";
const ASTRO_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const CSS_REL = "tools/static-to-astro/templates/admin-cms/styles/admin.css";
const UI_REL = "src/lib/admin/staging-data/gosaki-schedule-event-b-poc-cleanup-ui.ts";
const EVENT_A_CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-schedule-event-a-poc-cleanup-config.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const EVENT_A_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const G13C2_PREVIEW_BTN = "gosaki-g13c2-event-b-poc-cleanup-preview-btn";
const G13C2_SAVE_BTN = "gosaki-g13c2-event-b-poc-cleanup-save-btn";
const G13C2_SECTION = "gosaki-schedule-g13c2-event-b-poc-cleanup";
const G13C1_SECTION = "gosaki-schedule-g13c1-event-a-poc-cleanup";
const PANELS_WRAPPER = "gosaki-schedule-operator-poc-cleanup-panels";
const WORKSPACE = "gosaki-schedule-admin-workspace";

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

const doc = read(DOC_REL);
const astroSrc = read(ASTRO_REL);
const cssSrc = read(CSS_REL);
const uiSrc = read(UI_REL);
const eventAConfigSrc = read(EVENT_A_CONFIG_REL);

assert("G-13c2d2b doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert(
  "doc phase G-13c2d2b",
  doc.includes("G-13c2d2b-gosaki-schedule-event-b-poc-cleanup-preview-ui-visibility-fix"),
);
assert("doc root cause sticky grid", doc.includes("sticky") || doc.includes("workspace"));
assert("doc no Preview this phase", doc.includes("cursorPreviewButtonClicked") && doc.includes("**false**"));
assert("doc no Save this phase", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));

const workspaceIdx = astroSrc.indexOf(WORKSPACE);
const panelsIdx = astroSrc.indexOf(PANELS_WRAPPER);
const g13c1Idx = astroSrc.indexOf(G13C1_SECTION);
const g13c2Idx = astroSrc.indexOf(G13C2_SECTION);
const workspaceCloseIdx = astroSrc.indexOf("</div>", astroSrc.indexOf("gosaki-schedule-operator-edit"));

assert("workspace exists", workspaceIdx >= 0);
assert("poc cleanup panels wrapper exists", panelsIdx >= 0);
assert("panels after workspace", panelsIdx > workspaceIdx);
assert("G-13c1 inside panels wrapper", g13c1Idx > panelsIdx);
assert("G-13c2 inside panels wrapper", g13c2Idx > panelsIdx);
assert("G-13c2 after workspace close", g13c2Idx > workspaceCloseIdx);

const workspaceSlice = astroSrc.slice(workspaceIdx, panelsIdx);
assert("G-13c2 not inside workspace grid", !workspaceSlice.includes(G13C2_SECTION));
assert("G-13c1 not inside workspace grid", !workspaceSlice.includes(G13C1_SECTION));

const g13c2Slice = astroSrc.slice(g13c2Idx, astroSrc.indexOf("</section>", g13c2Idx));
assert("G-13c2 section heading", g13c2Slice.includes("G-13c2 — Event B PoC 文言クリーンアップ"));
assert("G-13c2 preview button", g13c2Slice.includes(G13C2_PREVIEW_BTN));
assert("G-13c2 preview button label", g13c2Slice.includes("G-13c2 変更を確認（dry-run）"));
assert("G-13c2 save button", g13c2Slice.includes(G13C2_SAVE_BTN));
assert("G-13c2 save disabled", g13c2Slice.includes("Event B cleanup 保存（無効）"));
assert(
  "G-13c2 save has disabled attr",
  /id="gosaki-g13c2-event-b-poc-cleanup-save-btn"[\s\S]*?disabled/.test(g13c2Slice),
);
assert(
  "G-13c2 preview before save in DOM",
  g13c2Slice.indexOf(G13C2_PREVIEW_BTN) < g13c2Slice.indexOf(G13C2_SAVE_BTN),
);
assert("G-13c2 card classes", g13c2Slice.includes("admin-card") && g13c2Slice.includes("admin-gosaki-card"));

const g13c1Slice = astroSrc.slice(g13c1Idx, astroSrc.indexOf("</section>", g13c1Idx));
assert("G-13c1 separate section", g13c1Slice.includes("G-13c1 — Event A PoC 文言クリーンアップ"));
assert("G-13c1 preview button", g13c1Slice.includes("gosaki-g13c1-event-a-poc-cleanup-preview-btn"));

assert("CSS panels wrapper", cssSrc.includes(PANELS_WRAPPER));
assert("CSS g13 panels static position", cssSrc.includes(".admin-gosaki-schedule-g13c2"));
assert("CSS overflow visible", cssSrc.includes("overflow: visible"));
assert("CSS section title", cssSrc.includes(".admin-gosaki-section-title"));

assert("UI save disabled label unchanged", uiSrc.includes("Event B cleanup 保存（無効）"));
assert("UI preview btn id via config constant", uiSrc.includes("G13C2_PREVIEW_BTN_ID"));
assert("UI no Event A id", !uiSrc.includes(EVENT_A_ID));

assert("Event A config id unchanged", eventAConfigSrc.includes(EVENT_A_ID));
assert("Event A config no Event B target swap", !eventAConfigSrc.includes(`= "${EVENT_B_ID}"`));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

assert(
  "no March reupload in changed scope",
  !doc.includes("schedule/2026-03/index.html") || doc.includes("marchReuploadTriggered"),
);

console.log(`\nG-13c2d2b verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
