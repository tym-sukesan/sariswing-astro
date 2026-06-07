/**
 * Public-dist FTP deploy workflow template verification (Phase 3-V).
 */

import fs from "node:fs";
import path from "node:path";

export const EXPECTED_GITHUB_SECRETS = [
  "FTP_SERVER",
  "FTP_USERNAME",
  "FTP_PASSWORD",
  "FTP_SERVER_DIR",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ANON_KEY",
];

export const OPTIONAL_GITHUB_SECRETS = ["SUPABASE_ADMIN_EMAIL", "SUPABASE_ADMIN_PASSWORD"];

/** Patterns that must appear in a valid template */
export const REQUIRED_PATTERNS = [
  { id: "verify_static_public", pattern: /verify-static-public-artifact\.mjs/i },
  { id: "public_dist_path", pattern: /public-dist/i },
  { id: "safe_for_static_ftp", pattern: /safeForStaticFtp/i },
  { id: "with_admin_cms", pattern: /--with-admin-cms/i },
  { id: "export_supabase", pattern: /export-supabase-json\.mjs/i },
  { id: "github_secrets_ftp", pattern: /secrets\.FTP_SERVER/i },
  { id: "github_secrets_supabase", pattern: /secrets\.SUPABASE_URL/i },
];

/** Forbidden deploy targets / practices */
export const FORBIDDEN_PATTERNS = [
  {
    id: "dist_client_direct_mirror",
    pattern: /mirror[^\n]*dist\/client/i,
    message: "must not mirror dist/client directly",
  },
  {
    id: "dist_root_mirror",
    pattern: /mirror[^\n]*\bdist\/["']/i,
    message: "must not mirror dist/ root",
  },
  {
    id: "dist_server_mirror",
    pattern: /mirror[^\n]*dist\/server/i,
    message: "must not mirror dist/server",
  },
  {
    id: "admin_path_deploy",
    pattern: /mirror[^\n]*\/admin\//i,
    message: "must not mirror /admin/ as deploy target",
  },
  {
    id: "api_admin_deploy",
    pattern: /mirror[^\n]*api\/admin/i,
    message: "must not mirror api/admin",
  },
  {
    id: "env_local_deploy",
    pattern: /mirror[^\n]*\.env\.local/i,
    message: "must not deploy .env.local",
  },
];

/** Literal secret-like values that must not appear in template */
export const SECRET_LITERAL_PATTERNS = [
  { id: "jwt", pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  {
    id: "service_role_assignment",
    pattern: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"]?[A-Za-z0-9_\-]{20,}/,
  },
  {
    id: "anon_key_assignment",
    pattern: /SUPABASE_ANON_KEY\s*=\s*['"]?[A-Za-z0-9_\-]{20,}/,
  },
  {
    id: "ftp_password_literal",
    pattern: /FTP_PASSWORD\s*=\s*['"][^'"\s]{8,}['"]/,
  },
];

/**
 * @param {string} workflowPath
 */
export function readWorkflowTemplate(workflowPath) {
  const abs = path.resolve(workflowPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Workflow template not found: ${abs}`);
  }
  return { abs, content: fs.readFileSync(abs, "utf8") };
}

/**
 * @param {string} content
 */
export function verifyRequiredPatterns(content) {
  return REQUIRED_PATTERNS.map(({ id, pattern }) => ({
    id,
    pass: pattern.test(content),
  }));
}

/**
 * @param {string} content
 */
export function verifyForbiddenPatterns(content) {
  return FORBIDDEN_PATTERNS.map(({ id, pattern, message }) => ({
    id,
    pass: !pattern.test(content),
    message,
  }));
}

/**
 * @param {string} content
 */
export function scanSecretLiterals(content) {
  return SECRET_LITERAL_PATTERNS.map(({ id, pattern }) => ({
    id,
    pass: !pattern.test(content),
  }));
}

/**
 * @param {string} content
 */
export function extractGitHubSecretsReferences(content) {
  const refs = new Set();
  const re = /secrets\.([A-Z0-9_]+)/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    refs.add(match[1]);
  }
  return [...refs].sort();
}

/**
 * @param {string} content
 */
export function verifyGitHubSecretsOnly(content) {
  const refs = extractGitHubSecretsReferences(content);
  const missingRequired = EXPECTED_GITHUB_SECRETS.filter((name) => !refs.includes(name));
  const usesSecretsSyntax = /secrets\.[A-Z0-9_]+/.test(content);
  return {
    pass: usesSecretsSyntax && missingRequired.length === 0,
    references: refs,
    missingRequired,
    usesSecretsSyntax,
  };
}

/**
 * @param {string} content
 */
export function detectDeployTarget(content) {
  const publicDistMatch = content.match(/PUBLIC_DIST:\s*(.+)/);
  const mirrorMatch = content.match(/mirror[^\n]*public-dist[^\n]*/i);
  return {
    deployTarget: "public-dist",
    publicDistEnv: publicDistMatch?.[1]?.trim() ?? null,
    mirrorLine: mirrorMatch?.[0]?.trim() ?? null,
    usesPublicDistOnly: /public-dist/.test(content) && !/mirror[^\n]*dist\/client/i.test(content),
  };
}

/**
 * @param {{ workflowPath: string }} opts
 */
export function runPublicDistDeployWorkflowVerification({ workflowPath }) {
  const { abs, content } = readWorkflowTemplate(workflowPath);

  const result = {
    workflowPath: abs,
    workflowExists: true,
    deployTarget: null,
    requiredPatterns: verifyRequiredPatterns(content),
    forbiddenPatterns: verifyForbiddenPatterns(content),
    secretLiteralScan: scanSecretLiterals(content),
    githubSecrets: verifyGitHubSecretsOnly(content),
    staticPublicVerificationStep: /verify-static-public-artifact\.mjs/i.test(content),
    safeForStaticFtpCheck: /safeForStaticFtp/i.test(content),
    distClientDirectDeploy: /mirror[^\n]*dist\/client/i.test(content),
    distServerDeploy: /mirror[^\n]*dist\/server/i.test(content),
    adminApiDeploy: /mirror[^\n]*\/admin\//i.test(content) || /mirror[^\n]*api\/admin/i.test(content),
    errors: [],
    passed: false,
  };

  result.deployTarget = detectDeployTarget(content);

  for (const check of result.requiredPatterns) {
    if (!check.pass) result.errors.push(`missing required pattern: ${check.id}`);
  }
  for (const check of result.forbiddenPatterns) {
    if (!check.pass) result.errors.push(`forbidden pattern found: ${check.id} (${check.message})`);
  }
  for (const check of result.secretLiteralScan) {
    if (!check.pass) result.errors.push(`secret literal detected: ${check.id}`);
  }
  if (!result.githubSecrets.pass) {
    result.errors.push(
      result.githubSecrets.missingRequired.length
        ? `missing GitHub Secrets references: ${result.githubSecrets.missingRequired.join(", ")}`
        : "workflow must reference secrets.* for credentials",
    );
  }
  if (!result.staticPublicVerificationStep) {
    result.errors.push("verify-static-public-artifact.mjs step missing");
  }
  if (!result.safeForStaticFtpCheck) {
    result.errors.push("safeForStaticFtp pre-deploy check missing");
  }

  result.passed = result.errors.length === 0;
  return result;
}

/**
 * @param {object} result
 * @param {{ reportPath: string, elapsedMs: number }} meta
 */
export function formatPublicDistDeployWorkflowReport(result, { reportPath, elapsedMs }) {
  const lines = [
    "# Public-dist Deploy Workflow Report (Phase 3-V)",
    "",
    `- **Result:** ${result.passed ? "PASS" : "FAIL"}`,
    `- **Workflow template:** \`${result.workflowPath}\``,
    `- **Deploy target:** \`${result.deployTarget?.deployTarget ?? "—"}\``,
    `- **Uses public-dist only:** ${result.deployTarget?.usesPublicDistOnly ? "yes" : "no"}`,
    "",
    "## Checks",
    "",
    `- workflow template exists: ${result.workflowExists ? "yes" : "no"}`,
    `- deploy target: public-dist`,
    `- dist/client direct deploy: ${result.distClientDirectDeploy ? "yes (FAIL)" : "no"}`,
    `- dist/server deploy: ${result.distServerDeploy ? "yes (FAIL)" : "no"}`,
    `- admin/api deploy mirror: ${result.adminApiDeploy ? "yes (FAIL)" : "no"}`,
    `- static public verification step: ${result.staticPublicVerificationStep ? "yes" : "no"}`,
    `- safeForStaticFtp pre-deploy check: ${result.safeForStaticFtpCheck ? "yes" : "no"}`,
    `- secret literal leak: ${result.secretLiteralScan.every((c) => c.pass) ? "no" : "yes (FAIL)"}`,
    `- GitHub Secrets only: ${result.githubSecrets.pass ? "yes" : "no"}`,
    "",
    "## Required patterns",
    "",
  ];

  for (const check of result.requiredPatterns) {
    lines.push(`- \`${check.id}\`: ${check.pass ? "OK" : "FAIL"}`);
  }
  lines.push("");

  lines.push("## Forbidden patterns", "");
  for (const check of result.forbiddenPatterns) {
    lines.push(`- \`${check.id}\`: ${check.pass ? "absent (OK)" : "FOUND"}`);
  }
  lines.push("");

  lines.push("## GitHub Secrets references", "");
  if (result.githubSecrets.references.length) {
    for (const ref of result.githubSecrets.references) {
      lines.push(`- \`${ref}\` (\`secrets.${ref}\`)`);
    }
  } else {
    lines.push("- _none_");
  }
  lines.push("");
  lines.push("Expected required secrets:", "");
  for (const name of EXPECTED_GITHUB_SECRETS) {
    lines.push(`- \`${name}\``);
  }
  lines.push("");
  lines.push("Optional (not required for deploy template):", "");
  for (const name of OPTIONAL_GITHUB_SECRETS) {
    lines.push(`- \`${name}\``);
  }
  lines.push("");

  if (result.deployTarget?.mirrorLine) {
    lines.push("## Deploy mirror line", "", "```", result.deployTarget.mirrorLine, "```", "");
  }

  if (result.errors.length) {
    lines.push("## Errors", "", ...result.errors.map((e) => `- ${e}`), "");
  }

  lines.push(
    "## Notes",
    "",
    "- This template is **not** active in `.github/workflows/` until copied manually.",
    "- Production FTP deploy was **not** executed in Phase 3-V.",
    "- Upload only `output/static-public/<site>/public-dist/` — never `dist/client/` or `dist/server/`.",
    "",
    "---",
    `Elapsed: ${elapsedMs}ms`,
    `Report: \`${reportPath}\``,
    "",
  );

  return lines.join("\n");
}
