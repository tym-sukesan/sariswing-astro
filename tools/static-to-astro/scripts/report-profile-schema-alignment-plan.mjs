#!/usr/bin/env node
/**
 * G-6-d-blocker — Profile schema alignment plan report.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runProfileSchemaAlignmentPlanReport,
  writeProfileSchemaAlignmentPlanOutput,
} from "./lib/profile-schema-alignment-plan-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printHelp() {
  console.log(`Usage: node scripts/report-profile-schema-alignment-plan.mjs [options]

G-6-d-blocker profile schema alignment plan report. No SQL.

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

  const report = runProfileSchemaAlignmentPlanReport({ toolRoot, siteId });

  console.log("static-to-astro report-profile-schema-alignment-plan (G-6-d-blocker)");
  console.log(`  phase: ${report.phase}`);
  console.log(`  blocker: ${report.blocker}`);
  console.log(`  planningOnly: ${report.planningOnly}`);
  console.log(`  expectedTable: ${report.expectedTable}`);
  console.log(`  recommendedTable: ${report.recommendedTable}`);
  console.log(`  draftSqlCreated: ${report.draftSqlCreated}`);
  console.log(`  draftSqlExecuted: ${report.draftSqlExecuted}`);
  console.log(`  schemaApplied: ${report.schemaApplied}`);
  console.log(`  rlsPolicyChanged: ${report.rlsPolicyChanged}`);
  console.log(`  dbWritePerformed: ${report.dbWritePerformed}`);
  console.log(`  readyForSchemaApplyApproval: ${report.readyForSchemaApplyApproval}`);
  console.log(`  readyForG6DNonDryRun: ${report.readyForG6DNonDryRun}`);
  console.log(`  productionDataTouched: ${report.productionDataTouched}`);
  console.log(`  adminRouteConnected: ${report.adminRouteConnected}`);

  if (!report.planComplete) {
    console.error("Blockers:", report.blockers.join(", "));
    process.exit(1);
  }

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeProfileSchemaAlignmentPlanOutput(absOut, report);
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  console.log("OK — profile schema alignment plan report complete.");
}

main();
