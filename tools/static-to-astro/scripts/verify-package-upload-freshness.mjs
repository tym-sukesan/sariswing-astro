#!/usr/bin/env node
/**
 * G-20t6 / G-20u10 — Manual-upload package freshness preflight.
 * Verifies MANIFEST.json sourceCommit matches current git HEAD before FTP upload.
 *
 * Usage:
 *   node scripts/verify-package-upload-freshness.mjs --site gosaki-piano --profile staging
 *   node scripts/verify-package-upload-freshness.mjs --site pilot-sample-static --profile staging
 *   node scripts/verify-package-upload-freshness.mjs --profile staging
 *   node scripts/verify-package-upload-freshness.mjs --package-dir output/manual-upload/gosaki-piano
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolvePackageFreshnessTarget } from "./lib/package-freshness-target.mjs";
import {
  formatPackageFreshnessReport,
  verifyPackageUploadFreshness,
} from "./lib/package-upload-safety.mjs";
import { ALLOWED_PROFILE_NAMES, listSiteKeys } from "./lib/site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/verify-package-upload-freshness.mjs [options]

Upload preflight — STOP if MANIFEST sourceCommit !== current git HEAD.

Options:
  --site SITE_KEY      Registry site key (e.g. gosaki-piano, pilot-sample-static)
  --profile NAME       staging | production (default: staging)
  --package-dir PATH   Override package directory (wins over --site/--profile)
  --help, -h

Resolution:
  --package-dir        explicit path
  --site + --profile   registry manualUploadOut
  --profile only       legacy Gosaki (${listSiteKeys().join(", ")} default: gosaki-piano)

Registered sites: ${listSiteKeys().join(", ")}
Allowed profiles: ${ALLOWED_PROFILE_NAMES.join(", ")}
`);
}

function parseArgs(argv) {
  const opts = {
    siteKey: null,
    profile: "staging",
    packageDir: null,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg === "--site") {
      opts.siteKey = argv[++i];
      if (!opts.siteKey) throw new Error("--site requires a siteKey");
    } else if (arg === "--profile") {
      opts.profile = argv[++i];
      if (!opts.profile) throw new Error("--profile requires a profile name");
    } else if (arg === "--package-dir") {
      opts.packageDir = argv[++i];
      if (!opts.packageDir) throw new Error("--package-dir requires a path");
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  return opts;
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  let target;
  try {
    target = resolvePackageFreshnessTarget({
      packageDir: opts.packageDir,
      siteKey: opts.siteKey,
      profileName: opts.profile,
      toolRoot: TOOL_ROOT,
    });
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  const result = verifyPackageUploadFreshness(target.packageDir, REPO_ROOT);
  console.log(formatPackageFreshnessReport(result));
  if (target.siteKey) console.log(`siteKey: ${target.siteKey}`);
  console.log(`profile: ${target.profileName}`);
  console.log(`resolution: ${target.resolution}`);
  console.log(`package: ${path.relative(REPO_ROOT, target.packageDir)}`);

  if (!result.ok) {
    console.error("\n=== UPLOAD PREFLIGHT: STOP (stale package) ===");
    for (const err of result.errors) console.error(`  - ${err}`);
    process.exit(1);
  }

  console.log("\n=== UPLOAD PREFLIGHT: PASS (fresh package) ===");
}

main();
