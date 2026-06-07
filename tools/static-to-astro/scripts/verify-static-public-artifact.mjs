#!/usr/bin/env node
/**
 * Verify static public artifact for FTP deploy (Phase 3-T).
 *
 * Usage:
 *   node tools/static-to-astro/scripts/verify-static-public-artifact.mjs \
 *     --astro-dir tools/static-to-astro/output/generated-astro \
 *     --report tools/static-to-astro/output/static-public/gosaki/STATIC_PUBLIC_ARTIFACT_REPORT.md
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatStaticPublicArtifactReport,
  runStaticPublicArtifactVerification,
} from "./lib/static-public-artifact-verifier.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/verify-static-public-artifact.mjs [options]

Verify dist/client (or dist) is safe for static FTP after excluding Admin paths.

Options:
  --astro-dir PATH     generated-astro directory (required)
  --report PATH        STATIC_PUBLIC_ARTIFACT_REPORT.md output (required)
  --public-dir PATH    Override public artifact dir (default: dist/client → dist)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    astroDir: null,
    report: null,
    publicDir: null,
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
    if (arg === "--public-dir") {
      opts.publicDir = argv[++i];
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

function printSummary(result) {
  console.log("");
  console.log("=== Static Public Artifact Summary ===");
  console.log(`public dir detected: ${result.publicDirExists ? "yes" : "no"} (${result.publicDirKind ?? "—"})`);
  console.log(`public HTML exists: ${result.publicHtml?.allPresent ? "yes" : "no"}`);
  console.log(
    `Admin/API in raw public dir: ${result.rawClientContamination?.contaminated ? "yes (admin HTML in dist/client)" : "no"}`,
  );
  console.log(`dist/server present: ${result.serverArtifact?.exists ? "yes (Node only)" : "no"}`);
  console.log(`key leak scan (raw): ${result.keyLeakScan?.ok ? "OK" : "FAIL"}`);
  console.log(
    `Supabase keys needed in public-dist: ${result.supabaseKeyScanCopy?.publicStaticDoesNotNeedSupabaseKeys ? "no" : "review"}`,
  );
  console.log(`static-public copy files: ${result.staticPublicCopy?.copiedCount ?? 0}`);
  console.log(`excluded: ${result.staticPublicCopy?.excluded?.join(", ") ?? "—"}`);
  console.log(`safeForStaticFtp: ${result.safeForStaticFtp ? "true" : "false"}`);
  console.log(
    `direct dist/client FTP recommended: ${result.directClientUploadRecommended ? "yes" : "no — use public-dist"}`,
  );
  console.log(`result: ${result.passed ? "PASS" : "FAIL"}`);
  if (result.errors.length) {
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

  const manifestOutDir = path.dirname(reportPath);

  const started = Date.now();
  console.log("Static public artifact verification (Phase 3-T)");
  console.log(`Astro dir: ${opts.astroDir}`);
  console.log("");

  const result = runStaticPublicArtifactVerification({
    astroDir,
    toolRoot: TOOL_ROOT,
    publicDirCli: opts.publicDir,
    manifestOutDir,
  });

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(
    reportPath,
    formatStaticPublicArtifactReport(result, {
      reportPath: opts.report,
      elapsedMs: Date.now() - started,
    }),
    "utf8",
  );

  printSummary(result);
  console.log("");
  console.log(`Report: ${opts.report}`);
  if (result.manifestPath) {
    console.log(`Manifest: ${path.relative(REPO_ROOT, result.manifestPath)}`);
  }

  process.exit(result.passed ? 0 : 1);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
