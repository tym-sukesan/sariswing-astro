#!/usr/bin/env node
/**
 * G-6-d-auth-session-display-investigation — Investigation report.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runStagingAuthSessionDisplayInvestigationReport,
  writeInvestigationOutput,
} from "./lib/staging-auth-session-display-investigation-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printHelp() {
  console.log(`Usage: node scripts/report-staging-auth-session-display-investigation.mjs [options]

G-6-d-auth-session-display-investigation report. No writes.

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

function main() {
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

  const report = runStagingAuthSessionDisplayInvestigationReport({
    toolRoot,
    siteId,
  });

  console.log(
    "static-to-astro report-staging-auth-session-display-investigation",
  );
  console.log(`  phase: ${report.phase}`);
  console.log(`  nonDryRunAborted: ${report.nonDryRunAborted}`);
  console.log(`  nonDryRunExecuted: ${report.nonDryRunExecuted}`);
  console.log(`  cursorSetsDryRunFalse: ${report.cursorSetsDryRunFalse}`);
  console.log(`  dbWritePerformedByCursor: ${report.dbWritePerformedByCursor}`);
  console.log(
    `  writeGateDiagnosticsVisible: ${report.writeGateDiagnosticsVisible}`,
  );
  console.log(
    `  readyForManualNonDryRunExecution: ${report.readyForManualNonDryRunExecution}`,
  );
  console.log(`  readyForG6E: ${report.readyForG6E}`);
  console.log(`  adminRouteConnected: ${report.adminRouteConnected}`);
  console.log(`  productionDataTouched: ${report.productionDataTouched}`);

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeInvestigationOutput(absOut, report);
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  if (!report.investigationComplete) {
    console.error("Blockers:", report.blockers.join(", "));
    process.exit(1);
  }

  console.log("OK — auth session display investigation report complete.");
}

main();
