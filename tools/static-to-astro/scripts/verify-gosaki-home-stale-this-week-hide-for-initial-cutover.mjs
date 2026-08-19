#!/usr/bin/env node
/**
 * Gosaki initial public cutover — Option D Home stale THIS WEEK hide.
 * Offline hide/YouTube/adapter checks + SELECT-only September build-read.
 * No DB write, no package 本生成, no FTP.
 *
 * Run: node scripts/verify-gosaki-home-stale-this-week-hide-for-initial-cutover.mjs
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BASELINE_HOME_IN,
  BASELINE_HOME_YT_OUT,
} from "./lib/cms-core-v2-gosaki-site-generator-hooks-html-baseline-fixtures.mjs";
import { injectYouTubeEmbedIntoHomePage } from "./lib/gosaki-home-youtube-embed.mjs";
import {
  GOSAKI_HOME_SCHEDULE_SLOT,
  GOSAKI_HOME_THIS_WEEK_HIDDEN_CLASS,
  GOSAKI_STALE_THIS_WEEK_HEADING_ID,
  GOSAKI_STALE_THIS_WEEK_REPEATER_ID,
  GOSAKI_STALE_THIS_WEEK_RULE_ID,
  GOSAKI_STALE_THIS_WEEK_SECTION_ID,
  INITIAL_PUBLIC_CUTOVER_HOME_SCHEDULE,
  applyGosakiHomeStaleThisWeekHide,
  hideGosakiStaleThisWeekInHomePage,
  homeHasVisibleStaleThisWeek,
} from "./lib/gosaki-home-stale-this-week-hide.mjs";
import { createGosakiPianoHookMethods } from "./lib/gosaki-site-generator-hooks-adapter.mjs";
import { applyGosakiScheduleDataPages } from "./lib/gosaki-schedule-data-pages.mjs";
import { loadGosakiScheduleDataForBuild } from "./lib/gosaki-schedule-read-adapter.mjs";
import {
  cmsKitScheduleMonthRoute,
  legacyWixScheduleMonthRoute,
} from "./lib/schedule-pages.mjs";
import {
  loadGosakiStagingAdminPublicEnv,
  validateGosakiStagingAdminPublicEnv,
} from "./lib/gosaki-staging-admin-public-env.mjs";
import { GOSAKI_SITE_KEY } from "./lib/site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const FIXTURE_HOME = path.join(TOOL_ROOT, "fixtures/gosaki-piano/index.html");
const ADAPTER = path.join(TOOL_ROOT, "scripts/lib/gosaki-site-generator-hooks-adapter.mjs");
const CORE_HOOKS = path.join(TOOL_ROOT, "scripts/lib/site-generator-hooks.mjs");
const CORE_ASTRO = path.join(TOOL_ROOT, "scripts/lib/astro-generator.mjs");
const SCHEDULE_PAGES = path.join(TOOL_ROOT, "scripts/lib/gosaki-schedule-data-pages.mjs");
const OVERRIDES = path.join(
  TOOL_ROOT,
  "scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs",
);
const HIDE_MOD = path.join(TOOL_ROOT, "scripts/lib/gosaki-home-stale-this-week-hide.mjs");
const YT_MOD = path.join(TOOL_ROOT, "scripts/lib/gosaki-home-youtube-embed.mjs");
const DOC = path.join(TOOL_ROOT, "docs/gosaki-home-stale-this-week-hide-for-initial-cutover.md");

let passed = 0;
let failed = 0;

function assert(name, cond, detail = "") {
  if (cond) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const SYNTHETIC_HOME = `---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="Home">
  <header id="SITE_HEADER"><nav>Schedule</nav></header>
  <div id="comp-lol1i5k0">KV</div>
  <section id="${GOSAKI_STALE_THIS_WEEK_SECTION_ID}">
    <div id="${GOSAKI_STALE_THIS_WEEK_HEADING_ID}"><h1>THIS WEEK'S LIVE SCHEDULE</h1></div>
    <div id="${GOSAKI_STALE_THIS_WEEK_RULE_ID}"></div>
    <div id="${GOSAKI_STALE_THIS_WEEK_REPEATER_ID}">
      <p>3月25日(水)　LIVE</p>
      <p>3月27日(金)　LIVE</p>
      <p>3月31日(火)　LIVE</p>
    </div>
  </section>
  <footer id="SITE_FOOTER">copyright</footer>
</BaseLayout>
`;

assert("cutover Option D constant", INITIAL_PUBLIC_CUTOVER_HOME_SCHEDULE === "Option D");
assert("hide module exists", fs.existsSync(HIDE_MOD));
assert("phase doc exists", fs.existsSync(DOC));

const hiddenPage = hideGosakiStaleThisWeekInHomePage(SYNTHETIC_HOME);
assert("synthetic hide removes THIS WEEK heading", !/THIS WEEK/i.test(hiddenPage));
assert("synthetic hide removes March 25", !hiddenPage.includes("3月25"));
assert("synthetic hide removes March 27", !hiddenPage.includes("3月27"));
assert("synthetic hide removes March 31", !hiddenPage.includes("3月31"));
assert(
  "synthetic hide removes stale DOM ids",
  !homeHasVisibleStaleThisWeek(hiddenPage),
);
assert("synthetic hide inserts schedule slot", hiddenPage.includes(GOSAKI_HOME_SCHEDULE_SLOT));
assert(
  "synthetic hide marks section",
  hiddenPage.includes(GOSAKI_HOME_THIS_WEEK_HIDDEN_CLASS) &&
    hiddenPage.includes(`id="${GOSAKI_STALE_THIS_WEEK_SECTION_ID}"`),
);
assert("synthetic hide keeps header/nav", hiddenPage.includes('id="SITE_HEADER"') && hiddenPage.includes("Schedule"));
assert("synthetic hide keeps KV", hiddenPage.includes('id="comp-lol1i5k0"'));
assert("synthetic hide keeps footer", hiddenPage.includes('id="SITE_FOOTER"') && hiddenPage.includes("copyright"));
assert(
  "synthetic hide leaves no empty THIS WEEK heading",
  !hiddenPage.includes(`id="${GOSAKI_STALE_THIS_WEEK_HEADING_ID}"`) &&
    !hiddenPage.includes(`id="${GOSAKI_STALE_THIS_WEEK_REPEATER_ID}"`) &&
    !hiddenPage.includes(`id="${GOSAKI_STALE_THIS_WEEK_RULE_ID}"`),
);

const hiddenAgain = hideGosakiStaleThisWeekInHomePage(hiddenPage);
assert("hide is idempotent (slot once)", hiddenAgain.split(GOSAKI_HOME_SCHEDULE_SLOT).length === 2);

const withYt = injectYouTubeEmbedIntoHomePage(hiddenPage);
assert(
  "YouTube inject after hide keeps slot + component",
  withYt.includes(GOSAKI_HOME_SCHEDULE_SLOT) && withYt.includes("<YouTubeEmbedSection />"),
);
assert("YouTube inject after hide does not restore THIS WEEK", !/THIS WEEK/i.test(withYt));
const ytIdx = withYt.indexOf("<YouTubeEmbedSection />");
const footerIdx = withYt.indexOf('id="SITE_FOOTER"');
assert("YouTube is before footer", ytIdx >= 0 && footerIdx >= 0 && ytIdx < footerIdx);
assert(
  "YouTube baseline without hide still exact",
  injectYouTubeEmbedIntoHomePage(BASELINE_HOME_IN) === BASELINE_HOME_YT_OUT,
);

const tmpHide = fs.mkdtempSync(path.join(os.tmpdir(), "gosaki-home-hide-"));
fs.mkdirSync(path.join(tmpHide, "src/pages"), { recursive: true });
fs.writeFileSync(path.join(tmpHide, "src/pages/index.astro"), SYNTHETIC_HOME, "utf8");
const applySummary = applyGosakiHomeStaleThisWeekHide(tmpHide);
assert("apply hide applied", applySummary.applied === true && applySummary.staleVisibleAfter === false);
assert(
  "apply hide removed three ids",
  applySummary.removedIds.includes(GOSAKI_STALE_THIS_WEEK_HEADING_ID) &&
    applySummary.removedIds.includes(GOSAKI_STALE_THIS_WEEK_RULE_ID) &&
    applySummary.removedIds.includes(GOSAKI_STALE_THIS_WEEK_REPEATER_ID),
);

const hooks = createGosakiPianoHookMethods();
const tmpPg = fs.mkdtempSync(path.join(os.tmpdir(), "gosaki-home-hide-pg-"));
fs.mkdirSync(path.join(tmpPg, "src/pages"), { recursive: true });
fs.mkdirSync(path.join(tmpPg, "src/components"), { recursive: true });
fs.mkdirSync(path.join(tmpPg, "src/data"), { recursive: true });
fs.mkdirSync(path.join(tmpPg, "src/lib"), { recursive: true });
fs.writeFileSync(path.join(tmpPg, "src/pages/index.astro"), SYNTHETIC_HOME, "utf8");
const pg = hooks.applyPostGenerate(tmpPg, {
  toolRoot: TOOL_ROOT,
  siteKey: GOSAKI_SITE_KEY,
});
assert("postGenerate includes hide summary", Boolean(pg.gosakiHomeStaleThisWeekSummary));
assert(
  "postGenerate hide applied on Home",
  pg.gosakiHomeStaleThisWeekSummary.applied === true &&
    pg.gosakiHomeStaleThisWeekSummary.staleVisibleAfter === false,
);
assert("postGenerate YouTube applied", pg.gosakiYoutubeEmbedSummary.applied === true);
const pgHome = fs.readFileSync(path.join(tmpPg, "src/pages/index.astro"), "utf8");
assert("postGenerate Home has no THIS WEEK", !/THIS WEEK/i.test(pgHome));
assert("postGenerate Home has no March cards", !/3月25|3月27|3月31/.test(pgHome));
assert("postGenerate Home keeps YouTube component", pgHome.includes("<YouTubeEmbedSection />"));
assert("postGenerate Home keeps header/footer/KV", pgHome.includes("SITE_HEADER") && pgHome.includes("SITE_FOOTER") && pgHome.includes("comp-lol1i5k0"));
assert("postGenerate admin still applied", pg.gosakiReadOnlyAdminSummary.applied === true);
assert(
  "postGenerate no new wixstatic on Home",
  !/static\.wixstatic\.com/.test(pgHome),
);

assert("fixture Home exists", fs.existsSync(FIXTURE_HOME));
const fixtureHtml = fs.readFileSync(FIXTURE_HOME, "utf8");
const bodyMatch = fixtureHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
assert("fixture body extracted", Boolean(bodyMatch));
const fixtureAstro = `---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="Home">
${bodyMatch?.[1] ?? ""}
</BaseLayout>
`;
assert("fixture Home has stale THIS WEEK before hide", homeHasVisibleStaleThisWeek(fixtureAstro));
const fixtureHidden = hideGosakiStaleThisWeekInHomePage(fixtureAstro);
const fixtureWithYt = injectYouTubeEmbedIntoHomePage(fixtureHidden);
assert("fixture hide removes visible THIS WEEK", !homeHasVisibleStaleThisWeek(fixtureWithYt));
assert("fixture hide removes March card text", !/3月25|3月27|3月31/.test(fixtureWithYt));
assert("fixture hide inserts slot", fixtureWithYt.includes(GOSAKI_HOME_SCHEDULE_SLOT));
assert("fixture YouTube component present", fixtureWithYt.includes("<YouTubeEmbedSection />"));
assert(
  "fixture header/footer survive",
  /id="SITE_HEADER"/.test(fixtureWithYt) && /id="SITE_FOOTER"/.test(fixtureWithYt),
);
const fYt = fixtureWithYt.indexOf("<YouTubeEmbedSection />");
const fFoot = fixtureWithYt.indexOf('id="SITE_FOOTER"');
assert("fixture YouTube before footer", fYt >= 0 && fFoot >= 0 && fYt < fFoot);

const adapterSrc = fs.readFileSync(ADAPTER, "utf8");
const hideSrc = fs.readFileSync(HIDE_MOD, "utf8");
const ytSrc = fs.readFileSync(YT_MOD, "utf8");
const coreHooksSrc = fs.readFileSync(CORE_HOOKS, "utf8");
const coreAstroSrc = fs.readFileSync(CORE_ASTRO, "utf8");
const scheduleSrc = fs.readFileSync(SCHEDULE_PAGES, "utf8");
const overridesSrc = fs.readFileSync(OVERRIDES, "utf8");

const applyPostGenerateSrc = adapterSrc.slice(adapterSrc.indexOf("applyPostGenerate(outDir"));
assert(
  "adapter calls hide before YouTube",
  applyPostGenerateSrc.indexOf("applyGosakiHomeStaleThisWeekHide") >= 0 &&
    applyPostGenerateSrc.indexOf("applyGosakiHomeStaleThisWeekHide") <
      applyPostGenerateSrc.indexOf("applyGosakiHomeYouTubeEmbed") &&
    adapterSrc.includes("gosakiHomeStaleThisWeekSummary"),
);
assert(
  "adapter still rewrites Wix local assets after HTML injects",
  adapterSrc.indexOf("applyGosakiHomeStaleThisWeekHide") <
    adapterSrc.indexOf("applyGosakiWixLocalAssets") &&
    adapterSrc.includes("applyGosakiWixLocalAssets"),
);
assert(
  "core hooks do not import hide module",
  !coreHooksSrc.includes("gosaki-home-stale-this-week-hide"),
);
assert(
  "core astro-generator does not import hide module",
  !coreAstroSrc.includes("gosaki-home-stale-this-week-hide"),
);
assert(
  "schedule hub/month generator unchanged by hide",
  !scheduleSrc.includes("gosaki-home-stale-this-week-hide") &&
    !scheduleSrc.includes("GOSAKI_HOME_SCHEDULE_SLOT"),
);
assert("hide module has no wixstatic", !hideSrc.includes("wixstatic"));
assert(
  "YouTube slot prefers schedule slot",
  ytSrc.includes("GOSAKI_HOME_SCHEDULE_SLOT") &&
    ytSrc.includes("GOSAKI_STALE_THIS_WEEK_SECTION_ID"),
);
assert(
  "overrides collapse hidden mesh",
  overridesSrc.includes("gosaki-home-this-week-hidden") &&
    overridesSrc.includes("#comp-m8y53dj5") &&
    overridesSrc.includes("#comp-m8y5bex0"),
);

const htmlBaseline = spawnSync(
  process.execPath,
  ["scripts/verify-cms-core-v2-gosaki-site-generator-hooks-html-baseline.mjs"],
  { cwd: TOOL_ROOT, encoding: "utf8" },
);
assert(
  "html-baseline verifier PASS",
  htmlBaseline.status === 0,
  htmlBaseline.stderr || htmlBaseline.stdout.slice(-400),
);

const packetVerify = spawnSync(
  process.execPath,
  ["scripts/verify-gosaki-2026-09-batch-insert-db-write-packet.mjs"],
  { cwd: TOOL_ROOT, encoding: "utf8" },
);
assert(
  "2026-09 packet verifier still PASS",
  packetVerify.status === 0,
  packetVerify.stderr || packetVerify.stdout.slice(-400),
);

const env = loadGosakiStagingAdminPublicEnv();
const envCheck = validateGosakiStagingAdminPublicEnv(env);
assert("staging anon env valid", envCheck.ok, JSON.stringify(envCheck));

let bundle = null;
if (envCheck.ok) {
  try {
    bundle = await loadGosakiScheduleDataForBuild({
      inputDir: path.join(TOOL_ROOT, "fixtures/gosaki-piano"),
      env,
      toolRoot: TOOL_ROOT,
    });
  } catch (err) {
    assert("September build-read threw", false, err instanceof Error ? err.message : String(err));
  }
}

if (bundle) {
  assert("build-read source supabase", bundle.scheduleDataSource === "supabase");
  const ids = bundle.schedules.map((row) => String(row.legacy_id ?? row.legacyId ?? ""));
  const septRows = bundle.schedules.filter((row) => String(row.month ?? "") === "2026-09");
  const septIds = septRows.map((row) => String(row.legacy_id ?? row.legacyId ?? ""));
  assert("published total 91", bundle.schedules.length === 91, `got ${bundle.schedules.length}`);
  assert("published September 17", septRows.length === 17, `got ${septRows.length}`);
  assert("test 001 not in published bake", !ids.includes("schedule-2026-09-001"));
  const expectedIds = Array.from({ length: 17 }, (_, i) => `schedule-2026-09-${String(i + 2).padStart(3, "0")}`);
  assert(
    "published 002-018 present",
    expectedIds.every((id) => septIds.includes(id)),
    `missing ${expectedIds.filter((id) => !septIds.includes(id)).join(",")}`,
  );
  const month09 = bundle.months.find((m) => m.month === "2026-09");
  assert("build-read discovers 2026-09", Boolean(month09), `months=${(bundle.months ?? []).map((m) => m.month).join(",")}`);
  assert(
    "canonical route /schedule/2026-09/",
    month09?.route === cmsKitScheduleMonthRoute("2026", "09") &&
      month09?.route === "/schedule/2026-09/",
  );
  assert("legacy route helper /2026-09/", legacyWixScheduleMonthRoute("2026", "09") === "/2026-09/");
  assert("September count on month meta", month09?.count === 17, `count=${month09?.count}`);

  const tmpSched = fs.mkdtempSync(path.join(os.tmpdir(), "gosaki-sept-routes-"));
  const applied = applyGosakiScheduleDataPages(tmpSched, bundle, {
    baseUrl: "https://example.test",
    deployBase: "/",
  });
  const monthFile = path.join(tmpSched, "src/pages/schedule/2026-09/index.astro");
  const hubFile = path.join(tmpSched, "src/pages/schedule/index.astro");
  const jsonFile = path.join(tmpSched, "src/data/gosaki-schedules.json");
  assert("canonical month page written", fs.existsSync(monthFile));
  assert("hub includes 2026-09", fs.existsSync(hubFile) && fs.readFileSync(hubFile, "utf8").includes("2026-09"));
  const baked = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
  assert(
    "baked JSON has 17 September rows",
    baked.filter((row) => String(row.month ?? "") === "2026-09").length === 17,
  );
  assert("applyScheduleDataPages eventCount 91", applied.eventCount === 91);

  const written = [];
  const legacy = hooks.applyLegacyMonthStubs({
    outDir: tmpSched,
    useScheduleData: true,
    scheduleBundle: bundle,
    writeFile(filePath, content) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content, "utf8");
      written.push(filePath);
    },
    generateScheduleLegacyMonthStubPage(monthEntry) {
      return `legacy-stub ${monthEntry.year}-${monthEntry.month} ${monthEntry.route}`;
    },
  });
  const legacy09 = path.join(tmpSched, "src/pages/2026-09/index.astro");
  assert("legacy stub count includes 2026-09", legacy.count >= 1 && fs.existsSync(legacy09));
  assert(
    "legacy stub points at canonical month",
    fs.readFileSync(legacy09, "utf8").includes("/schedule/2026-09/"),
  );
  assert("legacy helper used by stubs", written.some((p) => p.endsWith(`${path.sep}2026-09${path.sep}index.astro`)));
}

for (const profile of ["staging", "ciao-preview", "production"]) {
  const dry = spawnSync(
    "npm",
    ["run", `build:gosaki:${profile}:dry-run`],
    { cwd: TOOL_ROOT, encoding: "utf8" },
  );
  assert(
    `${profile} dry-run PASS`,
    dry.status === 0,
    (dry.stderr || dry.stdout || "").slice(-500),
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
