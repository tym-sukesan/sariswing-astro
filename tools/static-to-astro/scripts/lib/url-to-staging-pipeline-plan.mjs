/**
 * URL-to-staging pipeline step plan (G-7b) — no heavy analyzer/generator imports.
 */

import fs from "node:fs";
import path from "node:path";

export const PIPELINE_PHASE = "G-7b-url-to-staging-pipeline-orchestrator";
export const G7C_PILOT_PHASE = "G-7c-url-to-staging-dry-run-pilot";
export const G7D_PILOT_PHASE = "G-7d-gosaki-live-crawl-pilot";
export const G7D1_PILOT_PHASE = "G-7d1-gosaki-live-route-static-public-compatibility-fix";
export const G7E_PILOT_PHASE = "G-7e-gosaki-staging-preview-preparation";
export const G7F_NEXT_PHASE = "G-7f-gosaki-staging-upload-execution";
export const G7E_NEXT_PHASE = G7E_PILOT_PHASE;

/**
 * @typedef {Object} PipelineGates
 * @property {boolean} runCrawl
 * @property {boolean} runConvert
 * @property {boolean} runBuild
 * @property {boolean} preparePublic
 * @property {boolean} deployFtp
 */

/**
 * @typedef {Object} PipelineStepPlan
 * @property {string} id
 * @property {string} label
 * @property {"ready" | "skipped" | "planned" | "executed" | "failed"} status
 * @property {boolean} wouldRun
 * @property {boolean} wouldWrite
 * @property {boolean} wouldDeploy
 * @property {string | null} command
 * @property {Record<string, unknown>} [details]
 */

/**
 * @param {ReturnType<import("./url-to-staging-config-loader.mjs").normalizeUrlToStagingConfig>} config
 * @param {PipelineGates} gates
 * @param {boolean} dryRun
 */
export function buildUrlToStagingStepPlan(config, gates, dryRun) {
  const baseUrl = config.stagingBaseUrl ?? config.productionBaseUrl ?? config.startUrl;
  const fixtureExists = fs.existsSync(config.fixtureOut);

  /** @type {PipelineStepPlan[]} */
  const steps = [];

  steps.push({
    id: "validate-config",
    label: "Validate config / args",
    status: "ready",
    wouldRun: true,
    wouldWrite: false,
    wouldDeploy: false,
    command: null,
    details: {
      siteSlug: config.siteSlug,
      startUrl: config.startUrl,
      fixtureOut: config.fixtureOutRel,
      projectOut: config.projectOutRel,
      deployBase: config.deployBase,
      stagingBaseUrl: config.stagingBaseUrl,
    },
  });

  const crawlWouldRun = gates.runCrawl && !dryRun;
  steps.push({
    id: "crawl-fixture",
    label: "Crawl static site into fixture",
    status: gates.runCrawl ? (dryRun ? "planned" : "ready") : "skipped",
    wouldRun: crawlWouldRun,
    wouldWrite: crawlWouldRun,
    wouldDeploy: false,
    command: `node scripts/crawl-static-site.mjs --url ${config.startUrl} --site-slug ${config.siteSlug} --out ${config.fixtureOutRel} --max-pages ${config.maxPages}${dryRun ? " --dry-run" : ""}`,
    details: {
      gate: "runCrawl",
      maxPages: config.maxPages,
      sameOriginOnly: config.sameOriginOnly,
      respectRobots: config.respectRobots,
      skippedReason: gates.runCrawl ? null : "gate runCrawl=false",
    },
  });

  const analyzeWouldRun = !dryRun && (gates.runCrawl || fixtureExists);
  steps.push({
    id: "analyze-fixture",
    label: "Analyze static HTML fixture",
    status: fixtureExists || gates.runCrawl ? (dryRun ? "planned" : "ready") : "skipped",
    wouldRun: analyzeWouldRun,
    wouldWrite: analyzeWouldRun,
    wouldDeploy: false,
    command: `node scripts/analyze-static-site.mjs ${config.fixtureOutRel} --base-url ${baseUrl} --json --out <runs>/<site>-analysis.json`,
    details: {
      fixtureExists,
      skippedReason: !fixtureExists && !gates.runCrawl ? "fixture missing and runCrawl=false" : null,
    },
  });

  const convertWouldRun = gates.runConvert && !dryRun;
  steps.push({
    id: "convert-static-to-astro",
    label: "Convert static HTML to Astro project",
    status: gates.runConvert ? (dryRun ? "planned" : "ready") : "skipped",
    wouldRun: convertWouldRun,
    wouldWrite: convertWouldRun,
    wouldDeploy: false,
    command: [
      `node scripts/convert-static-to-astro.mjs ${config.fixtureOutRel} ${config.projectOutRel}`,
      config.siteKey ? `--site ${config.siteKey}` : "",
      config.stagingBaseUrl ? `--base-url ${config.stagingBaseUrl}` : "",
      `--deploy-base ${config.deployBase}`,
      `--site-profile ${config.siteProfile}`,
      gates.runBuild ? "--verify-build" : "",
      dryRun ? "--dry-run" : "",
    ]
      .filter(Boolean)
      .join(" "),
    details: {
      gate: "runConvert",
      siteKey: config.siteKey ?? config.siteSlug,
      siteProfile: config.siteProfile,
      skippedReason: gates.runConvert ? null : "gate runConvert=false",
    },
  });

  const buildWouldRun = gates.runBuild && !dryRun && gates.runConvert;
  steps.push({
    id: "build-check",
    label: gates.runBuild ? "Astro build (verify-build or npm run build)" : "Astro build check",
    status: gates.runBuild ? (dryRun ? "planned" : "ready") : "skipped",
    wouldRun: buildWouldRun,
    wouldWrite: buildWouldRun,
    wouldDeploy: false,
    command: gates.runConvert && gates.runBuild
      ? `(via convert --verify-build) or npm run build in ${config.projectOutRel}`
      : null,
    details: {
      gate: "runBuild",
      skippedReason: gates.runBuild ? null : "gate runBuild=false",
    },
  });

  const publicWouldRun = gates.preparePublic && !dryRun;
  steps.push({
    id: "prepare-staging-public",
    label: "Prepare staging static-public artifact",
    status: gates.preparePublic ? (dryRun ? "planned" : "ready") : "skipped",
    wouldRun: publicWouldRun,
    wouldWrite: publicWouldRun,
    wouldDeploy: false,
    command: `node scripts/verify-static-public-artifact.mjs --astro-dir ${config.projectOutRel} --report ${config.staticPublicOutRel}/STATIC_PUBLIC_ARTIFACT_REPORT.md`,
    details: {
      gate: "preparePublic",
      staticPublicOut: config.staticPublicOutRel,
      skippedReason: gates.preparePublic ? null : "gate preparePublic=false",
    },
  });

  steps.push({
    id: "deploy-ftp",
    label: "FTP deploy to staging (operator-only)",
    status: gates.deployFtp ? "planned" : "skipped",
    wouldRun: false,
    wouldWrite: false,
    wouldDeploy: false,
    command: "node scripts/deploy-public-dist-ftp.mjs --apply --env staging (NOT executed in G-7b)",
    details: {
      gate: "deployFtp",
      deployBase: config.deployBase,
      notSupportedInPhase: "G-7b — use deploy-public-dist-ftp.mjs manually after QA",
      skippedReason: gates.deployFtp ? null : "gate deployFtp=false (default)",
    },
  });

  steps.push({
    id: "write-run-manifest",
    label: "Write run manifest",
    status: dryRun ? "planned" : "ready",
    wouldRun: true,
    wouldWrite: true,
    wouldDeploy: false,
    command: null,
    details: {
      manifestPath: "<runs>/<timestamp>-<siteSlug>.json",
      dryRunWritesToGitignoredOutput: dryRun,
    },
  });

  steps.push({
    id: "print-next-manual-steps",
    label: "Print next manual operator steps",
    status: "ready",
    wouldRun: true,
    wouldWrite: false,
    wouldDeploy: false,
    command: null,
  });

  return steps;
}

