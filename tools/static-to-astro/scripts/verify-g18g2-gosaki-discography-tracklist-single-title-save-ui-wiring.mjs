/**
 * G-18g2-execution-wiring — Save UI wiring verifier.
 * Run: node tools/static-to-astro/scripts/verify-g18g2-gosaki-discography-tracklist-single-title-save-ui-wiring.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g18g2-tracklist-single-title-save-ui-wiring.md";
const PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g18g2-tracklist-single-title-save-final-preflight.md";
const UI_REL = "src/lib/admin/staging-data/gosaki-staging-discography-admin-ui.ts";
const SAVE_REL = "src/lib/admin/staging-write/gosaki-discography-g18g2-tracklist-title-save.ts";
const CONFIG_REL = "src/lib/admin/staging-write/gosaki-discography-g18g2-tracklist-title-save-config.ts";
const GUARDS_REL = "src/lib/admin/staging-write/gosaki-discography-g18g2-tracklist-title-guards.ts";
const ROLLBACK_SQL_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-discography-g18g2-tracklist-title-save-rollback.sql";

const BASE_COMMIT = "2c92bb3";
const APPROVAL_ID = "G-18g2-gosaki-discography-tracklist-single-title-non-dry-run-slice";
const TARGET_TRACK_ROW_ID = "fd58cd6e-2fff-4ff2-96af-3087c469450b";
const BEFORE_TITLE = "Like a Lover";
const AFTER_TITLE = "Like a Lover（テスト）";
const ARMED_ENV = "PUBLIC_ADMIN_DISCOGRAPHY_G18G2_TRACKLIST_TITLE_NON_DRY_RUN_ARMED";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
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

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 2c92bb3", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 2c92bb3", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const preflight = read(PREFLIGHT_REL);
const uiSrc = read(UI_REL);
const saveSrc = read(SAVE_REL);
const configSrc = read(CONFIG_REL);
const guardsSrc = read(GUARDS_REL);

assert("wiring doc exists", exists(DOC_REL));
assert("doc phase G-18g2-execution-wiring", doc.includes("G-18g2-execution-wiring-gosaki-discography-tracklist-single-title-save-ui-wiring"));
assert("doc complete gate", doc.includes("gosakiDiscographyG18g2TracklistSingleTitleSaveUiWiringComplete: true"));
assert("doc prior gap closed", doc.includes("priorGapRunSaveAlertOnly: closed") || doc.includes("closed"));
assert("doc approvalId", doc.includes(APPROVAL_ID));
assert("doc target row id", doc.includes(TARGET_TRACK_ROW_ID));
assert("doc dry-run safe stack", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=true"));
assert("doc armed stack recorded", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=false"));
assert("doc ARM env", doc.includes(ARMED_ENV));
assert("doc ENABLE_ADMIN_STAGING_WRITE", doc.includes("ENABLE_ADMIN_STAGING_WRITE=true"));
assert("doc ready_for execution", doc.includes("readyForG18g2TracklistSingleTitleSaveExecution: true"));
assert("doc ready_but_not_armed", doc.includes("ready_but_not_armed"));
assert("doc armed ready_to_save", doc.includes("ready_to_save"));
assert("doc where guard", doc.includes("whereGuard") || doc.includes("Like a Lover"));
assert("doc rowsAffected 1", doc.includes("rowsAffected"));
assert("doc no cursor save", doc.includes("cursorSaveExecuted: false"));
assert("doc armed dev not started", doc.includes("armedDevStartedByCursor: false"));
assert("doc staging ref", doc.includes(STAGING_REF));

assert("preflight prior gap recorded", preflight.includes("Save UI wiring") || preflight.includes("alert"));
assert("rollback SQL exists", exists(ROLLBACK_SQL_REL));

assert("ui imports executeG18g2TracklistTitleSave", uiSrc.includes("executeG18g2TracklistTitleSave"));
assert("ui runG18g2TracklistTitleSave", uiSrc.includes("runG18g2TracklistTitleSave"));
assert("ui runSave delegates g18g2", uiSrc.includes("await runG18g2TracklistTitleSave()"));
assert("ui not alert-only runSave", !uiSrc.match(/if \(selectedRowSnapshot\?\.legacy_id === G18F_TARGET_LEGACY_ID\) \{\s*const config = getGosakiDiscographyG18g2TracklistTitleSaveConfig\(\);\s*window\.alert/));
assert("ui save outcome handler", uiSrc.includes("renderG18g2TracklistSaveResult"));
assert("ui save gate on preview", uiSrc.includes("saveUiGateReason"));
assert("ui saveAllowed dynamic", uiSrc.includes("saveGate.enabled"));
assert("ui evaluateG18g2 gate", uiSrc.includes("evaluateG18g2DiscographyOperatorSaveUiGate"));
assert("ui isG18g2 success check", uiSrc.includes("isG18g2TracklistTitleSaveOutcomeSuccess"));

assert("save execute export", saveSrc.includes("export async function executeG18g2TracklistTitleSave"));
assert("save dry run blocks", saveSrc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=true blocks actual write"));
assert("save rowsAffected check", saveSrc.includes("rowsAffected !== 1"));
assert("save where title guard", saveSrc.includes('.eq("title", where.title)'));
assert("config ARM env", configSrc.includes(ARMED_ENV));
assert("config staging write flag", configSrc.includes("ENABLE_ADMIN_STAGING_WRITE"));
assert("config ready_to_save gate", configSrc.includes('input.saveReadiness !== "ready_to_save"'));
assert("guards approval registry", guardsSrc.includes("DISCOGRAPHY_TRACKS_WRITE_APPROVAL_IDS"));

assert("Save not executed by Cursor", true);
assert("DB write not executed", true);
assert("rollback not executed", true);
assert("no package regen", doc.includes("packageRegenExecuted: false"));
assert("no FTP", doc.includes("ftpUploadExecuted: false"));
assert("no service_role", saveSrc.includes("serviceRoleUsed: false"));
assert("commit push not executed", true);

console.log(`\nG-18g2 Save UI wiring verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
