/**
 * G-6-b — RLS write policy review plan reporter (docs/config scan only).
 * No SQL execution. No RLS changes. No DB write.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runWriteOperationSafetyPlanReport } from "./write-operation-safety-plan-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const PLAN_DOC_REL = "docs/rls-write-policy-review-plan.md";
const CONFIG_REL = "config/admin/rls-write-policy-review-plan.json";
const G6A_CONFIG_REL = "config/admin/write-operation-safety-plan.json";

const REQUIRED_DOC_SECTIONS = [
  "## 1. Purpose",
  "## 2. Current state",
  "## 3. RLS principle",
  "## 4. Role enforcement model",
  "## 5. Role source options",
  "## 6. Table inventory for write policies",
  "## 7. Module-by-module RLS write requirements",
  "## 8. Draft RLS policy skeletons",
  "## 9. Write policy checklist",
  "## 10. Test scenarios",
  "## 11. Rollback and audit requirements",
  "## 12. Preflight for G-6-c / G-6-d",
  "## 13. Approval gates",
  "## 14. Forbidden operations",
  "## 15. G-6-b completion criteria",
  "## 16. Next phase recommendation",
  "## 17. Final safety statement",
];

const DRAFT_MARKER = "DRAFT ONLY. DO NOT RUN IN G-6-b.";

/**
 * @param {string} toolRoot
 * @param {string} relPath
 */
function readText(toolRoot, relPath) {
  return fs.readFileSync(path.join(toolRoot, relPath), "utf8");
}

/**
 * @param {string} content
 * @param {string[]} sections
 */
function sectionsPresent(content, sections) {
  return sections.map((heading) => ({
    heading,
    present: content.includes(heading),
  }));
}

/**
 * Planning scripts must not execute SQL or call Supabase write APIs.
 * @param {string} filePath
 */
