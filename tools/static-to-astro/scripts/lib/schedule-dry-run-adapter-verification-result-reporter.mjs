/**
 * G-6-e3-schedule-dry-run-adapter-verification-result — Reporter (docs/config scan only; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/schedule-dry-run-adapter-verification-result.md";
const CONFIG_REL = "config/admin/schedule-dry-run-adapter-verification-result.json";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Verification summary",
  "## 3. Verified implementation",
  "## 4. Static verification result",
  "## 5. Manual browser verification result",
  "## 6. Update dry-run result",
  "## 7. Duplicate dry-run result",
  "## 8. Safety result",
  "## 9. Known caveats",
  "## 10. Gate decision",
  "## 11. Recommended next phase",
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

export function runScheduleDryRunAdapterVerificationResultReport({
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
  if (!doc.includes('"legacy_id": null')) {
    blockers.push("duplicate-payload-missing");
  }
  if (!doc.includes("Duplicate payload safety values were verified by screenshot")) {
    blockers.push("duplicate-safety-evaluation-missing");
  }
  if (!doc.includes("G-6-e4-schedule-write-adapter-planning")) {
    blockers.push("next-phase-missing");
  }
  if (!doc.includes("readyForG6E4ScheduleWriteAdapterPlanning: true")) {
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
    "scripts/report-schedule-dry-run-adapter-verification-result.mjs",
  );
  const scan = scanReporter(reportPath);
  if (!scan.clean) blockers.push(`reporter-unsafe:${scan.hits.join(",")}`);

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.verificationOnly !== true) blockers.push("config-verificationOnly");
  if (config.manualBrowserVerification !== "pass") {
    blockers.push("config-manualBrowserVerification");
  }
  if (config.screenshotProvided !== true) blockers.push("config-screenshotProvided");
  if (config.adapterRoutedDryRunUiVerified !== true) {
    blockers.push("config-adapterRoutedDryRunUiVerified");
  }
  if (config.actualWriteFalseVerified !== true) {
    blockers.push("config-actualWriteFalseVerified");
  }
  if (config.duplicatePayloadSafetyValuesVerified !== true) {
    blockers.push("config-duplicatePayloadSafetyValuesVerified");
  }
  if (config.writeAdaptersImplemented !== false) {
    blockers.push("config-writeAdaptersImplemented");
  }
  if (config.dbWritesPerformed !== false) blockers.push("config-dbWritesPerformed");
  if (config.readyForG6E4ScheduleWriteAdapterPlanning !== true) {
    blockers.push("config-readyForG6E4ScheduleWriteAdapterPlanning");
  }
  if (config.readyForG6EWriteImplementation !== false) {
    blockers.push("config-readyForG6EWriteImplementation");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e3-schedule-dry-run-adapter-verification-result",
    siteId,
    generatedAt: new Date().toISOString(),
    verificationOnly: true,
    manualBrowserVerification: config.manualBrowserVerification,
    staticSafetyVerification: config.staticSafetyVerification,
    adapterRoutedDryRunUiVerified: config.adapterRoutedDryRunUiVerified === true,
    actualWriteFalseVerified: config.actualWriteFalseVerified === true,
    duplicatePayloadSafetyValuesVerified:
      config.duplicatePayloadSafetyValuesVerified === true,
    writeAdaptersImplemented: false,
    dbWritesPerformed: false,
    readyForG6E4ScheduleWriteAdapterPlanning:
      complete && config.readyForG6E4ScheduleWriteAdapterPlanning === true,
    readyForG6EWriteImplementation: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleDryRunAdapterVerificationResultOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(
    outDir,
    "schedule-dry-run-adapter-verification-result.json",
  );
  const mdPath = path.join(
    outDir,
    "SCHEDULE_DRY_RUN_ADAPTER_VERIFICATION_RESULT_REPORT.md",
  );
  const summary = {
    phase: report.phase,
    verificationOnly: report.verificationOnly,
    manualBrowserVerification: report.manualBrowserVerification,
    staticSafetyVerification: report.staticSafetyVerification,
    adapterRoutedDryRunUiVerified: report.adapterRoutedDryRunUiVerified,
    actualWriteFalseVerified: report.actualWriteFalseVerified,
    duplicatePayloadSafetyValuesVerified: report.duplicatePayloadSafetyValuesVerified,
    writeAdaptersImplemented: report.writeAdaptersImplemented,
    dbWritesPerformed: report.dbWritesPerformed,
    readyForG6E4ScheduleWriteAdapterPlanning:
      report.readyForG6E4ScheduleWriteAdapterPlanning,
    readyForG6EWriteImplementation: report.readyForG6EWriteImplementation,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule Dry-run Adapter Verification Result Report",
    "",
    `Phase: ${report.phase}`,
    `Complete: ${report.complete}`,
    `Manual verification: ${report.manualBrowserVerification}`,
    `Recommended next: ${report.recommendedNextPhase}`,
    "",
    report.blockers.length
      ? `Blockers:\n${report.blockers.map((b) => `- ${b}`).join("\n")}`
      : "No blockers.",
  ].join("\n");
  fs.writeFileSync(mdPath, `${md}\n`, "utf8");
  return { jsonPath, mdPath };
}
