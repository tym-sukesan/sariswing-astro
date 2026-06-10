#!/usr/bin/env node
/**
 * G-6-d-verify — Staging profile update PoC verification report.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runStagingProfileUpdatePocVerificationReport,
  writeStagingProfileUpdatePocVerificationOutput,
} from "./lib/staging-profile-update-poc-verification-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printHelp() {
  console.log(`Usage: node scripts/report-staging-profile-update-poc-verification.mjs [options]

G-6-d-verify verification checklist report. No writes.

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

  const report = runStagingProfileUpdatePocVerificationReport({ toolRoot, siteId });

  console.log("static-to-astro report-staging-profile-update-poc-verification (G-6-d-verify)");
  console.log(`  phase: ${report.phase}`);
  console.log(`  approvalId: ${report.approvalId}`);
  console.log(`  verificationOnly: ${report.verificationOnly}`);
  console.log(`  targetModule: ${report.targetModule}`);
  console.log(`  targetOperation: ${report.targetOperation}`);
  console.log(`  targetFields: ${JSON.stringify(report.targetFields)}`);
  console.log(`  columnMappingRequiresConfirmation: ${report.columnMappingRequiresConfirmation}`);
  console.log(`  cursorWillNotExecuteNonDryRun: ${report.cursorWillNotExecuteNonDryRun}`);
  console.log(`  nonDryRunExecuted: ${report.nonDryRunExecuted}`);
  console.log(`  readyForManualNonDryRunDecision: ${report.readyForManualNonDryRunDecision}`);
  console.log(`  productionDataTouched: ${report.productionDataTouched}`);
  console.log(`  adminRouteConnected: ${report.adminRouteConnected}`);
  console.log(`  storageConnected: ${report.storageConnected}`);
  console.log(`  publishConnected: ${report.publishConnected}`);
  console.log(`  rlsPolicyChanged: ${report.rlsPolicyChanged}`);

  if (!report.verificationComplete) {
    console.error("Blockers:", report.blockers.join(", "));
    process.exit(1);
  }

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeStagingProfileUpdatePocVerificationOutput(
      absOut,
      report,
    );
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  console.log("OK — staging profile update PoC verification report complete.");
}

main();
