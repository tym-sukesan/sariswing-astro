#!/usr/bin/env node
/**
 * Sync Home featured schedule from index.html into schedules.json (Phase 3-C).
 *
 * Usage:
 *   node scripts/sync-home-schedule.mjs \
 *     --input-dir tools/static-to-astro/fixtures/gosaki-static-site \
 *     --schedules tools/static-to-astro/output/generated-astro/src/data/schedules.json \
 *     --astro-dir tools/static-to-astro/output/generated-astro \
 *     --report tools/static-to-astro/output/cms-candidates/gosaki/SCHEDULE_SEED_REPORT.md
 */

import path from "node:path";
import { runHomeScheduleSync } from "./lib/home-schedule-sync.mjs";

function printHelp() {
  console.log(`Usage: node scripts/sync-home-schedule.mjs [options]

Mark Home featured events in schedules.json and wire HomeSchedule.astro.

Options:
  --input-dir PATH    Static site dir with index.html (required)
  --schedules PATH    schedules.json path (required)
  --astro-dir PATH    Generated Astro project (required)
  --report PATH       SCHEDULE_SEED_REPORT.md to append Phase 3-C section
  --year NUMBER       Default year for home dates (default: 2026)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    inputDir: null,
    schedules: null,
    astroDir: null,
    report: null,
    year: 2026,
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
    if (arg === "--schedules") {
      opts.schedules = argv[++i];
      continue;
    }
    if (arg === "--astro-dir") {
      opts.astroDir = argv[++i];
      continue;
    }
    if (arg === "--report") {
      opts.report = argv[++i];
      continue;
    }
    if (arg === "--year") {
      opts.year = Number(argv[++i]);
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

  if (!opts.inputDir || !opts.schedules || !opts.astroDir || !opts.report) {
    printHelp();
    process.exit(1);
  }

  console.log("static-to-astro sync-home-schedule (Phase 3-C)");
  console.log(`  Input:     ${path.resolve(process.cwd(), opts.inputDir)}`);
  console.log(`  Schedules: ${path.resolve(process.cwd(), opts.schedules)}`);
  console.log(`  Astro:     ${path.resolve(process.cwd(), opts.astroDir)}`);
  console.log("");

  try {
    const result = runHomeScheduleSync({
      inputDir: path.resolve(process.cwd(), opts.inputDir),
      schedulesPath: path.resolve(process.cwd(), opts.schedules),
      astroDir: path.resolve(process.cwd(), opts.astroDir),
      reportPath: path.resolve(process.cwd(), opts.report),
      defaultYear: opts.year,
    });

    console.log(`  Region detected: ${result.regionDetected}`);
    console.log(`  Home cards: ${result.homeCardCount}`);
    console.log(`  show_on_home: ${result.showOnHomeCount}`);
    console.log(`  Method: ${result.matchingMethod}`);
    console.log(`  IDs: ${result.matchedIds.join(", ")}`);
    console.log(`  Index: ${result.indexReplacement}`);
    console.log("  Reports updated");
  } catch (err) {
    console.error(`Error: ${err.message}`);
    if (process.env.DEBUG) console.error(err);
    process.exit(1);
  }
}

main();
