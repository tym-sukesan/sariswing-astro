/**
 * CMS Core v2 — Schedule TBD date_status read-wiring (offline).
 *
 * Proves SELECT capability split, normalize/membership/sort wiring,
 * Mio synthetic TBD fixtures, and Gosaki confirmed HTML stability.
 *
 * npm: verify:cms-core-v2-schedule-tbd-date-status-read-wiring
 * Offline only — no live SELECT registration in Safety Suite.
 */

import assertNode from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { removeGeneratedOutputDir } from "./lib/safe-output-cleanup.mjs";
import {
  BASELINE_BASE_URL,
  BASELINE_DEPLOY_BASE,
  BASELINE_SCHEDULE_BUNDLE,
} from "./lib/cms-core-v2-gosaki-site-generator-hooks-html-baseline-fixtures.mjs";
import { applyGosakiScheduleDataPages } from "./lib/gosaki-schedule-data-pages.mjs";
import {
  SCHEDULE_DATE_DISPLAY_TBD_MONTH_KNOWN,
  SCHEDULE_DATE_DISPLAY_TBD_MONTH_UNKNOWN,
  SCHEDULE_DATE_STATUS_CONFIRMED,
  SCHEDULE_DATE_STATUS_TBD,
} from "./lib/schedule-date-contract.mjs";
import {
  PRODUCTION_REF_STOP,
  STAGING_PROJECT_REF,
  STAGING_SUPABASE_URL,
} from "./lib/supabase-staging-ref-utils.mjs";
import {
  SCHEDULE_SELECT,
  SCHEDULE_SELECT_LEGACY,
  SCHEDULE_SELECT_MODE_LEGACY,
  SCHEDULE_SELECT_MODE_TBD_V1,
  SCHEDULE_SELECT_TBD_V1,
  compareScheduleRecords,
  isSchemaSupportsTbdRead,
  normalizeScheduleRecord,
  resolveScheduleSelectClause,
  resolveSchemaSupportsTbdReadForSupabaseUrl,
  scheduleBelongsOnHub,
  scheduleBelongsToMonthPage,
  sortScheduleRecords,
} from "./lib/supabase-schedule-read.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const TEMP_OUT_REL = "output/_cms-core-v2-schedule-tbd-date-status-read-wiring-tmp";
const READ_CORE = path.join(__dirname, "lib/supabase-schedule-read.mjs");
const ADMIN_STATE = path.join(__dirname, "lib/schedule-admin-date-state.mjs");
const SAVE_PAYLOAD = path.join(__dirname, "lib/schedule-tbd-save-payload.mjs");
const EDGE_HANDLER = path.join(
  TOOL_ROOT,
  "scripts/edge-functions/gosaki-schedule-save-dry-run/handler.ts",
);
const MIO_SCHEDULES = path.join(TOOL_ROOT, "fixtures/mio-kisaragi-jazz-data/schedules.json");
const DOC = path.join(TOOL_ROOT, "docs/cms-core-v2-schedule-tbd-date-status-read-wiring.md");
const SUITE = path.join(__dirname, "run-cms-core-v2-safety-suite.mjs");
const PKG = path.join(TOOL_ROOT, "package.json");
const FIXTURE_MONTH = path.join(
  TOOL_ROOT,
  "fixtures/cms-core-v2-gosaki-site-generator-hooks-html-baseline/schedule-month-2026-08.astro",
);

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

const coreSrc = fs.readFileSync(READ_CORE, "utf8");
const adminSrc = fs.readFileSync(ADMIN_STATE, "utf8");
const payloadSrc = fs.readFileSync(SAVE_PAYLOAD, "utf8");

// --- SELECT capability ---
assert("legacy SELECT omits date_status", !/\bdate_status\b/.test(SCHEDULE_SELECT_LEGACY));
assert("default SCHEDULE_SELECT is legacy", SCHEDULE_SELECT === SCHEDULE_SELECT_LEGACY);
assert("TBD v1 SELECT includes date_status", /\bdate_status\b/.test(SCHEDULE_SELECT_TBD_V1));
assert("exact true capability", isSchemaSupportsTbdRead(true) === true);
assert("string true invalid", isSchemaSupportsTbdRead("true") === false);
assert("missing capability false", isSchemaSupportsTbdRead(undefined) === false);
assert("false capability false", isSchemaSupportsTbdRead(false) === false);

