#!/usr/bin/env node
/**
 * G-9b — Extract Gosaki schedule events from Wix live-crawl HTML (dry-run default).
 *
 * Usage:
 *   node scripts/extract-gosaki-schedule-seed.mjs \
 *     --input-dir fixtures/gosaki-piano
 *
 *   node scripts/extract-gosaki-schedule-seed.mjs \
 *     --input-dir fixtures/gosaki-piano \
 *     --write --out-dir output/gosaki-schedule-seed
 */

import path from "node:path";
import {
  extractAllGosakiScheduleSeeds,
  writeGosakiScheduleSeedJson,
} from "./lib/gosaki-wix-schedule-extractor.mjs";

function printHelp() {
  console.log(`Usage: node scripts/extract-gosaki-schedule-seed.mjs [options]

Extract YYYY-MM.html (Wix repeater) into Gosaki schedule seed JSON.
Default: dry-run (stats only, no file writes).

Options:
  --input-dir PATH   Live crawl fixture directory (default: fixtures/gosaki-piano)
  --out-dir PATH     Output directory for schedules.json + schedule-months.json
  --write            Write JSON files (requires --out-dir)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    inputDir: "fixtures/gosaki-piano",
    outDir: null,
    write: false,
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
    if (arg === "--write") {
      opts.write = true;
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

  if (opts.write && !opts.outDir) {
    console.error("Error: --write requires --out-dir");
    process.exit(1);
  }

  const inputAbs = path.resolve(process.cwd(), opts.inputDir);
  console.log("static-to-astro extract-gosaki-schedule-seed (G-9b)");
  console.log(`  Input: ${inputAbs}`);
  console.log(`  Mode:  ${opts.write ? "write" : "dry-run"}`);
  console.log("");

  try {
    const result = extractAllGosakiScheduleSeeds(inputAbs);
    const s = result.extractionStats;

    console.log(`  site_slug: ${result.site_slug}`);
    console.log(`  Months: ${result.months.length}`);
    console.log(`  Events: ${s.totalEvents}`);
    console.log(
      `  Fields: date ${s.withDate}, title ${s.withTitle}, venue ${s.withVenue}, open ${s.withOpenTime}, start ${s.withStartTime}, price ${s.withPrice}, image ${s.withImage}`,
    );
    console.log(`  Warnings: ${result.warnings.length}`);
    console.log("");
    console.log("  Per-month counts:");
    for (const m of result.months) {
      console.log(`    ${m.month}: ${m.count} (${m.source_file})`);
    }

    if (opts.write) {
      const outAbs = path.resolve(process.cwd(), opts.outDir);
      const { schedulesPath, monthsPath } = writeGosakiScheduleSeedJson(result, outAbs);
      console.log("");
      console.log(`  schedules.json: ${schedulesPath}`);
      console.log(`  schedule-months.json: ${monthsPath}`);
    } else {
      console.log("");
      console.log("  (dry-run — no files written; pass --write --out-dir to emit JSON)");
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    if (process.env.DEBUG) console.error(err);
    process.exit(1);
  }
}

main();
