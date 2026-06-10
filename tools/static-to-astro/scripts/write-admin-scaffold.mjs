#!/usr/bin/env node
/**
 * Admin scaffold writer CLI (G-5w-b dry-run · G-5w-c sandbox apply).
 *
 * Dry-run:
 *   node tools/static-to-astro/scripts/write-admin-scaffold.mjs \
 *     --package-dir ... --target-dir ... --mode dry-run
 *
 * Sandbox apply (G-5w-c):
 *   node tools/static-to-astro/scripts/write-admin-scaffold.mjs \
 *     --package-dir ... --target-dir tools/static-to-astro/output/admin-writer-sandbox/gosaki \
 *     --apply --approval-id G-5w-c-sandbox-apply
 */

import {
  runAdminScaffoldWriterDryRun,
  writeAdminScaffoldWriterDryRunReports,
} from "./lib/admin-scaffold-writer-dry-runner.mjs";
import {
  APPROVAL_ID_REQUIRED_MSG,
  runAdminScaffoldWriterApply,
} from "./lib/admin-scaffold-writer-applier.mjs";

function printHelp() {
  console.log(`Usage: node scripts/write-admin-scaffold.mjs [options]

Admin scaffold writer — dry-run (G-5w-b) or sandbox apply (G-5w-c).

Options:
  --package-dir PATH    G-5s admin scaffold package directory (required)
  --target-dir PATH     Writer target directory (required)
  --mode MODE           dry-run | plan-only (default: dry-run; ignored with --apply)
  --apply               Apply to sandbox output directory only (G-5w-c)
  --approval-id ID      Required with --apply
  --policy PATH         Writer policy JSON
  --site-slug SLUG      Override site slug from package
  --report-dir PATH     Dry-run report output (default: output/admin-writer-dry-runs/{siteSlug})
  --help, -h

Rejected flags:
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
    approvalId: null,
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
      throw new Error(`Flag ${arg} is not supported.`);
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
    if (arg === "--approval-id") {
      opts.approvalId = argv[++i];
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

/**
 * @param {ReturnType<typeof runAdminScaffoldWriterDryRun>} result
 */
function printDryRunSummary(result) {
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

/**
 * @param {ReturnType<typeof runAdminScaffoldWriterApply>} result
 */
function printApplySummary(result) {
  console.log("");
  console.log("=== Admin Scaffold Writer Sandbox Apply (G-5w-c) ===");
  console.log(`mode: apply-to-sandbox`);
  console.log(`siteSlug: ${result.siteSlug}`);
  console.log(`approvalId: ${result.approvalId}`);
  console.log(`package: ${result.packageRelative}`);
  console.log(`target: ${result.targetRelative}`);
  console.log(`targetAllowed: ${result.targetValidation?.ok ?? false}`);
  console.log(`filesCreated: ${result.filesCreated.length}`);
  console.log(`filesSkipped: ${result.filesSkipped.length}`);
  console.log(`overwrittenFiles: ${result.overwrittenFiles.length}`);
  console.log(`runtimeFilesWritten: false`);
  console.log(`connectedToRuntime: false`);
  console.log(`productionTouched: false`);
  console.log(`srcPagesAdminTouched: false`);
  console.log(`sariswingAdminTouched: false`);
  if (result.warnings?.length) {
    console.log(`warnings: ${result.warnings.length}`);
  }
  console.log("");
}

function runDryRunPath(opts) {
  console.log("Admin scaffold writer dry-run (G-5w-b)");
  console.log("No runtime files written. No target-dir writes. No Supabase / DB / Storage / FTP.");

  const result = runAdminScaffoldWriterDryRun({
    packageDir: opts.packageDir,
    targetDir: opts.targetDir,
    mode: opts.mode,
    policyPath: opts.policyPath ?? "config/admin/admin-scaffold-writer-policy.json",
    siteSlug: opts.siteSlug,
    reportDir: opts.reportDir,
    applyRequested: false,
  });

  const reportAbs = writeAdminScaffoldWriterDryRunReports(result);
  printDryRunSummary(result);
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

function runApplyPath(opts) {
  if (!opts.approvalId || String(opts.approvalId).trim() === "") {
    console.error(`Error: ${APPROVAL_ID_REQUIRED_MSG}`);
    process.exit(1);
  }

  console.log("Admin scaffold writer sandbox apply (G-5w-c)");
  console.log("Sandbox output only. No src/pages/admin. No Supabase / DB / Storage / FTP.");

  let result;
  try {
    result = runAdminScaffoldWriterApply({
      packageDir: opts.packageDir,
      targetDir: opts.targetDir,
      approvalId: opts.approvalId,
      policyPath: opts.policyPath ?? "config/admin/admin-scaffold-writer-policy.json",
      siteSlug: opts.siteSlug,
    });
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  printApplySummary(result);

  if (result.wroteFiles) {
    console.log(`Wrote sandbox scaffold to: ${result.targetAbs}`);
  }

  if (!result.ok) {
    if (result.error) {
      console.error(`Error: ${result.error}`);
    } else if (result.targetValidation && !result.targetValidation.ok) {
      const issue =
        result.targetValidation.applyIssues?.[0] ??
        result.targetValidation.issues.find((i) => i.severity === "error");
      console.error(`Error: ${issue?.message ?? "apply failed safety checks"}`);
    } else if (result.missingPackageFiles?.length) {
      console.error(`Error: missing package files: ${result.missingPackageFiles.join(", ")}`);
    } else {
      console.error("Error: sandbox apply failed");
    }
    process.exit(1);
  }

  process.exit(0);
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

  if (!opts.packageDir || !opts.targetDir) {
    console.error("Error: --package-dir and --target-dir are required");
    printHelp();
    process.exit(1);
  }

  if (opts.applyRequested) {
    runApplyPath(opts);
  } else {
    runDryRunPath(opts);
  }
}

main();
