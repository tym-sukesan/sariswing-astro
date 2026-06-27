/**
 * G-13d2 — Admin reflection local dev verify result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13d2-admin-reflection-local-dev-verify-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-admin-reflection-local-dev-verify-result.md";
const PREFLIGHT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-admin-reflection-preflight.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const APPROVAL_ID = "G-13c1-gosaki-schedule-event-a-poc-text-cleanup-non-dry-run";
const LEGACY_ID = "schedule-2026-03-007";
const EVENT_A_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";

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

const doc = read(DOC_REL);
const preflightDoc = read(PREFLIGHT_DOC_REL);

assert("G-13d2 verify result doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert(
  "doc phase verify result",
  doc.includes("G-13d2-admin-reflection-local-dev-verify-result"),
);
assert("doc operator verify complete", doc.includes("complete") && doc.includes("PASS"));
assert("doc G-13c1 panel OK", doc.includes("G-13c1") && doc.includes("OK"));
assert("doc legacy_id", doc.includes(LEGACY_ID));
assert("doc date 2026-03-15", doc.includes("2026-03-15"));
assert("doc dryRun true", doc.includes("dryRun") && doc.includes("**true**"));
assert("doc actualWrite false", doc.includes("actualWrite") && doc.includes("**false**"));
assert(
  "doc saveReadiness ready_but_save_disabled",
  doc.includes("ready_but_save_disabled"),
);
assert("doc changedFields six", doc.includes("title") && doc.includes("description"));
assert("doc approvalId", doc.includes(APPROVAL_ID));
assert("doc cursor no Preview click", doc.includes("cursorPreviewButtonClicked") && doc.includes("**false**"));
assert("doc cursor no Save", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));
assert("doc no DB write", doc.includes("cursorDbWriteExecuted") && doc.includes("**false**"));
assert("doc next G-13d1-final-preflight", doc.includes("G-13d1-final-preflight"));
assert("doc readyForG13d1FinalPreflight", doc.includes("readyForG13d1FinalPreflight") && doc.includes("**true**"));
assert("doc references preflight", doc.includes("admin-reflection-preflight") && fs.existsSync(path.join(REPO_ROOT, PREFLIGHT_DOC_REL)));
assert("doc local dev route", doc.includes("__admin-staging-shell/musician-basic/admin/schedule"));
assert("doc event A id", doc.includes(EVENT_A_ID));
assert("doc no Event B", !doc.includes("aa440e29-5be8-402e-9190-0d81c48434c0"));

assert("preflight doc still present", preflightDoc.includes("G-13d2-gosaki-schedule-event-a-poc-cleanup-admin-reflection-preflight"));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

assert(
  "no real email in doc",
  !/@(?!example\.com|users\.noreply\.github\.com)[a-z0-9.-]+\.[a-z]{2,}/i.test(doc),
);

console.log(`\nG-13d2 local dev verify result verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
