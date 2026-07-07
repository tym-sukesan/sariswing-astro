/**
 * G-23d — Onboarding fixture-only dry-run.
 * Uses onboarding config + fixture crawl result — no network / DB / package / FTP.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/run-onboarding-fixture-dry-run.mjs \
 *     <onboarding-config.json> <fixture-crawl-result.json> [--json]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PROD_REF,
  STAGING_REF,
  validateOnboardingConfig,
} from "./validate-onboarding-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

/** @typedef {"PASS" | "WARN" | "FAIL" | "SKIP"} StepStatus */

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
  if (normalized.startsWith("/profile")) return "profile";
  if (normalized.startsWith("/about")) return "profile";
  if (normalized.startsWith("/schedule")) return "schedule";
  if (normalized.startsWith("/discography")) return "discography";
  if (normalized.startsWith("/video")) return "video";
  if (normalized.startsWith("/news")) return "news";
  if (normalized.startsWith("/contact")) return "contact";
  return "other";
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
 * @param {object} fixture
 * @param {string[]} errors
 */
function validateFixtureShape(fixture, errors) {
  if (!isPlainObject(fixture)) {
    errors.push("fixture root must be a JSON object");
    return;
  }
  if (fixture.fixtureOnly !== true) {
    errors.push("fixture.fixtureOnly must be true for G-23d fixture-only dry-run");
  }
  if (!Array.isArray(fixture.pages) || fixture.pages.length === 0) {
    errors.push("fixture.pages must be a non-empty array");
  }
  if (!isPlainObject(fixture.seedCandidates)) {
    errors.push("fixture.seedCandidates must be an object");
  }
  if (!isPlainObject(fixture.metadata)) {
    errors.push("fixture.metadata must be an object");
  }
  if (fixture.source?.liveCrawl === true) {
    errors.push("fixture.source.liveCrawl must not be true in fixture-only mode");
  }
}

/**
 * @param {object} config
 * @param {object} fixture
 */
