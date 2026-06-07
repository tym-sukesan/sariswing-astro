#!/usr/bin/env node
/**
 * Plan Supabase Storage asset migration from seed/data JSON (Phase 3-U dry-run).
 *
 * Usage:
 *   node tools/static-to-astro/scripts/plan-storage-assets.mjs \
 *     --seed-dir tools/static-to-astro/output/supabase-seed/gosaki \
 *     --site-slug gosaki \
 *     --report tools/static-to-astro/output/storage/gosaki/STORAGE_ASSET_PLAN_REPORT.md \
 *     --manifest tools/static-to-astro/output/storage/gosaki/storage-asset-plan.json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildManifestJson,
  buildStorageAssetPlan,
  DEFAULT_BUCKET,
  formatStorageAssetPlanReport,
} from "./lib/storage-asset-planner.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/plan-storage-assets.mjs [options]

Generate Storage migration plan from seed/data JSON (dry-run, no upload).

Options:
  --seed-dir PATH     Supabase seed directory (required)
  --data-dir PATH     Astro src/data fallback (optional)
  --site-slug SLUG    Site slug for target paths (required)
  --bucket NAME       Storage bucket (default: site-assets)
  --report PATH       STORAGE_ASSET_PLAN_REPORT.md output (required)
  --manifest PATH     storage-asset-plan.json output (required)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    seedDir: null,
    dataDir: null,
    siteSlug: null,
    bucket: DEFAULT_BUCKET,
    report: null,
    manifest: null,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--seed-dir") {
      opts.seedDir = argv[++i];
      continue;
    }
    if (arg === "--data-dir") {
      opts.dataDir = argv[++i];
      continue;
    }
    if (arg === "--site-slug") {
      opts.siteSlug = argv[++i];
      continue;
    }
    if (arg === "--bucket") {
      opts.bucket = argv[++i];
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
    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

function printSummary(plan) {
  console.log("");
  console.log("=== Storage Asset Plan Summary ===");
  console.log(`mode: ${plan.mode}`);
  console.log(`siteSlug: ${plan.siteSlug}`);
  console.log(`bucket: ${plan.bucket}`);
  console.log(`total rows: ${plan.summary.total}`);
  console.log(`supabase (keep): ${plan.summary.supabase}`);
  console.log(`wix (review-required): ${plan.summary.wix}`);
  console.log(`external (review-required): ${plan.summary.external}`);
  console.log(`local (upload candidate): ${plan.summary.local}`);
  console.log(`empty (skip): ${plan.summary.empty}`);
  console.log(`review-required: ${plan.summary.reviewRequired}`);
  console.log(`keep: ${plan.summary.keep}`);
  console.log(`download-and-upload: ${plan.summary.downloadAndUpload}`);
  console.log(`uploads performed: no`);
  console.log(`secret leak: none (URLs only, no credentials in manifest)`);
}

function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  if (!opts.seedDir || !opts.siteSlug || !opts.report || !opts.manifest) {
    printHelp();
    process.exit(1);
  }

  const seedDir = path.resolve(REPO_ROOT, opts.seedDir);
  const dataDir = opts.dataDir ? path.resolve(REPO_ROOT, opts.dataDir) : null;
  const reportPath = path.resolve(REPO_ROOT, opts.report);
  const manifestPath = path.resolve(REPO_ROOT, opts.manifest);

  if (!fs.existsSync(seedDir)) {
    console.error(`seed-dir not found: ${seedDir}`);
    process.exit(1);
  }

  console.log("Storage asset plan (Phase 3-U dry-run)");
  console.log(`Seed: ${opts.seedDir}`);
  console.log(`Site: ${opts.siteSlug}`);
  console.log("");

  const plan = buildStorageAssetPlan({
    siteSlug: opts.siteSlug,
    bucket: opts.bucket,
    seedDir,
    dataDir,
  });

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });

  fs.writeFileSync(manifestPath, `${JSON.stringify(buildManifestJson(plan), null, 2)}\n`, "utf8");
  fs.writeFileSync(
    reportPath,
    formatStorageAssetPlanReport(plan, {
      reportPath: opts.report,
      manifestPath: opts.manifest,
      seedDir: opts.seedDir,
      dataDir: opts.dataDir,
    }),
    "utf8",
  );

  printSummary(plan);
  console.log("");
  console.log(`Report: ${opts.report}`);
  console.log(`Manifest: ${opts.manifest}`);
}

main();
