#!/usr/bin/env node
/**
 * Inspect read-only data adapter scaffold (G-5z-b dry-run).
 *
 * Usage:
 *   node tools/static-to-astro/scripts/inspect-read-only-data-adapter.mjs
 *   node tools/static-to-astro/scripts/inspect-read-only-data-adapter.mjs \
 *     --out-dir tools/static-to-astro/output/read-only-data-adapter-dry-runs/gosaki
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runReadOnlyDataAdapterInspection,
  writeReadOnlyDataAdapterOutput,
} from "./lib/read-only-data-adapter-inspector.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printHelp() {
  console.log(`Usage: node scripts/inspect-read-only-data-adapter.mjs [options]

Dry-run read-only data adapter scaffold (G-5z-b).
No Supabase connection. No DB / Storage / FTP / dispatch.

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

  const report = runReadOnlyDataAdapterInspection({ toolRoot, siteId });

  console.log("static-to-astro inspect-read-only-data-adapter (G-5z-b dry-run)");
  console.log(`  phase: ${report.phase}`);
  console.log(`  provider: ${report.provider}`);
  console.log(`  readOnlyOnly: ${report.readOnlyOnly}`);
  console.log(`  canWrite: ${report.canWrite}`);
  console.log(`  supabaseDbQueryImplemented: ${report.supabaseDbQueryImplemented}`);
  console.log(`  fromSelectAdded: ${report.fromSelectAdded}`);
  console.log(`  dbQueryPerformed: ${report.dbQueryPerformed}`);
  console.log(`  rlsPolicyChanged: ${report.rlsPolicyChanged}`);
  console.log(`  storageReadImplemented: ${report.storageReadImplemented}`);
  console.log(`  productionDataTouched: ${report.productionDataTouched}`);
  console.log(`  adminRouteConnected: ${report.adminRouteConnected}`);
  console.log(`  readyForG5zC: ${report.readyForG5zC}`);

  if (report.missingStagingDataFiles.length > 0) {
    console.error("Missing staging data files:", report.missingStagingDataFiles.join(", "));
    process.exit(1);
  }

  if (!report.forbiddenScan.clean) {
    console.error("Forbidden scan failed:", report.forbiddenScan.hits);
    process.exit(1);
  }

  if (!report.fixtureEmailScan.clean) {
    console.error("Fixture email/URL scan failed:", report.fixtureEmailScan.hits);
    process.exit(1);
  }

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeReadOnlyDataAdapterOutput(absOut, report);
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  console.log("OK — read-only data adapter scaffold dry-run complete.");
}

main();
