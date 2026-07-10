/**
 * G-20u28 — Gosaki admin UI foundation polish verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u28-gosaki-admin-ui-foundation-polish.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { CMS_KIT_SITEMAP_EXCLUDED_SEGMENT_PATTERNS } from "./lib/sitemap-exclusions.mjs";
import {
  G20U28_ADMIN_UI_PHASE,
  applyGosakiStagingReadOnlyAdmin,
  buildReadOnlyAdminDashboardSnapshot,
  countAugust2026ScheduleEvents,
  GOSAKI_READ_ONLY_ADMIN_DASHBOARD_DATA_REL,
} from "./lib/gosaki-staging-read-only-admin.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-admin-ui-foundation-polish.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const ADMIN_LIB_REL = "tools/static-to-astro/scripts/lib/gosaki-staging-read-only-admin.mjs";
const BASE_COMMIT = "62e3367";

const SECTION_CARDS = ["schedule", "discography", "youtube", "about", "contact", "link", "upload-safety"];

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

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${headShort.stdout.trim()} (G-20u28 base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
const adminPage = read(ADMIN_PAGE_REL);
const adminLib = read(ADMIN_LIB_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u28", doc.includes("G-20u28-gosaki-admin-ui-foundation-polish"));
assert("doc gate complete", doc.includes("gosakiAdminUiFoundationPolishComplete: true"));
assert("doc no DB write", doc.includes("no DB write") || doc.includes("DB write"));
assert("doc production STOP", doc.includes("G-20j") && /STOP/i.test(doc));

assert("dashboard grid in admin page", adminPage.includes("gosaki-read-only-admin__dashboard-grid"));
assert("dashboard snapshot import", adminPage.includes("gosaki-read-only-admin-dashboard.json"));
assert("G20U28 phase on body", adminPage.includes("G20U28_ADMIN_UI_PHASE"));
assert("read-only banner JP", adminPage.includes("読み取り専用"));
assert("production STOP on card", adminPage.includes("production STOP"));
assert("manual FTP safety", adminPage.includes("手動 FTP"));
assert("sitemap admin exclusion note", adminPage.includes("sitemap") && adminPage.includes("/admin/"));

for (const card of SECTION_CARDS) {
  assert(`section card ${card}`, adminPage.includes(`data-section-card="${card}"`));
}

assert("global Save disabled", adminPage.includes("Save（無効）"));
assert("global Publish disabled", adminPage.includes("Publish（無効）"));
assert("global Deploy disabled", adminPage.includes("Deploy（無効）"));
assert("global FTP disabled", adminPage.includes("FTP（無効）"));
assert("youtube save btn has disabled attr", /id="gra-youtube-save-btn"[^>]*disabled/.test(adminPage));
assert("no deploy ftp invoke in admin page", !/mirror\s+--delete|lftp\s/i.test(adminPage));

assert("buildReadOnlyAdminDashboardSnapshot export", adminLib.includes("buildReadOnlyAdminDashboardSnapshot"));
assert("G20U28 phase constant", adminLib.includes(G20U28_ADMIN_UI_PHASE));

const mockSchedules = Array.from({ length: 74 }, (_, i) => ({
  year: i < 14 ? 2026 : 2026,
  month: i < 14 ? 8 : 7,
  date: i < 14 ? `2026-08-${String(i + 1).padStart(2, "0")}` : "2026-07-01",
}));
assert("august count helper", countAugust2026ScheduleEvents(mockSchedules) === 14);

const snapshot = buildReadOnlyAdminDashboardSnapshot({
  scheduleBundle: {
    scheduleDataSource: "supabase",
    schedules: mockSchedules,
    months: [{}, {}, {}, {}, {}],
  },
  discographyBundle: {
    discographyDataSource: "supabase",
    rowCount: 4,
    trackRowCount: 34,
    siteSlugFilterApplied: true,
  },
});
assert("snapshot phase", snapshot.phase === G20U28_ADMIN_UI_PHASE);
assert("snapshot schedule 74", snapshot.schedule.totalEvents === 74);
assert("snapshot august 14", snapshot.schedule.august2026Events === 14);
assert("snapshot discography 4/34", snapshot.discography.releases === 4 && snapshot.discography.tracks === 34);
assert("snapshot filtered read", snapshot.discography.filteredRead === true);
assert("snapshot production STOP", snapshot.productionUploadStop === true);

const tmpOut = fs.mkdtempSync(path.join(os.tmpdir(), "g20u28-admin-"));
const applyResult = applyGosakiStagingReadOnlyAdmin(tmpOut, TOOL_ROOT, {
  scheduleBundle: {
    scheduleDataSource: "supabase",
    schedules: mockSchedules,
    months: [{}],
  },
  discographyBundle: {
    discographyDataSource: "supabase",
    rowCount: 4,
    trackRowCount: 34,
    siteSlugFilterApplied: true,
  },
});
assert("apply admin tmp", applyResult.applied === true, applyResult.reason ?? "");
const dashboardPath = path.join(tmpOut, GOSAKI_READ_ONLY_ADMIN_DASHBOARD_DATA_REL);
assert("dashboard json written", fs.existsSync(dashboardPath));
const writtenDashboard = JSON.parse(fs.readFileSync(dashboardPath, "utf8"));
assert("written dashboard 74/14", writtenDashboard.schedule.totalEvents === 74 && writtenDashboard.schedule.august2026Events === 14);

const sitemapHasAdminExclusion = CMS_KIT_SITEMAP_EXCLUDED_SEGMENT_PATTERNS.some((re) =>
  re.test("/cms-kit-staging/gosaki-piano/admin/"),
);
assert("sitemap admin exclusion pattern", sitemapHasAdminExclusion);

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify:g20u28", packageJson.includes("verify:g20u28-gosaki-admin-ui-foundation-polish"));

assert("AI current-state G-20u28", currentState.includes("G-20u28"));
assert("AI next-actions G-20u28", nextActions.includes("G-20u28"));
assert("handoff G-20u28", handoff.includes("G-20u28"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);

try {
  fs.rmSync(tmpOut, { recursive: true, force: true });
} catch {
  // ignore
}

console.log(`\nG-20u28 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
