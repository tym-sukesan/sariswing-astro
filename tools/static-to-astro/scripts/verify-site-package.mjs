#!/usr/bin/env node
/**
 * G-20u4 — Generic site package verifier CLI.
 *
 * Usage:
 *   node scripts/verify-site-package.mjs --site gosaki-piano --profile staging
 *   node scripts/verify-site-package.mjs --site gosaki-piano --profile production
 *
 * No FTP · no DB writes. Does not check sourceCommit freshness (use verify:package-freshness:*).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  REPO_ROOT,
  TOOL_ROOT,
  verifySitePackage,
} from "./lib/verify-site-package-core.mjs";
import { ALLOWED_PROFILE_NAMES, listSiteKeys } from "./lib/site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printHelp() {
  console.log(`Usage: node scripts/verify-site-package.mjs --site SITE_KEY --profile PROFILE [options]

Verify manual-upload package against site registry expectations. No FTP.

Options:
  --site SITE_KEY       Registry site key (e.g. gosaki-piano)
  --profile PROFILE     staging | production
  --package-dir PATH    Override package directory (default from registry)
  --help, -h

Registered sites: ${listSiteKeys().join(", ")}
Allowed profiles: ${ALLOWED_PROFILE_NAMES.join(", ")}

Freshness: this verifier checks MANIFEST.sourceCommit exists, not HEAD match.
Before upload run: npm run verify:package-freshness:staging|production
`);
}

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  const opts = {
    site: null,
    profile: null,
    packageDir: null,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg === "--site") opts.site = argv[++i];
    else if (arg === "--profile") opts.profile = argv[++i];
    else if (arg === "--package-dir") opts.packageDir = argv[++i];
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

  const result = verifySitePackage({
    siteKey: opts.site,
    profileName: opts.profile,
    packageDir: opts.packageDir ?? undefined,
    toolRoot: TOOL_ROOT,
  });

  console.log(`\n=== verify:site-package (${opts.site} / ${opts.profile}): ${result.ok ? "PASS" : "FAIL"} ===`);

  if (!result.ok) {
    for (const e of result.errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log(`package: ${path.relative(REPO_ROOT, result.packageDir)}`);
  console.log(`targetEnvironment: ${result.manifest?.targetEnvironment}`);
  console.log(`packageProfileName: ${result.manifest?.packageProfileName}`);
  console.log(`siteKey: ${result.manifest?.siteKey ?? result.meta.siteKey}`);
  console.log(`publicBaseUrl: ${result.manifest?.publicBaseUrl}`);
  console.log(`intendedRemotePath: ${result.manifest?.intendedRemotePath}`);
  console.log(`includesAdmin: ${result.manifest?.includesAdmin}`);
  console.log(`fileCount: ${result.manifest?.fileCount}`);
  console.log(`sourceCommit: ${result.manifest?.sourceCommit}`);
  console.log(`generatedAt: ${result.manifest?.generatedAt}`);
  console.log(`freshness: run npm run verify:package-freshness:${opts.profile} before upload`);
}

main();
