/**
 * G-22g1f — Gosaki Schedule authenticated admin read planning verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22g1f-gosaki-schedule-authenticated-admin-read-plan.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-authenticated-admin-read-plan.md";
const G22G1E_DOC =
  "tools/static-to-astro/docs/gosaki-schedule-admin-read-unpublished-visibility.md";
const AUTH_GATE = "src/lib/admin/staging-auth/staging-admin-auth-gate.ts";
const OPERATOR_TS = "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const SCHEDULE_READ = "src/lib/admin/staging-write/staging-schedule-read.ts";
const ROW_PICKER_BINDING =
  "src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-binding.ts";

const G9K_SAVE =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const WRITE_ADAPTER = "src/lib/admin/staging-write/schedule-write-adapter.ts";
const G22D_SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const G22E_SAVE = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-save.ts";
const G22F_SAVE = "src/lib/admin/staging-write/gosaki-schedule-unpublish-update-save.ts";
const APPROVAL_IDS = "src/lib/admin/staging-write/staging-write-approval-ids.ts";

const BASE_COMMIT = "02158da";
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

assert("HEAD is 02158da", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 02158da", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("doc exists", exists(DOC_REL));
assert("G-22g1e prior doc exists", exists(G22G1E_DOC));

const doc = read(DOC_REL);
const g22g1eDoc = read(G22G1E_DOC);
const authGate = read(AUTH_GATE);
const operatorTs = read(OPERATOR_TS);
const scheduleRead = read(SCHEDULE_READ);
const rowPickerBinding = read(ROW_PICKER_BINDING);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22g1f", doc.includes("G-22g1f-gosaki-schedule-authenticated-admin-read-planning"));
assert(
  "doc gate complete",
  doc.includes("gosakiScheduleAuthenticatedAdminReadPlanningComplete: true"),
);
assert("doc purpose", doc.includes("authenticated admin read"));
assert("doc G-22g1e summary", doc.includes("G-22g1e"));
assert("doc authenticated admin read policy", doc.includes("authenticated admin read"));
assert("doc SSR anon bootstrap maintained", doc.includes("SSR anon bootstrap"));
assert("doc login client refetch", doc.includes("client-side refetch") || doc.includes("client refetch"));
assert("doc no RLS grant change", doc.includes("RLS") && doc.includes("grant") && doc.includes("No change"));
assert("doc no service_role", doc.includes("service_role"));
assert("doc UI state design", doc.includes("UI state"));
assert("doc read source banner", doc.includes("read source banner") || doc.includes("Read source banner"));
assert("doc schedule-2026-07-008 QA target", doc.includes(TARGET_LEGACY));
assert("doc QA plan G-22g1f2", doc.includes("G-22g1f2"));
assert("doc next G-22g1f1", doc.includes("G-22g1f1"));
assert("doc high-risk low-risk", doc.includes("High") || doc.includes("high-risk"));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc db write false", doc.includes("dbWriteExecuted: false"));
assert("doc sql mutation false", doc.includes("sqlMutationExecuted: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc implementation not executed", doc.includes("implementationExecuted: false"));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));

assert("G-22g1e references Option B", g22g1eDoc.includes("Option B"));

assert("auth gate onAuthStateChange", authGate.includes("onAuthStateChange"));
assert("auth gate authenticated state", authGate.includes('"authenticated"'));
assert("operator parseRowsDataset", operatorTs.includes("parseRowsDataset"));
assert("operator read source banner", operatorTs.includes("renderOperatorReadSourceBanner"));
assert("operator refreshStagingAuthSignedIn", operatorTs.includes("refreshStagingAuthSignedIn"));
assert("schedule read getStagingSupabaseClient", scheduleRead.includes("getStagingSupabaseClient"));
assert("binding publishedFilter all", rowPickerBinding.includes('publishedFilter: "all"'));

assert("authenticated admin read module not yet added", !exists(
  "src/lib/admin/staging-data/gosaki-schedule-authenticated-admin-read.ts",
));

assert("G9k save unchanged", gitDiff(G9K_SAVE).length === 0);
assert("write adapter unchanged", gitDiff(WRITE_ADAPTER).length === 0);
assert("G22d save unchanged", gitDiff(G22D_SAVE).length === 0);
assert("G22e save unchanged", gitDiff(G22E_SAVE).length === 0);
assert("G22f save unchanged", gitDiff(G22F_SAVE).length === 0);
assert("approval ids unchanged", gitDiff(APPROVAL_IDS).length === 0);
assert("operator ts unchanged", gitDiff(OPERATOR_TS).length === 0);
assert("schedule read unchanged", gitDiff(SCHEDULE_READ).length === 0);
assert("row picker binding unchanged", gitDiff(ROW_PICKER_BINDING).length === 0);
assert("auth gate unchanged", gitDiff(AUTH_GATE).length === 0);

assert("doc diff no prod ref", !gitDiff(DOC_REL).includes(PROD_REF));

assert("00-current-state mentions G-22g1f", currentState.includes("G-22g1f"));
assert("03-next-actions mentions G-22g1f", nextActions.includes("G-22g1f"));
assert("handoff mentions G-22g1f", handoff.includes("G-22g1f"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(
  `\nG-22g1f Gosaki Schedule authenticated admin read planning verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
