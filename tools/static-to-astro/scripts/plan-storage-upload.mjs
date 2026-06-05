#!/usr/bin/env node
/**
 * Dry-run Supabase Storage upload plan from manifest (Phase 3-G).
 * Does NOT upload to production Storage.
 *
 * Usage:
 *   node scripts/plan-storage-upload.mjs \
 *     --manifest tools/static-to-astro/output/storage-assets/gosaki/storage-assets-manifest.json \
 *     --out tools/static-to-astro/output/storage-assets/gosaki/STORAGE_UPLOAD_PLAN.md \
 *     --bucket site-assets \
 *     --public-base-url https://example.supabase.co/storage/v1/object/public/site-assets
 */

import fs from "node:fs";
import path from "node:path";
import {
  planStorageUpload,
  formatStorageUploadPlanReport,
  appendPhase3GUploadToConversionReport,
} from "./lib/storage-upload-planner.mjs";

function printHelp() {
  console.log(`Usage: node scripts/plan-storage-upload.mjs [options]

Dry-run Storage upload plan from storage-assets-manifest.json (no upload).

Options:
  --manifest PATH         storage-assets-manifest.json (required)
  --out PATH              STORAGE_UPLOAD_PLAN.md output path (required)
  --bucket NAME           Target bucket name (default: site-assets)
  --public-base-url URL   Public URL prefix for expected_public_url (required)
  --astro-dir PATH        Append Phase 3-G summary to CONVERSION_REPORT.md (optional)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    manifest: null,
    out: null,
    bucket: "site-assets",
    publicBaseUrl: null,
    astroDir: null,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--manifest") {
      opts.manifest = argv[++i];
      continue;
    }
    if (arg === "--out") {
      opts.out = argv[++i];
      continue;
    }
    if (arg === "--bucket") {
      opts.bucket = argv[++i];
      continue;
    }
    if (arg === "--public-base-url") {
      opts.publicBaseUrl = argv[++i];
      continue;
    }
    if (arg === "--astro-dir") {
      opts.astroDir = argv[++i];
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
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

  if (!opts.manifest || !opts.out || !opts.publicBaseUrl) {
    printHelp();
    process.exit(1);
  }

  const outAbs = path.resolve(process.cwd(), opts.out);
  const astroAbs = opts.astroDir
    ? path.resolve(process.cwd(), opts.astroDir)
    : path.resolve(outAbs, "../../generated-astro");

  console.log("static-to-astro plan-storage-upload (Phase 3-G dry-run)");
  console.log(`  Manifest: ${path.resolve(process.cwd(), opts.manifest)}`);
  console.log(`  Out:      ${outAbs}`);
  console.log(`  Bucket:   ${opts.bucket}`);
  console.log(`  Public:   ${opts.publicBaseUrl}`);
  console.log("");

  try {
    const plan = planStorageUpload({
      manifestPath: opts.manifest,
      bucket: opts.bucket,
      publicBaseUrl: opts.publicBaseUrl,
    });

    const report = formatStorageUploadPlanReport(plan);
    fs.mkdirSync(path.dirname(outAbs), { recursive: true });
    fs.writeFileSync(outAbs, report, "utf8");

    console.log(`  Upload candidates (before dedupe): ${plan.candidateCount}`);
    console.log(`  Unique targets: ${plan.uploadTargetCount}`);
    console.log(`  Local file ready: ${plan.localFileExistsCount}`);
    console.log(`  Local file missing: ${plan.localFileMissingCount}`);
    console.log(`  Report: ${outAbs}`);
    console.log("  Production Storage upload: NOT performed");

    appendPhase3GUploadToConversionReport(astroAbs, {
      uploadPlanRel: path.relative(astroAbs, outAbs).replace(/\\/g, "/"),
      seedRewriteRel: path
        .relative(astroAbs, path.join(path.dirname(outAbs), "SEED_REWRITE_REPORT.md"))
        .replace(/\\/g, "/"),
      uploadTargetCount: plan.uploadTargetCount,
      localFileExistsCount: plan.localFileExistsCount,
    });
    if (opts.astroDir || fs.existsSync(path.join(astroAbs, "CONVERSION_REPORT.md"))) {
      console.log("  CONVERSION_REPORT.md updated (Phase 3-G upload plan section)");
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    if (process.env.DEBUG) console.error(err);
    process.exit(1);
  }
}

main();
