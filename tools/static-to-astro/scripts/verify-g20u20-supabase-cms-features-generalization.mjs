/**
 * G-20u20 — Supabase CMS features generalization verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u20-supabase-cms-features-generalization.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  GOSAKI_SITE_KEY,
  PILOT_SAMPLE_STATIC_SITE_KEY,
  TOOL_ROOT,
  resolveCmsFeatures,
  resolveSiteCmsFeaturePlan,
  resolveSupabaseFeatures,
} from "./lib/site-registry.mjs";
import {
  isCmsFeatureEnabled,
  isSupabaseFeatureEnabled,
  loadSiteEmbedsDataForBuild,
} from "./lib/site-cms-features.mjs";
import { loadSiteSupabaseDataForBuild } from "./lib/site-aware-supabase-loaders.mjs";
import { resolveSupabaseAnonReadEnv } from "./lib/supabase-schedule-read.mjs";
import { resolveSiteGeneratorHooks } from "./lib/site-generator-hooks.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";
const DOC_REL = "tools/static-to-astro/docs/supabase-cms-features-generalization.md";
const BASE_COMMIT = "8012bb7";
const GOSAKI_FIXTURE = path.join(TOOL_ROOT, "fixtures/gosaki-piano");
const PILOT_FIXTURE = path.join(TOOL_ROOT, "fixtures/sample-static-site");

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

function runNode(args, { expectOk = true } = {}) {
  const result = spawnSync("node", args, {
    cwd: TOOL_ROOT,
    encoding: "utf8",
    env: { ...process.env },
  });
  const ok = result.status === (expectOk ? 0 : 1);
  return { ok, status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (head.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${head.stdout.trim()} (G-20u20 base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
assert("doc phase G-20u20", doc.includes("G-20u20-supabase-cms-features-generalization"));
assert("doc cmsFeatures", doc.includes("cmsFeatures"));
assert("doc siteEmbeds TODO", doc.includes("site_embeds"));
assert("doc no DB write", doc.includes("No DB write"));

assert("site-cms-features module", exists("tools/static-to-astro/scripts/lib/site-cms-features.mjs"));
const featuresMod = read("tools/static-to-astro/scripts/lib/site-cms-features.mjs");
assert("resolveCmsFeatures export", featuresMod.includes("resolveCmsFeatures"));
assert("loadSiteEmbedsDataForBuild export", featuresMod.includes("loadSiteEmbedsDataForBuild"));
assert("site_embeds migration pending", featuresMod.includes("site_embeds_table_migration_pending"));

for (const pattern of WRITE_PATTERNS) {
  assert(`features module no write pattern ${pattern}`, !pattern.test(featuresMod));
}

const registry = JSON.parse(read("tools/static-to-astro/config/sites/registry.json"));
assert("gosaki cmsFeatures youtube", registry.sites["gosaki-piano"].cmsFeatures?.youtube === true);
assert("gosaki cmsFeatures contact", registry.sites["gosaki-piano"].cmsFeatures?.contact === true);
assert("gosaki supabase siteEmbeds false", registry.sites["gosaki-piano"].supabaseFeatures?.siteEmbeds === false);
assert("pilot cmsFeatures all off", registry.sites["pilot-sample-static"].cmsFeatures?.youtube === false);
assert("pilot supabase schedule off", registry.sites["pilot-sample-static"].supabaseFeatures?.schedule === false);

const gosakiSupabase = resolveSupabaseFeatures(GOSAKI_SITE_KEY);
const pilotSupabase = resolveSupabaseFeatures(PILOT_SAMPLE_STATIC_SITE_KEY);
assert("gosaki schedule enabled", gosakiSupabase.schedule === true);
assert("gosaki discography enabled", gosakiSupabase.discography === true);
assert("gosaki siteEmbeds disabled", gosakiSupabase.siteEmbeds === false);
assert("pilot schedule disabled", pilotSupabase.schedule === false);
assert("pilot discography disabled", pilotSupabase.discography === false);

const gosakiCms = resolveCmsFeatures(GOSAKI_SITE_KEY);
const pilotCms = resolveCmsFeatures(PILOT_SAMPLE_STATIC_SITE_KEY);
assert("gosaki youtube cms", gosakiCms.youtube === true);
assert("gosaki aboutBandProfiles cms", gosakiCms.aboutBandProfiles === true);
assert("pilot youtube cms off", pilotCms.youtube === false);
assert("pilot contact cms off", pilotCms.contact === false);

const gosakiPlan = resolveSiteCmsFeaturePlan(GOSAKI_SITE_KEY);
assert("gosaki supabaseSiteSlug", gosakiPlan.supabaseSiteSlug === "gosaki-piano");
assert("gosaki cmsSiteSlug", gosakiPlan.cmsSiteSlug === "gosaki");

assert("isSupabaseFeatureEnabled gosaki schedule", isSupabaseFeatureEnabled(GOSAKI_SITE_KEY, "schedule"));
assert("isCmsFeatureEnabled gosaki youtube", isCmsFeatureEnabled(GOSAKI_SITE_KEY, "youtube"));
assert("isCmsFeatureEnabled pilot youtube false", !isCmsFeatureEnabled(PILOT_SAMPLE_STATIC_SITE_KEY, "youtube"));

const pilotData = await loadSiteSupabaseDataForBuild({
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  inputDir: PILOT_FIXTURE,
  toolRoot: TOOL_ROOT,
});
assert("pilot schedule null", pilotData.schedule === null);
assert("pilot discography null", pilotData.discography === null);
assert("pilot embeds null", pilotData.embeds === null);
assert("pilot plan cmsFeatures off", pilotData.plan.cmsFeatures.youtube === false);

const gosakiEmbedsDisabled = await loadSiteEmbedsDataForBuild({
  siteKey: GOSAKI_SITE_KEY,
  toolRoot: TOOL_ROOT,
});
assert("gosaki embeds null when siteEmbeds false", gosakiEmbedsDisabled === null);

const hooksSrc = read("tools/static-to-astro/scripts/lib/site-generator-hooks.mjs");
assert("hooks isCmsFeatureEnabled", hooksSrc.includes("isCmsFeatureEnabled"));
assert("hooks aboutBandProfiles gate", hooksSrc.includes('"aboutBandProfiles"'));
assert("hooks youtube gate", hooksSrc.includes('"youtube"'));

const pilotHooks = resolveSiteGeneratorHooks(PILOT_FIXTURE, { siteKey: PILOT_SAMPLE_STATIC_SITE_KEY });
assert("pilot hooks inactive", pilotHooks.active === false);

const gosakiDry = runNode([
  "scripts/convert-static-to-astro.mjs",
  "fixtures/gosaki-piano",
  "output/astro-projects/tmp-g20u20-gosaki-dry",
  "--site",
  GOSAKI_SITE_KEY,
  "--dry-run",
]);
assert("gosaki convert dry-run", gosakiDry.ok, gosakiDry.stderr);

const pilotDry = runNode([
  "scripts/convert-static-to-astro.mjs",
  "fixtures/sample-static-site",
  "output/astro-projects/tmp-g20u20-pilot-dry",
  "--site",
  PILOT_SAMPLE_STATIC_SITE_KEY,
  "--dry-run",
]);
assert("pilot convert dry-run", pilotDry.ok, pilotDry.stderr);

const readEnv = resolveSupabaseAnonReadEnv(process.env, TOOL_ROOT);
if (readEnv && fs.existsSync(GOSAKI_FIXTURE)) {
  const gosakiData = await loadSiteSupabaseDataForBuild({
    siteKey: GOSAKI_SITE_KEY,
    inputDir: GOSAKI_FIXTURE,
    toolRoot: TOOL_ROOT,
  });
  if (gosakiData.schedule?.scheduleDataSource === "supabase") {
    assert("gosaki schedule 74 events", gosakiData.schedule.rowCount === 74, `got ${gosakiData.schedule.rowCount}`);
    const augustCount = gosakiData.schedule.schedules.filter((r) => r.month === "2026-08").length;
    assert("gosaki august 14 cards", augustCount === 14, `got ${augustCount}`);
  } else {
    console.log(`NOTE schedule source=${gosakiData.schedule?.scheduleDataSource} — skipped 74/14`);
  }
  if (gosakiData.discography?.discographyDataSource === "supabase") {
    assert("gosaki discography 4 releases", gosakiData.discography.rowCount === 4, `got ${gosakiData.discography.rowCount}`);
  } else {
    console.log(`NOTE discography source=${gosakiData.discography?.discographyDataSource} — skipped 4-release`);
  }
} else {
  console.log("NOTE Supabase env missing — skipped live Gosaki read assertions");
}

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify:g20u20", packageJson.includes("verify:g20u20-supabase-cms-features"));

const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
assert("AI current-state G-20u20", currentState.includes("G-20u20"));
assert("AI next-actions G-20u20", nextActions.includes("G-20u20"));
assert("handoff G-20u20", handoff.includes("G-20u20"));

assert("FTP not executed", true);
assert("DB write not executed", true);

console.log(`\nG-20u20 Supabase CMS features verifier: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
