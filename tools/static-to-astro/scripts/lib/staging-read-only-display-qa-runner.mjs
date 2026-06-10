/**
 * G-5z-d — Staging read-only module display QA runner (docs/UI scan only).
 * No live Supabase connection. No DB write.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const QA_DOC_REL = "docs/staging-read-only-module-display-qa.md";
const PANEL_REL =
  "templates/admin-cms/data/components/AdminReadOnlyDataStatusPanel.astro";

const REQUIRED_DOC_SECTIONS = [
  "## 1. Purpose",
  "## 2. Current state",
  "## 3. QA matrix",
  "## 4. Mock mode QA",
  "## 5. Supabase read-only mode QA",
  "## 6. Module-level state QA",
  "## 7. No-write QA",
  "## 8. Visual / UX QA",
  "## 9. Accessibility / basic HTML QA",
  "## 10. QA report output",
];

const QA_MODULES = ["profile", "schedule", "discography", "links", "news"];

const STAGING_DATA_DIR = path.resolve(
  DEFAULT_TOOL_ROOT,
  "../../src/lib/admin/staging-data",
);

const FORBIDDEN_IN_STAGING_DATA = [
  /\.insert\s*\(/,
  /\.update\s*\(/,
  /\.upsert\s*\(/,
  /\.delete\s*\(/,
  /\.rpc\s*\(/,
  /storage\./,
  /service_role/i,
  /SERVICE_ROLE/,
];

/**
 * @param {string} dir
 */
function scanStagingDataDirForForbidden(dir) {
  if (!fs.existsSync(dir)) return { clean: false, hits: ["missing-staging-data-dir"] };
  /** @type {string[]} */
  const hits = [];
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".ts")) continue;
    const content = fs.readFileSync(path.join(dir, name), "utf8");
    for (const pattern of FORBIDDEN_IN_STAGING_DATA) {
      if (pattern.test(content)) hits.push(`${name}:${pattern.source}`);
    }
  }
  return { clean: hits.length === 0, hits };
}

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
function docSectionsPresent(content, sections) {
  return sections.map((heading) => ({
    heading,
    present: content.includes(heading),
  }));
}

/**
 * @param {string} toolRoot
 */
function scanPanelForQaMarkers(toolRoot) {
  const abs = path.join(toolRoot, PANEL_REL);
  if (!fs.existsSync(abs)) {
    return {
      exists: false,
      canWriteFalse: false,
      moduleDataAttributes: false,
      safetyBanner: false,
      urlOverflowGuard: false,
      modulesFound: [],
    };
  }
  const content = readText(toolRoot, PANEL_REL);
  const modulesFound = QA_MODULES.filter((m) =>
    content.includes(`data-module="${m}"`),
  );
  return {
    exists: true,
    canWriteFalse: /id="staging-data-can-write">false</.test(content),
    moduleDataAttributes: modulesFound.length === QA_MODULES.length,
    safetyBanner: content.includes("admin-readonly-data-panel__safety-banner"),
    urlOverflowGuard: /word-break|overflow-wrap/.test(content),
    modulesFound,
  };
}

/**
 * @param {object} opts
 * @param {string} [opts.toolRoot]
 * @param {string} [opts.siteId]
 */
