/**
 * Read-only data adapter inspector (G-5z-b).
 * Read-only / output-only. No Supabase connection.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const PLAN_REL = "config/admin/read-only-data-integration-plan.json";

const STAGING_DATA_SRC_FILES = [
  "../../src/lib/admin/staging-data/read-only-data-adapter.types.ts",
  "../../src/lib/admin/staging-data/mock-read-only-data.fixtures.ts",
  "../../src/lib/admin/staging-data/mock-read-only-data-adapter.ts",
  "../../src/lib/admin/staging-data/read-only-data-config.ts",
  "../../src/lib/admin/staging-data/read-only-data-status.ts",
];

const UI_FILES = [
  "templates/admin-cms/data/components/AdminReadOnlyDataStatusPanel.astro",
  "templates/admin-cms/data/components/AdminStagingReadOnlyDataSection.astro",
];

const FORBIDDEN_PATTERNS = [
  /@supabase\/supabase-js/,
  /\.from\s*\(/,
  /\.select\s*\(/,
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
  for (const rel of STAGING_DATA_SRC_FILES) {
    const abs = path.resolve(toolRoot, rel);
    if (!fs.existsSync(abs)) continue;
    const content = fs.readFileSync(abs, "utf8");
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(content)) {
        hits.push({ file: path.relative(toolRoot, abs), match: pattern.source });
      }
    }
  }
  return hits;
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

  const scaffoldComplete =
    missingStaging.length === 0 &&
    uiChecks.every((f) => f.exists) &&
    forbiddenHits.length === 0 &&
    fixtureEmailScan.clean;

  const report = {
    mode: "dry-run",
    phase: "G-5z-b",
    siteId,
    generatedAt: new Date().toISOString(),
    provider: "mock",
    readOnlyOnly: true,
    canWrite: false,
    productionReady: false,
    supabaseDbQueryImplemented: false,
    fromSelectAdded: false,
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
      recommendedNextPhase: plan.recommendedNextPhase,
    },
    readyForG5zC: scaffoldComplete,
    blockers: [
      ...missingStaging.map((f) => `missing:${f.path}`),
      ...uiChecks.filter((f) => !f.exists).map((f) => `missing-ui:${f.path}`),
      ...(forbiddenHits.length > 0 ? ["forbidden-patterns-in-staging-data"] : []),
      ...(!fixtureEmailScan.clean ? ["fixture-real-email-or-url"] : []),
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
    `| supabaseDbQueryImplemented | ${report.supabaseDbQueryImplemented} |`,
    `| fromSelectAdded | ${report.fromSelectAdded} |`,
    `| dbQueryPerformed | ${report.dbQueryPerformed} |`,
    `| rlsPolicyChanged | ${report.rlsPolicyChanged} |`,
    `| storageReadImplemented | ${report.storageReadImplemented} |`,
    `| productionDataTouched | ${report.productionDataTouched} |`,
    `| adminRouteConnected | ${report.adminRouteConnected} |`,
    `| readyForG5zC | ${report.readyForG5zC} |`,
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
    "*G-5z-b: mock read-only adapter scaffold only. No Supabase DB query.*",
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
