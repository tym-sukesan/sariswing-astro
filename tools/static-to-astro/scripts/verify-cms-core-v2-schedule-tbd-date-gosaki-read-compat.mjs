/**
 * CMS Core v2 — Schedule TBD date contract · Gosaki read compat (offline).
 *
 * Proves confirmed-only legacy mapping through normalizeScheduleRecord
 * without changing Gosaki sort, SELECT columns, Admin/Save, Mio adapters,
 * or generated hub/month Astro bytes.
 *
 * npm: verify:cms-core-v2-schedule-tbd-date-gosaki-read-compat
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
import {
  SEED_ROW_NORMALIZED,
  SEED_ROW_RAW,
} from "./lib/cms-core-v2-schedule-read-extractor-decoupling-fixtures.mjs";
import { applyGosakiScheduleDataPages } from "./lib/gosaki-schedule-data-pages.mjs";
import {
  SCHEDULE_SELECT,
  SCHEDULE_SELECT_TBD_V1,
  compareScheduleRecords,
  deriveScheduleMonthsFromSchedules,
  formatScheduleDateDisplay,
  normalizeScheduleRecord,
  sortScheduleRecords,
  validateLegacyConfirmedScheduleDateContract,
} from "./lib/supabase-schedule-read.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const TEMP_OUT_REL = "output/_cms-core-v2-schedule-tbd-gosaki-read-compat-tmp";
const FIXTURE_BASELINE = path.join(
  TOOL_ROOT,
  "fixtures/cms-core-v2-gosaki-site-generator-hooks-html-baseline",
);
const CANDIDATES = path.join(
  TOOL_ROOT,
  "docs/gosaki-schedule-august-seed-candidates.json",
);
const READ_CORE = path.join(__dirname, "lib/supabase-schedule-read.mjs");
const PAGES = path.join(__dirname, "lib/gosaki-schedule-data-pages.mjs");
const MIO_PAGES = path.join(__dirname, "lib/mio-schedule-data-pages.mjs");
const MIO_SCHEDULES = path.join(TOOL_ROOT, "fixtures/mio-kisaragi-jazz-data/schedules.json");
const PLANNING = path.join(TOOL_ROOT, "docs/cms-core-v2-schedule-tbd-date-contract-planning.md");
const SUITE = path.join(__dirname, "run-cms-core-v2-safety-suite.mjs");
const PKG = path.join(TOOL_ROOT, "package.json");
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

const coreSrc = fs.readFileSync(READ_CORE, "utf8");
const pagesSrc = fs.readFileSync(PAGES, "utf8");
const mioPagesSrc = fs.readFileSync(MIO_PAGES, "utf8");

assert("SCHEDULE_SELECT has no date_status", !/\bdate_status\b/.test(SCHEDULE_SELECT));
assert(
  "SCHEDULE_SELECT_TBD_V1 includes date_status",
  /\bdate_status\b/.test(SCHEDULE_SELECT_TBD_V1),
);
assert(
  "load path does not hardcode .select(...date_status)",
  !/\.select\([^)]*date_status/.test(coreSrc),
);
assert(
  "core uses normalizeScheduleDateContract",
  /normalizeScheduleDateContract/.test(coreSrc),
);
assert(
  "core wires compareScheduleDateContract for sort",
  /compareScheduleDateContract/.test(coreSrc),
);
assert(
  "core keeps compareScheduleRecords",
  /export function compareScheduleRecords/.test(coreSrc),
);
assert("pages do not import date-contract", !/schedule-date-contract/.test(pagesSrc));
assert("mio pages do not import date-contract", !/schedule-date-contract/.test(mioPagesSrc));
assert(
  "mio schedules fixture unchanged presence",
  fs.existsSync(MIO_SCHEDULES) &&
    /mio-sched-2026-09-01/.test(fs.readFileSync(MIO_SCHEDULES, "utf8")),
);
assert(
  "read core has no Admin Save imports",
  !/from ["'].*staging-schedule/.test(coreSrc) &&
    !/schedule-dry-run-validation/.test(coreSrc) &&
    !/AdminStagingSchedule/.test(coreSrc),
);

// --- mutation guard ---
const mutableRaw = { ...SEED_ROW_RAW };
const beforeRaw = JSON.stringify(mutableRaw);
const normalizedSeed = normalizeScheduleRecord(mutableRaw);
assert("input not mutated", JSON.stringify(mutableRaw) === beforeRaw);
deepEqual("SEED_ROW normalize deep-equal locked fixture", normalizedSeed, SEED_ROW_NORMALIZED);
assert(
  "SEED display matches legacy formatScheduleDateDisplay",
  normalizedSeed.date_display === formatScheduleDateDisplay(SEED_ROW_RAW.date),
);

const contractOk = validateLegacyConfirmedScheduleDateContract(SEED_ROW_RAW);
assert("legacy confirmed contract ok", contractOk.ok === true && !contractOk.skipped);
if (contractOk.ok && !contractOk.skipped) {
  assert("legacy mapping dateStatus confirmed", contractOk.value.dateStatus === "confirmed");
  assert("legacy mapping date", contractOk.value.date === "2026-08-15");
  assert("legacy mapping month", contractOk.value.month === "2026-08");
  assert(
    "legacy mapping display",
    contractOk.value.display === "2026.08.15 (Sat)",
  );
}

// --- fail-closed ---
assert(
  "null date skips contract (no auto-TBD)",
  (() => {
    const r = validateLegacyConfirmedScheduleDateContract({
      date: null,
      month: "2026-09",
    });
    return r.ok === true && r.skipped === true;
  })(),
);
assert(
  "null date normalize does not throw",
  (() => {
    try {
      const n = normalizeScheduleRecord({
        date: null,
        month: "2026-09",
        legacy_id: "null-date",
      });
      return n.date === null && n.date_display === "";
    } catch {
      return false;
    }
  })(),
);

let invalidDateThrew = false;
try {
  normalizeScheduleRecord({
    date: "2026-13-40",
    month: "2026-13",
    legacy_id: "bad-date",
  });
} catch {
  invalidDateThrew = true;
}
assert("invalid date fail-closed throw", invalidDateThrew);

let missingDateConfirmedThrew = false;
try {
  // explicit confirmed path via validate (missing date is skip; invalid month mismatch throws)
  normalizeScheduleRecord({
    date: "2026-08-15",
    month: "2026-07",
    year: 2026,
    legacy_id: "month-mismatch",
  });
} catch {
  missingDateConfirmedThrew = true;
}
assert("month mismatch fail-closed throw", missingDateConfirmedThrew);

let invalidStatusViaDirect = validateLegacyConfirmedScheduleDateContract({
  date: "not-a-date",
  month: "2026-08",
});
assert("invalid date contract fails", invalidStatusViaDirect.ok === false);

// --- Gosaki August seed candidates (all confirmed) ---
assert("august seed candidates exist", fs.existsSync(CANDIDATES));
const candidatesDoc = JSON.parse(fs.readFileSync(CANDIDATES, "utf8"));
const candidates = Array.isArray(candidatesDoc.candidates) ? candidatesDoc.candidates : [];
assert("august candidates non-empty", candidates.length >= 1);

/** @type {ReturnType<typeof normalizeScheduleRecord>[]} */
const normalizedCandidates = [];
let candidateFail = 0;
for (const c of candidates) {
  const row = {
    id: null,
    legacy_id: c.proposed_legacy_id ?? null,
    site_slug: c.proposed_site_slug ?? "gosaki-piano",
    date: c.date,
    year: c.proposed_year ?? 2026,
    month: c.proposed_month ?? c.source_month,
    title: c.title ?? null,
    venue: c.venue ?? null,
    open_time: c.open_time ?? null,
    start_time: c.start_time ?? null,
    price: c.price ?? null,
    description: c.description ?? null,
    image_url: c.image_url_candidate ?? null,
    source_file: c.proposed_source_file ?? null,
    source_route: c.proposed_source_route ?? null,
    show_on_home: Boolean(c.show_on_home_candidate),
    home_order: c.home_order_candidate ?? null,
    published: c.published_candidate !== false,
    sort_order: c.proposed_sort_order ?? 0,
    updated_at: null,
  };
  try {
    const n = normalizeScheduleRecord(row);
    const v = validateLegacyConfirmedScheduleDateContract(row);
    if (!v.ok || v.skipped || v.value.dateStatus !== "confirmed") {
      candidateFail += 1;
      continue;
    }
    if (n.date_display !== (c.date_display || formatScheduleDateDisplay(c.date))) {
      candidateFail += 1;
      continue;
    }
    if (n.month !== row.month || n.legacy_id !== row.legacy_id || n.source_route !== row.source_route) {
      candidateFail += 1;
      continue;
    }
    normalizedCandidates.push(n);
  } catch {
    candidateFail += 1;
  }
}
assert(
  "all Gosaki august confirmed candidates contract PASS",
  candidateFail === 0 && normalizedCandidates.length === candidates.length,
  `fail=${candidateFail} ok=${normalizedCandidates.length}/${candidates.length}`,
);

