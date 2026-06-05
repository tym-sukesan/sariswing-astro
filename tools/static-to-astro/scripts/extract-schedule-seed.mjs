#!/usr/bin/env node
/**
 * Extract schedule events from static HTML into JSON seed files.
 *
 * Usage:
 *   node scripts/extract-schedule-seed.mjs \
 *     --input-dir tools/static-to-astro/fixtures/gosaki-static-site \
 *     --out-dir tools/static-to-astro/output/generated-astro/src/data \
 *     --report tools/static-to-astro/output/cms-candidates/gosaki/SCHEDULE_SEED_REPORT.md
 */

import path from "node:path";
import { runScheduleSeedPipeline } from "./lib/schedule-seed-extractor.mjs";

function printHelp() {
  console.log(`Usage: node scripts/extract-schedule-seed.mjs [options]

Extract schedule-YYYY-MM.html into JSON seed and wire generated Astro pages.

Options:
  --input-dir PATH   Static HTML fixture (required)
  --out-dir PATH     Output directory for schedules.json + schedule-months.json (required)
  --report PATH      SCHEDULE_SEED_REPORT.md path (required)
  --astro-dir PATH   Generated Astro project root (default: parent of out-dir/../..)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    inputDir: null,
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
    if (arg === "--input-dir") {
      opts.inputDir = argv[++i];
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

  if (!opts.inputDir || !opts.outDir || !opts.report) {
    printHelp();
    process.exit(1);
  }

  const inputAbs = path.resolve(process.cwd(), opts.inputDir);
  const outAbs = path.resolve(process.cwd(), opts.outDir);
  const reportAbs = path.resolve(process.cwd(), opts.report);
  const astroAbs = opts.astroDir
    ? path.resolve(process.cwd(), opts.astroDir)
    : path.resolve(outAbs, "../..");

  console.log("static-to-astro extract-schedule-seed (Phase 3-B)");
  console.log(`  Input: ${inputAbs}`);
  console.log(`  Out:   ${outAbs}`);
  console.log(`  Astro: ${astroAbs}`);
  console.log(`  Report: ${reportAbs}`);
  console.log("");

  try {
    const result = runScheduleSeedPipeline({
      inputDir: inputAbs,
      outDir: outAbs,
      reportPath: reportAbs,
      astroDir: astroAbs,
    });

    const s = result.extractionStats;
    console.log(`  schedules.json: ${result.schedulesPath}`);
    console.log(`  schedule-months.json: ${result.monthsPath}`);
    console.log(`  Events: ${s.totalEvents} across ${result.months.length} months`);
    console.log(
      `  Fields: date ${s.withDate}, venue ${s.withVenue}, image ${s.withImage}`,
    );
    console.log(`  Data-driven: ${result.dataDrivenPages.join(", ")}`);
    console.log(`  Report: ${result.reportPath}`);
    console.log("  CONVERSION_REPORT.md updated");
  } catch (err) {
    console.error(`Error: ${err.message}`);
    if (process.env.DEBUG) console.error(err);
    process.exit(1);
  }
}

main();
