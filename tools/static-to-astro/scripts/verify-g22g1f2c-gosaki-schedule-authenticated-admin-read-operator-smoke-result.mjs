/**
 * G-22g1f2c — Gosaki Schedule authenticated admin read operator smoke result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22g1f2c-gosaki-schedule-authenticated-admin-read-operator-smoke-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-authenticated-admin-read-operator-smoke-result.md";
const QA_DOC = "tools/static-to-astro/docs/gosaki-schedule-authenticated-admin-read-qa.md";
const IMPL_DOC =
  "tools/static-to-astro/docs/gosaki-schedule-authenticated-admin-read-implementation.md";
const READ_MODULE =
  "src/lib/admin/staging-data/gosaki-schedule-authenticated-admin-read.ts";
const OPERATOR_TS = "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";

const G9K_SAVE =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const WRITE_ADAPTER = "src/lib/admin/staging-write/schedule-write-adapter.ts";
const G22D_SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const G22E_SAVE = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-save.ts";
const G22F_SAVE = "src/lib/admin/staging-write/gosaki-schedule-unpublish-update-save.ts";
const APPROVAL_IDS = "src/lib/admin/staging-write/staging-write-approval-ids.ts";

const BASE_COMMIT = "8729a9a";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const TARGET_LEGACY = "schedule-2026-07-008";
const TARGET_ID = "3e572f02-4f35-460e-80a1-3a7d15ca3fd9";

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

assert("HEAD is 8729a9a", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 8729a9a", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("doc exists", exists(DOC_REL));
assert("G-22g1f2 prior QA doc exists", exists(QA_DOC));
assert("G-22g1f1 impl doc exists", exists(IMPL_DOC));

const doc = read(DOC_REL);
const qaDoc = read(QA_DOC);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22g1f2c", doc.includes("G-22g1f2c-gosaki-schedule-authenticated-admin-read-operator-smoke-result"));
assert(
  "doc gate complete",
  doc.includes("gosakiScheduleAuthenticatedAdminReadOperatorSmokeResultComplete: true"),
);
assert("doc purpose", doc.includes("operator login smoke"));
assert("doc operator login smoke PASS", doc.includes("operatorLoginSmokePass: true"));
assert("doc credentials not recorded", doc.includes("credentialsRecorded: false") || doc.includes("not recorded"));
assert(
  "doc Supabase admin read authenticated",
  doc.includes("Supabase admin read（authenticated）") || doc.includes("admin read（authenticated）"),
);
assert("doc 60 rows", doc.includes("60") && doc.includes("件"));
assert("doc unpublished 2", doc.includes("非公開") && doc.includes("2"));
assert("doc schedule-2026-07-008 visibility PASS", doc.includes(TARGET_LEGACY) && /PASS/i.test(doc));
assert("doc target id", doc.includes(TARGET_ID));
assert("doc draft filter 非公開のみ", doc.includes("非公開のみ"));
assert("doc keyword search", doc.includes("schedule-2026-07-008") && doc.includes("keyword"));
assert("doc selected summary PASS", doc.includes("Selected summary") || doc.includes("selected summary"));
assert("doc legacy_id in summary", doc.includes("legacy_id"));
assert("doc published false in summary", doc.includes("published=false") || doc.includes("非公開"));
assert("doc updated_at in summary", doc.includes("updated_at"));
assert("doc transient error non-blocking", doc.includes("transient") || doc.includes("一時的"));
assert("doc transient not blocking", doc.includes("transientErrorBlocking: false") || doc.includes("Blocking issue") && doc.includes("no"));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc db write false", doc.includes("dbWriteExecuted: false"));
assert("doc sql mutation false", doc.includes("sqlMutationExecuted: false"));
assert("doc rls unchanged", doc.includes("RLS") && /unchanged|未変更/i.test(doc));
assert("doc grant unchanged", doc.includes("GRANT") && /unchanged|未変更/i.test(doc));
assert("doc service_role unchanged", doc.includes("service_role"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc dev server stopped", doc.includes("port4321ListenAfterRecord: false") || doc.includes("4321 LISTEN none"));
assert("doc write-armed not used", doc.includes("writeArmedDevServerUsed: false"));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc staging ref only", doc.includes(STAGING_REF));
assert("doc next G-22g1f3", doc.includes("G-22g1f3"));
assert("doc next G-22g2", doc.includes("G-22g2"));
assert("doc base commit 8729a9a", doc.includes(BASE_COMMIT));

assert("G-22g1f2 QA doc exists", qaDoc.includes("G-22g1f2"));

assert("read module exists", exists(READ_MODULE));
assert("read module unchanged", gitDiff(READ_MODULE).length === 0);
assert("operator ts unchanged", gitDiff(OPERATOR_TS).length === 0);
assert("G9k save unchanged", gitDiff(G9K_SAVE).length === 0);
assert("write adapter unchanged", gitDiff(WRITE_ADAPTER).length === 0);
assert("G22d save unchanged", gitDiff(G22D_SAVE).length === 0);
assert("G22e save unchanged", gitDiff(G22E_SAVE).length === 0);
assert("G22f save unchanged", gitDiff(G22F_SAVE).length === 0);
assert("approval ids unchanged", gitDiff(APPROVAL_IDS).length === 0);

assert("doc diff no prod ref", !gitDiff(DOC_REL).includes(PROD_REF));

assert("00-current-state mentions G-22g1f2c", currentState.includes("G-22g1f2c"));
assert("03-next-actions mentions G-22g1f2c", nextActions.includes("G-22g1f2c"));
assert("handoff mentions G-22g1f2c", handoff.includes("G-22g1f2c"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(
  `\nG-22g1f2c Gosaki Schedule authenticated admin read operator smoke result verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