// --- sort / month grouping compatibility (legacy comparator) ---
const shuffled = [...normalizedCandidates].reverse();
const sorted = sortScheduleRecords(shuffled);
assert(
  "sort uses Kit date-contract comparator (confirmed-stable)",
  sorted.every((row, i, arr) => {
    if (i === 0) return true;
    return compareScheduleRecords(arr[i - 1], row) <= 0;
  }),
);
const months = deriveScheduleMonthsFromSchedules(sorted);
assert("month grouping non-empty", months.length >= 1);
assert(
  "month grouping keys from schedules",
  months.every((m) => sorted.some((s) => s.month === m.month)),
);

// before/after bundle deep equality on decoupling seed + baseline row
const baselineRaw = {
  id: "1",
  legacy_id: "baseline-2026-08-01",
  site_slug: "gosaki-piano",
  date: "2026-08-01",
  year: 2026,
  month: "2026-08",
  title: null,
  venue: null,
  open_time: null,
  start_time: null,
  price: null,
  description: null,
  image_url: null,
  source_file: null,
  source_route: "/schedule/2026-08/",
  show_on_home: false,
  home_order: null,
  published: true,
  sort_order: 1,
  updated_at: null,
};
const expectedBaselineNormalized = {
  id: "1",
  legacy_id: "baseline-2026-08-01",
  site_slug: "gosaki-piano",
  date: "2026-08-01",
  date_display: "2026.08.01 (Sat)",
  dateDisplay: "2026.08.01 (Sat)",
  dateStatus: "confirmed",
  date_status: "confirmed",
  year: 2026,
  month: "2026-08",
  title: null,
  venue: null,
  open_time: null,
  start_time: null,
  price: null,
  description: null,
  image_url: null,
  source_file: null,
  source_route: "/schedule/2026-08/",
  show_on_home: false,
  home_order: null,
  published: true,
  sort_order: 1,
  updated_at: null,
  label: "2026.08",
  monthMembership: {
    kind: "month-page",
    month: "2026-08",
  },
  dateContract: {
    dateStatus: "confirmed",
    date: "2026-08-01",
    month: "2026-08",
    year: 2026,
    sortOrder: 1,
    legacyId: "baseline-2026-08-01",
    sourceRoute: "/schedule/2026-08/",
    display: "2026.08.01 (Sat)",
    monthMembership: {
      kind: "month-page",
      month: "2026-08",
    },
  },
};
deepEqual(
  "baseline-shaped row normalize deep-equal",
  normalizeScheduleRecord(baselineRaw),
  expectedBaselineNormalized,
);

