/**
 * G-13e — Gosaki Event A public reflection local regen verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-local-regen.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-public-reflection-local-regen.md";
const PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-public-reflection-preflight.md";
const G13D1_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-execution-result.md";
const BUILD_SCRIPT_REL = "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const MARCH_HTML_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/schedule/2026-03/index.html";
const SCHEDULES_JSON_REL =
  "tools/static-to-astro/output/gosaki-piano-astro/src/data/gosaki-schedules.json";
const MANIFEST_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/MANUAL_UPLOAD_MANIFEST.json";

const LEGACY_ID = "schedule-2026-03-007";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";

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

function extractEventACard(html) {
  const m = html.match(/2026\.03\.15 \(Sun\)[\s\S]*?<\/article>/);
  return m ? m[0] : "";
}

const doc = read(DOC_REL);

assert("G-13e local regen doc exists", exists(DOC_REL));
assert(
  "doc phase G-13e local regen",
  doc.includes("G-13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-local-regen"),
);
assert("doc references preflight", doc.includes("public-reflection-preflight"));
assert("doc build script", doc.includes("build-gosaki-staging-admin-package.mjs"));
assert("doc file count 27", doc.includes("27"));
assert("doc scheduleDataSource supabase", doc.includes("scheduleDataSource=supabase"));
assert("doc PoC absent", doc.includes("G-9k6") && doc.includes("absent"));
assert("doc minimal upload path", doc.includes("schedule/2026-03/index.html"));
assert("doc no FTP this phase", doc.includes("ftpUploadExecuted") && doc.includes("**false**"));
assert("doc upload preflight next", doc.includes("public-reflection-upload-preflight"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc legacy id", doc.includes(LEGACY_ID));
assert("doc 15:00 times", doc.includes("15:00") && doc.includes("15:30"));
assert("doc Event B out of scope july", doc.includes("2026-07") && doc.includes("out of scope"));

assert("preflight doc exists", exists(PREFLIGHT_REL));
assert("G-13d1 result exists", exists(G13D1_RESULT_REL));
assert("build script exists", exists(BUILD_SCRIPT_REL));

if (exists(MARCH_HTML_REL)) {
  const marchHtml = read(MARCH_HTML_REL);
  const card = extractEventACard(marchHtml);
  assert("march html exists", true);
  assert("march scheduleDataSource supabase", marchHtml.includes("scheduleDataSource=supabase"));
  assert("march no G-9k6", !marchHtml.includes("G-9k6"));
  assert("march no G-9k4", !marchHtml.includes("G-9k4"));
  assert("march no 管理画面保存テスト", !marchHtml.includes("管理画面保存テスト"));
  assert("march no UI保存テスト", !marchHtml.includes("UI保存テスト"));
  assert("march Event A date", card.includes("2026.03.15"));
  assert("march Event A Duo title", card.includes("&lt;Duo&gt;") || card.includes("<Duo>"));
  assert("march Event A venue", card.includes("川崎 ぴあにしも"));
  assert("march Event A 15:00", card.includes("15:00"));
  assert("march Event A 15:30", card.includes("15:30"));
  assert("march Event A price", card.includes("3,000円"));
  assert("march Event A no 18:00 on card", !card.includes("18:00 / 開演 19:00"));
} else {
  console.log("SKIP march html artifact checks (package not regenerated on this machine)");
}

if (exists(SCHEDULES_JSON_REL)) {
  const schedules = JSON.parse(read(SCHEDULES_JSON_REL));
  const row = schedules.find((r) => r.legacy_id === LEGACY_ID);
  assert("schedules json row found", Boolean(row));
  assert("json title Duo", row?.title === "<Duo>");
  assert("json open 15:00", row?.open_time === "15:00");
  assert("json start 15:30", row?.start_time === "15:30");
  assert("json price", row?.price === "3,000円");
  assert("json no G-9k6", !String(row?.title ?? "").includes("G-9k6"));
} else {
  console.log("SKIP schedules json checks (astro output not present)");
}

if (exists(MANIFEST_REL)) {
  const manifest = JSON.parse(read(MANIFEST_REL));
  assert("manifest fileCount 27", manifest.fileCount === 27);
  assert("manifest safeForStaticFtp", manifest.safeForStaticFtp === true);
}

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

console.log(
  `\nG-13e public reflection local regen verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
