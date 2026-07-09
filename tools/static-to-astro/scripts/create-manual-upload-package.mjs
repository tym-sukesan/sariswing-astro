#!/usr/bin/env node
/**
 * Create manual staging upload package (G-7g / G-20t3 — no FTP).
 *
 * Usage:
 *   node scripts/create-manual-upload-package.mjs \
 *     --site-slug gosaki-piano \
 *     --public-dir output/static-public/gosaki-piano/public-dist \
 *     --deploy-base /cms-kit-staging/gosaki-piano/ \
 *     --staging-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
 *     --target-environment staging \
 *     --package-profile staging \
 *     --intended-remote-path /cms-kit-staging/gosaki-piano/ \
 *     --out output/manual-upload/gosaki-piano
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { createManualUploadPackage } from "./lib/manual-upload-package.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/create-manual-upload-package.mjs [options]

Build manual FTP upload package from public-dist. No FTP connection.

Options:
  --site-slug SLUG              Site slug (default: gosaki-piano)
  --public-dir PATH             public-dist source (required)
  --deploy-base PATH            Remote deploy base (default: /cms-kit-staging/gosaki-piano/)
  --staging-url URL             Public base URL (legacy alias)
  --public-base-url URL         Public base URL for MANIFEST.publicBaseUrl
  --target-environment ENV      staging | production (default: staging)
  --package-profile NAME        staging | production (default: matches target-environment)
  --intended-remote-path PATH   Operator FTP destination path
  --out PATH                    Output package directory (required)
  --include-gosaki-read-only-admin BOOL  Record admin inclusion (true|false)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    siteSlug: "gosaki-piano",
    publicDir: null,
    deployBase: "/cms-kit-staging/gosaki-piano/",
    stagingUrl: "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano",
    publicBaseUrl: null,
    targetEnvironment: "staging",
    packageProfile: null,
    intendedRemotePath: null,
    out: null,
    includeGosakiReadOnlyAdmin: undefined,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--site-slug") opts.siteSlug = argv[++i];
    else if (arg === "--public-dir") opts.publicDir = argv[++i];
    else if (arg === "--deploy-base") opts.deployBase = argv[++i];
    else if (arg === "--staging-url") opts.stagingUrl = argv[++i];
    else if (arg === "--public-base-url") opts.publicBaseUrl = argv[++i];
    else if (arg === "--target-environment") {
      const val = argv[++i];
      if (val !== "staging" && val !== "production") {
        throw new Error(`--target-environment must be staging or production, got: ${val}`);
      }
      opts.targetEnvironment = val;
    } else if (arg === "--package-profile") opts.packageProfile = argv[++i];
    else if (arg === "--intended-remote-path") opts.intendedRemotePath = argv[++i];
    else if (arg === "--out") opts.out = argv[++i];
    else if (arg === "--include-gosaki-read-only-admin") {
      const val = argv[++i];
      if (val === "true") opts.includeGosakiReadOnlyAdmin = true;
      else if (val === "false") opts.includeGosakiReadOnlyAdmin = false;
      else throw new Error(`--include-gosaki-read-only-admin expects true or false, got: ${val}`);
    } else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!opts.packageProfile) {
    opts.packageProfile = opts.targetEnvironment;
  }
  if (!opts.publicBaseUrl) {
    opts.publicBaseUrl = opts.stagingUrl;
  }
  if (!opts.intendedRemotePath) {
    opts.intendedRemotePath = opts.deployBase;
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

  if (!opts.publicDir || !opts.out) {
    printHelp();
    process.exit(1);
  }

  console.log("Manual upload package (G-20t3 — no FTP)");
  console.log(`Site: ${opts.siteSlug}`);
  console.log(`Profile: ${opts.packageProfile}`);
  console.log(`Target: ${opts.targetEnvironment}`);
  console.log(`Source: ${opts.publicDir}`);
  console.log(`Out: ${opts.out}`);

  const result = createManualUploadPackage({
    publicDistDir: path.isAbsolute(opts.publicDir)
      ? opts.publicDir
      : path.resolve(TOOL_ROOT, opts.publicDir),
    outDir: path.isAbsolute(opts.out) ? opts.out : path.resolve(TOOL_ROOT, opts.out),
    siteSlug: opts.siteSlug,
    deployBase: opts.deployBase,
    stagingUrl: opts.stagingUrl,
    publicBaseUrl: opts.publicBaseUrl,
    targetEnvironment: opts.targetEnvironment,
    packageProfileName: opts.packageProfile,
    intendedRemotePath: opts.intendedRemotePath,
    toolRoot: TOOL_ROOT,
    repoRoot: REPO_ROOT,
    includeGosakiReadOnlyAdmin: opts.includeGosakiReadOnlyAdmin,
  });

  if (!result.ok) {
    for (const err of result.errors) console.error(`ERROR: ${err}`);
    process.exit(1);
  }

  console.log("");
  console.log("=== Manual Upload Package Summary ===");
  console.log(`package dir: ${path.relative(REPO_ROOT, result.packageDir)}`);
  console.log(`profile: ${result.manifest.packageProfileName}`);
  console.log(`targetEnvironment: ${result.manifest.targetEnvironment}`);
  console.log(`includesAdmin: ${result.manifest.includesAdmin}`);
  console.log(`file count: ${result.manifest.fileCount}`);
  console.log(`safeForStaticFtp: ${result.manifest.safeForStaticFtp}`);
  console.log(`intendedRemotePath: ${result.manifest.intendedRemotePath}`);
  console.log(`publicBaseUrl: ${result.manifest.publicBaseUrl}`);
  console.log(`sourceCommit: ${result.manifest.sourceCommit}`);
  console.log(`zip: ${path.relative(REPO_ROOT, result.zipPath)}`);
  console.log(`ftpAutoDeployUsed: false`);
  console.log("overall: PASS");
}

main();
