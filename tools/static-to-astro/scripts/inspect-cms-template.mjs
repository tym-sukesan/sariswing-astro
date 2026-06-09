#!/usr/bin/env node
/**
 * Inspect CMS template registry (G-5d read-only).
 * No upload, DB update, FTP, or site generation.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/inspect-cms-template.mjs \
 *     --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
 *
 *   node tools/static-to-astro/scripts/inspect-cms-template.mjs \
 *     --template-id musician-basic
 *
 *   node tools/static-to-astro/scripts/inspect-cms-template.mjs \
 *     --site-type music-school
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectTemplateRegistry } from "./lib/template-registry-loader.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/inspect-cms-template.mjs [options]

Inspect CMS template registry metadata (read-only). No upload / DB / FTP.

Options:
  --site-config PATH   Site config JSON — validate templateId + siteType
  --template-id ID     Inspect a single template by ID
  --site-type TYPE     List templates for siteType (e.g. music-school)
  --registry PATH      Override registry JSON (default: config/templates/cms-template-registry.json)
  --report PATH        Optional INSPECTION_REPORT.md output
  --manifest PATH      Optional inspection-result.json output
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    siteConfig: null,
    templateId: null,
    siteType: null,
    registry: null,
    report: null,
    manifest: null,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--site-config") {
      opts.siteConfig = argv[++i];
      continue;
    }
    if (arg === "--template-id") {
      opts.templateId = argv[++i];
      continue;
    }
    if (arg === "--site-type") {
      opts.siteType = argv[++i];
      continue;
    }
    if (arg === "--registry") {
      opts.registry = argv[++i];
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
    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

/**
 * @param {ReturnType<typeof inspectTemplateRegistry>} result
 */
