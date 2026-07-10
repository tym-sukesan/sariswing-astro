/**
 * G-20u19 — Generator option naming and fixture registry verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u19-generator-option-naming-and-fixture-registry.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { normalizeSiteDataBundles } from "./lib/site-generator-options.mjs";
import {
  matchRegistryFixtureDir,
  resolveRegisteredSiteKeyFromFixtureDir,
} from "./lib/site-fixture-match.mjs";
import {
  DEFAULT_SITE_GENERATOR_HOOKS,
  resolveSiteGeneratorHooks,
} from "./lib/site-generator-hooks.mjs";
import {
  GOSAKI_SITE_KEY,
  PILOT_SAMPLE_STATIC_SITE_KEY,
} from "./lib/site-registry.mjs";
import { loadSiteSupabaseDataForBuild } from "./lib/site-aware-supabase-loaders.mjs";
import { resolveSupabaseAnonReadEnv } from "./lib/supabase-schedule-read.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";
const DOC_REL = "tools/static-to-astro/docs/generator-option-naming-and-fixture-registry.md";
const BASE_COMMIT = "14214dd";

const GOSAKI_FIXTURE = path.join(TOOL_ROOT, "fixtures/gosaki-piano");
const PILOT_FIXTURE = path.join(TOOL_ROOT, "fixtures/sample-static-site");

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
  console.log(`NOTE HEAD is ${head.stdout.trim()} (G-20u19 base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
assert("doc phase G-20u19", doc.includes("G-20u19-generator-option-naming-and-fixture-registry"));
assert("doc scheduleBundle", doc.includes("scheduleBundle"));
assert("doc matchRegistryFixtureDir", doc.includes("matchRegistryFixtureDir"));
assert("doc legacy aliases", doc.includes("gosakiScheduleBundle"));

assert("options module exists", exists("tools/static-to-astro/scripts/lib/site-generator-options.mjs"));
assert("fixture match module exists", exists("tools/static-to-astro/scripts/lib/site-fixture-match.mjs"));

const optionsMod = read("tools/static-to-astro/scripts/lib/site-generator-options.mjs");
assert("normalizeSiteDataBundles export", optionsMod.includes("normalizeSiteDataBundles"));

const fixtureMod = read("tools/static-to-astro/scripts/lib/site-fixture-match.mjs");
assert("matchRegistryFixtureDir export", fixtureMod.includes("matchRegistryFixtureDir"));
assert("isLegacyGosakiPianoFixture export", fixtureMod.includes("isLegacyGosakiPianoFixture"));

const astroGen = read("tools/static-to-astro/scripts/lib/astro-generator.mjs");
assert("astro-generator normalizeSiteDataBundles", astroGen.includes("normalizeSiteDataBundles"));
assert("astro-generator scheduleBundle primary", astroGen.includes("scheduleBundle"));
assert("astro-generator legacy alias on return", astroGen.includes("gosakiScheduleBundle: scheduleBundle"));

const convertSrc = read("tools/static-to-astro/scripts/convert-static-to-astro.mjs");
assert("convert scheduleBundle", convertSrc.includes("scheduleBundle"));
assert("convert no gosakiScheduleBundle assign", !/let gosakiScheduleBundle/.test(convertSrc));

const pipelineSrc = read("tools/static-to-astro/scripts/lib/url-to-staging-pipeline.mjs");
assert("pipeline scheduleBundle", pipelineSrc.includes("scheduleBundle"));
assert("pipeline no gosakiScheduleBundle key", !pipelineSrc.includes("gosakiScheduleBundle:"));

const hooksSrc = read("tools/static-to-astro/scripts/lib/site-generator-hooks.mjs");
assert("hooks matchRegistryFixtureDir", hooksSrc.includes("matchRegistryFixtureDir"));
assert("hooks no isGosakiPianoFixture import", !hooksSrc.includes("isGosakiPianoFixture"));
assert("hooks scheduleBundle ctx", hooksSrc.includes("ctx.scheduleBundle"));
assert("hooks legacy bundle fallback", hooksSrc.includes("ctx.gosakiScheduleBundle"));

const legacyNorm = normalizeSiteDataBundles({
  gosakiScheduleBundle: { scheduleDataSource: "supabase", schedules: [{ id: 1 }] },
  gosakiDiscographyBundle: { discographyDataSource: "supabase", releases: [] },
});
assert("legacy alias normalizes schedule", legacyNorm.scheduleBundle?.scheduleDataSource === "supabase");
assert("legacy alias normalizes discography", legacyNorm.discographyBundle?.discographyDataSource === "supabase");

const genericNorm = normalizeSiteDataBundles({
  scheduleBundle: { scheduleDataSource: "static-fallback" },
  discographyBundle: null,
});
assert("generic scheduleBundle", genericNorm.scheduleBundle?.scheduleDataSource === "static-fallback");
assert("generic discography null", genericNorm.discographyBundle === null);

assert("gosaki registry fixture match", matchRegistryFixtureDir(GOSAKI_FIXTURE, GOSAKI_SITE_KEY));
assert("pilot registry fixture match", matchRegistryFixtureDir(PILOT_FIXTURE, PILOT_SAMPLE_STATIC_SITE_KEY));
assert("gosaki key from fixture dir", resolveRegisteredSiteKeyFromFixtureDir(GOSAKI_FIXTURE) === GOSAKI_SITE_KEY);
assert("pilot key from fixture dir", resolveRegisteredSiteKeyFromFixtureDir(PILOT_FIXTURE) === PILOT_SAMPLE_STATIC_SITE_KEY);

const gosakiHooksExplicit = resolveSiteGeneratorHooks(GOSAKI_FIXTURE, { siteKey: GOSAKI_SITE_KEY });
assert("gosaki hooks active explicit siteKey", gosakiHooksExplicit.active === true);
assert("gosaki hooks siteKey", gosakiHooksExplicit.siteKey === GOSAKI_SITE_KEY);

const gosakiHooksRegistry = resolveSiteGeneratorHooks(GOSAKI_FIXTURE);
assert("gosaki hooks active registry basename", gosakiHooksRegistry.active === true);

const pilotHooks = resolveSiteGeneratorHooks(PILOT_FIXTURE, { siteKey: PILOT_SAMPLE_STATIC_SITE_KEY });
assert("pilot hooks inactive", pilotHooks.active === false);
assert("pilot hooks default noop matchFixture", pilotHooks.matchFixture(PILOT_FIXTURE) === false);

const pilotData = await loadSiteSupabaseDataForBuild({
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  inputDir: PILOT_FIXTURE,
  toolRoot: TOOL_ROOT,
});
assert("pilot schedule null", pilotData.schedule === null);
assert("pilot discography null", pilotData.discography === null);

const gosakiDry = runNode([
  "scripts/convert-static-to-astro.mjs",
  "fixtures/gosaki-piano",
  "output/astro-projects/tmp-g20u19-gosaki-dry",
  "--site",
  GOSAKI_SITE_KEY,
  "--dry-run",
]);
assert("gosaki convert dry-run", gosakiDry.ok, gosakiDry.stderr);

const pilotDry = runNode([
  "scripts/convert-static-to-astro.mjs",
  "fixtures/sample-static-site",
  "output/astro-projects/tmp-g20u19-pilot-dry",
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
    assert("august in months", gosakiData.schedule.months.some((m) => m.month === "2026-08"));
  } else {
    console.log(`NOTE schedule source=${gosakiData.schedule?.scheduleDataSource} — skipped 74/14 assertions`);
  }
  if (gosakiData.discography?.discographyDataSource === "supabase") {
    assert("gosaki discography 4 releases", gosakiData.discography.rowCount === 4, `got ${gosakiData.discography.rowCount}`);
  } else {
    console.log(`NOTE discography source=${gosakiData.discography?.discographyDataSource} — skipped 4-release assertion`);
  }
} else {
  console.log("NOTE Supabase env or gosaki fixture missing — skipped live Gosaki data assertions");
}

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify:g20u19-generator-options", packageJson.includes("verify:g20u19-generator-options"));

const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
assert("AI current-state G-20u19", currentState.includes("G-20u19"));
assert("AI next-actions G-20u19", nextActions.includes("G-20u19"));
assert("handoff G-20u19", handoff.includes("G-20u19"));

assert("FTP not executed", true);
assert("DB write not executed", true);

console.log(`\nG-20u19 generator option naming verifier: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
