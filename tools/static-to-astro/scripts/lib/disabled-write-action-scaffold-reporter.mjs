/**
 * G-6-c — Disabled write action scaffold reporter (docs/config/component scan only).
 * No SQL execution. No RLS changes. No DB write.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runRlsWritePolicyReviewPlanReport } from "./rls-write-policy-review-plan-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/disabled-write-action-scaffold.md";
const CONFIG_REL = "config/admin/disabled-write-action-scaffold.json";

const REQUIRED_DOC_SECTIONS = [
  "## 1. Purpose",
  "## 2. Current state",
  "## 3. Added components",
  "## 4. Disabled action matrix",
  "## 5. Approval gate mapping",
  "## 6. Customer demo wording",
  "## 7. Developer safety notes",
  "## 8. Next phase",
  "## 9. Final safety statement",
];

const COMPONENT_RELS = [
  "templates/admin-cms/components/AdminDisabledActionButton.astro",
  "templates/admin-cms/components/AdminDisabledActionNotice.astro",
  "templates/admin-cms/components/AdminWriteGateBadge.astro",
  "templates/admin-cms/components/AdminWriteActionMatrix.astro",
  "templates/admin-cms/components/AdminWritePreflightChecklist.astro",
  "templates/admin-cms/components/ModuleDisabledWriteActionsSection.astro",
  "templates/admin-cms/data/components/AdminStagingDisabledWriteActionsSection.astro",
];

const MODULE_UI_RELS = [
  "templates/admin-cms/modules/ProfileAdminUi.astro",
  "templates/admin-cms/modules/LinksAdminUi.astro",
  "templates/admin-cms/modules/ScheduleAdminUi.astro",
  "templates/admin-cms/modules/DiscographyAdminUi.astro",
  "templates/admin-cms/modules/NewsAdminUi.astro",
];

const UNSAFE_COMPONENT_PATTERNS = [
  /on:click/i,
  /\bonclick\b/i,
  /\bfetch\s*\(/,
  /\.insert\s*\(/,
  /\.update\s*\(/,
  /\.delete\s*\(/,
  /\.upsert\s*\(/,
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
function scanComponentForUnsafeHandlers(filePath) {
  if (!fs.existsSync(filePath)) return { clean: false, hits: ["missing"] };
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  /** @type {string[]} */
  const hits = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;
    for (const pattern of UNSAFE_COMPONENT_PATTERNS) {
      if (pattern.test(line)) hits.push(pattern.source);
    }
  }
  return { clean: hits.length === 0, hits: [...new Set(hits)] };
}

/**
 * @param {string} filePath
 */
