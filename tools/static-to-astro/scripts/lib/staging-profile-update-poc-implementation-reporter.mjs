/**
 * G-6-d — Staging profile update PoC implementation reporter (scan only).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runStagingProfileUpdatePocApprovalPlanReport } from "./staging-profile-update-poc-approval-plan-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
const REPO_ROOT = path.resolve(DEFAULT_TOOL_ROOT, "../..");

const DOC_REL = "docs/staging-profile-update-poc-implementation.md";
const CONFIG_REL = "config/admin/staging-profile-update-poc-implementation.json";
const APPROVAL_ID = "G-6-d-staging-profile-update-poc";

const REQUIRED_DOC_SECTIONS = [
  "## 1. Purpose",
  "## 2. Approval",
  "## 3. Scope",
  "## 4. Environment gates",
  "## 5. Dry-run behavior",
  "## 6. Non-dry-run behavior",
  "## 7. Rollback",
  "## 8. RLS expectations",
  "## 9. Test scenarios",
  "## 10. Final safety statement",
];

const STAGING_WRITE_FILES = [
  "src/lib/admin/staging-write/staging-write-config.ts",
  "src/lib/admin/staging-write/profile-update-poc-adapter.ts",
  "src/lib/admin/staging-write/staging-profile-update-ui.ts",
];

const FORBIDDEN_PATTERNS = [
  /\.insert\s*\(/,
  /\.upsert\s*\(/,
  /\.delete\s*\(/,
  /\.rpc\s*\(/,
  /service_role/i,
  /SERVICE_ROLE/,
  /storage\./,
  /workflow_dispatch/,
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
function scanFileForForbidden(filePath) {
  if (!fs.existsSync(filePath)) return { clean: false, hits: ["missing"] };
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  /** @type {string[]} */
  const hits = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(line)) hits.push(pattern.source);
    }
  }
  return { clean: hits.length === 0, hits: [...new Set(hits)] };
}

/**
 * @param {string} filePath
 */
