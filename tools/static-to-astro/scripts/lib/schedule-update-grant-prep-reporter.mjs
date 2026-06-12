/**
 * G-6-e4-schedule-update-grant-prep — Reporter (docs/config scan only; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/schedule-update-grant-prep.md";
const CONFIG_REL = "config/admin/schedule-update-grant-prep.json";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Current status",
  "## 3. Why UPDATE grant prep is needed",
  "## 4. Scope of future grant",
  "## 5. Manual pre-check SQL",
  "## 6. Manual GRANT SQL candidate",
  "## 7. After verification SQL",
  "## 8. Rollback SQL",
  "## 9. Risk assessment",
  "## 10. Smoke test plan after future grant",
  "## 11. Non-dry-run PoC dependency",
  "## 12. Relationship to write adapter implementation",
  "## 13. Gate decision",
  "## 14. Final safety statement",
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

export function runScheduleUpdateGrantPrepReport({
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

  if (!doc.includes("MANUAL STAGING GRANT SQL")) {
    blockers.push("grant-sql-missing");
  }
  if (!doc.includes("MANUAL STAGING ROLLBACK SQL")) {
    blockers.push("rollback-sql-missing");
  }
  if (!doc.includes("grant update on table public.schedules to authenticated")) {
    blockers.push("grant-candidate-missing");
  }
  if (!doc.includes("revoke update on table public.schedules from authenticated")) {
    blockers.push("revoke-candidate-missing");
  }
  if (!doc.includes("is_admin")) {
    blockers.push("is-admin-check-missing");
  }
  if (!doc.includes("G-6-e4-schedule-update-grant-manual-apply-prep")) {
    blockers.push("next-phase-missing");
  }
  if (!doc.includes("No GRANT is executed")) {
    blockers.push("safety-statement-missing");
  }
  if (!doc.includes("static-to-astro-cms-staging")) {
    blockers.push("target-project-missing");
  }

  const reportPath = path.join(
    toolRoot,
    "scripts/report-schedule-update-grant-prep.mjs",
  );
  const scan = scanReporter(reportPath);
  if (!scan.clean) blockers.push(`reporter-unsafe:${scan.hits.join(",")}`);

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.planningOnly !== true) blockers.push("config-planningOnly");
  if (config.manualSqlPrepared !== true) blockers.push("config-manualSqlPrepared");
  if (config.grantExecuted !== false) blockers.push("config-grantExecuted");
  if (config.grantChangesPerformed !== false) {
    blockers.push("config-grantChangesPerformed");
  }
  if (config.writeAdapterImplemented !== false) {
    blockers.push("config-writeAdapterImplemented");
  }
  if (config.dbWritesPerformed !== false) blockers.push("config-dbWritesPerformed");
  if (config.readyForG6E4ScheduleUpdateGrantManualApplyPrep !== true) {
    blockers.push("config-readyForG6E4ScheduleUpdateGrantManualApplyPrep");
  }
  if (config.readyForG6EWriteImplementation !== false) {
    blockers.push("config-readyForG6EWriteImplementation");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e4-schedule-update-grant-prep",
    siteId,
    generatedAt: new Date().toISOString(),
    planningOnly: true,
    manualSqlPrepared: config.manualSqlPrepared === true,
    targetModule: "schedule",
    targetTable: config.targetTable,
    targetGrant: config.targetGrant,
    grantExecuted: false,
    grantChangesPerformed: false,
    writeAdapterImplemented: false,
    dbWritesPerformed: false,
    readyForG6E4ScheduleUpdateGrantManualApplyPrep:
      complete && config.readyForG6E4ScheduleUpdateGrantManualApplyPrep === true,
    readyForG6EWriteImplementation: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleUpdateGrantPrepOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "schedule-update-grant-prep.json");
  const mdPath = path.join(outDir, "SCHEDULE_UPDATE_GRANT_PREP_REPORT.md");
  const summary = {
    phase: report.phase,
    planningOnly: report.planningOnly,
    manualSqlPrepared: report.manualSqlPrepared,
    targetModule: report.targetModule,
    targetTable: report.targetTable,
    targetGrant: report.targetGrant,
    grantExecuted: report.grantExecuted,
    grantChangesPerformed: report.grantChangesPerformed,
    writeAdapterImplemented: report.writeAdapterImplemented,
    dbWritesPerformed: report.dbWritesPerformed,
    readyForG6E4ScheduleUpdateGrantManualApplyPrep:
      report.readyForG6E4ScheduleUpdateGrantManualApplyPrep,
    readyForG6EWriteImplementation: report.readyForG6EWriteImplementation,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule UPDATE Grant Prep Report",
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
