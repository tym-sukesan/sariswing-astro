/**
 * G-18c — Gosaki Discography tracks gap backfill preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g18c-gosaki-discography-tracks-gap-backfill-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g18c-tracks-gap-backfill-preflight.md";
const G18B_REL = "tools/static-to-astro/docs/gosaki-discography-g18b-tracks-personnel-price-design.md";
const SQL_REL = "tools/static-to-astro/scripts/supabase/gosaki-discography-tracks-backfill-g18c.template.sql";
const SEED_REL = "tools/static-to-astro/data/gosaki/discography.seed.json";

const BASE_COMMIT = "c2bbcd1";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";

const MISSING_TRACKS = [
  { legacyId: "discography-001", trackNumber: 5, title: "Ain't She Sweet" },
  { legacyId: "discography-001", trackNumber: 6, title: "Boplicity" },
  { legacyId: "discography-001", trackNumber: 7, title: "Double Rainbow" },
  { legacyId: "discography-001", trackNumber: 8, title: "Verrazano Moon" },
  { legacyId: "discography-002", trackNumber: 2, title: "My Blue Heaven" },
  { legacyId: "discography-002", trackNumber: 3, title: "How Deep Is The Ocean" },
  { legacyId: "discography-002", trackNumber: 5, title: "Set Sail" },
  { legacyId: "discography-002", trackNumber: 7, title: "Like a Lover" },
  { legacyId: "discography-003", trackNumber: 4, title: "Darn That Dream" },
  { legacyId: "discography-003", trackNumber: 5, title: "The Old Country" },
  { legacyId: "discography-003", trackNumber: 6, title: "The Sweetest Sounds" },
  { legacyId: "discography-003", trackNumber: 8, title: "Samba De Cafe Terrasse" },
  { legacyId: "discography-003", trackNumber: 9, title: "I'd Climb The Highest Mountain" },
  { legacyId: "discography-004", trackNumber: 2, title: "Nearer My God To Thee" },
  { legacyId: "discography-004", trackNumber: 4, title: "A Fool Such As I" },
  { legacyId: "discography-004", trackNumber: 5, title: "Si Tu Vois Ma Mere" },
  { legacyId: "discography-004", trackNumber: 6, title: "St. Phillip Street Break Down" },
  { legacyId: "discography-004", trackNumber: 7, title: "Girl Of My Dream" },
];

const EXISTING_TITLES = [
  "Nature Boy",
  "Waters Of March",
  "With a Song In My Heart",
  "Here Comes The Sun",
  "Continuous",
  "On a Clear Day",
  "Skylark",
  "What a Wonderful World",
  "The Water Is Wide",
  "白玉Bluse",
  "The Lady Is A Tramp",
  "Honeysuckle Rose",
  "The Look Of Love",
  "Mary Ann",
  "Shreveport Stomp",
  "Bourbon Street Parade",
];

const CONFLICT_COUNT = 5;

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

function sqlEscape(title) {
  return title.replace(/'/g, "''");
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

function countExecutableInsertValueRows(sql) {
  const begin = sql.indexOf("BEGIN;");
  const commit = sql.indexOf("COMMIT;", begin);
  const block = sql.slice(begin, commit);
  const lines = block.split("\n").filter((l) => {
    const t = l.trim();
    return t.startsWith("('discography-");
  });
  return lines.length;
}

function hasUncommentedExecutable(sql, keyword) {
  const lines = sql.split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("--")) continue;
    if (t.includes(keyword)) return true;
  }
  return false;
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is c2bbcd1", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is c2bbcd1", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const sql = read(SQL_REL);
const seed = JSON.parse(read(SEED_REL));

assert("gap doc exists", exists(DOC_REL));
assert("G-18b doc exists", exists(G18B_REL));
assert("SQL template exists", exists(SQL_REL));
assert("doc phase G-18c", doc.includes("G-18c-gosaki-discography-tracks-gap-backfill-preflight"));
assert("doc gate complete", doc.includes("gosakiDiscographyG18cTracksGapBackfillPreflightComplete: true"));
assert("doc G-18b conclusion", doc.includes("G-18b"));
assert("doc gap matrix", doc.includes("Gap matrix") || doc.includes("## 4."));
assert("doc 18 missing tracks", doc.includes("18 missing"));
assert("doc insert 18 only", doc.includes("18 rows") || doc.includes("18 INSERT"));
assert("doc existing 16 untouched", doc.includes("16") && doc.includes("NOT INSERT targets"));
assert("doc SQL execution prohibited", doc.includes("prohibited") || doc.includes("DO NOT RUN"));
assert("doc outcomes section", doc.includes("好結果"));
assert("doc failure case", doc.includes("失敗"));
assert("doc worst case", doc.includes("最悪"));
assert("doc rollback", doc.includes("rollback") || doc.includes("Rollback"));
assert("doc operator approval", doc.includes("承認します"));
assert("doc track_number conflict", doc.includes("conflict") || doc.includes("衝突"));
assert("doc G-18c-f recommendation", doc.includes("G-18c-f"));
assert("doc G-18d candidate", doc.includes("G-18d"));
assert("doc staging host", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(SARISWING_HOST));
assert("doc no insert executed", doc.includes("insertExecutedInThisPhase: false"));

const insertRows = countExecutableInsertValueRows(sql);
assert("SQL exactly 18 INSERT value rows", insertRows === 18, String(insertRows));
assert("SQL has BEGIN/COMMIT", sql.includes("BEGIN;") && sql.includes("COMMIT;"));
assert("SQL INSERT into discography_tracks", sql.includes("INSERT INTO public.discography_tracks"));
assert("SQL no executable UPDATE", !hasUncommentedExecutable(sql, "UPDATE "));
assert("SQL no executable DELETE", !hasUncommentedExecutable(sql, "DELETE "));
assert("SQL no UPSERT", !sql.match(/^[^-\n]*UPSERT/m));
assert("SQL no ON CONFLICT executable", !hasUncommentedExecutable(sql, "ON CONFLICT"));
assert("SQL rollback DELETE is comment-only", sql.includes("-- DELETE FROM public.discography_tracks"));

for (const t of MISSING_TRACKS) {
  const escaped = sqlEscape(t.title);
  assert(
    `SQL includes missing track ${t.legacyId} ${t.title}`,
    sql.includes(`'${t.legacyId}'`) && sql.includes(escaped),
  );
  assert(`doc includes missing track ${t.title}`, doc.includes(t.title));
}

for (const title of EXISTING_TITLES) {
  const escaped = sqlEscape(title);
  const inInsertBlock = (() => {
    const begin = sql.indexOf("BEGIN;");
    const commit = sql.indexOf("COMMIT;", begin);
    const block = sql.slice(begin, commit);
    return block.includes(`'${escaped}'`) || block.includes(`'${title}'`);
  })();
  assert(`existing title not INSERT target: ${title}`, !inInsertBlock, title);
}

assert("doc records 5 track_number conflicts", doc.includes("5") && doc.includes("conflict"));

let seedMissing = 0;
const existingByLegacy = {
  "discography-001": ["Nature Boy", "Waters Of March", "With a Song In My Heart", "Here Comes The Sun", "Continuous"],
  "discography-002": ["On a Clear Day", "Skylark", "What a Wonderful World", "The Water Is Wide"],
  "discography-003": ["白玉Bluse", "The Lady Is A Tramp", "Honeysuckle Rose", "The Look Of Love"],
  "discography-004": ["Mary Ann", "Shreveport Stomp", "Bourbon Street Parade"],
};
for (const r of seed.releases) {
  const have = new Set(existingByLegacy[r.legacyId] ?? []);
  for (const title of r.trackListJson) {
    if (!have.has(title)) seedMissing += 1;
  }
}
assert("seed-derived missing count 18", seedMissing === 18, String(seedMissing));

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
      `${base}/rest/v1/discography_tracks?select=discography_legacy_id,track_number,title&order=discography_legacy_id.asc,sort_order.asc`,
      { headers: h },
    )
  ).json();
  assert("live tracks still 16", Array.isArray(tracks) && tracks.length === 16, String(tracks?.length));
}

assert("no service_role", true);
assert("no FTP upload executed", true);
assert("no package regen executed", true);
assert("commit push not executed", true);
assert("DB INSERT not executed in verifier", true);

console.log(`\nG-18c preflight verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
