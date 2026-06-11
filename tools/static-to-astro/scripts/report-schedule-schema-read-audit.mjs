#!/usr/bin/env node
/**
 * G-6-e1-schedule-schema-read-audit — Report CLI (read-only audit plan; no DB access).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runScheduleSchemaReadAuditReport,
  writeScheduleSchemaReadAuditOutput,
} from "./lib/schedule-schema-read-audit-reporter.mjs";

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
      `Usage: node scripts/report-schedule-schema-read-audit.mjs [--out-dir PATH]`,
    );
    process.exit(0);
  }

  let siteId = opts.siteId;
  if (!siteId && opts.outDir) siteId = path.basename(path.resolve(opts.outDir));
  if (!siteId) siteId = "default";

  const report = runScheduleSchemaReadAuditReport({
    toolRoot: DEFAULT_TOOL_ROOT,
    siteId,
  });

  console.log("static-to-astro report-schedule-schema-read-audit");
  console.log(`  phase: ${report.phase}`);
  console.log(`  readOnly: ${report.readOnly}`);
  console.log(`  planningOnly: ${report.planningOnly}`);
  console.log(`  targetModule: ${report.targetModule}`);
  console.log(`  targetTables: ${JSON.stringify(report.targetTables)}`);
  console.log(`  manualSqlRequired: ${report.manualSqlRequired}`);
  console.log(`  auditStatus: ${report.auditStatus}`);
  console.log(`  dbWritesPerformed: ${report.dbWritesPerformed}`);
  console.log(`  schemaChangesPerformed: ${report.schemaChangesPerformed}`);
  console.log(`  writeAdaptersImplemented: ${report.writeAdaptersImplemented}`);
  console.log(`  readyForG6EPlanning: ${report.readyForG6EPlanning}`);
  console.log(`  readyForG6EImplementation: ${report.readyForG6EImplementation}`);
  console.log(`  recommendedNextPhase: ${report.recommendedNextPhase}`);

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeScheduleSchemaReadAuditOutput(absOut, report);
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  if (!report.complete) {
    console.error("Blockers:", report.blockers.join(", "));
    process.exit(1);
  }

  console.log("OK — schedule schema read audit report complete.");
}

main();
