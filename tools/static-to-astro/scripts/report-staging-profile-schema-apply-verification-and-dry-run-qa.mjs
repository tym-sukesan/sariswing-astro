#!/usr/bin/env node
/**
 * G-6-d-dry-run-retry-after-schema-apply — Schema verification + dry-run QA report.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runStagingProfileSchemaApplyVerificationAndDryRunQaReport,
  writeStagingProfileSchemaApplyVerificationOutput,
} from "./lib/staging-profile-schema-apply-verification-and-dry-run-qa-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printHelp() {
  console.log(`Usage: node scripts/report-staging-profile-schema-apply-verification-and-dry-run-qa.mjs [options]

G-6-d-dry-run-retry-after-schema-apply report. Dry-run QA uses read-only SELECT only.

Options:
  --out-dir PATH
  --site-id ID
  --skip-dry-run
  --help, -h
`);
}

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  const opts = { outDir: null, siteId: null, help: false, skipDryRun: false };
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
    if (arg === "--skip-dry-run") {
      opts.skipDryRun = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  const toolRoot = DEFAULT_TOOL_ROOT;
  let siteId = opts.siteId;
  if (!siteId && opts.outDir) {
    siteId = path.basename(path.resolve(opts.outDir));
  }
  if (!siteId) siteId = "default";

  const report = await runStagingProfileSchemaApplyVerificationAndDryRunQaReport({
    toolRoot,
    siteId,
    runDryRun: !opts.skipDryRun,
  });

  console.log(
    "static-to-astro report-staging-profile-schema-apply-verification-and-dry-run-qa",
  );
  console.log(`  phase: ${report.phase}`);
  console.log(`  schemaApplied: ${report.schemaApplied}`);
  console.log(`  profileTableExists: ${report.profileTableExists}`);
  console.log(`  seedRowExists: ${report.seedRowExists}`);
  console.log(`  rlsPolicyApplied: ${report.rlsPolicyApplied}`);
  console.log(`  dryRunRetried: ${report.dryRunRetried}`);
  console.log(`  dryRunPassed: ${report.dryRunPassed}`);
  console.log(`  nonDryRunExecuted: ${report.nonDryRunExecuted}`);
  console.log(
    `  readyForManualNonDryRunDecision: ${report.readyForManualNonDryRunDecision}`,
  );
  console.log(`  readyForG6DNonDryRun: ${report.readyForG6DNonDryRun}`);
  console.log(`  dbWritePerformedByCursor: ${report.dbWritePerformedByCursor}`);
  console.log(`  adminRouteConnected: ${report.adminRouteConnected}`);
  console.log(`  productionDataTouched: ${report.productionDataTouched}`);

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } =
      writeStagingProfileSchemaApplyVerificationOutput(absOut, report);
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  if (!report.verificationComplete) {
    console.error("Blockers:", report.blockers.join(", "));
    process.exit(1);
  }

  console.log("OK — schema apply verification and dry-run QA report complete.");
}

main();