/**
 * @param {ReturnType<import("./url-to-staging-config-loader.mjs").normalizeUrlToStagingConfig>} config
 */
export function buildSeoStagingPlan(config) {
  return {
    deployBase: config.deployBase,
    stagingBaseUrl: config.stagingBaseUrl,
    productionBaseUrl: config.productionBaseUrl,
    stagingNoindex: config.seo.stagingNoindex,
    robotsDisallowAll: config.seo.robotsDisallowAll,
    canonicalMode: config.seo.canonicalMode,
    wiredViaConvert: Boolean(config.stagingBaseUrl && config.deployBase),
    planned: [
      "Ensure convert uses stagingBaseUrl (not production) for site / sitemap / og:url",
      "Verify robots.txt Disallow: / on staging when robotsDisallowAll=true",
      "Verify noindex meta on staging pages when stagingNoindex=true",
      "Sitemap URLs must use staging host + deployBase prefix",
      "Do not leak production canonical URLs in staging HTML",
    ],
    requiredBeforeFtp: [
      "Run verify-static-public-artifact.mjs",
      "Run verify-staging-ftp-safety.mjs",
      "Confirm staging URL in browser with noindex",
    ],
  };
}

/**
 * @param {ReturnType<import("./url-to-staging-config-loader.mjs").normalizeUrlToStagingConfig>} config
 * @param {PipelineGates} gates
 * @param {boolean} dryRun
 */
export function buildNextManualSteps(config, gates, dryRun) {
  /** @type {string[]} */
  const steps = [];
  if (dryRun) {
    steps.push("Review dry-run manifest and step plan.");
    steps.push("Re-run with --no-dry-run --run-crawl only after operator approval for live crawl.");
  }
  if (!gates.runCrawl) {
    steps.push(`Ensure fixture exists at ${config.fixtureOutRel} or pass --run-crawl.`);
  }
  if (!gates.runConvert) {
    const siteFlag = config.siteKey ? ` --site ${config.siteKey}` : "";
    steps.push(
      `Run convert: node scripts/convert-static-to-astro.mjs ${config.fixtureOutRel} ${config.projectOutRel}${siteFlag} --base-url <staging> --deploy-base ${config.deployBase}`,
    );
  }
  if (!gates.runBuild) {
    steps.push(`Build: cd ${config.projectOutRel} && npm install && npm run build`);
  }
  if (!gates.preparePublic) {
    steps.push(
      `Prepare static-public: node scripts/verify-static-public-artifact.mjs --astro-dir ${config.projectOutRel}`,
    );
  }
  steps.push("QA staging URL in browser (noindex, robots, canonical).");
  steps.push(
    "FTP deploy: node scripts/deploy-public-dist-ftp.mjs --dry-run then --apply (staging only, separate approval).",
  );
  steps.push("Do NOT trigger workflow_dispatch or production deploy from this pipeline.");
  return steps;
}

/**
 * @param {string} siteSlug
 * @param {string} runsOut
 */
export function buildRunManifestPath(siteSlug, runsOut) {
  const ts = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "Z");
  return path.join(runsOut, `${ts}-${siteSlug}.json`);
}
