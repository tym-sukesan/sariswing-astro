/**
 * G-6-d-schema-apply-prep — Profile schema apply prep reporter (docs/SQL scan only).
 * Cursor does not execute SQL.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runProfileSchemaAlignmentPlanReport } from "./profile-schema-alignment-plan-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/profile-schema-apply-prep.md";
const CONFIG_REL = "config/admin/profile-schema-apply-prep.json";
const SQL_APPLY_REL = "sql/staging/profile-schema-apply.sql";
const SQL_ROLLBACK_REL = "sql/staging/profile-schema-rollback.sql";

const REQUIRED_DOC_SECTIONS = [
  "## 1. Purpose",
  "## 2. Current blocker",
  "## 3. Confirmed admin_users schema",
  "## 4. Manual application overview",
  "## 5. SQL package: create profile table",
  "## 6. SQL package: updated_at trigger",
  "## 7. SQL package: seed row",
  "## 8. SQL package: enable RLS",
  "## 9. SQL package: read policy",
  "## 10. SQL package: update policy for admin/editor",
  "## 11. SQL package: optional insert/delete policies",
  "## 12. Verification SQL",
  "## 13. Rollback / cleanup SQL",
  "## 14. Pre-apply checklist",
  "## 15. Post-apply checklist",
  "## 16. Decision states",
  "## 17. Next phase recommendation",
  "## 18. Final safety statement",
];

const FORBIDDEN_SCRIPT_PATTERNS = [
  /@supabase\/supabase-js/,
  /createClient\s*\(/,
  /\.from\s*\(\s*['"`]/,
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
 * @param {string} sqlContent
 */
function scanApplySql(sqlContent) {
  const hasWarning =
    sqlContent.includes("MANUAL STAGING SQL ONLY") &&
    sqlContent.includes("DO NOT RUN FROM CURSOR") &&
    sqlContent.includes("static-to-astro-cms-staging") &&
    sqlContent.includes("Never run on production");
  const hasCreateTable =
    /create table if not exists public\.profile/i.test(sqlContent);
  const hasTrigger = /set_profile_updated_at/i.test(sqlContent);
  const hasSeed = /insert into public\.profile/i.test(sqlContent);
  const hasRls = /enable row level security/i.test(sqlContent);
  const hasReadPolicy = /for select/i.test(sqlContent);
  const hasUpdatePolicy =
    /Admins and editors can update profile/i.test(sqlContent) &&
    /role in \('admin', 'editor'\)/i.test(sqlContent) &&
    /user_id = auth\.uid\(\)/i.test(sqlContent);
  const noIsActiveInPolicy = !/is_active\s*=\s*true/i.test(sqlContent);
  const noInsertPolicy =
    !/for insert/i.test(sqlContent) ||
    sqlContent.includes("No insert policy for G-6-d");
  const noDeletePolicy =
    !/for delete/i.test(sqlContent) ||
    sqlContent.includes("No delete policy for G-6-d");
  const noServiceRole = !/service_role/i.test(sqlContent);

  return {
    ok:
      hasWarning &&
      hasCreateTable &&
      hasTrigger &&
      hasSeed &&
      hasRls &&
      hasReadPolicy &&
      hasUpdatePolicy &&
      noIsActiveInPolicy &&
      noInsertPolicy &&
      noDeletePolicy &&
      noServiceRole,
    hasWarning,
    hasCreateTable,
    hasTrigger,
    hasSeed,
    hasRls,
    hasReadPolicy,
    hasUpdatePolicy,
    noIsActiveInPolicy,
    noInsertPolicy,
    noDeletePolicy,
  };
}

/**
 * @param {string} sqlContent
 */
function scanRollbackSql(sqlContent) {
  return (
    sqlContent.includes("MANUAL STAGING SQL ONLY") &&
    sqlContent.includes("DO NOT RUN FROM CURSOR") &&
    sqlContent.includes("drop table if exists public.profile")
  );
}

/**
 * @param {object} opts
 * @param {string} [opts.toolRoot]
 * @param {string} [opts.siteId]
 */
