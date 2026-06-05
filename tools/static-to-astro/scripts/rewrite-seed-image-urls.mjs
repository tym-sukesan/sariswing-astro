#!/usr/bin/env node
/**
 * Dry-run or apply seed JSON image URL rewrites (Phase 3-G).
 * Default: dry-run. Use --apply to write seed files (with backup).
 *
 * Usage (dry-run):
 *   node scripts/rewrite-seed-image-urls.mjs \
 *     --seed-dir tools/static-to-astro/output/supabase-seed/gosaki \
 *     --rewrite-plan tools/static-to-astro/output/storage-assets/gosaki/storage-url-rewrite-plan.json \
 *     --public-base-url https://example.supabase.co/storage/v1/object/public/site-assets \
 *     --report tools/static-to-astro/output/storage-assets/gosaki/SEED_REWRITE_REPORT.md
 */

import fs from "node:fs";
import path from "node:path";
import { appendPhase3GUploadToConversionReport } from "./lib/storage-upload-planner.mjs";
import {
  rewriteSeedImageUrls,
  formatSeedRewriteReport,
  appendPhase3GHomeImageToSupabaseSeedReport,
} from "./lib/seed-url-rewriter.mjs";

function printHelp() {
  console.log(`Usage: node scripts/rewrite-seed-image-urls.mjs [options]

Rewrite seed JSON image URLs per storage-url-rewrite-plan.json.
Default is dry-run — seed files are NOT modified unless --apply is passed.

Options:
  --seed-dir PATH           Directory with seed-*.json (required)
  --rewrite-plan PATH       storage-url-rewrite-plan.json (required)
  --public-base-url URL     Public URL prefix (required)
  --report PATH             SEED_REWRITE_REPORT.md output (required)
  --apply                   Apply rewrites and create .bak-* backups
  --astro-dir PATH          Update CONVERSION_REPORT.md (optional)
  --supabase-report PATH    Append home_image_url section to SUPABASE_SEED_REPORT.md (optional)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    seedDir: null,
    rewritePlan: null,
    publicBaseUrl: null,
    report: null,
    apply: false,
    astroDir: null,
    supabaseReport: null,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--seed-dir") {
      opts.seedDir = argv[++i];
      continue;
    }
    if (arg === "--rewrite-plan") {
      opts.rewritePlan = argv[++i];
      continue;
    }
    if (arg === "--public-base-url") {
      opts.publicBaseUrl = argv[++i];
      continue;
    }
    if (arg === "--report") {
      opts.report = argv[++i];
      continue;
    }
    if (arg === "--apply") {
      opts.apply = true;
      continue;
    }
    if (arg === "--astro-dir") {
      opts.astroDir = argv[++i];
      continue;
    }
    if (arg === "--supabase-report") {
      opts.supabaseReport = argv[++i];
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }
  return opts;
}

function countUniqueStoragePaths(rewritePlanPath) {
  const plan = JSON.parse(fs.readFileSync(path.resolve(rewritePlanPath), "utf8"));
  const paths = new Set();
  for (const rows of Object.values(plan)) {
    for (const r of rows) paths.add(r.to_storage_path);
  }
  return paths.size;
}

function countLocalFilesFromManifest(reportPath) {
  const manifestPath = path.join(path.dirname(path.resolve(reportPath)), "storage-assets-manifest.json");
  if (!fs.existsSync(manifestPath)) return null;
  const entries = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const byPath = new Set();
  let withLocal = 0;
  for (const e of entries) {
    if (!e.target_path || !e.source_url) continue;
    if (byPath.has(e.target_path)) continue;
    byPath.add(e.target_path);
    if (e.local_file) {
      const local = path.join(path.dirname(manifestPath), e.local_file);
      if (fs.existsSync(local)) withLocal += 1;
    }
  }
  return withLocal;
}

function countHomeImageUrls(seedDir) {
  const filePath = path.join(path.resolve(seedDir), "seed-schedules.json");
  if (!fs.existsSync(filePath)) return 0;
  const rows = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return rows.filter((r) => r.home_image_url).length;
}

function countScheduleRewrites(rewritePlanPath) {
  const plan = JSON.parse(fs.readFileSync(path.resolve(rewritePlanPath), "utf8"));
  return (plan["seed-schedules.json"] ?? []).length;
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

  if (!opts.seedDir || !opts.rewritePlan || !opts.publicBaseUrl || !opts.report) {
    printHelp();
    process.exit(1);
  }

  const reportAbs = path.resolve(process.cwd(), opts.report);
  const astroAbs = opts.astroDir
    ? path.resolve(process.cwd(), opts.astroDir)
    : path.resolve(reportAbs, "../../generated-astro");
  const supabaseReportAbs =
    opts.supabaseReport ??
    path.resolve(process.cwd(), opts.seedDir, "SUPABASE_SEED_REPORT.md");

  console.log(`static-to-astro rewrite-seed-image-urls (Phase 3-G ${opts.apply ? "apply" : "dry-run"})`);
  console.log(`  Seed:   ${path.resolve(process.cwd(), opts.seedDir)}`);
  console.log(`  Plan:   ${path.resolve(process.cwd(), opts.rewritePlan)}`);
  console.log(`  Public: ${opts.publicBaseUrl}`);
  console.log("");

  try {
    const result = rewriteSeedImageUrls({
      seedDir: opts.seedDir,
      rewritePlanPath: opts.rewritePlan,
      publicBaseUrl: opts.publicBaseUrl,
      apply: opts.apply,
    });

    const report = formatSeedRewriteReport(result);
    fs.mkdirSync(path.dirname(reportAbs), { recursive: true });
    fs.writeFileSync(reportAbs, report, "utf8");

    console.log(`  Mode: ${result.mode}`);
    console.log(`  Change candidates: ${result.candidateCount}`);
    console.log(`  Applied: ${result.appliedCount}`);
    console.log(`  Skipped: ${result.skipped.length}`);
    console.log(`  Backups: ${result.backups.length}`);
    console.log(`  Report: ${reportAbs}`);

    const uploadTargets = countUniqueStoragePaths(opts.rewritePlan);
    const localReady = countLocalFilesFromManifest(opts.report);

    appendPhase3GUploadToConversionReport(astroAbs, {
      uploadPlanRel: path
        .relative(astroAbs, path.join(path.dirname(reportAbs), "STORAGE_UPLOAD_PLAN.md"))
        .replace(/\\/g, "/"),
      seedRewriteRel: path.relative(astroAbs, reportAbs).replace(/\\/g, "/"),
      uploadTargetCount: uploadTargets,
      localFileExistsCount: localReady ?? uploadTargets,
      rewriteMode: result.mode,
      seedModified: opts.apply && result.appliedCount > 0,
      backupsCreated: result.backups.length,
    });

    appendPhase3GHomeImageToSupabaseSeedReport(supabaseReportAbs, {
      homeImageUrlCount: countHomeImageUrls(opts.seedDir),
      scheduleRewriteCount: countScheduleRewrites(opts.rewritePlan),
    });

    if (opts.apply) {
      console.log("  Seed JSON updated (tooling output only — not production)");
    } else {
      console.log("  Dry-run: seed JSON unchanged");
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    if (process.env.DEBUG) console.error(err);
    process.exit(1);
  }
}

main();
