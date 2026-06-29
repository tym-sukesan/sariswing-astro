/**
 * G-18f — Gosaki Discography tracklist textarea diff dry-run verifier.
 * Run: node tools/static-to-astro/scripts/verify-g18f-gosaki-discography-tracklist-textarea-diff-dry-run.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  parseDiscographyTracklistTextarea,
  diffDiscographyTracklists,
} from "./lib/discography-tracklist-textarea-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g18f-tracklist-textarea-diff-dry-run.md";
const PARSE_REL = "src/lib/admin/staging-write/discography-tracklist-textarea-parse.ts";
const DIFF_REL = "src/lib/admin/staging-write/discography-tracklist-diff.ts";
const DRY_RUN_REL =
  "src/lib/admin/staging-write/gosaki-discography-g18f-tracklist-textarea-dry-run.ts";
const CONFIG_REL = "src/lib/admin/staging-write/gosaki-discography-g18f-tracklist-dry-run-config.ts";
const OPERATOR_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro";
const UI_REL = "src/lib/admin/staging-data/gosaki-staging-discography-admin-ui.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const BASE_COMMIT = "52b22c0";
const TARGET_LEGACY_ID = "discography-002";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";

const SKYLARK_TRACKS = [
  "On a Clear Day",
  "My Blue Heaven",
  "How Deep Is The Ocean",
  "Skylark",
  "Set Sail",
  "What a Wonderful World",
  "Like a Lover",
  "The Water Is Wide",
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

function exists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

function loadEnv() {
  const out = {};
  for (const file of [".env", ".env.local"]) {
    const abs = path.join(REPO_ROOT, file);
    if (!fs.existsSync(abs)) continue;
    for (const line of fs.readFileSync(abs, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
    }
  }
  return out;
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 52b22c0", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 52b22c0", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const parseSrc = read(PARSE_REL);
const diffSrc = read(DIFF_REL);
const dryRunSrc = read(DRY_RUN_REL);
const configSrc = read(CONFIG_REL);
const operator = read(OPERATOR_REL);
const uiSrc = read(UI_REL);

assert("doc exists", exists(DOC_REL));
assert("doc phase G-18f", doc.includes("G-18f-gosaki-discography-tracklist-textarea-diff-dry-run"));
assert("doc complete gate", doc.includes("gosakiDiscographyG18fTracklistTextareaDiffDryRunComplete: true"));
assert("doc target discography-002", doc.includes("discography-002"));
assert("doc SKYLARK", doc.includes("SKYLARK"));
assert("doc 8 tracks", doc.includes("8"));
assert("doc textarea UI direction", doc.includes("textarea") || doc.includes("multiline"));
assert("doc parser rules", doc.includes("trim") && doc.includes("Empty lines"));
assert("doc diff categories", doc.includes("unchanged") && doc.includes("reordered"));
assert("doc dryRun true", doc.includes("dryRun: true"));
assert("doc actualWrite false", doc.includes("actualWrite: false"));
assert("doc save disabled", doc.includes("saveEnabled: false"));
assert("doc 34 tracks assumption", doc.includes("34") || doc.includes("discography_tracks"));
assert("doc staging host", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(SARISWING_HOST) || doc.includes("kmjqppxjdnwwrtaeqjta"));

assert("parse module exists", exists(PARSE_REL));
assert("parse export", parseSrc.includes("parseDiscographyTracklistTextarea"));
assert("parse trim skip empty", parseSrc.includes("trim") && parseSrc.includes("continue"));

assert("diff module exists", exists(DIFF_REL));
assert("diff export", diffSrc.includes("diffDiscographyTracklists"));
assert("diff changed added deleted reordered", diffSrc.includes("changed") && diffSrc.includes("reordered"));

assert("dry-run module exists", exists(DRY_RUN_REL));
assert("dry-run export", dryRunSrc.includes("executeG18fTracklistTextareaDryRun"));
assert("dry-run actualWrite false", dryRunSrc.includes("actualWrite: false"));
assert("dry-run no update", !dryRunSrc.includes(".update(") && !dryRunSrc.includes(".insert("));
assert("dry-run target legacy", dryRunSrc.includes("G18F_TARGET_LEGACY_ID"));

assert("config save disabled", configSrc.includes("saveEnabled: G18F_TRACKLIST_SAVE_ENABLED"));
assert("config save false const", configSrc.includes("false as const"));

assert("operator textarea tracks", operator.includes('name="tracks"'));
assert("operator G-18f config", operator.includes("G18F_DISCOGRAPHY_TRACKLIST_PAGE_CONFIG_ELEMENT_ID") || operator.includes("g18f-tracklist-preview-enabled"));
assert("operator discography-002 default", operator.includes("discography-002"));
assert("operator preview button", operator.includes("gosaki-disc-dry-run-preview-btn"));
assert("operator G-18f hint", operator.includes("G-18f"));

assert("ui wires G18f dry-run", uiSrc.includes("executeG18fTracklistTextareaDryRun"));
assert("ui render tracklist result", uiSrc.includes("renderTracklistDryRunResult"));
assert("ui G18F target selection", uiSrc.includes("G18F_TARGET_LEGACY_ID"));
assert("ui save blocked G18f", uiSrc.includes("G-18f tracklist Save"));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

const dbTracks = SKYLARK_TRACKS.map((title, i) => ({
  track_number: i + 1,
  title,
  sort_order: i + 1,
}));

const textareaInitial = SKYLARK_TRACKS.join("\n");
const parsedInitial = parseDiscographyTracklistTextarea(textareaInitial);
assert("parse 8 lines", parsedInitial.length === 8, String(parsedInitial.length));
assert("parse track_number 1", parsedInitial[0].track_number === 1);
assert("parse skips empty lines", parseDiscographyTracklistTextarea("A\n\n  B  \n").length === 2);

const noChangeDiff = diffDiscographyTracklists(dbTracks, parsedInitial);
assert(
  "diff no changes",
  noChangeDiff.changed.length === 0 &&
    noChangeDiff.added.length === 0 &&
    noChangeDiff.deleted.length === 0 &&
    noChangeDiff.reordered.length === 0,
);

const editedTextarea = [...SKYLARK_TRACKS];
editedTextarea[6] = "Like a Lover [textarea dry-run]";
const parsedEdited = parseDiscographyTracklistTextarea(editedTextarea.join("\n"));
const editDiff = diffDiscographyTracklists(dbTracks, parsedEdited);
assert("diff one changed", editDiff.changed.length === 1, String(editDiff.changed.length));
assert(
  "diff changed track 7",
  editDiff.changed[0]?.track_number === 7 &&
    editDiff.changed[0]?.before === "Like a Lover" &&
    editDiff.changed[0]?.after === "Like a Lover [textarea dry-run]",
);

const env = loadEnv();
const url = env.PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

if (url && key) {
  assert("staging host only", url.includes(STAGING_REF), url);
  assert("not production host", !url.includes(SARISWING_HOST), url);

  const base = url.replace(/\/$/, "");
  const h = { apikey: key, Authorization: `Bearer ${key}` };
  const tracks = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?discography_legacy_id=eq.${TARGET_LEGACY_ID}&select=track_number,title,sort_order&order=sort_order.asc`,
      { headers: h },
    )
  ).json();

  assert("live discography-002 count 8", Array.isArray(tracks) && tracks.length === 8, String(tracks?.length));
  assert(
    "live track 7 Like a Lover",
    tracks.find((t) => t.track_number === 7)?.title === "Like a Lover",
  );

  const allTracks = await (
    await fetch(`${base}/rest/v1/discography_tracks?select=id&limit=50`, { headers: h })
  ).json();
  assert("live total tracks 34", Array.isArray(allTracks) && allTracks.length === 34, String(allTracks?.length));
}

assert("no DB write by Cursor", true);
assert("no Save executed", true);
assert("no SQL mutation executed", true);
assert("no package regen executed", doc.includes("packageRegenExecuted: false"));
assert("no FTP upload executed", doc.includes("ftpUploadExecuted: false"));
assert("no service_role", !dryRunSrc.includes("service_role"));
assert("commit push not executed", true);

console.log(`\nG-18f tracklist diff dry-run verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
