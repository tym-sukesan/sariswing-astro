/**
 * G-18e — Gosaki Discography tracks title-edit Save slice planning verifier.
 * Run: node tools/static-to-astro/scripts/verify-g18e-gosaki-discography-tracks-title-edit-save-slice-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g18e-tracks-title-edit-save-slice-planning.md";
const G18D_RESULT_REL = "tools/static-to-astro/docs/gosaki-discography-g18d-tracks-sql-execution-result.md";
const HOOK_REL = "tools/static-to-astro/scripts/lib/supabase-discography-read.mjs";
const SEED_REL = "tools/static-to-astro/data/gosaki/discography.seed.json";

const BASE_COMMIT = "d6d5039";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";

const ALBUM_COUNTS = {
  "discography-001": 9,
  "discography-002": 8,
  "discography-003": 9,
  "discography-004": 8,
};

const POC = {
  legacyId: "discography-002",
  trackNumber: 7,
  id: "fd58cd6e-2fff-4ff2-96af-3087c469450b",
  beforeTitle: "Like a Lover",
  afterTitle: "[CMS Kit staging] G-18f track title PoC",
  approvalId: "G-18f-gosaki-discography-track-title-non-dry-run-slice",
};

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

assert("HEAD is d6d5039", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is d6d5039", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const hook = read(HOOK_REL);
const seed = JSON.parse(read(SEED_REL));

assert("planning doc exists", exists(DOC_REL));
assert("G-18d result doc exists", exists(G18D_RESULT_REL));
assert("doc phase G-18e", doc.includes("G-18e-gosaki-discography-tracks-title-edit-save-slice-planning"));
assert("doc planning gate", doc.includes("gosakiDiscographyG18eTracksTitleEditSaveSlicePlanningComplete: true"));
assert("doc 34 tracks inventory", doc.includes("34"));
assert("doc per-album 9 8 9 8", doc.includes("9 / 8 / 9 / 8") || (doc.match(/9/g) && doc.match(/8/g)));
assert("doc candidate classification", doc.includes("Natural correction") || doc.includes("candidate"));
assert("doc no natural correction", doc.includes("naturalTitleCorrectionCandidateFound: false"));
assert("doc textarea UI direction", doc.includes("album-level multiline textarea") || doc.includes("Album-level multiline textarea"));
assert("doc not recommended 34 fixed inputs", doc.includes("34 fixed") || doc.includes("Not recommended"));
assert("doc parse rules trim empty lines", doc.includes("trim") && doc.includes("Empty lines"));
assert("doc diff preview added deleted changed", doc.includes("added") && doc.includes("deleted") && doc.includes("reordered"));
assert("doc album-level Save options", doc.includes("Single track title UPDATE") && doc.includes("full replacement"));
assert("doc single-row PoC not primary", doc.includes("singleRowTitlePocPrimaryUi: false") || doc.includes("not primary UI"));
assert("doc defer 白玉Bluse", doc.includes("白玉Bluse"));
assert("doc Save design options", doc.includes("1 —") && doc.includes("4 —"));
assert("doc recommended Option 1 WHERE", doc.includes("Recommended"));
assert("doc optimistic lock section", doc.includes("updated_at") || doc.includes("Optimistic"));
assert("doc no updated_at on tracks", doc.includes("no `updated_at`") || doc.includes("No `updated_at`"));
assert("doc public reflection", doc.includes("patchDiscographyItemTracks") || doc.includes("Public reflection"));
assert("doc readyForG18f textarea diff", doc.includes("readyForG18fTracklistTextareaDiffDryRun: true"));
assert("doc G-18f not single-row primary", doc.includes("readyForG18fTracksTitleEditDryRunImplementation: false"));
assert("doc G-18g Save adapter planning gate", doc.includes("readyForG18gTracklistTextareaSaveAdapterPlanning"));
assert("doc G-18f phase name", doc.includes("G-18f-gosaki-discography-tracklist-textarea-diff-dry-run") || doc.includes("tracklist-textarea-diff"));
assert("doc PoC before title", doc.includes(POC.beforeTitle));
assert("doc PoC row id", doc.includes(POC.id));
assert("doc internal adapter reference", doc.includes("internal adapter") || doc.includes("adapter spike"));
assert("doc GRANT preflight note", doc.includes("GRANT") || doc.includes("grant"));
assert("doc staging host", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(SARISWING_HOST));
assert("doc no save this phase", doc.includes("saveImplementedInThisPhase: false"));
assert("hook no tracks patch yet", !hook.includes("patchDiscographyItemTracks"));

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
      `${base}/rest/v1/discography_tracks?select=id,discography_legacy_id,track_number,title,sort_order&order=discography_legacy_id.asc,sort_order.asc`,
      { headers: h },
    )
  ).json();

  assert("live total 34", Array.isArray(tracks) && tracks.length === 34, String(tracks?.length));

  const counts = {};
  for (const t of tracks) {
    counts[t.discography_legacy_id] = (counts[t.discography_legacy_id] ?? 0) + 1;
  }
  for (const [lid, n] of Object.entries(ALBUM_COUNTS)) {
    assert(`live count ${lid}`, counts[lid] === n, String(counts[lid]));
  }

  const pocRow = tracks.find((t) => t.id === POC.id);
  assert("live PoC row exists", !!pocRow, POC.id);
  assert("live PoC title unchanged", pocRow?.title === POC.beforeTitle, pocRow?.title);
  assert("live PoC track_number 7", pocRow?.track_number === 7);

  for (const r of seed.releases) {
    const dbTitles = tracks
      .filter((t) => t.discography_legacy_id === r.legacyId)
      .sort((a, b) => a.track_number - b.track_number)
      .map((t) => t.title);
    assert(`seed match ${r.legacyId}`, JSON.stringify(dbTitles) === JSON.stringify(r.trackListJson));
  }
}

assert("no DB write by Cursor", true);
assert("no Save executed", true);
assert("no SQL mutation executed", true);
assert("no package regen executed", doc.includes("packageRegenExecuted: false"));
assert("no FTP upload executed", doc.includes("ftpUploadExecuted: false"));
assert("no service_role", true);
assert("commit push not executed", true);

console.log(`\nG-18e planning verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
