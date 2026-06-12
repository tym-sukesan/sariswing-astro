/**
 * G-6-e2-schedule-dry-run-ui-verification-result — Reporter (docs/config scan only; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/schedule-dry-run-ui-verification-result.md";
const CONFIG_REL = "config/admin/schedule-dry-run-ui-verification-result.json";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Verification environment",
  "## 3. Manual browser check summary",
  "## 4. Observed UI elements",
  "## 5. Safety observations",
  "## 6. Verification checklist",
  "## 7. Known caveats",
  "## 8. Current status",
  "## 9. Remaining gaps",
  "## 10. Recommended next phase",
  "## 11. Gate decision",
  "## 12. Final safety statement",
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
  /upsert\s*\(/,
  /rpc\s*\(/,
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

function docHasChangeSql(doc) {
  const lines = doc.split("\n");
  let inSqlFence = false;
  for (const line of lines) {
    if (line.trim().startsWith("```sql")) {
      inSqlFence = true;
      continue;
    }
    if (inSqlFence && line.trim() === "```") {
      inSqlFence = false;
      continue;
    }
    if (!inSqlFence) continue;
    const upper = line.trim().toUpperCase();
    if (
      upper.startsWith("CREATE POLICY") ||
      upper.startsWith("DROP POLICY") ||
      upper.startsWith("ALTER TABLE") ||
      upper.startsWith("GRANT ") ||
      upper.startsWith("REVOKE ") ||
      upper.startsWith("INSERT INTO") ||
      upper.startsWith("UPDATE ") ||
      upper.startsWith("DELETE FROM") ||
      upper.startsWith("TRUNCATE ")
    ) {
      return true;
    }
  }
  return false;
}

export function runScheduleDryRunUiVerificationResultReport({
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

  if (!doc.includes("manualBrowserVerification: pass")) {
    blockers.push("manual-verification-status-missing");
  }
  if (!doc.includes("4322")) {
    blockers.push("actual-port-missing");
  }
  if (!doc.includes("G-6-e3-schedule-dry-run-adapter-planning")) {
    blockers.push("next-phase-missing");
  }
  if (!doc.includes("readyForG6E3ScheduleDryRunAdapterPlanning: true")) {
    blockers.push("gate-decision-missing");
  }
  if (!doc.includes("No schedule records were written")) {
    blockers.push("safety-statement-missing");
  }
  if (docHasChangeSql(doc)) {
    blockers.push("doc-contains-change-sql");
  }

  const reportPath = path.join(
    toolRoot,
    "scripts/report-schedule-dry-run-ui-verification-result.mjs",
  );
  const scan = scanReporter(reportPath);
  if (!scan.clean) blockers.push(`reporter-unsafe:${scan.hits.join(",")}`);

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.verificationOnly !== true) blockers.push("config-verificationOnly");
  if (config.manualBrowserVerification !== true) {
    blockers.push("config-manualBrowserVerification");
  }
  if (config.screenshotProvided !== true) blockers.push("config-screenshotProvided");
  if (config.manualVerificationResult !== "pass") {
    blockers.push("config-manualVerificationResult");
  }
  if (config.dryRunOnly !== true) blockers.push("config-dryRunOnly");
  if (config.scheduleDryRunUiScaffoldVerified !== true) {
    blockers.push("config-scheduleDryRunUiScaffoldVerified");
  }
  if (config.writeAdaptersImplemented !== false) {
    blockers.push("config-writeAdaptersImplemented");
  }
  if (config.dbWritesPerformed !== false) blockers.push("config-dbWritesPerformed");
  if (config.readyForG6E3ScheduleDryRunAdapterPlanning !== true) {
    blockers.push("config-readyForG6E3ScheduleDryRunAdapterPlanning");
  }
  if (config.readyForG6EWriteImplementation !== false) {
    blockers.push("config-readyForG6EWriteImplementation");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e2-schedule-dry-run-ui-verification-result",
    siteId,
    generatedAt: new Date().toISOString(),
    verificationOnly: true,
    manualBrowserVerification: config.manualBrowserVerification === true,
    screenshotProvided: config.screenshotProvided === true,
    manualVerificationResult: config.manualVerificationResult,
    dryRunOnly: true,
    uiImplemented: config.uiImplemented === true,
    scheduleDryRunUiScaffoldVerified: config.scheduleDryRunUiScaffoldVerified === true,
    writeAdaptersImplemented: false,
    dbWritesPerformed: false,
    readyForG6E3ScheduleDryRunAdapterPlanning:
      complete && config.readyForG6E3ScheduleDryRunAdapterPlanning === true,
    readyForG6EWriteImplementation: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleDryRunUiVerificationResultOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(
    outDir,
    "schedule-dry-run-ui-verification-result.json",
  );
  const mdPath = path.join(
    outDir,
    "SCHEDULE_DRY_RUN_UI_VERIFICATION_RESULT_REPORT.md",
  );
  const summary = {
    phase: report.phase,
    verificationOnly: report.verificationOnly,
    manualBrowserVerification: report.manualBrowserVerification,
    screenshotProvided: report.screenshotProvided,
    manualVerificationResult: report.manualVerificationResult,
    dryRunOnly: report.dryRunOnly,
    uiImplemented: report.uiImplemented,
    scheduleDryRunUiScaffoldVerified: report.scheduleDryRunUiScaffoldVerified,
    writeAdaptersImplemented: report.writeAdaptersImplemented,
    dbWritesPerformed: report.dbWritesPerformed,
    readyForG6E3ScheduleDryRunAdapterPlanning:
      report.readyForG6E3ScheduleDryRunAdapterPlanning,
    readyForG6EWriteImplementation: report.readyForG6EWriteImplementation,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule Dry-run UI Verification Result Report",
    "",
    `Phase: ${report.phase}`,
    `Complete: ${report.complete}`,
    `Manual verification: ${report.manualVerificationResult}`,
    `Recommended next: ${report.recommendedNextPhase}`,
    "",
    report.blockers.length
      ? `Blockers:\n${report.blockers.map((b) => `- ${b}`).join("\n")}`
      : "No blockers.",
  ].join("\n");
  fs.writeFileSync(mdPath, `${md}\n`, "utf8");
  return { jsonPath, mdPath };
}
