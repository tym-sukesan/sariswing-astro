/**
 * G-6-e3-schedule-dry-run-adapter-planning — Reporter (docs/config scan only; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/schedule-dry-run-adapter-planning.md";
const CONFIG_REL = "config/admin/schedule-dry-run-adapter-planning.json";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Current status",
  "## 3. Why an adapter boundary is needed",
  "## 4. Adapter responsibilities",
  "## 5. Non-responsibilities",
  "## 6. Proposed file structure for future implementation",
  "## 7. Input types",
  "## 8. Update dry-run adapter design",
  "## 9. Duplicate dry-run adapter design",
  "## 10. DryRunResult common format",
  "## 11. actualWrite:false guard design",
  "## 12. DB client boundary",
  "## 13. Validation integration",
  "## 14. Derived preview",
  "## 15. Rollback hint strategy",
  "## 16. UI integration plan",
  "## 17. Real write adapter separation",
  "## 18. Approval IDs",
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

export function runScheduleDryRunAdapterPlanningReport({
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

  if (!doc.includes("pure function")) {
    blockers.push("pure-function-boundary-missing");
  }
  if (!doc.includes("actualWrite: false")) {
    blockers.push("actualWrite-guard-missing");
  }
  if (!doc.includes("G-6-e3-schedule-dry-run-adapter-implementation")) {
    blockers.push("next-phase-missing");
  }
  if (!doc.includes("readyForG6E3ScheduleDryRunAdapterImplementation: true")) {
    blockers.push("gate-decision-missing");
  }
  if (!doc.includes("No adapter code is implemented")) {
    blockers.push("safety-statement-missing");
  }
  if (!doc.includes("runScheduleWrite({ dryRun: boolean })")) {
    blockers.push("forbidden-mode-flag-missing");
  }
  if (docHasChangeSql(doc)) {
    blockers.push("doc-contains-change-sql");
  }

  const reportPath = path.join(
    toolRoot,
    "scripts/report-schedule-dry-run-adapter-planning.mjs",
  );
  const scan = scanReporter(reportPath);
  if (!scan.clean) blockers.push(`reporter-unsafe:${scan.hits.join(",")}`);

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.planningOnly !== true) blockers.push("config-planningOnly");
  if (config.adapterImplemented !== false) blockers.push("config-adapterImplemented");
  if (config.dryRunOnly !== true) blockers.push("config-dryRunOnly");
  if (config.actualWriteHardCodedFalse !== true) {
    blockers.push("config-actualWriteHardCodedFalse");
  }
  if (config.acceptsDbClient !== false) blockers.push("config-acceptsDbClient");
  if (config.acceptsDryRunModeFlag !== false) {
    blockers.push("config-acceptsDryRunModeFlag");
  }
  if (config.writeAdaptersImplemented !== false) {
    blockers.push("config-writeAdaptersImplemented");
  }
  if (config.dbWritesPerformed !== false) blockers.push("config-dbWritesPerformed");
  if (config.readyForG6E3ScheduleDryRunAdapterImplementation !== true) {
    blockers.push("config-readyForG6E3ScheduleDryRunAdapterImplementation");
  }
  if (config.readyForG6EWriteImplementation !== false) {
    blockers.push("config-readyForG6EWriteImplementation");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e3-schedule-dry-run-adapter-planning",
    siteId,
    generatedAt: new Date().toISOString(),
    planningOnly: true,
    targetModule: "schedule",
    adapterImplemented: false,
    dryRunOnly: true,
    actualWriteHardCodedFalse: config.actualWriteHardCodedFalse === true,
    acceptsDbClient: config.acceptsDbClient === false ? false : true,
    acceptsDryRunModeFlag: config.acceptsDryRunModeFlag === false ? false : true,
    writeAdaptersImplemented: false,
    dbWritesPerformed: false,
    readyForG6E3ScheduleDryRunAdapterImplementation:
      complete && config.readyForG6E3ScheduleDryRunAdapterImplementation === true,
    readyForG6EWriteImplementation: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleDryRunAdapterPlanningOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "schedule-dry-run-adapter-planning.json");
  const mdPath = path.join(outDir, "SCHEDULE_DRY_RUN_ADAPTER_PLANNING_REPORT.md");
  const summary = {
    phase: report.phase,
    planningOnly: report.planningOnly,
    targetModule: report.targetModule,
    adapterImplemented: report.adapterImplemented,
    dryRunOnly: report.dryRunOnly,
    actualWriteHardCodedFalse: report.actualWriteHardCodedFalse,
    acceptsDbClient: report.acceptsDbClient,
    acceptsDryRunModeFlag: report.acceptsDryRunModeFlag,
    writeAdaptersImplemented: report.writeAdaptersImplemented,
    dbWritesPerformed: report.dbWritesPerformed,
    readyForG6E3ScheduleDryRunAdapterImplementation:
      report.readyForG6E3ScheduleDryRunAdapterImplementation,
    readyForG6EWriteImplementation: report.readyForG6EWriteImplementation,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule Dry-run Adapter Planning Report",
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
