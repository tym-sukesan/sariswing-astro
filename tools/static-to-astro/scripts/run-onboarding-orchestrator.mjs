/**
 * G-23h — Onboarding orchestrator skeleton.
 * Wires G-23c validator · G-23f preset registry · G-23g seed extractor.
 * Fixture / dry-run only — no network / DB / package / FTP.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/run-onboarding-orchestrator.mjs \
 *     --config <onboarding.json> \
 *     --mode validate-only|fixture-dry-run \
 *     [--fixture <fixture-crawl-result.json>] \
 *     [--json]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateCmsPresetConfig } from "./lib/cms-preset-registry.mjs";
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

export const SUPPORTED_MODES = ["validate-only", "fixture-dry-run"];

export const UNSUPPORTED_MODES = [
  "crawl-dry-run",
  "seed-dry-run",
  "package-dry-run",
  "full-dry-run",
  "apply-staging-db",
  "prepare-upload-plan",
];

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
  const configIdx = argv.indexOf("--config");
  const fixtureIdx = argv.indexOf("--fixture");
  const modeIdx = argv.indexOf("--mode");

  const configPath =
    configIdx >= 0 && argv[configIdx + 1] ? path.resolve(argv[configIdx + 1]) : null;
  const fixturePath =
    fixtureIdx >= 0 && argv[fixtureIdx + 1] ? path.resolve(argv[fixtureIdx + 1]) : null;
  const mode = modeIdx >= 0 && argv[modeIdx + 1] ? argv[modeIdx + 1] : null;

  return { json, configPath, fixturePath, mode };
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
 */
function buildCmsModulePlanner(config, fixture) {
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
    if (seedCount === 0 && mod.seedPolicy !== "skip") {
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
 * @param {string[]} errors
 */
function validateFixtureShape(fixture, errors) {
  if (!isPlainObject(fixture)) {
    errors.push("fixture root must be a JSON object");
    return;
  }
  if (fixture.fixtureOnly !== true) {
    errors.push("fixture.fixtureOnly must be true for fixture-dry-run mode");
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
  } = options;

  const phase = "G-23h-onboarding-orchestrator-skeleton";

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
  if (mode === "fixture-dry-run") {
    if (fixtureInline) {
      fixture = fixtureInline;
    } else if (fixturePath) {
      try {
        fixture = JSON.parse(fs.readFileSync(path.resolve(fixturePath), "utf8"));
      } catch (err) {
        fatalErrors.push(`fixture read/parse error: ${err.message}`);
      }
    } else {
      fatalErrors.push("--fixture is required for fixture-dry-run mode");
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
  } else if (mode === "fixture-dry-run" && fixture) {
    /** @type {string[]} */
    const fixtureErrors = [];
    validateFixtureShape(fixture, fixtureErrors);

    if (config.siteSlug && fixture.siteSlug && config.siteSlug !== fixture.siteSlug) {
      fixtureErrors.push(
        `fixture.siteSlug ${fixture.siteSlug} does not match config.siteSlug ${config.siteSlug}`,
      );
    }

    fixtureLoad = {
      status: fixtureErrors.length === 0 ? "PASS" : "FAIL",
      errors: fixtureErrors,
      fixtureOnly: fixture.fixtureOnly === true,
      liveCrawl: fixture.source?.liveCrawl === true,
      pagesCount: fixture.pages?.length ?? 0,
      siteSlug: fixture.siteSlug ?? null,
    };

    steps.push({
      id: "step-2",
      label: "Step 2 — fixture source",
      status: fixtureLoad.status,
      summary:
        fixtureErrors.length === 0
          ? `${fixtureLoad.pagesCount} pages · fixtureOnly=true · liveCrawl=false`
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
        summary: `counts: ${JSON.stringify(moduleCandidateCounts)}`,
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
  steps.push({
    id: "step-6",
    label: "Step 6 — staging DB plan only",
    status: dbPlanOnly ? "PLAN_ONLY" : "WARN",
    summary: dbPlanOnly
      ? `planOnly · ref=${config.supabase?.projectRef} · allowDbWrite=false · no connection`
      : "allowDbWrite=true — execution not implemented in G-23h",
  });

  const packagePlanOnly = safetyGates.planOnly.package;
  steps.push({
    id: "step-7",
    label: "Step 7 — package plan only",
    status: packagePlanOnly ? "PLAN_ONLY" : "WARN",
    summary: packagePlanOnly
      ? `planOnly · astroOut=${config.output?.astroOut} · allowPackageBuild=false`
      : "allowPackageBuild=true — execution not implemented in G-23h",
  });

  const uploadPlanOnly = safetyGates.planOnly.upload;
  steps.push({
    id: "step-8",
    label: "Step 8 — diff/QA plan only",
    status: uploadPlanOnly ? "PLAN_ONLY" : "WARN",
    summary: uploadPlanOnly
      ? `planOnly · requireOutputDiffReview=${config.safetyGates?.requireOutputDiffReview} · allowFtpUpload=false`
      : "allowFtpUpload=true — FTP not implemented in G-23h",
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
      ? "G-23i-fixture-mode-orchestrator-integration"
      : "G-23j-first-non-network-sample-full-dry-run";

  steps.push({
    id: "step-9",
    label: "Step 9 — handoff next action",
    status: overallStatus === "FAIL" ? "WARN" : "PASS",
    summary: `next: ${nextRecommendedPhase} · overall=${overallStatus}`,
  });

  const ok = overallStatus === "PASS" || overallStatus === "WARN";

  return {
    ok,
    status: overallStatus,
    phase,
    mode,
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
    moduleCandidateCounts,
    safetyGates,
    steps,
    nextRecommendedPhase,
    supportedModes: SUPPORTED_MODES,
    unsupportedModes: UNSUPPORTED_MODES,
    liveCrawlExecuted: false,
    networkAccess: false,
    dbConnectionAttempted: false,
    dbWriteExecuted: false,
    packageBuildExecuted: false,
    ftpUploadExecuted: false,
    deployExecuted: false,
    filesCreated: 0,
    fatalErrors: [],
  };
}

/**
 * @param {ReturnType<typeof runOnboardingOrchestrator>} result
 */
function printHumanReport(result) {
  console.log(`\nG-23h Onboarding orchestrator: ${result.status}`);
  console.log(`Mode: ${result.mode}`);
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
    console.log(`Fixture load: ${result.fixtureLoad.status} · pages=${result.fixtureLoad.pagesCount}`);
  }
  if (result.seedExtraction) {
    console.log(`Seed extraction: ${result.seedExtraction.status}`);
  }

  console.log("\nModule candidate counts:");
  for (const [modId, count] of Object.entries(result.moduleCandidateCounts ?? {})) {
    console.log(`  - ${modId}: ${count}`);
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
  console.log(
    "\nOperations NOT executed: live crawl · network · DB · SQL · package · FTP · deploy\n",
  );
}

function main() {
  const { json, configPath, fixturePath, mode } = parseOrchestratorArgs(process.argv.slice(2));

  if (!configPath || !mode) {
    console.error(
      "Usage: node run-onboarding-orchestrator.mjs --config <path> --mode <mode> [--fixture <path>] [--json]",
    );
    process.exit(2);
  }

  const result = runOnboardingOrchestrator({ configPath, fixturePath, mode });

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
