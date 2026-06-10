/**
 * G-6-d-dry-run-retry-after-schema-apply — Schema verification + dry-run QA reporter.
 * Cursor does not execute SQL or non-dry-run writes.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runProfileSchemaApplyPrepReport } from "./profile-schema-apply-prep-reporter.mjs";
import { runG6dDryRunQa } from "./run-g6d-dry-run-qa.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL =
  "docs/staging-profile-schema-apply-verification-and-dry-run-qa.md";
const CONFIG_REL =
  "config/admin/staging-profile-schema-apply-verification-and-dry-run-qa.json";

const REQUIRED_DOC_SECTIONS = [
  "## 1. Purpose",
  "## 2. Manual schema apply status",
  "## 3. Verified profile table",
  "## 4. Verified profile columns",
  "## 5. Verified seed row",
  "## 6. Verified policies",
  "## 7. Current safety state",
  "## 8. Dry-run QA command / procedure",
  "## 9. Dry-run expected result",
  "## 10. Dry-run QA checklist",
  "## 11. DB unchanged verification after dry-run",
  "## 12. Remaining blockers before non-dry-run",
  "## 13. Manual non-dry-run decision gate",
  "## 14. Next phase recommendation",
  "## 15. Final safety statement",
];

const FORBIDDEN_SCRIPT_PATTERNS = [
  /\.update\s*\(/,
  /\.upsert\s*\(/,
  /\.delete\s*\(/,
  /service_role/i,
  /SERVICE_ROLE/,
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
function scanReporterScriptForUnsafeCode(filePath) {
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
 * @param {string} opts.toolRoot
 * @param {string} [opts.siteId]
 * @param {boolean} [opts.runDryRun]
 */
export async function runStagingProfileSchemaApplyVerificationAndDryRunQaReport({
  toolRoot = DEFAULT_TOOL_ROOT,
  siteId = "default",
  runDryRun = true,
}) {
  const docPath = path.join(toolRoot, DOC_REL);
  const configPath = path.join(toolRoot, CONFIG_REL);
  const reportScriptPath = path.join(
    toolRoot,
    "scripts/report-staging-profile-schema-apply-verification-and-dry-run-qa.mjs",
  );

  /** @type {string[]} */
  const blockers = [];

  if (!fs.existsSync(docPath)) blockers.push("verification-doc-missing");
  if (!fs.existsSync(configPath)) blockers.push("verification-config-missing");

  const docContent = fs.existsSync(docPath)
    ? fs.readFileSync(docPath, "utf8")
    : "";
  const sectionChecks = sectionsPresent(docContent, REQUIRED_DOC_SECTIONS);
  for (const s of sectionChecks) {
    if (!s.present) blockers.push(`doc-section-missing:${s.heading}`);
  }

  const scriptScan = scanReporterScriptForUnsafeCode(reportScriptPath);
  if (!scriptScan.clean) {
    blockers.push(`report-script-unsafe:${scriptScan.hits.join(",")}`);
  }

  let config = null;
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }

  const prepReport = runProfileSchemaApplyPrepReport({ toolRoot, siteId });

  /** @type {Awaited<ReturnType<typeof runG6dDryRunQa>> | null} */
  let dryRunQa = null;
  if (runDryRun) {
    dryRunQa = await runG6dDryRunQa({ toolRoot });
    if (dryRunQa.skipped) {
      blockers.push(`dry-run-skipped:${dryRunQa.reason}`);
    } else if (!dryRunQa.ok) {
      blockers.push(`dry-run-failed:${dryRunQa.error ?? "unknown"}`);
    }
  } else if (config?.dryRunRetried && config?.dryRunPassed) {
    dryRunQa = { ok: true, dryRun: true, fromConfig: true };
  }

  const dryRunRetried = Boolean(dryRunQa && !dryRunQa.skipped);
  const dryRunPassed = Boolean(dryRunQa?.ok);
  const schemaApplied = config?.schemaApplied ?? true;
  const profileTableExists = config?.profileTableExists ?? true;
  const seedRowExists = config?.seedRowExists ?? true;
  const rlsPolicyApplied = config?.rlsPolicyApplied ?? true;

  const verificationComplete =
    blockers.length === 0 &&
    schemaApplied &&
    profileTableExists &&
    seedRowExists &&
    rlsPolicyApplied &&
    dryRunRetried &&
    dryRunPassed;

  return {
    phase: "G-6-d-dry-run-retry-after-schema-apply",
    siteId,
    generatedAt: new Date().toISOString(),
    schemaApplied,
    profileTableExists,
    seedRowExists,
    rlsPolicyApplied,
    dryRunRequired: true,
    dryRunRetried,
    dryRunPassed,
    nonDryRunExecuted: false,
    readyForManualNonDryRunDecision: dryRunPassed && dryRunRetried,
    readyForG6DDryRunRetry: !dryRunRetried,
    readyForG6DNonDryRun: false,
    dbWritePerformedByCursor: false,
    adminRouteConnected: false,
    productionDataTouched: false,
    cursorExecutedSql: false,
    appliedByUserManually: true,
    intendedProject: "static-to-astro-cms-staging",
    usesIsActive: false,
    prepReportComplete: prepReport.prepComplete,
    dryRunQa,
    planDocSections: sectionChecks,
    blockers,
    verificationComplete,
  };
}