function buildPageClassification(config, fixture) {
  /** @type {Array<{ path: string, detectedType: string, configModule: string | null, status: StepStatus, note?: string }>} */
  const rows = [];

  const enabledModules = (config.cms?.modules ?? []).filter((m) => m.enabled);
  const moduleByRoute = new Map(
    enabledModules.map((m) => [m.publicRoute?.replace(/\/$/, "") || "", m.id]),
  );

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
function buildCmsModuleReport(config, fixture) {
  const seeds = fixture.seedCandidates ?? {};
  /** @type {Array<{ id: string, enabled: boolean, status: StepStatus, seedCount: number, table: string | null, extractionStrategy: string, adminUiEnabled: boolean, note?: string }>} */
  const modules = [];

  for (const mod of config.cms?.modules ?? []) {
    if (!mod.enabled) {
      modules.push({
        id: mod.id,
        enabled: false,
        status: "SKIP",
        seedCount: 0,
        table: mod.table ?? null,
        extractionStrategy: mod.extractionStrategy ?? "unknown",
        adminUiEnabled: !!mod.adminUiEnabled,
      });
      continue;
    }

    const candidate = seeds[mod.id];
    let seedCount = 0;
    if (Array.isArray(candidate)) {
      seedCount = candidate.length;
    } else if (isPlainObject(candidate)) {
      seedCount = 1;
    }

    let status = "PASS";
    let note;
    if (seedCount === 0 && mod.seedPolicy !== "skip") {
      status = "WARN";
      note = "enabled module has no seed candidates in fixture";
    }

    modules.push({
      id: mod.id,
      enabled: true,
      status,
      seedCount,
      table: mod.table ?? null,
      extractionStrategy: mod.extractionStrategy ?? "unknown",
      adminUiEnabled: !!mod.adminUiEnabled,
      note,
    });
  }

  return modules;
}

/**
 * @param {object} config
 */
function buildOutputPathReport(config) {
  const out = config.output ?? {};
  const ws = out.workspaceRoot ?? "tools/static-to-astro";
  const keys = [
    "fixtureOut",
    "astroOut",
    "staticPublicOut",
    "manualUploadOut",
    "reportsOut",
    "docsOut",
  ];
  return keys.map((key) => ({
    key,
    configured: out[key] ?? null,
    resolved: out[key] ? resolveOutputPath(ws, out[key]) : null,
    wouldCreate: false,
  }));
}

/**
 * @param {object} config
 */
function buildSupabaseTargetReport(config) {
  const sb = config.supabase ?? {};
  const ref = sb.projectRef ?? "";
  /** @type {StepStatus} */
  let status = "PASS";
  const notes = [];

  if (ref === PROD_REF) {
    status = "FAIL";
    notes.push(`production ref ${PROD_REF} must not be used`);
  } else if (ref !== STAGING_REF) {
    status = "WARN";
    notes.push(`projectRef ${ref} is not the standard staging ref ${STAGING_REF}`);
  }

  if (!Array.isArray(sb.forbiddenProjectRefs) || !sb.forbiddenProjectRefs.includes(PROD_REF)) {
    status = "FAIL";
    notes.push(`forbiddenProjectRefs must include ${PROD_REF}`);
  }

  if (sb.environment !== "staging") {
    status = "FAIL";
    notes.push('supabase.environment must be "staging"');
  }

  return {
    status,
    environment: sb.environment ?? null,
    projectLabel: sb.projectLabel ?? null,
    projectRef: ref,
    forbiddenProjectRefs: sb.forbiddenProjectRefs ?? [],
    siteSlugColumn: sb.siteSlugColumn ?? "site_slug",
    dbConnectionAttempted: false,
    notes,
  };
}

/**
 * @param {object} config
 */
function buildSafetyGatesReport(config) {
  const gates = config.safetyGates ?? {};
  const checks = [
    { key: "allowDbWrite", expected: false },
    { key: "allowPackageBuild", expected: false },
    { key: "allowFtpUpload", expected: false },
    { key: "allowProductionDeploy", expected: false },
    { key: "forbidMirrorDelete", expected: true },
    { key: "forbidServiceRole", expected: true },
    { key: "manualCommitPush", expected: true },
    { key: "stagingOnly", expected: true },
  ];

  /** @type {Array<{ key: string, value: unknown, expected: boolean, status: StepStatus }>} */
  const rows = checks.map(({ key, expected }) => {
    const value = gates[key];
    const status = value === expected ? "PASS" : "FAIL";
    return { key, value, expected, status };
  });

  const ftpOk = config.ftp?.enabled === false && config.ftp?.autoApply !== true;
  if (!ftpOk) {
    rows.push({
      key: "ftp.enabled",
      value: config.ftp?.enabled,
      expected: false,
      status: "FAIL",
    });
  } else {
    rows.push({ key: "ftp.enabled", value: false, expected: false, status: "PASS" });
  }

  const allPass = rows.every((r) => r.status === "PASS");
  return { status: allPass ? "PASS" : "FAIL", rows };
}

/**
 * @param {Array<{ status: StepStatus }>} items
 */
function worstStatus(items) {
  if (items.some((i) => i.status === "FAIL")) return "FAIL";
  if (items.some((i) => i.status === "WARN")) return "WARN";
  if (items.every((i) => i.status === "SKIP")) return "SKIP";
  return "PASS";
}

/**
 * @param {object} options
 */
export function runOnboardingFixtureDryRun(options) {
  const {
    configPath,
    fixturePath,
    config: configInline,
    fixture: fixtureInline,
  } = options;

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
    fatalErrors.push("config or configPath required");
  }

  let fixture;
  if (fixtureInline) {
    fixture = fixtureInline;
  } else if (fixturePath) {
    try {
      fixture = JSON.parse(fs.readFileSync(path.resolve(fixturePath), "utf8"));
    } catch (err) {
      fatalErrors.push(`fixture read/parse error: ${err.message}`);
    }
  } else {
    fatalErrors.push("fixture or fixturePath required");
  }

  if (fatalErrors.length > 0) {
    return {
      ok: false,
      status: "FAIL",
      phase: "G-23d-onboarding-fixture-dry-run",
      fixtureOnly: true,
      fatalErrors,
      steps: [],
      configPath: configPath ? path.resolve(configPath) : null,
      fixturePath: fixturePath ? path.resolve(fixturePath) : null,
    };
  }

  const configValidation = validateOnboardingConfig(config, {
    label: configPath ? path.basename(configPath) : "inline-config",
  });

  /** @type {string[]} */
  const fixtureErrors = [];
  validateFixtureShape(fixture, fixtureErrors);

  if (fixture.siteSlug && config.siteSlug && fixture.siteSlug !== config.siteSlug) {
    fixtureErrors.push(
      `fixture.siteSlug ${fixture.siteSlug} does not match config.siteSlug ${config.siteSlug}`,
    );
  }

  const pageClassification = buildPageClassification(config, fixture);
  const cmsModules = buildCmsModuleReport(config, fixture);
  const outputPaths = buildOutputPathReport(config);
  const supabaseTarget = buildSupabaseTargetReport(config);
  const safetyGates = buildSafetyGatesReport(config);

  const seedCounts = Object.fromEntries(
    cmsModules.filter((m) => m.enabled).map((m) => [m.id, m.seedCount]),
  );

  /** @type {Array<{ id: string, window: string, label: string, status: StepStatus, summary: string }>} */
  const steps = [];

  steps.push({
    id: "intake",
    window: "0-3 min",
    label: "INTAKE — config validation",
    status: configValidation.ok ? "PASS" : "FAIL",
    summary: configValidation.ok
      ? `siteSlug=${config.siteSlug} · preset=${config.cmsPreset}`
      : configValidation.errors.join("; "),
  });

  steps.push({
    id: "crawl",
    window: "3-8 min",
    label: "CRAWL — fixture load (no live crawl)",
    status:
      fixtureErrors.length === 0 && fixture.fixtureOnly === true ? "PASS" : "FAIL",
    summary:
      fixtureErrors.length === 0
        ? `${fixture.pages?.length ?? 0} pages · ${(fixture.assets?.css?.length ?? 0) + (fixture.assets?.images?.length ?? 0)} assets · liveCrawl=false`
        : fixtureErrors.join("; "),
  });

  steps.push({
    id: "classify-layout",
    window: "8-12 min",
    label: "CLASSIFY + LAYOUT — page types",
    status: worstStatus(pageClassification.rows),
    summary: `${pageClassification.rows.length} pages classified` +
      (pageClassification.unmappedModules.length
        ? ` · unmapped modules: ${pageClassification.unmappedModules.join(", ")}`
        : ""),
  });

  steps.push({
    id: "cms-extract",
    window: "12-17 min",
    label: "CMS EXTRACT — seed candidates (dry-run)",
    status: worstStatus(cmsModules.filter((m) => m.enabled)),
    summary: `seed counts: ${JSON.stringify(seedCounts)}`,
  });

  steps.push({
    id: "staging-setup",
    window: "17-22 min",
    label: "STAGING SETUP — Supabase target check (no DB)",
    status: supabaseTarget.status,
    summary: `ref=${supabaseTarget.projectRef} · dbConnection=false · allowDbWrite=${config.safetyGates?.allowDbWrite}`,
  });

  steps.push({
    id: "package-build",
    window: "22-26 min",
    label: "PACKAGE BUILD — output paths only (no regen)",
    status: config.safetyGates?.allowPackageBuild === false ? "PASS" : "FAIL",
    summary: `astroOut=${config.output?.astroOut} · allowPackageBuild=false · filesCreated=0`,
  });

  steps.push({
    id: "report-handoff",
    window: "26-30 min",
    label: "REPORT + HANDOFF — dry-run summary",
    status: "PASS",
    summary: "fixture-only report generated · FTP/deploy skipped",
  });

  const stepStatuses = steps.map((s) => ({ status: s.status }));
  const overallStatus = worstStatus([
    ...stepStatuses,
    { status: configValidation.ok ? "PASS" : "FAIL" },
    { status: fixtureErrors.length === 0 ? "PASS" : "FAIL" },
    { status: safetyGates.status },
    { status: supabaseTarget.status },
  ]);

  return {
    ok: overallStatus === "PASS" || overallStatus === "WARN",
    status: overallStatus,
    phase: "G-23d-onboarding-fixture-dry-run",
    fixtureOnly: true,
    liveCrawlExecuted: false,
    networkAccess: false,
    dbConnectionAttempted: false,
    dbWriteExecuted: false,
    packageBuildExecuted: false,
    ftpUploadExecuted: false,
    deployExecuted: false,
    configPath: configPath ? path.resolve(configPath) : null,
    fixturePath: fixturePath ? path.resolve(fixturePath) : null,
    configValidation: {
      status: configValidation.ok ? "PASS" : "FAIL",
      errors: configValidation.errors,
      warnings: configValidation.warnings,
    },
    fixtureLoad: {
      status: fixtureErrors.length === 0 ? "PASS" : "FAIL",
      errors: fixtureErrors,
      metadata: fixture.metadata ?? {},
      stats: fixture.stats ?? {},
      pagesCount: fixture.pages?.length ?? 0,
    },
    pageClassification,
    cmsModules,
    seedCounts,
    outputPaths,
    supabaseTarget,
    safetyGates,
    steps,
    fatalErrors,
  };
}

