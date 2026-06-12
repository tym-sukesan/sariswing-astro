/**
 * G-6-e3-schedule-dry-run-adapter-implementation — Reporter (docs/config scan only; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
const REPO_ROOT = path.resolve(__dirname, "../../../..");

const DOC_REL = "docs/schedule-dry-run-adapter-implementation.md";
const CONFIG_REL = "config/admin/schedule-dry-run-adapter-implementation.json";
const ADAPTER_REL = "src/lib/admin/staging-write/schedule-dry-run-adapter.ts";
const UI_REL = "src/lib/admin/staging-write/staging-schedule-dry-run-ui.ts";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Implemented files",
  "## 3. Adapter responsibilities",
  "## 4. Update dry-run result behavior",
  "## 5. Duplicate dry-run result behavior",
  "## 6. actualWrite:false enforcement",
  "## 7. No DB client guarantee",
  "## 8. UI integration summary",
  "## 9. Safety verification steps",
  "## 10. Remaining gaps",
  "## 11. Recommended next phase",
];

const FORBIDDEN_IN_ADAPTER = [
  /@supabase\/supabase-js/,
  /createClient\s*\(/,
  /SERVICE_ROLE/i,
  /service_role/i,
  /PUBLIC_SUPABASE/,
  /\.update\s*\(/,
  /\.insert\s*\(/,
  /\.delete\s*\(/,
  /\.upsert\s*\(/,
];

function scanFile(filePath, patterns) {
  if (!fs.existsSync(filePath)) return { clean: false, hits: ["missing"] };
  const hits = [];
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    for (const p of patterns) {
      if (p.test(line)) hits.push(p.source);
    }
  }
  return { clean: hits.length === 0, hits: [...new Set(hits)] };
}

export function runScheduleDryRunAdapterImplementationReport({
  toolRoot = DEFAULT_TOOL_ROOT,
  repoRoot = REPO_ROOT,
  siteId = "default",
}) {
  const blockers = [];
  const docPath = path.join(toolRoot, DOC_REL);
  const configPath = path.join(toolRoot, CONFIG_REL);
  const adapterPath = path.join(repoRoot, ADAPTER_REL);
  const uiPath = path.join(repoRoot, UI_REL);
  const guardsPath = path.join(repoRoot, "src/lib/admin/staging-write/schedule-dry-run-guards.ts");

  if (!fs.existsSync(docPath)) blockers.push("doc-missing");
  if (!fs.existsSync(configPath)) blockers.push("config-missing");
  if (!fs.existsSync(adapterPath)) blockers.push("adapter-missing");
  if (!fs.existsSync(guardsPath)) blockers.push("guards-missing");

  const doc = fs.existsSync(docPath) ? fs.readFileSync(docPath, "utf8") : "";
  for (const s of REQUIRED_SECTIONS) {
    if (!doc.includes(s)) blockers.push(`doc-missing:${s}`);
  }
  if (!doc.includes("No schedule records are written")) blockers.push("safety-statement-missing");

  const adapterScan = scanFile(adapterPath, FORBIDDEN_IN_ADAPTER);
  if (!adapterScan.clean) blockers.push(`adapter-unsafe:${adapterScan.hits.join(",")}`);

  const uiSrc = fs.existsSync(uiPath) ? fs.readFileSync(uiPath, "utf8") : "";
  if (!uiSrc.includes("buildScheduleUpdateDryRunResult")) {
    blockers.push("ui-not-routed-through-adapter");
  }
  if (uiSrc.includes("buildUpdateDryRunResult(")) {
    blockers.push("ui-still-uses-legacy-payload-builder");
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.adapterImplemented !== true) blockers.push("config-adapterImplemented");
  if (config.dryRunOnly !== true) blockers.push("config-dryRunOnly");
  if (config.actualWriteHardCodedFalse !== true) {
    blockers.push("config-actualWriteHardCodedFalse");
  }
  if (config.acceptsDbClient !== false) blockers.push("config-acceptsDbClient");
  if (config.acceptsDryRunModeFlag !== false) {
    blockers.push("config-acceptsDryRunModeFlag");
  }
  if (config.uiRoutedThroughAdapter !== true) blockers.push("config-uiRoutedThroughAdapter");
  if (config.writeAdaptersImplemented !== false) {
    blockers.push("config-writeAdaptersImplemented");
  }
  if (config.dbWritesPerformed !== false) blockers.push("config-dbWritesPerformed");
  if (config.readyForG6E3ScheduleDryRunAdapterVerification !== true) {
    blockers.push("config-readyForG6E3ScheduleDryRunAdapterVerification");
  }
  if (config.readyForG6EWriteImplementation !== false) {
    blockers.push("config-readyForG6EWriteImplementation");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e3-schedule-dry-run-adapter-implementation",
    siteId,
    generatedAt: new Date().toISOString(),
    dryRunOnly: true,
    targetModule: "schedule",
    adapterImplemented: config.adapterImplemented === true,
    adapterBoundary: config.adapterBoundary,
    actualWriteHardCodedFalse: config.actualWriteHardCodedFalse === true,
    acceptsDbClient: config.acceptsDbClient === false ? false : true,
    acceptsDryRunModeFlag: config.acceptsDryRunModeFlag === false ? false : true,
    uiRoutedThroughAdapter: config.uiRoutedThroughAdapter === true,
    writeAdaptersImplemented: false,
    dbWritesPerformed: false,
    readyForG6E3ScheduleDryRunAdapterVerification:
      complete && config.readyForG6E3ScheduleDryRunAdapterVerification === true,
    readyForG6EWriteImplementation: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleDryRunAdapterImplementationOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "schedule-dry-run-adapter-implementation.json");
  const mdPath = path.join(outDir, "SCHEDULE_DRY_RUN_ADAPTER_IMPLEMENTATION_REPORT.md");
  const summary = {
    phase: report.phase,
    dryRunOnly: report.dryRunOnly,
    targetModule: report.targetModule,
    adapterImplemented: report.adapterImplemented,
    adapterBoundary: report.adapterBoundary,
    actualWriteHardCodedFalse: report.actualWriteHardCodedFalse,
    acceptsDbClient: report.acceptsDbClient,
    acceptsDryRunModeFlag: report.acceptsDryRunModeFlag,
    uiRoutedThroughAdapter: report.uiRoutedThroughAdapter,
    writeAdaptersImplemented: report.writeAdaptersImplemented,
    dbWritesPerformed: report.dbWritesPerformed,
    readyForG6E3ScheduleDryRunAdapterVerification:
      report.readyForG6E3ScheduleDryRunAdapterVerification,
    readyForG6EWriteImplementation: report.readyForG6EWriteImplementation,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule Dry-run Adapter Implementation Report",
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
