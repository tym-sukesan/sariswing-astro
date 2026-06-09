#!/usr/bin/env node
/**
 * Read-only export: staging Supabase → Astro src/data JSON (Phase 3-K).
 *
 * Usage:
 *   node scripts/export-supabase-json.mjs \
 *     --out-astro-dir tools/static-to-astro/output/generated-astro \
 *     --report tools/static-to-astro/output/supabase-export/gosaki/SUPABASE_EXPORT_REPORT.md
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertSupabaseJsAvailable } from "./lib/supabase-seed-inserter.mjs";
import {
  analyzeExportIntegrity,
  appendPhase3KToConversionReport,
  fetchSupabaseCmsData,
  formatSupabaseExportReport,
  loadExportEnv,
  supabaseHostFromUrl,
  transformDiscography,
  transformScheduleMonths,
  transformSchedules,
  writeAstroDataJson,
} from "./lib/supabase-json-exporter.mjs";
import { refreshPublicCmsViewsAfterExport } from "./lib/refresh-public-cms-views.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

const COMPATIBILITY_FIELDS = [
  "`id` = `legacy_id` (schedules, discography)",
  "`image` = `image_url` (schedules — used by ScheduleList.astro)",
  "`home_image` = `home_image_url` (schedules — used by HomeSchedule.astro)",
  "`cover_image` = `cover_image_url` (discography — used by DiscographyList.astro)",
  "`date_display` derived from `date` ISO string",
  "`heading` derived from `title` + `artist` when both present",
  "`tracks[].number` = `track_number` from discography_tracks",
  "Home-only fields (`home_date_display`, `home_performers`, etc.) set to null (not stored in Supabase yet)",
];

function printHelp() {
  console.log(`Usage: node scripts/export-supabase-json.mjs [options]

Read CMS data from staging Supabase and write Astro src/data JSON.
Read-only — no Supabase writes.

Options:
  --out-astro-dir PATH   generated-astro directory (required)
  --report PATH          SUPABASE_EXPORT_REPORT.md output path (required)
  --skip-build           Skip npm run build after export
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    outAstroDir: null,
    report: null,
    skipBuild: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--out-astro-dir") {
      opts.outAstroDir = argv[++i];
      continue;
    }
    if (arg === "--report") {
      opts.report = argv[++i];
      continue;
    }
    if (arg === "--skip-build") {
      opts.skipBuild = true;
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  return opts;
}

function runAstroBuild(outAstroDir) {
  const started = Date.now();
  const result = spawnSync("npm", ["run", "build"], {
    cwd: path.resolve(outAstroDir),
    encoding: "utf8",
    shell: false,
  });

  if (result.status !== 0) {
    const error = [result.stderr, result.stdout].filter(Boolean).join("\n").trim();
    return { success: false, elapsedMs: Date.now() - started, error: error || "npm run build failed" };
  }

  return { success: true, elapsedMs: Date.now() - started, error: null };
}

async function main() {
  const started = Date.now();
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

  if (!opts.outAstroDir || !opts.report) {
    printHelp();
    process.exit(1);
  }

  const outAstroDir = path.resolve(process.cwd(), opts.outAstroDir);
  const reportPath = path.resolve(process.cwd(), opts.report);

  if (!fs.existsSync(outAstroDir)) {
    console.error(`Error: out-astro-dir not found: ${outAstroDir}`);
    process.exit(1);
  }

  console.log("static-to-astro export-supabase-json (Phase 3-K)");
  console.log(`  Out:    ${outAstroDir}`);
  console.log(`  Report: ${reportPath}`);
  console.log("  Mode:   READ-ONLY (no Supabase writes)");
  console.log("");

  let env;
  try {
    env = loadExportEnv(TOOL_ROOT);
    await assertSupabaseJsAvailable();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  const host = supabaseHostFromUrl(env.supabaseUrl);
  console.log(`Reading from staging host: ${host}`);
  console.log("");

  let raw;
  try {
    raw = await fetchSupabaseCmsData(env);
  } catch (err) {
    console.error(`Supabase read failed: ${err.message}`);
    process.exit(1);
  }

  console.log("Read counts:");
  console.log(`  schedule_months:    ${raw.scheduleMonths.length}`);
  console.log(`  schedules:          ${raw.schedules.length}`);
  console.log(`  discography:        ${raw.discography.length}`);
  console.log(`  discography_tracks: ${raw.discographyTracks.length}`);
  console.log("");

  const exported = {
    scheduleMonths: transformScheduleMonths(raw.scheduleMonths),
    schedules: transformSchedules(raw.schedules),
    discography: transformDiscography(raw.discography, raw.discographyTracks),
  };

  const integrity = analyzeExportIntegrity(raw, exported);
  const outputFiles = writeAstroDataJson(exported, outAstroDir);

  const cmsViews = refreshPublicCmsViewsAfterExport(outAstroDir, {
    scheduleMonths: exported.scheduleMonths,
  });
  console.log("Refreshed CMS views:");
  console.log(`  schedule months: ${cmsViews.monthsCount}`);
  console.log(`  data-driven pages: ${cmsViews.scheduleViews.dataDrivenPages?.length ?? 0}`);
  console.log(`  resolve-public-image: ${cmsViews.imageHelper.copied ? "yes" : "no"}`);
  console.log("");

  console.log("Exported JSON:");
  console.log(`  ${outputFiles.scheduleMonths}`);
  console.log(`  ${outputFiles.schedules}`);
  console.log(`  ${outputFiles.discography}`);
  console.log("");
  console.log(`orphan schedules: ${integrity.orphanSchedules}`);
  console.log(`orphan tracks: ${integrity.orphanTracks}`);
  console.log(`show_on_home: ${integrity.showOnHome}`);
  console.log("");

  let buildResult = { success: true, elapsedMs: 0, error: null, skipped: true };
  if (!opts.skipBuild) {
    console.log("Running npm run build...");
    buildResult = { ...runAstroBuild(outAstroDir), skipped: false };
    if (buildResult.success) {
      console.log(`Build: success (${buildResult.elapsedMs}ms)`);
    } else {
      console.error(`Build: failed\n${buildResult.error}`);
    }
    console.log("");
  } else {
    console.log("Build: skipped (--skip-build)");
    console.log("");
  }

  const report = formatSupabaseExportReport({
    host,
    integrity,
    outputFiles,
    compatibilityFields: COMPATIBILITY_FIELDS,
    buildResult,
    elapsedMs: Date.now() - started,
    reportPath,
  });

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report, "utf8");
  appendPhase3KToConversionReport(outAstroDir, {
    host,
    integrity,
    buildSuccess: buildResult.success,
  });

  console.log(`Report written: ${reportPath}`);
  console.log("No Supabase writes were performed.");
  console.log(`Done (${Date.now() - started}ms)`);

  if (!buildResult.success) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
