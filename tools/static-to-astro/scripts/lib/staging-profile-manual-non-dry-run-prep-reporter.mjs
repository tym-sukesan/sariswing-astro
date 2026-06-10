/**
 * G-6-d-manual-non-dry-run-prep — Manual non-dry-run prep reporter (docs/config scan only).
 * Cursor does not execute updates or set PUBLIC_ADMIN_WRITE_DRY_RUN=false.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/staging-profile-manual-non-dry-run-prep.md";
const CONFIG_REL = "config/admin/staging-profile-manual-non-dry-run-prep.json";
const DRY_RUN_CONFIG_REL =
  "config/admin/staging-profile-schema-apply-verification-and-dry-run-qa.json";

const REQUIRED_DOC_SECTIONS = [
  "## 1. Purpose",
  "## 2. Current gate status",
  "## 3. Scope of first non-dry-run update",
  "## 4. Confirm target row",
  "## 5. Before snapshot",
  "## 6. Confirm admin/editor role",
  "## 7. Confirm Auth user match",
  "## 8. Proposed minimal update payload",
  "## 9. Temporary env change procedure",
  "## 10. Manual execution procedure",
  "## 11. After verification SQL",
  "## 12. Rollback plan",
  "## 13. Abort conditions",
  "## 14. Manual non-dry-run result template",
  "## 15. Decision states",
  "## 16. Final safety statement",
];

const REQUIRED_DOC_PHRASES = [
  "Cursor must not execute the non-dry-run update",
  "Cursor must not set PUBLIC_ADMIN_WRITE_DRY_RUN=false",
  "bio-only",
  "static-to-astro-cms-staging",
  "MANUAL STAGING ROLLBACK ONLY",
];

const FORBIDDEN_SCRIPT_PATTERNS = [
  /\.update\s*\(/,
  /\.upsert\s*\(/,
  /\.delete\s*\(/,
  /createClient\s*\(/,
  /@supabase\/supabase-js/,
  /service_role/i,
  /SERVICE_ROLE/,
];

/**
 * @param {string} toolRoot
 * @param {string} relPath
 */
function readJson(toolRoot, relPath) {
  const full = path.join(toolRoot, relPath);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

/**
 * @param {string} content
 * @param {string[]} sections
 */
function sectionsPresent(content, sections) {
  return sections.map((heading) => ({
    heading,
    present: content.includes(heading),
  }));
}

/**
 * @param {string} filePath
 */
function scanReporterScriptForUnsafeCode(filePath) {
  if (!fs.existsSync(filePath)) return { clean: true, hits: [] };
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  /** @type {string[]} */
  const hits = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
    for (const pattern of FORBIDDEN_SCRIPT_PATTERNS) {
      if (pattern.test(line)) hits.push(pattern.source);
    }
  }
  return { clean: hits.length === 0, hits: [...new Set(hits)] };
}

/**
 * @param {object} opts
 * @param {string} opts.toolRoot
 * @param {string} [opts.siteId]
 */
export async function runStagingProfileManualNonDryRunPrepReport({
  toolRoot = DEFAULT_TOOL_ROOT,
  siteId = "default",
}) {
  const docPath = path.join(toolRoot, DOC_REL);
  const configPath = path.join(toolRoot, CONFIG_REL);
  const reportScriptPath = path.join(
    toolRoot,
    "scripts/report-staging-profile-manual-non-dry-run-prep.mjs",
  );

  /** @type {string[]} */
  const blockers = [];

  if (!fs.existsSync(docPath)) blockers.push("prep-doc-missing");
  if (!fs.existsSync(configPath)) blockers.push("prep-config-missing");

  const docContent = fs.existsSync(docPath)
    ? fs.readFileSync(docPath, "utf8")
    : "";
  const sectionChecks = sectionsPresent(docContent, REQUIRED_DOC_SECTIONS);
  for (const s of sectionChecks) {
    if (!s.present) blockers.push(`doc-section-missing:${s.heading}`);
  }
  for (const phrase of REQUIRED_DOC_PHRASES) {
    if (!docContent.includes(phrase)) {
      blockers.push(`doc-phrase-missing:${phrase}`);
    }
  }

  const scriptScan = scanReporterScriptForUnsafeCode(reportScriptPath);
  if (!scriptScan.clean) {
    blockers.push(`report-script-unsafe:${scriptScan.hits.join(",")}`);
  }

  const config = readJson(toolRoot, CONFIG_REL);
  const dryRunConfig = readJson(toolRoot, DRY_RUN_CONFIG_REL);

  if (config?.cursorExecutesUpdate !== false) {
    blockers.push("config-cursorExecutesUpdate-not-false");
  }
  if (config?.cursorSetsDryRunFalse !== false) {
    blockers.push("config-cursorSetsDryRunFalse-not-false");
  }
  if (config?.nonDryRunExecuted !== false) {
    blockers.push("config-nonDryRunExecuted-not-false");
  }
  if (config?.recommendedFirstChange !== "bio-only") {
    blockers.push("config-recommendedFirstChange-not-bio-only");
  }

  const dryRunPassed =
    config?.dryRunPassed === true || dryRunConfig?.dryRunPassed === true;
  if (!dryRunPassed) blockers.push("dry-run-not-passed");

  const prepComplete = blockers.length === 0;

  return {
    phase: "G-6-d-manual-non-dry-run-prep",
    siteId,
    generatedAt: new Date().toISOString(),
    schemaApplied: config?.schemaApplied ?? true,
    dryRunPassed,
    readyForManualNonDryRunDecision:
      config?.readyForManualNonDryRunDecision ?? true,
    cursorExecutesUpdate: false,
    cursorSetsDryRunFalse: false,
    intendedProject: config?.intendedProject ?? "static-to-astro-cms-staging",
    targetTable: config?.targetTable ?? "profile",
    operation: config?.operation ?? "update",
    recommendedFirstChange: config?.recommendedFirstChange ?? "bio-only",
    nonDryRunExecuted: false,
    readyForManualNonDryRunExecution:
      config?.readyForManualNonDryRunExecution ?? false,
    readyForG6DResultReport: false,
    readyForG6E: false,
    adminRouteConnected: false,
    productionDataTouched: false,
    planDocSections: sectionChecks,
    blockers,
    prepComplete,
  };
}

