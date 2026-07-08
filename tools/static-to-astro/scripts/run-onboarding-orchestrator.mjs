/**
 * G-23h — Onboarding orchestrator skeleton.
 * Wires G-23c validator · G-23f preset registry · G-23g seed extractor.
 * Fixture / dry-run only — no network / DB / package / FTP.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/run-onboarding-orchestrator.mjs \
 *     --config <onboarding.json> \
 *     --mode validate-only|fixture-dry-run|full-dry-run \
 *     [--fixture <fixture-crawl-result.json>] \
 *     [--write-report] \
 *     [--report-out <dir-under-onboarding-reports>] \
 *     [--json]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateCmsPresetConfig } from "./lib/cms-preset-registry.mjs";
import { writeOnboardingReport } from "./lib/onboarding-report-writer.mjs";
import {
  extractOnboardingSeedCandidates,
  summarizeSeedExtraction,
} from "./lib/onboarding-seed-extractor.mjs";
import {
  PROD_REF,
  STAGING_REF,
  validateOnboardingConfig,
} from "./validate-onboarding-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

/** @typedef {"PASS" | "WARN" | "FAIL" | "SKIP" | "PLAN_ONLY" | "NOT_IMPLEMENTED"} StepStatus */

export const FIXTURE_MODES = ["fixture-dry-run", "full-dry-run"];

export const SUPPORTED_MODES = ["validate-only", ...FIXTURE_MODES];

export const UNSUPPORTED_MODES = [
  "crawl-dry-run",
  "seed-dry-run",
  "package-dry-run",
  "apply-staging-db",
  "prepare-upload-plan",
];

/**
 * @param {string | null | undefined} mode
 */
export function isFixtureMode(mode) {
  return FIXTURE_MODES.includes(mode);
}

const MODULE_PAGE_MAP = {
  schedule: ["schedule"],
  news: ["news", "home"],
  profile: ["profile", "home"],
  discography: ["discography"],
  video: ["video", "home"],
  contact: ["contact"],
};

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @param {string[]} argv
 */
export function parseOrchestratorArgs(argv) {
  const json = argv.includes("--json");
  const writeReport = argv.includes("--write-report");
  const configIdx = argv.indexOf("--config");
  const fixtureIdx = argv.indexOf("--fixture");
  const modeIdx = argv.indexOf("--mode");
  const reportOutIdx = argv.indexOf("--report-out");

  const configPath =
    configIdx >= 0 && argv[configIdx + 1] ? path.resolve(argv[configIdx + 1]) : null;
  const fixturePath =
    fixtureIdx >= 0 && argv[fixtureIdx + 1] ? path.resolve(argv[fixtureIdx + 1]) : null;
  const mode = modeIdx >= 0 && argv[modeIdx + 1] ? argv[modeIdx + 1] : null;
  const reportOut =
    reportOutIdx >= 0 && argv[reportOutIdx + 1] ? path.resolve(argv[reportOutIdx + 1]) : null;

  return { json, writeReport, configPath, fixturePath, mode, reportOut };
}

/**
 * @param {string} workspaceRoot
 * @param {string} relOrAbs
 */
function resolveOutputPath(workspaceRoot, relOrAbs) {
  if (path.isAbsolute(relOrAbs)) {
    return path.normalize(relOrAbs);
  }
  const ws = path.isAbsolute(workspaceRoot)
    ? path.normalize(workspaceRoot)
    : path.normalize(path.join(REPO_ROOT, workspaceRoot));
  return path.normalize(path.join(ws, relOrAbs));
}

/**
 * @param {string} pagePath
 */
function classifyPage(pagePath) {
  const normalized = pagePath.endsWith("/") ? pagePath : `${pagePath}/`;
  if (normalized === "/") return "home";
  if (normalized.startsWith("/profile") || normalized.startsWith("/about")) return "profile";
  if (normalized.startsWith("/schedule")) return "schedule";
  if (normalized.startsWith("/discography")) return "discography";
  if (normalized.startsWith("/video")) return "video";
  if (normalized.startsWith("/news")) return "news";
  if (normalized.startsWith("/contact")) return "contact";
  return "other";
}

/**
 * @param {object} config
 * @param {object} fixture
 */
