/**
 * G-23l — Onboarding report writer.
 * Writes local review artifacts under output/onboarding-reports/ only.
 * No network / DB / package / FTP.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "../..");

export const REPORTS_ROOT_REL = "output/onboarding-reports";
export const REPORT_FILES = [
  "summary.json",
  "seeds-preview.json",
  "human-review.md",
  "risk-summary.md",
];

const SAFE_SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

/**
 * @param {string} toolRoot
 */
export function resolveReportsRoot(toolRoot = TOOL_ROOT) {
  return path.resolve(toolRoot, REPORTS_ROOT_REL);
}

/**
 * @param {string} siteSlug
 */
function assertSafeSiteSlug(siteSlug) {
  if (!siteSlug || typeof siteSlug !== "string") {
    throw new Error("siteSlug is required for report output");
  }
  if (!SAFE_SLUG_RE.test(siteSlug)) {
    throw new Error(`unsafe siteSlug: ${siteSlug}`);
  }
  if (siteSlug.includes("..") || siteSlug.includes("/") || siteSlug.includes("\\")) {
    throw new Error(`path traversal in siteSlug: ${siteSlug}`);
  }
}

/**
 * @param {string} candidatePath
 * @param {string} reportsRoot
 */
export function assertReportPathAllowed(candidatePath, reportsRoot = resolveReportsRoot()) {
  const normalized = path.resolve(candidatePath);
  const root = path.resolve(reportsRoot);
  const rootWithSep = root.endsWith(path.sep) ? root : `${root}${path.sep}`;

  if (normalized !== root && !normalized.startsWith(rootWithSep)) {
    throw new Error(
      `report path must be under ${REPORTS_ROOT_REL}/ — rejected: ${candidatePath}`,
    );
  }

  const relative = path.relative(root, normalized);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`path traversal rejected: ${candidatePath}`);
  }

  return normalized;
}

/**
 * @param {string} siteSlug
 * @param {object} [options]
 * @param {string} [options.toolRoot]
 * @param {string} [options.reportOut] explicit directory (must still be under reports root)
 * @param {boolean} [options.useLatest=true] write to {siteSlug}/latest/
 */
export function resolveOnboardingReportDir(siteSlug, options = {}) {
  const { toolRoot = TOOL_ROOT, reportOut = null, useLatest = true } = options;
  assertSafeSiteSlug(siteSlug);

  const reportsRoot = resolveReportsRoot(toolRoot);

  let targetDir;
  if (reportOut) {
    targetDir = assertReportPathAllowed(reportOut, reportsRoot);
  } else if (useLatest) {
    targetDir = path.join(reportsRoot, siteSlug, "latest");
  } else {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    targetDir = path.join(reportsRoot, siteSlug, stamp);
  }

  return assertReportPathAllowed(targetDir, reportsRoot);
}

/**
 * @param {object} result orchestrator result
 */
export function buildSummaryJson(result) {
  const generatedAt = new Date().toISOString();

  return {
    schemaVersion: "1.0",
    phase: "G-23m-sample-full-dry-run-report-artifact-review",
    generatedAt,
    mode: result.mode ?? null,
    siteSlug: result.siteSlug ?? null,
    cmsPreset: result.cmsPreset ?? null,
    overall: result.status ?? null,
    ok: result.ok ?? false,
    reviewReady: true,
    reportArtifacts: ["summary.json", "seeds-preview.json", "human-review.md", "risk-summary.md"],
    validation: {
      config: result.validation?.config?.status ?? null,
      registry: result.validation?.registry?.status ?? null,
    },
    safetyGates: {
      status: result.safetyGates?.status ?? null,
      planOnly: result.safetyGates?.planOnly ?? null,
      rows: result.safetyGates?.rows ?? [],
    },
    steps: (result.steps ?? []).map((s) => ({
      id: s.id,
      label: s.label,
      status: s.status,
      summary: s.summary,
    })),
    seedCounts: result.moduleCandidateCounts ?? {},
    totalActiveCandidates: result.totalActiveCandidates ?? 0,
    warnings: result.warnings ?? [],
    riskSummary: result.riskSummary ?? null,
    nextRecommendedPhase: result.nextRecommendedPhase ?? null,
    operationsNotExecuted: {
      liveCrawl: false,
      networkAccess: false,
      dbConnection: false,
      dbWrite: false,
      sqlMutation: false,
      packageBuild: false,
      astroBuild: false,
      ftpUpload: false,
      deploy: false,
    },
    fixtureLoad: result.fixtureLoad
      ? {
          pagesCount: result.fixtureLoad.pagesCount,
          assetsCount: result.fixtureLoad.assetsCount,
          fixtureOnly: result.fixtureLoad.fixtureOnly,
          liveCrawl: result.fixtureLoad.liveCrawl,
        }
      : null,
    dbPlan: result.dbPlan ? { status: result.dbPlan.status, planOnly: result.dbPlan.planOnly } : null,
    packagePlan: result.packagePlan
      ? { status: result.packagePlan.status, planOnly: result.packagePlan.planOnly }
      : null,
    uploadPlan: result.uploadPlan
      ? { status: result.uploadPlan.status, planOnly: result.uploadPlan.planOnly }
      : null,
  };
}

