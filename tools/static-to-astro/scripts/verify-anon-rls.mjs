#!/usr/bin/env node
/**
 * Verify staging RLS public read policies with anon / publishable key (Phase 3-N continued).
 *
 * Usage:
 *   node scripts/verify-anon-rls.mjs \
 *     --report tools/static-to-astro/output/rls/gosaki/ANON_RLS_VERIFY_REPORT.md
 *
 *   node scripts/verify-anon-rls.mjs --report ... --apply
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  appendPhase3NAnonToConversionReport,
  formatAnonRlsReport,
  loadAnonRlsEnv,
  runAnonRlsVerification,
} from "./lib/anon-rls-verifier.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const ASTRO_DIR = path.join(TOOL_ROOT, "output", "generated-astro");

function printHelp() {
  console.log(`Usage: node scripts/verify-anon-rls.mjs [options]

Verify staging RLS: anon/publishable key sees published rows only.
Default is dry-run (read-only). Use --apply to create rls-test-* rows, verify, cleanup.

Options:
  --report PATH       ANON_RLS_VERIFY_REPORT.md output (required)
  --apply             Create rls-test-* rows, verify anon RLS, cleanup
  --keep-test-rows    Skip cleanup after --apply (debug only)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    report: null,
    apply: false,
    keepTestRows: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
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
    if (arg === "--keep-test-rows") {
      opts.keepTestRows = true;
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

  if (!opts.report) {
    printHelp();
    process.exit(1);
  }

  const reportPath = path.resolve(process.cwd(), opts.report);

  console.log("static-to-astro verify-anon-rls (Phase 3-N continued)");
  console.log(`  Mode:   ${opts.apply ? "APPLY" : "DRY-RUN"}`);
  console.log(`  Report: ${reportPath}`);
  console.log("");

  let env;
  try {
    env = loadAnonRlsEnv(TOOL_ROOT, { requireAnonKey: opts.apply });
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  console.log(`Staging host: ${env.host}`);
  console.log("Keys: not logged");
  console.log("");

  let result;
  try {
    result = await runAnonRlsVerification(env, {
      apply: opts.apply,
      keepTestRows: opts.keepTestRows,
    });
  } catch (err) {
    console.error(`Verification failed: ${err.message}`);
    process.exit(1);
  }

  if (result.baselineCounts) {
    console.log("Baseline counts (service role):");
    for (const [table, count] of Object.entries(result.baselineCounts)) {
      console.log(`  ${table}: ${count}`);
    }
    console.log("");
  }

  if (!opts.apply) {
    console.log("Dry-run complete — no writes.");
    console.log("Re-run with --apply to create rls-test-* rows and verify anon RLS.");
    console.log("");
  } else {
    console.log(`Test rows created: ${result.testRowsCreated ? "yes" : "no"}`);
    console.log(
      `Service role sees test rows: ${result.serviceRoleSeesTestRows?.all ? "yes" : "no"}`,
    );
    if (result.anonVisibility) {
      const v = result.anonVisibility;
      console.log(`Anon sees published schedules: ${v.seesPublishedSchedules ? "yes" : "no"}`);
      console.log(`Anon sees unpublished schedule: ${v.seesUnpublishedSchedule ? "yes" : "no"}`);
      console.log(`Anon sees unpublished discography: ${v.seesUnpublishedDiscography ? "yes" : "no"}`);
      console.log(`Anon sees hidden track: ${v.seesHiddenTrack ? "yes" : "no"}`);
    }
    console.log(`Cleanup OK: ${result.cleanup?.ok !== false ? "yes" : "no"}`);
    if (result.finalCounts) {
      console.log("Final counts:", JSON.stringify(result.finalCounts));
    }
    console.log(`Overall: ${result.passed ? "PASS" : "FAIL"}`);
    console.log("");
  }

  const report = formatAnonRlsReport({
    reportPath,
    result,
    elapsedMs: Date.now() - started,
  });

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report, "utf8");

  appendPhase3NAnonToConversionReport(ASTRO_DIR, {
    passed: result.passed,
    mode: result.mode,
    host: result.host,
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
