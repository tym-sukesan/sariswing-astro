/**
 * CMS Core v2 — Schedule TBD Admin date-state + Save payload helpers (offline).
 *
 * npm: verify:cms-core-v2-schedule-tbd-admin-state-save-payload-helpers
 */

import assertNode from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { removeGeneratedOutputDir } from "./lib/safe-output-cleanup.mjs";
import {
  resolveScheduleAdminDateState,
  SCHEDULE_ADMIN_DATE_OPERATION_CREATE,
  SCHEDULE_ADMIN_DATE_OPERATION_UPDATE,
  SCHEDULE_TBD_MONTH_MODE_KNOWN,
  SCHEDULE_TBD_MONTH_MODE_UNKNOWN,
} from "./lib/schedule-admin-date-state.mjs";
import {
  SCHEDULE_SAVE_PAYLOAD_MODE_LEGACY_CONFIRMED,
  SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
  buildScheduleTbdSavePayload,
  coerceScheduleDateFieldsFromLegacyPayload,
  deriveScheduleMonthRouteFields,
} from "./lib/schedule-tbd-save-payload.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const TEMP_OUT_REL = "output/_cms-core-v2-schedule-tbd-admin-payload-helpers-tmp";
const ADMIN_STATE = path.join(__dirname, "lib/schedule-admin-date-state.mjs");
const PAYLOAD = path.join(__dirname, "lib/schedule-tbd-save-payload.mjs");
const CONTRACT = path.join(__dirname, "lib/schedule-date-contract.mjs");
const PLANNING = path.join(TOOL_ROOT, "docs/cms-core-v2-schedule-tbd-date-admin-save-planning.md");
const SUITE = path.join(__dirname, "run-cms-core-v2-safety-suite.mjs");
const PKG = path.join(TOOL_ROOT, "package.json");
const READ_CORE = path.join(__dirname, "lib/supabase-schedule-read.mjs");
const EDGE_CORE = path.join(__dirname, "lib/gosaki-schedule-dry-run-edge-core.mjs");
const MIO_PAGES = path.join(__dirname, "lib/mio-schedule-data-pages.mjs");
const GOSAKI_PAGES = path.join(__dirname, "lib/gosaki-schedule-data-pages.mjs");

let passed = 0;
let failed = 0;
/** @type {string | null} */
let tempOut = null;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

function deepEqual(label, actual, expected) {
  try {
    assertNode.deepStrictEqual(actual, expected);
    console.log(`PASS ${label}`);
    passed += 1;
  } catch (err) {
    console.error(`FAIL ${label}`);
    console.error(err instanceof Error ? err.message : String(err));
    failed += 1;
  }
}

function cleanupTemp() {
  if (tempOut && fs.existsSync(tempOut)) {
    removeGeneratedOutputDir(tempOut, TOOL_ROOT);
  }
  tempOut = null;
}

process.on("exit", () => {
  try {
    cleanupTemp();
  } catch {
    /* ignore */
  }
});

tempOut = path.join(TOOL_ROOT, TEMP_OUT_REL);
fs.mkdirSync(tempOut, { recursive: true });
fs.writeFileSync(path.join(tempOut, ".keep"), "admin-payload-helpers\n", "utf8");

assert("admin-state module exists", fs.existsSync(ADMIN_STATE));
assert("payload module exists", fs.existsSync(PAYLOAD));
assert("contract module exists", fs.existsSync(CONTRACT));
assert("planning doc exists", fs.existsSync(PLANNING));

