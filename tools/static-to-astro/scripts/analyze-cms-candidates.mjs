#!/usr/bin/env node
/**
 * CMS candidate extraction from static HTML (and optional generated Astro).
 *
 * Usage:
 *   node scripts/analyze-cms-candidates.mjs \
 *     --input-dir tools/static-to-astro/fixtures/gosaki-static-site \
 *     --astro-dir tools/static-to-astro/output/generated-astro \
 *     --out tools/static-to-astro/output/cms-candidates/gosaki/CMS_CANDIDATES_REPORT.md
 */

import path from "node:path";
import { analyzeCmsCandidates, writeCmsCandidatesReport } from "./lib/cms-candidates-analyzer.mjs";

function printHelp() {
  console.log(`Usage: node scripts/analyze-cms-candidates.mjs [options]

Extract CMS migration candidates from static HTML (optional Astro cross-check).

Options:
  --input-dir PATH   Static HTML fixture directory (required)
  --astro-dir PATH   Generated Astro project (optional)
  --out PATH         Output report path (required)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = { inputDir: null, astroDir: null, out: null, help: false };
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
    if (arg === "--astro-dir") {
      opts.astroDir = argv[++i];
      continue;
    }
    if (arg === "--out") {
      opts.out = argv[++i];
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

  if (!opts.inputDir || !opts.out) {
    printHelp();
    process.exit(1);
  }

  const inputAbs = path.resolve(process.cwd(), opts.inputDir);
  const outAbs = path.resolve(process.cwd(), opts.out);
  const astroAbs = opts.astroDir ? path.resolve(process.cwd(), opts.astroDir) : null;

  console.log("static-to-astro analyze-cms-candidates (Phase 3-A)");
  console.log(`  Input: ${inputAbs}`);
  if (astroAbs) console.log(`  Astro: ${astroAbs}`);
  console.log(`  Out:   ${outAbs}`);
  console.log("");

  try {
    const analysis = analyzeCmsCandidates({ inputDir: inputAbs, astroDir: astroAbs });
    const result = writeCmsCandidatesReport({
      analysis,
      outPath: outAbs,
      astroDirForConversion: astroAbs,
    });

    const c = result.analysis.priorityCounts;
    console.log(`  Report: ${result.reportPath}`);
    console.log(`  Pages: ${result.analysis.pages.length}`);
    console.log(
      `  Candidates: ${result.analysis.candidates.length} raw / ${result.analysis.dedupedCandidates.length} deduped`,
    );
    console.log(`  Priority: High ${c.High} / Medium ${c.Medium} / Low ${c.Low} / Manual ${c.Manual}`);
    if (result.analysis.topHigh.length) {
      console.log("  Top High:");
      for (const item of result.analysis.topHigh.slice(0, 8)) {
        console.log(`    - ${item.route} ${item.label}`);
      }
    }
    if (astroAbs) {
      console.log("  CONVERSION_REPORT.md updated with CMS summary");
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    if (process.env.DEBUG) console.error(err);
    process.exit(1);
  }
}

main();