const legacyUnset = resolveScheduleSelectClause({
  supabaseUrl: STAGING_SUPABASE_URL,
});
assert("unset → legacy", legacyUnset.mode === SCHEDULE_SELECT_MODE_LEGACY);
assert("unset select legacy", legacyUnset.select === SCHEDULE_SELECT_LEGACY);

const legacyStringTrue = resolveScheduleSelectClause({
  schemaSupportsTbdRead: "true",
  supabaseUrl: STAGING_SUPABASE_URL,
});
assert("string true → legacy", legacyStringTrue.mode === SCHEDULE_SELECT_MODE_LEGACY);

const tbdStaging = resolveScheduleSelectClause({
  schemaSupportsTbdRead: true,
  supabaseUrl: STAGING_SUPABASE_URL,
});
assert("exact true staging → tbd-v1", tbdStaging.mode === SCHEDULE_SELECT_MODE_TBD_V1);
assert("exact true staging select TBD", tbdStaging.select === SCHEDULE_SELECT_TBD_V1);

assert(
  "staging URL arms capability helper",
  resolveSchemaSupportsTbdReadForSupabaseUrl(STAGING_SUPABASE_URL) === true,
);
assert(
  "production URL never arms capability helper",
  resolveSchemaSupportsTbdReadForSupabaseUrl(
    `https://${PRODUCTION_REF_STOP}.supabase.co`,
  ) === false,
);

let productionArmedThrew = false;
try {
  resolveScheduleSelectClause({
    schemaSupportsTbdRead: true,
    supabaseUrl: `https://${PRODUCTION_REF_STOP}.supabase.co`,
  });
} catch (err) {
  productionArmedThrew = /STOP|production/i.test(String(err?.message ?? err));
}
assert("production + exact true STOP", productionArmedThrew);

const productionUnset = resolveScheduleSelectClause({
  schemaSupportsTbdRead: false,
  supabaseUrl: `https://${PRODUCTION_REF_STOP}.supabase.co`,
});
assert("production unset → legacy", productionUnset.mode === SCHEDULE_SELECT_MODE_LEGACY);

let unknownArmedThrew = false;
try {
  resolveScheduleSelectClause({
    schemaSupportsTbdRead: true,
    supabaseUrl: "https://example.invalid.supabase.co",
  });
} catch (err) {
  unknownArmedThrew = /STOP|staging/i.test(String(err?.message ?? err));
}
assert("unknown + exact true STOP", unknownArmedThrew);

assert(
  "no hardcoded .select(...date_status)",
  !/\.select\([^)]*date_status/.test(coreSrc),
);
assert("core imports staging-ref utils", /supabase-staging-ref-utils/.test(coreSrc));
assert("core uses STAGING_PROJECT_REF symbol", /STAGING_PROJECT_REF/.test(coreSrc));
assert("core uses PRODUCTION_REF_STOP symbol", /PRODUCTION_REF_STOP/.test(coreSrc));

// --- normalize: legacy confirmed ---
const legacyRow = {
  legacy_id: "legacy-1",
  date: "2026-08-15",
  month: "2026-08",
  year: 2026,
  sort_order: 2,
  source_route: "/schedule/2026-08/",
  published: true,
};
const legacyNorm = normalizeScheduleRecord(legacyRow);
assert("legacy → confirmed status", legacyNorm.dateStatus === SCHEDULE_DATE_STATUS_CONFIRMED);
assert("legacy date kept", legacyNorm.date === "2026-08-15");
assert("legacy dateDisplay", legacyNorm.dateDisplay === "2026.08.15 (Sat)");
assert("legacy date_display", legacyNorm.date_display === legacyNorm.dateDisplay);
assert("legacy monthMembership month-page", legacyNorm.monthMembership?.kind === "month-page");
assert("legacy dateContract present", legacyNorm.dateContract?.dateStatus === "confirmed");

const explicitConfirmed = normalizeScheduleRecord({
  ...legacyRow,
  date_status: "confirmed",
});
assert("explicit confirmed ok", explicitConfirmed.dateStatus === "confirmed");

