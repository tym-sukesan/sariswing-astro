#!/usr/bin/env node
/**
 * G-6-e3-schedule-dry-run-adapter-verification-result — Report CLI (result scan only; no DB access).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runScheduleDryRunAdapterVerificationResultReport,
  writeScheduleDryRunAdapterVerificationResultOutput,
} from "./lib/schedule-dry-run-adapter-verification-result-reporter.mjs";

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
      `Usage: node scripts/report-schedule-dry-run-adapter-verification-result.mjs [--out-dir PATH]`,
    );
    process.exit(0);
  }

  let siteId = opts.siteId;
  if (!siteId && opts.outDir) siteId = path.basename(path.resolve(opts.outDir));
  if (!siteId) siteId = "default";

  const report = runScheduleDryRunAdapterVerificationResultReport({
    toolRoot: DEFAULT_TOOL_ROOT,
    siteId,
  });

  console.log("static-to-astro report-schedule-dry-run-adapter-verification-result");
  console.log(`  phase: ${report.phase}`);
  console.log(`  verificationOnly: ${report.verificationOnly}`);
  console.log(`  manualBrowserVerification: ${report.manualBrowserVerification}`);
  console.log(`  staticSafetyVerification: ${report.staticSafetyVerification}`);
  console.log(
    `  adapterRoutedDryRunUiVerified: ${report.adapterRoutedDryRunUiVerified}`,
  );
  console.log(`  actualWriteFalseVerified: ${report.actualWriteFalseVerified}`);
  console.log(
    `  duplicatePayloadSafetyValuesVerified: ${report.duplicatePayloadSafetyValuesVerified}`,
  );
  console.log(`  writeAdaptersImplemented: ${report.writeAdaptersImplemented}`);
  console.log(`  dbWritesPerformed: ${report.dbWritesPerformed}`);
  console.log(
    `  readyForG6E4ScheduleWriteAdapterPlanning: ${report.readyForG6E4ScheduleWriteAdapterPlanning}`,
  );
  console.log(
    `  readyForG6EWriteImplementation: ${report.readyForG6EWriteImplementation}`,
  );
  console.log(`  recommendedNextPhase: ${report.recommendedNextPhase}`);

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeScheduleDryRunAdapterVerificationResultOutput(
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

  console.log("OK — schedule dry-run adapter verification result report complete.");
}

main();
