/**
 * G-20u25 — Discography filtered read enablement verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u25-discography-filtered-read-enablement.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  GOSAKI_SITE_KEY,
  PILOT_SAMPLE_STATIC_SITE_KEY,
  TOOL_ROOT,
} from "./lib/site-registry.mjs";
import {
  DISCOGRAPHY_SITE_SLUG_COLUMN_READY,
  loadDiscographyDataForBuild,
  loadGosakiDiscographyDataForBuild,
  loadDiscographyRowsFromSupabase,
} from "./lib/supabase-discography-read.mjs";
import {
  loadSiteDiscographyBundleForBuild,
  resolveDiscographyLoaderCapability,
} from "./lib/site-discography-loader.mjs";
import { loadSiteDiscographyDataForBuild } from "./lib/site-aware-supabase-loaders.mjs";
import { resolveSupabaseAnonReadEnv } from "./lib/supabase-schedule-read.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";
const DOC_REL = "tools/static-to-astro/docs/discography-filtered-read-enablement.md";
const BASE_COMMIT = "4363e3d";

const WRITE_PATTERNS = [
  /\.insert\s*\(/,
  /\.update\s*\(/,
  /\.upsert\s*\(/,
  /\.delete\s*\(/,
  /service_role/i,
  /CREATE TABLE/i,
  /ALTER TABLE/i,
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

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (head.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${head.stdout.trim()} (G-20u25 base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
assert("doc phase G-20u25", doc.includes("G-20u25-discography-filtered-read-enablement"));
assert("doc G-20u24 migration complete", doc.includes("G-20u24"));
assert("doc filtered read enabled", doc.includes("DISCOGRAPHY_SITE_SLUG_COLUMN_READY = true"));
assert("doc rebuild preflight", doc.includes("preflight") || doc.includes("rebuild"));
assert("doc no DB write", doc.includes("No DB write") || doc.includes("no DB write"));

const discographyLib = read("tools/static-to-astro/scripts/lib/supabase-discography-read.mjs");
const loaderMod = read("tools/static-to-astro/scripts/lib/site-discography-loader.mjs");

assert("DISCOGRAPHY_SITE_SLUG_COLUMN_READY true", DISCOGRAPHY_SITE_SLUG_COLUMN_READY === true);
assert("code flag true", discographyLib.includes("DISCOGRAPHY_SITE_SLUG_COLUMN_READY = true"));
assert("gosaki wrapper requireSiteSlugFilter", discographyLib.includes("requireSiteSlugFilter: true"));
assert("gosaki wrapper no legacy unfiltered", !/loadGosakiDiscographyDataForBuild[\s\S]{0,200}legacyUnfilteredRead: true/.test(discographyLib));
assert("site_slug eq in read", discographyLib.includes('query.eq("site_slug", siteSlug)'));

for (const pattern of WRITE_PATTERNS) {
  assert(`discography lib no write ${pattern}`, !pattern.test(discographyLib));
  assert(`loader mod no write ${pattern}`, !pattern.test(loaderMod));
}

const gosakiCap = resolveDiscographyLoaderCapability(GOSAKI_SITE_KEY);
assert("gosaki mode generic_filtered", gosakiCap.mode === "generic_filtered");
assert("gosaki legacyUnfilteredRead false", gosakiCap.legacyUnfilteredRead === false);
assert("gosaki supabaseCallAllowed", gosakiCap.supabaseCallAllowed === true);
assert("gosaki siteSlug gosaki-piano", gosakiCap.siteSlug === GOSAKI_SITE_KEY);

const pilotCap = resolveDiscographyLoaderCapability(PILOT_SAMPLE_STATIC_SITE_KEY);
assert("pilot noop feature off", pilotCap.mode === "noop_feature_off");
assert("pilot supabaseCallAllowed false", pilotCap.supabaseCallAllowed === false);

const pilotDisc = await loadSiteDiscographyDataForBuild({
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  toolRoot: TOOL_ROOT,
});
assert("pilot discography null", pilotDisc === null);

const readEnv = resolveSupabaseAnonReadEnv(process.env, TOOL_ROOT);
if (readEnv) {
  const discWrapper = await loadGosakiDiscographyDataForBuild({ toolRoot: TOOL_ROOT });
  const discSiteAware = await loadSiteDiscographyBundleForBuild({
    siteKey: GOSAKI_SITE_KEY,
    toolRoot: TOOL_ROOT,
  });
  assert("gosaki wrapper bundle", discWrapper != null);
  assert("site-aware bundle", discSiteAware != null);
  assert("siteSlugFilterApplied true", discSiteAware.siteSlugFilterApplied === true);

  if (discWrapper.discographyDataSource === "supabase" && discSiteAware.discographyDataSource === "supabase") {
    assert("gosaki 4 releases", discWrapper.rowCount === 4, `got ${discWrapper.rowCount}`);
    assert("gosaki 34 tracks", discWrapper.trackRowCount === 34, `got ${discWrapper.trackRowCount}`);
    assert("site-aware matches releases", discSiteAware.rowCount === discWrapper.rowCount);
    assert("site-aware matches tracks", discSiteAware.trackRowCount === discWrapper.trackRowCount);
    const albumGroups = Object.keys(discWrapper.tracksByLegacyId ?? {}).length;
    assert("gosaki 4 album groups", albumGroups === 4, `got ${albumGroups}`);
  } else {
    console.log(
      `NOTE Supabase discography source=${discWrapper.discographyDataSource} — skipped live 4/34 assertions`,
    );
  }

  const filteredRows = await loadDiscographyRowsFromSupabase({
    env: readEnv,
    siteSlug: GOSAKI_SITE_KEY,
    requireSiteSlugFilter: true,
  });
  assert("filtered rows from supabase", Array.isArray(filteredRows));
  if (filteredRows.length > 0) {
    assert("filtered row count 4", filteredRows.length === 4, `got ${filteredRows.length}`);
  }
} else {
  console.log("NOTE Supabase env missing — skipped live filtered read assertions");
}

const unfilteredPath = await loadDiscographyDataForBuild({
  siteSlug: GOSAKI_SITE_KEY,
  requireSiteSlugFilter: false,
  legacyUnfilteredRead: false,
});
assert("unfiltered path still callable", unfilteredPath != null);
assert("unfiltered not default in wrapper", discographyLib.includes("requireSiteSlugFilter: true"));

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify:g20u25", packageJson.includes("verify:g20u25-discography-filtered-read-enablement"));

const regression = read("tools/static-to-astro/scripts/verify-current-active-regression-suite.mjs");
assert("regression includes G-20u25", regression.includes("G-20u25"));

const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
assert("AI current-state G-20u25", currentState.includes("G-20u25"));
assert("AI next-actions G-20u25", nextActions.includes("G-20u25"));
assert("handoff G-20u25", handoff.includes("G-20u25"));

console.log(`\nG-20u25 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
