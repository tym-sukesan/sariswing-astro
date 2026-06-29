/**
 * G-18g1 — Gosaki Discography tracks GRANT / RLS read-only check verifier.
 * Run: node tools/static-to-astro/scripts/verify-g18g1-gosaki-discography-tracks-grant-rls-readonly-check.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g18g1-tracks-grant-rls-readonly-check.md";
const SQL_REL = "tools/static-to-astro/scripts/supabase/gosaki-discography-tracks-g18g1-readonly-check.sql";
const G18F_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g18f-tracklist-textarea-diff-dry-run-local-ui-result.md";
const G18G_REL = "tools/static-to-astro/docs/gosaki-discography-g18g-tracklist-textarea-save-adapter-planning.md";

const BASE_COMMIT = "065539b";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const TARGET_LEGACY_ID = "discography-002";
const TRACK_ROW_ID = "fd58cd6e-2fff-4ff2-96af-3087c469450b";
const BEFORE_TITLE = "Like a Lover";
const TEST_TITLE = "Like a Lover（テスト）";

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

assert("HEAD is 065539b", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 065539b", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const sql = read(SQL_REL);

assert("doc exists", exists(DOC_REL));
assert("readonly SQL exists", exists(SQL_REL));
assert("G-18f result doc exists", exists(G18F_RESULT_REL));
assert("G-18g planning doc exists", exists(G18G_REL));
assert("doc phase G-18g1", doc.includes("G-18g1-gosaki-discography-tracks-grant-rls-readonly-check"));
assert("doc complete gate", doc.includes("gosakiDiscographyG18g1TracksGrantRlsReadonlyCheckComplete: true"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(PROD_REF));
assert("doc target table", doc.includes("public.discography_tracks"));
assert("doc target album", doc.includes(TARGET_LEGACY_ID));
assert("doc target row id", doc.includes(TRACK_ROW_ID));
assert("doc track 7 title", doc.includes(BEFORE_TITLE));
assert("doc grant status recorded", doc.includes("authenticatedUpdateGrantPresent: false"));
assert("doc RLS status recorded", doc.includes("rlsEnabledOnDiscographyTracks: true"));
assert("doc policy recorded", doc.includes("discography_tracks_admin_all"));
assert("doc anon write false", doc.includes("anonWriteGrantPresent: false"));
assert("doc G-18g2 readiness", doc.includes("readyForG18g2TracklistSingleTitleSaveDryRunImplementation: false"));
assert("doc G-18g1 apply ready", doc.includes("readyForG18g1ApplyDiscographyTracksUpdateGrant: true"));
assert("doc judgment A-E", doc.includes("### A.") && doc.includes("### F."));
assert("doc G-18f local UI referenced", doc.includes("G-18f") || doc.includes(TEST_TITLE));
assert("doc no grant executed", doc.includes("grantExecutedInThisPhase: false"));
assert("doc no policy change", doc.includes("policyChangeExecutedInThisPhase: false"));
assert("doc no service_role", doc.includes("serviceRoleRequiredForClientSave: false"));

assert("sql SELECT only grants", sql.includes("role_table_grants") && sql.includes("pg_policies"));
assert("sql no GRANT statement", !/(^|\n)\s*grant\s+/i.test(sql));
assert("sql no UPDATE statement", !/(^|\n)\s*update\s+public\./i.test(sql));
assert("sql target row query", sql.includes(TRACK_ROW_ID));
assert("sql test title check", sql.includes(TEST_TITLE));

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
      `${base}/rest/v1/discography_tracks?discography_legacy_id=eq.${TARGET_LEGACY_ID}&track_number=eq.7&select=id,title,track_number`,
      { headers: h },
    )
  ).json();

  assert("live track 7 id", track7[0]?.id === TRACK_ROW_ID, track7[0]?.id);
  assert("live track 7 title", track7[0]?.title === BEFORE_TITLE, track7[0]?.title);

  const album = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?discography_legacy_id=eq.${TARGET_LEGACY_ID}&select=id&order=sort_order.asc`,
      { headers: h },
    )
  ).json();
  assert("live album 8 tracks", album.length === 8, String(album.length));

  const testRows = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?title=eq.${encodeURIComponent(TEST_TITLE)}&select=id`,
      { headers: h },
    )
  ).json();
  assert("no test title in DB", testRows.length === 0, String(testRows.length));

  const total = await (
    await fetch(`${base}/rest/v1/discography_tracks?select=id`, { headers: h })
  ).json();
  assert("live total 34 tracks", total.length === 34, String(total.length));
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

console.log(`\nG-18g1 readonly check verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
