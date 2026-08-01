/**
 * CMS Core v2 — Schedule TBD date contract helpers (offline).
 *
 * npm: verify:cms-core-v2-schedule-tbd-date-contract-helpers
 * No network / DB / Gosaki runtime wiring / schema / seed apply.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { removeGeneratedOutputDir } from "./lib/safe-output-cleanup.mjs";
import {
  SCHEDULE_DATE_DISPLAY_TBD_MONTH_KNOWN,
  SCHEDULE_DATE_DISPLAY_TBD_MONTH_UNKNOWN,
  SCHEDULE_DATE_STATUS_CONFIRMED,
  SCHEDULE_DATE_STATUS_TBD,
  compareScheduleDateContract,
  formatConfirmedScheduleDateDisplay,
  getScheduleDateDisplay,
  getScheduleMonthMembership,
  normalizeScheduleDateContract,
  scheduleRowToDateContractInput,
  validateScheduleDateContract,
} from "./lib/schedule-date-contract.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const TEMP_OUT_REL = "output/_cms-core-v2-schedule-tbd-date-helpers-tmp";
const HELPER = path.join(__dirname, "lib/schedule-date-contract.mjs");
const MIO_SCHEDULES = path.join(TOOL_ROOT, "fixtures/mio-kisaragi-jazz-data/schedules.json");
const PLANNING = path.join(TOOL_ROOT, "docs/cms-core-v2-schedule-tbd-date-contract-planning.md");
const SUITE = path.join(__dirname, "run-cms-core-v2-safety-suite.mjs");
const PKG = path.join(TOOL_ROOT, "package.json");
const GOSAKI_READ = path.join(__dirname, "lib/supabase-schedule-read.mjs");
const GOSAKI_PAGES = path.join(__dirname, "lib/gosaki-schedule-data-pages.mjs");
const MIO_PAGES = path.join(__dirname, "lib/mio-schedule-data-pages.mjs");

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
fs.writeFileSync(path.join(tempOut, ".keep"), "schedule-tbd-date-helpers-tmp\n", "utf8");

assert("helper module exists", fs.existsSync(HELPER));
assert("planning doc exists", fs.existsSync(PLANNING));
assert("mio schedules fixture exists", fs.existsSync(MIO_SCHEDULES));

const helperSrc = fs.readFileSync(HELPER, "utf8");
assert("helper has no gosaki identifier", !/gosaki/i.test(helperSrc));
assert("helper has no network fetch", !/\bfetch\s*\(/.test(helperSrc));
assert("helper has no supabase client", !/createClient|supabase-js/.test(helperSrc));
assert("helper does not import schedule runtime pages", !/mio-schedule-data-pages|gosaki-schedule-data-pages|supabase-schedule-read/.test(helperSrc));

// --- confirmed happy path ---
const confirmed = normalizeScheduleDateContract({
  dateStatus: "confirmed",
  date: "2026-09-03",
  sortOrder: 10,
  legacyId: "sample-confirmed",
});
assert("confirmed ok", confirmed.ok === true);
if (confirmed.ok) {
  assert("confirmed status", confirmed.value.dateStatus === SCHEDULE_DATE_STATUS_CONFIRMED);
  assert("confirmed date", confirmed.value.date === "2026-09-03");
  assert("confirmed month derived", confirmed.value.month === "2026-09");
  assert("confirmed year derived", confirmed.value.year === 2026);
  assert(
    "confirmed display Kit shape",
    confirmed.value.display === formatConfirmedScheduleDateDisplay("2026-09-03") &&
      /\d{4}\.\d{2}\.\d{2} \(/.test(confirmed.value.display),
  );
  assert(
    "confirmed membership month-page",
    getScheduleMonthMembership(confirmed.value).kind === "month-page" &&
      getScheduleMonthMembership(confirmed.value).month === "2026-09",
  );
}

const confirmedDerive = normalizeScheduleDateContract({
  date_status: "confirmed",
  date: "2026-08-07",
});
assert("confirmed month derivation via snake_case status", confirmedDerive.ok === true);
if (confirmedDerive.ok) {
  assert("derived month 2026-08", confirmedDerive.value.month === "2026-08");
}

const monthMatch = normalizeScheduleDateContract({
  dateStatus: "confirmed",
  date: "2026-09-14",
  month: "2026-09",
});
assert("confirmed month match ok", monthMatch.ok === true);

const monthMismatch = normalizeScheduleDateContract({
  dateStatus: "confirmed",
  date: "2026-09-14",
  month: "2026-08",
});
assert("confirmed month mismatch fails", monthMismatch.ok === false);
assert(
  "confirmed month mismatch code",
  !monthMismatch.ok && monthMismatch.codes.includes("confirmed_month_mismatch"),
);

// --- tbd month known ---
const tbdKnown = normalizeScheduleDateContract({
  dateStatus: "tbd",
  date: null,
  month: "2026-09",
  sortOrder: 5,
  legacyId: "mio-sched-2026-09-01",
});
assert("tbd month-known ok", tbdKnown.ok === true);
if (tbdKnown.ok) {
  assert("tbd status", tbdKnown.value.dateStatus === SCHEDULE_DATE_STATUS_TBD);
  assert("tbd date null", tbdKnown.value.date === null);
  assert("tbd month", tbdKnown.value.month === "2026-09");
  assert("tbd display 日付未定", tbdKnown.value.display === SCHEDULE_DATE_DISPLAY_TBD_MONTH_KNOWN);
  assert(
    "tbd membership september page",
    tbdKnown.value.monthMembership.kind === "month-page" &&
      tbdKnown.value.monthMembership.month === "2026-09",
  );
  assert(
    "getScheduleDateDisplay tbd known",
    getScheduleDateDisplay(tbdKnown.value) === "日付未定",
  );
}

// --- tbd month unknown ---
const tbdUnknown = normalizeScheduleDateContract({
  dateStatus: "tbd",
  date: null,
  month: null,
  sortOrder: 1,
  legacyId: "hub-tbd",
});
assert("tbd month-unknown ok", tbdUnknown.ok === true);
if (tbdUnknown.ok) {
  assert("tbd unknown display 日程未定", tbdUnknown.value.display === SCHEDULE_DATE_DISPLAY_TBD_MONTH_UNKNOWN);
  assert("tbd unknown hub-only", tbdUnknown.value.monthMembership.kind === "hub-only");
  assert(
    "getScheduleDateDisplay tbd unknown",
    getScheduleDateDisplay(tbdUnknown.value) === "日程未定",
  );
}

// --- invalid / fail-closed ---
assert(
  "unknown status fails",
  normalizeScheduleDateContract({ dateStatus: "pending", date: "2026-09-01" }).ok === false,
);
assert(
  "confirmed + null date fails",
  normalizeScheduleDateContract({ dateStatus: "confirmed", date: null }).ok === false,
);
assert(
  "confirmed + invalid date fails",
  normalizeScheduleDateContract({ dateStatus: "confirmed", date: "2026-13-40" }).ok === false,
);
assert(
  "tbd + date (sentinel) fails",
  (() => {
    const r = normalizeScheduleDateContract({
      dateStatus: "tbd",
      date: "2026-09-01",
      month: "2026-09",
    });
    return r.ok === false && r.codes.includes("sentinel_rejected");
  })(),
);
assert(
  "Date object rejected",
  normalizeScheduleDateContract({
    dateStatus: "confirmed",
    date: new Date("2026-09-03T00:00:00.000Z"),
  }).ok === false,
);
assert(
  "malformed month fails",
  normalizeScheduleDateContract({ dateStatus: "tbd", month: "2026/09" }).ok === false,
);
assert(
  "unknown field fails",
  normalizeScheduleDateContract({
    dateStatus: "confirmed",
    date: "2026-09-03",
    title: "nope",
  }).ok === false,
);
assert(
  "validate alias matches normalize",
  JSON.stringify(validateScheduleDateContract({ dateStatus: "tbd", month: "2026-09" })) ===
    JSON.stringify(normalizeScheduleDateContract({ dateStatus: "tbd", month: "2026-09" })),
);

// --- mutation guard ---
const mutable = {
  dateStatus: "confirmed",
  date: "2026-09-03",
  sortOrder: 3,
};
const before = JSON.stringify(mutable);
normalizeScheduleDateContract(mutable);
assert("input not mutated", JSON.stringify(mutable) === before);

// --- sort contract (locked) ---
// 1 month既知 ASC · 2 same-month confirmed before tbd · 3 confirmed date→sortOrder→legacyId
// 4 tbd sortOrder→legacyId · 5 month不明 tbd last
const c1 = normalizeScheduleDateContract({
  dateStatus: "confirmed",
  date: "2026-09-03",
  sortOrder: 10,
  legacyId: "c-early",
});
const c2 = normalizeScheduleDateContract({
  dateStatus: "confirmed",
  date: "2026-09-14",
  sortOrder: 20,
  legacyId: "c-late",
});
const tSep = normalizeScheduleDateContract({
  dateStatus: "tbd",
  date: null,
  month: "2026-09",
  sortOrder: 5,
  legacyId: "t-sep",
});
const cAug = normalizeScheduleDateContract({
  dateStatus: "confirmed",
  date: "2026-08-07",
  sortOrder: 1,
  legacyId: "c-aug",
});
const tHub = normalizeScheduleDateContract({
  dateStatus: "tbd",
  date: null,
  month: null,
  sortOrder: 0,
  legacyId: "t-hub",
});
const confirmedDateWinsOverSortOrder = normalizeScheduleDateContract({
  dateStatus: "confirmed",
  date: "2026-09-03",
  sortOrder: 99,
  legacyId: "c-high-sort-early-date",
});
const confirmedLaterDateLowSort = normalizeScheduleDateContract({
  dateStatus: "confirmed",
  date: "2026-09-14",
  sortOrder: 1,
  legacyId: "c-low-sort-late-date",
});
const tbdSort3 = normalizeScheduleDateContract({
  dateStatus: "tbd",
  date: null,
  month: "2026-09",
  sortOrder: 3,
  legacyId: "t-sort-3",
});
const tbdSort5b = normalizeScheduleDateContract({
  dateStatus: "tbd",
  date: null,
  month: "2026-09",
  sortOrder: 5,
  legacyId: "t-sort-5-b",
});
assert(
  "sort fixtures all ok",
  c1.ok &&
    c2.ok &&
    tSep.ok &&
    cAug.ok &&
    tHub.ok &&
    confirmedDateWinsOverSortOrder.ok &&
    confirmedLaterDateLowSort.ok &&
    tbdSort3.ok &&
    tbdSort5b.ok,
);
if (
  c1.ok &&
  c2.ok &&
  tSep.ok &&
  cAug.ok &&
  tHub.ok &&
  confirmedDateWinsOverSortOrder.ok &&
  confirmedLaterDateLowSort.ok &&
  tbdSort3.ok &&
  tbdSort5b.ok
) {
  const sorted = [tHub.value, tSep.value, c2.value, c1.value, cAug.value].sort(
    compareScheduleDateContract,
  );
  const ids = sorted.map((x) => x.legacyId);
  assert(
    "sort: month ASC → confirmed before tbd → month-unknown last",
    JSON.stringify(ids) ===
      JSON.stringify(["c-aug", "c-early", "c-late", "t-sep", "t-hub"]),
  );
  assert("confirmed before TBD same month", compareScheduleDateContract(c1.value, tSep.value) < 0);
  assert("month-unknown TBD last vs known month", compareScheduleDateContract(tSep.value, tHub.value) < 0);
  assert(
    "confirmed date order beats sortOrder",
    compareScheduleDateContract(
      confirmedDateWinsOverSortOrder.value,
      confirmedLaterDateLowSort.value,
    ) < 0,
  );
  assert(
    "tbd peers ordered by sortOrder then legacyId",
    JSON.stringify(
      [tbdSort5b.value, tSep.value, tbdSort3.value]
        .sort(compareScheduleDateContract)
        .map((x) => x.legacyId),
    ) === JSON.stringify(["t-sort-3", "t-sep", "t-sort-5-b"]),
  );
  assert(
    "deterministic sort",
    JSON.stringify([tHub.value, c1.value].sort(compareScheduleDateContract).map((x) => x.legacyId)) ===
      JSON.stringify([c1.value, tHub.value].sort(compareScheduleDateContract).map((x) => x.legacyId)),
  );
}

// --- Mio fixture proof (no fixture mutation) ---
const mioDoc = JSON.parse(fs.readFileSync(MIO_SCHEDULES, "utf8"));
const mioRow = mioDoc.rows.find((r) => r.legacy_id === "mio-sched-2026-09-01");
assert("mio TBD row present", Boolean(mioRow));
const mioBefore = JSON.stringify(mioRow);
const mioInput = scheduleRowToDateContractInput(mioRow);
const mioNorm = normalizeScheduleDateContract(mioInput);
assert("mio fixture normalize ok", mioNorm.ok === true);
if (mioNorm.ok) {
  assert("mio dateStatus tbd", mioNorm.value.dateStatus === "tbd");
  assert("mio date null", mioNorm.value.date === null);
  assert("mio month 2026-09", mioNorm.value.month === "2026-09");
  assert("mio display 日付未定", mioNorm.value.display === "日付未定");
  assert("mio sortOrder 5", mioNorm.value.sortOrder === 5);
  assert(
    "mio september membership",
    mioNorm.value.monthMembership.kind === "month-page" &&
      mioNorm.value.monthMembership.month === "2026-09",
  );

  const septPublished = mioDoc.rows.filter(
    (r) => r.month === "2026-09" && r.published === true,
  );
  const septContracts = [];
  for (const row of septPublished) {
    const n = normalizeScheduleDateContract(scheduleRowToDateContractInput(row));
    if (n.ok) septContracts.push(n.value);
  }
  assert("mio sept published normalize all ok", septContracts.length === septPublished.length);
  const septSorted = [...septContracts].sort(compareScheduleDateContract);
  const confirmedSept = septSorted.filter((c) => c.dateStatus === "confirmed");
  const tbdSept = septSorted.filter((c) => c.dateStatus === "tbd");
  assert("mio sept has confirmed peers", confirmedSept.length >= 1);
  assert(
    "mio sept TBD last among month",
    tbdSept.length === 1 &&
      septSorted[septSorted.length - 1]?.legacyId === "mio-sched-2026-09-01",
  );
  assert(
    "mio TBD after every confirmed Sept peer",
    confirmedSept.every((c) => compareScheduleDateContract(c, mioNorm.value) < 0),
  );
  assert(
    "mio confirmed Sept keep date order",
    confirmedSept.every(
      (c, i, arr) => i === 0 || String(arr[i - 1].date) <= String(c.date),
    ),
  );
  const tbdPeerEarlier = normalizeScheduleDateContract({
    dateStatus: "tbd",
    date: null,
    month: "2026-09",
    sortOrder: 4,
    legacyId: "mio-tbd-peer-sort-4",
  });
  const tbdPeerLater = normalizeScheduleDateContract({
    dateStatus: "tbd",
    date: null,
    month: "2026-09",
    sortOrder: 5,
    legacyId: "mio-tbd-peer-sort-5-z",
  });
  assert("mio TBD peer fixtures ok", tbdPeerEarlier.ok && tbdPeerLater.ok);
  if (tbdPeerEarlier.ok && tbdPeerLater.ok) {
    assert(
      "mio TBD sortOrder=5 deterministic among TBD peers",
      JSON.stringify(
        [tbdPeerLater.value, mioNorm.value, tbdPeerEarlier.value]
          .sort(compareScheduleDateContract)
          .map((x) => x.legacyId),
      ) ===
        JSON.stringify([
          "mio-tbd-peer-sort-4",
          "mio-sched-2026-09-01",
          "mio-tbd-peer-sort-5-z",
        ]),
    );
  }
}
assert("mio fixture row not mutated", JSON.stringify(mioRow) === mioBefore);

// --- Gosaki-shaped confirmed row through helper (compat, no runtime wire) ---
const gosakiShaped = normalizeScheduleDateContract(
  scheduleRowToDateContractInput({
    legacy_id: "schedule-2026-03-001",
    site_slug: "gosaki-piano",
    date: "2026-03-01",
    year: 2026,
    month: "2026-03",
    sort_order: 1,
    published: true,
  }),
);
assert("gosaki-shaped confirmed ok", gosakiShaped.ok === true);
if (gosakiShaped.ok) {
  assert("gosaki-shaped status confirmed", gosakiShaped.value.dateStatus === "confirmed");
  assert("gosaki-shaped date kept", gosakiShaped.value.date === "2026-03-01");
  assert("gosaki-shaped month", gosakiShaped.value.month === "2026-03");
}

// --- runtime not wired ---
const gosakiReadSrc = fs.readFileSync(GOSAKI_READ, "utf8");
const gosakiPagesSrc = fs.readFileSync(GOSAKI_PAGES, "utf8");
const mioPagesSrc = fs.readFileSync(MIO_PAGES, "utf8");
assert(
  "supabase-schedule-read does not import date-contract",
  !/schedule-date-contract/.test(gosakiReadSrc),
);
assert(
  "gosaki-schedule-data-pages does not import date-contract",
  !/schedule-date-contract/.test(gosakiPagesSrc),
);
assert(
  "mio-schedule-data-pages does not import date-contract",
  !/schedule-date-contract/.test(mioPagesSrc),
);

const suiteSrc = fs.readFileSync(SUITE, "utf8");
const pkg = JSON.parse(fs.readFileSync(PKG, "utf8"));
const npm = "verify:cms-core-v2-schedule-tbd-date-contract-helpers";
assert("npm script registered", Boolean(pkg.scripts?.[npm]));
assert(
  "Safety Suite registers schedule-tbd-date-contract-helpers",
  /schedule-tbd-date-contract-helpers/.test(suiteSrc),
);

const planning = fs.readFileSync(PLANNING, "utf8");
assert(
  "planning notes helpers phase",
  /cms-core-v2-schedule-tbd-date-contract-helpers/.test(planning),
);

assert("temp cleanup path created", fs.existsSync(tempOut));
cleanupTemp();
assert("temp cleanup removed", !fs.existsSync(tempOut));

console.log(`\nRESULT ${failed === 0 ? "PASS" : "FAIL"} passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
