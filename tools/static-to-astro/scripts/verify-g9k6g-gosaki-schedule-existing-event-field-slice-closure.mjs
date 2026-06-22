/**
 * G-9k6g — Gosaki schedule existing event field slice closure.
 * Run: node tools/static-to-astro/scripts/verify-g9k6g-gosaki-schedule-existing-event-field-slice-closure.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const TARGET_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
const FINAL_UPDATED_AT = "2026-06-22T15:01:47.671778+00:00";

const SLICES = [
  {
    field: "description",
    phaseId: "G-9k4b-gosaki-schedule-existing-event-ui-manual-save-success-and-result-fix",
  },
  {
    field: "price",
    phaseId: "G-9k6b-gosaki-schedule-existing-event-price-field-slice-save-success-finalization",
  },
  {
    field: "open_time",
    phaseId: "G-9k6c-gosaki-schedule-existing-event-open-time-field-slice-save-success-finalization",
  },
  {
    field: "start_time",
    phaseId: "G-9k6d-gosaki-schedule-existing-event-start-time-field-slice-save-success-finalization",
  },
  {
    field: "venue",
    phaseId: "G-9k6e-gosaki-schedule-existing-event-venue-field-slice-save-success-finalization",
  },
  {
    field: "title",
    phaseId: "G-9k6f-gosaki-schedule-existing-event-title-field-slice-save-success-finalization",
  },
];

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

const doc = read("tools/static-to-astro/docs/gosaki-schedule-existing-event-field-slice-closure.md");
const matrixDoc = read(
  "tools/static-to-astro/docs/gosaki-schedule-existing-event-field-slice-verification-planning.md",
);

assert("G-9k6g closure doc phase", doc.includes("G-9k6g-gosaki-schedule-existing-event-field-slice-closure"));
assert("closure complete gate", doc.includes("gosakiScheduleExistingEventFieldSliceClosureComplete: true"));
assert("target row recorded", doc.includes(TARGET_ID));
assert("project ref recorded", doc.includes(PROJECT_REF));
assert("1 Save = 1 field recorded", doc.includes("1 Save = 1 field"));
assert("rowsAffected=1 pattern recorded", doc.includes("rowsAffected") && doc.includes("`1`"));
assert("changedFields only recorded", doc.includes("changedFields") && doc.includes("single field only"));
assert("payload keys only recorded", doc.includes("payload keys") && doc.includes("single field only"));
assert("optimistic lock recorded", doc.includes("Optimistic lock") || doc.includes("expectedBeforeUpdatedAt"));

assert("final title baseline", doc.includes("<Duo> [G-9k6 title UI保存テスト]"));
assert("final venue baseline", doc.includes("川崎 ぴあにしも [G-9k6 venue UI保存テスト]"));
assert("final open_time baseline", doc.includes("18:00"));
assert("final start_time baseline", doc.includes("19:00"));
assert("final price baseline", doc.includes("3,000円（G-9k6 price UI保存テスト）"));
assert("final updated_at baseline", doc.includes(FINAL_UPDATED_AT));

for (const { field, phaseId } of SLICES) {
  assert(`${field} slice succeeded`, doc.includes(`\`${field}\``) && doc.includes("**succeeded**"));
  assert(`${field} phase ID recorded`, doc.includes(phaseId));
}

assert("next phase candidates section", doc.includes("Next phase candidates"));
assert("UI copy fix candidate", doc.includes("UI copy fix"));
assert("staging shell generalization candidate", doc.includes("generalization"));
assert("existing event next feature candidate", doc.includes("next field") || doc.includes("next field / feature"));
assert("Gosaki CMS Kit candidate", doc.includes("Gosaki CMS Kit"));
assert("no cursor Save this phase", doc.includes("cursorClickedSave: false"));
assert("no DB write this phase", doc.includes("DB write in this phase") && doc.includes("no"));

assert("G-9k6a references G-9k6g doc", matrixDoc.includes("gosaki-schedule-existing-event-field-slice-closure.md"));
assert("G-9k6a closure complete", matrixDoc.includes("gosakiScheduleExistingEventFieldSliceClosureComplete: true"));

const saveSrc = read("src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts");
assert("save module no auto execute", !saveSrc.includes("executeG9kExistingEventSaveButtonSave()"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", adminDiff.stdout.trim() === "");

assert("00-current-state G-9k6g", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-9k6g"));
assert("03-next-actions G-9k6g", read("tools/static-to-astro/docs/ai/03-next-actions.md").includes("G-9k6g"));
assert("handoff G-9k6g", read("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md").includes("G-9k6g"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
