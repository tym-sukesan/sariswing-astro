#!/usr/bin/env node
/**
 * G-6-d-prep — Staging profile update PoC approval plan report.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/report-staging-profile-update-poc-approval-plan.mjs
 *   node tools/static-to-astro/scripts/report-staging-profile-update-poc-approval-plan.mjs \
 *     --out-dir tools/static-to-astro/output/staging-profile-update-poc-approval-plan/gosaki
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runStagingProfileUpdatePocApprovalPlanReport,
  writeStagingProfileUpdatePocApprovalPlanOutput,
} from "./lib/staging-profile-update-poc-approval-plan-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printHelp() {
  console.log(`Usage: node scripts/report-staging-profile-update-poc-approval-plan.mjs [options]

Staging profile update PoC approval plan report (G-6-d-prep).
Planning docs scan only. No SQL. No writes.

Options:
  --out-dir PATH    Write report JSON + markdown (optional)
  --site-id ID      Site label for report
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

  const report = runStagingProfileUpdatePocApprovalPlanReport({ toolRoot, siteId });

  console.log("static-to-astro report-staging-profile-update-poc-approval-plan (G-6-d-prep)");
  console.log(`  phase: ${report.phase}`);
  console.log(`  approvalId: ${report.approvalId}`);
  console.log(`  planningOnly: ${report.planningOnly}`);
  console.log(`  approvalActivated: ${report.approvalActivated}`);
  console.log(`  targetModule: ${report.targetModule}`);
  console.log(`  targetOperation: ${report.targetOperation}`);
  console.log(`  targetFields: ${report.targetFields}`);
  console.log(`  canWrite: ${report.canWrite}`);
  console.log(`  writeOperationsEnabled: ${report.writeOperationsEnabled}`);
  console.log(`  writeAdapterImplemented: ${report.writeAdapterImplemented}`);
  console.log(`  dbWriteImplemented: ${report.dbWriteImplemented}`);
  console.log(`  saveButtonEnabled: ${report.saveButtonEnabled}`);
  console.log(`  sqlExecuted: ${report.sqlExecuted}`);
  console.log(`  rlsPolicyChanged: ${report.rlsPolicyChanged}`);
  console.log(`  storageConnected: ${report.storageConnected}`);
  console.log(`  publishConnected: ${report.publishConnected}`);
  console.log(`  adminRouteConnected: ${report.adminRouteConnected}`);
  console.log(`  productionDataTouched: ${report.productionDataTouched}`);
  console.log(`  readyForG6DApproval: ${report.readyForG6DApproval}`);
  console.log(`  readyForG6DImplementation: ${report.readyForG6DImplementation}`);
  console.log(`  readyForG6Implementation: ${report.readyForG6Implementation}`);

  if (!report.planComplete) {
    console.error("Blockers:", report.blockers.join(", "));
    process.exit(1);
  }

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeStagingProfileUpdatePocApprovalPlanOutput(absOut, report);
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  console.log("OK — staging profile update PoC approval plan report complete.");
}

main();
