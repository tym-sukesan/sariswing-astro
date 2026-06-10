#!/usr/bin/env node
/**
 * G-6-d — Staging profile update PoC implementation report.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runStagingProfileUpdatePocImplementationReport,
  writeStagingProfileUpdatePocImplementationOutput,
} from "./lib/staging-profile-update-poc-implementation-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printHelp() {
  console.log(`Usage: node scripts/report-staging-profile-update-poc-implementation.mjs [options]

G-6-d implementation report. Scan only.

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

  const report = runStagingProfileUpdatePocImplementationReport({ toolRoot, siteId });

  console.log("static-to-astro report-staging-profile-update-poc-implementation (G-6-d)");
  console.log(`  phase: ${report.phase}`);
  console.log(`  approvalId: ${report.approvalId}`);
  console.log(`  enabledByDefault: ${report.enabledByDefault}`);
  console.log(`  dryRunDefault: ${report.dryRunDefault}`);
  console.log(`  targetModule: ${report.targetModule}`);
  console.log(`  targetOperation: ${report.targetOperation}`);
  console.log(`  targetFields: ${report.targetFields}`);
  console.log(`  stagingOnly: ${report.stagingOnly}`);
  console.log(`  canWriteDefault: ${report.canWriteDefault}`);
  console.log(`  writeOperationsEnabledDefault: ${report.writeOperationsEnabledDefault}`);
  console.log(`  writeAdapterImplemented: ${report.writeAdapterImplemented}`);
  console.log(`  dbWriteImplemented: ${report.dbWriteImplemented}`);
  console.log(`  sqlExecuted: ${report.sqlExecuted}`);
  console.log(`  rlsPolicyChanged: ${report.rlsPolicyChanged}`);
  console.log(`  storageConnected: ${report.storageConnected}`);
  console.log(`  publishConnected: ${report.publishConnected}`);
  console.log(`  adminRouteConnected: ${report.adminRouteConnected}`);
  console.log(`  productionDataTouched: ${report.productionDataTouched}`);
  console.log(`  readyForG6E: ${report.readyForG6E}`);
  console.log(`  readyForG6ImplementationExpansion: ${report.readyForG6ImplementationExpansion}`);

  if (!report.implementationComplete) {
    console.error("Blockers:", report.blockers.join(", "));
    process.exit(1);
  }

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeStagingProfileUpdatePocImplementationOutput(
      absOut,
      report,
    );
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  console.log("OK — staging profile update PoC implementation report complete.");
}

main();
