#!/usr/bin/env node
/**
 * G-5z-e — Read-only phase completion report.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/report-read-only-phase-completion.mjs
 *   node tools/static-to-astro/scripts/report-read-only-phase-completion.mjs \
 *     --out-dir tools/static-to-astro/output/read-only-phase-completion/gosaki
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runReadOnlyPhaseCompletionReport,
  writeReadOnlyPhaseCompletionOutput,
} from "./lib/read-only-phase-completion-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printHelp() {
  console.log(`Usage: node scripts/report-read-only-phase-completion.mjs [options]

Read-only phase completion report (G-5z-e).
Docs/scan only. No live Supabase connection.

Options:
  --out-dir PATH    Write report JSON + markdown (optional)
  --site-id ID      Site label for report
  --help, -h
`);
}

/**
 * @param {string[]} argv
 */
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
    printHelp();
    process.exit(0);
  }

  const toolRoot = DEFAULT_TOOL_ROOT;
  let siteId = opts.siteId;
  if (!siteId && opts.outDir) {
    siteId = path.basename(path.resolve(opts.outDir));
  }
  if (!siteId) siteId = "default";

  const report = runReadOnlyPhaseCompletionReport({ toolRoot, siteId });

  console.log("static-to-astro report-read-only-phase-completion (G-5z-e)");
  console.log(`  phase: ${report.phase}`);
  console.log(`  readOnlyPhaseComplete: ${report.readOnlyPhaseComplete}`);
  console.log(`  readyForG6Planning: ${report.readyForG6Planning}`);
  console.log(`  readyForG6Implementation: ${report.readyForG6Implementation}`);
  console.log(`  canWrite: ${report.canWrite}`);
  console.log(`  dbWriteImplemented: ${report.dbWriteImplemented}`);
  console.log(`  rlsPolicyChanged: ${report.rlsPolicyChanged}`);
  console.log(`  storageConnected: ${report.storageConnected}`);
  console.log(`  publishConnected: ${report.publishConnected}`);
  console.log(`  adminRouteConnected: ${report.adminRouteConnected}`);
  console.log(`  productionDataTouched: ${report.productionDataTouched}`);
  console.log(`  recommendation: ${report.recommendation}`);

  if (!report.readOnlyPhaseComplete) {
    console.error("Blockers:", report.blockers.join(", "));
    process.exit(1);
  }

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeReadOnlyPhaseCompletionOutput(absOut, report);
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  console.log("OK — read-only phase completion report complete.");
}

main();
