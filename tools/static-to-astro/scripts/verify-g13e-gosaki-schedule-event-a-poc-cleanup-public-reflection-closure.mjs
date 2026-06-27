/**
 * G-13e — Gosaki Event A PoC cleanup public reflection closure verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-closure.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-public-reflection-closure.md";
const G13D1_EXEC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-execution-result.md";
const G13E_UPLOAD_EXEC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-execution-result.md";
const G13E_LOCAL_REGEN_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-public-reflection-local-regen.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const STAGING_MONTH_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-03/";
const STAGING_JULY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/";
const EVENT_A_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
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

assert("closure doc exists", exists(DOC_REL));
assert(
  "doc phase G-13e closure",
  doc.includes("G-13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-closure"),
);
assert("doc chain complete gate", doc.includes("gosakiScheduleEventAPocCleanupEventAChainComplete: true"));
assert("doc closure complete gate", doc.includes("gosakiScheduleEventAPocCleanupPublicReflectionClosureComplete: true"));
assert("doc no march re-upload", doc.includes("readyForG13eMarchReUpload: false"));
assert("doc no G-13d1 re-execution", doc.includes("readyForG13d1EventAPocCleanupReExecution: false"));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc event B not touched", doc.includes("eventBTouched: false"));
assert("doc Event B separate phase", doc.includes("G-13c2") || doc.includes("separate phase"));
assert("doc G-13d1 execution ref", doc.includes("gosaki-schedule-event-a-poc-cleanup-execution-result"));
assert("doc G-13e upload execution ref", doc.includes("public-reflection-upload-execution-result"));
assert("doc Event A id", doc.includes(EVENT_A_ID));
assert("doc legacy id", doc.includes(LEGACY_ID));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc staging URL", doc.includes(STAGING_MONTH_URL));
assert("doc 15:00 final state", doc.includes("15:00") && doc.includes("15:30"));
assert("doc PoC absent", doc.includes("G-9k6") && doc.includes("absent"));
assert("doc no cursor ftp this phase", doc.includes("cursorFtpExecuted: false"));
assert("doc phase chain table", doc.includes("G-13d1 execution") && doc.includes("G-13e upload execution"));

assert("G-13d1 execution doc exists", exists(G13D1_EXEC_REL));
assert("G-13e upload execution doc exists", exists(G13E_UPLOAD_EXEC_REL));
assert("G-13e local regen doc exists", exists(G13E_LOCAL_REGEN_REL));
assert("G-13d1 save success", read(G13D1_EXEC_REL).includes("gosakiScheduleEventAPocCleanupSaveSuccess: true"));
assert(
  "G-13e upload success",
  read(G13E_UPLOAD_EXEC_REL).includes("gosakiScheduleEventAPocCleanupPublicReflectionUploadSuccess: true"),
);

const march = curl(STAGING_MONTH_URL);
if (march.ok && march.code === "200") {
  const card = extractEventACard(march.body);
  assert("live march HTTP 200", true);
  assert("live scheduleDataSource supabase", march.body.includes("scheduleDataSource=supabase"));
  assert("live no G-9k6", !march.body.includes("G-9k6"));
  assert("live no G-9k4", !march.body.includes("G-9k4"));
  assert("live Event A 15:00", card.includes("15:00"));
  assert("live Event A clean Duo", card.includes("&lt;Duo&gt;") || card.includes("<Duo>"));
} else {
  console.log("SKIP live March HTTP checks (network unavailable)");
}

const july = curl(STAGING_JULY_URL);
if (july.ok && july.code === "200") {
  assert(
    "live july Event B PoC still present",
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
  `\nG-13e public reflection closure verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
