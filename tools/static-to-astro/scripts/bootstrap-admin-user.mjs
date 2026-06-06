#!/usr/bin/env node
/**
 * Bootstrap staging Auth admin user + admin_users row (Phase 3-O).
 * No CMS table writes. Admin UI save remains disabled.
 *
 * Usage:
 *   node scripts/bootstrap-admin-user.mjs \
 *     --email admin@example.com \
 *     --report tools/static-to-astro/output/rls/gosaki/ADMIN_USER_BOOTSTRAP_REPORT.md
 *
 * Recommended: set SUPABASE_ADMIN_PASSWORD in .env.local (not Git) instead of --password.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  appendPhase3OToConversionReport,
  formatAdminBootstrapReport,
  loadBootstrapEnv,
  runAdminUserBootstrap,
} from "./lib/admin-user-bootstrapper.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const ASTRO_DIR = path.join(TOOL_ROOT, "output", "generated-astro");

function printHelp() {
  console.log(`Usage: node scripts/bootstrap-admin-user.mjs [options]

Bootstrap staging Auth admin + admin_users registration.
Default is dry-run. CMS tables are never written.

Options:
  --email EMAIL     Admin email (required)
  --password PASS   Initial password (prefer SUPABASE_ADMIN_PASSWORD in .env.local)
  --report PATH     ADMIN_USER_BOOTSTRAP_REPORT.md output (required)
  --apply           Create/reuse Auth user and upsert admin_users
  --dry-run         Explicit dry-run (default)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    email: null,
    password: null,
    report: null,
    apply: false,
    dryRun: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--email") {
      opts.email = argv[++i];
      continue;
    }
    if (arg === "--password") {
      opts.password = argv[++i];
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
    if (arg === "--dry-run") {
      opts.dryRun = true;
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

  if (!opts.report || !opts.email) {
    printHelp();
    process.exit(1);
  }

  const reportPath = path.resolve(process.cwd(), opts.report);
  const apply = opts.apply && !opts.dryRun;

  console.log("static-to-astro bootstrap-admin-user (Phase 3-O)");
  console.log(`  Mode:   ${apply ? "APPLY" : "DRY-RUN"}`);
  console.log(`  Email:  ${opts.email.trim()}`);
  console.log(`  Report: ${reportPath}`);
  console.log("");

  let env;
  try {
    env = loadBootstrapEnv(TOOL_ROOT, { requireAnonKey: apply });
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  console.log(`Staging host: ${env.host}`);
  console.log("Keys / password: not logged");
  console.log("");

  const result = await runAdminUserBootstrap(env, {
    email: opts.email,
    apply,
    cliPassword: opts.password,
  });

  if (result.adminUsersCountBefore != null) {
    console.log(`admin_users count (before): ${result.adminUsersCountBefore}`);
  }

  if (!apply) {
    console.log("Dry-run complete — no Auth/admin_users writes.");
    console.log("Re-run with --apply to bootstrap admin (staging only).");
    console.log("");
  } else {
    console.log(`Auth action: ${result.authAction ?? "n/a"}`);
    console.log(`admin_users upsert: ${result.adminUsersUpsert ? "ok" : "failed"}`);
    if (result.adminUsersCountAfter != null) {
      console.log(`admin_users count (after): ${result.adminUsersCountAfter}`);
    }
    if (result.signIn) {
      console.log(
        `Sign-in: ${result.signIn.skipped ? "skipped (existing user)" : result.signIn.ok ? "ok" : "failed"}`,
      );
    }
    if (result.isAdmin) {
      const label =
        result.isAdmin.ok === true ? "yes" : result.isAdmin.ok === null ? "skipped" : "no";
      console.log(`is_admin() RPC: ${label}`);
    }
    console.log(`Overall: ${result.passed ? "PASS" : "FAIL"}`);
    console.log("");
  }

  const report = formatAdminBootstrapReport({
    reportPath,
    result,
    elapsedMs: Date.now() - started,
  });

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report, "utf8");

  appendPhase3OToConversionReport(ASTRO_DIR, {
    passed: result.passed,
    mode: result.mode,
    host: result.host,
    email: result.email,
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
