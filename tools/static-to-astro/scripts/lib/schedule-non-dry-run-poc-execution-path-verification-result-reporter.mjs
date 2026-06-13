/**
 * G-6-e5-schedule-non-dry-run-poc-execution-path-verification-result — Reporter (static scan; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { runScheduleNonDryRunPocExecutionPathVerificationReport } from "./schedule-non-dry-run-poc-execution-path-verification-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
const REPO_ROOT = path.resolve(__dirname, "../../../..");

const DOC_REL =
  "docs/schedule-non-dry-run-poc-execution-path-verification-result.md";
const CONFIG_REL =
  "config/admin/schedule-non-dry-run-poc-execution-path-verification-result.json";
const PRIOR_CONFIG_REL =
  "config/admin/schedule-non-dry-run-poc-execution-path-verification.json";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Verification summary",
  "## 3. Env-gated launch",
  "## 4. Danger Zone display result",
  "## 5. Manual confirm result",
  "## 6. DB unchanged verification",
  "## 7. Safety result",
  "## 8. What was verified",
  "## 9. What was not done",
  "## 10. Gate decision",
  "## 11. Recommended next phase",
  "## 12. Final safety statement",
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

export function runScheduleNonDryRunPocExecutionPathVerificationResultReport({
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
  if (!doc.includes("dbUnchangedVerified: true")) blockers.push("db-unchanged-missing");
  if (!doc.includes("envGatedVisibleVerified: true")) {
    blockers.push("gate-env-gated-missing");
  }
  if (!doc.includes("manualConfirmVerified: true")) {
    blockers.push("gate-manual-confirm-missing");
  }
  if (!doc.includes("readyForG6E5ScheduleNonDryRunPocFinalPreflight: true")) {
    blockers.push("gate-final-preflight-missing");
  }
  if (!doc.includes("G-6-e5-schedule-non-dry-run-poc-final-preflight-result")) {
    blockers.push("next-phase-missing");
  }
  if (!doc.includes("Although the Run button became enabled")) {
    blockers.push("enabled-not-clicked-note-missing");
  }

  const priorReport = runScheduleNonDryRunPocExecutionPathVerificationReport({
    toolRoot,
    repoRoot,
    siteId,
  });
  if (!priorReport.complete) {
    blockers.push(`prior-verification:${priorReport.blockers.join(",")}`);
  }

  if (!adminPagesDiffClean()) blockers.push("admin-pages-diff");

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.envGatedVisibleVerified !== true) {
    blockers.push("config-envGatedVisibleVerified");
  }
  if (config.manualConfirmVerified !== true) {
    blockers.push("config-manualConfirmVerified");
  }
  if (config.dbUnchangedVerified !== true) {
    blockers.push("config-dbUnchangedVerified");
  }
  if (config.triggerClicked !== false) blockers.push("config-triggerClicked");
  if (config.executionPathInvoked !== false) blockers.push("config-executionPathInvoked");
  if (config.writeAdapterInvoked !== false) blockers.push("config-writeAdapterInvoked");
  if (config.dbWritesPerformed !== false) blockers.push("config-dbWritesPerformed");
  if (config.scheduleRecordsUpdated !== false) {
    blockers.push("config-scheduleRecordsUpdated");
  }
  if (config.readyForG6E5ScheduleNonDryRunPocFinalPreflight !== true) {
    blockers.push("config-readyForFinalPreflight");
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
    if (priorConfig.readyForG6E5ScheduleNonDryRunPocExecutionPathVerificationResult !== true) {
      blockers.push("prior-config-not-ready-for-result");
    }
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e5-schedule-non-dry-run-poc-execution-path-verification-result",
    siteId,
    generatedAt: new Date().toISOString(),
    envGatedVisibleVerified: true,
    manualConfirmVerified: true,
    dbUnchangedVerified: true,
    triggerClicked: false,
    executionPathInvoked: false,
    writeAdapterInvoked: false,
    dbWritesPerformed: false,
    scheduleRecordsUpdated: false,
    readyForG6E5ScheduleNonDryRunPocFinalPreflight:
      complete && config.readyForG6E5ScheduleNonDryRunPocFinalPreflight === true,
    readyForG6E5ScheduleNonDryRunPoc: false,
    readyForNonDryRunSchedulePoC: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleNonDryRunPocExecutionPathVerificationResultOutput(
  outDir,
  report,
) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(
    outDir,
    "schedule-non-dry-run-poc-execution-path-verification-result.json",
  );
  const mdPath = path.join(
    outDir,
    "SCHEDULE_NON_DRY_RUN_POC_EXECUTION_PATH_VERIFICATION_RESULT_REPORT.md",
  );
  const summary = {
    phase: report.phase,
    envGatedVisibleVerified: report.envGatedVisibleVerified,
    manualConfirmVerified: report.manualConfirmVerified,
    dbUnchangedVerified: report.dbUnchangedVerified,
    triggerClicked: report.triggerClicked,
    executionPathInvoked: report.executionPathInvoked,
    writeAdapterInvoked: report.writeAdapterInvoked,
    dbWritesPerformed: report.dbWritesPerformed,
    scheduleRecordsUpdated: report.scheduleRecordsUpdated,
    readyForG6E5ScheduleNonDryRunPocFinalPreflight:
      report.readyForG6E5ScheduleNonDryRunPocFinalPreflight,
    readyForNonDryRunSchedulePoC: report.readyForNonDryRunSchedulePoC,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule Non-Dry-Run PoC Execution Path Verification Result Report",
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
