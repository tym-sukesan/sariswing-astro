/**
 * G-6-d-prep — Staging profile update PoC approval plan reporter (docs/config scan only).
 * No SQL execution. No RLS changes. No DB write.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runDisabledWriteActionScaffoldReport } from "./disabled-write-action-scaffold-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/staging-profile-update-poc-approval-plan.md";
const CONFIG_REL = "config/admin/staging-profile-update-poc-approval-plan.json";
const APPROVAL_ID = "G-6-d-staging-profile-update-poc";
const DRAFT_MARKER = "DRAFT ONLY. DO NOT RUN IN G-6-d-prep.";

const REQUIRED_DOC_SECTIONS = [
  "## 1. Purpose",
  "## 2. Current state",
  "## 3. Approval ID",
  "## 4. First write PoC scope",
  "## 5. Target table and fields",
  "## 6. Why profile update first",
  "## 7. RLS / role requirements before implementation",
  "## 8. canWrite transition conditions",
  "## 9. Environment gate plan",
  "## 10. UI enablement plan",
  "## 11. Rollback plan",
  "## 12. Audit / logging requirements",
  "## 13. Dry-run / disabled fallback plan",
  "## 14. Test scenarios for future G-6-d",
  "## 15. Not allowed in G-6-d",
  "## 16. G-6-d-prep completion criteria",
  "## 17. Next phase recommendation",
  "## 18. Final safety statement",
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
export function runStagingProfileUpdatePocApprovalPlanReport(opts = {}) {
  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const siteId = opts.siteId ?? "default";

  const docPath = path.join(toolRoot, DOC_REL);
  const docExists = fs.existsSync(docPath);
  const docContent = docExists ? readText(toolRoot, DOC_REL) : "";
  const sectionChecks = sectionsPresent(docContent, REQUIRED_DOC_SECTIONS);
  const missingSections = sectionChecks.filter((s) => !s.present);

  const configExists = fs.existsSync(path.join(toolRoot, CONFIG_REL));
  const config = configExists
    ? JSON.parse(readText(toolRoot, CONFIG_REL))
    : null;

  const g6cReport = runDisabledWriteActionScaffoldReport({ toolRoot, siteId });

  const planningOnlyDoc = docContent.includes(
    "G-6-d-prep is a planning and approval phase only",
  );
  const approvalIdDefined =
    docContent.includes(APPROVAL_ID) &&
    config?.approvalId === APPROVAL_ID;
  const approvalNotActivated =
    docContent.includes("This approval ID is not activated in G-6-d-prep") &&
    config?.approvalActivated === false;
  const firstWriteScopeLimited =
    docContent.includes("profile table only") &&
    docContent.includes("update operation only") &&
    docContent.includes("one existing row only");
  const targetModuleProfileOnly =
    config?.targetModule === "profile" && config?.targetTable === "profile";
  const targetOperationUpdateOnly = config?.targetOperation === "update";
  const targetFieldsTextOnly = config?.targetFields === "text-only";
  const saveButtonRemainsDisabled = docContent.includes(
    "The Save button remains disabled in G-6-d-prep",
  );
  const canWriteRemainsFalse =
    docContent.includes("canWrite remains false") &&
    config?.canWrite === false;
  const draftSqlMarked =
    docContent.includes(DRAFT_MARKER) &&
    (docContent.match(new RegExp(DRAFT_MARKER.replace(/\./g, "\\."), "g")) ?? [])
      .length >= 2;
  const rollbackPlanPresent =
    docContent.includes("before snapshot") &&
    docContent.includes("rollback confirmation checklist");
  const envGatePlanPresent =
    docContent.includes("ENABLE_ADMIN_STAGING_WRITE=false") &&
    docContent.includes("PUBLIC_ADMIN_WRITE_PROVIDER=disabled");

  const reporterPath = path.join(
    toolRoot,
    "scripts/lib/staging-profile-update-poc-approval-plan-reporter.mjs",
  );
  const cliPath = path.join(
    toolRoot,
    "scripts/report-staging-profile-update-poc-approval-plan.mjs",
  );
  const reporterScan = scanPlanningScriptForUnsafeCode(reporterPath);
  const cliScan = scanPlanningScriptForUnsafeCode(cliPath);

  const planComplete =
    docExists &&
    configExists &&
    g6cReport.scaffoldComplete &&
    missingSections.length === 0 &&
    planningOnlyDoc &&
    approvalIdDefined &&
    approvalNotActivated &&
    firstWriteScopeLimited &&
    targetModuleProfileOnly &&
    targetOperationUpdateOnly &&
    targetFieldsTextOnly &&
    saveButtonRemainsDisabled &&
    canWriteRemainsFalse &&
    draftSqlMarked &&
    rollbackPlanPresent &&
    envGatePlanPresent &&
    reporterScan.clean &&
    cliScan.clean &&
    config.planningOnly === true &&
    config.saveButtonEnabled === false &&
    config.sqlExecuted === false &&
    config.rlsPolicyChanged === false;

  const blockers = [
    ...(!docExists ? ["missing-approval-plan-doc"] : []),
    ...(!configExists ? ["missing-config-json"] : []),
    ...(!g6cReport.scaffoldComplete ? ["g6c-not-complete"] : []),
    ...missingSections.map((s) => `missing-section:${s.heading}`),
    ...(!planningOnlyDoc ? ["planning-only-doc-missing"] : []),
    ...(!approvalIdDefined ? ["approval-id-not-defined"] : []),
    ...(!approvalNotActivated ? ["approval-incorrectly-activated"] : []),
    ...(!firstWriteScopeLimited ? ["first-write-scope-not-limited"] : []),
    ...(!targetModuleProfileOnly ? ["target-not-profile-only"] : []),
    ...(!targetOperationUpdateOnly ? ["target-not-update-only"] : []),
    ...(!targetFieldsTextOnly ? ["target-not-text-only"] : []),
    ...(!saveButtonRemainsDisabled ? ["save-button-not-documented-disabled"] : []),
    ...(!canWriteRemainsFalse ? ["canwrite-not-documented-false"] : []),
    ...(!draftSqlMarked ? ["draft-sql-marker-missing"] : []),
    ...(!rollbackPlanPresent ? ["rollback-plan-missing"] : []),
    ...(!envGatePlanPresent ? ["env-gate-plan-missing"] : []),
    ...(!reporterScan.clean ? [`unsafe-reporter:${reporterScan.hits.join(",")}`] : []),
    ...(!cliScan.clean ? [`unsafe-cli:${cliScan.hits.join(",")}`] : []),
  ];

  return {
    mode: "dry-run",
    phase: "G-6-d-prep",
    type: "staging-profile-update-poc-approval-plan",
    approvalId: config?.approvalId ?? APPROVAL_ID,
    siteId,
    generatedAt: new Date().toISOString(),
    docRef: DOC_REL,
    configRef: CONFIG_REL,
    stagingProfileUpdatePocApprovalPlanCreated: planComplete,
    planningOnly: true,
    approvalActivated: false,
    targetModule: config?.targetModule ?? "profile",
    targetTable: config?.targetTable ?? "profile",
    targetOperation: config?.targetOperation ?? "update",
    targetScope: config?.targetScope ?? "single-existing-row",
    targetFields: config?.targetFields ?? "text-only",
    stagingOnly: true,
    canWrite: false,
    writeOperationsEnabled: false,
    writeAdapterImplemented: false,
    dbWriteImplemented: false,
    saveButtonEnabled: false,
    sqlExecuted: false,
    rlsPolicyChanged: false,
    storageConnected: false,
    publishConnected: false,
    adminRouteConnected: false,
    productionDataTouched: false,
    approvalIdDefined,
    firstWriteScopeLimited,
    targetModuleProfileOnly,
    targetOperationUpdateOnly,
    targetFieldsTextOnly,
    readyForG6DApproval: planComplete,
    readyForG6DImplementation: false,
    readyForG6Implementation: false,
    disabledWriteActionScaffoldReady: g6cReport.scaffoldComplete,
    recommendedNextPhase:
      config?.recommendedNextPhase ??
      "G-6-d staging profile update PoC with explicit approval",
    planDocSections: sectionChecks,
    blockers,
    planComplete,
  };
}

/**
 * @param {ReturnType<typeof runStagingProfileUpdatePocApprovalPlanReport>} report
 */
