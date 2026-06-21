/**
 * G-9k — Gosaki schedule existing event save button enablement planning (static only).
 * Run: node tools/static-to-astro/scripts/verify-g9k-gosaki-schedule-existing-event-save-button-enablement-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9k-gosaki-schedule-existing-event-save-button-enablement-planning";
const DOC = "gosaki-schedule-existing-event-save-button-enablement-planning.md";
const G9K_APPROVAL = "G-9k-gosaki-schedule-existing-event-save-button-non-dry-run";
const G9K_ARM = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED";
const G9J5_APPROVAL = "G-9j-gosaki-schedule-existing-event-update-non-dry-run";
const G9J5_ARM = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED";

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

const docPath = path.join(TOOL_ROOT, "docs", DOC);
const doc = fs.readFileSync(docPath, "utf8");

assert("planning doc exists", fs.existsSync(docPath));
assert("phase G-9k", doc.includes(PHASE));
assert("planning only complete", doc.includes("planning only"));
assert("existing event UPDATE only", doc.includes("existing row UPDATE only") || doc.includes("existing event UPDATE only"));
assert("six safe fields", doc.includes("description") && doc.includes("open_time"));
assert("INSERT excluded", doc.includes("INSERT"));
assert("DELETE excluded", doc.includes("DELETE"));
assert("duplicate excluded", doc.includes("DUPLICATE"));
assert("date excluded", doc.includes("`date`"));
assert("month excluded", doc.includes("`month`"));
assert("published excluded", doc.includes("`published`"));
assert("schedule_months excluded", doc.includes("schedule_months"));
assert("project ref allowlist", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert("sari-site block", doc.includes("vsbvndwuajjhnzpohghh"));
assert("service_role prohibited", doc.includes("service_role"));
assert("auth session required", doc.includes("auth session") || doc.includes("Auth session"));
assert("optimistic lock required", doc.includes("expectedBeforeUpdatedAt"));
assert("changedFields-only", doc.includes("changedFields"));
assert("rowsAffected exactly 1", doc.includes("rowsAffected") && doc.includes("1"));
assert("G-9k approvalId documented", doc.includes(G9K_APPROVAL));
assert("G-9k env arm documented", doc.includes(G9K_ARM));
assert("G-9j5 approval not reused for G-9k", !doc.includes(`approvalId: ${G9J5_APPROVAL}`) || doc.includes("Do not reuse"));
assert("G-9j5 arm separate", doc.includes(G9J5_ARM) && doc.includes("false"));
assert("dry-run before save flow", doc.includes("変更を確認") || doc.includes("dry-run"));
assert("failure handling section", doc.includes("Failure handling") || doc.includes("rowsAffected === 0"));
assert("rollback policy", doc.includes("Rollback"));
assert("phase breakdown G-9k1", doc.includes("G-9k1"));
assert("no DB write this phase", doc.includes("DB write executed (this phase) | **no**"));
assert("Save not enabled this phase", doc.includes("Save button enabled") && doc.includes("**no**"));
assert("G-9j5 runner not re-run", doc.includes("Do not re-run G-9j5"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", adminDiff.stdout.trim() === "");

const g9j5Run = spawnSync(
  "git",
  ["diff", "--name-only", "HEAD", "--", "tools/static-to-astro/scripts/run-g9j5-gosaki-schedule-existing-event-update-one-row.mjs"],
  { cwd: REPO_ROOT, encoding: "utf8" },
);
assert("G-9j5 runner not modified", g9j5Run.stdout.trim() === "");

const g9j5c = spawnSync(
  "node",
  [path.join(TOOL_ROOT, "scripts", "verify-g9j5c-gosaki-schedule-existing-event-update-success-finalization.mjs")],
  { cwd: REPO_ROOT, encoding: "utf8" },
);
assert("verify-g9j5c passes", g9j5c.status === 0);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