function formatInspectionReport(result) {
  const lines = [
    "# CMS Template Inspection Report (G-5d)",
    "",
    `**Mode:** ${result.mode}`,
    `**Phase:** ${result.phase}`,
    `**Registry:** \`${result.registryPath}\` (v${result.registryVersion})`,
    "",
    "> Read-only inspection. No upload, DB update, or FTP deploy.",
    "",
    "## Summary",
    "",
    "| Field | Value |",
    "| --- | --- |",
    `| siteSlug | ${result.siteSlug ?? "(n/a)"} |`,
    `| siteType | ${result.siteType ?? "(n/a)"} |`,
    `| templateId | ${result.templateId ?? "(n/a)"} |`,
    `| template status | ${result.templateStatus ?? "(n/a)"} |`,
    `| validation OK | ${result.validationOk ? "yes" : "no"} |`,
    `| upload performed | **false** |`,
    `| db update performed | **false** |`,
    `| ftp deploy performed | **false** |`,
    "",
  ];

  if (result.siteConfigPath) {
    lines.push(`**Site config:** \`${result.siteConfigPath}\``, "");
  }

  if (result.templateDescription) {
    lines.push("## Description", "", result.templateDescription, "");
  }

  if (result.contentModels.length) {
    lines.push("## Content models", "", "| model | required | source | human review |", "| --- | --- | --- | --- |");
    for (const m of result.contentModels) {
      lines.push(
        `| ${m.model} | ${m.required ? "yes" : "no"} | ${m.source ?? "—"} | ${m.humanReviewRequired ? "yes" : "no"} |`,
      );
    }
    lines.push("");
  }

  if (result.pages.length) {
    lines.push("## Pages", "", result.pages.map((p) => `- ${p}`).join("\n"), "");
  }

  if (result.storageAssetTypes.length) {
    lines.push(
      "## Storage asset types",
      "",
      "| assetType | table | column | human review |",
      "| --- | --- | --- | --- |",
    );
    for (const a of result.storageAssetTypes) {
      lines.push(
        `| ${a.assetType} | ${a.targetTable} | ${a.targetColumn} | ${a.humanReviewRequired ? "yes" : "no"} |`,
      );
    }
    lines.push("");
  }

  if (result.humanReviewRequiredAssetTypes.length) {
    lines.push("## Human review required (asset types)", "");
    for (const a of result.humanReviewRequiredAssetTypes) {
      lines.push(`- ${a}`);
    }
    lines.push("");
  }

  if (result.candidatesForSiteType?.length) {
    lines.push("## Templates for siteType", "", "| templateId | status |", "| --- | --- |");
    for (const c of result.candidatesForSiteType) {
      lines.push(`| ${c.templateId} | ${c.status} |`);
    }
    lines.push("");
  }

  if (result.warnings.length) {
    lines.push("## Warnings", "");
    for (const w of result.warnings) lines.push(`- ${w}`);
    lines.push("");
  }

  if (result.errors.length) {
    lines.push("## Errors", "");
    for (const e of result.errors) lines.push(`- ${e}`);
    lines.push("");
  }

  if (result.openQuestions.length) {
    lines.push("## Open questions", "");
    for (const q of result.openQuestions) lines.push(`- ${q}`);
    lines.push("");
  }

  if (result.notes.length) {
    lines.push("## Template notes", "");
    for (const n of result.notes) lines.push(`- ${n}`);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function printSummary(result) {
  console.log("");
  console.log("=== CMS Template Inspection (G-5d) ===");
  console.log(`mode: ${result.mode}`);
  console.log(`registry: ${result.registryPath} (v${result.registryVersion})`);
  if (result.siteConfigPath) {
    console.log(`site config: ${result.siteConfigPath}`);
    console.log(`config driven: ${result.configDriven}`);
  }
  console.log(`siteSlug: ${result.siteSlug ?? "(n/a)"}`);
  console.log(`siteType: ${result.siteType ?? "(n/a)"}`);
  console.log(`templateId: ${result.templateId ?? "(n/a)"}`);
  console.log(`template status: ${result.templateStatus ?? "(n/a)"}`);
  console.log(`content models: ${result.contentModels.length}`);
  console.log(`pages: ${result.pages.length}`);
  console.log(`storage asset types: ${result.storageAssetTypes.length}`);
  console.log(`human review required: ${result.humanReviewRequiredAssetTypes.join(", ") || "(none)"}`);
  console.log(`validation OK: ${result.validationOk ? "yes" : "no"}`);
  console.log(`upload performed: no`);
  console.log(`db update performed: no`);
  console.log(`ftp deploy performed: no`);

  if (result.candidatesForSiteType?.length) {
    console.log("candidates:");
    for (const c of result.candidatesForSiteType) {
      console.log(`  - ${c.templateId} (${c.status})`);
    }
  }

  if (result.warnings.length) {
    console.log("warnings:");
    for (const w of result.warnings) console.warn(`  WARN: ${w}`);
  }
  if (result.errors.length) {
    console.log("errors:");
    for (const e of result.errors) console.error(`  ERROR: ${e}`);
  }
  if (result.openQuestions.length) {
    console.log("open questions:");
    for (const q of result.openQuestions) console.log(`  ? ${q}`);
  }
}

function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  if (!opts.siteConfig && !opts.templateId && !opts.siteType) {
    printHelp();
    process.exit(1);
  }

  const registryPath = opts.registry ? path.resolve(REPO_ROOT, opts.registry) : null;
  const siteConfigPath = opts.siteConfig ? path.resolve(REPO_ROOT, opts.siteConfig) : null;

  console.log("CMS template inspection (G-5d read-only)");
  if (opts.siteConfig) console.log(`Site config: ${opts.siteConfig}`);
  if (opts.templateId) console.log(`Template ID: ${opts.templateId}`);
  if (opts.siteType) console.log(`Site type: ${opts.siteType}`);
  console.log("");

  const result = inspectTemplateRegistry({
    siteConfigPath: opts.siteConfig,
    templateId: opts.templateId,
    siteType: opts.siteType,
    registryPath,
    toolRoot: TOOL_ROOT,
  });

  const reportPath = opts.report ? path.resolve(REPO_ROOT, opts.report) : null;
  const manifestPath = opts.manifest ? path.resolve(REPO_ROOT, opts.manifest) : null;

  if (reportPath) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, formatInspectionReport(result), "utf8");
  }
  if (manifestPath) {
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  }

  printSummary(result);

  if (reportPath) console.log(`\nReport: ${opts.report}`);
  if (manifestPath) console.log(`Manifest: ${opts.manifest}`);

  if (!result.validationOk || result.errors.length) {
    process.exit(1);
  }
}

main();
