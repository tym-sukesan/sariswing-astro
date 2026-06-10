#!/usr/bin/env node
/**
 * G-5z-f — Customer demo readiness report.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/report-customer-demo-readiness.mjs
 *   node tools/static-to-astro/scripts/report-customer-demo-readiness.mjs \
 *     --out-dir tools/static-to-astro/output/customer-demo-readiness/gosaki
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runCustomerDemoReadinessReport,
  writeCustomerDemoReadinessOutput,
} from "./lib/customer-demo-readiness-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printHelp() {
  console.log(`Usage: node scripts/report-customer-demo-readiness.mjs [options]

Customer demo readiness report (G-5z-f).
Docs scan only. No live Supabase connection.

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

  const report = runCustomerDemoReadinessReport({ toolRoot, siteId });

  console.log("static-to-astro report-customer-demo-readiness (G-5z-f)");
  console.log(`  phase: ${report.phase}`);
  console.log(`  readyForCustomerDemo: ${report.readyForCustomerDemo}`);
  console.log(`  readOnlyPhaseComplete: ${report.readOnlyPhaseComplete}`);
  console.log(`  canWrite: ${report.canWrite}`);
  console.log(`  writeOperationsEnabled: ${report.writeOperationsEnabled}`);
  console.log(`  adminRouteConnected: ${report.adminRouteConnected}`);
  console.log(`  storageConnected: ${report.storageConnected}`);
  console.log(`  publishConnected: ${report.publishConnected}`);
  console.log(`  productionDataTouched: ${report.productionDataTouched}`);
  console.log(`  readyForG6Planning: ${report.readyForG6Planning}`);
  console.log(`  readyForG6Implementation: ${report.readyForG6Implementation}`);

  if (!report.readyForCustomerDemo) {
    console.error("Blockers:", report.blockers.join(", "));
    process.exit(1);
  }

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeCustomerDemoReadinessOutput(absOut, report);
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  console.log("OK — customer demo readiness report complete.");
}

main();
