/**
 * G-6-d-result-report — Reporter (docs/config scan only; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/staging-profile-non-dry-run-result-report.md";
const CONFIG_REL = "config/admin/staging-profile-non-dry-run-result-report.json";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Scope",
  "## 3. Before snapshot",
  "## 4. Update payload",
  "## 5. UI result",
  "## 6. After snapshot",
  "## 7. Verification SQL",
  "## 8. Issues encountered and fixes",
  "## 9. RLS / permissions final state",
  "## 10. Rollback plan",
  "## 11. Current gate state",
  "## 12. Remaining risks / follow-up",
  "## 13. Recommendation",
  "## 14. Final safety statement",
];

const FORBIDDEN_IN_REPORTER = [
  /service_role/i,
  /SERVICE_ROLE/,
  /createClient\s*\(/,
  /@supabase\/supabase-js/,
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

export function runStagingProfileNonDryRunResultReport({
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

  if (!doc.includes("Staging write executed")) {
    blockers.push("ui-result-missing");
  }
  if (!doc.includes("MANUAL STAGING ROLLBACK ONLY")) {
    blockers.push("rollback-sql-missing");
  }
  if (!doc.includes("profileUpdateExecuted: true")) {
    blockers.push("gate-state-missing");
  }

  const reportPath = path.join(
    toolRoot,
    "scripts/report-staging-profile-non-dry-run-result.mjs",
  );
  const scan = scanReporter(reportPath);
  if (!scan.clean) blockers.push(`reporter-unsafe:${scan.hits.join(",")}`);

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.profileUpdateExecuted !== true) {
    blockers.push("config-profileUpdateExecuted");
  }
  if (config.nonDryRunExecuted !== true) {
    blockers.push("config-nonDryRunExecuted");
  }
  if (config.productionDataTouched !== false) {
    blockers.push("config-productionDataTouched");
  }
  if (config.readyForG6E !== false) blockers.push("config-readyForG6E");

  const complete = blockers.length === 0;

  return {
    phase: "G-6-d-result-report",
    siteId,
    generatedAt: new Date().toISOString(),
    stagingOnly: true,
    targetTable: config.targetTable ?? "profile",
    operation: config.operation ?? "update",
    rowsAffected: config.rowsAffected ?? 1,
    fieldsChanged: config.fieldsChanged ?? ["bio"],
    profileUpdateExecuted: complete && config.profileUpdateExecuted === true,
    nonDryRunExecuted: complete && config.nonDryRunExecuted === true,
    rollbackExecuted: config.rollbackExecuted === true,
    productionDataTouched: false,
    adminRouteConnected: false,
    readyForG6DResultReport: complete,
    readyForG6E: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeNonDryRunResultOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "staging-profile-non-dry-run-result.json");
  const mdPath = path.join(outDir, "STAGING_PROFILE_NON_DRY_RUN_RESULT_REPORT.md");
  const summary = {
    phase: report.phase,
    stagingOnly: report.stagingOnly,
    targetTable: report.targetTable,
    operation: report.operation,
    rowsAffected: report.rowsAffected,
    fieldsChanged: report.fieldsChanged,
    profileUpdateExecuted: report.profileUpdateExecuted,
    nonDryRunExecuted: report.nonDryRunExecuted,
    rollbackExecuted: report.rollbackExecuted,
    productionDataTouched: report.productionDataTouched,
    adminRouteConnected: report.adminRouteConnected,
    readyForG6DResultReport: report.readyForG6DResultReport,
    readyForG6E: report.readyForG6E,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Staging Profile Non-dry-run Result Report",
    "",
    `Phase: ${report.phase}`,
    `Complete: ${report.complete}`,
    "",
    report.blockers.length
      ? `Blockers:\n${report.blockers.map((b) => `- ${b}`).join("\n")}`
      : "No blockers.",
  ].join("\n");
  fs.writeFileSync(mdPath, `${md}\n`, "utf8");
  return { jsonPath, mdPath };
}