export function formatStagingProfileUpdatePocApprovalPlanMarkdown(report) {
  const lines = [
    "# Staging Profile Update PoC Approval Plan Report",
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
    `| stagingProfileUpdatePocApprovalPlanCreated | ${report.stagingProfileUpdatePocApprovalPlanCreated} |`,
    `| planningOnly | ${report.planningOnly} |`,
    `| approvalActivated | ${report.approvalActivated} |`,
    `| targetModule | ${report.targetModule} |`,
    `| targetOperation | ${report.targetOperation} |`,
    `| targetFields | ${report.targetFields} |`,
    `| canWrite | ${report.canWrite} |`,
    `| writeOperationsEnabled | ${report.writeOperationsEnabled} |`,
    `| writeAdapterImplemented | ${report.writeAdapterImplemented} |`,
    `| dbWriteImplemented | ${report.dbWriteImplemented} |`,
    `| saveButtonEnabled | ${report.saveButtonEnabled} |`,
    `| sqlExecuted | ${report.sqlExecuted} |`,
    `| rlsPolicyChanged | ${report.rlsPolicyChanged} |`,
    `| storageConnected | ${report.storageConnected} |`,
    `| publishConnected | ${report.publishConnected} |`,
    `| adminRouteConnected | ${report.adminRouteConnected} |`,
    `| productionDataTouched | ${report.productionDataTouched} |`,
    `| readyForG6DApproval | ${report.readyForG6DApproval} |`,
    `| readyForG6DImplementation | ${report.readyForG6DImplementation} |`,
    `| readyForG6Implementation | ${report.readyForG6Implementation} |`,
    "",
    "## Next phase",
    "",
    report.recommendedNextPhase,
    "",
    "G-6-d must not start automatically. Explicit approval required.",
    "",
  ];

  if (report.blockers.length > 0) {
    lines.push("## Blockers", "", ...report.blockers.map((b) => `- ${b}`), "");
  }

  lines.push(
    "*G-6-d-prep: planning and approval only. No SQL. No RLS changes. No writes.*",
  );

  return lines.join("\n");
}

/**
 * @param {string} outDir
 * @param {ReturnType<typeof runStagingProfileUpdatePocApprovalPlanReport>} report
 */
export function writeStagingProfileUpdatePocApprovalPlanOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "staging-profile-update-poc-approval-plan.json");
  const mdPath = path.join(outDir, "STAGING_PROFILE_UPDATE_POC_APPROVAL_PLAN_REPORT.md");
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(mdPath, `${formatStagingProfileUpdatePocApprovalPlanMarkdown(report)}\n`, "utf8");
  return { jsonPath, mdPath };
}
