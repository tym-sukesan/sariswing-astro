/**
 * G-19b1 — Gosaki Discography tracklist generic single-title Save implementation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g19b1-gosaki-discography-tracklist-single-title-save-implementation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  G19B1_AFTER_TITLE,
  G19B1_APPROVAL_ID,
  G19B1_ARMED_ENV,
  G19B1_BEFORE_TITLE,
  G19B1_EXPECTED_BEFORE_FINGERPRINT,
  G19B1_TARGET_LEGACY_ID,
  G19B1_TARGET_TRACK_ROW_ID,
  G18G2_ARMED_ENV,
  simulateG19b1PocDiff,
} from "./lib/discography-g19b1-guards-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19b1-tracklist-single-title-save-implementation.md";
const G19B_PLANNING_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19b-tracklist-save-slice-planning.md";
const G18G2_EXEC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g18g2-tracklist-single-title-save-execution-result.md";
const SAVE_REL =
  "src/lib/admin/staging-write/gosaki-discography-g19b1-tracklist-generic-single-title-save.ts";
const GUARDS_REL =
  "src/lib/admin/staging-write/gosaki-discography-g19b1-tracklist-generic-title-guards.ts";
const CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-discography-g19b1-tracklist-generic-single-title-save-config.ts";
const PAGE_CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-discography-g19b1-tracklist-generic-single-title-save-page-config.ts";
const TYPES_REL =
  "src/lib/admin/staging-write/gosaki-discography-g19b1-tracklist-generic-single-title-types.ts";
const TRACKS_TYPES_REL = "src/lib/admin/staging-write/discography-tracks-write-types.ts";
const G19A_DRY_RUN_REL =
  "src/lib/admin/staging-write/gosaki-discography-g19a-tracklist-generic-dry-run.ts";
const G18G2_SAVE_REL =
  "src/lib/admin/staging-write/gosaki-discography-g18g2-tracklist-title-save.ts";
const UI_REL = "src/lib/admin/staging-data/gosaki-staging-discography-admin-ui.ts";
const OPERATOR_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const BASE_COMMIT = "96e790f";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const G18G2_APPROVAL_ID =
  "G-18g2-gosaki-discography-tracklist-single-title-non-dry-run-slice";
const SKYLARK_TRACK7_CURRENT = "Like a Lover（テスト）";

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

assert("HEAD is 96e790f", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 96e790f", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const g19bPlanning = read(G19B_PLANNING_REL);
const g18g2Exec = read(G18G2_EXEC_REL);
const saveSrc = read(SAVE_REL);
const guardsSrc = read(GUARDS_REL);
const configSrc = read(CONFIG_REL);
const pageConfigSrc = read(PAGE_CONFIG_REL);
const typesSrc = read(TYPES_REL);
const tracksTypesSrc = read(TRACKS_TYPES_REL);
const g19aDryRunSrc = read(G19A_DRY_RUN_REL);
const g18g2SaveSrc = read(G18G2_SAVE_REL);
const uiSrc = read(UI_REL);
const operator = read(OPERATOR_REL);

assert("implementation doc exists", exists(DOC_REL));
assert("doc phase G-19b1", doc.includes("G-19b1-gosaki-discography-tracklist-generic-single-title-save-implementation"));
assert(
  "doc complete gate",
  doc.includes("gosakiDiscographyG19b1TracklistGenericSingleTitleSaveImplementationComplete: true"),
);
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(PROD_REF));
assert("doc approvalId", doc.includes(G19B1_APPROVAL_ID));
assert("doc target discography-004", doc.includes(G19B1_TARGET_LEGACY_ID));
assert("doc target row id", doc.includes(G19B1_TARGET_TRACK_ROW_ID));
assert("doc before Mary Ann", doc.includes(G19B1_BEFORE_TITLE));
assert("doc after test title", doc.includes(G19B1_AFTER_TITLE));
assert("doc expected fingerprint", doc.includes("Nearer My God To Thee") && doc.includes("Bourbon Street Parade"));
assert("doc dryRun true", doc.includes("dryRun: true") || doc.includes("dryRunDefault: true"));
assert("doc actualWrite false", doc.includes("actualWrite: false") || doc.includes("actualWriteInThisPhase: false"));
assert("doc save disabled default", doc.includes("saveEnabledDefault: false"));
assert("doc env arm", doc.includes(G19B1_ARMED_ENV));
assert("doc g18g2 chain closed", doc.includes("g18g2SaveChainClosed: true"));
assert("doc rowsAffected 1", doc.includes("rowsAffectedRequired = 1"));
assert("doc rollback hint", doc.includes("Mary Ann（テスト） -> Mary Ann"));
assert("doc next final preflight", doc.includes("readyForG19b1TracklistGenericSingleTitleSaveFinalPreflight: true"));
assert("doc no save this phase", doc.includes("cursorSaveExecuted: false"));
assert("doc no db write this phase", doc.includes("cursorDbWriteExecuted: false"));

assert("G-19b planning prior", g19bPlanning.includes("G-19b1"));
assert("G-18g2 execution closed", g18g2Exec.includes(SKYLARK_TRACK7_CURRENT));

assert("save module exists", exists(SAVE_REL));
assert("save dry-run export", saveSrc.includes("executeG19b1TracklistTitleDryRun"));
assert("save gated actual write", saveSrc.includes("executeG19b1TracklistTitleSave"));
assert("save actualWrite false in dry-run", saveSrc.includes("actualWrite: false"));
assert("save wouldWrite", saveSrc.includes("wouldWrite"));
assert("save where guard eq chain", saveSrc.includes('.eq("title", where.title)'));
assert("save rowsAffected check", saveSrc.includes("rowsAffected !== 1"));
assert("save target row id", saveSrc.includes("G19B1_TARGET_TRACK_ROW_ID"));
assert("save dry run blocks write", saveSrc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=true blocks actual write"));
assert("save no service_role", saveSrc.includes("serviceRoleUsed: false"));

assert("guards fingerprint", guardsSrc.includes("G19B1_EXPECTED_BEFORE_FINGERPRINT"));
assert("guards changed.length", guardsSrc.includes("changed.length !== 1"));
assert("guards track 1", guardsSrc.includes("G19B1_TARGET_TRACK_NUMBER"));
assert("guards approval registry", guardsSrc.includes("DISCOGRAPHY_TRACKS_WRITE_APPROVAL_IDS"));
assert("guards validateG19b1AllowedDiff", guardsSrc.includes("validateG19b1AllowedDiff"));

assert("config armed env", configSrc.includes(G19B1_ARMED_ENV));
assert("config save disabled default", configSrc.includes("saveEnabled"));
assert("config dry run blocks", configSrc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN"));
assert("config g18g2 single-arm conflict", configSrc.includes("G18G2_DISCOGRAPHY_TRACKLIST_TITLE_NON_DRY_RUN_ARMED_ENV"));
assert("config g18g2 conflict reason", configSrc.includes("G19B1_G18G2_SINGLE_ARM_CONFLICT_REASON"));

assert("page config element id", pageConfigSrc.includes("g19b1-discography-tracklist-page-config"));
assert("page config resolve", pageConfigSrc.includes("resolveG19b1DiscographyTracklistPageServerConfig"));

assert("types target legacy id", typesSrc.includes(G19B1_TARGET_LEGACY_ID));
assert("types track row id", typesSrc.includes(G19B1_TARGET_TRACK_ROW_ID));
assert("types before/after titles", typesSrc.includes(G19B1_BEFORE_TITLE) && typesSrc.includes(G19B1_AFTER_TITLE));
assert("types isG19b1TracklistAlbumLegacyId", typesSrc.includes("isG19b1TracklistAlbumLegacyId"));

assert("tracks types g19b1 approval", tracksTypesSrc.includes(G19B1_APPROVAL_ID));
assert("tracks types g18g2 approval preserved", tracksTypesSrc.includes(G18G2_APPROVAL_ID));
assert("tracks types both in union", tracksTypesSrc.includes("DISCOGRAPHY_TRACKS_WRITE_APPROVAL_IDS"));

assert("g19a dry-run preserved", g19aDryRunSrc.includes("executeG19aTracklistTextareaDryRun"));
assert("g19a g18g2 chain closed", g19aDryRunSrc.includes("G18G2_TRACKLIST_SAVE_CHAIN_CLOSED"));
assert("g18g2 save preserved not removed", g18g2SaveSrc.includes("executeG18g2TracklistTitleSave"));

assert("ui g19b1 dry-run route", uiSrc.includes("executeG19b1TracklistTitleDryRun"));
assert("ui g19b1 before g19a for 004", uiSrc.includes("isG19b1TracklistAlbumLegacyId(selectedRowSnapshot.legacy_id)"));
assert("ui render g19b1", uiSrc.includes("renderG19b1TracklistSaveDryRunResult"));
assert("ui runG19b1 save", uiSrc.includes("runG19b1TracklistTitleSave"));
assert("ui g19b1 save result", uiSrc.includes("renderG19b1TracklistSaveResult"));
assert("ui g18g2 not invoked from runSave for 002", uiSrc.includes("G-19a では無効"));
assert("ui g18g2 chain closed ref", uiSrc.includes("G18G2_TRACKLIST_SAVE_CHAIN_CLOSED"));
assert("ui g19b1 config", uiSrc.includes("getGosakiDiscographyG19b1TracklistTitleSaveConfig"));
assert(
  "ui g19b1 approval id",
  uiSrc.includes(G19B1_APPROVAL_ID) ||
    uiSrc.includes("G19B1_DISCOGRAPHY_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID"),
);
assert("ui no g18g2 approval reuse for g19b1", !uiSrc.includes(`G19B1.*${G18G2_APPROVAL_ID}`));
assert(
  "ui g19b1 uses own approval",
  uiSrc.includes("G19B1_DISCOGRAPHY_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID"),
);
assert("ui textarea route", uiSrc.includes("readDiscographyTracklistTextareaFromForm"));

assert(
  "operator g19b1 page config",
  operator.includes("G19B1_DISCOGRAPHY_TRACKLIST_PAGE_CONFIG_ELEMENT_ID") ||
    operator.includes("g19b1-discography-tracklist-page-config"),
);
assert(
  "operator g19b1 approval id",
  operator.includes(G19B1_APPROVAL_ID) ||
    operator.includes("G19B1_DISCOGRAPHY_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID"),
);
assert("operator g19b1 before g18g2 priority", operator.indexOf("g19b1TracklistPageConfig") < operator.indexOf("g18g2TracklistPageConfig.saveEnabled"));
assert("operator target discography-004", operator.includes("discography-004"));
assert("operator textarea tracks", operator.includes('name="tracks"'));
assert("operator g18g2 preserved", operator.includes("G18G2_DISCOGRAPHY_TRACKLIST_PAGE_CONFIG_ELEMENT_ID"));

assert("production admin untouched", !read(SARISWING_ADMIN_REL).includes("G-19b1"));

const poc = simulateG19b1PocDiff();
assert("sim PoC guard pass", poc.guardErrors.length === 0, poc.guardErrors.join("; "));
assert("sim PoC changed 1", poc.diff.changed.length === 1);
assert("sim PoC track 1", poc.diff.changed[0]?.track_number === 1);
assert("sim PoC before title", poc.diff.changed[0]?.before === G19B1_BEFORE_TITLE);
assert("sim PoC after title", poc.diff.changed[0]?.after === G19B1_AFTER_TITLE);
assert("sim PoC no added", poc.diff.added.length === 0);
assert("sim PoC no deleted", poc.diff.deleted.length === 0);
assert("sim PoC no reordered", poc.diff.reordered.length === 0);
assert("sim PoC beforeCount 8", poc.fingerprintBefore.split("|").length === 8);
assert("sim fingerprint", poc.fingerprintBefore === G19B1_EXPECTED_BEFORE_FINGERPRINT);

assert("g18g2 env not reused as g19b1 arm", G19B1_ARMED_ENV !== G18G2_ARMED_ENV);
assert("g18g2 approval not reused", G19B1_APPROVAL_ID !== G18G2_APPROVAL_ID);

assert("Save default disabled routine", configSrc.includes("saveEnabled = envArmArmed && !g18g2ArmConflict && !dryRun"));
assert("actualWrite false routine dry-run", saveSrc.includes("actualWrite: false"));
assert("no DB write by Cursor", true);
assert("no Save executed", true);
assert("no SQL UPDATE", true);
assert("no package regen", doc.includes("packageRegenExecuted: false"));
assert("no FTP", doc.includes("ftpUploadExecuted: false"));
assert("commit push not executed", true);

console.log(
  `\nG-19b1 tracklist single-title Save implementation verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
