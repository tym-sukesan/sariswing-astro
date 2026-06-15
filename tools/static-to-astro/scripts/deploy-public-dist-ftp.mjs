#!/usr/bin/env node
/**
 * Deploy public-dist to staging FTP only (Phase G-2, hardened G-7f1).
 *
 * Usage:
 *   node tools/static-to-astro/scripts/deploy-public-dist-ftp.mjs \
 *     --public-dir tools/static-to-astro/output/static-public/gosaki/public-dist \
 *     --site-slug gosaki \
 *     --env staging \
 *     --report tools/static-to-astro/output/deploy/gosaki/STAGING_FTP_DEPLOY_REPORT.md \
 *     --manifest tools/static-to-astro/output/deploy/gosaki/staging-ftp-deploy-manifest.json
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatDeploySummary,
  runPublicDistFtpDeploy,
} from "./lib/public-dist-ftp-deployer.mjs";
import {
  formatSafetySummary,
  runStagingFtpSafetyVerification,
} from "./lib/staging-ftp-safety-verifier.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/deploy-public-dist-ftp.mjs [options]

Deploy public-dist/ to staging FTP only. Default: dry-run (no FTP connection).

Options:
  --public-dir PATH       public-dist directory (required)
  --site-slug SLUG        Site slug (default: gosaki)
  --env ENV               Must be "staging" (required)
  --report PATH           STAGING_FTP_DEPLOY_REPORT.md output (required)
  --manifest PATH         staging-ftp-deploy-manifest.json output (required)
  --safety-report PATH    STAGING_FTP_SAFETY_REPORT.md (required for --apply)
  --apply                 Connect to FTP and upload (staging only; requires safety report PASS)
  --dry-run               Force dry-run even if --apply passed
  --allow-delete          Enable mirror --delete (default: OFF — remote extras are NOT deleted)
  --legacy-cleanup        Remove remote public-dist/ after mirror (default: OFF)
  --help, -h

G-7f1: --delete is never enabled by default. --apply requires verify-staging-ftp-safety PASS.
`);
}

function parseArgs(argv) {
  const opts = {
    publicDir: null,
    siteSlug: "gosaki",
    env: null,
    report: null,
    manifest: null,
    safetyReport: null,
    apply: false,
    dryRun: false,
    allowDelete: false,
    legacyCleanup: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--apply") {
      opts.apply = true;
      continue;
    }
    if (arg === "--dry-run") {
      opts.dryRun = true;
      continue;
    }
    if (arg === "--allow-delete") {
      opts.allowDelete = true;
      continue;
    }
    if (arg === "--legacy-cleanup") {
      opts.legacyCleanup = true;
      continue;
    }
    if (arg === "--public-dir") {
      opts.publicDir = argv[++i];
      continue;
    }
    if (arg === "--site-slug") {
      opts.siteSlug = argv[++i];
      continue;
    }
    if (arg === "--env") {
      opts.env = argv[++i];
      continue;
    }
    if (arg === "--report") {
      opts.report = argv[++i];
      continue;
    }
    if (arg === "--manifest") {
      opts.manifest = argv[++i];
      continue;
    }
    if (arg === "--safety-report") {
      opts.safetyReport = argv[++i];
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
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

  if (!opts.publicDir || !opts.env || !opts.report || !opts.manifest) {
    printHelp();
    process.exit(1);
  }

  const willApply = opts.apply && !opts.dryRun;

  console.log("Staging FTP deploy (Phase G-2 / G-7f1)");
  console.log(`Public dir: ${opts.publicDir}`);
  console.log(`Env: ${opts.env}`);
  console.log(`Mode: ${willApply ? "apply" : "dry-run"}`);
  console.log(`Delete remote extras: ${opts.allowDelete ? "yes (explicit)" : "no (default)"}`);
  console.log(`Legacy cleanup: ${opts.legacyCleanup ? "yes" : "no"}`);

  let safetyVerifierPassed = false;

  if (willApply) {
    if (!opts.safetyReport) {
      console.error("ERROR: --apply requires --safety-report PATH (run verify-staging-ftp-safety.mjs first)");
      process.exit(1);
    }

    console.log("Running staging FTP safety verifier (static, no FTP)...");
    const safety = runStagingFtpSafetyVerification({
      toolRoot: TOOL_ROOT,
      repoRoot: REPO_ROOT,
      reportPath: opts.safetyReport,
      allowDelete: opts.allowDelete,
    });
    console.log(formatSafetySummary(safety));
    safetyVerifierPassed = safety.stagingFtpSafeToApply;

    if (!safetyVerifierPassed) {
      console.error("ERROR: STAGING_FTP_SAFE_TO_APPLY is not yes — aborting before FTP connect");
      process.exit(1);
    }
  }

  const result = runPublicDistFtpDeploy({
    publicDir: path.resolve(REPO_ROOT, opts.publicDir),
    siteSlug: opts.siteSlug,
    env: opts.env,
    toolRoot: TOOL_ROOT,
    repoRoot: REPO_ROOT,
    apply: opts.apply,
    dryRun: opts.dryRun,
    reportPath: opts.report,
    manifestOutPath: opts.manifest,
    safetyVerifierPassed,
    allowDelete: opts.allowDelete,
    legacyCleanup: opts.legacyCleanup,
  });

  console.log(formatDeploySummary(result));
  console.log(`Report: ${opts.report}`);
  console.log(`Manifest: ${opts.manifest}`);

  if (!result.ok) {
    for (const err of result.errors) {
      console.error(`  ERROR: ${err}`);
    }
    process.exit(1);
  }
}

main();
