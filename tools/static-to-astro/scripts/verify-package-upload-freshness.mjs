#!/usr/bin/env node
/**
 * G-20t6 — Manual-upload package freshness preflight.
 * Verifies MANIFEST.json sourceCommit matches current git HEAD before FTP upload.
 *
 * Usage:
 *   node scripts/verify-package-upload-freshness.mjs --profile staging
 *   node scripts/verify-package-upload-freshness.mjs --profile production
 *   node scripts/verify-package-upload-freshness.mjs --package-dir output/manual-upload/gosaki-piano
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveGosakiPackageBuildProfile } from "./lib/gosaki-package-build-profile.mjs";
import {
  formatPackageFreshnessReport,
  verifyPackageUploadFreshness,
} from "./lib/package-upload-safety.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/verify-package-upload-freshness.mjs [options]

Upload preflight — STOP if MANIFEST sourceCommit !== current git HEAD.

Options:
  --profile NAME       staging | production (default: staging)
  --package-dir PATH   Override package directory
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    profile: "staging",
    packageDir: null,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg === "--profile") opts.profile = argv[++i];
    else if (arg === "--package-dir") opts.packageDir = argv[++i];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  let packageDir = opts.packageDir;
  if (!packageDir) {
    const profile = resolveGosakiPackageBuildProfile(opts.profile);
    packageDir = path.join(TOOL_ROOT, profile.manualUploadOut);
  } else if (!path.isAbsolute(packageDir)) {
    packageDir = path.resolve(TOOL_ROOT, packageDir);
  }

  const result = verifyPackageUploadFreshness(packageDir, REPO_ROOT);
  console.log(formatPackageFreshnessReport(result));
  console.log(`package: ${path.relative(REPO_ROOT, packageDir)}`);

  if (!result.ok) {
    console.error("\n=== UPLOAD PREFLIGHT: STOP (stale package) ===");
    for (const err of result.errors) console.error(`  - ${err}`);
    process.exit(1);
  }

  console.log("\n=== UPLOAD PREFLIGHT: PASS (fresh package) ===");
}

main();
