#!/usr/bin/env node
/**
 * G-6-e5-schedule-non-dry-run-poc-execution-path-implementation — Report CLI (static scan).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runScheduleNonDryRunPocExecutionPathImplementationReport,
  writeScheduleNonDryRunPocExecutionPathImplementationOutput,
} from "./lib/schedule-non-dry-run-poc-execution-path-implementation-reporter.mjs";

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
      "Usage: node scripts/report-schedule-non-dry-run-poc-execution-path-implementation.mjs [--out-dir PATH]",
    );
    process.exit(0);
  }

  let siteId = opts.siteId;
  if (!siteId && opts.outDir) siteId = path.basename(path.resolve(opts.outDir));
  if (!siteId) siteId = "default";

  const report = runScheduleNonDryRunPocExecutionPathImplementationReport({
    toolRoot: DEFAULT_TOOL_ROOT,
    siteId,
  });

  console.log("static-to-astro report-schedule-non-dry-run-poc-execution-path-implementation");
  console.log(`  phase: ${report.phase}`);
  console.log(`  executionPathImplemented: ${report.executionPathImplemented}`);
  console.log(`  executionPathType: ${report.executionPathType}`);
  console.log(`  executionPathInvoked: ${report.executionPathInvoked}`);
  console.log(`  writeAdapterInvoked: ${report.writeAdapterInvoked}`);
  console.log(`  dbWritesPerformed: ${report.dbWritesPerformed}`);
  console.log(`  scheduleRecordsUpdated: ${report.scheduleRecordsUpdated}`);
  console.log(`  defaultVisible: ${report.defaultVisible}`);
  console.log(`  manualConfirmRequired: ${report.manualConfirmRequired}`);
  console.log(`  serviceRoleAllowed: ${report.serviceRoleAllowed}`);
  console.log(
    `  readyForG6E5ScheduleNonDryRunPocExecutionPathVerification: ${report.readyForG6E5ScheduleNonDryRunPocExecutionPathVerification}`,
  );
  console.log(
    `  readyForNonDryRunSchedulePoC: ${report.readyForNonDryRunSchedulePoC}`,
  );
  console.log(`  recommendedNextPhase: ${report.recommendedNextPhase}`);

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } =
      writeScheduleNonDryRunPocExecutionPathImplementationOutput(absOut, report);
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  if (!report.complete) {
    console.error("Blockers:", report.blockers.join(", "));
    process.exit(1);
  }

  console.log("OK — schedule non-dry-run PoC execution path implementation report complete.");
}

main();
