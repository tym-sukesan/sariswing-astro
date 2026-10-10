#!/usr/bin/env node
/**
 * Gosaki final UX fixes — offline checks.
 * No DB write, no production build, no FTP.
 *
 * Run: node scripts/verify-gosaki-final-ux-fixes.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateHeaderAstro } from "./lib/header-transform.mjs";
import { gosakiHomeScheduleMonthPath } from "./lib/gosaki-home-latest-schedule.mjs";
import { buildGosakiPianoSiteOverridesCss } from "./lib/site-specific-overrides/gosaki-piano-overrides.mjs";

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

const css = buildGosakiPianoSiteOverridesCss();
const uxBlock = css.slice(css.indexOf("/* --- gosaki-final-ux-fixes --- */"));
assert("ux-fix CSS block present", uxBlock.includes("gosaki-final-ux-fixes"));
assert(
  "SP open menu rotates bars into ×",
  uxBlock.includes("is-nav-open .nav-toggle__bar:nth-child(1)") &&
    uxBlock.includes("rotate(45deg)") &&
    uxBlock.includes("nth-child(2)") &&
    uxBlock.includes("opacity: 0") &&
    uxBlock.includes("rotate(-45deg)"),
);
assert(
  "× transform is SP-only",
  uxBlock.includes("@media (max-width: 768px)") &&
    uxBlock.indexOf("@media (max-width: 768px)") < uxBlock.indexOf("is-nav-open .nav-toggle__bar:nth-child(1)"),
);
assert(
  "PC hamburger remains hidden",
  css.includes("@media (min-width: 769px)") &&
    /@media \(min-width: 769px\)[\s\S]*?#SITE_HEADER \.nav-toggle \{[\s\S]*?display: none !important/.test(css),
);
assert(
  "SP month date uses PC max size 1.625rem",
  uxBlock.includes(".gosaki-schedule-month .gosaki-schedule-event-date") &&
    uxBlock.includes("font-size: 1.625rem !important"),
);
assert(
  "PC date clamp unchanged",
  css.includes("font-size: clamp(1.125rem, 4vw, 1.625rem) !important") &&
    !uxBlock.includes("clamp("),
);
assert("home item link styles present", uxBlock.includes(".gosaki-home-schedule__link"));

const headerHtml =
  '<div id="comp-mbdw9tzc"><h1 class="font_0">SAKI GOTO Website</h1></div><!--/$-->' +
  '<div id="comp-mbdw7xid"><nav aria-label="Main"><a href="/">Home</a><a href="/about/">About</a>' +
  '<a href="/discography/">Discography</a></nav></div>';
const header = generateHeaderAstro(headerHtml, "Header", { scheduleHub: true });
assert(
  "nav toggle keeps existing open/close class + aria",
  header.content.includes('classList.add("is-nav-open")') &&
    header.content.includes('aria-expanded="false"') &&
    header.content.includes('setAttribute("aria-expanded", open ? "true" : "false")') &&
    header.content.includes('setAttribute("aria-label", open ? "Close menu" : "Open menu")'),
);

assert("2026-09-26 → /schedule/2026-09/", gosakiHomeScheduleMonthPath("2026-09-26") === "/schedule/2026-09/");
assert("2026-10-01 → /schedule/2026-10/", gosakiHomeScheduleMonthPath("2026-10-01") === "/schedule/2026-10/");

const homeTpl = fs.readFileSync(
  path.join(TOOL_ROOT, "templates/site-extensions/gosaki-piano/GosakiHomeLatestSchedule.astro"),
  "utf8",
);
assert(
  "home wraps items as month links and keeps CTA",
  homeTpl.includes("gosaki-home-schedule__link") &&
    homeTpl.includes("gosakiHomeScheduleItemPath") &&
    homeTpl.includes("Scheduleを見る") &&
    homeTpl.includes('withBase("/schedule/")'),
);
assert("home selection helper still used", homeTpl.includes("selectGosakiHomeLatestSchedules"));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
