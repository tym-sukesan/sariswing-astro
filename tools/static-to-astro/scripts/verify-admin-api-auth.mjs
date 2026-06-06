#!/usr/bin/env node
/**
 * Verify Admin API auth route /api/admin/me.json (Phase 3-P-A).
 *
 * Usage:
 *   node scripts/verify-admin-api-auth.mjs \
 *     --astro-dir tools/static-to-astro/output/generated-astro \
 *     --report tools/static-to-astro/output/rls/gosaki/ADMIN_API_AUTH_VERIFY_REPORT.md
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  appendPhase3PAToConversionReport,
  formatAdminApiAuthReport,
  loadAdminApiEnv,
  resolveAdminEmailForVerify,
  runAdminApiAuthVerification,
} from "./lib/admin-api-auth-verifier.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/verify-admin-api-auth.mjs [options]

Build generated-astro, start dev server, verify GET /api/admin/me.json.
No CMS or admin_users writes.

Options:
  --astro-dir PATH   generated-astro directory (required)
  --report PATH      ADMIN_API_AUTH_VERIFY_REPORT.md output (required)
  --email EMAIL      Admin email (default: SUPABASE_ADMIN_EMAIL → git user.email)
  --port NUMBER      Dev server port (default: 4321)
  --skip-build       Skip npm run build
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    astroDir: null,
    report: null,
    email: null,
    port: 4321,
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

  if (!opts.astroDir || !opts.report) {
    printHelp();
    process.exit(1);
  }

  const astroDir = path.resolve(process.cwd(), opts.astroDir);
  const reportPath = path.resolve(process.cwd(), opts.report);

  if (!fs.existsSync(astroDir)) {
    console.error(`astro-dir not found: ${astroDir}`);
    process.exit(1);
  }

  console.log("static-to-astro verify-admin-api-auth (Phase 3-P-A)");
  console.log(`  Astro:  ${astroDir}`);
  console.log(`  Report: ${reportPath}`);
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

  const result = await runAdminApiAuthVerification({
    astroDir,
    env,
    email,
    port: opts.port,
    skipBuild: opts.skipBuild,
    repoRoot: REPO_ROOT,
  });

  if (result.build) {
    console.log(`Build: ${result.build.ok ? "success" : "failed"}${result.build.skipped ? " (skipped)" : ""}`);
  }
  if (result.unauthenticated) {
    console.log(
      `Unauthenticated: authenticated=${result.unauthenticated.authenticated}, admin=${result.unauthenticated.admin}`,
    );
  }
  if (result.authenticatedAdmin) {
    console.log(
      `Admin authenticated: authenticated=${result.authenticatedAdmin.authenticated}, admin=${result.authenticatedAdmin.admin}`,
    );
  }
  if (result.keyLeakScan) {
    console.log(`Key leak scan: ${result.keyLeakScan.ok ? "OK" : "FAIL"}`);
  }
  console.log("CMS writes: none");
  console.log("admin_users writes: none");
  console.log(`Overall: ${result.passed ? "PASS" : "FAIL"}`);
  console.log("");

  const report = formatAdminApiAuthReport({
    reportPath,
    result,
    elapsedMs: Date.now() - started,
  });

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report, "utf8");

  appendPhase3PAToConversionReport(astroDir, {
    passed: result.passed,
    host: result.host,
    endpoint: result.endpoint,
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
