/**
 * G-13c2d1 — Gosaki Event B PoC cleanup slice implementation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13c2d1-gosaki-schedule-event-b-poc-cleanup-slice-implementation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-b-poc-cleanup-slice-implementation.md";
const TYPES_REL = "src/lib/admin/staging-write/schedule-write-types.ts";
const CONFIG_REL = "src/lib/admin/staging-write/gosaki-schedule-event-b-poc-cleanup-config.ts";
const GUARDS_REL = "src/lib/admin/staging-write/gosaki-schedule-event-b-poc-cleanup-guards.ts";
const DRY_RUN_REL = "src/lib/admin/staging-write/gosaki-schedule-event-b-poc-cleanup-dry-run.ts";
const SAVE_REL = "src/lib/admin/staging-write/gosaki-schedule-event-b-poc-cleanup-save.ts";
const PAGE_CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-schedule-event-b-poc-cleanup-page-config.ts";
const TARGET_RESOLVE_REL =
  "src/lib/admin/staging-data/gosaki-schedule-event-b-poc-cleanup-target-row-resolve.ts";
const UI_REL = "src/lib/admin/staging-data/gosaki-schedule-event-b-poc-cleanup-ui.ts";
const ASTRO_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const EVENT_A_CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-schedule-event-a-poc-cleanup-config.ts";
const EVENT_A_GUARDS_REL =
  "src/lib/admin/staging-write/gosaki-schedule-event-a-poc-cleanup-guards.ts";
const G9K_CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-config.ts";
const G9J_CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-update-config.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const EVENT_A_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const EVENT_B_LEGACY = "schedule-2026-07-010";
const EVENT_B_DATE = "2026-07-19";
const APPROVAL_ID = "G-13c2-gosaki-schedule-event-b-poc-audit-cleanup-non-dry-run";
const ENV_ARM = "PUBLIC_ADMIN_SCHEDULE_G13C2_EVENT_B_POC_CLEANUP_NON_DRY_RUN_ARMED";
const SAVE_ENV = "PUBLIC_ADMIN_G13C2_EVENT_B_POC_CLEANUP_SAVE_ENABLED";
const OPERATION_ID = "gosaki-schedule-event-b-poc-cleanup";

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

function normalizeG9G3d(field, raw) {
  const trimmed = String(raw).trim();
  if (field === "title") return trimmed;
  return trimmed === "" ? null : trimmed;
}

function buildPayload(changedFields, formValues) {
  const payload = {};
  for (const field of changedFields) {
    payload[field] = normalizeG9G3d(field, formValues[field] ?? "");
  }
  return payload;
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
const pageConfigSrc = read(PAGE_CONFIG_REL);
const targetResolveSrc = read(TARGET_RESOLVE_REL);
const uiSrc = read(UI_REL);
const astroSrc = read(ASTRO_REL);
const eventAConfigSrc = read(EVENT_A_CONFIG_REL);
const eventAGuardsSrc = read(EVENT_A_GUARDS_REL);
const g9kConfigSrc = read(G9K_CONFIG_REL);
const g9jConfigSrc = read(G9J_CONFIG_REL);

assert("G-13c2d1 doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert(
  "doc phase G-13c2d1",
  doc.includes("G-13c2d1-gosaki-schedule-event-b-poc-cleanup-slice-implementation"),
);
assert("doc Event B id", doc.includes(EVENT_B_ID));
assert("doc Event B legacy", doc.includes(EVENT_B_LEGACY));
assert("doc Event B date", doc.includes(EVENT_B_DATE));
assert("doc expected title <>", doc.includes("title: <>"));
assert("doc expected venue null", doc.includes("venue: null"));
assert("doc expected description", doc.includes("description: 出演："));
assert("doc no Save this phase", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));
assert("doc event A untouched gate", doc.includes("eventATouched") && doc.includes("**false**"));

assert("approval in schedule-write-types", typesSrc.includes(APPROVAL_ID));
assert(
  "approval in SCHEDULE_WRITE_APPROVAL_IDS",
  typesSrc.includes("G13C2_SCHEDULE_EVENT_B_POC_AUDIT_CLEANUP_NON_DRY_RUN_APPROVAL_ID"),
);
assert("operation id in config", configSrc.includes(OPERATION_ID));
assert("env arm in config", configSrc.includes(ENV_ARM));
assert("save env in config", configSrc.includes(SAVE_ENV));
assert("target row Event B", configSrc.includes(EVENT_B_ID));
assert("target legacy schedule-2026-07-010", configSrc.includes(EVENT_B_LEGACY));
assert("target date 2026-07-19", configSrc.includes(EVENT_B_DATE));
assert("expected title <>", configSrc.includes('G13C2_EVENT_B_POC_CLEANUP_EXPECTED_TITLE = "<>"'));
assert(
  "expected description seed",
  configSrc.includes('G13C2_EVENT_B_POC_CLEANUP_EXPECTED_DESCRIPTION = "出演："'),
);
assert(
  "config no Event A as primary target",
  !configSrc.includes(`G13C2_EVENT_B_POC_CLEANUP_TARGET_ROW_ID =\n  "${EVENT_A_ID}"`),
);

assert("guards writable row Event B", guardsSrc.includes("G13C2_EVENT_B_POC_CLEANUP_TARGET_ROW_ID"));
assert("guards date check", guardsSrc.includes("G13C2_EVENT_B_POC_CLEANUP_TARGET_DATE"));
assert("guards no Event A id", !guardsSrc.includes(EVENT_A_ID));
assert(
  "guards bundle changed fields",
  guardsSrc.includes("assertG13c2EventBPocCleanupBundleChangedFields"),
);
assert("guards payload targets", guardsSrc.includes("assertG13c2EventBPocCleanupPayloadMatchesTargets"));
assert("guards null not empty string", guardsSrc.includes("must be DB null, not empty string"));

assert("dry-run module", dryRunSrc.includes("executeG13c2EventBPocCleanupDryRun"));
assert("dry-run no updateScheduleWrite call", !dryRunSrc.includes("updateScheduleWrite("));
assert("dry-run actualWrite false safety", dryRunSrc.includes("actualWrite: false"));
assert(
  "dry-run compute changedFields",
  dryRunSrc.includes("computeG13c2EventBPocCleanupChangedFields"),
);

assert("save module", saveSrc.includes("executeG13c2EventBPocCleanupSave"));
assert("save blocked when not enabled", saveSrc.includes('errorCode: "save_not_enabled"'));
assert(
  "save uses G-13c2 approval",
  saveSrc.includes("G13C2_SCHEDULE_EVENT_B_POC_AUDIT_CLEANUP_NON_DRY_RUN_APPROVAL_ID"),
);
assert("save no service_role", !saveSrc.includes("service_role"));
assert("save compile gate check", configSrc.includes("isG13c2SaveCompileGateEnabled"));

assert("page config bridge", pageConfigSrc.includes("readG13c2EventBPocCleanupPageConfigFromDom"));
assert("page config element id", pageConfigSrc.includes("g13c2-event-b-poc-cleanup-page-config"));

assert("target resolve direct read", targetResolveSrc.includes("loadScheduleRowForSiteSlugRead"));
assert("target resolve no data-selectable-rows", !targetResolveSrc.includes("data-selectable-rows"));
assert("target resolve getReadOnlyDataConfig", targetResolveSrc.includes("getReadOnlyDataConfig"));

assert("UI preview handler", uiSrc.includes("runG13c2Preview"));
assert("UI save handler", uiSrc.includes("runG13c2Save"));
assert("UI imports dry-run", uiSrc.includes("executeG13c2EventBPocCleanupDryRun"));
assert("UI target resolve import", uiSrc.includes("resolveG13c2EventBPocCleanupTargetRow"));
assert("UI no Event A id", !uiSrc.includes(EVENT_A_ID));

assert("Astro G-13c2 section", astroSrc.includes("gosaki-schedule-g13c2-event-b-poc-cleanup"));
assert("Astro preview btn", astroSrc.includes("gosaki-g13c2-event-b-poc-cleanup-preview-btn"));
assert("Astro imports cleanup ui", astroSrc.includes("gosaki-schedule-event-b-poc-cleanup-ui.ts"));
assert(
  "Astro page config element",
  astroSrc.includes("G13C2_EVENT_B_POC_CLEANUP_PAGE_CONFIG_ELEMENT_ID"),
);

assert("G-9k mutual exclusion G-13c2", g9kConfigSrc.includes("collectG13c2EventBPocCleanupArmOffFailures"));
assert("G-9j mutual exclusion G-13c2", g9jConfigSrc.includes("collectG13c2EventBPocCleanupArmOffFailures"));
assert(
  "G-13c1 mutual exclusion G-13c2",
  eventAConfigSrc.includes("collectG13c2EventBPocCleanupArmOffFailures"),
);
assert(
  "G-13c2 blocks G-13c1 arm",
  configSrc.includes("G13C1_EVENT_A_POC_CLEANUP_ARM_ENV"),
);

assert("allowlistPassed in G-13c2 config", configSrc.includes("allowlistPassed"));
assert("errorMessage in G-13c2 config", configSrc.includes("errorMessage"));
assert("no passed property misuse", !configSrc.includes("projectAllowlist.passed"));
assert("no failureReason property misuse", !configSrc.includes("projectAllowlist.failureReason"));

assert("Event A config id unchanged", eventAConfigSrc.includes(EVENT_A_ID));
assert("Event A guards no Event B id", !eventAGuardsSrc.includes(EVENT_B_ID));
assert(
  "no March reupload markers in Event B files",
  !configSrc.includes("schedule/2026-03") &&
    !dryRunSrc.includes("schedule/2026-03") &&
    !uiSrc.includes("schedule/2026-03"),
);

const mockBefore = {
  id: EVENT_B_ID,
  legacy_id: EVENT_B_LEGACY,
  site_slug: "gosaki-piano",
  date: EVENT_B_DATE,
  title: "[CMS Kit staging] G-9g2 title PoC",
  venue: "[CMS Kit staging] G-9g3b venue PoC",
  open_time: "[CMS Kit staging] G-9g3c open PoC",
  start_time: "[CMS Kit staging] G-9g3c start PoC",
  price: "[CMS Kit staging] G-9g3d general edit price PoC",
  description: "出演： [G-9g3b venue+description PoC]",
  updated_at: "2026-06-18T01:04:51.312817+00:00",
};
const mockForm = {
  title: "<>",
  venue: "",
  open_time: "",
  start_time: "",
  price: "",
  description: "出演：",
};
const simulatedChanged = simulateChangedFields(mockBefore, mockForm);
assert("simulation 6 changed fields", simulatedChanged.length === 6);
assert("simulation includes title", simulatedChanged.includes("title"));
assert("simulation includes venue", simulatedChanged.includes("venue"));
assert("simulation includes description", simulatedChanged.includes("description"));

const payload = buildPayload(simulatedChanged, mockForm);
assert("payload title string", payload.title === "<>");
assert("payload venue null", payload.venue === null);
assert("payload open_time null", payload.open_time === null);
assert("payload start_time null", payload.start_time === null);
assert("payload price null", payload.price === null);
assert("payload description seed", payload.description === "出演：");
assert("payload venue not empty string", payload.venue !== "");
assert("payload price not empty string", payload.price !== "");

assert(
  "routine dev saveEnabled false pattern",
  configSrc.includes("saveEnabled = isG13c2SaveCompileGateEnabled") &&
    configSrc.includes("G13C2_EVENT_B_POC_CLEANUP_SAVE_DISABLED_DEFAULT_REASON"),
);

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

console.log(`\nG-13c2d1 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
