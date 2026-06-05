#!/usr/bin/env node
/**
 * Prepare Storage migration manifest from image URLs in seed/data JSON (Phase 3-F).
 *
 * Usage:
 *   node scripts/prepare-storage-assets.mjs \
 *     --seed-dir tools/static-to-astro/output/supabase-seed/gosaki \
 *     --data-dir tools/static-to-astro/output/generated-astro/src/data \
 *     --out-dir tools/static-to-astro/output/storage-assets/gosaki \
 *     --report tools/static-to-astro/output/storage-assets/gosaki/STORAGE_ASSETS_REPORT.md
 *
 * Optional download (explicit):
 *   ... --download
 */

import fs from "node:fs";
import path from "node:path";
import { runStorageAssetsPipeline } from "./lib/storage-assets-preparer.mjs";

function printHelp() {
  console.log(`Usage: node scripts/prepare-storage-assets.mjs [options]

Classify image URLs and generate Storage migration manifest (no Supabase upload).

Options:
  --seed-dir PATH    Supabase seed directory (seed-schedules.json, etc.)
  --data-dir PATH    Astro src/data directory (schedules.json, discography.json)
  --out-dir PATH     Output directory (required)
  --report PATH      STORAGE_ASSETS_REPORT.md path (required)
  --astro-dir PATH   Append summary to CONVERSION_REPORT.md (optional)
  --download         Download unique URLs to out-dir/downloads/ (optional)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    seedDir: null,
    dataDir: null,
    outDir: null,
    report: null,
    astroDir: null,
    download: false,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--download") {
      opts.download = true;
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
    if (arg === "--out-dir") {
      opts.outDir = argv[++i];
      continue;
    }
    if (arg === "--report") {
      opts.report = argv[++i];
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

async function main() {
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

  if (!opts.seedDir || !opts.dataDir || !opts.outDir || !opts.report) {
    printHelp();
    process.exit(1);
  }

  const seedAbs = path.resolve(process.cwd(), opts.seedDir);
  const dataAbs = path.resolve(process.cwd(), opts.dataDir);
  const outAbs = path.resolve(process.cwd(), opts.outDir);
  const reportAbs = path.resolve(process.cwd(), opts.report);
  const astroAbs = opts.astroDir
    ? path.resolve(process.cwd(), opts.astroDir)
    : path.resolve(outAbs, "../generated-astro");

  console.log("static-to-astro prepare-storage-assets (Phase 3-F)");
  console.log(`  Data: ${dataAbs}`);
  console.log(`  Seed: ${seedAbs}`);
  console.log(`  Out:  ${outAbs}`);
  console.log(`  Download: ${opts.download ? "yes" : "no"}`);
  console.log("");

  try {
    const result = await runStorageAssetsPipeline({
      dataDir: dataAbs,
      seedDir: seedAbs,
      outDir: outAbs,
      reportPath: reportAbs,
      astroDir: astroAbs,
      download: opts.download,
    });

    const s = result.summary;
    console.log(`  Manifest: ${result.manifestPath}`);
    console.log(`  Rewrite plan: ${result.rewritePath}`);
    console.log(`  Report: ${result.reportPath}`);
    console.log(`  Field entries: ${result.entries.length} | With URL: ${s.withUrl}`);
    console.log(
      `  Classification: wix ${s.counts.wix_url} | external ${s.counts.external_url} | local ${s.counts.local_path} | null ${s.counts.null}`,
    );
    console.log(`  Migration candidates: ${s.migrationCandidates.length}`);
    console.log(`  Unique URLs: ${s.uniqueUrls}`);
    if (opts.download) {
      console.log(
        `  Download: success ${result.downloadResult.success}, failed ${result.downloadResult.failed}`,
      );
    }
    console.log("  Production Storage: not uploaded");
    if (fs.existsSync(path.join(astroAbs, "CONVERSION_REPORT.md"))) {
      console.log("  CONVERSION_REPORT.md updated");
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    if (process.env.DEBUG) console.error(err);
    process.exit(1);
  }
}

main();
