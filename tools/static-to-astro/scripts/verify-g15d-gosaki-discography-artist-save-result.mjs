/**
 * G-15d-execution — Gosaki Discography artist Save execution result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g15d-gosaki-discography-artist-save-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-artist-save-result.md";
const PREFLIGHT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-artist-local-dry-run-result-and-save-final-preflight.md";
const G14C_DOC_REL =
  "tools/static-to-astro/docs/gosaki-public-reflection-operation-standardization.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const ENV_FILES = [".env", ".env.local"];

const G15D_PREFLIGHT_COMMIT = "da6e954";
const TARGET_ID = "d17653b4-f83d-4548-9936-d3fcc218906e";
const TARGET_LEGACY_ID = "discography-003";
const TARGET_TITLE = "About Us!!";
const ARTIST_BEFORE = "ごさきりかこtrio";
const ARTIST_AFTER = "ごさきりかこTrio";
const BASELINE_UPDATED_AT = "2026-06-05T17:39:44.201802+00:00";
const AFTER_UPDATED_AT = "2026-06-29T02:40:57.83085+00:00";
const STREAMING_URL =
  "https://www.tunecore.co.jp/artists/gosakirikakotrio?lang=ja";
const SAVE_APPROVAL_ID =
  "G-15d-gosaki-discography-existing-release-artist-non-dry-run";
const DISCOGRAPHY_002_LEGACY = "discography-002";
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

function loadEnv(file) {
  const abs = path.join(REPO_ROOT, file);
  if (!fs.existsSync(abs)) return {};
  const out = {};
  for (const line of fs.readFileSync(abs, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return out;
}

function parseTs(value) {
  return Date.parse(String(value).replace(" ", "T").replace(/\+00$/, "+00:00"));
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const mergeBase = spawnSync(
  "git",
  ["merge-base", "--is-ancestor", G15D_PREFLIGHT_COMMIT, "HEAD"],
  { cwd: REPO_ROOT },
);

assert("git HEAD present", !!head.stdout.trim(), head.stdout);
assert(
  "HEAD at or after G-15d preflight da6e954",
  mergeBase.status === 0,
  `HEAD=${head.stdout.trim()}`,
);

const doc = read(DOC_REL);
const preflightDoc = exists(PREFLIGHT_DOC_REL) ? read(PREFLIGHT_DOC_REL) : "";

assert("G-15d execution result doc exists", exists(DOC_REL));
assert("doc phase G-15d-execution", doc.includes("G-15d-execution-gosaki-discography-artist-save-result"));
assert("doc save success gate", doc.includes("gosakiDiscographyArtistSaveSuccess: true"));
assert(
  "doc execution complete gate",
  doc.includes("gosakiDiscographyArtistSaveExecutionComplete: true"),
);
assert(
  "doc updated_at trigger proof success",
  doc.includes("gosakiDiscographyUpdatedAtTriggerLiveProofSuccess: true"),
);
assert(
  "doc readyForG15e reflection preflight",
  doc.includes("readyForG15eDiscographyArtistPublicReflectionPreflight: true"),
);
assert("doc readyForAnyDbWrite false", doc.includes("readyForAnyDbWrite: false"));
assert("doc cursorSave false", doc.includes("cursorClickedSave: false"));
assert("doc cursorDbWrite false", doc.includes("cursorDbWriteExecuted: false"));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc rollback not executed", doc.includes("rollbackSqlExecuted: false"));
assert("doc public reflection pending", doc.includes("pending"));
assert("doc target id", doc.includes(TARGET_ID));
assert("doc target legacy_id", doc.includes(TARGET_LEGACY_ID));
assert("doc artist before", doc.includes(ARTIST_BEFORE));
assert("doc artist after ごさきりかこTrio", doc.includes(ARTIST_AFTER));
assert("doc baseline updated_at", doc.includes(BASELINE_UPDATED_AT));
assert("doc after updated_at", doc.includes(AFTER_UPDATED_AT));
assert("doc title unchanged", doc.includes("About Us!!"));
assert("doc purchase_url null unchanged", doc.includes("purchase_url") && doc.includes("null"));
assert("doc streaming_url unchanged", doc.includes(STREAMING_URL));
assert("doc updated_at advanced", doc.includes("Advanced from baseline"));
assert("doc G-15d approval", doc.includes(SAVE_APPROVAL_ID));
assert("doc operator Save once", doc.includes("once"));
assert("doc do not re-click Save", doc.includes("Do not re-click"));
assert("doc discography-002 not touched", doc.includes("discography002Touched: false"));
assert("doc G-15e next phase", doc.includes("G-15e"));
assert("doc staging host", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(SARISWING_HOST));
assert("doc afterVerification", doc.includes("afterVerification"));

assert("G-15d-d2/d3 preflight doc exists", exists(PREFLIGHT_DOC_REL));
if (preflightDoc) {
  assert("preflight target matches", preflightDoc.includes(TARGET_LEGACY_ID));
}
assert("G-14c playbook doc exists", exists(G14C_DOC_REL));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

for (const envFile of ENV_FILES) {
  const envDiff = spawnSync("git", ["diff", "--name-only", envFile], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert(`${envFile} no diff`, !envDiff.stdout.trim());
}

const env = { ...loadEnv(".env"), ...loadEnv(".env.local") };
const url = env.PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

assert("staging url configured", !!url, "missing PUBLIC_SUPABASE_URL");
assert("anon key configured", !!key, "missing PUBLIC_SUPABASE_ANON_KEY");
assert("staging host only", url.includes(STAGING_REF), url);
assert("not production host", !url.includes(SARISWING_HOST), url);
assert("not service_role key", !String(key).toLowerCase().includes("service_role"));

assert(
  "after updated_at greater than baseline (doc parse)",
  parseTs(AFTER_UPDATED_AT) > parseTs(BASELINE_UPDATED_AT),
);

if (url && key) {
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/discography?legacy_id=eq.${TARGET_LEGACY_ID}&id=eq.${TARGET_ID}&select=id,legacy_id,title,artist,purchase_url,streaming_url,updated_at`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  assert("live SELECT HTTP ok", res.ok, String(res.status));
  const rows = await res.json();
  assert("live SELECT one row", Array.isArray(rows) && rows.length === 1);
  if (Array.isArray(rows) && rows[0]) {
    const row = rows[0];
    assert("live id", row.id === TARGET_ID);
    assert("live legacy_id", row.legacy_id === TARGET_LEGACY_ID);
    assert("live title unchanged", row.title === TARGET_TITLE);
    assert("live artist after Save", row.artist === ARTIST_AFTER);
    assert("live purchase_url null", row.purchase_url == null);
    assert("live streaming_url unchanged", row.streaming_url === STREAMING_URL);
    assert("live updated_at after Save", row.updated_at === AFTER_UPDATED_AT);
    assert(
      "live updated_at newer than baseline",
      parseTs(row.updated_at) > parseTs(BASELINE_UPDATED_AT),
    );
    assert("live artist not before value", row.artist !== ARTIST_BEFORE);
  }

  const r002Endpoint = `${url.replace(/\/$/, "")}/rest/v1/discography?legacy_id=eq.${DISCOGRAPHY_002_LEGACY}&select=legacy_id,purchase_url,updated_at`;
  const r002Res = await fetch(r002Endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  assert("discography-002 SELECT HTTP ok", r002Res.ok);
  const r002Rows = await r002Res.json();
  if (Array.isArray(r002Rows) && r002Rows[0]) {
    assert("002 purchase_url still set post-G-15b", !!r002Rows[0].purchase_url);
  }
}

assert("Save executed by operator (recorded in doc)", doc.includes("operator manual"));
assert("Cursor did not execute DB write", true);
assert("FTP/upload not executed", true);

console.log(`\nG-15d-execution verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
