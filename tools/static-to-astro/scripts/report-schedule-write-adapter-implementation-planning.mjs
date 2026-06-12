#!/usr/bin/env node
/**
 * G-6-e4-schedule-write-adapter-implementation-planning — Report CLI (planning scan only; no DB access).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runScheduleWriteAdapterImplementationPlanningReport,
  writeScheduleWriteAdapterImplementationPlanningOutput,
} from "./lib/schedule-write-adapter-implementation-planning-reporter.mjs";

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
      `Usage: node scripts/report-schedule-write-adapter-implementation-planning.mjs [--out-dir PATH]`,
    );
    process.exit(0);
  }

  let siteId = opts.siteId;
  if (!siteId && opts.outDir) siteId = path.basename(path.resolve(opts.outDir));
  if (!siteId) siteId = "default";

  const report = runScheduleWriteAdapterImplementationPlanningReport({
    toolRoot: DEFAULT_TOOL_ROOT,
    siteId,
  });

  console.log("static-to-astro report-schedule-write-adapter-implementation-planning");
  console.log(`  phase: ${report.phase}`);
  console.log(`  planningOnly: ${report.planningOnly}`);
  console.log(`  targetModule: ${report.targetModule}`);
  console.log(`  plannedOperation: ${report.plannedOperation}`);
  console.log(`  writeAdapterImplemented: ${report.writeAdapterImplemented}`);
  console.log(`  dbWritesPerformed: ${report.dbWritesPerformed}`);
  console.log(`  requiresUpdateGrantReview: ${report.requiresUpdateGrantReview}`);
  console.log(`  requiresBeforeSnapshot: ${report.requiresBeforeSnapshot}`);
  console.log(`  requiresRollbackPlan: ${report.requiresRollbackPlan}`);
  console.log(
    `  readyForG6E4ScheduleUpdateGrantPrep: ${report.readyForG6E4ScheduleUpdateGrantPrep}`,
  );
  console.log(
    `  readyForG6EWriteImplementation: ${report.readyForG6EWriteImplementation}`,
  );
  console.log(`  recommendedNextPhase: ${report.recommendedNextPhase}`);

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } =
      writeScheduleWriteAdapterImplementationPlanningOutput(absOut, report);
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  if (!report.complete) {
    console.error("Blockers:", report.blockers.join(", "));
    process.exit(1);
  }

  console.log("OK — schedule write adapter implementation planning report complete.");
}

main();
