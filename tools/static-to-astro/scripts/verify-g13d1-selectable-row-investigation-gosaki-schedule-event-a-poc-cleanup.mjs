/**
 * G-13d1 — Event A selectable row investigation verifier (static analysis).
 * Run: node tools/static-to-astro/scripts/verify-g13d1-selectable-row-investigation-gosaki-schedule-event-a-poc-cleanup.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-selectable-row-investigation.md";
const UI_REL = "src/lib/admin/staging-data/gosaki-schedule-event-a-poc-cleanup-ui.ts";
const BINDING_REL = "src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-binding.ts";
const UTILS_REL = "src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-utils.ts";
const READ_REL = "src/lib/admin/staging-write/staging-schedule-read.ts";
const ASTRO_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const CONFIG_REL = "src/lib/admin/staging-data/staging-schedule-site-slug-config.ts";

const EVENT_A_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const POC_MARKER = "[CMS Kit staging]";

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

function rowContainsPocAuditMarker(row) {
  const fields = [
    row.title,
    row.venue,
    row.open_time,
    row.start_time,
    row.price,
    row.description,
  ];
  return fields.some((value) => String(value ?? "").includes(POC_MARKER));
}

function isPocAuditScheduleRow(row, eventBId) {
  if (row.id === eventBId) return true;
  return rowContainsPocAuditMarker(row);
}

const doc = read(DOC_REL);
const uiSrc = read(UI_REL);
const bindingSrc = read(BINDING_REL);
const utilsSrc = read(UTILS_REL);
const readSrc = read(READ_REL);
const astroSrc = read(ASTRO_REL);
const configSrc = read(CONFIG_REL);

assert("investigation doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert("doc phase investigation", doc.includes("G-13d1-event-a-poc-cleanup-execution-blocked-selectable-row-investigation"));
assert("doc error message", doc.includes("not found in selectable rows"));
assert("doc Event A id", doc.includes(EVENT_A_ID));
assert("doc no Event B as target", !doc.includes(`Target Event B`) && doc.includes("Event B"));
assert("doc data-selectable-rows coupling", doc.includes("data-selectable-rows"));
assert("doc splitSelectableAndAuditRows", doc.includes("splitSelectableAndAuditRows"));
assert("doc past date not binding cause", doc.includes("Past date") || doc.includes("過去日付"));
assert("doc loadScheduleRowForSiteSlugRead fix", doc.includes("loadScheduleRowForSiteSlugRead"));
assert("doc next phase G-13d1b", doc.includes("G-13d1b-gosaki-schedule-event-a-poc-cleanup-target-row-resolve-fix"));
assert("doc no Save this phase", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));
assert("doc source_route check", doc.includes("source_route"));

assert("UI findTargetRowFromOperatorSection", uiSrc.includes("findTargetRowFromOperatorSection"));
assert("UI uses data-selectable-rows", uiSrc.includes("data-selectable-rows"));
assert("UI error not found message", uiSrc.includes("not found in selectable rows"));
assert("UI does not call loadScheduleRowForSiteSlugRead", !uiSrc.includes("loadScheduleRowForSiteSlugRead"));

assert("binding splitSelectableAndAuditRows", bindingSrc.includes("splitSelectableAndAuditRows"));
assert("binding publishedFilter all", bindingSrc.includes('publishedFilter: "all"'));
assert("utils isPocAuditScheduleRow", utilsSrc.includes("isPocAuditScheduleRow"));
assert("read loadScheduleRowForSiteSlugRead exists", readSrc.includes("loadScheduleRowForSiteSlugRead"));
assert("astro data-selectable-rows", astroSrc.includes("data-selectable-rows={rowsJson}"));
assert("astro selectableRows only", astroSrc.includes("JSON.stringify(binding.selectableRows)"));

assert("config Event B pilot id", configSrc.includes(EVENT_B_ID));
assert("config POC marker", configSrc.includes(POC_MARKER));

const eventAG9k6 = {
  id: EVENT_A_ID,
  title: "<Duo> [G-9k6 title UI保存テスト]",
  venue: "川崎 ぴあにしも [G-9k6 venue UI保存テスト]",
  open_time: "18:00",
  start_time: "19:00",
  price: "3,000円（G-9k6 price UI保存テスト）",
  description:
    "出演：長谷川薫vo 後藤沙紀pf\n会場website: http://pubhpp.com/\n（管理画面保存テスト / G-9k4 UI保存テスト）",
};
assert(
  "simulation Event A not poc audit row",
  isPocAuditScheduleRow(eventAG9k6, EVENT_B_ID) === false,
);

const eventBCmsKit = {
  id: EVENT_B_ID,
  title: "[CMS Kit staging] G-9g2 title PoC",
  venue: "x",
  open_time: "a",
  start_time: "b",
  price: "c",
  description: "d",
};
assert(
  "simulation Event B is poc audit row",
  isPocAuditScheduleRow(eventBCmsKit, EVENT_B_ID) === true,
);

function isCanonicalScheduleSourceRoute(route, prefix = "/schedule/") {
  const p = prefix.endsWith("/") ? prefix : `${prefix}/`;
  const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}\\d{4}-\\d{2}/$`).test(String(route ?? ""));
}
assert("simulation canonical source_route pass", isCanonicalScheduleSourceRoute("/schedule/2026-03/"));
assert("simulation legacy source_route fail", !isCanonicalScheduleSourceRoute("/2026-03/"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "src/pages/admin/index.astro"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

console.log(`\nG-13d1 selectable row investigation verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
