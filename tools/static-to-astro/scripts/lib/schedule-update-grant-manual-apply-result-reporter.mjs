/**
 * G-6-e4-schedule-update-grant-manual-apply-result — Reporter (docs/config scan only; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/schedule-update-grant-manual-apply-result.md";
const CONFIG_REL = "config/admin/schedule-update-grant-manual-apply-result.json";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Manual apply summary",
  "## 3. Pre-check summary",
  "## 4. Grant result",
  "## 5. After verification result",
  "## 6. Broad grants verification",
  "## 7. Smoke test result",
  "## 8. Safety result",
  "## 9. What changed",
  "## 10. What did not change",
  "## 11. Current permission model after grant",
  "## 12. Gate decision",
  "## 13. Recommended next phase",
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

export function runScheduleUpdateGrantManualApplyResultReport({
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

  if (!doc.includes("grantManualApplyStatus: pass")) {
    blockers.push("grant-status-missing");
  }
  if (!doc.includes("grantExecuted: true")) {
    blockers.push("grant-executed-missing");
  }
  if (!doc.includes("actualWrite: false")) {
    blockers.push("smoke-test-actualWrite-missing");
  }
  if (!doc.includes("readyForG6E4ScheduleWriteAdapterImplementation: true")) {
    blockers.push("gate-decision-missing");
  }
  if (!doc.includes("G-6-e4-schedule-write-adapter-implementation")) {
    blockers.push("next-phase-missing");
  }
  if (!doc.includes("static-to-astro-cms-staging")) {
    blockers.push("target-project-missing");
  }
  if (!doc.includes("writeAdapterImplemented: false")) {
    blockers.push("safety-write-adapter-missing");
  }

  const reportPath = path.join(
    toolRoot,
    "scripts/report-schedule-update-grant-manual-apply-result.mjs",
  );
  const scan = scanReporter(reportPath);
  if (!scan.clean) blockers.push(`reporter-unsafe:${scan.hits.join(",")}`);

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.manualApplyResultRecorded !== true) {
    blockers.push("config-manualApplyResultRecorded");
  }
  if (config.grantExecuted !== true) blockers.push("config-grantExecuted");
  if (config.grantChangesPerformed !== true) {
    blockers.push("config-grantChangesPerformed");
  }
  if (config.grantManualApplyStatus !== "pass") {
    blockers.push("config-grantManualApplyStatus");
  }
  if (config.writeAdapterImplemented !== false) {
    blockers.push("config-writeAdapterImplemented");
  }
  if (config.dbWritesPerformed !== false) blockers.push("config-dbWritesPerformed");
  if (config.scheduleRecordsUpdated !== false) {
    blockers.push("config-scheduleRecordsUpdated");
  }
  if (config.readyForG6E4ScheduleWriteAdapterImplementation !== true) {
    blockers.push("config-readyForG6E4ScheduleWriteAdapterImplementation");
  }
  if (config.readyForG6EWriteImplementation !== false) {
    blockers.push("config-readyForG6EWriteImplementation");
  }
  if (config.readyForNonDryRunSchedulePoC !== false) {
    blockers.push("config-readyForNonDryRunSchedulePoC");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e4-schedule-update-grant-manual-apply-result",
    siteId,
    generatedAt: new Date().toISOString(),
    manualApplyResultRecorded: config.manualApplyResultRecorded === true,
    targetModule: "schedule",
    targetTable: config.targetTable,
    targetGrant: config.targetGrant,
    grantExecuted: config.grantExecuted === true,
    grantChangesPerformed: config.grantChangesPerformed === true,
    grantManualApplyStatus: config.grantManualApplyStatus,
    writeAdapterImplemented: false,
    dbWritesPerformed: false,
    scheduleRecordsUpdated: false,
    readyForG6E4ScheduleWriteAdapterImplementation:
      complete && config.readyForG6E4ScheduleWriteAdapterImplementation === true,
    readyForG6EWriteImplementation: false,
    readyForNonDryRunSchedulePoC: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleUpdateGrantManualApplyResultOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(
    outDir,
    "schedule-update-grant-manual-apply-result.json",
  );
  const mdPath = path.join(
    outDir,
    "SCHEDULE_UPDATE_GRANT_MANUAL_APPLY_RESULT_REPORT.md",
  );
  const summary = {
    phase: report.phase,
    manualApplyResultRecorded: report.manualApplyResultRecorded,
    targetModule: report.targetModule,
    targetTable: report.targetTable,
    targetGrant: report.targetGrant,
    grantExecuted: report.grantExecuted,
    grantChangesPerformed: report.grantChangesPerformed,
    grantManualApplyStatus: report.grantManualApplyStatus,
    writeAdapterImplemented: report.writeAdapterImplemented,
    dbWritesPerformed: report.dbWritesPerformed,
    scheduleRecordsUpdated: report.scheduleRecordsUpdated,
    readyForG6E4ScheduleWriteAdapterImplementation:
      report.readyForG6E4ScheduleWriteAdapterImplementation,
    readyForG6EWriteImplementation: report.readyForG6EWriteImplementation,
    readyForNonDryRunSchedulePoC: report.readyForNonDryRunSchedulePoC,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule UPDATE Grant Manual Apply Result Report",
    "",
    `Phase: ${report.phase}`,
    `Complete: ${report.complete}`,
    `Grant status: ${report.grantManualApplyStatus}`,
    `Recommended next: ${report.recommendedNextPhase}`,
    "",
    report.blockers.length
      ? `Blockers:\n${report.blockers.map((b) => `- ${b}`).join("\n")}`
      : "No blockers.",
  ].join("\n");
  fs.writeFileSync(mdPath, `${md}\n`, "utf8");
  return { jsonPath, mdPath };
}
