/**
 * G-6-e4-schedule-write-adapter-verification — Reporter (static scan; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { runScheduleWriteAdapterImplementationReport } from "./schedule-write-adapter-implementation-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
const REPO_ROOT = path.resolve(__dirname, "../../../..");

const DOC_REL = "docs/schedule-write-adapter-verification.md";
const CONFIG_REL = "config/admin/schedule-write-adapter-verification.json";
const IMPL_CONFIG_REL = "config/admin/schedule-write-adapter-implementation.json";

const DRY_RUN_ADAPTER_FILES = [
  "src/lib/admin/staging-write/schedule-dry-run-adapter.ts",
  "src/lib/admin/staging-write/schedule-dry-run-payload.ts",
  "src/lib/admin/staging-write/schedule-dry-run-validation.ts",
];

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Current status",
  "## 3. Implemented files",
  "## 4. Adapter design verified",
  "## 5. Static safety checks",
  "## 6. UI connection verification",
  "## 7. Dry-run adapter separation",
  "## 8. Runtime status",
  "## 9. Build/report verification",
  "## 10. Risk assessment",
  "## 11. What changed",
  "## 12. What did not change",
  "## 13. Gate decision",
  "## 14. Recommended next phase",
  "## 15. Final safety statement",
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

function updateScheduleWriteUiClean() {
  const hits = grepRepo("updateScheduleWrite", ["src/pages", "src/lib"]);
  if (!hits) return true;
  const lines = hits.split("\n").filter(Boolean);
  return lines.every((line) => line.includes("schedule-write-adapter.ts"));
}

export function runScheduleWriteAdapterVerificationReport({
  toolRoot = DEFAULT_TOOL_ROOT,
  repoRoot = REPO_ROOT,
  siteId = "default",
}) {
  const blockers = [];
  const docPath = path.join(toolRoot, DOC_REL);
  const configPath = path.join(toolRoot, CONFIG_REL);
  const implConfigPath = path.join(toolRoot, IMPL_CONFIG_REL);

  if (!fs.existsSync(docPath)) blockers.push("doc-missing");
  if (!fs.existsSync(configPath)) blockers.push("config-missing");
  if (!fs.existsSync(implConfigPath)) blockers.push("impl-config-missing");

  const doc = fs.existsSync(docPath) ? fs.readFileSync(docPath, "utf8") : "";
  for (const s of REQUIRED_SECTIONS) {
    if (!doc.includes(s)) blockers.push(`doc-missing:${s}`);
  }
  if (!doc.includes("writeAdapterVerified: true")) {
    blockers.push("gate-decision-missing");
  }
  if (!doc.includes("G-6-e5-schedule-non-dry-run-poc-prep")) {
    blockers.push("next-phase-missing");
  }
  if (!doc.includes("It has not been invoked")) {
    blockers.push("safety-statement-missing");
  }

  const implReport = runScheduleWriteAdapterImplementationReport({
    toolRoot,
    repoRoot,
    siteId,
  });
  if (!implReport.complete) {
    blockers.push(`impl-report:${implReport.blockers.join(",")}`);
  }

  if (!adminPagesDiffClean()) blockers.push("admin-pages-diff");

  const dryRunWriteHits = grepRepo(
    "\\.update\\(|\\.insert\\(|\\.delete\\(|\\.upsert\\(|rpc\\(",
    DRY_RUN_ADAPTER_FILES,
  );
  if (dryRunWriteHits) blockers.push("dry-run-write-methods-found");

  if (!updateScheduleWriteUiClean()) {
    blockers.push("ui-imports-updateScheduleWrite");
  }

  const scheduleWriteRpc = grepRepo(
    "\\.insert\\(|\\.delete\\(|\\.upsert\\(|\\.rpc\\(",
    [
      "src/lib/admin/staging-write/schedule-write-adapter.ts",
      "src/lib/admin/staging-write/schedule-write-guards.ts",
      "src/lib/admin/staging-write/schedule-write-types.ts",
    ],
  );
  if (scheduleWriteRpc) blockers.push("schedule-write-forbidden-methods");

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.writeAdapterImplemented !== true) {
    blockers.push("config-writeAdapterImplemented");
  }
  if (config.writeAdapterVerified !== true) blockers.push("config-writeAdapterVerified");
  if (config.writeAdapterInvoked !== false) blockers.push("config-writeAdapterInvoked");
  if (config.dbWritesPerformed !== false) blockers.push("config-dbWritesPerformed");
  if (config.uiConnected !== false) blockers.push("config-uiConnected");
  if (config.nonDryRunUiExposed !== false) {
    blockers.push("config-nonDryRunUiExposed");
  }
  if (config.dryRunAdapterRemainsPure !== true) {
    blockers.push("config-dryRunAdapterRemainsPure");
  }
  if (config.writeAdapterUiImportAbsent !== true) {
    blockers.push("config-writeAdapterUiImportAbsent");
  }
  if (config.readyForG6E5ScheduleNonDryRunPocPrep !== true) {
    blockers.push("config-readyForG6E5ScheduleNonDryRunPocPrep");
  }
  if (config.readyForNonDryRunSchedulePoC !== false) {
    blockers.push("config-readyForNonDryRunSchedulePoC");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e4-schedule-write-adapter-verification",
    siteId,
    generatedAt: new Date().toISOString(),
    writeAdapterImplemented: true,
    writeAdapterVerified: complete && config.writeAdapterVerified === true,
    writeAdapterInvoked: false,
    dbWritesPerformed: false,
    scheduleRecordsUpdated: false,
    uiConnected: false,
    nonDryRunUiExposed: false,
    dryRunAdapterRemainsPure: config.dryRunAdapterRemainsPure === true,
    writeAdapterUiImportAbsent: updateScheduleWriteUiClean(),
    readyForG6E5ScheduleNonDryRunPocPrep:
      complete && config.readyForG6E5ScheduleNonDryRunPocPrep === true,
    readyForG6EWriteImplementation: false,
    readyForNonDryRunSchedulePoC: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleWriteAdapterVerificationOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "schedule-write-adapter-verification.json");
  const mdPath = path.join(outDir, "SCHEDULE_WRITE_ADAPTER_VERIFICATION_REPORT.md");
  const summary = {
    phase: report.phase,
    writeAdapterImplemented: report.writeAdapterImplemented,
    writeAdapterVerified: report.writeAdapterVerified,
    writeAdapterInvoked: report.writeAdapterInvoked,
    dbWritesPerformed: report.dbWritesPerformed,
    scheduleRecordsUpdated: report.scheduleRecordsUpdated,
    uiConnected: report.uiConnected,
    nonDryRunUiExposed: report.nonDryRunUiExposed,
    readyForG6E5ScheduleNonDryRunPocPrep: report.readyForG6E5ScheduleNonDryRunPocPrep,
    readyForNonDryRunSchedulePoC: report.readyForNonDryRunSchedulePoC,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule Write Adapter Verification Report",
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
