/**
 * Admin Auth adapter dry-run runner (G-5y-b).
 * Read-only / output-only. No Supabase connection.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const PLAN_REL = "config/admin/admin-auth-integration-plan.json";
const PERMISSIONS_REL = "templates/admin-cms/auth/permissions.example.json";
const EXAMPLE_DRY_RUN_REL =
  "templates/admin-cms/auth/dry-run/auth-adapter-dry-run.example.json";

const SCAFFOLD_FILES = [
  "templates/admin-cms/auth/adapters/auth-adapter.types.ts",
  "templates/admin-cms/auth/adapters/mock-auth-adapter.ts",
  "templates/admin-cms/auth/adapters/permission-checker.ts",
  "templates/admin-cms/auth/adapters/role-checker.ts",
  "templates/admin-cms/auth/adapters/session-checker.ts",
  "templates/admin-cms/components/AdminAuthAdapterStatusPanel.astro",
];

const FORBIDDEN_PATTERNS = [
  /@supabase\/supabase-js/,
  /createClient\s*\(/,
  /service_role/i,
  /SERVICE_ROLE/,
  /workflow_dispatch/,
  /\blftp\b/,
  /\bftp\b/i,
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
function scanScaffoldForForbiddenImports(toolRoot) {
  /** @type {{ file: string; match: string }[]} */
  const hits = [];
  const scanDirs = [
    path.join(toolRoot, "templates/admin-cms/auth"),
  ];

  for (const dir of scanDirs) {
    if (!fs.existsSync(dir)) continue;
    walk(dir, (filePath) => {
      if (!/\.(ts|astro|mjs|js)$/.test(filePath)) return;
      const rel = path.relative(toolRoot, filePath);
      const content = fs.readFileSync(filePath, "utf8");
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(content)) {
          const isCommentOnly =
            pattern.source.includes("ftp") &&
            /not connected|No FTP|ftp deploy|FTP deploy/i.test(content);
          if (isCommentOnly) continue;
          hits.push({ file: rel, match: pattern.source });
        }
      }
    });
  }

  return hits;
}

/**
 * @param {string} dir
 * @param {(file: string) => void} onFile
 */
function walk(dir, onFile) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, onFile);
    else onFile(full);
  }
}

/**
 * @param {Record<string, unknown>} permissions
 */
function summarizePermissionMatrix(permissions) {
  if (!permissions?.modules || !Array.isArray(permissions.modules)) {
    return [];
  }
  return permissions.modules.map((mod) => {
    const m = /** @type {{ module?: string; permissions?: Record<string, string[]> }} */ (
      mod
    );
    return {
      module: m.module ?? "unknown",
      viewer: m.permissions?.viewer ?? [],
      editor: m.permissions?.editor ?? [],
      admin: m.permissions?.admin ?? [],
    };
  });
}

/**
 * @param {object} opts
 * @param {string} [opts.toolRoot]
 * @param {string} [opts.siteId]
 */
export function runAdminAuthAdapterDryRun(opts = {}) {
  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const siteId = opts.siteId ?? "default";

  const plan = readJson(toolRoot, PLAN_REL);
  const permissions = readJson(toolRoot, PERMISSIONS_REL);
  const example = readJson(toolRoot, EXAMPLE_DRY_RUN_REL);

  /** @type {{ path: string; exists: boolean }[]} */
  const scaffoldFileChecks = SCAFFOLD_FILES.map((rel) => ({
    path: rel,
    exists: fs.existsSync(path.join(toolRoot, rel)),
  }));

  const missingScaffold = scaffoldFileChecks.filter((f) => !f.exists);
  const forbiddenHits = scanScaffoldForForbiddenImports(toolRoot);

  const matrixSummary = summarizePermissionMatrix(permissions);

  const report = {
    mode: "dry-run",
    phase: "G-5y-b",
    siteId,
    generatedAt: new Date().toISOString(),
    provider: "mock",
    supabaseAuthConnected: false,
    supabaseClientImported: forbiddenHits.length > 0,
    adminUsersTableCreated: false,
    rlsPolicyChanged: false,
    dbQueryPerformed: false,
    dbUpdatePerformed: false,
    storageUploadPerformed: false,
    githubDispatchPerformed: false,
    ftpDeployPerformed: false,
    productionAuthTouched: false,
    connectedToRuntime: false,
    productionReady: false,
    mockSession: example.mockSession ?? {
      status: "mock",
      email: "mock-admin@example.com",
      role: "admin",
      provider: "mock",
      connectedToRuntime: false,
      productionReady: false,
    },
    integrationPlan: {
      phase: plan.phase,
      docRef: plan.docRef,
      recommendedInitialIdentity: plan.identitySourceOptions?.recommendedInitial,
      productionPublish: plan.productionPublish,
    },
    scaffoldFiles: scaffoldFileChecks,
    missingScaffoldFiles: missingScaffold.map((f) => f.path),
    forbiddenImportScan: {
      clean: forbiddenHits.length === 0,
      hits: forbiddenHits,
    },
    permissionMatrixSummary: matrixSummary,
    stagingShellRoute: plan.routes?.stagingShell ?? "/__admin-staging-shell/musician-basic/",
    readyForG5yC: missingScaffold.length === 0 && forbiddenHits.length === 0,
  };

  // supabaseClientImported should be false when clean
  report.supabaseClientImported = !report.forbiddenImportScan.clean;

  return report;
}

