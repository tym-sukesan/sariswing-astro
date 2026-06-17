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
import {
  generateGosakiSchedulesSeedSql,
  GOSAKI_SEED_LEGACY_ID_COLLISIONS,
  GOSAKI_CANONICAL_SOURCE_ROUTE_PREFIX,
} from "./lib/gosaki-schedules-seed-sql.mjs";
import {
  deriveScheduleMonthsFromSchedules,
  GOSAKI_SCHEDULE_SITE_CONFIG,
  isCanonicalScheduleSourceRoute,
  loadGosakiScheduleDataForBuild,
  loadScheduleDataForBuild,
} from "./lib/supabase-schedule-read.mjs";
import { extractSchedulesFromHtmlFile } from "./lib/schedule-seed-extractor.mjs";
import fs from "node:fs";

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

// --- all source_route use canonical /schedule/YYYY-MM/ ---
assert(
  "all_source_routes_canonical",
  extracted.schedules.every(
    (s) =>
      s.source_route?.startsWith(GOSAKI_CANONICAL_SOURCE_ROUTE_PREFIX) &&
      !/^\/\d{4}-\d{2}\/$/.test(s.source_route),
  ),
);

// --- G-9c0c SQL template artifacts ---
const seedSqlPath = path.join(TOOL_ROOT, "scripts/supabase/gosaki-schedules-seed.template.sql");
const migrationPath = path.join(TOOL_ROOT, "scripts/supabase/gosaki-site-slug-migration.template.sql");
const preflightPath = path.join(TOOL_ROOT, "scripts/supabase/gosaki-schedules-seed-preflight.template.sql");

assert("gosaki_seed_sql_template_exists", fs.existsSync(seedSqlPath));
assert("gosaki_site_slug_migration_template_exists", fs.existsSync(migrationPath));
assert("gosaki_seed_preflight_template_exists", fs.existsSync(preflightPath));

if (fs.existsSync(seedSqlPath)) {
  const seedSql = fs.readFileSync(seedSqlPath, "utf8");
  const insertCount = (seedSql.match(/^insert into public\.schedules /gm) ?? []).length;
  assertEqual("gosaki_seed_sql_insert_count", insertCount, 60);
  assert("gosaki_seed_sql_has_site_slug", seedSql.includes("'gosaki-piano'"));
  assert(
    "gosaki_seed_sql_uses_canonical_source_route",
    seedSql.includes("'/schedule/2026-03/'") && seedSql.includes("'/schedule/2026-07/'"),
  );
  assert(
    "gosaki_seed_sql_no_legacy_source_route",
    !seedSql.includes("'/2026-03/'") && !seedSql.includes("'/2026-07/'"),
  );
  assert("gosaki_seed_sql_plain_insert_only", /^insert into public\.schedules /m.test(seedSql));
  assert("gosaki_seed_sql_no_on_conflict", !/on conflict/i.test(seedSql));
  assert(
    "gosaki_seed_sql_collision_warning",
    seedSql.includes("COLLISION WARNING") &&
      seedSql.includes("schedule-2026-07-010") &&
      seedSql.includes("schedule-2026-07-010-poc"),
  );
}

if (fs.existsSync(preflightPath)) {
  const preflightSql = fs.readFileSync(preflightPath, "utf8");
  assert("gosaki_preflight_has_poc_row_check", preflightSql.includes("schedule-2026-07-010"));
  assert(
    "gosaki_preflight_has_canonical_source_route_check",
    preflightSql.includes("/schedule/YYYY-MM/") || preflightSql.includes("source_route"),
  );
  assert(
    "gosaki_preflight_has_rollback_approval_note",
    preflightSql.includes("承認します。この操作を1回だけ実行してください。"),
  );
}

