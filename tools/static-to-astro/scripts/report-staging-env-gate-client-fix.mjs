#!/usr/bin/env node
/**
 * G-6-d-staging-env-gate-client-fix — Env gate client fix report.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runStagingEnvGateClientFixReport,
  writeFixOutput,
} from "./lib/staging-env-gate-client-fix-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printHelp() {
  console.log(`Usage: node scripts/report-staging-env-gate-client-fix.mjs [options]

G-6-d-staging-env-gate-client-fix report. No writes.

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

  const report = runStagingEnvGateClientFixReport({ toolRoot, siteId });

  console.log("static-to-astro report-staging-env-gate-client-fix");
  console.log(`  phase: ${report.phase}`);
  console.log(`  envGateClientFixComplete: ${report.envGateClientFixComplete}`);
  console.log(
    `  authEnabledDiagnosticAccurate: ${report.authEnabledDiagnosticAccurate}`,
  );
  console.log(
    `  writeGateDiagnosticAccurate: ${report.writeGateDiagnosticAccurate}`,
  );
  console.log(`  nonDryRunExecuted: ${report.nonDryRunExecuted}`);
  console.log(`  cursorSetsDryRunFalse: ${report.cursorSetsDryRunFalse}`);
  console.log(`  dbWritePerformedByCursor: ${report.dbWritePerformedByCursor}`);
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
    const { jsonPath, mdPath } = writeFixOutput(absOut, report);
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  if (!report.fixComplete) {
    console.error("Blockers:", report.blockers.join(", "));
    process.exit(1);
  }

  console.log("OK — staging env gate client fix report complete.");
}

main();
