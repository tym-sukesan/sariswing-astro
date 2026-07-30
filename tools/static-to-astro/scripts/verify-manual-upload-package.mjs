#!/usr/bin/env node
/**
 * Verify manual upload package structure (G-7g — no FTP).
 * G-20u4 — delegates to generic verify-site-package core (backward-compatible wrapper).
 *
 * Default: About Save UI disarmed + publicAboutBuildRead=false.
 * Temporary Save-UI-armed: --expect-about-save-ui-armed
 * Temporary public build-read: --expect-public-about-build-read
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { REPO_ROOT, verifySitePackage } from "./lib/verify-site-package-core.mjs";
import { GOSAKI_SITE_KEY } from "./lib/site-registry.mjs";
import { createGosakiSitePackageExtensionVerifier } from "./lib/gosaki-site-package-verifier-adapter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

const DEFAULT_PACKAGE = path.join(TOOL_ROOT, "output/manual-upload/gosaki-piano");

function parseArgs(argv) {
  const opts = {
    packageDir: DEFAULT_PACKAGE,
    help: false,
    expectAboutSaveUiArmed: false,
    expectPublicAboutBuildRead: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg === "--package-dir") opts.packageDir = argv[++i];
    else if (arg === "--expect-about-save-ui-armed") opts.expectAboutSaveUiArmed = true;
    else if (arg === "--expect-public-about-build-read") opts.expectPublicAboutBuildRead = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    console.log(`Usage: node scripts/verify-manual-upload-package.mjs [--package-dir PATH] [--expect-about-save-ui-armed | --expect-public-about-build-read]

Legacy Gosaki staging package verifier (G-7g wrapper).
Default expects About Save UI disarmed and publicAboutBuildRead=false.
Temporary Save-UI-armed packages require explicit --expect-about-save-ui-armed.
Temporary public build-read packages require explicit --expect-public-about-build-read.

Prefer: npm run verify:gosaki:staging  or  npm run verify:site-package -- --site gosaki-piano --profile staging
Armed Save UI:  npm run verify:manual-upload:about-save-ui-armed
Build-read:     npm run verify:manual-upload:public-about-build-read
`);
    process.exit(0);
  }

  const result = verifySitePackage({
    siteKey: GOSAKI_SITE_KEY,
    profileName: "staging",
    packageDir: opts.packageDir,
    toolRoot: TOOL_ROOT,
    expectAboutSaveUiArmed: opts.expectAboutSaveUiArmed,
    expectPublicAboutBuildRead: opts.expectPublicAboutBuildRead,
    siteExtensionVerifier: createGosakiSitePackageExtensionVerifier(),
  });

  const mode = opts.expectPublicAboutBuildRead
    ? "public-about-build-read"
    : opts.expectAboutSaveUiArmed
      ? "about-save-ui-armed"
      : "default-disarmed";
  console.log(`\n=== verify:manual-upload (${mode}): ${result.ok ? "PASS" : "FAIL"} ===`);
  if (!result.ok) {
    for (const e of result.errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log(`package: ${path.relative(REPO_ROOT, result.packageDir)}`);
  console.log(`fileCount: ${result.manifest?.fileCount}`);
  console.log(`safeForStaticFtp: ${result.manifest?.safeForStaticFtp}`);
  console.log(`expectAboutSaveUiArmed: ${opts.expectAboutSaveUiArmed}`);
  console.log(`expectPublicAboutBuildRead: ${opts.expectPublicAboutBuildRead}`);
}

main();
