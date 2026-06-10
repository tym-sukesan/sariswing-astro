#!/usr/bin/env node
/**
 * G-6-c — Disabled write action scaffold report.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/report-disabled-write-action-scaffold.mjs
 *   node tools/static-to-astro/scripts/report-disabled-write-action-scaffold.mjs \
 *     --out-dir tools/static-to-astro/output/disabled-write-action-scaffold/gosaki
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runDisabledWriteActionScaffoldReport,
  writeDisabledWriteActionScaffoldOutput,
} from "./lib/disabled-write-action-scaffold-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printHelp() {
  console.log(`Usage: node scripts/report-disabled-write-action-scaffold.mjs [options]

Disabled write action scaffold report (G-6-c).
UI scaffold scan only. No SQL. No writes.

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

  const report = runDisabledWriteActionScaffoldReport({ toolRoot, siteId });

  console.log("static-to-astro report-disabled-write-action-scaffold (G-6-c)");
  console.log(`  phase: ${report.phase}`);
  console.log(`  approvalId: ${report.approvalId}`);
  console.log(`  disabledActionComponentsCreated: ${report.disabledActionComponentsCreated}`);
  console.log(`  moduleDisabledActionsVisible: ${report.moduleDisabledActionsVisible}`);
  console.log(`  uiOnly: ${report.uiOnly}`);
  console.log(`  canWrite: ${report.canWrite}`);
  console.log(`  writeOperationsEnabled: ${report.writeOperationsEnabled}`);
  console.log(`  writeAdapterImplemented: ${report.writeAdapterImplemented}`);
  console.log(`  dbWriteImplemented: ${report.dbWriteImplemented}`);
  console.log(`  sqlExecuted: ${report.sqlExecuted}`);
  console.log(`  rlsPolicyChanged: ${report.rlsPolicyChanged}`);
  console.log(`  storageConnected: ${report.storageConnected}`);
  console.log(`  publishConnected: ${report.publishConnected}`);
  console.log(`  adminRouteConnected: ${report.adminRouteConnected}`);
  console.log(`  productionDataTouched: ${report.productionDataTouched}`);
  console.log(`  readyForG6D: ${report.readyForG6D}`);
  console.log(`  readyForG6DPlanning: ${report.readyForG6DPlanning}`);
  console.log(`  readyForG6Implementation: ${report.readyForG6Implementation}`);

  if (!report.scaffoldComplete) {
    console.error("Blockers:", report.blockers.join(", "));
    process.exit(1);
  }

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeDisabledWriteActionScaffoldOutput(absOut, report);
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  console.log("OK — disabled write action scaffold report complete.");
}

main();