// --- month-known TBD ---
const tbdKnown = normalizeScheduleRecord({
  legacy_id: "tbd-known",
  date: null,
  month: "2026-09",
  year: 2026,
  sort_order: 5,
  date_status: "tbd",
  published: true,
  source_route: "/schedule/2026-09/",
});
assert("tbd known status", tbdKnown.dateStatus === SCHEDULE_DATE_STATUS_TBD);
assert("tbd known date null", tbdKnown.date === null);
assert("tbd known month", tbdKnown.month === "2026-09");
assert("tbd known display 日付未定", tbdKnown.dateDisplay === SCHEDULE_DATE_DISPLAY_TBD_MONTH_KNOWN);
assert("tbd known membership month-page", tbdKnown.monthMembership?.kind === "month-page");
assert("tbd known hub", scheduleBelongsOnHub(tbdKnown) === true);
assert("tbd known on Sept", scheduleBelongsToMonthPage(tbdKnown, "2026-09") === true);
assert("tbd known not on Aug", scheduleBelongsToMonthPage(tbdKnown, "2026-08") === false);

// --- month-unknown TBD ---
const tbdUnknown = normalizeScheduleRecord({
  legacy_id: "tbd-unknown",
  date: null,
  month: null,
  date_status: "tbd",
  sort_order: 1,
  published: true,
});
assert("tbd unknown display 日程未定", tbdUnknown.dateDisplay === SCHEDULE_DATE_DISPLAY_TBD_MONTH_UNKNOWN);
assert("tbd unknown hub-only", tbdUnknown.monthMembership?.kind === "hub-only");
assert("tbd unknown hub", scheduleBelongsOnHub(tbdUnknown) === true);
assert("tbd unknown not on month page", scheduleBelongsToMonthPage(tbdUnknown, "2026-09") === false);

// --- fail-closed ---
const failCases = [
  { date_status: "maybe", date: "2026-08-01", month: "2026-08" },
  { date_status: "confirmed", date: null, month: "2026-08" },
  { date_status: "tbd", date: "2026-08-01", month: "2026-08" },
  { date_status: "confirmed", date: "2026-08-15", month: "2026-07" },
  { date_status: "tbd", date: null, month: "2026-13" },
];
for (const [i, row] of failCases.entries()) {
  let threw = false;
  try {
    normalizeScheduleRecord({ legacy_id: `bad-${i}`, ...row, published: true });
  } catch {
    threw = true;
  }
  assert(`fail-closed case ${i}`, threw);
}

// --- input mutation ---
const mutable = {
  legacy_id: "mut",
  date: "2026-08-01",
  month: "2026-08",
  date_status: "confirmed",
  sort_order: 0,
};
const before = JSON.stringify(mutable);
normalizeScheduleRecord(mutable);
assert("input not mutated", JSON.stringify(mutable) === before);

// --- sort contract ---
const cEarly = normalizeScheduleRecord({
  legacy_id: "c-early",
  date: "2026-09-01",
  month: "2026-09",
  date_status: "confirmed",
  sort_order: 10,
});
const cLate = normalizeScheduleRecord({
  legacy_id: "c-late",
  date: "2026-09-10",
  month: "2026-09",
  date_status: "confirmed",
  sort_order: 1,
});
const tSept = normalizeScheduleRecord({
  legacy_id: "t-sept",
  date: null,
  month: "2026-09",
  date_status: "tbd",
  sort_order: 0,
});
const tHub = normalizeScheduleRecord({
  legacy_id: "t-hub",
  date: null,
  month: null,
  date_status: "tbd",
  sort_order: 0,
});
const cAug = normalizeScheduleRecord({
  legacy_id: "c-aug",
  date: "2026-08-15",
  month: "2026-08",
  date_status: "confirmed",
  sort_order: 0,
});
const sorted = sortScheduleRecords([tHub, tSept, cLate, cEarly, cAug]);
deepEqual(
  "full sort contract order",
  sorted.map((r) => r.legacy_id),
  ["c-aug", "c-early", "c-late", "t-sept", "t-hub"],
);
assert("sort comparator non-decreasing", sorted.every((row, i, arr) => {
  if (i === 0) return true;
  return compareScheduleRecords(arr[i - 1], row) <= 0;
}));

