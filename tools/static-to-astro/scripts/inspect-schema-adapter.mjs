#!/usr/bin/env node
/**
 * Inspect CMS schema adapters (G-5e read-only).
 * No upload, DB update, FTP, or site generation.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/inspect-schema-adapter.mjs \
 *     --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
 *
 *   node tools/static-to-astro/scripts/inspect-schema-adapter.mjs \
 *     --adapter-id musician-basic-supabase-v1
 *
 *   node tools/static-to-astro/scripts/inspect-schema-adapter.mjs \
 *     --template-id musician-basic
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectSchemaAdapter } from "./lib/schema-adapter-loader.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/inspect-schema-adapter.mjs [options]

Inspect CMS schema adapter metadata (read-only). No upload / DB / FTP.

Options:
  --site-config PATH   Site config JSON — resolve template + adapter + validate
  --adapter-id ID      Inspect a single adapter by ID
  --template-id ID     List / resolve adapter for templateId
  --adapters PATH      Override adapters JSON (default: config/schema-adapters/cms-schema-adapters.json)
  --registry PATH      Override template registry JSON
  --report PATH        Optional INSPECTION_REPORT.md output
  --manifest PATH      Optional inspection-result.json output
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    siteConfig: null,
    adapterId: null,
    templateId: null,
    adapters: null,
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
    if (arg === "--adapter-id") {
      opts.adapterId = argv[++i];
      continue;
    }
    if (arg === "--template-id") {
      opts.templateId = argv[++i];
      continue;
    }
    if (arg === "--adapters") {
      opts.adapters = argv[++i];
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
 * @param {ReturnType<typeof inspectSchemaAdapter>} result
 */
