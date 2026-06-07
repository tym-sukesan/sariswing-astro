#!/usr/bin/env node
/**
 * Verify site profile system (Phase 3-W).
 *
 * Usage:
 *   node tools/static-to-astro/scripts/verify-site-profiles.mjs \
 *     --report tools/static-to-astro/output/site-profiles/SITE_PROFILE_VERIFY_REPORT.md
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatSiteProfileVerifySummary,
  runSiteProfileVerification,
} from "./lib/site-profile-verifier.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/verify-site-profiles.mjs [options]

Verify site profile JSON definitions and gosaki convert compatibility.

Options:
  --report PATH   SITE_PROFILE_VERIFY_REPORT.md output (required)
  --fixture PATH  Static site fixture (default: tools/static-to-astro/fixtures/gosaki-static-site)
  --base-url URL  Base URL for convert (default: https://www.gosaki-piano.com)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    report: null,
    fixture: "tools/static-to-astro/fixtures/gosaki-static-site",
    baseUrl: "https://www.gosaki-piano.com",
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
    if (arg === "--fixture") {
      opts.fixture = argv[++i];
      continue;
    }
    if (arg === "--base-url") {
      opts.baseUrl = argv[++i];
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

  console.log("Site profile verification (Phase 3-W dry-run)");

  const result = runSiteProfileVerification({
    repoRoot: REPO_ROOT,
    toolRoot: TOOL_ROOT,
    reportPath: opts.report,
    fixtureRel: opts.fixture,
    baseUrl: opts.baseUrl,
  });

  console.log(formatSiteProfileVerifySummary(result));
  console.log(`Report: ${opts.report}`);

  if (!result.ok) {
    for (const err of result.errors) {
      console.error(`  ERROR: ${err}`);
    }
    process.exit(1);
  }
}

main();
