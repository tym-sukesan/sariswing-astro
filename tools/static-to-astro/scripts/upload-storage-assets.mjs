#!/usr/bin/env node
/**
 * Upload approved storage assets to staging Supabase Storage (G-4b).
 * Default: dry-run. Use --apply to upload approvedForStagingUpload only.
 * DB update is NOT performed — see storage-db-update-plan.json for G-4c.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/upload-storage-assets.mjs \
 *     --allowlist tools/static-to-astro/output/storage/gosaki/storage-upload-allowlist.json \
 *     --site-slug gosaki \
 *     --bucket site-assets \
 *     --report tools/static-to-astro/output/storage/gosaki/STORAGE_UPLOAD_REPORT.md \
 *     --manifest tools/static-to-astro/output/storage/gosaki/storage-upload-result.json \
 *     --db-update-plan tools/static-to-astro/output/storage/gosaki/storage-db-update-plan.json
 *
 *   # Staging upload (after bucket + env verified):
 *   node tools/static-to-astro/scripts/upload-storage-assets.mjs ... --apply
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildStorageDbUpdatePlan,
  buildUploadResultManifest,
  formatStorageUploadReport,
  loadStagingSupabaseEnv,
  runApprovedStorageUpload,
} from "./lib/storage-upload-executor.mjs";
import { assertSupabaseJsAvailable } from "./lib/supabase-seed-inserter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/upload-storage-assets.mjs [options]

Upload approvedForStagingUpload entries to staging Supabase Storage (G-4b).
Default is dry-run — no uploads. DB update is never performed.

Options:
  --allowlist PATH       storage-upload-allowlist.json (required)
  --site-slug SLUG       Site slug (required)
  --bucket NAME          Storage bucket (default: site-assets)
  --report PATH          STORAGE_UPLOAD_REPORT.md output (required)
  --manifest PATH        storage-upload-result.json output (required)
  --db-update-plan PATH  storage-db-update-plan.json for G-4c (optional)
  --env-file PATH        .env.local path (default: tools/static-to-astro/.env.local)
  --apply                Perform upload (staging only; requires env + bucket)
  --overwrite            Replace existing objects (default: skip existing)
  --create-bucket        With --apply only: create public bucket if missing (staging)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    allowlist: null,
    siteSlug: null,
    bucket: "site-assets",
    report: null,
    manifest: null,
    dbUpdatePlan: null,
    envFile: null,
    apply: false,
    overwrite: false,
    createBucket: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--allowlist") {
      opts.allowlist = argv[++i];
      continue;
    }
    if (arg === "--site-slug") {
      opts.siteSlug = argv[++i];
      continue;
    }
    if (arg === "--bucket") {
      opts.bucket = argv[++i];
      continue;
    }
    if (arg === "--report") {
      opts.report = argv[++i];
      continue;
    }
    if (arg === "--manifest") {
      opts.manifest = argv[++i];
      continue;
    }
    if (arg === "--db-update-plan") {
      opts.dbUpdatePlan = argv[++i];
      continue;
    }
    if (arg === "--env-file") {
      opts.envFile = argv[++i];
      continue;
    }
    if (arg === "--apply") {
      opts.apply = true;
      continue;
    }
    if (arg === "--overwrite") {
      opts.overwrite = true;
      continue;
    }
    if (arg === "--create-bucket") {
      opts.createBucket = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

function printSummary(result) {
  const phase = result.uploadProfile === "schedule" ? "G-4f" : "G-4b";
  console.log("");
  console.log(`=== Storage Upload Summary (${phase}) ===`);
  console.log(`profile: ${result.uploadProfile ?? "discography"}`);
  console.log(`mode: ${result.mode}`);
  console.log(`siteSlug: ${result.siteSlug}`);
  console.log(`bucket: ${result.bucket}`);
  console.log(`stagingHost: ${result.stagingHost ?? "(not connected)"}`);
  console.log(`approved input: ${result.summary.approvedInput}`);
  console.log(`uploaded: ${result.summary.uploaded}`);
  console.log(`skipped existing: ${result.summary.skippedExisting}`);
  console.log(`failed: ${result.summary.failed}`);
  console.log(`dry-run planned: ${result.summary.dryRunPlanned}`);
  console.log(`upload performed: ${result.uploadPerformed ? "yes" : "no"}`);
  console.log(`db update performed: no`);
  console.log(`secret leak: none`);
}

async function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  if (!opts.allowlist || !opts.siteSlug || !opts.report || !opts.manifest) {
    printHelp();
    process.exit(1);
  }

  const allowlistPath = path.resolve(REPO_ROOT, opts.allowlist);
  const reportPath = path.resolve(REPO_ROOT, opts.report);
  const manifestPath = path.resolve(REPO_ROOT, opts.manifest);
  const dbUpdatePlanPath = opts.dbUpdatePlan
    ? path.resolve(REPO_ROOT, opts.dbUpdatePlan)
    : path.join(path.dirname(manifestPath), "storage-db-update-plan.json");

  if (!fs.existsSync(allowlistPath)) {
    console.error(`Allowlist not found: ${allowlistPath}`);
    process.exit(1);
  }

  console.log("Storage upload (G-4b)");
  console.log(`Allowlist: ${opts.allowlist}`);
  console.log(`Site: ${opts.siteSlug}`);
  console.log(`Bucket: ${opts.bucket}`);
  console.log(`Apply: ${opts.apply ? "yes" : "no (dry-run)"}`);
  console.log("");

  await assertSupabaseJsAvailable();

  const result = await runApprovedStorageUpload({
    allowlistPath,
    siteSlug: opts.siteSlug,
    bucket: opts.bucket,
    apply: opts.apply,
    overwrite: opts.overwrite,
    createBucket: opts.createBucket,
    envFile: opts.envFile ? path.resolve(REPO_ROOT, opts.envFile) : null,
  });

  let supabase = null;
  if (opts.apply && result.summary.uploaded + result.summary.skippedExisting > 0) {
    try {
      const env = loadStagingSupabaseEnv(opts.envFile ? path.resolve(REPO_ROOT, opts.envFile) : null);
      const { createClient } = await import("@supabase/supabase-js");
      supabase = createClient(env.supabaseUrl, env.serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    } catch {
      supabase = null;
    }
  }

  const dbPlan = await buildStorageDbUpdatePlan(result, supabase);

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.mkdirSync(path.dirname(dbUpdatePlanPath), { recursive: true });

  fs.writeFileSync(manifestPath, `${JSON.stringify(buildUploadResultManifest(result), null, 2)}\n`, "utf8");
  fs.writeFileSync(
    reportPath,
    formatStorageUploadReport(result, {
      reportPath: opts.report,
      manifestPath: opts.manifest,
      dbUpdatePlanPath: path.relative(REPO_ROOT, dbUpdatePlanPath),
    }),
    "utf8",
  );
  fs.writeFileSync(dbUpdatePlanPath, `${JSON.stringify(dbPlan, null, 2)}\n`, "utf8");

  printSummary(result);
  console.log("");
  console.log(`Report: ${opts.report}`);
  console.log(`Manifest: ${opts.manifest}`);
  console.log(`DB update plan: ${path.relative(REPO_ROOT, dbUpdatePlanPath)}`);

  if (result.summary.failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
