#!/usr/bin/env node
/**
 * Generate Supabase schema draft + seed JSON from Astro data seeds (Phase 3-E).
 *
 * Usage:
 *   node scripts/generate-supabase-seed.mjs \
 *     --data-dir tools/static-to-astro/output/generated-astro/src/data \
 *     --out-dir tools/static-to-astro/output/supabase-seed/gosaki \
 *     --report tools/static-to-astro/output/supabase-seed/gosaki/SUPABASE_SEED_REPORT.md
 */

import fs from "node:fs";
import path from "node:path";
import { runSupabaseSeedPipeline } from "./lib/supabase-seed-generator.mjs";

function printHelp() {
  console.log(`Usage: node scripts/generate-supabase-seed.mjs [options]

Generate schema-draft.sql and Supabase-ready seed JSON (no DB connection).

Options:
  --data-dir PATH   Directory with schedules.json, schedule-months.json, discography.json
  --out-dir PATH    Output directory (required)
  --report PATH     SUPABASE_SEED_REPORT.md path (required)
  --astro-dir PATH  Append summary to CONVERSION_REPORT.md (optional)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    dataDir: null,
    outDir: null,
    report: null,
    astroDir: null,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
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

  if (!opts.dataDir || !opts.outDir || !opts.report) {
    printHelp();
    process.exit(1);
  }

  const dataAbs = path.resolve(process.cwd(), opts.dataDir);
  const outAbs = path.resolve(process.cwd(), opts.outDir);
  const reportAbs = path.resolve(process.cwd(), opts.report);
  const astroAbs = opts.astroDir
    ? path.resolve(process.cwd(), opts.astroDir)
    : path.resolve(outAbs, "../../generated-astro");

  console.log("static-to-astro generate-supabase-seed (Phase 3-E)");
  console.log(`  Data:   ${dataAbs}`);
  console.log(`  Out:    ${outAbs}`);
  console.log(`  Report: ${reportAbs}`);
  console.log("");

  try {
    const result = runSupabaseSeedPipeline({
      dataDir: dataAbs,
      outDir: outAbs,
      reportPath: reportAbs,
      astroDir: astroAbs,
    });

    const c = result.counts;
    console.log("  Generated:");
    for (const f of result.outputs) {
      console.log(`    - ${f}`);
    }
    console.log(`  Report: ${result.reportPath}`);
    console.log(
      `  Counts: schedules ${c.schedules}, months ${c.scheduleMonths}, discography ${c.discography}, tracks ${c.discographyTracks}`,
    );
    if (result.missingDates.length) {
      console.log(`  Warning: ${result.missingDates.length} schedules missing event_date`);
    }
    console.log(`  Storage URLs to migrate: ${result.storageUrls.length}`);
    console.log("  Production Supabase: not connected");
    const conversionPath = path.join(astroAbs, "CONVERSION_REPORT.md");
    if (opts.astroDir && fs.existsSync(conversionPath)) {
      console.log("  CONVERSION_REPORT.md updated");
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    if (process.env.DEBUG) console.error(err);
    process.exit(1);
  }
}

main();
