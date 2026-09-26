#!/usr/bin/env node
/**
 * Gosaki Home latest published schedule — offline checks.
 * No DB write, no production build, no FTP.
 *
 * Run: node scripts/verify-gosaki-home-latest-schedule.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BASELINE_HOME_IN,
  BASELINE_HOME_YT_OUT,
} from "./lib/cms-core-v2-gosaki-site-generator-hooks-html-baseline-fixtures.mjs";
import {
  GOSAKI_HOME_LATEST_SCHEDULE_LIMIT,
  applyGosakiHomeLatestSchedule,
  gosakiHomeScheduleTodayJst,
  injectGosakiHomeLatestScheduleIntoHomePage,
  selectGosakiHomeLatestSchedules,
} from "./lib/gosaki-home-latest-schedule.mjs";
import { GOSAKI_HOME_SCHEDULE_SLOT } from "./lib/gosaki-home-stale-this-week-hide.mjs";
import { injectYouTubeEmbedIntoHomePage } from "./lib/gosaki-home-youtube-embed.mjs";
import { applyGosakiScheduleDataPages } from "./lib/gosaki-schedule-data-pages.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

let passed = 0;
let failed = 0;
function assert(name, cond) {
  if (cond) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}`);
  }
}

const rows = [
  { published: false, date: "2026-10-01", title: "hidden", venue: "x" },
  { published: true, date: "2026-10-02", title: "upcoming-2", venue: "A", sort_order: 20 },
  { published: true, date: "2026-10-01", title: "upcoming-1", venue: "B", sort_order: 10 },
  { published: true, date: "2026-09-01", title: "past", venue: "C", sort_order: 1 },
  { published: true, date: "2026-10-03", title: "upcoming-3", venue: "D", sort_order: 30 },
  { published: true, date: "2026-10-04", title: "upcoming-4", venue: "E", sort_order: 40 },
  { published: true, date: "2026-10-05", title: "upcoming-5", venue: "F", sort_order: 50 },
  { published: true, date: null, title: "no-date", venue: "G" },
  { published: true, date: "2026-10-06", title: "tbd", date_status: "tbd", venue: "H" },
  {
    published: true,
    date: "2026-10-07",
    title: "hub",
    venue: "I",
    monthMembership: { kind: "hub-only" },
  },
];

const utcStillPrevCalendar = new Date("2026-09-25T16:00:00.000Z");
assert(
  "JST today after UTC calendar rollover",
  gosakiHomeScheduleTodayJst(utcStillPrevCalendar) === "2026-09-26" &&
    utcStillPrevCalendar.toISOString().slice(0, 10) === "2026-09-25",
);
assert(
  "JST today before Tokyo midnight",
  gosakiHomeScheduleTodayJst(new Date("2026-09-25T14:59:59.000Z")) === "2026-09-25",
);

const upcoming = selectGosakiHomeLatestSchedules(rows, { today: "2026-09-26", limit: 4 });
assert("limit 4", upcoming.length === 4 && GOSAKI_HOME_LATEST_SCHEDULE_LIMIT === 4);
assert(
  "upcoming date order + published only",
  upcoming.map((r) => r.title).join(",") === "upcoming-1,upcoming-2,upcoming-3,upcoming-4",
);
assert("skips unpublished / tbd / hub-only / no-date", !upcoming.some((r) => /hidden|tbd|hub|no-date/.test(String(r.title))));

const pastOnly = selectGosakiHomeLatestSchedules(
  [
    { published: true, date: "2026-07-30", title: "jul-30", venue: "a" },
    { published: true, date: "2026-07-28", title: "jul-28", venue: "b" },
    { published: true, date: "2026-03-01", title: "mar", venue: "c" },
  ],
  { today: "2026-09-26", limit: 2 },
);
assert("past fallback latest-first", pastOnly.map((r) => r.title).join(",") === "jul-30,jul-28");

const slotted = `---\nimport BaseLayout from "../layouts/BaseLayout.astro";\n---\n\n<BaseLayout>\n${GOSAKI_HOME_SCHEDULE_SLOT}\n</BaseLayout>\n`;
const injected = injectGosakiHomeLatestScheduleIntoHomePage(slotted);
assert("inject adds import + component", injected.includes("GosakiHomeLatestSchedule.astro") && injected.includes("<GosakiHomeLatestSchedule />"));
assert("inject keeps slot for YouTube", injected.includes(GOSAKI_HOME_SCHEDULE_SLOT));
const twice = injectGosakiHomeLatestScheduleIntoHomePage(injected);
assert("inject is idempotent", (twice.match(/<GosakiHomeLatestSchedule \/>/g) || []).length === 1);

const islandPage = `---\nimport BaseLayout from "../layouts/BaseLayout.astro";\n---\n<div><!--$-->kv<!--/$--><!--$--><section id="comp-m8y3dzb6"><div data-mesh-id="comp-m8y3dzb6inlineContent-gridContainer"><!--$-->\n${GOSAKI_HOME_SCHEDULE_SLOT}\n<!--/$--></div></section><!--/$--></div>\n`;
const islandInjected = injectGosakiHomeLatestScheduleIntoHomePage(islandPage);
const scheduleBlock = islandInjected.slice(
  islandInjected.indexOf('<section id="comp-m8y3dzb6"'),
  islandInjected.indexOf("</section>") + 10,
);
assert(
  "inject unwraps Astro islands so the component can render",
  islandInjected.includes("<GosakiHomeLatestSchedule />") &&
    scheduleBlock.includes("<GosakiHomeLatestSchedule />") &&
    !scheduleBlock.includes("<!--$-->") &&
    islandInjected.includes("<!--/$-->\n<section id=\"comp-m8y3dzb6\""),
);

assert("YouTube baseline inject unchanged", injectYouTubeEmbedIntoHomePage(BASELINE_HOME_IN) === BASELINE_HOME_YT_OUT);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gosaki-home-latest-"));
fs.mkdirSync(path.join(tmp, "src/pages"), { recursive: true });
fs.writeFileSync(path.join(tmp, "src/pages/index.astro"), slotted, "utf8");
applyGosakiScheduleDataPages(
  tmp,
  {
    scheduleDataSource: "static-fallback",
    schedules: rows.filter((r) => r.published === true && r.date === "2026-10-01"),
    months: [{ month: "2026-10", label: "2026.10", route: "/schedule/2026-10/" }],
  },
  { baseUrl: null, deployBase: "/" },
);
const applied = applyGosakiHomeLatestSchedule(tmp, TOOL_ROOT);
assert("apply writes component + lib", applied.applied === true && applied.count === 1);
assert(
  "month generator still GosakiScheduleList",
  fs.readFileSync(path.join(tmp, "src/pages/schedule/2026-10/index.astro"), "utf8").includes("GosakiScheduleList"),
);
assert(
  "hub unchanged class",
  fs.readFileSync(path.join(tmp, "src/pages/schedule/index.astro"), "utf8").includes("gosaki-schedule-hub"),
);

const adapter = fs.readFileSync(path.join(TOOL_ROOT, "scripts/lib/gosaki-site-generator-hooks-adapter.mjs"), "utf8");
const post = adapter.slice(adapter.indexOf("applyPostGenerate(outDir"));
const hideAt = post.indexOf("applyGosakiHomeStaleThisWeekHide");
const homeAt = post.indexOf("applyGosakiHomeLatestSchedule");
const ytAt = post.indexOf("applyGosakiHomeYouTubeEmbed");
assert("adapter hide → home latest → YouTube", hideAt >= 0 && hideAt < homeAt && homeAt < ytAt);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
