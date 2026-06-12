#!/usr/bin/env node
/**
 * G-6-e3-schedule-dry-run-adapter-planning — Report CLI (planning scan only; no DB access).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runScheduleDryRunAdapterPlanningReport,
  writeScheduleDryRunAdapterPlanningOutput,
} from "./lib/schedule-dry-run-adapter-planning-reporter.mjs";

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
      `Usage: node scripts/report-schedule-dry-run-adapter-planning.mjs [--out-dir PATH]`,
    );
    process.exit(0);
  }

  let siteId = opts.siteId;
  if (!siteId && opts.outDir) siteId = path.basename(path.resolve(opts.outDir));
  if (!siteId) siteId = "default";

  const report = runScheduleDryRunAdapterPlanningReport({
    toolRoot: DEFAULT_TOOL_ROOT,
    siteId,
  });

  console.log("static-to-astro report-schedule-dry-run-adapter-planning");
  console.log(`  phase: ${report.phase}`);
  console.log(`  planningOnly: ${report.planningOnly}`);
  console.log(`  targetModule: ${report.targetModule}`);
  console.log(`  adapterImplemented: ${report.adapterImplemented}`);
  console.log(`  dryRunOnly: ${report.dryRunOnly}`);
  console.log(`  actualWriteHardCodedFalse: ${report.actualWriteHardCodedFalse}`);
  console.log(`  acceptsDbClient: ${report.acceptsDbClient}`);
  console.log(`  acceptsDryRunModeFlag: ${report.acceptsDryRunModeFlag}`);
  console.log(`  writeAdaptersImplemented: ${report.writeAdaptersImplemented}`);
  console.log(`  dbWritesPerformed: ${report.dbWritesPerformed}`);
  console.log(
    `  readyForG6E3ScheduleDryRunAdapterImplementation: ${report.readyForG6E3ScheduleDryRunAdapterImplementation}`,
  );
  console.log(
    `  readyForG6EWriteImplementation: ${report.readyForG6EWriteImplementation}`,
  );
  console.log(`  recommendedNextPhase: ${report.recommendedNextPhase}`);

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeScheduleDryRunAdapterPlanningOutput(
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

  console.log("OK — schedule dry-run adapter planning report complete.");
}

main();
