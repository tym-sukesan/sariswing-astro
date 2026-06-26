/**
 * G-13d1 — Gosaki Event A PoC cleanup local implementation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13d1-gosaki-schedule-event-a-poc-cleanup-local-implementation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-local-implementation.md";
const TYPES_REL = "src/lib/admin/staging-write/schedule-write-types.ts";
const CONFIG_REL = "src/lib/admin/staging-write/gosaki-schedule-event-a-poc-cleanup-config.ts";
const GUARDS_REL = "src/lib/admin/staging-write/gosaki-schedule-event-a-poc-cleanup-guards.ts";
const DRY_RUN_REL = "src/lib/admin/staging-write/gosaki-schedule-event-a-poc-cleanup-dry-run.ts";
const SAVE_REL = "src/lib/admin/staging-write/gosaki-schedule-event-a-poc-cleanup-save.ts";
const UI_REL = "src/lib/admin/staging-data/gosaki-schedule-event-a-poc-cleanup-ui.ts";
const ASTRO_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const G9K_CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-config.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const EVENT_A_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const APPROVAL_ID = "G-13c1-gosaki-schedule-event-a-poc-text-cleanup-non-dry-run";
const ENV_ARM = "PUBLIC_ADMIN_SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED";
const OPERATION_ID = "gosaki-schedule-event-a-poc-cleanup";

const CHANGED_FIELDS = [
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

function simulateChangedFields(before, formValues) {
  const norm = (v) => (v === null || v === undefined ? "" : String(v));
  return CHANGED_FIELDS.filter((field) => norm(before[field]) !== norm(formValues[field]));
}

const doc = read(DOC_REL);
const typesSrc = read(TYPES_REL);
const configSrc = read(CONFIG_REL);
const guardsSrc = read(GUARDS_REL);
const dryRunSrc = read(DRY_RUN_REL);
const saveSrc = read(SAVE_REL);
const uiSrc = read(UI_REL);
const astroSrc = read(ASTRO_REL);
const g9kConfigSrc = read(G9K_CONFIG_REL);

assert("G-13d1 doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert("doc phase G-13d1", doc.includes("G-13d1-gosaki-schedule-event-a-poc-cleanup-local-implementation"));
assert("doc Event A id", doc.includes(EVENT_A_ID));
assert("doc no Event B scope", !doc.includes(EVENT_B_ID));
assert("doc approval id", doc.includes(APPROVAL_ID));
assert("doc no Save this phase", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));
assert("doc event B untouched gate", doc.includes("eventBTouched") && doc.includes("**false**"));

assert("approval in schedule-write-types", typesSrc.includes(APPROVAL_ID));
assert("approval in SCHEDULE_WRITE_APPROVAL_IDS", typesSrc.includes("G13C1_SCHEDULE_EVENT_A_POC_CLEANUP_NON_DRY_RUN_APPROVAL_ID"));
assert("operation id in config", configSrc.includes(OPERATION_ID));
assert("env arm in config", configSrc.includes(ENV_ARM));
assert("target row Event A", configSrc.includes(EVENT_A_ID));
assert("target legacy schedule-2026-03-007", configSrc.includes("schedule-2026-03-007"));
assert("expected title Duo", configSrc.includes("<Duo>"));
assert("expected description seed", configSrc.includes("会場website: http://pubhpp.com/"));
assert("config no Event B target", !configSrc.includes(`TARGET_ROW_ID =\n  "${EVENT_B_ID}"`) && !configSrc.includes(`= "${EVENT_B_ID}"`));

assert("guards writable row Event A", guardsSrc.includes("G13C1_EVENT_A_POC_CLEANUP_TARGET_ROW_ID"));
assert("guards no Event B id", !guardsSrc.includes(EVENT_B_ID));
assert("guards bundle changed fields", guardsSrc.includes("assertG13c1EventAPocCleanupBundleChangedFields"));
assert("guards payload targets", guardsSrc.includes("assertG13c1EventAPocCleanupPayloadMatchesTargets"));

assert("dry-run module", dryRunSrc.includes("executeG13c1EventAPocCleanupDryRun"));
assert("dry-run no updateScheduleWrite call", !dryRunSrc.includes("updateScheduleWrite("));
assert("dry-run actualWrite false safety", dryRunSrc.includes("actualWrite: false"));
assert("dry-run compute changedFields", dryRunSrc.includes("computeG13c1EventAPocCleanupChangedFields"));

assert("save module", saveSrc.includes("executeG13c1EventAPocCleanupSave"));
assert("save blocked when not enabled", saveSrc.includes('errorCode: "save_not_enabled"'));
assert("save uses G-13c1 approval", saveSrc.includes("G13C1_SCHEDULE_EVENT_A_POC_CLEANUP_NON_DRY_RUN_APPROVAL_ID"));
assert("save no service_role", !saveSrc.includes("service_role"));
assert("save compile gate check", configSrc.includes("isG13c1SaveCompileGateEnabled"));

assert("UI preview handler", uiSrc.includes("runG13c1Preview"));
assert("UI save handler", uiSrc.includes("runG13c1Save"));
assert("UI imports dry-run", uiSrc.includes("executeG13c1EventAPocCleanupDryRun"));
assert("UI no Event B", !uiSrc.includes(EVENT_B_ID));

assert("Astro G-13c1 section", astroSrc.includes("gosaki-schedule-g13c1-event-a-poc-cleanup"));
assert("Astro preview btn", astroSrc.includes("gosaki-g13c1-event-a-poc-cleanup-preview-btn"));
assert("Astro imports cleanup ui", astroSrc.includes("gosaki-schedule-event-a-poc-cleanup-ui.ts"));

assert("G-9k mutual exclusion", g9kConfigSrc.includes("collectG13c1EventAPocCleanupArmOffFailures"));

const mockBefore = {
  title: "<Duo> [G-9k6 title UI保存テスト]",
  venue: "川崎 ぴあにしも [G-9k6 venue UI保存テスト]",
  open_time: "18:00",
  start_time: "19:00",
  price: "3,000円（G-9k6 price UI保存テスト）",
  description: "出演：test （管理画面保存テスト）",
};
const mockForm = {
  title: "<Duo>",
  venue: "川崎 ぴあにしも",
  open_time: "15:00",
  start_time: "15:30",
  price: "3,000円",
  description: "出演：長谷川薫vo 後藤沙紀pf\n会場website: http://pubhpp.com/",
};
const simulatedChanged = simulateChangedFields(mockBefore, mockForm);
assert("simulation 6 changed fields", simulatedChanged.length === 6);
assert("simulation includes title", simulatedChanged.includes("title"));
assert("simulation includes description", simulatedChanged.includes("description"));

assert(
  "routine dev saveEnabled false pattern",
  configSrc.includes("saveEnabled = isG13c1SaveCompileGateEnabled") &&
    configSrc.includes("G13C1_EVENT_A_POC_CLEANUP_SAVE_DISABLED_DEFAULT_REASON"),
);

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

assert(
  "guards file no Event B writable exception",
  !guardsSrc.includes(EVENT_B_ID),
);

console.log(`\nG-13d1 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
