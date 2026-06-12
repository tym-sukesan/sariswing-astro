/**
 * G-6-e2-schedule-dry-run-ui-scaffold — Reporter (docs/config scan only; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/schedule-dry-run-ui-scaffold.md";
const CONFIG_REL = "config/admin/schedule-dry-run-ui-scaffold.json";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Implemented UI scope",
  "## 3. Update dry-run behavior",
  "## 4. Duplicate dry-run behavior",
  "## 5. Validation behavior",
  "## 6. schedule_months read-only decision",
  "## 7. Safety flags",
  "## 8. Manual verification steps",
  "## 9. Remaining gaps",
  "## 10. Recommended next phase",
  "## 11. Final safety statement",
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

export function runScheduleDryRunUiScaffoldReport({
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

  if (!doc.includes("No schedule records are written")) {
    blockers.push("safety-statement-missing");
  }
  if (!doc.includes("G-6-e2-schedule-dry-run-ui-verification")) {
    blockers.push("next-phase-missing");
  }
  if (docHasChangeSql(doc)) {
    blockers.push("doc-contains-change-sql");
  }

  const uiComponentPath = path.join(
    toolRoot,
    "templates/admin-cms/data/components/AdminStagingScheduleDryRunPocSection.astro",
  );
  if (!fs.existsSync(uiComponentPath)) {
    blockers.push("ui-component-missing");
  }

  const reportPath = path.join(
    toolRoot,
    "scripts/report-schedule-dry-run-ui-scaffold.mjs",
  );
  const scan = scanReporter(reportPath);
  if (!scan.clean) blockers.push(`reporter-unsafe:${scan.hits.join(",")}`);

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.dryRunOnly !== true) blockers.push("config-dryRunOnly");
  if (config.uiImplemented !== true) blockers.push("config-uiImplemented");
  if (config.writeAdaptersImplemented !== false) {
    blockers.push("config-writeAdaptersImplemented");
  }
  if (config.dbWritesPerformed !== false) blockers.push("config-dbWritesPerformed");
  if (config.readyForG6E2ScheduleDryRunUiVerification !== true) {
    blockers.push("config-readyForG6E2ScheduleDryRunUiVerification");
  }
  if (config.readyForG6EWriteImplementation !== false) {
    blockers.push("config-readyForG6EWriteImplementation");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e2-schedule-dry-run-ui-scaffold",
    siteId,
    generatedAt: new Date().toISOString(),
    dryRunOnly: true,
    targetModule: "schedule",
    uiImplemented: config.uiImplemented === true,
    targetOperations: config.targetOperations,
    scheduleMonthsMode: config.scheduleMonthsMode,
    writeAdaptersImplemented: false,
    dbWritesPerformed: false,
    schemaChangesPerformed: false,
    readyForG6E2ScheduleDryRunUiVerification:
      complete && config.readyForG6E2ScheduleDryRunUiVerification === true,
    readyForG6EWriteImplementation: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleDryRunUiScaffoldOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "schedule-dry-run-ui-scaffold.json");
  const mdPath = path.join(outDir, "SCHEDULE_DRY_RUN_UI_SCAFFOLD_REPORT.md");
  const summary = {
    phase: report.phase,
    dryRunOnly: report.dryRunOnly,
    targetModule: report.targetModule,
    uiImplemented: report.uiImplemented,
    targetOperations: report.targetOperations,
    scheduleMonthsMode: report.scheduleMonthsMode,
    writeAdaptersImplemented: report.writeAdaptersImplemented,
    dbWritesPerformed: report.dbWritesPerformed,
    schemaChangesPerformed: report.schemaChangesPerformed,
    readyForG6E2ScheduleDryRunUiVerification: report.readyForG6E2ScheduleDryRunUiVerification,
    readyForG6EWriteImplementation: report.readyForG6EWriteImplementation,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule Dry-run UI Scaffold Report",
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
