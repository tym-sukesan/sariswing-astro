/**
 * G-6-e1-schedule-schema-read-audit-result — Reporter (docs/config scan only; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/schedule-schema-read-audit-result.md";
const CONFIG_REL = "config/admin/schedule-schema-read-audit-result.json";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Summary",
  "## 3. schedules schema result",
  "## 4. schedule_months schema result",
  "## 5. RLS and GRANT result",
  "## 6. Data sample and row count",
  "## 7. Future/past grouping",
  "## 8. Field mapping",
  "## 9. schedule_months decision",
  "## 10. Implementation impact",
  "## 11. Remaining gaps",
  "## 12. Recommended next phase",
  "## 13. Final safety statement",
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
      upper.startsWith("UPDATE ") ||
      upper.startsWith("DELETE FROM") ||
      upper.startsWith("TRUNCATE ")
    ) {
      return true;
    }
  }
  return false;
}

export function runScheduleSchemaReadAuditResultReport({
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

  if (!doc.includes("manual_sql_collected")) {
    blockers.push("audit-status-missing");
  }
  if (!doc.includes("schema_compatible_for_mvp")) {
    blockers.push("schema-status-missing");
  }
  if (!doc.includes("derived_read_model_for_mvp")) {
    blockers.push("schedule-months-decision-missing");
  }
  if (!doc.includes("TRUNCATE / TRIGGER / REFERENCES no longer appear")) {
    blockers.push("grant-result-missing");
  }
  if (!doc.includes("future: 19")) blockers.push("future-past-count-missing");
  if (!doc.includes("G-6-e2-schedule-dry-run-ui-planning")) {
    blockers.push("next-phase-missing");
  }
  if (docHasChangeSql(doc)) {
    blockers.push("doc-contains-change-sql");
  }

  const reportPath = path.join(
    toolRoot,
    "scripts/report-schedule-schema-read-audit-result.mjs",
  );
  const scan = scanReporter(reportPath);
  if (!scan.clean) blockers.push(`reporter-unsafe:${scan.hits.join(",")}`);

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.manualSqlCollected !== true) {
    blockers.push("config-manualSqlCollected");
  }
  if (config.auditStatus !== "manual_sql_collected") {
    blockers.push("config-auditStatus");
  }
  if (config.schemaStatus !== "schema_compatible_for_mvp") {
    blockers.push("config-schemaStatus");
  }
  if (config.schemaMigrationRequiredBeforeDryRun !== false) {
    blockers.push("config-schemaMigrationRequiredBeforeDryRun");
  }
  if (config.readyForG6E2ScheduleDryRunUiPlanning !== true) {
    blockers.push("config-readyForG6E2ScheduleDryRunUiPlanning");
  }
  if (config.readyForG6EImplementation !== false) {
    blockers.push("config-readyForG6EImplementation");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e1-schedule-schema-read-audit-result",
    siteId,
    generatedAt: new Date().toISOString(),
    readOnly: true,
    manualSqlCollected: complete && config.manualSqlCollected === true,
    schemaStatus: config.schemaStatus,
    schemaMigrationRequiredBeforeDryRun:
      config.schemaMigrationRequiredBeforeDryRun,
    scheduleMonthsDecision: config.scheduleMonthsDecision,
    futurePastGroupingSupported: config.futurePastGroupingSupported,
    readyForG6E2ScheduleDryRunUiPlanning:
      complete && config.readyForG6E2ScheduleDryRunUiPlanning === true,
    readyForG6EImplementation: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleSchemaReadAuditResultOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "schedule-schema-read-audit-result.json");
  const mdPath = path.join(outDir, "SCHEDULE_SCHEMA_READ_AUDIT_RESULT_REPORT.md");
  const summary = {
    phase: report.phase,
    readOnly: report.readOnly,
    manualSqlCollected: report.manualSqlCollected,
    schemaStatus: report.schemaStatus,
    schemaMigrationRequiredBeforeDryRun: report.schemaMigrationRequiredBeforeDryRun,
    scheduleMonthsDecision: report.scheduleMonthsDecision,
    futurePastGroupingSupported: report.futurePastGroupingSupported,
    readyForG6E2ScheduleDryRunUiPlanning: report.readyForG6E2ScheduleDryRunUiPlanning,
    readyForG6EImplementation: report.readyForG6EImplementation,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule Schema Read Audit Result Report",
    "",
    `Phase: ${report.phase}`,
    `Complete: ${report.complete}`,
    `Schema status: ${report.schemaStatus}`,
    `Recommended next: ${report.recommendedNextPhase}`,
    "",
    report.blockers.length
      ? `Blockers:\n${report.blockers.map((b) => `- ${b}`).join("\n")}`
      : "No blockers.",
  ].join("\n");
  fs.writeFileSync(mdPath, `${md}\n`, "utf8");
  return { jsonPath, mdPath };
}
