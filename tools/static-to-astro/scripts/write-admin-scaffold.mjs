#!/usr/bin/env node
/**
 * Admin scaffold writer CLI (G-5w-b dry-run only).
 * Plans future writer output — no runtime file writes, no --apply.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/write-admin-scaffold.mjs \
 *     --package-dir tools/static-to-astro/output/admin-scaffold-packages/gosaki \
 *     --target-dir tools/static-to-astro/output/admin-writer-sandbox/gosaki \
 *     --mode dry-run
 */

import {
  APPLY_NOT_IMPLEMENTED_MSG,
  runAdminScaffoldWriterDryRun,
  writeAdminScaffoldWriterDryRunReports,
} from "./lib/admin-scaffold-writer-dry-runner.mjs";

function printHelp() {
  console.log(`Usage: node scripts/write-admin-scaffold.mjs [options]

Admin scaffold writer dry-run (G-5w-b).
Plans files and writes reports to report-dir only.
Does NOT write runtime admin scaffold files. Does NOT support --apply.

Options:
  --package-dir PATH    G-5s admin scaffold package directory (required)
  --target-dir PATH     Planned writer target directory (required)
  --mode MODE           dry-run | plan-only (default: dry-run)
  --policy PATH         Writer policy JSON (default: config/admin/admin-scaffold-writer-policy.json)
  --site-slug SLUG      Override site slug from package
  --report-dir PATH     Report output (default: output/admin-writer-dry-runs/{siteSlug})
  --help, -h

Rejected flags (G-5w-b):
  --apply               Not implemented — exits with error
  --force               Not supported
  --overwrite           Not supported
`);
}

function parseArgs(argv) {
  const opts = {
    packageDir: null,
    targetDir: null,
    mode: "dry-run",
    policyPath: null,
    siteSlug: null,
    reportDir: null,
    applyRequested: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--apply") {
      opts.applyRequested = true;
      continue;
    }
    if (arg === "--force" || arg === "--overwrite") {
      throw new Error(`Flag ${arg} is not supported in G-5w-b.`);
    }
    if (arg === "--package-dir") {
      opts.packageDir = argv[++i];
      continue;
    }
    if (arg === "--target-dir") {
      opts.targetDir = argv[++i];
      continue;
    }
    if (arg === "--mode") {
      opts.mode = argv[++i];
      continue;
    }
    if (arg === "--policy") {
      opts.policyPath = argv[++i];
      continue;
    }
    if (arg === "--site-slug") {
      opts.siteSlug = argv[++i];
      continue;
    }
    if (arg === "--report-dir") {
      opts.reportDir = argv[++i];
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

/**
 * @param {ReturnType<typeof runAdminScaffoldWriterDryRun>} result
 */
function printSummary(result) {
  console.log("");
  console.log("=== Admin Scaffold Writer Dry-run (G-5w-b) ===");
  console.log(`mode: ${result.mode}`);
  console.log(`siteSlug: ${result.siteSlug}`);
  console.log(`package: ${result.packageRelative}`);
  console.log(`target: ${result.targetRelative}`);
  console.log(`report: ${result.reportRelative}/`);
  console.log(`targetAllowed: ${result.targetValidation.ok}`);
  console.log(`applyImplemented: false`);
  console.log(`runtimeFilesWritten: false`);
  console.log(`overwroteExistingFiles: false`);
  console.log(`srcPagesAdminTouched: ${result.plannedFilesManifest.safety.srcPagesAdminTouched}`);
  console.log(`sariswingAdminTouched: ${result.plannedFilesManifest.safety.sariswingAdminTouched}`);
  console.log(`plannedFiles: ${result.plannedFilesManifest.plannedFiles.length}`);
  if (result.missingPackageFiles.length) {
    console.log(`missingPackageFiles: ${result.missingPackageFiles.join(", ")}`);
  }
  if (result.warnings.length) {
    console.log(`warnings: ${result.warnings.length}`);
  }
  console.log("");
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  if (opts.applyRequested) {
    console.error(`Error: ${APPLY_NOT_IMPLEMENTED_MSG}`);
    process.exit(1);
  }

  if (!opts.packageDir || !opts.targetDir) {
    console.error("Error: --package-dir and --target-dir are required");
    printHelp();
    process.exit(1);
  }

  console.log("Admin scaffold writer dry-run (G-5w-b)");
  console.log("No runtime files written. No --apply. No Supabase / DB / Storage / FTP.");

  let result;
  try {
    result = runAdminScaffoldWriterDryRun({
      packageDir: opts.packageDir,
      targetDir: opts.targetDir,
      mode: opts.mode,
      policyPath: opts.policyPath ?? "config/admin/admin-scaffold-writer-policy.json",
      siteSlug: opts.siteSlug,
      reportDir: opts.reportDir,
      applyRequested: opts.applyRequested,
    });
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  const reportAbs = writeAdminScaffoldWriterDryRunReports(result);
  printSummary(result);
  console.log(`Wrote dry-run reports to: ${reportAbs}`);

  if (!result.targetValidation.ok) {
    const adminIssue = result.targetValidation.issues.find(
      (i) => i.code === "SRC_PAGES_ADMIN" || i.code === "HARD_BLOCKED",
    );
    if (adminIssue) {
      console.error(`Error: ${adminIssue.message}`);
    } else {
      console.error("Error: target-dir failed safety checks (see report)");
    }
    process.exit(1);
  }

  if (result.missingPackageFiles.length) {
    console.error(`Error: missing required package files: ${result.missingPackageFiles.join(", ")}`);
    process.exit(1);
  }

  process.exit(0);
}

main();
