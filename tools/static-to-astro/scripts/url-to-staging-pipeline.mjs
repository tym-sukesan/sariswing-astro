#!/usr/bin/env node
/**
 * URL-to-staging pipeline orchestrator CLI (G-7b).
 *
 * Usage:
 *   npm run url:staging -- --config config/sites/gosaki-piano.url-to-staging.json --dry-run
 *   npm run url:staging -- --url https://www.example.com/ --site-slug example --dry-run
 *
 * Default: --dry-run (safe). External crawl / FTP / workflow_dispatch are off unless explicitly gated.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildUrlToStagingConfigFromSite,
} from "./lib/url-to-staging-site-registry.mjs";
import {
  loadUrlToStagingConfig,
  mergeConfigWithCli,
  normalizeUrlToStagingConfig,
  validateUrlToStagingConfig,
} from "./lib/url-to-staging-config-loader.mjs";
import { runUrlToStagingPipeline } from "./lib/url-to-staging-pipeline.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

function printHelp() {
  console.log(`Usage: node scripts/url-to-staging-pipeline.mjs [options]

Orchestrate crawl → analyze → convert → build → static-public for URL-to-staging pipeline.

Options:
  --site SITE_KEY        Resolve config from site registry (e.g. gosaki-piano, pilot-sample-static)
  --config PATH          Site config JSON (e.g. config/sites/gosaki-piano.url-to-staging.json)
  --url URL              Start URL (overrides config)
  --site-slug SLUG       Site slug (overrides config)
  --fixture-out PATH     Fixture output directory
  --project-out PATH     Generated Astro project directory
  --deploy-base PATH     Astro deploy base (e.g. /cms-kit-staging/gosaki-piano/)
  --staging-base-url URL Staging public URL for SEO / sitemap (NOT production)
  --max-pages N          Crawl page limit
  --site-profile ID      Site profile for convert (default: musician)

  --dry-run              Plan only; no external crawl, no writes except gitignored manifest (default)
  --no-dry-run           Allow gated execution steps

  Step gates (all default false except dry-run):
  --run-crawl            Execute live crawl (requires --no-dry-run; operator approval)
  --run-convert          Run convert-static-to-astro
  --run-build            Run Astro build (--verify-build on convert)
  --prepare-public       Run static-public artifact verification
  --deploy-ftp           Plan FTP deploy only (NOT executed in G-7b)

  --no-manifest          Skip writing manifest to output/runs/
  --pilot-phase ID       Override manifest phase (e.g. G-7c-url-to-staging-dry-run-pilot)
  --help, -h             Show help

Examples:
  npm run url:staging -- \\
    --site gosaki-piano \\
    --dry-run

  npm run url:staging -- \\
    --config config/sites/gosaki-piano.url-to-staging.json \\
    --dry-run

  npm run url:staging -- \\
    --url https://www.example.com/ \\
    --site-slug example \\
    --fixture-out fixtures/example \\
    --project-out output/example-astro \\
    --deploy-base /cms-kit-staging/example/ \\
    --dry-run

Safety: default dry-run. Do not crawl gosaki-piano.com without explicit operator approval.
`);
}

function parseArgs(argv) {
  /** @type {Record<string, unknown>} */
  const opts = {
    site: null,
    config: null,
    url: null,
    siteSlug: null,
    fixtureOut: null,
    projectOut: null,
    deployBase: null,
    stagingBaseUrl: null,
    maxPages: null,
    siteProfile: null,
    dryRun: true,
    runCrawl: false,
    runConvert: false,
    runBuild: false,
    preparePublic: false,
    deployFtp: false,
    writeManifest: true,
    pilotPhase: null,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--dry-run") {
      opts.dryRun = true;
      continue;
    }
    if (arg === "--no-dry-run") {
      opts.dryRun = false;
      continue;
    }
    if (arg === "--run-crawl") {
      opts.runCrawl = true;
      continue;
    }
    if (arg === "--run-convert") {
      opts.runConvert = true;
      continue;
    }
    if (arg === "--run-build") {
      opts.runBuild = true;
      continue;
    }
    if (arg === "--prepare-public") {
      opts.preparePublic = true;
      continue;
    }
    if (arg === "--deploy-ftp") {
      opts.deployFtp = true;
      continue;
    }
    if (arg === "--no-manifest") {
      opts.writeManifest = false;
      continue;
    }
    const nextVal = () => {
      const v = argv[++i];
      if (v == null || v.startsWith("-")) throw new Error(`Option ${arg} requires a value`);
      return v;
    };
    if (arg === "--config") opts.config = nextVal();
    else if (arg === "--site") opts.site = nextVal();
    else if (arg === "--url") opts.url = nextVal();
    else if (arg === "--site-slug") opts.siteSlug = nextVal();
    else if (arg === "--fixture-out") opts.fixtureOut = nextVal();
    else if (arg === "--project-out") opts.projectOut = nextVal();
    else if (arg === "--deploy-base") opts.deployBase = nextVal();
    else if (arg === "--staging-base-url") opts.stagingBaseUrl = nextVal();
    else if (arg === "--max-pages") opts.maxPages = Number(nextVal());
    else if (arg === "--site-profile") opts.siteProfile = nextVal();
    else if (arg === "--pilot-phase") opts.pilotPhase = nextVal();
    else if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}`);
    else throw new Error(`Unexpected argument: ${arg}`);
  }

  return opts;
}

/**
 * Build config from CLI-only args when no --config file.
 * @param {ReturnType<typeof parseArgs>} cli
 */
function configFromCliOnly(cli) {
  if (!cli.url || !cli.siteSlug) {
    throw new Error("--url and --site-slug required when --config is not provided");
  }
  const raw = {
    siteKey: cli.site ?? cli.siteSlug,
    siteSlug: cli.siteSlug,
    startUrl: cli.url,
    fixtureOut: cli.fixtureOut ?? `fixtures/${cli.siteSlug}`,
    projectOut: cli.projectOut ?? `output/${cli.siteSlug}-astro`,
    deployBase: cli.deployBase ?? `/cms-kit-staging/${cli.siteSlug}/`,
    stagingBaseUrl: cli.stagingBaseUrl ?? null,
    maxPages: cli.maxPages ?? 20,
    siteProfile: cli.siteProfile ?? "musician",
  };
  const validation = validateUrlToStagingConfig(raw);
  if (!validation.ok) {
    throw new Error(validation.errors.join("; "));
  }
  return normalizeUrlToStagingConfig(raw, TOOL_ROOT);
}

async function main() {
  let cli;
  try {
    cli = parseArgs(process.argv);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  if (cli.help) {
    printHelp();
    process.exit(0);
  }

  try {
    let config;
    if (cli.site) {
      config = buildUrlToStagingConfigFromSite(String(cli.site), TOOL_ROOT, cli);
    } else if (cli.config) {
      config = loadUrlToStagingConfig(String(cli.config), TOOL_ROOT);
      config = mergeConfigWithCli(config, cli);
      if (!config.siteKey) {
        config.siteKey = config.siteSlug;
      }
    } else {
      config = configFromCliOnly(cli);
    }

    if (cli.runCrawl && cli.dryRun) {
      console.warn("Note: --run-crawl with --dry-run uses crawl dry-run (no network writes).");
    }
    if (cli.runCrawl && !cli.dryRun) {
      console.warn("WARNING: Live crawl enabled. Ensure operator approval for external fetch.");
    }
    if (cli.deployFtp) {
      console.warn("Note: --deploy-ftp is plan-only in G-7b; FTP is never executed by this CLI.");
    }

    const gates = {
      runCrawl: Boolean(cli.runCrawl),
      runConvert: Boolean(cli.runConvert),
      runBuild: Boolean(cli.runBuild),
      preparePublic: Boolean(cli.preparePublic),
      deployFtp: Boolean(cli.deployFtp),
    };

    const manifest = await runUrlToStagingPipeline({
      config,
      gates,
      dryRun: Boolean(cli.dryRun),
      toolRoot: TOOL_ROOT,
      writeManifest: Boolean(cli.writeManifest),
      printSummary: true,
      pilotPhase: cli.pilotPhase ? String(cli.pilotPhase) : null,
    });

    const failed = manifest.steps.some((s) => s.status === "failed");
    process.exit(failed ? 1 : 0);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
