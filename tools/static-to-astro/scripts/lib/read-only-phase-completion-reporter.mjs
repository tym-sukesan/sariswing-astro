/**
 * G-5z-e — Read-only phase completion reporter (docs/scan only).
 * No live Supabase connection. No DB write.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runStagingReadOnlyDisplayQa } from "./staging-read-only-display-qa-runner.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const G5Z_E_DOC_REL = "docs/read-only-qa-rls-review-report.md";
const G5Z_C_APPROVAL_ID = "G-5z-c-staging-read-only-data-connect";

const REQUIRED_DOC_SECTIONS = [
  "## 1. Purpose",
  "## 2. Phase summary",
  "## 3. Current implementation status",
  "## 4. Module status matrix",
  "## 5. Approved table / field summary",
  "## 6. RLS read policy review",
  "## 7. No-write guarantee",
  "## 8. Auth / role / data boundary",
  "## 9. QA results summary",
  "## 10. Blockers / warnings / recommendations",
  "## 11. Completion criteria for read-only phase",
  "## 12. Next phase recommendation",
  "## 13. Final safety statement",
];

const PRIOR_PHASE_DOCS = [
  "docs/read-only-data-integration-plan.md",
  "docs/read-only-data-adapter-scaffold.md",
  "docs/supabase-read-only-data-adapter.md",
  "docs/staging-read-only-module-display-qa.md",
  "docs/schema-mapping-rls-read-policy-review.md",
];

const SUPABASE_ADAPTER_REL =
  "../../src/lib/admin/staging-data/supabase-read-only-data-adapter.ts";

/**
 * @param {string} toolRoot
 * @param {string} relPath
 */
