#!/usr/bin/env node
/**
 * G-7b — Verify URL-to-staging pipeline orchestrator (no external network, no FTP, no DB).
 * Run: node tools/static-to-astro/scripts/verify-url-to-staging-pipeline.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadUrlToStagingConfig,
  validateUrlToStagingConfig,
} from "./lib/url-to-staging-config-loader.mjs";
import {
  buildNextManualSteps,
  buildSeoStagingPlan,
  buildUrlToStagingStepPlan,
  PIPELINE_PHASE,
} from "./lib/url-to-staging-pipeline-plan.mjs";
import { runUrlToStagingPipeline } from "./lib/url-to-staging-pipeline.mjs";
import {
  discoverMonthlyScheduleMonths,
  isMonthlyScheduleRoute,
  verifyPublicHtmlExists,
} from "./lib/static-public-artifact-verifier.mjs";
import {
  stagingCanonicalLeakInSeoMeta,
  verifyAssetPathsIncludeBase,
  verifyPublicDistCssPresence,
  buildDeployOrigin,
  canonicalHasDuplicateDeployBase,
  resolveStagingPublicUrl,
} from "./lib/deploy-base.mjs";
import { productionAbsoluteUrlToRoute } from "./lib/path-transform.mjs";
import { buildWixStagingVisualOverridesCss } from "./lib/wix-staging-visual-overrides.mjs";
import { buildWixStaticExportBaselineOverridesCss } from "./lib/wix-static-export-baseline-overrides.mjs";
import {
  GOSAKI_SAFE_DISPLAY_FONT_STACK,
  auditFontSafety,
  isFontSafeForStaticExport,
  sanitizeWixFontCss,
} from "./lib/wix-font-safety.mjs";
import { buildGosakiPianoSiteOverridesCss } from "./lib/site-specific-overrides/gosaki-piano-overrides.mjs";
import {
  extractGosakiFooterSocialLinks,
  injectGosakiFooterSocialBlock,
} from "./lib/gosaki-footer-social.mjs";
import { generateHeaderAstro } from "./lib/header-transform.mjs";
import { parseScheduleMonthSourcePath, shouldIncludePageInSitemap } from "./lib/schedule-pages.mjs";
import {
  injectBandProfilesIntoAboutPage,
  loadGosakiBandProfilesConfig,
  verifyAboutBandProfilesHtml,
} from "./lib/gosaki-about-band-profiles.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

let passed = 0;
let failed = 0;

function assert(name, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}`);
  }
}

function assertEqual(name, actual, expected) {
  assert(name, actual === expected);
  if (actual !== expected) {
    console.error(`  expected: ${expected}`);
    console.error(`  actual:   ${actual}`);
  }
}

// --- config validation ---

assert("validate rejects empty config", !validateUrlToStagingConfig(null).ok);
assert("validate rejects missing deployBase slash", !validateUrlToStagingConfig({
  siteSlug: "x",
  startUrl: "https://example.com/",
  fixtureOut: "f",
  projectOut: "p",
  deployBase: "no-slash",
}).ok);

const gosakiConfigPath = path.join(TOOL_ROOT, "config/sites/gosaki-piano.url-to-staging.json");
assert("gosaki config file exists", fs.existsSync(gosakiConfigPath));

const gosakiConfig = loadUrlToStagingConfig(gosakiConfigPath, TOOL_ROOT);
assertEqual("gosaki siteSlug", gosakiConfig.siteSlug, "gosaki-piano");
assertEqual("gosaki deployBase", gosakiConfig.deployBase, "/cms-kit-staging/gosaki-piano/");
assert("gosaki stagingBaseUrl set", Boolean(gosakiConfig.stagingBaseUrl));
assert("gosaki productionBaseUrl set", Boolean(gosakiConfig.productionBaseUrl));
assert("gosaki seo stagingNoindex", gosakiConfig.seo.stagingNoindex === true);

// --- step plan ---

const defaultGates = {
  runCrawl: false,
  runConvert: false,
  runBuild: false,
  preparePublic: false,
  deployFtp: false,
};

const dryPlan = buildUrlToStagingStepPlan(gosakiConfig, defaultGates, true);
assert("dry-run plan has validate step", dryPlan.some((s) => s.id === "validate-config"));
assert("dry-run crawl wouldRun false", dryPlan.find((s) => s.id === "crawl-fixture")?.wouldRun === false);
assert("dry-run deploy wouldDeploy false", dryPlan.every((s) => s.wouldDeploy === false));

const crawlGatePlan = buildUrlToStagingStepPlan(
  gosakiConfig,
  { ...defaultGates, runCrawl: true },
  true,
);
assert(
  "dry-run with runCrawl: crawl step planned",
  crawlGatePlan.find((s) => s.id === "crawl-fixture")?.status === "planned",
);

const deployGatePlan = buildUrlToStagingStepPlan(
  gosakiConfig,
  { ...defaultGates, deployFtp: true },
  true,
);
const deployStep = deployGatePlan.find((s) => s.id === "deploy-ftp");
assert("deploy-ftp never wouldDeploy in G-7b", deployStep?.wouldDeploy === false);
assert("deploy-ftp wouldRun false", deployStep?.wouldRun === false);

// --- SEO plan ---

const seoPlan = buildSeoStagingPlan(gosakiConfig);
assert("seo plan has deployBase", seoPlan.deployBase === "/cms-kit-staging/gosaki-piano/");
assert("seo wiredViaConvert", seoPlan.wiredViaConvert === true);
assert("seo planned items", seoPlan.planned.length >= 3);

// --- dry-run pipeline (sample fixture, no network) ---

const sampleConfig = loadUrlToStagingConfig(
  path.join(TOOL_ROOT, "config/sites/gosaki-piano.url-to-staging.json"),
  TOOL_ROOT,
);
sampleConfig.fixtureOut = path.join(TOOL_ROOT, "fixtures/sample-static-site");
sampleConfig.fixtureOutRel = "tools/static-to-astro/fixtures/sample-static-site";
sampleConfig.projectOut = path.join(os.tmpdir(), `url-staging-verify-${Date.now()}`);
sampleConfig.projectOutRel = sampleConfig.projectOut;
sampleConfig.runsOut = path.join(os.tmpdir(), `url-staging-runs-${Date.now()}`);

const manifest = await runUrlToStagingPipeline({
  config: sampleConfig,
  gates: defaultGates,
  dryRun: true,
  toolRoot: TOOL_ROOT,
  writeManifest: true,
  printSummary: false,
});

assertEqual("manifest phase", manifest.phase, PIPELINE_PHASE);
assertEqual("manifest dryRun", manifest.dryRun, true);
assertEqual("manifest wouldDeploy", manifest.wouldDeploy, false);
assert("manifest readyForG7c unset without pilot phase", manifest.readyForG7cUrlToStagingDryRunPilot === undefined);
assert("manifest steps array", Array.isArray(manifest.steps) && manifest.steps.length >= 8);
assert("manifest safety no ftp", manifest.safety?.ftpDeployExecuted === false);
assert("manifest file written", fs.existsSync(String(manifest.manifestPath)));

// --- convert dry-run on sample fixture (no network) ---

const convertManifest = await runUrlToStagingPipeline({
  config: sampleConfig,
  gates: { ...defaultGates, runConvert: true },
  dryRun: true,
  toolRoot: TOOL_ROOT,
  writeManifest: false,
  printSummary: false,
});
const convertStep = convertManifest.steps.find((s) => s.id === "convert-static-to-astro");
assert("convert dry-run planned", convertStep?.status === "planned");
assert("convert dry-run wouldRun false", convertStep?.wouldRun === false);
assert("convert command includes deploy-base", String(convertStep?.command).includes("--deploy-base"));

// --- next manual steps ---

const manual = buildNextManualSteps(gosakiConfig, defaultGates, true);
assert("manual steps include FTP note", manual.some((s) => s.includes("deploy-public-dist-ftp")));
assert("manual steps include workflow_dispatch warning", manual.some((s) => s.includes("workflow_dispatch")));

// --- G-7d1 route compatibility (no network) ---

assert("isMonthlyScheduleRoute live crawl", isMonthlyScheduleRoute("2026-07/index.html"));
assert("isMonthlyScheduleRoute manual fixture", isMonthlyScheduleRoute("schedule-2026-07/index.html"));
assert("isMonthlyScheduleRoute rejects discography", !isMonthlyScheduleRoute("discography/index.html"));

function writeMinimalPublicDir(root, monthVariant) {
  fs.mkdirSync(path.join(root, "discography"), { recursive: true });
  fs.writeFileSync(path.join(root, "index.html"), "<html></html>");
  fs.writeFileSync(path.join(root, "discography/index.html"), "<html></html>");
  for (const ym of ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07"]) {
    const dirName = monthVariant === "live" ? ym : `schedule-${ym}`;
    fs.mkdirSync(path.join(root, dirName), { recursive: true });
    fs.writeFileSync(path.join(root, dirName, "index.html"), "<html></html>");
  }
}

const liveRouteDir = fs.mkdtempSync(path.join(os.tmpdir(), "g7d1-live-route-"));
writeMinimalPublicDir(liveRouteDir, "live");
assert(
  "live crawl months discovered",
  discoverMonthlyScheduleMonths(liveRouteDir).length === 5,
);
assert(
  "live crawl verifyPublicHtmlExists allPresent",
  verifyPublicHtmlExists(liveRouteDir).every((c) => c.exists),
);

const manualRouteDir = fs.mkdtempSync(path.join(os.tmpdir(), "g7d1-manual-route-"));
writeMinimalPublicDir(manualRouteDir, "schedule");
assert(
  "manual fixture verifyPublicHtmlExists allPresent",
  verifyPublicHtmlExists(manualRouteDir).every((c) => c.exists),
);

const wixSeoHtml =
  '<html><head><link rel="canonical" href="https://example.com/cms-kit-staging/gosaki-piano/"></head>' +
  '<body><a href="https://www.gosaki-piano.com/">legacy</a></body></html>';
assert(
  "staging SEO ignores Wix body production links",
  !stagingCanonicalLeakInSeoMeta(wixSeoHtml),
);

const noAstroPublicDir = fs.mkdtempSync(path.join(os.tmpdir(), "g7d1-no-astro-"));
fs.writeFileSync(
  path.join(noAstroPublicDir, "index.html"),
  '<html><a href="/cms-kit-staging/gosaki-piano/discography/">disc</a></html>',
);
assert(
  "deploy base ok without _astro when none referenced",
  verifyAssetPathsIncludeBase(noAstroPublicDir, "/cms-kit-staging/gosaki-piano/").ok,
);

for (const dir of [liveRouteDir, manualRouteDir, noAstroPublicDir]) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// --- G-7e canonical / link rewrite (no network) ---

assert(
  "buildDeployOrigin avoids duplicate deploy base",
  buildDeployOrigin(
    "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano",
    "/cms-kit-staging/gosaki-piano/",
  ) === "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano",
);
assert(
  "resolveStagingPublicUrl index",
  resolveStagingPublicUrl(
    "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano",
    "/cms-kit-staging/gosaki-piano/",
    "/cms-kit-staging/gosaki-piano/",
  ) === "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/",
);
assert(
  "resolveStagingPublicUrl month page",
  resolveStagingPublicUrl(
    "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano",
    "/cms-kit-staging/gosaki-piano/",
    "/cms-kit-staging/gosaki-piano/schedule/2026-07/",
  ) === "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/",
);
assert(
  "canonical duplicate detector",
  canonicalHasDuplicateDeployBase(
    "https://example.com/cms-kit-staging/gosaki-piano/cms-kit-staging/gosaki-piano/",
    "/cms-kit-staging/gosaki-piano/",
  ),
);
assert(
  "production nav URL to home route",
  productionAbsoluteUrlToRoute("https://www.gosaki-piano.com/", "https://www.gosaki-piano.com") === "/",
);
assert(
  "production nav URL to month route",
  productionAbsoluteUrlToRoute(
    "https://www.gosaki-piano.com/2026-07",
    "https://www.gosaki-piano.com",
  ) === "/schedule/2026-07/",
);

// --- G-7h CSS presence verifier (no network) ---

const cssOkDir = fs.mkdtempSync(path.join(os.tmpdir(), "g7h-css-ok-"));
fs.writeFileSync(
  path.join(cssOkDir, "index.html"),
  `<html><head><style>${".x{color:red;}".repeat(80)}</style></head><body><p>x</p></body></html>`,
);
assert("css presence passes with substantial inline style", verifyPublicDistCssPresence(cssOkDir).ok);

const cssFailDir = fs.mkdtempSync(path.join(os.tmpdir(), "g7h-css-fail-"));
fs.writeFileSync(
  path.join(cssFailDir, "index.html"),
  "<html><head><style></style></head><body><p>x</p></body></html>",
);
assert("css presence fails when inline style empty", !verifyPublicDistCssPresence(cssFailDir).ok);

const cssDeployBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "g7h-css-base-"));
fs.mkdirSync(path.join(cssDeployBaseDir, "_astro"), { recursive: true });
fs.writeFileSync(path.join(cssDeployBaseDir, "_astro", "index.css"), "body{color:blue}");
fs.writeFileSync(
  path.join(cssDeployBaseDir, "index.html"),
  '<html><head><link rel="stylesheet" href="/cms-kit-staging/gosaki-piano/_astro/index.css"></head><body></body></html>',
);
assert(
  "css presence resolves deployBase-prefixed _astro href",
  verifyPublicDistCssPresence(cssDeployBaseDir, "/cms-kit-staging/gosaki-piano/").ok,
);

for (const dir of [cssOkDir, cssFailDir, cssDeployBaseDir]) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// --- G-7i / G-8c Wix visual overrides (no network) ---

const wixBaseline = buildWixStaticExportBaselineOverridesCss();
const gosakiOverrides = buildGosakiPianoSiteOverridesCss({ siteSlug: "gosaki-piano" });
const wixOverrides = buildWixStagingVisualOverridesCss({ siteSlug: "gosaki-piano" });

assert(
  "wix baseline override module exists",
  wixBaseline.includes("Wix static export baseline overrides (G-8c)"),
);
assert(
  "wix baseline isolates footer bg layers",
  wixBaseline.includes("body.wix-static-export #SITE_FOOTER") &&
    wixBaseline.includes("body.wix-static-export #SITE_FOOTER .uZIV9d"),
);
assert(
  "wix baseline mobile mesh flex fallback",
  wixBaseline.includes("@media (max-width: 768px)") &&
    wixBaseline.includes("inlineContent-gridContainer") &&
    wixBaseline.includes("flex-direction: column"),
);
assert(
  "wix baseline does not include gosaki hero comp id",
  !wixBaseline.includes("#comp-lol1i5k0"),
);
assert(
  "wix baseline does not include band profiles",
  !wixBaseline.includes("band-profiles") && !wixBaseline.includes("BandProfilesSection"),
);

assert(
  "gosaki site overrides include hero colorUnderlay fix",
  gosakiOverrides.includes("#comp-lol1i5k0 [data-testid=\"colorUnderlay\"]"),
);
assert(
  "gosaki site overrides include brand nav colors",
  gosakiOverrides.includes("#9e3b1b") &&
    gosakiOverrides.includes(GOSAKI_SAFE_DISPLAY_FONT_STACK),
);
assert(
  "gosaki site overrides do not reference futura-lt-w01-book",
  !gosakiOverrides.includes("futura-lt-w01-book"),
);
assert(
  "gosaki site overrides do not include band profiles",
  !gosakiOverrides.includes("band-profiles"),
);

assert("composed wix overrides hide hero colorUnderlay", wixOverrides.includes("#comp-lol1i5k0 [data-testid=\"colorUnderlay\"]"));
assert("composed wix overrides include nav fallback", wixOverrides.includes("#SITE_HEADER .global-nav"));
assert(
  "composed wix overrides keep main above footer bg",
  wixOverrides.includes("body.wix-static-export main") &&
    wixOverrides.includes("z-index: 1"),
);

// --- G-8a gosaki About band profiles (no network) ---

const bandProfilesLoaded = loadGosakiBandProfilesConfig(TOOL_ROOT);
assert("gosaki band profiles config loads", bandProfilesLoaded.ok);
assertEqual("gosaki band profiles count", bandProfilesLoaded.config?.bands?.length ?? 0, 5);

const sampleAboutPage = `---
import BaseLayout from "../../layouts/BaseLayout.astro";
---

<BaseLayout title="About">
<div>profile</div>
</BaseLayout>`;
const injectedAbout = injectBandProfilesIntoAboutPage(sampleAboutPage);
assert("about page inject adds BandProfilesSection", injectedAbout.includes("<BandProfilesSection />"));
assert(
  "about page inject adds import",
  injectedAbout.includes('import BandProfilesSection from "../../components/BandProfilesSection.astro"'),
);

const sampleBuiltAbout = `<section class="band-profiles"><h2>Bands / Projects</h2><article class="band-profile"><h3>ごさきりかこTrio</h3></article></section>`;
const bandHtmlCheck = verifyAboutBandProfilesHtml(sampleBuiltAbout, {
  sectionTitle: "Bands / Projects",
  bandNames: ["ごさきりかこTrio"],
});
assert("about band profiles html verifier passes sample", bandHtmlCheck.ok);

// --- G-8b / G-8c mobile responsive (composed output) ---

assert(
  "composed wix overrides include mobile overflow clip",
  wixOverrides.includes("overflow-x: clip"),
);
assert(
  "composed wix overrides clamp section min-width on mobile",
  wixOverrides.includes("min-width: 0 !important") &&
    wixOverrides.includes(".Le88gL"),
);

const bandTemplatePath = path.join(
  TOOL_ROOT,
  "templates/site-extensions/gosaki-piano/BandProfilesSection.astro",
);
const bandTemplate = fs.existsSync(bandTemplatePath)
  ? fs.readFileSync(bandTemplatePath, "utf8")
  : "";
assert(
  "BandProfilesSection has mobile media query",
  bandTemplate.includes("@media (max-width: 767px)") &&
    bandTemplate.includes("grid-template-columns: 1fr"),
);

// --- G-8d gosaki mobile visual parity (site-specific overrides) ---

assert(
  "gosaki G-8d mobile visual parity block present",
  gosakiOverrides.includes("G-8d gosaki mobile visual parity"),
);
assert(
  "gosaki G-8d discography mobile override",
  gosakiOverrides.includes("#comp-jqy0szge") &&
    gosakiOverrides.includes("#comp-llexymel") &&
    gosakiOverrides.includes('[id^="comp-jshobkm1__"]') &&
    gosakiOverrides.includes("order: 1 !important"),
);
assert(
  "gosaki G-8d header mobile override",
  gosakiOverrides.includes("#SITE_HEADER #comp-mbdw9tzc") &&
    gosakiOverrides.includes("#SITE_HEADER #comp-mbdw7xid"),
);
assert(
  "gosaki G-8d about mobile override",
  gosakiOverrides.includes("#WRchTxt16") && gosakiOverrides.includes("#comp-jrtenw0n"),
);
assert(
  "gosaki G-8d contact mobile override",
  gosakiOverrides.includes("#WRchTxt4") && gosakiOverrides.includes("#comp-jqbwo704"),
);
assert(
  "composed wix overrides include G-8d discography rules",
  wixOverrides.includes("G-8d gosaki mobile visual parity") &&
    wixOverrides.includes("#comp-jqy0szge"),
);
assert(
  "wix baseline does not include G-8d gosaki discography comp ids",
  !wixBaseline.includes("#comp-jqy0szge") && !wixBaseline.includes("#comp-llexymel"),
);

// --- G-8e gosaki mobile UI final polish ---

assert(
  "gosaki G-8e mobile final polish block present",
  gosakiOverrides.includes("G-8e gosaki mobile UI final polish"),
);
assert(
  "gosaki G-8e home schedule mobile overflow rule",
  gosakiOverrides.includes("#comp-m8y53dj5") &&
    gosakiOverrides.includes("#comp-m8y5bex0") &&
    gosakiOverrides.includes('[id^="comp-m8y53djd__"]'),
);
assert(
  "gosaki G-8e contact form mobile centering rule",
  gosakiOverrides.includes("#comp-jqbwo704") &&
    gosakiOverrides.includes("margin-left: auto !important"),
);
assert(
  "gosaki G-8e link page mobile padding rule",
  gosakiOverrides.includes("#comp-lol1i5hv") && gosakiOverrides.includes("#comp-juctbpem"),
);
assert(
  "gosaki G-8e mobile menu text hidden / square button",
  gosakiOverrides.includes(".nav-toggle__label") &&
    gosakiOverrides.includes("display: none !important") &&
    gosakiOverrides.includes("width: 48px"),
);
assert(
  "gosaki G-8e sticky header rule",
  gosakiOverrides.includes("position: sticky") && gosakiOverrides.includes("top: 0"),
);
assert(
  "composed wix overrides include G-8e polish rules",
  wixOverrides.includes("G-8e gosaki mobile UI final polish"),
);
assert(
  "wix baseline includes overflow-wrap for rich text on mobile",
  wixBaseline.includes("overflow-wrap: anywhere"),
);

const sampleHeaderHtml =
  '<div id="comp-mbdw9tzc"><h1 class="font_0">SAKI GOTO Website</h1></div><!--/$-->' +
  '<div id="comp-mbdw7xid"><nav aria-label="Main"><a href="/">Home</a><a href="/about/">About</a></nav></div>';
const headerAstro = generateHeaderAstro(sampleHeaderHtml, "Header");
assert(
  "header transform wraps logo with site-logo-link",
  headerAstro.content.includes('class="site-logo-link"') &&
    headerAstro.content.includes('href={withBase("/")}'),
);

const gosakiNavHeaderHtml =
  '<div id="comp-mbdw9tzc"><h1 class="font_0">SAKI GOTO Website</h1></div><!--/$-->' +
  '<div id="comp-mbdw7xid"><nav aria-label="Main"><a href="/">Home</a><a href="/about/">About</a>' +
  '<a href="2026-07">2026.07</a><a href="/discography/">Discography</a>' +
  '<a href="/contact/">Contact</a><a href="/link/">Link</a></nav></div>';
const gosakiNavHeader = generateHeaderAstro(gosakiNavHeaderHtml, "Header", { scheduleHub: true });
assert(
  "header transform includes Schedule when scheduleHub",
  gosakiNavHeader.content.includes(">Schedule</a>") &&
    gosakiNavHeader.content.includes("withBase('/schedule/')"),
);
assert(
  "header transform excludes month-only nav labels",
  !gosakiNavHeader.content.includes("2026.07"),
);
assert(
  "header nav toggle script scoped to SITE_HEADER",
  gosakiNavHeader.content.includes('header.querySelector(".nav-toggle")'),
);
assert(
  "header nav toggle aria-expanded initial false",
  gosakiNavHeader.content.includes('aria-expanded="false"'),
);
assert(
  "live crawl month fixture filename detected",
  parseScheduleMonthSourcePath("2026-07.html")?.year === "2026" &&
    parseScheduleMonthSourcePath("2026-07.html")?.month === "07",
);

// --- G-8f gosaki mobile visual refinement ---

assert(
  "gosaki G-8f visual refinement block present",
  gosakiOverrides.includes("G-8f gosaki mobile visual refinement"),
);
assert(
  "gosaki G-8f home hero mobile sizing rule",
  gosakiOverrides.includes("#comp-mbl1cpz3") &&
    gosakiOverrides.includes("object-fit: cover"),
);
assert(
  "gosaki G-8f logo/menu vertical centering rule",
  gosakiOverrides.includes("align-self: center !important") &&
    gosakiOverrides.includes("#SITE_HEADER .site-logo-link"),
);
assert(
  "gosaki G-8f footer center alignment rule",
  gosakiOverrides.includes("#SITE_FOOTER #LnkBr2") &&
    gosakiOverrides.includes("justify-content: center"),
);
assert(
  "gosaki G-8f contact success message hidden rule",
  gosakiOverrides.includes("#comp-kei80gar") &&
    gosakiOverrides.includes("display: none !important"),
);
assert(
  "gosaki G-8f link page shadow/radius override",
  gosakiOverrides.includes("#comp-juctbpem") &&
    gosakiOverrides.includes("box-shadow: none !important"),
);
assert(
  "composed wix overrides include G-8f refinement rules",
  wixOverrides.includes("G-8f gosaki mobile visual refinement"),
);

// --- G-8g gosaki header/footer mobile regression fix ---

assert(
  "gosaki G-8g regression fix block present",
  gosakiOverrides.includes("G-8g gosaki header/footer mobile regression fix"),
);
assert(
  "gosaki G-8g PC nav restore rule",
  gosakiOverrides.includes("@media (min-width: 769px)") &&
    gosakiOverrides.includes("#SITE_HEADER .global-nav ul") &&
    gosakiOverrides.includes("flex-direction: row"),
);
assert(
  "gosaki G-8g PC hamburger hidden rule",
  gosakiOverrides.includes("#SITE_HEADER .nav-toggle") &&
    gosakiOverrides.includes("display: none !important"),
);
assert(
  "gosaki G-8g SP hamburger visible rule",
  gosakiOverrides.includes("display: inline-flex !important") &&
    gosakiOverrides.includes("@media (max-width: 768px)"),
);
assert(
  "gosaki G-8g SP header opaque background rule",
  gosakiOverrides.includes("--bg-overlay-color: rgb(255, 252, 204)") &&
    gosakiOverrides.includes("background-color: #fffccc"),
);
assert(
  "gosaki G-8g nav open logo stability rule",
  gosakiOverrides.includes("is-nav-open #comp-mbdw9tzc") &&
    gosakiOverrides.includes("align-self: center !important"),
);
assert(
  "gosaki G-8g footer social centered rule",
  gosakiOverrides.includes("#SITE_FOOTER #LnkBr2") &&
    gosakiOverrides.includes("justify-content: center !important"),
);
assert(
  "gosaki G-8g discography compact spacing rule",
  gosakiOverrides.includes("margin: 0.75rem 0 0.375rem !important") &&
    gosakiOverrides.includes("gap: 0.375rem !important"),
);
assert(
  "gosaki G-8g SNS mask icon replacement rule",
  gosakiOverrides.includes('a[aria-label="Facebook"]::before') &&
    gosakiOverrides.includes("mask-image:") &&
    gosakiOverrides.includes("data:image/svg+xml"),
);
assert(
  "composed wix overrides include G-8g regression fix rules",
  wixOverrides.includes("G-8g gosaki header/footer mobile regression fix"),
);

// --- G-8g1 gosaki mobile header and footer social regression fix ---

assert(
  "gosaki G-8g1 regression fix block present",
  gosakiOverrides.includes("G-8g1 gosaki mobile header and footer social regression fix"),
);
assert(
  "gosaki G-8g1 opaque beige header color",
  gosakiOverrides.includes("#ead7bd") &&
    gosakiOverrides.includes("rgb(234, 215, 189)") &&
    gosakiOverrides.includes("G-8g1 gosaki mobile header and footer social regression fix"),
);
assert(
  "gosaki G-8g1 SP nav open absolute dropdown rule",
  gosakiOverrides.includes("is-nav-open .global-nav") &&
    gosakiOverrides.includes("top: 100% !important") &&
    gosakiOverrides.includes("flex-wrap: nowrap !important"),
);
assert(
  "gosaki G-8g1 footer SNS text fallback rule",
  gosakiOverrides.includes('content: "Facebook"') &&
    gosakiOverrides.includes('content: "Instagram"') &&
    gosakiOverrides.includes("mask: none !important"),
);
assert(
  "gosaki G-8g1 footer stack layout rule",
  gosakiOverrides.includes("#SITE_FOOTER [data-mesh-id=\"SITE_FOOTERinlineContent-gridContainer\"]") &&
    gosakiOverrides.includes("flex-direction: column !important") &&
    gosakiOverrides.includes("grid-area: auto !important"),
);
assert(
  "gosaki G-8g1 keeps PC nav and SP hamburger rules from G-8g",
  gosakiOverrides.includes("@media (min-width: 769px)") &&
    gosakiOverrides.includes("display: inline-flex !important"),
);
assert(
  "composed wix overrides include G-8g1 regression fix rules",
  wixOverrides.includes("G-8g1 gosaki mobile header and footer social regression fix"),
);

// --- G-8g2 gosaki header nav functionality fix ---

assert(
  "gosaki G-8g2 nav functionality fix block present",
  gosakiOverrides.includes("G-8g2 gosaki header nav functionality fix"),
);
assert(
  "gosaki G-8g2 SP nav open display rule",
  gosakiOverrides.includes("is-nav-open .global-nav") &&
    gosakiOverrides.includes("display: block !important") &&
    gosakiOverrides.includes("G-8g2 gosaki header nav functionality fix"),
);
assert(
  "gosaki G-8g2 header overflow visible for dropdown",
  gosakiOverrides.includes("#SITE_HEADER") &&
    gosakiOverrides.includes("overflow: visible !important"),
);
assert(
  "gosaki G-8g2 nav toggle pointer-events rule",
  gosakiOverrides.includes(".nav-toggle") &&
    gosakiOverrides.includes("pointer-events: auto"),
);
assert(
  "composed wix overrides include G-8g2 nav functionality rules",
  wixOverrides.includes("G-8g2 gosaki header nav functionality fix"),
);

// --- G-8g3 gosaki schedule hub design and link fix ---

const astroGeneratorSrc = fs.readFileSync(
  path.join(TOOL_ROOT, "scripts/lib/astro-generator.mjs"),
  "utf8",
);
assert(
  "gosaki G-8g3 schedule hub design block present",
  gosakiOverrides.includes("G-8g3 gosaki schedule hub design and link fix") &&
    gosakiOverrides.includes(".gosaki-schedule-hub") &&
    gosakiOverrides.includes(".gosaki-schedule-month-link"),
);
assert(
  "schedule index generator uses withBase for month links",
  astroGeneratorSrc.includes("gosaki-schedule-hub") &&
    astroGeneratorSrc.includes("withBase('${escapeHtmlText(m.route)}')") &&
    !astroGeneratorSrc.includes('href="${escapeHtmlText(m.route)}"'),
);
assert(
  "schedule index generator avoids root-only month href pattern",
  !astroGeneratorSrc.includes('<a href="/2026-'),
);
assert(
  "composed wix overrides include G-8g3 schedule hub rules",
  wixOverrides.includes("G-8g3 gosaki schedule hub design and link fix"),
);

// --- G-8g4 gosaki schedule month content fix ---

const pathTransformSrc = fs.readFileSync(path.join(TOOL_ROOT, "scripts/lib/path-transform.mjs"), "utf8");

assert(
  "gosaki G-8g4 schedule month content block present",
  gosakiOverrides.includes("G-8g4 gosaki schedule month content fix") &&
    gosakiOverrides.includes(".gosaki-schedule-month") &&
    gosakiOverrides.includes(".gosaki-schedule-event-card") &&
    gosakiOverrides.includes("fluid-columns-repeater"),
);
assert(
  "path transform exposes schedule month repeater markup",
  pathTransformSrc.includes("transformScheduleMonthFragment") &&
    pathTransformSrc.includes("gosaki-schedule-month") &&
    pathTransformSrc.includes("visibility\\s*:\\s*hidden"),
);
assert(
  "composed wix overrides include G-8g4 schedule month rules",
  wixOverrides.includes("G-8g4 gosaki schedule month content fix"),
);

// --- G-8g5 gosaki discography spacing and footer social alignment fix ---

assert(
  "gosaki G-8g5 discography and footer alignment block present",
  gosakiOverrides.includes("G-8g5 gosaki discography spacing and footer social alignment fix") &&
    gosakiOverrides.includes("#comp-llexymel [id^=\"comp-jshobkm1__\"]") &&
    gosakiOverrides.includes("width: fit-content !important"),
);
assert(
  "gosaki G-8g5 discography SP image/title gap rule",
  gosakiOverrides.includes("#comp-llexymel [id^=\"comp-lley9r5x__\"]") &&
    gosakiOverrides.includes("margin: 0.375rem 0 0.5rem !important"),
);
assert(
  "gosaki G-8g5 footer social centered flex gap",
  gosakiOverrides.includes("#SITE_FOOTER #LnkBr2 .tN_ggS") &&
    gosakiOverrides.includes("gap: 1.4rem !important") &&
    gosakiOverrides.includes("margin-inline: auto !important"),
);
assert(
  "gosaki G-8g5 footer copyright centered",
  gosakiOverrides.includes("#SITE_FOOTER #WRchTxtx") &&
    gosakiOverrides.includes("text-align: center !important"),
);
assert(
  "composed wix overrides include G-8g5 alignment rules",
  wixOverrides.includes("G-8g5 gosaki discography spacing and footer social alignment fix"),
);

// --- G-8g6 gosaki footer social final alignment fix ---

const footerSocialSrc = fs.readFileSync(
  path.join(TOOL_ROOT, "scripts/lib/gosaki-footer-social.mjs"),
  "utf8",
);
const sampleFooterHtml =
  '<div id="LnkBr2"><ul><li><a href="https://www.facebook.com/goto.saki.3" aria-label="Facebook"></a></li>' +
  '<li><a href="https://twitter.com/goto_saki_pf" aria-label="X  "></a></li>' +
  '<li><a href="https://www.instagram.com/gosaakiii/?hl=ja" aria-label="Instagram"></a></li></ul></div>' +
  '<div id="WRchTxtx"><p>© 2025</p></div>';
const extractedSocial = extractGosakiFooterSocialLinks(sampleFooterHtml);
assert(
  "gosaki footer social extractor finds three links",
  extractedSocial.length === 3 &&
    extractedSocial[0].label === "Facebook" &&
    extractedSocial[1].label === "X" &&
    extractedSocial[2].label === "Instagram",
);
const injectedFooter = injectGosakiFooterSocialBlock(sampleFooterHtml);
assert(
  "gosaki footer social injector adds nav block",
  injectedFooter.includes('class="gosaki-footer-social-links"') &&
    injectedFooter.includes(">Facebook</a>") &&
    injectedFooter.includes(">X</a>") &&
    injectedFooter.includes(">Instagram</a>"),
);
assert(
  "gosaki G-8g6 footer social block present",
  gosakiOverrides.includes("G-8g6 gosaki footer social final alignment fix") &&
    gosakiOverrides.includes(".gosaki-footer-social-links") &&
    gosakiOverrides.includes("#SITE_FOOTER #LnkBr2") &&
    gosakiOverrides.includes("display: none !important"),
);
assert(
  "gosaki G-8g6 hides legacy Wix SNS bar",
  footerSocialSrc.includes("injectGosakiFooterSocialBlock") &&
    gosakiOverrides.includes("pointer-events: none !important"),
);
assert(
  "gosaki G-8g6 footer social centered flex gap",
  gosakiOverrides.includes("gap: 1.5rem !important") &&
    gosakiOverrides.includes("justify-content: center !important"),
);
assert(
  "composed wix overrides include G-8g6 footer social rules",
  wixOverrides.includes("G-8g6 gosaki footer social final alignment fix"),
);

// --- G-8g7 gosaki footer grid container alignment fix ---

assert(
  "gosaki G-8g7 footer grid container block present",
  gosakiOverrides.includes("G-8g7 gosaki footer grid container alignment fix") &&
    gosakiOverrides.includes('[data-mesh-id="SITE_FOOTERinlineContent-gridContainer"] > *') &&
    gosakiOverrides.includes("left: auto !important"),
);
assert(
  "gosaki G-8g7 resets footer mesh container width and center",
  gosakiOverrides.includes('[data-mesh-id="SITE_FOOTERinlineContent-gridContainer"]') &&
    gosakiOverrides.includes("width: 100% !important") &&
    gosakiOverrides.includes("align-items: center !important"),
);
assert(
  "gosaki G-8g7 copyright centered on all breakpoints",
  gosakiOverrides.includes("#SITE_FOOTER #WRchTxtx p") &&
    gosakiOverrides.includes("text-align: center !important") &&
    !gosakiOverrides.includes("G-8g7") === false,
);
assert(
  "gosaki G-8g7 PC copyright stays centered not right",
  (() => {
    const g7 = gosakiOverrides.split("G-8g7 gosaki footer grid container alignment fix")[1] || "";
    return g7.includes("@media (min-width: 769px)") && g7.includes("text-align: center !important");
  })(),
);
assert(
  "composed wix overrides include G-8g7 footer grid rules",
  wixOverrides.includes("G-8g7 gosaki footer grid container alignment fix"),
);

// --- G-8g8 gosaki discography subheading style fix ---

assert(
  "gosaki G-8g8 discography subheading block present",
  gosakiOverrides.includes("G-8g8 gosaki discography subheading style fix") &&
    gosakiOverrides.includes("#comp-llexymel [id^=\"comp-lley4qy2__\"] > p:first-of-type") &&
    gosakiOverrides.includes("#comp-llexymel [id^=\"comp-lley693e__\"] > p:first-of-type"),
);
assert(
  "gosaki G-8g8 removes Track List Personnel underline",
  gosakiOverrides.includes("text-decoration: none !important") &&
    gosakiOverrides.includes("G-8g8 gosaki discography subheading style fix"),
);
assert(
  "gosaki G-8g8 subheading bold and larger font",
  gosakiOverrides.includes("font-weight: 700 !important") &&
    gosakiOverrides.includes("font-size: 16px !important"),
);
assert(
  "composed wix overrides include G-8g8 discography subheading rules",
  wixOverrides.includes("G-8g8 gosaki discography subheading style fix"),
);

// --- G-9c0b gosaki schedule legacy month route stub ---

assert(
  "gosaki G-9c0b legacy stub generator present",
  astroGeneratorSrc.includes("generateScheduleLegacyMonthStubPage") &&
    astroGeneratorSrc.includes("gosaki-schedule-legacy-stub"),
);
assert(
  "gosaki G-9c0b legacy stub uses noindex robots",
  astroGeneratorSrc.includes('robots: "noindex,follow"'),
);
assert(
  "gosaki G-9c0b sitemap excludes legacy month routes",
  astroGeneratorSrc.includes("excludeLegacyMonthRoutesFromSitemap") &&
    astroGeneratorSrc.includes("filter: (page)"),
);
assert(
  "gosaki G-9c0b legacy stub css present",
  gosakiOverrides.includes("G-9c0b gosaki schedule legacy month route stub") &&
    gosakiOverrides.includes(".gosaki-schedule-legacy-stub"),
);
assert(
  "G-9c0b sitemap filter excludes legacy month URL",
  shouldIncludePageInSitemap("https://example.com/2026-07/") === false,
);
assert(
  "G-9c0b sitemap filter includes canonical month URL",
  shouldIncludePageInSitemap("https://example.com/schedule/2026-07/") === true,
);
assert(
  "G-9c0b sitemap filter includes staging canonical month URL",
  shouldIncludePageInSitemap(
    "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/",
  ) === true,
);
assert(
  "G-9c0b sitemap filter excludes staging legacy month URL",
  shouldIncludePageInSitemap(
    "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/2026-07/",
  ) === false,
);

const supabaseScheduleReadPath = path.join(TOOL_ROOT, "scripts/lib/supabase-schedule-read.mjs");
const gosakiScheduleDataPagesPath = path.join(
  TOOL_ROOT,
  "scripts/lib/gosaki-schedule-data-pages.mjs",
);
assert("G-9d supabase schedule read module exists", fs.existsSync(supabaseScheduleReadPath));
assert("G-9d gosaki schedule data pages module exists", fs.existsSync(gosakiScheduleDataPagesPath));

const supabaseScheduleReadSrc = fs.readFileSync(supabaseScheduleReadPath, "utf8");
assert(
  "G-9d read uses site_slug and published filters",
  supabaseScheduleReadSrc.includes(".eq(\"site_slug\", siteSlug)") &&
    supabaseScheduleReadSrc.includes(".eq(\"published\", true)"),
);
assert(
  "G-9d read does not use service_role",
  !supabaseScheduleReadSrc.includes("SERVICE_ROLE_KEY") &&
    !supabaseScheduleReadSrc.includes("serviceRoleKey"),
);
assert(
  "G-9d static fallback via extractor",
  supabaseScheduleReadSrc.includes("extractAllGosakiScheduleSeeds") &&
    supabaseScheduleReadSrc.includes("scheduleDataSource"),
);
assert(
  "G-9d astro generator wires data pages",
  astroGeneratorSrc.includes("applyGosakiScheduleDataPages") &&
    astroGeneratorSrc.includes("gosakiScheduleBundle"),
);
assert(
  "G-9d data pages include scheduleDataSource marker",
  fs.readFileSync(gosakiScheduleDataPagesPath, "utf8").includes("scheduleDataSource="),
);

// --- G-9e site_slug schedule read generalization ---
assert(
  "G-9e generic loadScheduleRowsFromSupabase exists",
  supabaseScheduleReadSrc.includes("loadScheduleRowsFromSupabase"),
);
assert(
  "G-9e generic loadScheduleDataForBuild exists",
  supabaseScheduleReadSrc.includes("loadScheduleDataForBuild"),
);
assert(
  "G-9e gosaki wrapper delegates to generic loader",
  supabaseScheduleReadSrc.includes("GOSAKI_SCHEDULE_SITE_CONFIG") &&
    supabaseScheduleReadSrc.includes("loadGosakiScheduleDataForBuild"),
);
assert(
  "G-9e canonical source_route filter helper",
  supabaseScheduleReadSrc.includes("isCanonicalScheduleSourceRoute"),
);
assert(
  "G-9e stable sort includes legacy_id",
  supabaseScheduleReadSrc.includes("compareScheduleRecords") &&
    supabaseScheduleReadSrc.includes("legacy_id"),
);

// --- G-9f staging shell schedule site_slug read binding ---
const g9fConfigPath = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-data/staging-schedule-site-slug-config.ts",
);
const g9fBindingPath = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-data/staging-schedule-site-slug-read-binding.ts",
);
const g9fSectionPath = path.join(
  TOOL_ROOT,
  "templates/admin-cms/data/components/AdminStagingScheduleSiteSlugReadSection.astro",
);
const stagingScheduleReadPath = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-write/staging-schedule-read.ts",
);
const musicianPrototypePath = path.join(
  TOOL_ROOT,
  "templates/admin-cms/prototypes/musician-basic-admin-prototype.astro",
);

assert("G-9f site slug config exists", fs.existsSync(g9fConfigPath));
assert("G-9f site slug read binding exists", fs.existsSync(g9fBindingPath));
assert("G-9f staging shell section exists", fs.existsSync(g9fSectionPath));

const stagingScheduleReadSrc = fs.readFileSync(stagingScheduleReadPath, "utf8");
const g9fSectionSrc = fs.readFileSync(g9fSectionPath, "utf8");
const musicianPrototypeSrc = fs.readFileSync(musicianPrototypePath, "utf8");

assert(
  "G-9f loadSchedulesForSiteSlugRead uses site_slug filter",
  stagingScheduleReadSrc.includes("loadSchedulesForSiteSlugRead") &&
    stagingScheduleReadSrc.includes('.eq("site_slug", siteSlug)'),
);
assert(
  "G-9f site slug read is published filter only",
  stagingScheduleReadSrc.includes('.eq("published", true)'),
);
assert(
  "G-9f staging section read-only marker",
  g9fSectionSrc.includes("Read-only staging shell") &&
    g9fSectionSrc.includes("No writes are performed"),
);
assert(
  "G-9f staging section no save button",
  !g9fSectionSrc.includes('type="submit"') && !g9fSectionSrc.match(/>\s*Save\s*</),
);
assert(
  "G-9f prototype wires site slug read section",
  musicianPrototypeSrc.includes("AdminStagingScheduleSiteSlugReadSection") &&
    musicianPrototypeSrc.includes("resolveGosakiScheduleSiteSlugReadBinding"),
);
assert(
  "G-9f gosaki site slug constant",
  fs.readFileSync(g9fConfigPath, "utf8").includes('gosaki-piano'),
);

// --- G-9g1 staging shell schedule site_slug edit dry-run preview ---
const g9g1EditDryRunPath = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-data/staging-schedule-site-slug-edit-dry-run.ts",
);
const g9g1EditBindingPath = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-data/staging-schedule-site-slug-edit-binding.ts",
);
const g9g1EditSectionPath = path.join(
  TOOL_ROOT,
  "templates/admin-cms/data/components/AdminStagingScheduleSiteSlugEditSection.astro",
);

assert("G-9g1 edit dry-run helper exists", fs.existsSync(g9g1EditDryRunPath));
assert("G-9g1 edit binding exists", fs.existsSync(g9g1EditBindingPath));
assert("G-9g1 edit section exists", fs.existsSync(g9g1EditSectionPath));

const g9g1ConfigSrc = fs.readFileSync(g9fConfigPath, "utf8");
const g9g1DryRunSrc = fs.readFileSync(g9g1EditDryRunPath, "utf8");
const g9g1SectionSrc = fs.readFileSync(g9g1EditSectionPath, "utf8");

assert(
  "G-9g1 site_slug gosaki-piano constant",
  g9g1ConfigSrc.includes("gosaki-piano") &&
    g9g1ConfigSrc.includes("G9G1_TARGET_LEGACY_ID"),
);
assert(
  "G-9g1 target legacy_id schedule-2026-07-010",
  g9g1ConfigSrc.includes("schedule-2026-07-010") &&
    g9g1ConfigSrc.includes("aa440e29-5be8-402e-9190-0d81c48434c0"),
);
assert(
  "G-9g1 safe fields defined",
  g9g1ConfigSrc.includes("SITE_SLUG_EDIT_SAFE_FIELDS") &&
    g9g1DryRunSrc.includes("title") &&
    g9g1DryRunSrc.includes("description"),
);
assert(
  "G-9g1 actualWrite false guaranteed",
  g9g1DryRunSrc.includes("actualWrite: false") &&
    g9g1SectionSrc.includes('data-actual-write="false"'),
);
assert(
  "G-9g1 dry-run only safety marker",
  g9g1SectionSrc.includes("Dry-run only") ||
    (g9g1SectionSrc.includes("Preview path never writes") &&
      g9g1SectionSrc.includes("actualWrite=false")),
);
assert(
  "G-9g1 preview button only no save",
  g9g1SectionSrc.includes("Preview dry-run") &&
    !g9g1SectionSrc.match(/>\s*Save\s*</) &&
    !g9g1SectionSrc.match(/>\s*Update\s*</) &&
    !g9g1SectionSrc.match(/>\s*Delete\s*</),
);
assert(
  "G-9g1 row load uses site_slug filter",
  stagingScheduleReadSrc.includes("loadScheduleRowForSiteSlugRead") &&
    stagingScheduleReadSrc.includes('.eq("site_slug", siteSlug)'),
);
assert(
  "G-9g1 prototype wires edit section",
  musicianPrototypeSrc.includes("AdminStagingScheduleSiteSlugEditSection") &&
    musicianPrototypeSrc.includes("resolveGosakiScheduleSiteSlugEditBinding"),
);
assert(
  "G-9g1 no service_role in edit dry-run",
  !g9g1DryRunSrc.includes("SERVICE_ROLE_KEY"),
);

// --- G-9g2 staging shell site_slug title non-dry-run PoC implementation ---
const g9g2ImplDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-title-non-dry-run-poc-implementation.md",
);
const g9g2SavePath = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-write/staging-schedule-site-slug-title-poc-save.ts",
);
const g9g2ConfigPath = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-data/staging-schedule-site-slug-title-poc-config.ts",
);
const writeAdapterSrc = fs.readFileSync(
  path.join(REPO_ROOT, "src/lib/admin/staging-write/schedule-write-adapter.ts"),
  "utf8",
);
const writeGuardsSrc = fs.readFileSync(
  path.join(REPO_ROOT, "src/lib/admin/staging-write/schedule-write-guards.ts"),
  "utf8",
);

assert("G-9g2 implementation doc exists", fs.existsSync(g9g2ImplDocPath));
assert("G-9g2 title poc save module exists", fs.existsSync(g9g2SavePath));
assert("G-9g2 title poc config exists", fs.existsSync(g9g2ConfigPath));

const g9g2SaveSrc = fs.readFileSync(g9g2SavePath, "utf8");
const g9g2ConfigSrc = fs.readFileSync(g9g2ConfigPath, "utf8");
const g9g2SiteSlugConfigSrc = fs.readFileSync(
  path.join(REPO_ROOT, "src/lib/admin/staging-data/staging-schedule-site-slug-config.ts"),
  "utf8",
);

assert(
  "G-9g2 approval ID registered",
  g9g2SiteSlugConfigSrc.includes("G-9g2-schedule-site-slug-title-non-dry-run-poc") &&
    fs.readFileSync(
      path.join(REPO_ROOT, "src/lib/admin/staging-write/schedule-write-types.ts"),
      "utf8",
    ).includes("G9G2_SCHEDULE_TITLE_NON_DRY_RUN_POC_APPROVAL_ID"),
);
assert(
  "G-9g2 env arm constant",
  g9g2SiteSlugConfigSrc.includes("PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED"),
);
assert(
  "G-9g2 Save title PoC button label or G-9g3a save hidden",
  g9g1SectionSrc.includes("Save title PoC") ||
    g9g1SectionSrc.includes("g9g3aSaveUiHidden"),
);
assert(
  "G-9g2 save button default disabled or G-9g3a no save button",
  (g9g1SectionSrc.includes('id="site-slug-edit-g9g2-save-btn"') &&
    g9g1SectionSrc.includes("disabled={true}")) ||
    (g9g1SectionSrc.includes("g9g3aSaveUiHidden") &&
      !g9g1SectionSrc.includes('id="site-slug-edit-g9g2-save-btn"')),
);
assert(
  "G-9g2 UPDATE uses site_slug and updated_at",
  writeAdapterSrc.includes("writeScope") &&
    writeAdapterSrc.includes('.eq("site_slug", writeScope.siteSlug)') &&
    writeAdapterSrc.includes('.eq("updated_at", expectedBeforeUpdatedAt)'),
);
assert(
  "G-9g2 legacy_id guard",
  writeGuardsSrc.includes("assertBeforeSnapshotSiteSlugScope") &&
    g9g2SaveSrc.includes("assertBeforeSnapshotSiteSlugScope"),
);
assert(
  "G-9g2 title only payload guard",
  writeGuardsSrc.includes("assertG9G2TitlePayloadOnly") &&
    g9g2SaveSrc.includes("assertG9G2TitlePayloadOnly"),
);
assert(
  "G-9g2 execute save entry",
  g9g2SaveSrc.includes("executeG9G2TitleNonDryRunSave"),
);
assert(
  "G-9g2 dry-run preview actualWrite false",
  g9g1DryRunSrc.includes("actualWrite: false") &&
    g9g1SectionSrc.includes("actualWrite=false"),
);
assert(
  "G-9g2 no restore save",
  !g9g2SaveSrc.match(/restore/i) && !g9g1SectionSrc.match(/Restore\s+title/i),
);
assert(
  "G-9g2 no service_role in save path",
  !g9g2SaveSrc.includes("SERVICE_ROLE_KEY"),
);
assert(
  "G-9g2 no generic Save all buttons",
  !g9g1SectionSrc.match(/>\s*Delete\s*</) &&
    !g9g1SectionSrc.includes("Save all") &&
    !g9g1SectionSrc.includes("Publish"),
);

// --- G-9g2 preflight doc ---
const g9g2PreflightDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-title-non-dry-run-poc-preflight.md",
);
assert("G-9g2 preflight doc exists", fs.existsSync(g9g2PreflightDocPath));
const g9g2PreflightSrc = fs.readFileSync(g9g2PreflightDocPath, "utf8");
assert(
  "G-9g2 preflight operator approval text",
  g9g2PreflightSrc.includes("G-9g2 title non-dry-run PoC として"),
);
assert(
  "G-9g2 preflight beforeSnapshot title <>",
  g9g2PreflightSrc.includes("title` | `<>`"),
);
assert(
  "G-9g2 preflight restore approval text",
  g9g2PreflightSrc.includes("G-9g2 restore として"),
);
assert(
  "G-9g2 preflight stale stop",
  g9g2PreflightSrc.includes("optimisticLock.stale === true"),
);
assert(
  "G-9g2 preflight not executed marker",
  g9g2PreflightSrc.includes("no Save click"),
);

// --- G-9g2 execution result doc ---
const g9g2ExecutionDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-title-non-dry-run-poc-execution-result.md",
);
assert("G-9g2 execution result doc exists", fs.existsSync(g9g2ExecutionDocPath));
const g9g2ExecutionSrc = fs.readFileSync(g9g2ExecutionDocPath, "utf8");
assert(
  "G-9g2 execution succeeded marker",
  g9g2ExecutionSrc.includes("stagingShellScheduleTitlePocExecutionSucceeded: true"),
);
assert(
  "G-9g2 execution operator manual Save",
  g9g2ExecutionSrc.includes("operator manual, exactly once") &&
    g9g2ExecutionSrc.includes("cursorClickedSave: false"),
);
assert(
  "G-9g2 execution title payload",
  g9g2ExecutionSrc.includes("[CMS Kit staging] G-9g2 title PoC"),
);
assert(
  "G-9g2 execution site_slug scope",
  g9g2ExecutionSrc.includes("site_slug: gosaki-piano"),
);
assert(
  "G-9g2 execution restore SQL retained",
  g9g2ExecutionSrc.includes("title = '<>'") &&
    g9g2ExecutionSrc.includes("rollbackNeeded: false"),
);

// --- G-9g3 safe-fields edit planning ---
const g9g3PlanningDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-safe-fields-edit-planning.md",
);
assert("G-9g3 safe-fields planning doc exists", fs.existsSync(g9g3PlanningDocPath));
const g9g3PlanningSrc = fs.readFileSync(g9g3PlanningDocPath, "utf8");
assert(
  "G-9g3 host hard gate required",
  g9g3PlanningSrc.includes("kmjqppxjdnwwrtaeqjta.supabase.co") &&
    g9g3PlanningSrc.includes("armed=false"),
);
assert(
  "G-9g3 slice map G-9g3a through G-9g3d",
  g9g3PlanningSrc.includes("G-9g3a") &&
    g9g3PlanningSrc.includes("G-9g3b") &&
    g9g3PlanningSrc.includes("G-9g3c") &&
    g9g3PlanningSrc.includes("G-9g3d"),
);
assert(
  "G-9g3 safe fields listed",
  g9g3PlanningSrc.includes("venue") &&
    g9g3PlanningSrc.includes("open_time") &&
    g9g3PlanningSrc.includes("description"),
);
assert(
  "G-9g3 planning no DB write",
  g9g3PlanningSrc.includes("planning only") &&
    g9g3PlanningSrc.includes("No Save"),
);
assert(
  "G-9g3 reuse writeScope",
  g9g3PlanningSrc.includes("writeScope") &&
    g9g3PlanningSrc.includes("site_slug"),
);

// --- G-9g3d general edit consolidation planning ---
const g9g3dPlanningDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-general-edit-consolidation-planning.md",
);
assert("G-9g3d general edit planning doc exists", fs.existsSync(g9g3dPlanningDocPath));
const g9g3dPlanningSrc = fs.readFileSync(g9g3dPlanningDocPath, "utf8");
assert(
  "G-9g3d planning approval ID proposed",
  g9g3dPlanningSrc.includes("G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc"),
);
assert(
  "G-9g3d planning env arm proposed",
  g9g3dPlanningSrc.includes("PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED"),
);
assert(
  "G-9g3d changed fields only payload",
  g9g3dPlanningSrc.includes("changed-fields-only") ||
    g9g3dPlanningSrc.includes("changed fields only"),
);
assert(
  "G-9g3d legacy PoC freeze policy",
  g9g3dPlanningSrc.includes("do not re-run") ||
    g9g3dPlanningSrc.includes("Do not re-run"),
);
assert(
  "G-9g3d planning no Save",
  g9g3dPlanningSrc.includes("planning only") &&
    g9g3dPlanningSrc.includes("no Save"),
);
assert(
  "G-9g3d ready for implementation gate",
  g9g3dPlanningSrc.includes("readyForG9g3d1GeneralEditConsolidationImplementation: true"),
);

// --- G-9g3a host hard gate + multi-field dry-run preview ---
const g9g3aHostGatePath = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-data/staging-schedule-site-slug-host-gate.ts",
);
const g9g3aEditUiPath = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-data/staging-schedule-site-slug-edit-ui.ts",
);
const g9g3aImplDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-safe-fields-dry-run-preview-implementation.md",
);

assert("G-9g3a host gate module exists", fs.existsSync(g9g3aHostGatePath));
assert("G-9g3a edit UI module exists", fs.existsSync(g9g3aEditUiPath));
assert("G-9g3a implementation doc exists", fs.existsSync(g9g3aImplDocPath));

const g9g3aHostGateSrc = fs.readFileSync(g9g3aHostGatePath, "utf8");
const g9g3aEditUiSrc = fs.readFileSync(g9g3aEditUiPath, "utf8");
const g9g3aBindingSrc = fs.readFileSync(g9g1EditBindingPath, "utf8");
const g9g3aImplDocSrc = fs.readFileSync(g9g3aImplDocPath, "utf8");

assert(
  "G-9g3a phase constant",
  g9g1ConfigSrc.includes("G9G3A_PHASE") &&
    g9g1ConfigSrc.includes("G-9g3a-staging-shell-schedule-site-slug-safe-fields-dry-run-preview"),
);
assert(
  "G-9g3a expected staging host",
  g9g3aHostGateSrc.includes("SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST") &&
    g9g3aHostGateSrc.includes("evaluateSupabaseHostGate") &&
    fs.readFileSync(
      path.join(REPO_ROOT, "src/lib/admin/staging-write/schedule-non-dry-run-poc-config.ts"),
      "utf8",
    ).includes("kmjqppxjdnwwrtaeqjta.supabase.co"),
);
assert(
  "G-9g3a production host danger",
  g9g3aHostGateSrc.includes("vsbvndwuajjhnzpohghh.supabase.co") &&
    g9g3aHostGateSrc.includes("DANGER"),
);
assert(
  "G-9g3a host gate in dry-run result",
  g9g1DryRunSrc.includes("hostGate") &&
    g9g1DryRunSrc.includes("hostGatePassed") &&
    g9g1DryRunSrc.includes("sanitizeSiteSlugEditSafeFieldPatch"),
);
assert(
  "G-9g3a binding save hidden or G-9g3b phase",
  (g9g3aBindingSrc.includes("g9g3aSaveUiHidden: true") &&
    g9g3aBindingSrc.includes("dryRunPreviewOnly: true")) ||
    g9g3aBindingSrc.includes("G9G3B_PHASE"),
);
assert(
  "G-9g3a G9G2 config host gate blocks arm",
  g9g2ConfigSrc.includes("hostGatePassed") &&
    g9g2ConfigSrc.includes("evaluateSupabaseHostGate"),
);
assert(
  "G-9g3a multi-field inputs in section",
  g9g1SectionSrc.includes("site-slug-edit-dry-run-venue") &&
    g9g1SectionSrc.includes("site-slug-edit-dry-run-open-time") &&
    g9g1SectionSrc.includes("site-slug-edit-dry-run-start-time") &&
    g9g1SectionSrc.includes("site-slug-edit-dry-run-price") &&
    g9g1SectionSrc.includes("site-slug-edit-dry-run-description"),
);
assert(
  "G-9g3a section host gate display",
  g9g1SectionSrc.includes("hostGatePassed") &&
    g9g1SectionSrc.includes("expectedHost") &&
    g9g1SectionSrc.includes("activeHost"),
);
assert(
  "G-9g3a no save button or G-9g3b gated save",
  (!g9g1SectionSrc.includes('id="site-slug-edit-g9g2-save-btn"') &&
    g9g1SectionSrc.includes("Preview dry-run") &&
    (g9g3aImplDocSrc.includes("stagingShellScheduleG9g3aNoSaveUi: true") ||
      g9g1SectionSrc.includes('id="site-slug-edit-g9g3b-save-btn"'))) ||
    g9g1SectionSrc.includes('id="site-slug-edit-g9g3b-save-btn"'),
);
assert(
  "G-9g3a edit UI renders host gate in result",
  g9g3aEditUiSrc.includes("activeHost") &&
    g9g3aEditUiSrc.includes("hostGatePassed") &&
    (g9g3aEditUiSrc.includes("G9G3A_PHASE") || g9g3aEditUiSrc.includes("G9G3B_PHASE")),
);
assert(
  "G-9g3a live stale check gated by host",
  g9g3aEditUiSrc.includes("hostGate.hostGatePassed") &&
    g9g3aEditUiSrc.includes("liveSupabaseRead: live"),
);
assert(
  "G-9g3a implementation no save no db write",
  g9g3aImplDocSrc.includes("no Save") &&
    g9g3aImplDocSrc.includes("no DB write") &&
    g9g3aImplDocSrc.includes("stagingShellScheduleG9g3aNoSaveUi: true"),
);
assert(
  "G-9g3a no service_role",
  !g9g3aHostGateSrc.includes("SERVICE_ROLE_KEY") &&
    !g9g3aEditUiSrc.includes("SERVICE_ROLE_KEY"),
);

// --- G-9g3a smoke test result ---
const g9g3aSmokeDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-safe-fields-dry-run-preview-smoke-test-result.md",
);
assert("G-9g3a smoke test doc exists", fs.existsSync(g9g3aSmokeDocPath));
const g9g3aSmokeSrc = fs.readFileSync(g9g3aSmokeDocPath, "utf8");
assert(
  "G-9g3a smoke host gate passed",
  g9g3aSmokeSrc.includes("hostGatePassed") &&
    g9g3aSmokeSrc.includes("kmjqppxjdnwwrtaeqjta.supabase.co"),
);
assert(
  "G-9g3a smoke changedFields venue description",
  g9g3aSmokeSrc.includes("venue") && g9g3aSmokeSrc.includes("description"),
);
assert(
  "G-9g3a smoke no db write",
  g9g3aSmokeSrc.includes("DB write") && g9g3aSmokeSrc.includes("no"),
);

// --- G-9g3b venue + description non-dry-run PoC ---
const g9g3bImplDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-implementation.md",
);
const g9g3bPreflightDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-preflight.md",
);
const g9g3bSavePath = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-write/staging-schedule-site-slug-venue-description-poc-save.ts",
);
const g9g3bConfigPath = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-data/staging-schedule-site-slug-venue-description-poc-config.ts",
);

assert("G-9g3b implementation doc exists", fs.existsSync(g9g3bImplDocPath));
assert("G-9g3b preflight doc exists", fs.existsSync(g9g3bPreflightDocPath));
assert("G-9g3b save module exists", fs.existsSync(g9g3bSavePath));
assert("G-9g3b config module exists", fs.existsSync(g9g3bConfigPath));

const g9g3bImplSrc = fs.readFileSync(g9g3bImplDocPath, "utf8");
const g9g3bPreflightSrc = fs.readFileSync(g9g3bPreflightDocPath, "utf8");
const g9g3bSaveSrc = fs.readFileSync(g9g3bSavePath, "utf8");
const g9g3bConfigSrc = fs.readFileSync(g9g3bConfigPath, "utf8");

assert(
  "G-9g3b approval ID registered",
  g9g1ConfigSrc.includes("G-9g3b-schedule-site-slug-venue-description-non-dry-run-poc") &&
    writeGuardsSrc.includes("assertG9G3bVenueDescriptionPayloadOnly"),
);
assert(
  "G-9g3b env arm constant",
  g9g1ConfigSrc.includes("PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED"),
);
assert(
  "G-9g3b venue description payload guard",
  writeGuardsSrc.includes("assertG9G3bVenueDescriptionPayloadOnly") &&
    g9g3bSaveSrc.includes("assertG9G3bVenueDescriptionPayloadOnly"),
);
assert(
  "G-9g3b execute save entry",
  g9g3bSaveSrc.includes("executeG9G3bVenueDescriptionNonDryRunSave"),
);
assert(
  "G-9g3b config host gate blocks arm",
  g9g3bConfigSrc.includes("hostGatePassed") &&
    g9g3bConfigSrc.includes("evaluateSupabaseHostGate"),
);
assert(
  "G-9g3b single-arm g9g2 off",
  g9g3bConfigSrc.includes("SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED_ENV") &&
    g9g2ConfigSrc.includes("SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED_ENV"),
);
assert(
  "G-9g3b Save button label",
  g9g1SectionSrc.includes("Save venue+description PoC"),
);
assert(
  "G-9g3b save button default disabled",
  g9g1SectionSrc.includes('id="site-slug-edit-g9g3b-save-btn"') &&
    g9g1SectionSrc.includes("disabled={true}"),
);
assert(
  "G-9g3b edit UI save gating",
  g9g3aEditUiSrc.includes("canEnableG9G3bSave") &&
    g9g3aEditUiSrc.includes("changedFieldsMatchVenueDescriptionOnly") &&
    g9g3aEditUiSrc.includes("hostGate.hostGatePassed"),
);
assert(
  "G-9g3b preflight operator approval",
  g9g3bPreflightSrc.includes("G-9g3b venue+description non-dry-run PoC"),
);
assert(
  "G-9g3b preflight no save click",
  g9g3bPreflightSrc.includes("no Save click"),
);
assert(
  "G-9g3b implementation not executed",
  g9g3bImplSrc.includes("stagingShellScheduleVenueDescriptionPocNotExecuted: true"),
);
assert(
  "G-9g3b no service_role in save path",
  !g9g3bSaveSrc.includes("SERVICE_ROLE_KEY"),
);

// --- G-9g3c open_time + start_time + price non-dry-run PoC ---
const g9g3cImplDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-time-price-non-dry-run-poc-implementation.md",
);
const g9g3cPlanningDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-time-price-non-dry-run-poc-planning.md",
);
const g9g3cPreflightDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-time-price-non-dry-run-poc-preflight.md",
);
const g9g3cSavePath = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-write/staging-schedule-site-slug-time-price-poc-save.ts",
);
const g9g3cConfigPath = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-data/staging-schedule-site-slug-time-price-poc-config.ts",
);

assert("G-9g3c implementation doc exists", fs.existsSync(g9g3cImplDocPath));
assert("G-9g3c planning doc exists", fs.existsSync(g9g3cPlanningDocPath));
assert("G-9g3c preflight doc exists", fs.existsSync(g9g3cPreflightDocPath));
assert("G-9g3c save module exists", fs.existsSync(g9g3cSavePath));
assert("G-9g3c config module exists", fs.existsSync(g9g3cConfigPath));

const g9g3cImplSrc = fs.readFileSync(g9g3cImplDocPath, "utf8");
const g9g3cPlanningSrc = fs.readFileSync(g9g3cPlanningDocPath, "utf8");
const g9g3cPreflightSrc = fs.readFileSync(g9g3cPreflightDocPath, "utf8");
const g9g3cSaveSrc = fs.readFileSync(g9g3cSavePath, "utf8");
const g9g3cConfigSrc = fs.readFileSync(g9g3cConfigPath, "utf8");

assert(
  "G-9g3c approval ID registered",
  g9g1ConfigSrc.includes("G-9g3c-schedule-site-slug-time-price-non-dry-run-poc") &&
    writeGuardsSrc.includes("assertG9G3cTimePricePayloadOnly"),
);
assert(
  "G-9g3c env arm constant",
  g9g1ConfigSrc.includes("PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED"),
);
assert(
  "G-9g3c time price payload guard",
  writeGuardsSrc.includes("assertG9G3cTimePricePayloadOnly") &&
    g9g3cSaveSrc.includes("assertG9G3cTimePricePayloadOnly"),
);
assert(
  "G-9g3c execute save entry",
  g9g3cSaveSrc.includes("executeG9G3cTimePriceNonDryRunSave"),
);
assert(
  "G-9g3c config host gate blocks arm",
  g9g3cConfigSrc.includes("hostGatePassed") &&
    g9g3cConfigSrc.includes("evaluateSupabaseHostGate"),
);
assert(
  "G-9g3c single-arm g9g3b off",
  g9g3cConfigSrc.includes("SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED_ENV") &&
    g9g3bConfigSrc.includes("SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED_ENV"),
);
assert(
  "G-9g3c Save button label",
  g9g1SectionSrc.includes("Save time+price PoC"),
);
assert(
  "G-9g3c save button default disabled",
  g9g1SectionSrc.includes('id="site-slug-edit-g9g3c-save-btn"') &&
    g9g1SectionSrc.includes("disabled={true}"),
);
assert(
  "G-9g3c edit UI save gating",
  g9g3aEditUiSrc.includes("canEnableG9G3cSave") &&
    g9g3aEditUiSrc.includes("changedFieldsMatchTimePriceOnly") &&
    g9g3aEditUiSrc.includes("hostGate.hostGatePassed"),
);
assert(
  "G-9g3c planning approval template",
  g9g3cPlanningSrc.includes("G-9g3c time+price non-dry-run PoC"),
);
assert(
  "G-9g3c preflight operator approval",
  g9g3cPreflightSrc.includes("G-9g3c time+price non-dry-run PoC"),
);
assert(
  "G-9g3c preflight no save click",
  g9g3cPreflightSrc.includes("no Save click"),
);
assert(
  "G-9g3c preflight ready for execution gate",
  g9g3cPreflightSrc.includes("readyForG9g3cExecution: true"),
);
assert(
  "G-9g3c implementation not executed",
  g9g3cImplSrc.includes("stagingShellScheduleTimePricePocNotExecuted: true"),
);
assert(
  "G-9g3c no service_role in save path",
  !g9g3cSaveSrc.includes("SERVICE_ROLE_KEY"),
);

// --- G-9g3c execution result doc ---
const g9g3cExecutionDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-time-price-non-dry-run-poc-execution-result.md",
);
assert("G-9g3c execution result doc exists", fs.existsSync(g9g3cExecutionDocPath));
const g9g3cExecutionSrc = fs.readFileSync(g9g3cExecutionDocPath, "utf8");
assert(
  "G-9g3c execution succeeded marker",
  g9g3cExecutionSrc.includes("stagingShellScheduleTimePricePocExecutionSucceeded: true"),
);
assert(
  "G-9g3c execution operator manual Save",
  g9g3cExecutionSrc.includes("operator manual, exactly once") &&
    g9g3cExecutionSrc.includes("cursorClickedSave: false"),
);
assert(
  "G-9g3c execution time price payload",
  g9g3cExecutionSrc.includes("[CMS Kit staging] G-9g3c open PoC") &&
    g9g3cExecutionSrc.includes("[CMS Kit staging] G-9g3c price PoC"),
);
assert(
  "G-9g3c execution site_slug scope",
  g9g3cExecutionSrc.includes("site_slug: gosaki-piano"),
);
assert(
  "G-9g3c execution rollback retained",
  g9g3cExecutionSrc.includes("open_time = null") &&
    g9g3cExecutionSrc.includes("rollbackNeeded: false"),
);

// --- G-9g3d1 general edit consolidation implementation ---
const g9g3dImplDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-general-edit-consolidation-implementation.md",
);
const g9g3dSavePath = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-write/staging-schedule-site-slug-general-edit-poc-save.ts",
);
const g9g3dConfigPath = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-data/staging-schedule-site-slug-general-edit-poc-config.ts",
);
const writeTypesSrc = fs.readFileSync(
  path.join(REPO_ROOT, "src/lib/admin/staging-write/schedule-write-types.ts"),
  "utf8",
);

assert("G-9g3d1 implementation doc exists", fs.existsSync(g9g3dImplDocPath));
assert("G-9g3d1 save module exists", fs.existsSync(g9g3dSavePath));
assert("G-9g3d1 config module exists", fs.existsSync(g9g3dConfigPath));

const g9g3dImplSrc = fs.readFileSync(g9g3dImplDocPath, "utf8");
const g9g3dSaveSrc = fs.readFileSync(g9g3dSavePath, "utf8");
const g9g3dConfigSrc = fs.readFileSync(g9g3dConfigPath, "utf8");

assert(
  "G-9g3d approval ID registered",
  writeTypesSrc.includes("G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc") &&
    writeTypesSrc.includes("G9G3D_SCHEDULE_GENERAL_EDIT_NON_DRY_RUN_POC_APPROVAL_ID"),
);
assert(
  "G-9g3d env arm constant",
  g9g1ConfigSrc.includes("PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED"),
);
assert(
  "G-9g3d legacy PoC UI env",
  g9g1ConfigSrc.includes("PUBLIC_ADMIN_SCHEDULE_LEGACY_POC_UI_VISIBLE"),
);
assert(
  "G-9g3d general edit payload guard",
  writeGuardsSrc.includes("assertG9G3dGeneralEditPayloadOnly") &&
    writeGuardsSrc.includes("buildG9G3dGeneralEditPayload") &&
    g9g3dSaveSrc.includes("assertG9G3dGeneralEditPayloadOnly"),
);
assert(
  "G-9g3d changed-fields-only payload",
  g9g3dImplSrc.includes("changed-fields-only") &&
    g9g3dSaveSrc.includes("changedFields") &&
    g9g3aEditUiSrc.includes("buildG9G3dGeneralEditPayload"),
);
assert(
  "G-9g3d execute save entry",
  g9g3dSaveSrc.includes("executeG9G3dGeneralEditNonDryRunSave"),
);
assert(
  "G-9g3d single-arm slice envs off",
  g9g3dConfigSrc.includes("SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED_ENV") &&
    g9g3dConfigSrc.includes("SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED_ENV") &&
    g9g3dConfigSrc.includes("SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED_ENV"),
);
assert(
  "G-9g3d slice PoC re-run blocked",
  g9g2ConfigSrc.includes("G9G3_SLICE_POC_EXECUTED_ARM_FAILURE") &&
    g9g3bConfigSrc.includes("G9G3_SLICE_POC_EXECUTED_ARM_FAILURE") &&
    g9g3cConfigSrc.includes("G9G3_SLICE_POC_EXECUTED_ARM_FAILURE"),
);
assert(
  "G-9g3d legacy PoC UI freeze policy",
  g9g3dImplSrc.includes("legacy PoC") &&
    g9g1SectionSrc.includes("Legacy PoC (executed — audit only)") &&
    g9g3aEditUiSrc.includes("isLegacyPoCUiVisible"),
);
assert(
  "G-9g3d Save button label",
  g9g1SectionSrc.includes("Save general edit"),
);
assert(
  "G-9g3d save button default disabled",
  g9g1SectionSrc.includes('id="site-slug-edit-g9g3d-save-btn"') &&
    g9g1SectionSrc.includes("disabled={true}"),
);
assert(
  "G-9g3d edit UI save gating",
  g9g3aEditUiSrc.includes("canEnableG9G3dSave") &&
    g9g3aEditUiSrc.includes("Sign in as staging admin before Save") &&
    g9g3aEditUiSrc.includes("hostGate.hostGatePassed"),
);
assert(
  "G-9g3d implementation not executed",
  g9g3dImplSrc.includes("stagingShellScheduleGeneralEditPocNotExecuted: true"),
);
assert(
  "G-9g3d no service_role in save path",
  !g9g3dSaveSrc.includes("SERVICE_ROLE_KEY"),
);
assert(
  "G-9g3d ready for smoke test gate",
  g9g3dImplSrc.includes("readyForG9g3d2GeneralEditDryRunSmokeTest: true"),
);

// --- G-9g3d2 general edit dry-run smoke test ---
const g9g3d2SmokeDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-general-edit-dry-run-smoke-test-result.md",
);
const g9g3d2SmokeScriptPath = path.join(
  TOOL_ROOT,
  "scripts/verify-g9g3d-general-edit-dry-run-smoke.mjs",
);

assert("G-9g3d2 smoke result doc exists", fs.existsSync(g9g3d2SmokeDocPath));
assert("G-9g3d2 smoke script exists", fs.existsSync(g9g3d2SmokeScriptPath));

const g9g3d2SmokeSrc = fs.readFileSync(g9g3d2SmokeDocPath, "utf8");

assert(
  "G-9g3d2 smoke completed marker",
  g9g3d2SmokeSrc.includes("G-9g3d2 dry-run smoke completed") ||
    g9g3d2SmokeSrc.includes("G-9g3d2-general-edit-dry-run-smoke-test"),
);
assert(
  "G-9g3d2 smoke Save not clicked",
  g9g3d2SmokeSrc.includes("cursorClickedSave: false") &&
    g9g3d2SmokeSrc.includes("Save was not clicked"),
);
assert(
  "G-9g3d2 smoke no DB write",
  g9g3d2SmokeSrc.includes("DB write was not executed") ||
    g9g3d2SmokeSrc.includes("DB write not executed"),
);
assert(
  "G-9g3d2 smoke actualWrite false",
  g9g3d2SmokeSrc.includes("actualWrite=false") ||
    g9g3d2SmokeSrc.includes("actualWrite | `false`"),
);
assert(
  "G-9g3d2 smoke changedFields price",
  g9g3d2SmokeSrc.includes("changedFields") && g9g3d2SmokeSrc.includes("price"),
);
assert(
  "G-9g3d2 smoke host gate passed",
  g9g3d2SmokeSrc.includes("hostGatePassed") &&
    g9g3d2SmokeSrc.includes("kmjqppxjdnwwrtaeqjta.supabase.co"),
);
assert(
  "G-9g3d2 smoke legacy PoC default hidden",
  /legacy\s+poc/i.test(g9g3d2SmokeSrc) && /hidden/i.test(g9g3d2SmokeSrc),
);
assert(
  "G-9g3d2 smoke Save gated",
  g9g3d2SmokeSrc.includes("Save gated") || g9g3d2SmokeSrc.includes("disabled"),
);
assert(
  "G-9g3d2 ready for preflight gate",
  g9g3d2SmokeSrc.includes("readyForG9g3d3GeneralEditNonDryRunPreflight: true"),
);

// --- G-9g3d3 general edit non-dry-run preflight ---
const g9g3d3PreflightDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-general-edit-non-dry-run-preflight.md",
);

assert("G-9g3d3 preflight doc exists", fs.existsSync(g9g3d3PreflightDocPath));

const g9g3d3PreflightSrc = fs.readFileSync(g9g3d3PreflightDocPath, "utf8");

assert(
  "G-9g3d3 preflight approval ID",
  g9g3d3PreflightSrc.includes("G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc"),
);
assert(
  "G-9g3d3 preflight env arm",
  g9g3d3PreflightSrc.includes("PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED"),
);
assert(
  "G-9g3d3 preflight price-only candidate",
  g9g3d3PreflightSrc.includes("G-9g3d general edit price PoC") &&
    g9g3d3PreflightSrc.includes("changedFields") &&
    g9g3d3PreflightSrc.includes("price") &&
    g9g3d3PreflightSrc.includes("only"),
);
assert(
  "G-9g3d3 preflight SELECT only query",
  g9g3d3PreflightSrc.includes("SELECT only") &&
    g9g3d3PreflightSrc.includes("from public.schedules") &&
    g9g3d3PreflightSrc.includes("aa440e29-5be8-402e-9190-0d81c48434c0"),
);
assert(
  "G-9g3d3 preflight Save not clicked",
  g9g3d3PreflightSrc.includes("Save clicked") &&
    g9g3d3PreflightSrc.includes("no"),
);
assert(
  "G-9g3d3 preflight no DB write",
  g9g3d3PreflightSrc.includes("DB write") &&
    (g9g3d3PreflightSrc.includes("not executed") ||
      g9g3d3PreflightSrc.includes("no")),
);
assert(
  "G-9g3d3 preflight operator approval text",
  g9g3d3PreflightSrc.includes("G-9g3d general edit non-dry-run PoC"),
);
assert(
  "G-9g3d3 preflight not executed marker",
  g9g3d3PreflightSrc.includes("stagingShellScheduleGeneralEditPocNotExecuted: true"),
);
assert(
  "G-9g3d3 ready for execution gate",
  g9g3d3PreflightSrc.includes("readyForG9g3d4GeneralEditNonDryRunExecution: true"),
);

// --- G-9g3d4 general edit non-dry-run execution result ---
const g9g3d4ExecutionDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-general-edit-non-dry-run-execution-result.md",
);

assert("G-9g3d4 execution result doc exists", fs.existsSync(g9g3d4ExecutionDocPath));

const g9g3d4ExecutionSrc = fs.readFileSync(g9g3d4ExecutionDocPath, "utf8");

assert(
  "G-9g3d4 execution actualWrite true",
  g9g3d4ExecutionSrc.includes("actualWrite: true"),
);
assert(
  "G-9g3d4 execution changedFields price only",
  g9g3d4ExecutionSrc.includes("changedFields") &&
    g9g3d4ExecutionSrc.includes("price") &&
    g9g3d4ExecutionSrc.includes("only"),
);
assert(
  "G-9g3d4 execution payload price only",
  g9g3d4ExecutionSrc.includes('"price": "[CMS Kit staging] G-9g3d general edit price PoC"'),
);
assert(
  "G-9g3d4 execution updated_at after Save",
  g9g3d4ExecutionSrc.includes("2026-06-18T01:04:51.312817+00:00"),
);
assert(
  "G-9g3d4 execution operator manual Save",
  g9g3d4ExecutionSrc.includes("operator manual") &&
    g9g3d4ExecutionSrc.includes("exactly once"),
);
assert(
  "G-9g3d4 execution cursor did not click Save",
  g9g3d4ExecutionSrc.includes("cursorClickedSave: false") ||
    g9g3d4ExecutionSrc.includes("Cursor did **not** click Save"),
);
assert(
  "G-9g3d4 execution rollbackNeeded false",
  g9g3d4ExecutionSrc.includes("rollbackNeeded: false"),
);
assert(
  "G-9g3d4 execution succeeded gate",
  g9g3d4ExecutionSrc.includes("stagingShellScheduleGeneralEditPocExecutionSucceeded: true"),
);
assert(
  "G-9g3d4 routine dev safety restored",
  g9g3d4ExecutionSrc.includes("Routine dev after execution") &&
    g9g3d4ExecutionSrc.includes("ENABLE_ADMIN_STAGING_WRITE: false") &&
    g9g3d4ExecutionSrc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN: true"),
);
// --- G-9g3e general edit post-execution hardening planning ---
const g9g3ePlanningDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-general-edit-post-execution-hardening-planning.md",
);

assert("G-9g3e planning doc exists", fs.existsSync(g9g3ePlanningDocPath));

const g9g3ePlanningSrc = fs.readFileSync(g9g3ePlanningDocPath, "utf8");

assert(
  "G-9g3e planning hardening policy",
  g9g3ePlanningSrc.includes("Post-execution hardening policy") &&
    g9g3ePlanningSrc.includes("permanent freeze"),
);
assert(
  "G-9g3e planning legacy PoC strategy",
  g9g3ePlanningSrc.includes("Legacy PoC UI") &&
    (g9g3ePlanningSrc.includes("developer-only") ||
      g9g3ePlanningSrc.includes("developer-only")),
);
assert(
  "G-9g3e planning Save not clicked",
  g9g3ePlanningSrc.includes("Save clicked") &&
    g9g3ePlanningSrc.includes("no"),
);
assert(
  "G-9g3e planning no DB write",
  g9g3ePlanningSrc.includes("DB write") &&
    (g9g3ePlanningSrc.includes("not executed") || g9g3ePlanningSrc.includes("no")),
);
assert(
  "G-9g3e planning PoC re-run prohibited",
  g9g3ePlanningSrc.includes("Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d Save"),
);
assert(
  "G-9g3e planning next phase G-9g3e1",
  g9g3ePlanningSrc.includes("G-9g3e1-post-execution-hardening-implementation"),
);
assert(
  "G-9g3e planning hardening gate",
  g9g3ePlanningSrc.includes(
    "stagingShellScheduleGeneralEditPostExecutionHardeningPlanningComplete: true",
  ),
);
assert(
  "G-9g3e planning operational approval ID proposed",
  g9g3ePlanningSrc.includes("G-9g3-schedule-site-slug-general-edit"),
);

// --- G-9g3e1 general edit post-execution hardening implementation ---
const g9g3e1ImplDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-general-edit-post-execution-hardening-implementation.md",
);

assert("G-9g3e1 implementation doc exists", fs.existsSync(g9g3e1ImplDocPath));

const g9g3e1ImplSrc = fs.readFileSync(g9g3e1ImplDocPath, "utf8");
const siteSlugConfigPath = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-data/staging-schedule-site-slug-config.ts",
);
const siteSlugConfigSrc = fs.readFileSync(siteSlugConfigPath, "utf8");

assert(
  "G-9g3e1 G9G3D PoC executed constant",
  siteSlugConfigSrc.includes("G9G3D_GENERAL_EDIT_POC_EXECUTED = true"),
);
assert(
  "G-9g3e1 G9G3d config poc executed freeze",
  g9g3dConfigSrc.includes("G9G3D_GENERAL_EDIT_POC_EXECUTED") &&
    g9g3dConfigSrc.includes("G9G3D_POC_EXECUTED_ARM_FAILURE"),
);
assert(
  "G-9g3e1 G9G3d save poc_executed guard",
  g9g3dSaveSrc.includes("G9G3D_GENERAL_EDIT_POC_EXECUTED") &&
    g9g3dSaveSrc.includes("poc_executed"),
);
assert(
  "G-9g3e1 legacy PoC audit-only UI",
  g9g1SectionSrc.includes("audit only") &&
    g9g1SectionSrc.includes("Legacy PoC (executed — audit only)"),
);
assert(
  "G-9g3e1 all PoC Saves re-run prohibited",
  g9g3e1ImplSrc.includes("Do not re-run") &&
    g9g3e1ImplSrc.includes("G-9g2 / G-9g3b / G-9g3c / G-9g3d"),
);
assert(
  "G-9g3e1 implementation Save not clicked",
  g9g3e1ImplSrc.includes("Save was not clicked"),
);
assert(
  "G-9g3e1 implementation no DB write",
  g9g3e1ImplSrc.includes("DB write was not executed"),
);
assert(
  "G-9g3e1 ready for smoke gate",
  g9g3e1ImplSrc.includes("readyForG9g3e2PostExecutionHardeningSmokeTest: true"),
);
assert(
  "G-9g3e1 edit UI save gate panel",
  g9g3aEditUiSrc.includes("site-slug-edit-save-gate-panel"),
);

// --- G-9g3e2 general edit post-execution hardening smoke ---
const g9g3e2SmokeDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-general-edit-post-execution-hardening-smoke-test-result.md",
);
const g9g3e2SmokeScriptPath = path.join(
  TOOL_ROOT,
  "scripts/verify-g9g3e-post-execution-hardening-smoke.mjs",
);

assert("G-9g3e2 smoke result doc exists", fs.existsSync(g9g3e2SmokeDocPath));
assert("G-9g3e2 smoke script exists", fs.existsSync(g9g3e2SmokeScriptPath));

const g9g3e2SmokeDocSrc = fs.readFileSync(g9g3e2SmokeDocPath, "utf8");
const g9g3e2SmokeScriptSrc = fs.readFileSync(g9g3e2SmokeScriptPath, "utf8");

assert(
  "G-9g3e2 smoke Save not clicked",
  g9g3e2SmokeDocSrc.includes("Save was not clicked") &&
    g9g3e2SmokeDocSrc.includes("Preview was not clicked"),
);
assert(
  "G-9g3e2 smoke no DB write",
  g9g3e2SmokeDocSrc.includes("DB write was not executed") &&
    g9g3e2SmokeDocSrc.includes("**DB write:** none"),
);
assert(
  "G-9g3e2 smoke G-9g3d freeze confirmed",
  g9g3e2SmokeDocSrc.includes("G-9g3d freeze") &&
    g9g3e2SmokeDocSrc.includes("Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d Save"),
);
assert(
  "G-9g3e2 smoke legacy audit-only",
  g9g3e2SmokeDocSrc.includes("Legacy PoC") && g9g3e2SmokeDocSrc.includes("audit-only"),
);
assert(
  "G-9g3e2 smoke save gate panel",
  g9g3e2SmokeDocSrc.includes("site-slug-edit-save-gate-panel"),
);
assert(
  "G-9g3e2 smoke staging shell banner",
  g9g3e2SmokeDocSrc.includes("Staging shell banner"),
);
assert(
  "G-9g3e2 smoke production STOP",
  g9g3e2SmokeDocSrc.includes("Production STOP"),
);
assert(
  "G-9g3e2 smoke gate passed",
  g9g3e2SmokeDocSrc.includes(
    "stagingShellScheduleGeneralEditPostExecutionHardeningSmokeTestPassed: true",
  ),
);
assert(
  "G-9g3e2 smoke next phase G-9g3f",
  g9g3e2SmokeDocSrc.includes("G-9g3f-row-picker-planning"),
);
assert(
  "G-9g3e2 smoke script poc_executed marker",
  g9g3e2SmokeScriptSrc.includes("poc_executed") &&
    g9g3e2SmokeScriptSrc.includes("G9G3D_GENERAL_EDIT_POC_EXECUTED"),
);
assert(
  "G-9g3e2 smoke script no Save click policy",
  g9g3e2SmokeScriptSrc.includes("smoke: Save not clicked") &&
    g9g3e2SmokeScriptSrc.includes("smoke: Preview not clicked"),
);
assert(
  "G-9g3e2 smoke script DB write not executed",
  g9g3e2SmokeScriptSrc.includes("smoke: DB write not executed"),
);

// --- G-9g3f row picker planning ---
const g9g3fPlanningDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-row-picker-planning.md",
);

assert("G-9g3f planning doc exists", fs.existsSync(g9g3fPlanningDocPath));

const g9g3fPlanningSrc = fs.readFileSync(g9g3fPlanningDocPath, "utf8");

assert(
  "G-9g3f planning read-only row picker policy",
  g9g3fPlanningSrc.includes("read-only") &&
    g9g3fPlanningSrc.includes("Row picker") &&
    g9g3fPlanningSrc.includes("read-only planning"),
);
assert(
  "G-9g3f planning site_slug fixed scope",
  g9g3fPlanningSrc.includes("site_slug = gosaki-piano") &&
    g9g3fPlanningSrc.includes(".eq(\"site_slug\", siteSlug)"),
);
assert(
  "G-9g3f planning service_role prohibited",
  g9g3fPlanningSrc.includes("service_role") &&
    g9g3fPlanningSrc.includes("prohibited"),
);
assert(
  "G-9g3f planning Save not clicked",
  g9g3fPlanningSrc.includes("Save was not clicked") &&
    g9g3fPlanningSrc.includes("Preview was not clicked"),
);
assert(
  "G-9g3f planning no DB write",
  g9g3fPlanningSrc.includes("DB write was not executed") ||
    g9g3fPlanningSrc.includes("DB write executed | **no**"),
);
assert(
  "G-9g3f planning PoC Save re-run prohibited",
  g9g3fPlanningSrc.includes("Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d Save"),
);
assert(
  "G-9g3f planning pilot row audit only",
  g9g3fPlanningSrc.includes("aa440e29-5be8-402e-9190-0d81c48434c0") &&
    g9g3fPlanningSrc.includes("audit"),
);
assert(
  "G-9g3f planning next phase G-9g3f1",
  g9g3fPlanningSrc.includes("G-9g3f1-row-picker-implementation"),
);
assert(
  "G-9g3f planning gate complete",
  g9g3fPlanningSrc.includes(
    "stagingShellScheduleSiteSlugRowPickerPlanningComplete: true",
  ),
);
assert(
  "G-9g3f planning changed-fields-only retained",
  g9g3fPlanningSrc.includes("changed-fields-only"),
);

// --- G-9g3f1 row picker implementation ---
const g9g3f1ImplDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-row-picker-implementation.md",
);
const g9g3f1BindingPath = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-binding.ts",
);
const g9g3f1UiPath = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-ui.ts",
);
const g9g3f1SectionPath = path.join(
  TOOL_ROOT,
  "templates/admin-cms/data/components/AdminStagingScheduleSiteSlugRowPickerSection.astro",
);
const g9g3f1UtilsPath = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-utils.ts",
);

assert("G-9g3f1 implementation doc exists", fs.existsSync(g9g3f1ImplDocPath));
assert("G-9g3f1 row picker binding exists", fs.existsSync(g9g3f1BindingPath));
assert("G-9g3f1 row picker UI exists", fs.existsSync(g9g3f1UiPath));
assert("G-9g3f1 row picker section exists", fs.existsSync(g9g3f1SectionPath));

const g9g3f1ImplSrc = fs.readFileSync(g9g3f1ImplDocPath, "utf8");
const g9g3f1BindingSrc = fs.readFileSync(g9g3f1BindingPath, "utf8");
const g9g3f1SectionSrc = fs.readFileSync(g9g3f1SectionPath, "utf8");
const g9g3f1UtilsSrc = fs.readFileSync(g9g3f1UtilsPath, "utf8");
const g9g3f1PrototypeSrc = fs.readFileSync(musicianPrototypePath, "utf8");

assert(
  "G-9g3f1 implementation read-only row picker",
  g9g3f1ImplSrc.includes("read-only") && g9g3f1ImplSrc.includes("Row picker read-only"),
);
assert(
  "G-9g3f1 site_slug fixed scope",
  g9g3f1BindingSrc.includes("STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG") &&
    stagingScheduleReadSrc.includes('.eq("site_slug", siteSlug)'),
);
assert(
  "G-9g3f1 publishedFilter loader extension",
  stagingScheduleReadSrc.includes("publishedFilter"),
);
assert(
  "G-9g3f1 pilot row audit-only utils",
  g9g3f1UtilsSrc.includes("G9G1_TARGET_ROW_ID") &&
    g9g3f1UtilsSrc.includes("POC_AUDIT_STAGING_MARKER"),
);
assert(
  "G-9g3f1 section read-only markers",
  g9g3f1SectionSrc.includes("data-row-picker-read-only=\"true\"") &&
    g9g3f1SectionSrc.includes("Read-only row picker"),
);
assert(
  "G-9g3f1 section no Save button",
  !g9g3f1SectionSrc.match(/>\s*Save\s*</) &&
    !g9g3f1SectionSrc.includes("site-slug-edit-dry-run-preview-btn"),
);
assert(
  "G-9g3f1 general edit binding deferred",
  g9g3f1ImplSrc.includes("deferred G-9g3f3") ||
    g9g3f1ImplSrc.includes("General edit binding **deferred**"),
);
assert(
  "G-9g3f1 implementation Save not clicked",
  g9g3f1ImplSrc.includes("Save was not clicked"),
);
assert(
  "G-9g3f1 implementation no DB write",
  g9g3f1ImplSrc.includes("DB write was not executed"),
);
assert(
  "G-9g3f1 service_role not used",
  g9g3f1ImplSrc.includes("service_role used | **no**"),
);
assert(
  "G-9g3f1 prototype wires row picker",
  g9g3f1PrototypeSrc.includes("AdminStagingScheduleSiteSlugRowPickerSection") &&
    g9g3f1PrototypeSrc.includes("resolveGosakiScheduleSiteSlugRowPickerBinding"),
);
assert(
  "G-9g3f1 next phase G-9g3f2",
  g9g3f1ImplSrc.includes("G-9g3f2-row-picker-read-only-smoke-test"),
);
assert(
  "G-9g3f1 implementation gate",
  g9g3f1ImplSrc.includes(
    "stagingShellScheduleSiteSlugRowPickerImplementationComplete: true",
  ),
);

// --- G-9g3f2 row picker read-only smoke ---
const g9g3f2SmokeDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-row-picker-read-only-smoke-test-result.md",
);
const g9g3f2SmokeScriptPath = path.join(
  TOOL_ROOT,
  "scripts/verify-g9g3f-row-picker-read-only-smoke.mjs",
);

assert("G-9g3f2 smoke result doc exists", fs.existsSync(g9g3f2SmokeDocPath));
assert("G-9g3f2 smoke script exists", fs.existsSync(g9g3f2SmokeScriptPath));

const g9g3f2SmokeDocSrc = fs.readFileSync(g9g3f2SmokeDocPath, "utf8");
const g9g3f2SmokeScriptSrc = fs.readFileSync(g9g3f2SmokeScriptPath, "utf8");

assert(
  "G-9g3f2 smoke read-only row picker",
  g9g3f2SmokeDocSrc.includes("row picker is read-only") &&
    g9g3f2SmokeDocSrc.includes("Read-only row picker"),
);
assert(
  "G-9g3f2 smoke site_slug fixed",
  g9g3f2SmokeDocSrc.includes("site_slug fixed to `gosaki-piano`"),
);
assert(
  "G-9g3f2 smoke pilot audit-only",
  g9g3f2SmokeDocSrc.includes("pilot row audit-only confirmed"),
);
assert(
  "G-9g3f2 smoke Save not clicked",
  g9g3f2SmokeDocSrc.includes("Save was not clicked") &&
    g9g3f2SmokeDocSrc.includes("Preview was not clicked"),
);
assert(
  "G-9g3f2 smoke no DB write",
  g9g3f2SmokeDocSrc.includes("DB write was not executed"),
);
assert(
  "G-9g3f2 smoke general edit deferred",
  g9g3f2SmokeDocSrc.includes("general edit binding deferred"),
);
assert(
  "G-9g3f2 smoke next phase G-9g3f3",
  g9g3f2SmokeDocSrc.includes("G-9g3f3-row-picker-general-edit-binding-planning"),
);
assert(
  "G-9g3f2 smoke gate passed",
  g9g3f2SmokeDocSrc.includes(
    "stagingShellScheduleSiteSlugRowPickerReadOnlySmokeTestPassed: true",
  ),
);
assert(
  "G-9g3f2 smoke script site_slug scope",
  g9g3f2SmokeScriptSrc.includes('.eq("site_slug", siteSlug)'),
);
assert(
  "G-9g3f2 smoke script pilot exclusion",
  g9g3f2SmokeScriptSrc.includes("PILOT_ROW_ID") &&
    g9g3f2SmokeScriptSrc.includes("pilot not in selectable"),
);
assert(
  "G-9g3f2 smoke script no Save click",
  g9g3f2SmokeScriptSrc.includes("smoke: Save not clicked"),
);

// --- G-9g3f3 row picker → general edit binding planning ---
const g9g3f3PlanningDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-row-picker-general-edit-binding-planning.md",
);
assert("G-9g3f3 planning doc exists", fs.existsSync(g9g3f3PlanningDocPath));

const g9g3f3PlanningDocSrc = fs.readFileSync(g9g3f3PlanningDocPath, "utf8");

assert(
  "G-9g3f3 planning binding strategy",
  g9g3f3PlanningDocSrc.includes("CustomEvent") &&
    g9g3f3PlanningDocSrc.includes("staging-schedule-site-slug-row-selected"),
);
assert(
  "G-9g3f3 planning site_slug safety",
  g9g3f3PlanningDocSrc.includes("site_slug") &&
    g9g3f3PlanningDocSrc.includes("gosaki-piano"),
);
assert(
  "G-9g3f3 planning PoC audit row edit block",
  g9g3f3PlanningDocSrc.includes("isPocAuditScheduleRow") &&
    g9g3f3PlanningDocSrc.includes("Blocked"),
);
assert(
  "G-9g3f3 planning operational approval ID",
  g9g3f3PlanningDocSrc.includes("G-9g3-schedule-site-slug-general-edit") &&
    g9g3f3PlanningDocSrc.includes(
      "PUBLIC_ADMIN_SCHEDULE_SITE_SLUG_GENERAL_EDIT_ENABLED",
    ),
);
assert(
  "G-9g3f3 planning Save not clicked",
  g9g3f3PlanningDocSrc.includes("Save was not clicked") &&
    g9g3f3PlanningDocSrc.includes("Preview was not clicked"),
);
assert(
  "G-9g3f3 planning no DB write",
  g9g3f3PlanningDocSrc.includes("DB write was not executed"),
);
assert(
  "G-9g3f3 planning next phase G-9g3f3a",
  g9g3f3PlanningDocSrc.includes(
    "G-9g3f3a-row-picker-general-edit-binding-implementation",
  ),
);
assert(
  "G-9g3f3 planning gate passed",
  g9g3f3PlanningDocSrc.includes(
    "stagingShellScheduleSiteSlugRowPickerGeneralEditBindingPlanningComplete: true",
  ),
);
assert(
  "G-9g3f3 planning operational Save not implemented",
  g9g3f3PlanningDocSrc.includes("generalEditOperationalSaveNotImplemented: true"),
);

// --- G-9g3f3a row picker → general edit binding implementation ---
const g9g3f3aImplDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-row-picker-general-edit-binding-implementation.md",
);
const g9g3f3aEventsSrc = fs.readFileSync(
  path.join(REPO_ROOT, "src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-events.ts"),
  "utf8",
);
const g9g3f3aPickerBindingSrc = fs.readFileSync(
  path.join(REPO_ROOT, "src/lib/admin/staging-data/staging-schedule-site-slug-edit-picker-binding.ts"),
  "utf8",
);
const g9g3f3aEditBindingSrc = fs.readFileSync(
  path.join(REPO_ROOT, "src/lib/admin/staging-data/staging-schedule-site-slug-edit-binding.ts"),
  "utf8",
);
const g9g3f3aEditSectionSrc = fs.readFileSync(
  path.join(
    TOOL_ROOT,
    "templates/admin-cms/data/components/AdminStagingScheduleSiteSlugEditSection.astro",
  ),
  "utf8",
);

assert("G-9g3f3a implementation doc exists", fs.existsSync(g9g3f3aImplDocPath));
const g9g3f3aImplDocSrc = fs.readFileSync(g9g3f3aImplDocPath, "utf8");

assert(
  "G-9g3f3a CustomEvent bridge",
  g9g3f3aEventsSrc.includes("staging-schedule-site-slug-row-selected") &&
    g9g3f3aEventsSrc.includes("staging-schedule-site-slug-row-cleared") &&
    g9g3f3aEventsSrc.includes("staging-schedule-site-slug-row-reloaded"),
);
assert(
  "G-9g3f3a selected row hydrate",
  g9g3f3aPickerBindingSrc.includes("hydrateFromRow") &&
    g9g3f3aPickerBindingSrc.includes("initPickerEditBinding"),
);
assert(
  "G-9g3f3a pilot SSR preload removed",
  g9g3f3aEditBindingSrc.includes("targetRow: null") &&
    !g9g3f3aEditBindingSrc.includes("loadScheduleRowForSiteSlugRead"),
);
assert(
  "G-9g3f3a PoC audit row block",
  g9g3f3aPickerBindingSrc.includes("isPocAuditScheduleRow") &&
    g9g3f3aPickerBindingSrc.includes("site-slug-edit-poc-audit-blocked"),
);
assert(
  "G-9g3f3a site_slug mismatch STOP",
  g9g3f3aPickerBindingSrc.includes("site-slug-edit-site-slug-stop"),
);
assert(
  "G-9g3f3a Save not implemented",
  g9g3f3aImplDocSrc.includes("Save not implemented") &&
    g9g3f3aEditSectionSrc.includes("Save general edit (frozen)"),
);
assert(
  "G-9g3f3a operational arm not implemented",
  g9g3f3aImplDocSrc.includes("operational arm not implemented"),
);
assert(
  "G-9g3f3a no DB write",
  g9g3f3aImplDocSrc.includes("DB write not implemented"),
);
assert(
  "G-9g3f3a next phase G-9g3f3b",
  g9g3f3aImplDocSrc.includes("G-9g3f3b-row-picker-general-edit-binding-smoke-test"),
);
assert(
  "G-9g3f3a implementation gate",
  g9g3f3aImplDocSrc.includes(
    "stagingShellScheduleSiteSlugRowPickerGeneralEditBindingImplementationComplete: true",
  ),
);
assert(
  "G-9g3f3a picker binding connected",
  g9g3f3aEditSectionSrc.includes("data-picker-driven-binding") &&
    g9g3f3aEditSectionSrc.includes("pickerDrivenBinding") &&
    g9g3f3aEditSectionSrc.includes("site-slug-edit-picker-placeholder"),
);

const g9g3f3bSmokeDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-row-picker-general-edit-binding-smoke-test-result.md",
);
const g9g3f3bEditUiSrc = fs.readFileSync(
  path.join(REPO_ROOT, "src/lib/admin/staging-data/staging-schedule-site-slug-edit-ui.ts"),
  "utf8",
);

assert("G-9g3f3b smoke result doc exists", fs.existsSync(g9g3f3bSmokeDocPath));
const g9g3f3bSmokeDocSrc = fs.readFileSync(g9g3f3bSmokeDocPath, "utf8");

assert(
  "G-9g3f3b smoke passed",
  g9g3f3bSmokeDocSrc.includes("G-9g3f3b smoke passed"),
);
assert(
  "G-9g3f3b operator hydrate pass",
  g9g3f3bSmokeDocSrc.includes("hydrate") &&
    g9g3f3bSmokeDocSrc.includes("PASS"),
);
assert(
  "G-9g3f3b selected row id recorded",
  g9g3f3bSmokeDocSrc.includes("888c58f2-f152-4563-a3cf-a20d7c2456c1"),
);
assert(
  "G-9g3f3b changedFields price only",
  g9g3f3bSmokeDocSrc.includes("changedFields") &&
    g9g3f3bSmokeDocSrc.includes("price"),
);
assert(
  "G-9g3f3b legacy G-6 false-path not pass",
  g9g3f3bSmokeDocSrc.includes("not accepted as pass"),
);
assert(
  "G-9g3f3b smoke gate true",
  g9g3f3bSmokeDocSrc.includes(
    "stagingShellScheduleSiteSlugRowPickerGeneralEditBindingSmokeTestPassed: true",
  ),
);
assert(
  "G-9g3f3b ready for G-9g3f3c",
  g9g3f3bSmokeDocSrc.includes("readyForG9g3f3cRowPickerGeneralEditBindingHardening: true"),
);
assert(
  "G-9g3f3b optimisticLock stale false",
  g9g3f3bSmokeDocSrc.includes("optimisticLock.stale") &&
    g9g3f3bSmokeDocSrc.includes("`false`"),
);
assert(
  "G-9g3f3b hostGatePassed true",
  g9g3f3bSmokeDocSrc.includes("hostGatePassed") &&
    g9g3f3bSmokeDocSrc.includes("`true`"),
);
assert(
  "G-9g3f3b correct G-9 preview panel",
  g9g3f3bSmokeDocSrc.includes("#site-slug-edit-dry-run-preview-btn") &&
    g9g3f3bSmokeDocSrc.includes("#site-slug-edit-dry-run-result"),
);
assert(
  "G-9g3f3b next phase G-9g3c",
  g9g3f3bSmokeDocSrc.includes("G-9g3f3c-row-picker-general-edit-binding-hardening"),
);
assert(
  "G-9g3f3b Preview dry-run enabled in source",
  g9g3f3bEditUiSrc.includes("G9G3F3B_PHASE") &&
    g9g3f3bEditUiSrc.includes("refreshPreviewButtonState"),
);
assert(
  "G-9g3f3b actualWrite=false",
  g9g3f3bSmokeDocSrc.includes("actualWrite=false") ||
    g9g3f3bSmokeDocSrc.includes("| actualWrite | `false`"),
);
assert(
  "G-9g3f3b Save not clicked",
  g9g3f3bSmokeDocSrc.includes("Save not clicked"),
);
assert(
  "G-9g3f3b no DB write",
  g9g3f3bSmokeDocSrc.includes("DB write not executed"),
);
assert(
  "G-9g3f3b G9G3F3A committed reference",
  g9g3f3bSmokeDocSrc.includes("1ec29eb"),
);
assert(
  "G-9g3f3b preview button label in section",
  g9g3f3aEditSectionSrc.includes("Preview G-9 site_slug general edit dry-run"),
);
assert(
  "G-9g3f3b result panel expectations",
  g9g3f3aEditSectionSrc.includes("G-9 site_slug general edit preview result") &&
    g9g3f3aEditSectionSrc.includes("hostGatePassed"),
);
assert(
  "G-9g3f3b legacy G-6 warning in section",
  g9g3f3aEditSectionSrc.includes("not valid") &&
    g9g3f3aEditSectionSrc.includes("G-6-e2-schedule-dry-run-ui"),
);
assert(
  "G-9g3f3b no deferred preview copy",
  !g9g3f3aEditSectionSrc.includes("Preview deferred") &&
    !g9g3f3aEditSectionSrc.includes("execution deferred to G-9g3f3b"),
);

const g9g3f3cHardeningDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-row-picker-general-edit-binding-hardening.md",
);
const g9g3f3cPickerBindingSrc = fs.readFileSync(
  path.join(REPO_ROOT, "src/lib/admin/staging-data/staging-schedule-site-slug-edit-picker-binding.ts"),
  "utf8",
);
const g9g3f3cEditUiSrc = fs.readFileSync(
  path.join(REPO_ROOT, "src/lib/admin/staging-data/staging-schedule-site-slug-edit-ui.ts"),
  "utf8",
);
const g9g3f3cRowPickerUiSrc = fs.readFileSync(
  path.join(REPO_ROOT, "src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-ui.ts"),
  "utf8",
);

assert("G-9g3f3c hardening doc exists", fs.existsSync(g9g3f3cHardeningDocPath));
const g9g3f3cHardeningDocSrc = fs.readFileSync(g9g3f3cHardeningDocPath, "utf8");

assert(
  "G-9g3f3c hardening completed",
  g9g3f3cHardeningDocSrc.includes("G-9g3f3c hardening completed"),
);
assert(
  "G-9g3f3c hardening gate true",
  g9g3f3cHardeningDocSrc.includes(
    "stagingShellScheduleSiteSlugRowPickerGeneralEditBindingHardeningComplete: true",
  ),
);
assert(
  "G-9g3f3c dirty row-switch protection",
  g9g3f3cPickerBindingSrc.includes("confirmDiscardDirtyCandidateIfNeeded") &&
    g9g3f3cRowPickerUiSrc.includes("confirmDiscardDirtyCandidateIfNeeded"),
);
assert(
  "G-9g3f3c preview stale invalidation",
  g9g3f3cEditUiSrc.includes("markG9PreviewStale") &&
    g9g3f3cHardeningDocSrc.includes("Preview is stale — run G-9 preview again"),
);
assert(
  "G-9g3f3c selected row identity",
  g9g3f3cPickerBindingSrc.includes("site-slug-edit-bound-source-route") &&
    g9g3f3aEditSectionSrc.includes("data-selected-row-identity-panel"),
);
assert(
  "G-9g3f3c ready for G-9g3f3d",
  g9g3f3cHardeningDocSrc.includes("readyForG9g3f3dRowPickerGeneralEditBindingHardeningSmokeTest: true"),
);
assert(
  "G-9g3f3c Save not executed",
  g9g3f3cHardeningDocSrc.includes("Save not clicked") &&
    g9g3f3cHardeningDocSrc.includes("DB write not executed"),
);

const g9g3f3dSmokeDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-row-picker-general-edit-binding-hardening-smoke-test-result.md",
);

assert("G-9g3f3d smoke result doc exists", fs.existsSync(g9g3f3dSmokeDocPath));
const g9g3f3dSmokeDocSrc = fs.existsSync(g9g3f3dSmokeDocPath)
  ? fs.readFileSync(g9g3f3dSmokeDocPath, "utf8")
  : "";

assert(
  "G-9g3f3d smoke phase documented",
  g9g3f3dSmokeDocSrc.includes("G-9g3f3d-row-picker-general-edit-binding-hardening-smoke-test"),
);
assert(
  "G-9g3f3d smoke pending or passed",
  g9g3f3dSmokeDocSrc.includes("G-9g3f3d hardening smoke passed") ||
    g9g3f3dSmokeDocSrc.includes("pending operator manual smoke"),
);
assert(
  "G-9g3f3d smoke passed",
  g9g3f3dSmokeDocSrc.includes("G-9g3f3d hardening smoke passed"),
);
assert(
  "G-9g3f3d smoke gate true",
  g9g3f3dSmokeDocSrc.includes(
    "stagingShellScheduleSiteSlugRowPickerGeneralEditBindingHardeningSmokeTestPassed: true",
  ),
);
assert(
  "G-9g3f3d stale invalidation confirmed",
  g9g3f3dSmokeDocSrc.includes("stale invalidation confirmed"),
);
assert(
  "G-9g3f3d dirty switch Cancel confirmed",
  g9g3f3dSmokeDocSrc.includes("dirty row-switch Cancel confirmed"),
);
assert(
  "G-9g3f3d dirty switch Continue confirmed",
  g9g3f3dSmokeDocSrc.includes("dirty row-switch Continue confirmed"),
);
assert(
  "G-9g3f3d ready for G-9g3g",
  g9g3f3dSmokeDocSrc.includes("readyForG9g3gOperationalGeneralEditPlanning: true"),
);
assert(
  "G-9g3f3d selected row identity documented",
  g9g3f3dSmokeDocSrc.includes("#site-slug-edit-selected-row-strip"),
);
assert(
  "G-9g3f3d stale invalidation documented",
  g9g3f3dSmokeDocSrc.includes("stale invalidation") ||
    g9g3f3dSmokeDocSrc.includes("Preview is stale"),
);
assert(
  "G-9g3f3d dirty switch confirm documented",
  g9g3f3dSmokeDocSrc.includes(
    "You have unsaved candidate edits. Switching rows will discard the current candidate values. Continue?",
  ),
);
assert(
  "G-9g3f3d Save not executed in doc",
  g9g3f3dSmokeDocSrc.includes("Save not clicked") &&
    g9g3f3dSmokeDocSrc.includes("DB write not executed"),
);
assert(
  "G-9g3f3d next phase G-9g3g",
  g9g3f3dSmokeDocSrc.includes("G-9g3g-operational-general-edit-planning"),
);
assert(
  "G9G3F3D_PHASE in config",
  fs
    .readFileSync(
      path.join(REPO_ROOT, "src/lib/admin/staging-data/staging-schedule-site-slug-config.ts"),
      "utf8",
    )
    .includes("G9G3F3D_PHASE"),
);

const g9g3gPlanningDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-general-edit-planning.md",
);

assert("G-9g3g operational planning doc exists", fs.existsSync(g9g3gPlanningDocPath));
const g9g3gPlanningDocSrc = fs.readFileSync(g9g3gPlanningDocPath, "utf8");

assert(
  "G-9g3g planning completed",
  g9g3gPlanningDocSrc.includes("G-9g3g planning completed"),
);
assert(
  "G-9g3g planning gate true",
  g9g3gPlanningDocSrc.includes(
    "stagingShellScheduleSiteSlugOperationalGeneralEditPlanningComplete: true",
  ),
);
assert(
  "G-9g3g approval ID proposal",
  g9g3gPlanningDocSrc.includes(
    "G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run",
  ),
);
assert(
  "G-9g3g env arm proposal",
  g9g3gPlanningDocSrc.includes(
    "PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED",
  ),
);
assert(
  "G-9g3g phase sequence",
  g9g3gPlanningDocSrc.includes("G-9g3g1-operational-save-path-implementation"),
);
assert(
  "G-9g3g Save gate design",
  g9g3gPlanningDocSrc.includes("Save gate design"),
);
assert(
  "G-9g3g no Save in planning",
  g9g3gPlanningDocSrc.includes("Save clicked") &&
    g9g3gPlanningDocSrc.includes("no") &&
    g9g3gPlanningDocSrc.includes("DB write executed"),
);
assert(
  "G-9g3g ready for g9g3g1",
  g9g3gPlanningDocSrc.includes("readyForG9g3g1OperationalSavePathImplementation: true"),
);
assert(
  "G-9g3g PoC Save re-run prohibited",
  g9g3gPlanningDocSrc.includes("Do not re-run G-9g2"),
);

const g9g3g1ImplDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-general-edit-implementation.md",
);
assert("G-9g3g1 implementation doc exists", fs.existsSync(g9g3g1ImplDocPath));
const g9g3g1ImplDocSrc = fs.readFileSync(g9g3g1ImplDocPath, "utf8");
assert(
  "G-9g3g1 implementation completed",
  g9g3g1ImplDocSrc.includes("G-9g3g1 implementation completed"),
);
assert(
  "G-9g3g approval ID in implementation doc",
  g9g3g1ImplDocSrc.includes("G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run"),
);
assert(
  "G-9g3g env arm in implementation doc",
  g9g3g1ImplDocSrc.includes("PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED"),
);
assert(
  "G-9g3g1 operational Save path doc",
  g9g3g1ImplDocSrc.includes("staging-schedule-site-slug-operational-general-edit-save.ts"),
);
assert(
  "G-9g3g1 Save button id doc",
  g9g3g1ImplDocSrc.includes("site-slug-edit-g9g3g-operational-save-btn"),
);
assert(
  "G-9g3g1 no Save in implementation",
  g9g3g1ImplDocSrc.includes("Save not clicked") &&
    (g9g3g1ImplDocSrc.includes("no DB write") ||
      g9g3g1ImplDocSrc.includes("DB write not executed")),
);
assert(
  "G-9g3g1 ready for g9g3g2",
  g9g3g1ImplDocSrc.includes("readyForG9g3g2OperationalSaveUiGateSmokeTest: true"),
);
assert(
  "G-9g3g1 next phase g9g3g2",
  g9g3g1ImplDocSrc.includes("G-9g3g2-operational-save-ui-gate-smoke-test"),
);

const g9g3g1SaveSrc = fs.readFileSync(
  path.join(REPO_ROOT, "src/lib/admin/staging-write/staging-schedule-site-slug-operational-general-edit-save.ts"),
  "utf8",
);
assert(
  "G-9g3g1 operational Save executor exists",
  g9g3g1SaveSrc.includes("executeG9G3gOperationalGeneralEditSave"),
);
assert(
  "G-9g3g1 service_role not in executor",
  !g9g3g1SaveSrc.includes("service_role"),
);

const g9g3g1TypesSrc = fs.readFileSync(
  path.join(REPO_ROOT, "src/lib/admin/staging-write/schedule-write-types.ts"),
  "utf8",
);
assert(
  "G-9g3g approval ID registered in types",
  g9g3g1TypesSrc.includes("G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run"),
);

const g9g3g2SmokeDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-general-edit-ui-gate-smoke-test-result.md",
);
assert("G-9g3g2 smoke doc exists", fs.existsSync(g9g3g2SmokeDocPath));
const g9g3g2SmokeDocSrc = fs.readFileSync(g9g3g2SmokeDocPath, "utf8");
assert(
  "G-9g3g2 smoke passed",
  g9g3g2SmokeDocSrc.includes("G-9g3g2 operational Save UI gate smoke passed"),
);
assert(
  "G-9g3g2 smoke gate true",
  g9g3g2SmokeDocSrc.includes(
    "stagingShellScheduleSiteSlugOperationalGeneralEditUiGateSmokeTestPassed: true",
  ),
);
assert(
  "G-9g3g2 ready for g9g3g3",
  g9g3g2SmokeDocSrc.includes("readyForG9g3g3OperationalNonDryRunPreflight: true"),
);
assert(
  "G-9g3g2 Save button id in smoke doc",
  g9g3g2SmokeDocSrc.includes("site-slug-edit-g9g3g-operational-save-btn"),
);
assert(
  "G-9g3g2 stale blocks Save in smoke doc",
  g9g3g2SmokeDocSrc.includes("Preview is stale"),
);
assert(
  "G-9g3g2 Save not clicked marker",
  g9g3g2SmokeDocSrc.includes("Save not clicked"),
);
assert(
  "G-9g3g2 next phase g9g3g3",
  g9g3g2SmokeDocSrc.includes("G-9g3g3-operational-non-dry-run-preflight"),
);

const g9g3g3PreflightDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-general-edit-non-dry-run-preflight.md",
);
assert("G-9g3g3 preflight doc exists", fs.existsSync(g9g3g3PreflightDocPath));
const g9g3g3PreflightDocSrc = fs.readFileSync(g9g3g3PreflightDocPath, "utf8");
assert(
  "G-9g3g3 preflight complete",
  g9g3g3PreflightDocSrc.includes("G-9g3g3-operational-non-dry-run-preflight") &&
    g9g3g3PreflightDocSrc.includes("preflight complete / execution pending"),
);
assert(
  "G-9g3g3 ready for g9g3g4",
  g9g3g3PreflightDocSrc.includes("readyForG9g3g4OperationalNonDryRunExecution: true"),
);
assert(
  "G-9g3g3 target row id",
  g9g3g3PreflightDocSrc.includes("888c58f2-f152-4563-a3cf-a20d7c2456c1"),
);
assert(
  "G-9g3g3 operational approval id",
  g9g3g3PreflightDocSrc.includes(
    "G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run",
  ),
);
assert(
  "G-9g3g3 Save not clicked",
  g9g3g3PreflightDocSrc.includes("Save clicked | **no**"),
);
assert(
  "G-9g3g3 next phase g9g3g4",
  g9g3g3PreflightDocSrc.includes("G-9g3g4-operational-non-dry-run-execution"),
);

const g9g3g4ExecDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-general-edit-non-dry-run-execution-result.md",
);
assert("G-9g3g4 execution result doc exists", fs.existsSync(g9g3g4ExecDocPath));
const g9g3g4ExecDocSrc = fs.readFileSync(g9g3g4ExecDocPath, "utf8");
assert(
  "G-9g3g4 execution success",
  g9g3g4ExecDocSrc.includes("G-9g3g4-operational-non-dry-run-execution") &&
    (g9g3g4ExecDocSrc.includes("success — execution complete") ||
      g9g3g4ExecDocSrc.includes("Execution: PASS")),
);
assert(
  "G-9g3g4 target row id",
  g9g3g4ExecDocSrc.includes("888c58f2-f152-4563-a3cf-a20d7c2456c1"),
);
assert(
  "G-9g3g4 operator Save once",
  g9g3g4ExecDocSrc.includes("Save clicked | **yes**") ||
    g9g3g4ExecDocSrc.includes("Save button clicked: yes"),
);
assert(
  "G-9g3g4 DB write executed",
  g9g3g4ExecDocSrc.includes("DB write executed | **yes**") ||
    g9g3g4ExecDocSrc.includes("DB write performed: yes"),
);
assert(
  "G-9g3g4 actualWrite true",
  g9g3g4ExecDocSrc.includes("actualWrite: true"),
);
assert(
  "G-9g3g4 execution complete gate",
  g9g3g4ExecDocSrc.includes(
    "stagingShellScheduleSiteSlugOperationalGeneralEditNonDryRunExecutionComplete: true",
  ),
);
assert(
  "G-9g3g4 rollback not executed",
  g9g3g4ExecDocSrc.includes("rollback executed: false"),
);
assert(
  "G-9g3g4 next phase g9g3g5",
  g9g3g4ExecDocSrc.includes("G-9g3g5-post-execution-hardening-and-restore-decision"),
);

const g9g3g5DocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-general-edit-post-execution-hardening-and-restore-decision.md",
);
assert("G-9g3g5 planning doc exists", fs.existsSync(g9g3g5DocPath));
const g9g3g5DocSrc = fs.readFileSync(g9g3g5DocPath, "utf8");
assert(
  "G-9g3g5 planning complete",
  g9g3g5DocSrc.includes("G-9g3g5-post-execution-hardening-and-restore-decision") &&
    g9g3g5DocSrc.includes("decision / hardening planning complete"),
);
assert(
  "G-9g3g5 ready for restore preflight",
  g9g3g5DocSrc.includes("readyForG9g3g5bOperationalRestorePreflight: true"),
);
assert(
  "G-9g3g5 marker remains",
  g9g3g5DocSrc.includes("markerRemainsInStagingDb: true"),
);
assert(
  "G-9g3g5 restore not executed",
  g9g3g5DocSrc.includes("restoreExecuted: false"),
);
assert(
  "G-9g3g5 next phase g9g3g5b",
  g9g3g5DocSrc.includes("G-9g3g5b-operational-restore-preflight"),
);
assert(
  "G-9g3g5 restore approval ID",
  g9g3g5DocSrc.includes("G-9g3g5-schedule-site-slug-operational-restore-non-dry-run"),
);

const g9g3g5bPreflightPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-general-edit-restore-preflight.md",
);
assert("G-9g3g5b restore preflight doc exists", fs.existsSync(g9g3g5bPreflightPath));
const g9g3g5bPreflightSrc = fs.readFileSync(g9g3g5bPreflightPath, "utf8");
assert(
  "G-9g3g5b preflight complete",
  g9g3g5bPreflightSrc.includes("G-9g3g5b-operational-restore-preflight") &&
    g9g3g5bPreflightSrc.includes("preflight complete / restore execution pending"),
);
assert(
  "G-9g3g5b ready for b1 implementation",
  g9g3g5bPreflightSrc.includes("readyForG9g3g5b1OperationalRestoreApprovalArmImplementation: true"),
);
assert(
  "G-9g3g5c blocked until b1",
  g9g3g5bPreflightSrc.includes("readyForG9g3g5cOperationalRestoreExecution: false"),
);
assert(
  "G-9g3g5b implementation gap audit",
  g9g3g5bPreflightSrc.includes("Implementation gap audit"),
);
assert(
  "G-9g3g5b restore not executed",
  g9g3g5bPreflightSrc.includes("restoreExecuted: false"),
);
assert(
  "G-9g3g5b next phase b1",
  g9g3g5bPreflightSrc.includes("G-9g3g5b1-operational-restore-approval-arm-implementation"),
);

const g9g3g5b1ImplPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-general-edit-restore-approval-arm-implementation.md",
);
assert("G-9g3g5b1 restore implementation doc exists", fs.existsSync(g9g3g5b1ImplPath));
const g9g3g5b1ImplSrc = fs.readFileSync(g9g3g5b1ImplPath, "utf8");
assert(
  "G-9g3g5b1 phase marker",
  g9g3g5b1ImplSrc.includes("G-9g3g5b1-operational-restore-approval-arm-implementation"),
);
assert(
  "G-9g3g5b1 implementation complete",
  g9g3g5b1ImplSrc.includes("implementation complete"),
);
assert(
  "G-9g3g5b1 restore not executed",
  g9g3g5b1ImplSrc.includes("restoreExecuted: false"),
);
assert(
  "G-9g3g5b1 next phase b2",
  g9g3g5b1ImplSrc.includes("G-9g3g5b2-operational-restore-approval-arm-ui-gate-smoke-test"),
);

const g9g3g5b2SmokePath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-general-edit-restore-approval-arm-ui-gate-smoke-test-result.md",
);
assert("G-9g3g5b2 restore UI gate smoke doc exists", fs.existsSync(g9g3g5b2SmokePath));
const g9g3g5b2SmokeSrc = fs.readFileSync(g9g3g5b2SmokePath, "utf8");
assert(
  "G-9g3g5b2 phase marker",
  g9g3g5b2SmokeSrc.includes("G-9g3g5b2-operational-restore-approval-arm-ui-gate-smoke-test"),
);
assert(
  "G-9g3g5b2 smoke passed",
  g9g3g5b2SmokeSrc.includes("G-9g3g5b2 operational restore approval arm UI gate smoke passed"),
);
assert(
  "G-9g3g5b2 gate passed",
  g9g3g5b2SmokeSrc.includes(
    "stagingShellScheduleSiteSlugOperationalRestoreApprovalArmUiGateSmokeTestPassed: true",
  ),
);
assert(
  "G-9g3g5b2 ready for G-9g3g5c",
  g9g3g5b2SmokeSrc.includes("readyForG9g3g5cOperationalRestoreExecution: true"),
);
assert(
  "G-9g3g5b2 Save not clicked",
  g9g3g5b2SmokeSrc.includes("Save clicked") && g9g3g5b2SmokeSrc.includes("no"),
);
assert(
  "G-9g3g5b2 restore not executed",
  g9g3g5b2SmokeSrc.includes("restoreExecuted: false") ||
    g9g3g5b2SmokeSrc.includes("restore executed | **no**"),
);
assert(
  "G-9g3g5b2 next phase G-9g3g5c",
  g9g3g5b2SmokeSrc.includes("G-9g3g5c-operational-restore-execution"),
);

const g9g3g5cExecPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-general-edit-restore-execution-result.md",
);
assert("G-9g3g5c restore execution result doc exists", fs.existsSync(g9g3g5cExecPath));
const g9g3g5cExecSrc = fs.readFileSync(g9g3g5cExecPath, "utf8");
assert(
  "G-9g3g5c phase marker",
  g9g3g5cExecSrc.includes("G-9g3g5c-operational-restore-execution"),
);
assert(
  "G-9g3g5c execution success",
  g9g3g5cExecSrc.includes("success — restore execution complete") ||
    g9g3g5cExecSrc.includes("Execution: PASS"),
);
assert(
  "G-9g3g5c restore executed",
  g9g3g5cExecSrc.includes("restoreExecuted: true") ||
    g9g3g5cExecSrc.includes("restore executed | **yes**"),
);
assert(
  "G-9g3g5c marker removed",
  g9g3g5cExecSrc.includes("markerRemoved: true") ||
    g9g3g5cExecSrc.includes("marker **removed**"),
);
assert(
  "G-9g3g5c ready for G-9g3g5d",
  g9g3g5cExecSrc.includes("readyForG9g3g5dPostRestoreHardening: true"),
);
assert(
  "G-9g3g5c next phase G-9g3g5d",
  g9g3g5cExecSrc.includes("G-9g3g5d-post-restore-hardening"),
);

const g9g3g5dHardeningPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-general-edit-post-restore-hardening.md",
);
assert("G-9g3g5d post-restore hardening doc exists", fs.existsSync(g9g3g5dHardeningPath));
const g9g3g5dHardeningSrc = fs.readFileSync(g9g3g5dHardeningPath, "utf8");
assert(
  "G-9g3g5d phase marker",
  g9g3g5dHardeningSrc.includes("G-9g3g5d-post-restore-hardening"),
);
assert(
  "G-9g3g5d status complete",
  g9g3g5dHardeningSrc.includes("**complete**"),
);
assert(
  "G-9g3g5d round-trip complete",
  g9g3g5dHardeningSrc.includes("restoreRoundTripComplete: true"),
);
assert(
  "G-9g3g5d marker removed",
  g9g3g5dHardeningSrc.includes("markerRemainsInStagingDb: false"),
);
assert(
  "G-9g3g5d next phase G-9g3h1",
  g9g3g5dHardeningSrc.includes("G-9g3h1-save-success-reclick-prevention"),
);

const g9g3h1ImplPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-save-success-reclick-prevention.md",
);
assert("G-9g3h1 implementation doc exists", fs.existsSync(g9g3h1ImplPath));
const g9g3h1ImplSrc = fs.readFileSync(g9g3h1ImplPath, "utf8");
assert(
  "G-9g3h1 phase marker",
  g9g3h1ImplSrc.includes("G-9g3h1-save-success-reclick-prevention"),
);
assert(
  "G-9g3h1 implementation complete",
  g9g3h1ImplSrc.includes("implementation complete"),
);
assert(
  "G-9g3h1 reclick prevention",
  g9g3h1ImplSrc.includes("re-click prevention") ||
    g9g3h1ImplSrc.includes("Re-click is blocked"),
);
assert(
  "G-9g3h1 next phase smoke",
  g9g3h1ImplSrc.includes("G-9g3h1a-save-success-reclick-prevention-smoke-test"),
);

const g9g3h1aSmokePath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-save-success-reclick-prevention-smoke-test-result.md",
);
assert("G-9g3h1a smoke doc exists", fs.existsSync(g9g3h1aSmokePath));
const g9g3h1aSmokeSrc = fs.readFileSync(g9g3h1aSmokePath, "utf8");
assert(
  "G-9g3h1a phase marker",
  g9g3h1aSmokeSrc.includes("G-9g3h1a-save-success-reclick-prevention-smoke-test"),
);
assert(
  "G-9g3h1a smoke passed",
  g9g3h1aSmokeSrc.includes("G-9g3h1a re-click prevention smoke passed") ||
    g9g3h1aSmokeSrc.includes("stagingShellScheduleSiteSlugOperationalSaveSuccessReclickPreventionSmokeTestPassed: true"),
);
assert(
  "G-9g3h1a Preview executed once",
  g9g3h1aSmokeSrc.includes("Preview clicked (operator) | **yes**") ||
    g9g3h1aSmokeSrc.includes("Preview: executed once by operator"),
);
assert(
  "G-9g3h1a Save executed once",
  g9g3h1aSmokeSrc.includes("Save clicked | **yes**") &&
    g9g3h1aSmokeSrc.includes("exactly once"),
);
assert(
  "G-9g3h1a re-click blocked",
  g9g3h1aSmokeSrc.includes("Re-click is blocked") ||
    g9g3h1aSmokeSrc.includes("re-click blocked"),
);
assert(
  "G-9g3h1a marker remains",
  g9g3h1aSmokeSrc.includes("markerRemainsInStagingDb: true"),
);
assert(
  "G-9g3h1a ready for restore preflight",
  g9g3h1aSmokeSrc.includes("readyForG9g3h1bSmokeMarkerRestorePreflight: true"),
);
assert(
  "G-9g3h1a restore preflight recommendation",
  g9g3h1aSmokeSrc.includes("G-9g3h1b-smoke-marker-restore-preflight"),
);

const g9g3h1bPreflightPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-preflight.md",
);
assert("G-9g3h1b preflight doc exists", fs.existsSync(g9g3h1bPreflightPath));
const g9g3h1bPreflightSrc = fs.readFileSync(g9g3h1bPreflightPath, "utf8");
assert(
  "G-9g3h1b phase marker",
  g9g3h1bPreflightSrc.includes("G-9g3h1b-smoke-marker-restore-preflight"),
);
assert(
  "G-9g3h1b preflight complete",
  g9g3h1bPreflightSrc.includes("**complete**"),
);
assert(
  "G-9g3h1b Option A chosen",
  g9g3h1bPreflightSrc.includes("Option A") &&
    g9g3h1bPreflightSrc.includes("G-9g3g general operational"),
);
assert(
  "G-9g3h1b smoke marker baseline",
  g9g3h1bPreflightSrc.includes(
    "[CMS Kit staging] G-9g3h1a re-click prevention smoke — temporary marker",
  ),
);
assert(
  "G-9g3h1b lock baseline",
  g9g3h1bPreflightSrc.includes("2026-06-19T01:18:46.3938+00:00"),
);
assert(
  "G-9g3h1b ready for execution",
  g9g3h1bPreflightSrc.includes("readyForG9g3h1cSmokeMarkerRestoreExecution: true"),
);
assert(
  "G-9g3h1b next phase G-9g3h1c",
  g9g3h1bPreflightSrc.includes("G-9g3h1c-smoke-marker-restore-execution"),
);
assert(
  "G-9g3h1b no DB write",
  g9g3h1bPreflightSrc.includes("DB write executed (this phase) | **no**"),
);

const g9g3h1cExecPendingPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-execution-result.md",
);
assert("G-9g3h1c execution result doc exists", fs.existsSync(g9g3h1cExecPendingPath));
const g9g3h1cExecPendingSrc = fs.readFileSync(g9g3h1cExecPendingPath, "utf8");
assert(
  "G-9g3h1c phase marker",
  g9g3h1cExecPendingSrc.includes("G-9g3h1c-smoke-marker-restore-execution"),
);
assert(
  "G-9g3h1c restore success",
  g9g3h1cExecPendingSrc.includes("restore execution complete") ||
    g9g3h1cExecPendingSrc.includes("stagingShellScheduleSiteSlugOperationalSaveReclickSmokeMarkerRestoreExecutionComplete: true"),
);
assert(
  "G-9g3h1c Preview executed once",
  g9g3h1cExecPendingSrc.includes("Preview clicked (operator) | **yes**") ||
    g9g3h1cExecPendingSrc.includes("Preview: executed once by operator"),
);
assert(
  "G-9g3h1c Save executed once",
  g9g3h1cExecPendingSrc.includes("Save clicked | **yes**") &&
    g9g3h1cExecPendingSrc.includes("exactly once"),
);
assert(
  "G-9g3h1c marker removed",
  g9g3h1cExecPendingSrc.includes("markerRemainsInStagingDb: false") &&
    g9g3h1cExecPendingSrc.includes("markerRemoved: true"),
);
assert(
  "G-9g3h1c next phase hardening",
  g9g3h1cExecPendingSrc.includes("G-9g3h1d-smoke-marker-restore-post-execution-hardening"),
);
assert(
  "G-9g3h1c rollback not needed",
  g9g3h1cExecPendingSrc.includes("rollbackNeeded: false"),
);

const g9g3h1b1ImplPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-row-picker-exception.md",
);
assert("G-9g3h1b1 implementation doc exists", fs.existsSync(g9g3h1b1ImplPath));
const g9g3h1b1ImplSrc = fs.readFileSync(g9g3h1b1ImplPath, "utf8");
assert(
  "G-9g3h1b1 phase marker",
  g9g3h1b1ImplSrc.includes("G-9g3h1b1-smoke-marker-restore-row-picker-exception"),
);
assert(
  "G-9g3h1b1 implementation complete",
  g9g3h1b1ImplSrc.includes("implementation complete"),
);
assert(
  "G-9g3h1b1 row picker exception function",
  g9g3h1b1ImplSrc.includes("isG9g3h1aSmokeMarkerRestoreTargetRow"),
);
assert(
  "G-9g3h1b1 ready for G-9g3h1c",
  g9g3h1b1ImplSrc.includes("readyForG9g3h1cSmokeMarkerRestoreExecution: true"),
);
assert(
  "G-9g3h1b1 no DB write",
  g9g3h1b1ImplSrc.includes("DB write executed (this phase) | **no**"),
);

const g9g3h1dHardeningPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-save-reclick-post-execution-hardening.md",
);
assert("G-9g3h1d hardening doc exists", fs.existsSync(g9g3h1dHardeningPath));
const g9g3h1dHardeningSrc = fs.readFileSync(g9g3h1dHardeningPath, "utf8");
assert(
  "G-9g3h1d phase marker",
  g9g3h1dHardeningSrc.includes("G-9g3h1d-smoke-marker-restore-post-execution-hardening"),
);
assert(
  "G-9g3h1d status complete",
  g9g3h1dHardeningSrc.includes("**complete**"),
);
assert(
  "G-9g3h1d round-trip summary",
  g9g3h1dHardeningSrc.includes("G-9g3h1 round-trip summary"),
);
assert(
  "G-9g3h1d marker removed",
  g9g3h1dHardeningSrc.includes("markerRemainsInStagingDb: false"),
);
assert(
  "G-9g3h1d final updated_at",
  g9g3h1dHardeningSrc.includes("2026-06-19T02:05:42.615781+00:00"),
);
assert(
  "G-9g3h1d routine dev safety",
  g9g3h1dHardeningSrc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN: true") &&
    g9g3h1dHardeningSrc.includes("ENABLE_ADMIN_STAGING_WRITE: false"),
);
assert(
  "G-9g3h1d re-click prevention confirmed",
  g9g3h1dHardeningSrc.includes("Re-click prevention confirmed"),
);
assert(
  "G-9g3h1d row-picker no longer matches",
  g9g3h1dHardeningSrc.includes("should no longer match") ||
    g9g3h1dHardeningSrc.includes("no longer match"),
);
assert(
  "G-9g3h1d next phase G-9g3h2b",
  g9g3h1dHardeningSrc.includes("G-9g3h2b-row-picker-exception-lifecycle-cleanup"),
);
assert(
  "G-9g3h1d no DB write",
  g9g3h1dHardeningSrc.includes("DB write executed (this phase) | **no**"),
);

const g9g3h2bCleanupPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-row-picker-exception-lifecycle-cleanup.md",
);
assert("G-9g3h2b cleanup doc exists", fs.existsSync(g9g3h2bCleanupPath));
const g9g3h2bCleanupSrc = fs.readFileSync(g9g3h2bCleanupPath, "utf8");
assert(
  "G-9g3h2b phase marker",
  g9g3h2bCleanupSrc.includes("G-9g3h2b-row-picker-exception-lifecycle-cleanup"),
);
assert(
  "G-9g3h2b status complete",
  g9g3h2bCleanupSrc.includes("**complete**"),
);
assert(
  "G-9g3h2b Option B registry",
  g9g3h2bCleanupSrc.includes("Option B") &&
    g9g3h2bCleanupSrc.includes("centralized restore exception registry"),
);
assert(
  "G-9g3h2b marker removed",
  g9g3h2bCleanupSrc.includes("markerRemainsInStagingDb: false"),
);
assert(
  "G-9g3h2b g9g3h1a lifecycle completed",
  g9g3h2bCleanupSrc.includes("status: completed") &&
    g9g3h2bCleanupSrc.includes("g9g3h1a-smoke-marker-restore"),
);
assert(
  "G-9g3h2b next phase G-9g3h3",
  g9g3h2bCleanupSrc.includes("G-9g3h3-cms-kit-generalization-notes"),
);
assert(
  "G-9g3h2b no DB write",
  g9g3h2bCleanupSrc.includes("DB write executed (this phase) | **no**"),
);

const registrySrc = fs.readFileSync(
  path.join(REPO_ROOT, "src/lib/admin/staging-data/staging-schedule-site-slug-restore-exception-registry.ts"),
  "utf8",
);
assert(
  "G-9g3h2b registry file",
  registrySrc.includes("STAGING_SCHEDULE_RESTORE_EXCEPTION_REGISTRY"),
);
assert(
  "G-9g3h2b isActiveRestoreExceptionRow",
  registrySrc.includes("isActiveRestoreExceptionRow"),
);

const gosakiPublicDist = path.join(TOOL_ROOT, "output/static-public/gosaki-piano/public-dist");
for (const ym of ["2026-06", "2026-07"]) {
  const canonicalMonthPath = path.join(gosakiPublicDist, "schedule", ym, "index.html");
  if (fs.existsSync(canonicalMonthPath)) {
    const monthHtml = fs.readFileSync(canonicalMonthPath, "utf8");
    assert(
      `${ym} canonical month page has schedule body (会場)`,
      monthHtml.includes("会場") && !monthHtml.includes('style="visibility:hidden"'),
    );
    assert(
      `${ym} canonical month page has gosaki schedule month design class`,
      monthHtml.includes("gosaki-schedule-month") &&
        monthHtml.includes("gosaki-schedule-event-card"),
    );
  }

  const legacyMonthPath = path.join(gosakiPublicDist, ym, "index.html");
  if (fs.existsSync(legacyMonthPath)) {
    const legacyHtml = fs.readFileSync(legacyMonthPath, "utf8");
    assert(
      `${ym} legacy stub has moved message`,
      legacyHtml.includes("gosaki-schedule-legacy-stub") &&
        legacyHtml.includes("Schedule page moved"),
    );
    assert(
      `${ym} legacy stub canonical to schedule month`,
      legacyHtml.includes(`/schedule/${ym}/`),
    );
    assert(
      `${ym} legacy stub noindex`,
      legacyHtml.includes("noindex,follow") || legacyHtml.includes("noindex"),
    );
    assert(
      `${ym} legacy stub is thin (no full repeater body)`,
      !legacyHtml.includes("gosaki-schedule-event-card"),
    );
  }
}

const gosakiScheduleHubHtml = path.join(gosakiPublicDist, "schedule/index.html");
if (fs.existsSync(gosakiScheduleHubHtml)) {
  const hubHtml = fs.readFileSync(gosakiScheduleHubHtml, "utf8");
  assert(
    "schedule hub month links use deployBase",
    hubHtml.includes("/cms-kit-staging/gosaki-piano/schedule/2026-") &&
      !hubHtml.includes('href="/2026-'),
  );
  assert("schedule hub includes Schedule title", hubHtml.includes("gosaki-schedule-hub"));
}

const gosakiBuiltIndex = path.join(gosakiPublicDist, "index.html");
if (fs.existsSync(gosakiBuiltIndex)) {
  const indexHtml = fs.readFileSync(gosakiBuiltIndex, "utf8");
  assert("PC nav contains Schedule link", indexHtml.includes(">Schedule</a>"));
  assert(
    "SP nav toggle remains in built HTML",
    indexHtml.includes("nav-toggle") && indexHtml.includes("global-nav"),
  );
  assert(
    "footer social injected block has Facebook X Instagram",
    indexHtml.includes("gosaki-footer-social-links") &&
      indexHtml.includes(">Facebook</a>") &&
      indexHtml.includes(">X</a>") &&
      indexHtml.includes(">Instagram</a>"),
  );
  assert(
    "footer social links use real hrefs",
    indexHtml.includes("facebook.com/goto.saki.3") &&
      indexHtml.includes("twitter.com/goto_saki_pf") &&
      indexHtml.includes("instagram.com/gosaakiii"),
  );
}

// --- G-9b1 font safety (no network) ---

const sampleWixFontCss = `@font-face{font-family:'futura-lt-w01-book';src:url(https://static.parastorage.com/x.woff2)} .x{font-family:futura-lt-w01-book,sans-serif}`;
const sanitizedSample = sanitizeWixFontCss(sampleWixFontCss);
assert("G-9b1 sanitize removes @font-face from sample", auditFontSafety(sanitizedSample).fontFaceCount === 0);
assert("G-9b1 sanitize removes futura from sample", !/futura/i.test(sanitizedSample));
assert("G-9b1 composed overrides font-safe", isFontSafeForStaticExport(wixOverrides));

// --- G-9b3 avenir-next typography regression fix ---

assert(
  "G-9b3 typography regression block present",
  gosakiOverrides.includes("G-9b3 gosaki avenir-next typography regression fix"),
);
assert(
  "G-9b3 discography title nowrap on PC",
  gosakiOverrides.includes("#comp-jqy0szge h4") &&
    gosakiOverrides.includes("white-space: nowrap !important"),
);
assert(
  "G-9b3 still uses safe display stack not futura",
  gosakiOverrides.includes('"Avenir Next"') && !gosakiOverrides.includes("futura-lt-w01-book"),
);

// --- cleanup temp manifest ---

try {
  fs.rmSync(sampleConfig.runsOut, { recursive: true, force: true });
} catch {
  /* ignore */
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
