/**
 * G-6-rls-audit-result — Reporter (docs/config scan only; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/staging-rls-audit-result.md";
const CONFIG_REL = "config/admin/staging-rls-audit-result.json";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Summary",
  "## 3. Tables and RLS",
  "## 4. Policies reviewed",
  "## 5. admin_users policy detail",
  "## 6. is_admin() review",
  "## 7. Grants review",
  "## 8. Schema checks",
  "## 9. Data state",
  "## 10. Risk assessment",
  "## 11. Recommended next phase",
  "## 12. Gate state",
  "## 13. Final safety statement",
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

function docHasExecutableChangeSql(doc) {
  const lines = doc.split("\n");
  let inSqlFence = false;
  for (const line of lines) {
    if (line.trim().startsWith("```sql")) {
      inSqlFence = true;
      continue;
    }
    if (inSqlFence && line.trim() === "```") {
      inSqlFence = false;
      continue;
    }
    if (!inSqlFence) continue;
    const upper = line.trim().toUpperCase();
    if (
      upper.startsWith("CREATE POLICY") ||
      upper.startsWith("DROP POLICY") ||
      upper.startsWith("ALTER TABLE") ||
      upper.startsWith("GRANT ") ||
      upper.startsWith("REVOKE ") ||
      (upper.startsWith("UPDATE ") && !upper.startsWith("UPDATE POLICY")) ||
      upper.startsWith("INSERT INTO") ||
      upper.startsWith("DELETE FROM") ||
      upper.startsWith("TRUNCATE ")
    ) {
      return true;
    }
  }
  return false;
}

export function runStagingRlsAuditResultReport({
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

  if (!doc.includes("manual_sql_collected")) blockers.push("audit-status-missing");
  if (!doc.includes("too_broad_cleanup_recommended")) {
    blockers.push("grant-status-missing");
  }
  if (!doc.includes("G-6-rls-grant-cleanup-plan")) {
    blockers.push("next-phase-missing");
  }
  if (!doc.includes("TRUNCATE")) blockers.push("truncate-grant-not-documented");
  if (docHasExecutableChangeSql(doc)) {
    blockers.push("doc-contains-executable-change-sql");
  }

  const reportPath = path.join(
    toolRoot,
    "scripts/report-staging-rls-audit-result.mjs",
  );
  const scan = scanReporter(reportPath);
  if (!scan.clean) blockers.push(`reporter-unsafe:${scan.hits.join(",")}`);

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.auditStatus !== "manual_sql_collected") {
    blockers.push("config-auditStatus");
  }
  if (config.grantStatus !== "too_broad_cleanup_recommended") {
    blockers.push("config-grantStatus");
  }
  if (config.safeForLimitedImplementation !== false) {
    blockers.push("config-safeForLimitedImplementation");
  }
  if (config.readyForG6EImplementation !== false) {
    blockers.push("config-readyForG6EImplementation");
  }
  if (config.dbWritesPerformed !== false) blockers.push("config-dbWritesPerformed");
  if (config.grantChangesPerformed !== false) {
    blockers.push("config-grantChangesPerformed");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-rls-audit-result",
    siteId,
    generatedAt: new Date().toISOString(),
    stagingOnly: true,
    readOnly: true,
    manualSqlCollected: complete && config.manualSqlCollected === true,
    auditStatus: config.auditStatus,
    reviewStatus: config.reviewStatus,
    profileStatus: config.profileStatus,
    adminUsersPolicyStatus: config.adminUsersPolicyStatus,
    grantStatus: config.grantStatus,
    safeForPlanning: config.safeForPlanning === true,
    safeForLimitedImplementation: false,
    readyForG6EPlanning: complete && config.readyForG6EPlanning === true,
    readyForG6EImplementation: false,
    recommendedNextPhase: config.recommendedNextPhase,
    dbWritesPerformed: false,
    policyChangesPerformed: false,
    grantChangesPerformed: false,
    productionDataTouched: false,
    adminRouteConnected: false,
    blockers,
    complete,
  };
}

export function writeRlsAuditResultOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "staging-rls-audit-result.json");
  const mdPath = path.join(outDir, "STAGING_RLS_AUDIT_RESULT_REPORT.md");
  const summary = {
    phase: report.phase,
    stagingOnly: report.stagingOnly,
    readOnly: report.readOnly,
    manualSqlCollected: report.manualSqlCollected,
    auditStatus: report.auditStatus,
    reviewStatus: report.reviewStatus,
    profileStatus: report.profileStatus,
    adminUsersPolicyStatus: report.adminUsersPolicyStatus,
    grantStatus: report.grantStatus,
    safeForPlanning: report.safeForPlanning,
    safeForLimitedImplementation: report.safeForLimitedImplementation,
    readyForG6EPlanning: report.readyForG6EPlanning,
    readyForG6EImplementation: report.readyForG6EImplementation,
    recommendedNextPhase: report.recommendedNextPhase,
    dbWritesPerformed: report.dbWritesPerformed,
    policyChangesPerformed: report.policyChangesPerformed,
    grantChangesPerformed: report.grantChangesPerformed,
    productionDataTouched: report.productionDataTouched,
    adminRouteConnected: report.adminRouteConnected,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Staging RLS Audit Result Report",
    "",
    `Phase: ${report.phase}`,
    `Complete: ${report.complete}`,
    `Audit status: ${report.auditStatus}`,
    `Grant status: ${report.grantStatus}`,
    `Recommended next: ${report.recommendedNextPhase}`,
    "",
    report.blockers.length
      ? `Blockers:\n${report.blockers.map((b) => `- ${b}`).join("\n")}`
      : "No blockers.",
  ].join("\n");
  fs.writeFileSync(mdPath, `${md}\n`, "utf8");
  return { jsonPath, mdPath };
}
