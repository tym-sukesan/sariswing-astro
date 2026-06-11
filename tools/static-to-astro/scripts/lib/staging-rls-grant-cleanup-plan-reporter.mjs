/**
 * G-6-rls-grant-cleanup-plan — Reporter (docs/config scan only; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/staging-rls-grant-cleanup-plan.md";
const CONFIG_REL = "config/admin/staging-rls-grant-cleanup-plan.json";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Background",
  "## 3. Current broad grants detected",
  "## 4. Cleanup target",
  "## 5. Permissions to preserve",
  "## 6. Why TRUNCATE / TRIGGER / REFERENCES should be removed",
  "## 7. Manual staging cleanup SQL draft",
  "## 8. Rollback SQL draft",
  "## 9. Before verification SQL",
  "## 10. After verification SQL",
  "## 11. Functional smoke test after cleanup",
  "## 12. Risk assessment",
  "## 13. Gate after cleanup plan",
  "## 14. Recommended next phase",
  "## 15. Final safety statement",
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

export function runStagingRlsGrantCleanupPlanReport({
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

  if (!doc.includes("DRAFT ONLY")) blockers.push("draft-only-marker-missing");
  if (!doc.includes("revoke truncate")) blockers.push("revoke-draft-missing");
  if (!doc.includes("grant truncate")) blockers.push("rollback-draft-missing");
  if (!doc.includes("No rows returned")) {
    blockers.push("after-verify-expectation-missing");
  }
  if (!doc.includes("G-6-rls-grant-cleanup-manual-apply-prep")) {
    blockers.push("next-phase-missing");
  }

  const reportPath = path.join(
    toolRoot,
    "scripts/report-staging-rls-grant-cleanup-plan.mjs",
  );
  const scan = scanReporter(reportPath);
  if (!scan.clean) blockers.push(`reporter-unsafe:${scan.hits.join(",")}`);

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.planOnly !== true) blockers.push("config-planOnly");
  if (config.cleanupPlanCreated !== true) {
    blockers.push("config-cleanupPlanCreated");
  }
  if (config.cleanupExecuted !== false) blockers.push("config-cleanupExecuted");
  if (config.grantChangesPerformed !== false) {
    blockers.push("config-grantChangesPerformed");
  }
  if (config.readyForG6EImplementation !== false) {
    blockers.push("config-readyForG6EImplementation");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-rls-grant-cleanup-plan",
    siteId,
    generatedAt: new Date().toISOString(),
    stagingOnly: true,
    planOnly: true,
    cleanupPlanCreated: complete && config.cleanupPlanCreated === true,
    cleanupExecuted: false,
    rollbackExecuted: false,
    targetGrantTypes: config.targetGrantTypes ?? ["TRUNCATE", "TRIGGER", "REFERENCES"],
    readyForManualCleanupDecision:
      complete && config.readyForManualCleanupDecision === true,
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

export function writeGrantCleanupPlanOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "staging-rls-grant-cleanup-plan.json");
  const mdPath = path.join(outDir, "STAGING_RLS_GRANT_CLEANUP_PLAN_REPORT.md");
  const summary = {
    phase: report.phase,
    stagingOnly: report.stagingOnly,
    planOnly: report.planOnly,
    cleanupPlanCreated: report.cleanupPlanCreated,
    cleanupExecuted: report.cleanupExecuted,
    rollbackExecuted: report.rollbackExecuted,
    targetGrantTypes: report.targetGrantTypes,
    readyForManualCleanupDecision: report.readyForManualCleanupDecision,
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
    "# Staging RLS Grant Cleanup Plan Report",
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
