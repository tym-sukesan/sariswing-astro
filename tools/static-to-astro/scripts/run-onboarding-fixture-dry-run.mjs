/**
 * G-23d / G-23i — Onboarding fixture-only dry-run (compatibility wrapper).
 * Delegates to run-onboarding-orchestrator.mjs fixture-dry-run mode (standard entry).
 * Preserves G-23d CLI shape and JSON output for existing verifiers and docs.
 *
 * Standard entry (preferred):
 *   node tools/static-to-astro/scripts/run-onboarding-orchestrator.mjs \
 *     --config <onboarding.json> --fixture <fixture.json> --mode fixture-dry-run
 *
 * Compatibility entry (this script):
 *   node tools/static-to-astro/scripts/run-onboarding-fixture-dry-run.mjs \
 *     <onboarding-config.json> <fixture-crawl-result.json> [--json]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runOnboardingOrchestrator } from "./run-onboarding-orchestrator.mjs";
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
 * @param {object} orchestratorSafetyGates
 */
function mapSafetyGatesToG23d(orchestratorSafetyGates) {
  if (!orchestratorSafetyGates?.rows) {
    return { status: "FAIL", rows: [] };
  }
  return {
    status: orchestratorSafetyGates.status ?? "FAIL",
    rows: orchestratorSafetyGates.rows,
    planOnly: orchestratorSafetyGates.planOnly ?? {
      stagingDb: true,
      package: true,
      upload: true,
    },
  };
}

/**
 * @param {object} config
 * @param {object} orchestratorResult
 */
function buildCmsModulesFromOrchestrator(config, orchestratorResult) {
  const plannerById = new Map(
    (orchestratorResult.cmsModulePlanner ?? []).map((m) => [m.id, m]),
  );
  const seedCounts = orchestratorResult.moduleCandidateCounts ?? {};

  return (config.cms?.modules ?? []).map((mod) => {
    const planned = plannerById.get(mod.id);
    const seedCount =
      seedCounts[mod.id] ?? planned?.seedCount ?? (mod.enabled ? 0 : 0);

    if (!mod.enabled) {
      return {
        id: mod.id,
        enabled: false,
        status: "SKIP",
        seedCount: 0,
        table: mod.table ?? null,
        extractionStrategy: mod.extractionStrategy ?? "unknown",
        adminUiEnabled: !!mod.adminUiEnabled,
      };
    }

    return {
      id: mod.id,
      enabled: true,
      status: planned?.status ?? (seedCount > 0 ? "PASS" : "WARN"),
      seedCount,
      table: mod.table ?? null,
      extractionStrategy: mod.extractionStrategy ?? "unknown",
      adminUiEnabled: !!mod.adminUiEnabled,
      note: planned?.note,
    };
  });
}

/**
 * @param {object} orchestratorResult
 * @param {object} [fixture]
 */
function buildG23dTimelineSteps(orchestratorResult, fixture) {
  const stepById = new Map((orchestratorResult.steps ?? []).map((s) => [s.id, s]));
  const seedCounts = orchestratorResult.moduleCandidateCounts ?? {};
  const assetCount =
    (fixture?.assets?.css?.length ?? 0) + (fixture?.assets?.images?.length ?? 0);

  const step0 = stepById.get("step-0");
  const step2 = stepById.get("step-2");
  const step3 = stepById.get("step-3");
  const step5 = stepById.get("step-5");
  const step6 = stepById.get("step-6");
  const step7 = stepById.get("step-7");

  return [
    {
      id: "intake",
      window: "0-3 min",
      label: "INTAKE — config validation",
      status: step0?.status === "FAIL" ? "FAIL" : "PASS",
      summary: step0?.summary ?? "config validation",
    },
    {
      id: "crawl",
      window: "3-8 min",
      label: "CRAWL — fixture load (no live crawl)",
      status: step2?.status ?? "FAIL",
      summary:
        step2?.status === "PASS"
          ? `${orchestratorResult.fixtureLoad?.pagesCount ?? 0} pages · ${assetCount} assets · liveCrawl=false`
          : step2?.summary ?? "fixture load failed",
    },
    {
      id: "classify-layout",
      window: "8-12 min",
      label: "CLASSIFY + LAYOUT — page types",
      status: step3?.status ?? "SKIP",
      summary: step3?.summary ?? "page classification",
    },
    {
      id: "cms-extract",
      window: "12-17 min",
      label: "CMS EXTRACT — seed candidates (dry-run)",
      status: step5?.status ?? "SKIP",
      summary: `seed counts: ${JSON.stringify(seedCounts)}`,
    },
    {
      id: "staging-setup",
      window: "17-22 min",
      label: "STAGING SETUP — Supabase target check (no DB)",
      status: step6?.status === "PLAN_ONLY" ? "PASS" : step6?.status ?? "PASS",
      summary: step6?.summary ?? "staging DB plan only",
    },
    {
      id: "package-build",
      window: "22-26 min",
      label: "PACKAGE BUILD — output paths only (no regen)",
      status: step7?.status === "PLAN_ONLY" ? "PASS" : step7?.status ?? "PASS",
      summary: step7?.summary ?? "package plan only",
    },
    {
      id: "report-handoff",
      window: "26-30 min",
      label: "REPORT + HANDOFF — dry-run summary",
      status: orchestratorResult.status === "FAIL" ? "WARN" : "PASS",
      summary: "fixture-only report via orchestrator · FTP/deploy skipped",
    },
  ];
}

