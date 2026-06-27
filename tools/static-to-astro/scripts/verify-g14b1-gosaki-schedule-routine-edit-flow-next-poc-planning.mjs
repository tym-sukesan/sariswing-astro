/**
 * G-14b1 — Gosaki Schedule CMS routine edit flow next PoC planning verifier.
 * Run: node tools/static-to-astro/scripts/verify-g14b1-gosaki-schedule-routine-edit-flow-next-poc-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-routine-edit-flow-next-poc-planning.md";
const G14B_REL =
  "tools/static-to-astro/docs/gosaki-schedule-cms-practical-editing-flow-definition.md";
const G14C_REL =
  "tools/static-to-astro/docs/gosaki-public-reflection-operation-standardization.md";
const G13C2E_CLOSURE_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-b-public-reflection-closure.md";
const G13B_REL =
  "tools/static-to-astro/docs/gosaki-schedule-poc-visible-text-cleanup-preflight.md";
const OPERATOR_UI_REL =
  "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const SAVE_REL =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-config.ts";
const PICKER_UTILS_REL =
  "src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-utils.ts";
const SEED_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-schedules-seed.template.sql";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const ENV_FILES = [".env", ".env.local"];

const G9K_APPROVAL = "G-9k-gosaki-schedule-existing-event-save-button-non-dry-run";
const RECOMMENDED_LEGACY_ID = "schedule-2026-04-005";
const EXCLUDED_EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const STAGING_HOST = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_HOST = "vsbvndwuajjhnzpohghh";

const SAFE_FIELDS = [
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
];

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

const doc = read(DOC_REL);
const g14b = read(G14B_REL);
const operatorUi = read(OPERATOR_UI_REL);
const saveSrc = read(SAVE_REL);
const configSrc = read(CONFIG_REL);
const pickerUtils = read(PICKER_UTILS_REL);
const seed = read(SEED_REL);

assert("G-14b1 planning doc exists", exists(DOC_REL));
assert(
  "doc phase G-14b1",
  doc.includes("G-14b1-gosaki-schedule-routine-edit-flow-next-poc-planning"),
);
assert(
  "doc planning complete gate",
  doc.includes("gosakiScheduleRoutineEditFlowNextPocPlanningComplete: true"),
);
assert("doc readyForG14b1a true", doc.includes("readyForG14b1aRoutineEditSaveEnablementImplementation: true"));
assert("doc readyForAnyDbWrite false", doc.includes("readyForAnyDbWrite: false"));
assert("doc routine vs cleanup section", doc.includes("G-13 cleanup slice vs routine edit"));
assert("doc event candidates", doc.includes("Next PoC event candidates"));
assert("doc field candidates", doc.includes("Next PoC field candidates"));
assert("doc recommended PoC", doc.includes("G-14b1-routine-poc-1"));
assert("doc implementation phases", doc.includes("Implementation phase decomposition"));
assert("doc end-to-end procedure", doc.includes("Future end-to-end procedure"));
assert("doc risks and stop", doc.includes("Risks and stop conditions"));
assert("doc rollback doc-only", doc.includes("Rollback (doc-only"));
assert("doc G-14c reflection chain", doc.includes("G-14c"));
assert("doc staging host", doc.includes(STAGING_HOST));
assert("doc production stop", doc.includes(PRODUCTION_HOST));
assert("doc no cursor save", doc.includes("cursorSaveExecuted: false"));

assert(`doc recommended legacy_id ${RECOMMENDED_LEGACY_ID}`, doc.includes(RECOMMENDED_LEGACY_ID));
assert("doc excludes Event B", doc.includes(EXCLUDED_EVENT_B_ID));
assert("doc excludes Event A from first PoC", doc.includes("schedule-2026-03-007"));
assert("doc G-9k approval", doc.includes(G9K_APPROVAL));
assert("doc price-only option", doc.includes("price") && doc.includes("Option A"));
assert("doc forbids CMS Kit staging marker in payload", doc.includes("[CMS Kit staging]"));

for (const field of SAFE_FIELDS) {
  assert(`doc safe field ${field}`, doc.includes(field));
}

assert("doc defers date/month", doc.includes("date") && doc.includes("month"));
assert("doc defers INSERT DELETE", doc.includes("INSERT") || doc.includes("DELETE"));

assert("G-14b doc exists", exists(G14B_REL));
assert("G-14c doc exists", exists(G14C_REL));
assert("G-13c2e closure doc exists", exists(G13C2E_CLOSURE_REL));
assert("G-13b preflight doc exists", exists(G13B_REL));
assert("seed template exists", exists(SEED_REL));
assert("seed has recommended row", seed.includes(RECOMMENDED_LEGACY_ID));

assert("operator UI exists", exists(OPERATOR_UI_REL));
assert("G-9k save exists", exists(SAVE_REL));
assert("G-9k config exists", exists(CONFIG_REL));
assert("picker utils exists", exists(PICKER_UTILS_REL));

assert("operator UI imports isPocAuditScheduleRow", operatorUi.includes("isPocAuditScheduleRow"));
assert("operator UI uses G-9k save", operatorUi.includes("gosaki-schedule-existing-event-save-button-save"));
assert("save uses afterSnapshot", saveSrc.includes("afterSnapshot"));
assert("save uses optimistic lock path", saveSrc.includes("buildScheduleLockedWriteRequest"));
assert("config G-9k approval id", configSrc.includes("G9K_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_APPROVAL_ID"));
assert("config save default disabled", configSrc.includes("G9K_SAVE_BUTTON_SAVE_ENABLED = false"));
assert("picker excludes G9G1 target id", pickerUtils.includes("G9G1_TARGET_ROW_ID"));

assert(
  "G-14b defines routine path",
  g14b.includes("Routine edit flow") && g14b.includes(G9K_APPROVAL),
);
assert(
  "G-14b proposes G-14b1",
  g14b.includes("G-14b1") || g14b.includes("readyForG14b1PracticalEditSaveEnablement"),
);

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

for (const envFile of ENV_FILES) {
  const envDiff = spawnSync("git", ["diff", "--name-only", envFile], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert(`${envFile} no diff`, !envDiff.stdout.trim());
}

console.log(`\nG-14b1 planning verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
