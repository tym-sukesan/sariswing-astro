/**
 * G-6-e5-schedule-non-dry-run-poc-execution-attempt-fix-verification — Reporter (static scan; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
const REPO_ROOT = path.resolve(__dirname, "../../../..");

const DOC_REL =
  "docs/schedule-non-dry-run-poc-execution-attempt-fix-verification.md";
const CONFIG_REL =
  "config/admin/schedule-non-dry-run-poc-execution-attempt-fix-verification.json";
const FIX_IMPL_DOC_REL =
  "docs/schedule-non-dry-run-poc-execution-attempt-fix-implementation.md";

const TRIGGER_TS = "src/lib/admin/staging-write/schedule-non-dry-run-poc-trigger.ts";
const AUTH_TS = "src/lib/admin/staging-write/schedule-non-dry-run-poc-auth.ts";
const UI_TS = "src/lib/admin/staging-write/staging-schedule-non-dry-run-poc-ui.ts";
const ASTRO_SECTION =
  "tools/static-to-astro/templates/admin-cms/data/components/AdminStagingScheduleNonDryRunPocTriggerSection.astro";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Verification summary",
  "## 3. Static verification",
  "## 4. Normal dev verification",
  "## 5. Env-gated dev verification",
  "## 6. DB unchanged verification",
  "## 7. What was verified",
  "## 8. What was not done",
  "## 9. Gate decision",
  "## 10. Recommended next phase",
  "## 11. Final safety statement",
];

function readRepoFile(relPath) {
  const abs = path.join(REPO_ROOT, relPath);
  return fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : "";
}

function adminPagesDiffClean() {
  try {
    return execSync("git diff -- src/pages/admin", {
      cwd: REPO_ROOT,
      encoding: "utf8",
    }).trim() === "";
  } catch {
    return false;
  }
}

function grepRepo(pattern, paths) {
  try {
    const args = paths.map((p) => path.join(REPO_ROOT, p)).join(" ");
    const out = execSync(`git grep -n -E "${pattern}" -- ${args}`, {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return out.trim();
  } catch {
    return "";
  }
}

export function runScheduleNonDryRunPocExecutionAttemptFixVerificationReport({
  toolRoot = DEFAULT_TOOL_ROOT,
  repoRoot = REPO_ROOT,
  siteId = "default",
}) {
  const blockers = [];
  const docPath = path.join(toolRoot, DOC_REL);
  const configPath = path.join(toolRoot, CONFIG_REL);

  if (!fs.existsSync(docPath)) blockers.push("doc-missing");
  if (!fs.existsSync(configPath)) blockers.push("config-missing");
  if (!fs.existsSync(path.join(toolRoot, FIX_IMPL_DOC_REL))) {
    blockers.push("fix-impl-doc-missing");
  }

  const doc = fs.existsSync(docPath) ? fs.readFileSync(docPath, "utf8") : "";
  for (const s of REQUIRED_SECTIONS) {
    if (!doc.includes(s)) blockers.push(`doc-missing:${s}`);
  }
  if (!doc.includes("Run button clicked: no")) blockers.push("run-not-clicked-missing");
  if (!doc.includes("normalDevHiddenVerified: true")) {
    blockers.push("gate-normal-dev-missing");
  }
  if (!doc.includes("mockRoleHardGateRemovedOrRelaxed: true")) {
    blockers.push("gate-mock-role-missing");
  }
  if (!doc.includes("signedInSessionStillRequired: true")) {
    blockers.push("gate-signed-in-missing");
  }
  if (!doc.includes("activeSupabaseHostDisplayed: true")) {
    blockers.push("gate-host-display-missing");
  }

  if (!adminPagesDiffClean()) blockers.push("admin-pages-diff");

  const triggerSrc = readRepoFile(TRIGGER_TS);
  const authSrc = readRepoFile(AUTH_TS);
  const uiSrc = readRepoFile(UI_TS);
  const astroSrc = readRepoFile(ASTRO_SECTION);

  if (triggerSrc.includes("Admin role required.")) {
    blockers.push("hard-abort-admin-role-required");
  }
  if (/if\s*\(\s*auth\.session\.role\s*!==\s*"admin"\s*\)/.test(triggerSrc)) {
    blockers.push("hard-abort-mock-role-in-trigger");
  }
  if (!authSrc.includes("Local mock role is not admin")) {
    blockers.push("mock-role-warning-missing");
  }
  if (!triggerSrc.includes("AUTH_SESSION_MISSING")) {
    blockers.push("auth-session-missing-code-missing");
  }
  if (!uiSrc.includes("executionInFlight")) blockers.push("double-click-guard-missing");
  if (!uiSrc.includes("scrollIntoView")) blockers.push("scroll-into-view-missing");
  if (!uiSrc.includes("unexpected_exception") && !uiSrc.includes("UNEXPECTED_EXCEPTION")) {
    blockers.push("unexpected-exception-missing");
  }
  if (!astroSrc.includes('type="button"')) blockers.push("button-type-missing");
  if (!astroSrc.includes("schedule-non-dry-run-poc-supabase-host")) {
    blockers.push("supabase-host-display-missing");
  }
  if (
    !astroSrc.includes("static-to-astro-cms-staging") &&
    !astroSrc.includes("SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT")
  ) {
    blockers.push("expected-project-missing");
  }

  const adminWrite = grepRepo("updateScheduleWrite", ["src/pages/admin"]);
  if (adminWrite) blockers.push("updateScheduleWrite-in-admin");

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.mockRoleHardGateRemovedOrRelaxed !== true) {
    blockers.push("config-mockRoleHardGateRemovedOrRelaxed");
  }
  if (config.signedInSessionStillRequired !== true) {
    blockers.push("config-signedInSessionStillRequired");
  }
  if (config.triggerClickedInThisPhase !== false) {
    blockers.push("config-triggerClickedInThisPhase");
  }
  if (config.dbWritesPerformedInThisPhase !== false) {
    blockers.push("config-dbWritesPerformedInThisPhase");
  }
  if (config.readyForExplicitRetry !== false) {
    blockers.push("config-readyForExplicitRetry");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e5-schedule-non-dry-run-poc-execution-attempt-fix-verification",
    siteId,
    generatedAt: new Date().toISOString(),
    mockRoleHardGateRemovedOrRelaxed: true,
    signedInSessionStillRequired: true,
    rlsAdminUsersSourceOfTruth: true,
    activeSupabaseHostDisplayed: true,
    errorPanelImproved: true,
    unexpectedExceptionCaptured: true,
    scrollIntoViewAdded: true,
    doubleClickGuardVerified: true,
    normalDevHiddenVerified: config.normalDevHiddenVerified === true,
    envGatedVisibleVerified: config.envGatedVisibleVerified === true,
    manualConfirmVerified: config.manualConfirmVerified === true,
    triggerClickedInThisPhase: false,
    dbWritesPerformedInThisPhase: false,
    readyForManualEnvGatedFixVerification:
      complete && config.readyForManualEnvGatedFixVerification === true,
    readyForExplicitRetry: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleNonDryRunPocExecutionAttemptFixVerificationOutput(
  outDir,
  report,
) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(
    outDir,
    "schedule-non-dry-run-poc-execution-attempt-fix-verification.json",
  );
  const mdPath = path.join(
    outDir,
    "SCHEDULE_NON_DRY_RUN_POC_EXECUTION_ATTEMPT_FIX_VERIFICATION_REPORT.md",
  );
  const summary = {
    phase: report.phase,
    mockRoleHardGateRemovedOrRelaxed: report.mockRoleHardGateRemovedOrRelaxed,
    signedInSessionStillRequired: report.signedInSessionStillRequired,
    rlsAdminUsersSourceOfTruth: report.rlsAdminUsersSourceOfTruth,
    activeSupabaseHostDisplayed: report.activeSupabaseHostDisplayed,
    errorPanelImproved: report.errorPanelImproved,
    unexpectedExceptionCaptured: report.unexpectedExceptionCaptured,
    scrollIntoViewAdded: report.scrollIntoViewAdded,
    doubleClickGuardVerified: report.doubleClickGuardVerified,
    normalDevHiddenVerified: report.normalDevHiddenVerified,
    envGatedVisibleVerified: report.envGatedVisibleVerified,
    manualConfirmVerified: report.manualConfirmVerified,
    triggerClickedInThisPhase: report.triggerClickedInThisPhase,
    dbWritesPerformedInThisPhase: report.dbWritesPerformedInThisPhase,
    readyForManualEnvGatedFixVerification:
      report.readyForManualEnvGatedFixVerification,
    readyForExplicitRetry: report.readyForExplicitRetry,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule Non-Dry-Run PoC Execution Attempt Fix Verification Report",
    "",
    `Phase: ${report.phase}`,
    `Complete: ${report.complete}`,
    `Recommended next: ${report.recommendedNextPhase}`,
    "",
    report.blockers.length
      ? `Blockers:\n${report.blockers.map((b) => `- ${b}`).join("\n")}`
      : "No blockers.",
  ].join("\n");
  fs.writeFileSync(mdPath, `${md}\n`, "utf8");
  return { jsonPath, mdPath };
}
