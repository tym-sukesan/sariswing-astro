#!/usr/bin/env node
/**
 * G-6-e5-schedule-non-dry-run-poc-execution-prep — Report CLI (static scan; no DB access).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runScheduleNonDryRunPocExecutionPrepReport,
  writeScheduleNonDryRunPocExecutionPrepOutput,
} from "./lib/schedule-non-dry-run-poc-execution-prep-reporter.mjs";

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
      `Usage: node scripts/report-schedule-non-dry-run-poc-execution-prep.mjs [--out-dir PATH]`,
    );
    process.exit(0);
  }

  let siteId = opts.siteId;
  if (!siteId && opts.outDir) siteId = path.basename(path.resolve(opts.outDir));
  if (!siteId) siteId = "default";

  const report = runScheduleNonDryRunPocExecutionPrepReport({
    toolRoot: DEFAULT_TOOL_ROOT,
    siteId,
  });

  console.log("static-to-astro report-schedule-non-dry-run-poc-execution-prep");
  console.log(`  phase: ${report.phase}`);
  console.log(`  executionPrepCreated: ${report.executionPrepCreated}`);
  console.log(`  executionScriptImplemented: ${report.executionScriptImplemented}`);
  console.log(`  executionScriptInvoked: ${report.executionScriptInvoked}`);
  console.log(`  writeAdapterInvoked: ${report.writeAdapterInvoked}`);
  console.log(`  dbWritesPerformed: ${report.dbWritesPerformed}`);
  console.log(`  scheduleRecordsUpdated: ${report.scheduleRecordsUpdated}`);
  console.log(`  serviceRoleAllowed: ${report.serviceRoleAllowed}`);
  console.log(
    `  readyForG6E5ScheduleNonDryRunPocExecutionPathImplementation: ${report.readyForG6E5ScheduleNonDryRunPocExecutionPathImplementation}`,
  );
  console.log(
    `  readyForNonDryRunSchedulePoC: ${report.readyForNonDryRunSchedulePoC}`,
  );
  console.log(`  recommendedNextPhase: ${report.recommendedNextPhase}`);

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeScheduleNonDryRunPocExecutionPrepOutput(
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

  console.log("OK — schedule non-dry-run PoC execution prep report complete.");
}

main();
