/**
 * G-22a — Sariswing parity gap inventory verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22a-gosaki-sariswing-parity-gap-inventory.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-sariswing-parity-gap-inventory.md";
const G20UI3QA_REL = "tools/static-to-astro/docs/gosaki-admin-ui-minor-polish-local-qa.md";
const BASE_COMMIT = "d404ce3";

const SCHEDULE_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const SCHEDULE_OPERATOR_TS =
  "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const DRY_RUN_ADAPTER = "src/lib/admin/staging-write/schedule-dry-run-adapter.ts";
const SARISWING_SCHEDULE_EDGE = "supabase/functions/admin-schedule/index.ts";
const G9K_GUARD_DOC = "tools/static-to-astro/docs/gosaki-schedule-existing-event-save-button-guard-config.md";

const FORBIDDEN = [
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts",
  "tools/static-to-astro/scripts/build-gosaki-production-package.mjs",
];

const PROD_REF = "vsbvndwuajjhnzpohghh";

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

function exists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

function gitDiff(rel) {
  return spawnSync("git", ["diff", rel], { cwd: REPO_ROOT, encoding: "utf8" }).stdout;
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is d404ce3", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is d404ce3", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-22a doc exists", exists(DOC_REL));
assert("G-20ui3-QA prior doc exists", exists(G20UI3QA_REL));

const doc = read(DOC_REL);
const scheduleUi = read(SCHEDULE_UI);
const scheduleTs = read(SCHEDULE_OPERATOR_TS);

assert("doc phase G-22a", doc.includes("G-22a-gosaki-sariswing-parity-gap-inventory"));
assert("doc inventory gate", doc.includes("gosakiSariswingParityGapInventoryComplete: true"));
assert("doc readyForG22b", doc.includes("readyForG22bScheduleDuplicateImplementation: true"));
assert("doc no save executed", doc.includes("saveExecuted: false"));
assert("doc sariswing prod not used", doc.includes("sariswingProductionRefUsed: false"));

for (const section of [
  "Parity gap table",
  "Schedule CRUD",
  "P0",
  "G-22b",
  "G-22c",
  "G-22d",
  "G-22e",
  "G-22f",
  "G-22g",
  "Low risk",
  "High risk",
]) {
  assert(`doc section ${section}`, doc.includes(section));
}

assert("doc Sariswing inventory", doc.includes("NEWS CRUD") && doc.includes("admin-schedule"));
assert("doc Gosaki schedule gap", doc.includes("INSERT") && doc.includes("duplicate"));
assert("doc wireDisabledActions", doc.includes("wireDisabledActions"));
assert("doc schedule-dry-run-adapter", doc.includes("schedule-dry-run-adapter"));
assert("doc site_slug gosaki-piano", doc.includes("gosaki-piano"));
assert("doc never prod ref", doc.includes(`Never`) && doc.includes(PROD_REF));

assert("schedule UI duplicate disabled", scheduleUi.includes("gosaki-schedule-duplicate-btn"));
assert("schedule UI add disabled", scheduleUi.includes("gosaki-schedule-add-btn"));
assert("schedule TS wireDisabledActions", scheduleTs.includes("wireDisabledActions"));
assert("dry-run adapter duplicate", read(DRY_RUN_ADAPTER).includes('operation: "duplicate"'));
assert("sariswing edge duplicate", read(SARISWING_SCHEDULE_EDGE).includes('action === "duplicate"'));
assert("g9k doc excludes INSERT", read(G9K_GUARD_DOC).includes("INSERT"));

for (const rel of FORBIDDEN) {
  assert(`unchanged ${path.basename(rel)}`, gitDiff(rel).length === 0);
}

assert("doc package regen not executed", doc.includes("packageRegenExecuted: false"));
assert("doc FTP not executed", doc.includes("ftpUploadExecuted: false"));

console.log(`\nG-22a Sariswing parity gap inventory verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