const beforeSchedules = sortScheduleRecords([
  SEED_ROW_NORMALIZED,
  expectedBaselineNormalized,
]);
const afterSchedulesBundle = sortScheduleRecords([
  normalizeScheduleRecord(SEED_ROW_RAW),
  normalizeScheduleRecord(baselineRaw),
]);
const beforeBundle = {
  scheduleDataSource: "supabase",
  schedules: beforeSchedules,
  months: deriveScheduleMonthsFromSchedules(beforeSchedules),
};
const afterBundle = {
  scheduleDataSource: "supabase",
  schedules: afterSchedulesBundle,
  months: deriveScheduleMonthsFromSchedules(afterSchedulesBundle),
};
deepEqual("before/after schedule bundle deep equality", afterBundle, beforeBundle);

// --- hub / month Astro byte equality vs HTML baseline fixtures ---
const beforeDir = path.join(tempOut, "before");
const afterDir = path.join(tempOut, "after");
fs.mkdirSync(beforeDir, { recursive: true });
fs.mkdirSync(afterDir, { recursive: true });

applyGosakiScheduleDataPages(beforeDir, BASELINE_SCHEDULE_BUNDLE, {
  baseUrl: BASELINE_BASE_URL,
  deployBase: BASELINE_DEPLOY_BASE,
});

