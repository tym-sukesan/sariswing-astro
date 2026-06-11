/**
 * G-6-d-staging-env-gate-client-fix — Env gate client fix reporter (docs/code scan only).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
const REPO_ROOT = path.resolve(DEFAULT_TOOL_ROOT, "../..");

const DOC_REL = "docs/staging-env-gate-client-fix.md";
const CONFIG_REL = "config/admin/staging-env-gate-client-fix.json";
const SERVER_GATES_REL = "src/lib/admin/staging-shell/staging-shell-server-gates.ts";
const CLIENT_GATES_REL = "src/lib/admin/staging-shell/staging-shell-client-gates.ts";
const PROTOTYPE_REL =
  "tools/static-to-astro/templates/admin-cms/prototypes/musician-basic-admin-prototype.astro";
const GATE_ELEMENT_ID = "staging-shell-server-gates";

const REQUIRED_DOC_SECTIONS = [
  "## 1. Purpose",
  "## 2. Incident summary",
  "## 3. Root cause",
  "## 4. Fix strategy",
  "## 5. Updated local dry-run command",
  "## 6. Expected debug panel result",
  "## 7. Non-dry-run remains blocked",
  "## 8. Completion criteria",
  "## 9. Final safety statement",
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
 * @param {string} [opts.toolRoot]
 * @param {string} [opts.siteId]
 */
export function runStagingEnvGateClientFixReport({
  toolRoot = DEFAULT_TOOL_ROOT,
  siteId = "default",
}) {
  /** @type {string[]} */
  const blockers = [];

  const docPath = path.join(toolRoot, DOC_REL);
  const configPath = path.join(toolRoot, CONFIG_REL);
  const docContent = fs.existsSync(docPath)
    ? fs.readFileSync(docPath, "utf8")
    : "";

  if (!docContent) blockers.push("fix-doc-missing");
  if (!fs.existsSync(configPath)) blockers.push("fix-config-missing");

  for (const heading of REQUIRED_DOC_SECTIONS) {
    if (!docContent.includes(heading)) {
      blockers.push(`doc-section-missing:${heading}`);
    }
  }

  const serverGatesPath = path.join(REPO_ROOT, SERVER_GATES_REL);
  const clientGatesPath = path.join(REPO_ROOT, CLIENT_GATES_REL);
  const prototypePath = path.join(REPO_ROOT, PROTOTYPE_REL);

  if (!fs.existsSync(serverGatesPath)) blockers.push("server-gates-module-missing");
  if (!fs.existsSync(clientGatesPath)) blockers.push("client-gates-module-missing");

  const prototypeContent = fs.existsSync(prototypePath)
    ? fs.readFileSync(prototypePath, "utf8")
    : "";
  if (!prototypeContent.includes("getStagingShellServerGateSnapshot")) {
    blockers.push("prototype-missing-server-gate-injection");
  }
  if (!prototypeContent.includes(GATE_ELEMENT_ID)) {
    blockers.push("prototype-missing-gate-element-id");
  }

  const authConfig = fs.readFileSync(
    path.join(REPO_ROOT, "src/lib/admin/staging-auth/staging-auth-config.ts"),
    "utf8",
  );
  const writeConfig = fs.readFileSync(
    path.join(REPO_ROOT, "src/lib/admin/staging-write/staging-write-config.ts"),
    "utf8",
  );

  if (!authConfig.includes("mergeStagingShellEnv")) {
    blockers.push("auth-config-missing-merge");
  }
  if (!writeConfig.includes("mergeStagingShellEnv")) {
    blockers.push("write-config-missing-merge");
  }

  const reportScriptPath = path.join(
    toolRoot,
    "scripts/report-staging-env-gate-client-fix.mjs",
  );
  const scriptScan = scanReporterForUnsafeCode(reportScriptPath);
  if (!scriptScan.clean) {
    blockers.push(`report-script-unsafe:${scriptScan.hits.join(",")}`);
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.nonDryRunExecuted !== false) {
    blockers.push("config-nonDryRunExecuted-not-false");
  }

  const fixComplete = blockers.length === 0;

  return {
    phase: "G-6-d-staging-env-gate-client-fix",
    siteId,
    generatedAt: new Date().toISOString(),
    envGateClientFixComplete: fixComplete,
    authEnabledDiagnosticAccurate: config.authEnabledDiagnosticAccurate ?? true,
    writeGateDiagnosticAccurate: config.writeGateDiagnosticAccurate ?? true,
    cursorSetsDryRunFalse: false,
    nonDryRunExecuted: false,
    dbWritePerformedByCursor: false,
    readyForManualNonDryRunExecution: false,
    readyForG6E: false,
    adminRouteConnected: false,
    productionDataTouched: false,
    blockers,
    fixComplete,
  };
}

/**
 * @param {ReturnType<typeof runStagingEnvGateClientFixReport>} report
 */
export function formatFixMarkdown(report) {
  const lines = [
    "# Staging Env Gate Client Fix Report",
    "",
    `**Phase:** ${report.phase}`,
    `**Site:** ${report.siteId}`,
    `**Generated:** ${report.generatedAt}`,
    "",
    "## Flags",
    "",
    "| Flag | Value |",
    "| --- | --- |",
    `| envGateClientFixComplete | ${report.envGateClientFixComplete} |`,
    `| authEnabledDiagnosticAccurate | ${report.authEnabledDiagnosticAccurate} |`,
    `| writeGateDiagnosticAccurate | ${report.writeGateDiagnosticAccurate} |`,
    `| nonDryRunExecuted | ${report.nonDryRunExecuted} |`,
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
 * @param {ReturnType<typeof runStagingEnvGateClientFixReport>} report
 */
export function writeFixOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "staging-env-gate-client-fix.json");
  const mdPath = path.join(outDir, "STAGING_ENV_GATE_CLIENT_FIX_REPORT.md");
  const summary = {
    phase: report.phase,
    envGateClientFixComplete: report.envGateClientFixComplete,
    authEnabledDiagnosticAccurate: report.authEnabledDiagnosticAccurate,
    writeGateDiagnosticAccurate: report.writeGateDiagnosticAccurate,
    cursorSetsDryRunFalse: report.cursorSetsDryRunFalse,
    nonDryRunExecuted: report.nonDryRunExecuted,
    dbWritePerformedByCursor: report.dbWritePerformedByCursor,
    readyForManualNonDryRunExecution: report.readyForManualNonDryRunExecution,
    readyForG6E: report.readyForG6E,
    adminRouteConnected: report.adminRouteConnected,
    productionDataTouched: report.productionDataTouched,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  fs.writeFileSync(mdPath, `${formatFixMarkdown(report)}\n`, "utf8");
  return { jsonPath, mdPath };
}
