/**
 * G-6-e5-schedule-non-dry-run-poc-prep — Reporter (static scan; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
const REPO_ROOT = path.resolve(__dirname, "../../../..");

const DOC_REL = "docs/schedule-non-dry-run-poc-prep.md";
const CONFIG_REL = "config/admin/schedule-non-dry-run-poc-prep.json";
const VERIFICATION_CONFIG_REL = "config/admin/schedule-write-adapter-verification.json";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Current status",
  "## 3. First PoC scope",
  "## 4. Target row selection criteria",
  "## 5. Manual read-only SQL: find target candidates",
  "## 6. Target row manual recording template",
  "## 7. beforeSnapshot SQL",
  "## 8. Proposed minimal payload",
  "## 9. expectedAfter",
  "## 10. rollback SQL template",
  "## 11. Approval ID",
  "## 12. Future execution mode",
  "## 13. Future execution checklist",
  "## 14. Abort conditions",
  "## 15. Result recording template",
  "## 16. Gate decision",
  "## 17. Recommended next phase",
  "## 18. Final safety statement",
];

const FORBIDDEN_IN_PREP_ARTIFACTS = [
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
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
    for (const p of FORBIDDEN_IN_PREP_ARTIFACTS) {
      if (p.test(line)) hits.push(p.source);
    }
  }
  return [...new Set(hits)];
}

function dryRunFalseOnlyAsFutureWarning(doc) {
  const lines = doc.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes("PUBLIC_ADMIN_WRITE_DRY_RUN=false")) continue;
    const window = lines.slice(Math.max(0, i - 3), i + 4).join("\n").toLowerCase();
    const ok =
      window.includes("do not run") ||
      window.includes("not executed") ||
      window.includes("future") ||
      window.includes("reference only") ||
      window.includes("warning");
    if (!ok) return false;
  }
  return true;
}

export function runScheduleNonDryRunPocPrepReport({
  toolRoot = DEFAULT_TOOL_ROOT,
  repoRoot = REPO_ROOT,
  siteId = "default",
}) {
  const blockers = [];
  const docPath = path.join(toolRoot, DOC_REL);
  const configPath = path.join(toolRoot, CONFIG_REL);
  const verificationConfigPath = path.join(toolRoot, VERIFICATION_CONFIG_REL);

  if (!fs.existsSync(docPath)) blockers.push("doc-missing");
  if (!fs.existsSync(configPath)) blockers.push("config-missing");
  if (!fs.existsSync(verificationConfigPath)) blockers.push("verification-config-missing");

  const doc = fs.existsSync(docPath) ? fs.readFileSync(docPath, "utf8") : "";
  for (const s of REQUIRED_SECTIONS) {
    if (!doc.includes(s)) blockers.push(`doc-missing:${s}`);
  }
  if (!doc.includes("G-6-e5-schedule-non-dry-run-poc")) blockers.push("approval-id-missing");
  if (!doc.includes("description only") && !doc.includes("description_only")) {
    blockers.push("payload-plan-missing");
  }
  if (!doc.includes("Do not update any row until")) blockers.push("safety-warning-missing");
  if (!doc.includes("Rollback SQL is prepared but not executed")) {
    blockers.push("rollback-not-executed-note-missing");
  }
  if (!doc.includes("Do not run with PUBLIC_ADMIN_WRITE_DRY_RUN=false")) {
    blockers.push("dry-run-false-warning-missing");
  }
  if (!dryRunFalseOnlyAsFutureWarning(doc)) {
    blockers.push("dry-run-false-without-warning");
  }
  if (!doc.includes("G-6-e5-schedule-non-dry-run-poc-target-selection")) {
    blockers.push("next-phase-missing");
  }
  if (!doc.includes("Actual non-dry-run execution remains blocked")) {
    blockers.push("final-safety-missing");
  }

  for (const rel of [CONFIG_REL]) {
    const hits = scanFileForForbidden(path.join(toolRoot, rel));
    if (hits.length > 0) blockers.push(`forbidden-pattern:${rel}:${hits.join(",")}`);
  }

  if (!adminPagesDiffClean()) blockers.push("admin-pages-diff");

  const uiImport = grepRepo("updateScheduleWrite", ["src/pages", "src/lib"]);
  const uiLines = uiImport ? uiImport.split("\n").filter(Boolean) : [];
  if (uiLines.some((l) => !l.includes("schedule-write-adapter.ts"))) {
    blockers.push("unexpected-updateScheduleWrite-import");
  }

  const runPocScript = path.join(toolRoot, "scripts/run-schedule-non-dry-run-poc.mjs");
  if (fs.existsSync(runPocScript)) blockers.push("run-poc-script-exists-prematurely");

  const verificationConfig = JSON.parse(fs.readFileSync(verificationConfigPath, "utf8"));
  if (verificationConfig.writeAdapterVerified !== true) {
    blockers.push("write-adapter-not-verified");
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.plannedOperation !== "single_row_update") blockers.push("config-plannedOperation");
  if (config.plannedFieldChange !== "description_only") blockers.push("config-plannedFieldChange");
  if (config.writeAdapterInvoked !== false) blockers.push("config-writeAdapterInvoked");
  if (config.dbWritesPerformed !== false) blockers.push("config-dbWritesPerformed");
  if (config.scheduleRecordsUpdated !== false) blockers.push("config-scheduleRecordsUpdated");
  if (config.targetRowSelected !== false) blockers.push("config-targetRowSelected");
  if (config.beforeSnapshotCaptured !== false) blockers.push("config-beforeSnapshotCaptured");
  if (config.rollbackSqlPrepared !== true) blockers.push("config-rollbackSqlPrepared");
  if (config.readyForTargetRowManualSelection !== true) {
    blockers.push("config-readyForTargetRowManualSelection");
  }
  if (config.readyForNonDryRunSchedulePoC !== false) {
    blockers.push("config-readyForNonDryRunSchedulePoC");
  }
  if (config.approvalIdRequired !== "G-6-e5-schedule-non-dry-run-poc") {
    blockers.push("config-approvalIdRequired");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e5-schedule-non-dry-run-poc-prep",
    siteId,
    generatedAt: new Date().toISOString(),
    plannedOperation: config.plannedOperation,
    plannedFieldChange: config.plannedFieldChange,
    writeAdapterImplemented: true,
    writeAdapterVerified: true,
    writeAdapterInvoked: false,
    dbWritesPerformed: false,
    scheduleRecordsUpdated: false,
    targetRowSelected: false,
    beforeSnapshotCaptured: false,
    rollbackSqlPrepared: true,
    readyForTargetRowManualSelection: true,
    readyForBeforeSnapshotCapture: true,
    readyForRollbackSqlFinalization: false,
    readyForG6E5ScheduleNonDryRunPoc: false,
    readyForNonDryRunSchedulePoC: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleNonDryRunPocPrepOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "schedule-non-dry-run-poc-prep.json");
  const mdPath = path.join(outDir, "SCHEDULE_NON_DRY_RUN_POC_PREP_REPORT.md");
  const summary = {
    phase: report.phase,
    plannedOperation: report.plannedOperation,
    plannedFieldChange: report.plannedFieldChange,
    writeAdapterInvoked: report.writeAdapterInvoked,
    dbWritesPerformed: report.dbWritesPerformed,
    scheduleRecordsUpdated: report.scheduleRecordsUpdated,
    targetRowSelected: report.targetRowSelected,
    beforeSnapshotCaptured: report.beforeSnapshotCaptured,
    rollbackSqlPrepared: report.rollbackSqlPrepared,
    readyForTargetRowManualSelection: report.readyForTargetRowManualSelection,
    readyForNonDryRunSchedulePoC: report.readyForNonDryRunSchedulePoC,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule Non-Dry-Run PoC Prep Report",
    "",
    `Phase: ${report.phase}`,
    `Complete: ${report.complete}`,
    `Planned: ${report.plannedOperation} / ${report.plannedFieldChange}`,
    `Recommended next: ${report.recommendedNextPhase}`,
    "",
    report.blockers.length
      ? `Blockers:\n${report.blockers.map((b) => `- ${b}`).join("\n")}`
      : "No blockers.",
  ].join("\n");
  fs.writeFileSync(mdPath, `${md}\n`, "utf8");
  return { jsonPath, mdPath };
}
