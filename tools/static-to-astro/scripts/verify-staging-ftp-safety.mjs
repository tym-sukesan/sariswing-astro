#!/usr/bin/env node
/**
 * Verify staging FTP target safety before G-2b apply (Phase G-2b-prep).
 *
 * Usage:
 *   node tools/static-to-astro/scripts/verify-staging-ftp-safety.mjs \
 *     --report tools/static-to-astro/output/deploy/gosaki/STAGING_FTP_SAFETY_REPORT.md
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatSafetySummary,
  runStagingFtpSafetyVerification,
} from "./lib/staging-ftp-safety-verifier.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/verify-staging-ftp-safety.mjs [options]

Static safety check for GOSAKI_STAGING_FTP_* before G-2b apply.
Does NOT connect to FTP. Does NOT run --apply.

Options:
  --report PATH     STAGING_FTP_SAFETY_REPORT.md output (required)
  --env-file PATH   Env file (default: tools/static-to-astro/.env.local)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    report: null,
    envFile: null,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--report") {
      opts.report = argv[++i];
      continue;
    }
    if (arg === "--env-file") {
      opts.envFile = argv[++i];
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

  if (!opts.report) {
    printHelp();
    process.exit(1);
  }

  console.log("Staging FTP safety check (Phase G-2b-prep)");
  console.log("No FTP connection. No --apply.");

  const result = runStagingFtpSafetyVerification({
    toolRoot: TOOL_ROOT,
    repoRoot: REPO_ROOT,
    reportPath: opts.report,
    envFile: opts.envFile,
  });

  console.log(formatSafetySummary(result));
  console.log(`Report: ${opts.report}`);

  if (!result.stagingFtpSafeToApply) {
    for (const err of result.errors) {
      console.error(`  NOTE: ${err}`);
    }
    process.exit(result.requiredComplete ? 1 : 0);
  }
}

main();
