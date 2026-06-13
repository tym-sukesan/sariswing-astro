/**
 * G-6-e5-schedule-non-dry-run-poc-final-preflight — Reporter (static scan; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { runScheduleNonDryRunPocExecutionPathVerificationResultReport } from "./schedule-non-dry-run-poc-execution-path-verification-result-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
const REPO_ROOT = path.resolve(__dirname, "../../../..");

const DOC_REL = "docs/schedule-non-dry-run-poc-final-preflight.md";
const CONFIG_REL = "config/admin/schedule-non-dry-run-poc-final-preflight.json";
const PRIOR_CONFIG_REL =
  "config/admin/schedule-non-dry-run-poc-execution-path-verification-result.json";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Current status",
  "## 3. Final staging confirmation",
  "## 4. Final beforeSnapshot SQL",
  "## 5. Final payload confirmation",
  "## 6. Final env-gated launch command",
  "## 7. Final browser action plan",
  "## 8. After verification SQL",
  "## 9. Rollback SQL",
  "## 10. Final abort conditions",
  "## 11. Result capture template for next phase",
  "## 12. Gate decision",
  "## 13. Recommended next phase",
  "## 14. Final safety statement",
];

const TARGET_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";

function adminPagesDiffClean() {
  try {
    return execSync("git diff -- src/pages/admin", {
      cwd: REPO_ROOT,
      encoding: "utf8",
    }).trim() === "";
  } catch {
    return false;
  }
}

export function runScheduleNonDryRunPocFinalPreflightReport({
  toolRoot = DEFAULT_TOOL_ROOT,
  repoRoot = REPO_ROOT,
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
  if (!doc.includes("It does not click the trigger")) blockers.push("no-click-purpose-missing");
  if (!doc.includes("This document does not authorize clicking the button")) {
    blockers.push("no-click-authorization-missing");
  }
  if (!doc.includes("static-to-astro-cms-staging")) {
    blockers.push("staging-project-missing");
  }
  if (!doc.includes(TARGET_ID)) blockers.push("target-id-missing");
  if (!doc.includes("出演： [G-6-e5 non-dry-run PoC]")) {
    blockers.push("payload-missing");
  }
  if (!doc.includes("Rollback for G-6-e5-schedule-non-dry-run-poc")) {
    blockers.push("rollback-sql-missing");
  }
  if (!doc.includes("G-6-e5-schedule-non-dry-run-poc execution result")) {
    blockers.push("result-template-missing");
  }
  if (!doc.includes("finalPreflightPrepared: true")) {
    blockers.push("gate-preflight-prepared-missing");
  }
  if (!doc.includes("finalBeforeSnapshotConfirmed: false")) {
    blockers.push("gate-before-snapshot-pending");
  }
  if (!doc.includes("readyForG6E5ScheduleNonDryRunPocExecution: false")) {
    blockers.push("gate-execution-blocked-missing");
  }
  if (!doc.includes("G-6-e5-schedule-non-dry-run-poc-final-preflight-result")) {
    blockers.push("next-phase-missing");
  }

  const priorReport = runScheduleNonDryRunPocExecutionPathVerificationResultReport({
    toolRoot,
    repoRoot,
    siteId,
  });
  if (!priorReport.complete) {
    blockers.push(`prior-result-report:${priorReport.blockers.join(",")}`);
  }

  if (!adminPagesDiffClean()) blockers.push("admin-pages-diff");

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.finalPreflightPrepared !== true) blockers.push("config-finalPreflightPrepared");
  if (config.rollbackSqlAvailable !== true) blockers.push("config-rollbackSqlAvailable");
  if (config.afterVerificationSqlAvailable !== true) {
    blockers.push("config-afterVerificationSqlAvailable");
  }
  if (config.executionResultTemplatePrepared !== true) {
    blockers.push("config-executionResultTemplatePrepared");
  }
  if (config.finalBeforeSnapshotConfirmed !== false) {
    blockers.push("config-finalBeforeSnapshotConfirmed");
  }
  if (config.triggerClicked !== false) blockers.push("config-triggerClicked");
  if (config.executionPathInvoked !== false) blockers.push("config-executionPathInvoked");
  if (config.writeAdapterInvoked !== false) blockers.push("config-writeAdapterInvoked");
  if (config.dbWritesPerformed !== false) blockers.push("config-dbWritesPerformed");
  if (config.scheduleRecordsUpdated !== false) {
    blockers.push("config-scheduleRecordsUpdated");
  }
  if (config.readyForManualFinalBeforeSnapshotCheck !== true) {
    blockers.push("config-readyForManualFinalBeforeSnapshotCheck");
  }
  if (config.readyForG6E5ScheduleNonDryRunPocExecution !== false) {
    blockers.push("config-readyForExecution");
  }
  if (config.readyForG6E5ScheduleNonDryRunPoc !== false) {
    blockers.push("config-readyForPoC");
  }
  if (config.readyForNonDryRunSchedulePoC !== false) {
    blockers.push("config-readyForNonDryRunSchedulePoC");
  }

  const priorConfigPath = path.join(toolRoot, PRIOR_CONFIG_REL);
  if (fs.existsSync(priorConfigPath)) {
    const priorConfig = JSON.parse(fs.readFileSync(priorConfigPath, "utf8"));
    if (priorConfig.readyForG6E5ScheduleNonDryRunPocFinalPreflight !== true) {
      blockers.push("prior-config-not-ready-for-preflight");
    }
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e5-schedule-non-dry-run-poc-final-preflight",
    siteId,
    generatedAt: new Date().toISOString(),
    finalPreflightPrepared: true,
    rollbackSqlAvailable: true,
    afterVerificationSqlAvailable: true,
    executionResultTemplatePrepared: true,
    finalBeforeSnapshotConfirmed: false,
    triggerClicked: false,
    executionPathInvoked: false,
    writeAdapterInvoked: false,
    dbWritesPerformed: false,
    scheduleRecordsUpdated: false,
    readyForManualFinalBeforeSnapshotCheck:
      complete && config.readyForManualFinalBeforeSnapshotCheck === true,
    readyForG6E5ScheduleNonDryRunPocExecution: false,
    readyForG6E5ScheduleNonDryRunPoc: false,
    readyForNonDryRunSchedulePoC: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleNonDryRunPocFinalPreflightOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "schedule-non-dry-run-poc-final-preflight.json");
  const mdPath = path.join(outDir, "SCHEDULE_NON_DRY_RUN_POC_FINAL_PREFLIGHT_REPORT.md");
  const summary = {
    phase: report.phase,
    finalPreflightPrepared: report.finalPreflightPrepared,
    rollbackSqlAvailable: report.rollbackSqlAvailable,
    afterVerificationSqlAvailable: report.afterVerificationSqlAvailable,
    executionResultTemplatePrepared: report.executionResultTemplatePrepared,
    finalBeforeSnapshotConfirmed: report.finalBeforeSnapshotConfirmed,
    triggerClicked: report.triggerClicked,
    executionPathInvoked: report.executionPathInvoked,
    writeAdapterInvoked: report.writeAdapterInvoked,
    dbWritesPerformed: report.dbWritesPerformed,
    scheduleRecordsUpdated: report.scheduleRecordsUpdated,
    readyForManualFinalBeforeSnapshotCheck: report.readyForManualFinalBeforeSnapshotCheck,
    readyForG6E5ScheduleNonDryRunPocExecution: report.readyForG6E5ScheduleNonDryRunPocExecution,
    readyForNonDryRunSchedulePoC: report.readyForNonDryRunSchedulePoC,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule Non-Dry-Run PoC Final Preflight Report",
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
