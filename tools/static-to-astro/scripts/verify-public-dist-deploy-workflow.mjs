#!/usr/bin/env node
/**
 * Verify public-dist FTP deploy workflow template (Phase 3-V).
 *
 * Usage:
 *   node tools/static-to-astro/scripts/verify-public-dist-deploy-workflow.mjs \
 *     --workflow-template tools/static-to-astro/templates/github-actions/public-dist-ftp-deploy.yml \
 *     --report tools/static-to-astro/output/deploy/gosaki/PUBLIC_DIST_DEPLOY_WORKFLOW_REPORT.md
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  EXPECTED_GITHUB_SECRETS,
  formatPublicDistDeployWorkflowReport,
  runPublicDistDeployWorkflowVerification,
} from "./lib/public-dist-deploy-workflow-verifier.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/verify-public-dist-deploy-workflow.mjs [options]

Verify public-dist FTP deploy GitHub Actions workflow template.

Options:
  --workflow-template PATH   Workflow YAML template (required)
  --report PATH              PUBLIC_DIST_DEPLOY_WORKFLOW_REPORT.md output (required)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    workflowTemplate: null,
    report: null,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--workflow-template") {
      opts.workflowTemplate = argv[++i];
      continue;
    }
    if (arg === "--report") {
      opts.report = argv[++i];
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

function printSummary(result) {
  console.log("");
  console.log("=== Public-dist Deploy Workflow Summary ===");
  console.log(`workflow template exists: ${result.workflowExists ? "yes" : "no"}`);
  console.log(`deploy target: ${result.deployTarget?.deployTarget ?? "—"}`);
  console.log(`dist/client direct deploy: ${result.distClientDirectDeploy ? "yes" : "no"}`);
  console.log(`dist/server deploy: ${result.distServerDeploy ? "yes" : "no"}`);
  console.log(`admin/api deploy: ${result.adminApiDeploy ? "yes" : "no"}`);
  console.log(`static public verification step: ${result.staticPublicVerificationStep ? "yes" : "no"}`);
  console.log(`safeForStaticFtp check: ${result.safeForStaticFtpCheck ? "yes" : "no"}`);
  console.log(
    `secret literal leak: ${result.secretLiteralScan.every((c) => c.pass) ? "no" : "yes"}`,
  );
  console.log(`GitHub Secrets only: ${result.githubSecrets.pass ? "yes" : "no"}`);
  console.log("");
  console.log("GitHub Secrets references:");
  for (const ref of result.githubSecrets.references) {
    console.log(`  - secrets.${ref}`);
  }
  console.log("");
  console.log(`Expected required secrets: ${EXPECTED_GITHUB_SECRETS.join(", ")}`);
  console.log(`result: ${result.passed ? "PASS" : "FAIL"}`);
  if (result.errors.length) {
    console.log("");
    console.log("Errors:");
    for (const err of result.errors) {
      console.log(`  - ${err}`);
    }
  }
}

async function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  if (!opts.workflowTemplate || !opts.report) {
    printHelp();
    process.exit(1);
  }

  const workflowPath = path.resolve(REPO_ROOT, opts.workflowTemplate);
  const reportPath = path.resolve(REPO_ROOT, opts.report);

  const started = Date.now();
  console.log("Public-dist deploy workflow verification (Phase 3-V)");
  console.log(`Template: ${opts.workflowTemplate}`);
  console.log("");

  let result;
  try {
    result = runPublicDistDeployWorkflowVerification({ workflowPath });
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(
    reportPath,
    formatPublicDistDeployWorkflowReport(result, {
      reportPath: opts.report,
      elapsedMs: Date.now() - started,
    }),
    "utf8",
  );

  printSummary(result);
  console.log("");
  console.log(`Report: ${opts.report}`);

  process.exit(result.passed ? 0 : 1);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
