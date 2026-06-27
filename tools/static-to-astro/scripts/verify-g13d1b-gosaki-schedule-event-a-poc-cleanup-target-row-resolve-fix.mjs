/**
 * G-13d1b — Event A target row resolve fix verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13d1b-gosaki-schedule-event-a-poc-cleanup-target-row-resolve-fix.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-target-row-resolve-fix.md";
const RESOLVE_REL =
  "src/lib/admin/staging-data/gosaki-schedule-event-a-poc-cleanup-target-row-resolve.ts";
const UI_REL = "src/lib/admin/staging-data/gosaki-schedule-event-a-poc-cleanup-ui.ts";
const CONFIG_REL = "src/lib/admin/staging-write/gosaki-schedule-event-a-poc-cleanup-config.ts";
const SAVE_REL = "src/lib/admin/staging-write/gosaki-schedule-event-a-poc-cleanup-save.ts";
const READ_REL = "src/lib/admin/staging-write/staging-schedule-read.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const EVENT_A_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const LEGACY_ID = "schedule-2026-03-007";

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
const resolveSrc = read(RESOLVE_REL);
const uiSrc = read(UI_REL);
const configSrc = read(CONFIG_REL);
const saveSrc = read(SAVE_REL);

assert("G-13d1b doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert("doc phase G-13d1b", doc.includes("G-13d1b-gosaki-schedule-event-a-poc-cleanup-target-row-resolve-fix"));
assert("doc fix complete", doc.includes("local implementation complete"));
assert("doc loadScheduleRowForSiteSlugRead", doc.includes("loadScheduleRowForSiteSlugRead"));
assert("doc no Save this phase", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));
assert("doc Event A id", doc.includes(EVENT_A_ID));
assert("doc no Event B target", !doc.includes(EVENT_B_ID));
assert("doc save gate unchanged", doc.includes("saveEnabled"));

assert("resolve module exists", fs.existsSync(path.join(REPO_ROOT, RESOLVE_REL)));
assert("resolve uses loadScheduleRowForSiteSlugRead", resolveSrc.includes("loadScheduleRowForSiteSlugRead"));
assert("resolve Event A id constant", resolveSrc.includes("G13C1_EVENT_A_POC_CLEANUP_TARGET_ROW_ID"));
assert("resolve legacy id constant", resolveSrc.includes("G13C1_EVENT_A_POC_CLEANUP_TARGET_LEGACY_ID"));
assert("resolve assertG13c1 writable row", resolveSrc.includes("assertG13c1EventAPocCleanupWritableRow"));
assert("resolve getReadOnlyDataConfig", resolveSrc.includes("getReadOnlyDataConfig"));
assert("resolve no Event B id", !resolveSrc.includes(EVENT_B_ID));
assert("resolve no DOM selectable-rows lookup", !resolveSrc.includes('getAttribute("data-selectable-rows")'));

assert("UI imports resolve", uiSrc.includes("resolveG13c1EventAPocCleanupTargetRow"));
assert("UI preview calls resolve", uiSrc.includes("await resolveG13c1EventAPocCleanupTargetRow()"));
assert("UI no findTargetRowFromOperatorSection", !uiSrc.includes("findTargetRowFromOperatorSection"));
assert("UI no data-selectable-rows", !uiSrc.includes("data-selectable-rows"));
assert("UI no selectable rows error", !uiSrc.includes("not found in selectable rows"));
assert("UI save gate saveEnabled", uiSrc.includes("config.saveEnabled"));
assert("UI save disabled message", uiSrc.includes("G-13c1 Save is disabled"));
assert("UI no Event B", !uiSrc.includes(EVENT_B_ID));

assert("config saveEnabled pattern unchanged", configSrc.includes("isG13c1SaveCompileGateEnabled"));
assert("save save_not_enabled", saveSrc.includes('errorCode: "save_not_enabled"'));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

assert("read module has row loader", read(READ_REL).includes("loadScheduleRowForSiteSlugRead"));

console.log(`\nG-13d1b target row resolve fix verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
