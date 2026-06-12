/**
 * G-6-e2-schedule-dry-run-ui-planning — Reporter (docs/config scan only; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/schedule-dry-run-ui-planning.md";
const CONFIG_REL = "config/admin/schedule-dry-run-ui-planning.json";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Current schedule schema basis",
  "## 3. Product goal",
  "## 4. Initial UI scope",
  "## 5. Recommended operation order",
  "## 6. Schedule list UI design",
  "## 7. Schedule edit form design",
  "## 8. Validation rules",
  "## 9. Update dry-run payload",
  "## 10. Duplicate dry-run payload",
  "## 11. schedule_months handling",
  "## 12. Dry-run result panel",
  "## 13. Rollback hint design",
  "## 14. Approval ID design",
  "## 15. Staging shell integration plan",
  "## 16. RLS / GRANT implications",
  "## 17. Implementation gate",
  "## 18. Recommended next phase",
  "## 19. Final safety statement",
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

export function runScheduleDryRunUiPlanningReport({
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

  if (!doc.includes("update dry-run + duplicate dry-run")) {
    blockers.push("operation-order-missing");
  }
  if (!doc.includes("read_only_derived_model") && !doc.includes("read-only")) {
    blockers.push("schedule-months-mode-missing");
  }
  if (!doc.includes("G-6-e2-schedule-dry-run-ui-scaffold")) {
    blockers.push("next-phase-missing");
  }
  if (!doc.includes("Dry-run complete — no Supabase schedule update was called")) {
    blockers.push("dry-run-message-missing");
  }
  if (!doc.includes("G-6-e2-schedule-dry-run-ui")) {
    blockers.push("approval-id-missing");
  }
  if (docHasChangeSql(doc)) {
    blockers.push("doc-contains-change-sql");
  }

  const reportPath = path.join(
    toolRoot,
    "scripts/report-schedule-dry-run-ui-planning.mjs",
  );
  const scan = scanReporter(reportPath);
  if (!scan.clean) blockers.push(`reporter-unsafe:${scan.hits.join(",")}`);

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.planningOnly !== true) blockers.push("config-planningOnly");
  if (config.uiImplemented !== false) blockers.push("config-uiImplemented");
  if (config.writeAdaptersImplemented !== false) {
    blockers.push("config-writeAdaptersImplemented");
  }
  if (config.requiresSchemaMigrationBeforeUi !== false) {
    blockers.push("config-requiresSchemaMigrationBeforeUi");
  }
  if (config.requiresWriteGrantsBeforeDryRunUi !== false) {
    blockers.push("config-requiresWriteGrantsBeforeDryRunUi");
  }
  if (config.readyForG6E2ScheduleDryRunUiScaffold !== true) {
    blockers.push("config-readyForG6E2ScheduleDryRunUiScaffold");
  }
  if (config.readyForG6EWriteImplementation !== false) {
    blockers.push("config-readyForG6EWriteImplementation");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e2-schedule-dry-run-ui-planning",
    siteId,
    generatedAt: new Date().toISOString(),
    planningOnly: true,
    targetModule: "schedule",
    targetOperations: config.targetOperations,
    scheduleMonthsMode: config.scheduleMonthsMode,
    requiresSchemaMigrationBeforeUi: config.requiresSchemaMigrationBeforeUi,
    requiresWriteGrantsBeforeDryRunUi: config.requiresWriteGrantsBeforeDryRunUi,
    uiImplemented: false,
    writeAdaptersImplemented: false,
    dbWritesPerformed: false,
    readyForG6E2ScheduleDryRunUiScaffold:
      complete && config.readyForG6E2ScheduleDryRunUiScaffold === true,
    readyForG6EWriteImplementation: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleDryRunUiPlanningOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "schedule-dry-run-ui-planning.json");
  const mdPath = path.join(outDir, "SCHEDULE_DRY_RUN_UI_PLANNING_REPORT.md");
  const summary = {
    phase: report.phase,
    planningOnly: report.planningOnly,
    targetModule: report.targetModule,
    targetOperations: report.targetOperations,
    scheduleMonthsMode: report.scheduleMonthsMode,
    requiresSchemaMigrationBeforeUi: report.requiresSchemaMigrationBeforeUi,
    requiresWriteGrantsBeforeDryRunUi: report.requiresWriteGrantsBeforeDryRunUi,
    readyForG6E2ScheduleDryRunUiScaffold: report.readyForG6E2ScheduleDryRunUiScaffold,
    readyForG6EWriteImplementation: report.readyForG6EWriteImplementation,
    uiImplemented: report.uiImplemented,
    writeAdaptersImplemented: report.writeAdaptersImplemented,
    dbWritesPerformed: report.dbWritesPerformed,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule Dry-run UI Planning Report",
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
