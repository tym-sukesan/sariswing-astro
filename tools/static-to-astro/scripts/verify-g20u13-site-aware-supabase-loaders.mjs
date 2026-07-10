/**
 * G-20u13 — Site-aware Supabase loaders verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u13-site-aware-supabase-loaders.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  GOSAKI_SITE_KEY,
  PILOT_SAMPLE_STATIC_SITE_KEY,
  TOOL_ROOT,
  resolveSupabaseFeatures,
  resolveSupabaseSiteSlug,
} from "./lib/site-registry.mjs";
import {
  loadSiteDiscographyDataForBuild,
  loadSiteScheduleDataForBuild,
  loadSiteSupabaseDataForBuild,
  resolveSiteSupabaseLoadPlan,
} from "./lib/site-aware-supabase-loaders.mjs";
import {
  GOSAKI_SCHEDULE_SITE_CONFIG,
  loadGosakiScheduleDataForBuild,
  resolveSupabaseAnonReadEnv,
} from "./lib/supabase-schedule-read.mjs";
import { loadGosakiDiscographyDataForBuild } from "./lib/supabase-discography-read.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";
const GOSAKI_FIXTURE = path.join(TOOL_ROOT, "fixtures/gosaki-piano");
const DOC_REL = "tools/static-to-astro/docs/site-aware-supabase-loaders.md";
const BASE_COMMIT = "23806c5";

const WRITE_PATTERNS = [
  /\.insert\s*\(/,
  /\.update\s*\(/,
  /\.upsert\s*\(/,
  /\.delete\s*\(/,
  /service_role/i,
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

const head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

if (head.stdout.trim().startsWith(BASE_COMMIT)) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${head.stdout.trim().slice(0, 12)} (G-20u13 original ${BASE_COMMIT}) — non-blocking`,
  );
}
if (origin.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS origin/main is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE origin/main is ${origin.stdout.trim()} (G-20u13 original ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("doc exists", exists(DOC_REL));
assert("site-aware loaders exists", exists("tools/static-to-astro/scripts/lib/site-aware-supabase-loaders.mjs"));

const doc = read(DOC_REL);
const registry = JSON.parse(read("tools/static-to-astro/config/sites/registry.json"));
const scheduleLib = read("tools/static-to-astro/scripts/lib/supabase-schedule-read.mjs");
const discographyLib = read("tools/static-to-astro/scripts/lib/supabase-discography-read.mjs");
const siteAwareLib = read("tools/static-to-astro/scripts/lib/site-aware-supabase-loaders.mjs");
const convertCli = read("tools/static-to-astro/scripts/convert-static-to-astro.mjs");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u13", doc.includes("G-20u13-site-aware-supabase-loaders"));
assert("doc gate complete", doc.includes("siteAwareSupabaseLoadersComplete: true"));

assert("registry gosaki supabaseFeatures", registry.sites["gosaki-piano"].supabaseFeatures?.schedule === true);
assert("registry pilot schedule off", registry.sites["pilot-sample-static"].supabaseFeatures?.schedule === false);
assert("registry pilot discography off", registry.sites["pilot-sample-static"].supabaseFeatures?.discography === false);

assert("gosaki supabaseSiteSlug", resolveSupabaseSiteSlug(GOSAKI_SITE_KEY) === "gosaki-piano");
assert("pilot supabaseSiteSlug", resolveSupabaseSiteSlug(PILOT_SAMPLE_STATIC_SITE_KEY) === "pilot-sample-static");

const gosakiFeatures = resolveSupabaseFeatures(GOSAKI_SITE_KEY);
const pilotFeatures = resolveSupabaseFeatures(PILOT_SAMPLE_STATIC_SITE_KEY);
assert("gosaki features schedule", gosakiFeatures.schedule === true);
assert("gosaki features discography", gosakiFeatures.discography === true);
assert("pilot features schedule off", pilotFeatures.schedule === false);
assert("pilot features discography off", pilotFeatures.discography === false);

const gosakiPlan = resolveSiteSupabaseLoadPlan(GOSAKI_SITE_KEY);
assert("gosaki plan slug", gosakiPlan.supabaseSiteSlug === "gosaki-piano");
assert("pilot plan schedule off", resolveSiteSupabaseLoadPlan(PILOT_SAMPLE_STATIC_SITE_KEY).features.schedule === false);

assert("convert uses loadSiteSupabaseDataForBuild", convertCli.includes("loadSiteSupabaseDataForBuild"));
assert("convert not hardcoded gosaki only", !convertCli.includes("effectiveSiteKey === GOSAKI_SITE_KEY"));

assert("site-aware loadGosakiScheduleDataForBuild", siteAwareLib.includes("loadGosakiScheduleDataForBuild"));
assert("site-aware loadSiteDiscographyBundleForBuild", siteAwareLib.includes("loadSiteDiscographyBundleForBuild"));
assert("site-discography-loader module exists", exists("tools/static-to-astro/scripts/lib/site-discography-loader.mjs"));
assert("schedule lib site_slug filter", scheduleLib.includes('.eq("site_slug", siteSlug)'));
assert("Gosaki wrapper preserved", scheduleLib.includes("export async function loadGosakiScheduleDataForBuild"));
assert("discography wrapper preserved", discographyLib.includes("export async function loadGosakiDiscographyDataForBuild"));

for (const lib of [
  { name: "schedule", src: scheduleLib },
  { name: "discography", src: discographyLib },
  { name: "site-aware", src: siteAwareLib },
]) {
  for (const pattern of WRITE_PATTERNS) {
    if (pattern.source === "service_role") {
      assert(
        `no service_role usage in ${lib.name} lib`,
        !/service_role/.test(lib.src.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "")),
      );
    } else {
      assert(`no write pattern ${pattern} in ${lib.name} lib`, !pattern.test(lib.src));
    }
  }
}

const pilotData = await loadSiteSupabaseDataForBuild({
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  inputDir: path.join(TOOL_ROOT, "fixtures/sample-static-site"),
  toolRoot: TOOL_ROOT,
});
assert("pilot schedule null", pilotData.schedule === null);
assert("pilot discography null", pilotData.discography === null);
assert("pilot plan slug", pilotData.plan.supabaseSiteSlug === "pilot-sample-static");

const pilotScheduleOnly = await loadSiteScheduleDataForBuild({
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  inputDir: path.join(TOOL_ROOT, "fixtures/sample-static-site"),
  toolRoot: TOOL_ROOT,
});
assert("pilot loadSiteSchedule null", pilotScheduleOnly === null);

const readEnv = resolveSupabaseAnonReadEnv(process.env, TOOL_ROOT);
if (readEnv && fs.existsSync(GOSAKI_FIXTURE)) {
  const gosakiWrapper = await loadGosakiScheduleDataForBuild({
    inputDir: GOSAKI_FIXTURE,
    siteSlug: GOSAKI_SCHEDULE_SITE_CONFIG.siteSlug,
    toolRoot: TOOL_ROOT,
  });
  assert("gosaki wrapper returns bundle", gosakiWrapper != null);
  assert("gosaki wrapper siteSlug", gosakiWrapper.siteSlug === "gosaki-piano");

  const gosakiSiteAware = await loadSiteScheduleDataForBuild({
    siteKey: GOSAKI_SITE_KEY,
    inputDir: GOSAKI_FIXTURE,
    toolRoot: TOOL_ROOT,
  });
  assert("site-aware gosaki schedule bundle", gosakiSiteAware != null);
  assert("site-aware gosaki siteSlug", gosakiSiteAware.siteSlug === "gosaki-piano");

  if (gosakiWrapper.scheduleDataSource === "supabase" && gosakiSiteAware.scheduleDataSource === "supabase") {
    assert("gosaki schedule rowCount 74", gosakiWrapper.rowCount === 74, `got ${gosakiWrapper.rowCount}`);
    assert("site-aware matches wrapper count", gosakiSiteAware.rowCount === gosakiWrapper.rowCount);

    const augustCount = gosakiWrapper.schedules.filter((row) => row.month === "2026-08").length;
    assert("gosaki august 14 cards", augustCount === 14, `got ${augustCount}`);

    const augustInMonths = gosakiWrapper.months.some((m) => m.month === "2026-08");
    assert("august in month discovery", augustInMonths);
  } else {
    console.log(
      `NOTE Supabase schedule source=${gosakiWrapper.scheduleDataSource} — skipped live 74/14 assertions`,
    );
  }

  const discWrapper = await loadGosakiDiscographyDataForBuild({ toolRoot: TOOL_ROOT });
  const discSiteAware = await loadSiteDiscographyDataForBuild({
    siteKey: GOSAKI_SITE_KEY,
    toolRoot: TOOL_ROOT,
  });
  assert("gosaki discography wrapper", discWrapper != null);
  assert("site-aware gosaki discography", discSiteAware != null);

  if (discWrapper.discographyDataSource === "supabase" && discSiteAware.discographyDataSource === "supabase") {
    assert("gosaki discography 4 releases", discWrapper.rowCount === 4, `got ${discWrapper.rowCount}`);
    assert("site-aware discography matches wrapper", discSiteAware.rowCount === discWrapper.rowCount);
  } else {
    console.log(
      `NOTE Supabase discography source=${discWrapper.discographyDataSource} — skipped live 4-release assertion`,
    );
  }
} else {
  console.log("NOTE Supabase env or gosaki fixture missing — skipped live Gosaki read assertions");
}

assert("AI current-state G-20u13", currentState.includes("G-20u13"));
assert("AI next-actions G-20u13", nextActions.includes("G-20u13"));
assert("handoff G-20u13", handoff.includes("G-20u13"));

console.log("");
console.log(`G-20u13 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
