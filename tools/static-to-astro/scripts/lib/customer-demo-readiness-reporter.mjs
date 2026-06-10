/**
 * G-5z-f — Customer demo readiness reporter (docs scan only).
 * No live Supabase connection. No DB write.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runReadOnlyPhaseCompletionReport } from "./read-only-phase-completion-reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const CONFIG_REL = "config/admin/customer-demo-package-before-writes.json";
const PACKAGE_README = "docs/customer-demo-package-before-writes/README.md";

const REQUIRED_PACKAGE_FILES = [
  "docs/customer-demo-package-before-writes/README.md",
  "docs/customer-demo-package-before-writes/demo-script.md",
  "docs/customer-demo-package-before-writes/demo-checklist.md",
  "docs/customer-demo-package-before-writes/customer-explanation.md",
  "docs/customer-demo-package-before-writes/current-capabilities.md",
  "docs/customer-demo-package-before-writes/not-yet-capabilities.md",
  "docs/customer-demo-package-before-writes/qa-checklist.md",
  "docs/customer-demo-package-before-writes/safety-notes.md",
  "docs/customer-demo-package-before-writes/feedback-form.md",
  "docs/customer-demo-package-before-writes/next-steps.md",
  "docs/customer-demo-package-before-writes/screenshot-guide.md",
];

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const SECRET_PATTERN =
  /SUPABASE_SERVICE_ROLE|SERVICE_ROLE|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\./;

/**
 * @param {string} toolRoot
 * @param {string} relPath
 */
function readText(toolRoot, relPath) {
  return fs.readFileSync(path.join(toolRoot, relPath), "utf8");
}

/**
 * @param {string} toolRoot
 */
function scanPackageForSecrets(toolRoot) {
  /** @type {string[]} */
  const hits = [];
  for (const rel of REQUIRED_PACKAGE_FILES) {
    const abs = path.join(toolRoot, rel);
    if (!fs.existsSync(abs)) continue;
    const content = readText(toolRoot, rel);
    const emails = content.match(EMAIL_PATTERN) ?? [];
    for (const email of emails) {
      if (!email.endsWith("@example.com")) hits.push(`${rel}:email:${email}`);
    }
    if (SECRET_PATTERN.test(content)) hits.push(`${rel}:secret-pattern`);
  }
  return { clean: hits.length === 0, hits };
}

/**
 * @param {object} opts
 * @param {string} [opts.toolRoot]
 * @param {string} [opts.siteId]
 */