/**
 * @param {ReturnType<typeof runStagingProfileManualNonDryRunPrepReport>} report
 */
export function formatStagingProfileManualNonDryRunPrepMarkdown(report) {
  const lines = [
    "# Staging Profile Manual Non-dry-run Prep Report",
    "",
    `**Phase:** ${report.phase}`,
    `**Site:** ${report.siteId}`,
    `**Generated:** ${report.generatedAt}`,
    "",
    "## Flags",
    "",
    "| Flag | Value |",
    "| --- | --- |",
    `| schemaApplied | ${report.schemaApplied} |`,
    `| dryRunPassed | ${report.dryRunPassed} |`,
    `| readyForManualNonDryRunDecision | ${report.readyForManualNonDryRunDecision} |`,
    `| cursorExecutesUpdate | ${report.cursorExecutesUpdate} |`,
    `| cursorSetsDryRunFalse | ${report.cursorSetsDryRunFalse} |`,
    `| targetTable | ${report.targetTable} |`,
    `| operation | ${report.operation} |`,
    `| recommendedFirstChange | ${report.recommendedFirstChange} |`,
    `| nonDryRunExecuted | ${report.nonDryRunExecuted} |`,
    `| readyForManualNonDryRunExecution | ${report.readyForManualNonDryRunExecution} |`,
    `| readyForG6DResultReport | ${report.readyForG6DResultReport} |`,
    `| readyForG6E | ${report.readyForG6E} |`,
    "",
    "Cursor does not execute the non-dry-run update.",
    "",
  ];

  if (report.blockers.length > 0) {
    lines.push("## Blockers", "", ...report.blockers.map((b) => `- ${b}`), "");
  }

  return lines.join("\n");
}

/**
 * @param {string} outDir
 * @param {ReturnType<typeof runStagingProfileManualNonDryRunPrepReport>} report
 */
export function writeStagingProfileManualNonDryRunPrepOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(
    outDir,
    "staging-profile-manual-non-dry-run-prep.json",
  );
  const mdPath = path.join(
    outDir,
    "STAGING_PROFILE_MANUAL_NON_DRY_RUN_PREP_REPORT.md",
  );
  const summary = {
    phase: report.phase,
    schemaApplied: report.schemaApplied,
    dryRunPassed: report.dryRunPassed,
    readyForManualNonDryRunDecision: report.readyForManualNonDryRunDecision,
    cursorExecutesUpdate: report.cursorExecutesUpdate,
    cursorSetsDryRunFalse: report.cursorSetsDryRunFalse,
    intendedProject: report.intendedProject,
    targetTable: report.targetTable,
    operation: report.operation,
    recommendedFirstChange: report.recommendedFirstChange,
    nonDryRunExecuted: report.nonDryRunExecuted,
    readyForManualNonDryRunExecution: report.readyForManualNonDryRunExecution,
    readyForG6DResultReport: report.readyForG6DResultReport,
    readyForG6E: report.readyForG6E,
    adminRouteConnected: report.adminRouteConnected,
    productionDataTouched: report.productionDataTouched,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    mdPath,
    `${formatStagingProfileManualNonDryRunPrepMarkdown(report)}\n`,
    "utf8",
  );
  return { jsonPath, mdPath };
}
