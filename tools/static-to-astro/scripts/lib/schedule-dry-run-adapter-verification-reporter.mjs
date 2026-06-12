/**
 * G-6-e3-schedule-dry-run-adapter-verification — Reporter (docs/config scan + static checks; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
const REPO_ROOT = path.resolve(__dirname, "../../../..");

const DOC_REL = "docs/schedule-dry-run-adapter-verification.md";
const CONFIG_REL = "config/admin/schedule-dry-run-adapter-verification.json";
const IMPL_CONFIG_REL = "config/admin/schedule-dry-run-adapter-implementation.json";

const ADAPTER_FILES = [
  "src/lib/admin/staging-write/schedule-dry-run-adapter.ts",
  "src/lib/admin/staging-write/schedule-dry-run-types.ts",
  "src/lib/admin/staging-write/schedule-dry-run-guards.ts",
  "src/lib/admin/staging-write/staging-schedule-dry-run-ui.ts",
];

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Implementation under verification",
  "## 3. Expected adapter behavior",
  "## 4. Safety expectations",
  "## 5. Static verification commands",
  "## 6. Manual browser verification plan",
  "## 7. Verification result placeholders",
  "## 8. Gate decision",
  "## 9. Recommended next phase",
  "## 10. Final safety statement",
];

const FORBIDDEN_IMPORT = /@supabase\/supabase-js|createClient|PUBLIC_SUPABASE|SERVICE_ROLE|service_role/;
const FORBIDDEN_WRITE = /\.insert\(|\.update\(|\.delete\(|\.upsert\(|rpc\(/;

function grepRepo(pattern, files) {
  try {
    const rel = files.map((f) => path.join(REPO_ROOT, f)).join(" ");
    const out = execSync(`git grep -n -E "${pattern}" -- ${rel}`, {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return out.trim();
  } catch {
    return "";
  }
}

function adminPagesDiffClean() {
  try {
    const out = execSync("git diff -- src/pages/admin", {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
    return out.trim() === "";
  } catch {
    return false;
  }
}

export function runScheduleDryRunAdapterVerificationReport({
  toolRoot = DEFAULT_TOOL_ROOT,
  repoRoot = REPO_ROOT,
  siteId = "default",
}) {
  const blockers = [];
  const docPath = path.join(toolRoot, DOC_REL);
  const configPath = path.join(toolRoot, CONFIG_REL);
  const implConfigPath = path.join(toolRoot, IMPL_CONFIG_REL);

  if (!fs.existsSync(docPath)) blockers.push("doc-missing");
  if (!fs.existsSync(configPath)) blockers.push("config-missing");
  if (!fs.existsSync(implConfigPath)) blockers.push("impl-config-missing");

  const doc = fs.existsSync(docPath) ? fs.readFileSync(docPath, "utf8") : "";
  for (const s of REQUIRED_SECTIONS) {
    if (!doc.includes(s)) blockers.push(`doc-missing:${s}`);
  }
  if (!doc.includes("manualBrowserVerification: pending")) {
    blockers.push("manual-placeholder-missing");
  }
  if (!doc.includes("G-6-e3-schedule-dry-run-adapter-verification-result")) {
    blockers.push("next-phase-missing");
  }
  if (!doc.includes("No schedule records are written")) {
    blockers.push("safety-statement-missing");
  }

  const forbiddenHits = grepRepo(
    FORBIDDEN_IMPORT.source,
    ADAPTER_FILES.slice(0, 3),
  );
  if (forbiddenHits) blockers.push("forbidden-imports-found");

  const writeHits = grepRepo(FORBIDDEN_WRITE.source, ADAPTER_FILES);
  if (writeHits) blockers.push("db-write-patterns-found");

  if (!adminPagesDiffClean()) blockers.push("admin-pages-diff");

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.verificationOnly !== true) blockers.push("config-verificationOnly");
  if (config.adapterImplemented !== true) blockers.push("config-adapterImplemented");
  if (config.actualWriteHardCodedFalse !== true) {
    blockers.push("config-actualWriteHardCodedFalse");
  }
  if (config.acceptsDbClient !== false) blockers.push("config-acceptsDbClient");
  if (config.acceptsDryRunModeFlag !== false) {
    blockers.push("config-acceptsDryRunModeFlag");
  }
  if (config.uiRoutedThroughAdapter !== true) {
    blockers.push("config-uiRoutedThroughAdapter");
  }
  if (config.manualBrowserVerification !== "pending") {
    blockers.push("config-manualBrowserVerification");
  }
  if (config.readyForG6E3ScheduleDryRunAdapterManualVerification !== true) {
    blockers.push("config-readyForG6E3ScheduleDryRunAdapterManualVerification");
  }
  if (config.readyForG6EWriteImplementation !== false) {
    blockers.push("config-readyForG6EWriteImplementation");
  }

  const implConfig = JSON.parse(fs.readFileSync(implConfigPath, "utf8"));
  if (implConfig.adapterImplemented !== true) {
    blockers.push("impl-adapter-not-implemented");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e3-schedule-dry-run-adapter-verification",
    siteId,
    generatedAt: new Date().toISOString(),
    verificationOnly: true,
    targetModule: "schedule",
    adapterImplemented: true,
    actualWriteHardCodedFalse: config.actualWriteHardCodedFalse === true,
    acceptsDbClient: config.acceptsDbClient === false ? false : true,
    acceptsDryRunModeFlag: config.acceptsDryRunModeFlag === false ? false : true,
    uiRoutedThroughAdapter: config.uiRoutedThroughAdapter === true,
    manualBrowserVerification: config.manualBrowserVerification,
    staticSafetyVerification: forbiddenHits || writeHits ? "fail" : "pass",
    writeAdaptersImplemented: false,
    dbWritesPerformed: false,
    readyForG6E3ScheduleDryRunAdapterManualVerification:
      complete && config.readyForG6E3ScheduleDryRunAdapterManualVerification === true,
    readyForG6EWriteImplementation: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleDryRunAdapterVerificationOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "schedule-dry-run-adapter-verification.json");
  const mdPath = path.join(outDir, "SCHEDULE_DRY_RUN_ADAPTER_VERIFICATION_REPORT.md");
  const summary = {
    phase: report.phase,
    verificationOnly: report.verificationOnly,
    targetModule: report.targetModule,
    adapterImplemented: report.adapterImplemented,
    actualWriteHardCodedFalse: report.actualWriteHardCodedFalse,
    acceptsDbClient: report.acceptsDbClient,
    acceptsDryRunModeFlag: report.acceptsDryRunModeFlag,
    uiRoutedThroughAdapter: report.uiRoutedThroughAdapter,
    manualBrowserVerification: report.manualBrowserVerification,
    writeAdaptersImplemented: report.writeAdaptersImplemented,
    dbWritesPerformed: report.dbWritesPerformed,
    readyForG6E3ScheduleDryRunAdapterManualVerification:
      report.readyForG6E3ScheduleDryRunAdapterManualVerification,
    readyForG6EWriteImplementation: report.readyForG6EWriteImplementation,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule Dry-run Adapter Verification Report",
    "",
    `Phase: ${report.phase}`,
    `Complete: ${report.complete}`,
    `Manual browser: ${report.manualBrowserVerification}`,
    `Static safety: ${report.staticSafetyVerification}`,
    `Recommended next: ${report.recommendedNextPhase}`,
    "",
    report.blockers.length
      ? `Blockers:\n${report.blockers.map((b) => `- ${b}`).join("\n")}`
      : "No blockers.",
  ].join("\n");
  fs.writeFileSync(mdPath, `${md}\n`, "utf8");
  return { jsonPath, mdPath };
}
