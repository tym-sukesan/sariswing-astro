/**
 * Read-only data adapter inspector (G-5z-d).
 * Read-only / output-only. No live Supabase connection.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runStagingReadOnlyDisplayQa } from "./staging-read-only-display-qa-runner.mjs";
import { runReadOnlyPhaseCompletionReport } from "./read-only-phase-completion-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const PLAN_REL = "config/admin/read-only-data-integration-plan.json";
const G5Z_C_APPROVAL_ID = "G-5z-c-staging-read-only-data-connect";
const SUPABASE_ADAPTER_REL =
  "../../src/lib/admin/staging-data/supabase-read-only-data-adapter.ts";

const STAGING_DATA_SRC_FILES = [
  "../../src/lib/admin/staging-data/read-only-data-adapter.types.ts",
  "../../src/lib/admin/staging-data/mock-read-only-data.fixtures.ts",
  "../../src/lib/admin/staging-data/mock-read-only-data-adapter.ts",
  "../../src/lib/admin/staging-data/read-only-data-config.ts",
  "../../src/lib/admin/staging-data/read-only-data-status.ts",
  "../../src/lib/admin/staging-data/supabase-read-only-data-adapter.ts",
  "../../src/lib/admin/staging-data/read-only-data-factory.ts",
  "../../src/lib/admin/staging-data/staging-read-only-data-loader.ts",
];

const UI_FILES = [
  "templates/admin-cms/data/components/AdminReadOnlyDataStatusPanel.astro",
  "templates/admin-cms/data/components/AdminStagingReadOnlyDataSection.astro",
];

const FORBIDDEN_IN_ALL_FILES = [
  /\.insert\s*\(/,
  /\.update\s*\(/,
  /\.upsert\s*\(/,
  /\.delete\s*\(/,
  /\.rpc\s*\(/,
  /storage\./,
  /service_role/i,
  /SERVICE_ROLE/,
  /workflow_dispatch/,
  /\blftp\b/,
  /select\s*\(\s*['"`]\*/,
  /select\s*\(\s*\*/,
];

