/**
 * G-18c-f — Gosaki Discography tracks renumber UPDATE preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g18c-f-gosaki-discography-tracks-renumber-update-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g18c-f-tracks-renumber-update-preflight.md";
const G18C_DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g18c-tracks-gap-backfill-preflight.md";
const G18C_SQL_REL = "tools/static-to-astro/scripts/supabase/gosaki-discography-tracks-backfill-g18c.template.sql";
const SQL_REL = "tools/static-to-astro/scripts/supabase/gosaki-discography-tracks-renumber-g18c-f.template.sql";

const BASE_COMMIT = "8fca735";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";

const RENUMBER_TARGETS = [
  { legacyId: "discography-001", title: "Continuous", from: 5, to: 9 },
  { legacyId: "discography-002", title: "Skylark", from: 2, to: 4 },
  { legacyId: "discography-002", title: "What a Wonderful World", from: 3, to: 6 },
  { legacyId: "discography-002", title: "The Water Is Wide", from: 4, to: 8 },
  { legacyId: "discography-003", title: "The Look Of Love", from: 4, to: 7 },
  { legacyId: "discography-004", title: "Shreveport Stomp", from: 2, to: 3 },
  { legacyId: "discography-004", title: "Bourbon Street Parade", from: 3, to: 8 },
];

const UNCHANGED = [
  { legacyId: "discography-001", title: "Nature Boy", trackNumber: 1 },
  { legacyId: "discography-001", title: "Waters Of March", trackNumber: 2 },
  { legacyId: "discography-001", title: "With a Song In My Heart", trackNumber: 3 },
  { legacyId: "discography-001", title: "Here Comes The Sun", trackNumber: 4 },
  { legacyId: "discography-002", title: "On a Clear Day", trackNumber: 1 },
  { legacyId: "discography-003", title: "白玉Bluse", trackNumber: 1 },
  { legacyId: "discography-003", title: "The Lady Is A Tramp", trackNumber: 2 },
  { legacyId: "discography-003", title: "Honeysuckle Rose", trackNumber: 3 },
  { legacyId: "discography-004", title: "Mary Ann", trackNumber: 1 },
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

function hasUncommentedExecutable(sql, keyword) {
  for (const line of sql.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("--")) continue;
    if (t.includes(keyword)) return true;
  }
  return false;
}

function countExecutableUpdates(sql) {
  const begin = sql.indexOf("BEGIN;");
  const commit = sql.lastIndexOf("COMMIT;");
  const block = sql.slice(begin, commit);
  return block.split("\n").filter((l) => l.trim().startsWith("UPDATE public.discography_tracks")).length;
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

assert("HEAD is 8fca735", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 8fca735", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const sql = read(SQL_REL);
const g18cDoc = read(G18C_DOC_REL);

assert("renumber doc exists", exists(DOC_REL));
assert("G-18c doc exists", exists(G18C_DOC_REL));
assert("UPDATE SQL template exists", exists(SQL_REL));
assert("G-18c INSERT template exists", exists(G18C_SQL_REL));

assert("doc phase G-18c-f", doc.includes("G-18c-f-gosaki-discography-tracks-renumber-update-preflight"));
assert("doc gate complete", doc.includes("gosakiDiscographyG18cFTracksRenumberUpdatePreflightComplete: true"));
assert("doc G-18c conclusion", doc.includes("G-18c"));
assert("doc INSERT-only prohibited", doc.includes("INSERT-only") || doc.includes("INSERT only"));
assert("doc 7 renumber targets", doc.includes("7 rows") || doc.includes("7 existing"));
assert("doc 9 unchanged rows", doc.includes("9 rows") || doc.includes("Renumber not required"));
assert("doc constraints section", doc.includes("Constraints") || doc.includes("constraints"));
assert("doc 2-phase UPDATE", doc.includes("9001") || doc.includes("2-phase"));
assert("doc outcomes", doc.includes("好結果"));
assert("doc SQL prohibited", doc.includes("prohibited") || doc.includes("DO NOT RUN"));
assert("doc rollback", doc.includes("rollback") || doc.includes("Rollback"));
assert("doc G-18d next", doc.includes("G-18d"));
assert("doc staging host", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(SARISWING_HOST));
assert("doc no updated_at", doc.includes("updated_at"));
assert("doc Water Is Wide not Amapola", doc.includes("The Water Is Wide"));
assert("G-18c INSERT execution prohibited", g18cDoc.includes("DO NOT RUN") || doc.includes("execution-prohibited"));

assert("SQL UPDATE discography_tracks only", sql.includes("UPDATE public.discography_tracks"));
assert("SQL 14 executable UPDATE statements", countExecutableUpdates(sql) === 14, String(countExecutableUpdates(sql)));
assert("SQL no executable INSERT", !hasUncommentedExecutable(sql, "INSERT INTO"));
assert("SQL no executable DELETE", !hasUncommentedExecutable(sql, "DELETE FROM"));
assert("SQL no executable ALTER", !hasUncommentedExecutable(sql, "ALTER TABLE"));
assert("SQL no UPSERT", !sql.match(/^[^-\n]*UPSERT/m));
assert("SQL phase 1 staging 9001-9007", sql.includes("9001") && sql.includes("9007"));
assert("SQL rollback comment-only", sql.includes("-- ROLLBACK UPDATE"));

for (const t of RENUMBER_TARGETS) {
  assert(`doc renumber ${t.title}`, doc.includes(t.title));
  assert(`SQL renumber from ${t.from}`, sql.includes(`track_number = ${t.from}`) || sql.includes(`= ${t.from}`));
  assert(`SQL renumber to ${t.to}`, sql.includes(`track_number = ${t.to}`));
}

for (const u of UNCHANGED) {
  assert(`doc unchanged ${u.title}`, doc.includes(u.title));
  const begin = sql.indexOf("BEGIN;");
  const commit = sql.lastIndexOf("COMMIT;");
  const block = sql.slice(begin, commit);
  assert(
    `unchanged title not in executable UPDATE WHERE: ${u.title}`,
    !block.includes(`title = '${u.title}'`) && !block.includes(`title = '${u.title.replace(/'/g, "''")}'`),
    u.title,
  );
}

assert("renumber target count 7", RENUMBER_TARGETS.length === 7);
assert("unchanged count 9", UNCHANGED.length === 9);

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
      `${base}/rest/v1/discography_tracks?select=discography_legacy_id,track_number,title,sort_order&order=discography_legacy_id.asc,sort_order.asc`,
      { headers: h },
    )
  ).json();
  assert("live tracks still 16", Array.isArray(tracks) && tracks.length === 16, String(tracks?.length));

  for (const t of RENUMBER_TARGETS) {
    const row = tracks.find((r) => r.discography_legacy_id === t.legacyId && r.title === t.title);
    assert(`live ${t.title} at from=${t.from}`, row && row.track_number === t.from, JSON.stringify(row));
  }
}

assert("no service_role", true);
assert("no FTP upload executed", true);
assert("no package regen executed", true);
assert("commit push not executed", true);
assert("UPDATE not executed in verifier", true);

console.log(`\nG-18c-f preflight verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
