/**
 * G-6-d-blocker — Profile schema alignment plan reporter (docs/config scan only).
 * No SQL execution. No schema changes.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runStagingProfileUpdatePocVerificationReport } from "./staging-profile-update-poc-verification-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/profile-schema-alignment-plan.md";
const CONFIG_REL = "config/admin/profile-schema-alignment-plan.json";
const DRAFT_MARKER = "DRAFT ONLY. DO NOT RUN IN G-6-d-blocker.";

const REQUIRED_DOC_SECTIONS = [
  "## 1. Purpose",
  "## 2. Current blocker",
  "## 3. Impact",
  "## 4. Recommended direction",
  "## 5. Table name options",
  "## 6. Column options",
  "## 7. Minimal schema for G-6-d continuation",
  "## 8. DRAFT ONLY SQL skeleton",
  "## 9. RLS draft policy plan",
  "## 10. Adapter alignment plan",
  "## 11. Seed data plan",
  "## 12. Manual staging application checklist",
  "## 13. Rollback / cleanup plan",
  "## 14. Decision states",
  "## 15. Completion criteria",
  "## 16. Next phase recommendation",
  "## 17. Final safety statement",
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
export function runProfileSchemaAlignmentPlanReport(opts = {}) {
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

  const g6dVerifyReport = runStagingProfileUpdatePocVerificationReport({
    toolRoot,
    siteId,
  });

  const planningOnlyDoc = docContent.includes(
    "G-6-d-blocker is a schema alignment planning phase only",
  );
  const blockerDocumented =
    docContent.includes("public.profile does not exist") &&
    config?.blocker?.includes("profile table missing");
  const actualTablesDocumented =
    docContent.includes("admin_users") &&
    docContent.includes("schedules") &&
    Array.isArray(config?.actualStagingTables) &&
    config.actualStagingTables.length >= 5;
  const recommendedProfile =
    docContent.includes("public.profile") &&
    config?.recommendedTable === "profile";
  const columnsDefined =
    docContent.includes("minimalColumnsForG6D") ||
    (docContent.includes("Minimal columns for G-6-d") &&
      docContent.includes("updated_by"));
  const draftSqlMarked =
    docContent.includes(DRAFT_MARKER) &&
    (docContent.match(new RegExp(DRAFT_MARKER.replace(/\./g, "\\."), "g")) ?? [])
      .length >= 3;
  const rlsDraftPlan =
    docContent.includes("RLS draft policy plan") &&
    docContent.includes("enable row level security");
  const adapterPlan =
    docContent.includes("Adapter alignment plan") &&
    docContent.includes("adapter can stay as-is");
  const schemaApplyChecklist =
    docContent.includes("Manual staging application checklist") &&
    docContent.includes("static-to-astro-cms-staging");

  const reporterPath = path.join(
    toolRoot,
    "scripts/lib/profile-schema-alignment-plan-reporter.mjs",
  );
  const cliPath = path.join(toolRoot, "scripts/report-profile-schema-alignment-plan.mjs");
  const reporterScan = scanPlanningScriptForUnsafeCode(reporterPath);
  const cliScan = scanPlanningScriptForUnsafeCode(cliPath);

  const planComplete =
    docExists &&
    configExists &&
    g6dVerifyReport.verificationComplete &&
    missingSections.length === 0 &&
    planningOnlyDoc &&
    blockerDocumented &&
    actualTablesDocumented &&
    recommendedProfile &&
    columnsDefined &&
    draftSqlMarked &&
    rlsDraftPlan &&
    adapterPlan &&
    schemaApplyChecklist &&
    reporterScan.clean &&
    cliScan.clean &&
    config.planningOnly === true &&
    config.draftSqlExecuted === false &&
    config.schemaApplied === false &&
    config.rlsPolicyChanged === false &&
    config.dbWritePerformed === false &&
    config.readyForSchemaApplyApproval === true &&
    config.readyForG6DNonDryRun === false;

  const blockers = [
    ...(!docExists ? ["missing-alignment-plan-doc"] : []),
    ...(!configExists ? ["missing-config-json"] : []),
    ...(!g6dVerifyReport.verificationComplete ? ["g6d-verify-not-complete"] : []),
    ...missingSections.map((s) => `missing-section:${s.heading}`),
    ...(!planningOnlyDoc ? ["planning-only-doc-missing"] : []),
    ...(!blockerDocumented ? ["blocker-not-documented"] : []),
    ...(!actualTablesDocumented ? ["actual-tables-not-documented"] : []),
    ...(!recommendedProfile ? ["recommended-table-missing"] : []),
    ...(!columnsDefined ? ["columns-not-defined"] : []),
    ...(!draftSqlMarked ? ["draft-sql-marker-missing"] : []),
    ...(!rlsDraftPlan ? ["rls-draft-plan-missing"] : []),
    ...(!adapterPlan ? ["adapter-plan-missing"] : []),
    ...(!schemaApplyChecklist ? ["schema-apply-checklist-missing"] : []),
    ...(!reporterScan.clean ? [`unsafe-reporter:${reporterScan.hits.join(",")}`] : []),
    ...(!cliScan.clean ? [`unsafe-cli:${cliScan.hits.join(",")}`] : []),
  ];

  return {
    mode: "dry-run",
    phase: "G-6-d-blocker",
    type: "profile-schema-alignment-plan",
    siteId,
    generatedAt: new Date().toISOString(),
    docRef: DOC_REL,
    configRef: CONFIG_REL,
    profileSchemaAlignmentPlanCreated: planComplete,
    planningOnly: true,
    blocker: config?.blocker ?? "public.profile table missing in staging DB",
    expectedTable: config?.expectedTable ?? "profile",
    recommendedTable: config?.recommendedTable ?? "profile",
    actualStagingTables: config?.actualStagingTables ?? [],
    draftSqlCreated: config?.draftSqlCreated ?? true,
    draftSqlExecuted: false,
    schemaApplied: false,
    rlsPolicyChanged: false,
    dbWritePerformed: false,
    nonDryRunExecuted: false,
    readyForSchemaApplyApproval: config?.readyForSchemaApplyApproval ?? true,
    readyForG6DNonDryRun: false,
    readyForManualNonDryRunDecision: false,
    productionDataTouched: false,
    adminRouteConnected: false,
    storageConnected: false,
    publishConnected: false,
    g6dVerifyChecklistReady: g6dVerifyReport.verificationComplete,
    recommendedNextPhase:
      config?.recommendedNextPhase ??
      "G-6-d-schema-apply-prep: review and approve applying public.profile schema to staging",
    planDocSections: sectionChecks,
    blockers,
    planComplete,
  };
}

/**
 * @param {ReturnType<typeof runProfileSchemaAlignmentPlanReport>} report
 */
