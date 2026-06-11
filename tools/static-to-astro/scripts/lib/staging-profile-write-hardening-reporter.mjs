/**
 * G-6-d-hardening — Reporter (docs/config scan only; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
const REPO_ROOT = path.resolve(DEFAULT_TOOL_ROOT, "../..");

const DOC_REL = "docs/staging-profile-write-hardening.md";
const CONFIG_REL = "config/admin/staging-profile-write-hardening.json";
const DEBUG_PANEL =
  "tools/static-to-astro/templates/admin-cms/auth/components/AdminStagingAuthWriteDebugPanel.astro";
const DEBUG_UI = "src/lib/admin/staging-auth/staging-auth-write-debug-ui.ts";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Current G-6-d success state",
  "## 3. Why hardening is needed",
  "## 4. updated_by hardening plan",
  "## 5. role display hardening plan",
  "## 6. Dry-run restore checklist",
  "## 7. RLS / GRANT hardening notes",
  "## 8. admin_users policy audit pre-check",
  "## 9. G-6-e gate",
  "## 10. Recommended next phases",
  "## 11. Final safety statement",
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

export function runStagingProfileWriteHardeningReport({
  toolRoot = DEFAULT_TOOL_ROOT,
  siteId = "default",
}) {
  const blockers = [];
  const docPath = path.join(toolRoot, DOC_REL);
  const configPath = path.join(toolRoot, CONFIG_REL);

  if (!fs.existsSync(docPath)) blockers.push("doc-missing");
  if (!fs.existsSync(configPath)) blockers.push("config-missing");

  const doc = fs.existsSync(docPath) ? fs.readFileSync(docPath, "utf8") : "";
  for (const s of REQUIRED_SECTIONS) {
    if (!doc.includes(s)) blockers.push(`doc-missing:${s}`);
  }

  if (!doc.includes("readyForG6EImplementation: false")) {
    blockers.push("g6e-gate-missing");
  }
  if (!doc.includes("Dry-run restore checklist")) {
    blockers.push("dry-run-restore-missing");
  }

  const debugPanelPath = path.join(REPO_ROOT, DEBUG_PANEL);
  const debugUiPath = path.join(REPO_ROOT, DEBUG_UI);
  if (!fs.existsSync(debugPanelPath)) blockers.push("debug-panel-missing");
  const panelSrc = fs.existsSync(debugPanelPath)
    ? fs.readFileSync(debugPanelPath, "utf8")
    : "";
  if (!panelSrc.includes("mock-only")) {
    blockers.push("debug-panel-hardening-copy-missing");
  }

  const debugUiSrc = fs.existsSync(debugUiPath)
    ? fs.readFileSync(debugUiPath, "utf8")
    : "";
  if (!debugUiSrc.includes("admin_users RLS")) {
    blockers.push("debug-ui-hardening-copy-missing");
  }

  const reportPath = path.join(
    toolRoot,
    "scripts/report-staging-profile-write-hardening.mjs",
  );
  const scan = scanReporter(reportPath);
  if (!scan.clean) blockers.push(`reporter-unsafe:${scan.hits.join(",")}`);

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.additionalProfileUpdateExecuted !== false) {
    blockers.push("config-additionalProfileUpdateExecuted");
  }
  if (config.readyForG6EImplementation !== false) {
    blockers.push("config-readyForG6EImplementation");
  }
  if (config.readyForG6EPlanning !== true) {
    blockers.push("config-readyForG6EPlanning");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-d-hardening",
    siteId,
    generatedAt: new Date().toISOString(),
    stagingOnly: true,
    previousProfileUpdateExecuted: config.previousProfileUpdateExecuted === true,
    additionalProfileUpdateExecuted: false,
    rollbackExecuted: config.rollbackExecuted === true,
    updatedByRemainsNull: config.updatedByRemainsNull === true,
    roleDisplayUsesMockAllowlist: config.roleDisplayUsesMockAllowlist === true,
    dbRlsUsesAdminUsers: config.dbRlsUsesAdminUsers === true,
    adminUsersPolicyAuditRecommended:
      config.adminUsersPolicyAuditRecommended === true,
    readyForG6EPlanning: complete && config.readyForG6EPlanning === true,
    readyForG6EImplementation: false,
    productionDataTouched: false,
    adminRouteConnected: false,
    blockers,
    complete,
  };
}

export function writeHardeningOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "staging-profile-write-hardening.json");
  const mdPath = path.join(outDir, "STAGING_PROFILE_WRITE_HARDENING_REPORT.md");
  const summary = {
    phase: report.phase,
    stagingOnly: report.stagingOnly,
    previousProfileUpdateExecuted: report.previousProfileUpdateExecuted,
    additionalProfileUpdateExecuted: report.additionalProfileUpdateExecuted,
    rollbackExecuted: report.rollbackExecuted,
    updatedByRemainsNull: report.updatedByRemainsNull,
    roleDisplayUsesMockAllowlist: report.roleDisplayUsesMockAllowlist,
    dbRlsUsesAdminUsers: report.dbRlsUsesAdminUsers,
    adminUsersPolicyAuditRecommended: report.adminUsersPolicyAuditRecommended,
    readyForG6EPlanning: report.readyForG6EPlanning,
    readyForG6EImplementation: report.readyForG6EImplementation,
    productionDataTouched: report.productionDataTouched,
    adminRouteConnected: report.adminRouteConnected,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Staging Profile Write Hardening Report",
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
