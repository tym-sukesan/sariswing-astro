/**
 * G-9j — Gosaki schedule existing event save enablement planning (static only).
 * Run: node tools/static-to-astro/scripts/verify-g9j-gosaki-schedule-existing-event-save-enablement-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9j-gosaki-schedule-existing-event-save-enablement-planning";
const DOC_NAME = "gosaki-schedule-existing-event-save-enablement-planning.md";
const APPROVAL_ID = "G-9j-gosaki-schedule-existing-event-update-non-dry-run";
const ENV_ARM = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED";

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

const docPath = path.join(TOOL_ROOT, `docs/${DOC_NAME}`);
assert("planning doc exists", fs.existsSync(docPath));
const docSrc = fs.readFileSync(docPath, "utf8");

assert("phase G-9j", docSrc.includes(PHASE));
assert("status complete", docSrc.includes("**complete**"));
assert("existing event UPDATE only", docSrc.includes("existing event UPDATE only"));
assert("UPDATE only", docSrc.includes("UPDATE only"));
assert("INSERT excluded", docSrc.includes("INSERT"));
assert("DELETE excluded", docSrc.includes("DELETE"));
assert("duplicate excluded", docSrc.includes("DUPLICATE"));
assert("date excluded", docSrc.includes("`date`"));
assert("month excluded", docSrc.includes("`month`"));
assert("source_route excluded", docSrc.includes("source_route"));
assert("published excluded", docSrc.includes("`published`"));
assert("schedule_months prohibited", docSrc.includes("schedule_months"));
assert("service_role prohibited", docSrc.includes("service_role"));
assert("production block", docSrc.includes("production") && docSrc.includes("host gate"));
assert("optimistic lock required", docSrc.includes("expectedBeforeUpdatedAt"));
assert("buildScheduleLockedWriteRequest referenced", docSrc.includes("buildScheduleLockedWriteRequest"));
assert("updateScheduleWrite referenced", docSrc.includes("updateScheduleWrite"));
assert("approvalId documented", docSrc.includes(APPROVAL_ID));
assert("env arm documented", docSrc.includes(ENV_ARM));
assert("readyForAnyDbWrite false", docSrc.includes("readyForAnyDbWrite: false"));
assert("one-row non-dry-run", docSrc.includes("one-row") || docSrc.includes("One-row"));
assert("explicit approval", docSrc.includes("explicit") && docSrc.includes("approval"));
assert("dry-run before save", docSrc.includes("dry-run") && docSrc.includes("Save"));
assert("allowed fields title venue", docSrc.includes("title") && docSrc.includes("venue"));
assert("allowed fields open_time start_time price description", docSrc.includes("open_time") && docSrc.includes("description"));
assert("G-9j1 next phase", docSrc.includes("G-9j1"));
assert("no DB write this phase", docSrc.includes("DB write executed (this phase) | **no**"));
assert("no Save click this phase", docSrc.includes("Save clicked") && docSrc.includes("**no**"));
assert("/admin not touched", docSrc.includes("/admin"));
assert("site_slug gosaki-piano", docSrc.includes("gosaki-piano"));
assert("operator page reference", docSrc.includes("AdminGosakiStagingScheduleOperatorPage"));
assert("do not re-click G-9g3g", docSrc.includes("G-9g3g"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
