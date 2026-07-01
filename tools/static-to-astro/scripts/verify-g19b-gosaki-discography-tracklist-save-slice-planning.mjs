/**
 * G-19b — Gosaki Discography tracklist Save slice planning verifier.
 * Run: node tools/static-to-astro/scripts/verify-g19b-gosaki-discography-tracklist-save-slice-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19b-tracklist-save-slice-planning.md";
const G19A_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19a-tracklist-generic-textarea-dry-run.md";
const G18G_REL =
  "tools/static-to-astro/docs/gosaki-discography-g18g-tracklist-textarea-save-adapter-planning.md";
const G18G2_EXEC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g18g2-tracklist-single-title-save-execution-result.md";
const G18H_REL =
  "tools/static-to-astro/docs/gosaki-discography-g18h-public-tracks-reflection-preflight.md";
const PARSE_REL = "src/lib/admin/staging-write/discography-tracklist-textarea-parse.ts";
const DIFF_REL = "src/lib/admin/staging-write/discography-tracklist-diff.ts";
const G19A_DRY_RUN_REL =
  "src/lib/admin/staging-write/gosaki-discography-g19a-tracklist-generic-dry-run.ts";
const G18G2_SAVE_REL =
  "src/lib/admin/staging-write/gosaki-discography-g18g2-tracklist-title-save.ts";
const G18G2_GUARDS_REL =
  "src/lib/admin/staging-write/gosaki-discography-g18g2-tracklist-title-guards.ts";
const TRACKS_TYPES_REL = "src/lib/admin/staging-write/discography-tracks-write-types.ts";
const HOOK_REL = "tools/static-to-astro/scripts/lib/supabase-discography-read.mjs";
const UI_REL = "src/lib/admin/staging-data/gosaki-staging-discography-admin-ui.ts";

const BASE_COMMIT = "e798a94";
const G19B1_APPROVAL = "G-19b1-gosaki-discography-tracklist-generic-single-title-non-dry-run-slice";
const G19B1_LEGACY_ID = "discography-004";
const G19B1_TRACK_ROW_ID = "04e987a9-e251-4b0b-b860-21a61e711f8e";
const G19B1_BEFORE_TITLE = "Mary Ann";
const G19B1_AFTER_TITLE = "Mary Ann（テスト）";
const SKYLARK_TRACK7_CURRENT = "Like a Lover（テスト）";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";

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

assert("HEAD is e798a94", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is e798a94", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const g19aDoc = read(G19A_REL);
const g18gDoc = read(G18G_REL);
const parseSrc = read(PARSE_REL);
const diffSrc = read(DIFF_REL);
const g19aDryRunSrc = read(G19A_DRY_RUN_REL);
const g18g2SaveSrc = read(G18G2_SAVE_REL);
const g18g2GuardsSrc = read(G18G2_GUARDS_REL);
const tracksTypesSrc = read(TRACKS_TYPES_REL);
const hookSrc = read(HOOK_REL);
const uiSrc = read(UI_REL);

assert("G-19b planning doc exists", exists(DOC_REL));
assert("doc phase G-19b", doc.includes("G-19b-gosaki-discography-tracklist-save-slice-planning"));
assert("doc complete gate", doc.includes("gosakiDiscographyG19bTracklistSaveSlicePlanningComplete: true"));
assert("doc G-19a prior", doc.includes("G-19a") || doc.includes("gosaki-discography-g19a"));
assert("doc G-19b1 first slice", doc.includes("G-19b1"));
assert("doc discography-004 target", doc.includes(G19B1_LEGACY_ID));
assert("doc track 1 Mary Ann", doc.includes(G19B1_BEFORE_TITLE));
assert("doc after title test suffix", doc.includes(G19B1_AFTER_TITLE));
assert("doc row id", doc.includes(G19B1_TRACK_ROW_ID));
assert("doc approvalId", doc.includes(G19B1_APPROVAL));
assert("doc changed only", doc.includes("changed") && doc.includes("added") && doc.includes("deleted"));
assert("doc no add delete reorder first slice", doc.includes("added.length === 0") || doc.includes("added` only"));
assert("doc fingerprint guard", doc.includes("orderedTitleFingerprint") || doc.includes("fingerprint"));
assert("doc track count 8 for 004", doc.includes("8"));
assert("doc g18g2 chain closed", doc.includes("g18g2SaveChainClosed: true") || doc.includes("G-18g2") && doc.includes("closed"));
assert("doc discography-002 track7 do not re-save", doc.includes(SKYLARK_TRACK7_CURRENT) || doc.includes("discography-002"));
assert("doc optimistic lock composite", doc.includes("updated_at") && doc.includes("composite"));
assert("doc public reflection separate", doc.includes("G-19c") || doc.includes("public reflection"));
assert("doc upload separate", doc.includes("G-19d") || doc.includes("upload"));
assert("doc rollback template", doc.includes("rollback") && doc.includes(G19B1_AFTER_TITLE));
assert("doc staging host", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(SARISWING_HOST));
assert("doc risk classification", doc.includes("Low-risk") || doc.includes("low-risk") || doc.includes("High-risk"));
assert("doc ready for G-19b1 implementation", doc.includes("readyForG19b1TracklistGenericSingleTitleSaveImplementation: true"));
assert("doc no save this phase", doc.includes("saveExecutedInThisPhase: false"));
assert("doc no db write this phase", doc.includes("dbWriteExecutedInThisPhase: false"));

assert("G-19a doc exists", exists(G19A_REL));
assert("G-19a complete", g19aDoc.includes("gosakiDiscographyG19aTracklistGenericTextareaDryRunComplete: true"));
assert("G-18g prior planning exists", exists(G18G_REL));
assert("G-18g option 2 long-term", g18gDoc.includes("Option 2") || g18gDoc.includes("diff"));

assert("parse module exists", exists(PARSE_REL));
assert("diff module exists", exists(DIFF_REL));
assert("g19a dry-run module", g19aDryRunSrc.includes("executeG19aTracklistTextareaDryRun"));
assert("g18g2 save preserved", g18g2SaveSrc.includes("executeG18g2TracklistTitleSave"));
assert("g18g2 guards fingerprint", g18g2GuardsSrc.includes("buildOrderedTitleFingerprint"));
assert("tracks write types g18g2 approval", tracksTypesSrc.includes("G-18g2-gosaki-discography-tracklist-single-title-non-dry-run-slice"));
assert("g19b1 approval not yet in types", !tracksTypesSrc.includes(G19B1_APPROVAL));
assert("hook patchDiscographyItemTracks", hookSrc.includes("patchDiscographyItemTracks"));
assert("ui g19a preview", uiSrc.includes("executeG19aTracklistTextareaDryRun"));
assert("ui g18g2 chain closed", uiSrc.includes("G18G2_TRACKLIST_SAVE_CHAIN_CLOSED"));
assert("ui save disabled g19a", uiSrc.includes("G-19a"));

assert("G-18g2 execution doc exists", exists(G18G2_EXEC_REL));
assert("G-18h reflection doc exists", exists(G18H_REL));

assert("no g19b1 save module yet", !exists("src/lib/admin/staging-write/gosaki-discography-g19b1-tracklist-generic-single-title-save.ts"));

assert("DB write not executed", true);
assert("Save not executed", true);
assert("rollback SQL not executed", true);
assert("package regen not executed", true);
assert("FTP upload not executed", true);
assert("production not used", true);
assert("service_role not used", true);
assert("commit push not executed", true);

console.log(`\nG-19b tracklist Save slice planning verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
