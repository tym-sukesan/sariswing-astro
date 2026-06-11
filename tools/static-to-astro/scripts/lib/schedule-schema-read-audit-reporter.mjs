/**
 * G-6-e1-schedule-schema-read-audit — Reporter (docs/config scan only; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/schedule-schema-read-audit.md";
const CONFIG_REL = "config/admin/schedule-schema-read-audit.json";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Scope",
  "## 3. Questions to answer",
  "## 4. Known planning assumptions",
  "## 5. Manual read-only audit SQL",
  "## 6. Field mapping checklist",
  "## 7. schedule_months decision criteria",
  "## 8. RLS/GRANT criteria",
  "## 9. Implementation impact analysis",
  "## 10. Expected audit status values",
  "## 11. G-6-e implementation gate",
  "## 12. Recommended next step",
  "## 13. Final safety statement",
];

const REQUIRED_SQL_MARKERS = [
  "information_schema.columns",
  "pg_indexes",
  "pg_policies",
  "role_table_grants",
  "table_constraints",
];

const FORBIDDEN_IN_REPORTER = [
  /service_role/i,
  /SERVICE_ROLE/,
  /createClient\s*\(/,
  /@supabase\/supabase-js/,
  /upsert\s*\(/,
  /rpc\s*\(/,
  /workflow_dispatch/,
  /lftp/i,
  /\bftp\b/i,
  /storage\./,
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
      (upper.startsWith("UPDATE ") && !upper.includes("TEMPLATE")) ||
      upper.startsWith("DELETE FROM") ||
      upper.startsWith("TRUNCATE ")
    ) {
      return true;
    }
  }
  return false;
}

export function runScheduleSchemaReadAuditReport({
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

  if (!doc.includes("auditStatus: not_run")) {
    blockers.push("audit-status-initial-missing");
  }
  if (!doc.includes("G-6-e1-schedule-schema-read-audit-result")) {
    blockers.push("next-phase-missing");
  }
  if (!doc.includes("static-to-astro-cms-staging")) {
    blockers.push("target-project-missing");
  }
  if (docHasChangeSql(doc)) {
    blockers.push("doc-contains-change-sql");
  }

  const reportPath = path.join(
    toolRoot,
    "scripts/report-schedule-schema-read-audit.mjs",
  );
  const scan = scanReporter(reportPath);
  if (!scan.clean) blockers.push(`reporter-unsafe:${scan.hits.join(",")}`);

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.readOnly !== true) blockers.push("config-readOnly");
  if (config.planningOnly !== true) blockers.push("config-planningOnly");
  if (config.manualSqlRequired !== true) {
    blockers.push("config-manualSqlRequired");
  }
  if (config.auditStatus !== "not_run") blockers.push("config-auditStatus");
  if (config.dbWritesPerformed !== false) blockers.push("config-dbWritesPerformed");
  if (config.schemaChangesPerformed !== false) {
    blockers.push("config-schemaChangesPerformed");
  }
  if (config.writeAdaptersImplemented !== false) {
    blockers.push("config-writeAdaptersImplemented");
  }
  if (config.readyForG6EImplementation !== false) {
    blockers.push("config-readyForG6EImplementation");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e1-schedule-schema-read-audit",
    siteId,
    generatedAt: new Date().toISOString(),
    readOnly: true,
    planningOnly: true,
    targetModule: "schedule",
    targetTables: config.targetTables ?? ["schedules", "schedule_months"],
    manualSqlRequired: true,
    auditStatus: config.auditStatus ?? "not_run",
    dbWritesPerformed: false,
    schemaChangesPerformed: false,
    writeAdaptersImplemented: false,
    productionDataTouched: false,
    adminRouteConnected: false,
    readyForG6EPlanning: complete && config.readyForG6EPlanning === true,
    readyForG6EImplementation: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleSchemaReadAuditOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "schedule-schema-read-audit.json");
  const mdPath = path.join(outDir, "SCHEDULE_SCHEMA_READ_AUDIT_REPORT.md");
  const summary = {
    phase: report.phase,
    readOnly: report.readOnly,
    planningOnly: report.planningOnly,
    targetModule: report.targetModule,
    targetTables: report.targetTables,
    manualSqlRequired: report.manualSqlRequired,
    auditStatus: report.auditStatus,
    dbWritesPerformed: report.dbWritesPerformed,
    schemaChangesPerformed: report.schemaChangesPerformed,
    writeAdaptersImplemented: report.writeAdaptersImplemented,
    readyForG6EPlanning: report.readyForG6EPlanning,
    readyForG6EImplementation: report.readyForG6EImplementation,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule Schema Read Audit Report",
    "",
    `Phase: ${report.phase}`,
    `Complete: ${report.complete}`,
    `Audit status: ${report.auditStatus}`,
    `Recommended next: ${report.recommendedNextPhase}`,
    "",
    report.blockers.length
      ? `Blockers:\n${report.blockers.map((b) => `- ${b}`).join("\n")}`
      : "No blockers.",
  ].join("\n");
  fs.writeFileSync(mdPath, `${md}\n`, "utf8");
  return { jsonPath, mdPath };
}
