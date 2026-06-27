/**
 * G-13d1e — G-13c1 Save gate page config bridge verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13d1e-gosaki-schedule-event-a-poc-cleanup-save-gate-page-config-bridge.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-save-gate-page-config-bridge.md";
const PAGE_CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-schedule-event-a-poc-cleanup-page-config.ts";
const CONFIG_REL = "src/lib/admin/staging-write/gosaki-schedule-event-a-poc-cleanup-config.ts";
const UI_REL = "src/lib/admin/staging-data/gosaki-schedule-event-a-poc-cleanup-ui.ts";
const ASTRO_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const G9K_PAGE_CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-schedule-save-button-page-config.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const APPROVAL_ID = "G-13c1-gosaki-schedule-event-a-poc-text-cleanup-non-dry-run";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const PAGE_CONFIG_ELEMENT_ID = "g13c1-event-a-poc-cleanup-page-config";

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
const pageConfigSrc = read(PAGE_CONFIG_REL);
const configSrc = read(CONFIG_REL);
const uiSrc = read(UI_REL);
const astroSrc = read(ASTRO_REL);

assert("G-13d1e doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert("doc phase G-13d1e", doc.includes("G-13d1e-gosaki-schedule-event-a-poc-cleanup-save-gate-page-config-bridge"));
assert("doc page config bridge", doc.includes("page-config"));
assert("doc approval id", doc.includes(APPROVAL_ID));
assert("doc no Event B", !doc.includes(EVENT_B_ID));
assert("doc no Save this phase", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));

assert("page-config module exists", fs.existsSync(path.join(REPO_ROOT, PAGE_CONFIG_REL)));
assert("page-config element id", pageConfigSrc.includes(PAGE_CONFIG_ELEMENT_ID));
assert("page-config resolve server", pageConfigSrc.includes("resolveG13c1EventAPocCleanupPageServerConfig"));
assert("page-config read dom", pageConfigSrc.includes("readG13c1EventAPocCleanupPageConfigFromDom"));
assert("page-config apply env", pageConfigSrc.includes("applyG13c1EventAPocCleanupPageConfigToEnv"));
assert("page-config compile gate attr", pageConfigSrc.includes("saveCompileGateEnabled"));
assert("page-config approval validation", pageConfigSrc.includes("isG13c1EventAPocCleanupPageConfigValid"));
assert("page-config no Event B", !pageConfigSrc.includes(EVENT_B_ID));

assert("config imports page-config", configSrc.includes("readG13c1EventAPocCleanupPageConfigFromDom"));
assert("config applies page-config", configSrc.includes("applyG13c1EventAPocCleanupPageConfigToEnv"));
assert("config saveEnabled logic unchanged", configSrc.includes("isG13c1SaveCompileGateEnabled(mergedEnv) && armed"));
assert("config no Event B", !configSrc.includes(EVENT_B_ID));

assert("astro imports page config", astroSrc.includes("resolveG13c1EventAPocCleanupPageServerConfig"));
assert("astro g13c1 page config div", astroSrc.includes("G13C1_EVENT_A_POC_CLEANUP_PAGE_CONFIG_ELEMENT_ID"));
assert("astro data-g13c1-save-compile-gate-enabled", astroSrc.includes("data-g13c1-save-compile-gate-enabled"));
assert("astro data-g13c1-env-arm-armed", astroSrc.includes("data-g13c1-env-arm-armed"));
assert("astro data-g13c1-write-dry-run-disabled", astroSrc.includes("data-g13c1-write-dry-run-disabled"));
assert("astro data-g13c1-write-approval-id", astroSrc.includes("data-g13c1-write-approval-id"));
assert("astro no Event B", !astroSrc.includes(EVENT_B_ID));

assert("UI save gate note", uiSrc.includes("buildG13c1SaveGateNote"));
assert("UI ready_but_save_disabled", uiSrc.includes("ready_but_save_disabled"));
assert("UI armFailureReason", uiSrc.includes("armFailureReason"));
assert("UI no Event B", !uiSrc.includes(EVENT_B_ID));

assert("G-9k pattern exists", read(G9K_PAGE_CONFIG_REL).includes("readG9kSaveButtonPageConfigFromDom"));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

console.log(`\nG-13d1e page config bridge verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
