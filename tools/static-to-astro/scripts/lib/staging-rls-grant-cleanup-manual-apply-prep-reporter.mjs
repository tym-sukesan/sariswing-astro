/**
 * G-6-rls-grant-cleanup-manual-apply-prep — Reporter (docs/config scan only; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/staging-rls-grant-cleanup-manual-apply-prep.md";
const CONFIG_REL = "config/admin/staging-rls-grant-cleanup-manual-apply-prep.json";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Target project",
  "## 3. Cleanup target",
  "## 4. Permissions to preserve",
  "## 5. Pre-apply checklist",
  "## 6. Before verification SQL",
  "## 7. Manual REVOKE SQL",
  "## 8. After verification SQL",
  "## 9. Preserved permissions verification SQL",
  "## 10. Functional smoke test after cleanup",
  "## 11. Abort conditions",
  "## 12. Rollback SQL",
  "## 13. Result recording template",
  "## 14. Gate state",
  "## 15. Recommended next step",
  "## 16. Final safety statement",
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

export function runStagingRlsGrantCleanupManualApplyPrepReport({
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

  if (!doc.includes("MANUAL STAGING CLEANUP SQL")) {
    blockers.push("manual-revoke-sql-missing");
  }
  if (!doc.includes("MANUAL STAGING ROLLBACK SQL")) {
    blockers.push("rollback-sql-missing");
  }
  if (!doc.includes("static-to-astro-cms-staging")) {
    blockers.push("target-project-missing");
  }
  if (!doc.includes("No rows returned")) {
    blockers.push("after-verify-expectation-missing");
  }
  if (!doc.includes("G-6-rls-grant-cleanup-result")) {
    blockers.push("next-phase-missing");
  }

  const reportPath = path.join(
    toolRoot,
    "scripts/report-staging-rls-grant-cleanup-manual-apply-prep.mjs",
  );
  const scan = scanReporter(reportPath);
  if (!scan.clean) blockers.push(`reporter-unsafe:${scan.hits.join(",")}`);

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.manualOnly !== true) blockers.push("config-manualOnly");
  if (config.manualApplyPrepCreated !== true) {
    blockers.push("config-manualApplyPrepCreated");
  }
  if (config.cleanupExecuted !== false) blockers.push("config-cleanupExecuted");
  if (config.grantChangesPerformed !== false) {
    blockers.push("config-grantChangesPerformed");
  }
  if (config.readyForManualCleanupApply !== true) {
    blockers.push("config-readyForManualCleanupApply");
  }
  if (config.readyForG6EImplementation !== false) {
    blockers.push("config-readyForG6EImplementation");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-rls-grant-cleanup-manual-apply-prep",
    siteId,
    generatedAt: new Date().toISOString(),
    stagingOnly: true,
    manualOnly: true,
    manualApplyPrepCreated: complete && config.manualApplyPrepCreated === true,
    cleanupExecuted: false,
    rollbackExecuted: false,
    readyForManualCleanupApply:
      complete && config.readyForManualCleanupApply === true,
    readyForG6EPlanning: complete && config.readyForG6EPlanning === true,
    readyForG6EImplementation: false,
    dbWritesPerformed: false,
    grantChangesPerformed: false,
    policyChangesPerformed: false,
    productionDataTouched: false,
    adminRouteConnected: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeGrantCleanupManualApplyPrepOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(
    outDir,
    "staging-rls-grant-cleanup-manual-apply-prep.json",
  );
  const mdPath = path.join(
    outDir,
    "STAGING_RLS_GRANT_CLEANUP_MANUAL_APPLY_PREP_REPORT.md",
  );
  const summary = {
    phase: report.phase,
    stagingOnly: report.stagingOnly,
    manualOnly: report.manualOnly,
    manualApplyPrepCreated: report.manualApplyPrepCreated,
    cleanupExecuted: report.cleanupExecuted,
    rollbackExecuted: report.rollbackExecuted,
    readyForManualCleanupApply: report.readyForManualCleanupApply,
    readyForG6EPlanning: report.readyForG6EPlanning,
    readyForG6EImplementation: report.readyForG6EImplementation,
    dbWritesPerformed: report.dbWritesPerformed,
    grantChangesPerformed: report.grantChangesPerformed,
    productionDataTouched: report.productionDataTouched,
    adminRouteConnected: report.adminRouteConnected,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Staging RLS Grant Cleanup Manual Apply Prep Report",
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
