/**
 * G-13e — Gosaki Event A public reflection upload execution result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-execution-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-execution-result.md";
const UPLOAD_PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-preflight.md";
const G13D1_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-execution-result.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const STAGING_MONTH_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-03/";
const STAGING_JULY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const LEGACY_ID = "schedule-2026-03-007";

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

function extractEventACard(html) {
  const m = html.match(/2026\.03\.15 \(Sun\)[\s\S]*?<\/article>/);
  return m ? m[0] : "";
}

const doc = read(DOC_REL);

assert("upload execution result doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert(
  "doc phase G-13e upload execution result",
  doc.includes(
    "G-13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-execution-result",
  ),
);
assert("doc operator manual upload", doc.includes("戸山") && doc.includes("1 file"));
assert("doc local path", doc.includes("schedule/2026-03/index.html"));
assert("doc remote path", doc.includes("/cms-kit-staging/gosaki-piano/schedule/2026-03/index.html"));
assert("doc no mirror delete", doc.includes("mirror") && doc.includes("no"));
assert("doc upload success gate", doc.includes("gosakiScheduleEventAPocCleanupPublicReflectionUploadSuccess: true"));
assert("doc no cursor ftp", doc.includes("ftpUploadExecutedByCursor: false"));
assert("doc no re-upload", doc.includes("readyForG13ePublicReflectionReUpload: false"));
assert("doc Event B not touched", doc.includes("eventBTouched: false"));
assert("doc legacy id", doc.includes(LEGACY_ID));
assert("doc 15:00 times", doc.includes("15:00") && doc.includes("15:30"));
assert("doc closure next", doc.includes("public-reflection-closure"));
assert("doc no Event B id in upload scope", !doc.includes(`uploaded ${EVENT_B_ID}`));

assert("upload preflight doc exists", fs.existsSync(path.join(REPO_ROOT, UPLOAD_PREFLIGHT_REL)));
assert("G-13d1 result exists", fs.existsSync(path.join(REPO_ROOT, G13D1_RESULT_REL)));

const march = curl(STAGING_MONTH_URL);
if (march.ok && march.code === "200") {
  const card = extractEventACard(march.body);
  assert("live march HTTP 200", true);
  assert("live scheduleDataSource supabase", march.body.includes("scheduleDataSource=supabase"));
  assert("live no G-9k6", !march.body.includes("G-9k6"));
  assert("live no G-9k4", !march.body.includes("G-9k4"));
  assert("live no 管理画面保存テスト", !march.body.includes("管理画面保存テスト"));
  assert("live no UI保存テスト", !march.body.includes("UI保存テスト"));
  assert("live Event A date", card.includes("2026.03.15"));
  assert("live Event A Duo", card.includes("&lt;Duo&gt;") || card.includes("<Duo>"));
  assert("live Event A venue", card.includes("川崎 ぴあにしも"));
  assert("live Event A 15:00", card.includes("15:00"));
  assert("live Event A 15:30", card.includes("15:30"));
  assert("live Event A price", card.includes("3,000円"));
  assert("live Event A no stale 18:00 card", !card.includes("18:00 / 開演 19:00"));
} else {
  console.log("SKIP live March HTTP checks (network unavailable)");
}

const july = curl(STAGING_JULY_URL);
if (july.ok && july.code === "200") {
  assert("live july HTTP 200", true);
  assert(
    "live july Event B PoC still present (untouched)",
    july.body.includes("CMS Kit staging") || july.body.includes("G-9g"),
  );
} else {
  console.log("SKIP live July HTTP checks (network unavailable)");
}

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

console.log(
  `\nG-13e upload execution result verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
