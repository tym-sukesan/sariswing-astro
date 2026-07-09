#!/usr/bin/env node
/**
 * G-20u11 — Site-aware preflight runner.
 * Chains verify-site-package + verify-package-upload-freshness with explicit --site/--profile.
 *
 * Usage:
 *   node scripts/run-site-preflight.mjs --site gosaki-piano --profile staging
 *   node scripts/run-site-preflight.mjs --site pilot-sample-static --profile staging
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { ALLOWED_PROFILE_NAMES, listSiteKeys } from "./lib/site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

function printHelp() {
  console.log(`Usage: node scripts/run-site-preflight.mjs --site SITE_KEY [--profile NAME]

Operator preflight — verify package structure, then freshness (MANIFEST vs git HEAD).

Steps:
  1. verify-site-package.mjs --site SITE_KEY --profile NAME
  2. verify-package-upload-freshness.mjs --site SITE_KEY --profile NAME

Stale package → step 2 fails (STOP). Rebuild at current HEAD before upload.

Options:
  --site SITE_KEY      Registry site key (required)
  --profile NAME       staging | production (default: staging)
  --help, -h

Registered sites: ${listSiteKeys().join(", ")}
Allowed profiles: ${ALLOWED_PROFILE_NAMES.join(", ")}
`);
}

function parseArgs(argv) {
  const opts = {
    siteKey: null,
    profile: "staging",
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
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!opts.help && !opts.siteKey) throw new Error("--site is required");
  return opts;
}

function runStep(label, script, args) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync("node", [script, ...args], {
    cwd: TOOL_ROOT,
    encoding: "utf8",
    stdio: "inherit",
  });
  return result.status ?? 1;
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

  if (!ALLOWED_PROFILE_NAMES.includes(/** @type {typeof ALLOWED_PROFILE_NAMES[number]} */ (opts.profile))) {
    console.error(
      `Error: Unknown profile "${opts.profile}" — allowed: ${ALLOWED_PROFILE_NAMES.join(", ")}`,
    );
    process.exit(1);
  }

  const sharedArgs = ["--site", opts.siteKey, "--profile", opts.profile];
  console.log(`Site preflight: site=${opts.siteKey} profile=${opts.profile}`);

  const verifyExit = runStep(
    "Step 1/2: verify-site-package",
    "scripts/verify-site-package.mjs",
    sharedArgs,
  );
  if (verifyExit !== 0) {
    console.error("\n=== PREFLIGHT: STOP (verify-site-package failed) ===");
    process.exit(verifyExit);
  }

  const freshnessExit = runStep(
    "Step 2/2: verify-package-upload-freshness",
    "scripts/verify-package-upload-freshness.mjs",
    sharedArgs,
  );
  if (freshnessExit !== 0) {
    console.error("\n=== PREFLIGHT: STOP (stale package — rebuild at current HEAD) ===");
    process.exit(freshnessExit);
  }

  console.log("\n=== PREFLIGHT: PASS (structure + freshness) ===");
  console.log("Manual FTP upload only — no auto deploy.");
}

main();
