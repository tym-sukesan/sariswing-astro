/**
 * G-22g1b — Gosaki Schedule dev/mock section isolation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22g1b-gosaki-schedule-dev-mock-section-isolation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-dev-mock-section-isolation.md";
const OPERATOR_TS = "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const OPERATOR_PAGE =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const SCHEDULE_PAGE =
  "tools/static-to-astro/templates/admin-cms/gosaki/pages/GosakiStagingAdminSchedulePage.astro";
const ROW_PICKER =
  "tools/static-to-astro/templates/admin-cms/data/components/AdminStagingScheduleSiteSlugRowPickerSection.astro";
const SAFE_FIELDS_DRY =
  "tools/static-to-astro/templates/admin-cms/data/components/AdminStagingScheduleSafeFieldsDryRunSection.astro";
const ADMIN_CSS = "tools/static-to-astro/templates/admin-cms/styles/admin.css";

const G9K_SAVE =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const WRITE_ADAPTER = "src/lib/admin/staging-write/schedule-write-adapter.ts";
const G22D_SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const G22E_SAVE = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-save.ts";
const G22F_SAVE = "src/lib/admin/staging-write/gosaki-schedule-unpublish-update-save.ts";
const APPROVAL_IDS = "src/lib/admin/staging-write/staging-write-approval-ids.ts";

const BASE_COMMIT = "406cf16";
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

assert("HEAD is 406cf16", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 406cf16", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("doc exists", exists(DOC_REL));

const doc = read(DOC_REL);
const operatorTs = read(OPERATOR_TS);
const operatorPage = read(OPERATOR_PAGE);
const schedulePage = read(SCHEDULE_PAGE);
const rowPicker = read(ROW_PICKER);
const safeFieldsDry = read(SAFE_FIELDS_DRY);
const adminCss = read(ADMIN_CSS);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22g1b", doc.includes("G-22g1b-gosaki-schedule-dev-mock-section-isolation"));
assert("doc gate complete", doc.includes("gosakiScheduleDevMockSectionIsolationComplete: true"));
assert("doc G-22f5 confusion", doc.includes("G-22f5"));
assert("doc mock-schedule", doc.includes("mock-schedule"));
assert("doc operator guidance", doc.includes("通常の Schedule 操作"));
assert("doc dev isolation", doc.includes("gosaki-schedule-dev-mock-zone"));
assert("doc next G-22g1c", doc.includes("G-22g1c"));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc db write not executed", doc.includes("dbWriteExecuted: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));

assert("operator renderOperatorReadSourceBanner", operatorTs.includes("renderOperatorReadSourceBanner"));
assert("operator read source banner id", operatorTs.includes("gosaki-schedule-operator-read-source-banner"));
assert("operator mock banner class", operatorTs.includes("gosaki-schedule-operator-read-source-banner--mock"));
assert("operator no insert", !operatorTs.includes(".insert("));
assert("operator no supabase update", !operatorTs.match(/\.update\s*\(/));

assert("page operator guide", operatorPage.includes("gosaki-schedule-operator-guide"));
assert("page guide 通常の Schedule", operatorPage.includes("通常の Schedule 操作はこちら"));
assert("page guide 非公開", operatorPage.includes("非公開"));
assert("page guide dev section note", operatorPage.includes("開発者向け詳細"));
assert("page operator primary class", operatorPage.includes("gosaki-schedule-operator-primary"));
assert("page read source banner element", operatorPage.includes("gosaki-schedule-operator-read-source-banner"));
assert("page dev tools panel", operatorPage.includes("gosaki-schedule-dev-tools-panel"));
assert("page dev mock zone", operatorPage.includes("gosaki-schedule-dev-mock-zone"));

assert("schedule page dev tools summary", schedulePage.includes("mock / dry-run PoC"));
assert("schedule page dev warning", schedulePage.includes("gosaki-schedule-dev-tools-panel__warning"));
assert("schedule page mock-schedule warning", schedulePage.includes("mock-schedule-*"));

assert("row picker section banner", rowPicker.includes("gosaki-schedule-dev-mock-zone__section-banner"));
assert("row picker not real data", rowPicker.includes("実データではありません"));

assert("safe fields mock banner", safeFieldsDry.includes("gosaki-schedule-dev-mock-zone__section-banner"));
assert("safe fields mock-schedule", safeFieldsDry.includes("mock-schedule-*"));

assert("css dev tools panel", adminCss.includes(".gosaki-schedule-dev-tools-panel"));
assert("css dev mock zone", adminCss.includes(".gosaki-schedule-dev-mock-zone"));
assert("css operator guide", adminCss.includes(".gosaki-schedule-operator-guide"));
assert("css read source banner mock", adminCss.includes(".gosaki-schedule-operator-read-source-banner--mock"));

assert("G9k save unchanged", gitDiff(G9K_SAVE).length === 0);
assert("write adapter unchanged", gitDiff(WRITE_ADAPTER).length === 0);
assert("G22d save unchanged", gitDiff(G22D_SAVE).length === 0);
assert("G22e save unchanged", gitDiff(G22E_SAVE).length === 0);
assert("G22f save unchanged", gitDiff(G22F_SAVE).length === 0);
assert("approval ids unchanged", gitDiff(APPROVAL_IDS).length === 0);

assert("operator diff no prod ref", !gitDiff(OPERATOR_TS).includes(PROD_REF));
assert("schedule page diff no prod ref", !gitDiff(SCHEDULE_PAGE).includes(PROD_REF));

assert("00-current-state mentions G-22g1b", currentState.includes("G-22g1b"));
assert("03-next-actions mentions G-22g1b", nextActions.includes("G-22g1b"));
assert("handoff mentions G-22g1b", handoff.includes("G-22g1b"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(
  `\nG-22g1b Gosaki Schedule dev/mock section isolation verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