function buildPageClassification(config, fixture) {
  /** @type {Array<{ path: string, detectedType: string, configModule: string | null, status: StepStatus, note?: string }>} */
  const rows = [];
  const enabledModules = (config.cms?.modules ?? []).filter((m) => m.enabled);

  for (const page of fixture.pages ?? []) {
    const pagePath = page.path ?? "/";
    const detectedType = page.pageType ?? classifyPage(pagePath);
    const routeKey = pagePath === "/" ? "/" : pagePath.replace(/\/$/, "");
    let configModule = null;
    for (const mod of enabledModules) {
      const pr = (mod.publicRoute ?? "").replace(/\/$/, "") || "/";
      if (pr === routeKey || (pr !== "/" && routeKey.startsWith(pr))) {
        configModule = mod.id;
        break;
      }
    }

    let status = "PASS";
    let note;
    const expectedTypes = MODULE_PAGE_MAP[configModule] ?? [];
    if (configModule && !expectedTypes.includes(detectedType) && detectedType !== "home") {
      status = "WARN";
      note = `pageType ${detectedType} vs module ${configModule}`;
    }
    if (!configModule && detectedType !== "home") {
      status = "WARN";
      note = "no enabled module mapped to this route";
    }

    rows.push({ path: pagePath, detectedType, configModule, status, note });
  }

  const unmappedModules = enabledModules.filter((mod) => {
    const pr = (mod.publicRoute ?? "").replace(/\/$/, "") || "/";
    return !rows.some((r) => {
      const rk = r.path === "/" ? "/" : r.path.replace(/\/$/, "");
      return rk === pr || (pr !== "/" && rk.startsWith(pr));
    });
  });

  return { rows, unmappedModules: unmappedModules.map((m) => m.id) };
}

/**
 * @param {object} config
 * @param {object} fixture
 * @param {string[]} [unmappedModules]
 */
function buildCmsModulePlanner(config, fixture, unmappedModules = []) {
  const seeds = fixture.seedCandidates ?? {};
  /** @type {Array<{ id: string, enabled: boolean, status: StepStatus, seedCount: number, note?: string }>} */
  const modules = [];

  for (const mod of config.cms?.modules ?? []) {
    if (!mod.enabled) {
      modules.push({ id: mod.id, enabled: false, status: "SKIP", seedCount: 0 });
      continue;
    }

    const candidate = seeds[mod.id];
    let seedCount = 0;
    if (Array.isArray(candidate)) seedCount = candidate.length;
    else if (isPlainObject(candidate)) seedCount = 1;

    let status = "PASS";
    let note;
    if (unmappedModules.includes(mod.id)) {
      status = "WARN";
      note = `enabled module has no page route in fixture (missing ${mod.publicRoute ?? `/${mod.id}/`})`;
    } else if (seedCount === 0 && mod.seedPolicy !== "skip") {
      status = "WARN";
      note = "enabled module has no seed candidates in fixture";
    }

    modules.push({ id: mod.id, enabled: true, status, seedCount, note });
  }

  return modules;
}

/**
 * @param {object} config
 */
function buildSafetyGateSummary(config) {
  const gates = config.safetyGates ?? {};
  const checks = [
    { key: "allowDbWrite", expected: false, planOnlyWhenFalse: "stagingDb" },
    { key: "allowPackageBuild", expected: false, planOnlyWhenFalse: "package" },
    { key: "allowFtpUpload", expected: false, planOnlyWhenFalse: "upload" },
    { key: "allowProductionDeploy", expected: false },
    { key: "forbidMirrorDelete", expected: true },
    { key: "forbidServiceRole", expected: true },
    { key: "manualCommitPush", expected: true },
    { key: "stagingOnly", expected: true },
  ];

  /** @type {Array<{ key: string, value: unknown, expected: boolean, status: StepStatus }>} */
  const rows = checks.map(({ key, expected }) => ({
    key,
    value: gates[key],
    expected,
    status: gates[key] === expected ? "PASS" : "FAIL",
  }));

  const ftpOk = config.ftp?.enabled === false && config.ftp?.autoApply !== true;
  rows.push({
    key: "ftp.enabled",
    value: config.ftp?.enabled ?? null,
    expected: false,
    status: ftpOk ? "PASS" : "FAIL",
  });

  const ref = config.supabase?.projectRef ?? "";
  if (ref === PROD_REF) {
    rows.push({
      key: "supabase.projectRef",
      value: ref,
      expected: STAGING_REF,
      status: "FAIL",
    });
  }

  const allPass = rows.every((r) => r.status === "PASS");

  return {
    status: allPass ? "PASS" : "FAIL",
    rows,
    planOnly: {
      stagingDb: gates.allowDbWrite !== true,
      package: gates.allowPackageBuild !== true,
      upload: gates.allowFtpUpload !== true,
    },
  };
}

/**
 * @param {object} config
 */
