#!/usr/bin/env node
/**
 * G-20t2 — Schedule month discovery generalization verifier.
 * Run: node tools/static-to-astro/scripts/verify-gosaki-schedule-month-discovery-generalization.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolveScheduleMonthsForBuild,
  isValidScheduleMonthOverride,
} from "./lib/schedule-month-discovery.mjs";
import {
  GOSAKI_SCHEDULE_SITE_CONFIG,
  normalizeScheduleRecord,
} from "./lib/supabase-schedule-read.mjs";
import { shouldIncludePageInSitemap, isCmsKitSitemapExcludedPath } from "./lib/sitemap-exclusions.mjs";
import { GOSAKI_SITE_SLUG } from "./lib/gosaki-wix-schedule-extractor.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const STAGING_BASE = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano";
const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-month-discovery-generalization.md";
const SCHEDULE_READ = "tools/static-to-astro/scripts/lib/supabase-schedule-read.mjs";
const DISCOVERY = "tools/static-to-astro/scripts/lib/schedule-month-discovery.mjs";
const PACKAGE_DIST = "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist";
const MONTHS_JSON =
  "tools/static-to-astro/output/gosaki-piano-astro/src/data/gosaki-schedule-months.json";
const SITEMAP = `${PACKAGE_DIST}/sitemap-0.xml`;
const AI_DIR = "tools/static-to-astro/docs/ai";

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

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

// --- doc ---
const doc = read(DOC_REL);
assert("doc exists", exists(DOC_REL));
assert("phase G-20t2", /G-20t2-schedule-month-discovery-generalization/i.test(doc));
assert("gate complete", /gosakiScheduleMonthDiscoveryGeneralizationComplete: true/i.test(doc));
assert("no ftp", /ftpUploadExecuted: false/i.test(doc));
assert("no db write", /dbWriteExecuted: false/i.test(doc));
assert("optionalMonthOverride documented", /optionalMonthOverride/i.test(doc));
assert("expectedMonths removed narrative", /expectedMonths.*removed|remove.*expectedMonths/i.test(doc));

// --- code ---
const scheduleRead = read(SCHEDULE_READ);
const discovery = read(DISCOVERY);
assert("discovery module exists", exists(DISCOVERY));
assert("resolveScheduleMonthsForBuild exported", discovery.includes("export function resolveScheduleMonthsForBuild"));
assert("optionalMonthOverride null default", scheduleRead.includes("optionalMonthOverride: null"));
assert("no expectedMonths array in config", !/expectedMonths:\s*\[/.test(scheduleRead));
assert("supabase months null on gosaki load", /months:\s*null[\s\S]*optionalMonthOverride/.test(scheduleRead));
assert("imports resolveScheduleMonthsForBuild", scheduleRead.includes("resolveScheduleMonthsForBuild"));

// --- unit: new month without config ---
const mockRows = [
  normalizeScheduleRecord({
    legacy_id: "schedule-2026-09-001",
    site_slug: GOSAKI_SITE_SLUG,
    date: "2026-09-05",
    month: "2026-09",
    source_route: "/schedule/2026-09/",
    published: true,
    sort_order: 1,
  }),
  normalizeScheduleRecord({
    legacy_id: "schedule-2026-08-002",
    site_slug: GOSAKI_SITE_SLUG,
    date: "2026-08-05",
    month: "2026-08",
    source_route: "/schedule/2026-08/",
    published: true,
    sort_order: 1,
  }),
];
const discovered = resolveScheduleMonthsForBuild(mockRows, null);
assert(
  "auto discovers 2026-09 without override",
  discovered.some((m) => m.month === "2026-09"),
);
assert(
  "auto discovers 2026-08 without override",
  discovered.some((m) => m.month === "2026-08"),
);
assert(
  "config optionalMonthOverride is null",
  GOSAKI_SCHEDULE_SITE_CONFIG.optionalMonthOverride == null,
);
assert(
  "override adds empty 2026-10",
  resolveScheduleMonthsForBuild([], ["2026-10"]).some((m) => m.month === "2026-10" && m.count === 0),
);
assert("override validator accepts null", isValidScheduleMonthOverride(null));
assert("override validator rejects bad", !isValidScheduleMonthOverride(["not-a-month"]));

// --- sitemap policy (G-20t1 + G-20t2) ---
assert(
  "sitemap includes schedule month",
  shouldIncludePageInSitemap(`${STAGING_BASE}/schedule/2026-08/`) === true,
);
assert(
  "sitemap excludes legacy root month",
  shouldIncludePageInSitemap(`${STAGING_BASE}/2026-08/`) === false,
);
assert("sitemap excludes admin path", isCmsKitSitemapExcludedPath("/cms-kit-staging/gosaki-piano/admin/"));

// --- local package (if regen ran) ---
if (exists(MONTHS_JSON)) {
  const months = JSON.parse(read(MONTHS_JSON));
  assert(
    "package months json includes 2026-08",
    months.some((m) => m.month === "2026-08"),
    months.map((m) => m.month).join(","),
  );
} else {
  console.log("SKIP package months json (regen not run yet)");
}

if (exists(`${PACKAGE_DIST}/schedule/2026-08/index.html`)) {
  assert("package schedule/2026-08 html", true);
} else {
  console.log("SKIP package schedule/2026-08 (regen not run yet)");
}

if (exists(`${PACKAGE_DIST}/2026-08/index.html`)) {
  assert("package legacy 2026-08 stub", true);
} else {
  console.log("SKIP package legacy 2026-08 (regen not run yet)");
}

if (exists(SITEMAP)) {
  const sitemap = read(SITEMAP);
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert("sitemap has schedule/2026-08", locs.some((u) => u.includes("/schedule/2026-08/")));
  assert(
    "sitemap no legacy 2026-08 root",
    !locs.some((u) => {
      const p = new URL(u).pathname;
      return /\/\d{4}-\d{2}\/$/.test(p) && !/\/schedule\/\d{4}-\d{2}\/$/.test(p);
    }),
  );
  assert("sitemap no admin", !locs.some((u) => u.includes("/admin/")));
} else {
  console.log("SKIP sitemap checks (regen not run yet)");
}

// --- AI context ---
for (const f of ["00-current-state.md", "03-next-actions.md", "handoff-to-chatgpt.md"]) {
  const ai = read(`${AI_DIR}/${f}`);
  assert(`AI ${f} mentions G-20t2`, /G-20t2|month-discovery-generalization/i.test(ai));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
