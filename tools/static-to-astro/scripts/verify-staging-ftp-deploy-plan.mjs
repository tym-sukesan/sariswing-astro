#!/usr/bin/env node
/**
 * Verify staging FTP deploy plan (Phase G-2 dry-run).
 *
 * Usage:
 *   node tools/static-to-astro/scripts/verify-staging-ftp-deploy-plan.mjs \
 *     --public-dir tools/static-to-astro/output/static-public/gosaki/public-dist \
 *     --report tools/static-to-astro/output/deploy/gosaki/STAGING_FTP_DEPLOY_PLAN_VERIFY_REPORT.md
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatVerifierSummary,
  runStagingFtpDeployPlanVerification,
} from "./lib/staging-ftp-deploy-plan-verifier.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/verify-staging-ftp-deploy-plan.mjs [options]

Verify deploy-public-dist-ftp.mjs dry-run plan and safety gates.

Options:
  --public-dir PATH   public-dist directory (required)
  --report PATH       STAGING_FTP_DEPLOY_PLAN_VERIFY_REPORT.md (required)
  --site-slug SLUG    Site slug (default: gosaki)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    publicDir: null,
    report: null,
    siteSlug: "gosaki",
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--public-dir") {
      opts.publicDir = argv[++i];
      continue;
    }
    if (arg === "--report") {
      opts.report = argv[++i];
      continue;
    }
    if (arg === "--site-slug") {
      opts.siteSlug = argv[++i];
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

  if (!opts.publicDir || !opts.report) {
    printHelp();
    process.exit(1);
  }

  console.log("Staging FTP deploy plan verification (Phase G-2)");

  const result = runStagingFtpDeployPlanVerification({
    repoRoot: REPO_ROOT,
    toolRoot: TOOL_ROOT,
    publicDir: path.resolve(REPO_ROOT, opts.publicDir),
    reportPath: opts.report,
    siteSlug: opts.siteSlug,
  });

  console.log(formatVerifierSummary(result));
  console.log(`Report: ${opts.report}`);

  if (!result.ok) {
    for (const err of result.errors) {
      console.error(`  ERROR: ${err}`);
    }
    process.exit(1);
  }
}

main();
