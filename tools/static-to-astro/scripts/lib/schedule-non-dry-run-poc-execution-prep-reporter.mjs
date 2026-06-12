/**
 * G-6-e5-schedule-non-dry-run-poc-execution-prep — Reporter (static scan; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
const REPO_ROOT = path.resolve(__dirname, "../../../..");

const DOC_REL = "docs/schedule-non-dry-run-poc-execution-prep.md";
const CONFIG_REL = "config/admin/schedule-non-dry-run-poc-execution-prep.json";
const TARGET_CONFIG_REL = "config/admin/schedule-non-dry-run-poc-target-selection.json";

const TARGET_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const RUN_SCRIPT_REL = "scripts/run-schedule-non-dry-run-poc.mjs";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Current status",
  "## 3. First PoC target",
  "## 4. Fixed payload",
  "## 5. beforeSnapshot re-check requirement",
  "## 6. One-off execution path design",
  "## 7. Required future env gates",
  "## 8. Future command template",
  "## 9. One-off script behavior plan",
  "## 10. Auth boundary decision",
  "## 11. Future after verification SQL",
  "## 12. Rollback SQL",
  "## 13. Future execution abort conditions",
  "## 14. Result recording template",
  "## 15. Gate decision",
  "## 16. Recommended next phase",
  "## 17. Final safety statement",
];

const FORBIDDEN_IN_CONFIG = [
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
    if (/service_role/i.test(line) && !/serviceRoleAllowed.*false/i.test(line)) {
      hits.push("service_role");
    }
  }
  return [...new Set(hits)];
}

function docProhibitsServiceRole(doc) {
  const lower = doc.toLowerCase();
  return (
    lower.includes("never use service_role") &&
    lower.includes("must not run with service_role") &&
    lower.includes("refuse service_role") &&
    lower.includes("serviceroleallowed: false")
  );
}

function dryRunFalseOnlyAsFutureWarning(doc) {
  if (!doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=false")) return true;
  const lower = doc.toLowerCase();
  return (
    lower.includes("do not run with public_admin_write_dry_run=false") ||
    lower.includes("do not run in this prep phase") ||
    lower.includes("do not run it in this phase") ||
    lower.includes("future command template only") ||
    lower.includes("future execution only")
  );
}

export function runScheduleNonDryRunPocExecutionPrepReport({
  toolRoot = DEFAULT_TOOL_ROOT,
  repoRoot = REPO_ROOT,
  siteId = "default",
}) {
  const blockers = [];
  const docPath = path.join(toolRoot, DOC_REL);
  const configPath = path.join(toolRoot, CONFIG_REL);
  const targetConfigPath = path.join(toolRoot, TARGET_CONFIG_REL);
  const runScriptPath = path.join(toolRoot, RUN_SCRIPT_REL);

  if (!fs.existsSync(docPath)) blockers.push("doc-missing");
  if (!fs.existsSync(configPath)) blockers.push("config-missing");
  if (!fs.existsSync(targetConfigPath)) blockers.push("target-config-missing");

  const doc = fs.existsSync(docPath) ? fs.readFileSync(docPath, "utf8") : "";
  for (const s of REQUIRED_SECTIONS) {
    if (!doc.includes(s)) blockers.push(`doc-missing:${s}`);
  }
  if (!doc.includes(TARGET_ID)) blockers.push("target-id-missing");
  if (!doc.includes("G-6-e5-schedule-non-dry-run-poc")) blockers.push("approval-id-missing");
  if (!doc.includes("出演： [G-6-e5 non-dry-run PoC]")) blockers.push("payload-missing");
  if (!doc.includes("run-schedule-non-dry-run-poc.mjs")) blockers.push("script-plan-missing");
  if (!doc.includes("is **not implemented**")) blockers.push("script-not-implemented-note-missing");
  if (!docProhibitsServiceRole(doc)) blockers.push("service-role-prohibition-missing");
  if (!doc.includes("requiresAuthenticatedAdminUser")) {
    // doc uses prose; check key phrases
    if (!doc.includes("authenticated admin user")) blockers.push("auth-requirement-missing");
  }
  if (!doc.includes("Do not run it in this phase")) blockers.push("no-run-warning-missing");
  if (!dryRunFalseOnlyAsFutureWarning(doc)) blockers.push("dry-run-false-without-warning");
  if (!doc.includes("readyForG6E5ScheduleNonDryRunPocExecutionPathImplementation: true")) {
    blockers.push("gate-decision-missing");
  }
  if (!doc.includes("G-6-e5-schedule-non-dry-run-poc-execution-path-implementation")) {
    blockers.push("next-phase-missing");
  }
  if (!doc.includes("Actual non-dry-run execution remains blocked")) {
    blockers.push("final-safety-missing");
  }

  const forbidden = scanFileForForbidden(configPath);
  if (forbidden.length > 0) blockers.push(`forbidden-pattern:config:${forbidden.join(",")}`);

  if (fs.existsSync(runScriptPath)) blockers.push("run-script-exists-prematurely");

  if (!adminPagesDiffClean()) blockers.push("admin-pages-diff");

  const uiImport = grepRepo("updateScheduleWrite", ["src/pages", "src/lib"]);
  const uiLines = uiImport ? uiImport.split("\n").filter(Boolean) : [];
  if (uiLines.some((l) => !l.includes("schedule-write-adapter.ts"))) {
    blockers.push("unexpected-updateScheduleWrite-import");
  }

  if (fs.existsSync(runScriptPath)) {
    const runSrc = fs.readFileSync(runScriptPath, "utf8");
    if (/\.update\s*\(/.test(runSrc)) blockers.push("update-in-run-script");
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.executionPrepCreated !== true) blockers.push("config-executionPrepCreated");
  if (config.executionScriptImplemented !== false) {
    blockers.push("config-executionScriptImplemented");
  }
  if (config.executionScriptInvoked !== false) blockers.push("config-executionScriptInvoked");
  if (config.writeAdapterInvoked !== false) blockers.push("config-writeAdapterInvoked");
  if (config.dbWritesPerformed !== false) blockers.push("config-dbWritesPerformed");
  if (config.scheduleRecordsUpdated !== false) blockers.push("config-scheduleRecordsUpdated");
  if (config.serviceRoleAllowed !== false) blockers.push("config-serviceRoleAllowed");
  if (config.requiresAuthenticatedAdminUser !== true) {
    blockers.push("config-requiresAuthenticatedAdminUser");
  }
  if (config.readyForG6E5ScheduleNonDryRunPocExecutionPathImplementation !== true) {
    blockers.push("config-readyForG6E5ScheduleNonDryRunPocExecutionPathImplementation");
  }
  if (config.readyForG6E5ScheduleNonDryRunPoc !== false) {
    blockers.push("config-readyForG6E5ScheduleNonDryRunPoc");
  }
  if (config.readyForNonDryRunSchedulePoC !== false) {
    blockers.push("config-readyForNonDryRunSchedulePoC");
  }
  if (config.targetId !== TARGET_ID) blockers.push("config-targetId");

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e5-schedule-non-dry-run-poc-execution-prep",
    siteId,
    generatedAt: new Date().toISOString(),
    executionPrepCreated: true,
    executionScriptImplemented: false,
    executionScriptInvoked: false,
    writeAdapterInvoked: false,
    dbWritesPerformed: false,
    scheduleRecordsUpdated: false,
    serviceRoleAllowed: false,
    requiresAuthenticatedAdminUser: true,
    readyForG6E5ScheduleNonDryRunPocExecutionPathImplementation:
      complete && config.readyForG6E5ScheduleNonDryRunPocExecutionPathImplementation === true,
    readyForG6E5ScheduleNonDryRunPoc: false,
    readyForNonDryRunSchedulePoC: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleNonDryRunPocExecutionPrepOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "schedule-non-dry-run-poc-execution-prep.json");
  const mdPath = path.join(outDir, "SCHEDULE_NON_DRY_RUN_POC_EXECUTION_PREP_REPORT.md");
  const summary = {
    phase: report.phase,
    executionPrepCreated: report.executionPrepCreated,
    executionScriptImplemented: report.executionScriptImplemented,
    executionScriptInvoked: report.executionScriptInvoked,
    writeAdapterInvoked: report.writeAdapterInvoked,
    dbWritesPerformed: report.dbWritesPerformed,
    scheduleRecordsUpdated: report.scheduleRecordsUpdated,
    serviceRoleAllowed: report.serviceRoleAllowed,
    readyForG6E5ScheduleNonDryRunPocExecutionPathImplementation:
      report.readyForG6E5ScheduleNonDryRunPocExecutionPathImplementation,
    readyForNonDryRunSchedulePoC: report.readyForNonDryRunSchedulePoC,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule Non-Dry-Run PoC Execution Prep Report",
    "",
    `Phase: ${report.phase}`,
    `Complete: ${report.complete}`,
    `serviceRoleAllowed: ${report.serviceRoleAllowed}`,
    `Recommended next: ${report.recommendedNextPhase}`,
    "",
    report.blockers.length
      ? `Blockers:\n${report.blockers.map((b) => `- ${b}`).join("\n")}`
      : "No blockers.",
  ].join("\n");
  fs.writeFileSync(mdPath, `${md}\n`, "utf8");
  return { jsonPath, mdPath };
}
