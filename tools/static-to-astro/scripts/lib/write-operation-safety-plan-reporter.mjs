/**
 * G-6-a — Write operation safety plan reporter (docs/config scan only).
 * No DB write. No live Supabase connection.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCustomerDemoReadinessReport } from "./customer-demo-readiness-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const PLAN_DOC_REL = "docs/write-operation-safety-plan.md";
const CONFIG_REL = "config/admin/write-operation-safety-plan.json";

const REQUIRED_DOC_SECTIONS = [
  "## 1. Purpose",
  "## 2. Current state",
  "## 3. Write operation scope",
  "## 4. Operation risk matrix",
  "## 5. Recommended implementation order",
  "## 6. Module-by-module write plan",
  "## 7. RLS write policy review requirements",
  "## 8. Role / permission model for writes",
  "## 9. Data safety / rollback policy",
  "## 10. Disabled action scaffold plan",
  "## 11. Preflight checklist before first write",
  "## 12. Approval gates",
  "## 13. Forbidden operations",
  "## 14. G-6-a completion criteria",
  "## 15. Next phase recommendation",
  "## 16. Final safety statement",
];

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
 * Planning CLI must not import Supabase or call DB write APIs.
 * @param {string} filePath
 */
function scanPlanningScriptForDbWrite(filePath) {
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
export function runWriteOperationSafetyPlanReport(opts = {}) {
  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const siteId = opts.siteId ?? "default";

  const planDocPath = path.join(toolRoot, PLAN_DOC_REL);
  const planExists = fs.existsSync(planDocPath);
  const planContent = planExists ? readText(toolRoot, PLAN_DOC_REL) : "";
  const sectionChecks = sectionsPresent(planContent, REQUIRED_DOC_SECTIONS);
  const missingSections = sectionChecks.filter((s) => !s.present);

  const configPath = path.join(toolRoot, CONFIG_REL);
  const configExists = fs.existsSync(configPath);
  const config = configExists
    ? JSON.parse(readText(toolRoot, CONFIG_REL))
    : null;

  const planningOnlyDocumented =
    planContent.includes("planning phase only") ||
    planContent.includes("planning only");
  const rlsReviewRequired =
    planContent.includes("No write policy is created in G-6-a") &&
    planContent.includes("RLS write policy must be reviewed");
  const rollbackDocumented = planContent.includes("rollback");
  const approvalGatesDefined =
    planContent.includes("G-6-b-rls-write-policy-review") &&
    planContent.includes("G-6-d-staging-profile-update-poc");
  const disabledActionPlan =
    planContent.includes("Disabled action scaffold") &&
    planContent.includes("保存はまだ無効です");
  const draftOnlySql =
    planContent.includes("DRAFT ONLY. DO NOT RUN IN G-6-a.");
  const inventoryCreated =
    planContent.includes("profile") &&
    planContent.includes("Operation risk matrix");

  const reporterPath = path.join(
    toolRoot,
    "scripts/lib/write-operation-safety-plan-reporter.mjs",
  );
  const cliPath = path.join(
    toolRoot,
    "scripts/report-write-operation-safety-plan.mjs",
  );
  const selfScan = scanPlanningScriptForDbWrite(reporterPath);
  const cliScan = scanPlanningScriptForDbWrite(cliPath);

  const demoReadiness = runCustomerDemoReadinessReport({ toolRoot, siteId });

  const planComplete =
    planExists &&
    configExists &&
    missingSections.length === 0 &&
    planningOnlyDocumented &&
    rlsReviewRequired &&
    rollbackDocumented &&
    approvalGatesDefined &&
    disabledActionPlan &&
    draftOnlySql &&
    inventoryCreated &&
    selfScan.clean &&
    cliScan.clean &&
    config.planningOnly === true &&
    config.canWrite === false &&
    config.writeOperationsEnabled === false;

  const blockers = [
    ...(!planExists ? ["missing-plan-doc"] : []),
    ...(!configExists ? ["missing-config-json"] : []),
    ...missingSections.map((s) => `missing-section:${s.heading}`),
    ...(!planningOnlyDocumented ? ["planning-only-not-documented"] : []),
    ...(!rlsReviewRequired ? ["rls-review-not-documented"] : []),
    ...(!rollbackDocumented ? ["rollback-not-documented"] : []),
    ...(!approvalGatesDefined ? ["approval-gates-not-defined"] : []),
    ...(!disabledActionPlan ? ["disabled-action-plan-missing"] : []),
    ...(!draftOnlySql ? ["draft-sql-marker-missing"] : []),
    ...(!selfScan.clean ? [`db-write-in-reporter:${selfScan.hits.join(",")}`] : []),
    ...(!cliScan.clean ? [`db-write-in-cli:${cliScan.hits.join(",")}`] : []),
    ...(config && config.canWrite !== false ? ["config-canwrite-not-false"] : []),
  ];

  return {
    mode: "dry-run",
    phase: "G-6-a",
    type: "write-operation-safety-plan",
    siteId,
    generatedAt: new Date().toISOString(),
    docRef: PLAN_DOC_REL,
    configRef: CONFIG_REL,
    writeOperationSafetyPlanCreated: planComplete,
    planningOnly: true,
    canWrite: false,
    writeOperationsEnabled: false,
    writeAdapterImplemented: false,
    dbWriteImplemented: false,
    rlsPolicyChanged: false,
    storageConnected: false,
    publishConnected: false,
    adminRouteConnected: false,
    productionDataTouched: false,
    writeOperationInventoryCreated: inventoryCreated,
    rlsWritePolicyReviewRequired: rlsReviewRequired,
    rollbackPolicyDocumented: rollbackDocumented,
    approvalGatesDefined,
    disabledActionPlanCreated: disabledActionPlan,
    readyForG6B: planComplete,
    readyForG6Implementation: false,
    readOnlyPhaseComplete: demoReadiness.readOnlyPhaseComplete,
    readyForCustomerDemo: demoReadiness.readyForCustomerDemo,
    recommendedNextPhase: config?.recommendedNextPhase ?? "G-6-b RLS write policy review plan",
    planDocSections: sectionChecks,
    forbiddenSelfScan: selfScan,
    blockers,
  };
}

/**
 * @param {ReturnType<typeof runWriteOperationSafetyPlanReport>} report
 */
export function formatWriteOperationSafetyPlanMarkdown(report) {
  const lines = [
    "# Write Operation Safety Plan Report",
    "",
    `**Phase:** ${report.phase}`,
    `**Site:** ${report.siteId}`,
    `**Generated:** ${report.generatedAt}`,
    "",
    "## Flags",
    "",
    "| Flag | Value |",
    "| --- | --- |",
    `| writeOperationSafetyPlanCreated | ${report.writeOperationSafetyPlanCreated} |`,
    `| planningOnly | ${report.planningOnly} |`,
    `| canWrite | ${report.canWrite} |`,
    `| writeOperationsEnabled | ${report.writeOperationsEnabled} |`,
    `| writeAdapterImplemented | ${report.writeAdapterImplemented} |`,
    `| dbWriteImplemented | ${report.dbWriteImplemented} |`,
    `| rlsPolicyChanged | ${report.rlsPolicyChanged} |`,
    `| storageConnected | ${report.storageConnected} |`,
    `| publishConnected | ${report.publishConnected} |`,
    `| adminRouteConnected | ${report.adminRouteConnected} |`,
    `| productionDataTouched | ${report.productionDataTouched} |`,
    `| readyForG6B | ${report.readyForG6B} |`,
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
    "*G-6-a: planning only. No database write. No RLS changes.*",
  );

  return lines.join("\n");
}

/**
 * @param {string} outDir
 * @param {ReturnType<typeof runWriteOperationSafetyPlanReport>} report
 */
export function writeWriteOperationSafetyPlanOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "write-operation-safety-plan.json");
  const mdPath = path.join(outDir, "WRITE_OPERATION_SAFETY_PLAN_REPORT.md");
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(mdPath, `${formatWriteOperationSafetyPlanMarkdown(report)}\n`, "utf8");
  return { jsonPath, mdPath };
}