function buildIntakeSummary(config) {
  const enabledModules = (config.cms?.modules ?? []).filter((m) => m.enabled).map((m) => m.id);
  const out = config.output ?? {};
  const ws = out.workspaceRoot ?? "tools/static-to-astro";

  return {
    siteSlug: config.siteSlug ?? null,
    cmsPreset: config.cmsPreset ?? null,
    siteType: config.siteType ?? null,
    sourceUrl: config.sourceUrl ?? null,
    sourcePlatform: config.sourcePlatform ?? null,
    enabledModules,
    outputPaths: ["fixtureOut", "astroOut", "staticPublicOut", "manualUploadOut", "reportsOut"].map(
      (key) => ({
        key,
        configured: out[key] ?? null,
        resolved: out[key] ? resolveOutputPath(ws, out[key]) : null,
      }),
    ),
    stagingDomain: config.stagingDomain ?? null,
    deployBase: out.deployBase ?? null,
  };
}

/**
 * @param {Array<{ status: StepStatus }>} items
 */
function worstStatus(items) {
  if (items.some((i) => i.status === "FAIL" || i.status === "NOT_IMPLEMENTED")) return "FAIL";
  if (items.some((i) => i.status === "WARN")) return "WARN";
  if (items.every((i) => i.status === "SKIP")) return "SKIP";
  return "PASS";
}

/**
 * @param {object} fixture
 */
function countFixtureAssets(fixture) {
  const css = fixture.assets?.css?.length ?? 0;
  const images = fixture.assets?.images?.length ?? 0;
  return css + images;
}

/**
 * @param {object} config
 * @param {object} safetyGates
 */
function buildDbPlan(config, safetyGates) {
  const sb = config.supabase ?? {};
  const tables = (config.cms?.modules ?? [])
    .filter((m) => m.enabled && m.table)
    .map((m) => ({ moduleId: m.id, table: m.table }));

  return {
    status: "PLAN_ONLY",
    planOnly: safetyGates.planOnly?.stagingDb !== false,
    allowDbWrite: config.safetyGates?.allowDbWrite === true,
    dbConnectionAttempted: false,
    sqlGenerated: false,
    sqlExecuted: false,
    humanApprovalRequired: true,
    projectRef: sb.projectRef ?? null,
    environment: sb.environment ?? null,
    tables,
    rollbackPlanRequired: config.safetyGates?.requireRollbackPlanForDbWrite === true,
  };
}

/**
 * @param {object} config
 * @param {object} intake
 */
function buildPackagePlan(config, intake) {
  return {
    status: "PLAN_ONLY",
    planOnly: true,
    allowPackageBuild: config.safetyGates?.allowPackageBuild === true,
    packageBuildExecuted: false,
    astroBuildExecuted: false,
    outputPaths: intake.outputPaths ?? [],
    filesCreated: 0,
  };
}

/**
 * @param {object} config
 * @param {object} intake
 * @param {object} safetyGates
 */
function buildUploadPlan(config, intake, safetyGates) {
  const deployBase = intake.deployBase ?? config.output?.deployBase ?? "/";
  /** @type {string[]} */
  const uploadCandidates = [
    `${deployBase}index.html`,
    `${deployBase}schedule/index.html`,
    `${deployBase}profile/index.html`,
    `${deployBase}discography/index.html`,
    `${deployBase}videos/index.html`,
    `${deployBase}contact/index.html`,
    `${deployBase}_astro/`,
    `${deployBase}robots.txt`,
  ];

  return {
    status: "PLAN_ONLY",
    planOnly: safetyGates.planOnly?.upload !== false,
    allowFtpUpload: config.safetyGates?.allowFtpUpload === true,
    ftpConnectionAttempted: false,
    ftpUploadExecuted: false,
    requireOutputDiffReview: config.safetyGates?.requireOutputDiffReview === true,
    requireUploadFileList: config.safetyGates?.requireUploadFileList === true,
    uploadCandidates,
    deployExecuted: false,
  };
}

/**
 * @param {object} params
 */
