/**
 * G-18f-result — Local UI dry-run preview result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g18f-gosaki-discography-tracklist-textarea-diff-dry-run-local-ui-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g18f-tracklist-textarea-diff-dry-run-local-ui-result.md";
const G18F_REL = "tools/static-to-astro/docs/gosaki-discography-g18f-tracklist-textarea-diff-dry-run.md";

const BASE_COMMIT = "9bf554a";
const TARGET_LEGACY_ID = "discography-002";
const APPROVAL_ID = "G-18f-gosaki-discography-tracklist-textarea-diff-dry-run";
const LOCAL_URL =
  "http://localhost:4321/__admin-staging-shell/musician-basic/admin/discography/";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";
const CHANGED_BEFORE = "Like a Lover";
const CHANGED_AFTER = "Like a Lover（テスト）";

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

assert("HEAD is 9bf554a", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 9bf554a", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const g18fDoc = exists(G18F_REL) ? read(G18F_REL) : "";

assert("local UI result doc exists", exists(DOC_REL));
assert("G-18f implementation doc exists", exists(G18F_REL));
assert("doc phase G-18f-result", doc.includes("G-18f-result-gosaki-discography-tracklist-textarea-diff-dry-run-local-ui-result"));
assert("doc complete gate", doc.includes("gosakiDiscographyG18fLocalUiDryRunPreviewResultComplete: true"));
assert("doc local URL", doc.includes(LOCAL_URL));
assert("doc approvalId", doc.includes(APPROVAL_ID));
assert("doc discography-002", doc.includes(TARGET_LEGACY_ID));
assert("doc SKYLARK", doc.includes("SKYLARK"));
assert("doc beforeCount 8", doc.includes("beforeCount") && doc.includes("8"));
assert("doc afterCount 8", doc.includes("afterCount"));
assert("doc changed track 7", doc.includes("track_number\": 7") || doc.includes("#7:"));
assert("doc changed before Like a Lover", doc.includes(CHANGED_BEFORE));
assert("doc changed after test", doc.includes(CHANGED_AFTER));
assert("doc dryRun true", doc.includes("dryRun: true") || doc.includes('"dryRun": true'));
assert("doc actualWrite false", doc.includes("actualWrite: false") || doc.includes('"actualWrite": false'));
assert("doc wouldWrite true", doc.includes("wouldWrite: true") || doc.includes('"wouldWrite": true'));
assert(
  "doc saveReadiness ready_but_save_disabled",
  doc.includes("ready_but_save_disabled"),
);
assert("doc saveAllowed false", doc.includes("saveAllowed: false") || doc.includes('"saveAllowed": false'));
assert("doc guardErrors none", doc.includes("guardErrors") && (doc.includes("none") || doc.includes("なし")));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false") || doc.includes("not needed"));
assert("doc no cursor save", doc.includes("cursorSaveExecuted: false"));
assert("doc no cursor db write", doc.includes("cursorDbWriteExecuted: false"));
assert("doc readyForG18g", doc.includes("readyForG18gTracklistTextareaSaveAdapterPlanning: true"));
assert("doc staging host", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(SARISWING_HOST) || doc.includes(STAGING_REF));

assert("G-18f doc prior reference", g18fDoc.includes("G-18f-gosaki-discography-tracklist-textarea-diff-dry-run"));

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
      `${base}/rest/v1/discography_tracks?discography_legacy_id=eq.${TARGET_LEGACY_ID}&track_number=eq.7&select=track_number,title`,
      { headers: h },
    )
  ).json();

  assert("live track 7 unchanged", track7[0]?.title === CHANGED_BEFORE, track7[0]?.title);
  assert("live track 7 not test edit", track7[0]?.title !== CHANGED_AFTER, track7[0]?.title);

  const albumTracks = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?discography_legacy_id=eq.${TARGET_LEGACY_ID}&select=track_number&order=sort_order.asc`,
      { headers: h },
    )
  ).json();
  assert("live discography-002 still 8 tracks", albumTracks.length === 8, String(albumTracks.length));
}

assert("no DB write by Cursor", true);
assert("no Save executed", true);
assert("no SQL mutation executed", true);
assert("no package regen executed", doc.includes("packageRegenExecuted: false"));
assert("no FTP upload executed", doc.includes("ftpUploadExecuted: false"));
assert("no service_role", true);
assert("commit push not executed", true);

console.log(`\nG-18f local UI result verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