function scanUpdateUsage(filePath) {
  if (!fs.existsSync(filePath)) return { ok: false, hits: [] };
  const content = fs.readFileSync(filePath, "utf8");
  const updateMatches = content.match(/\.update\s*\(/g) ?? [];
  const profileTableOnly =
    content.includes('PROFILE_POC_TABLE = "profile"') &&
    !/\.from\s*\(\s*["'](?!profile)[^"']+["']/.test(content);
  const hasEq = /\.eq\s*\(/.test(content);
  const noInsertDelete =
    !/\.insert\s*\(/.test(content) && !/\.delete\s*\(/.test(content);
  return {
    ok:
      updateMatches.length === 1 &&
      profileTableOnly &&
      hasEq &&
      noInsertDelete,
    updateCount: updateMatches.length,
    profileTableOnly,
    hasEq,
    noInsertDelete,
  };
}

/**
 * @param {object} opts
 * @param {string} [opts.toolRoot]
 * @param {string} [opts.siteId]
 */
export function runStagingProfileUpdatePocImplementationReport(opts = {}) {
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

  const g6dPrepReport = runStagingProfileUpdatePocApprovalPlanReport({
    toolRoot,
    siteId,
  });

  const stagingWriteExists = STAGING_WRITE_FILES.every((rel) =>
    fs.existsSync(path.join(REPO_ROOT, rel)),
  );

  const forbiddenScans = STAGING_WRITE_FILES.map((rel) => ({
    rel,
    scan: scanFileForForbidden(path.join(REPO_ROOT, rel)),
  }));

  const adapterPath = path.join(
    REPO_ROOT,
    "src/lib/admin/staging-write/profile-update-poc-adapter.ts",
  );
  const updateScan = scanUpdateUsage(adapterPath);

  const profileUiWired = (() => {
    const rel = "templates/admin-cms/modules/ProfileAdminUi.astro";
    const content = readText(toolRoot, rel);
    return (
      content.includes("stagingWritePoc") &&
      content.includes("profile-update-poc-save-btn") &&
      content.includes("staging-profile-update-ui.ts")
    );
  })();

  const prototypeWired = (() => {
    const rel = "templates/admin-cms/prototypes/musician-basic-admin-prototype.astro";
    const content = readText(toolRoot, rel);
    return content.includes("AdminStagingProfileUpdatePocSection");
  })();

  const envExamplePath = path.join(REPO_ROOT, ".env.example");
  const envExample =
    fs.existsSync(envExamplePath) ? fs.readFileSync(envExamplePath, "utf8") : "";
  const envGatesDocumented =
    envExample.includes("ENABLE_ADMIN_STAGING_WRITE=false") &&
    envExample.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=true");

  const implementationComplete =
    docExists &&
    configExists &&
    g6dPrepReport.planComplete &&
    stagingWriteExists &&
    missingSections.length === 0 &&
    forbiddenScans.every((f) => f.scan.clean) &&
    updateScan.ok &&
    profileUiWired &&
    prototypeWired &&
    envGatesDocumented &&
    config.approvalId === APPROVAL_ID &&
    config.enabledByDefault === false &&
    config.dryRunDefault === true &&
    config.writeAdapterImplemented === true &&
    config.canWriteDefault === false &&
    config.sqlExecuted === false &&
    config.rlsPolicyChanged === false;

  const blockers = [
    ...(!docExists ? ["missing-implementation-doc"] : []),
    ...(!configExists ? ["missing-config-json"] : []),
    ...(!g6dPrepReport.planComplete ? ["g6d-prep-not-complete"] : []),
    ...(!stagingWriteExists ? ["missing-staging-write-files"] : []),
    ...missingSections.map((s) => `missing-section:${s.heading}`),
    ...forbiddenScans
      .filter((f) => !f.scan.clean)
      .map((f) => `forbidden-in:${f.rel}`),
    ...(!updateScan.ok ? ["profile-update-adapter-invalid"] : []),
    ...(!profileUiWired ? ["profile-ui-not-wired"] : []),
    ...(!prototypeWired ? ["prototype-not-wired"] : []),
    ...(!envGatesDocumented ? ["env-example-missing-gates"] : []),
  ];

  return {
    mode: "dry-run",
    phase: "G-6-d",
    type: "staging-profile-update-poc-implementation",
    approvalId: config?.approvalId ?? APPROVAL_ID,
    siteId,
    generatedAt: new Date().toISOString(),
    docRef: DOC_REL,
    configRef: CONFIG_REL,
    stagingProfileUpdatePocImplementationCreated: implementationComplete,
    enabledByDefault: config?.enabledByDefault ?? false,
    dryRunDefault: config?.dryRunDefault ?? true,
    targetModule: config?.targetModule ?? "profile",
    targetOperation: config?.targetOperation ?? "update",
    targetScope: config?.targetScope ?? "single-existing-row",
    targetFields: "text-only",
    stagingOnly: true,
    canWriteDefault: config?.canWriteDefault ?? false,
    writeOperationsEnabledDefault: config?.writeOperationsEnabledDefault ?? false,
    writeAdapterImplemented: config?.writeAdapterImplemented ?? true,
    dbWriteImplemented: config?.dbWriteImplemented ?? "gated-staging-only",
    saveButtonEnabledDefault: config?.saveButtonEnabledDefault ?? false,
    sqlExecuted: false,
    rlsPolicyChanged: false,
    storageConnected: false,
    publishConnected: false,
    adminRouteConnected: false,
    productionDataTouched: false,
    readyForG6E: false,
    readyForG6ImplementationExpansion: false,
    g6dPrepApprovalPlanReady: g6dPrepReport.planComplete,
    recommendedNextPhase:
      config?.recommendedNextPhase ??
      "G-6-e staging create operation planning (not automatic)",
    updateScan,
    forbiddenScans: forbiddenScans.map((f) => ({
      rel: f.rel,
      clean: f.scan.clean,
    })),
    planDocSections: sectionChecks,
    blockers,
    implementationComplete,
  };
}

/**
 * @param {ReturnType<typeof runStagingProfileUpdatePocImplementationReport>} report
 */
export function formatStagingProfileUpdatePocImplementationMarkdown(report) {
  const lines = [
    "# Staging Profile Update PoC Implementation Report",
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
    `| enabledByDefault | ${report.enabledByDefault} |`,
    `| dryRunDefault | ${report.dryRunDefault} |`,
    `| targetModule | ${report.targetModule} |`,
    `| targetOperation | ${report.targetOperation} |`,
    `| canWriteDefault | ${report.canWriteDefault} |`,
    `| writeAdapterImplemented | ${report.writeAdapterImplemented} |`,
    `| dbWriteImplemented | ${report.dbWriteImplemented} |`,
    `| sqlExecuted | ${report.sqlExecuted} |`,
    `| rlsPolicyChanged | ${report.rlsPolicyChanged} |`,
    `| readyForG6E | ${report.readyForG6E} |`,
    "",
    "## Next phase",
    "",
    report.recommendedNextPhase,
    "",
  ];

  if (report.blockers.length > 0) {
    lines.push("## Blockers", "", ...report.blockers.map((b) => `- ${b}`), "");
  }

  lines.push("*G-6-d: gated staging profile update PoC only.*");

  return lines.join("\n");
}

/**
 * @param {string} outDir
 * @param {ReturnType<typeof runStagingProfileUpdatePocImplementationReport>} report
 */
export function writeStagingProfileUpdatePocImplementationOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "staging-profile-update-poc-implementation.json");
  const mdPath = path.join(outDir, "STAGING_PROFILE_UPDATE_POC_IMPLEMENTATION_REPORT.md");
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(mdPath, `${formatStagingProfileUpdatePocImplementationMarkdown(report)}\n`, "utf8");
  return { jsonPath, mdPath };
}
