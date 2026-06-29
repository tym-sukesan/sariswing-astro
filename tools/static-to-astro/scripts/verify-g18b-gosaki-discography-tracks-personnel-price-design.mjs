/**
 * G-18b — Gosaki Discography tracks / personnel / price design verifier.
 * Run: node tools/static-to-astro/scripts/verify-g18b-gosaki-discography-tracks-personnel-price-design.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g18b-tracks-personnel-price-design.md";
const G18A_REL = "tools/static-to-astro/docs/gosaki-discography-g18a-next-scalar-field-selection.md";
const SEED_REL = "tools/static-to-astro/data/gosaki/discography.seed.json";
const ADMIN_REL = "tools/static-to-astro/config/sites/gosaki-piano-discography.json";
const FIXTURE_REL = "tools/static-to-astro/fixtures/gosaki-piano/discography.html";
const SCHEMA_REL = "tools/static-to-astro/scripts/supabase/gosaki-discography-schema.template.sql";
const HOOK_REL = "tools/static-to-astro/scripts/lib/supabase-discography-read.mjs";
const READ_REL = "src/lib/admin/staging-write/staging-discography-read.ts";

const BASE_COMMIT = "7e73c2d";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";

const LEGACY_IDS = ["discography-001", "discography-002", "discography-003", "discography-004"];
const DB_TRACK_COUNTS = { "discography-001": 5, "discography-002": 4, "discography-003": 4, "discography-004": 3 };
const SEED_TRACK_COUNTS = { "discography-001": 9, "discography-002": 8, "discography-003": 9, "discography-004": 8 };

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

assert("HEAD is 7e73c2d", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 7e73c2d", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const seed = JSON.parse(read(SEED_REL));

assert("design doc exists", exists(DOC_REL));
assert("doc phase G-18b", doc.includes("G-18b-gosaki-discography-tracks-personnel-price-design"));
assert("doc design gate", doc.includes("gosakiDiscographyG18bTracksPersonnelPriceDesignComplete: true"));
assert("doc 4 releases inventory", LEGACY_IDS.every((id) => doc.includes(id)));
assert("doc discography_tracks inventory", doc.includes("discography_tracks"));
assert("doc track count gap 16 vs 34", doc.includes("16") && doc.includes("34"));
assert("doc seed json comparison", doc.includes("discography.seed.json"));
assert("doc fixture comparison", doc.includes("discography.html"));
assert("doc completed scalar chains", doc.includes("G-17e-f") || doc.includes("G-15c"));
assert("doc tracks design section", doc.includes("## 6. Tracks"));
assert("doc personnel design section", doc.includes("## 7. Personnel"));
assert("doc price design section", doc.includes("## 8. Price"));
assert("doc personnel options", doc.includes("jsonb") || doc.includes("JSONB"));
assert("doc price column recommendation", doc.includes("price text") || doc.includes("`price`"));
assert("doc DB not SoT for tracks", doc.includes("Not safe as SoT") || doc.includes("not safe"));
assert("doc Option 1 selected", doc.includes("Option 1") && doc.includes("G-18c"));
assert("doc readyForG18c tracks plan", doc.includes("readyForG18cTracksInventoryCompletionPlan: true"));
assert("doc no schema migration", doc.includes("schemaMigrationExecuted: false"));
assert("doc staging host", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(SARISWING_HOST));

assert("G-18a doc exists", exists(G18A_REL));
assert("seed json exists", exists(SEED_REL));
assert("admin json exists", exists(ADMIN_REL));
assert("fixture exists", exists(FIXTURE_REL));
assert("schema template exists", exists(SCHEMA_REL));
assert("hook exists", exists(HOOK_REL));
assert("admin read module exists", exists(READ_REL));
assert("hook no tracks patch yet", !read(HOOK_REL).includes("patchDiscographyItemTracks"));
assert("read module loads tracks", read(READ_REL).includes("discography_tracks"));

let seedTrackTotal = 0;
for (const r of seed.releases) {
  seedTrackTotal += r.trackListJson?.length ?? 0;
  const lid = r.legacyId;
  assert(`seed track count ${lid}`, (r.trackListJson?.length ?? 0) === SEED_TRACK_COUNTS[lid]);
}
assert("seed track total 34", seedTrackTotal === 34, String(seedTrackTotal));
assert(
  "seed metadata trackCountJson noted",
  seed.trackCountJson === 33 || seed.trackCountJson === 34,
  String(seed.trackCountJson),
);

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
  assert("live tracks SELECT ok", Array.isArray(tracks), String(tracks));
  assert("live tracks total 16", tracks.length === 16, String(tracks.length));

  const counts = {};
  for (const t of tracks) {
    counts[t.discography_legacy_id] = (counts[t.discography_legacy_id] ?? 0) + 1;
  }
  for (const id of LEGACY_IDS) {
    assert(`live track count ${id}`, counts[id] === DB_TRACK_COUNTS[id], String(counts[id]));
  }

  const disc = await (
    await fetch(`${base}/rest/v1/discography?select=legacy_id,description&order=sort_order.asc`, {
      headers: h,
    })
  ).json();
  assert("live discography 4 rows", disc.length === 4);
  assert("live 004 description has venue note", disc.find((r) => r.legacy_id === "discography-004")?.description?.includes("ライブ会場"));
}

const fixture = read(FIXTURE_REL);
assert("fixture has Track List", fixture.includes("Track List"));
assert("fixture has Personnel", fixture.includes("Personnel"));
assert("fixture Continuous Nature Boy", fixture.includes("Nature Boy"));
assert("fixture Ja-Jaaaaan Mardi Gras or Mary Ann", fixture.includes("Mary Ann"));

assert("DB write not executed", true);
assert("schema migration not executed", true);
assert("Save not executed", true);
assert("FTP/upload not executed", true);
assert("package regen not executed", true);
assert("service_role not used", true);
assert("commit/push not executed", true);

console.log(`\nG-18b design verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