function printHumanReport(result) {
  console.log(`\nG-23d Onboarding fixture dry-run: ${result.status}`);
  console.log(`Fixture-only: ${result.fixtureOnly} · Live crawl: ${result.liveCrawlExecuted}`);
  if (result.configPath) console.log(`Config: ${result.configPath}`);
  if (result.fixturePath) console.log(`Fixture: ${result.fixturePath}`);

  if (result.fatalErrors?.length) {
    console.log("\nFatal errors:");
    for (const e of result.fatalErrors) console.log(`  - ${e}`);
    console.log("");
    return;
  }

  console.log(`\nConfig validation: ${result.configValidation.status}`);
  console.log(`Fixture load: ${result.fixtureLoad.status}`);

  console.log("\n30-minute flow steps:");
  for (const step of result.steps) {
    console.log(`  [${step.status}] ${step.window} ${step.label}`);
    console.log(`         ${step.summary}`);
  }

  console.log("\nPage classification:");
  for (const row of result.pageClassification.rows) {
    const note = row.note ? ` (${row.note})` : "";
    console.log(
      `  [${row.status}] ${row.path} → ${row.detectedType} · module=${row.configModule ?? "none"}${note}`,
    );
  }

  console.log("\nCMS modules / seed candidates:");
  for (const mod of result.cmsModules) {
    const note = mod.note ? ` — ${mod.note}` : "";
    console.log(
      `  [${mod.status}] ${mod.id} enabled=${mod.enabled} seeds=${mod.seedCount} table=${mod.table ?? "n/a"}${note}`,
    );
  }

  console.log("\nOutput paths (computed only — not created):");
  for (const p of result.outputPaths) {
    console.log(`  ${p.key}: ${p.resolved ?? "n/a"}`);
  }

  console.log(`\nSupabase target: ${result.supabaseTarget.status} · ref=${result.supabaseTarget.projectRef}`);
  console.log(`Safety gates: ${result.safetyGates.status}`);
  console.log(
    "\nOperations NOT executed: crawl · DB · package · FTP · deploy · network\n",
  );
}

function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--json");
  const jsonMode = process.argv.includes("--json");

  if (args.length < 2) {
    console.error(
      "Usage: node run-onboarding-fixture-dry-run.mjs <onboarding-config.json> <fixture-crawl-result.json> [--json]",
    );
    process.exit(2);
  }

  const result = runOnboardingFixtureDryRun({
    configPath: args[0],
    fixturePath: args[1],
  });

  if (jsonMode) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHumanReport(result);
  }

  process.exit(result.ok ? 0 : 1);
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  main();
}