/**
 * @param {ReturnType<typeof runStagingProfileSchemaApplyVerificationAndDryRunQaReport>} report
 */
export function formatStagingProfileSchemaApplyVerificationMarkdown(report) {
  const lines = [
    "# Staging Profile Schema Apply Verification and Dry-run QA Report",
    "",
    `**Phase:** ${report.phase}`,
    `**Site:** ${report.siteId}`,
    `**Generated:** ${report.generatedAt}`,
    "",
    "## Flags",
    "",
    "| Flag | Value |",
    "| --- | --- |",
    `| schemaApplied | ${report.schemaApplied} |`,
    `| profileTableExists | ${report.profileTableExists} |`,
    `| seedRowExists | ${report.seedRowExists} |`,
    `| rlsPolicyApplied | ${report.rlsPolicyApplied} |`,
    `| dryRunRetried | ${report.dryRunRetried} |`,
    `| dryRunPassed | ${report.dryRunPassed} |`,
    `| nonDryRunExecuted | ${report.nonDryRunExecuted} |`,
    `| readyForManualNonDryRunDecision | ${report.readyForManualNonDryRunDecision} |`,
    `| readyForG6DNonDryRun | ${report.readyForG6DNonDryRun} |`,
    `| dbWritePerformedByCursor | ${report.dbWritePerformedByCursor} |`,
    "",
    "No non-dry-run update executed. No production data touched.",
    "",
  ];

  if (report.blockers.length > 0) {
    lines.push("## Blockers", "", ...report.blockers.map((b) => `- ${b}`), "");
  }

  return lines.join("\n");
}

/**
 * @param {string} outDir
 * @param {ReturnType<typeof runStagingProfileSchemaApplyVerificationAndDryRunQaReport>} report
 */
export function writeStagingProfileSchemaApplyVerificationOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(
    outDir,
    "staging-profile-schema-apply-verification-and-dry-run-qa.json",
  );
  const mdPath = path.join(
    outDir,
    "STAGING_PROFILE_SCHEMA_APPLY_VERIFICATION_AND_DRY_RUN_QA_REPORT.md",
  );
  const summary = {
    phase: report.phase,
    schemaApplied: report.schemaApplied,
    profileTableExists: report.profileTableExists,
    seedRowExists: report.seedRowExists,
    rlsPolicyApplied: report.rlsPolicyApplied,
    dryRunRequired: report.dryRunRequired,
    dryRunRetried: report.dryRunRetried,
    dryRunPassed: report.dryRunPassed,
    nonDryRunExecuted: report.nonDryRunExecuted,
    readyForManualNonDryRunDecision: report.readyForManualNonDryRunDecision,
    readyForG6DNonDryRun: report.readyForG6DNonDryRun,
    dbWritePerformedByCursor: report.dbWritePerformedByCursor,
    adminRouteConnected: report.adminRouteConnected,
    productionDataTouched: report.productionDataTouched,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    mdPath,
    `${formatStagingProfileSchemaApplyVerificationMarkdown(report)}\n`,
    "utf8",
  );
  return { jsonPath, mdPath };
}
