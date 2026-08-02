/**
 * CMS Core v2 — Schedule TBD Admin UI connect (offline).
 *
 * npm: verify:cms-core-v2-schedule-tbd-admin-ui-connect
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  resolveScheduleAdminDateState,
  isExactTrue,
} from "./lib/schedule-admin-date-state.mjs";
import {
  SCHEDULE_DATE_DISPLAY_TBD_MONTH_KNOWN,
  SCHEDULE_DATE_DISPLAY_TBD_MONTH_UNKNOWN,
} from "./lib/schedule-date-contract.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const DOC = path.join(TOOL_ROOT, "docs/cms-core-v2-schedule-tbd-admin-ui-connect.md");
const HELPER = path.join(TOOL_ROOT, "scripts/lib/schedule-admin-date-state.mjs");
const UI_TS = path.join(REPO_ROOT, "src/lib/admin/staging-data/schedule-tbd-admin-ui.ts");
const OPERATOR_UI = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts",
);
const OPERATOR_ASTRO = path.join(
  TOOL_ROOT,
  "templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro",
);
const SAVE_PAYLOAD = path.join(TOOL_ROOT, "scripts/lib/schedule-tbd-save-payload.mjs");
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

assert("phase doc exists", fs.existsSync(DOC));
assert("helper exists", fs.existsSync(HELPER));
assert("UI module exists", fs.existsSync(UI_TS));
assert("operator UI exists", fs.existsSync(OPERATOR_UI));
assert("operator Astro exists", fs.existsSync(OPERATOR_ASTRO));

const helperSrc = fs.readFileSync(HELPER, "utf8");
const uiSrc = fs.readFileSync(UI_TS, "utf8");
const operatorSrc = fs.readFileSync(OPERATOR_UI, "utf8");
const astroSrc = fs.readFileSync(OPERATOR_ASTRO, "utf8");
const payloadSrc = fs.readFileSync(SAVE_PAYLOAD, "utf8");
const edgeSrc = fs.existsSync(EDGE) ? fs.readFileSync(EDGE, "utf8") : "";

assert("helper has tbdAdminUiEnabled", /tbdAdminUiEnabled/.test(helperSrc));
assert("helper has tbdAdminUiVisible", /tbdAdminUiVisible/.test(helperSrc));
assert("UI imports schedule-admin-date-state", /schedule-admin-date-state\.mjs/.test(uiSrc));
assert("UI does not import save-payload runtime wire", !/schedule-tbd-save-payload/.test(uiSrc));
assert("operator wires schedule-tbd-admin-ui", /schedule-tbd-admin-ui/.test(operatorSrc));
assert("operator blocks TBD save", /TBD保存はまだ有効化されていません/.test(operatorSrc));
assert("astro has date-status panel", /gosaki-add-date-status-panel/.test(astroSrc));
assert("astro has edit date-status panel", /gosaki-edit-date-status-panel/.test(astroSrc));
assert("astro injects TBD UI config JSON", /SCHEDULE_TBD_ADMIN_UI_CONFIG_ELEMENT_ID/.test(astroSrc));
assert("exact true helper", isExactTrue(true) === true && isExactTrue("true") === false);

// capability via resolveScheduleAdminDateState
const hidden = resolveScheduleAdminDateState({
  dateStatus: "confirmed",
  date: "2026-08-15",
  month: "2026-08",
  operation: "create",
  schemaSupportsTbd: false,
  tbdAdminUiEnabled: false,
  tbdWriteEnabled: false,
});
assert("unset capability state ok", hidden.ok === true);
if (hidden.ok) {
  assert("unset UI not visible", hidden.value.tbdAdminUiVisible === false);
}

const stringTrue = resolveScheduleAdminDateState({
  dateStatus: "confirmed",
  date: "2026-08-15",
  month: "2026-08",
  operation: "create",
  schemaSupportsTbd: "true",
  tbdAdminUiEnabled: "true",
  tbdWriteEnabled: false,
});
assert("string true not visible", stringTrue.ok && stringTrue.value.tbdAdminUiVisible === false);

const staged = resolveScheduleAdminDateState({
  dateStatus: "confirmed",
  date: "2026-08-15",
  month: "2026-08",
  operation: "create",
  schemaSupportsTbd: true,
  tbdAdminUiEnabled: true,
  tbdWriteEnabled: false,
});
assert("exact true UI visible", staged.ok && staged.value.tbdAdminUiVisible === true);

const confirmedDraft = resolveScheduleAdminDateState({
  dateStatus: "confirmed",
  date: "",
  operation: "create",
  schemaSupportsTbd: true,
  tbdAdminUiEnabled: true,
  tbdWriteEnabled: false,
});
assert("confirmed empty draft ok", confirmedDraft.ok === true);
if (confirmedDraft.ok) {
  assert("confirmed empty date enabled", confirmedDraft.value.dateInputEnabled === true);
  assert("confirmed empty date required", confirmedDraft.value.dateInputRequired === true);
  assert("confirmed empty write blocked", confirmedDraft.value.writeAllowed === false);
}

const tbdKnownDraft = resolveScheduleAdminDateState({
  dateStatus: "tbd",
  tbdMonthMode: "month-known",
  month: "",
  operation: "create",
  schemaSupportsTbd: true,
  tbdAdminUiEnabled: true,
  tbdWriteEnabled: false,
});
assert("tbd known empty month ok", tbdKnownDraft.ok === true);
if (tbdKnownDraft.ok) {
  assert(
    "tbd known empty month display",
    tbdKnownDraft.value.display === SCHEDULE_DATE_DISPLAY_TBD_MONTH_KNOWN,
  );
  assert("tbd known empty month enabled", tbdKnownDraft.value.monthInputEnabled === true);
  assert("tbd known empty month required", tbdKnownDraft.value.monthInputRequired === true);
}

const tbdKnown = resolveScheduleAdminDateState({
  dateStatus: "tbd",
  tbdMonthMode: "month-known",
  month: "2026-09",
  operation: "create",
  schemaSupportsTbd: true,
  tbdAdminUiEnabled: true,
  tbdWriteEnabled: false,
});
assert("tbd known ok", tbdKnown.ok === true);
if (tbdKnown.ok) {
  assert("tbd known display", tbdKnown.value.display === SCHEDULE_DATE_DISPLAY_TBD_MONTH_KNOWN);
  assert("tbd known date disabled", tbdKnown.value.dateInputEnabled === false);
  assert("tbd known month enabled", tbdKnown.value.monthInputEnabled === true);
  assert("tbd known write blocked", tbdKnown.value.writeAllowed === false);
}

const tbdUnknown = resolveScheduleAdminDateState({
  dateStatus: "tbd",
  tbdMonthMode: "month-unknown",
  operation: "create",
  schemaSupportsTbd: true,
  tbdAdminUiEnabled: true,
  tbdWriteEnabled: false,
});
assert("tbd unknown ok", tbdUnknown.ok === true);
if (tbdUnknown.ok) {
  assert(
    "tbd unknown display",
    tbdUnknown.value.display === SCHEDULE_DATE_DISPLAY_TBD_MONTH_UNKNOWN,
  );
  assert("tbd unknown month disabled", tbdUnknown.value.monthInputEnabled === false);
}

const invalid = resolveScheduleAdminDateState({
  dateStatus: "tbd",
  date: "2026-08-01",
  tbdMonthMode: "month-known",
  month: "2026-08",
  operation: "create",
  schemaSupportsTbd: true,
  tbdAdminUiEnabled: true,
  tbdWriteEnabled: false,
});
assert("invalid tbd+date fail-closed", invalid.ok === false);

assert(
  "UI capability production STOP",
  /SARISWING_PRODUCTION_PROJECT_REF/.test(uiSrc) && /productionBlocked/.test(uiSrc),
);
assert(
  "operator does not call buildScheduleTbdSavePayload",
  !/buildScheduleTbdSavePayload|schedule-tbd-save-payload/.test(operatorSrc),
);
assert("save payload helper file unchanged presence", fs.existsSync(SAVE_PAYLOAD));
assert("edge handler unchanged presence", fs.existsSync(EDGE));
assert(
  "edge still no TBD Admin UI wire",
  !/tbdAdminUiEnabled|schedule-tbd-admin-ui/.test(edgeSrc),
);

const pkg = JSON.parse(fs.readFileSync(PKG, "utf8"));
const npm = "verify:cms-core-v2-schedule-tbd-admin-ui-connect";
assert("npm script registered", Boolean(pkg.scripts?.[npm]));
const suiteSrc = fs.readFileSync(SUITE, "utf8");
assert("Safety Suite registers admin-ui-connect", /schedule-tbd-admin-ui-connect/.test(suiteSrc));

const baseline = spawnSync(
  process.execPath,
  ["scripts/verify-cms-core-v2-gosaki-site-generator-hooks-html-baseline.mjs"],
  { cwd: TOOL_ROOT, encoding: "utf8" },
);
assert("Gosaki HTML baseline exit 0", baseline.status === 0, baseline.stderr || "");
assert(
  "Gosaki HTML baseline ≥81",
  /(?:81|8[2-9]|9\d|\d{3,}) passed, 0 failed/.test(baseline.stdout || ""),
);

console.log(`\nRESULT ${failed === 0 ? "PASS" : "FAIL"} passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
