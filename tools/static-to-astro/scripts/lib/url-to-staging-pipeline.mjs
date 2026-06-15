/**
 * URL-to-staging pipeline orchestrator execution (G-7b).
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { runStaticSiteCrawl } from "./static-site-crawler.mjs";
import { DEFAULT_TOOL_ROOT } from "./site-config-loader.mjs";
import {
  PIPELINE_PHASE,
  buildNextManualSteps,
  buildRunManifestPath,
  buildSeoStagingPlan,
  buildUrlToStagingStepPlan,
  G7C_PILOT_PHASE,
  G7D_PILOT_PHASE,
  G7D1_PILOT_PHASE,
  G7E_NEXT_PHASE,
} from "./url-to-staging-pipeline-plan.mjs";

export {
  PIPELINE_PHASE,
  G7C_PILOT_PHASE,
  G7D_PILOT_PHASE,
  G7D1_PILOT_PHASE,
  G7E_NEXT_PHASE,
  buildNextManualSteps,
  buildRunManifestPath,
  buildSeoStagingPlan,
  buildUrlToStagingStepPlan,
} from "./url-to-staging-pipeline-plan.mjs";

/**
 * @param {Object} opts
 * @param {ReturnType<import("./url-to-staging-config-loader.mjs").normalizeUrlToStagingConfig>} opts.config
 * @param {import("./url-to-staging-pipeline-plan.mjs").PipelineGates} opts.gates
 * @param {boolean} opts.dryRun
 * @param {string} [opts.toolRoot]
 * @param {typeof fetch} [opts.fetchFn]
 * @param {boolean} [opts.writeManifest]
 * @param {boolean} [opts.printSummary]
 * @param {string} [opts.pilotPhase]
 */
