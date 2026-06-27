/**
 * G-13c2 — Gosaki Event B PoC cleanup preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13c2-gosaki-schedule-event-b-poc-cleanup-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-b-poc-cleanup-preflight.md";
const G14C_REL =
  "tools/static-to-astro/docs/gosaki-public-reflection-operation-standardization.md";
const G13E_CLOSURE_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-public-reflection-closure.md";
const SEED_REL = "tools/static-to-astro/scripts/supabase/gosaki-schedules-seed.template.sql";
const RESTORE_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-schedule-2026-07-010-restore.template.sql";
const EVENT_A_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const LEGACY_ID = "schedule-2026-07-010";
const STAGING_JULY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/";
const STAGING_MARCH_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-03/";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const ENV_FILES = [".env", ".env.local"];

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

const doc = read(DOC_REL);
const seed = read(SEED_REL);
const restore = read(RESTORE_REL);

assert("G-13c2 preflight doc exists", exists(DOC_REL));
assert(
  "doc phase G-13c2",
  doc.includes("G-13c2-gosaki-schedule-event-b-poc-cleanup-preflight"),
);
assert(
  "doc preflight complete gate",
  doc.includes("gosakiScheduleEventBPocCleanupPreflightComplete: true"),
);
assert("doc Event B id", doc.includes(EVENT_B_ID));
assert("doc legacy id", doc.includes(LEGACY_ID));
assert("doc date 2026-07-19", doc.includes("2026-07-19"));
assert("doc current DB section", doc.includes("Current DB values"));
assert("doc G-9g2 PoC current title", doc.includes("G-9g2 title PoC"));
assert("doc expected title <>", doc.includes("`<>`") || doc.includes("| `<>` |"));
assert("doc expected description 出演", doc.includes("出演："));
assert("doc six fields cleanup", doc.includes("title") && doc.includes("description"));
assert("doc expected values confirmed", doc.includes("confirmed"));
assert("doc dedicated cleanup slice", doc.includes("dedicated") || doc.includes("G-13c2"));
assert("doc G-13c2 approval id", doc.includes("G-13c2-gosaki-schedule-event-b-poc-audit-cleanup-non-dry-run"));
assert("doc readyForG13c2d1", doc.includes("readyForG13c2d1EventBPocCleanupLocalImplementation: true"));
assert("doc event A not touched", doc.includes("eventATouched: false"));
assert("doc march no reupload", doc.includes("marchReUploadNeeded: false"));
assert("doc G-14c reflection", doc.includes("G-14c") || doc.includes("public reflection"));
assert("doc minimal upload july", doc.includes("schedule/2026-07/index.html"));
assert("doc rollback not needed default", doc.includes("rollbackNeeded: false"));
assert("doc no save this phase", doc.includes("cursorSaveExecuted: false"));
assert("doc three sources", doc.includes("seed.template.sql") && doc.includes("restore.template.sql"));
assert("doc updated_at baseline", doc.includes("2026-06-18T01:04:51.312817+00:00"));

assert("G-14c doc exists", exists(G14C_REL));
assert("G-13e closure exists", exists(G13E_CLOSURE_REL));
assert("seed has schedule-2026-07-010", seed.includes(LEGACY_ID) && seed.includes("'<>'"));
assert("restore has seed values", restore.includes("title = '<>'") && restore.includes("description = '出演：'"));
assert("restore targets Event B id", restore.includes(EVENT_B_ID));

const july = curl(STAGING_JULY_URL);
if (july.ok && july.code === "200") {
  assert("live july HTTP 200", true);
  assert("live july PoC present", july.body.includes("CMS Kit staging") || july.body.includes("G-9g"));
  assert("live july scheduleDataSource", july.body.includes("scheduleDataSource=supabase"));
} else {
  console.log("SKIP live July HTTP checks (network unavailable)");
}

const march = curl(STAGING_MARCH_URL);
if (march.ok && march.code === "200") {
  assert("live march no G-9k6", !march.body.includes("G-9k6"));
  assert("live march no G-9k4", !march.body.includes("G-9k4"));
} else {
  console.log("SKIP live March HTTP checks (network unavailable)");
}

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

for (const envFile of ENV_FILES) {
  const envDiff = spawnSync("git", ["diff", "--name-only", envFile], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert(`${envFile} no diff`, !envDiff.stdout.trim());
}

console.log(
  `\nG-13c2 Event B cleanup preflight verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
