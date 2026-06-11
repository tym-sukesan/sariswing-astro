#!/usr/bin/env node
/**
 * G-6-rls-grant-cleanup-manual-apply-prep — Report CLI (prep only; no DB access).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runStagingRlsGrantCleanupManualApplyPrepReport,
  writeGrantCleanupManualApplyPrepOutput,
} from "./lib/staging-rls-grant-cleanup-manual-apply-prep-reporter.mjs";

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
      `Usage: node scripts/report-staging-rls-grant-cleanup-manual-apply-prep.mjs [--out-dir PATH]`,
    );
    process.exit(0);
  }

  let siteId = opts.siteId;
  if (!siteId && opts.outDir) siteId = path.basename(path.resolve(opts.outDir));
  if (!siteId) siteId = "default";

  const report = runStagingRlsGrantCleanupManualApplyPrepReport({
    toolRoot: DEFAULT_TOOL_ROOT,
    siteId,
  });

  console.log(
    "static-to-astro report-staging-rls-grant-cleanup-manual-apply-prep",
  );
  console.log(`  phase: ${report.phase}`);
  console.log(`  stagingOnly: ${report.stagingOnly}`);
  console.log(`  manualOnly: ${report.manualOnly}`);
  console.log(`  manualApplyPrepCreated: ${report.manualApplyPrepCreated}`);
  console.log(`  cleanupExecuted: ${report.cleanupExecuted}`);
  console.log(`  rollbackExecuted: ${report.rollbackExecuted}`);
  console.log(
    `  readyForManualCleanupApply: ${report.readyForManualCleanupApply}`,
  );
  console.log(`  readyForG6EPlanning: ${report.readyForG6EPlanning}`);
  console.log(`  readyForG6EImplementation: ${report.readyForG6EImplementation}`);
  console.log(`  dbWritesPerformed: ${report.dbWritesPerformed}`);
  console.log(`  grantChangesPerformed: ${report.grantChangesPerformed}`);
  console.log(`  productionDataTouched: ${report.productionDataTouched}`);
  console.log(`  adminRouteConnected: ${report.adminRouteConnected}`);
  console.log(`  recommendedNextPhase: ${report.recommendedNextPhase}`);

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeGrantCleanupManualApplyPrepOutput(
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

  console.log(
    "OK — staging RLS grant cleanup manual apply prep report complete.",
  );
}

main();
