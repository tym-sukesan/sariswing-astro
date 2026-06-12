/**
 * G-6-e4-schedule-write-adapter-planning — Reporter (docs/config scan only; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/schedule-write-adapter-planning.md";
const CONFIG_REL = "config/admin/schedule-write-adapter-planning.json";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Current status",
  "## 3. Why write adapter planning is separate",
  "## 4. Proposed first write scope",
  "## 5. Operation decision",
  "## 6. Target table and columns",
  "## 7. Excluded fields",
  "## 8. RLS / GRANT current state",
  "## 9. RLS policy current state",
  "## 10. Pre-flight manual SQL needed later",
  "## 11. Required GRANT planning",
  "## 12. Write adapter boundary design",
  "## 13. Write adapter input design",
  "## 14. Write result design",
  "## 15. Approval ID design",
  "## 16. Before snapshot and rollback",
  "## 17. Pre-seeded test row policy",
  "## 18. Manual verification plan (future phases)",
  "## 19. Guard design (future implementation)",
  "## 20. Gate decision",
  "## 21. Recommended next phase",
  "## 22. Final safety statement",
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

export function runScheduleWriteAdapterPlanningReport({
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

  if (!doc.includes("runScheduleWrite({ dryRun: boolean })")) {
    blockers.push("forbidden-mode-flag-missing");
  }
  if (!doc.includes("ScheduleDryRunAdapter")) {
    blockers.push("dry-run-separation-missing");
  }
  if (!doc.includes("G-6-e5-schedule-non-dry-run-poc")) {
    blockers.push("poc-approval-id-missing");
  }
  if (!doc.includes("No write adapter code is implemented")) {
    blockers.push("safety-statement-missing");
  }
  if (!doc.includes("readyForG6EWriteImplementation: false")) {
    blockers.push("gate-decision-missing");
  }
  if (docHasExecutableChangeSql(doc)) {
    blockers.push("doc-contains-executable-change-sql");
  }

  const reportPath = path.join(
    toolRoot,
    "scripts/report-schedule-write-adapter-planning.mjs",
  );
  const scan = scanReporter(reportPath);
  if (!scan.clean) blockers.push(`reporter-unsafe:${scan.hits.join(",")}`);

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.planningOnly !== true) blockers.push("config-planningOnly");
  if (config.writeAdapterImplemented !== false) {
    blockers.push("config-writeAdapterImplemented");
  }
  if (config.writeAdaptersImplemented !== false) {
    blockers.push("config-writeAdaptersImplemented");
  }
  if (config.dbWritesPerformed !== false) blockers.push("config-dbWritesPerformed");
  if (config.grantChangesPerformed !== false) {
    blockers.push("config-grantChangesPerformed");
  }
  if (config.acceptsDryRunModeFlag !== false) {
    blockers.push("config-acceptsDryRunModeFlag");
  }
  if (config.readyForG6EWriteImplementation !== false) {
    blockers.push("config-readyForG6EWriteImplementation");
  }
  if (config.readyForNonDryRunSchedulePoC !== false) {
    blockers.push("config-readyForNonDryRunSchedulePoC");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e4-schedule-write-adapter-planning",
    siteId,
    generatedAt: new Date().toISOString(),
    planningOnly: true,
    targetModule: "schedule",
    writeAdapterImplemented: false,
    dryRunAdapterComplete: config.dryRunAdapterComplete === true,
    firstWriteScope: config.firstWriteScope,
    writeAdaptersImplemented: false,
    dbWritesPerformed: false,
    grantChangesPerformed: false,
    acceptsDryRunModeFlag: false,
    readyForG6E4ScheduleWriteAdapterPlanning: complete,
    readyForG6EWriteImplementation: false,
    readyForNonDryRunSchedulePoC: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleWriteAdapterPlanningOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "schedule-write-adapter-planning.json");
  const mdPath = path.join(outDir, "SCHEDULE_WRITE_ADAPTER_PLANNING_REPORT.md");
  const summary = {
    phase: report.phase,
    planningOnly: report.planningOnly,
    targetModule: report.targetModule,
    writeAdapterImplemented: report.writeAdapterImplemented,
    dryRunAdapterComplete: report.dryRunAdapterComplete,
    firstWriteScope: report.firstWriteScope,
    writeAdaptersImplemented: report.writeAdaptersImplemented,
    dbWritesPerformed: report.dbWritesPerformed,
    grantChangesPerformed: report.grantChangesPerformed,
    readyForG6E4ScheduleWriteAdapterPlanning:
      report.readyForG6E4ScheduleWriteAdapterPlanning,
    readyForG6EWriteImplementation: report.readyForG6EWriteImplementation,
    readyForNonDryRunSchedulePoC: report.readyForNonDryRunSchedulePoC,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule Write Adapter Planning Report",
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
