#!/usr/bin/env node
/**
 * Verify manual upload package structure (G-7g — no FTP).
 * G-20u4 — delegates to generic verify-site-package core (backward-compatible wrapper).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { REPO_ROOT, verifySitePackage } from "./lib/verify-site-package-core.mjs";
import { GOSAKI_SITE_KEY } from "./lib/site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

const DEFAULT_PACKAGE = path.join(TOOL_ROOT, "output/manual-upload/gosaki-piano");

function parseArgs(argv) {
  const opts = { packageDir: DEFAULT_PACKAGE, help: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg === "--package-dir") opts.packageDir = argv[++i];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    console.log(`Usage: node scripts/verify-manual-upload-package.mjs [--package-dir PATH]

Legacy Gosaki staging package verifier (G-7g wrapper).
Prefer: npm run verify:gosaki:staging  or  npm run verify:site-package -- --site gosaki-piano --profile staging
`);
    process.exit(0);
  }

  const result = verifySitePackage({
    siteKey: GOSAKI_SITE_KEY,
    profileName: "staging",
    packageDir: opts.packageDir,
    toolRoot: TOOL_ROOT,
  });

  console.log(`\n=== verify:manual-upload: ${result.ok ? "PASS" : "FAIL"} ===`);
  if (!result.ok) {
    for (const e of result.errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log(`package: ${path.relative(REPO_ROOT, result.packageDir)}`);
  console.log(`fileCount: ${result.manifest?.fileCount}`);
  console.log(`safeForStaticFtp: ${result.manifest?.safeForStaticFtp}`);
}

main();
