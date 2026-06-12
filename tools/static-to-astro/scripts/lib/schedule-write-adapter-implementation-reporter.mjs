/**
 * G-6-e4-schedule-write-adapter-implementation — Reporter (static scan; no DB access).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
const REPO_ROOT = path.resolve(__dirname, "../../../..");

const DOC_REL = "docs/schedule-write-adapter-implementation.md";
const CONFIG_REL = "config/admin/schedule-write-adapter-implementation.json";
const WRITE_ADAPTER_REL = "src/lib/admin/staging-write/schedule-write-adapter.ts";
const DRY_RUN_ADAPTER_REL = "src/lib/admin/staging-write/schedule-dry-run-adapter.ts";
const STAGING_WRITE_DIR = "src/lib/admin/staging-write";

const REQUIRED_SECTIONS = [
  "## 1. Purpose",
  "## 2. Implemented files",
  "## 3. Adapter responsibilities",
  "## 4. Separation from dry-run adapter",
  "## 5. Supabase `.update()` boundary",
  "## 6. UI policy",
  "## 7. Invocation status",
  "## 8. Safety verification steps",
  "## 9. Gate decision",
  "## 10. Recommended next phase",
  "## 11. Final safety statement",
];

const FORBIDDEN_IN_DRY_RUN_ADAPTER = [
  /\.update\s*\(/,
  /\.insert\s*\(/,
  /\.delete\s*\(/,
  /\.upsert\s*\(/,
  /@supabase\/supabase-js/,
  /createClient\s*\(/,
];

const FORBIDDEN_IN_WRITE_ADAPTER = [
  /\.insert\s*\(/,
  /\.delete\s*\(/,
  /\.upsert\s*\(/,
  /rpc\s*\(/,
  /service_role/i,
  /SERVICE_ROLE/,
  /runScheduleWrite/,
];

function scanFile(filePath, patterns) {
  if (!fs.existsSync(filePath)) return { clean: false, hits: ["missing"] };
  const hits = [];
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const t = line.trim();
    if (t.startsWith("//") || t.startsWith("*")) continue;
    for (const p of patterns) {
      if (p.test(line)) hits.push(p.source);
    }
  }
  return { clean: hits.length === 0, hits: [...new Set(hits)] };
}

function findUpdateCallSites(dir) {
  const sites = [];
  if (!fs.existsSync(dir)) return sites;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".ts")) continue;
    const filePath = path.join(dir, name);
    const rel = path.relative(REPO_ROOT, filePath);
    const lines = fs.readFileSync(filePath, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (/\.update\s*\(/.test(line)) {
        sites.push(`${rel}:${i + 1}`);
      }
    });
  }
  return sites;
}

function walkSourceFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkSourceFiles(p, out);
    else if (/\.(ts|astro|tsx)$/.test(ent.name)) out.push(p);
  }
  return out;
}

function grepUpdateScheduleWriteImports(repoRoot) {
  const hits = [];
  const searchRoots = [
    path.join(repoRoot, "src/lib"),
    path.join(repoRoot, "src/pages"),
  ];
  for (const root of searchRoots) {
    for (const filePath of walkSourceFiles(root)) {
      if (filePath.endsWith("schedule-write-adapter.ts")) continue;
      const src = fs.readFileSync(filePath, "utf8");
      if (src.includes("updateScheduleWrite")) {
        hits.push(path.relative(repoRoot, filePath));
      }
    }
  }
  return hits;
}

export function runScheduleWriteAdapterImplementationReport({
  toolRoot = DEFAULT_TOOL_ROOT,
  repoRoot = REPO_ROOT,
  siteId = "default",
}) {
  const blockers = [];
  const docPath = path.join(toolRoot, DOC_REL);
  const configPath = path.join(toolRoot, CONFIG_REL);
  const writeAdapterPath = path.join(repoRoot, WRITE_ADAPTER_REL);
  const dryRunAdapterPath = path.join(repoRoot, DRY_RUN_ADAPTER_REL);
  const stagingWriteDir = path.join(repoRoot, STAGING_WRITE_DIR);

  if (!fs.existsSync(docPath)) blockers.push("doc-missing");
  if (!fs.existsSync(configPath)) blockers.push("config-missing");
  if (!fs.existsSync(writeAdapterPath)) blockers.push("write-adapter-missing");
  if (!fs.existsSync(path.join(repoRoot, "src/lib/admin/staging-write/schedule-write-guards.ts"))) {
    blockers.push("write-guards-missing");
  }
  if (!fs.existsSync(path.join(repoRoot, "src/lib/admin/staging-write/schedule-write-types.ts"))) {
    blockers.push("write-types-missing");
  }

  const doc = fs.existsSync(docPath) ? fs.readFileSync(docPath, "utf8") : "";
  for (const s of REQUIRED_SECTIONS) {
    if (!doc.includes(s)) blockers.push(`doc-missing:${s}`);
  }
  if (!doc.includes("updateScheduleWrite")) blockers.push("adapter-function-missing-in-doc");
  if (!doc.includes("writeAdapterInvoked: false")) blockers.push("invocation-status-missing");

  const dryRunScan = scanFile(dryRunAdapterPath, FORBIDDEN_IN_DRY_RUN_ADAPTER);
  if (!dryRunScan.clean) blockers.push(`dry-run-adapter-unsafe:${dryRunScan.hits.join(",")}`);

  const writeScan = scanFile(writeAdapterPath, FORBIDDEN_IN_WRITE_ADAPTER);
  if (!writeScan.clean) blockers.push(`write-adapter-unsafe:${writeScan.hits.join(",")}`);

  const writeSrc = fs.readFileSync(writeAdapterPath, "utf8");
  if (!writeSrc.includes("export async function updateScheduleWrite")) {
    blockers.push("updateScheduleWrite-missing");
  }
  if (!writeSrc.includes(".update(")) blockers.push("update-call-missing");
  if (
    !writeSrc.includes("SCHEDULE_WRITE_APPROVAL_ID") &&
    !writeSrc.includes("G-6-e5-schedule-non-dry-run-poc")
  ) {
    blockers.push("approval-id-missing");
  }

  const updateSites = findUpdateCallSites(stagingWriteDir);
  const scheduleUpdateSites = updateSites.filter((s) =>
    s.startsWith(`${STAGING_WRITE_DIR}/schedule-write-adapter.ts`),
  );
  const profileUpdateSites = updateSites.filter((s) =>
    s.includes("profile-update-poc-adapter.ts"),
  );
  const unexpectedUpdate = updateSites.filter(
    (s) =>
      !s.includes("schedule-write-adapter.ts") &&
      !s.includes("profile-update-poc-adapter.ts"),
  );
  if (scheduleUpdateSites.length === 0) blockers.push("schedule-update-not-in-write-adapter");
  if (unexpectedUpdate.length > 0) {
    blockers.push(`unexpected-update:${unexpectedUpdate.join(",")}`);
  }

  const uiImports = grepUpdateScheduleWriteImports(repoRoot);
  if (uiImports.length > 0) blockers.push(`ui-imports-write-adapter:${uiImports.join(",")}`);

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.writeAdapterImplemented !== true) blockers.push("config-writeAdapterImplemented");
  if (config.writeAdapterInvoked !== false) blockers.push("config-writeAdapterInvoked");
  if (config.dbWritesPerformed !== false) blockers.push("config-dbWritesPerformed");
  if (config.uiConnected !== false) blockers.push("config-uiConnected");
  if (config.nonDryRunUiExposed !== false) blockers.push("config-nonDryRunUiExposed");
  if (config.insertImplemented !== false) blockers.push("config-insertImplemented");
  if (config.deleteImplemented !== false) blockers.push("config-deleteImplemented");
  if (config.upsertImplemented !== false) blockers.push("config-upsertImplemented");
  if (config.readyForG6E4ScheduleWriteAdapterVerification !== true) {
    blockers.push("config-readyForG6E4ScheduleWriteAdapterVerification");
  }
  if (config.readyForNonDryRunSchedulePoC !== false) {
    blockers.push("config-readyForNonDryRunSchedulePoC");
  }

  const complete = blockers.length === 0;

  return {
    phase: "G-6-e4-schedule-write-adapter-implementation",
    siteId,
    generatedAt: new Date().toISOString(),
    targetModule: "schedule",
    operation: config.operation,
    writeAdapterImplemented: config.writeAdapterImplemented === true,
    writeAdapterInvoked: false,
    dbWritesPerformed: false,
    scheduleRecordsUpdated: false,
    uiConnected: false,
    nonDryRunUiExposed: false,
    updateOnly: config.operation === "update_only",
    insertImplemented: false,
    deleteImplemented: false,
    upsertImplemented: false,
    scheduleMonthsTouched: false,
    scheduleUpdateSites,
    profileUpdateSites,
    readyForG6E4ScheduleWriteAdapterVerification:
      complete && config.readyForG6E4ScheduleWriteAdapterVerification === true,
    readyForG6EWriteImplementation: false,
    readyForNonDryRunSchedulePoC: false,
    recommendedNextPhase: config.recommendedNextPhase,
    blockers,
    complete,
  };
}

export function writeScheduleWriteAdapterImplementationOutput(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "schedule-write-adapter-implementation.json");
  const mdPath = path.join(outDir, "SCHEDULE_WRITE_ADAPTER_IMPLEMENTATION_REPORT.md");
  const summary = {
    phase: report.phase,
    writeAdapterImplemented: report.writeAdapterImplemented,
    writeAdapterInvoked: report.writeAdapterInvoked,
    dbWritesPerformed: report.dbWritesPerformed,
    scheduleRecordsUpdated: report.scheduleRecordsUpdated,
    uiConnected: report.uiConnected,
    nonDryRunUiExposed: report.nonDryRunUiExposed,
    updateOnly: report.updateOnly,
    insertImplemented: report.insertImplemented,
    deleteImplemented: report.deleteImplemented,
    upsertImplemented: report.upsertImplemented,
    scheduleMonthsTouched: report.scheduleMonthsTouched,
    readyForG6E4ScheduleWriteAdapterVerification:
      report.readyForG6E4ScheduleWriteAdapterVerification,
    readyForNonDryRunSchedulePoC: report.readyForNonDryRunSchedulePoC,
    recommendedNextPhase: report.recommendedNextPhase,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const md = [
    "# Schedule Write Adapter Implementation Report",
    "",
    `Phase: ${report.phase}`,
    `Complete: ${report.complete}`,
    `Schedule .update() sites: ${report.scheduleUpdateSites?.join(", ") || "none"}`,
    `Recommended next: ${report.recommendedNextPhase}`,
    "",
    report.blockers.length
      ? `Blockers:\n${report.blockers.map((b) => `- ${b}`).join("\n")}`
      : "No blockers.",
  ].join("\n");
  fs.writeFileSync(mdPath, `${md}\n`, "utf8");
  return { jsonPath, mdPath };
}
