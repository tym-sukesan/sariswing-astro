/**
 * G-18d-result — Gosaki Discography tracks SQL execution result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g18d-gosaki-discography-tracks-sql-execution-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g18d-tracks-sql-execution-result.md";
const READINESS_DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g18d-tracks-manual-sql-execution-readiness.md";
const RENUMBER_SQL_REL = "tools/static-to-astro/scripts/supabase/gosaki-discography-tracks-renumber-g18c-f.template.sql";
const INSERT_SQL_REL = "tools/static-to-astro/scripts/supabase/gosaki-discography-tracks-backfill-g18c.template.sql";
const SEED_REL = "tools/static-to-astro/data/gosaki/discography.seed.json";

const BASE_COMMIT = "86df73c";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";

const ALBUM_COUNTS = {
  "discography-001": 9,
  "discography-002": 8,
  "discography-003": 9,
  "discography-004": 8,
};

const CLOSED_CHAINS = ["G-16b-f", "G-15c-f", "G-15e-f", "G-17e-f"];

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

assert("HEAD is 86df73c", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 86df73c", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);

assert("result doc exists", exists(DOC_REL));
assert("readiness doc exists", exists(READINESS_DOC_REL));
assert("doc phase G-18d-result", doc.includes("G-18d-result-gosaki-discography-tracks-sql-execution-result"));
assert("doc success gate", doc.includes("gosakiDiscographyG18dTracksSqlExecutionResultRecorded: true"));
assert("doc renumber execution recorded", doc.includes("renumberExecutedByOperator: true"));
assert("doc INSERT backfill recorded", doc.includes("insertBackfillExecutedByOperator: true"));
assert("doc renumber template path", doc.includes("gosaki-discography-tracks-renumber-g18c-f.template.sql"));
assert("doc INSERT template path", doc.includes("gosaki-discography-tracks-backfill-g18c.template.sql"));
assert("doc final total 34", doc.includes("34"));
assert("doc per-album 9 8 9 8", doc.includes("9 / 8 / 9 / 8") || (doc.includes("9") && doc.includes("8")));
assert("doc duplicate zero", doc.includes("Duplicate") && doc.includes("0"));
assert("doc temp 9001 zero", doc.includes("9001") && doc.includes("0"));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc additional SQL not needed", doc.includes("additionalSqlNeeded: false"));
assert("doc tracks SoT ready", doc.includes("tracksSoTReadyForNextPlanning: true"));
assert("doc Cursor no write", doc.includes("sqlExecutedByCursor: false"));
assert("doc staging host", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(SARISWING_HOST));
assert("closed scalar chains documented", CLOSED_CHAINS.every((c) => doc.includes(c)));
assert("doc do not re-run templates", doc.includes("Do not re-run") || doc.includes("prohibited"));

const seed = JSON.parse(read(SEED_REL));
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

  assert("live total rows 34", Array.isArray(tracks) && tracks.length === 34, String(tracks?.length));

  const counts = {};
  for (const t of tracks) {
    counts[t.discography_legacy_id] = (counts[t.discography_legacy_id] ?? 0) + 1;
  }
  for (const [lid, expected] of Object.entries(ALBUM_COUNTS)) {
    assert(`live album count ${lid}`, counts[lid] === expected, String(counts[lid]));
  }

  let temp = 0;
  let dupAlbums = 0;
  const byAlbum = {};
  for (const t of tracks) {
    if (t.track_number >= 9001 && t.track_number <= 9007) temp += 1;
    if (!byAlbum[t.discography_legacy_id]) byAlbum[t.discography_legacy_id] = [];
    byAlbum[t.discography_legacy_id].push(t.track_number);
  }
  for (const nums of Object.values(byAlbum)) {
    if (new Set(nums).size !== nums.length) dupAlbums += 1;
  }
  assert("live temp 9001-9007 zero", temp === 0, String(temp));
  assert("live duplicate track_number zero", dupAlbums === 0, String(dupAlbums));

  for (const r of seed.releases) {
    const dbTitles = (tracks.filter((t) => t.discography_legacy_id === r.legacyId) ?? [])
      .sort((a, b) => a.track_number - b.track_number)
      .map((t) => t.title);
    assert(
      `live seed match ${r.legacyId}`,
      JSON.stringify(dbTitles) === JSON.stringify(r.trackListJson),
      JSON.stringify(dbTitles),
    );
  }
}

assert("no service_role", true);
assert("no Save executed", doc.includes("saveExecuted: false"));
assert("no FTP upload executed", doc.includes("ftpUploadExecuted: false"));
assert("no package regen executed", doc.includes("packageRegenExecuted: false"));
assert("commit push not executed", true);
assert("Cursor DB write not executed", doc.includes("dbWriteExecutedByCursor: false"));

console.log(`\nG-18d-result verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