const afterSchedules = [
  normalizeScheduleRecord({
    id: "1",
    month: "2026-08",
    date: "2026-08-01",
    year: 2026,
    legacy_id: null,
    site_slug: "gosaki-piano",
    source_route: "/schedule/2026-08/",
    published: true,
    sort_order: 0,
  }),
];
applyGosakiScheduleDataPages(
  afterDir,
  {
    scheduleDataSource: BASELINE_SCHEDULE_BUNDLE.scheduleDataSource,
    schedules: afterSchedules,
    months: BASELINE_SCHEDULE_BUNDLE.months,
  },
  {
    baseUrl: BASELINE_BASE_URL,
    deployBase: BASELINE_DEPLOY_BASE,
  },
);

const hubFixture = fs.readFileSync(path.join(FIXTURE_BASELINE, "schedule-index.astro"), "utf8");
const monthFixture = fs.readFileSync(
  path.join(FIXTURE_BASELINE, "schedule-month-2026-08.astro"),
  "utf8",
);
const hubBefore = fs.readFileSync(path.join(beforeDir, "src/pages/schedule/index.astro"), "utf8");
const hubAfter = fs.readFileSync(path.join(afterDir, "src/pages/schedule/index.astro"), "utf8");
const monthBefore = fs.readFileSync(
  path.join(beforeDir, "src/pages/schedule/2026-08/index.astro"),
  "utf8",
);
const monthAfter = fs.readFileSync(
  path.join(afterDir, "src/pages/schedule/2026-08/index.astro"),
  "utf8",
);

assert("hub Astro == fixture (before)", hubBefore === hubFixture);
assert("hub Astro == fixture (after normalize)", hubAfter === hubFixture);
assert("hub Astro before == after", hubBefore === hubAfter);
assert("month Astro == fixture (before)", monthBefore === monthFixture);
assert("month Astro == fixture (after normalize)", monthAfter === monthFixture);
assert("month Astro before == after", monthBefore === monthAfter);

// --- Gosaki HTML baseline regression ---
const baselineRun = spawnSync(
  process.execPath,
  ["scripts/verify-cms-core-v2-gosaki-site-generator-hooks-html-baseline.mjs"],
  { cwd: TOOL_ROOT, encoding: "utf8" },
);
assert(
  "Gosaki HTML baseline exit 0",
  baselineRun.status === 0,
  baselineRun.stderr || baselineRun.stdout?.slice(-200),
);
assert(
  "Gosaki HTML baseline ≥81 PASS",
  /(?:81|8[2-9]|9\d|\d{3,}) passed, 0 failed/.test(baselineRun.stdout || ""),
  (baselineRun.stdout || "").match(/\d+ passed/)?.[0] || "no pass count",
);

// Contact provider smoke (HubSpot completion audit offline)
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
const npm = "verify:cms-core-v2-schedule-tbd-date-gosaki-read-compat";
assert("npm script registered", Boolean(pkg.scripts?.[npm]));
assert(
  "Safety Suite registers schedule-tbd-date-gosaki-read-compat",
  /schedule-tbd-date-gosaki-read-compat/.test(suiteSrc),
);
assert(
  "planning notes gosaki-read-compat",
  /cms-core-v2-schedule-tbd-date-gosaki-read-compat/.test(fs.readFileSync(PLANNING, "utf8")),
);

cleanupTemp();
assert("temp cleanup removed", !fs.existsSync(tempOut));

console.log(`\nRESULT ${failed === 0 ? "PASS" : "FAIL"} passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
