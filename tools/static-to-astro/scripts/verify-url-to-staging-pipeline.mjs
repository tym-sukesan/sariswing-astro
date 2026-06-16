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
import { buildGosakiPianoSiteOverridesCss } from "./lib/site-specific-overrides/gosaki-piano-overrides.mjs";
import {
  extractGosakiFooterSocialLinks,
  injectGosakiFooterSocialBlock,
} from "./lib/gosaki-footer-social.mjs";
import { generateHeaderAstro } from "./lib/header-transform.mjs";
import { parseScheduleMonthSourcePath } from "./lib/schedule-pages.mjs";
import {
  injectBandProfilesIntoAboutPage,
  loadGosakiBandProfilesConfig,
  verifyAboutBandProfilesHtml,
} from "./lib/gosaki-about-band-profiles.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

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
    "/cms-kit-staging/gosaki-piano/2026-07/",
  ) === "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/2026-07/",
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
  ) === "/2026-07/",
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
  gosakiOverrides.includes("#9e3b1b") && gosakiOverrides.includes("futura-lt-w01-book"),
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

const gosakiPublicDist = path.join(TOOL_ROOT, "output/static-public/gosaki-piano/public-dist");
for (const ym of ["2026-06", "2026-07"]) {
  const monthHtmlPath = path.join(gosakiPublicDist, ym, "index.html");
  if (fs.existsSync(monthHtmlPath)) {
    const monthHtml = fs.readFileSync(monthHtmlPath, "utf8");
    assert(
      `${ym} month page has schedule body (会場)`,
      monthHtml.includes("会場") && !monthHtml.includes('style="visibility:hidden"'),
    );
    assert(
      `${ym} month page has gosaki schedule month design class`,
      monthHtml.includes("gosaki-schedule-month") &&
        monthHtml.includes("gosaki-schedule-event-card"),
    );
  }
}

const gosakiScheduleHubHtml = path.join(gosakiPublicDist, "schedule/index.html");
if (fs.existsSync(gosakiScheduleHubHtml)) {
  const hubHtml = fs.readFileSync(gosakiScheduleHubHtml, "utf8");
  assert(
    "schedule hub month links use deployBase",
    hubHtml.includes("/cms-kit-staging/gosaki-piano/2026-") &&
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

// --- cleanup temp manifest ---

try {
  fs.rmSync(sampleConfig.runsOut, { recursive: true, force: true });
} catch {
  /* ignore */
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