function formatInspectionReport(result) {
  const lines = [
    "# CMS Schema Adapter Inspection Report (G-5e)",
    "",
    `**Mode:** ${result.mode}`,
    `**Phase:** ${result.phase}`,
    `**Adapters:** \`${result.adaptersPath}\``,
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
    `| schemaAdapterId | ${result.schemaAdapterId ?? "(n/a)"} |`,
    `| provider | ${result.provider ?? "(n/a)"} |`,
    `| adapter status | ${result.adapterStatus ?? "(n/a)"} |`,
    `| validation OK | ${result.validationOk ? "yes" : "no"} |`,
    `| upload performed | **false** |`,
    `| db update performed | **false** |`,
    `| ftp deploy performed | **false** |`,
    "",
  ];

  if (result.siteConfigPath) {
    lines.push(`**Site config:** \`${result.siteConfigPath}\``, "");
  }

  if (result.adapterDescription) {
    lines.push("## Description", "", result.adapterDescription, "");
  }

  if (result.tables?.length) {
    lines.push(
      "## Tables",
      "",
      "| table | model | required | legacyId strategy |",
      "| --- | --- | --- | --- |",
    );
    for (const t of result.tables) {
      lines.push(
        `| ${t.table} | ${t.model} | ${t.required ? "yes" : "no"} | ${t.legacyId?.strategy ?? "—"} |`,
      );
    }
    lines.push("");
  }

  if (result.requiredColumns?.length) {
    lines.push("## Required columns", "");
    for (const c of result.requiredColumns) lines.push(`- ${c}`);
    lines.push("");
  }

  if (result.storageMappings?.length) {
    lines.push(
      "## Storage mappings",
      "",
      "| assetType | targetTable | targetColumn | human review | provenWith |",
      "| --- | --- | --- | --- | --- |",
    );
    for (const m of result.storageMappings) {
      lines.push(
        `| ${m.assetType} | ${m.targetTable} | ${m.targetColumn} | ${m.humanReviewRequired ? "yes" : "no"} | ${(m.provenWith ?? []).join(", ") || "—"} |`,
      );
    }
    lines.push("");
  }

  if (result.humanReviewRules?.length) {
    lines.push("## Human review rules", "");
    for (const r of result.humanReviewRules) {
      lines.push(`- **${r.ruleId}** (${(r.appliesTo ?? []).join(", ")}): ${r.condition} → ${r.defaultAction}`);
    }
    lines.push("");
  }

  if (result.candidatesForTemplate?.length) {
    lines.push("## Adapters for templateId", "", "| adapterId | status |", "| --- | --- |");
    for (const c of result.candidatesForTemplate) {
      lines.push(`| ${c.adapterId} | ${c.status} |`);
    }
    lines.push("");
  }

  if (result.validationWarnings?.length) {
    lines.push("## Validation warnings", "");
    for (const w of result.validationWarnings) lines.push(`- ${w}`);
    lines.push("");
  }

  if (result.validationErrors?.length) {
    lines.push("## Validation errors", "");
    for (const e of result.validationErrors) lines.push(`- ${e}`);
    lines.push("");
  }

  if (result.openQuestions?.length) {
    lines.push("## Open questions", "");
    for (const q of result.openQuestions) lines.push(`- ${q}`);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function printSummary(result) {
  console.log("");
  console.log("=== CMS Schema Adapter Inspection (G-5e) ===");
  console.log(`mode: ${result.mode}`);
  console.log(`adapters: ${result.adaptersPath}`);
  if (result.siteConfigPath) {
    console.log(`site config: ${result.siteConfigPath}`);
    console.log(`config driven: ${result.configDriven}`);
  }
  console.log(`siteSlug: ${result.siteSlug ?? "(n/a)"}`);
  console.log(`siteType: ${result.siteType ?? "(n/a)"}`);
  console.log(`templateId: ${result.templateId ?? "(n/a)"}`);
  console.log(`template status: ${result.templateStatus ?? "(n/a)"}`);
  console.log(`schemaAdapterId: ${result.schemaAdapterId ?? "(n/a)"}`);
  console.log(`provider: ${result.provider ?? "(n/a)"}`);
  console.log(`adapter status: ${result.adapterStatus ?? "(n/a)"}`);
  console.log(`tables: ${result.tables?.length ?? 0}`);
  console.log(`models: ${(result.models ?? []).join(", ") || "(none)"}`);
  console.log(`required columns: ${result.requiredColumns?.length ?? 0}`);
  console.log(`storage mappings: ${result.storageMappings?.length ?? 0}`);
  console.log(
    `human review required (assets): ${(result.humanReviewRequiredAssetTypes ?? []).join(", ") || "(none)"}`,
  );
  console.log(`human review rules: ${result.humanReviewRules?.length ?? 0}`);
  console.log(`validation OK: ${result.validationOk ? "yes" : "no"}`);
  console.log(`uploadPerformed: false`);
  console.log(`dbUpdatePerformed: false`);
  console.log(`ftpDeployPerformed: false`);

  if (result.legacyIdRules?.length) {
    console.log("legacyId rules:");
    for (const r of result.legacyIdRules) {
      const lid = r.legacyId;
      console.log(
        `  - ${r.table}: ${lid?.strategy ?? "—"}${lid?.pattern ? ` (${lid.pattern})` : ""} e.g. ${lid?.example ?? "—"}`,
      );
    }
  }

  if (result.storageMappings?.length) {
    console.log("storage mappings:");
    for (const m of result.storageMappings) {
      console.log(
        `  - ${m.assetType} → ${m.targetTable}.${m.targetColumn} humanReview=${m.humanReviewRequired ? "yes" : "no"}`,
      );
    }
  }

  if (result.candidatesForTemplate?.length) {
    console.log("adapter candidates:");
    for (const c of result.candidatesForTemplate) {
      console.log(`  - ${c.adapterId} (${c.status})`);
    }
  }

  if (result.validationWarnings?.length) {
    console.log("validation warnings:");
    for (const w of result.validationWarnings) console.warn(`  WARN: ${w}`);
  }
  if (result.validationErrors?.length) {
    console.log("validation errors:");
    for (const e of result.validationErrors) console.error(`  ERROR: ${e}`);
  }
  if (result.openQuestions?.length) {
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

  if (!opts.siteConfig && !opts.adapterId && !opts.templateId) {
    printHelp();
    process.exit(1);
  }

  const adaptersPath = opts.adapters ? path.resolve(REPO_ROOT, opts.adapters) : null;
  const registryPath = opts.registry ? path.resolve(REPO_ROOT, opts.registry) : null;

  console.log("CMS schema adapter inspection (G-5e read-only)");
  if (opts.siteConfig) console.log(`Site config: ${opts.siteConfig}`);
  if (opts.adapterId) console.log(`Adapter ID: ${opts.adapterId}`);
  if (opts.templateId) console.log(`Template ID: ${opts.templateId}`);
  console.log("");

  const result = inspectSchemaAdapter({
    siteConfigPath: opts.siteConfig,
    adapterId: opts.adapterId,
    templateId: opts.templateId,
    adaptersPath,
    templateRegistryPath: registryPath,
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

  if (!result.validationOk || result.validationErrors?.length) {
    process.exit(1);
  }
}

main();