export function runProfileSchemaApplyPrepReport(opts = {}) {
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

  const g6dBlockerReport = runProfileSchemaAlignmentPlanReport({
    toolRoot,
    siteId,
  });

  const applySqlExists = fs.existsSync(path.join(toolRoot, SQL_APPLY_REL));
  const rollbackSqlExists = fs.existsSync(path.join(toolRoot, SQL_ROLLBACK_REL));
  const applySql = applySqlExists ? readText(toolRoot, SQL_APPLY_REL) : "";
  const rollbackSql = rollbackSqlExists ? readText(toolRoot, SQL_ROLLBACK_REL) : "";
  const applyScan = scanApplySql(applySql);
  const rollbackOk = scanRollbackSql(rollbackSql);

  const planningOnlyDoc = docContent.includes(
    "G-6-d-schema-apply-prep prepares a manual staging-only SQL package",
  );
  const cursorNoExecute =
    docContent.includes("Cursor must not execute SQL") &&
    config?.cursorExecutesSql === false;
  const adminUsersConfirmed =
    docContent.includes("There is no is_active column") &&
    docContent.includes("user_id uuid") &&
    config?.usesIsActive === false;
  const manualOverview = docContent.includes("Manual application overview");
  const prePostChecklists =
    docContent.includes("Pre-apply checklist") &&
    docContent.includes("Post-apply checklist");

  const reporterPath = path.join(
    toolRoot,
    "scripts/lib/profile-schema-apply-prep-reporter.mjs",
  );
  const cliPath = path.join(toolRoot, "scripts/report-profile-schema-apply-prep.mjs");
  const reporterScan = scanPlanningScriptForUnsafeCode(reporterPath);
  const cliScan = scanPlanningScriptForUnsafeCode(cliPath);

  const prepComplete =
    docExists &&
    configExists &&
    g6dBlockerReport.planComplete &&
    applySqlExists &&
    rollbackSqlExists &&
    missingSections.length === 0 &&
    planningOnlyDoc &&
    cursorNoExecute &&
    adminUsersConfirmed &&
    manualOverview &&
    prePostChecklists &&
    applyScan.ok &&
    rollbackOk &&
    reporterScan.clean &&
    cliScan.clean &&
    config.manualSqlPrepared === true &&
    config.schemaApplied === false &&
    config.rlsPolicyApplied === false &&
    config.dbWritePerformedByCursor === false &&
    config.readyForManualSchemaApply === true &&
    config.readyForG6DNonDryRun === false;

  const blockers = [
    ...(!docExists ? ["missing-apply-prep-doc"] : []),
    ...(!configExists ? ["missing-config-json"] : []),
    ...(!g6dBlockerReport.planComplete ? ["g6d-blocker-not-complete"] : []),
    ...(!applySqlExists ? ["missing-apply-sql-file"] : []),
    ...(!rollbackSqlExists ? ["missing-rollback-sql-file"] : []),
    ...missingSections.map((s) => `missing-section:${s.heading}`),
    ...(!applyScan.ok ? ["apply-sql-scan-failed"] : []),
    ...(!rollbackOk ? ["rollback-sql-scan-failed"] : []),
    ...(!reporterScan.clean ? [`unsafe-reporter:${reporterScan.hits.join(",")}`] : []),
    ...(!cliScan.clean ? [`unsafe-cli:${cliScan.hits.join(",")}`] : []),
  ];

  return {
    mode: "dry-run",
    phase: "G-6-d-schema-apply-prep",
    type: "profile-schema-apply-prep",
    siteId,
    generatedAt: new Date().toISOString(),
    docRef: DOC_REL,
    configRef: CONFIG_REL,
    sqlApplyRef: SQL_APPLY_REL,
    sqlRollbackRef: SQL_ROLLBACK_REL,
    profileSchemaApplyPrepCreated: prepComplete,
    manualSqlPrepared: config?.manualSqlPrepared ?? true,
    cursorExecutesSql: false,
    intendedProject: config?.intendedProject ?? "static-to-astro-cms-staging",
    productionForbidden: config?.productionForbidden ?? true,
    targetTable: config?.targetTable ?? "profile",
    usesIsActive: false,
    schemaApplied: false,
    rlsPolicyApplied: false,
    dbWritePerformedByCursor: false,
    readyForManualSchemaApply: config?.readyForManualSchemaApply ?? true,
    readyForG6DDryRunRetry: false,
    readyForG6DNonDryRun: false,
    adminRouteConnected: false,
    productionDataTouched: false,
    g6dBlockerPlanReady: g6dBlockerReport.planComplete,
    applySqlScan: applyScan,
    recommendedNextPhase:
      config?.recommendedNextPhase ??
      "G-6-d-schema-apply: user manually applies profile schema SQL to staging",
    planDocSections: sectionChecks,
    blockers,
    prepComplete,
  };
}

/**
 * @param {ReturnType<typeof runProfileSchemaApplyPrepReport>} report
 */
export function formatProfileSchemaApplyPrepMarkdown(report) {
  const lines = [
    "# Profile Schema Apply Prep Report",
    "",
    `**Phase:** ${report.phase}`,
    `**Site:** ${report.siteId}`,
    `**Generated:** ${report.generatedAt}`,
    "",
    "## Flags",
    "",
    "| Flag | Value |",
    "| --- | --- |",
    `| manualSqlPrepared | ${report.manualSqlPrepared} |`,
    `| cursorExecutesSql | ${report.cursorExecutesSql} |`,
    `| intendedProject | ${report.intendedProject} |`,
    `| productionForbidden | ${report.productionForbidden} |`,
    `| targetTable | ${report.targetTable} |`,
    `| usesIsActive | ${report.usesIsActive} |`,
    `| schemaApplied | ${report.schemaApplied} |`,
    `| rlsPolicyApplied | ${report.rlsPolicyApplied} |`,
    `| dbWritePerformedByCursor | ${report.dbWritePerformedByCursor} |`,
    `| readyForManualSchemaApply | ${report.readyForManualSchemaApply} |`,
    `| readyForG6DNonDryRun | ${report.readyForG6DNonDryRun} |`,
    "",
    "## Next phase",
    "",
    report.recommendedNextPhase,
    "",
    "Cursor does not execute SQL.",
    "",
  ];

  if (report.blockers.length > 0) {
    lines.push("## Blockers", "", ...report.blockers.map((b) => `- ${b}`), "");
  }

  lines.push("*G-6-d-schema-apply-prep: manual SQL package only.*");

  return lines.join("\n");
}

/**
 * @param {string} outDir
 * @param {ReturnType<typeof runProfileSchemaApplyPrepReport>} report
 */
export function writeProfileSchemaApplyPrepOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "profile-schema-apply-prep.json");
  const mdPath = path.join(outDir, "PROFILE_SCHEMA_APPLY_PREP_REPORT.md");
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(mdPath, `${formatProfileSchemaApplyPrepMarkdown(report)}\n`, "utf8");
  return { jsonPath, mdPath };
}
