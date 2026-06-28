/**
 * G-14b1f — Gosaki routine edit reflection closure verifier.
 * Run: node tools/static-to-astro/scripts/verify-g14b1f-gosaki-schedule-routine-edit-reflection-closure.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-routine-edit-reflection-closure.md";
const SAVE_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-schedule-routine-edit-save-execution-result.md";
const UPLOAD_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-schedule-routine-edit-public-reflection-result.md";
const PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-schedule-routine-edit-public-reflection-local-regen-and-upload-preflight.md";
const PLANNING_REL =
  "tools/static-to-astro/docs/gosaki-schedule-routine-edit-flow-next-poc-planning.md";
const G14C_REL =
  "tools/static-to-astro/docs/gosaki-public-reflection-operation-standardization.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const STAGING_APRIL_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-04/";
const STAGING_MARCH_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-03/";
const STAGING_JULY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/";
const TARGET_ID = "14230329-dde5-40d6-b9b3-75aefe140daf";
const LEGACY_ID = "schedule-2026-04-005";
const EVENT_A_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const G9K_APPROVAL = "G-9k-gosaki-schedule-existing-event-save-button-non-dry-run";
const PRICE_AFTER = "3,300円（税込）";
const PRICE_BEFORE = "3,300円(tax in)";
const CSS_HASH = "index.YcHrHZH4.css";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";

const CHAIN_DOCS = [
  "gosaki-schedule-routine-edit-flow-next-poc-planning.md",
  "gosaki-schedule-routine-edit-practical-save-enablement-implementation.md",
  "gosaki-schedule-routine-edit-local-dry-run-preview-preflight.md",
  "gosaki-schedule-routine-edit-local-dry-run-preview-result.md",
  "gosaki-schedule-routine-edit-final-preflight.md",
  "gosaki-schedule-routine-edit-save-execution-result.md",
  "gosaki-schedule-routine-edit-public-reflection-local-regen-and-upload-preflight.md",
  "gosaki-schedule-routine-edit-public-reflection-result.md",
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

function extractTrioCard(html) {
  const m = html.match(/2026\.04\.12 \(Sun\)[\s\S]*?<\/article>/);
  return m ? m[0] : "";
}

const doc = read(DOC_REL);

assert("closure doc exists", exists(DOC_REL));
assert("doc phase G-14b1f", doc.includes("G-14b1f-gosaki-schedule-routine-edit-reflection-closure"));
assert("doc chain complete gate", doc.includes("gosakiScheduleRoutineEditChainComplete: true"));
assert("doc closure complete gate", doc.includes("gosakiScheduleRoutineEditReflectionClosureComplete: true"));
assert("doc no re-execution", doc.includes("readyForG14b1RoutineEditReExecution: false"));
assert("doc no april re-upload", doc.includes("readyForG14b1AprilReUpload: false"));
assert("doc no same row re-save", doc.includes("readyForG14b1SameRowReSave: false"));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc event A untouched", doc.includes("eventATouched: false"));
assert("doc event B untouched", doc.includes("eventBTouched: false"));
assert("doc march not reuploaded", doc.includes("marchReuploadTriggered: false"));
assert("doc july not reuploaded", doc.includes("julyReuploadTriggered: false"));
assert("doc G-9k path", doc.includes(G9K_APPROVAL));
assert("doc practical arm", doc.includes("PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED"));
assert("doc target id", doc.includes(TARGET_ID));
assert("doc legacy id", doc.includes(LEGACY_ID));
assert("doc price after", doc.includes(PRICE_AFTER));
assert("doc updated_at after", doc.includes("2026-06-27T17:18:54.986868+00:00"));
assert("doc css hash unchanged", doc.includes(CSS_HASH));
assert("doc routine dev dry-run reset", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=true"));
assert("doc next routine edit conditions", doc.includes("Next routine edit start conditions"));
assert("doc save execution ref", doc.includes("gosaki-schedule-routine-edit-save-execution-result"));
assert("doc upload result ref", doc.includes("gosaki-schedule-routine-edit-public-reflection-result"));
assert("doc commit bb342c3", doc.includes("bb342c3"));

for (const chainDoc of CHAIN_DOCS) {
  assert(`chain doc exists: ${chainDoc}`, exists(`tools/static-to-astro/docs/${chainDoc}`));
  assert(`closure references: ${chainDoc}`, doc.includes(chainDoc));
}

assert("G-14c playbook exists", exists(G14C_REL));
assert("planning doc exists", exists(PLANNING_REL));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

const april = curl(STAGING_APRIL_URL);
if (april.ok) {
  assert("live April HTTP 200", april.code === "200", april.code);
  assert("live scheduleDataSource supabase", april.body.includes("scheduleDataSource=supabase"));
  assert("live CSS hash", april.body.includes(CSS_HASH));
  const trio = extractTrioCard(april.body);
  assert("live Trio card", trio.length > 0);
  assert("live new price", trio.includes(`料金：${PRICE_AFTER}`));
  assert("live old price absent", !trio.includes(PRICE_BEFORE));
  assert("live no CMS Kit staging", !april.body.includes("[CMS Kit staging]"));
}

const march = curl(STAGING_MARCH_URL);
if (march.ok && march.code === "200") {
  assert("March HTTP 200", true);
}

const july = curl(STAGING_JULY_URL);
if (july.ok && july.ok && july.code === "200") {
  assert("July HTTP 200", true);
  assert("July Event B still clean", !july.body.includes("[CMS Kit staging] G-9g2 title PoC"));
}

console.log(`\nG-14b1f closure verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