function buildWarnings(params) {
  const {
    configValidation,
    registryValidation,
    pageClassification,
    cmsModulePlanner,
    seedExtraction,
    unmappedModules = [],
  } = params;

  /** @type {Array<{ code: string, severity: "WARN" | "INFO", message: string }>} */
  const warnings = [];

  for (const w of configValidation?.warnings ?? []) {
    warnings.push({ code: "config", severity: "WARN", message: w });
  }
  for (const w of registryValidation?.warnings ?? []) {
    warnings.push({ code: "registry", severity: "WARN", message: w });
  }
  for (const modId of unmappedModules) {
    warnings.push({
      code: "unmapped-module",
      severity: "WARN",
      message: `enabled module ${modId} has no matching page route in fixture (e.g. missing /news/)`,
    });
  }
  for (const row of pageClassification?.rows ?? []) {
    if (row.status === "WARN" && row.note) {
      warnings.push({
        code: "page-classification",
        severity: "WARN",
        message: `${row.path}: ${row.note}`,
      });
    }
  }
  for (const mod of cmsModulePlanner ?? []) {
    if (mod.status === "WARN" && mod.note) {
      warnings.push({
        code: "cms-module",
        severity: "WARN",
        message: `${mod.id}: ${mod.note}`,
      });
    }
  }
  for (const w of seedExtraction?.warnings ?? []) {
    warnings.push({ code: "seed-extraction", severity: "WARN", message: w });
  }

  return warnings;
}

/**
 * @param {Array<{ severity: string, message: string }>} warnings
 * @param {Array<{ status: string, label: string }>} steps
 */
function buildRiskSummary(warnings, steps) {
  const warnSteps = (steps ?? []).filter((s) => s.status === "WARN").map((s) => s.label);
  const planOnlySteps = (steps ?? [])
    .filter((s) => s.status === "PLAN_ONLY")
    .map((s) => s.label);

  return {
    overallRisk: warnings.some((w) => w.severity === "WARN") ? "low-with-warnings" : "low",
    warningCount: warnings.length,
    warnSteps,
    planOnlySteps,
    destructiveOpsBlocked: true,
    notes: [
      "Non-network fixture-only dry-run — no live crawl",
      "DB / package / FTP steps are planOnly — human approval required for any future write",
    ],
  };
}

/**
 * @param {object} fixture
 * @param {string[]} errors
 * @param {string} modeLabel
 */
function validateFixtureShape(fixture, errors, modeLabel = "fixture mode") {
  if (!isPlainObject(fixture)) {
    errors.push("fixture root must be a JSON object");
    return;
  }
  if (fixture.fixtureOnly !== true) {
    errors.push(`fixture.fixtureOnly must be true for ${modeLabel}`);
  }
  if (!Array.isArray(fixture.pages) || fixture.pages.length === 0) {
    errors.push("fixture.pages must be a non-empty array");
  }
  if (!isPlainObject(fixture.seedCandidates)) {
    errors.push("fixture.seedCandidates must be an object");
  }
  if (fixture.source?.liveCrawl === true) {
    errors.push("fixture.source.liveCrawl must not be true in fixture-dry-run mode");
  }
}

/**
 * @param {object} options
 */
