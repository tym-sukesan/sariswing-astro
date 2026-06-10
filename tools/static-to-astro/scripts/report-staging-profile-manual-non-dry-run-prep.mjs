#!/usr/bin/env node
/**
 * G-6-d-manual-non-dry-run-prep — Manual non-dry-run prep report.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runStagingProfileManualNonDryRunPrepReport,
  writeStagingProfileManualNonDryRunPrepOutput,
} from "./lib/staging-profile-manual-non-dry-run-prep-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printHelp() {
  console.log(`Usage: node scripts/report-staging-profile-manual-non-dry-run-prep.mjs [options]

G-6-d-manual-non-dry-run-prep report. No writes. Cursor does not set DRY_RUN=false.

Options:
  --out-dir PATH
  --site-id ID
  --help, -h
`);
}

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  const opts = { outDir: null, siteId: null, help: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--out-dir") {
      opts.outDir = argv[++i];
      continue;
    }
    if (arg === "--site-id") {
      opts.siteId = argv[++i];
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  const toolRoot = DEFAULT_TOOL_ROOT;
  let siteId = opts.siteId;
  if (!siteId && opts.outDir) {
    siteId = path.basename(path.resolve(opts.outDir));
  }
  if (!siteId) siteId = "default";

  const report = await runStagingProfileManualNonDryRunPrepReport({
    toolRoot,
    siteId,
  });

  console.log(
    "static-to-astro report-staging-profile-manual-non-dry-run-prep",
  );
  console.log(`  phase: ${report.phase}`);
  console.log(`  schemaApplied: ${report.schemaApplied}`);
  console.log(`  dryRunPassed: ${report.dryRunPassed}`);
  console.log(
    `  readyForManualNonDryRunDecision: ${report.readyForManualNonDryRunDecision}`,
  );
  console.log(`  cursorExecutesUpdate: ${report.cursorExecutesUpdate}`);
  console.log(`  cursorSetsDryRunFalse: ${report.cursorSetsDryRunFalse}`);
  console.log(`  targetTable: ${report.targetTable}`);
  console.log(`  operation: ${report.operation}`);
  console.log(`  recommendedFirstChange: ${report.recommendedFirstChange}`);
  console.log(`  nonDryRunExecuted: ${report.nonDryRunExecuted}`);
  console.log(
    `  readyForManualNonDryRunExecution: ${report.readyForManualNonDryRunExecution}`,
  );
  console.log(`  readyForG6DResultReport: ${report.readyForG6DResultReport}`);
  console.log(`  readyForG6E: ${report.readyForG6E}`);
  console.log(`  adminRouteConnected: ${report.adminRouteConnected}`);
  console.log(`  productionDataTouched: ${report.productionDataTouched}`);

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } =
      writeStagingProfileManualNonDryRunPrepOutput(absOut, report);
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  if (!report.prepComplete) {
    console.error("Blockers:", report.blockers.join(", "));
    process.exit(1);
  }

  console.log("OK — manual non-dry-run prep report complete.");
}

main();