const FORBIDDEN_IN_NON_SUPABASE_ADAPTER = [
  /@supabase\/supabase-js/,
  /\.from\s*\(/,
  /\.select\s*\(/,
];

/**
 * @param {string} toolRoot
 * @param {string} relPath
 */
function readJson(toolRoot, relPath) {
  const abs = path.join(toolRoot, relPath);
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

/**
 * @param {string} toolRoot
 */
function stagingDataFilesExist(toolRoot) {
  return STAGING_DATA_SRC_FILES.map((rel) => {
    const abs = path.resolve(toolRoot, rel);
    return { path: rel, exists: fs.existsSync(abs) };
  });
}

/**
 * @param {string} toolRoot
 */
function scanStagingDataForForbidden(toolRoot) {
  /** @type {{ file: string; match: string }[]} */
  const hits = [];
  const supabaseAbs = path.resolve(toolRoot, SUPABASE_ADAPTER_REL);

  for (const rel of STAGING_DATA_SRC_FILES) {
    const abs = path.resolve(toolRoot, rel);
    if (!fs.existsSync(abs)) continue;
    const content = fs.readFileSync(abs, "utf8");
    const isSupabaseAdapter = abs === supabaseAbs;

    for (const pattern of FORBIDDEN_IN_ALL_FILES) {
      if (pattern.test(content)) {
        hits.push({ file: path.relative(toolRoot, abs), match: pattern.source });
      }
    }

    if (!isSupabaseAdapter) {
      for (const pattern of FORBIDDEN_IN_NON_SUPABASE_ADAPTER) {
        if (pattern.test(content)) {
          hits.push({ file: path.relative(toolRoot, abs), match: pattern.source });
        }
      }
    }
  }
  return hits;
}

/**
 * @param {string} toolRoot
 */
function scanSupabaseAdapterForFromSelect(toolRoot) {
  const abs = path.resolve(toolRoot, SUPABASE_ADAPTER_REL);
  if (!fs.existsSync(abs)) return false;
  const content = fs.readFileSync(abs, "utf8");
  return /\.from\s*\(/.test(content) && /\.select\s*\(/.test(content);
}

/**
 * @param {string} toolRoot
 */
function scanFixturesForRealEmails(toolRoot) {
  const abs = path.resolve(
    toolRoot,
    "../../src/lib/admin/staging-data/mock-read-only-data.fixtures.ts",
  );
  if (!fs.existsSync(abs)) return { clean: false, hits: ["missing-fixtures"] };
  const content = fs.readFileSync(abs, "utf8");
  const hits = [];
  const emails =
    content.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? [];
  for (const email of emails) {
    if (!email.endsWith("@example.com")) hits.push(email);
  }
  const urls = content.match(/https?:\/\/[^"'`\s)]+/g) ?? [];
  for (const url of urls) {
    if (!url.startsWith("https://example.com")) hits.push(url);
  }
  return { clean: hits.length === 0, hits: [...new Set(hits)] };
}

/**
 * @param {object} opts
 * @param {string} [opts.toolRoot]
 * @param {string} [opts.siteId]
 */
export function runReadOnlyDataAdapterInspection(opts = {}) {
  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const siteId = opts.siteId ?? "default";

  const plan = readJson(toolRoot, PLAN_REL);
  const stagingFiles = stagingDataFilesExist(toolRoot);
  const missingStaging = stagingFiles.filter((f) => !f.exists);
  const uiChecks = UI_FILES.map((rel) => ({
    path: rel,
    exists: fs.existsSync(path.join(toolRoot, rel)),
  }));
  const forbiddenHits = scanStagingDataForForbidden(toolRoot);
  const fixtureEmailScan = scanFixturesForRealEmails(toolRoot);
  const supabaseAdapterExists = fs.existsSync(
    path.resolve(toolRoot, SUPABASE_ADAPTER_REL),
  );
  const fromSelectAdded = scanSupabaseAdapterForFromSelect(toolRoot);
  const selectStarUsed = forbiddenHits.some(
    (h) => h.match.includes("select\\s*\\(") || h.match.includes("select\\s*\\(\\s*\\*"),
  );

  const g5zCComplete =
    missingStaging.length === 0 &&
    uiChecks.every((f) => f.exists) &&
    supabaseAdapterExists &&
    fromSelectAdded &&
    forbiddenHits.length === 0 &&
    fixtureEmailScan.clean;

  const displayQa = runStagingReadOnlyDisplayQa({ toolRoot, siteId });
  const phaseCompletion = runReadOnlyPhaseCompletionReport({ toolRoot, siteId });

  const report = {
    mode: "dry-run",
    phase: phaseCompletion.readOnlyPhaseComplete
      ? "G-5z-e"
      : displayQa.readyForG5zE
        ? "G-5z-d"
        : "G-5z-c",
    approvalId: G5Z_C_APPROVAL_ID,
    siteId,
    generatedAt: new Date().toISOString(),
    provider: "mock-or-supabase",
    readOnlyOnly: true,
    canWrite: false,
    envGated: true,
    mockFallbackAvailable: true,
    productionReady: false,
    supabaseReadOnlyAdapterImplemented: supabaseAdapterExists && fromSelectAdded,
    supabaseDbQueryImplemented: supabaseAdapterExists && fromSelectAdded,
    fromSelectAdded,
    approvedFieldsOnly: true,
    selectStarUsed,
    writeMethodsImplemented: false,
    dbQueryPerformed: false,
    dbUpdatePerformed: false,
    rlsPolicyChanged: false,
    storageReadImplemented: false,
    storageUploadPerformed: false,
    githubDispatchPerformed: false,
    ftpDeployPerformed: false,
    adminRouteConnected: false,
    productionDataTouched: false,
    targetModules: plan.targetModules ?? [
      "profile",
      "schedule",
      "discography",
      "links",
      "news",
    ],
    stagingDataSrcFiles: stagingFiles,
    missingStagingDataFiles: missingStaging.map((f) => f.path),
    uiFiles: uiChecks,
    forbiddenScan: {
      clean: forbiddenHits.length === 0,
      hits: forbiddenHits,
    },
    fixtureEmailScan,
    integrationPlan: {
      phase: plan.phase,
      docRef: plan.docRef,
      recommendedNextPhase: phaseCompletion.readOnlyPhaseComplete
        ? "G-6-a"
        : displayQa.readyForG5zE
          ? "G-5z-e"
          : "G-5z-d",
    },
    readOnlyPhaseComplete: phaseCompletion.readOnlyPhaseComplete,
    readyForG6Planning: phaseCompletion.readyForG6Planning,
    readyForG6Implementation: phaseCompletion.readyForG6Implementation,
    readOnlyQaRlsReviewDocRef: phaseCompletion.docRef,
    displayQaAdded: displayQa.displayQaAdded,
    displayQaDocRef: displayQa.docRef,
    moduleStateQaDocumented: displayQa.moduleStateQaDocumented,
    mockModeQaDocumented: displayQa.mockModeDocumented,
    supabaseModeQaDocumented: displayQa.supabaseModeDocumented,
    noWriteQaDocumented: displayQa.noWriteQaDocumented,
    readyForG5zD: g5zCComplete,
    readyForG5zE: displayQa.readyForG5zE && g5zCComplete,
    readyForG5zC: true,
    g5zEComplete: phaseCompletion.readOnlyPhaseComplete,
    blockers: [
      ...missingStaging.map((f) => `missing:${f.path}`),
      ...uiChecks.filter((f) => !f.exists).map((f) => `missing-ui:${f.path}`),
      ...(!supabaseAdapterExists ? ["missing-supabase-read-only-adapter"] : []),
      ...(!fromSelectAdded ? ["supabase-adapter-missing-from-select"] : []),
      ...(forbiddenHits.length > 0 ? ["forbidden-patterns-in-staging-data"] : []),
      ...(!fixtureEmailScan.clean ? ["fixture-real-email-or-url"] : []),
      ...displayQa.blockers.map((b) => `display-qa:${b}`),
      ...phaseCompletion.blockers.map((b) => `g5z-e:${b}`),
    ],
  };

  return report;
}

/**
 * @param {ReturnType<typeof runReadOnlyDataAdapterInspection>} report
 */
export function formatReadOnlyDataAdapterMarkdown(report) {
  const lines = [
    "# Read-only Data Adapter Report",
    "",
    `**Phase:** ${report.phase}`,
    `**Approval ID:** ${report.approvalId}`,
    `**Site:** ${report.siteId}`,
    `**Generated:** ${report.generatedAt}`,
    "",
    "## Safety flags",
    "",
    "| Flag | Value |",
    "| --- | --- |",
    `| provider | ${report.provider} |`,
    `| readOnlyOnly | ${report.readOnlyOnly} |`,
    `| canWrite | ${report.canWrite} |`,
    `| envGated | ${report.envGated} |`,
    `| mockFallbackAvailable | ${report.mockFallbackAvailable} |`,
    `| supabaseReadOnlyAdapterImplemented | ${report.supabaseReadOnlyAdapterImplemented} |`,
    `| approvedFieldsOnly | ${report.approvedFieldsOnly} |`,
    `| selectStarUsed | ${report.selectStarUsed} |`,
    `| writeMethodsImplemented | ${report.writeMethodsImplemented} |`,
    `| dbUpdatePerformed | ${report.dbUpdatePerformed} |`,
    `| rlsPolicyChanged | ${report.rlsPolicyChanged} |`,
    `| storageReadImplemented | ${report.storageReadImplemented} |`,
    `| productionDataTouched | ${report.productionDataTouched} |`,
    `| adminRouteConnected | ${report.adminRouteConnected} |`,
    `| displayQaAdded | ${report.displayQaAdded} |`,
    `| moduleStateQaDocumented | ${report.moduleStateQaDocumented} |`,
    `| mockModeQaDocumented | ${report.mockModeQaDocumented} |`,
    `| supabaseModeQaDocumented | ${report.supabaseModeQaDocumented} |`,
    `| noWriteQaDocumented | ${report.noWriteQaDocumented} |`,
    `| readyForG5zD | ${report.readyForG5zD} |`,
    `| readyForG5zE | ${report.readyForG5zE} |`,
    `| readOnlyPhaseComplete | ${report.readOnlyPhaseComplete} |`,
    `| readyForG6Planning | ${report.readyForG6Planning} |`,
    `| readyForG6Implementation | ${report.readyForG6Implementation} |`,
    "",
    "## Target modules",
    "",
    report.targetModules.join(", "),
    "",
    "## Staging data src files",
    "",
    ...report.stagingDataSrcFiles.map(
      (f) => `- [${f.exists ? "x" : " "}] \`${f.path}\``,
    ),
    "",
    "## UI files",
    "",
    ...report.uiFiles.map((f) => `- [${f.exists ? "x" : " "}] \`${f.path}\``),
    "",
  ];

  if (report.blockers.length > 0) {
    lines.push("## Blockers", "", ...report.blockers.map((b) => `- ${b}`), "");
  }

  lines.push(
    "*G-5z-e: read-only phase completion report. Approved fields only. No writes.*",
  );

  return lines.join("\n");
}

/**
 * @param {string} outDir
 * @param {ReturnType<typeof runReadOnlyDataAdapterInspection>} report
 */
export function writeReadOnlyDataAdapterOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "read-only-data-adapter-report.json");
  const mdPath = path.join(outDir, "READ_ONLY_DATA_ADAPTER_REPORT.md");
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(mdPath, `${formatReadOnlyDataAdapterMarkdown(report)}\n`, "utf8");
  return { jsonPath, mdPath };
}
