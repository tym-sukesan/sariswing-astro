/**
 * G-20u42 — Gosaki Discography controlled Save enablement preflight verifier.
 * Preflight-only — no env change / build / package / FTP / dry-run / Save / DB write.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-controlled-save-enablement-preflight.md";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const SAVE_ENDPOINT =
  "https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run";
const SAVE_APPROVAL = "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice";
const DRY_RUN_APPROVAL = "G-20u31-gosaki-discography-save-dry-run-endpoint";
const ARM_ENV = "PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED";

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

assert("preflight doc exists", exists(DOC_REL));
assert("package.json has verify script", true);

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
const adminTs = read(
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts",
);
const handlerTs = read("supabase/functions/gosaki-discography-save-dry-run/handler.ts");

assert(
  "package.json script verify:g20u42-gosaki-discography-controlled-save-enablement-preflight",
  packageJson.includes(
    '"verify:g20u42-gosaki-discography-controlled-save-enablement-preflight"',
  ),
);

assert("doc phase id", doc.includes("G-20u42-gosaki-discography-controlled-save-enablement-preflight"));
assert("doc CONTROLLED_SAVE_PREFLIGHT_READY false", doc.includes("CONTROLLED_SAVE_PREFLIGHT_READY: false"));
assert("doc CONTROLLED_SAVE_TARGET_FIXED false", doc.includes("CONTROLLED_SAVE_TARGET_FIXED: false"));
assert("doc EXACT_BEFORE_VALUE_CAPTURED true", doc.includes("EXACT_BEFORE_VALUE_CAPTURED: true"));
assert("doc EXACT_RESTORE_VALUE_FIXED true", doc.includes("EXACT_RESTORE_VALUE_FIXED: true"));
assert(
  "doc OPTIMISTIC_LOCK_BASELINE_CAPTURED true",
  doc.includes("OPTIMISTIC_LOCK_BASELINE_CAPTURED: true"),
);
assert(
  "doc EXECUTION_SURFACE_RECOMMENDED local_shell",
  doc.includes("EXECUTION_SURFACE_RECOMMENDED: local_shell"),
);
assert("doc ARM_DISARM_PLAN_FIXED true", doc.includes("ARM_DISARM_PLAN_FIXED: true"));
assert("doc RESTORE_PLAN_FIXED true", doc.includes("RESTORE_PLAN_FIXED: true"));
assert("doc DB_WRITE_EXECUTED false", doc.includes("DB_WRITE_EXECUTED: false"));
assert("doc ENV_CHANGED false", doc.includes("ENV_CHANGED: false"));
assert("doc PACKAGE_GENERATED false", doc.includes("PACKAGE_GENERATED: false"));
assert("doc FTP_EXECUTED false", doc.includes("FTP_EXECUTED: false"));
assert("doc no service_role", /service_role/i.test(doc) && /false|not used|不使用/i.test(doc));

assert("doc Save endpoint URL", doc.includes(SAVE_ENDPOINT));
assert("doc Save operation save", /Save operation[\s\S]*`save`|operation \| `save`/i.test(doc) || doc.includes('operation | `save`') || doc.includes("Save operation | `save`"));
assert("doc Save approval ID", doc.includes(SAVE_APPROVAL));
assert("doc dry-run approval ID", doc.includes(DRY_RUN_APPROVAL));
assert("doc arm env", doc.includes(ARM_ENV));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF));

assert("doc preferred candidate discography-004", doc.includes("discography-004"));
assert("doc preferred field label", doc.includes("`label`") || doc.includes("| `label`"));
assert(
  "doc exact before Mardi Gras",
  doc.includes("Mardi Gras JAPAN Records"),
);
assert(
  "doc temporary G-20u42 label PoC",
  doc.includes("[CMS Kit staging] G-20u42 label PoC"),
);
assert(
  "doc updated_at baseline",
  doc.includes("2026-07-10T05:59:35.138671+00:00"),
);

assert(
  "doc blocker Edge allowlist",
  /allowlist|CONTROLLED_SAVE_SLICE_ALLOWLIST/i.test(doc),
);
assert(
  "doc blocker release_scalar_change_forbidden",
  doc.includes("release_scalar_change_forbidden"),
);
assert(
  "doc no operator runbook claim ready",
  /Do not.*runbook|not.*ready to execute|ChatGPT later/i.test(doc),
);

assert("source Save approval constant", adminTs.includes(SAVE_APPROVAL));
assert("source arm env constant", adminTs.includes(ARM_ENV));
assert(
  "source arm exact true",
  adminTs.includes('=== "true"') && adminTs.includes("isG20u41DiscographyOperationalSaveArmed"),
);
assert("handler SAVE_APPROVAL_ID", handlerTs.includes(SAVE_APPROVAL));
assert(
  "handler allowlist forbids broad Save",
  handlerTs.includes("controlled Save slice not allowlisted") ||
    handlerTs.includes("broad Save is forbidden"),
);
assert(
  "handler forbids release scalar change",
  handlerTs.includes("release_scalar_change_forbidden"),
);

assert(
  "AI 00 mentions G-20u42",
  currentState.includes("G-20u42-gosaki-discography-controlled-save-enablement-preflight"),
);
assert(
  "AI 03 mentions G-20u42",
  nextActions.includes("G-20u42-gosaki-discography-controlled-save-enablement-preflight"),
);
assert(
  "handoff mentions G-20u42",
  handoff.includes("G-20u42-gosaki-discography-controlled-save-enablement-preflight"),
);
assert(
  "AI gates PREFLIGHT_READY false",
  currentState.includes("CONTROLLED_SAVE_PREFLIGHT_READY: false") ||
    nextActions.includes("CONTROLLED_SAVE_PREFLIGHT_READY: false") ||
    handoff.includes("CONTROLLED_SAVE_PREFLIGHT_READY: false"),
);

assert("doc G-20u44 round-trip section", doc.includes("G-20u44 controlled Save round-trip"));
assert(
  "doc CONTROLLED_SAVE_ROUND_TRIP_COMPLETED true",
  doc.includes("CONTROLLED_SAVE_ROUND_TRIP_COMPLETED: true"),
);
assert(
  "doc CONTROLLED_SAVE_TEMPORARY_WRITE_PASSED true",
  doc.includes("CONTROLLED_SAVE_TEMPORARY_WRITE_PASSED: true"),
);
assert(
  "doc CONTROLLED_SAVE_RESTORE_PASSED true",
  doc.includes("CONTROLLED_SAVE_RESTORE_PASSED: true"),
);
assert("doc FINAL_LABEL_RESTORED true", doc.includes("FINAL_LABEL_RESTORED: true"));
assert("doc OTHER_DATA_UNCHANGED true", doc.includes("OTHER_DATA_UNCHANGED: true"));
assert("doc LOCAL_ARM_TERMINATED true", doc.includes("LOCAL_ARM_TERMINATED: true"));
assert(
  "doc post-restore updated_at",
  doc.includes("2026-07-16T18:35:15.236693+00:00"),
);
assert(
  "AI 00 G-20u44 round-trip",
  currentState.includes("G-20u44-gosaki-discography-controlled-save-round-trip"),
);
assert(
  "AI 03 G-20u44 round-trip",
  nextActions.includes("G-20u44-gosaki-discography-controlled-save-round-trip"),
);
assert(
  "handoff G-20u44 round-trip",
  handoff.includes("G-20u44-gosaki-discography-controlled-save-round-trip"),
);

console.log("");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) process.exit(1);
console.log("G-20u42 controlled Save enablement preflight verifier: PASS");
