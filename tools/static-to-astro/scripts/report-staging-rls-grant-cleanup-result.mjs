#!/usr/bin/env node
/**
 * G-6-rls-grant-cleanup-result — Report CLI (result record only; no DB access).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runStagingRlsGrantCleanupResultReport,
  writeGrantCleanupResultOutput,
} from "./lib/staging-rls-grant-cleanup-result-reporter.mjs";

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
      `Usage: node scripts/report-staging-rls-grant-cleanup-result.mjs [--out-dir PATH]`,
    );
    process.exit(0);
  }

  let siteId = opts.siteId;
  if (!siteId && opts.outDir) siteId = path.basename(path.resolve(opts.outDir));
  if (!siteId) siteId = "default";

  const report = runStagingRlsGrantCleanupResultReport({
    toolRoot: DEFAULT_TOOL_ROOT,
    siteId,
  });

  console.log("static-to-astro report-staging-rls-grant-cleanup-result");
  console.log(`  phase: ${report.phase}`);
  console.log(`  stagingOnly: ${report.stagingOnly}`);
  console.log(`  manualOnly: ${report.manualOnly}`);
  console.log(`  cleanupExecuted: ${report.cleanupExecuted}`);
  console.log(`  revokeResult: ${report.revokeResult}`);
  console.log(`  broadGrantsRemoved: ${report.broadGrantsRemoved}`);
  console.log(`  afterVerification: ${report.afterVerification}`);
  console.log(
    `  preservedPermissionsVerification: ${report.preservedPermissionsVerification}`,
  );
  console.log(`  smokeTest: ${report.smokeTest}`);
  console.log(`  rollbackExecuted: ${report.rollbackExecuted}`);
  console.log(`  productionDataTouched: ${report.productionDataTouched}`);
  console.log(`  adminRouteConnected: ${report.adminRouteConnected}`);
  console.log(`  readyForG6EPlanning: ${report.readyForG6EPlanning}`);
  console.log(`  readyForG6EImplementation: ${report.readyForG6EImplementation}`);
  console.log(`  recommendedNextPhase: ${report.recommendedNextPhase}`);

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeGrantCleanupResultOutput(absOut, report);
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  if (!report.complete) {
    console.error("Blockers:", report.blockers.join(", "));
    process.exit(1);
  }

  console.log("OK — staging RLS grant cleanup result report complete.");
}

main();
