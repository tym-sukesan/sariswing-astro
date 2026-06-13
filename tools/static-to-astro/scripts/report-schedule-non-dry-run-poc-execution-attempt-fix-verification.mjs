#!/usr/bin/env node
/**
 * G-6-e5-schedule-non-dry-run-poc-execution-attempt-fix-verification — Report CLI (static scan).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runScheduleNonDryRunPocExecutionAttemptFixVerificationReport,
  writeScheduleNonDryRunPocExecutionAttemptFixVerificationOutput,
} from "./lib/schedule-non-dry-run-poc-execution-attempt-fix-verification-reporter.mjs";

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
      "Usage: node scripts/report-schedule-non-dry-run-poc-execution-attempt-fix-verification.mjs [--out-dir PATH]",
    );
    process.exit(0);
  }

  let siteId = opts.siteId;
  if (!siteId && opts.outDir) siteId = path.basename(path.resolve(opts.outDir));
  if (!siteId) siteId = "default";

  const report = runScheduleNonDryRunPocExecutionAttemptFixVerificationReport({
    toolRoot: DEFAULT_TOOL_ROOT,
    siteId,
  });

  console.log(
    "static-to-astro report-schedule-non-dry-run-poc-execution-attempt-fix-verification",
  );
  console.log(`  phase: ${report.phase}`);
  console.log(
    `  mockRoleHardGateRemovedOrRelaxed: ${report.mockRoleHardGateRemovedOrRelaxed}`,
  );
  console.log(`  signedInSessionStillRequired: ${report.signedInSessionStillRequired}`);
  console.log(`  rlsAdminUsersSourceOfTruth: ${report.rlsAdminUsersSourceOfTruth}`);
  console.log(`  activeSupabaseHostDisplayed: ${report.activeSupabaseHostDisplayed}`);
  console.log(`  errorPanelImproved: ${report.errorPanelImproved}`);
  console.log(`  unexpectedExceptionCaptured: ${report.unexpectedExceptionCaptured}`);
  console.log(`  scrollIntoViewAdded: ${report.scrollIntoViewAdded}`);
  console.log(`  doubleClickGuardVerified: ${report.doubleClickGuardVerified}`);
  console.log(`  normalDevHiddenVerified: ${report.normalDevHiddenVerified}`);
  console.log(`  envGatedVisibleVerified: ${report.envGatedVisibleVerified}`);
  console.log(`  manualConfirmVerified: ${report.manualConfirmVerified}`);
  console.log(`  triggerClickedInThisPhase: ${report.triggerClickedInThisPhase}`);
  console.log(`  dbWritesPerformedInThisPhase: ${report.dbWritesPerformedInThisPhase}`);
  console.log(
    `  readyForManualEnvGatedFixVerification: ${report.readyForManualEnvGatedFixVerification}`,
  );
  console.log(`  readyForExplicitRetry: ${report.readyForExplicitRetry}`);
  console.log(`  recommendedNextPhase: ${report.recommendedNextPhase}`);
  console.log(`  complete: ${report.complete}`);
  if (report.blockers.length) {
    console.log(`  blockers: ${report.blockers.join(", ")}`);
  }

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } =
      writeScheduleNonDryRunPocExecutionAttemptFixVerificationOutput(absOut, report);
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  process.exit(report.complete ? 0 : 1);
}

main();