function scanPlanningScriptForUnsafeCode(filePath) {
  if (!fs.existsSync(filePath)) return { clean: true, hits: [] };
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  /** @type {string[]} */
  const hits = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
    if (/@supabase\/supabase-js/.test(line)) hits.push("supabase-import");
    if (/createClient\s*\(/.test(line)) hits.push("createClient");
    if (/\.from\s*\(\s*['"`]/.test(line)) hits.push("supabase-from");
  }
  return { clean: hits.length === 0, hits };
}

/**
 * @param {object} opts
 * @param {string} [opts.toolRoot]
 * @param {string} [opts.siteId]
 */
export function runRlsWritePolicyReviewPlanReport(opts = {}) {
  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const siteId = opts.siteId ?? "default";

  const planDocPath = path.join(toolRoot, PLAN_DOC_REL);
  const planExists = fs.existsSync(planDocPath);
  const planContent = planExists ? readText(toolRoot, PLAN_DOC_REL) : "";
  const sectionChecks = sectionsPresent(planContent, REQUIRED_DOC_SECTIONS);
  const missingSections = sectionChecks.filter((s) => !s.present);

  const configExists = fs.existsSync(path.join(toolRoot, CONFIG_REL));
  const config = configExists
    ? JSON.parse(readText(toolRoot, CONFIG_REL))
    : null;

  const g6aExists = fs.existsSync(path.join(toolRoot, G6A_CONFIG_REL));

  const draftSqlMarked =
    planContent.includes(DRAFT_MARKER) &&
    (planContent.match(new RegExp(DRAFT_MARKER.replace(/\./g, "\\."), "g")) ?? [])
      .length >= 3;
  const roleModelReviewed =
    planContent.includes("admin_users table + RLS") &&
    planContent.includes("Role source options") &&
    planContent.includes("security boundary");
  const tableInventory =
    planContent.includes("Table inventory for write policies") &&
    planContent.includes("schedules");
  const moduleRequirements =
    planContent.includes("Module-by-module RLS write requirements") &&
    planContent.includes("news");
  const testScenarios =
    planContent.includes("Test scenarios") &&
    planContent.includes("unauthenticated");
  const rollbackAudit =
    planContent.includes("deleted_at") &&
    planContent.includes("updated_by");
  const planningOnlyDoc = planContent.includes(
    "G-6-b is a review/planning phase only",
  );

  const reporterPath = path.join(
    toolRoot,
    "scripts/lib/rls-write-policy-review-plan-reporter.mjs",
  );
  const cliPath = path.join(
    toolRoot,
    "scripts/report-rls-write-policy-review-plan.mjs",
  );
  const reporterScan = scanPlanningScriptForUnsafeCode(reporterPath);
  const cliScan = scanPlanningScriptForUnsafeCode(cliPath);

  const g6aReport = runWriteOperationSafetyPlanReport({ toolRoot, siteId });

  const planComplete =
    planExists &&
    configExists &&
    g6aExists &&
    g6aReport.readyForG6B &&
    missingSections.length === 0 &&
    draftSqlMarked &&
    roleModelReviewed &&
    tableInventory &&
    moduleRequirements &&
    testScenarios &&
    rollbackAudit &&
    planningOnlyDoc &&
    reporterScan.clean &&
    cliScan.clean &&
    config.planningOnly === true &&
    config.sqlExecuted === false &&
    config.rlsPolicyChanged === false &&
    config.canWrite === false;

  const blockers = [
    ...(!planExists ? ["missing-plan-doc"] : []),
    ...(!configExists ? ["missing-config-json"] : []),
    ...(!g6aExists ? ["missing-g6a-config"] : []),
    ...(!g6aReport.readyForG6B ? ["g6a-not-complete"] : []),
    ...missingSections.map((s) => `missing-section:${s.heading}`),
    ...(!draftSqlMarked ? ["draft-sql-marker-missing"] : []),
    ...(!roleModelReviewed ? ["role-model-not-reviewed"] : []),
    ...(!tableInventory ? ["table-inventory-missing"] : []),
    ...(!moduleRequirements ? ["module-requirements-missing"] : []),
    ...(!testScenarios ? ["test-scenarios-missing"] : []),
    ...(!rollbackAudit ? ["rollback-audit-missing"] : []),
    ...(!reporterScan.clean ? [`unsafe-reporter:${reporterScan.hits.join(",")}`] : []),
    ...(!cliScan.clean ? [`unsafe-cli:${cliScan.hits.join(",")}`] : []),
  ];

  return {
    mode: "dry-run",
    phase: "G-6-b",
    type: "rls-write-policy-review-plan",
    approvalId: config?.approvalId ?? "G-6-b-rls-write-policy-review",
    siteId,
    generatedAt: new Date().toISOString(),
    docRef: PLAN_DOC_REL,
    configRef: CONFIG_REL,
    rlsWritePolicyReviewPlanCreated: planComplete,
    planningOnly: true,
    sqlExecuted: false,
    rlsPolicyChanged: false,
    canWrite: false,
    writeOperationsEnabled: false,
    writeAdapterImplemented: false,
    dbWriteImplemented: false,
    storageConnected: false,
    publishConnected: false,
    adminRouteConnected: false,
    productionDataTouched: false,
    draftSqlClearlyMarkedDoNotRun: draftSqlMarked,
    roleEnforcementModelReviewed: roleModelReviewed,
    tableWritePolicyInventoryCreated: tableInventory,
    moduleRlsRequirementsCreated: moduleRequirements,
    testScenariosCreated: testScenarios,
    rollbackAuditRequirementsCreated: rollbackAudit,
    readyForG6C: planComplete,
    readyForG6D: false,
    readyForG6Implementation: false,
    writeOperationSafetyPlanReady: g6aReport.readyForG6B,
    recommendedNextPhase:
      config?.recommendedNextPhase ?? "G-6-c disabled write action scaffold",
    planDocSections: sectionChecks,
    blockers,
  };
}

/**
 * @param {ReturnType<typeof runRlsWritePolicyReviewPlanReport>} report
 */
export function formatRlsWritePolicyReviewPlanMarkdown(report) {
  const lines = [
    "# RLS Write Policy Review Plan Report",
    "",
    `**Phase:** ${report.phase}`,
    `**Approval ID:** ${report.approvalId}`,
    `**Site:** ${report.siteId}`,
    `**Generated:** ${report.generatedAt}`,
    "",
    "## Flags",
    "",
    "| Flag | Value |",
    "| --- | --- |",
    `| rlsWritePolicyReviewPlanCreated | ${report.rlsWritePolicyReviewPlanCreated} |`,
    `| planningOnly | ${report.planningOnly} |`,
    `| sqlExecuted | ${report.sqlExecuted} |`,
    `| rlsPolicyChanged | ${report.rlsPolicyChanged} |`,
    `| canWrite | ${report.canWrite} |`,
    `| writeOperationsEnabled | ${report.writeOperationsEnabled} |`,
    `| dbWriteImplemented | ${report.dbWriteImplemented} |`,
    `| readyForG6C | ${report.readyForG6C} |`,
    `| readyForG6D | ${report.readyForG6D} |`,
    `| readyForG6Implementation | ${report.readyForG6Implementation} |`,
    "",
    "## Next phase",
    "",
    report.recommendedNextPhase,
    "",
  ];

  if (report.blockers.length > 0) {
    lines.push("## Blockers", "", ...report.blockers.map((b) => `- ${b}`), "");
  }

  lines.push(
    "*G-6-b: review/planning only. No SQL. No RLS changes. No writes.*",
  );

  return lines.join("\n");
}

/**
 * @param {string} outDir
 * @param {ReturnType<typeof runRlsWritePolicyReviewPlanReport>} report
 */
export function writeRlsWritePolicyReviewPlanOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "rls-write-policy-review-plan.json");
  const mdPath = path.join(outDir, "RLS_WRITE_POLICY_REVIEW_PLAN_REPORT.md");
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(mdPath, `${formatRlsWritePolicyReviewPlanMarkdown(report)}\n`, "utf8");
  return { jsonPath, mdPath };
}
