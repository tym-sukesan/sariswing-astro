/**
 * G-9k6a — Gosaki schedule existing event field slice verification planning.
 * Run: node tools/static-to-astro/scripts/verify-g9k6a-gosaki-schedule-existing-event-field-slice-verification-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const TARGET_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
const SARI_SITE_REF = "vsbvndwuajjhnzpohghh";
const G9K_APPROVAL = "G-9k-gosaki-schedule-existing-event-save-button-non-dry-run";
const SLICE_FIELDS = ["price", "open_time", "start_time", "venue", "title"];
const FORBIDDEN = ["date", "month", "published", "schedule_months"];

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
  "tools/static-to-astro/docs/gosaki-schedule-existing-event-field-slice-verification-planning.md",
);

assert("G-9k6a planning doc exists", doc.includes("G-9k6a-gosaki-schedule-existing-event-field-slice-verification-planning"));
assert("planning complete gate", doc.includes("gosakiScheduleExistingEventFieldSliceVerificationPlanningComplete: true"));
assert("field slice matrix section", doc.includes("Field slice matrix"));
assert("description already succeeded", doc.includes("G-9k4b") && doc.includes("description") && doc.includes("succeeded"));
assert("no DB write this phase", doc.includes("no DB write"));

for (const field of SLICE_FIELDS) {
  assert(`slice field ${field} in matrix`, doc.includes(`\`${field}\``) || doc.includes(`| \`${field}\` |`));
}

assert("1 Save = 1 field", doc.includes("1 Save = 1 field"));
assert("changedFields single field rule", doc.includes("changedFields") && doc.includes("single target field"));
assert("payload keys single field rule", doc.includes("payload keys"));

for (const forbidden of FORBIDDEN) {
  assert(`forbidden ${forbidden} out of scope`, doc.includes(forbidden));
}

assert("env stack documented", doc.includes("G9K_SAVE_BUTTON_SAVE_ENABLED=true"));
assert("ENABLE_ADMIN_STAGING_WRITE in stack", doc.includes("ENABLE_ADMIN_STAGING_WRITE=true"));
assert("approvalId in stack", doc.includes(G9K_APPROVAL));
assert("project ref allowlist", doc.includes(PROJECT_REF));
assert("sari-site block", doc.includes(SARI_SITE_REF));
assert("rowsAffected = 1", doc.includes("rowsAffected"));
assert("post-save updated_at check", doc.includes("post-save updated_at"));
assert("rollback restore policy", doc.includes("Rollback / restore"));
assert("no rollback execution in G-9k6a", doc.includes("does not execute rollback"));
assert("execution order price first", doc.match(/1\.\s*`?price`?/));
assert("title last", doc.includes("title") && doc.includes("last"));
assert("target row id", doc.includes(TARGET_ID));
assert("operator checklist steps", doc.includes("変更を確認") && doc.includes("更新する"));
assert("stop armed dev server", doc.includes("Ctrl+C"));
assert("cursorClickedSave false", doc.includes("cursorClickedSave: false"));
assert("next slice phases G-9k6b", doc.includes("G-9k6b"));

const saveSrc = read("src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts");
assert("save module no auto execute", !saveSrc.includes("executeG9kExistingEventSaveButtonSave()"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", adminDiff.stdout.trim() === "");

assert("00-current-state G-9k6a", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-9k6a"));
assert("03-next-actions G-9k6a", read("tools/static-to-astro/docs/ai/03-next-actions.md").includes("G-9k6a"));
assert("handoff G-9k6a", read("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md").includes("G-9k6a"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
