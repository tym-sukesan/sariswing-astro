#!/usr/bin/env node
/**
 * G-6-e2-schedule-dry-run-ui-planning — Report CLI (planning only; no DB access).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runScheduleDryRunUiPlanningReport,
  writeScheduleDryRunUiPlanningOutput,
} from "./lib/schedule-dry-run-ui-planning-reporter.mjs";

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
      `Usage: node scripts/report-schedule-dry-run-ui-planning.mjs [--out-dir PATH]`,
    );
    process.exit(0);
  }

  let siteId = opts.siteId;
  if (!siteId && opts.outDir) siteId = path.basename(path.resolve(opts.outDir));
  if (!siteId) siteId = "default";

  const report = runScheduleDryRunUiPlanningReport({
    toolRoot: DEFAULT_TOOL_ROOT,
    siteId,
  });

  console.log("static-to-astro report-schedule-dry-run-ui-planning");
  console.log(`  phase: ${report.phase}`);
  console.log(`  planningOnly: ${report.planningOnly}`);
  console.log(`  targetModule: ${report.targetModule}`);
  console.log(`  targetOperations: ${JSON.stringify(report.targetOperations)}`);
  console.log(`  scheduleMonthsMode: ${report.scheduleMonthsMode}`);
  console.log(
    `  requiresSchemaMigrationBeforeUi: ${report.requiresSchemaMigrationBeforeUi}`,
  );
  console.log(
    `  requiresWriteGrantsBeforeDryRunUi: ${report.requiresWriteGrantsBeforeDryRunUi}`,
  );
  console.log(`  uiImplemented: ${report.uiImplemented}`);
  console.log(`  writeAdaptersImplemented: ${report.writeAdaptersImplemented}`);
  console.log(`  dbWritesPerformed: ${report.dbWritesPerformed}`);
  console.log(
    `  readyForG6E2ScheduleDryRunUiScaffold: ${report.readyForG6E2ScheduleDryRunUiScaffold}`,
  );
  console.log(
    `  readyForG6EWriteImplementation: ${report.readyForG6EWriteImplementation}`,
  );
  console.log(`  recommendedNextPhase: ${report.recommendedNextPhase}`);

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeScheduleDryRunUiPlanningOutput(
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

  console.log("OK — schedule dry-run UI planning report complete.");
}

main();
