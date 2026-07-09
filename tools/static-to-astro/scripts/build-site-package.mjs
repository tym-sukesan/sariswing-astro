#!/usr/bin/env node
/**
 * G-20u3 — Generic site package build CLI.
 * Registry-driven convert → static-public → manual-upload pipeline.
 *
 * Usage:
 *   node scripts/build-site-package.mjs --site gosaki-piano --profile staging
 *   node scripts/build-site-package.mjs --site gosaki-piano --profile production --dry-run
 *
 * No FTP · no DB writes.
 */

import { runSitePackageBuild } from "./lib/build-site-package-core.mjs";
import { ALLOWED_PROFILE_NAMES, listSiteKeys } from "./lib/site-registry.mjs";

function printHelp() {
  console.log(`Usage: node scripts/build-site-package.mjs --site SITE_KEY --profile PROFILE [options]

Build manual-upload package from site registry profile. No FTP connection.

Options:
  --site SITE_KEY           Registry site key (e.g. gosaki-piano)
  --profile PROFILE         staging | production
  --dry-run                 Print plan only — no convert / package / verifier execution
  --help, -h

Registered sites: ${listSiteKeys().join(", ")}
Allowed profiles: ${ALLOWED_PROFILE_NAMES.join(", ")}
`);
}

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  const opts = {
    site: null,
    profile: null,
    dryRun: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg === "--site") opts.site = argv[++i];
    else if (arg === "--profile") opts.profile = argv[++i];
    else if (arg === "--dry-run") opts.dryRun = true;
    else throw new Error(`Unknown argument: ${arg}`);
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

  if (!opts.site || !opts.profile) {
    printHelp();
    process.exit(1);
  }

  if (!ALLOWED_PROFILE_NAMES.includes(/** @type {typeof ALLOWED_PROFILE_NAMES[number]} */ (opts.profile))) {
    console.error(
      `Error: unknown profile "${opts.profile}" — allowed: ${ALLOWED_PROFILE_NAMES.join(", ")}`,
    );
    process.exit(1);
  }

  const registered = listSiteKeys();
  if (!registered.includes(opts.site)) {
    console.error(
      `Error: unknown site "${opts.site}" — registered: ${registered.join(", ")}`,
    );
    process.exit(1);
  }

  runSitePackageBuild({
    siteKey: opts.site,
    profileName: opts.profile,
    dryRun: opts.dryRun,
    label: `G-20u3 build-site-package (${opts.site} / ${opts.profile})`,
  });
}

main();
