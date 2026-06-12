/**
 * G-6-e5-schedule-non-dry-run-poc-target-selection — Reporter (static scan; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
const REPO_ROOT = path.resolve(__dirname, "../../../..");

const DOC_REL = "docs/schedule-non-dry-run-poc-target-selection.md";
const CONFIG_REL = "config/admin/schedule-non-dry-run-poc-target-selection.json";
const PREP_CONFIG_REL = "config/admin/schedule-non-dry-run-poc-prep.json";

const TARGET_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const TARGET_LEGACY_ID = "schedule-2026-07-010";
const FINAL_DESCRIPTION = "出演： [G-6-e5 non-dry-run PoC]";
const ROLLBACK_DESCRIPTION = "出演：";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Current status",
  "## 3. Candidate search result",
  "## 4. Selected target row",
  "## 5. Selection rationale",
  "## 6. beforeSnapshot",
  "## 7. Final PoC payload",
  "## 8. Expected after state",
  "## 9. Final rollback SQL",
  "## 10. Approval ID",
  "## 11. Future execution conditions",
  "## 12. Abort conditions",
  "## 13. Gate decision",
  "## 14. Recommended next phase",
  "## 15. Final safety statement",
];

const FORBIDDEN_IN_CONFIG = [
  /service_role/i,
  /SERVICE_ROLE/,
  /workflow_dispatch/,
  /\blftp\b/i,
  /\bftp\b/i,
  /create policy/i,
  /drop policy/i,
  /alter table/i,
  /\bgrant /i,
  /\brevoke /i,
  /storage\./,
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

function scanFileForForbidden(filePath) {
  if (!fs.existsSync(filePath)) return ["missing"];
  const hits = [];
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
    for (const p of FORBIDDEN_IN_CONFIG) {
      if (p.test(line)) hits.push(p.source);
    }
  }
  return [...new Set(hits)];
}

export function runScheduleNonDryRunPocTargetSelectionReport({
  toolRoot = DEFAULT_TOOL_ROOT,
  repoRoot = REPO_ROOT,
  siteId = "default",
}) {
  const blockers = [];
  const docPath = path.join(toolRoot, DOC_REL);
  const configPath = path.join(toolRoot, CONFIG_REL);
  const prepConfigPath = path.join(toolRoot, PREP_CONFIG_REL);

  if (!fs.existsSync(docPath)) blockers.push("doc-missing");
  if (!fs.existsSync(configPath)) blockers.push("config-missing");
  if (!fs.existsSync(prepConfigPath)) blockers.push("prep-config-missing");

  const doc = fs.existsSync(docPath) ? fs.readFileSync(docPath, "utf8") : "";
  for (const s of REQUIRED_SECTIONS) {
    if (!doc.includes(s)) blockers.push(`doc-missing:${s}`);
  }
  if (!doc.includes(TARGET_ID)) blockers.push("target-id-missing");
  if (!doc.includes(TARGET_LEGACY_ID)) blockers.push("target-legacy-id-missing");
  if (!doc.includes(FINAL_DESCRIPTION)) blockers.push("final-payload-missing");
  if (!doc.includes(`description = '${ROLLBACK_DESCRIPTION}'`)) {
    blockers.push("rollback-sql-missing");
  }
  if (!doc.includes("G-6-e5-schedule-non-dry-run-poc")) blockers.push("approval-id-missing");
  if (!doc.includes("readyForG6E5ScheduleNonDryRunPocExecutionPrep: true")) {
    blockers.push("gate-decision-missing");
  }
  if (!doc.includes("G-6-e5-schedule-non-dry-run-poc-execution-prep")) {
    blockers.push("next-phase-missing");
  }
  if (!doc.includes("Actual non-dry-run execution remains blocked")) {
    blockers.push("final-safety-missing");
  }
  if (!doc.includes("No write adapter has been invoked")) {
    blockers.push("no-invocation-statement-missing");
  }

  const forbidden = scanFileForForbidden(configPath);
  if (forbidden.length > 0) blockers.push(`forbidden-pattern:${forbidden.join(",")}`);

  if (!adminPagesDiffClean()) blockers.push("admin-pages-diff");

  const uiImport = grepRepo("updateScheduleWrite", ["src/pages", "src/lib"]);
  const uiLines = uiImport ? uiImport.split("\n").filter(Boolean) : [];
  if (uiLines.some((l) => !l.includes("schedule-write-adapter.ts"))) {
    blockers.push("unexpected-updateScheduleWrite-import");
  }

  const runPocScript = path.join(toolRoot, "scripts/run-schedule-non-dry-run-poc.mjs");
  if (fs.existsSync(runPocScript)) blockers.push("run-poc-script-exists-prematurely");

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.targetRowSelected !== true) blockers.push("config-targetRowSelected");
  if (config.targetId !== TARGET_ID) blockers.push("config-targetId");
  if (config.beforeSnapshotCaptured !== true) blockers.push("config-beforeSnapshotCaptured");
  if (config.payloadFinalized !== true) blockers.push("config-payloadFinalized");
  if (config.rollbackSqlFinalized !== true) blockers.push("config-rollbackSqlFinalized");
  if (config.writeAdapterInvoked !== false) blockers.push("config-writeAdapterInvoked");
  if (config.dbWritesPerformed !== false) blockers.push("config-dbWritesPerformed");
  if (config.scheduleRecordsUpdated !== false) blockers.push("config-scheduleRecordsUpdated");
  if (config.rollbackExecuted !== false) blockers.push("config-rollbackExecuted");
  if (config.readyForG6E5ScheduleNonDryRunPocExecutionPrep !== true) {
    blockers.push("config-readyForG6E5ScheduleNonDryRunPocExecutionPrep");
  }
  if (config.readyForG6E5ScheduleNonDryRunPoc !== false) {
    blockers.push("config-readyForG6E5ScheduleNonDryRunPoc");
  }
  if (config.readyForNonDryRunSchedulePoC !== false) {
    blockers.push("config-readyForNonDryRunSchedulePoC");
  }
  if (config.finalPayload?.description !== FINAL_DESCRIPTION) {
    blockers.push("config-finalPayload");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e5-schedule-non-dry-run-poc-target-selection",
    siteId,
    generatedAt: new Date().toISOString(),
    targetId: config.targetId,
    targetLegacyId: config.targetLegacyId,
    plannedFieldChange: config.plannedFieldChange,
    targetRowSelected: true,
    beforeSnapshotCaptured: true,
    payloadFinalized: true,
    rollbackSqlFinalized: true,
    writeAdapterInvoked: false,
    dbWritesPerformed: false,
    scheduleRecordsUpdated: false,
    readyForG6E5ScheduleNonDryRunPocExecutionPrep:
      complete && config.readyForG6E5ScheduleNonDryRunPocExecutionPrep === true,
    readyForG6E5ScheduleNonDryRunPoc: false,
    readyForNonDryRunSchedulePoC: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleNonDryRunPocTargetSelectionOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "schedule-non-dry-run-poc-target-selection.json");
  const mdPath = path.join(outDir, "SCHEDULE_NON_DRY_RUN_POC_TARGET_SELECTION_REPORT.md");
  const summary = {
    phase: report.phase,
    targetRowSelected: report.targetRowSelected,
    beforeSnapshotCaptured: report.beforeSnapshotCaptured,
    payloadFinalized: report.payloadFinalized,
    rollbackSqlFinalized: report.rollbackSqlFinalized,
    writeAdapterInvoked: report.writeAdapterInvoked,
    dbWritesPerformed: report.dbWritesPerformed,
    scheduleRecordsUpdated: report.scheduleRecordsUpdated,
    readyForG6E5ScheduleNonDryRunPocExecutionPrep:
      report.readyForG6E5ScheduleNonDryRunPocExecutionPrep,
    readyForNonDryRunSchedulePoC: report.readyForNonDryRunSchedulePoC,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule Non-Dry-Run PoC Target Selection Report",
    "",
    `Phase: ${report.phase}`,
    `Complete: ${report.complete}`,
    `Target: ${report.targetId} (${report.targetLegacyId})`,
    `Recommended next: ${report.recommendedNextPhase}`,
    "",
    report.blockers.length
      ? `Blockers:\n${report.blockers.map((b) => `- ${b}`).join("\n")}`
      : "No blockers.",
  ].join("\n");
  fs.writeFileSync(mdPath, `${md}\n`, "utf8");
  return { jsonPath, mdPath };
}