/**
 * @param {object} result
 */
export function buildSeedsPreviewJson(result) {
  const extraction = result.seedExtractionFull ?? result.seedExtraction ?? {};
  const modules = extraction.modules ?? {};

  /** @type {Record<string, unknown>} */
  const byModule = {};

  for (const [moduleId, mod] of Object.entries(modules)) {
    byModule[moduleId] = {
      enabled: mod.enabled,
      status: mod.status,
      candidateCount: (mod.candidates ?? []).filter(
        (c) => c.status === "candidate" || c.status === "warn",
      ).length,
      candidates: (mod.candidates ?? []).map((c) => ({
        moduleId: c.moduleId,
        sourceRoute: c.sourceRoute,
        title: c.title ?? c.label ?? null,
        status: c.status,
        confidence: c.confidence,
        published: c.published,
        reviewOnly: true,
        approvedForDbInsert: false,
        raw: c.raw,
        normalized: c.normalized,
        warnings: c.warnings ?? [],
      })),
      errors: mod.errors ?? [],
      warnings: mod.warnings ?? [],
    };
  }

  return {
    schemaVersion: "1.0",
    phase: "G-23m-sample-full-dry-run-report-artifact-review",
    generatedAt: new Date().toISOString(),
    siteSlug: result.siteSlug ?? null,
    cmsPreset: result.cmsPreset ?? null,
    reviewOnly: true,
    notDbSql: true,
    doNotExecuteAsSql: true,
    disclaimer:
      "Review preview only — NOT executable SQL. NOT approved for DB insert. Human review required before any staging DB write.",
    seedCounts: result.moduleCandidateCounts ?? {},
    totalActiveCandidates: result.totalActiveCandidates ?? 0,
    byModule,
    extractionStatus: extraction.status ?? null,
    extractionWarnings: extraction.warnings ?? [],
    extractionErrors: extraction.errors ?? [],
  };
}

/**
 * @param {object} result
 */
