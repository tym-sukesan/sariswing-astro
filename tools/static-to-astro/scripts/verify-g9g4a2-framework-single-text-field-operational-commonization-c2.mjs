/**
 * G-9g4a2 C2 — generic Save executor + open_time-only delegate (static only).
 * Run: node --experimental-strip-types tools/static-to-astro/scripts/verify-g9g4a2-framework-single-text-field-operational-commonization-c2.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const GENERIC_SAVE_PATH =
  "src/lib/admin/staging-write/staging-schedule-single-text-field-operational-save.ts";
const OPEN_TIME_SAVE_PATH =
  "src/lib/admin/staging-write/staging-schedule-site-slug-open-time-only-operational-save.ts";
const OPEN_TIME_APPROVAL = "G-9g4a2a-schedule-site-slug-open-time-only-non-dry-run";
const OPEN_TIME_ENV_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED";

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}`);
    failed += 1;
  }
}

function readRepo(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

const genericSaveSrc = readRepo(GENERIC_SAVE_PATH);
const openTimeSaveSrc = readRepo(OPEN_TIME_SAVE_PATH);
const guardsSrc = readRepo("src/lib/admin/staging-write/schedule-write-guards.ts");
const registrySrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-single-text-field-operational-registry.ts",
);
const genericConfigSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-single-text-field-operational-config.ts",
);
const triggerSrc = readRepo("src/lib/admin/staging-write/schedule-general-update-trigger.ts");

assert("generic Save executor file exists", genericSaveSrc.length > 0);
assert(
  "generic executor export executeSingleTextFieldOperationalNonDryRunSave",
  genericSaveSrc.includes("export async function executeSingleTextFieldOperationalNonDryRunSave"),
);
assert(
  "generic executor uses registry entry",
  genericSaveSrc.includes("getSingleTextFieldOperationalRegistryEntry"),
);
assert(
  "generic executor uses generic config",
  genericSaveSrc.includes("getSingleTextFieldOperationalConfig"),
);
assert(
  "generic executor uses assertSingleTextFieldApproval",
  genericSaveSrc.includes("assertSingleTextFieldApproval"),
);
assert(
  "generic executor uses assertSingleTextFieldPayloadOnly",
  genericSaveSrc.includes("assertSingleTextFieldPayloadOnly"),
);
assert(
  "generic executor uses assertSingleTextFieldWritableRow",
  genericSaveSrc.includes("assertSingleTextFieldWritableRow"),
);
assert(
  "generic executor uses buildScheduleLockedWriteRequest",
  genericSaveSrc.includes("buildScheduleLockedWriteRequest"),
);
assert(
  "generic executor uses updateScheduleWrite",
  genericSaveSrc.includes("updateScheduleWrite"),
);
assert(
  "generic executor uses getScheduleOptimisticLockConfig",
  genericSaveSrc.includes("getScheduleOptimisticLockConfig"),
);
assert(
  "generic executor passes expectedBeforeUpdatedAt via locked request",
  genericSaveSrc.includes("expectedBeforeUpdatedAt"),
);
assert("generic executor no service_role", !genericSaveSrc.includes("service_role"));
assert(
  "generic executor productionBlocked guard",
  genericSaveSrc.includes("productionBlocked") && genericSaveSrc.includes("production_blocked"),
);
assert(
  "generic executor schedule_months safety comment",
  genericSaveSrc.includes("schedule_months"),
);
assert(
  "generic executor anon staging client only",
  genericSaveSrc.includes("getStagingSupabaseClient"),
);
assert(
  "generic executor supports fieldName parameter",
  genericSaveSrc.includes("fieldName: SingleTextFieldOperationalFieldName"),
);
assert(
  "registry field names open_time start_time price",
  registrySrc.includes('"open_time"') &&
    registrySrc.includes('"start_time"') &&
    registrySrc.includes('"price"'),
);
assert(
  "generic config referenced for saveEnabled",
  genericSaveSrc.includes("config.saveEnabled"),
);

assert(
  "open_time save delegates to generic executor",
  openTimeSaveSrc.includes("executeSingleTextFieldOperationalNonDryRunSave") &&
    openTimeSaveSrc.includes('"open_time"'),
);
assert(
  "open_time export executeG9G4a2aOpenTimeOnlyNonDryRunSave preserved",
  openTimeSaveSrc.includes("export async function executeG9G4a2aOpenTimeOnlyNonDryRunSave"),
);
assert(
  "open_time preview binding type preserved",
  openTimeSaveSrc.includes("export type G9G4a2aOpenTimeOnlyPreviewBinding"),
);
assert(
  "open_time save outcome type preserved",
  openTimeSaveSrc.includes("export type G9G4a2aOpenTimeOnlySaveOutcome"),
);
assert(
  "open_time delegate file no direct updateScheduleWrite",
  !openTimeSaveSrc.includes("updateScheduleWrite"),
);
assert(
  "open_time delegate retains productionBlocked safety note",
  openTimeSaveSrc.includes("productionBlocked"),
);
assert(
  "open_time delegate retains serviceRoleUsed false note",
  openTimeSaveSrc.includes("serviceRoleUsed false"),
);
assert(
  "open_time approvalId in registry unchanged",
  registrySrc.includes("G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID"),
);
assert(
  "open_time approvalId constant resolves to expected value",
  readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-config.ts").includes(
    OPEN_TIME_APPROVAL,
  ),
);
assert(
  "open_time envArm in registry unchanged",
  registrySrc.includes("SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED_ENV"),
);
assert(
  "generic guards still present for open_time legacy path",
  guardsSrc.includes("assertG9G4a2aOpenTimeOnlyPayloadOnly"),
);
assert(
  "buildScheduleLockedWriteRequest exported from trigger",
  triggerSrc.includes("export function buildScheduleLockedWriteRequest"),
);
assert(
  "generic executor preview lock mismatch guard",
  genericSaveSrc.includes("preview_lock_mismatch"),
);
assert(
  "generic executor write guard failed path",
  genericSaveSrc.includes("write_guard_failed"),
);
assert(
  "generic executor site_slug scope",
  genericSaveSrc.includes("assertBeforeSnapshotSiteSlugScope"),
);
assert(
  "generic config productionBlocked field",
  genericConfigSrc.includes("productionBlocked"),
);

console.log(`\nSummary: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
