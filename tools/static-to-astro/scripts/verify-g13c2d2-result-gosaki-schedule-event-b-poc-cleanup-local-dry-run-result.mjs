/**
 * G-13c2d2-result — Gosaki Event B PoC cleanup local dry-run Preview result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13c2d2-result-gosaki-schedule-event-b-poc-cleanup-local-dry-run-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-b-poc-cleanup-local-dry-run-result.md";
const PREFLIGHT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-b-poc-cleanup-local-dry-run-preflight.md";
const VISIBILITY_DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-b-poc-cleanup-preview-ui-visibility-fix.md";
const SLICE_DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-b-poc-cleanup-slice-implementation.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const EVENT_A_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const LEGACY_ID = "schedule-2026-07-010";
const APPROVAL_ID = "G-13c2-gosaki-schedule-event-b-poc-audit-cleanup-non-dry-run";

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

assert("G-13c2d2 result doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert(
  "doc phase G-13c2d2-result",
  doc.includes("G-13c2d2-result-gosaki-schedule-event-b-poc-cleanup-local-dry-run-result"),
);
assert("doc operator verify PASS", doc.includes("PASS") && doc.includes("complete"));
assert("doc Event B id", doc.includes(EVENT_B_ID));
assert("doc legacy_id", doc.includes(LEGACY_ID));
assert("doc date 2026-07-19", doc.includes("2026-07-19"));
assert("doc G-13c2 panel visible", doc.includes("G-13c2 panel") && doc.includes("OK"));
assert("doc Preview button visible", doc.includes("Preview button visible") && doc.includes("OK"));
assert("doc dryRun true", doc.includes("dryRun") && doc.includes("**true**"));
assert("doc actualWrite false", doc.includes("actualWrite") && doc.includes("**false**"));
assert("doc saveReadiness ready_but_save_disabled", doc.includes("ready_but_save_disabled"));
assert("doc changedFields six", doc.includes("title") && doc.includes("description"));
assert("doc approvalId", doc.includes(APPROVAL_ID));
assert("doc title before after payload", doc.includes("G-9g2 title PoC") && doc.includes("`<>`"));
assert("doc venue null payload", doc.includes("venue") && doc.includes("**null**"));
assert("doc open_time null payload", doc.includes("open_time") && doc.includes("**null**"));
assert("doc start_time null payload", doc.includes("start_time") && doc.includes("**null**"));
assert("doc price null payload", doc.includes("price") && doc.includes("**null**"));
assert("doc description 出演", doc.includes("出演："));
assert("doc payload not empty string for null fields", !doc.includes('payload | ""'));
assert("doc Save disabled note", doc.includes("Event B cleanup 保存（無効）"));
assert("doc not clicked Event B Save", doc.includes("Event B cleanup 保存") && doc.includes("Not clicked"));
assert("doc not clicked G-13c1 Save", doc.includes("G-13c1"));
assert("doc cursor no Preview click", doc.includes("cursorPreviewButtonClicked") && doc.includes("**false**"));
assert("doc cursor no Save", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));
assert("doc no DB write", doc.includes("cursorDbWriteExecuted") && doc.includes("**false**"));
assert("doc event A untouched", doc.includes("eventATouched") && doc.includes("**false**"));
assert("doc march untouched", doc.includes("marchReuploadTriggered") && doc.includes("**false**"));
assert(
  "doc readyForG13c2FinalPreflight",
  doc.includes("readyForG13c2FinalPreflight") && doc.includes("**true**"),
);
assert("doc next G-13c2 final preflight", doc.includes("G-13c2-gosaki-schedule-event-b-poc-cleanup-final-preflight"));
assert("doc references preflight", doc.includes("local-dry-run-preflight") && fs.existsSync(path.join(REPO_ROOT, PREFLIGHT_DOC_REL)));
assert("doc references visibility fix", doc.includes("preview-ui-visibility-fix") && fs.existsSync(path.join(REPO_ROOT, VISIBILITY_DOC_REL)));
assert("doc references slice implementation", fs.existsSync(path.join(REPO_ROOT, SLICE_DOC_REL)));
assert("doc local dev route", doc.includes("__admin-staging-shell/musician-basic/admin/schedule"));
assert("doc G-13c2 preview button label", doc.includes("G-13c2 変更を確認（dry-run）"));
assert("doc no Event A as target", !doc.includes(`**id** | \`${EVENT_A_ID}\``));

assert("preflight doc still present", preflightDoc.includes("G-13c2d2-gosaki-schedule-event-b-poc-cleanup-local-dry-run-preflight"));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

console.log(`\nG-13c2d2-result verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
