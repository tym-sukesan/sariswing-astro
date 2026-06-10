#!/usr/bin/env node
/**
 * Inspect Admin Auth adapter scaffold (G-5y-b dry-run).
 * Read-only / output-only. No Supabase connection.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/inspect-admin-auth-adapter.mjs
 *   node tools/static-to-astro/scripts/inspect-admin-auth-adapter.mjs \
 *     --out-dir tools/static-to-astro/output/admin-auth-dry-runs/gosaki
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  runAdminAuthAdapterDryRun,
  writeAdminAuthAdapterDryRunOutput,
} from "./lib/admin-auth-adapter-dry-runner.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printHelp() {
  console.log(`Usage: node scripts/inspect-admin-auth-adapter.mjs [options]

Dry-run Admin Auth adapter scaffold (G-5y-b).
No Supabase connection. No DB / Storage / FTP / dispatch.

Options:
  --out-dir PATH    Write report JSON + markdown (optional)
  --site-id ID      Site label for report (default: gosaki when out-dir ends with gosaki)
  --help, -h
`);
}

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  const opts = {
    outDir: null,
    siteId: null,
    help: false,
  };

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

  const report = runAdminAuthAdapterDryRun({ toolRoot, siteId });

  console.log("static-to-astro inspect-admin-auth-adapter (G-5y-b dry-run)");
  console.log(`  phase: ${report.phase}`);
  console.log(`  provider: ${report.provider}`);
  console.log(`  supabaseAuthConnected: ${report.supabaseAuthConnected}`);
  console.log(`  supabaseClientImported: ${report.supabaseClientImported}`);
  console.log(`  connectedToRuntime: ${report.connectedToRuntime}`);
  console.log(`  productionReady: ${report.productionReady}`);
  console.log(`  readyForG5yC: ${report.readyForG5yC}`);
  console.log(`  mockSession: ${report.mockSession.email} (${report.mockSession.role})`);

  if (report.missingScaffoldFiles.length > 0) {
    console.error("Missing scaffold files:", report.missingScaffoldFiles.join(", "));
    process.exit(1);
  }

  if (!report.forbiddenImportScan.clean) {
    console.error("Forbidden import scan failed:", report.forbiddenImportScan.hits);
    process.exit(1);
  }

  if (opts.outDir) {
    const absOut = path.isAbsolute(opts.outDir)
      ? opts.outDir
      : path.resolve(process.cwd(), opts.outDir);
    const { jsonPath, mdPath } = writeAdminAuthAdapterDryRunOutput(absOut, report);
    console.log(`  wrote: ${jsonPath}`);
    console.log(`  wrote: ${mdPath}`);
  }

  console.log("OK — Auth adapter scaffold dry-run complete.");
}

main();
