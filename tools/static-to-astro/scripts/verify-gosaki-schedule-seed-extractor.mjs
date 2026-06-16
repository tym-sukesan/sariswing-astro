#!/usr/bin/env node
/**
 * G-9b — Verify Gosaki Wix schedule seed extractor (fixture-based, no network, no DB).
 * Run: node scripts/verify-gosaki-schedule-seed-extractor.mjs
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseScheduleTimeLine } from "./lib/schedule-seed-extractor.mjs";
import {
  extractAllGosakiScheduleSeeds,
  extractGosakiWixSchedulesFromHtmlFile,
  GOSAKI_SITE_SLUG,
} from "./lib/gosaki-wix-schedule-extractor.mjs";
import { extractSchedulesFromHtmlFile } from "./lib/schedule-seed-extractor.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const GOSAKI_FIXTURE = path.join(TOOL_ROOT, "fixtures/gosaki-piano");
const MANUAL_FIXTURE = path.join(TOOL_ROOT, "fixtures/gosaki-static-site");

let passed = 0;
let failed = 0;

function assert(name, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}`);
  }
}

function assertEqual(name, actual, expected) {
  assert(name, actual === expected);
  if (actual !== expected) {
    console.error(`  expected: ${expected}`);
    console.error(`  actual:   ${actual}`);
  }
}

// --- parseScheduleTimeLine (OPEN/START + 開場/開演) ---
{
  const ja = parseScheduleTimeLine("時間：開場 18:00 / 開演 19:30");
  assertEqual("timeLine_ja_open", ja.open_time, "18:00");
  assertEqual("timeLine_ja_start", ja.start_time, "19:30");

  const en = parseScheduleTimeLine("OPEN 18:00 / START 19:30");
  assertEqual("timeLine_en_open", en.open_time, "18:00");
  assertEqual("timeLine_en_start", en.start_time, "19:30");

  const mixed = parseScheduleTimeLine("時間：開場 14:00 / START 14:45");
  assertEqual("timeLine_mixed_open", mixed.open_time, "14:00");
  assertEqual("timeLine_mixed_start", mixed.start_time, "14:45");

  const range = parseScheduleTimeLine("時間：17:00〜19:00");
  assert("timeLine_range_note", range.time_note === "17:00〜19:00");
  assert("timeLine_range_no_open", range.open_time === null);
}

// --- fixture event counts (Wix vs manual) ---
const EXPECTED_COUNTS = {
  "2026-03": 13,
  "2026-04": 10,
  "2026-05": 12,
  "2026-06": 11,
  "2026-07": 14,
};

const extracted = extractAllGosakiScheduleSeeds(GOSAKI_FIXTURE);
assertEqual("gosaki_site_slug", extracted.site_slug, GOSAKI_SITE_SLUG);
assertEqual("gosaki_month_count", extracted.months.length, 5);
assertEqual("gosaki_total_events", extracted.extractionStats.totalEvents, 60);

for (const [month, count] of Object.entries(EXPECTED_COUNTS)) {
  const entry = extracted.months.find((m) => m.month === month);
  assertEqual(`gosaki_month_${month}_count`, entry?.count ?? -1, count);

  const wixFile = path.join(GOSAKI_FIXTURE, `${month}.html`);
  const manualFile = path.join(MANUAL_FIXTURE, `schedule-${month}.html`);
  const wix = extractGosakiWixSchedulesFromHtmlFile(wixFile);
  const manual = extractSchedulesFromHtmlFile(manualFile);
  assertEqual(`wix_vs_manual_${month}`, wix?.count, manual?.count);
}

// --- route convention: canonical /schedule/YYYY-MM/ ---
{
  const july = extracted.schedules.find((s) => s.legacy_id === "schedule-2026-07-001");
  assertEqual("gosaki_source_route", july?.source_route, "/schedule/2026-07/");
  assertEqual("gosaki_source_file", july?.source_file, "2026-07.html");
}

// --- field parity spot-check vs manual fixture (2026-07-001) ---
{
  const wixEv = extracted.schedules.find((s) => s.legacy_id === "schedule-2026-07-001");
  const manual = extractSchedulesFromHtmlFile(
    path.join(MANUAL_FIXTURE, "schedule-2026-07.html"),
  );
  const manualEv = manual?.events[0];
  assert("parity_date", wixEv?.date === manualEv?.date);
  assert("parity_title", wixEv?.title === manualEv?.title);
  assert("parity_venue", wixEv?.venue === manualEv?.venue);
  assert("parity_open", wixEv?.open_time === manualEv?.open_time);
  assert("parity_start", wixEv?.start_time === manualEv?.start_time);
  assert("parity_price", wixEv?.price === manualEv?.price);
}

// --- Leader LIVE title split from h1 ---
{
  const leader = extracted.schedules.find((s) => s.legacy_id === "schedule-2026-07-003");
  assertEqual("leader_live_title", leader?.title, "Leader LIVE");
  assert("leader_live_subtitle_in_description", leader?.description?.includes("ごさき"));
}

// --- non-standard time → description ---
{
  const outdoor = extracted.schedules.find((s) => s.legacy_id === "schedule-2026-07-004");
  assert("outdoor_time_in_description", outdoor?.description?.startsWith("時間：17:00"));
  assert("outdoor_no_open_time", outdoor?.open_time === null);
}

// --- all events have legacy_id + site_slug ---
assert(
  "all_events_have_legacy_id",
  extracted.schedules.every((s) => /^schedule-\d{4}-\d{2}-\d{3}$/.test(s.legacy_id)),
);
assert(
  "all_events_have_site_slug",
  extracted.schedules.every((s) => s.site_slug === GOSAKI_SITE_SLUG),
);

// --- no missing dates in current fixtures ---
assertEqual("missing_date_count", extracted.extractionStats.missingDate, 0);

console.log("");
console.log(`verify-gosaki-schedule-seed-extractor: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
