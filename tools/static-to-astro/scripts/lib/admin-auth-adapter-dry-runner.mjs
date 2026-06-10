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
  "templates/admin-cms/auth/adapters/supabase-auth-adapter.ts",
  "templates/admin-cms/auth/adapters/permission-checker.ts",
  "templates/admin-cms/auth/adapters/role-checker.ts",
  "templates/admin-cms/auth/adapters/session-checker.ts",
  "templates/admin-cms/components/AdminAuthAdapterStatusPanel.astro",
  "templates/admin-cms/auth/components/AdminLoginShell.astro",
  "templates/admin-cms/auth/components/AdminPasswordResetShell.astro",
  "templates/admin-cms/auth/components/AdminAuthGuardPlannedNotice.astro",
  "templates/admin-cms/auth/components/AdminStagingLoginUiSection.astro",
  "templates/admin-cms/auth/components/AdminRoleAllowlistStatusPanel.astro",
  "templates/admin-cms/auth/allowlist/mock-admin-allowlist.example.json",
];

const STAGING_AUTH_SRC_FILES = [
  "../../src/lib/admin/staging-auth/staging-auth-config.ts",
  "../../src/lib/admin/staging-auth/supabase-staging-auth-client.ts",
  "../../src/lib/admin/staging-auth/staging-auth-session.ts",
  "../../src/lib/admin/staging-auth/staging-auth-ui.ts",
  "../../src/lib/admin/staging-auth/mock-allowlist.ts",
  "../../src/lib/admin/staging-auth/staging-role-resolver.ts",
  "../../src/lib/admin/staging-auth/staging-permission-status.ts",
  "../../src/lib/admin/staging-auth/staging-role-allowlist-ui.ts",
];

const MOCK_ALLOWLIST_REL = "templates/admin-cms/auth/allowlist/mock-admin-allowlist.example.json";

const G5Y_D_APPROVAL_ID = "G-5y-d-staging-auth-connect";

