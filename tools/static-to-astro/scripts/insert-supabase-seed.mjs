#!/usr/bin/env node
/**
 * Staging Supabase seed insert (Phase 3-J).
 *
 * Default: dry-run (no Supabase connection).
 * Use --apply to upsert into staging Supabase (requires .env.local).
 *
 * Usage:
 *   node scripts/insert-supabase-seed.mjs \
 *     --seed-dir tools/static-to-astro/output/supabase-seed/gosaki \
 *     --report tools/static-to-astro/output/supabase-seed/gosaki/INSERT_SEED_REPORT.md
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDryRunSummary,
  insertToSupabase,
  loadSeedFiles,
  resolveSchemaDraftPath,
  validateSeedData,
} from "./lib/supabase-seed-inserter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

function printHelp() {
  console.log(`Usage: node scripts/insert-supabase-seed.mjs [options]

Validate Supabase seed JSON and optionally upsert into staging Supabase.
Default is dry-run — no Supabase connection.

Options:
  --seed-dir PATH   Directory with seed-*.json and schema-draft.sql (required)
  --report PATH     INSERT_SEED_REPORT.md output path (required)
  --apply           Upsert into staging Supabase (requires .env.local)
  --verbose         Print extra validation details
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    seedDir: null,
    report: null,
    apply: false,
    verbose: false,
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
    if (arg === "--report") {
      opts.report = argv[++i];
      continue;
    }
    if (arg === "--apply") {
      opts.apply = true;
      continue;
    }
    if (arg === "--verbose") {
      opts.verbose = true;
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  return opts;
}

function loadEnvLocal() {
  const envPath = path.join(TOOL_ROOT, ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(
      `.env.local not found: ${envPath}\n` +
        "Copy .env.example and set staging credentials:\n" +
        "  cp tools/static-to-astro/.env.example tools/static-to-astro/.env.local",
    );
  }

  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    env[key] = value;
  }

  const missing = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(
      `.env.local is missing required keys:\n${missing.map((key) => `  - ${key}`).join("\n")}`,
    );
  }

  if (/prod|production/i.test(env.SUPABASE_URL)) {
    throw new Error(
      'SUPABASE_URL contains "prod" or "production". Use a staging-only project URL.',
    );
  }

  return {
    supabaseUrl: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

function formatInsertSeedReport({
  mode,
  seedDir,
  reportPath,
  schemaDraftPath,
  summary,
  validation,
  applyResults,
  elapsedMs,
}) {
  const lines = [
    "# INSERT_SEED_REPORT",
    "",
    `Generated at: ${new Date().toISOString()}`,
    `Mode: **${mode === "apply" ? "APPLY (staging Supabase)" : "DRY-RUN (no Supabase connection)"}**`,
    `Seed directory: \`${seedDir}\``,
    `Schema draft: \`${schemaDraftPath}\` (${fs.existsSync(schemaDraftPath) ? "found" : "missing"})`,
    "",
    "## Seed file counts",
    "",
    "| Table | Rows |",
    "| --- | ---: |",
    ...summary.tables.map((row) => `| \`${row.name}\` | ${row.count} |`),
    `| **Total** | **${summary.totalRecords}** |`,
    "",
    "## Validation",
    "",
  ];

  if (validation.valid) {
    lines.push("All required fields and duplicate checks passed.");
  } else {
    lines.push(`Validation errors (${validation.errors.length}):`);
    lines.push("");
    for (const error of validation.errors) {
      lines.push(`- ${error}`);
    }
  }

  if (validation.warnings.length > 0) {
    lines.push("");
    lines.push("Warnings:");
    for (const warning of validation.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  lines.push(
    "",
    "## Referential integrity",
    "",
    summary.orphanSchedules > 0
      ? `- schedules with unknown month: **${summary.orphanSchedules}**`
      : "- schedules → schedule_months.month: OK",
    summary.orphanTracks > 0
      ? `- discography_tracks with unknown discography_legacy_id: **${summary.orphanTracks}**`
      : "- discography_tracks → discography.legacy_id: OK",
    `- show_on_home schedules: ${summary.homeSchedules}`,
    summary.schedulesMissingDate > 0
      ? `- schedules missing date: **${summary.schedulesMissingDate}**`
      : "- schedules.date (NOT NULL): OK",
    "",
    "## Image URL types",
    "",
    "| Kind | Count |",
    "| --- | ---: |",
    `| image_url / home_image_url / cover_image_url (non-null) | ${summary.imageUrls.total} |`,
    `| Wix / external | ${summary.imageUrls.wix} |`,
    `| Supabase Storage | ${summary.imageUrls.supabase} |`,
    `| Other | ${summary.imageUrls.other} |`,
    "",
  );

  if (summary.imageUrls.wix > 0) {
    lines.push(
      "> Wix/external URLs remain. Complete Storage migration (Phase 3-F/G) before production apply.",
      "",
    );
  }

  lines.push(
    "## Upsert keys (aligned with schema-draft.sql)",
    "",
    "| Table | Strategy |",
    "| --- | --- |",
    `| schedule_months | upsert on \`${summary.upsertKeys.schedule_months}\` |`,
    `| schedules | upsert on \`${summary.upsertKeys.schedules}\` |`,
    `| discography | upsert on \`${summary.upsertKeys.discography}\` |`,
    `| discography_tracks | ${summary.upsertKeys.discography_tracks} |`,
    "",
    "## Before --apply",
    "",
    "1. Create a **staging-only** Supabase project (not production).",
    "2. Copy `.env.example` to `.env.local` and set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.",
    "3. Run `schema-draft.sql` manually in the staging SQL Editor (this script does not apply DDL).",
    "4. Install `@supabase/supabase-js` in `tools/static-to-astro/` if needed.",
    "5. Re-run with `--apply`.",
    "",
  );

  if (applyResults) {
    lines.push("## Apply results (staging)", "", "| Table | Total | Written | Deleted | Errors |", "| --- | ---: | ---: | ---: | --- |");
    for (const row of applyResults) {
      lines.push(
        `| \`${row.table}\` | ${row.total} | ${row.inserted} | ${row.deleted ?? "-"} | ${row.errors.length} |`,
      );
    }
    lines.push("");

    const allErrors = applyResults.flatMap((row) =>
      row.errors.map((error) => `[${row.table}] ${error}`),
    );
    if (allErrors.length > 0) {
      lines.push("### Error details", "");
      for (const error of allErrors) {
        lines.push(`- ${error}`);
      }
      lines.push("");
    }
  }

  lines.push("---", `Elapsed: ${elapsedMs}ms`, `Report: \`${reportPath}\``, "");

  return lines.join("\n");
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

  if (!opts.seedDir || !opts.report) {
    printHelp();
    process.exit(1);
  }

  const seedDir = path.resolve(process.cwd(), opts.seedDir);
  const reportPath = path.resolve(process.cwd(), opts.report);
  const schemaDraftPath = resolveSchemaDraftPath(seedDir);

  console.log("static-to-astro insert-supabase-seed (Phase 3-J)");
  console.log(`  Mode:     ${opts.apply ? "APPLY" : "DRY-RUN"}`);
  console.log(`  Seed dir: ${seedDir}`);
  console.log(`  Report:   ${reportPath}`);
  console.log("");

  let seedData;
  try {
    seedData = loadSeedFiles(seedDir);
    seedData.seedDir = seedDir;
  } catch (err) {
    console.error(`Seed load failed: ${err.message}`);
    process.exit(1);
  }

  console.log("Loaded seed files:");
  for (const row of [
    ["schedule_months", seedData.scheduleMonths.length],
    ["schedules", seedData.schedules.length],
    ["discography", seedData.discography.length],
    ["discography_tracks", seedData.discographyTracks.length],
  ]) {
    console.log(`  ${row[0]}: ${row[1]}`);
  }
  console.log("");

  const validation = validateSeedData(seedData);
  const summary = buildDryRunSummary(seedData);

  if (!validation.valid) {
    console.error(`Validation failed (${validation.errors.length} errors):`);
    for (const error of validation.errors) {
      console.error(`  - ${error}`);
    }
    console.error("");
    if (opts.apply) {
      process.exit(1);
    }
  } else {
    console.log("Validation: OK");
  }

  console.log("Integrity:");
  console.log(
    `  schedules → schedule_months.month: ${summary.orphanSchedules === 0 ? "OK" : `${summary.orphanSchedules} orphan(s)`}`,
  );
  console.log(
    `  discography_tracks → discography.legacy_id: ${summary.orphanTracks === 0 ? "OK" : `${summary.orphanTracks} orphan(s)`}`,
  );
  console.log(`  show_on_home: ${summary.homeSchedules}`);
  console.log(
    `  image URLs: total=${summary.imageUrls.total}, wix=${summary.imageUrls.wix}, supabase=${summary.imageUrls.supabase}, other=${summary.imageUrls.other}`,
  );
  console.log("");

  if (fs.existsSync(schemaDraftPath)) {
    console.log(`schema-draft.sql: found (${schemaDraftPath})`);
  } else {
    console.warn(`schema-draft.sql: missing (${schemaDraftPath})`);
  }
  console.log("");

  if (opts.verbose) {
    console.log("Upsert keys:");
    for (const [table, key] of Object.entries(summary.upsertKeys)) {
      console.log(`  ${table}: ${key}`);
    }
    console.log("");
  }

  let applyResults = null;

  if (opts.apply) {
    if (!validation.valid) {
      console.error("Aborting --apply because validation failed.");
      process.exit(1);
    }

    let env;
    try {
      env = loadEnvLocal();
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }

    console.log(`Connecting to staging: ${env.supabaseUrl}`);
    console.log("");

    try {
      applyResults = await insertToSupabase(seedData, env);
    } catch (err) {
      console.error(`Supabase insert failed: ${err.message}`);
      process.exit(1);
    }

    for (const row of applyResults) {
      const status = row.errors.length === 0 ? "OK" : "ERR";
      const deleted = row.deleted != null ? `, deleted=${row.deleted}` : "";
      console.log(
        `  [${status}] ${row.table}: written=${row.inserted}/${row.total}${deleted}, errors=${row.errors.length}`,
      );
      for (const error of row.errors) {
        console.error(`    - ${error}`);
      }
    }
    console.log("");
  } else {
    console.log("Dry-run complete. No Supabase writes were performed.");
    console.log("To apply after staging setup, re-run with --apply.");
    console.log("");
  }

  const report = formatInsertSeedReport({
    mode: opts.apply ? "apply" : "dry-run",
    seedDir,
    reportPath,
    schemaDraftPath,
    summary,
    validation,
    applyResults,
    elapsedMs: Date.now() - started,
  });

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report, "utf8");
  console.log(`Report written: ${reportPath}`);
  console.log(`Done (${Date.now() - started}ms)`);

  if (opts.apply && applyResults?.some((row) => row.errors.length > 0)) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
