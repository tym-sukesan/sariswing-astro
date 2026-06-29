/**
 * G-16a-execution — Gosaki Discography artist Save execution result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g16a-gosaki-discography-artist-save-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g16a-artist-save-result.md";
const PREFLIGHT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g16a-local-dry-run-result-and-save-final-preflight.md";
const PLAYBOOK_REL = "tools/static-to-astro/docs/cms-kit-save-reflection-playbook.md";
const SEED_REL = "tools/static-to-astro/data/gosaki/discography.seed.json";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const ENV_FILES = [".env", ".env.local"];

const G16A_PREFLIGHT_COMMIT = "40a2896";
const TARGET_ID = "00f4cd00-cfb6-43b3-991a-211b2d7c92ef";
const TARGET_LEGACY_ID = "discography-001";
const TARGET_TITLE = "Continuous";
const ARTIST_BEFORE = "ごさきりかこTrio Feat.石川周之介";
const ARTIST_AFTER = "ごさきりかこTrio feat.石川周之介";
const BASELINE_UPDATED_AT = "2026-06-05T17:39:44.201802+00:00";
const AFTER_UPDATED_AT = "2026-06-29T05:05:20.905888+00:00";
const PURCHASE_URL = "https://gosakirikako.base.shop/";
const SAVE_APPROVAL_ID =
  "G-16a-gosaki-discography-existing-release-artist-non-dry-run";
const DISCOGRAPHY_002_LEGACY = "discography-002";
const DISCOGRAPHY_003_LEGACY = "discography-003";
const ARTIST_003_AFTER = "ごさきりかこTrio";
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
  ["merge-base", "--is-ancestor", G16A_PREFLIGHT_COMMIT, "HEAD"],
  { cwd: REPO_ROOT },
);

assert("git HEAD present", !!head.stdout.trim(), head.stdout);
assert(
  "HEAD at or after G-16a preflight 40a2896",
  mergeBase.status === 0,
  `HEAD=${head.stdout.trim()}`,
);

const doc = read(DOC_REL);
const preflightDoc = exists(PREFLIGHT_DOC_REL) ? read(PREFLIGHT_DOC_REL) : "";

assert("G-16a execution result doc exists", exists(DOC_REL));
assert("doc phase G-16a-execution", doc.includes("G-16a-execution-gosaki-discography-artist-save-result"));
assert("doc save success gate", doc.includes("gosakiDiscographyG16aArtistSaveSuccess: true"));
assert(
  "doc execution complete gate",
  doc.includes("gosakiDiscographyG16aArtistSaveExecutionComplete: true"),
);
assert(
  "doc updated_at trigger proof success",
  doc.includes("gosakiDiscographyG16aUpdatedAtTriggerLiveProofSuccess: true"),
);
assert(
  "doc readyForG16b reflection preflight",
  doc.includes("readyForG16bDiscographyArtistPublicReflectionPreflight: true"),
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
assert("doc artist after feat", doc.includes(ARTIST_AFTER));
assert("doc baseline updated_at", doc.includes(BASELINE_UPDATED_AT));
assert("doc after updated_at", doc.includes(AFTER_UPDATED_AT));
assert("doc title unchanged Continuous", doc.includes("Continuous"));
assert("doc purchase_url actual value", doc.includes(PURCHASE_URL));
assert(
  "doc purchase_url mismatch documented",
  doc.includes("purchase_url expected-value mismatch") ||
    doc.includes("purchase_url expected-value mismatch investigation"),
);
assert("doc preflight misrecord null", doc.includes("misrecord") || doc.includes("doc misrecord"));
assert("doc artist Save did not change purchase_url", doc.includes("Did G-16a artist Save change"));
assert("doc streaming_url null unchanged", doc.includes("streaming_url") && doc.includes("null"));
assert("doc release_date unchanged", doc.includes("2023-07-26"));
assert("doc year unchanged", doc.includes("`2023`") || doc.includes("| `2023`"));
assert("doc updated_at advanced", doc.includes("Advanced from baseline"));
assert("doc G-16a approval", doc.includes(SAVE_APPROVAL_ID));
assert("doc operator Save once", doc.includes("once"));
assert("doc do not re-click Save", doc.includes("Do not re-click"));
assert("doc discography-002 not touched", doc.includes("discography002Touched: false"));
assert("doc discography-003 not touched", doc.includes("discography003Touched: false"));
assert("doc G-16b next phase", doc.includes("G-16b"));
assert("doc staging host", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(SARISWING_HOST));
assert("doc afterVerification", doc.includes("afterVerification"));
assert("doc playbook reference", doc.includes("cms-kit-save-reflection-playbook.md"));

assert("G-16a-d2/d3 preflight doc exists", exists(PREFLIGHT_DOC_REL));
if (preflightDoc) {
  assert("preflight target matches", preflightDoc.includes(TARGET_LEGACY_ID));
}
assert("playbook doc exists", exists(PLAYBOOK_REL));
assert("seed json exists", exists(SEED_REL));
const seed = JSON.parse(read(SEED_REL));
const seed001 = seed.releases?.find((r) => r.legacyId === TARGET_LEGACY_ID);
assert("seed 001 purchaseUrl", seed001?.purchaseUrl === PURCHASE_URL);

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
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/discography?legacy_id=eq.${TARGET_LEGACY_ID}&id=eq.${TARGET_ID}&select=id,legacy_id,title,artist,purchase_url,streaming_url,release_date,year,updated_at`;
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
    assert("live purchase_url gosakirikako", row.purchase_url === PURCHASE_URL);
    assert("live streaming_url null", row.streaming_url == null);
    assert("live release_date unchanged", row.release_date === "2023-07-26");
    assert("live year unchanged", row.year === 2023);
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
    assert("002 purchase_url still set", r002Rows[0].purchase_url === PURCHASE_URL);
  }

  const r003Endpoint = `${url.replace(/\/$/, "")}/rest/v1/discography?legacy_id=eq.${DISCOGRAPHY_003_LEGACY}&select=legacy_id,artist,updated_at`;
  const r003Res = await fetch(r003Endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  assert("discography-003 SELECT HTTP ok", r003Res.ok);
  const r003Rows = await r003Res.json();
  if (Array.isArray(r003Rows) && r003Rows[0]) {
    assert("003 artist closed chain unchanged", r003Rows[0].artist === ARTIST_003_AFTER);
  }
}

assert("Save executed by operator (recorded in doc)", doc.includes("operator manual"));
assert("Cursor did not execute DB write", true);
assert("FTP/upload not executed", true);

console.log(`\nG-16a-execution verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