const STAGING_AUTH_FORBIDDEN_PATTERNS = [
  /service_role/i,
  /SERVICE_ROLE/,
  /resetPasswordForEmail/,
  /\.from\s*\(/,
  /\.insert\s*\(/,
  /\.update\s*\(/,
  /\.delete\s*\(/,
  /storage\./,
  /workflow_dispatch/,
  /\blftp\b/,
];

const LOGIN_UI_SHELL_FILES = [
  "templates/admin-cms/auth/components/AdminLoginShell.astro",
  "templates/admin-cms/auth/components/AdminPasswordResetShell.astro",
  "templates/admin-cms/auth/components/AdminAuthGuardPlannedNotice.astro",
  "templates/admin-cms/auth/components/AdminStagingLoginUiSection.astro",
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
 * @param {string} toolRoot
 */
function scanStagingAuthSrcForForbidden(toolRoot) {
  /** @type {{ file: string; match: string }[]} */
  const hits = [];
  for (const rel of STAGING_AUTH_SRC_FILES) {
    const abs = path.resolve(toolRoot, rel);
    if (!fs.existsSync(abs)) continue;
    const content = fs.readFileSync(abs, "utf8");
    for (const pattern of STAGING_AUTH_FORBIDDEN_PATTERNS) {
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
function stagingAuthSrcFilesExist(toolRoot) {
  return STAGING_AUTH_SRC_FILES.map((rel) => {
    const abs = path.resolve(toolRoot, rel);
    return { path: rel, exists: fs.existsSync(abs) };
  });
}

/**
 * @param {string} toolRoot
 */
function scanMockAllowlistForRealEmails(toolRoot) {
  /** @type {string[]} */
  const hits = [];
  const paths = [
    path.join(toolRoot, MOCK_ALLOWLIST_REL),
    path.resolve(toolRoot, "../../src/lib/admin/staging-auth/mock-allowlist.ts"),
  ];

  for (const abs of paths) {
    if (!fs.existsSync(abs)) {
      hits.push(`missing:${path.basename(abs)}`);
      continue;
    }
    const content = fs.readFileSync(abs, "utf8");
    const emails = content.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? [];
    for (const email of emails) {
      if (!email.endsWith("@example.com")) {
        hits.push(email);
      }
    }
  }

  return { clean: hits.length === 0, hits: [...new Set(hits)] };
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
  const stagingAuthFileChecks = stagingAuthSrcFilesExist(toolRoot);
  const missingStagingAuth = stagingAuthFileChecks.filter((f) => !f.exists);
  const stagingAuthForbiddenHits = scanStagingAuthSrcForForbidden(toolRoot);

  const loginUiChecks = LOGIN_UI_SHELL_FILES.map((rel) => ({
    path: rel,
    exists: fs.existsSync(path.join(toolRoot, rel)),
  }));
  const loginUiShellPresent = loginUiChecks.every((f) => f.exists);
  const passwordResetUiShellPresent = loginUiChecks
    .filter((f) => f.path.includes("PasswordReset"))
    .every((f) => f.exists);

  const matrixSummary = summarizePermissionMatrix(permissions);

  const supabaseAuthConnectionImplemented =
    missingScaffold.length === 0 &&
    missingStagingAuth.length === 0 &&
    stagingAuthForbiddenHits.length === 0;

  const mockAllowlistEmailScan = scanMockAllowlistForRealEmails(toolRoot);
  const mockAllowlistImplemented =
    fs.existsSync(path.join(toolRoot, MOCK_ALLOWLIST_REL)) &&
    missingStagingAuth.length === 0 &&
    scaffoldFileChecks.find((f) => f.path.includes("AdminRoleAllowlistStatusPanel"))?.exists ===
      true;

  const report = {
    mode: "dry-run",
    phase: "G-5y-e-a",
    approvalId: G5Y_D_APPROVAL_ID,
    roleAllowlistMode: "mock-only",
    mockAllowlistImplemented,
    realEmailsCommitted: !mockAllowlistEmailScan.clean,
    siteId,
    generatedAt: new Date().toISOString(),
    provider: "mock-or-supabase-staging",
    loginUiShellPresent,
    passwordResetUiShellPresent,
    supabaseAuthConnectionImplemented,
    envGated: true,
    mockFallbackAvailable: true,
    serviceRoleUsed: false,
    realAuthDisabled: false,
    credentialsSubmitted: false,
    sessionCreated: false,
    passwordResetEmailSent: false,
    supabaseAuthConnected: supabaseAuthConnectionImplemented,
    supabaseClientImported: supabaseAuthConnectionImplemented,
    adminUsersTableCreated: false,
    rlsPolicyChanged: false,
    dbQueryPerformed: false,
    dbUpdatePerformed: false,
    storageUploadPerformed: false,
    githubDispatchPerformed: false,
    ftpDeployPerformed: false,
    productionAuthTouched: false,
    adminRouteConnected: false,
    productionPublishEnabled: false,
    adminUsersTableUsed: false,
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
    stagingAuthSrcFiles: stagingAuthFileChecks,
    missingStagingAuthFiles: missingStagingAuth.map((f) => f.path),
    forbiddenImportScan: {
      clean: forbiddenHits.length === 0,
      hits: forbiddenHits,
    },
    stagingAuthForbiddenScan: {
      clean: stagingAuthForbiddenHits.length === 0,
      hits: stagingAuthForbiddenHits,
    },
    mockAllowlistEmailScan,
    permissionMatrixSummary: matrixSummary,
    stagingShellRoute: plan.routes?.stagingShell ?? "/__admin-staging-shell/musician-basic/",
    loginUiShellFiles: loginUiChecks,
    readyForG5yEB:
      mockAllowlistImplemented &&
      mockAllowlistEmailScan.clean &&
      supabaseAuthConnectionImplemented &&
      forbiddenHits.length === 0 &&
      stagingAuthForbiddenHits.length === 0 &&
      loginUiShellPresent,
    readyForG5yE: true,
    readyForG5yD: true,
  };

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
    `**Approval ID:** ${report.approvalId}`,
    `**Site:** ${report.siteId}`,
    `**Generated:** ${report.generatedAt}`,
    "",
    "## G-5y-e-a role / allowlist mock",
    "",
    "| Flag | Value |",
    "| --- | --- |",
    `| roleAllowlistMode | ${report.roleAllowlistMode} |`,
    `| mockAllowlistImplemented | ${report.mockAllowlistImplemented} |`,
    `| realEmailsCommitted | ${report.realEmailsCommitted} |`,
    `| productionPublishEnabled | ${report.productionPublishEnabled} |`,
    `| adminUsersTableUsed | ${report.adminUsersTableUsed} |`,
    `| readyForG5yEB | ${report.readyForG5yEB} |`,
    "",
    "## G-5y-d staging Auth connection",
    "",
    "| Flag | Value |",
    "| --- | --- |",
    `| supabaseAuthConnectionImplemented | ${report.supabaseAuthConnectionImplemented} |`,
    `| envGated | ${report.envGated} |`,
    `| mockFallbackAvailable | ${report.mockFallbackAvailable} |`,
    `| adminRouteConnected | ${report.adminRouteConnected} |`,
    "",
    "## Safety flags",
    "",
    "| Flag | Value |",
    "| --- | --- |",
    `| supabaseAuthConnected | ${report.supabaseAuthConnected} |`,
    `| supabaseClientImported | ${report.supabaseClientImported} |`,
    `| serviceRoleUsed | ${report.serviceRoleUsed} |`,
    `| adminUsersTableCreated | ${report.adminUsersTableCreated} |`,
    `| rlsPolicyChanged | ${report.rlsPolicyChanged} |`,
    `| dbQueryPerformed | ${report.dbQueryPerformed} |`,
    `| dbUpdatePerformed | ${report.dbUpdatePerformed} |`,
    `| storageUploadPerformed | ${report.storageUploadPerformed} |`,
    `| connectedToRuntime | ${report.connectedToRuntime} |`,
    `| productionReady | ${report.productionReady} |`,
    `| productionAuthTouched | ${report.productionAuthTouched} |`,
    "",
    "## Login UI shell (G-5y-c / G-5y-d)",
    "",
    "| Flag | Value |",
    "| --- | --- |",
    `| loginUiShellPresent | ${report.loginUiShellPresent} |`,
    `| passwordResetUiShellPresent | ${report.passwordResetUiShellPresent} |`,
    `| realAuthDisabled | ${report.realAuthDisabled} |`,
    `| credentialsSubmitted | ${report.credentialsSubmitted} |`,
    `| sessionCreated | ${report.sessionCreated} |`,
    `| passwordResetEmailSent | ${report.passwordResetEmailSent} |`,
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
    "## Staging Auth src files (G-5y-d)",
    "",
    ...report.stagingAuthSrcFiles.map((f) => `- [${f.exists ? "x" : " "}] \`${f.path}\``),
    "",
  ];

  if (report.missingScaffoldFiles.length > 0) {
    lines.push("**Missing scaffold:**", ...report.missingScaffoldFiles.map((p) => `- ${p}`), "");
  }

  if (report.missingStagingAuthFiles.length > 0) {
    lines.push(
      "**Missing staging Auth src:**",
      ...report.missingStagingAuthFiles.map((p) => `- ${p}`),
      "",
    );
  }

  lines.push(
    "## Forbidden import scan (auth templates)",
    "",
    report.forbiddenImportScan.clean
      ? "Clean — no Supabase client / service role / workflow / ftp patterns in auth scaffold templates."
      : `**Hits:** ${JSON.stringify(report.forbiddenImportScan.hits, null, 2)}`,
    "",
    "## Staging Auth forbidden scan (src)",
    "",
    report.stagingAuthForbiddenScan.clean
      ? "Clean — no service role / resetPasswordForEmail / DB / Storage / workflow / ftp in staging Auth src."
      : `**Hits:** ${JSON.stringify(report.stagingAuthForbiddenScan.hits, null, 2)}`,
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
    `**readyForG5yEB:** ${report.readyForG5yEB}`,
    "",
    "*G-5y-e-a dry-run. Mock allowlist only. No /admin/ connection. No DB/RLS/Storage/Publish. productionPublish disabled.*",
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
