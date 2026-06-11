#!/usr/bin/env node
/**
 * G-6-d-result-report — Report CLI.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runStagingProfileNonDryRunResultReport,
  writeNonDryRunResultOutput,
} from "./lib/staging-profile-non-dry-run-result-reporter.mjs";

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
      `Usage: node scripts/report-staging-profile-non-dry-run-result.mjs [--out-dir PATH]`,
    );
    process.exit(0);
  }

  let siteId = opts.siteId;
  if (!siteId && opts.outDir) siteId = path.basename(path.resolve(opts.outDir));
  if (!siteId) siteId = "default";

  const report = runStagingProfileNonDryRunResultReport({
    toolRoot: DEFAULT_TOOL_ROOT,
    siteId,
  });

  console.log("static-to-astro report-staging-profile-non-dry-run-result");
  console.log(`  phase: ${report.phase}`);
  console.log(`  stagingOnly: ${report.stagingOnly}`);
  console.log(`  targetTable: ${report.targetTable}`);
  console.log(`  operation: ${report.operation}`);
  console.log(`  rowsAffected: ${report.rowsAffected}`);
  console.log(`  fieldsChanged: ${JSON.stringify(report.fieldsChanged)}`);
  console.log(`  profileUpdateExecuted: ${report.profileUpdateExecuted}`);
  console.log(`  nonDryRunExecuted: ${report.nonDryRunExecuted}`);
  console.log(`  rollbackExecuted: ${report.rollbackExecuted}`);
  console.log(`  productionDataTouched: ${report.productionDataTouched}`);
  console.log(`  adminRouteConnected: ${report.adminRouteConnected}`);
  console.log(`  readyForG6DResultReport: ${report.readyForG6DResultReport}`);
  console.log(`  readyForG6E: ${report.readyForG6E}`);

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeNonDryRunResultOutput(absOut, report);
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  if (!report.complete) {
    console.error("Blockers:", report.blockers.join(", "));
    process.exit(1);
  }

  console.log("OK — staging profile non-dry-run result report complete.");
}

main();
