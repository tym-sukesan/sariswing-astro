#!/usr/bin/env node
/**
 * Extract discography releases from static HTML into JSON seed (Phase 3-D).
 *
 * Usage:
 *   node scripts/extract-discography-seed.mjs \
 *     --input-dir tools/static-to-astro/fixtures/gosaki-static-site \
 *     --out-dir tools/static-to-astro/output/generated-astro/src/data \
 *     --report tools/static-to-astro/output/cms-candidates/gosaki/DISCOGRAPHY_SEED_REPORT.md \
 *     --astro-dir tools/static-to-astro/output/generated-astro
 */

import path from "node:path";
import { runDiscographySeedPipeline } from "./lib/discography-seed-extractor.mjs";

function printHelp() {
  console.log(`Usage: node scripts/extract-discography-seed.mjs [options]

Extract discography.html into discography.json and wire DiscographyList.astro.

Options:
  --input-dir PATH   Static site dir with discography.html (required)
  --out-dir PATH     Output dir for discography.json (required)
  --report PATH      DISCOGRAPHY_SEED_REPORT.md path (required)
  --astro-dir PATH   Generated Astro project (default: parent of out-dir/../..)
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

  console.log("static-to-astro extract-discography-seed (Phase 3-D)");
  console.log(`  Input: ${inputAbs}`);
  console.log(`  Out:   ${outAbs}`);
  console.log(`  Astro: ${astroAbs}`);
  console.log(`  Report: ${reportAbs}`);
  console.log("");

  try {
    const result = runDiscographySeedPipeline({
      inputDir: inputAbs,
      outDir: outAbs,
      reportPath: reportAbs,
      astroDir: astroAbs,
    });

    const s = result.stats;
    console.log(`  discography.json: ${result.jsonPath}`);
    console.log(`  Releases: ${s.total} (${s.trackCount} tracks)`);
    console.log(
      `  Fields: title ${s.withTitle}, date ${s.withReleaseDate}, cover ${s.withCover}`,
    );
    console.log(`  Page: ${result.artifacts.replacement}`);
    console.log("  Reports updated");
  } catch (err) {
    console.error(`Error: ${err.message}`);
    if (process.env.DEBUG) console.error(err);
    process.exit(1);
  }
}

main();
