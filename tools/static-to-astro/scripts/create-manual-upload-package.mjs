#!/usr/bin/env node
/**
 * Create manual staging upload package (G-7g — no FTP).
 *
 * Usage:
 *   node scripts/create-manual-upload-package.mjs \
 *     --site-slug gosaki-piano \
 *     --public-dir output/static-public/gosaki-piano/public-dist \
 *     --deploy-base /cms-kit-staging/gosaki-piano/ \
 *     --staging-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
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
  --site-slug SLUG       Site slug (default: gosaki-piano)
  --public-dir PATH      public-dist source (required)
  --deploy-base PATH     Remote deploy base (default: /cms-kit-staging/gosaki-piano/)
  --staging-url URL      Staging public URL
  --out PATH             Output package directory (required)
  --include-gosaki-read-only-admin BOOL  Record admin inclusion in MANIFEST (true|false)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    siteSlug: "gosaki-piano",
    publicDir: null,
    deployBase: "/cms-kit-staging/gosaki-piano/",
    stagingUrl: "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano",
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
    else if (arg === "--out") opts.out = argv[++i];
    else if (arg === "--include-gosaki-read-only-admin") {
      const val = argv[++i];
      if (val === "true") opts.includeGosakiReadOnlyAdmin = true;
      else if (val === "false") opts.includeGosakiReadOnlyAdmin = false;
      else throw new Error(`--include-gosaki-read-only-admin expects true or false, got: ${val}`);
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

  if (!opts.publicDir || !opts.out) {
    printHelp();
    process.exit(1);
  }

  console.log("Manual upload package (G-8c — no FTP)");
  console.log(`Site: ${opts.siteSlug}`);
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
  console.log(`file count: ${result.manifest.fileCount}`);
  console.log(`safeForStaticFtp: ${result.manifest.safeForStaticFtp}`);
  console.log(`deployBase: ${result.manifest.deployBase}`);
  console.log(`stagingUrl: ${result.manifest.stagingUrl}`);
  console.log(`zip: ${path.relative(REPO_ROOT, result.zipPath)}`);
  console.log(`ftpAutoDeployUsed: false`);
  console.log("overall: PASS");
}

main();
