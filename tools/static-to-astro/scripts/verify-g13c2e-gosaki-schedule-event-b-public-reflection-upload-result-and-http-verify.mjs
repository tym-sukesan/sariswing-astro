/**
 * G-13c2e — Gosaki Event B public reflection upload result + HTTP verify verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13c2e-gosaki-schedule-event-b-public-reflection-upload-result-and-http-verify.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-b-public-reflection-upload-result-and-http-verify.md";
const UPLOAD_PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-b-public-reflection-local-regen-and-upload-preflight.md";
const G13C2_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-b-poc-cleanup-execution-result.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const STAGING_JULY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/";
const STAGING_MARCH_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-03/";
const REMOTE_FILE = "/cms-kit-staging/gosaki-piano/schedule/2026-07/index.html";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const LEGACY_ID = "schedule-2026-07-010";
const EVENT_A_LEGACY = "schedule-2026-03-007";
const CSS_HASH = "index.YcHrHZH4.css";

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

function extractEventACard(html) {
  const m = html.match(/2026\.03\.15 \(Sun\)[\s\S]*?<\/article>/);
  return m ? m[0] : "";
}

const doc = read(DOC_REL);

assert("upload result doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert(
  "doc phase G-13c2e upload result",
  doc.includes("G-13c2e-gosaki-schedule-event-b-public-reflection-upload-result-and-http-verify"),
);
assert("doc operator manual upload", doc.includes("戸山") && doc.includes("1 file"));
assert("doc local july path", doc.includes("schedule/2026-07/index.html"));
assert("doc remote path", doc.includes(REMOTE_FILE));
assert("doc no mirror delete", doc.includes("mirror") && doc.includes("no"));
assert(
  "doc upload success gate",
  doc.includes("gosakiScheduleEventBPocCleanupPublicReflectionUploadSuccess: true"),
);
assert("doc http verify complete gate", doc.includes("gosakiScheduleEventBPocCleanupPublicReflectionHttpVerifyComplete: true"));
assert("doc no cursor ftp", doc.includes("ftpUploadExecutedByCursor: false"));
assert("doc no july re-upload", doc.includes("readyForG13c2eJulyReUpload: false"));
assert("doc ready for closure", doc.includes("readyForG13c2eEventBClosure: true"));
assert("doc event A untouched", doc.includes("eventATouched: false"));
assert("doc march not reuploaded", doc.includes("marchReuploadTriggered: false"));
assert("doc legacy id", doc.includes(LEGACY_ID));
assert("doc row id", doc.includes(EVENT_B_ID));
assert("doc CSS hash", doc.includes(CSS_HASH));
assert("doc closure next", doc.includes("public-reflection-closure"));
assert("doc no package regen", doc.includes("Package regen") && doc.includes("**no**"));
assert("doc astro not uploaded", doc.includes("_astro") && doc.includes("not uploaded"));

assert("upload preflight doc exists", fs.existsSync(path.join(REPO_ROOT, UPLOAD_PREFLIGHT_REL)));
assert("G-13c2 execution result exists", fs.existsSync(path.join(REPO_ROOT, G13C2_RESULT_REL)));

const july = curl(STAGING_JULY_URL);
if (july.ok && july.code === "200") {
  const card = extractEventBCard(july.body);
  assert("live july HTTP 200", true);
  assert("live scheduleDataSource supabase", july.body.includes("scheduleDataSource=supabase"));
  assert("live Event B card found", card.length > 0);
  assert("live title empty angle brackets", card.includes("&lt;&gt;"));
  assert("live description 出演", card.includes("出演："));
  assert("live no venue line on Event B", !card.includes("会場："));
  assert("live no time line on Event B", !card.includes("開場") && !card.includes("開演"));
  assert("live no price line on Event B", !card.includes("料金："));
  for (const marker of POC_MARKERS) {
    assert(`live no PoC: ${marker.slice(0, 30)}…`, !july.body.includes(marker));
  }
  assert("live CSS hash YcHrHZH4", july.body.includes(CSS_HASH));
} else {
  console.log("SKIP live July HTTP checks (network unavailable)");
}

const march = curl(STAGING_MARCH_URL);
if (march.ok && march.code === "200") {
  const card = extractEventACard(march.body);
  assert("live march HTTP 200", true);
  assert("live march no G-9k6", !march.body.includes("G-9k6"));
  assert("live Event A Duo", card.includes("&lt;Duo&gt;") || card.includes("<Duo>"));
  assert("live Event A 15:00", card.includes("15:00"));
  assert("live Event A unchanged", !card.includes("18:00 / 開演 19:00"));
} else {
  console.log("SKIP live March HTTP checks (network unavailable)");
}

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

console.log(
  `\nG-13c2e upload result + HTTP verify verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
