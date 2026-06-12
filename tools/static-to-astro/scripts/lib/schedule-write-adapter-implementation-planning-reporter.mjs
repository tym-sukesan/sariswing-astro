/**
 * G-6-e4-schedule-write-adapter-implementation-planning — Reporter (docs/config scan only; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/schedule-write-adapter-implementation-planning.md";
const CONFIG_REL = "config/admin/schedule-write-adapter-implementation-planning.json";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Current status",
  "## 3. Implementation goal",
  "## 4. First implementation scope",
  "## 5. Proposed implementation files",
  "## 6. Write operation type design",
  "## 7. Write input type design",
  "## 8. Supabase client boundary",
  "## 9. Guard design",
  "## 10. Function signature design",
  "## 11. Write result type design",
  "## 12. Failure result type",
  "## 13. Before / after snapshot flow",
  "## 14. Rollback plan",
  "## 15. RLS / GRANT dependency",
  "## 16. Implementation sequencing options",
  "## 17. UI policy",
  "## 18. Verification plan for future implementation",
  "## 19. Gate decision",
  "## 20. Recommended next phase",
  "## 21. Final safety statement",
];

const FORBIDDEN_IN_REPORTER = [
  /service_role/i,
  /SERVICE_ROLE/,
  /createClient\s*\(/,
  /@supabase\/supabase-js/,
  /\.update\s*\(/,
  /\.insert\s*\(/,
  /\.delete\s*\(/,
  /\.upsert\s*\(/,
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
    const trimmed = line.trim();
    if (trimmed.startsWith("--")) continue;
    const upper = trimmed.toUpperCase();
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

export function runScheduleWriteAdapterImplementationPlanningReport({
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

  if (!doc.includes("runScheduleWrite")) {
    blockers.push("forbidden-generic-function-missing");
  }
  if (!doc.includes("updateScheduleWrite")) {
    blockers.push("operation-specific-function-missing");
  }
  if (!doc.includes("G-6-e5-schedule-non-dry-run-poc")) {
    blockers.push("poc-approval-id-missing");
  }
  if (!doc.includes("G-6-e4-schedule-update-grant-prep")) {
    blockers.push("grant-prep-next-phase-missing");
  }
  if (!doc.includes("No write adapter code is implemented")) {
    blockers.push("safety-statement-missing");
  }
  if (!doc.includes("readyForG6E4ScheduleUpdateGrantPrep: true")) {
    blockers.push("gate-decision-missing");
  }
  if (docHasExecutableChangeSql(doc)) {
    blockers.push("doc-contains-executable-change-sql");
  }

  const reportPath = path.join(
    toolRoot,
    "scripts/report-schedule-write-adapter-implementation-planning.mjs",
  );
  const scan = scanReporter(reportPath);
  if (!scan.clean) blockers.push(`reporter-unsafe:${scan.hits.join(",")}`);

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.planningOnly !== true) blockers.push("config-planningOnly");
  if (config.plannedOperation !== "update_only") {
    blockers.push("config-plannedOperation");
  }
  if (config.writeAdapterImplemented !== false) {
    blockers.push("config-writeAdapterImplemented");
  }
  if (config.dbWritesPerformed !== false) blockers.push("config-dbWritesPerformed");
  if (config.requiresUpdateGrantReview !== true) {
    blockers.push("config-requiresUpdateGrantReview");
  }
  if (config.requiresBeforeSnapshot !== true) {
    blockers.push("config-requiresBeforeSnapshot");
  }
  if (config.requiresRollbackPlan !== true) {
    blockers.push("config-requiresRollbackPlan");
  }
  if (config.readyForG6E4ScheduleUpdateGrantPrep !== true) {
    blockers.push("config-readyForG6E4ScheduleUpdateGrantPrep");
  }
  if (config.readyForG6EWriteImplementation !== false) {
    blockers.push("config-readyForG6EWriteImplementation");
  }
  if (config.genericDryRunModeFlagAllowed !== false) {
    blockers.push("config-genericDryRunModeFlagAllowed");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e4-schedule-write-adapter-implementation-planning",
    siteId,
    generatedAt: new Date().toISOString(),
    planningOnly: true,
    targetModule: "schedule",
    plannedOperation: config.plannedOperation,
    writeAdapterImplemented: false,
    dbWritesPerformed: false,
    requiresUpdateGrantReview: config.requiresUpdateGrantReview === true,
    requiresBeforeSnapshot: config.requiresBeforeSnapshot === true,
    requiresRollbackPlan: config.requiresRollbackPlan === true,
    readyForG6E4ScheduleUpdateGrantPrep:
      complete && config.readyForG6E4ScheduleUpdateGrantPrep === true,
    readyForG6EWriteImplementation: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleWriteAdapterImplementationPlanningOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(
    outDir,
    "schedule-write-adapter-implementation-planning.json",
  );
  const mdPath = path.join(
    outDir,
    "SCHEDULE_WRITE_ADAPTER_IMPLEMENTATION_PLANNING_REPORT.md",
  );
  const summary = {
    phase: report.phase,
    planningOnly: report.planningOnly,
    targetModule: report.targetModule,
    plannedOperation: report.plannedOperation,
    writeAdapterImplemented: report.writeAdapterImplemented,
    dbWritesPerformed: report.dbWritesPerformed,
    requiresUpdateGrantReview: report.requiresUpdateGrantReview,
    requiresBeforeSnapshot: report.requiresBeforeSnapshot,
    requiresRollbackPlan: report.requiresRollbackPlan,
    readyForG6E4ScheduleUpdateGrantPrep: report.readyForG6E4ScheduleUpdateGrantPrep,
    readyForG6EWriteImplementation: report.readyForG6EWriteImplementation,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule Write Adapter Implementation Planning Report",
    "",
    `Phase: ${report.phase}`,
    `Complete: ${report.complete}`,
    `Recommended next: ${report.recommendedNextPhase}`,
    "",
    report.blockers.length
      ? `Blockers:\n${report.blockers.map((b) => `- ${b}`).join("\n")}`
      : "No blockers.",
  ].join("\n");
  fs.writeFileSync(mdPath, `${md}\n`, "utf8");
  return { jsonPath, mdPath };
}
