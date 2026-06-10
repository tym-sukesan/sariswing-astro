/**
 * G-6-d-verify — Staging profile update PoC verification reporter (docs/config scan only).
 * Does not execute non-dry-run writes.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runStagingProfileUpdatePocImplementationReport } from "./staging-profile-update-poc-implementation-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/staging-profile-update-poc-verification-checklist.md";
const CONFIG_REL = "config/admin/staging-profile-update-poc-verification-checklist.json";
const APPROVAL_ID = "G-6-d-staging-profile-update-poc";
const DRAFT_MARKER = "DRAFT ONLY. DO NOT RUN FROM THIS DOC.";

const REQUIRED_DOC_SECTIONS = [
  "## 1. Purpose",
  "## 2. Current implementation summary",
  "## 3. Column mapping verification",
  "## 4. Target row verification",
  "## 5. RLS / role verification",
  "## 6. Dry-run QA checklist",
  "## 7. First non-dry-run execution checklist",
  "## 8. Non-dry-run command template",
  "## 9. After-write verification checklist",
  "## 10. Rollback checklist",
  "## 11. Failure handling",
  "## 12. Evidence to collect",
  "## 13. Decision states",
  "## 14. G-6-d-verify completion criteria",
  "## 15. Next phase recommendation",
  "## 16. Final safety statement",
];

const FORBIDDEN_SCRIPT_PATTERNS = [
  /@supabase\/supabase-js/,
  /createClient\s*\(/,
  /\.from\s*\(\s*['"`]/,
  /\.insert\s*\(/,
  /\.update\s*\(/,
  /\.delete\s*\(/,
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
    for (const pattern of FORBIDDEN_SCRIPT_PATTERNS) {
      if (pattern.test(line)) hits.push(pattern.source);
    }
  }
  return { clean: hits.length === 0, hits: [...new Set(hits)] };
}

/**
 * @param {object} opts
 * @param {string} [opts.toolRoot]
 * @param {string} [opts.siteId]
 */
export function runStagingProfileUpdatePocVerificationReport(opts = {}) {
  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const siteId = opts.siteId ?? "default";

  const docExists = fs.existsSync(path.join(toolRoot, DOC_REL));
  const docContent = docExists ? readText(toolRoot, DOC_REL) : "";
  const sectionChecks = sectionsPresent(docContent, REQUIRED_DOC_SECTIONS);
  const missingSections = sectionChecks.filter((s) => !s.present);

  const configExists = fs.existsSync(path.join(toolRoot, CONFIG_REL));
  const config = configExists
    ? JSON.parse(readText(toolRoot, CONFIG_REL))
    : null;

  const g6dReport = runStagingProfileUpdatePocImplementationReport({
    toolRoot,
    siteId,
  });

  const verificationOnlyDoc = docContent.includes(
    "G-6-d-verify is a verification and execution-planning phase",
  );
  const cursorWillNotExecute =
    docContent.includes("Cursor must not execute this step automatically") &&
    config?.cursorWillNotExecuteNonDryRun === true;
  const columnMappingChecklist =
    docContent.includes("Column mapping verification") &&
    docContent.includes("name column exists") &&
    docContent.includes("display_name was mapped to name");
  const targetRowChecklist =
    docContent.includes("Target row verification") &&
    docContent.includes("Before snapshot template");
  const rlsChecklist =
    docContent.includes("RLS / role verification") &&
    docContent.includes("If RLS is uncertain");
  const dryRunQa =
    docContent.includes("Dry-run QA checklist") &&
    docContent.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=true");
  const nonDryRunChecklist =
    docContent.includes("First non-dry-run execution checklist") &&
    docContent.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=false");
  const rollbackChecklist =
    docContent.includes("Rollback checklist") &&
    docContent.includes(DRAFT_MARKER);
  const decisionStates =
    docContent.includes("readyForManualNonDryRun") &&
    docContent.includes("nonDryRunExecuted");

  const reporterPath = path.join(
    toolRoot,
    "scripts/lib/staging-profile-update-poc-verification-reporter.mjs",
  );
  const cliPath = path.join(
    toolRoot,
    "scripts/report-staging-profile-update-poc-verification.mjs",
  );
  const reporterScan = scanPlanningScriptForUnsafeCode(reporterPath);
  const cliScan = scanPlanningScriptForUnsafeCode(cliPath);

  const verificationComplete =
    docExists &&
    configExists &&
    g6dReport.implementationComplete &&
    missingSections.length === 0 &&
    verificationOnlyDoc &&
    cursorWillNotExecute &&
    columnMappingChecklist &&
    targetRowChecklist &&
    rlsChecklist &&
    dryRunQa &&
    nonDryRunChecklist &&
    rollbackChecklist &&
    decisionStates &&
    reporterScan.clean &&
    cliScan.clean &&
    config.verificationOnly === true &&
    config.approvalId === APPROVAL_ID &&
    config.nonDryRunExecuted === false &&
    config.readyForManualNonDryRunDecision === true &&
    config.columnMappingRequiresConfirmation === true;

  const blockers = [
    ...(!docExists ? ["missing-verification-doc"] : []),
    ...(!configExists ? ["missing-config-json"] : []),
    ...(!g6dReport.implementationComplete ? ["g6d-implementation-not-complete"] : []),
    ...missingSections.map((s) => `missing-section:${s.heading}`),
    ...(!verificationOnlyDoc ? ["verification-only-doc-missing"] : []),
    ...(!cursorWillNotExecute ? ["cursor-execute-not-documented"] : []),
    ...(!columnMappingChecklist ? ["column-mapping-checklist-missing"] : []),
    ...(!targetRowChecklist ? ["target-row-checklist-missing"] : []),
    ...(!rlsChecklist ? ["rls-checklist-missing"] : []),
    ...(!dryRunQa ? ["dry-run-qa-missing"] : []),
    ...(!nonDryRunChecklist ? ["non-dry-run-checklist-missing"] : []),
    ...(!rollbackChecklist ? ["rollback-checklist-missing"] : []),
    ...(!decisionStates ? ["decision-states-missing"] : []),
    ...(!reporterScan.clean ? [`unsafe-reporter:${reporterScan.hits.join(",")}`] : []),
    ...(!cliScan.clean ? [`unsafe-cli:${cliScan.hits.join(",")}`] : []),
  ];

  return {
    mode: "dry-run",
    phase: "G-6-d-verify",
    type: "staging-profile-update-poc-verification-checklist",
    approvalId: config?.approvalId ?? APPROVAL_ID,
    siteId,
    generatedAt: new Date().toISOString(),
    docRef: DOC_REL,
    configRef: CONFIG_REL,
    verificationChecklistCreated: verificationComplete,
    verificationOnly: true,
    targetModule: config?.targetModule ?? "profile",
    targetTable: config?.targetTable ?? "profile",
    targetOperation: config?.targetOperation ?? "update",
    targetFields: config?.targetFields ?? ["name", "bio"],
    columnMappingRequiresConfirmation:
      config?.columnMappingRequiresConfirmation ?? true,
    cursorWillNotExecuteNonDryRun: config?.cursorWillNotExecuteNonDryRun ?? true,
    nonDryRunExecuted: false,
    readyForManualNonDryRunDecision:
      config?.readyForManualNonDryRunDecision ?? true,
    productionDataTouched: false,
    adminRouteConnected: false,
    storageConnected: false,
    publishConnected: false,
    rlsPolicyChanged: false,
    sqlExecuted: false,
    g6dImplementationReady: g6dReport.implementationComplete,
    recommendedNextPhase:
      config?.recommendedNextPhase ??
      "Manual first non-dry-run staging profile update (user approval required)",
    planDocSections: sectionChecks,
    blockers,
    verificationComplete,
  };
}

