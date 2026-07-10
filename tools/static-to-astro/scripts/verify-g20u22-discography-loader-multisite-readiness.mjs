/**
 * G-20u22 — Discography loader multi-site readiness verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u22-discography-loader-multisite-readiness.mjs
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
  createDiscographyNoopBundle,
  loadSiteDiscographyBundleForBuild,
  resolveDiscographyLoaderCapability,
  DISCOGRAPHY_SITE_SLUG_COLUMN_READY,
} from "./lib/site-discography-loader.mjs";
import {
  loadDiscographyDataForBuild,
  loadGosakiDiscographyDataForBuild,
  loadDiscographyRowsFromSupabase,
  GOSAKI_DISCOGRAPHY_SITE_CONFIG,
} from "./lib/supabase-discography-read.mjs";
import { loadSiteDiscographyDataForBuild } from "./lib/site-aware-supabase-loaders.mjs";
import { resolveSupabaseAnonReadEnv } from "./lib/supabase-schedule-read.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";
const DOC_REL = "tools/static-to-astro/docs/discography-loader-multisite-readiness.md";
const BASE_COMMIT = "7ee4d1c";

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
  console.log(`NOTE HEAD is ${head.stdout.trim()} (G-20u22 base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
assert("doc phase G-20u22", doc.includes("G-20u22-discography-loader-multisite-readiness"));
assert("doc site_slug migration", doc.includes("site_slug"));
assert("doc high-risk migration", doc.includes("high-risk") || doc.includes("High-risk"));
assert("doc no DB write", doc.includes("No DB write") || doc.includes("no DB write"));
assert("doc Gosaki compatibility", doc.includes("Gosaki"));

assert("site-discography-loader module", exists("tools/static-to-astro/scripts/lib/site-discography-loader.mjs"));
const loaderMod = read("tools/static-to-astro/scripts/lib/site-discography-loader.mjs");
const discographyLib = read("tools/static-to-astro/scripts/lib/supabase-discography-read.mjs");
const siteAwareLib = read("tools/static-to-astro/scripts/lib/site-aware-supabase-loaders.mjs");

assert("resolveDiscographyLoaderCapability export", loaderMod.includes("resolveDiscographyLoaderCapability"));
assert("loadSiteDiscographyBundleForBuild export", loaderMod.includes("loadSiteDiscographyBundleForBuild"));
assert("loadDiscographyDataForBuild export", discographyLib.includes("export async function loadDiscographyDataForBuild"));
assert("GOSAKI_DISCOGRAPHY_SITE_CONFIG export", discographyLib.includes("GOSAKI_DISCOGRAPHY_SITE_CONFIG"));
assert("site_slug column ready flag", discographyLib.includes("DISCOGRAPHY_SITE_SLUG_COLUMN_READY"));
assert("site-aware delegates to bundle loader", siteAwareLib.includes("loadSiteDiscographyBundleForBuild"));
assert("gosaki wrapper delegates to generic", discographyLib.includes("loadDiscographyDataForBuild({"));
assert("discography site_slug filter guarded", discographyLib.includes('query.eq("site_slug", siteSlug)'));

for (const pattern of WRITE_PATTERNS) {
  assert(`loader module no write pattern ${pattern}`, !pattern.test(loaderMod));
  assert(`discography lib no write pattern ${pattern}`, !pattern.test(discographyLib));
}

assert("site_slug column ready flag export", discographyLib.includes("DISCOGRAPHY_SITE_SLUG_COLUMN_READY"));
assert("gosaki config siteSlug", GOSAKI_DISCOGRAPHY_SITE_CONFIG.siteSlug === GOSAKI_SITE_KEY);

if (DISCOGRAPHY_SITE_SLUG_COLUMN_READY) {
  console.log("NOTE DISCOGRAPHY_SITE_SLUG_COLUMN_READY=true (G-20u25) — legacy-unfiltered assertions skipped");
} else {
  assert("site_slug column not ready pre-G-20u25", DISCOGRAPHY_SITE_SLUG_COLUMN_READY === false);
}

const gosakiCap = resolveDiscographyLoaderCapability(GOSAKI_SITE_KEY);
if (DISCOGRAPHY_SITE_SLUG_COLUMN_READY) {
  assert("gosaki capability generic filtered", gosakiCap.mode === "generic_filtered");
  assert("gosaki legacyUnfilteredRead false", gosakiCap.legacyUnfilteredRead === false);
} else {
  assert("gosaki capability legacy unfiltered", gosakiCap.mode === "gosaki_legacy_unfiltered");
  assert("gosaki legacyUnfilteredRead", gosakiCap.legacyUnfilteredRead === true);
}
assert("gosaki supabaseCallAllowed", gosakiCap.supabaseCallAllowed === true);

const pilotCap = resolveDiscographyLoaderCapability(PILOT_SAMPLE_STATIC_SITE_KEY);
assert("pilot capability noop feature off", pilotCap.mode === "noop_feature_off");
assert("pilot supabaseCallAllowed false", pilotCap.supabaseCallAllowed === false);

const pendingBundle = createDiscographyNoopBundle("discography_site_slug_column_pending", "future-site");
assert("noop bundle empty releases", pendingBundle.releases.length === 0);
assert("noop bundle fallbackReason", pendingBundle.fallbackReason === "discography_site_slug_column_pending");

const filteredNoop = await loadDiscographyDataForBuild({
  siteSlug: "future-site",
  requireSiteSlugFilter: true,
  legacyUnfilteredRead: false,
});
if (!DISCOGRAPHY_SITE_SLUG_COLUMN_READY) {
  assert("filtered read blocked when column pending", filteredNoop.fallbackReason === "discography_site_slug_column_pending");
  assert("filtered read no releases when pending", filteredNoop.rowCount === 0);
} else {
  console.log("NOTE column ready — filtered noop pending test skipped");
}

if (!DISCOGRAPHY_SITE_SLUG_COLUMN_READY) {
  let filterThrows = false;
  try {
    await loadDiscographyRowsFromSupabase({
      env: { supabaseUrl: "https://example.supabase.co", anonKey: "test-key" },
      siteSlug: "future-site",
      requireSiteSlugFilter: true,
    });
  } catch (err) {
    filterThrows = err.message.includes("site_slug filter requested but column migration pending");
  }
  assert("loadDiscographyRowsFromSupabase throws when filter required but column pending", filterThrows);
}

const pilotDisc = await loadSiteDiscographyDataForBuild({
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  toolRoot: TOOL_ROOT,
});
assert("pilot discography null", pilotDisc === null);

const pilotBundle = await loadSiteDiscographyBundleForBuild({
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  toolRoot: TOOL_ROOT,
});
assert("pilot bundle null", pilotBundle === null);

const readEnv = resolveSupabaseAnonReadEnv(process.env, TOOL_ROOT);
if (readEnv) {
  const discWrapper = await loadGosakiDiscographyDataForBuild({ toolRoot: TOOL_ROOT });
  const discSiteAware = await loadSiteDiscographyDataForBuild({
    siteKey: GOSAKI_SITE_KEY,
    toolRoot: TOOL_ROOT,
  });
  assert("gosaki discography wrapper", discWrapper != null);
  assert("site-aware gosaki discography", discSiteAware != null);
  assert("gosaki bundle siteSlug", discSiteAware.siteSlug === GOSAKI_SITE_KEY);

  if (discWrapper.discographyDataSource === "supabase" && discSiteAware.discographyDataSource === "supabase") {
    assert("gosaki discography 4 releases", discWrapper.rowCount === 4, `got ${discWrapper.rowCount}`);
    assert("site-aware discography matches wrapper", discSiteAware.rowCount === discWrapper.rowCount);
    if (DISCOGRAPHY_SITE_SLUG_COLUMN_READY) {
      assert("gosaki filtered siteSlugFilterApplied", discSiteAware.siteSlugFilterApplied === true);
    }
  } else {
    console.log(
      `NOTE Supabase discography source=${discWrapper.discographyDataSource} — skipped live 4-release assertion`,
    );
  }
} else {
  console.log("NOTE Supabase env missing — skipped live Gosaki discography read assertions");
}

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify:g20u22", packageJson.includes("verify:g20u22-discography-loader-multisite-readiness"));

const regression = read("tools/static-to-astro/scripts/verify-current-active-regression-suite.mjs");
assert("regression includes G-20u22", regression.includes("G-20u22"));

const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
assert("AI current-state G-20u22", currentState.includes("G-20u22"));
assert("AI next-actions G-20u22", nextActions.includes("G-20u22"));
assert("handoff G-20u22", handoff.includes("G-20u22"));

console.log(`\nG-20u22 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
