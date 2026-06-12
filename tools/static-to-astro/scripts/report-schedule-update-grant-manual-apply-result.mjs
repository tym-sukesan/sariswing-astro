#!/usr/bin/env node
/**
 * G-6-e4-schedule-update-grant-manual-apply-result — Report CLI (docs/config scan only; no DB access).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runScheduleUpdateGrantManualApplyResultReport,
  writeScheduleUpdateGrantManualApplyResultOutput,
} from "./lib/schedule-update-grant-manual-apply-result-reporter.mjs";

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
      `Usage: node scripts/report-schedule-update-grant-manual-apply-result.mjs [--out-dir PATH]`,
    );
    process.exit(0);
  }

  let siteId = opts.siteId;
  if (!siteId && opts.outDir) siteId = path.basename(path.resolve(opts.outDir));
  if (!siteId) siteId = "default";

  const report = runScheduleUpdateGrantManualApplyResultReport({
    toolRoot: DEFAULT_TOOL_ROOT,
    siteId,
  });

  console.log("static-to-astro report-schedule-update-grant-manual-apply-result");
  console.log(`  phase: ${report.phase}`);
  console.log(`  manualApplyResultRecorded: ${report.manualApplyResultRecorded}`);
  console.log(`  targetModule: ${report.targetModule}`);
  console.log(`  targetTable: ${report.targetTable}`);
  console.log(`  targetGrant: ${report.targetGrant}`);
  console.log(`  grantExecuted: ${report.grantExecuted}`);
  console.log(`  grantChangesPerformed: ${report.grantChangesPerformed}`);
  console.log(`  grantManualApplyStatus: ${report.grantManualApplyStatus}`);
  console.log(`  writeAdapterImplemented: ${report.writeAdapterImplemented}`);
  console.log(`  dbWritesPerformed: ${report.dbWritesPerformed}`);
  console.log(`  scheduleRecordsUpdated: ${report.scheduleRecordsUpdated}`);
  console.log(
    `  readyForG6E4ScheduleWriteAdapterImplementation: ${report.readyForG6E4ScheduleWriteAdapterImplementation}`,
  );
  console.log(
    `  readyForG6EWriteImplementation: ${report.readyForG6EWriteImplementation}`,
  );
  console.log(
    `  readyForNonDryRunSchedulePoC: ${report.readyForNonDryRunSchedulePoC}`,
  );
  console.log(`  recommendedNextPhase: ${report.recommendedNextPhase}`);

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeScheduleUpdateGrantManualApplyResultOutput(
      absOut,
      report,
    );
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  if (!report.complete) {
    console.error("Blockers:", report.blockers.join(", "));
    process.exit(1);
  }

  console.log("OK — schedule update grant manual apply result report complete.");
}

main();
