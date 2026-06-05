#!/usr/bin/env node
/**
 * Append Phase 2-I manual review + re-diff comparison to VISUAL_DIFF_ANALYSIS.md
 */

import path from "node:path";
import { parseVisualDiffReport } from "./lib/visual-diff-analysis.mjs";
import { assignPriority, analyzeVisualDiffEntries, parseConversionHints } from "./lib/visual-diff-analysis.mjs";
import {
  appendPhase2ISection,
  appendPhase2IToConversionReport,
  buildRediffSummary,
  GOSAKI_HIGH_REVIEW_BASELINE,
} from "./lib/visual-diff-phase2i.mjs";

function parseArgs(argv) {
  const opts = { outDir: null, astroDir: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--out-dir") opts.outDir = argv[++i];
    else if (argv[i] === "--astro-dir") opts.astroDir = argv[++i];
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv);
  if (!opts.outDir) {
    console.error("Usage: --out-dir tools/static-to-astro/output/visual-diff/gosaki [--astro-dir ...]");
    process.exit(1);
  }

  const outAbs = path.resolve(process.cwd(), opts.outDir);
  const astroAbs = opts.astroDir ? path.resolve(process.cwd(), opts.astroDir) : null;
  const reportPath = path.join(outAbs, "VISUAL_DIFF_REPORT.md");
  const analysisPath = path.join(outAbs, "VISUAL_DIFF_ANALYSIS.md");

  const { executedAt, entries } = parseVisualDiffReport(reportPath);
  const hints = parseConversionHints(astroAbs ? path.join(astroAbs, "CONVERSION_REPORT.md") : null);
  const analyzed = analyzeVisualDiffEntries(entries, hints);

  const beforeByKey = new Map(
    GOSAKI_HIGH_REVIEW_BASELINE.map((r) => [`${r.route}|${r.viewport}`, { mismatchPercent: r.mismatchBefore }]),
  );

  const rediff = buildRediffSummary(beforeByKey, analyzed);
  rediff.executedAt = executedAt;

  appendPhase2ISection(analysisPath, { rediff });

  if (astroAbs) {
    appendPhase2IToConversionReport(astroAbs, {
      analysisRel: path.relative(astroAbs, analysisPath),
      rediff,
    });
  }

  console.log("Phase 2-I review appended.");
  console.log(`  Remaining High: ${rediff.remainingHigh.length}`);
  for (const r of rediff.entries) {
    if (r.mismatchBefore != null && r.mismatchAfter != null) {
      console.log(
        `  ${r.route} ${r.viewport}: ${r.mismatchBefore}% → ${r.mismatchAfter.toFixed(2)}% (${r.priorityAfter})`,
      );
    }
  }
}

main();
