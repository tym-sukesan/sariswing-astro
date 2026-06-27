/**
 * G-13c2e — Gosaki Event B public reflection local regen + upload preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13c2e-gosaki-schedule-event-b-public-reflection-local-regen-and-upload-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-b-public-reflection-local-regen-and-upload-preflight.md";
const G13C2_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-b-poc-cleanup-execution-result.md";
const G14C_REL =
  "tools/static-to-astro/docs/gosaki-public-reflection-operation-standardization.md";
const BUILD_SCRIPT_REL = "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs";
const FTP_SAFETY_REL =
  "tools/static-to-astro/docs/ftp-deploy-root-delete-incident-and-safety-hardening.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const JULY_HTML_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/schedule/2026-07/index.html";
const MARCH_HTML_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/schedule/2026-03/index.html";
const SCHEDULES_JSON_REL =
  "tools/static-to-astro/output/gosaki-piano-astro/src/data/gosaki-schedules.json";
const ASTRO_CSS_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/_astro/index.YcHrHZH4.css";
const ASTRO_JS_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/_astro/index.astro_astro_type_script_index_0_lang.CTyGy8yS.js";

const LEGACY_ID = "schedule-2026-07-010";
const ROW_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const STAGING_JULY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/";
const REMOTE_FILE = "/cms-kit-staging/gosaki-piano/schedule/2026-07/index.html";

const POC_MARKERS = [
  "[CMS Kit staging] G-9g2 title PoC",
  "[CMS Kit staging] G-9g3b venue PoC",
  "[CMS Kit staging] G-9g3c open PoC",
  "[CMS Kit staging] G-9g3c start PoC",
  "[CMS Kit staging] G-9g3d general edit price PoC",
  "[G-9g3b venue+description PoC]",
];

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

function curl(url) {
  const r = spawnSync("/usr/bin/curl", ["-sS", "-w", "\n%{http_code}", url], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (r.status !== 0) return { ok: false, body: "", code: "0" };
  const parts = r.stdout.trimEnd().split("\n");
  const code = parts.pop();
  return { ok: true, body: parts.join("\n"), code };
}

function extractEventBCard(html) {
  const m = html.match(/2026\.07\.19 \(Sun\)[\s\S]*?<\/article>/);
  return m ? m[0] : "";
}

const doc = read(DOC_REL);

assert("G-13c2e preflight doc exists", exists(DOC_REL));
assert(
  "doc phase G-13c2e",
  doc.includes("G-13c2e-gosaki-schedule-event-b-public-reflection-local-regen-and-upload-preflight"),
);
assert("doc references G-13c2 execution result", doc.includes("gosaki-schedule-event-b-poc-cleanup-execution-result"));
assert("doc references G-14c", doc.includes("gosaki-public-reflection-operation-standardization"));
assert("doc build script", doc.includes("build-gosaki-staging-admin-package.mjs"));
assert("doc file count 27", doc.includes("27"));
assert("doc scheduleDataSource supabase", doc.includes("scheduleDataSource=supabase"));
assert("doc PoC absent section", doc.includes("G-9g2") && doc.includes("absent"));
assert("doc minimal upload july path", doc.includes("schedule/2026-07/index.html"));
assert("doc remote path", doc.includes(REMOTE_FILE));
assert("doc staging URL", doc.includes(STAGING_JULY_URL));
assert("doc CSS hash unchanged", doc.includes("YcHrHZH4") && doc.includes("**no**"));
assert("doc no FTP this phase", doc.includes("ftpUploadExecuted") && doc.includes("**false**"));
assert("doc post-upload HTTP not executed", doc.includes("postUploadHttpVerifyExecuted") && doc.includes("**false**"));
assert("doc upload execution next", doc.includes("public-reflection-upload-execution"));
assert("doc legacy id", doc.includes(LEGACY_ID));
assert("doc row id", doc.includes(ROW_ID));
assert("doc expected title", doc.includes("`<>`") || doc.includes("title** | `<>`"));
assert("doc march out of scope", doc.includes("2026-03") && doc.includes("Out of scope"));
assert("doc approval phrase", doc.includes("承認します。この手動アップロードを1回だけ実行してください。"));
assert("doc stop conditions", doc.includes("Stop immediately") || doc.includes("**Stop**"));
assert("doc event A untouched", doc.includes("eventATouched") && doc.includes("**false**"));

assert("G-13c2 execution result doc exists", exists(G13C2_RESULT_REL));
assert("G-14c standard doc exists", exists(G14C_REL));
assert("build script exists", exists(BUILD_SCRIPT_REL));
assert("ftp safety doc exists", exists(FTP_SAFETY_REL));

if (exists(JULY_HTML_REL)) {
  const localHtml = read(JULY_HTML_REL);
  const card = extractEventBCard(localHtml);
  assert("local july html exists", true);
  assert("local scheduleDataSource supabase", localHtml.includes("scheduleDataSource=supabase"));
  assert("local Event B card found", card.length > 0);
  assert("local title empty angle brackets", card.includes("&lt;&gt;"));
  assert("local description 出演", card.includes("出演："));
  assert("local no venue line on Event B", !card.includes("会場："));
  assert("local no time line on Event B", !card.includes("開場") && !card.includes("開演"));
  assert("local no price line on Event B", !card.includes("料金："));
  for (const marker of POC_MARKERS) {
    assert(`local no PoC: ${marker.slice(0, 30)}…`, !localHtml.includes(marker));
  }
} else {
  assert("local july html exists", false, "package not built on this machine");
}

if (exists(SCHEDULES_JSON_REL)) {
  const rows = JSON.parse(read(SCHEDULES_JSON_REL));
  const row = rows.find((r) => r.legacy_id === LEGACY_ID);
  assert("json row schedule-2026-07-010", Boolean(row));
  if (row) {
    assert("json title", row.title === "<>");
    assert("json venue null", row.venue === null);
    assert("json open_time null", row.open_time === null);
    assert("json start_time null", row.start_time === null);
    assert("json price null", row.price === null);
    assert("json description", row.description === "出演：");
    assert("json date", row.date === "2026-07-19");
  }
} else {
  assert("schedules json exists", false);
}

assert("astro CSS hash file exists", exists(ASTRO_CSS_REL));
assert("astro JS hash file exists", exists(ASTRO_JS_REL));
assert("css hash YcHrHZH4", ASTRO_CSS_REL.includes("YcHrHZH4"));
assert("js hash CTyGy8yS", ASTRO_JS_REL.includes("CTyGy8yS"));

if (exists(MARCH_HTML_REL)) {
  const march = read(MARCH_HTML_REL);
  assert("march Event A no G-9k6", !march.includes("G-9k6"));
  assert("march scheduleDataSource supabase", march.includes("scheduleDataSource=supabase"));
}

const live = curl(STAGING_JULY_URL);
if (live.ok && live.code === "200") {
  const liveCard = extractEventBCard(live.body);
  assert("live july HTTP 200", true);
  assert("live pre-upload G-9g2 present (gap)", live.body.includes("G-9g2 title PoC"));
  assert("live pre-upload PoC on Event B card", liveCard.includes("G-9g2"));
} else {
  console.log("SKIP live HTTP checks (network unavailable)");
}

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

console.log(
  `\nG-13c2e local regen + upload preflight verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