const adminSrc = fs.readFileSync(ADMIN_STATE, "utf8");
const payloadSrc = fs.readFileSync(PAYLOAD, "utf8");
assert("admin-state imports schedule-date-contract", /schedule-date-contract/.test(adminSrc));
assert("payload imports schedule-date-contract", /schedule-date-contract/.test(payloadSrc));
assert("admin-state has no fetch", !/\bfetch\s*\(/.test(adminSrc));
assert("payload has no fetch", !/\bfetch\s*\(/.test(payloadSrc));
assert("admin-state has no createClient", !/createClient|supabase-js/.test(adminSrc));
assert("payload has no createClient", !/createClient|supabase-js/.test(payloadSrc));

const readSrc = fs.readFileSync(READ_CORE, "utf8");
const edgeSrc = fs.readFileSync(EDGE_CORE, "utf8");
const mioSrc = fs.readFileSync(MIO_PAGES, "utf8");
const gosakiPagesSrc = fs.readFileSync(GOSAKI_PAGES, "utf8");
assert(
  "read core does not import admin-state/payload helpers",
  !/schedule-admin-date-state|schedule-tbd-save-payload/.test(readSrc),
);
assert(
  "edge core does not import admin-state/payload helpers",
  !/schedule-admin-date-state|schedule-tbd-save-payload/.test(edgeSrc),
);
assert(
  "mio pages do not import admin-state/payload helpers",
  !/schedule-admin-date-state|schedule-tbd-save-payload/.test(mioSrc),
);
assert(
  "gosaki pages do not import admin-state/payload helpers",
  !/schedule-admin-date-state|schedule-tbd-save-payload/.test(gosakiPagesSrc),
);
assert("SCHEDULE_SELECT still has no date_status", !/\bdate_status\b/.test(
  (readSrc.match(/export const SCHEDULE_SELECT[\s\S]*?;/) || [""])[0],
));

// --- Admin state: confirmed ---
const confirmed = resolveScheduleAdminDateState({
  operation: SCHEDULE_ADMIN_DATE_OPERATION_CREATE,
  dateStatus: "confirmed",
  date: "2026-09-03",
  schemaSupportsTbd: false,
  tbdWriteEnabled: false,
});
assert("confirmed state ok", confirmed.ok === true);
if (confirmed.ok) {
  assert("confirmed status", confirmed.value.dateStatus === "confirmed");
  assert("confirmed month derived", confirmed.value.month === "2026-09");
  assert("confirmed display", /\d{4}\.\d{2}\.\d{2}/.test(confirmed.value.display));
  assert("confirmed date input enabled create", confirmed.value.dateInputEnabled === true);
  assert("confirmed date required", confirmed.value.dateInputRequired === true);
  assert("confirmed writeAllowed", confirmed.value.writeAllowed === true);
  assert("confirmed month membership", confirmed.value.monthMembership.kind === "month-page");
}

const monthMismatch = resolveScheduleAdminDateState({
  operation: "create",
  dateStatus: "confirmed",
  date: "2026-09-03",
  month: "2026-08",
});
assert("confirmed month mismatch fails", monthMismatch.ok === false);

// --- TBD states ---
const tbdKnownBlocked = resolveScheduleAdminDateState({
  operation: "create",
  dateStatus: "tbd",
  tbdMonthMode: SCHEDULE_TBD_MONTH_MODE_KNOWN,
  month: "2026-09",
  schemaSupportsTbd: false,
  tbdWriteEnabled: false,
});
assert("tbd known state ok view", tbdKnownBlocked.ok === true);
if (tbdKnownBlocked.ok) {
  assert("tbd known display 日付未定", tbdKnownBlocked.value.display === "日付未定");
  assert("tbd known date null", tbdKnownBlocked.value.date === null);
  assert("tbd known write blocked flags false", tbdKnownBlocked.value.writeAllowed === false);
}

const tbdKnownOneFlag = resolveScheduleAdminDateState({
  operation: "create",
  dateStatus: "tbd",
  tbdMonthMode: "month-known",
  month: "2026-09",
  schemaSupportsTbd: true,
  tbdWriteEnabled: false,
});
assert("tbd one flag only blocked", tbdKnownOneFlag.ok && tbdKnownOneFlag.value.writeAllowed === false);

const tbdKnownOtherFlag = resolveScheduleAdminDateState({
  operation: "create",
  dateStatus: "tbd",
  tbdMonthMode: "month-known",
  month: "2026-09",
  schemaSupportsTbd: false,
  tbdWriteEnabled: true,
});
assert("tbd other flag only blocked", tbdKnownOtherFlag.ok && tbdKnownOtherFlag.value.writeAllowed === false);

const tbdKnownArmed = resolveScheduleAdminDateState({
  operation: "create",
  dateStatus: "tbd",
  tbdMonthMode: "month-known",
  month: "2026-09",
  schemaSupportsTbd: true,
  tbdWriteEnabled: true,
});
assert("tbd known armed writeAllowed", tbdKnownArmed.ok && tbdKnownArmed.value.writeAllowed === true);

const tbdUnknownNeedsExplicit = resolveScheduleAdminDateState({
  operation: "create",
  dateStatus: "tbd",
  month: null,
  schemaSupportsTbd: true,
  tbdWriteEnabled: true,
});
assert("tbd unknown without mode fails", tbdUnknownNeedsExplicit.ok === false);

const tbdUnknown = resolveScheduleAdminDateState({
  operation: "create",
  dateStatus: "tbd",
  tbdMonthMode: SCHEDULE_TBD_MONTH_MODE_UNKNOWN,
  schemaSupportsTbd: true,
  tbdWriteEnabled: true,
});
assert("tbd unknown ok", tbdUnknown.ok === true);
if (tbdUnknown.ok) {
  assert("tbd unknown display 日程未定", tbdUnknown.value.display === "日程未定");
  assert("tbd unknown hub-only", tbdUnknown.value.monthMembership.kind === "hub-only");
}

// edit date forbidden
const editDateChange = resolveScheduleAdminDateState({
  operation: SCHEDULE_ADMIN_DATE_OPERATION_UPDATE,
  dateStatus: "confirmed",
  date: "2026-09-10",
  existingDate: "2026-09-03",
  existingMonth: "2026-09",
});
assert("edit date change fail-closed", editDateChange.ok === false);

const editDateKeep = resolveScheduleAdminDateState({
  operation: "update",
  dateStatus: "confirmed",
  date: "2026-09-03",
  existingDate: "2026-09-03",
  existingMonth: "2026-09",
});
assert("edit date keep ok", editDateKeep.ok === true);
if (editDateKeep.ok) {
  assert("edit date input disabled", editDateKeep.value.dateInputEnabled === false);
}

// mutation
const mutableState = {
  operation: "create",
  dateStatus: "confirmed",
  date: "2026-08-01",
};
const beforeState = JSON.stringify(mutableState);
resolveScheduleAdminDateState(mutableState);
assert("admin state input not mutated", JSON.stringify(mutableState) === beforeState);

// sentinel tbd+date
assert(
  "tbd + date fail-closed",
  resolveScheduleAdminDateState({
    operation: "create",
    dateStatus: "tbd",
    tbdMonthMode: "month-known",
    date: "2026-09-01",
    month: "2026-09",
    schemaSupportsTbd: true,
    tbdWriteEnabled: true,
  }).ok === false,
);

// --- legacy payload deep equality (shell write = dryRunFormInputToWritePayload) ---
function legacyDryRunWritePayload(form) {
  return {
    date: form.date.trim(),
    title: form.title.trim() || null,
    venue: form.venue.trim() || null,
    open_time: form.open_time.trim() || null,
    start_time: form.start_time.trim() || null,
    price: form.price.trim() || null,
    description: form.description.trim() || null,
    published: form.published,
    show_on_home: form.show_on_home,
    home_order: form.home_order,
    sort_order: form.sort_order ?? 0,
  };
}

const formCreate = {
  date: "2026-09-03",
  title: " Warm-up ",
  venue: " Hall ",
  open_time: "18:00",
  start_time: "19:00",
  price: "¥3,000",
  description: " desc ",
  published: false,
  show_on_home: false,
  home_order: null,
  sort_order: 10,
};
const expectedCreate = legacyDryRunWritePayload(formCreate);
const legacyCreate = buildScheduleTbdSavePayload({
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_LEGACY_CONFIRMED,
  operation: "create",
  payloadShape: "shell-write",
  dateStatus: "confirmed",
  ...formCreate,
});
assert("legacy create ok", legacyCreate.ok === true);
if (legacyCreate.ok) {
  deepEqual("legacy confirmed create payload deep equality", legacyCreate.value.payload, expectedCreate);
  assert("legacy create has no date_status", !("date_status" in legacyCreate.value.payload));
  deepEqual(
    "legacy month route fields",
    legacyCreate.value.monthFields,
    deriveScheduleMonthRouteFields("2026-09"),
  );
}

const legacyUpdate = buildScheduleTbdSavePayload({
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_LEGACY_CONFIRMED,
  operation: "update",
  payloadShape: "shell-write",
  dateStatus: "confirmed",
  date: "2026-09-03",
  existingDate: "2026-09-03",
  title: "T",
  venue: "V",
  open_time: "",
  start_time: "",
  price: "",
  description: "",
  published: true,
  show_on_home: false,
  home_order: null,
  sort_order: 1,
  expectedBeforeUpdatedAt: "2026-06-14T15:03:08.762993+00:00",
});
assert("legacy update ok", legacyUpdate.ok === true);
if (legacyUpdate.ok) {
  assert("legacy update no date field", !("date" in legacyUpdate.value.payload));
  assert("legacy update no date_status", !("date_status" in legacyUpdate.value.payload));
  assert(
    "legacy update lock retained",
    legacyUpdate.value.payload.expectedBeforeUpdatedAt ===
      "2026-06-14T15:03:08.762993+00:00",
  );
}

const legacyUpdateNoLock = buildScheduleTbdSavePayload({
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_LEGACY_CONFIRMED,
  operation: "update",
  dateStatus: "confirmed",
  date: "2026-09-03",
  existingDate: "2026-09-03",
  title: "T",
  published: true,
});
assert("legacy update missing lock fails", legacyUpdateNoLock.ok === false);

const edgeCreate = buildScheduleTbdSavePayload({
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_LEGACY_CONFIRMED,
  operation: "create",
  payloadShape: "edge-create",
  dateStatus: "confirmed",
  date: "2026-09-03",
  title: "Event",
  venue: "Hall",
  open_time: "18:00",
  start_time: "19:00",
  price: "¥1",
  description: "d",
  published: false,
});
assert("legacy edge create ok", edgeCreate.ok === true);
if (edgeCreate.ok) {
  deepEqual("legacy edge create payload", edgeCreate.value.payload, {
    date: "2026-09-03",
    title: "Event",
    venue: "Hall",
    open_time: "18:00",
    start_time: "19:00",
    price: "¥1",
    description: "d",
    published: false,
  });
  assert("edge create no date_status", !("date_status" in edgeCreate.value.payload));
}

const edgeEdit = buildScheduleTbdSavePayload({
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_LEGACY_CONFIRMED,
  operation: "update",
  payloadShape: "edge-edit",
  dateStatus: "confirmed",
  existingDate: "2026-09-03",
  id: "uuid-1",
  title: "E",
  venue: "V",
  open_time: "",
  start_time: "",
  price: "",
  description: "",
  published: true,
  expectedBeforeUpdatedAt: "2026-01-01T00:00:00.000Z",
});
assert("legacy edge edit ok", edgeEdit.ok === true);
if (edgeEdit.ok) {
  assert("edge edit no date", !("date" in edgeEdit.value.payload));
  assert(
    "edge edit lock",
    edgeEdit.value.payload.expectedBeforeUpdatedAt === "2026-01-01T00:00:00.000Z",
  );
}

// schema unprepared cannot build tbd-v1 TBD payload
const tbdPayloadBlocked = buildScheduleTbdSavePayload({
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
  operation: "create",
  dateStatus: "tbd",
  tbdMonthMode: "month-known",
  month: "2026-09",
  schemaSupportsTbd: false,
  tbdWriteEnabled: false,
  title: "TBD",
  published: false,
});
assert("tbd-v1 blocked without flags", tbdPayloadBlocked.ok === false);

const tbdPayloadOneFlag = buildScheduleTbdSavePayload({
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
  operation: "create",
  dateStatus: "tbd",
  tbdMonthMode: "month-known",
  month: "2026-09",
  schemaSupportsTbd: true,
  tbdWriteEnabled: false,
  title: "TBD",
  published: false,
});
assert("tbd-v1 blocked one flag", tbdPayloadOneFlag.ok === false);

// tbd-v1 confirmed
const tbdV1Confirmed = buildScheduleTbdSavePayload({
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
  operation: "create",
  dateStatus: "confirmed",
  date: "2026-09-03",
  schemaSupportsTbd: true,
  tbdWriteEnabled: true,
  title: "C",
  venue: null,
  published: false,
  show_on_home: false,
  home_order: null,
  sort_order: 10,
});
assert("tbd-v1 confirmed ok", tbdV1Confirmed.ok === true);
if (tbdV1Confirmed.ok) {
  assert("tbd-v1 confirmed date_status", tbdV1Confirmed.value.payload.date_status === "confirmed");
  assert("tbd-v1 confirmed date", tbdV1Confirmed.value.payload.date === "2026-09-03");
  assert("tbd-v1 confirmed month", tbdV1Confirmed.value.payload.month === "2026-09");
  assert(
    "tbd-v1 confirmed source_route",
    tbdV1Confirmed.value.payload.source_route === "/schedule/2026-09/",
  );
}

const tbdV1Known = buildScheduleTbdSavePayload({
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
  operation: "create",
  dateStatus: "tbd",
  tbdMonthMode: "month-known",
  month: "2026-09",
  schemaSupportsTbd: true,
  tbdWriteEnabled: true,
  title: "TBD known",
  published: true,
  show_on_home: false,
  home_order: null,
  sort_order: 5,
});
assert("tbd-v1 month-known ok", tbdV1Known.ok === true);
if (tbdV1Known.ok) {
  assert("tbd-v1 known date null", tbdV1Known.value.payload.date === null);
  assert("tbd-v1 known date_status tbd", tbdV1Known.value.payload.date_status === "tbd");
  assert("tbd-v1 known month", tbdV1Known.value.payload.month === "2026-09");
  assert(
    "tbd-v1 known source_route",
    tbdV1Known.value.payload.source_route === "/schedule/2026-09/",
  );
}

const tbdV1Unknown = buildScheduleTbdSavePayload({
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
  operation: "create",
  dateStatus: "tbd",
  tbdMonthMode: "month-unknown",
  schemaSupportsTbd: true,
  tbdWriteEnabled: true,
  title: "TBD unknown",
  published: false,
});
assert("tbd-v1 month-unknown ok", tbdV1Unknown.ok === true);
if (tbdV1Unknown.ok) {
  assert("tbd-v1 unknown month null", tbdV1Unknown.value.payload.month === null);
  assert("tbd-v1 unknown source_route null", tbdV1Unknown.value.payload.source_route === null);
}

const tbdV1Update = buildScheduleTbdSavePayload({
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
  operation: "update",
  dateStatus: "confirmed",
  existingDate: "2026-09-03",
  schemaSupportsTbd: true,
  tbdWriteEnabled: true,
  title: "U",
  published: true,
  expectedBeforeUpdatedAt: "2026-06-14T15:03:08.762993+00:00",
});
assert("tbd-v1 update ok", tbdV1Update.ok === true);
if (tbdV1Update.ok) {
  assert("tbd-v1 update no date field", !("date" in tbdV1Update.value.payload) || tbdV1Update.value.payload.date == null);
  // confirmed update should not carry date
  assert(
    "tbd-v1 confirmed update omits date key",
    !Object.prototype.hasOwnProperty.call(tbdV1Update.value.payload, "date"),
  );
  assert(
    "tbd-v1 update lock",
    tbdV1Update.value.payload.expectedBeforeUpdatedAt ===
      "2026-06-14T15:03:08.762993+00:00",
  );
}

// old payload compatibility
const coerceOk = coerceScheduleDateFieldsFromLegacyPayload({
  date: "2026-08-15",
  title: "x",
});
assert("coerce legacy omit status + date → confirmed", coerceOk.ok && coerceOk.dateStatus === "confirmed");
const coerceFail = coerceScheduleDateFieldsFromLegacyPayload({ title: "x" });
assert("coerce legacy omit status + no date fail", coerceFail.ok === false);

// unknown field / mutation
assert(
  "payload unknown field fails",
  buildScheduleTbdSavePayload({
    mode: SCHEDULE_SAVE_PAYLOAD_MODE_LEGACY_CONFIRMED,
    operation: "create",
    date: "2026-09-03",
    title: "t",
    published: false,
    hack: 1,
  }).ok === false,
);
const mutPayload = {
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_LEGACY_CONFIRMED,
  operation: "create",
  date: "2026-09-03",
  title: "t",
  published: false,
};
const beforePayload = JSON.stringify(mutPayload);
buildScheduleTbdSavePayload(mutPayload);
assert("payload input not mutated", JSON.stringify(mutPayload) === beforePayload);

assert(
  "legacy rejects tbd",
  buildScheduleTbdSavePayload({
    mode: SCHEDULE_SAVE_PAYLOAD_MODE_LEGACY_CONFIRMED,
    operation: "create",
    dateStatus: "tbd",
    tbdMonthMode: "month-known",
    month: "2026-09",
    schemaSupportsTbd: true,
    tbdWriteEnabled: true,
    title: "x",
    published: false,
  }).ok === false,
);

// --- regressions ---
const baselineRun = spawnSync(
  process.execPath,
  ["scripts/verify-cms-core-v2-gosaki-site-generator-hooks-html-baseline.mjs"],
  { cwd: TOOL_ROOT, encoding: "utf8" },
);
assert("Gosaki HTML baseline exit 0", baselineRun.status === 0);
assert(
  "Gosaki HTML baseline ≥81 PASS",
  /(?:81|8[2-9]|9\d|\d{3,}) passed, 0 failed/.test(baselineRun.stdout || ""),
);

const mioRun = spawnSync(
  process.execPath,
  ["scripts/verify-cms-core-v2-mio-schedule-read-render.mjs"],
  { cwd: TOOL_ROOT, encoding: "utf8" },
);
assert("Mio schedule read-render PASS", mioRun.status === 0);

const contactRun = spawnSync(
  process.execPath,
  ["scripts/verify-cms-core-v2-external-form-provider-hubspot-completion-audit.mjs"],
  { cwd: TOOL_ROOT, encoding: "utf8" },
);
assert(
  "Contact HubSpot completion audit PASS",
  contactRun.status === 0 && /RESULT PASS/.test(contactRun.stdout || ""),
);

const suiteSrc = fs.readFileSync(SUITE, "utf8");
const pkg = JSON.parse(fs.readFileSync(PKG, "utf8"));
const npm = "verify:cms-core-v2-schedule-tbd-admin-state-save-payload-helpers";
assert("npm script registered", Boolean(pkg.scripts?.[npm]));
assert(
  "Safety Suite registers admin-state-save-payload-helpers",
  /schedule-tbd-admin-state-save-payload-helpers/.test(suiteSrc),
);
assert(
  "planning notes helpers phase id",
  /cms-core-v2-schedule-tbd-admin-state-save-payload-helpers/.test(
    fs.readFileSync(PLANNING, "utf8"),
  ),
);

cleanupTemp();
assert("temp cleanup removed", !fs.existsSync(tempOut));

console.log(`\nRESULT ${failed === 0 ? "PASS" : "FAIL"} passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
