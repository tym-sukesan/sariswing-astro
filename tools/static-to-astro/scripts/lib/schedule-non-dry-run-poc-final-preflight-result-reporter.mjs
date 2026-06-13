/**
 * G-6-e5-schedule-non-dry-run-poc-final-preflight-result — Reporter (static scan; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { runScheduleNonDryRunPocFinalPreflightReport } from "./schedule-non-dry-run-poc-final-preflight-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
const REPO_ROOT = path.resolve(__dirname, "../../../..");

const DOC_REL = "docs/schedule-non-dry-run-poc-final-preflight-result.md";
const CONFIG_REL =
  "config/admin/schedule-non-dry-run-poc-final-preflight-result.json";
const PRIOR_CONFIG_REL = "config/admin/schedule-non-dry-run-poc-final-preflight.json";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Final preflight summary",
  "## 3. Staging project confirmation",
  "## 4. Final beforeSnapshot SQL",
  "## 5. Final beforeSnapshot result",
  "## 6. Match result",
  "## 7. Final payload confirmation",
  "## 8. Final rollback SQL",
  "## 9. Final after verification SQL",
  "## 10. Final abort conditions",
  "## 11. Final execution instruction for next phase",
  "## 12. Gate decision",
  "## 13. Recommended next phase",
  "## 14. Final safety statement",
];

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

export function runScheduleNonDryRunPocFinalPreflightResultReport({
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
  if (!doc.includes("Run button clicked: no")) blockers.push("run-not-clicked-missing");
  if (!doc.includes("finalBeforeSnapshotConfirmed: true")) {
    blockers.push("gate-before-snapshot-missing");
  }
  if (!doc.includes("finalStagingProjectConfirmed: true")) {
    blockers.push("gate-staging-project-missing");
  }
  if (!doc.includes("readyForG6E5ScheduleNonDryRunPocExecution: true")) {
    blockers.push("gate-execution-ready-missing");
  }
  if (!doc.includes("G-6-e5-schedule-non-dry-run-poc-execution")) {
    blockers.push("next-phase-missing");
  }
  if (!doc.includes("This document does not authorize execution")) {
    blockers.push("no-execution-authorization-missing");
  }
  if (!doc.includes("static-to-astro-cms-staging")) {
    blockers.push("staging-project-missing");
  }

  const priorReport = runScheduleNonDryRunPocFinalPreflightReport({
    toolRoot,
    repoRoot,
    siteId,
  });
  if (!priorReport.complete) {
    blockers.push(`prior-preflight-report:${priorReport.blockers.join(",")}`);
  }

  if (!adminPagesDiffClean()) blockers.push("admin-pages-diff");

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.finalPreflightResultRecorded !== true) {
    blockers.push("config-finalPreflightResultRecorded");
  }
  if (config.finalBeforeSnapshotConfirmed !== true) {
    blockers.push("config-finalBeforeSnapshotConfirmed");
  }
  if (config.finalStagingProjectConfirmed !== true) {
    blockers.push("config-finalStagingProjectConfirmed");
  }
  if (config.rollbackSqlAvailable !== true) blockers.push("config-rollbackSqlAvailable");
  if (config.afterVerificationSqlAvailable !== true) {
    blockers.push("config-afterVerificationSqlAvailable");
  }
  if (config.triggerClicked !== false) blockers.push("config-triggerClicked");
  if (config.executionPathInvoked !== false) blockers.push("config-executionPathInvoked");
  if (config.writeAdapterInvoked !== false) blockers.push("config-writeAdapterInvoked");
  if (config.dbWritesPerformed !== false) blockers.push("config-dbWritesPerformed");
  if (config.scheduleRecordsUpdated !== false) {
    blockers.push("config-scheduleRecordsUpdated");
  }
  if (config.readyForG6E5ScheduleNonDryRunPocExecution !== true) {
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
    if (priorConfig.finalPreflightPrepared !== true) {
      blockers.push("prior-config-not-prepared");
    }
    if (priorConfig.finalBeforeSnapshotConfirmed !== true) {
      blockers.push("prior-config-before-snapshot-not-confirmed");
    }
    if (priorConfig.finalStagingProjectConfirmed !== true) {
      blockers.push("prior-config-staging-not-confirmed");
    }
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e5-schedule-non-dry-run-poc-final-preflight-result",
    siteId,
    generatedAt: new Date().toISOString(),
    finalPreflightResultRecorded: true,
    finalBeforeSnapshotConfirmed: true,
    finalStagingProjectConfirmed: true,
    rollbackSqlAvailable: true,
    afterVerificationSqlAvailable: true,
    triggerClicked: false,
    executionPathInvoked: false,
    writeAdapterInvoked: false,
    dbWritesPerformed: false,
    scheduleRecordsUpdated: false,
    readyForG6E5ScheduleNonDryRunPocExecution:
      complete && config.readyForG6E5ScheduleNonDryRunPocExecution === true,
    readyForG6E5ScheduleNonDryRunPoc: false,
    readyForNonDryRunSchedulePoC: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleNonDryRunPocFinalPreflightResultOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(
    outDir,
    "schedule-non-dry-run-poc-final-preflight-result.json",
  );
  const mdPath = path.join(
    outDir,
    "SCHEDULE_NON_DRY_RUN_POC_FINAL_PREFLIGHT_RESULT_REPORT.md",
  );
  const summary = {
    phase: report.phase,
    finalPreflightResultRecorded: report.finalPreflightResultRecorded,
    finalBeforeSnapshotConfirmed: report.finalBeforeSnapshotConfirmed,
    finalStagingProjectConfirmed: report.finalStagingProjectConfirmed,
    rollbackSqlAvailable: report.rollbackSqlAvailable,
    afterVerificationSqlAvailable: report.afterVerificationSqlAvailable,
    triggerClicked: report.triggerClicked,
    executionPathInvoked: report.executionPathInvoked,
    writeAdapterInvoked: report.writeAdapterInvoked,
    dbWritesPerformed: report.dbWritesPerformed,
    scheduleRecordsUpdated: report.scheduleRecordsUpdated,
    readyForG6E5ScheduleNonDryRunPocExecution: report.readyForG6E5ScheduleNonDryRunPocExecution,
    readyForNonDryRunSchedulePoC: report.readyForNonDryRunSchedulePoC,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule Non-Dry-Run PoC Final Preflight Result Report",
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
