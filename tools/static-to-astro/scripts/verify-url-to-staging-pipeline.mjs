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

// --- cleanup temp manifest ---

try {
  fs.rmSync(sampleConfig.runsOut, { recursive: true, force: true });
} catch {
  /* ignore */
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
