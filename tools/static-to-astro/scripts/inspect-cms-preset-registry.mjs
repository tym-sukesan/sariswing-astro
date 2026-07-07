/**
 * G-23f — Inspect CMS preset registry.
 * Usage:
 *   node tools/static-to-astro/scripts/inspect-cms-preset-registry.mjs [--json]
 *   node tools/static-to-astro/scripts/inspect-cms-preset-registry.mjs --config <onboarding.json> [--json]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CMS_PRESET_REGISTRY,
  getCmsPreset,
  listCmsPresets,
  listPresetModules,
  validateCmsPresetConfig,
} from "./lib/cms-preset-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const DEFAULT_GOSAKI_CONFIG = path.join(
  TOOL_ROOT,
  "config/onboarding.gosaki-piano.example.json",
);

function parseArgs(argv) {
  const json = argv.includes("--json");
  const configIdx = argv.indexOf("--config");
  const configPath =
    configIdx >= 0 && argv[configIdx + 1] ? path.resolve(argv[configIdx + 1]) : DEFAULT_GOSAKI_CONFIG;
  return { json, configPath };
}

function buildReport(configPath) {
  const presets = listCmsPresets().map((p) => ({
    id: p.id,
    label: p.label,
    siteType: p.siteType,
    moduleCount: Object.keys(p.modules).length,
    defaultModules: p.defaultModules,
  }));

  const musicianModules = listPresetModules("musician-basic").map((m) => ({
    id: m.id,
    label: m.label,
    enabledByDefault: m.enabledByDefault,
    table: m.table,
    publicRoute: m.publicRoute,
    riskLevel: m.riskLevel,
  }));

  let configValidation = {
    configPath,
    loaded: false,
    presetValidation: null,
  };

  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    configValidation.loaded = true;
    configValidation.presetValidation = validateCmsPresetConfig(config);
  } else {
    configValidation.presetValidation = {
      ok: false,
      status: "FAIL",
      errors: [`config not found: ${configPath}`],
      warnings: [],
      presetId: null,
    };
  }

  return {
    phase: "G-23f-cms-preset-registry-inspect",
    presetCount: presets.length,
    presets,
    musicianBasicModules: musicianModules,
    configValidation,
    registryKeys: Object.keys(CMS_PRESET_REGISTRY),
  };
}

function printHuman(report) {
  console.log("\nCMS Preset Registry (G-23f)\n");
  console.log("Presets:");
  for (const p of report.presets) {
    console.log(
      `  - ${p.id} (${p.label}) · siteType=${p.siteType} · modules=${p.moduleCount} · defaults=[${p.defaultModules.join(", ")}]`,
    );
  }

  console.log("\nmusician-basic modules:");
  for (const m of report.musicianBasicModules) {
    console.log(
      `  - ${m.id} · enabledByDefault=${m.enabledByDefault} · route=${m.publicRoute} · table=${m.table ?? "null"} · risk=${m.riskLevel}`,
    );
  }

  const cv = report.configValidation;
  console.log(`\nConfig preset validation: ${cv.configPath}`);
  if (cv.presetValidation) {
    console.log(`  status: ${cv.presetValidation.status}`);
    if (cv.presetValidation.errors?.length) {
      for (const e of cv.presetValidation.errors) console.log(`  error: ${e}`);
    }
  }
  console.log("");
}

function main() {
  const { json, configPath } = parseArgs(process.argv.slice(2));
  const report = buildReport(configPath);

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHuman(report);
  }

  const ok = report.configValidation.presetValidation?.ok === true;
  process.exit(ok ? 0 : 1);
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  main();
}
