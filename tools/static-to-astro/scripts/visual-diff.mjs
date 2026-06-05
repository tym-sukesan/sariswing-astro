#!/usr/bin/env node
/**
 * Visual diff: static HTML source vs generated Astro (dist).
 *
 * Usage:
 *   node scripts/visual-diff.mjs \
 *     --source-dir tools/static-to-astro/fixtures/gosaki-static-site \
 *     --astro-dir tools/static-to-astro/output/generated-astro \
 *     --out-dir tools/static-to-astro/output/visual-diff/gosaki \
 *     --routes /,/about/,/schedule/,/schedule-2026-07/,/contact/ \
 *     --intentional-diffs tools/static-to-astro/config/intentional-diffs.gosaki.json
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { runVisualDiff } from "./lib/visual-diff-runner.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

function printHelp() {
  console.log(`Usage: node scripts/visual-diff.mjs [options]

Compare screenshots of source static HTML vs generated Astro (dist/).

Options:
  --source-dir PATH   Flat static HTML fixture (required)
  --astro-dir PATH    Generated Astro project with dist/ (required)
  --out-dir PATH      Output for screenshots + VISUAL_DIFF_REPORT.md (required)
  --routes LIST       Comma-separated routes (default: discover from source + /schedule/)
  --intentional-diffs PATH  JSON config for known intentional visual differences
  --no-diff           Skip pixelmatch diff images (screenshots only)
  --help, -h          Show help

Example:
  node scripts/visual-diff.mjs \\
    --source-dir fixtures/gosaki-static-site \\
    --astro-dir output/generated-astro \\
    --out-dir output/visual-diff/gosaki \\
    --routes /,/about/,/schedule/,/schedule-2026-07/,/contact/

Prerequisites:
  cd tools/static-to-astro && npm install && npx playwright install chromium
`);
}

function parseArgs(argv) {
  const opts = {
    sourceDir: null,
    astroDir: null,
    outDir: null,
    routes: [],
    intentionalDiffs: null,
    generateDiff: true,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--source-dir") {
      opts.sourceDir = argv[++i];
      continue;
    }
    if (arg === "--astro-dir") {
      opts.astroDir = argv[++i];
      continue;
    }
    if (arg === "--out-dir") {
      opts.outDir = argv[++i];
      continue;
    }
    if (arg === "--routes") {
      const raw = argv[++i] ?? "";
      opts.routes = raw
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean)
        .map((r) => (r.endsWith("/") ? r : `${r}/`));
      continue;
    }
    if (arg === "--no-diff") {
      opts.generateDiff = false;
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

  const { sourceDir, astroDir, outDir, routes, generateDiff, intentionalDiffs } = opts;
  if (!sourceDir || !astroDir || !outDir) {
    printHelp();
    process.exit(1);
  }

  const sourceAbs = path.resolve(process.cwd(), sourceDir);
  const astroAbs = path.resolve(process.cwd(), astroDir);
  const outAbs = path.resolve(process.cwd(), outDir);

  console.log("static-to-astro visual-diff (Phase 2-G)");
  console.log("");
  console.log(`  Source: ${sourceAbs}`);
  console.log(`  Astro:  ${astroAbs}`);
  console.log(`  Out:    ${outAbs}`);
  console.log(`  Routes: ${routes.length ? routes.join(", ") : "(auto-discover)"}`);
  if (intentionalDiffs) {
    console.log(`  Intentional diffs: ${path.resolve(process.cwd(), intentionalDiffs)}`);
  }
  console.log("");

  try {
    const result = await runVisualDiff({
      sourceDir: sourceAbs,
      astroDir: astroAbs,
      outDir: outAbs,
      routes,
      generateDiff,
      intentionalDiffsPath: intentionalDiffs
        ? path.resolve(process.cwd(), intentionalDiffs)
        : null,
    });

    console.log(`  Report: ${result.reportPath}`);
    if (result.analysisPath) {
      console.log(`  Analysis: ${result.analysisPath}`);
      if (result.analysisCounts) {
        const c = result.analysisCounts;
        console.log(
          `  Priority: High ${c.High ?? 0} / Medium ${c.Medium ?? 0} / Low ${c.Low ?? 0} / Known intentional ${c["Known intentional difference"] ?? 0}`,
        );
      }
      if (result.intentionalSummary) {
        const s = result.intentionalSummary;
        console.log(`  True High: ${s.trueHigh} | Excluded from High: ${s.excludedFromHigh}`);
      }
    }
    console.log(`  Diff:   ${result.diffGenerated ? "yes" : "no"}`);
    const errors = result.results.filter((r) => r.status === "error");
    if (errors.length) {
      console.log(`  Errors: ${errors.map((e) => e.route).join(", ")}`);
    }
    console.log("");
    console.log("  Screenshots:");
    for (const row of result.results) {
      for (const vp of row.viewports) {
        const parts = [vp.sourceScreenshot, vp.astroScreenshot, vp.diffScreenshot].filter(Boolean);
        if (parts.length) console.log(`    ${row.route} [${vp.viewport}]: ${parts.join(" ")}`);
      }
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    if (process.env.DEBUG) console.error(err);
    process.exit(1);
  }
}

main();
