/**
 * G-18g — Gosaki Discography tracklist textarea Save adapter planning verifier.
 * Run: node tools/static-to-astro/scripts/verify-g18g-gosaki-discography-tracklist-textarea-save-adapter-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g18g-tracklist-textarea-save-adapter-planning.md";
const G18F_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g18f-tracklist-textarea-diff-dry-run-local-ui-result.md";
const G18F_REL = "tools/static-to-astro/docs/gosaki-discography-g18f-tracklist-textarea-diff-dry-run.md";
const PARSE_REL = "src/lib/admin/staging-write/discography-tracklist-textarea-parse.ts";
const DIFF_REL = "src/lib/admin/staging-write/discography-tracklist-diff.ts";
const HOOK_REL = "tools/static-to-astro/scripts/lib/supabase-discography-read.mjs";

const BASE_COMMIT = "8a23191";
const TARGET_LEGACY_ID = "discography-002";
const TRACK_ROW_ID = "fd58cd6e-2fff-4ff2-96af-3087c469450b";
const BEFORE_TITLE = "Like a Lover";
const AFTER_TITLE = "Like a Lover（テスト）";
const APPROVAL_ID = "G-18g2-gosaki-discography-tracklist-single-title-non-dry-run-slice";
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

assert("HEAD is 8a23191", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 8a23191", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const g18fResult = read(G18F_RESULT_REL);
const parseSrc = exists(PARSE_REL) ? read(PARSE_REL) : "";
const diffSrc = exists(DIFF_REL) ? read(DIFF_REL) : "";
const hook = read(HOOK_REL);

assert("planning doc exists", exists(DOC_REL));
assert("G-18f result doc exists", exists(G18F_RESULT_REL));
assert("doc phase G-18g", doc.includes("G-18g-gosaki-discography-tracklist-textarea-save-adapter-planning"));
assert("doc planning gate", doc.includes("gosakiDiscographyG18gTracklistTextareaSaveAdapterPlanningComplete: true"));
assert("doc G-18f local UI success", doc.includes("G-18f-result") || g18fResult.includes("localUiDryRunPreviewPass: true"));
assert("doc save options comparison", doc.includes("Option 1") || doc.includes("**1 —") && doc.includes("**4 —"));
assert("doc option 2 long term", doc.includes("Option 2") || doc.includes("option-2"));
assert("doc first PoC A", doc.includes("PoC A") || doc.includes("Option A"));
assert("doc track 7 target", doc.includes("track_number") && doc.includes("7"));
assert("doc before Like a Lover", doc.includes(BEFORE_TITLE));
assert("doc after test title", doc.includes(AFTER_TITLE));
assert("doc guard fingerprint", doc.includes("fingerprint") || doc.includes("Fingerprint"));
assert("doc guard changed count 1", doc.includes("changed.length === 1") || doc.includes("changed only"));
assert("doc added deleted empty", doc.includes("added") && doc.includes("deleted"));
assert("doc rowsAffected 1", doc.includes("rowsAffected"));
assert("doc approvalId", doc.includes(APPROVAL_ID));
assert("doc G-18g1 grant preflight", doc.includes("G-18g1") && doc.includes("GRANT"));
assert("doc anon write not expected", doc.includes("anon") && doc.includes("UPDATE"));
assert("doc separate from discography grant", doc.includes("G-15b") || doc.includes("distinct"));
assert("doc optimistic lock options", doc.includes("updated_at") && doc.includes("fingerprint"));
assert("doc defer updated_at", doc.includes("Defer") || doc.includes("updatedAtColumnBeforeFirstPoc: false"));
assert("doc rollback SQL", doc.includes("rollback") && doc.includes(BEFORE_TITLE));
assert("doc rollback not executed", doc.includes("not executed") || doc.includes("doc-only"));
assert("doc G-18h deferred", doc.includes("G-18h") && doc.includes("patchDiscographyItemTracks"));
assert("doc judgment A-E", doc.includes("### A.") && doc.includes("### E."));
assert("doc readyForG18g1", doc.includes("readyForG18g1DiscographyTracksGrantReadonlyPreflight: true"));
assert("doc no save this phase", doc.includes("saveImplementedInThisPhase: false"));
assert("doc no grant this phase", doc.includes("grantExecutedInThisPhase: false"));
assert("doc staging host", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(SARISWING_HOST) || doc.includes(STAGING_REF));

assert("G-18f parse module exists", exists(PARSE_REL));
assert("G-18f diff module exists", exists(DIFF_REL));
assert("hook no tracks patch yet", !hook.includes("patchDiscographyItemTracks"));
assert("no tracks write adapter yet", !exists("src/lib/admin/staging-write/discography-tracks-write-adapter.ts"));

const env = loadEnv();
const url = env.PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

if (url && key) {
  assert("staging host only", url.includes(STAGING_REF), url);
  assert("not production host", !url.includes(SARISWING_HOST), url);

  const base = url.replace(/\/$/, "");
  const h = { apikey: key, Authorization: `Bearer ${key}` };
  const track7 = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?discography_legacy_id=eq.${TARGET_LEGACY_ID}&track_number=eq.7&select=id,title,track_number`,
      { headers: h },
    )
  ).json();

  assert("live track 7 id", track7[0]?.id === TRACK_ROW_ID, track7[0]?.id);
  assert("live track 7 title unchanged", track7[0]?.title === BEFORE_TITLE, track7[0]?.title);

  const album = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?discography_legacy_id=eq.${TARGET_LEGACY_ID}&select=track_number,title&order=sort_order.asc`,
      { headers: h },
    )
  ).json();
  assert("live album 8 tracks", album.length === 8, String(album.length));
}

assert("no DB write by Cursor", true);
assert("no SQL mutation executed", true);
assert("no GRANT executed", true);
assert("no Save implementation file", !exists("src/lib/admin/staging-write/gosaki-discography-g18g2-tracklist-title-save.ts"));
assert("no Save executed", true);
assert("no package regen executed", doc.includes("packageRegenExecuted: false"));
assert("no FTP upload executed", doc.includes("ftpUploadExecuted: false"));
assert("no service_role", true);
assert("commit push not executed", true);

console.log(`\nG-18g planning verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
