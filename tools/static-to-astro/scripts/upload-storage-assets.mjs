#!/usr/bin/env node
/**
 * Storage asset upload stub (Phase 3-U) — dry-run only, no --apply yet.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/upload-storage-assets.mjs \
 *     --manifest tools/static-to-astro/output/storage/gosaki/storage-asset-plan.json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatStorageUploadStubReport,
  runStorageAssetUpload,
} from "./lib/storage-asset-uploader.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/upload-storage-assets.mjs [options]

Storage upload stub — default dry-run, no uploads (Phase 3-U).

Options:
  --manifest PATH   storage-asset-plan.json (required)
  --apply           NOT IMPLEMENTED — exits with error if set
  --report PATH     Optional stub report output
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    manifest: null,
    apply: false,
    report: null,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--manifest") {
      opts.manifest = argv[++i];
      continue;
    }
    if (arg === "--apply") {
      opts.apply = true;
      continue;
    }
    if (arg === "--report") {
      opts.report = argv[++i];
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

  if (!opts.manifest) {
    printHelp();
    process.exit(1);
  }

  const manifestPath = path.resolve(REPO_ROOT, opts.manifest);

  console.log("Storage asset upload stub (Phase 3-U)");
  console.log(`Manifest: ${opts.manifest}`);
  console.log("");

  if (opts.apply) {
    console.error("Error: --apply is not implemented in Phase 3-U. Dry-run plan only.");
    process.exit(1);
  }

  const result = runStorageAssetUpload({ manifestPath, apply: false });

  console.log(`mode: ${result.mode}`);
  console.log(`uploads performed: no`);
  console.log(`blocked review-required: ${result.blockedReviewRequired}`);
  console.log(`would upload (local): ${result.wouldUpload}`);
  console.log(result.message);

  if (opts.report) {
    const reportPath = path.resolve(REPO_ROOT, opts.report);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, formatStorageUploadStubReport(result), "utf8");
    console.log(`Report: ${opts.report}`);
  }
}

main();
