#!/usr/bin/env node
/**
 * Gosaki Schedule image URL UI + Home SP date — offline checks.
 * No DB write, no Edge deploy, no production build, no FTP.
 *
 * Run: node scripts/verify-gosaki-schedule-image-ui-and-home-date.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildGosakiPianoSiteOverridesCss } from "./lib/site-specific-overrides/gosaki-piano-overrides.mjs";
import { GOSAKI_SCHEDULE_LIST_ASTRO } from "./lib/gosaki-schedule-data-pages.mjs";
import { GOSAKI_SCHEDULE_SELECT } from "./lib/supabase-schedule-read.mjs";
import {
  SCHEDULE_CREATE_PAYLOAD_FIELDS,
  SCHEDULE_EDIT_SAFE_FIELDS,
  normalizeScheduleImageUrl,
  validateScheduleDryRunRequestBody,
} from "./lib/gosaki-schedule-dry-run-edge-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

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

function readRel(rel) {
  return fs.readFileSync(path.join(TOOL_ROOT, rel), "utf8");
}

const css = buildGosakiPianoSiteOverridesCss();
const imageBlock = css.slice(css.indexOf("/* --- gosaki-schedule-image-ui-and-home-date --- */"));
assert("image/date CSS block present", imageBlock.includes("gosaki-schedule-image-ui-and-home-date"));
assert(
  "Home SP date 26px in phase block only",
  imageBlock.includes("@media (max-width: 768px)") &&
    imageBlock.includes(".gosaki-home-schedule__date") &&
    imageBlock.includes("font-size: 26px !important"),
);
assert(
  "Home PC date stays 15px",
  /body\.wix-static-export \.gosaki-home-schedule__date \{\s*margin: 0 0 0\.35rem;\s*font-size: 15px;/.test(
    css,
  ),
);
assert(
  "Home SP date is not in month-card selectors",
  !imageBlock.includes("gosaki-schedule-event-date"),
);
assert(
  "month and home cards are 1000px with a 380px flyer, stacked on mobile",
  imageBlock.includes("max-width: 1000px") &&
    imageBlock.includes("flex: 0 0 380px") &&
    imageBlock.includes("max-width: 380px") &&
    imageBlock.includes("@media (max-width: 768px)") &&
    imageBlock.includes("flex-direction: column") &&
    imageBlock.includes(".gosaki-schedule-event-image img") &&
    imageBlock.includes("max-width: 100%"),
);
assert("month card keeps scroll-margin for fragment jumps", imageBlock.includes("scroll-margin-top: 7rem"));
const homeTpl = readRel("templates/site-extensions/gosaki-piano/GosakiHomeLatestSchedule.astro");
assert(
  "Home thumbnail renders only from gosakiScheduleImageUrl",
  homeTpl.includes("gosakiScheduleImageUrl") &&
    homeTpl.includes("gosaki-home-schedule__flyer") &&
    homeTpl.includes("gosakiHomeScheduleTimeLabel") &&
    homeTpl.includes("imageUrl ? ("),
);

assert(
  "month list template renders image_url only when http(s)",
  GOSAKI_SCHEDULE_LIST_ASTRO.includes("safeScheduleImageUrl") &&
    GOSAKI_SCHEDULE_LIST_ASTRO.includes("gosaki-schedule-event-image") &&
    GOSAKI_SCHEDULE_LIST_ASTRO.includes("ev.image_url") &&
    !GOSAKI_SCHEDULE_LIST_ASTRO.includes("home_image_url"),
);

assert("public SELECT already has image_url", /(?:^|,)image_url(?:,|$)/.test(GOSAKI_SCHEDULE_SELECT));
assert("public SELECT omits home_image_url", !GOSAKI_SCHEDULE_SELECT.includes("home_image_url"));

assert(
  "edit allowlist includes image_url not home_image_url",
  SCHEDULE_EDIT_SAFE_FIELDS.includes("image_url") &&
    !SCHEDULE_EDIT_SAFE_FIELDS.includes("home_image_url"),
);
assert(
  "create allowlist includes image_url not home_image_url",
  SCHEDULE_CREATE_PAYLOAD_FIELDS.includes("image_url") &&
    !SCHEDULE_CREATE_PAYLOAD_FIELDS.includes("home_image_url"),
);

assert("empty image URL → null", normalizeScheduleImageUrl("").ok && normalizeScheduleImageUrl("").value === null);
assert(
  "https image URL kept",
  normalizeScheduleImageUrl("https://example.com/a.jpg").ok &&
    normalizeScheduleImageUrl("https://example.com/a.jpg").value === "https://example.com/a.jpg",
);
assert("javascript: image URL rejected", normalizeScheduleImageUrl("javascript:alert(1)").ok === false);
assert("relative image URL rejected", normalizeScheduleImageUrl("/images/a.jpg").ok === false);

const editBody = validateScheduleDryRunRequestBody({
  operation: "dryRun",
  mode: "edit",
  siteSlug: "gosaki-piano",
  payload: {
    id: "aa440e29-5be8-402e-9190-0d81c48434c0",
    expectedBeforeUpdatedAt: "2026-06-14T15:03:08.762993+00:00",
    title: "t",
    venue: "v",
    open_time: "",
    start_time: "",
    price: "",
    description: "",
    image_url: "https://example.com/flyer.jpg",
    published: true,
  },
});
assert("edit payload accepts image_url", editBody.ok === true);

const unexpectedHome = validateScheduleDryRunRequestBody({
  operation: "dryRun",
  mode: "edit",
  siteSlug: "gosaki-piano",
  payload: {
    id: "aa440e29-5be8-402e-9190-0d81c48434c0",
    expectedBeforeUpdatedAt: "2026-06-14T15:03:08.762993+00:00",
    title: "t",
    venue: "v",
    open_time: "",
    start_time: "",
    price: "",
    description: "",
    image_url: "",
    home_image_url: "https://example.com/x.jpg",
    published: true,
  },
});
assert(
  "edit payload rejects home_image_url",
  unexpectedHome.ok === false &&
    (unexpectedHome.errors || []).some((e) => String(e).includes("home_image_url")),
);

const handler = readRel("scripts/edge-functions/gosaki-schedule-save-dry-run/handler.ts");
const mirror = fs.readFileSync(
  path.join(REPO_ROOT, "supabase/functions/gosaki-schedule-save-dry-run/handler.ts"),
  "utf8",
);
assert("root↔tools handler byte-eq", handler === mirror);
assert("handler EDIT_SAFE_FIELDS has image_url", /EDIT_SAFE_FIELDS[\s\S]*?"image_url"/.test(handler));
assert("handler SCHEDULE_SELECT has image_url", handler.includes("description,image_url,published"));

const adminAstro = readRel(
  "templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleContentPanel.astro",
);
assert(
  "admin form has 画像URL field",
  adminAstro.includes("画像URL") && adminAstro.includes('data-field="image_url"'),
);
assert("admin has image preview", adminAstro.includes("data-gosaki-schedule-image-preview"));

const opEdit = readRel("templates/site-extensions/gosaki-piano/gosaki-staging-schedule-operational-edit.ts");
assert(
  "operational Save payload includes image_url",
  opEdit.includes("image_url: after.image_url") &&
    /SCHEDULE_OPERATIONAL_SAFE_FIELDS[\s\S]*?"image_url"/.test(opEdit),
);

const liveRead = readRel("templates/site-extensions/gosaki-piano/gosaki-staging-admin-live-read.ts");
assert("live-read SELECT includes image_url", liveRead.includes("description,image_url,published"));
assert("live-read maps imageUrl", liveRead.includes("imageUrl: row.image_url"));

const g20 = readRel("templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts");
assert(
  "G20U45 allowlist includes image_url",
  /G20U45_SCHEDULE_EDIT_SAFE_FIELDS[\s\S]*?"image_url"/.test(g20),
);

const g9g4a2 = readRel(
  "scripts/verify-g9g4a2-framework-single-text-field-operational-commonization-c1.mjs",
);
assert("G-9g4a2 still forbids image_url on generic single-field path", g9g4a2.includes("forbidden payload field: image_url"));

assert(
  "month card id uses legacy_id anchor",
  GOSAKI_SCHEDULE_LIST_ASTRO.includes("function gosakiScheduleEventAnchorId") &&
    GOSAKI_SCHEDULE_LIST_ASTRO.includes("id={anchor || undefined}") &&
    !GOSAKI_SCHEDULE_LIST_ASTRO.includes("id={ev.date"),
);
assert(
  "admin offers existing image choices",
  adminAstro.includes("data-gosaki-schedule-image-library") &&
    adminAstro.includes("既存画像から選択"),
);
const choiceAt = opEdit.indexOf("data-gosaki-schedule-image-choice");
const uploadCallAt = opEdit.indexOf("void runScheduleImageUpload()");
const choiceBranch = choiceAt >= 0 && uploadCallAt > choiceAt ? opEdit.slice(choiceAt, uploadCallAt) : "";
assert(
  "existing image choice writes image_url and does not upload",
  choiceBranch.includes("image_url: url") &&
    !choiceBranch.includes("uploadGosakiScheduleImage") &&
    !choiceBranch.includes("runScheduleImageUpload") &&
    opEdit.includes("await uploadGosakiScheduleImage("),
);

const reuseStart = opEdit.indexOf("function isSafeHttpUrl");
const reuseEnd = opEdit.indexOf("function renderScheduleImageLibrary");
const reuseSource = opEdit
  .slice(reuseStart, reuseEnd)
  .replace("function isSafeHttpUrl(raw: string): boolean", "function isSafeHttpUrl(raw)")
  .replace(
    /export function listReusableScheduleImageUrls\(\s*events:[\s\S]*?\): string\[\]/,
    "function listReusableScheduleImageUrls(events)",
  )
  .replaceAll(": string[]", "")
  .replaceAll("<string>", "");
const listReusableScheduleImageUrls = new Function(`${reuseSource}\nreturn listReusableScheduleImageUrls;`)();
const reused = listReusableScheduleImageUrls([
  { imageUrl: "" },
  { imageUrl: "https://cdn.example/a.jpg" },
  { imageUrl: "https://cdn.example/a.jpg" },
  { imageUrl: "javascript:alert(1)" },
  { imageUrl: " https://cdn.example/b.jpg " },
]);
assert(
  "reusable urls drop empty, unsafe, and duplicates",
  reused.join("|") === "https://cdn.example/a.jpg|https://cdn.example/b.jpg",
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
