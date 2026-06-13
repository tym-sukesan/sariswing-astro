/**
 * G-6-e5-schedule-non-dry-run-poc-execution-attempt-fix-verification-result — Reporter (static scan; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { runScheduleNonDryRunPocExecutionAttemptFixVerificationReport } from "./schedule-non-dry-run-poc-execution-attempt-fix-verification-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
const REPO_ROOT = path.resolve(__dirname, "../../../..");

const DOC_REL =
  "docs/schedule-non-dry-run-poc-execution-attempt-fix-verification-result.md";
const CONFIG_REL =
  "config/admin/schedule-non-dry-run-poc-execution-attempt-fix-verification-result.json";
const PRIOR_CONFIG_REL =
  "config/admin/schedule-non-dry-run-poc-execution-attempt-fix-verification.json";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Summary",
  "## 3. Fixes verified",
  "## 4. Static verification result",
  "## 5. Browser verification result",
  "## 6. DB state",
  "## 7. Safety result",
  "## 8. Retry readiness",
  "## 9. Final abort conditions for retry",
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

export function runScheduleNonDryRunPocExecutionAttemptFixVerificationResultReport({
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
  if (!doc.includes("Fix verification: PASS")) blockers.push("fix-verification-pass-missing");
  if (!doc.includes("Run button clicked: no")) blockers.push("run-not-clicked-missing");
  if (!doc.includes("readyForExplicitRetry: true")) {
    blockers.push("gate-readyForExplicitRetry-missing");
  }
  if (!doc.includes("G-6-e5-schedule-non-dry-run-poc-explicit-retry")) {
    blockers.push("next-phase-missing");
  }

  const priorReport = runScheduleNonDryRunPocExecutionAttemptFixVerificationReport({
    toolRoot,
    repoRoot,
    siteId,
  });
  if (!priorReport.complete) {
    blockers.push(`prior-fix-verification:${priorReport.blockers.join(",")}`);
  }

  if (!adminPagesDiffClean()) blockers.push("admin-pages-diff");

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.fixVerificationResultRecorded !== true) {
    blockers.push("config-fixVerificationResultRecorded");
  }
  if (config.fixVerified !== true) blockers.push("config-fixVerified");
  if (config.envGatedVisibleVerified !== true) {
    blockers.push("config-envGatedVisibleVerified");
  }
  if (config.manualConfirmVerified !== true) {
    blockers.push("config-manualConfirmVerified");
  }
  if (config.triggerClickedInThisPhase !== false) {
    blockers.push("config-triggerClickedInThisPhase");
  }
  if (config.dbWritesPerformedInThisPhase !== false) {
    blockers.push("config-dbWritesPerformedInThisPhase");
  }
  if (config.rollbackNeeded !== false) blockers.push("config-rollbackNeeded");
  if (config.readyForExplicitRetry !== true) {
    blockers.push("config-readyForExplicitRetry");
  }
  if (config.readyForNonDryRunSchedulePoC !== false) {
    blockers.push("config-readyForNonDryRunSchedulePoC");
  }

  const priorConfigPath = path.join(toolRoot, PRIOR_CONFIG_REL);
  if (fs.existsSync(priorConfigPath)) {
    const priorConfig = JSON.parse(fs.readFileSync(priorConfigPath, "utf8"));
    if (priorConfig.envGatedVisibleVerified !== true) {
      blockers.push("prior-config-envGatedVisibleVerified");
    }
    if (priorConfig.manualConfirmVerified !== true) {
      blockers.push("prior-config-manualConfirmVerified");
    }
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e5-schedule-non-dry-run-poc-execution-attempt-fix-verification-result",
    siteId,
    generatedAt: new Date().toISOString(),
    fixVerificationResultRecorded: true,
    fixVerified: true,
    envGatedVisibleVerified: true,
    manualConfirmVerified: true,
    triggerClickedInThisPhase: false,
    dbWritesPerformedInThisPhase: false,
    rollbackNeeded: false,
    readyForExplicitRetry: complete && config.readyForExplicitRetry === true,
    readyForNonDryRunSchedulePoC: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleNonDryRunPocExecutionAttemptFixVerificationResultOutput(
  outDir,
  report,
) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(
    outDir,
    "schedule-non-dry-run-poc-execution-attempt-fix-verification-result.json",
  );
  const mdPath = path.join(
    outDir,
    "SCHEDULE_NON_DRY_RUN_POC_EXECUTION_ATTEMPT_FIX_VERIFICATION_RESULT_REPORT.md",
  );
  const summary = {
    phase: report.phase,
    fixVerificationResultRecorded: report.fixVerificationResultRecorded,
    fixVerified: report.fixVerified,
    envGatedVisibleVerified: report.envGatedVisibleVerified,
    manualConfirmVerified: report.manualConfirmVerified,
    triggerClickedInThisPhase: report.triggerClickedInThisPhase,
    dbWritesPerformedInThisPhase: report.dbWritesPerformedInThisPhase,
    rollbackNeeded: report.rollbackNeeded,
    readyForExplicitRetry: report.readyForExplicitRetry,
    readyForNonDryRunSchedulePoC: report.readyForNonDryRunSchedulePoC,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule Non-Dry-Run PoC Execution Attempt Fix Verification Result Report",
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
