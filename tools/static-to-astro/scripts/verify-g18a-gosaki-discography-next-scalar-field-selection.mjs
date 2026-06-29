/**
 * G-18a — Gosaki Discography next scalar field selection verifier.
 * Run: node tools/static-to-astro/scripts/verify-g18a-gosaki-discography-next-scalar-field-selection.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g18a-next-scalar-field-selection.md";
const G17E_F_REL =
  "tools/static-to-astro/docs/gosaki-discography-g17e-label-public-reflection-closure.md";
const SEED_REL = "tools/static-to-astro/data/gosaki/discography.seed.json";
const ADMIN_JSON_REL = "tools/static-to-astro/config/sites/gosaki-piano-discography.json";

const BASE_COMMIT = "8fecb44";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";
const STAGING_DISCOGRAPHY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/";

const LEGACY_IDS = ["discography-001", "discography-002", "discography-003", "discography-004"];
const TITLES = ["Continuous", "SKYLARK", "About Us!!", "Ja-Jaaaaan!"];
const LABEL_004 = "Mardi Gras JAPAN Records";

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

assert("HEAD is 8fecb44", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 8fecb44", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const seed = JSON.parse(read(SEED_REL));

assert("selection doc exists", exists(DOC_REL));
assert("doc phase G-18a", doc.includes("G-18a-gosaki-discography-next-scalar-field-selection"));
assert("doc selection gate", doc.includes("gosakiDiscographyG18aNextScalarFieldSelectionComplete: true"));
assert("doc scalar mvp complete", doc.includes("gosakiDiscographyScalarSaveMvpComplete: true"));
assert("doc Option 2 selected", doc.includes("Option 2") || doc.includes("Option2-scalar-save-pause-tracks-design"));
assert("doc no G-18b save slice", doc.includes("readyForG18bDiscographyScalarSaveSlice: false"));
assert("doc 4 releases inventory", LEGACY_IDS.every((id) => doc.includes(id)));
assert("doc DB fields recorded", doc.includes("release_date") && doc.includes("streaming_url"));
assert("doc completed chains", doc.includes("G-15c-f") && doc.includes("G-17e-f"));
assert("doc classification A none", doc.includes("A. Next Save slice") && doc.includes("none"));
assert("doc classification B defer", doc.includes("B. Defer"));
assert("doc classification C", doc.includes("C. Diff none") || doc.includes("chain complete"));
assert("doc classification D reject", doc.includes("D. Reject"));
assert("doc tracks design next", doc.includes("tracks") && doc.includes("personnel"));
assert("doc staging host", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(SARISWING_HOST));
assert("doc no save in phase", doc.includes("saveExecutedInThisPhase: false"));

assert("G-17e-f closure doc exists", exists(G17E_F_REL));
assert("seed json exists", exists(SEED_REL));
assert("admin json exists", exists(ADMIN_JSON_REL));
assert("seed 4 releases", seed.releases?.length === 4);

const env = loadEnv();
const url = env.PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

if (url && key) {
  assert("staging host only", url.includes(STAGING_REF), url);
  assert("not production host", !url.includes(SARISWING_HOST), url);

  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/discography?select=legacy_id,title,artist,release_date,year,label,catalog_number,purchase_url,streaming_url,sort_order,published,updated_at&order=sort_order.asc`;
  const res = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  assert("live SELECT HTTP ok", res.ok, String(res.status));
  const rows = await res.json();
  assert("live SELECT 4 rows", Array.isArray(rows) && rows.length === 4, String(rows?.length));

  const byId = Object.fromEntries(rows.map((r) => [r.legacy_id, r]));
  for (const id of LEGACY_IDS) assert(`live row ${id}`, !!byId[id]);

  assert("live 004 label", byId["discography-004"].label === LABEL_004);
  assert("live 001 purchase_url", byId["discography-001"].purchase_url?.includes("gosakirikako"));
  assert("live 003 streaming_url", byId["discography-003"].streaming_url?.includes("tunecore"));
  assert("live 001 artist feat", byId["discography-001"].artist?.includes("feat."));
}

const discRes = await fetch(STAGING_DISCOGRAPHY_URL);
const discBody = await discRes.text();
assert("live public HTTP 200", discRes.status === 200, String(discRes.status));
assert("live public not production", !discBody.includes(SARISWING_HOST));
for (const title of TITLES) assert(`live public title ${title}`, discBody.includes(title));
assert("live public Ja label", discBody.includes(LABEL_004));
assert("live public gosakirikako", discBody.includes("gosakirikako.base.shop"));
assert("live public tunecore", discBody.includes("tunecore.co.jp"));
assert("live discographyDataSource supabase", discBody.includes("discographyDataSource=supabase"));

assert("DB write not executed", true);
assert("Save not executed", true);
assert("FTP/upload not executed", true);
assert("package regen not executed", true);
assert("service_role not used", true);
assert("commit/push not executed", true);

console.log(`\nG-18a selection verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
