/**
 * G-14b1e-upload — Gosaki routine edit public reflection upload result + HTTP verify verifier.
 * Run: node tools/static-to-astro/scripts/verify-g14b1e-gosaki-schedule-routine-edit-public-reflection-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-routine-edit-public-reflection-result.md";
const PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-schedule-routine-edit-public-reflection-local-regen-and-upload-preflight.md";
const SAVE_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-schedule-routine-edit-save-execution-result.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const STAGING_APRIL_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-04/";
const STAGING_MARCH_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-03/";
const STAGING_JULY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/";
const REMOTE_FILE = "/cms-kit-staging/gosaki-piano/schedule/2026-04/index.html";
const TARGET_ID = "14230329-dde5-40d6-b9b3-75aefe140daf";
const LEGACY_ID = "schedule-2026-04-005";
const PRICE_AFTER = "3,300円（税込）";
const PRICE_BEFORE = "3,300円(tax in)";
const CSS_HASH = "index.YcHrHZH4.css";

const AUDIT_MARKERS = [
  "[CMS Kit staging]",
  "[G-14b1 routine PoC]",
  "G-9g PoC",
  "[CMS Kit staging] G-9g2 title PoC",
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

function extractTrioCard(html) {
  const m = html.match(/2026\.04\.12 \(Sun\)[\s\S]*?<\/article>/);
  return m ? m[0] : "";
}

const doc = read(DOC_REL);

assert("result doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert(
  "doc phase G-14b1e-upload",
  doc.includes("G-14b1e-upload-gosaki-schedule-routine-edit-public-reflection-result"),
);
assert("doc operator manual upload", doc.includes("戸山") && doc.includes("1 file"));
assert("doc local april path", doc.includes("schedule/2026-04/index.html"));
assert("doc remote path", doc.includes(REMOTE_FILE));
assert("doc upload success gate", doc.includes("gosakiScheduleRoutineEditPublicReflectionUploadSuccess: true"));
assert("doc http verify complete gate", doc.includes("gosakiScheduleRoutineEditPublicReflectionHttpVerifyComplete: true"));
assert("doc no cursor ftp", doc.includes("ftpUploadExecutedByCursor: false"));
assert("doc no april re-upload", doc.includes("readyForG14b1AprilReUpload: false"));
assert("doc ready for closure", doc.includes("readyForG14b1fRoutineEditReflectionClosure: true"));
assert("doc target id", doc.includes(TARGET_ID));
assert("doc legacy id", doc.includes(LEGACY_ID));
assert("doc new price", doc.includes(PRICE_AFTER));
assert("doc old price absent", doc.includes(PRICE_BEFORE) && doc.includes("absent"));
assert("doc http 200", doc.includes("**200**"));
assert("doc scheduleDataSource", doc.includes("scheduleDataSource=supabase"));
assert("doc event A untouched", doc.includes("eventATouched: false"));
assert("doc march not reuploaded", doc.includes("marchReuploadTriggered: false"));
assert("doc july not reuploaded", doc.includes("julyReuploadTriggered: false"));
assert("doc no package regen", doc.includes("cursorPackageRegenExecuted: false"));

assert("preflight doc exists", fs.existsSync(path.join(REPO_ROOT, PREFLIGHT_REL)));
assert("save result doc exists", fs.existsSync(path.join(REPO_ROOT, SAVE_RESULT_REL)));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

const april = curl(STAGING_APRIL_URL);
if (april.ok) {
  assert("live April HTTP 200", april.code === "200", april.code);
  assert("live scheduleDataSource supabase", april.body.includes("scheduleDataSource=supabase"));
  assert("live CSS hash unchanged", april.body.includes(CSS_HASH));
  const trio = extractTrioCard(april.body);
  assert("live Trio card found", trio.length > 0);
  assert("live Trio date", trio.includes("2026.04.12 (Sun)"));
  assert("live Trio title", trio.includes("&lt;Trio&gt;"));
  assert("live Trio venue", trio.includes("吉祥寺 Strings"));
  assert("live Trio times", trio.includes("開場 12:00") && trio.includes("開演 13:00"));
  assert("live Trio new price", trio.includes(`料金：${PRICE_AFTER}`));
  assert("live Trio performers", trio.includes("宮崎幸子vo"));
  assert("live Trio old price absent", !trio.includes(PRICE_BEFORE));
  for (const marker of AUDIT_MARKERS) {
    assert(`live no audit marker: ${marker}`, !april.body.includes(marker));
  }
} else {
  assert("live April curl", false, "curl failed");
}

const march = curl(STAGING_MARCH_URL);
if (march.ok && march.code === "200") {
  assert("March page still HTTP 200", true);
}

const july = curl(STAGING_JULY_URL);
if (july.ok && july.code === "200") {
  assert("July page still HTTP 200", true);
  assert("July Event B still clean", !july.body.includes("[CMS Kit staging] G-9g2 title PoC"));
}

console.log(`\nG-14b1e-upload result verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