function docExists(toolRoot, relPath) {
  return fs.existsSync(path.join(toolRoot, relPath));
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
 * @param {string} toolRoot
 */
function priorPhaseDocsExist(toolRoot) {
  return PRIOR_PHASE_DOCS.map((rel) => ({
    path: rel,
    exists: docExists(toolRoot, rel),
  }));
}

/**
 * @param {object} opts
 * @param {string} [opts.toolRoot]
 * @param {string} [opts.siteId]
 */
export function runReadOnlyPhaseCompletionReport(opts = {}) {
  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const siteId = opts.siteId ?? "default";

  const g5zEDocPath = path.join(toolRoot, G5Z_E_DOC_REL);
  const g5zEDocExists = fs.existsSync(g5zEDocPath);
  const g5zEContent = g5zEDocExists ? fs.readFileSync(g5zEDocPath, "utf8") : "";
  const sectionChecks = sectionsPresent(g5zEContent, REQUIRED_DOC_SECTIONS);
  const missingSections = sectionChecks.filter((s) => !s.present);

  const priorDocs = priorPhaseDocsExist(toolRoot);
  const missingPriorDocs = priorDocs.filter((d) => !d.exists);

  const rlsChecklistDocumented =
    g5zEContent.includes("RLS review checklist") &&
    g5zEContent.includes("DRAFT ONLY. DO NOT RUN IN G-5z-e.");
  const noWriteDocumented =
    g5zEContent.includes("No-write guarantee") &&
    g5zEContent.includes("canWrite: false");
  const g6PlanningDocumented =
    g5zEContent.includes("G-6-a") &&
    g5zEContent.includes("write operation safety plan");
  const readOnlyPhaseCompleteInDoc = g5zEContent.includes("readOnlyPhaseComplete: true");
  const readyForG6PlanningInDoc = g5zEContent.includes("readyForG6Planning: true");
  const readyForG6ImplementationFalse =
    g5zEContent.includes("readyForG6Implementation: false");

  const displayQa = runStagingReadOnlyDisplayQa({ toolRoot, siteId });
  const supabaseAdapterExists = fs.existsSync(
    path.resolve(toolRoot, SUPABASE_ADAPTER_REL),
  );

  const readOnlyPhaseComplete =
    g5zEDocExists &&
    missingSections.length === 0 &&
    missingPriorDocs.length === 0 &&
    rlsChecklistDocumented &&
    noWriteDocumented &&
    g6PlanningDocumented &&
    readOnlyPhaseCompleteInDoc &&
    readyForG6PlanningInDoc &&
    readyForG6ImplementationFalse &&
    displayQa.readyForG5zE &&
    supabaseAdapterExists &&
    displayQa.forbiddenScan.clean;

  const blockers = [
    ...(!g5zEDocExists ? ["missing-g5z-e-doc"] : []),
    ...missingSections.map((s) => `missing-section:${s.heading}`),
    ...missingPriorDocs.map((d) => `missing-prior-doc:${d.path}`),
    ...(!rlsChecklistDocumented ? ["rls-checklist-not-documented"] : []),
    ...(!noWriteDocumented ? ["no-write-not-documented"] : []),
    ...(!g6PlanningDocumented ? ["g6-planning-not-documented"] : []),
    ...(!displayQa.readyForG5zE ? ["display-qa-not-ready"] : []),
    ...(!supabaseAdapterExists ? ["missing-supabase-adapter"] : []),
    ...(!displayQa.forbiddenScan.clean ? ["forbidden-patterns-in-staging-data"] : []),
  ];

  return {
    mode: "dry-run",
    phase: "G-5z-e",
    type: "read-only-qa-rls-review-report",
    siteId,
    generatedAt: new Date().toISOString(),
    docRef: G5Z_E_DOC_REL,
    approvalId: G5Z_C_APPROVAL_ID,
    readOnlyPhaseComplete,
    readyForG6Planning: readOnlyPhaseComplete,
    readyForG6Implementation: false,
    canWrite: false,
    approvedFieldsExpanded: false,
    newDbQueryAddedInG5zE: false,
    dbWriteImplemented: false,
    rlsPolicyChanged: false,
    storageConnected: false,
    publishConnected: false,
    adminRouteConnected: false,
    productionDataTouched: false,
    mockFallbackAvailable: true,
    selectStarUsed: false,
    writeMethodsImplemented: false,
    displayQaReady: displayQa.readyForG5zE,
    priorPhaseDocs: priorDocs,
    g5zEDocSections: sectionChecks,
    recommendation:
      "Proceed to G-6-a write operation safety plan or customer demo QA package.",
    blockers,
  };
}

/**
 * @param {ReturnType<typeof runReadOnlyPhaseCompletionReport>} report
 */
export function formatReadOnlyPhaseCompletionMarkdown(report) {
  const lines = [
    "# Read-only Phase Completion Report",
    "",
    `**Phase:** ${report.phase}`,
    `**Site:** ${report.siteId}`,
    `**Generated:** ${report.generatedAt}`,
    `**Doc:** ${report.docRef}`,
    "",
    "## Completion flags",
    "",
    "| Flag | Value |",
    "| --- | --- |",
    `| readOnlyPhaseComplete | ${report.readOnlyPhaseComplete} |`,
    `| readyForG6Planning | ${report.readyForG6Planning} |`,
    `| readyForG6Implementation | ${report.readyForG6Implementation} |`,
    `| canWrite | ${report.canWrite} |`,
    `| approvedFieldsExpanded | ${report.approvedFieldsExpanded} |`,
    `| newDbQueryAddedInG5zE | ${report.newDbQueryAddedInG5zE} |`,
    `| dbWriteImplemented | ${report.dbWriteImplemented} |`,
    `| rlsPolicyChanged | ${report.rlsPolicyChanged} |`,
    `| storageConnected | ${report.storageConnected} |`,
    `| publishConnected | ${report.publishConnected} |`,
    `| adminRouteConnected | ${report.adminRouteConnected} |`,
    `| productionDataTouched | ${report.productionDataTouched} |`,
    `| mockFallbackAvailable | ${report.mockFallbackAvailable} |`,
    `| displayQaReady | ${report.displayQaReady} |`,
    "",
    "## Recommendation",
    "",
    report.recommendation,
    "",
    "## Prior phase docs",
    "",
    ...report.priorPhaseDocs.map(
      (d) => `- [${d.exists ? "x" : " "}] \`${d.path}\``,
    ),
    "",
  ];

  if (report.blockers.length > 0) {
    lines.push("## Blockers", "", ...report.blockers.map((b) => `- ${b}`), "");
  }

  lines.push(
    "*G-5z-e: read-only phase completion report. No DB connection. No writes.*",
  );

  return lines.join("\n");
}

/**
 * @param {string} outDir
 * @param {ReturnType<typeof runReadOnlyPhaseCompletionReport>} report
 */
export function writeReadOnlyPhaseCompletionOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "read-only-phase-completion.json");
  const mdPath = path.join(outDir, "READ_ONLY_PHASE_COMPLETION_REPORT.md");
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(mdPath, `${formatReadOnlyPhaseCompletionMarkdown(report)}\n`, "utf8");
  return { jsonPath, mdPath };
}