export function runCustomerDemoReadinessReport(opts = {}) {
  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const siteId = opts.siteId ?? "default";

  const configPath = path.join(toolRoot, CONFIG_REL);
  const configExists = fs.existsSync(configPath);
  const config = configExists
    ? JSON.parse(readText(toolRoot, CONFIG_REL))
    : null;

  const fileChecks = REQUIRED_PACKAGE_FILES.map((rel) => ({
    path: rel,
    exists: fs.existsSync(path.join(toolRoot, rel)),
  }));
  const missingFiles = fileChecks.filter((f) => !f.exists);

  const readmeExists = fs.existsSync(path.join(toolRoot, PACKAGE_README));
  const readmeContent = readmeExists ? readText(toolRoot, PACKAGE_README) : "";
  const readOnlyDemoDocumented =
    readmeContent.includes("read-only") &&
    readmeContent.includes("write operations");
  const stagingShellDocumented =
    readmeContent.includes("staging shell") &&
    readmeContent.includes("/admin");

  const secretScan = scanPackageForSecrets(toolRoot);
  const phaseCompletion = runReadOnlyPhaseCompletionReport({ toolRoot, siteId });

  const readyForCustomerDemo =
    configExists &&
    missingFiles.length === 0 &&
    readOnlyDemoDocumented &&
    stagingShellDocumented &&
    secretScan.clean &&
    phaseCompletion.readOnlyPhaseComplete;

  const blockers = [
    ...(!configExists ? ["missing-config-json"] : []),
    ...missingFiles.map((f) => `missing:${f.path}`),
    ...(!readOnlyDemoDocumented ? ["readme-missing-readonly-demo"] : []),
    ...(!stagingShellDocumented ? ["readme-missing-staging-shell"] : []),
    ...(!secretScan.clean ? ["secret-or-real-email-in-package"] : []),
    ...(!phaseCompletion.readOnlyPhaseComplete
      ? ["read-only-phase-not-complete"]
      : []),
  ];

  return {
    mode: "dry-run",
    phase: "G-5z-f",
    type: "customer-demo-readiness",
    siteId,
    generatedAt: new Date().toISOString(),
    docRef: PACKAGE_README,
    configRef: CONFIG_REL,
    readyForCustomerDemo,
    readOnlyPhaseComplete: phaseCompletion.readOnlyPhaseComplete,
    canWrite: false,
    writeOperationsEnabled: false,
    productionReady: false,
    adminRouteConnected: false,
    storageConnected: false,
    publishConnected: false,
    ftpDeployEnabled: false,
    productionDataTouched: false,
    readyForG6Planning: phaseCompletion.readyForG6Planning,
    readyForG6Implementation: false,
    demoRoute: config?.demoRoute ?? "/__admin-staging-shell/musician-basic/",
    packageFiles: fileChecks,
    missingPackageFiles: missingFiles.map((f) => f.path),
    secretScan,
    recommendation:
      "Customer demo package ready. Proceed to G-6-a write operation safety plan or customer onboarding / pricing design.",
    blockers,
  };
}

/**
 * @param {ReturnType<typeof runCustomerDemoReadinessReport>} report
 */
export function formatCustomerDemoReadinessMarkdown(report) {
  const lines = [
    "# Customer Demo Readiness Report",
    "",
    `**Phase:** ${report.phase}`,
    `**Site:** ${report.siteId}`,
    `**Generated:** ${report.generatedAt}`,
    `**Package:** ${report.docRef}`,
    "",
    "## Flags",
    "",
    "| Flag | Value |",
    "| --- | --- |",
    `| readyForCustomerDemo | ${report.readyForCustomerDemo} |`,
    `| readOnlyPhaseComplete | ${report.readOnlyPhaseComplete} |`,
    `| canWrite | ${report.canWrite} |`,
    `| writeOperationsEnabled | ${report.writeOperationsEnabled} |`,
    `| adminRouteConnected | ${report.adminRouteConnected} |`,
    `| storageConnected | ${report.storageConnected} |`,
    `| publishConnected | ${report.publishConnected} |`,
    `| productionDataTouched | ${report.productionDataTouched} |`,
    `| readyForG6Planning | ${report.readyForG6Planning} |`,
    `| readyForG6Implementation | ${report.readyForG6Implementation} |`,
    "",
    "## Demo route",
    "",
    report.demoRoute,
    "",
    "## Package files",
    "",
    ...report.packageFiles.map(
      (f) => `- [${f.exists ? "x" : " "}] \`${f.path}\``,
    ),
    "",
    "## Recommendation",
    "",
    report.recommendation,
    "",
  ];

  if (report.blockers.length > 0) {
    lines.push("## Blockers", "", ...report.blockers.map((b) => `- ${b}`), "");
  }

  lines.push(
    "*G-5z-f: customer demo package before writes. No DB connection. No writes.*",
  );

  return lines.join("\n");
}

/**
 * @param {string} outDir
 * @param {ReturnType<typeof runCustomerDemoReadinessReport>} report
 */
export function writeCustomerDemoReadinessOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "customer-demo-readiness.json");
  const mdPath = path.join(outDir, "CUSTOMER_DEMO_READINESS_REPORT.md");
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(mdPath, `${formatCustomerDemoReadinessMarkdown(report)}\n`, "utf8");
  return { jsonPath, mdPath };
}