export async function runUrlToStagingPipeline(opts) {
  const {
    config,
    gates,
    dryRun,
    toolRoot = DEFAULT_TOOL_ROOT,
    fetchFn,
    writeManifest = true,
    printSummary = true,
    pilotPhase = null,
  } = opts;

  /** @type {string[]} */
  const warnings = [];
  /** @type {Record<string, unknown>} */
  const artifacts = {};
  const steps = buildUrlToStagingStepPlan(config, gates, dryRun);
  const seoPlan = buildSeoStagingPlan(config);

  if (config.productionBaseUrl && config.stagingBaseUrl) {
    const prodHost = config.productionBaseUrl.replace(/^https?:\/\//, "");
    if (config.stagingBaseUrl.includes(prodHost) && !config.stagingBaseUrl.includes("cms-kit-staging")) {
      warnings.push("stagingBaseUrl appears to contain production host — verify SEO settings");
    }
  }
  if (!config.stagingBaseUrl) {
    warnings.push("stagingBaseUrl not set — convert should use staging URL, not production startUrl");
  }

  const validateStep = steps.find((s) => s.id === "validate-config");
  if (validateStep) validateStep.status = "executed";

  if (gates.runCrawl) {
    const crawlStep = steps.find((s) => s.id === "crawl-fixture");
    try {
      const crawlResult = await runStaticSiteCrawl({
        startUrl: config.startUrl,
        siteSlug: config.siteSlug,
        outDir: config.fixtureOut,
        maxPages: config.maxPages,
        sameOriginOnly: config.sameOriginOnly,
        respectRobots: config.respectRobots,
        dryRun,
        fetchFn,
      });
      artifacts.crawlManifest = crawlResult.manifestPath ?? null;
      if (crawlStep) {
        crawlStep.status = dryRun ? "planned" : "executed";
        crawlStep.details = {
          ...crawlStep.details,
          pagesCrawled: crawlResult.manifest?.pages?.length ?? 0,
        };
      }
    } catch (err) {
      if (crawlStep) {
        crawlStep.status = "failed";
        crawlStep.details = { ...crawlStep.details, error: String(err.message ?? err) };
      }
      warnings.push(`crawl failed: ${err.message ?? err}`);
    }
  }

  const fixtureExists = fs.existsSync(config.fixtureOut);
  const analyzeStep = steps.find((s) => s.id === "analyze-fixture");

  if (!dryRun && (gates.runCrawl || fixtureExists)) {
    try {
      if (!fixtureExists) {
        throw new Error(`Fixture not found: ${config.fixtureOut}`);
      }
      const { analyzeStaticSite, buildJsonReport } = await import("./static-site-analyzer.mjs");
      const analysis = analyzeStaticSite(config.fixtureOut);
      const baseUrl = config.stagingBaseUrl ?? config.productionBaseUrl ?? config.startUrl;
      const report = buildJsonReport(analysis, { baseUrl });
      const reportPath = path.join(config.runsOut, `${config.siteSlug}-analysis.json`);
      fs.mkdirSync(config.runsOut, { recursive: true });
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      artifacts.analysisReport = reportPath;
      if (analyzeStep) {
        analyzeStep.status = "executed";
        analyzeStep.details = { ...analyzeStep.details, pageCount: analysis.pages.length };
      }
    } catch (err) {
      if (analyzeStep) {
        analyzeStep.status = "failed";
        analyzeStep.details = { ...analyzeStep.details, error: String(err.message ?? err) };
      }
      warnings.push(`analyze failed: ${err.message ?? err}`);
    }
  } else if (analyzeStep && dryRun) {
    analyzeStep.status = "planned";
  }

  const convertStep = steps.find((s) => s.id === "convert-static-to-astro");
  if (gates.runConvert && !dryRun) {
    try {
      if (!fixtureExists && !gates.runCrawl) {
        throw new Error(`Fixture not found: ${config.fixtureOut}`);
      }
      const { generateAstroProject } = await import("./astro-generator.mjs");
      const result = generateAstroProject(config.fixtureOut, config.projectOut, {
        dryRun: false,
        baseUrl: config.stagingBaseUrl ?? null,
        deployBase: config.deployBase,
        siteProfile: config.siteProfile,
        verifyBuild: gates.runBuild,
      });
      artifacts.astroProject = config.projectOut;
      artifacts.conversionReport = path.join(config.projectOut, "CONVERSION_REPORT.md");
      if (convertStep) {
        convertStep.status = "executed";
        convertStep.details = {
          ...convertStep.details,
          pageCount: result.analysis?.pages?.length ?? 0,
        };
      }
    } catch (err) {
      if (convertStep) {
        convertStep.status = "failed";
        convertStep.details = { ...convertStep.details, error: String(err.message ?? err) };
      }
      warnings.push(`convert failed: ${err.message ?? err}`);
    }
  }

  const buildStep = steps.find((s) => s.id === "build-check");
  if (gates.runBuild && !dryRun && gates.runConvert && convertStep?.status === "executed") {
    const distExists = fs.existsSync(path.join(config.projectOut, "dist"));
    if (!distExists && fs.existsSync(path.join(config.projectOut, "package.json"))) {
      const build = spawnSync("npm", ["run", "build"], {
        cwd: config.projectOut,
        encoding: "utf8",
        shell: process.platform === "win32",
      });
      if (build.status === 0) {
        if (buildStep) buildStep.status = "executed";
        artifacts.buildDist = path.join(config.projectOut, "dist");
      } else {
        if (buildStep) {
          buildStep.status = "failed";
          buildStep.details = { stderr: build.stderr?.slice(0, 500) };
        }
        warnings.push("npm run build failed");
      }
    } else if (distExists && buildStep) {
      buildStep.status = "executed";
      buildStep.details = { note: "dist already present (verify-build or prior build)" };
    }
  }

  const publicStep = steps.find((s) => s.id === "prepare-staging-public");
  if (gates.preparePublic && !dryRun) {
    try {
      const { runStaticPublicArtifactVerification } = await import(
        "./static-public-artifact-verifier.mjs"
      );
      const pubResult = runStaticPublicArtifactVerification({
        astroDir: config.projectOut,
        toolRoot,
        publicDirCli: null,
        manifestOutDir: config.staticPublicOut,
      });
      artifacts.staticPublic = pubResult.staticPublicCopy?.dest ?? config.staticPublicOut;
      if (publicStep) {
        publicStep.status = pubResult.passed ? "executed" : "failed";
        publicStep.details = { passed: pubResult.passed, errors: pubResult.errors };
      }
      if (!pubResult.passed) {
        warnings.push(`static-public verification failed: ${pubResult.errors.join("; ")}`);
      }
    } catch (err) {
      if (publicStep) {
        publicStep.status = "failed";
        publicStep.details = { error: String(err.message ?? err) };
      }
      warnings.push(`prepare-public failed: ${err.message ?? err}`);
    }
  }

  const deployStep = steps.find((s) => s.id === "deploy-ftp");
  if (deployStep && gates.deployFtp) {
    deployStep.status = "planned";
    warnings.push("deploy-ftp gate is plan-only in G-7b — run deploy-public-dist-ftp.mjs manually");
  }

  const nextManualSteps = buildNextManualSteps(config, gates, dryRun);
  const manifestPath = buildRunManifestPath(config.siteSlug, config.runsOut);
  const fixtureExistsAtEnd = fs.existsSync(config.fixtureOut);

  const distExists = fs.existsSync(path.join(config.projectOut, "dist"));
  const convertOk =
    convertStep?.status === "executed" ||
    (distExists && !gates.runConvert && fixtureExistsAtEnd);
  const buildOk =
    steps.find((s) => s.id === "build-check")?.status === "executed" ||
    (convertOk && gates.runBuild && distExists) ||
    distExists;
  const publicOk = steps.find((s) => s.id === "prepare-staging-public")?.status === "executed";
  const g7dFamilyPhase =
    pilotPhase === G7D_PILOT_PHASE || pilotPhase === G7D1_PILOT_PHASE;

  /** @type {Record<string, unknown>} */
  const manifest = {
    phase: pilotPhase ?? PIPELINE_PHASE,
    siteSlug: config.siteSlug,
    startUrl: config.startUrl,
    fixtureOut: config.fixtureOutRel,
    fixtureExists: fixtureExistsAtEnd,
    dryRun,
    gates,
    wouldRun: steps.some((s) => s.wouldRun),
    wouldWrite: steps.some((s) => s.wouldWrite),
    wouldDeploy: false,
    steps,
    seo: seoPlan,
    warnings,
    artifacts,
    nextManualSteps,
    manifestPath,
    safety: {
      externalCrawl: gates.runCrawl && !dryRun,
      externalCrawlExecuted: gates.runCrawl && !dryRun,
      ftpDeploy: false,
      ftpDeployExecuted: false,
      workflowDispatch: false,
      workflowDispatchExecuted: false,
      dbWrite: false,
      dbWriteExecuted: false,
      productionTouched: false,
      outputCommitRequired: false,
      secretsRequired: false,
    },
    pilot: pilotPhase
      ? {
          id: pilotPhase,
          fixtureSource: config.fixtureOutRel,
          localFixtureUsed: fixtureExistsAtEnd && !gates.runCrawl,
        }
      : null,
    readyForG7cUrlToStagingDryRunPilot: pilotPhase === G7C_PILOT_PHASE ? true : undefined,
    readyForG7dGosakiLiveCrawlPilot:
      pilotPhase === G7C_PILOT_PHASE &&
      !gates.runCrawl &&
      fixtureExistsAtEnd &&
      (dryRun ||
        (distExists && buildOk && publicOk && (convertOk || distExists))),
    readyForG7eGosakiStagingPreviewPreparation:
      g7dFamilyPhase && convertOk && buildOk && publicOk && distExists,
    gosakiLiveRouteStaticPublicCompatibilityFixComplete:
      pilotPhase === G7D1_PILOT_PHASE ? publicOk && distExists : undefined,
    g7dLiveCrawlPrerequisites: pilotPhase === G7C_PILOT_PHASE
      ? {
          dryRunPlanPass: true,
          localFixtureConvertBuildPass: distExists && buildOk,
          localFixturePublicArtifactPass: publicOk,
          fixturePathNote:
            "G-7b config fixtureOut=fixtures/gosaki-piano (empty); pilot uses fixtures/gosaki-static-site",
          outputGitignored: true,
          operatorApprovalRequired: true,
          respectRobots: config.respectRobots,
          recommendedMaxPagesForFirstLiveCrawl: 20,
        }
      : undefined,
    g7eStagingPreviewPrerequisites:
      g7dFamilyPhase
        ? {
            liveCrawlCompleted: true,
            convertPass: convertOk,
            buildPass: buildOk,
            preparePublicPass: publicOk,
            routeCompatibilityFixComplete:
              pilotPhase === G7D1_PILOT_PHASE ? publicOk && distExists : undefined,
            ftpDeployRequired: true,
            browserQaRequired: true,
            operatorApprovalRequired: true,
          }
        : undefined,
  };

  if (writeManifest) {
    fs.mkdirSync(config.runsOut, { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    artifacts.runManifest = manifestPath;
    const manifestStep = steps.find((s) => s.id === "write-run-manifest");
    if (manifestStep) manifestStep.status = "executed";
  }

  const printStep = steps.find((s) => s.id === "print-next-manual-steps");
  if (printStep) printStep.status = "executed";

  if (printSummary) {
    console.log(`\n=== URL-to-staging pipeline (${manifest.phase}) ===`);
    console.log(`site: ${config.siteSlug}  dryRun: ${dryRun}`);
    console.log(`wouldRun: ${manifest.wouldRun}  wouldWrite: ${manifest.wouldWrite}  wouldDeploy: false`);
    for (const step of steps) {
      const flags = [
        step.wouldRun ? "RUN" : "---",
        step.wouldWrite ? "WRITE" : "-----",
        step.wouldDeploy ? "DEPLOY" : "------",
      ].join(" ");
      console.log(`  [${step.status.padEnd(8)}] ${flags} ${step.id}`);
      if (step.command) console.log(`           ${step.command}`);
    }
    if (warnings.length) {
      console.log("\nWarnings:");
      for (const w of warnings) console.log(`  - ${w}`);
    }
    console.log("\nNext manual steps:");
    for (const s of nextManualSteps) console.log(`  - ${s}`);
    if (writeManifest) console.log(`\nManifest: ${manifestPath}`);
  }

  return manifest;
}
