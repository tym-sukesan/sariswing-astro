/**
 * G-6-rls-grant-cleanup-result — Reporter (docs/config scan only; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/staging-rls-grant-cleanup-result.md";
const CONFIG_REL = "config/admin/staging-rls-grant-cleanup-result.json";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Summary",
  "## 3. Before verification",
  "## 4. Manual REVOKE result",
  "## 5. After verification",
  "## 6. Preserved permissions",
  "## 7. Smoke test",
  "## 8. Rollback status",
  "## 9. Risk reduction",
  "## 10. Remaining concerns",
  "## 11. Gate state",
  "## 12. Recommended next phase",
  "## 13. Final safety statement",
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

export function runStagingRlsGrantCleanupResultReport({
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

  if (!doc.includes("cleanupExecuted: true")) blockers.push("cleanup-executed-missing");
  if (!doc.includes("revokeResult: success")) blockers.push("revoke-result-missing");
  if (!doc.includes("broadGrantsRemoved: true")) {
    blockers.push("broad-grants-removed-missing");
  }
  if (!doc.includes("afterVerification: pass")) {
    blockers.push("after-verification-missing");
  }
  if (!doc.includes("preservedPermissionsVerification: pass")) {
    blockers.push("preserved-permissions-missing");
  }
  if (!doc.includes("smokeTest: pass")) blockers.push("smoke-test-missing");
  if (!doc.includes("G-6-e-planning")) blockers.push("next-phase-missing");
  if (!doc.includes("static-to-astro-cms-staging")) {
    blockers.push("target-project-missing");
  }

  const reportPath = path.join(
    toolRoot,
    "scripts/report-staging-rls-grant-cleanup-result.mjs",
  );
  const scan = scanReporter(reportPath);
  if (!scan.clean) blockers.push(`reporter-unsafe:${scan.hits.join(",")}`);

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.cleanupExecuted !== true) blockers.push("config-cleanupExecuted");
  if (config.revokeResult !== "success") blockers.push("config-revokeResult");
  if (config.broadGrantsRemoved !== true) {
    blockers.push("config-broadGrantsRemoved");
  }
  if (config.rollbackExecuted !== false) blockers.push("config-rollbackExecuted");
  if (config.readyForG6EPlanning !== true) {
    blockers.push("config-readyForG6EPlanning");
  }
  if (config.readyForG6EImplementation !== false) {
    blockers.push("config-readyForG6EImplementation");
  }
  if (config.productionDataTouched !== false) {
    blockers.push("config-productionDataTouched");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-rls-grant-cleanup-result",
    siteId,
    generatedAt: new Date().toISOString(),
    stagingOnly: true,
    manualOnly: true,
    cleanupExecuted: complete && config.cleanupExecuted === true,
    revokeResult: config.revokeResult,
    broadGrantsRemoved: complete && config.broadGrantsRemoved === true,
    afterVerification: config.afterVerification,
    preservedPermissionsVerification: config.preservedPermissionsVerification,
    smokeTest: config.smokeTest,
    rollbackExecuted: false,
    productionDataTouched: false,
    adminRouteConnected: false,
    readyForG6EPlanning: complete && config.readyForG6EPlanning === true,
    readyForG6EImplementation: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeGrantCleanupResultOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "staging-rls-grant-cleanup-result.json");
  const mdPath = path.join(outDir, "STAGING_RLS_GRANT_CLEANUP_RESULT_REPORT.md");
  const summary = {
    phase: report.phase,
    stagingOnly: report.stagingOnly,
    manualOnly: report.manualOnly,
    cleanupExecuted: report.cleanupExecuted,
    revokeResult: report.revokeResult,
    broadGrantsRemoved: report.broadGrantsRemoved,
    afterVerification: report.afterVerification,
    preservedPermissionsVerification: report.preservedPermissionsVerification,
    smokeTest: report.smokeTest,
    rollbackExecuted: report.rollbackExecuted,
    productionDataTouched: report.productionDataTouched,
    adminRouteConnected: report.adminRouteConnected,
    readyForG6EPlanning: report.readyForG6EPlanning,
    readyForG6EImplementation: report.readyForG6EImplementation,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Staging RLS Grant Cleanup Result Report",
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
