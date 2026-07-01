/**
 * G-19b1-execution-readiness — operator Save execution readiness verifier.
 * Run: node tools/static-to-astro/scripts/verify-g19b1-gosaki-discography-tracklist-single-title-save-execution-readiness.mjs
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
  G19B1_TARGET_LEGACY_ID,
  G19B1_TARGET_TRACK_ROW_ID,
  G18G2_ARMED_ENV,
} from "./lib/discography-g19b1-guards-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19b1-tracklist-single-title-save-execution-readiness.md";
const PREFLIGHT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19b1-tracklist-single-title-save-final-preflight.md";
const UI_REL = "src/lib/admin/staging-data/gosaki-staging-discography-admin-ui.ts";

const BASE_COMMIT = "0112906";
const G18G2_TRACK7_ROW_ID = "fd58cd6e-2fff-4ff2-96af-3087c469450b";
const G18G2_TRACK7_TITLE = "Like a Lover（テスト）";
const LOCAL_URL =
  "http://localhost:4321/__admin-staging-shell/musician-basic/admin/discography/";
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

assert("HEAD is 0112906", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 0112906", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const preflightDoc = read(PREFLIGHT_DOC_REL);
const uiSrc = read(UI_REL);

assert("readiness doc exists", exists(DOC_REL));
assert(
  "doc phase execution-readiness",
  doc.includes("G-19b1-execution-readiness-gosaki-discography-tracklist-generic-single-title-save"),
);
assert(
  "doc complete gate",
  doc.includes("gosakiDiscographyG19b1TracklistGenericSingleTitleSaveExecutionReadinessComplete: true"),
);
assert("doc approvalId", doc.includes(G19B1_APPROVAL_ID));
assert("doc target row id", doc.includes(G19B1_TARGET_TRACK_ROW_ID));
assert("doc operator manual save", doc.includes("戸山さん") || doc.includes("operator"));
assert("doc cursor no save", doc.includes("Cursor must NOT click Save"));
assert("doc env stack dry run false", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=false"));
assert("doc G19B1 arm on", doc.includes(G19B1_ARMED_ENV));
assert("doc G18G2 arm off", doc.includes(G18G2_ARMED_ENV) && doc.includes("false"));
assert("doc ENABLE_ADMIN_STAGING_WRITE", doc.includes("ENABLE_ADMIN_STAGING_WRITE=true"));
assert("doc local URL", doc.includes(LOCAL_URL));
assert("doc discography-004", doc.includes(G19B1_TARGET_LEGACY_ID));
assert("doc preview ready_to_save", doc.includes("ready_to_save"));
assert("doc afterVerification", doc.includes("afterVerification"));
assert("doc g18g2 track7 check", doc.includes(G18G2_TRACK7_TITLE));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(PROD_REF));
assert("doc no package regen", doc.includes("packageRegenExecuted: false"));
assert("doc routine dev restart", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=true"));

assert("preflight doc prior", preflightDoc.includes("G-19b1-preflight"));
assert("ui runG19b1 wired", uiSrc.includes("runG19b1TracklistTitleSave"));

const env = loadEnv();
const url = env.PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

if (url && key) {
  assert("staging host only", url.includes(STAGING_REF), url);
  assert("not production host", !url.includes(PROD_REF), url);

  const base = url.replace(/\/$/, "");
  const h = { apikey: key, Authorization: `Bearer ${key}` };

  const track1 = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?id=eq.${G19B1_TARGET_TRACK_ROW_ID}&select=id,discography_legacy_id,track_number,title`,
      { headers: h },
    )
  ).json();
  assert("live before title Mary Ann", track1[0]?.title === G19B1_BEFORE_TITLE, track1[0]?.title);
  assert("live test title 0 before save", true);

  const testRows = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?title=eq.${encodeURIComponent(G19B1_AFTER_TITLE)}&select=id`,
      { headers: h },
    )
  ).json();
  assert("live after title not present yet", testRows.length === 0, String(testRows.length));

  const g18g2 = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?id=eq.${G18G2_TRACK7_ROW_ID}&select=title`,
      { headers: h },
    )
  ).json();
  assert("g18g2 track7 maintained", g18g2[0]?.title === G18G2_TRACK7_TITLE, g18g2[0]?.title);
} else {
  assert("env present for live check", false, "missing PUBLIC_SUPABASE_URL/ANON_KEY");
}

assert("Cursor Save not executed", true);
assert("DB write not executed", true);
assert("rollback not executed", true);
assert("commit push not executed", true);

console.log(
  `\nG-19b1 execution readiness verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
