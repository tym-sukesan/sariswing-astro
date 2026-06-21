/**
 * G-9k3 — Gosaki schedule existing event save button manual dry-run verification (docs only).
 * Run: node tools/static-to-astro/scripts/verify-g9k3-gosaki-schedule-existing-event-save-button-manual-dry-run-verification.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const DOC = "gosaki-schedule-existing-event-save-button-manual-dry-run-verification.md";
const G9K_APPROVAL = "G-9k-gosaki-schedule-existing-event-save-button-non-dry-run";
const G9K_ARM = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED";
const G9J5_RUN = "run-g9j5-gosaki-schedule-existing-event-update-one-row.mjs";

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

const docPath = path.join(TOOL_ROOT, "docs", DOC);
const doc = fs.readFileSync(docPath, "utf8");
const uiSrc = read("src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts");
const configSrc = read("src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-config.ts");

assert("verification doc exists", fs.existsSync(docPath));
assert("phase G-9k3", doc.includes("G-9k3-gosaki-schedule-existing-event-save-button-manual-dry-run-verification"));
assert("manual verification recorded", doc.includes("operator manual dry-run"));
assert("G-9k2 prior noted", doc.includes("G-9k2"));
assert("manual checklist item 1 auth", doc.includes("Signed-in state"));
assert("manual checklist item 2 select", doc.includes("select existing event"));
assert("manual checklist item 3 six fields", doc.includes("title") && doc.includes("description"));
assert("manual checklist item 4 dry-run button", doc.includes("変更を確認"));
assert("manual checklist item 5 changedFields", doc.includes("changedFields") && doc.includes("payload keys"));
assert("manual checklist item 6 save readiness message", doc.includes("保存準備OK"));
assert("manual checklist item 7 update disabled", doc.includes("disabled"));
assert("manual checklist item 8 no DB update", doc.includes("safe-stop") || doc.includes("no write"));
assert("manual dryRunVerificationComplete gate", doc.includes("gosakiScheduleExistingEventSaveButtonManualDryRunVerificationComplete: true"));
assert("Save still disabled", doc.includes("G9K_SAVE_BUTTON_SAVE_ENABLED: false"));
assert("no DB write this phase", doc.includes("DB write") && doc.includes("no"));
assert("no non-dry-run this phase", doc.includes("non-dry-run") && doc.includes("no"));
assert("do not re-run G-9j5", doc.includes("G-9j5") && doc.includes("not re-run"));
assert("next G-9k4 manual save once", doc.includes("G-9k4"));
assert("G-9k approval documented", doc.includes(G9K_APPROVAL));
assert("G-9k arm documented", doc.includes(G9K_ARM));
assert("staging project ref", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert("sari-site blocked", doc.includes("vsbvndwuajjhnzpohghh"));
assert("service_role not used", doc.includes("service_role"));

assert("G9K_SAVE_BUTTON_SAVE_ENABLED false in config", configSrc.includes("G9K_SAVE_BUTTON_SAVE_ENABLED = false"));
assert("UI save still disabled", uiSrc.includes('data-gosaki-save-allowed="false"'));
assert("UI no updateScheduleWrite", !uiSrc.includes("updateScheduleWrite("));
assert("no G-9k save executor module", !fs.existsSync(path.join(REPO_ROOT, "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts")));

assert("00-current-state updated", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-9k3"));
assert("03-next-actions updated", read("tools/static-to-astro/docs/ai/03-next-actions.md").includes("G-9k3"));
assert("handoff updated", read("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md").includes("G-9k3"));

assert("doc has no service_role key literal", !/eyJ|service_role\s*[:=]\s*['"]/.test(doc));

const adminDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", adminDiff.stdout.trim() === "");

const g9j5RunDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", `tools/static-to-astro/scripts/${G9J5_RUN}`], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("G-9j5 runner not modified", g9j5RunDiff.stdout.trim() === "");

const g9k2 = spawnSync(
  "node",
  [path.join(TOOL_ROOT, "scripts", "verify-g9k2-gosaki-schedule-existing-event-save-button-ui-wiring.mjs")],
  { cwd: REPO_ROOT, encoding: "utf8" },
);
assert("verify-g9k2 passes", g9k2.status === 0);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
