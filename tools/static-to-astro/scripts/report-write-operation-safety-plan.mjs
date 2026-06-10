#!/usr/bin/env node
/**
 * G-6-a — Write operation safety plan report.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/report-write-operation-safety-plan.mjs
 *   node tools/static-to-astro/scripts/report-write-operation-safety-plan.mjs \
 *     --out-dir tools/static-to-astro/output/write-operation-safety-plan/gosaki
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runWriteOperationSafetyPlanReport,
  writeWriteOperationSafetyPlanOutput,
} from "./lib/write-operation-safety-plan-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printHelp() {
  console.log(`Usage: node scripts/report-write-operation-safety-plan.mjs [options]

Write operation safety plan report (G-6-a).
Planning docs scan only. No DB write.

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

  const report = runWriteOperationSafetyPlanReport({ toolRoot, siteId });

  console.log("static-to-astro report-write-operation-safety-plan (G-6-a)");
  console.log(`  phase: ${report.phase}`);
  console.log(`  writeOperationSafetyPlanCreated: ${report.writeOperationSafetyPlanCreated}`);
  console.log(`  planningOnly: ${report.planningOnly}`);
  console.log(`  canWrite: ${report.canWrite}`);
  console.log(`  writeOperationsEnabled: ${report.writeOperationsEnabled}`);
  console.log(`  writeAdapterImplemented: ${report.writeAdapterImplemented}`);
  console.log(`  dbWriteImplemented: ${report.dbWriteImplemented}`);
  console.log(`  rlsPolicyChanged: ${report.rlsPolicyChanged}`);
  console.log(`  storageConnected: ${report.storageConnected}`);
  console.log(`  publishConnected: ${report.publishConnected}`);
  console.log(`  adminRouteConnected: ${report.adminRouteConnected}`);
  console.log(`  productionDataTouched: ${report.productionDataTouched}`);
  console.log(`  readyForG6B: ${report.readyForG6B}`);
  console.log(`  readyForG6Implementation: ${report.readyForG6Implementation}`);

  if (!report.readyForG6B) {
    console.error("Blockers:", report.blockers.join(", "));
    process.exit(1);
  }

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeWriteOperationSafetyPlanOutput(absOut, report);
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  console.log("OK — write operation safety plan report complete.");
}

main();