export function runOnboardingOrchestrator(options) {
  const {
    configPath = null,
    fixturePath = null,
    mode = null,
    config: configInline = null,
    fixture: fixtureInline = null,
    writeReport = false,
    reportOut = null,
  } = options;

  const phase =
    mode === "full-dry-run"
      ? "G-23j-first-non-network-sample-full-dry-run"
      : "G-23h-onboarding-orchestrator-skeleton";

  if (!mode) {
    return {
      ok: false,
      status: "FAIL",
      phase,
      mode: null,
      errors: ["--mode is required"],
      steps: [],
    };
  }

  if (UNSUPPORTED_MODES.includes(mode)) {
    return {
      ok: false,
      status: "NOT_IMPLEMENTED",
      phase,
      mode,
      errors: [`mode ${mode} is not implemented in G-23h skeleton`],
      supportedModes: SUPPORTED_MODES,
      unsupportedModes: UNSUPPORTED_MODES,
      steps: [
        {
          id: "step-0",
          label: "Step 0 — config validation",
          status: "NOT_IMPLEMENTED",
          summary: `mode ${mode} blocked before execution`,
        },
      ],
      nextRecommendedPhase: "G-23i-fixture-mode-orchestrator-integration",
      liveCrawlExecuted: false,
      networkAccess: false,
      dbConnectionAttempted: false,
      dbWriteExecuted: false,
      packageBuildExecuted: false,
      ftpUploadExecuted: false,
      deployExecuted: false,
      filesCreated: 0,
    };
  }

  if (!SUPPORTED_MODES.includes(mode)) {
    return {
      ok: false,
      status: "FAIL",
      phase,
      mode,
      errors: [`unknown mode: ${mode}`],
      supportedModes: SUPPORTED_MODES,
      steps: [],
    };
  }

  /** @type {string[]} */
  const fatalErrors = [];

  let config;
  if (configInline) {
    config = configInline;
  } else if (configPath) {
    try {
      config = JSON.parse(fs.readFileSync(path.resolve(configPath), "utf8"));
    } catch (err) {
      fatalErrors.push(`config read/parse error: ${err.message}`);
    }
  } else {
    fatalErrors.push("--config is required");
  }

  let fixture = null;
  if (isFixtureMode(mode)) {
    if (fixtureInline) {
      fixture = fixtureInline;
    } else if (fixturePath) {
      try {
        fixture = JSON.parse(fs.readFileSync(path.resolve(fixturePath), "utf8"));
      } catch (err) {
        fatalErrors.push(`fixture read/parse error: ${err.message}`);
      }
    } else {
      fatalErrors.push(`--fixture is required for ${mode} mode`);
    }
  }

  if (fatalErrors.length > 0) {
    return {
      ok: false,
      status: "FAIL",
      phase,
      mode,
      configPath: configPath ? path.resolve(configPath) : null,
      fixturePath: fixturePath ? path.resolve(fixturePath) : null,
      fatalErrors,
      steps: [],
      liveCrawlExecuted: false,
      networkAccess: false,
      dbConnectionAttempted: false,
      dbWriteExecuted: false,
      packageBuildExecuted: false,
      ftpUploadExecuted: false,
      deployExecuted: false,
      filesCreated: 0,
    };
  }

  const configValidation = validateOnboardingConfig(config, {
    label: configPath ? path.basename(configPath) : "inline-config",
  });
  const registryValidation = validateCmsPresetConfig(config);
  const safetyGates = buildSafetyGateSummary(config);
  const intake = buildIntakeSummary(config);

  /** @type {Array<{ id: string, label: string, status: StepStatus, summary: string }>} */
  const steps = [];

  steps.push({
    id: "step-0",
    label: "Step 0 — config validation",
    status: configValidation.ok && registryValidation.ok ? "PASS" : "FAIL",
    summary: configValidation.ok
      ? `config PASS · registry ${registryValidation.status}`
      : [...configValidation.errors, ...registryValidation.errors].join("; "),
  });

  steps.push({
    id: "step-1",
    label: "Step 1 — intake summary",
    status: configValidation.ok ? "PASS" : "SKIP",
    summary: `siteSlug=${intake.siteSlug} · preset=${intake.cmsPreset} · enabled=[${intake.enabledModules.join(", ")}]`,
  });

  let fixtureLoad = null;
  let pageClassification = null;
  let cmsModulePlanner = null;
  let seedExtraction = null;
  /** @type {Record<string, number>} */
  let moduleCandidateCounts = {};
  let dbPlan = null;
  let packagePlan = null;
  let uploadPlan = null;
  /** @type {Array<{ code: string, severity: string, message: string }>} */
  let warnings = [];
  let riskSummary = null;
  const elevateUnmappedWarnings = mode === "full-dry-run";

  if (mode === "validate-only") {
    steps.push({
      id: "step-2",
      label: "Step 2 — fixture source",
      status: "SKIP",
      summary: "validate-only mode — fixture not loaded",
    });
    steps.push({
      id: "step-3",
      label: "Step 3 — page classification summary",
      status: "SKIP",
      summary: "validate-only mode — skipped",
    });
    steps.push({
      id: "step-4",
      label: "Step 4 — CMS module planner",
      status: "SKIP",
      summary: "validate-only mode — skipped",
    });
    steps.push({
      id: "step-5",
      label: "Step 5 — seed extraction",
      status: "SKIP",
      summary: "validate-only mode — skipped",
    });
  } else if (isFixtureMode(mode) && fixture) {
    /** @type {string[]} */
    const fixtureErrors = [];
    validateFixtureShape(fixture, fixtureErrors, mode);

    if (config.siteSlug && fixture.siteSlug && config.siteSlug !== fixture.siteSlug) {
      fixtureErrors.push(
        `fixture.siteSlug ${fixture.siteSlug} does not match config.siteSlug ${config.siteSlug}`,
      );
    }

    const assetsCount = countFixtureAssets(fixture);

    fixtureLoad = {
      status: fixtureErrors.length === 0 ? "PASS" : "FAIL",
      errors: fixtureErrors,
      fixtureOnly: fixture.fixtureOnly === true,
      liveCrawl: fixture.source?.liveCrawl === true,
      pagesCount: fixture.pages?.length ?? 0,
      assetsCount,
      siteSlug: fixture.siteSlug ?? null,
      metadata: fixture.metadata ?? {},
      stats: fixture.stats ?? {},
    };

    steps.push({
      id: "step-2",
      label: "Step 2 — fixture source",
      status: fixtureLoad.status,
      summary:
        fixtureErrors.length === 0
          ? `${fixtureLoad.pagesCount} pages · ${assetsCount} assets · fixtureOnly=true · liveCrawl=false`
          : fixtureErrors.join("; "),
    });

    if (fixtureErrors.length === 0) {
      pageClassification = buildPageClassification(config, fixture);
      const classStatus = worstStatus(pageClassification.rows);
      steps.push({
        id: "step-3",
        label: "Step 3 — page classification summary",
        status: classStatus,
        summary: `${pageClassification.rows.length} pages classified` +
          (pageClassification.unmappedModules.length
            ? ` · unmapped: ${pageClassification.unmappedModules.join(", ")}`
            : ""),
      });

      cmsModulePlanner = buildCmsModulePlanner(config, fixture);
      steps.push({
        id: "step-4",
        label: "Step 4 — CMS module planner",
        status: worstStatus(cmsModulePlanner.filter((m) => m.enabled)),
        summary: cmsModulePlanner
          .filter((m) => m.enabled)
          .map((m) => `${m.id}=${m.seedCount}`)
          .join(", "),
      });

      seedExtraction = extractOnboardingSeedCandidates(config, fixture);
      const seedSummary = summarizeSeedExtraction(seedExtraction);
      moduleCandidateCounts = Object.fromEntries(
        Object.entries(seedSummary.byModule ?? {}).map(([id, m]) => [id, m.candidateCount]),
      );

      steps.push({
        id: "step-5",
        label: "Step 5 — seed extraction",
        status: seedExtraction.status === "FAIL" ? "FAIL" : seedExtraction.status,
        summary: `counts: ${JSON.stringify(moduleCandidateCounts)} · total=${seedSummary.totalCandidates ?? 0}`,
      });

      warnings = buildWarnings({
        configValidation,
        registryValidation,
        pageClassification,
        cmsModulePlanner,
        seedExtraction,
        unmappedModules: elevateUnmappedWarnings ? pageClassification.unmappedModules : [],
      });
    } else {
      steps.push({
        id: "step-3",
        label: "Step 3 — page classification summary",
        status: "SKIP",
        summary: "fixture load failed",
      });
      steps.push({
        id: "step-4",
        label: "Step 4 — CMS module planner",
        status: "SKIP",
        summary: "fixture load failed",
      });
      steps.push({
        id: "step-5",
        label: "Step 5 — seed extraction",
        status: "SKIP",
        summary: "fixture load failed",
      });
    }
  }

  const dbPlanOnly = safetyGates.planOnly.stagingDb;
  dbPlan = buildDbPlan(config, safetyGates);
  steps.push({
    id: "step-6",
    label: "Step 6 — staging DB plan only",
    status: dbPlanOnly ? "PLAN_ONLY" : "WARN",
    summary: dbPlanOnly
      ? `planOnly · ref=${config.supabase?.projectRef} · allowDbWrite=false · no connection · human approval required`
      : "allowDbWrite=true — execution not implemented",
  });

  const packagePlanOnly = safetyGates.planOnly.package;
  packagePlan = buildPackagePlan(config, intake);
  steps.push({
    id: "step-7",
    label: "Step 7 — package plan only",
    status: packagePlanOnly ? "PLAN_ONLY" : "WARN",
    summary: packagePlanOnly
      ? `planOnly · astroOut=${config.output?.astroOut} · allowPackageBuild=false · no build`
      : "allowPackageBuild=true — execution not implemented",
  });

  const uploadPlanOnly = safetyGates.planOnly.upload;
  uploadPlan = buildUploadPlan(config, intake, safetyGates);
  steps.push({
    id: "step-8",
    label: "Step 8 — diff/QA plan only",
    status: uploadPlanOnly ? "PLAN_ONLY" : "WARN",
    summary: uploadPlanOnly
      ? `planOnly · requireOutputDiffReview=${config.safetyGates?.requireOutputDiffReview} · requireUploadFileList=${config.safetyGates?.requireUploadFileList} · allowFtpUpload=false`
      : "allowFtpUpload=true — FTP not implemented",
  });

  const stepStatuses = steps.map((s) => ({ status: s.status }));
  const overallStatus = worstStatus([
    ...stepStatuses,
    { status: configValidation.ok ? "PASS" : "FAIL" },
    { status: registryValidation.ok ? "PASS" : "FAIL" },
    { status: safetyGates.status },
  ]);

  const nextRecommendedPhase =
    mode === "validate-only"
      ? "G-23l-onboarding-report-output"
      : mode === "full-dry-run"
        ? "G-23n-live-crawl-allowlist-config"
        : "G-23l-onboarding-report-output";

  riskSummary = buildRiskSummary(warnings, steps);

  steps.push({
    id: "step-9",
    label: "Step 9 — handoff next action",
    status: overallStatus === "FAIL" ? "WARN" : "PASS",
    summary:
      mode === "full-dry-run"
        ? `next: ${nextRecommendedPhase} · overall=${overallStatus} · warnings=${warnings.length} · risk=${riskSummary.overallRisk}`
        : `next: ${nextRecommendedPhase} · overall=${overallStatus}`,
  });

  const ok = overallStatus === "PASS" || overallStatus === "WARN";

  const totalActiveCandidates = Object.values(moduleCandidateCounts).reduce((a, b) => a + b, 0);

  /** @type {object | null} */
  let reportOutput = null;
  let filesCreated = 0;

  if (writeReport) {
    const summaryOnly = mode === "validate-only";
    try {
      const reportResult = {
        ok,
        status: overallStatus,
        phase,
        mode,
        siteSlug: config.siteSlug ?? null,
        cmsPreset: config.cmsPreset ?? null,
        validation: {
          config: {
            status: configValidation.ok ? "PASS" : "FAIL",
            errors: configValidation.errors,
            warnings: configValidation.warnings,
          },
          registry: {
            status: registryValidation.status,
            errors: registryValidation.errors,
            warnings: registryValidation.warnings,
          },
        },
        intake,
        fixtureLoad,
        pageClassification,
        cmsModulePlanner,
        seedExtraction: seedExtraction
          ? {
              status: seedExtraction.status,
              summary: summarizeSeedExtraction(seedExtraction),
              errors: seedExtraction.errors,
              warnings: seedExtraction.warnings,
            }
          : null,
        seedExtractionFull: seedExtraction,
        moduleCandidateCounts,
        totalActiveCandidates,
        dbPlan,
        packagePlan,
        uploadPlan,
        warnings,
        riskSummary,
        safetyGates,
        steps,
        nextRecommendedPhase,
      };

      reportOutput = writeOnboardingReport(reportResult, {
        toolRoot: TOOL_ROOT,
        reportOut: reportOut ?? null,
        useLatest: !reportOut,
        summaryOnly,
      });

      if (!reportOutput.ok) {
        return {
          ok: false,
          status: "FAIL",
          phase: "G-23l-onboarding-report-output",
          mode,
          errors: [reportOutput.error ?? "report write failed"],
          reportOutput,
          steps,
          liveCrawlExecuted: false,
          networkAccess: false,
          dbWriteExecuted: false,
          filesCreated: 0,
        };
      }

      filesCreated = reportOutput.filesCreated ?? 0;
    } catch (err) {
      return {
        ok: false,
        status: "FAIL",
        phase: "G-23l-onboarding-report-output",
        mode,
        errors: [`report write error: ${err.message}`],
        steps,
        liveCrawlExecuted: false,
        networkAccess: false,
        dbWriteExecuted: false,
        filesCreated: 0,
      };
    }
  }

  return {
    ok,
    status: overallStatus,
    phase,
    mode,
    nonNetworkFullDryRun: mode === "full-dry-run",
    siteSlug: config.siteSlug ?? null,
    cmsPreset: config.cmsPreset ?? null,
    configPath: configPath ? path.resolve(configPath) : null,
    fixturePath: fixturePath ? path.resolve(fixturePath) : null,
    validation: {
      config: {
        status: configValidation.ok ? "PASS" : "FAIL",
        errors: configValidation.errors,
        warnings: configValidation.warnings,
      },
      registry: {
        status: registryValidation.status,
        errors: registryValidation.errors,
        warnings: registryValidation.warnings,
      },
    },
    intake,
    fixtureLoad,
    pageClassification,
    cmsModulePlanner,
    seedExtraction: seedExtraction
      ? {
          status: seedExtraction.status,
          summary: summarizeSeedExtraction(seedExtraction),
          errors: seedExtraction.errors,
          warnings: seedExtraction.warnings,
        }
      : null,
    seedExtractionFull: seedExtraction ?? null,
    moduleCandidateCounts,
    totalActiveCandidates,
    dbPlan,
    packagePlan,
    uploadPlan,
    warnings,
    riskSummary,
    safetyGates,
    steps,
    nextRecommendedPhase,
    supportedModes: SUPPORTED_MODES,
    unsupportedModes: UNSUPPORTED_MODES,
    liveCrawlExecuted: false,
    networkAccess: false,
    dbConnectionAttempted: false,
    dbWriteExecuted: false,
    sqlMutationExecuted: false,
    packageBuildExecuted: false,
    astroBuildExecuted: false,
    ftpUploadExecuted: false,
    deployExecuted: false,
    reportOutput,
    reportPath: reportOutput?.reportDir ?? null,
    reportFiles: reportOutput?.files ?? [],
    filesCreated,
    fatalErrors: [],
  };
}