/**
 * @param {ReturnType<typeof runAdminAuthAdapterDryRun>} report
 */
export function formatAdminAuthAdapterDryRunMarkdown(report) {
  const lines = [
    "# Admin Auth Adapter Dry-Run Report",
    "",
    `**Phase:** ${report.phase}`,
    `**Site:** ${report.siteId}`,
    `**Generated:** ${report.generatedAt}`,
    "",
    "## Safety flags",
    "",
    "| Flag | Value |",
    "| --- | --- |",
    `| supabaseAuthConnected | ${report.supabaseAuthConnected} |`,
    `| supabaseClientImported | ${report.supabaseClientImported} |`,
    `| adminUsersTableCreated | ${report.adminUsersTableCreated} |`,
    `| rlsPolicyChanged | ${report.rlsPolicyChanged} |`,
    `| connectedToRuntime | ${report.connectedToRuntime} |`,
    `| productionReady | ${report.productionReady} |`,
    `| productionAuthTouched | ${report.productionAuthTouched} |`,
    "",
    "## Mock session",
    "",
    "```json",
    JSON.stringify(report.mockSession, null, 2),
    "```",
    "",
    "## Scaffold files",
    "",
    ...report.scaffoldFiles.map((f) => `- [${f.exists ? "x" : " "}] \`${f.path}\``),
    "",
  ];

  if (report.missingScaffoldFiles.length > 0) {
    lines.push("**Missing:**", ...report.missingScaffoldFiles.map((p) => `- ${p}`), "");
  }

  lines.push(
    "## Forbidden import scan",
    "",
    report.forbiddenImportScan.clean
      ? "Clean — no Supabase client / service role / workflow / ftp patterns in auth scaffold."
      : `**Hits:** ${JSON.stringify(report.forbiddenImportScan.hits, null, 2)}`,
    "",
    "## Permission matrix summary",
    "",
    "| Module | viewer | editor | admin |",
    "| --- | --- | --- | --- |",
    ...report.permissionMatrixSummary.map(
      (row) =>
        `| ${row.module} | ${row.viewer.join(", ") || "—"} | ${row.editor.join(", ") || "—"} | ${row.admin.join(", ") || "—"} |`,
    ),
    "",
    "## Integration plan",
    "",
    `- Doc: \`${report.integrationPlan.docRef}\``,
    `- Identity (initial): ${report.integrationPlan.recommendedInitialIdentity}`,
    `- productionPublish.enabledByDefault: ${report.integrationPlan.productionPublish?.enabledByDefault}`,
    `- Staging shell route: \`${report.stagingShellRoute}\``,
    "",
    `**readyForG5yC:** ${report.readyForG5yC}`,
    "",
    "*G-5y-b dry-run only. No Supabase Auth connection.*",
  );

  return lines.join("\n");
}

/**
 * @param {string} outDir
 * @param {ReturnType<typeof runAdminAuthAdapterDryRun>} report
 */
export function writeAdminAuthAdapterDryRunOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "admin-auth-adapter-dry-run.json");
  const mdPath = path.join(outDir, "ADMIN_AUTH_ADAPTER_DRY_RUN_REPORT.md");
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(mdPath, `${formatAdminAuthAdapterDryRunMarkdown(report)}\n`, "utf8");
  return { jsonPath, mdPath };
}
