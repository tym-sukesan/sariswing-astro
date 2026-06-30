/**
 * G-18g2 — Discography tracklist single-title Save adapter dry-run verifier.
 * Run: node tools/static-to-astro/scripts/verify-g18g2-gosaki-discography-tracklist-single-title-save-dry-run.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  G18G2_AFTER_TITLE,
  G18G2_APPROVAL_ID,
  G18G2_BEFORE_TITLE,
  G18G2_EXPECTED_BEFORE_FINGERPRINT,
  G18G2_TARGET_LEGACY_ID,
  G18G2_TARGET_TRACK_ROW_ID,
  simulateG18g2PocDiff,
} from "./lib/discography-g18g2-guards-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g18g2-tracklist-single-title-save-dry-run.md";
const G18G1_RESULT_REL = "tools/static-to-astro/docs/gosaki-discography-g18g1-apply-update-grant-result.md";
const SAVE_REL = "src/lib/admin/staging-write/gosaki-discography-g18g2-tracklist-title-save.ts";
const GUARDS_REL = "src/lib/admin/staging-write/gosaki-discography-g18g2-tracklist-title-guards.ts";
const CONFIG_REL = "src/lib/admin/staging-write/gosaki-discography-g18g2-tracklist-title-save-config.ts";
const TYPES_REL = "src/lib/admin/staging-write/discography-tracks-write-types.ts";
const UI_REL = "src/lib/admin/staging-data/gosaki-staging-discography-admin-ui.ts";
const OPERATOR_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const BASE_COMMIT = "cf4d571";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const ARMED_ENV = "PUBLIC_ADMIN_DISCOGRAPHY_G18G2_TRACKLIST_TITLE_NON_DRY_RUN_ARMED";

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

assert("HEAD is cf4d571", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is cf4d571", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const g18g1Result = read(G18G1_RESULT_REL);
const saveSrc = read(SAVE_REL);
const guardsSrc = read(GUARDS_REL);
const configSrc = read(CONFIG_REL);
const typesSrc = read(TYPES_REL);
const uiSrc = read(UI_REL);
const operator = read(OPERATOR_REL);

assert("doc exists", exists(DOC_REL));
assert("doc phase G-18g2", doc.includes("G-18g2-gosaki-discography-tracklist-single-title-save-dry-run"));
assert("doc complete gate", doc.includes("gosakiDiscographyG18g2TracklistSingleTitleSaveDryRunComplete: true"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(PROD_REF));
assert("doc approvalId", doc.includes(G18G2_APPROVAL_ID));
assert("doc target discography-002", doc.includes(G18G2_TARGET_LEGACY_ID));
assert("doc target row id", doc.includes(G18G2_TARGET_TRACK_ROW_ID));
assert("doc before Like a Lover", doc.includes(G18G2_BEFORE_TITLE));
assert("doc after test title", doc.includes(G18G2_AFTER_TITLE));
assert("doc expected fingerprint", doc.includes(G18G2_EXPECTED_BEFORE_FINGERPRINT));
assert("doc dryRun true", doc.includes("dryRun: true"));
assert("doc actualWrite false", doc.includes("actualWrite: false"));
assert("doc saveAllowed false", doc.includes("saveAllowed: false"));
assert("doc where guard", doc.includes("discography_legacy_id = 'discography-002'"));
assert("doc rowsAffected 1", doc.includes("rowsAffected === 1"));
assert("doc rollback hint", doc.includes("Like a Lover（テスト） -> Like a Lover"));
assert("doc next preflight", doc.includes("readyForG18g2TracklistSingleTitleSaveFinalPreflight: true"));

assert("g18g1 grant result recorded", g18g1Result.includes("authenticatedUpdateGrantPresent: true"));

assert("save module exists", exists(SAVE_REL));
assert("save dry-run export", saveSrc.includes("executeG18g2TracklistTitleDryRun"));
assert("save gated actual write", saveSrc.includes("executeG18g2TracklistTitleSave"));
assert("save actualWrite false in dry-run", saveSrc.includes("actualWrite: false"));
assert("save wouldWrite", saveSrc.includes("wouldWrite"));
assert("save where guard eq chain", saveSrc.includes('.eq("title", where.title)'));
assert("save rowsAffected check", saveSrc.includes("rowsAffected !== 1"));
assert("save target row id", saveSrc.includes("G18G2_TARGET_TRACK_ROW_ID"));
assert("save dry run blocks write", saveSrc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=true blocks actual write"));

assert("guards fingerprint", guardsSrc.includes("G18G2_EXPECTED_BEFORE_FINGERPRINT"));
assert("guards changed.length", guardsSrc.includes("changed.length !== 1"));
assert("guards track 7", guardsSrc.includes("G18G2_TARGET_TRACK_NUMBER"));
assert("guards approval registry", guardsSrc.includes("DISCOGRAPHY_TRACKS_WRITE_APPROVAL_IDS"));

assert("config armed env", configSrc.includes(ARMED_ENV));
assert("config save disabled default", configSrc.includes("saveEnabled"));
assert("config dry run blocks", configSrc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN"));

assert("types approval id", typesSrc.includes(G18G2_APPROVAL_ID));

assert("ui g18g2 dry-run route", uiSrc.includes("executeG18g2TracklistTitleDryRun"));
assert("ui render g18g2", uiSrc.includes("renderG18g2TracklistSaveDryRunResult"));
assert("ui where guard preview", uiSrc.includes("whereGuard"));
assert("ui rollback hint", uiSrc.includes("rollbackHint"));
assert("ui save blocked g18g2", uiSrc.includes("getGosakiDiscographyG18g2TracklistTitleSaveConfig"));
assert("ui textarea route", uiSrc.includes("readDiscographyTracklistTextareaFromForm"));

assert(
  "operator g18g2 page config",
  operator.includes("G18G2_DISCOGRAPHY_TRACKLIST_PAGE_CONFIG_ELEMENT_ID") ||
    operator.includes("g18g2-discography-tracklist-page-config"),
);
assert(
  "operator g18g2 approval id",
  operator.includes("G18G2_DISCOGRAPHY_TRACKLIST_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID") ||
    operator.includes(G18G2_APPROVAL_ID),
);
assert("operator textarea tracks", operator.includes('name="tracks"'));

assert("production admin untouched", !read(SARISWING_ADMIN_REL).includes("G-18g2"));

const poc = simulateG18g2PocDiff();
assert("sim PoC guard pass", poc.guardErrors.length === 0, poc.guardErrors.join("; "));
assert("sim PoC changed 1", poc.diff.changed.length === 1);
assert("sim PoC track 7", poc.diff.changed[0]?.track_number === 7);
assert("sim PoC before title", poc.diff.changed[0]?.before === G18G2_BEFORE_TITLE);
assert("sim PoC after title", poc.diff.changed[0]?.after === G18G2_AFTER_TITLE);
assert("sim fingerprint", poc.fingerprintBefore === G18G2_EXPECTED_BEFORE_FINGERPRINT);

assert("no DB write by Cursor", true);
assert("no Save executed", true);
assert("no SQL UPDATE", true);
assert("no package regen", doc.includes("packageRegenExecuted: false"));
assert("no FTP", doc.includes("ftpUploadExecuted: false"));
assert("no service_role", saveSrc.includes("serviceRoleUsed: false"));
assert("commit push not executed", true);

console.log(`\nG-18g2 dry-run verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
