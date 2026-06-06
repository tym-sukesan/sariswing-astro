#!/usr/bin/env node
/**
 * Generate Auth / RLS SQL draft for staging CMS tables (Phase 3-M).
 * No Supabase connection — SQL files only.
 *
 * Usage:
 *   node scripts/generate-rls-draft.mjs \
 *     --out-dir tools/static-to-astro/output/rls/gosaki
 */

import path from "node:path";
import { runRlsDraftPipeline, scanDangerousSql } from "./lib/rls-draft-generator.mjs";

function printHelp() {
  console.log(`Usage: node scripts/generate-rls-draft.mjs [options]

Generate rls-draft.sql, rls-verify.sql, and RLS_IMPLEMENTATION_REPORT.md.
Does not connect to Supabase or apply SQL.

Options:
  --out-dir PATH    Output directory (required)
  --astro-dir PATH  Append summary to CONVERSION_REPORT.md (optional)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    outDir: null,
    astroDir: null,
    help: false,
  };

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

  if (!opts.outDir) {
    printHelp();
    process.exit(1);
  }

  const outAbs = path.resolve(process.cwd(), opts.outDir);
  const astroAbs = opts.astroDir
    ? path.resolve(process.cwd(), opts.astroDir)
    : path.resolve(outAbs, "../../generated-astro");

  console.log("static-to-astro generate-rls-draft (Phase 3-M)");
  console.log(`  Out:   ${outAbs}`);
  console.log(`  Astro: ${astroAbs}`);
  console.log("  Mode:  SQL generation only (no Supabase connection)");
  console.log("");

  const result = runRlsDraftPipeline({ outDir: outAbs, astroDir: astroAbs });

  console.log("Generated:");
  console.log(`  ${result.draftPath}`);
  console.log(`  ${result.verifyPath}`);
  console.log(`  ${result.reportPath}`);
  console.log("");

  if (result.dangerousScan.ok) {
    console.log("Dangerous SQL scan: OK (no DROP TABLE / TRUNCATE / DELETE FROM)");
  } else {
    console.error(`Dangerous SQL scan: FAILED — ${result.dangerousScan.matches.join(", ")}`);
    process.exit(1);
  }

  console.log("");
  console.log("Next: review docs/phase3-m-auth-rls.md, then apply rls-draft.sql manually in staging SQL Editor.");
}

main();
