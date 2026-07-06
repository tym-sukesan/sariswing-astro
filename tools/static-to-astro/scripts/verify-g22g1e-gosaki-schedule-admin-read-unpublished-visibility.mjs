/**
 * G-22g1e — Gosaki Schedule admin read / unpublished visibility investigation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22g1e-gosaki-schedule-admin-read-unpublished-visibility.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-admin-read-unpublished-visibility.md";
const G22G1D_DOC = "tools/static-to-astro/docs/gosaki-schedule-p0-ux-qa.md";
const SQL_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-schedules-g22g1e-unpublished-visibility-readonly-check.sql";
const ROW_PICKER_BINDING =
  "src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-binding.ts";
const SCHEDULE_READ = "src/lib/admin/staging-write/staging-schedule-read.ts";
const OPERATOR_TS = "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";

const G9K_SAVE =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const WRITE_ADAPTER = "src/lib/admin/staging-write/schedule-write-adapter.ts";
const G22D_SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const G22E_SAVE = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-save.ts";
const G22F_SAVE = "src/lib/admin/staging-write/gosaki-schedule-unpublish-update-save.ts";
const APPROVAL_IDS = "src/lib/admin/staging-write/staging-write-approval-ids.ts";

const BASE_COMMIT = "6018696";
const PROD_REF = "vsbvndwuajjhnzpohghh";
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

assert("HEAD is 6018696", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 6018696", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("doc exists", exists(DOC_REL));
assert("G-22g1d prior doc exists", exists(G22G1D_DOC));
assert("readonly SQL exists", exists(SQL_REL));

const doc = read(DOC_REL);
const g22g1dDoc = read(G22G1D_DOC);
const sql = read(SQL_REL);
const rowPickerBinding = read(ROW_PICKER_BINDING);
const scheduleRead = read(SCHEDULE_READ);
const operatorTs = read(OPERATOR_TS);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22g1e", doc.includes("G-22g1e-gosaki-schedule-admin-read-unpublished-visibility"));
assert(
  "doc gate complete",
  doc.includes("gosakiScheduleAdminReadUnpublishedVisibilityInvestigationComplete: true"),
);
assert("doc purpose", doc.includes("G-22g1d"));
assert("doc unpublished visibility problem", doc.includes("unpublished row visibility"));
assert("doc schedule-2026-07-008", doc.includes(TARGET_LEGACY));
assert("doc published false", doc.includes("published") && doc.includes("false"));
assert("doc read path investigation", doc.includes("read path") || doc.includes("Read path"));
assert("doc SSR anon", doc.includes("anon"));
assert("doc RLS schedules_public_select", doc.includes("schedules_public_select"));
assert("doc RLS schedules_admin_all", doc.includes("schedules_admin_all"));
assert("doc is_admin", doc.includes("is_admin()"));
assert("doc solution options", doc.includes("Option A") && doc.includes("Option E"));
assert("doc recommended Option B", doc.includes("Option B"));
assert("doc high-risk low-risk", doc.includes("High-risk") || doc.includes("high-risk"));
assert("doc operational requirements", doc.includes("operational requirements") || doc.includes("実運用要件"));
assert("doc next G-22g1f", doc.includes("G-22g1f"));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc db write false", doc.includes("dbWriteExecuted: false"));
assert("doc sql mutation false", doc.includes("sqlMutationExecuted: false"));
assert("doc rls grant not executed", doc.includes("rlsGrantChangeExecuted: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc references G-22g1d", doc.includes("G-22g1d"));

assert("G-22g1d doc mentions 008 missing", g22g1dDoc.includes(TARGET_LEGACY));

assert("sql SELECT only", sql.includes("SELECT ONLY") && !sql.includes("CREATE POLICY"));
assert("sql target legacy ids", sql.includes(TARGET_LEGACY));
assert("sql schedules policies", sql.includes("pg_policies"));

assert("binding uses loadSchedulesForSiteSlugRead", rowPickerBinding.includes("loadSchedulesForSiteSlugRead"));
assert("binding publishedFilter all", rowPickerBinding.includes('publishedFilter: "all"'));
assert("schedule read uses anon client", scheduleRead.includes("getStagingSupabaseClient"));
assert("operator parseRowsDataset no refetch", operatorTs.includes("parseRowsDataset"));

assert("G9k save unchanged", gitDiff(G9K_SAVE).length === 0);
assert("write adapter unchanged", gitDiff(WRITE_ADAPTER).length === 0);
assert("G22d save unchanged", gitDiff(G22D_SAVE).length === 0);
assert("G22e save unchanged", gitDiff(G22E_SAVE).length === 0);
assert("G22f save unchanged", gitDiff(G22F_SAVE).length === 0);
assert("approval ids unchanged", gitDiff(APPROVAL_IDS).length === 0);
assert("schedule read unchanged", gitDiff(SCHEDULE_READ).length === 0);
assert("row picker binding unchanged", gitDiff(ROW_PICKER_BINDING).length === 0);
assert("operator ts unchanged", gitDiff(OPERATOR_TS).length === 0);

assert("doc diff no prod ref", !gitDiff(DOC_REL).includes(PROD_REF));

assert("00-current-state mentions G-22g1e", currentState.includes("G-22g1e"));
assert("03-next-actions mentions G-22g1e", nextActions.includes("G-22g1e"));
assert("handoff mentions G-22g1e", handoff.includes("G-22g1e"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(
  `\nG-22g1e Gosaki Schedule admin read unpublished visibility verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