export function buildHumanReviewMarkdown(result) {
  const lines = [
    "# Onboarding dry-run — human review checklist",
    "",
    "> **For operators:** Review this file first, then open `seeds-preview.json` for candidate details.",
    "",
    `**Generated:** ${new Date().toISOString()}`,
    `**Mode:** ${result.mode ?? "unknown"}`,
    `**Site:** ${result.siteSlug ?? "unknown"}`,
    `**Preset:** ${result.cmsPreset ?? "unknown"}`,
    `**Overall:** ${result.status ?? "unknown"}`,
    "",
    "## What to review first",
    "",
    "1. **Warnings** (below) — resolve or accept before any write phase",
    "2. **`seeds-preview.json`** — verify schedule/news/profile/discography/video/contact candidates",
    "3. **Plan-only steps** — confirm DB / package / upload were NOT executed",
    "4. **`risk-summary.md`** — confirm blocked operations before live crawl",
    "",
    "## Operator checklist",
    "",
    "- [ ] Config validation PASS (Step 0)",
    "- [ ] Fixture source is non-network (`fixtureOnly=true`, `liveCrawl=false`)",
    "- [ ] Seed candidate counts look reasonable (see below)",
    "- [ ] All warnings reviewed and understood",
    "- [ ] `seeds-preview.json` reviewed — candidates are **not** approved for DB insert",
    "- [ ] Safety gates confirmed (`allowDbWrite=false`, `allowFtpUpload=false`)",
    "- [ ] Ready to plan G-23n allowlist (do **not** skip to live crawl)",
    "",
    "## 30-minute flow result",
    "",
    "| Step | Status | Summary |",
    "| --- | --- | --- |",
  ];

  for (const step of result.steps ?? []) {
    const summary = (step.summary ?? "").replace(/\|/g, "\\|").slice(0, 120);
    lines.push(`| ${step.label} | ${step.status} | ${summary} |`);
  }

  lines.push(
    "",
    "## Plan-only steps (no execution)",
    "",
    `- **DB planOnly:** ${result.dbPlan?.planOnly === true ? "yes" : "no"} — allowDbWrite=${result.dbPlan?.allowDbWrite === true}`,
    `- **package planOnly:** ${result.packagePlan?.planOnly === true ? "yes" : "no"} — allowPackageBuild=${result.packagePlan?.allowPackageBuild === true}`,
    `- **upload planOnly:** ${result.uploadPlan?.planOnly === true ? "yes" : "no"} — allowFtpUpload=${result.uploadPlan?.allowFtpUpload === true}`,
    "",
    "## Seed candidate counts",
    "",
  );

  for (const [modId, count] of Object.entries(result.moduleCandidateCounts ?? {})) {
    lines.push(`- ${modId}: **${count}**`);
  }
  lines.push(`- **total:** ${result.totalActiveCandidates ?? 0}`);

  lines.push("", "## Warnings", "");
  if ((result.warnings ?? []).length === 0) {
    lines.push("_None_");
  } else {
    for (const w of result.warnings) {
      lines.push(`- [${w.severity}] **${w.code}:** ${w.message}`);
    }
  }

  lines.push(
    "",
    "## Conditions to proceed",
    "",
    "Proceed to **G-23n live crawl allowlist config** only when:",
    "",
    "1. All warnings reviewed — unmapped modules documented or accepted",
    "2. Safety gates remain safe (`allowDbWrite=false`, `allowFtpUpload=false`)",
    "3. `seeds-preview.json` reviewed — candidates explicitly **not** approved for DB insert",
    "4. Operator understands this was a **fixture-only** dry-run (no live crawl yet)",
    "",
    "## Do NOT proceed if",
    "",
    "- Any safety gate shows `allowDbWrite=true` or `allowFtpUpload=true` without approval",
    "- Warnings are unresolved and affect enabled CMS modules",
    "- Seeds were assumed ready for DB insert without human review",
    "- Live crawl is requested without G-23n allowlist + G-23o operator approval",
    "- DB write / package build / FTP is requested without separate explicit approval",
    "",
    "## Approval required before live crawl",
    "",
    "Live crawl (G-23o+) requires:",
    "",
    "1. G-23n allowlist config completed",
    "2. Registered `explicitCrawlApprovalId`",
    "3. Operator approval: `承認します。この操作を1回だけ実行してください。`",
    "",
    `**Next recommended phase:** ${result.nextRecommendedPhase ?? "TBD"}`,
    "",
  );

  return `${lines.join("\n")}\n`;
}

/**
 * @param {object} result
 */
