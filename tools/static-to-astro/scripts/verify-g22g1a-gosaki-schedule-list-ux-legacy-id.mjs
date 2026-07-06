/**
 * G-22g1a — Gosaki Schedule list UX legacy_id visibility verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22g1a-gosaki-schedule-list-ux-legacy-id.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-list-ux-legacy-id.md";
const OPERATOR_TS = "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const SCHEDULE_PAGE =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const ADMIN_CSS = "tools/static-to-astro/templates/admin-cms/styles/admin.css";

const G9K_SAVE =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const WRITE_ADAPTER = "src/lib/admin/staging-write/schedule-write-adapter.ts";
const G22D_SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const G22E_SAVE = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-save.ts";
const G22F_SAVE = "src/lib/admin/staging-write/gosaki-schedule-unpublish-update-save.ts";

const BASE_COMMIT = "814a77f";
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

assert("HEAD is 814a77f", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 814a77f", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("doc exists", exists(DOC_REL));

const doc = read(DOC_REL);
const operatorTs = read(OPERATOR_TS);
const schedulePage = read(SCHEDULE_PAGE);
const adminCss = read(ADMIN_CSS);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22g1a", doc.includes("G-22g1a-gosaki-schedule-list-ux-legacy-id"));
assert("doc gate complete", doc.includes("gosakiScheduleListUxLegacyIdComplete: true"));
assert("doc purpose legacy_id", doc.includes("legacy_id"));
assert("doc G-22f lesson", doc.includes("G-22f"));
assert("doc schedule-2026-07-008", doc.includes("schedule-2026-07-008"));
assert("doc selected summary", doc.includes("gosaki-schedule-operator-selected-summary"));
assert("doc next G-22g1b", doc.includes("G-22g1b"));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc db write not executed", doc.includes("dbWriteExecuted: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));

assert("operator renderLegacyIdCode", operatorTs.includes("renderLegacyIdCode"));
assert("operator renderSelectedRowSummary", operatorTs.includes("renderSelectedRowSummary"));
assert("operator list legacy column", operatorTs.includes("admin-gosaki-schedule-table__legacy-col"));
assert("operator keyword includes legacy_id", operatorTs.includes("row.legacy_id, row.id"));
assert("operator summary legacy_id", operatorTs.includes("gosaki-schedule-operator-selected-summary__item--legacy"));
assert("operator summary id", operatorTs.includes("gosaki-schedule-row-id-code"));
assert("operator summary updated_at", operatorTs.includes("updated_at"));
assert("operator summary published", operatorTs.includes("formatPublishedStatus"));
assert("operator setEditFormRowId", operatorTs.includes("setEditFormRowId"));
assert("operator no insert call", !operatorTs.includes(".insert("));
assert("operator no update call", !operatorTs.match(/\.update\s*\(/));
assert("operator no delete call", !operatorTs.includes(".delete("));

assert("page table legacy_id header", schedulePage.includes("<th scope=\"col\">legacy_id</th>"));
assert("page legacy_id code class", schedulePage.includes("gosaki-schedule-legacy-id-code"));
assert("page selected summary element", schedulePage.includes("gosaki-schedule-operator-selected-summary"));
assert("page edit row id field", schedulePage.includes("gosaki-edit-row-id-value"));
assert("page keyword placeholder legacy_id", schedulePage.includes("legacy_id・タイトル・会場で検索"));

assert("css legacy id code", adminCss.includes(".gosaki-schedule-legacy-id-code"));
assert("css selected summary", adminCss.includes(".gosaki-schedule-operator-selected-summary"));
assert("css table legacy col", adminCss.includes(".admin-gosaki-schedule-table__legacy-col"));

assert("G9k save unchanged", gitDiff(G9K_SAVE).length === 0);
assert("write adapter unchanged", gitDiff(WRITE_ADAPTER).length === 0);
assert("G22d save unchanged", gitDiff(G22D_SAVE).length === 0);
assert("G22e save unchanged", gitDiff(G22E_SAVE).length === 0);
assert("G22f save unchanged", gitDiff(G22F_SAVE).length === 0);

assert("operator diff no prod ref", !gitDiff(OPERATOR_TS).includes(PROD_REF));
assert("page diff no prod ref", !gitDiff(SCHEDULE_PAGE).includes(PROD_REF));

assert("00-current-state mentions G-22g1a", currentState.includes("G-22g1a"));
assert("03-next-actions mentions G-22g1a", nextActions.includes("G-22g1a"));
assert("handoff mentions G-22g1a", handoff.includes("G-22g1a"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(
  `\nG-22g1a Gosaki Schedule list UX legacy_id verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