/**
 * @param {object} orchestratorResult
 * @param {object} options
 */
function mapOrchestratorToG23dResult(orchestratorResult, options) {
  const { configPath, fixturePath, config: configInline, fixture: fixtureInline } = options;

  if (orchestratorResult.fatalErrors?.length) {
    return {
      ok: false,
      status: "FAIL",
      phase: "G-23d-onboarding-fixture-dry-run",
      delegatedTo: "run-onboarding-orchestrator.fixture-dry-run",
      fixtureOnly: true,
      fatalErrors: orchestratorResult.fatalErrors,
      steps: [],
      configPath: configPath ? path.resolve(configPath) : null,
      fixturePath: fixturePath ? path.resolve(fixturePath) : null,
      liveCrawlExecuted: false,
      networkAccess: false,
      dbConnectionAttempted: false,
      dbWriteExecuted: false,
      packageBuildExecuted: false,
      ftpUploadExecuted: false,
      deployExecuted: false,
    };
  }

  let config = configInline;
  let fixture = fixtureInline;

  if (!config && configPath) {
    config = JSON.parse(fs.readFileSync(path.resolve(configPath), "utf8"));
  }
  if (!fixture && fixturePath) {
    fixture = JSON.parse(fs.readFileSync(path.resolve(fixturePath), "utf8"));
  }

  const seedCounts = { ...(orchestratorResult.moduleCandidateCounts ?? {}) };
  const cmsModules = buildCmsModulesFromOrchestrator(config, orchestratorResult);
  const outputPaths = buildOutputPathReport(config);
  const supabaseTarget = buildSupabaseTargetReport(config);
  const safetyGates = mapSafetyGatesToG23d(orchestratorResult.safetyGates);
  const steps = buildG23dTimelineSteps(orchestratorResult, fixture);

  return {
    ok: orchestratorResult.ok,
    status: orchestratorResult.status,
    phase: "G-23d-onboarding-fixture-dry-run",
    delegatedTo: "run-onboarding-orchestrator.fixture-dry-run",
    orchestratorPhase: orchestratorResult.phase,
    fixtureOnly: true,
    liveCrawlExecuted: false,
    networkAccess: false,
    dbConnectionAttempted: false,
    dbWriteExecuted: false,
    packageBuildExecuted: false,
    ftpUploadExecuted: false,
    deployExecuted: false,
    configPath: configPath ? path.resolve(configPath) : orchestratorResult.configPath,
    fixturePath: fixturePath ? path.resolve(fixturePath) : orchestratorResult.fixturePath,
    configValidation: {
      status: orchestratorResult.validation?.config?.status ?? "FAIL",
      errors: orchestratorResult.validation?.config?.errors ?? [],
      warnings: orchestratorResult.validation?.config?.warnings ?? [],
    },
    registryValidation: orchestratorResult.validation?.registry ?? null,
    fixtureLoad: {
      status: orchestratorResult.fixtureLoad?.status ?? "FAIL",
      errors: orchestratorResult.fixtureLoad?.errors ?? [],
      metadata: fixture?.metadata ?? {},
      stats: fixture?.stats ?? {},
      pagesCount: orchestratorResult.fixtureLoad?.pagesCount ?? 0,
      fixtureOnly: orchestratorResult.fixtureLoad?.fixtureOnly === true,
    },
    pageClassification: orchestratorResult.pageClassification ?? { rows: [], unmappedModules: [] },
    cmsModules,
    seedCounts,
    moduleCandidateCounts: seedCounts,
    outputPaths,
    supabaseTarget,
    safetyGates,
    seedExtraction: orchestratorResult.seedExtraction ?? null,
    steps,
    fatalErrors: [],
  };
}

/**
 * @param {object} options
 */
export function runOnboardingFixtureDryRun(options) {
  const orchestratorResult = runOnboardingOrchestrator({
    ...options,
    mode: "fixture-dry-run",
  });

  return mapOrchestratorToG23dResult(orchestratorResult, options);
}

/**
 * @param {ReturnType<typeof runOnboardingFixtureDryRun>} result
 */
function printHumanReport(result) {
  console.log(`\nG-23d Onboarding fixture dry-run: ${result.status}`);
  console.log(`Fixture-only: ${result.fixtureOnly} · Live crawl: ${result.liveCrawlExecuted}`);
  if (result.delegatedTo) {
    console.log(`Delegated to: ${result.delegatedTo}`);
  }
  if (result.configPath) console.log(`Config: ${result.configPath}`);
  if (result.fixturePath) console.log(`Fixture: ${result.fixturePath}`);

  if (result.fatalErrors?.length) {
    console.log("\nFatal errors:");
    for (const e of result.fatalErrors) console.log(`  - ${e}`);
    console.log("");
    return;
  }

  console.log(`\nConfig validation: ${result.configValidation.status}`);
  if (result.registryValidation) {
    console.log(`Registry validation: ${result.registryValidation.status}`);
  }
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
  if (result.safetyGates.planOnly) {
    console.log(
      `  planOnly: db=${result.safetyGates.planOnly.stagingDb} · package=${result.safetyGates.planOnly.package} · upload=${result.safetyGates.planOnly.upload}`,
    );
  }
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
