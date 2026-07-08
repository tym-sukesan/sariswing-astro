/**
 * G-23n — Inspect onboarding crawl allowlist config.
 * Static validation only — no DNS / HTTP / network.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/inspect-onboarding-crawl-allowlist.mjs <config.json> [--json]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ALLOWLIST_VERSION,
  LIMITS,
  PROD_REF,
  validateOnboardingCrawlAllowlist,
} from "./lib/onboarding-crawl-allowlist.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const DEFAULT_CONFIG = path.join(TOOL_ROOT, "config/onboarding.crawl-allowlist.example.json");

function parseArgs(argv) {
  const json = argv.includes("--json");
  const positional = argv.filter((a) => !a.startsWith("-"));
  const configPath = positional[0] ? path.resolve(positional[0]) : DEFAULT_CONFIG;
  return { json, configPath };
}

function humanVerdict(result) {
  if (result.status === "PASS_WITH_NOT_READY") return "NOT READY (safe — live crawl not armed)";
  if (result.status === "PASS") return "SAFE (armed and valid)";
  if (result.status === "WARN") return "SAFE WITH WARNINGS";
  return "FAIL (unsafe or invalid)";
}

function printHuman(configPath, config, result) {
  console.log("\nG-23n Onboarding crawl allowlist inspect");
  console.log(`Config: ${configPath}`);
  console.log(`Version: ${config.version ?? "unknown"} (expected ${ALLOWLIST_VERSION})`);
  console.log(`Purpose: ${config.purpose ?? "—"}`);
  console.log(`readyForLiveCrawl: ${config.readyForLiveCrawl === true}`);
  console.log(`Verdict: ${humanVerdict(result)}`);
  console.log(`Status: ${result.status}`);
  console.log(`Allowed targets: ${result.allowedTargetCount ?? 0}`);
  console.log(`Limits: maxPages<=${LIMITS.maxPages} · concurrency<=${LIMITS.maxConcurrency} · timeout<=${LIMITS.maxRequestTimeoutMs}ms`);

  if (result.explicitCrawlApprovalId) {
    console.log(`Approval ID: ${result.explicitCrawlApprovalId}`);
  }

  if (result.errors?.length) {
    console.log("\nErrors:");
    for (const e of result.errors) console.log(`  - ${e}`);
  }

  if (result.warnings?.length) {
    console.log("\nWarnings:");
    for (const w of result.warnings) console.log(`  - ${w}`);
  }

  if (Array.isArray(config.deniedTargets) && config.deniedTargets.length) {
    console.log("\nDenied target patterns:");
    for (const d of config.deniedTargets.slice(0, 8)) {
      const label = d.label ?? d.pattern ?? JSON.stringify(d);
      console.log(`  - ${label}`);
    }
    if (config.deniedTargets.length > 8) {
      console.log(`  ... +${config.deniedTargets.length - 8} more`);
    }
  }

  console.log("\nOperations NOT executed: live crawl · DNS · network · DB · SQL · package · FTP · deploy");
  console.log(`Forbidden production ref ${PROD_REF}: not used as active target\n`);
}

function main() {
  const { json, configPath } = parseArgs(process.argv.slice(2));

  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (err) {
    const fail = {
      ok: false,
      status: "FAIL",
      configPath,
      errors: [`read/parse error: ${err.message}`],
      warnings: [],
      networkAccess: false,
      dnsLookupAttempted: false,
    };
    if (json) {
      console.log(JSON.stringify(fail, null, 2));
    } else {
      console.error(`FAIL: ${fail.errors[0]}`);
    }
    process.exit(1);
  }

  const result = validateOnboardingCrawlAllowlist(config, { label: configPath });
  const report = {
    phase: "G-23n-crawl-allowlist-inspect",
    configPath,
    ...result,
    verdict: humanVerdict(result),
    limits: LIMITS,
    forbiddenProductionRef: PROD_REF,
    liveCrawlExecuted: false,
    networkAccess: false,
    dnsLookupAttempted: false,
  };

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHuman(configPath, config, result);
  }

  if (result.status === "FAIL") process.exit(1);
  process.exit(0);
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  main();
}

export { parseArgs, humanVerdict };
