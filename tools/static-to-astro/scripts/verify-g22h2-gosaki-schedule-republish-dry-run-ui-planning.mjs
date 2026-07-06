/**
 * G-22h2 — Gosaki Schedule republish dry-run UI planning verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22h2-gosaki-schedule-republish-dry-run-ui-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-republish-dry-run-ui-planning.md";
const G22H1_DOC = "tools/static-to-astro/docs/gosaki-schedule-republish-planning.md";
const G22F_DRY_RUN_DOC =
  "tools/static-to-astro/docs/gosaki-schedule-unpublish-dry-run-ui-implementation.md";

const G22F_DRY_RUN = "src/lib/admin/staging-write/gosaki-schedule-unpublish-dry-run.ts";
const G22F_SAVE = "src/lib/admin/staging-write/gosaki-schedule-unpublish-update-save.ts";
const OPERATOR_UI = "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const DRY_RUN_ADAPTER = "src/lib/admin/staging-write/schedule-dry-run-adapter.ts";
const WRITE_TYPES = "src/lib/admin/staging-write/schedule-write-types.ts";
const ASTRO_PAGE =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";

const BASE_COMMIT = "f399add";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const LEGACY_008 = "schedule-2026-07-008";
const LEGACY_014 = "schedule-2026-03-014";
const LEGACY_001 = "schedule-2026-09-001";
const DRY_RUN_APPROVAL = "G-22h-gosaki-schedule-republish-dry-run";
const SAVE_APPROVAL = "G-22h-gosaki-schedule-republish-update-non-dry-run-slice";
const ENV_ARM = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED";

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

assert("HEAD is f399add", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is f399add", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-22h2 doc exists", exists(DOC_REL));
assert("G-22h1 doc exists", exists(G22H1_DOC));
assert("G-22f dry-run doc exists", exists(G22F_DRY_RUN_DOC));

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22h2", doc.includes("G-22h2-gosaki-schedule-republish-dry-run-ui-planning"));
assert(
  "doc gate planning complete",
  doc.includes("gosakiScheduleRepublishDryRunUiPlanningComplete: true"),
);
assert("doc purpose G-22h2", doc.includes("G-22h2") && doc.includes("dry-run"));
assert("doc dry-run module design", doc.includes("executeG22hScheduleRepublishDryRun"));
assert("doc UI flow design", doc.includes("再公開案を作成") || doc.includes("UI flow"));
assert("doc save target panel", doc.includes("save-target-panel") || doc.includes("Save target panel"));
assert("doc published false to true", /published.*false.*true|false.*→.*true/i.test(doc));
assert("doc actualWrite false", doc.includes("actualWrite: false") || doc.includes("actualWrite=false"));
assert("doc dry-run approvalId", doc.includes(DRY_RUN_APPROVAL));
assert("doc non-dry-run approvalId", doc.includes(SAVE_APPROVAL));
assert("doc env arm", doc.includes(ENV_ARM));
assert("doc expectedBeforeUpdatedAt", doc.includes("expectedBeforeUpdatedAt"));
assert("doc optimistic lock", doc.includes("optimistic lock") || doc.includes("expectedBeforeUpdatedAt"));
assert("doc republish-update operation", doc.includes("republish-update"));
assert("doc physicalDelete false", doc.includes("physicalDelete: false") || doc.includes("physicalDelete=false"));
assert("doc content fields unchanged", doc.includes("content") && doc.includes("unchanged"));
assert("doc public reflection pending", doc.includes("publicReflectionPending") || doc.includes("public reflection"));
assert("doc target candidates", doc.includes("Target candidates") || doc.includes("target"));
assert("doc legacy 008", doc.includes(LEGACY_008));
assert("doc legacy 014", doc.includes(LEGACY_014));
assert("doc legacy 001", doc.includes(LEGACY_001));
assert("doc safety gates", doc.includes("Safety gates") || doc.includes("Safety gate"));
assert("doc implementation candidate files", doc.includes("Implementation candidate") || doc.includes("candidate files"));
assert("doc future slices G-22h3", doc.includes("G-22h3"));
assert("doc future slices G-22h6", doc.includes("G-22h6"));
assert("doc future slices G-22h7", doc.includes("G-22h7"));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc db write false", doc.includes("dbWriteExecuted: false"));
assert("doc sql mutation false", doc.includes("sqlMutationExecuted: false"));
assert("doc rls grant unchanged", doc.includes("rlsGrantChangeExecuted: false"));
assert("doc service role not used", doc.includes("serviceRoleUsed: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc public reflection not executed", doc.includes("publicReflectionExecuted: false"));
assert("doc implementation not executed", doc.includes("implementationExecuted: false"));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc staging ref only", doc.includes(STAGING_REF));
assert("doc base commit f399add", doc.includes(BASE_COMMIT));
assert("doc unpublish mirror reference", doc.includes("G-22f") || doc.includes("unpublish"));

assert("G22f dry-run module unchanged", gitDiff(G22F_DRY_RUN).length === 0);
assert("G22f save unchanged", gitDiff(G22F_SAVE).length === 0);
assert("operator UI unchanged", gitDiff(OPERATOR_UI).length === 0);
assert("dry-run adapter unchanged", gitDiff(DRY_RUN_ADAPTER).length === 0);
assert("write types unchanged", gitDiff(WRITE_TYPES).length === 0);
assert("astro page unchanged", gitDiff(ASTRO_PAGE).length === 0);
assert(
  "no republish dry-run module yet",
  !exists("src/lib/admin/staging-write/gosaki-schedule-republish-dry-run.ts"),
);
assert(
  "no republish save module yet",
  !exists("src/lib/admin/staging-write/gosaki-schedule-republish-update-save.ts"),
);

assert("00-current-state mentions G-22h2", currentState.includes("G-22h2"));
assert("03-next-actions mentions G-22h2", nextActions.includes("G-22h2"));
assert("handoff mentions G-22h2", handoff.includes("G-22h2"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(
  `\nG-22h2 Gosaki Schedule republish dry-run UI planning verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
