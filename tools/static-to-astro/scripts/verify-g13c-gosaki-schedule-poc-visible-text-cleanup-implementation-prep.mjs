/**
 * G-13c — Gosaki schedule PoC visible text cleanup implementation prep verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13c-gosaki-schedule-poc-visible-text-cleanup-implementation-prep.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-poc-visible-text-cleanup-implementation-prep.md";
const G13B_DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-poc-visible-text-cleanup-preflight.md";
const GUARDS_REL = "src/lib/admin/staging-write/schedule-write-guards.ts";
const G9K_DRY_RUN_REL =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-dry-run.ts";
const SEED_REL = "tools/static-to-astro/scripts/supabase/gosaki-schedules-seed.template.sql";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const STAGING_BASE = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule";

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

const doc = read(DOC_REL);
const g13bDoc = read(G13B_DOC_REL);
const guardsSrc = read(GUARDS_REL);
const g9kDryRunSrc = read(G9K_DRY_RUN_REL);
const seedSql = read(SEED_REL);

assert("G-13c doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert(
  "doc phase G-13c",
  doc.includes("G-13c-gosaki-schedule-poc-visible-text-cleanup-implementation-prep"),
);
assert("doc references G-13b", doc.includes("G-13b") && fs.existsSync(path.join(REPO_ROOT, G13B_DOC_REL)));
assert("doc event A id", doc.includes("f687ebf3-407c-49d0-9ab8-58040c499b8e"));
assert("doc event B id", doc.includes("aa440e29-5be8-402e-9190-0d81c48434c0"));
assert("doc legacy ids", doc.includes("schedule-2026-03-007") && doc.includes("schedule-2026-07-010"));
assert("doc cleanup field table", doc.includes("Cleanup fields and expected values"));
assert("doc save path feasibility", doc.includes("Existing save path feasibility"));
assert("doc Event A feasible G-9k", doc.includes("G-13c1") && doc.includes("G-9k"));
assert("doc Event B blocked", doc.includes("Blocked") && doc.includes("PoC audit"));
assert("doc approval G-13c1", doc.includes("G-13c1-gosaki-schedule-event-a-poc-text-cleanup-non-dry-run"));
assert("doc approval G-13c2", doc.includes("G-13c2-gosaki-schedule-event-b-poc-audit-cleanup-non-dry-run"));
assert("doc operation_id parent", doc.includes("gosaki-schedule-poc-visible-text-cleanup"));
assert("doc env arm G13C1", doc.includes("PUBLIC_ADMIN_SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED"));
assert("doc env arm G13C2", doc.includes("PUBLIC_ADMIN_SCHEDULE_G13C2_EVENT_B_POC_AUDIT_CLEANUP_NON_DRY_RUN_ARMED"));
assert(
  "doc approval phrase",
  doc.includes("承認します。このSchedule CMS非dry-run操作を1回だけ実行してください。"),
);
assert("doc dry-run Preview checklist", doc.includes("Dry-run Preview checklist"));
assert("doc operator procedure separated", doc.includes("Operator non-dry-run procedure"));
assert("doc no Save this phase", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));
assert("doc no DB write", doc.includes("cursorDbWriteExecuted") && doc.includes("**false**"));
assert("doc no commit", doc.includes("commitExecutedInThisPhase") && doc.includes("**false**"));
assert(
  "doc implementation prep gate true",
  doc.includes("gosakiSchedulePocVisibleTextCleanupImplementationPrepComplete") &&
    doc.includes("**true**"),
);
assert("doc next G-13d", doc.includes("G-13d-gosaki-schedule-poc-visible-text-cleanup-implementation"));
assert("doc do not reuse G-9k approval", doc.includes("G-9k-gosaki-schedule-existing-event-save-button-non-dry-run"));

assert("G-13b doc still present", g13bDoc.includes("G-13b-gosaki-schedule-poc-visible-text-cleanup-preflight"));
assert(
  "guards assertOperationalNotPocAuditRow blocks aa440e29",
  guardsSrc.includes("assertOperationalNotPocAuditRow") &&
    guardsSrc.includes("aa440e29-5be8-402e-9190-0d81c48434c0"),
);
assert(
  "G-9k dry-run multi-field changedFields",
  g9kDryRunSrc.includes("computeG9kExistingEventSaveButtonChangedFields"),
);
assert("seed event A schedule-2026-03-007", seedSql.includes("schedule-2026-03-007") && seedSql.includes("<Duo>"));
assert("seed event B schedule-2026-07-010", seedSql.includes("schedule-2026-07-010") && seedSql.includes("出演："));

const mar = curl(`${STAGING_BASE}/2026-03/`);
if (mar.ok) {
  assert("live march HTTP 200", mar.code === "200");
  assert("live march G-9k6 marker still present", mar.body.includes("G-9k6"));
}

const jul = curl(`${STAGING_BASE}/2026-07/`);
if (jul.ok) {
  assert("live july HTTP 200", jul.code === "200");
  assert("live july CMS Kit staging still present", jul.body.includes("CMS Kit staging"));
}

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

assert(
  "no real email in doc",
  !/@(?!example\.com|users\.noreply\.github\.com)[a-z0-9.-]+\.[a-z]{2,}/i.test(doc),
);

console.log(`\nG-13c verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
