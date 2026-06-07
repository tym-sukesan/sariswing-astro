#!/usr/bin/env node
/**
 * CMS minimal loop integration verification (Phase 3-Q).
 *
 * Usage:
 *   node tools/static-to-astro/scripts/verify-cms-minimal-loop.mjs \
 *     --astro-dir tools/static-to-astro/output/generated-astro \
 *     --report tools/static-to-astro/output/rls/gosaki/CMS_MINIMAL_LOOP_VERIFY_REPORT.md
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadAdminApiEnv, resolveAdminEmailForVerify } from "./lib/admin-api-auth-verifier.mjs";
import {
  appendPhase3QToConversionReport,
  formatCmsMinimalLoopReport,
  runCmsMinimalLoopVerification,
} from "./lib/cms-minimal-loop-verifier.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/verify-cms-minimal-loop.mjs [options]

Verify CMS minimal loop: Admin update → export → build → HTML → cleanup → re-export/rebuild.

Options:
  --astro-dir PATH              generated-astro directory (required)
  --report PATH                 CMS_MINIMAL_LOOP_VERIFY_REPORT.md output (required)
  --schedule-legacy-id ID       Target schedule (default: schedule-2026-03-011)
  --discography-legacy-id ID    Target discography (default: discography-001)
  --track-number N              Target track number (default: 1)
  --email EMAIL                 Admin email (default: SUPABASE_ADMIN_EMAIL → git user.email)
  --port NUMBER                 Dev server port (default: 4329)
  --skip-build                  Skip npm run build
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    astroDir: null,
    report: null,
    scheduleLegacyId: "schedule-2026-03-011",
    discographyLegacyId: "discography-001",
    trackNumber: 1,
    email: null,
    port: 4329,
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
    if (arg === "--report") {
      opts.report = argv[++i];
      continue;
    }
    if (arg === "--schedule-legacy-id") {
      opts.scheduleLegacyId = argv[++i];
      continue;
    }
    if (arg === "--discography-legacy-id") {
      opts.discographyLegacyId = argv[++i];
      continue;
    }
    if (arg === "--track-number") {
      opts.trackNumber = Number(argv[++i]);
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
    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

function printSummary(result) {
  console.log("");
  console.log("=== CMS Minimal Loop Summary ===");
  console.log(`baseline: ${result.baseline?.ok ? "OK" : "FAIL"}`);
  console.log(`temporary update: ${result.temporaryUpdate?.ok ? "OK" : "FAIL"}`);
  console.log(`export: ${result.export?.ok ? "OK" : "FAIL"}`);
  console.log(`build: ${result.build?.skipped ? "skipped" : result.build?.ok ? "success" : "failed"}`);
  console.log(`HTML reflects temporary changes: ${result.htmlReflectsTemporary?.pass ? "yes" : "no"}`);
  console.log(`cleanup restore: ${result.cleanupRestore?.ok ? "OK" : "FAIL"}`);
  console.log(`re-export: ${result.reExport?.ok ? "OK" : "FAIL"}`);
  console.log(`rebuild: ${result.rebuild?.skipped ? "skipped" : result.rebuild?.ok ? "success" : "failed"}`);
  console.log(`HTML restored: ${result.htmlRestored?.pass ? "yes" : "no"}`);
  console.log(`final record equals original: ${result.finalRecordEqualsOriginal ? "yes" : "no"}`);
  console.log(
    `final counts unchanged: ${
      result.countsUnchanged ? "yes" : "no"
    } (schedules=${result.finalCounts?.schedules ?? "—"}, discography=${result.finalCounts?.discography ?? "—"}, tracks=${result.finalCounts?.discography_tracks ?? "—"})`,
  );
  console.log(`key leak scan: ${result.keyLeakScan?.ok ? "OK" : "FAIL"}`);
  console.log(`update method: ${result.updateMethod}`);
  console.log(`result: ${result.passed ? "PASS" : "FAIL"}`);
  if (result.errors.length > 0) {
    console.log("");
    console.log("Errors:");
    for (const err of result.errors) {
      console.log(`  - ${err}`);
    }
  }
}

async function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  if (!opts.astroDir || !opts.report) {
    printHelp();
    process.exit(1);
  }

  const astroDir = path.resolve(REPO_ROOT, opts.astroDir);
  const reportPath = path.resolve(REPO_ROOT, opts.report);

  if (!fs.existsSync(astroDir)) {
    console.error(`astro-dir not found: ${astroDir}`);
    process.exit(1);
  }

  const env = loadAdminApiEnv(TOOL_ROOT);
  const email = resolveAdminEmailForVerify({
    cliEmail: opts.email,
    envEmail: env.adminEmail,
    repoRoot: REPO_ROOT,
  });

  const started = Date.now();
  console.log("CMS minimal loop verification (Phase 3-Q)");
  console.log(`Host: ${env.host}`);
  console.log(`Schedule: ${opts.scheduleLegacyId}`);
  console.log(`Discography: ${opts.discographyLegacyId}`);
  console.log(`Track: ${opts.trackNumber}`);
  console.log(`Update method: Admin API route`);
  console.log("");

  const result = await runCmsMinimalLoopVerification({
    toolRoot: TOOL_ROOT,
    astroDir,
    env,
    email,
    scheduleLegacyId: opts.scheduleLegacyId,
    discographyLegacyId: opts.discographyLegacyId,
    trackNumber: opts.trackNumber,
    port: opts.port,
    skipBuild: opts.skipBuild,
  });

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(
    reportPath,
    formatCmsMinimalLoopReport(result, {
      reportPath: opts.report,
      elapsedMs: Date.now() - started,
    }),
    "utf8",
  );

  appendPhase3QToConversionReport(astroDir, {
    passed: result.passed,
    host: result.host,
    scheduleLegacyId: opts.scheduleLegacyId,
    discographyLegacyId: opts.discographyLegacyId,
  });

  printSummary(result);
  console.log("");
  console.log(`Report: ${opts.report}`);

  process.exit(result.passed ? 0 : 1);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
