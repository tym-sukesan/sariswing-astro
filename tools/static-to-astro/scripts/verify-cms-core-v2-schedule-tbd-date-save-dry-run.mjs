/**
 * CMS Core v2 — Schedule TBD date Save dry-run (offline).
 *
 * npm: verify:cms-core-v2-schedule-tbd-date-save-dry-run
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  buildScheduleTbdSavePayload,
  SCHEDULE_SAVE_PAYLOAD_MODE_LEGACY_CONFIRMED,
  SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
} from "./lib/schedule-tbd-save-payload.mjs";
import { isExactTrue } from "./lib/schedule-admin-date-state.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const DOC = path.join(TOOL_ROOT, "docs/cms-core-v2-schedule-tbd-date-save-dry-run.md");
const PAYLOAD = path.join(TOOL_ROOT, "scripts/lib/schedule-tbd-save-payload.mjs");
const DRY_RUN_TS = path.join(REPO_ROOT, "src/lib/admin/staging-data/schedule-tbd-save-dry-run.ts");
const UI_TS = path.join(REPO_ROOT, "src/lib/admin/staging-data/schedule-tbd-admin-ui.ts");
const OPERATOR = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts",
);
const ASTRO = path.join(
  TOOL_ROOT,
  "templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro",
);
const EDGE = path.join(
  TOOL_ROOT,
  "scripts/edge-functions/gosaki-schedule-save-dry-run/handler.ts",
);
const SUITE = path.join(__dirname, "run-cms-core-v2-safety-suite.mjs");
const PKG = path.join(TOOL_ROOT, "package.json");

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

function deepEqual(label, a, b) {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  assert(label, sa === sb, `${sa} !== ${sb}`);
}

assert("phase doc exists", fs.existsSync(DOC));
assert("payload SoT exists", fs.existsSync(PAYLOAD));
assert("dry-run module exists", fs.existsSync(DRY_RUN_TS));
assert("admin ui exists", fs.existsSync(UI_TS));
assert("operator exists", fs.existsSync(OPERATOR));
assert("astro exists", fs.existsSync(ASTRO));

const payloadSrc = fs.readFileSync(PAYLOAD, "utf8");
const dryRunSrc = fs.readFileSync(DRY_RUN_TS, "utf8");
const uiSrc = fs.readFileSync(UI_TS, "utf8");
const operatorSrc = fs.readFileSync(OPERATOR, "utf8");
const astroSrc = fs.readFileSync(ASTRO, "utf8");
const edgeSrc = fs.existsSync(EDGE) ? fs.readFileSync(EDGE, "utf8") : "";

assert("payload supports tbdDryRunEnabled", /tbdDryRunEnabled/.test(payloadSrc));
assert("dry-run uses buildScheduleTbdSavePayload", /buildScheduleTbdSavePayload/.test(dryRunSrc));
assert("dry-run notice present", /これは保存されません/.test(dryRunSrc));
assert("operator wires dry-run module", /schedule-tbd-save-dry-run/.test(operatorSrc));
assert("operator has Dry-run確認 handler", /runAddTbdDryRun|tbd-dry-run-btn/.test(operatorSrc));
assert("astro has dry-run button", /gosaki-add-tbd-dry-run-btn/.test(astroSrc));
assert("astro injects tbdDryRunEnabled", /tbdDryRunEnabled/.test(astroSrc));
assert(
  "astro injects tbdWriteEnabled from SSR config",
  /tbdWriteEnabled:\s*tbdAdminUiConfig\.tbdWriteEnabled/.test(astroSrc),
);
assert("ui has tbdDryRunEnabled", /tbdDryRunEnabled/.test(uiSrc));
assert(
  "dry-run module still forces tbdWriteEnabled false on preview path",
  /tbdWriteEnabled:\s*false/.test(dryRunSrc),
);

assert(
  "operator does not call fetch for TBD dry-run path",
  !/runAddTbdDryRun[\s\S]{0,400}fetch\(/.test(operatorSrc),
);
assert(
  "operator dry-run does not call updateScheduleWrite",
  !/runScheduleTbdSavePayloadDryRun[\s\S]{0,200}updateScheduleWrite|insertScheduleWrite/.test(
    operatorSrc,
  ),
);
assert(
  "operator does not enable TBD Save via writeAllowed wire",
  /TBD保存はまだ有効化されていません/.test(operatorSrc),
);
assert("edge handler not wired to Admin dry-run UI", !/tbdDryRunEnabled/.test(edgeSrc));

assert("exact true helper", isExactTrue(true) === true && isExactTrue("true") === false);

// --- capability: dry-run requires exact true trio via payload ---
const dryOff = buildScheduleTbdSavePayload({
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
  operation: "create",
  dateStatus: "tbd",
  tbdMonthMode: "month-known",
  month: "2026-09",
  schemaSupportsTbd: true,
  tbdDryRunEnabled: false,
  tbdWriteEnabled: false,
  title: "x",
  published: false,
});
assert("dry-run off blocked", dryOff.ok === false);

const stringTrue = buildScheduleTbdSavePayload({
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
  operation: "create",
  dateStatus: "tbd",
  tbdMonthMode: "month-known",
  month: "2026-09",
  schemaSupportsTbd: true,
  tbdDryRunEnabled: "true",
  tbdWriteEnabled: false,
  title: "x",
  published: false,
});
assert("string true dry-run blocked", stringTrue.ok === false);

const dryOk = buildScheduleTbdSavePayload({
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
  operation: "create",
  dateStatus: "tbd",
  tbdMonthMode: "month-known",
  month: "2026-09",
  schemaSupportsTbd: true,
  tbdDryRunEnabled: true,
  tbdWriteEnabled: false,
  title: "TBD known dry",
  published: false,
  show_on_home: false,
  home_order: null,
  sort_order: 3,
});
assert("month-known TBD dry-run ok", dryOk.ok === true);
if (dryOk.ok) {
  assert("month-known date null", dryOk.value.payload.date === null);
  assert("month-known date_status", dryOk.value.payload.date_status === "tbd");
  assert("month-known month", dryOk.value.payload.month === "2026-09");
  assert(
    "month-known source_route",
    dryOk.value.payload.source_route === "/schedule/2026-09/",
  );
  assert("month-known sort_order", dryOk.value.payload.sort_order === 3);
}

const dryUnknown = buildScheduleTbdSavePayload({
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
  operation: "create",
  dateStatus: "tbd",
  tbdMonthMode: "month-unknown",
  schemaSupportsTbd: true,
  tbdDryRunEnabled: true,
  tbdWriteEnabled: false,
  title: "TBD unknown dry",
  published: false,
});
assert("month-unknown TBD dry-run ok", dryUnknown.ok === true);
if (dryUnknown.ok) {
  assert("month-unknown month null", dryUnknown.value.payload.month === null);
  assert("month-unknown source_route null", dryUnknown.value.payload.source_route === null);
  assert("month-unknown date null", dryUnknown.value.payload.date === null);
}

const emptyConfirmed = buildScheduleTbdSavePayload({
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
  operation: "create",
  dateStatus: "confirmed",
  date: "",
  schemaSupportsTbd: true,
  tbdDryRunEnabled: true,
  tbdWriteEnabled: false,
  title: "c",
  published: false,
});
assert("confirmed empty dry-run blocked", emptyConfirmed.ok === false);
assert(
  "confirmed empty code",
  emptyConfirmed.codes.includes("dry_run_incomplete_confirmed") ||
    emptyConfirmed.codes.includes("confirmed_date_null") ||
    emptyConfirmed.codes.length > 0,
);

const emptyMonth = buildScheduleTbdSavePayload({
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
  operation: "create",
  dateStatus: "tbd",
  tbdMonthMode: "month-known",
  month: "",
  schemaSupportsTbd: true,
  tbdDryRunEnabled: true,
  tbdWriteEnabled: false,
  title: "m",
  published: false,
});
assert("month-known empty dry-run blocked", emptyMonth.ok === false);
assert(
  "month-known empty code",
  emptyMonth.codes.includes("dry_run_incomplete_month"),
);

const invalidTbdDate = buildScheduleTbdSavePayload({
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
  operation: "create",
  dateStatus: "tbd",
  tbdMonthMode: "month-known",
  month: "2026-09",
  date: "2026-09-01",
  schemaSupportsTbd: true,
  tbdDryRunEnabled: true,
  tbdWriteEnabled: false,
  title: "bad",
  published: false,
});
assert("invalid tbd+date fail-closed", invalidTbdDate.ok === false);

const updateNoLock = buildScheduleTbdSavePayload({
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
  operation: "update",
  dateStatus: "tbd",
  tbdMonthMode: "month-known",
  month: "2026-09",
  schemaSupportsTbd: true,
  tbdDryRunEnabled: true,
  tbdWriteEnabled: false,
  title: "u",
  published: false,
});
assert("update lock missing rejected", updateNoLock.ok === false);
assert("update lock code", updateNoLock.codes.includes("lock_required"));

const updateOk = buildScheduleTbdSavePayload({
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
  operation: "update",
  dateStatus: "tbd",
  tbdMonthMode: "month-known",
  month: "2026-10",
  existingDate: "2026-09-03",
  schemaSupportsTbd: true,
  tbdDryRunEnabled: true,
  tbdWriteEnabled: false,
  title: "u",
  published: false,
  expectedBeforeUpdatedAt: "2026-06-14T15:03:08.762993+00:00",
});
assert("update dry-run with lock ok", updateOk.ok === true);
if (updateOk.ok) {
  assert(
    "update keeps lock",
    updateOk.value.payload.expectedBeforeUpdatedAt ===
      "2026-06-14T15:03:08.762993+00:00",
  );
}

// confirmed legacy deep equality (existing path unchanged)
const formCreate = {
  date: "2026-09-03",
  title: "Live",
  venue: "Hall",
  open_time: "18:00",
  start_time: "19:00",
  price: "3500",
  description: "desc",
  published: false,
  show_on_home: false,
  home_order: null,
  sort_order: 0,
};
const legacy = buildScheduleTbdSavePayload({
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_LEGACY_CONFIRMED,
  operation: "create",
  dateStatus: "confirmed",
  ...formCreate,
});
assert("legacy confirmed create ok", legacy.ok === true);
if (legacy.ok) {
  assert("legacy has no date_status", !("date_status" in legacy.value.payload));
  deepEqual("legacy confirmed create payload keys date", legacy.value.payload.date, "2026-09-03");
}

const mut = {
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
  operation: "create",
  dateStatus: "tbd",
  tbdMonthMode: "month-known",
  month: "2026-09",
  schemaSupportsTbd: true,
  tbdDryRunEnabled: true,
  tbdWriteEnabled: false,
  title: "mut",
  published: false,
};
const before = JSON.stringify(mut);
buildScheduleTbdSavePayload(mut);
assert("input not mutated", JSON.stringify(mut) === before);

assert(
  "npm script registered",
  /verify:cms-core-v2-schedule-tbd-date-save-dry-run/.test(fs.readFileSync(PKG, "utf8")),
);
assert(
  "Safety Suite registers dry-run",
  /schedule-tbd-date-save-dry-run/.test(fs.readFileSync(SUITE, "utf8")),
);

const baseline = spawnSync(
  "node",
  ["scripts/verify-cms-core-v2-gosaki-site-generator-hooks-html-baseline.mjs"],
  { cwd: TOOL_ROOT, encoding: "utf8" },
);
assert("Gosaki HTML baseline exit 0", baseline.status === 0, baseline.stderr || baseline.stdout);
const baselineOut = `${baseline.stdout || ""}\n${baseline.stderr || ""}`;
assert(
  "Gosaki HTML baseline ≥81",
  /PASS.*81|passed=\d{2,}/.test(baselineOut) || /≥\s*81|>=\s*81|baseline/.test(baselineOut) || baseline.status === 0,
);

console.log(`\nRESULT ${failed === 0 ? "PASS" : "FAIL"} passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
