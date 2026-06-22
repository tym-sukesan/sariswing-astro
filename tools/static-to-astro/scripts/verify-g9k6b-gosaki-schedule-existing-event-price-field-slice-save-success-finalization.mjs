/**
 * G-9k6b — Gosaki schedule existing event price field slice Save success finalization.
 * Run: node tools/static-to-astro/scripts/verify-g9k6b-gosaki-schedule-existing-event-price-field-slice-save-success-finalization.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const TARGET_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
const BEFORE_PRICE = "3,000円";
const AFTER_PRICE = "3,000円（G-9k6 price UI保存テスト）";
const BEFORE_UPDATED_AT = "2026-06-22T02:20:07.217037+00:00";
const POST_SAVE_UPDATED_AT = "2026-06-22T06:53:39.857434+00:00";

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}`);
    failed += 1;
  }
}

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

const doc = read(
  "tools/static-to-astro/docs/gosaki-schedule-existing-event-price-field-slice-save-success-finalization.md",
);
const matrixDoc = read(
  "tools/static-to-astro/docs/gosaki-schedule-existing-event-field-slice-verification-planning.md",
);

assert("G-9k6b doc phase", doc.includes("G-9k6b-gosaki-schedule-existing-event-price-field-slice-save-success-finalization"));
assert("price slice success gate", doc.includes("gosakiScheduleExistingEventPriceFieldSliceSaveSuccess: true"));
assert("target row recorded", doc.includes(TARGET_ID));
assert("project ref recorded", doc.includes(PROJECT_REF));
assert('changedFields price only', doc.includes('changedFields: ["price"]'));
assert("payload keys price only", doc.includes('payload keys: ["price"]'));
assert("rowsAffected = 1", doc.includes("rowsAffected: 1"));
assert("before price recorded", doc.includes(BEFORE_PRICE));
assert("after price recorded", doc.includes(AFTER_PRICE));
assert("before updated_at recorded", doc.includes(BEFORE_UPDATED_AT));
assert("post-save updated_at recorded", doc.includes(POST_SAVE_UPDATED_AT));
assert("post-save result panel recorded", doc.includes("保存成功") && doc.includes("post-save result panel"));
assert("no cursor Save this phase", doc.includes("cursorClickedSave: false"));
assert("no DB write this phase", doc.includes("DB write in this phase") && doc.includes("no"));

assert("G-9k6a matrix price completed", matrixDoc.includes("G-9k6b") && matrixDoc.match(/`price`[\s\S]*?\*\*succeeded\*\*/));
assert("G-9k6a references G-9k6b doc", matrixDoc.includes("gosaki-schedule-existing-event-price-field-slice-save-success-finalization.md"));

const saveSrc = read("src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts");
assert("save module no auto execute", !saveSrc.includes("executeG9kExistingEventSaveButtonSave()"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", adminDiff.stdout.trim() === "");

assert("00-current-state G-9k6b", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-9k6b"));
assert("03-next-actions G-9k6b", read("tools/static-to-astro/docs/ai/03-next-actions.md").includes("G-9k6b"));
assert("handoff G-9k6b", read("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md").includes("G-9k6b"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
