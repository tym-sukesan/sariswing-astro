/**
 * G-6-d-auth-status-denied-fix — Reporter (docs/code scan only).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
const REPO_ROOT = path.resolve(DEFAULT_TOOL_ROOT, "../..");

const DOC_REL = "docs/staging-auth-status-denied-fix.md";
const CONFIG_REL = "config/admin/staging-auth-status-denied-fix.json";
const DISPLAY_TS = "src/lib/admin/staging-auth/staging-auth-display-status.ts";
const SESSION_TS = "src/lib/admin/staging-auth/staging-auth-session.ts";
const DEBUG_UI_TS = "src/lib/admin/staging-auth/staging-auth-write-debug-ui.ts";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Problem",
  "## 3. Root cause",
  "## 4. Fix",
  "## 5. Expected statuses",
  "## 6. Manual verification",
  "## 7. Safety notes",
  "## 8. Completion criteria",
];

const FORBIDDEN_IN_REPORTER = [
  /service_role/i,
  /SERVICE_ROLE/,
  /createClient\s*\(/,
  /@supabase\/supabase-js/,
];

function scanReporter(filePath) {
  if (!fs.existsSync(filePath)) return { clean: true, hits: [] };
  const hits = [];
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const t = line.trim();
    if (t.startsWith("//") || t.startsWith("*")) continue;
    for (const p of FORBIDDEN_IN_REPORTER) {
      if (p.test(line)) hits.push(p.source);
    }
  }
  return { clean: hits.length === 0, hits: [...new Set(hits)] };
}

export function runStagingAuthStatusDeniedFixReport({
  toolRoot = DEFAULT_TOOL_ROOT,
  siteId = "default",
}) {
  const blockers = [];
  const doc = fs.readFileSync(path.join(toolRoot, DOC_REL), "utf8");
  const configPath = path.join(toolRoot, CONFIG_REL);

  if (!fs.existsSync(configPath)) blockers.push("config-missing");
  for (const s of REQUIRED_SECTIONS) {
    if (!doc.includes(s)) blockers.push(`doc-missing:${s}`);
  }

  const displayPath = path.join(REPO_ROOT, DISPLAY_TS);
  const sessionPath = path.join(REPO_ROOT, SESSION_TS);
  const debugUiPath = path.join(REPO_ROOT, DEBUG_UI_TS);

  if (!fs.existsSync(displayPath)) blockers.push("display-status-ts-missing");
  if (!fs.existsSync(sessionPath)) blockers.push("session-ts-missing");
  if (!fs.existsSync(debugUiPath)) blockers.push("debug-ui-ts-missing");

  const displaySrc = fs.existsSync(displayPath)
    ? fs.readFileSync(displayPath, "utf8")
    : "";
  if (!displaySrc.includes('"authenticated"')) {
    blockers.push("authenticated-status-missing");
  }
  if (!displaySrc.includes("resolveStagingAuthDisplayStatus")) {
    blockers.push("resolver-missing");
  }

  const sessionSrc = fs.existsSync(sessionPath)
    ? fs.readFileSync(sessionPath, "utf8")
    : "";
  if (/mock-denied.*\?.*"denied"/.test(sessionSrc.replace(/\s+/g, " "))) {
    blockers.push("session-still-maps-mock-denied-to-denied");
  }

  const debugPanel = fs.readFileSync(
    path.join(
      REPO_ROOT,
      "tools/static-to-astro/templates/admin-cms/auth/components/AdminStagingAuthWriteDebugPanel.astro",
    ),
    "utf8",
  );
  if (!debugPanel.includes("debug-auth-detail")) {
    blockers.push("debug-panel-fields-missing");
  }
  if (!debugPanel.includes("debug-session-present")) {
    blockers.push("debug-panel-session-field-missing");
  }

  const debugUiSrc = fs.existsSync(debugUiPath)
    ? fs.readFileSync(debugUiPath, "utf8")
    : "";
  if (!debugUiSrc.includes("resolveStagingAuthDisplayStatus")) {
    blockers.push("debug-ui-not-wired");
  }
  if (debugUiSrc.includes('return "denied"')) {
    blockers.push("debug-ui-still-returns-denied");
  }

  const reportPath = path.join(
    toolRoot,
    "scripts/report-staging-auth-status-denied-fix.mjs",
  );
  const scan = scanReporter(reportPath);
  if (!scan.clean) blockers.push(`reporter-unsafe:${scan.hits.join(",")}`);

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.usesServiceRole !== false) blockers.push("config-usesServiceRole");
  if (config.nonDryRunExecuted !== false) blockers.push("config-nonDryRunExecuted");
  if (config.validSessionPrioritized !== true) {
    blockers.push("config-validSessionPrioritized");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-d-auth-status-denied-fix",
    siteId,
    generatedAt: new Date().toISOString(),
    stagingOnly: true,
    authStatusDeniedFixImplemented: complete,
    validSessionPrioritized: complete,
    staleRecoveryErrorDoesNotOverrideSession: complete,
    usesSupabaseAnonClient: true,
    usesServiceRole: false,
    profileUpdateExecuted: false,
    nonDryRunExecuted: false,
    cursorSetsDryRunFalse: false,
    dbWritePerformedByCursor: false,
    readyForAuthLoginRetry: complete,
    readyForManualNonDryRunExecution: false,
    readyForG6E: false,
    adminRouteConnected: false,
    productionAuthTouched: false,
    productionDataTouched: false,
    blockers,
    complete,
  };
}

export function writeAuthStatusDeniedFixOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "staging-auth-status-denied-fix.json");
  const mdPath = path.join(outDir, "STAGING_AUTH_STATUS_DENIED_FIX_REPORT.md");
  const summary = {
    phase: report.phase,
    stagingOnly: report.stagingOnly,
    authStatusDeniedFixImplemented: report.authStatusDeniedFixImplemented,
    validSessionPrioritized: report.validSessionPrioritized,
    staleRecoveryErrorDoesNotOverrideSession:
      report.staleRecoveryErrorDoesNotOverrideSession,
    usesSupabaseAnonClient: report.usesSupabaseAnonClient,
    usesServiceRole: report.usesServiceRole,
    profileUpdateExecuted: report.profileUpdateExecuted,
    nonDryRunExecuted: report.nonDryRunExecuted,
    readyForAuthLoginRetry: report.readyForAuthLoginRetry,
    readyForManualNonDryRunExecution: report.readyForManualNonDryRunExecution,
    readyForG6E: report.readyForG6E,
    adminRouteConnected: report.adminRouteConnected,
    productionDataTouched: report.productionDataTouched,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Staging Auth Status Denied Fix Report",
    "",
    `Phase: ${report.phase}`,
    `Complete: ${report.complete}`,
    "",
    report.blockers.length
      ? `Blockers:\n${report.blockers.map((b) => `- ${b}`).join("\n")}`
      : "No blockers.",
  ].join("\n");
  fs.writeFileSync(mdPath, `${md}\n`, "utf8");
  return { jsonPath, mdPath };
}
