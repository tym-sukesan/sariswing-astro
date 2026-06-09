#!/usr/bin/env node
/**
 * Apply staging DB updates from storage-db-update-plan.json (G-4c).
 * Default: dry-run. Use --apply to update discography.cover_image_url only.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/apply-storage-db-updates.mjs \
 *     --plan tools/static-to-astro/output/storage/gosaki/storage-db-update-plan.json \
 *     --site-slug gosaki \
 *     --table discography \
 *     --report tools/static-to-astro/output/storage/gosaki/STORAGE_DB_UPDATE_REPORT.md \
 *     --manifest tools/static-to-astro/output/storage/gosaki/storage-db-update-result.json \
 *     --backup tools/static-to-astro/output/storage/gosaki/storage-db-update-backup.json \
 *     --apply
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDbUpdateResultManifest,
  formatStorageDbUpdateReport,
  runStorageDbUpdate,
} from "./lib/storage-db-update-executor.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/apply-storage-db-updates.mjs [options]

Apply staging DB updates from storage-db-update-plan.json (G-4c / G-4g).
Default is dry-run. Storage upload is never performed.

Options:
  --plan PATH       storage-db-update-plan.json or schedule-db-update-plan.json (required)
  --site-slug SLUG  Site slug (required)
  --table NAME      discography (G-4c) or schedules (G-4g home_image_url only)
  --report PATH     STORAGE_DB_UPDATE_REPORT.md output (required)
  --manifest PATH   storage-db-update-result.json output (required)
  --backup PATH     Pre-update backup JSON (required for --apply)
  --env-file PATH   .env.local path (default: tools/static-to-astro/.env.local)
  --apply           Perform DB update (staging only)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    plan: null,
    siteSlug: null,
    table: "discography",
    report: null,
    manifest: null,
    backup: null,
    envFile: null,
    apply: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--plan") {
      opts.plan = argv[++i];
      continue;
    }
    if (arg === "--site-slug") {
      opts.siteSlug = argv[++i];
      continue;
    }
    if (arg === "--table") {
      opts.table = argv[++i];
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
    if (arg === "--backup") {
      opts.backup = argv[++i];
      continue;
    }
    if (arg === "--env-file") {
      opts.envFile = argv[++i];
      continue;
    }
    if (arg === "--apply") {
      opts.apply = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

function printSummary(result) {
  const phase = result.phase ?? (result.table === "schedules" ? "G-4g" : "G-4c");
  console.log("");
  console.log(`=== Storage DB Update Summary (${phase}) ===`);
  console.log(`mode: ${result.mode}`);
  console.log(`table: ${result.table ?? "discography"}`);
  console.log(`stagingHost: ${result.stagingHost ?? "(unknown)"}`);
  console.log(`planned: ${result.summary.planned}`);
  console.log(`updated: ${result.summary.updated}`);
  console.log(`verified: ${result.summary.verified}`);
  console.log(`failed: ${result.summary.failed}`);
  console.log(`db update performed: ${result.dbUpdatePerformed ? "yes" : "no"}`);
  console.log(`storage upload performed: no`);
  console.log(`schedules table touched: ${result.schedulesTableTouched ? "yes" : "no"}`);
  console.log(`image_url column touched: ${result.imageUrlColumnTouched ? "yes" : "no"}`);
  console.log(`secret leak: none`);
}

async function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  if (!opts.plan || !opts.siteSlug || !opts.report || !opts.manifest) {
    printHelp();
    process.exit(1);
  }

  if (opts.apply && !opts.backup) {
    console.error("--backup is required when using --apply");
    process.exit(1);
  }

  if (opts.table !== "discography" && opts.table !== "schedules") {
    console.error("Supported --table values: discography (G-4c), schedules (G-4g)");
    process.exit(1);
  }

  const planPath = path.resolve(REPO_ROOT, opts.plan);
  const reportPath = path.resolve(REPO_ROOT, opts.report);
  const manifestPath = path.resolve(REPO_ROOT, opts.manifest);
  const backupPath = opts.backup ? path.resolve(REPO_ROOT, opts.backup) : null;
  const envFile = opts.envFile ? path.resolve(REPO_ROOT, opts.envFile) : null;

  if (!fs.existsSync(planPath)) {
    console.error(`Plan not found: ${planPath}`);
    process.exit(1);
  }

  const phase = opts.table === "schedules" ? "G-4g" : "G-4c";
  console.log(`Storage DB update (${phase})`);
  console.log(`Plan: ${opts.plan}`);
  console.log(`Site: ${opts.siteSlug}`);
  console.log(`Table: ${opts.table}`);
  console.log(`Apply: ${opts.apply ? "yes" : "no (dry-run)"}`);
  console.log("");

  const result = await runStorageDbUpdate({
    planPath,
    siteSlug: opts.siteSlug,
    table: opts.table,
    apply: opts.apply,
    envFile,
    backupPath,
  });

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });

  fs.writeFileSync(manifestPath, `${JSON.stringify(buildDbUpdateResultManifest(result), null, 2)}\n`, "utf8");
  fs.writeFileSync(
    reportPath,
    formatStorageDbUpdateReport(result, {
      reportPath: opts.report,
      manifestPath: opts.manifest,
      backupPath: opts.backup,
    }),
    "utf8",
  );

  printSummary(result);
  console.log("");
  console.log(`Report: ${opts.report}`);
  console.log(`Manifest: ${opts.manifest}`);
  if (opts.backup && result.backup) {
    console.log(`Backup: ${opts.backup}`);
  }

  if (result.summary.failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