/**
 * @param {ReturnType<typeof runStagingProfileUpdatePocVerificationReport>} report
 */
export function formatStagingProfileUpdatePocVerificationMarkdown(report) {
  const lines = [
    "# Staging Profile Update PoC Verification Report",
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
    `| verificationOnly | ${report.verificationOnly} |`,
    `| targetModule | ${report.targetModule} |`,
    `| targetOperation | ${report.targetOperation} |`,
    `| targetFields | ${JSON.stringify(report.targetFields)} |`,
    `| columnMappingRequiresConfirmation | ${report.columnMappingRequiresConfirmation} |`,
    `| cursorWillNotExecuteNonDryRun | ${report.cursorWillNotExecuteNonDryRun} |`,
    `| nonDryRunExecuted | ${report.nonDryRunExecuted} |`,
    `| readyForManualNonDryRunDecision | ${report.readyForManualNonDryRunDecision} |`,
    `| productionDataTouched | ${report.productionDataTouched} |`,
    `| adminRouteConnected | ${report.adminRouteConnected} |`,
    `| storageConnected | ${report.storageConnected} |`,
    `| publishConnected | ${report.publishConnected} |`,
    `| rlsPolicyChanged | ${report.rlsPolicyChanged} |`,
    "",
    "## Next phase",
    "",
    report.recommendedNextPhase,
    "",
    "Cursor must not execute non-dry-run automatically.",
    "",
  ];

  if (report.blockers.length > 0) {
    lines.push("## Blockers", "", ...report.blockers.map((b) => `- ${b}`), "");
  }

  lines.push("*G-6-d-verify: verification only. No non-dry-run execution.*");

  return lines.join("\n");
}

/**
 * @param {string} outDir
 * @param {ReturnType<typeof runStagingProfileUpdatePocVerificationReport>} report
 */
export function writeStagingProfileUpdatePocVerificationOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(
    outDir,
    "staging-profile-update-poc-verification-checklist.json",
  );
  const mdPath = path.join(
    outDir,
    "STAGING_PROFILE_UPDATE_POC_VERIFICATION_REPORT.md",
  );
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(mdPath, `${formatStagingProfileUpdatePocVerificationMarkdown(report)}\n`, "utf8");
  return { jsonPath, mdPath };
}