/**
 * @param {ReturnType<typeof runOnboardingOrchestrator>} result
 */
function printHumanReport(result) {
  const title =
    result.mode === "full-dry-run"
      ? "G-23j Non-network sample full dry-run"
      : "G-23h Onboarding orchestrator";
  console.log(`\n${title}: ${result.status}`);
  console.log(`Mode: ${result.mode}`);
  if (result.nonNetworkFullDryRun) {
    console.log("Non-network · fixture-only · DB/package/FTP planOnly");
  }
  if (result.status === "NOT_IMPLEMENTED") {
    console.log(`\nMode not implemented: ${result.mode}`);
    console.log(`Supported: ${result.supportedModes?.join(", ")}`);
    console.log("");
    return;
  }

  if (result.fatalErrors?.length) {
    console.log("\nFatal errors:");
    for (const e of result.fatalErrors) console.log(`  - ${e}`);
    console.log("");
    return;
  }

  if (result.configPath) console.log(`Config: ${result.configPath}`);
  if (result.fixturePath) console.log(`Fixture: ${result.fixturePath}`);
  console.log(`siteSlug: ${result.siteSlug} · cmsPreset: ${result.cmsPreset}`);

  console.log(`\nValidation: config=${result.validation?.config?.status} · registry=${result.validation?.registry?.status}`);
  if (result.fixtureLoad) {
    console.log(
      `Fixture load: ${result.fixtureLoad.status} · pages=${result.fixtureLoad.pagesCount}` +
        (result.fixtureLoad.assetsCount != null ? ` · assets=${result.fixtureLoad.assetsCount}` : ""),
    );
  }
  if (result.seedExtraction) {
    console.log(`Seed extraction: ${result.seedExtraction.status}`);
  }

  console.log("\nModule candidate counts:");
  for (const [modId, count] of Object.entries(result.moduleCandidateCounts ?? {})) {
    console.log(`  - ${modId}: ${count}`);
  }
  if (result.totalActiveCandidates != null) {
    console.log(`  total active: ${result.totalActiveCandidates}`);
  }

  if (result.warnings?.length) {
    console.log("\nWarnings:");
    for (const w of result.warnings) {
      console.log(`  [${w.severity}] ${w.code}: ${w.message}`);
    }
  }

  if (result.riskSummary) {
    console.log(`\nRisk summary: ${result.riskSummary.overallRisk} (${result.riskSummary.warningCount} warnings)`);
  }

  if (result.uploadPlan?.uploadCandidates?.length) {
    console.log("\nUpload candidates (plan only):");
    for (const f of result.uploadPlan.uploadCandidates.slice(0, 5)) {
      console.log(`  - ${f}`);
    }
    if (result.uploadPlan.uploadCandidates.length > 5) {
      console.log(`  ... +${result.uploadPlan.uploadCandidates.length - 5} more`);
    }
  }

  console.log(`\nSafety gates: ${result.safetyGates?.status}`);
  console.log(
    `  planOnly: db=${result.safetyGates?.planOnly?.stagingDb} · package=${result.safetyGates?.planOnly?.package} · upload=${result.safetyGates?.planOnly?.upload}`,
  );

  console.log("\nSteps 0–9:");
  for (const step of result.steps ?? []) {
    console.log(`  [${step.status}] ${step.label}`);
    console.log(`         ${step.summary}`);
  }

  console.log(`\nNext recommended phase: ${result.nextRecommendedPhase}`);

  if (result.reportPath) {
    console.log(`\nReport written to: ${result.reportPath}`);
    for (const f of result.reportFiles ?? []) {
      console.log(`  - ${f}`);
    }
  }

  console.log(
    "\nOperations NOT executed: live crawl · network · DB · SQL · package · FTP · deploy\n",
  );
}

function main() {
  const { json, writeReport, configPath, fixturePath, mode, reportOut } = parseOrchestratorArgs(
    process.argv.slice(2),
  );

  if (!configPath || !mode) {
    console.error(
      "Usage: node run-onboarding-orchestrator.mjs --config <path> --mode <mode> [--fixture <path>] [--write-report] [--report-out <dir>] [--json]",
    );
    process.exit(2);
  }

  const result = runOnboardingOrchestrator({
    configPath,
    fixturePath,
    mode,
    writeReport,
    reportOut,
  });

  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHumanReport(result);
  }

  if (result.status === "NOT_IMPLEMENTED") {
    process.exit(2);
  }
  process.exit(result.ok ? 0 : 1);
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  main();
}
