#!/usr/bin/env node
/**
 * G-6-e4-schedule-update-grant-prep — Report CLI (docs/config scan only; no DB access).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runScheduleUpdateGrantPrepReport,
  writeScheduleUpdateGrantPrepOutput,
} from "./lib/schedule-update-grant-prep-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    console.log(
      `Usage: node scripts/report-schedule-update-grant-prep.mjs [--out-dir PATH]`,
    );
    process.exit(0);
  }

  let siteId = opts.siteId;
  if (!siteId && opts.outDir) siteId = path.basename(path.resolve(opts.outDir));
  if (!siteId) siteId = "default";

  const report = runScheduleUpdateGrantPrepReport({
    toolRoot: DEFAULT_TOOL_ROOT,
    siteId,
  });

  console.log("static-to-astro report-schedule-update-grant-prep");
  console.log(`  phase: ${report.phase}`);
  console.log(`  planningOnly: ${report.planningOnly}`);
  console.log(`  manualSqlPrepared: ${report.manualSqlPrepared}`);
  console.log(`  targetModule: ${report.targetModule}`);
  console.log(`  targetTable: ${report.targetTable}`);
  console.log(`  targetGrant: ${report.targetGrant}`);
  console.log(`  grantExecuted: ${report.grantExecuted}`);
  console.log(`  grantChangesPerformed: ${report.grantChangesPerformed}`);
  console.log(`  writeAdapterImplemented: ${report.writeAdapterImplemented}`);
  console.log(`  dbWritesPerformed: ${report.dbWritesPerformed}`);
  console.log(
    `  readyForG6E4ScheduleUpdateGrantManualApplyPrep: ${report.readyForG6E4ScheduleUpdateGrantManualApplyPrep}`,
  );
  console.log(
    `  readyForG6EWriteImplementation: ${report.readyForG6EWriteImplementation}`,
  );
  console.log(`  recommendedNextPhase: ${report.recommendedNextPhase}`);

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeScheduleUpdateGrantPrepOutput(absOut, report);
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  if (!report.complete) {
    console.error("Blockers:", report.blockers.join(", "));
    process.exit(1);
  }

  console.log("OK — schedule update grant prep report complete.");
}

main();
