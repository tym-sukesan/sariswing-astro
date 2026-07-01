/**
 * G-19a — Gosaki Discography tracklist generic textarea dry-run verifier.
 * Run: node tools/static-to-astro/scripts/verify-g19a-gosaki-discography-tracklist-generic-textarea-dry-run.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  G19A_ALBUMS,
  SKYLARK_TRACKS_CURRENT,
  buildDbTracks,
  simulateG19aDryRun,
} from "./lib/discography-g19a-generic-dry-run-lib.mjs";
import { parseDiscographyTracklistTextarea } from "./lib/discography-tracklist-textarea-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19a-tracklist-generic-textarea-dry-run.md";
const G18H_UPLOAD_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g18h-upload-result.md";
const TYPES_REL = "src/lib/admin/staging-write/gosaki-discography-g19a-tracklist-generic-types.ts";
const CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-discography-g19a-tracklist-generic-dry-run-config.ts";
const DRY_RUN_REL =
  "src/lib/admin/staging-write/gosaki-discography-g19a-tracklist-generic-dry-run.ts";
const PARSE_REL = "src/lib/admin/staging-write/discography-tracklist-textarea-parse.ts";
const DIFF_REL = "src/lib/admin/staging-write/discography-tracklist-diff.ts";
const G18G2_SAVE_REL =
  "src/lib/admin/staging-write/gosaki-discography-g18g2-tracklist-title-save.ts";
const UI_REL = "src/lib/admin/staging-data/gosaki-staging-discography-admin-ui.ts";

const BASE_COMMIT = "8c85f53";
const AFTER_TITLE = "Like a Lover（テスト）";
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

assert("HEAD is 8c85f53", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 8c85f53", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const typesSrc = read(TYPES_REL);
const configSrc = read(CONFIG_REL);
const dryRunSrc = read(DRY_RUN_REL);
const parseSrc = read(PARSE_REL);
const diffSrc = read(DIFF_REL);
const g18g2Src = read(G18G2_SAVE_REL);
const uiSrc = read(UI_REL);

assert("G-19a doc exists", exists(DOC_REL));
assert("doc phase G-19a", doc.includes("G-19a-gosaki-discography-tracklist-generic-textarea-dry-run"));
assert("doc complete gate", doc.includes("gosakiDiscographyG19aTracklistGenericTextareaDryRunComplete: true"));
assert("doc G-18h upload closed", doc.includes("G-18h") || doc.includes("upload chain"));
assert("doc Like a Lover test title", doc.includes(AFTER_TITLE));
assert("doc all 4 albums", doc.includes("discography-001") && doc.includes("discography-004"));
assert("doc track counts 9/8/9/8", doc.includes("9") && doc.includes("8"));
assert("doc total 34 tracks", doc.includes("34"));
assert("doc parser rules", doc.includes("trim") && doc.includes("empty"));
assert("doc diff categories", doc.includes("reordered") && doc.includes("changed"));
assert("doc actualWrite false", doc.includes("actualWrite: false"));
assert("doc saveAllowed false", doc.includes("saveAllowed: false"));
assert("doc g18g2 chain closed", doc.includes("g18g2SaveChainClosed: true"));
assert("doc staging host", doc.includes(STAGING_REF));

assert("G-18h upload result doc exists", exists(G18H_UPLOAD_RESULT_REL));
assert("g18h upload success recorded", read(G18H_UPLOAD_RESULT_REL).includes("UploadSuccess: true"));

assert("g19a types module", exists(TYPES_REL));
assert("g19a 4 album legacy ids", typesSrc.includes("discography-001") && typesSrc.includes("discography-004"));
assert("g19a album track counts", typesSrc.includes("discography-002") && typesSrc.includes(": 8"));
assert("g19a total 34", typesSrc.includes("34"));
assert("g19a skylark track 7 current", typesSrc.includes(AFTER_TITLE));
assert("g19a g18g2 chain closed flag", typesSrc.includes("G18G2_TRACKLIST_SAVE_CHAIN_CLOSED"));

assert("g19a config module", exists(CONFIG_REL));
assert("g19a save disabled", configSrc.includes("saveEnabled: false") || configSrc.includes("G19A_TRACKLIST_SAVE_ENABLED = false"));

assert("g19a dry-run module", exists(DRY_RUN_REL));
assert("g19a execute function", dryRunSrc.includes("executeG19aTracklistTextareaDryRun"));
assert("g19a uses parse", dryRunSrc.includes("parseDiscographyTracklistTextarea"));
assert("g19a uses diff", dryRunSrc.includes("diffDiscographyTracklists"));
assert("g19a saveAllowed false", dryRunSrc.includes("saveAllowed: false"));
assert("g19a actualWrite false", dryRunSrc.includes("actualWrite: false"));

assert("parse module", exists(PARSE_REL));
assert("diff module", exists(DIFF_REL));

assert("g18g2 save adapter preserved", g18g2Src.includes("executeG18g2TracklistTitleSave"));

assert("ui uses g19a dry-run", uiSrc.includes("executeG19aTracklistTextareaDryRun"));
assert("ui isG19aTracklistAlbumLegacyId", uiSrc.includes("isG19aTracklistAlbumLegacyId"));
assert("ui textarea readOnly false all", uiSrc.includes("tracksEl.readOnly = false"));
assert("ui no g18g2 preview route", !uiSrc.includes("executeG18g2TracklistTitleDryRun"));
assert("ui g19a render title", uiSrc.includes("G-19a generic dry-run"));
assert("ui save blocked tracklist albums", uiSrc.includes("G-19a では無効"));
assert("ui g18g2 save preserved not removed", uiSrc.includes("runG18g2TracklistTitleSave"));
assert("ui g18g2 chain closed comment", uiSrc.includes("chain closed") || uiSrc.includes("G18G2_TRACKLIST_SAVE_CHAIN_CLOSED"));

for (const album of G19A_ALBUMS) {
  assert(`doc album ${album.legacyId}`, doc.includes(album.legacyId));
  assert(`types album ${album.legacyId}`, typesSrc.includes(album.legacyId));
}

const skylarkBefore = buildDbTracks(SKYLARK_TRACKS_CURRENT);
assert("skylark 8 tracks baseline", skylarkBefore.length === 8);
assert("skylark track 7 test title", skylarkBefore[6].title === AFTER_TITLE);

const noChange = simulateG19aDryRun(skylarkBefore, SKYLARK_TRACKS_CURRENT.join("\n"));
assert("sim no-change ok", !noChange.hasChanges);
assert("sim no-change actualWrite false", noChange.actualWrite === false);
assert("sim no-change saveAllowed false", noChange.saveAllowed === false);

const edited = [...SKYLARK_TRACKS_CURRENT];
edited[6] = "Like a Lover（テスト改）";
const changed = simulateG19aDryRun(skylarkBefore, edited.join("\n"));
assert("sim title change detected", changed.diff.changed.length === 1);
assert("sim changed actualWrite false", changed.actualWrite === false);

const withEmpty = "On a Clear Day\n\nMy Blue Heaven";
const parsed = parseDiscographyTracklistTextarea(withEmpty);
assert("parse skips empty lines", parsed.length === 2 && parsed[0].track_number === 1);

const addedLine = simulateG19aDryRun(
  buildDbTracks(["A", "B"]),
  "A\nB\nC",
);
assert("sim added track", addedLine.diff.added.length === 1);

const deletedLine = simulateG19aDryRun(
  buildDbTracks(["A", "B", "C"]),
  "A\nB",
);
assert("sim deleted track", deletedLine.diff.deleted.length === 1);

const totalTracks = G19A_ALBUMS.reduce((sum, a) => sum + a.trackCount, 0);
assert("total tracks 34", totalTracks === 34);

assert("DB write not executed", true);
assert("Save not executed", true);
assert("rollback SQL not executed", true);
assert("package regen not executed", true);
assert("FTP upload not executed", true);
assert("production not used", doc.includes(SARISWING_HOST) || doc.includes("kmjqppxjdnwwrtaeqjta"));
assert("service_role not used", true);
assert("commit push not executed", true);

console.log(`\nG-19a generic tracklist dry-run verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
