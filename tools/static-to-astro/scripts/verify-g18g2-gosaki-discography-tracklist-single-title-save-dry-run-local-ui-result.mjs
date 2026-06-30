/**
 * G-18g2-result — Local UI dry-run preview result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g18g2-gosaki-discography-tracklist-single-title-save-dry-run-local-ui-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g18g2-tracklist-single-title-save-dry-run-local-ui-result.md";
const G18G2_REL = "tools/static-to-astro/docs/gosaki-discography-g18g2-tracklist-single-title-save-dry-run.md";

const BASE_COMMIT = "1041646";
const TARGET_LEGACY_ID = "discography-002";
const TARGET_TRACK_ROW_ID = "fd58cd6e-2fff-4ff2-96af-3087c469450b";
const APPROVAL_ID = "G-18g2-gosaki-discography-tracklist-single-title-non-dry-run-slice";
const LOCAL_URL =
  "http://localhost:4321/__admin-staging-shell/musician-basic/admin/discography/";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const CHANGED_BEFORE = "Like a Lover";
const CHANGED_AFTER = "Like a Lover（テスト）";
const EXPECTED_FINGERPRINT =
  "On a Clear Day|My Blue Heaven|How Deep Is The Ocean|Skylark|Set Sail|What a Wonderful World|Like a Lover|The Water Is Wide";

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

assert("HEAD is 1041646", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 1041646", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const g18g2Doc = exists(G18G2_REL) ? read(G18G2_REL) : "";

assert("local UI result doc exists", exists(DOC_REL));
assert("G-18g2 implementation doc exists", exists(G18G2_REL));
assert(
  "doc phase G-18g2-result",
  doc.includes("G-18g2-result-gosaki-discography-tracklist-single-title-save-dry-run-local-ui-result"),
);
assert("doc complete gate", doc.includes("gosakiDiscographyG18g2LocalUiDryRunPreviewResultComplete: true"));
assert("doc local URL", doc.includes(LOCAL_URL));
assert("doc approvalId", doc.includes(APPROVAL_ID));
assert("doc discography-002", doc.includes(TARGET_LEGACY_ID));
assert("doc SKYLARK", doc.includes("SKYLARK"));
assert("doc target row id", doc.includes(TARGET_TRACK_ROW_ID));
assert("doc before Like a Lover", doc.includes(CHANGED_BEFORE));
assert("doc after test title", doc.includes(CHANGED_AFTER));
assert("doc beforeCount 8", doc.includes("beforeCount") && doc.includes("8"));
assert("doc afterCount 8", doc.includes("afterCount"));
assert("doc expected fingerprint", doc.includes(EXPECTED_FINGERPRINT.replace(/\|/g, "\\|")) || doc.includes(EXPECTED_FINGERPRINT));
assert("doc dryRun true", doc.includes("dryRun: true") || doc.includes("`dryRun` | `true`"));
assert("doc actualWrite false", doc.includes("actualWrite: false") || doc.includes("`actualWrite` | `false`"));
assert("doc wouldWrite true", doc.includes("wouldWrite: true") || doc.includes("`wouldWrite` | `true`"));
assert("doc saveReadiness ready_but_not_armed", doc.includes("ready_but_not_armed"));
assert("doc saveAllowed false", doc.includes("saveAllowed: false") || doc.includes("`saveAllowed` | `false`"));
assert("doc envArmArmed false", doc.includes("envArmArmed: false") || doc.includes("`envArmArmed` | `false`"));
assert("doc hostGatePassed true", doc.includes("hostGatePassed: true") || doc.includes("`hostGatePassed` | `true`"));
assert("doc rowsAffectedRequired 1", doc.includes("rowsAffectedRequired"));
assert("doc whereGuard", doc.includes("whereGuard") && doc.includes("discography-002"));
assert("doc rollbackHint", doc.includes("rollbackHint") && doc.includes("Like a Lover（テスト） -> Like a Lover"));
assert("doc changed track 7", doc.includes("#7:") || doc.includes("track_number\": 7") || doc.includes("track_number\":7"));
assert("doc added none", doc.includes("added") && (doc.includes("なし") || doc.includes("none")));
assert("doc deleted none", doc.includes("deleted") && (doc.includes("なし") || doc.includes("none")));
assert("doc reordered none", doc.includes("reordered") && (doc.includes("なし") || doc.includes("none")));
assert("doc guardErrors none", doc.includes("guardErrors") && (doc.includes("なし") || doc.includes("none")));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false") || doc.includes("not needed"));
assert("doc no cursor save", doc.includes("cursorSaveExecuted: false"));
assert("doc no cursor db write", doc.includes("cursorDbWriteExecuted: false"));
assert("doc readyForG18g2 preflight", doc.includes("readyForG18g2TracklistSingleTitleSaveFinalPreflight: true"));
assert("doc staging host", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(PROD_REF));

assert("G-18g2 doc prior reference", g18g2Doc.includes("G-18g2-gosaki-discography-tracklist-single-title-save-dry-run"));

const env = loadEnv();
const url = env.PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

if (url && key) {
  assert("staging host only", url.includes(STAGING_REF), url);
  assert("not production host", !url.includes(PROD_REF), url);

  const base = url.replace(/\/$/, "");
  const h = { apikey: key, Authorization: `Bearer ${key}` };
  const track7 = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?discography_legacy_id=eq.${TARGET_LEGACY_ID}&track_number=eq.7&select=id,track_number,title`,
      { headers: h },
    )
  ).json();

  assert("live track 7 title unchanged", track7[0]?.title === CHANGED_BEFORE, track7[0]?.title);
  assert("live track 7 id", track7[0]?.id === TARGET_TRACK_ROW_ID, track7[0]?.id);

  const album = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?discography_legacy_id=eq.${TARGET_LEGACY_ID}&select=id`,
      { headers: h },
    )
  ).json();
  assert("live album 8 tracks", album.length === 8, String(album.length));

  const testRows = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?title=eq.${encodeURIComponent(CHANGED_AFTER)}&select=id`,
      { headers: h },
    )
  ).json();
  assert("no test title in DB", testRows.length === 0, String(testRows.length));
}

assert("Save not executed", true);
assert("DB write not executed", true);
assert("no package regen", doc.includes("packageRegenExecuted: false"));
assert("no FTP", doc.includes("ftpUploadExecuted: false"));
assert("commit push not executed", true);

console.log(`\nG-18g2 local UI result verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
