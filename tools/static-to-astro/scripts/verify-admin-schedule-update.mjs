#!/usr/bin/env node
/**
 * Verify Admin schedule update API (Phase 3-P-B).
 *
 * Usage:
 *   node scripts/verify-admin-schedule-update.mjs \
 *     --astro-dir tools/static-to-astro/output/generated-astro \
 *     --legacy-id schedule-2026-03-011 \
 *     --report tools/static-to-astro/output/rls/gosaki/ADMIN_SCHEDULE_UPDATE_VERIFY_REPORT.md
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadAdminApiEnv, resolveAdminEmailForVerify } from "./lib/admin-api-auth-verifier.mjs";
import {
  appendPhase3PBToConversionReport,
  formatAdminScheduleUpdateReport,
  runAdminScheduleUpdateVerification,
} from "./lib/admin-schedule-update-verifier.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/verify-admin-schedule-update.mjs [options]

Verify POST /api/admin/schedules/update.json (single-row update, cleanup restore).

Options:
  --astro-dir PATH    generated-astro directory (required)
  --legacy-id ID      Target schedule legacy_id (required)
  --report PATH       ADMIN_SCHEDULE_UPDATE_VERIFY_REPORT.md output (required)
  --email EMAIL       Admin email (default: SUPABASE_ADMIN_EMAIL → git user.email)
  --port NUMBER       Dev server port (default: 4325)
  --skip-build        Skip npm run build
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    astroDir: null,
    legacyId: null,
    report: null,
    email: null,
    port: 4325,
    skipBuild: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--astro-dir") {
      opts.astroDir = argv[++i];
      continue;
    }
    if (arg === "--legacy-id") {
      opts.legacyId = argv[++i];
      continue;
    }
    if (arg === "--report") {
      opts.report = argv[++i];
      continue;
    }
    if (arg === "--email") {
      opts.email = argv[++i];
      continue;
    }
    if (arg === "--port") {
      opts.port = Number(argv[++i]);
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

  if (!opts.astroDir || !opts.legacyId || !opts.report) {
    printHelp();
    process.exit(1);
  }

  const astroDir = path.resolve(process.cwd(), opts.astroDir);
  const reportPath = path.resolve(process.cwd(), opts.report);

  if (!fs.existsSync(astroDir)) {
    console.error(`astro-dir not found: ${astroDir}`);
    process.exit(1);
  }

  console.log("static-to-astro verify-admin-schedule-update (Phase 3-P-B)");
  console.log(`  Astro:     ${astroDir}`);
  console.log(`  Legacy id: ${opts.legacyId}`);
  console.log(`  Report:    ${reportPath}`);
  console.log("");

  let env;
  let email;

  try {
    env = loadAdminApiEnv(TOOL_ROOT);
    email = resolveAdminEmailForVerify({
      cliEmail: opts.email,
      envEmail: env.adminEmail,
      repoRoot: REPO_ROOT,
    });
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  console.log(`Staging host: ${env.host}`);
  console.log(`Admin email: ${email}`);
  console.log("Secrets: not logged");
  console.log("");

  const result = await runAdminScheduleUpdateVerification({
    astroDir,
    env,
    email,
    legacyId: opts.legacyId,
    port: opts.port,
    skipBuild: opts.skipBuild,
  });

  if (result.build) {
    console.log(`Build: ${result.build.ok ? "success" : "failed"}${result.build.skipped ? " (skipped)" : ""}`);
  }
  if (result.unauthenticated) {
    console.log(
      `Unauthenticated update: HTTP ${result.unauthenticated.status}, error=${result.unauthenticated.error}`,
    );
  }
  if (result.adminUpdate) {
    console.log(`Admin update: ${result.adminUpdate.pass ? "success" : "failed"}`);
  }
  if (result.cleanupRestore) {
    console.log(`Cleanup restore: ${result.cleanupRestore.pass ? "success" : "failed"}`);
  }
  if (result.finalRecordEqualsOriginal != null) {
    console.log(`Final record equals original: ${result.finalRecordEqualsOriginal ? "yes" : "no"}`);
  }
  if (result.countsUnchanged != null) {
    console.log(`Final counts unchanged: ${result.countsUnchanged ? "yes" : "no"}`);
  }
  if (result.keyLeakScan) {
    console.log(`Key leak scan: ${result.keyLeakScan.ok ? "OK" : "FAIL"}`);
  }
  console.log("insert/delete/upsert: none");
  console.log(`Overall: ${result.passed ? "PASS" : "FAIL"}`);
  console.log("");

  const report = formatAdminScheduleUpdateReport({
    reportPath,
    result,
    elapsedMs: Date.now() - started,
  });

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report, "utf8");

  appendPhase3PBToConversionReport(astroDir, {
    passed: result.passed,
    host: result.host,
    endpoint: result.endpoint,
    legacyId: result.legacyId,
  });

  console.log(`Report written: ${reportPath}`);
  console.log(`Done (${Date.now() - started}ms)`);

  if (!result.passed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
