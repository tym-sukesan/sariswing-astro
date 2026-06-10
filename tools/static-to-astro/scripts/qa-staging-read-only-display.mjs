#!/usr/bin/env node
/**
 * G-5z-d — Staging read-only module display QA (docs/UI scan).
 *
 * Usage:
 *   node tools/static-to-astro/scripts/qa-staging-read-only-display.mjs
 *   node tools/static-to-astro/scripts/qa-staging-read-only-display.mjs \
 *     --out-dir tools/static-to-astro/output/staging-read-only-display-qa/gosaki
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runStagingReadOnlyDisplayQa,
  writeStagingReadOnlyDisplayQaOutput,
} from "./lib/staging-read-only-display-qa-runner.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printHelp() {
  console.log(`Usage: node scripts/qa-staging-read-only-display.mjs [options]

Staging read-only module display QA (G-5z-d).
Docs/UI scan only. No live Supabase connection.

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

  const report = runStagingReadOnlyDisplayQa({ toolRoot, siteId });

  console.log("static-to-astro qa-staging-read-only-display (G-5z-d)");
  console.log(`  phase: ${report.phase}`);
  console.log(`  readOnlyOnly: ${report.readOnlyOnly}`);
  console.log(`  canWrite: ${report.canWrite}`);
  console.log(`  displayQaAdded: ${report.displayQaAdded}`);
  console.log(`  mockModeDocumented: ${report.mockModeDocumented}`);
  console.log(`  supabaseModeDocumented: ${report.supabaseModeDocumented}`);
  console.log(`  moduleStateQaDocumented: ${report.moduleStateQaDocumented}`);
  console.log(`  noWriteQaDocumented: ${report.noWriteQaDocumented}`);
  console.log(`  storageConnected: ${report.storageConnected}`);
  console.log(`  publishConnected: ${report.publishConnected}`);
  console.log(`  adminRouteConnected: ${report.adminRouteConnected}`);
  console.log(`  productionDataTouched: ${report.productionDataTouched}`);
  console.log(`  readyForG5zE: ${report.readyForG5zE}`);

  if (!report.readyForG5zE) {
    console.error("Blockers:", report.blockers.join(", "));
    process.exit(1);
  }

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeStagingReadOnlyDisplayQaOutput(absOut, report);
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  console.log("OK — staging read-only display QA complete.");
}

main();
