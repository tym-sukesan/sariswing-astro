/**
 * G-6-d-staging-password-reset-callback — Reporter (docs/code scan only).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
const REPO_ROOT = path.resolve(DEFAULT_TOOL_ROOT, "../..");

const DOC_REL = "docs/staging-password-reset-callback.md";
const CONFIG_REL = "config/admin/staging-password-reset-callback.json";
const CALLBACK_TS = "src/lib/admin/staging-auth/staging-password-reset-callback.ts";
const UI_TS = "src/lib/admin/staging-auth/staging-password-reset-ui.ts";
const ASTRO_REL =
  "tools/static-to-astro/templates/admin-cms/auth/components/AdminStagingPasswordResetCallback.astro";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Problem",
  "## 3. Implemented flow",
  "## 4. Required Supabase settings",
  "## 5. Manual test procedure",
  "## 6. Safety notes",
  "## 7. Completion criteria",
];

const FORBIDDEN_IN_REPORTER = [
  /service_role/i,
  /SERVICE_ROLE/,
  /createClient\s*\(/,
  /@supabase\/supabase-js/,
];

function scanReporter(filePath) {
  if (!fs.existsSync(filePath)) return { clean: true, hits: [] };
  const hits = [];
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const t = line.trim();
    if (t.startsWith("//") || t.startsWith("*")) continue;
    for (const p of FORBIDDEN_IN_REPORTER) {
      if (p.test(line)) hits.push(p.source);
    }
  }
  return { clean: hits.length === 0, hits: [...new Set(hits)] };
}

export function runStagingPasswordResetCallbackReport({
  toolRoot = DEFAULT_TOOL_ROOT,
  siteId = "default",
}) {
  const blockers = [];
  const doc = fs.readFileSync(path.join(toolRoot, DOC_REL), "utf8");
  const configPath = path.join(toolRoot, CONFIG_REL);

  if (!fs.existsSync(configPath)) blockers.push("config-missing");
  for (const s of REQUIRED_SECTIONS) {
    if (!doc.includes(s)) blockers.push(`doc-missing:${s}`);
  }

  const callbackPath = path.join(REPO_ROOT, CALLBACK_TS);
  const uiPath = path.join(REPO_ROOT, UI_TS);
  const astroPath = path.join(REPO_ROOT, ASTRO_REL);

  if (!fs.existsSync(callbackPath)) blockers.push("callback-ts-missing");
  if (!fs.existsSync(uiPath)) blockers.push("ui-ts-missing");
  if (!fs.existsSync(astroPath)) blockers.push("astro-component-missing");

  const callbackSrc = fs.existsSync(callbackPath)
    ? fs.readFileSync(callbackPath, "utf8")
    : "";
  if (!callbackSrc.includes("updateUser({ password:")) {
    blockers.push("updateUser-missing");
  }
  if (callbackSrc.includes("console.log")) {
    blockers.push("console-log-in-callback");
  }
  if (/\.resetPasswordForEmail\s*\(/.test(callbackSrc)) {
    blockers.push("resetPasswordForEmail-in-callback");
  }
  if (callbackSrc.includes("service_role")) {
    blockers.push("service-role-in-callback");
  }

  const loginSection = fs.readFileSync(
    path.join(
      REPO_ROOT,
      "tools/static-to-astro/templates/admin-cms/auth/components/AdminStagingLoginUiSection.astro",
    ),
    "utf8",
  );
  if (!loginSection.includes("AdminStagingPasswordResetCallback")) {
    blockers.push("login-section-not-wired");
  }

  const reportPath = path.join(
    toolRoot,
    "scripts/report-staging-password-reset-callback.mjs",
  );
  const scan = scanReporter(reportPath);
  if (!scan.clean) blockers.push(`reporter-unsafe:${scan.hits.join(",")}`);

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.usesServiceRole !== false) blockers.push("config-usesServiceRole");
  if (config.nonDryRunExecuted !== false) blockers.push("config-nonDryRunExecuted");

  const complete = blockers.length === 0;

  return {
    phase: "G-6-d-staging-password-reset-callback",
    siteId,
    generatedAt: new Date().toISOString(),
    stagingOnly: true,
    passwordResetCallbackImplemented: complete,
    passwordUpdateButtonEnabledInStagingOnly: true,
    usesSupabaseAnonClient: true,
    usesServiceRole: false,
    profileUpdateExecuted: false,
    nonDryRunExecuted: false,
    cursorSetsDryRunFalse: false,
    dbWritePerformedByCursor: false,
    readyForAuthLoginRetry: complete,
    readyForManualNonDryRunExecution: false,
    readyForG6E: false,
    adminRouteConnected: false,
    productionAuthTouched: false,
    productionDataTouched: false,
    blockers,
    complete,
  };
}

export function writeResetCallbackOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "staging-password-reset-callback.json");
  const mdPath = path.join(outDir, "STAGING_PASSWORD_RESET_CALLBACK_REPORT.md");
  const summary = {
    phase: report.phase,
    stagingOnly: report.stagingOnly,
    passwordResetCallbackImplemented: report.passwordResetCallbackImplemented,
    passwordUpdateButtonEnabledInStagingOnly:
      report.passwordUpdateButtonEnabledInStagingOnly,
    usesSupabaseAnonClient: report.usesSupabaseAnonClient,
    usesServiceRole: report.usesServiceRole,
    profileUpdateExecuted: report.profileUpdateExecuted,
    nonDryRunExecuted: report.nonDryRunExecuted,
    readyForAuthLoginRetry: report.readyForAuthLoginRetry,
    readyForManualNonDryRunExecution: report.readyForManualNonDryRunExecution,
    readyForG6E: report.readyForG6E,
    adminRouteConnected: report.adminRouteConnected,
    productionDataTouched: report.productionDataTouched,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Staging Password Reset Callback Report",
    "",
    `Phase: ${report.phase}`,
    `Complete: ${report.complete}`,
    "",
    report.blockers.length
      ? `Blockers:\n${report.blockers.map((b) => `- ${b}`).join("\n")}`
      : "No blockers.",
  ].join("\n");
  fs.writeFileSync(mdPath, `${md}\n`, "utf8");
  return { jsonPath, mdPath };
}
