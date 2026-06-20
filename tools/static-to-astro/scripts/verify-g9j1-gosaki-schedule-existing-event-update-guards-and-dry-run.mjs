/**
 * G-9j1 — Gosaki schedule existing event update guards + dry-run implementation.
 * Run: node tools/static-to-astro/scripts/verify-g9j1-gosaki-schedule-existing-event-update-guards-and-dry-run.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const APPROVAL_ID = "G-9j-gosaki-schedule-existing-event-update-non-dry-run";
const ENV_ARM = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED";
const SAFE_FIELDS = [
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
];
const FORBIDDEN_FIELDS = [
  "date",
  "month",
  "source_route",
  "published",
  "updated_at",
  "schedule_months",
];

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

const planningDoc = readRepo(
  "tools/static-to-astro/docs/gosaki-schedule-existing-event-save-enablement-planning.md",
);
const typesSrc = readRepo("src/lib/admin/staging-write/schedule-write-types.ts");
const guardsSrc = readRepo("src/lib/admin/staging-write/schedule-write-guards.ts");
const configSrc = readRepo(
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-update-config.ts",
);
const dryRunSrc = readRepo(
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-update-dry-run.ts",
);

assert("planning doc readyForAnyDbWrite false", planningDoc.includes("readyForAnyDbWrite: false"));

assert(
  "approval ID registered in types",
  typesSrc.includes(APPROVAL_ID) &&
    typesSrc.includes("G9J_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_APPROVAL_ID") &&
    typesSrc.includes("G9J_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_APPROVAL_ID,"),
);

assert("env arm defined in config", configSrc.includes(ENV_ARM));
assert("G9J1 phase in config", configSrc.includes("G-9j1-gosaki-schedule-existing-event-update-guards-and-dry-run-implementation"));
assert("saveEnabled false constant", configSrc.includes("G9J_EXISTING_EVENT_UPDATE_SAVE_ENABLED = false"));
assert("single-arm checks in config", configSrc.includes("must be off"));

for (const field of SAFE_FIELDS) {
  assert(`safe field ${field} exported`, guardsSrc.includes(`"${field}"`));
}
assert(
  "G9J_EXISTING_EVENT_UPDATE_SAFE_FIELDS exported",
  guardsSrc.includes("G9J_EXISTING_EVENT_UPDATE_SAFE_FIELDS"),
);

assert("assertG9jExistingEventUpdatePayloadOnly", guardsSrc.includes("assertG9jExistingEventUpdatePayloadOnly"));
assert(
  "assertG9jExistingEventUpdateChangedFieldsOnly",
  guardsSrc.includes("assertG9jExistingEventUpdateChangedFieldsOnly"),
);
assert(
  "assertG9jExistingEventUpdateWritableRow",
  guardsSrc.includes("assertG9jExistingEventUpdateWritableRow"),
);
assert("buildG9jExistingEventUpdatePayload", guardsSrc.includes("buildG9jExistingEventUpdatePayload"));

for (const field of FORBIDDEN_FIELDS) {
  assert(`forbidden field ${field} in guard set`, guardsSrc.includes(`"${field}"`));
}

assert("dry-run executor exists", dryRunSrc.includes("executeG9jExistingEventUpdateDryRun"));
assert(
  "dry-run does not call updateScheduleWrite",
  !dryRunSrc.includes("from \"./schedule-write-adapter\"") &&
    !dryRunSrc.includes("updateScheduleWrite("),
);
assert("dry-run does not import service_role", !dryRunSrc.includes("service_role"));
assert("dry-run saveAllowed false", dryRunSrc.includes("saveAllowed: false"));
assert(
  "dry-run returns expectedBeforeUpdatedAt",
  dryRunSrc.includes("expectedBeforeUpdatedAt"),
);
assert("dry-run scheduleMonthsTouched false", dryRunSrc.includes("scheduleMonthsTouched: false"));
assert("dry-run actualWrite false", dryRunSrc.includes("actualWrite: false"));

// Programmatic guard / dry-run smoke (mirrors production logic; no DB)
function normalizeCompare(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function computeChangedFields(before, form) {
  const changed = [];
  for (const field of SAFE_FIELDS) {
    if (normalizeCompare(before[field]) !== normalizeCompare(form[field])) {
      changed.push(field);
    }
  }
  return changed;
}

function assertChangedFieldsOnly(changedFields) {
  if (changedFields.length === 0) throw new Error("no changes");
  const safe = new Set(SAFE_FIELDS);
  const forbidden = new Set(FORBIDDEN_FIELDS);
  for (const field of changedFields) {
    if (forbidden.has(field)) throw new Error(`forbidden: ${field}`);
    if (!safe.has(field)) throw new Error(`not allowed: ${field}`);
  }
}

const sampleRow = {
  id: "b1c2d3e4-0000-4000-8000-000000000001",
  legacy_id: "schedule-2026-08-001",
  site_slug: "gosaki-piano",
  date: "2026-08-15",
  title: "Sample Concert",
  venue: "Sample Hall",
  open_time: "18:00",
  start_time: "19:00",
  price: "3000",
  description: "Notes",
  updated_at: "2026-06-19T00:00:00.000Z",
};

const formChange = {
  title: "Sample Concert",
  venue: "New Hall",
  open_time: "18:00",
  start_time: "19:00",
  price: "3500",
  description: "Notes",
};

const changed = computeChangedFields(sampleRow, formChange);
assert("programmatic changedFields venue+price", changed.includes("venue") && changed.includes("price"));
try {
  assertChangedFieldsOnly(changed);
  assert("programmatic allowed changedFields pass", true);
} catch {
  assert("programmatic allowed changedFields pass", false);
}

try {
  assertChangedFieldsOnly(["date"]);
  assert("programmatic date rejected", false);
} catch (error) {
  assert("programmatic date rejected", String(error).includes("forbidden"));
}

try {
  assertChangedFieldsOnly(["published"]);
  assert("programmatic published rejected", false);
} catch (error) {
  assert("programmatic published rejected", String(error).includes("forbidden"));
}

assert(
  "programmatic no changes detected",
  computeChangedFields(sampleRow, {
    title: sampleRow.title,
    venue: sampleRow.venue,
    open_time: sampleRow.open_time,
    start_time: sampleRow.start_time,
    price: sampleRow.price,
    description: sampleRow.description,
  }).length === 0,
);

assert(
  "no src/pages/admin references in G-9j modules",
  !dryRunSrc.includes("pages/admin") && !configSrc.includes("pages/admin"),
);

const planningVerifier = spawnSync(
  "node",
  [
    "tools/static-to-astro/scripts/verify-g9j-gosaki-schedule-existing-event-save-enablement-planning.mjs",
  ],
  { cwd: REPO_ROOT, encoding: "utf8" },
);
assert(
  "G-9j planning verifier passes",
  planningVerifier.status === 0,
);
if (planningVerifier.status !== 0) {
  console.error(planningVerifier.stdout);
  console.error(planningVerifier.stderr);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
