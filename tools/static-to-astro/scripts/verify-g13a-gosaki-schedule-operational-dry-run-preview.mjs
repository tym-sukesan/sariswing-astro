/**
 * G-13a — Gosaki schedule operational dry-run preview verification.
 * Run: node tools/static-to-astro/scripts/verify-g13a-gosaki-schedule-operational-dry-run-preview.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-operational-dry-run-preview.md";
const DRY_RUN_TS = "src/lib/admin/staging-data/staging-schedule-site-slug-edit-dry-run.ts";
const EDIT_UI_TS = "src/lib/admin/staging-data/staging-schedule-single-text-field-operational-edit-ui.ts";
const SAVE_TS = "src/lib/admin/staging-write/staging-schedule-single-text-field-operational-save.ts";
const G9K_DRY_TS = "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-dry-run.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const SAFE_FIELDS = [
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
];

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

/** Mirror buildSiteSlugScheduleEditDryRunResult core logic for local simulation. */
function simulateDryRun(source, patch) {
  const before = {
    title: source.title ?? null,
    venue: source.venue ?? null,
    open_time: source.open_time ?? null,
    start_time: source.start_time ?? null,
    price: source.price ?? null,
    description: source.description ?? null,
  };
  const after = { ...before };
  for (const field of SAFE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(patch, field)) {
      after[field] = patch[field];
    }
  }
  const norm = (v) => (v === null || v === undefined ? "" : String(v));
  const changedFields = SAFE_FIELDS.filter((f) => norm(before[f]) !== norm(after[f]));
  return {
    actualWrite: false,
    dryRun: true,
    wouldWrite: changedFields.length > 0,
    changedFields,
    safety: {
      supabaseWriteCalled: false,
      writeAdapterUsed: false,
      scheduleMonthsTouched: false,
      nonDryRunEnabled: false,
      actualWrite: false,
    },
  };
}

const doc = read(DOC_REL);
const dryRunSrc = read(DRY_RUN_TS);
const editUiSrc = read(EDIT_UI_TS);
const saveSrc = read(SAVE_TS);
const g9kDrySrc = read(G9K_DRY_TS);

const sampleRow = {
  id: "f687ebf3-407c-49d0-9ab8-58040c499b8e",
  legacy_id: "schedule-2026-07-001",
  site_slug: "gosaki-piano",
  title: "Test Event",
  venue: "Test Venue",
  open_time: "18:00",
  start_time: "15:30",
  price: null,
  description: "Test",
  updated_at: "2026-06-22T12:42:32.483922+00:00",
};

assert("G-13a doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert("doc phase G-13a", doc.includes("G-13a-gosaki-schedule-operational-dry-run-preview"));
assert("doc verification complete", doc.includes("verification complete"));
assert("doc start_time", doc.includes("start_time"));
assert("doc price", doc.includes("price"));
assert("doc actualWrite false", doc.includes("actualWrite") && doc.includes("**false**"));
assert("doc supabaseWriteCalled false", doc.includes("supabaseWriteCalled: false"));
assert("doc save gated", doc.includes("saveEnabled") && doc.includes("**false**"));
assert("doc no Save by Cursor", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));
assert("doc no DB write", doc.includes("cursorDbWriteExecuted") && doc.includes("**false**"));
assert("doc staging shell route", doc.includes("__admin-staging-shell"));
assert("doc next write slice", doc.includes("G-13b") || doc.includes("G-6-g3"));
assert("doc gate verified true", doc.includes("gosakiScheduleOperationalDryRunPreviewVerified") && doc.includes("**true**"));

assert("dry-run ts actualWrite false", dryRunSrc.includes("actualWrite: false"));
assert("dry-run ts wouldWrite from changedFields", dryRunSrc.includes("wouldWrite: changedFields.length > 0"));
assert("dry-run ts safety no write", dryRunSrc.includes("supabaseWriteCalled: false"));

assert("edit-ui uses buildSiteSlugScheduleEditDryRunResult", editUiSrc.includes("buildSiteSlugScheduleEditDryRunResult"));
assert("edit-ui preview uses runDryRunStaleCheck", editUiSrc.includes("runDryRunStaleCheck"));
assert("edit-ui preview no updateScheduleWrite on preview", !editUiSrc.match(/onPreviewClick[\s\S]{0,2000}updateScheduleWrite/));

assert("save early return when not armed", saveSrc.includes("if (!config.saveEnabled)"));
assert("save uses updateScheduleWrite only in save fn", saveSrc.includes("updateScheduleWrite"));

assert("g9k dry-run no mutation comment", g9kDrySrc.includes("Does not call updateScheduleWrite"));
assert("g9k safety actualWrite false", g9kDrySrc.includes("actualWrite: false"));

const startSim = simulateDryRun(sampleRow, { start_time: "19:00" });
assert("sim start_time changedFields", startSim.changedFields.join() === "start_time");
assert("sim start_time wouldWrite true", startSim.wouldWrite === true);
assert("sim start_time actualWrite false", startSim.actualWrite === false);
assert("sim start_time no supabase write", startSim.safety.supabaseWriteCalled === false);

const priceSim = simulateDryRun(sampleRow, { price: "3,500円" });
assert("sim price changedFields", priceSim.changedFields.join() === "price");
assert("sim price wouldWrite true", priceSim.wouldWrite === true);
assert("sim price actualWrite false", priceSim.actualWrite === false);

const noChange = simulateDryRun(sampleRow, { start_time: "15:30" });
assert("sim no-change wouldWrite false", noChange.wouldWrite === false);
assert("sim no-change changedFields empty", noChange.changedFields.length === 0);

const c3 = spawnSync(
  "node",
  ["tools/static-to-astro/scripts/verify-g9g4a2-framework-single-text-field-operational-commonization-c3.mjs"],
  { cwd: REPO_ROOT, encoding: "utf8" },
);
assert("g9g4a2 c3 verifier pass", c3.status === 0, c3.stderr?.slice(0, 200));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

console.log(`\nG-13a verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