// --- Mio fixture TBD ---
assert("mio schedules fixture exists", fs.existsSync(MIO_SCHEDULES));
const mioDoc = JSON.parse(fs.readFileSync(MIO_SCHEDULES, "utf8"));
const mioTbdRaw = mioDoc.rows.find((r) => r.legacy_id === "mio-sched-2026-09-01");
assert("mio TBD raw present", Boolean(mioTbdRaw));
const mioTbd = normalizeScheduleRecord(mioTbdRaw);
assert("mio TBD 日付未定", mioTbd.dateDisplay === SCHEDULE_DATE_DISPLAY_TBD_MONTH_KNOWN);
assert("mio TBD month-known membership", scheduleBelongsToMonthPage(mioTbd, "2026-09"));
assert("mio TBD not hub-only", mioTbd.monthMembership?.kind === "month-page");

const syntheticUnknown = normalizeScheduleRecord({
  ...mioTbdRaw,
  legacy_id: "mio-sched-hub-only",
  month: null,
  year: null,
  date_status: "tbd",
  extensions: { dateStatus: "tbd" },
});
assert(
  "synthetic 日程未定",
  syntheticUnknown.dateDisplay === SCHEDULE_DATE_DISPLAY_TBD_MONTH_UNKNOWN,
);
assert("synthetic hub-only excluded from month", !scheduleBelongsToMonthPage(syntheticUnknown, "2026-09"));

// --- Gosaki confirmed HTML byte-identical (month page fixture) ---
tempOut = path.join(TOOL_ROOT, TEMP_OUT_REL);
fs.mkdirSync(tempOut, { recursive: true });
applyGosakiScheduleDataPages(tempOut, BASELINE_SCHEDULE_BUNDLE, {
  baseUrl: BASELINE_BASE_URL,
  deployBase: BASELINE_DEPLOY_BASE,
});
const generatedMonth = fs.readFileSync(
  path.join(tempOut, "src/pages/schedule/2026-08/index.astro"),
  "utf8",
);
const fixtureMonth = fs.readFileSync(FIXTURE_MONTH, "utf8");
assert("Gosaki month Astro byte-identical vs fixture", generatedMonth === fixtureMonth);

const baselineRun = spawnSync(
  process.execPath,
  ["scripts/verify-cms-core-v2-gosaki-site-generator-hooks-html-baseline.mjs"],
  { cwd: TOOL_ROOT, encoding: "utf8" },
);
assert("Gosaki HTML baseline exit 0", baselineRun.status === 0, baselineRun.stderr || "");
assert(
  "Gosaki HTML baseline ≥81 PASS",
  /(?:81|8[2-9]|9\d|\d{3,}) passed, 0 failed/.test(baselineRun.stdout || ""),
  (baselineRun.stdout || "").match(/\d+ passed/)?.[0] || "no pass count",
);

// --- Admin / Save / Edge unchanged ---
assert("admin state helper file unchanged import surface", /schemaSupportsTbd/.test(adminSrc));
assert("save payload helper still offline", /tbdWriteEnabled/.test(payloadSrc));
assert(
  "edge dry-run handler has no date_status SELECT wiring",
  fs.existsSync(EDGE_HANDLER) &&
    !/\bdate_status\b/.test(fs.readFileSync(EDGE_HANDLER, "utf8")),
);
assert(
  "read core has no Admin Save imports",
  !/from ["'].*staging-schedule/.test(coreSrc) &&
    !/schedule-dry-run-validation/.test(coreSrc) &&
    !/AdminStagingSchedule/.test(coreSrc),
);

// --- docs / registration ---
assert("phase doc exists", fs.existsSync(DOC));
const pkg = JSON.parse(fs.readFileSync(PKG, "utf8"));
const npm = "verify:cms-core-v2-schedule-tbd-date-status-read-wiring";
assert("npm script registered", Boolean(pkg.scripts?.[npm]));
const suiteSrc = fs.readFileSync(SUITE, "utf8");
assert(
  "Safety Suite registers offline read-wiring verifier",
  /schedule-tbd-date-status-read-wiring/.test(suiteSrc),
);
assert(
  "Safety Suite does not register live SELECT for this phase",
  !/schedule-tbd-date-status-read-wiring-live/.test(suiteSrc),
);

cleanupTemp();
assert("temp cleanup removed", !fs.existsSync(tempOut));

console.log(`\nRESULT ${failed === 0 ? "PASS" : "FAIL"} passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
