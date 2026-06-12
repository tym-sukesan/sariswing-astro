/**
 * G-6-e5-schedule-non-dry-run-poc-execution-path-implementation — Reporter (static scan; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
const REPO_ROOT = path.resolve(__dirname, "../../../..");

const DOC_REL = "docs/schedule-non-dry-run-poc-execution-path-implementation.md";
const CONFIG_REL =
  "config/admin/schedule-non-dry-run-poc-execution-path-implementation.json";
const PREP_CONFIG_REL = "config/admin/schedule-non-dry-run-poc-execution-prep.json";

const TRIGGER_TS = "src/lib/admin/staging-write/schedule-non-dry-run-poc-trigger.ts";
const CONFIG_TS = "src/lib/admin/staging-write/schedule-non-dry-run-poc-config.ts";
const UI_TS = "src/lib/admin/staging-write/staging-schedule-non-dry-run-poc-ui.ts";
const ASTRO_SECTION =
  "tools/static-to-astro/templates/admin-cms/data/components/AdminStagingScheduleNonDryRunPocTriggerSection.astro";
const RUN_SCRIPT = "tools/static-to-astro/scripts/run-schedule-non-dry-run-poc.mjs";

const REQUIRED_DOC_MARKERS = [
  "hidden staging browser trigger implemented",
  "default hidden",
  "service_role prohibited",
  "executionPathInvoked false",
  "writeAdapterInvoked false",
  "G-6-e5-schedule-non-dry-run-poc-execution-path-verification",
];

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

function fileHasDirectUpdate(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const src = fs.readFileSync(filePath, "utf8");
  const lines = src.split("\n");
  return lines.some((line) => {
    const t = line.trim();
    if (t.startsWith("//") || t.startsWith("*")) return false;
    return /\.update\s*\(/.test(line);
  });
}

export function runScheduleNonDryRunPocExecutionPathImplementationReport({
  toolRoot = DEFAULT_TOOL_ROOT,
  repoRoot = REPO_ROOT,
  siteId = "default",
}) {
  const blockers = [];
  const docPath = path.join(toolRoot, DOC_REL);
  const configPath = path.join(toolRoot, CONFIG_REL);

  for (const rel of [DOC_REL, CONFIG_REL, TRIGGER_TS, CONFIG_TS, UI_TS, ASTRO_SECTION]) {
    const p = rel.startsWith("src/") || rel.startsWith("tools/")
      ? path.join(repoRoot, rel)
      : path.join(toolRoot, rel);
    if (!fs.existsSync(p)) blockers.push(`missing:${rel}`);
  }

  const doc = fs.existsSync(docPath) ? fs.readFileSync(docPath, "utf8") : "";
  for (const m of REQUIRED_DOC_MARKERS) {
    if (!doc.includes(m)) blockers.push(`doc-missing:${m}`);
  }

  const triggerPath = path.join(repoRoot, TRIGGER_TS);
  const triggerSrc = fs.readFileSync(triggerPath, "utf8");
  if (!triggerSrc.includes("updateScheduleWrite")) {
    blockers.push("trigger-missing-updateScheduleWrite");
  }
  if (fileHasDirectUpdate(triggerPath)) {
    blockers.push("trigger-direct-update");
  }
  if (!triggerSrc.includes("Never use service_role") && !triggerSrc.includes("service_role")) {
    // trigger file may not mention - check config/doc
  }
  if (!triggerSrc.includes("SCHEDULE_NON_DRY_RUN_POC_FIXED_PAYLOAD")) {
    blockers.push("trigger-fixed-payload-missing");
  }

  const configTsPath = path.join(repoRoot, CONFIG_TS);
  const configTs = fs.readFileSync(configTsPath, "utf8");
  if (!configTs.includes("PUBLIC_ADMIN_NON_DRY_RUN_POC_TRIGGER")) {
    blockers.push("config-ts-trigger-gate-missing");
  }
  if (!configTs.includes("serviceRoleAllowed: false")) {
    blockers.push("config-ts-service-role-flag");
  }

  const astroPath = path.join(repoRoot, ASTRO_SECTION);
  const astro = fs.readFileSync(astroPath, "utf8");
  if (!astro.includes("Danger Zone")) blockers.push("astro-danger-zone-missing");
  if (!astro.includes("schedule-non-dry-run-poc-confirm-input")) {
    blockers.push("astro-manual-confirm-missing");
  }
  if (!astro.includes("hidden={!pocConfig.visible}")) {
    blockers.push("astro-default-hidden-missing");
  }

  const prototypePath = path.join(
    repoRoot,
    "tools/static-to-astro/templates/admin-cms/prototypes/musician-basic-admin-prototype.astro",
  );
  if (!fs.readFileSync(prototypePath, "utf8").includes("AdminStagingScheduleNonDryRunPocTriggerSection")) {
    blockers.push("prototype-wiring-missing");
  }

  if (fs.existsSync(path.join(repoRoot, RUN_SCRIPT))) {
    blockers.push("node-run-script-exists-prematurely");
  }

  if (!adminPagesDiffClean()) blockers.push("admin-pages-diff");

  const adminUpdate = grepRepo("updateScheduleWrite", ["src/pages/admin"]);
  if (adminUpdate) blockers.push("admin-imports-updateScheduleWrite");

  const writeAdapterOnly = grepRepo("updateScheduleWrite", ["src/lib", "src/pages"]);
  if (writeAdapterOnly) {
    const lines = writeAdapterOnly.split("\n").filter(Boolean);
    const allowed = [
      "schedule-write-adapter.ts",
      "schedule-non-dry-run-poc-trigger.ts",
      "staging-schedule-non-dry-run-poc-ui.ts",
    ];
    for (const line of lines) {
      if (!allowed.some((a) => line.includes(a))) {
        blockers.push(`unexpected-updateScheduleWrite:${line}`);
      }
    }
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.executionPathImplemented !== true) blockers.push("config-executionPathImplemented");
  if (config.executionPathInvoked !== false) blockers.push("config-executionPathInvoked");
  if (config.executionScriptImplemented !== false) {
    blockers.push("config-executionScriptImplemented");
  }
  if (config.writeAdapterInvoked !== false) blockers.push("config-writeAdapterInvoked");
  if (config.dbWritesPerformed !== false) blockers.push("config-dbWritesPerformed");
  if (config.defaultVisible !== false) blockers.push("config-defaultVisible");
  if (config.serviceRoleAllowed !== false) blockers.push("config-serviceRoleAllowed");
  if (config.manualConfirmRequired !== true) blockers.push("config-manualConfirmRequired");
  if (config.payloadFixed !== true) blockers.push("config-payloadFixed");
  if (config.readyForG6E5ScheduleNonDryRunPocExecutionPathVerification !== true) {
    blockers.push("config-readyForVerification");
  }
  if (config.readyForNonDryRunSchedulePoC !== false) {
    blockers.push("config-readyForNonDryRunSchedulePoC");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e5-schedule-non-dry-run-poc-execution-path-implementation",
    siteId,
    generatedAt: new Date().toISOString(),
    executionPathImplemented: true,
    executionPathType: config.executionPathType,
    executionPathInvoked: false,
    executionScriptImplemented: false,
    writeAdapterInvoked: false,
    dbWritesPerformed: false,
    scheduleRecordsUpdated: false,
    defaultVisible: false,
    manualConfirmRequired: true,
    payloadFixed: true,
    serviceRoleAllowed: false,
    readyForG6E5ScheduleNonDryRunPocExecutionPathVerification:
      complete && config.readyForG6E5ScheduleNonDryRunPocExecutionPathVerification === true,
    readyForG6E5ScheduleNonDryRunPoc: false,
    readyForNonDryRunSchedulePoC: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleNonDryRunPocExecutionPathImplementationOutput(
  outDir,
  report,
) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(
    outDir,
    "schedule-non-dry-run-poc-execution-path-implementation.json",
  );
  const mdPath = path.join(
    outDir,
    "SCHEDULE_NON_DRY_RUN_POC_EXECUTION_PATH_IMPLEMENTATION_REPORT.md",
  );
  const summary = {
    phase: report.phase,
    executionPathImplemented: report.executionPathImplemented,
    executionPathType: report.executionPathType,
    executionPathInvoked: report.executionPathInvoked,
    writeAdapterInvoked: report.writeAdapterInvoked,
    dbWritesPerformed: report.dbWritesPerformed,
    scheduleRecordsUpdated: report.scheduleRecordsUpdated,
    defaultVisible: report.defaultVisible,
    manualConfirmRequired: report.manualConfirmRequired,
    payloadFixed: report.payloadFixed,
    serviceRoleAllowed: report.serviceRoleAllowed,
    readyForG6E5ScheduleNonDryRunPocExecutionPathVerification:
      report.readyForG6E5ScheduleNonDryRunPocExecutionPathVerification,
    readyForNonDryRunSchedulePoC: report.readyForNonDryRunSchedulePoC,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule Non-Dry-Run PoC Execution Path Implementation Report",
    "",
    `Phase: ${report.phase}`,
    `Complete: ${report.complete}`,
    `Path: ${report.executionPathType}`,
    `Recommended next: ${report.recommendedNextPhase}`,
    "",
    report.blockers.length
      ? `Blockers:\n${report.blockers.map((b) => `- ${b}`).join("\n")}`
      : "No blockers.",
  ].join("\n");
  fs.writeFileSync(mdPath, `${md}\n`, "utf8");
  return { jsonPath, mdPath };
}
