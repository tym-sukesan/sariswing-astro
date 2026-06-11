/**
 * G-6-rls-audit — Reporter (docs/config scan only; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/staging-rls-audit.md";
const CONFIG_REL = "config/admin/staging-rls-audit.json";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Scope",
  "## 3. Current known state from G-6-d",
  "## 4. Manual read-only audit SQL",
  "## 5. Audit criteria",
  "## 6. Known concern: admin_users admin policies",
  "## 7. updated_by relation",
  "## 8. G-6-e gate after RLS audit",
  "## 9. Expected audit result status values",
  "## 10. Recommended next step",
  "## 11. Final safety statement",
];

const REQUIRED_SQL_MARKERS = [
  "information_schema.tables",
  "pg_policies",
  "role_table_grants",
  "information_schema.columns",
];

/** Forbidden executable change patterns in reporter script only */
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

function docHasChangeSql(doc) {
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
      upper.startsWith("INSERT INTO") ||
      upper.startsWith("UPDATE ") ||
      upper.startsWith("DELETE FROM")
    ) {
      return true;
    }
  }
  return false;
}

export function runStagingRlsAuditReport({
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
  for (const m of REQUIRED_SQL_MARKERS) {
    if (!doc.includes(m)) blockers.push(`sql-missing:${m}`);
  }
  if (!doc.includes("admin_users_admin_delete")) {
    blockers.push("admin-policies-section-incomplete");
  }
  if (!doc.includes("auditStatus: not_run")) {
    blockers.push("audit-status-initial-missing");
  }
  if (docHasChangeSql(doc)) {
    blockers.push("doc-contains-change-sql");
  }

  const reportPath = path.join(toolRoot, "scripts/report-staging-rls-audit.mjs");
  const scan = scanReporter(reportPath);
  if (!scan.clean) blockers.push(`reporter-unsafe:${scan.hits.join(",")}`);

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.readOnly !== true) blockers.push("config-readOnly");
  if (config.dbWritesAllowed !== false) blockers.push("config-dbWritesAllowed");
  if (config.policyChangesAllowed !== false) {
    blockers.push("config-policyChangesAllowed");
  }
  if (config.grantChangesAllowed !== false) {
    blockers.push("config-grantChangesAllowed");
  }
  if (config.auditStatus !== "not_run") blockers.push("config-auditStatus");
  if (config.readyForG6EImplementation !== false) {
    blockers.push("config-readyForG6EImplementation");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-rls-audit",
    siteId,
    generatedAt: new Date().toISOString(),
    stagingOnly: true,
    readOnly: true,
    dbWritesAllowed: false,
    policyChangesAllowed: false,
    grantChangesAllowed: false,
    auditStatus: config.auditStatus ?? "not_run",
    primaryTables: config.primaryTables ?? ["profile", "admin_users"],
    readyForG6EPlanning: complete && config.readyForG6EPlanning === true,
    readyForG6EImplementation: false,
    productionDataTouched: false,
    adminRouteConnected: false,
    blockers,
    complete,
  };
}

export function writeRlsAuditOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "staging-rls-audit.json");
  const mdPath = path.join(outDir, "STAGING_RLS_AUDIT_REPORT.md");
  const summary = {
    phase: report.phase,
    stagingOnly: report.stagingOnly,
    readOnly: report.readOnly,
    dbWritesAllowed: report.dbWritesAllowed,
    policyChangesAllowed: report.policyChangesAllowed,
    grantChangesAllowed: report.grantChangesAllowed,
    auditStatus: report.auditStatus,
    readyForG6EPlanning: report.readyForG6EPlanning,
    readyForG6EImplementation: report.readyForG6EImplementation,
    productionDataTouched: report.productionDataTouched,
    adminRouteConnected: report.adminRouteConnected,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Staging RLS Audit Report",
    "",
    `Phase: ${report.phase}`,
    `Complete: ${report.complete}`,
    `Audit status: ${report.auditStatus}`,
    "",
    report.blockers.length
      ? `Blockers:\n${report.blockers.map((b) => `- ${b}`).join("\n")}`
      : "No blockers.",
  ].join("\n");
  fs.writeFileSync(mdPath, `${md}\n`, "utf8");
  return { jsonPath, mdPath };
}
