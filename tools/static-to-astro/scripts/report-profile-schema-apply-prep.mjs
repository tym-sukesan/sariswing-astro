#!/usr/bin/env node
/**
 * G-6-d-schema-apply-prep — Profile schema apply prep report.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runProfileSchemaApplyPrepReport,
  writeProfileSchemaApplyPrepOutput,
} from "./lib/profile-schema-apply-prep-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printHelp() {
  console.log(`Usage: node scripts/report-profile-schema-apply-prep.mjs [options]

G-6-d-schema-apply-prep report. No SQL execution.

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

  const report = runProfileSchemaApplyPrepReport({ toolRoot, siteId });

  console.log("static-to-astro report-profile-schema-apply-prep (G-6-d-schema-apply-prep)");
  console.log(`  phase: ${report.phase}`);
  console.log(`  manualSqlPrepared: ${report.manualSqlPrepared}`);
  console.log(`  cursorExecutesSql: ${report.cursorExecutesSql}`);
  console.log(`  intendedProject: ${report.intendedProject}`);
  console.log(`  productionForbidden: ${report.productionForbidden}`);
  console.log(`  targetTable: ${report.targetTable}`);
  console.log(`  usesIsActive: ${report.usesIsActive}`);
  console.log(`  schemaApplied: ${report.schemaApplied}`);
  console.log(`  rlsPolicyApplied: ${report.rlsPolicyApplied}`);
  console.log(`  dbWritePerformedByCursor: ${report.dbWritePerformedByCursor}`);
  console.log(`  readyForManualSchemaApply: ${report.readyForManualSchemaApply}`);
  console.log(`  readyForG6DNonDryRun: ${report.readyForG6DNonDryRun}`);
  console.log(`  productionDataTouched: ${report.productionDataTouched}`);
  console.log(`  adminRouteConnected: ${report.adminRouteConnected}`);

  if (!report.prepComplete) {
    console.error("Blockers:", report.blockers.join(", "));
    process.exit(1);
  }

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeProfileSchemaApplyPrepOutput(absOut, report);
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  console.log("OK — profile schema apply prep report complete.");
}

main();
