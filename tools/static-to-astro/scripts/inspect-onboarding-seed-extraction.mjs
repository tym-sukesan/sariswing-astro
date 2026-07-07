/**
 * G-23g — Inspect onboarding seed extraction.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/inspect-onboarding-seed-extraction.mjs \
 *     <onboarding-config.json> <fixture-crawl-result.json> [--json]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateCmsPresetConfig } from "./lib/cms-preset-registry.mjs";
import {
  extractOnboardingSeedCandidates,
  listSupportedSeedModules,
  summarizeSeedExtraction,
} from "./lib/onboarding-seed-extractor.mjs";
import { validateOnboardingConfig } from "./validate-onboarding-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  const json = argv.includes("--json");
  const positional = argv.filter((a) => a !== "--json");
  return {
    json,
    configPath: positional[0] ? path.resolve(positional[0]) : null,
    fixturePath: positional[1] ? path.resolve(positional[1]) : null,
  };
}

/**
 * @param {string} configPath
 * @param {string} fixturePath
 */
function buildReport(configPath, fixturePath) {
  /** @type {string[]} */
  const fatalErrors = [];

  let config;
  let fixture;

  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (err) {
    fatalErrors.push(`config read/parse error: ${err.message}`);
  }

  try {
    fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  } catch (err) {
    fatalErrors.push(`fixture read/parse error: ${err.message}`);
  }

  if (fatalErrors.length > 0) {
    return {
      phase: "G-23g-onboarding-seed-extraction-inspect",
      configPath,
      fixturePath,
      fatalErrors,
      ok: false,
      status: "FAIL",
    };
  }

  const configValidation = validateOnboardingConfig(config, {
    label: path.basename(configPath),
  });
  const registryValidation = validateCmsPresetConfig(config);
  const extraction = extractOnboardingSeedCandidates(config, fixture);

  return {
    phase: "G-23g-onboarding-seed-extraction-inspect",
    configPath,
    fixturePath,
    supportedModules: listSupportedSeedModules(),
    configValidation: {
      status: configValidation.ok ? "PASS" : "FAIL",
      errors: configValidation.errors,
      warnings: configValidation.warnings,
    },
    registryValidation: {
      status: registryValidation.status,
      errors: registryValidation.errors,
      warnings: registryValidation.warnings,
    },
    extraction: {
      status: extraction.status,
      siteSlug: extraction.siteSlug,
      presetId: extraction.presetId,
      summary: summarizeSeedExtraction(extraction),
      errors: extraction.errors,
      warnings: extraction.warnings,
    },
    moduleCandidateCounts: Object.fromEntries(
      Object.entries(extraction.summary?.byModule ?? {}).map(([id, m]) => [id, m.candidateCount]),
    ),
    ok:
      configValidation.ok &&
      registryValidation.ok &&
      extraction.ok,
    status:
      !configValidation.ok || !registryValidation.ok
        ? "FAIL"
        : extraction.status,
    fatalErrors: [],
  };
}

/**
 * @param {ReturnType<typeof buildReport>} report
 */
function printHuman(report) {
  console.log("\nG-23g Onboarding seed extraction inspect\n");

  if (report.fatalErrors?.length) {
    console.log("Fatal errors:");
    for (const e of report.fatalErrors) console.log(`  - ${e}`);
    console.log("");
    return;
  }

  console.log(`Config: ${report.configPath}`);
  console.log(`Fixture: ${report.fixturePath}`);
  console.log(`Supported modules: ${report.supportedModules?.join(", ")}`);
  console.log(`\nConfig validation: ${report.configValidation?.status}`);
  console.log(`Registry validation: ${report.registryValidation?.status}`);
  console.log(`Seed extraction: ${report.extraction?.status}`);

  console.log("\nModule candidate counts:");
  for (const [modId, count] of Object.entries(report.moduleCandidateCounts ?? {})) {
    console.log(`  - ${modId}: ${count}`);
  }

  const total = report.extraction?.summary?.totalCandidates ?? 0;
  console.log(`\nTotal active candidates: ${total}`);

  if (report.extraction?.warnings?.length) {
    console.log("\nWarnings:");
    for (const w of report.extraction.warnings) console.log(`  - ${w}`);
  }

  if (report.extraction?.errors?.length) {
    console.log("\nErrors:");
    for (const e of report.extraction.errors) console.log(`  - ${e}`);
  }

  console.log("\nOperations NOT executed: crawl · DB · SQL · package · FTP · deploy · network\n");
}

function main() {
  const { json, configPath, fixturePath } = parseArgs(process.argv.slice(2));

  if (!configPath || !fixturePath) {
    console.error(
      "Usage: node inspect-onboarding-seed-extraction.mjs <onboarding-config.json> <fixture-crawl-result.json> [--json]",
    );
    process.exit(2);
  }

  const report = buildReport(configPath, fixturePath);

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHuman(report);
  }

  process.exit(report.ok ? 0 : 1);
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  main();
}