export function formatProfileSchemaAlignmentPlanMarkdown(report) {
  const lines = [
    "# Profile Schema Alignment Plan Report",
    "",
    `**Phase:** ${report.phase}`,
    `**Site:** ${report.siteId}`,
    `**Generated:** ${report.generatedAt}`,
    "",
    "## Blocker",
    "",
    report.blocker,
    "",
    "## Flags",
    "",
    "| Flag | Value |",
    "| --- | --- |",
    `| planningOnly | ${report.planningOnly} |`,
    `| expectedTable | ${report.expectedTable} |`,
    `| recommendedTable | ${report.recommendedTable} |`,
    `| draftSqlCreated | ${report.draftSqlCreated} |`,
    `| draftSqlExecuted | ${report.draftSqlExecuted} |`,
    `| schemaApplied | ${report.schemaApplied} |`,
    `| rlsPolicyChanged | ${report.rlsPolicyChanged} |`,
    `| dbWritePerformed | ${report.dbWritePerformed} |`,
    `| readyForSchemaApplyApproval | ${report.readyForSchemaApplyApproval} |`,
    `| readyForG6DNonDryRun | ${report.readyForG6DNonDryRun} |`,
    `| productionDataTouched | ${report.productionDataTouched} |`,
    "",
    "## Next phase",
    "",
    report.recommendedNextPhase,
    "",
  ];

  if (report.blockers.length > 0) {
    lines.push("## Blockers", "", ...report.blockers.map((b) => `- ${b}`), "");
  }

  lines.push("*G-6-d-blocker: planning only. No SQL. No schema apply.*");

  return lines.join("\n");
}

/**
 * @param {string} outDir
 * @param {ReturnType<typeof runProfileSchemaAlignmentPlanReport>} report
 */
export function writeProfileSchemaAlignmentPlanOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "profile-schema-alignment-plan.json");
  const mdPath = path.join(outDir, "PROFILE_SCHEMA_ALIGNMENT_PLAN_REPORT.md");
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(mdPath, `${formatProfileSchemaAlignmentPlanMarkdown(report)}\n`, "utf8");
  return { jsonPath, mdPath };
}
