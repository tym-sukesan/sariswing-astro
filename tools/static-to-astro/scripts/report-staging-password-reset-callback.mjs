#!/usr/bin/env node
/**
 * G-6-d-staging-password-reset-callback — Report CLI.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runStagingPasswordResetCallbackReport,
  writeResetCallbackOutput,
} from "./lib/staging-password-reset-callback-reporter.mjs";

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
    console.log(`Usage: node scripts/report-staging-password-reset-callback.mjs [--out-dir PATH]`);
    process.exit(0);
  }

  let siteId = opts.siteId;
  if (!siteId && opts.outDir) siteId = path.basename(path.resolve(opts.outDir));
  if (!siteId) siteId = "default";

  const report = runStagingPasswordResetCallbackReport({
    toolRoot: DEFAULT_TOOL_ROOT,
    siteId,
  });

  console.log("static-to-astro report-staging-password-reset-callback");
  console.log(`  phase: ${report.phase}`);
  console.log(`  stagingOnly: ${report.stagingOnly}`);
  console.log(`  passwordResetCallbackImplemented: ${report.passwordResetCallbackImplemented}`);
  console.log(`  usesServiceRole: ${report.usesServiceRole}`);
  console.log(`  profileUpdateExecuted: ${report.profileUpdateExecuted}`);
  console.log(`  nonDryRunExecuted: ${report.nonDryRunExecuted}`);
  console.log(`  readyForAuthLoginRetry: ${report.readyForAuthLoginRetry}`);
  console.log(`  readyForManualNonDryRunExecution: ${report.readyForManualNonDryRunExecution}`);
  console.log(`  readyForG6E: ${report.readyForG6E}`);

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeResetCallbackOutput(absOut, report);
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  if (!report.complete) {
    console.error("Blockers:", report.blockers.join(", "));
    process.exit(1);
  }

  console.log("OK — staging password reset callback report complete.");
}

main();
