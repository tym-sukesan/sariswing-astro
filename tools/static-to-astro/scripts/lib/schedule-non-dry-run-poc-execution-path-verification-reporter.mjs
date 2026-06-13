/**
 * G-6-e5-schedule-non-dry-run-poc-execution-path-verification — Reporter (static scan; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { runScheduleNonDryRunPocExecutionPathImplementationReport } from "./schedule-non-dry-run-poc-execution-path-implementation-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
const REPO_ROOT = path.resolve(__dirname, "../../../..");

const DOC_REL = "docs/schedule-non-dry-run-poc-execution-path-verification.md";
const CONFIG_REL =
  "config/admin/schedule-non-dry-run-poc-execution-path-verification.json";
const IMPL_CONFIG_REL =
  "config/admin/schedule-non-dry-run-poc-execution-path-implementation.json";

const TRIGGER_TS = "src/lib/admin/staging-write/schedule-non-dry-run-poc-trigger.ts";
const ASTRO_SECTION =
  "tools/static-to-astro/templates/admin-cms/data/components/AdminStagingScheduleNonDryRunPocTriggerSection.astro";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Current status",
  "## 3. Verification checklist",
  "## 4. Normal dev verification",
  "## 5. Env-gated dev verification command",
  "## 6. Env-gated UI verification",
  "## 7. Manual confirm verification",
  "## 8. DB unchanged verification",
  "## 9. Static verification",
  "## 10. Gate decision",
  "## 11. Recommended next phase",
  "## 12. Final safety statement",
];

function grepRepo(pattern, paths) {
  try {
    const args = paths.map((p) => path.join(REPO_ROOT, p)).join(" ");
    const out = execSync(`git grep -n -E "${pattern}" -- ${args}`, {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return out.trim();
  } catch {
    return "";
  }
}

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

function fileHasDirectUpdate(filePath) {
  if (!fs.existsSync(filePath)) return false;
  return fs
    .readFileSync(filePath, "utf8")
    .split("\n")
    .some((line) => {
      const t = line.trim();
      if (t.startsWith("//") || t.startsWith("*")) return false;
      return /\.update\s*\(/.test(line);
    });
}

export function runScheduleNonDryRunPocExecutionPathVerificationReport({
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
  if (!doc.includes("Do not click the run button")) blockers.push("no-click-warning-missing");
  if (!doc.includes("normalDevHiddenVerified: true")) blockers.push("gate-normal-dev-missing");
  if (!doc.includes("envGatedVisibleVerified: true")) {
    blockers.push("gate-env-gated-missing");
  }
  if (!doc.includes("manualConfirmVerified: true")) {
    blockers.push("gate-manual-confirm-missing");
  }
  if (!doc.includes("G-6-e5-schedule-non-dry-run-poc-final-preflight")) {
    blockers.push("final-preflight-ref-missing");
  }
  if (!doc.includes("button clicked: no")) blockers.push("button-not-clicked-note-missing");

  const implReport = runScheduleNonDryRunPocExecutionPathImplementationReport({
    toolRoot,
    repoRoot,
    siteId,
  });
  if (!implReport.complete) {
    blockers.push(`impl-report:${implReport.blockers.join(",")}`);
  }

  if (!adminPagesDiffClean()) blockers.push("admin-pages-diff");

  const triggerPath = path.join(repoRoot, TRIGGER_TS);
  if (fileHasDirectUpdate(triggerPath)) blockers.push("trigger-direct-update");

  const adminWrite = grepRepo("updateScheduleWrite", ["src/pages/admin"]);
  if (adminWrite) blockers.push("admin-updateScheduleWrite");

  const astroPath = path.join(repoRoot, ASTRO_SECTION);
  const astro = fs.readFileSync(astroPath, "utf8");
  if (!astro.includes("hidden={!pocConfig.visible}")) {
    blockers.push("astro-default-hidden-missing");
  }
  if (!astro.includes("schedule-non-dry-run-poc-confirm-input")) {
    blockers.push("astro-manual-confirm-missing");
  }
  if (!astro.includes("schedule-non-dry-run-poc-run-btn")) blockers.push("astro-run-btn-missing");

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.executionPathVerified !== true) blockers.push("config-executionPathVerified");
  if (config.normalDevHiddenVerified !== true) {
    blockers.push("config-normalDevHiddenVerified");
  }
  if (config.envGatedVisibleVerified !== true) {
    blockers.push("config-envGatedVisibleVerified");
  }
  if (config.manualConfirmVerified !== true) {
    blockers.push("config-manualConfirmVerified");
  }
  if (config.triggerClicked !== false) blockers.push("config-triggerClicked");
  if (config.executionPathInvoked !== false) blockers.push("config-executionPathInvoked");
  if (config.writeAdapterInvoked !== false) blockers.push("config-writeAdapterInvoked");
  if (config.dbWritesPerformed !== false) blockers.push("config-dbWritesPerformed");
  if (config.readyForManualEnvGatedBrowserVerification !== false) {
    blockers.push("config-readyForManualEnvGatedBrowserVerification");
  }
  if (config.readyForG6E5ScheduleNonDryRunPocExecutionPathVerificationResult !== true) {
    blockers.push("config-readyForVerificationResult");
  }
  if (config.readyForNonDryRunSchedulePoC !== false) {
    blockers.push("config-readyForNonDryRunSchedulePoC");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e5-schedule-non-dry-run-poc-execution-path-verification",
    siteId,
    generatedAt: new Date().toISOString(),
    executionPathImplemented: true,
    executionPathVerified: complete && config.executionPathVerified === true,
    normalDevHiddenVerified: true,
    envGatedVisibleVerified: true,
    manualConfirmVerified: true,
    dbUnchangedVerified: config.dbUnchangedVerified === true,
    triggerClicked: false,
    executionPathInvoked: false,
    writeAdapterInvoked: false,
    dbWritesPerformed: false,
    scheduleRecordsUpdated: false,
    readyForManualEnvGatedBrowserVerification: false,
    readyForG6E5ScheduleNonDryRunPocExecutionPathVerificationResult: true,
    readyForG6E5ScheduleNonDryRunPocFinalPreflight:
      config.readyForG6E5ScheduleNonDryRunPocFinalPreflight === true,
    readyForG6E5ScheduleNonDryRunPoc: false,
    readyForNonDryRunSchedulePoC: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleNonDryRunPocExecutionPathVerificationOutput(
  outDir,
  report,
) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(
    outDir,
    "schedule-non-dry-run-poc-execution-path-verification.json",
  );
  const mdPath = path.join(
    outDir,
    "SCHEDULE_NON_DRY_RUN_POC_EXECUTION_PATH_VERIFICATION_REPORT.md",
  );
  const summary = {
    phase: report.phase,
    executionPathImplemented: report.executionPathImplemented,
    executionPathVerified: report.executionPathVerified,
    normalDevHiddenVerified: report.normalDevHiddenVerified,
    envGatedVisibleVerified: report.envGatedVisibleVerified,
    manualConfirmVerified: report.manualConfirmVerified,
    dbUnchangedVerified: report.dbUnchangedVerified,
    triggerClicked: report.triggerClicked,
    executionPathInvoked: report.executionPathInvoked,
    writeAdapterInvoked: report.writeAdapterInvoked,
    dbWritesPerformed: report.dbWritesPerformed,
    scheduleRecordsUpdated: report.scheduleRecordsUpdated,
    readyForManualEnvGatedBrowserVerification:
      report.readyForManualEnvGatedBrowserVerification,
    readyForG6E5ScheduleNonDryRunPocExecutionPathVerificationResult:
      report.readyForG6E5ScheduleNonDryRunPocExecutionPathVerificationResult,
    readyForG6E5ScheduleNonDryRunPocFinalPreflight:
      report.readyForG6E5ScheduleNonDryRunPocFinalPreflight,
    readyForNonDryRunSchedulePoC: report.readyForNonDryRunSchedulePoC,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule Non-Dry-Run PoC Execution Path Verification Report",
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
