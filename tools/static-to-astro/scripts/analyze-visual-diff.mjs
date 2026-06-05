#!/usr/bin/env node
/**
 * Analyze VISUAL_DIFF_REPORT.md and write VISUAL_DIFF_ANALYSIS.md
 *
 * Usage:
 *   node scripts/analyze-visual-diff.mjs \
 *     --out-dir tools/static-to-astro/output/visual-diff/gosaki \
 *     --astro-dir tools/static-to-astro/output/generated-astro \
 *     --intentional-diffs tools/static-to-astro/config/intentional-diffs.gosaki.json
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeVisualDiffAnalysis } from "./lib/visual-diff-analysis.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printHelp() {
  console.log(`Usage: node scripts/analyze-visual-diff.mjs [options]

Options:
  --out-dir PATH              Visual diff output (contains VISUAL_DIFF_REPORT.md)
  --astro-dir PATH            Generated Astro project (for CONVERSION_REPORT hints)
  --intentional-diffs PATH    JSON config for known intentional visual differences
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = { outDir: null, astroDir: null, intentionalDiffs: null, help: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--out-dir") {
      opts.outDir = argv[++i];
      continue;
    }
    if (arg === "--astro-dir") {
      opts.astroDir = argv[++i];
      continue;
    }
    if (arg === "--intentional-diffs") {
      opts.intentionalDiffs = argv[++i];
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    printHelp();
    process.exit(0);
  }
  if (!opts.outDir) {
    printHelp();
    process.exit(1);
  }

  const outAbs = path.resolve(process.cwd(), opts.outDir);
  const astroAbs = opts.astroDir ? path.resolve(process.cwd(), opts.astroDir) : null;
  const reportPath = path.join(outAbs, "VISUAL_DIFF_REPORT.md");

  console.log("static-to-astro analyze-visual-diff (Phase 2-J)");
  console.log(`  Out:   ${outAbs}`);
  if (astroAbs) console.log(`  Astro: ${astroAbs}`);
  if (opts.intentionalDiffs) {
    console.log(`  Intentional diffs: ${path.resolve(process.cwd(), opts.intentionalDiffs)}`);
  }
  console.log("");

  try {
    const result = writeVisualDiffAnalysis({
      outDir: outAbs,
      astroDir: astroAbs,
      reportPath,
      intentionalDiffsPath: opts.intentionalDiffs
        ? path.resolve(process.cwd(), opts.intentionalDiffs)
        : null,
    });

    console.log(`  Analysis: ${result.analysisPath}`);
    const c = result.counts;
    console.log(
      `  Priority: High ${c.High ?? 0} / Medium ${c.Medium ?? 0} / Low ${c.Low ?? 0} / Known intentional ${c["Known intentional difference"] ?? 0}`,
    );
    if (result.intentionalSummary) {
      const s = result.intentionalSummary;
      console.log(`  True High: ${s.trueHigh} | Excluded from High: ${s.excludedFromHigh}`);
    }
    if (result.large.length) {
      console.log("  Large diff:");
      for (const a of result.large) {
        console.log(`    - ${a.route} ${a.viewport} ${a.mismatchPercent.toFixed(2)}%`);
      }
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
