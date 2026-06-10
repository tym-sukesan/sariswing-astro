#!/usr/bin/env node
/**
 * Review generated admin scaffold in sandbox output (G-5w-d read-only).
 *
 * Usage:
 *   node tools/static-to-astro/scripts/review-generated-admin-scaffold.mjs \
 *     --target-dir tools/static-to-astro/output/admin-writer-sandbox/gosaki \
 *     --out-dir tools/static-to-astro/output/admin-scaffold-reviews/gosaki
 */

import {
  reviewGeneratedAdminScaffold,
  writeGeneratedAdminScaffoldReview,
} from "./lib/generated-admin-scaffold-reviewer.mjs";

function printHelp() {
  console.log(`Usage: node scripts/review-generated-admin-scaffold.mjs [options]

Read-only review of sandbox-generated admin scaffold (G-5w-d).
Writes review report to out-dir only. Does not modify sandbox or runtime admin.

Options:
  --target-dir PATH   Sandbox scaffold directory (required)
  --out-dir PATH      Review output (default: output/admin-scaffold-reviews/{siteSlug})
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    targetDir: null,
    outDir: null,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--target-dir") {
      opts.targetDir = argv[++i];
      continue;
    }
    if (arg === "--out-dir") {
      opts.outDir = argv[++i];
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  if (!opts.targetDir) {
    console.error("Error: --target-dir is required");
    printHelp();
    process.exit(1);
  }

  console.log("Generated admin scaffold review (G-5w-d read-only)");
  console.log("No runtime connection. No src/pages/admin. Review report only.");

  const result = reviewGeneratedAdminScaffold({
    targetDir: opts.targetDir,
    outDir: opts.outDir,
  });

  const outAbs = writeGeneratedAdminScaffoldReview(result);

  console.log("");
  console.log("=== Generated Admin Scaffold Review (G-5w-d) ===");
  console.log(`target: ${result.targetRel}`);
  console.log(`report: ${result.outRel}/`);
  console.log(`readyForG5x: ${result.readyForG5x}`);
  console.log(`blockers: ${result.blockers.length}`);
  console.log(`warnings: ${result.warnings.length}`);
  console.log("");
  console.log(`Wrote review to: ${outAbs}`);

  if (!result.readyForG5x) {
    for (const b of result.blockers.slice(0, 5)) {
      console.error(`Blocker: ${b}`);
    }
    process.exit(1);
  }

  process.exit(0);
}

main();
