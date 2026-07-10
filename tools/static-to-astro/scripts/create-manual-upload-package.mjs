#!/usr/bin/env node
/**
 * Create manual staging upload package (G-7g / G-20t3 / G-20u18 — no FTP).
 *
 * Generic usage (requires --site-key):
 *   node scripts/create-manual-upload-package.mjs \
 *     --site-key gosaki-piano \
 *     --profile staging \
 *     --public-dir output/static-public/gosaki-piano/public-dist \
 *     --out output/manual-upload/gosaki-piano
 *
 * Legacy Gosaki convenience (npm):
 *   npm run manual-upload:package:gosaki:staging
 *   npm run manual-upload:package:gosaki:production
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { createManualUploadPackage } from "./lib/manual-upload-package.mjs";
import { listSiteKeys, resolvePackageManifestMetaFromRegistry } from "./lib/site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

const LEGACY_HINT = [
  "Legacy Gosaki staging:    npm run manual-upload:package:gosaki:staging",
  "Legacy Gosaki production: npm run manual-upload:package:gosaki:production",
  "Generic:                  npm run manual-upload:site-package -- --site-key SITE --profile PROFILE --public-dir PATH --out PATH",
].join("\n  ");

function printHelp() {
  console.log(`Usage: node scripts/create-manual-upload-package.mjs [options]

Build manual FTP upload package from public-dist. No FTP connection.

Required:
  --site-key KEY (or --site KEY)   Registry site key
  --public-dir PATH              public-dist source
  --out PATH                     Output package directory

Options:
  --profile NAME                 staging | production (alias for --package-profile)
  --site-slug SLUG               Override site slug (default from registry when --site-key set)
  --deploy-base PATH             Remote deploy base (default from registry)
  --staging-url URL              Public base URL (legacy alias)
  --public-base-url URL          Public base URL for MANIFEST.publicBaseUrl
  --target-environment ENV       staging | production (default from --profile)
  --package-profile NAME         staging | production
  --intended-remote-path PATH    Operator FTP destination path
  --include-gosaki-read-only-admin BOOL  Record admin inclusion (true|false)
  --help, -h

Registered sites: ${listSiteKeys().join(", ")}

${LEGACY_HINT}
`);
}

function parseArgs(argv) {
  const opts = {
    siteKey: null,
    siteSlug: null,
    publicDir: null,
    deployBase: null,
    stagingUrl: null,
    publicBaseUrl: null,
    targetEnvironment: null,
    packageProfile: null,
    intendedRemotePath: null,
    out: null,
    includeReadOnlyAdmin: undefined,
    includeGosakiReadOnlyAdmin: undefined,
    help: false,
    registryMeta: null,
  };
  const explicit = {
    siteSlug: false,
    deployBase: false,
    stagingUrl: false,
    publicBaseUrl: false,
    targetEnvironment: false,
    packageProfile: false,
    intendedRemotePath: false,
    includeReadOnlyAdmin: false,
    includeGosakiReadOnlyAdmin: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--site-key" || arg === "--site") opts.siteKey = argv[++i];
    else if (arg === "--site-slug") {
      opts.siteSlug = argv[++i];
      explicit.siteSlug = true;
    } else if (arg === "--public-dir") opts.publicDir = argv[++i];
    else if (arg === "--deploy-base") {
      opts.deployBase = argv[++i];
      explicit.deployBase = true;
    } else if (arg === "--staging-url") {
      opts.stagingUrl = argv[++i];
      explicit.stagingUrl = true;
    } else if (arg === "--public-base-url") {
      opts.publicBaseUrl = argv[++i];
      explicit.publicBaseUrl = true;
    } else if (arg === "--target-environment") {
      const val = argv[++i];
      if (val !== "staging" && val !== "production") {
        throw new Error(`--target-environment must be staging or production, got: ${val}`);
      }
      opts.targetEnvironment = val;
      explicit.targetEnvironment = true;
    } else if (arg === "--package-profile" || arg === "--profile") {
      opts.packageProfile = argv[++i];
      explicit.packageProfile = true;
    } else if (arg === "--intended-remote-path") {
      opts.intendedRemotePath = argv[++i];
      explicit.intendedRemotePath = true;
    } else if (arg === "--out") opts.out = argv[++i];
    else if (arg === "--include-read-only-admin") {
      const val = argv[++i];
      if (val === "true") opts.includeReadOnlyAdmin = true;
      else if (val === "false") opts.includeReadOnlyAdmin = false;
      else throw new Error(`--include-read-only-admin expects true or false, got: ${val}`);
      explicit.includeReadOnlyAdmin = true;
    } else if (arg === "--include-gosaki-read-only-admin") {
      const val = argv[++i];
      if (val === "true") opts.includeGosakiReadOnlyAdmin = true;
      else if (val === "false") opts.includeGosakiReadOnlyAdmin = false;
      else throw new Error(`--include-gosaki-read-only-admin expects true or false, got: ${val}`);
      explicit.includeGosakiReadOnlyAdmin = true;
    } else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!opts.packageProfile) {
    opts.packageProfile = opts.targetEnvironment ?? "staging";
  }
  if (!opts.targetEnvironment) {
    opts.targetEnvironment = opts.packageProfile;
  }
  if (!opts.publicBaseUrl && opts.stagingUrl) {
    opts.publicBaseUrl = opts.stagingUrl;
  }

  if (opts.siteKey) {
    const profileName = opts.packageProfile ?? opts.targetEnvironment;
    const registryMeta = resolvePackageManifestMetaFromRegistry(opts.siteKey, profileName, {
      toolRoot: TOOL_ROOT,
    });
    if (!explicit.siteSlug) opts.siteSlug = registryMeta.siteSlug;
    if (!explicit.deployBase) opts.deployBase = registryMeta.deployBase;
    if (!explicit.publicBaseUrl && !explicit.stagingUrl) {
      opts.publicBaseUrl = registryMeta.publicBaseUrl.replace(/\/$/, "");
      opts.stagingUrl = registryMeta.stagingBaseUrl ?? registryMeta.publicBaseUrl.replace(/\/$/, "");
    }
    if (!explicit.intendedRemotePath) opts.intendedRemotePath = registryMeta.intendedRemotePath;
    if (!explicit.targetEnvironment) opts.targetEnvironment = registryMeta.targetEnvironment;
    if (!explicit.packageProfile) opts.packageProfile = registryMeta.packageProfileName;
    if (!explicit.includeReadOnlyAdmin && !explicit.includeGosakiReadOnlyAdmin) {
      opts.includeReadOnlyAdmin = registryMeta.includeReadOnlyAdmin;
      opts.includeGosakiReadOnlyAdmin = registryMeta.includeReadOnlyAdmin;
    } else if (opts.includeReadOnlyAdmin === undefined && opts.includeGosakiReadOnlyAdmin !== undefined) {
      opts.includeReadOnlyAdmin = opts.includeGosakiReadOnlyAdmin;
    } else if (opts.includeGosakiReadOnlyAdmin === undefined && opts.includeReadOnlyAdmin !== undefined) {
      opts.includeGosakiReadOnlyAdmin = opts.includeReadOnlyAdmin;
    }
    opts.registryMeta = registryMeta;
  }

  if (!opts.intendedRemotePath && opts.deployBase) {
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

  if (!opts.siteKey) {
    console.error("Error: --site-key (or --site) is required.");
    console.error(`  ${LEGACY_HINT}`);
    printHelp();
    process.exit(1);
  }

  if (!opts.publicDir || !opts.out) {
    console.error("Error: --public-dir and --out are required.");
    printHelp();
    process.exit(1);
  }

  console.log("Manual upload package (G-20t3 — no FTP)");
  console.log(`Site: ${opts.siteSlug} (siteKey: ${opts.siteKey})`);
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
    includeReadOnlyAdmin: opts.includeReadOnlyAdmin,
    includeGosakiReadOnlyAdmin: opts.includeGosakiReadOnlyAdmin ?? opts.includeReadOnlyAdmin,
    siteKey: opts.registryMeta?.siteKey ?? opts.siteKey ?? null,
    cmsSiteSlug: opts.registryMeta?.cmsSiteSlug ?? null,
    supabaseSiteSlug: opts.registryMeta?.supabaseSiteSlug ?? opts.siteSlug,
    packageKey: opts.registryMeta?.packageKey ?? null,
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
