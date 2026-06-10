/**
 * G-6-d-auth-session-display-investigation — Investigation reporter (docs/config scan only).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/staging-auth-session-display-investigation.md";
const CONFIG_REL = "config/admin/staging-auth-session-display-investigation.json";
const DEBUG_PANEL_REL =
  "templates/admin-cms/auth/components/AdminStagingAuthWriteDebugPanel.astro";
const GATE_DIAG_REL = "src/lib/admin/staging-auth/staging-auth-gate-diagnostics.ts";

const REQUIRED_DOC_SECTIONS = [
  "## 1. Purpose",
  "## 2. Incident summary",
  "## 3. Expected state before non-dry-run",
  "## 4. Current blocker",
  "## 5. Investigation findings",
  "## 6. Required env gates",
  "## 7. Proposed staging-only fix",
  "## 8. Write gate diagnostics",
  "## 9. Non-dry-run remains blocked",
  "## 10. Completion criteria",
  "## 11. Final safety statement",
];

const REQUIRED_PHRASES = [
  "No non-dry-run update is executed",
  "mock-allowlist",
  "admin_users not queried",
  "repo root",
  "Auth Session / Write Gate Debug Panel",
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
function readText(toolRoot, relPath) {
  const full = path.join(toolRoot, relPath);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "";
}

/**
 * @param {string} filePath
 */
function scanReporterForUnsafeCode(filePath) {
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
export function runStagingAuthSessionDisplayInvestigationReport({
  toolRoot = DEFAULT_TOOL_ROOT,
  siteId = "default",
}) {
  /** @type {string[]} */
  const blockers = [];

  const docContent = readText(toolRoot, DOC_REL);
  const configPath = path.join(toolRoot, CONFIG_REL);
  const repoRoot = path.resolve(toolRoot, "../..");
  const debugPanelPath = path.join(toolRoot, DEBUG_PANEL_REL);
  const gateDiagPath = path.join(repoRoot, GATE_DIAG_REL);
  const reportScriptPath = path.join(
    toolRoot,
    "scripts/report-staging-auth-session-display-investigation.mjs",
  );

  if (!docContent) blockers.push("investigation-doc-missing");
  if (!fs.existsSync(configPath)) blockers.push("investigation-config-missing");
  if (!fs.existsSync(debugPanelPath)) blockers.push("debug-panel-missing");
  if (!fs.existsSync(gateDiagPath)) blockers.push("gate-diagnostics-missing");

  for (const heading of REQUIRED_DOC_SECTIONS) {
    if (!docContent.includes(heading)) {
      blockers.push(`doc-section-missing:${heading}`);
    }
  }
  for (const phrase of REQUIRED_PHRASES) {
    if (!docContent.includes(phrase)) {
      blockers.push(`doc-phrase-missing:${phrase}`);
    }
  }

  const scriptScan = scanReporterForUnsafeCode(reportScriptPath);
  if (!scriptScan.clean) {
    blockers.push(`report-script-unsafe:${scriptScan.hits.join(",")}`);
  }

  let config = null;
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }

  if (config?.nonDryRunExecuted !== false) {
    blockers.push("config-nonDryRunExecuted-not-false");
  }
  if (config?.cursorSetsDryRunFalse !== false) {
    blockers.push("config-cursorSetsDryRunFalse-not-false");
  }
  if (!config?.writeGateDiagnosticsVisible) {
    blockers.push("write-gate-diagnostics-not-marked-visible");
  }

  const investigationComplete = blockers.length === 0;

  return {
    phase: "G-6-d-auth-session-display-investigation",
    siteId,
    generatedAt: new Date().toISOString(),
    nonDryRunAborted: config?.nonDryRunAborted ?? true,
    nonDryRunExecuted: false,
    cursorSetsDryRunFalse: false,
    dbWritePerformedByCursor: false,
    authSessionVisibleRequired: true,
    realUserEmailVisible: config?.realUserEmailVisible ?? false,
    mockUserVisible: config?.mockUserVisible ?? true,
    writeActionsDisabled: config?.writeActionsDisabled ?? true,
    writeGateDiagnosticsVisible: config?.writeGateDiagnosticsVisible ?? true,
    readyForManualNonDryRunExecution: false,
    readyForG6DResultReport: false,
    readyForG6E: false,
    adminRouteConnected: false,
    productionDataTouched: false,
    authSessionInvestigationComplete: investigationComplete,
    blockers,
    investigationComplete,
  };
}

/**
 * @param {ReturnType<typeof runStagingAuthSessionDisplayInvestigationReport>} report
 */
export function formatInvestigationMarkdown(report) {
  const lines = [
    "# Staging Auth Session Display Investigation Report",
    "",
    `**Phase:** ${report.phase}`,
    `**Site:** ${report.siteId}`,
    `**Generated:** ${report.generatedAt}`,
    "",
    "## Flags",
    "",
    "| Flag | Value |",
    "| --- | --- |",
    `| nonDryRunAborted | ${report.nonDryRunAborted} |`,
    `| nonDryRunExecuted | ${report.nonDryRunExecuted} |`,
    `| writeGateDiagnosticsVisible | ${report.writeGateDiagnosticsVisible} |`,
    `| readyForManualNonDryRunExecution | ${report.readyForManualNonDryRunExecution} |`,
    `| readyForG6E | ${report.readyForG6E} |`,
    "",
  ];
  if (report.blockers.length > 0) {
    lines.push("## Blockers", "", ...report.blockers.map((b) => `- ${b}`), "");
  }
  return lines.join("\n");
}

/**
 * @param {string} outDir
 * @param {ReturnType<typeof runStagingAuthSessionDisplayInvestigationReport>} report
 */
export function writeInvestigationOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(
    outDir,
    "staging-auth-session-display-investigation.json",
  );
  const mdPath = path.join(
    outDir,
    "STAGING_AUTH_SESSION_DISPLAY_INVESTIGATION_REPORT.md",
  );
  const summary = {
    phase: report.phase,
    nonDryRunAborted: report.nonDryRunAborted,
    nonDryRunExecuted: report.nonDryRunExecuted,
    cursorSetsDryRunFalse: report.cursorSetsDryRunFalse,
    dbWritePerformedByCursor: report.dbWritePerformedByCursor,
    authSessionVisibleRequired: report.authSessionVisibleRequired,
    mockUserVisible: report.mockUserVisible,
    writeActionsDisabled: report.writeActionsDisabled,
    readyForManualNonDryRunExecution: report.readyForManualNonDryRunExecution,
    readyForG6E: report.readyForG6E,
    adminRouteConnected: report.adminRouteConnected,
    productionDataTouched: report.productionDataTouched,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  fs.writeFileSync(mdPath, `${formatInvestigationMarkdown(report)}\n`, "utf8");
  return { jsonPath, mdPath };
}
