/**
 * G-9j4 — Gosaki schedule existing event update one-row preflight (static only).
 * Run: node tools/static-to-astro/scripts/verify-g9j4-gosaki-schedule-existing-event-update-one-row-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const DOC = "gosaki-schedule-existing-event-update-one-row-preflight.md";
const TARGET_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const APPROVAL_ID = "G-9j-gosaki-schedule-existing-event-update-non-dry-run";
const ENV_ARM = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED";
const EXPECTED_UPDATED_AT = "2026-06-16T16:03:41.551792+00:00";

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

const docPath = path.join(TOOL_ROOT, `docs/${DOC}`);
assert("preflight doc exists", fs.existsSync(docPath));
const doc = fs.readFileSync(docPath, "utf8");

assert("phase G-9j4", doc.includes("G-9j4-gosaki-schedule-existing-event-update-one-row-preflight"));
assert("readyForAnyDbWrite false", doc.includes("readyForAnyDbWrite: false"));
assert("dbWriteExecuted false", doc.includes("dbWriteExecuted: false"));
assert("saveEnabled false", doc.includes("saveEnabled: false"));
assert("targetTable schedules", doc.includes("public.schedules"));
assert("operation UPDATE only", doc.includes("UPDATE only"));
assert("targetRows 1", doc.includes("targetRows") && doc.includes("**1**"));
assert("site_slug gosaki-piano", doc.includes("gosaki-piano"));
assert("targetField description", doc.includes("targetField") && doc.includes("description"));
assert("changedFields one field", doc.includes('changedFields: ["description"]'));
assert("payload keys description only", doc.includes('payload keys: ["description"]'));
assert("expectedBeforeUpdatedAt recorded", doc.includes("expectedBeforeUpdatedAt") && doc.includes(EXPECTED_UPDATED_AT));
assert("target id recorded", doc.includes(TARGET_ID));
assert("approvalId documented", doc.includes(APPROVAL_ID));
assert("env arm documented", doc.includes(ENV_ARM));
assert("rollback SQL present", doc.includes("Rollback after G-9j5"));
assert("post-save SELECT present", doc.includes("Post-save verification SELECT"));
assert("DO NOT RUN during G-9j4", doc.includes("DO NOT RUN during G-9j4"));
assert("G-9j5 explicit approval", doc.includes("G-9j5として、対象行"));
assert("date not in payload", doc.includes("date") && doc.includes("Excluded from payload"));
assert("published not in payload", doc.includes("published") && doc.includes("Excluded from payload"));
assert("updated_at not in payload", doc.includes("updated_at") && doc.includes("Excluded from payload"));
assert("schedule_months not touched", doc.includes("schedule_months"));
assert("dry-run result documented", doc.includes("executeG9jExistingEventUpdateDryRun"));
assert("saveAllowed false in dry-run", doc.includes("saveAllowed") && doc.includes("`false`"));
assert("no DB write this phase", doc.includes("DB write executed (this phase) | **no**"));
assert("ごちまき not selected primary", doc.includes("not selected"));

const pagesAdmin = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", !pagesAdmin.stdout.trim());

for (const script of [
  "verify-g9j-gosaki-schedule-existing-event-save-enablement-planning.mjs",
  "verify-g9j1-gosaki-schedule-existing-event-update-guards-and-dry-run.mjs",
  "verify-g9j2-gosaki-schedule-existing-event-update-dry-run-ui-wiring.mjs",
]) {
  const result = spawnSync("node", [`tools/static-to-astro/scripts/${script}`], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert(`${script} passes`, result.status === 0);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
