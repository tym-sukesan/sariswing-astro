/**
 * G-6-e-planning-schedule-cms — Reporter (docs/config scan only; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

const DOC_REL = "docs/schedule-cms-planning.md";
const CONFIG_REL = "config/admin/schedule-cms-planning.json";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Product goal",
  "## 3. Sariswing reference pattern",
  "## 4. MVP feature scope",
  "## 5. Proposed fields",
  "## 6. Data model options",
  "## 7. Admin UI planning",
  "## 8. Public site display planning",
  "## 9. Migration/import planning",
  "## 10. Write safety plan",
  "## 11. RLS / GRANT considerations",
  "## 12. updated_by plan",
  "## 13. Dry-run result model",
  "## 14. Non-dry-run PoC plan",
  "## 15. G-6-e implementation gate",
  "## 16. Recommended implementation sequence",
  "## 17. Final safety statement",
];

const FORBIDDEN_IN_REPORTER = [
  /service_role/i,
  /SERVICE_ROLE/,
  /createClient\s*\(/,
  /@supabase\/supabase-js/,
  /upsert\s*\(/,
  /delete\s*\(/,
  /rpc\s*\(/,
  /workflow_dispatch/,
  /lftp/i,
  /\bftp\b/i,
  /storage\./,
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

export function runScheduleCmsPlanningReport({
  toolRoot = DEFAULT_TOOL_ROOT,
  siteId = "default",
}) {
  const blockers = [];
  const docPath = path.join(toolRoot, DOC_REL);
  const configPath = path.join(toolRoot, CONFIG_REL);

  if (!fs.existsSync(docPath)) blockers.push("doc-missing");
  if (!fs.existsSync(configPath)) blockers.push("config-missing");

  const doc = fs.existsSync(docPath) ? fs.readFileSync(docPath, "utf8") : "";
  for (const s of REQUIRED_SECTIONS) {
    if (!doc.includes(s)) blockers.push(`doc-missing:${s}`);
  }

  if (!doc.includes("planning only")) blockers.push("planning-only-marker-missing");
  if (!doc.includes("sariswing-schedule-cms") && !doc.includes("Sariswing")) {
    blockers.push("sariswing-reference-missing");
  }
  if (!doc.includes("G-6-e1-schedule-schema-read-audit")) {
    blockers.push("next-phase-missing");
  }
  if (!doc.includes("no delete in first implementation")) {
    blockers.push("delete-safety-missing");
  }
  if (!doc.includes("dry-run first")) blockers.push("dry-run-safety-missing");

  const reportPath = path.join(toolRoot, "scripts/report-schedule-cms-planning.mjs");
  const scan = scanReporter(reportPath);
  if (!scan.clean) blockers.push(`reporter-unsafe:${scan.hits.join(",")}`);

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.planningOnly !== true) blockers.push("config-planningOnly");
  if (config.targetModule !== "schedule") blockers.push("config-targetModule");
  if (config.dbWritesPerformed !== false) blockers.push("config-dbWritesPerformed");
  if (config.schemaChangesPerformed !== false) {
    blockers.push("config-schemaChangesPerformed");
  }
  if (config.writeAdaptersImplemented !== false) {
    blockers.push("config-writeAdaptersImplemented");
  }
  if (config.readyForG6EImplementation !== false) {
    blockers.push("config-readyForG6EImplementation");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e-planning-schedule-cms",
    siteId,
    generatedAt: new Date().toISOString(),
    planningOnly: true,
    targetModule: "schedule",
    derivedFrom: config.derivedFrom,
    dbWritesPerformed: false,
    schemaChangesPerformed: false,
    writeAdaptersImplemented: false,
    productionDataTouched: false,
    adminRouteConnected: false,
    readyForG6EPlanning: complete && config.readyForG6EPlanning === true,
    readyForG6EImplementation: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleCmsPlanningOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "schedule-cms-planning.json");
  const mdPath = path.join(outDir, "SCHEDULE_CMS_PLANNING_REPORT.md");
  const summary = {
    phase: report.phase,
    planningOnly: report.planningOnly,
    targetModule: report.targetModule,
    derivedFrom: report.derivedFrom,
    dbWritesPerformed: report.dbWritesPerformed,
    schemaChangesPerformed: report.schemaChangesPerformed,
    writeAdaptersImplemented: report.writeAdaptersImplemented,
    readyForG6EPlanning: report.readyForG6EPlanning,
    readyForG6EImplementation: report.readyForG6EImplementation,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule CMS Planning Report",
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
