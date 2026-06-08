#!/usr/bin/env node
/**
 * Deploy public-dist to staging FTP only (Phase G-2).
 *
 * Usage:
 *   node tools/static-to-astro/scripts/deploy-public-dist-ftp.mjs \
 *     --public-dir tools/static-to-astro/output/static-public/gosaki/public-dist \
 *     --site-slug gosaki \
 *     --env staging \
 *     --report tools/static-to-astro/output/deploy/gosaki/STAGING_FTP_DEPLOY_REPORT.md \
 *     --manifest tools/static-to-astro/output/deploy/gosaki/staging-ftp-deploy-manifest.json
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatDeploySummary,
  runPublicDistFtpDeploy,
} from "./lib/public-dist-ftp-deployer.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/deploy-public-dist-ftp.mjs [options]

Deploy public-dist/ to staging FTP only. Default: dry-run (no FTP connection).

Options:
  --public-dir PATH   public-dist directory (required)
  --site-slug SLUG    Site slug (default: gosaki)
  --env ENV           Must be "staging" (required)
  --report PATH       STAGING_FTP_DEPLOY_REPORT.md output (required)
  --manifest PATH     staging-ftp-deploy-manifest.json output (required)
  --apply             Connect to FTP and upload (staging only)
  --dry-run           Force dry-run even if --apply passed
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    publicDir: null,
    siteSlug: "gosaki",
    env: null,
    report: null,
    manifest: null,
    apply: false,
    dryRun: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--apply") {
      opts.apply = true;
      continue;
    }
    if (arg === "--dry-run") {
      opts.dryRun = true;
      continue;
    }
    if (arg === "--public-dir") {
      opts.publicDir = argv[++i];
      continue;
    }
    if (arg === "--site-slug") {
      opts.siteSlug = argv[++i];
      continue;
    }
    if (arg === "--env") {
      opts.env = argv[++i];
      continue;
    }
    if (arg === "--report") {
      opts.report = argv[++i];
      continue;
    }
    if (arg === "--manifest") {
      opts.manifest = argv[++i];
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  if (!opts.publicDir || !opts.env || !opts.report || !opts.manifest) {
    printHelp();
    process.exit(1);
  }

  console.log("Staging FTP deploy (Phase G-2)");
  console.log(`Public dir: ${opts.publicDir}`);
  console.log(`Env: ${opts.env}`);
  console.log(`Mode: ${opts.apply && !opts.dryRun ? "apply" : "dry-run"}`);

  const result = runPublicDistFtpDeploy({
    publicDir: path.resolve(REPO_ROOT, opts.publicDir),
    siteSlug: opts.siteSlug,
    env: opts.env,
    toolRoot: TOOL_ROOT,
    repoRoot: REPO_ROOT,
    apply: opts.apply,
    dryRun: opts.dryRun,
    reportPath: opts.report,
    manifestOutPath: opts.manifest,
  });

  console.log(formatDeploySummary(result));
  console.log(`Report: ${opts.report}`);
  console.log(`Manifest: ${opts.manifest}`);

  if (!result.ok) {
    for (const err of result.errors) {
      console.error(`  ERROR: ${err}`);
    }
    process.exit(1);
  }
}

main();