export function buildRiskSummaryMarkdown(result) {
  const gates = result.safetyGates?.rows ?? [];
  const lines = [
    "# Onboarding dry-run — risk summary",
    "",
    `**Generated:** ${new Date().toISOString()}`,
    `**Overall risk:** ${result.riskSummary?.overallRisk ?? "unknown"}`,
    `**Warning count:** ${result.riskSummary?.warningCount ?? 0}`,
    "",
    "## Operations NOT executed",
    "",
    "| Operation | Executed |",
    "| --- | --- |",
    "| 実クロール (live crawl) | **no** |",
    "| Network access | **no** |",
    "| DB connection | **no** |",
    "| DB write | **no** |",
    "| SQL mutation | **no** |",
    "| Package build | **no** |",
    "| Astro build | **no** |",
    "| FTP / upload | **no** |",
    "| Deploy | **no** |",
    "",
    "## Safety gates",
    "",
    "| Gate | Value | Status |",
    "| --- | --- | --- |",
  ];

  for (const row of gates) {
    lines.push(`| ${row.key} | ${JSON.stringify(row.value)} | ${row.status} |`);
  }

  lines.push(
    "",
    "## Plan-only enforcement",
    "",
    `- staging DB: **planOnly** (${result.safetyGates?.planOnly?.stagingDb === true ? "active" : "inactive"})`,
    `- package: **planOnly** (${result.safetyGates?.planOnly?.package === true ? "active" : "inactive"})`,
    `- upload: **planOnly** (${result.safetyGates?.planOnly?.upload === true ? "active" : "inactive"})`,
    "",
    "## Blocked operations",
    "",
    "| Operation | Blocked | Notes |",
    "| --- | --- | --- |",
    "| Live crawl (実クロール) | **yes** | Fixture-only dry-run |",
    "| Network access | **yes** | No HTTP requests |",
    "| DB connection / write | **yes** | planOnly — human approval required |",
    "| SQL mutation | **yes** | No INSERT/UPDATE/DELETE |",
    "| Package / Astro build | **yes** | planOnly |",
    "| FTP / upload / deploy | **yes** | planOnly |",
    "| service_role | **yes** | Not used |",
    "| Production Supabase ref | **yes** | `vsbvndwuajjhnzpohghh` not used as active target |",
    "| Destructive ops (mirror --delete) | **yes** | Blocked by safety gates |",
    "",
    "## Risk increases in next phases",
    "",
    "| Phase | New risk | Mitigation |",
    "| --- | --- | --- |",
    "| G-23n allowlist config | Misconfigured crawl targets | Denylist + staging/production separation |",
    "| G-23o crawl-dry-run | Network access, read-only HTTP | explicitCrawlApprovalId + sameOriginOnly + maxPages |",
    "| Future DB seed apply | Staging DB write | Separate approval ID per slice |",
    "| Future package/FTP | Build + upload | planOnly until explicit operator approval |",
    "",
    "## Notes",
    "",
  );

  for (const note of result.riskSummary?.notes ?? []) {
    lines.push(`- ${note}`);
  }

  if ((result.riskSummary?.warnSteps ?? []).length > 0) {
    lines.push("", "## Steps with WARN status", "");
    for (const label of result.riskSummary.warnSteps) {
      lines.push(`- ${label}`);
    }
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

/**
 * @param {object} result orchestrator result
 * @param {object} [options]
 * @param {string} [options.toolRoot]
 * @param {string} [options.reportOut]
 * @param {boolean} [options.useLatest=true]
 * @param {boolean} [options.summaryOnly=false] validate-only may write summary only
 */
export function writeOnboardingReport(result, options = {}) {
  const {
    toolRoot = TOOL_ROOT,
    reportOut = null,
    useLatest = true,
    summaryOnly = false,
  } = options;

  const siteSlug = result.siteSlug;
  if (!siteSlug) {
    return {
      ok: false,
      error: "cannot write report without siteSlug in orchestrator result",
      reportDir: null,
      files: [],
    };
  }

  const reportDir = resolveOnboardingReportDir(siteSlug, { toolRoot, reportOut, useLatest });
  fs.mkdirSync(reportDir, { recursive: true });

  const filesWritten = [];

  const writeJson = (name, data) => {
    const filePath = path.join(reportDir, name);
    assertReportPathAllowed(filePath, resolveReportsRoot(toolRoot));
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    filesWritten.push(filePath);
  };

  const writeMd = (name, content) => {
    const filePath = path.join(reportDir, name);
    assertReportPathAllowed(filePath, resolveReportsRoot(toolRoot));
    fs.writeFileSync(filePath, content, "utf8");
    filesWritten.push(filePath);
  };

  writeJson("summary.json", buildSummaryJson(result));

  if (!summaryOnly) {
    writeJson("seeds-preview.json", buildSeedsPreviewJson(result));
    writeMd("human-review.md", buildHumanReviewMarkdown(result));
    writeMd("risk-summary.md", buildRiskSummaryMarkdown(result));
  }

  return {
    ok: true,
    reportDir,
    files: filesWritten,
    filesCreated: filesWritten.length,
    strategy: useLatest && !reportOut ? "latest-overwrite" : reportOut ? "explicit-path" : "timestamped",
  };
}