export function runStagingReadOnlyDisplayQa(opts = {}) {
  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const siteId = opts.siteId ?? "default";

  const qaDocPath = path.join(toolRoot, QA_DOC_REL);
  const qaDocExists = fs.existsSync(qaDocPath);
  const qaDocContent = qaDocExists ? fs.readFileSync(qaDocPath, "utf8") : "";
  const sectionChecks = docSectionsPresent(qaDocContent, REQUIRED_DOC_SECTIONS);
  const missingSections = sectionChecks.filter((s) => !s.present);

  const mockModeDocumented =
    qaDocContent.includes("PUBLIC_ADMIN_DATA_PROVIDER=mock") &&
    qaDocContent.includes("ENABLE_ADMIN_STAGING_DATA_READ=false");
  const supabaseModeDocumented =
    qaDocContent.includes("PUBLIC_ADMIN_DATA_PROVIDER=supabase") &&
    qaDocContent.includes("ENABLE_ADMIN_STAGING_DATA_READ=true");
  const moduleStateQaDocumented =
    qaDocContent.includes("rls-denied") &&
    qaDocContent.includes("news table missing");
  const noWriteQaDocumented =
    qaDocContent.includes("canWrite: false") &&
    qaDocContent.includes("No save");

  const panelScan = scanPanelForQaMarkers(toolRoot);
  const forbiddenScan = scanStagingDataDirForForbidden(STAGING_DATA_DIR);

  const displayQaComplete =
    qaDocExists &&
    missingSections.length === 0 &&
    mockModeDocumented &&
    supabaseModeDocumented &&
    moduleStateQaDocumented &&
    noWriteQaDocumented &&
    panelScan.exists &&
    panelScan.canWriteFalse &&
    panelScan.moduleDataAttributes &&
    forbiddenScan.clean;

  const blockers = [
    ...(!qaDocExists ? ["missing-qa-doc"] : []),
    ...missingSections.map((s) => `missing-doc-section:${s.heading}`),
    ...(!mockModeDocumented ? ["mock-mode-not-documented"] : []),
    ...(!supabaseModeDocumented ? ["supabase-mode-not-documented"] : []),
    ...(!moduleStateQaDocumented ? ["module-state-qa-not-documented"] : []),
    ...(!noWriteQaDocumented ? ["no-write-qa-not-documented"] : []),
    ...(!panelScan.exists ? ["missing-readonly-panel"] : []),
    ...(!panelScan.canWriteFalse ? ["panel-canwrite-not-false"] : []),
    ...(!panelScan.moduleDataAttributes
      ? [`panel-missing-module-attrs:${QA_MODULES.filter((m) => !panelScan.modulesFound.includes(m)).join(",")}`]
      : []),
    ...(!forbiddenScan.clean ? ["forbidden-patterns-in-staging-data"] : []),
  ];

  return {
    mode: "dry-run",
    phase: "G-5z-d",
    type: "staging-read-only-display-qa",
    siteId,
    generatedAt: new Date().toISOString(),
    docRef: QA_DOC_REL,
    readOnlyOnly: true,
    canWrite: false,
    displayQaAdded: qaDocExists,
    mockModeDocumented,
    supabaseModeDocumented,
    moduleStateQaDocumented,
    noWriteQaDocumented,
    visualQaDocumented: qaDocContent.includes("Visual / UX QA"),
    a11yQaDocumented: qaDocContent.includes("Accessibility"),
    storageConnected: false,
    publishConnected: false,
    adminRouteConnected: false,
    productionDataTouched: false,
    rlsPolicyChanged: false,
    dbUpdatePerformed: false,
    qaDocSections: sectionChecks,
    panelScan,
    forbiddenScan,
    targetModules: QA_MODULES,
    readyForG5zE: displayQaComplete,
    blockers,
  };
}

/**
 * @param {ReturnType<typeof runStagingReadOnlyDisplayQa>} report
 */
export function formatStagingReadOnlyDisplayQaMarkdown(report) {
  const lines = [
    "# Staging Read-only Display QA Report",
    "",
    `**Phase:** ${report.phase}`,
    `**Site:** ${report.siteId}`,
    `**Generated:** ${report.generatedAt}`,
    `**Doc:** ${report.docRef}`,
    "",
    "## Safety flags",
    "",
    "| Flag | Value |",
    "| --- | --- |",
    `| readOnlyOnly | ${report.readOnlyOnly} |`,
    `| canWrite | ${report.canWrite} |`,
    `| displayQaAdded | ${report.displayQaAdded} |`,
    `| mockModeDocumented | ${report.mockModeDocumented} |`,
    `| supabaseModeDocumented | ${report.supabaseModeDocumented} |`,
    `| moduleStateQaDocumented | ${report.moduleStateQaDocumented} |`,
    `| noWriteQaDocumented | ${report.noWriteQaDocumented} |`,
    `| storageConnected | ${report.storageConnected} |`,
    `| publishConnected | ${report.publishConnected} |`,
    `| adminRouteConnected | ${report.adminRouteConnected} |`,
    `| productionDataTouched | ${report.productionDataTouched} |`,
    `| readyForG5zE | ${report.readyForG5zE} |`,
    "",
    "## Target modules",
    "",
    report.targetModules.join(", "),
    "",
    "## Panel scan",
    "",
    `- exists: ${report.panelScan.exists}`,
    `- canWriteFalse: ${report.panelScan.canWriteFalse}`,
    `- moduleDataAttributes: ${report.panelScan.moduleDataAttributes}`,
    `- safetyBanner: ${report.panelScan.safetyBanner}`,
    `- urlOverflowGuard: ${report.panelScan.urlOverflowGuard}`,
    "",
  ];

  if (report.blockers.length > 0) {
    lines.push("## Blockers", "", ...report.blockers.map((b) => `- ${b}`), "");
  }

  lines.push(
    "*G-5z-d: display QA documentation and UI markers. No live DB connection.*",
  );

  return lines.join("\n");
}

/**
 * @param {string} outDir
 * @param {ReturnType<typeof runStagingReadOnlyDisplayQa>} report
 */
export function writeStagingReadOnlyDisplayQaOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "staging-read-only-display-qa.json");
  const mdPath = path.join(outDir, "STAGING_READ_ONLY_DISPLAY_QA_REPORT.md");
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(mdPath, `${formatStagingReadOnlyDisplayQaMarkdown(report)}\n`, "utf8");
  return { jsonPath, mdPath };
}