function scanDisabledButton(filePath) {
  if (!fs.existsSync(filePath)) return { ok: false, reason: "missing" };
  const content = fs.readFileSync(filePath, "utf8");
  if (!content.includes('type="button"')) return { ok: false, reason: "no-type-button" };
  if (!/\bdisabled\b/.test(content)) return { ok: false, reason: "no-disabled" };
  return { ok: true, reason: "" };
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
export function runDisabledWriteActionScaffoldReport(opts = {}) {
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

  const g6bReport = runRlsWritePolicyReviewPlanReport({ toolRoot, siteId });

  const componentsExist = COMPONENT_RELS.every((rel) =>
    fs.existsSync(path.join(toolRoot, rel)),
  );

  const componentScans = COMPONENT_RELS.map((rel) => {
    const abs = path.join(toolRoot, rel);
    const unsafe = scanComponentForUnsafeHandlers(abs);
    const button =
      rel.includes("AdminDisabledActionButton")
        ? scanDisabledButton(abs)
        : { ok: true, reason: "" };
    return { rel, unsafe, button };
  });

  const modulesWired = MODULE_UI_RELS.every((rel) => {
    const content = fs.existsSync(path.join(toolRoot, rel))
      ? readText(toolRoot, rel)
      : "";
    return content.includes("ModuleDisabledWriteActionsSection");
  });

  const prototypeWired = (() => {
    const rel = "templates/admin-cms/prototypes/musician-basic-admin-prototype.astro";
    const content = fs.existsSync(path.join(toolRoot, rel))
      ? readText(toolRoot, rel)
      : "";
    return content.includes("AdminStagingDisabledWriteActionsSection");
  })();

  const uiOnlyDoc =
    docContent.includes("G-6-c is a UI scaffold phase only") &&
    docContent.includes("No database write is implemented");

  const allActionsDisabled =
    config?.actions?.length > 0 &&
    config.actions.every((a) => a.enabled === false);

  const reporterPath = path.join(
    toolRoot,
    "scripts/lib/disabled-write-action-scaffold-reporter.mjs",
  );
  const cliPath = path.join(
    toolRoot,
    "scripts/report-disabled-write-action-scaffold.mjs",
  );
  const reporterScan = scanPlanningScriptForUnsafeCode(reporterPath);
  const cliScan = scanPlanningScriptForUnsafeCode(cliPath);

  const unsafeComponents = componentScans.filter((c) => !c.unsafe.clean);
  const badButtons = componentScans.filter((c) => !c.button.ok);

  const scaffoldComplete =
    docExists &&
    configExists &&
    g6bReport.readyForG6C &&
    componentsExist &&
    modulesWired &&
    prototypeWired &&
    missingSections.length === 0 &&
    uiOnlyDoc &&
    allActionsDisabled &&
    unsafeComponents.length === 0 &&
    badButtons.length === 0 &&
    reporterScan.clean &&
    cliScan.clean &&
    config.uiOnly === true &&
    config.canWrite === false &&
    config.writeOperationsEnabled === false &&
    config.writeAdapterImplemented === false &&
    config.dbWriteImplemented === false &&
    config.sqlExecuted === false &&
    config.rlsPolicyChanged === false;

  const blockers = [
    ...(!docExists ? ["missing-scaffold-doc"] : []),
    ...(!configExists ? ["missing-config-json"] : []),
    ...(!g6bReport.readyForG6C ? ["g6b-not-complete"] : []),
    ...(!componentsExist ? ["missing-components"] : []),
    ...(!modulesWired ? ["modules-not-wired"] : []),
    ...(!prototypeWired ? ["prototype-not-wired"] : []),
    ...missingSections.map((s) => `missing-section:${s.heading}`),
    ...(!uiOnlyDoc ? ["ui-only-doc-missing"] : []),
    ...(!allActionsDisabled ? ["actions-not-all-disabled"] : []),
    ...unsafeComponents.map((c) => `unsafe-component:${c.rel}`),
    ...badButtons.map((c) => `bad-button:${c.rel}:${c.button.reason}`),
    ...(!reporterScan.clean ? [`unsafe-reporter:${reporterScan.hits.join(",")}`] : []),
    ...(!cliScan.clean ? [`unsafe-cli:${cliScan.hits.join(",")}`] : []),
  ];

  return {
    mode: "dry-run",
    phase: "G-6-c",
    type: "disabled-write-action-scaffold",
    approvalId: config?.approvalId ?? "G-6-c-disabled-write-actions-scaffold",
    siteId,
    generatedAt: new Date().toISOString(),
    docRef: DOC_REL,
    configRef: CONFIG_REL,
    disabledActionComponentsCreated: componentsExist,
    moduleDisabledActionsVisible: modulesWired && prototypeWired,
    uiOnly: true,
    canWrite: false,
    writeOperationsEnabled: false,
    writeAdapterImplemented: false,
    dbWriteImplemented: false,
    sqlExecuted: false,
    rlsPolicyChanged: false,
    storageConnected: false,
    publishConnected: false,
    adminRouteConnected: false,
    productionDataTouched: false,
    readyForG6D: false,
    readyForG6DPlanning: scaffoldComplete,
    readyForG6Implementation: false,
    rlsWritePolicyReviewPlanReady: g6bReport.readyForG6C,
    recommendedNextPhase:
      config?.recommendedNextPhase ??
      "G-6-d staging profile update PoC planning / approval",
    actionCount: config?.actions?.length ?? 0,
    allActionsDisabled,
    componentScans: componentScans.map((c) => ({
      rel: c.rel,
      safe: c.unsafe.clean,
      disabledButton: c.button.ok,
    })),
    planDocSections: sectionChecks,
    blockers,
    scaffoldComplete,
  };
}

/**
 * @param {ReturnType<typeof runDisabledWriteActionScaffoldReport>} report
 */
export function formatDisabledWriteActionScaffoldMarkdown(report) {
  const lines = [
    "# Disabled Write Action Scaffold Report",
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
    `| disabledActionComponentsCreated | ${report.disabledActionComponentsCreated} |`,
    `| moduleDisabledActionsVisible | ${report.moduleDisabledActionsVisible} |`,
    `| uiOnly | ${report.uiOnly} |`,
    `| canWrite | ${report.canWrite} |`,
    `| writeOperationsEnabled | ${report.writeOperationsEnabled} |`,
    `| writeAdapterImplemented | ${report.writeAdapterImplemented} |`,
    `| dbWriteImplemented | ${report.dbWriteImplemented} |`,
    `| sqlExecuted | ${report.sqlExecuted} |`,
    `| rlsPolicyChanged | ${report.rlsPolicyChanged} |`,
    `| storageConnected | ${report.storageConnected} |`,
    `| publishConnected | ${report.publishConnected} |`,
    `| adminRouteConnected | ${report.adminRouteConnected} |`,
    `| productionDataTouched | ${report.productionDataTouched} |`,
    `| readyForG6D | ${report.readyForG6D} |`,
    `| readyForG6DPlanning | ${report.readyForG6DPlanning} |`,
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
    "*G-6-c: UI scaffold only. No SQL. No RLS changes. No writes.*",
  );

  return lines.join("\n");
}

/**
 * @param {string} outDir
 * @param {ReturnType<typeof runDisabledWriteActionScaffoldReport>} report
 */
export function writeDisabledWriteActionScaffoldOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "disabled-write-action-scaffold.json");
  const mdPath = path.join(outDir, "DISABLED_WRITE_ACTION_SCAFFOLD_REPORT.md");
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(mdPath, `${formatDisabledWriteActionScaffoldMarkdown(report)}\n`, "utf8");
  return { jsonPath, mdPath };
}