const generated = generateGosakiSchedulesSeedSql(GOSAKI_FIXTURE);
assertEqual(
  "gosaki_seed_sql_generator_matches_extractor",
  generated.result.schedules.length,
  extracted.schedules.length,
);
assert(
  "gosaki_seed_generator_all_canonical_routes",
  generated.result.schedules.every((s) => s.source_route?.startsWith(GOSAKI_CANONICAL_SOURCE_ROUTE_PREFIX)),
);

assert(
  "gosaki_seed_legacy_collision_registered",
  GOSAKI_SEED_LEGACY_ID_COLLISIONS.some((c) => c.legacy_id === "schedule-2026-07-010"),
);

// --- G-9d static fallback (no Supabase env) ---
const supabaseReadPath = path.join(TOOL_ROOT, "scripts/lib/supabase-schedule-read.mjs");
assert("gosaki_supabase_schedule_read_module_exists", fs.existsSync(supabaseReadPath));

const NO_SUPABASE_ENV = {
  PUBLIC_SUPABASE_URL: "",
  PUBLIC_SUPABASE_ANON_KEY: "",
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
};

const fallbackBundle = await loadGosakiScheduleDataForBuild({
  inputDir: GOSAKI_FIXTURE,
  env: NO_SUPABASE_ENV,
});
assert(
  "gosaki_static_fallback_has_schedules",
  fallbackBundle.scheduleDataSource === "static-fallback" &&
    fallbackBundle.schedules.length === 60,
);
const fallbackMonths = deriveScheduleMonthsFromSchedules(fallbackBundle.schedules);
assertEqual("gosaki_static_fallback_month_count", fallbackMonths.length, 5);
assertEqual(
  "gosaki_static_fallback_2026-03_count",
  fallbackMonths.find((m) => m.month === "2026-03")?.count ?? 0,
  13,
);

// --- G-9d1 Supabase read (when operator .env.local present) ---
const supabaseBundle = await loadGosakiScheduleDataForBuild({
  inputDir: GOSAKI_FIXTURE,
});
if (supabaseBundle.scheduleDataSource === "supabase") {
  assertEqual("gosaki_supabase_read_row_count", supabaseBundle.rowCount, 60);
  const supabaseMonths = deriveScheduleMonthsFromSchedules(supabaseBundle.schedules);
  assertEqual("gosaki_supabase_read_month_count", supabaseMonths.length, 5);
  assertEqual(
    "gosaki_supabase_read_2026-07_count",
    supabaseMonths.find((m) => m.month === "2026-07")?.count ?? 0,
    14,
  );
  assert(
    "gosaki_supabase_read_canonical_source_route",
    supabaseBundle.schedules.every((s) =>
      String(s.source_route ?? "").startsWith("/schedule/"),
    ),
  );
} else {
  console.log(
    "SKIP gosaki_supabase_read_* (Supabase env not configured — deferred)",
  );
}

// --- G-9e site_slug schedule read generalization ---
assert(
  "g9e_gosaki_site_config_site_slug",
  GOSAKI_SCHEDULE_SITE_CONFIG.siteSlug === GOSAKI_SITE_SLUG,
);
assertEqual("g9e_gosaki_expected_month_count", GOSAKI_SCHEDULE_SITE_CONFIG.expectedMonths.length, 5);
assert(
  "g9e_canonical_route_filter",
  isCanonicalScheduleSourceRoute("/schedule/2026-07/") &&
    !isCanonicalScheduleSourceRoute("/2026-07/"),
);
let g9eSiteSlugRequired = false;
try {
  await loadScheduleDataForBuild({
    siteSlug: "",
    inputDir: GOSAKI_FIXTURE,
    staticFallback: async () => [],
  });
} catch (err) {
  g9eSiteSlugRequired = String(err.message).includes("siteSlug is required");
}
assert("g9e_generic_loader_requires_site_slug", g9eSiteSlugRequired);
assert(
  "g9e_gosaki_wrapper_uses_generic_loader",
  fs.readFileSync(supabaseReadPath, "utf8").includes("loadScheduleDataForBuild"),
);

console.log("");
console.log(`verify-gosaki-schedule-seed-extractor: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
