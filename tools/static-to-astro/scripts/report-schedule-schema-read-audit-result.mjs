#!/usr/bin/env node
/**
 * G-6-e1-schedule-schema-read-audit-result — Report CLI (result record only; no DB access).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runScheduleSchemaReadAuditResultReport,
  writeScheduleSchemaReadAuditResultOutput,
} from "./lib/schedule-schema-read-audit-result-reporter.mjs";

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
      `Usage: node scripts/report-schedule-schema-read-audit-result.mjs [--out-dir PATH]`,
    );
    process.exit(0);
  }

  let siteId = opts.siteId;
  if (!siteId && opts.outDir) siteId = path.basename(path.resolve(opts.outDir));
  if (!siteId) siteId = "default";

  const report = runScheduleSchemaReadAuditResultReport({
    toolRoot: DEFAULT_TOOL_ROOT,
    siteId,
  });

  console.log("static-to-astro report-schedule-schema-read-audit-result");
  console.log(`  phase: ${report.phase}`);
  console.log(`  readOnly: ${report.readOnly}`);
  console.log(`  manualSqlCollected: ${report.manualSqlCollected}`);
  console.log(`  schemaStatus: ${report.schemaStatus}`);
  console.log(
    `  schemaMigrationRequiredBeforeDryRun: ${report.schemaMigrationRequiredBeforeDryRun}`,
  );
  console.log(`  scheduleMonthsDecision: ${report.scheduleMonthsDecision}`);
  console.log(
    `  futurePastGroupingSupported: ${report.futurePastGroupingSupported}`,
  );
  console.log(
    `  readyForG6E2ScheduleDryRunUiPlanning: ${report.readyForG6E2ScheduleDryRunUiPlanning}`,
  );
  console.log(`  readyForG6EImplementation: ${report.readyForG6EImplementation}`);
  console.log(`  recommendedNextPhase: ${report.recommendedNextPhase}`);

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeScheduleSchemaReadAuditResultOutput(
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

  console.log("OK — schedule schema read audit result report complete.");
}

main();
