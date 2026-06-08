#!/usr/bin/env node
/**
 * gosaki readiness verification (Phase 3-Y).
 *
 * Usage:
 *   node tools/static-to-astro/scripts/verify-gosaki-readiness.mjs \
 *     --report tools/static-to-astro/output/readiness/gosaki/GOSAKI_READINESS_REPORT.md
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatReadinessSummary,
  runGosakiReadinessVerification,
} from "./lib/gosaki-readiness-verifier.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/verify-gosaki-readiness.mjs [options]

Aggregate gosaki readiness checks before staging FTP apply (G-2b).
Default: dry-run only — no FTP connection, no production deploy.

Options:
  --report PATH           GOSAKI_READINESS_REPORT.md output (required)
  --skip-cms-loop         Skip CMS minimal loop (warning)
  --skip-storage-plan     Skip storage asset plan (warning)
  --skip-deploy-plan      Skip deploy dry-run / plan verifier (warning)
  --keep-output           Note in report that output artifacts are kept
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    report: null,
    skipCmsLoop: false,
    skipStoragePlan: false,
    skipDeployPlan: false,
    keepOutput: false,
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
    if (arg === "--skip-cms-loop") {
      opts.skipCmsLoop = true;
      continue;
    }
    if (arg === "--skip-storage-plan") {
      opts.skipStoragePlan = true;
      continue;
    }
    if (arg === "--skip-deploy-plan") {
      opts.skipDeployPlan = true;
      continue;
    }
    if (arg === "--keep-output") {
      opts.keepOutput = true;
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

  console.log("gosaki readiness verification (Phase 3-Y dry-run)");
  console.log("No FTP connection. No production deploy.");

  const result = runGosakiReadinessVerification({
    repoRoot: REPO_ROOT,
    toolRoot: TOOL_ROOT,
    reportPath: opts.report,
    skipCmsLoop: opts.skipCmsLoop,
    skipStoragePlan: opts.skipStoragePlan,
    skipDeployPlan: opts.skipDeployPlan,
    keepOutput: opts.keepOutput,
  });

  console.log(formatReadinessSummary(result));
  console.log(`Report: ${opts.report}`);

  if (!result.ok) {
    for (const err of result.errors) {
      console.error(`  ERROR: ${err}`);
    }
    process.exit(1);
  }
}

main();
