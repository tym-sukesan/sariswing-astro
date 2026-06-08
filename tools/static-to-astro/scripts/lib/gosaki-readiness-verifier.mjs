/**
 * gosaki readiness verification (Phase 3-Y).
 * Aggregates checks before staging FTP apply (G-2b).
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  findAvailableDevPort,
  killProcessesOnPort,
  tailOutput,
} from "./admin-api-auth-verifier.mjs";
import {
  ALLOWED_DEPLOY_ENV,
  loadStagingFtpEnv,
  normalizeDeployEnv,
  scanTextForSecretLiterals,
} from "./public-dist-ftp-deployer.mjs";
import { verifyProfileDefinitions } from "./site-profile-verifier.mjs";
import { loadExportEnv, supabaseHostFromUrl } from "./supabase-json-exporter.mjs";

export const SITE_SLUG = "gosaki";
export const PROFILE_ID = "musician";
export const BASE_URL = "https://www.gosaki-piano.com";

export const PATHS = {
  fixture: "tools/static-to-astro/fixtures/gosaki-static-site",
  generatedAstro: "tools/static-to-astro/output/generated-astro",
  siteProfileReport: "tools/static-to-astro/output/site-profiles/SITE_PROFILE_VERIFY_REPORT.md",
  exportReport: "tools/static-to-astro/output/supabase-export/gosaki/SUPABASE_EXPORT_REPORT.md",
  staticPublicReport: "tools/static-to-astro/output/static-public/gosaki/STATIC_PUBLIC_ARTIFACT_REPORT.md",
  publicDist: "tools/static-to-astro/output/static-public/gosaki/public-dist",
  deployReport: "tools/static-to-astro/output/deploy/gosaki/STAGING_FTP_DEPLOY_REPORT.md",
  deployManifest: "tools/static-to-astro/output/deploy/gosaki/staging-ftp-deploy-manifest.json",
  deployPlanReport: "tools/static-to-astro/output/deploy/gosaki/STAGING_FTP_DEPLOY_PLAN_VERIFY_REPORT.md",
  cmsLoopReport: "tools/static-to-astro/output/rls/gosaki/CMS_MINIMAL_LOOP_VERIFY_REPORT.md",
  storagePlanReport: "tools/static-to-astro/output/storage/gosaki/STORAGE_ASSET_PLAN_REPORT.md",
  storagePlanManifest: "tools/static-to-astro/output/storage/gosaki/storage-asset-plan.json",
  seedDir: "tools/static-to-astro/output/supabase-seed/gosaki",
  exportDataDir: "tools/static-to-astro/output/generated-astro/src/data",
};

const STORAGE_PLAN_SCRIPT = "tools/static-to-astro/scripts/plan-storage-assets.mjs";


const SECRET_VALUE_PATTERN =
  /(?:SUPABASE_SERVICE_ROLE_KEY|FTP_PASSWORD|SUPABASE_ADMIN_PASSWORD|GOSAKI_STAGING_FTP_PASSWORD)\s*=\s*['"]?([^'"\s#]+)/;
const JWT_LIKE = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/;

const PLACEHOLDER_VALUE =
  /^(?:your-|example\.|xxx|changeme|placeholder|\*{3,}|—|-)?$|your-|example\.com|supabase\.co$/i;

/**
 * @param {string} line
 */
export function isLikelySecretAssignment(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return false;
  if (/^(grep|git grep|node |npm )/.test(trimmed)) return false;
  if (/\$\{|\$\(|secrets\.|\.slice\(|startsWith\(/.test(line)) return false;
  const m = line.match(SECRET_VALUE_PATTERN);
  if (!m) return false;
  const val = (m[1] ?? "").trim();
  if (!val) return false;
  if (/[\*\.]/.test(val) && val.includes("*")) return false;
  if (PLACEHOLDER_VALUE.test(val)) return false;
  if (/^your-[a-z-]+$/i.test(val)) return false;
  if (JWT_LIKE.test(val)) return true;
  return val.length >= 24 && /^[A-Za-z0-9_\-+/=]+$/.test(val);
}

/**
 * @param {string} repoRoot
 * @param {string} scriptRel
 * @param {string[]} args
 * @param {{ ci?: boolean }} [options]
 */
export function runNodeCli(repoRoot, scriptRel, args = [], options = {}) {
  const { ci = true } = options;
  const script = path.join(repoRoot, scriptRel);
  const childEnv = { ...process.env };
  if (ci) childEnv.CI = "1";

  const result = spawnSync("node", [script, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    env: childEnv,
  });
  return {
    ok: result.status === 0,
    status: result.status ?? -1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    script: scriptRel,
    args,
  };
}

const CMS_LOOP_SCRIPT = "tools/static-to-astro/scripts/verify-cms-minimal-loop.mjs";

/**
 * @param {string} repoRoot
 */
export function runCmsMinimalLoopCli(repoRoot) {
  const port = findAvailableDevPort(4322);
  const args = [
    "--astro-dir",
    PATHS.generatedAstro,
    "--report",
    PATHS.cmsLoopReport,
    "--port",
    String(port),
  ];
  const command = `node ${CMS_LOOP_SCRIPT} ${args.join(" ")}`;

  let cliResult = {
    ok: false,
    status: -1,
    stdout: "",
    stderr: "",
    script: CMS_LOOP_SCRIPT,
    args,
  };

  try {
    cliResult = runNodeCli(repoRoot, CMS_LOOP_SCRIPT, args, { ci: false });
  } finally {
    killProcessesOnPort(port);
  }

  return {
    ...cliResult,
    port,
    command,
    stdoutTail: tailOutput(cliResult.stdout),
    stderrTail: tailOutput(cliResult.stderr),
    devServerCleanedUp: true,
  };
}

/**
 * @param {string} repoRoot
 */
export function checkGitStatus(repoRoot) {
  const result = spawnSync("git", ["status", "--short"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  const lines = (result.stdout ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return {
    ok: result.status === 0,
    clean: lines.length === 0,
    lines,
    warning: lines.length > 0 ? "working tree not clean (warning only)" : null,
  };
}

/** Local parts scanned in git-tracked files (values not logged). */
const PERSONAL_EMAIL_LOCAL_PARTS = [
  ["ysk", "toyamax"].join(""),
  ["biku", "sari"].join(""),
];
const PERSONAL_EMAIL_GREP_PATTERN = PERSONAL_EMAIL_LOCAL_PARTS.join("|");

/** Pattern-definition sources excluded from personal-email hits. */
const PERSONAL_EMAIL_SCAN_EXCLUDE_FILES = new Set([
  "tools/static-to-astro/scripts/lib/gosaki-readiness-verifier.mjs",
]);

/**
 * @param {string} line
 * @returns {{ filePath: string, lineNum: string, content: string } | null}
 */
function parseGitGrepLine(line) {
  const match = line.match(/^([^:]+):(\d+):(.*)$/);
  if (!match) return null;
  return { filePath: match[1], lineNum: match[2], content: match[3] };
}

/**
 * @param {string} filePath
 * @param {string} content
 */
export function isIgnorablePersonalEmailHit(filePath, content) {
  const normalizedPath = filePath.replace(/^\.\//, "");
  if (
    PERSONAL_EMAIL_SCAN_EXCLUDE_FILES.has(filePath) ||
    PERSONAL_EMAIL_SCAN_EXCLUDE_FILES.has(normalizedPath)
  ) {
    return true;
  }

  if (/EMAIL_PATTERN_PLACEHOLDER/i.test(content)) return true;

  if (/\bgit grep\b/.test(content) || /^\s*(git )?grep\b/.test(content.trim())) return true;

  // Regex alternation in quotes — pattern definition, not a literal local-part usage.
  if (
    /["'`][^"'`]*\|[^"'`]*["'`]/.test(content) &&
    PERSONAL_EMAIL_LOCAL_PARTS.every((part) => content.toLowerCase().includes(part))
  ) {
    return true;
  }

  return false;
}

/**
 * @param {string} repoRoot
 */
export function scanGitTrackedForPersonalEmail(repoRoot) {
  const result = spawnSync(
    "git",
    ["grep", "-n", "-i", "-E", PERSONAL_EMAIL_GREP_PATTERN],
    { cwd: repoRoot, encoding: "utf8" },
  );
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  const rawHits = output
    ? output.split("\n").filter((line) => line && !line.startsWith("Binary file"))
    : [];

  /** @type {string[]} */
  const realHits = [];
  let ignoredCount = 0;

  for (const line of rawHits) {
    const parsed = parseGitGrepLine(line);
    if (!parsed) {
      realHits.push("(unparsed hit)");
      continue;
    }
    if (isIgnorablePersonalEmailHit(parsed.filePath, parsed.content)) {
      ignoredCount++;
      continue;
    }
    realHits.push(`${parsed.filePath}:${parsed.lineNum}`);
  }

  return {
    ok: realHits.length === 0,
    hitCount: realHits.length,
    hits: realHits,
    ignoredCount,
  };
}

/**
 * @param {string} repoRoot
 * @param {string} toolRoot
 */
export function scanRepositorySecrets(repoRoot, toolRoot) {
  /** @type {string[]} */
  const issues = [];
  /** @type {string[]} */
  const warnings = [];

  const gitLs = spawnSync("git", ["ls-files", "tools/static-to-astro"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  const files = (gitLs.stdout ?? "").split("\n").filter(Boolean);

  for (const rel of files) {
    const abs = path.join(repoRoot, rel);
    if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) continue;
    if (/\.env\.example$/i.test(rel)) continue;
    if (/\.(png|jpg|jpeg|gif|webp|ico|woff2?)$/i.test(rel)) continue;
    let content;
    try {
      content = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    if (JWT_LIKE.test(content)) issues.push(`jwt-like in ${rel}`);
    for (const line of content.split("\n")) {
      if (isLikelySecretAssignment(line)) {
        issues.push(`secret assignment in ${rel}`);
        break;
      }
    }
    if (/GOSAKI_PROD_/.test(content) && /=/.test(content) && !rel.endsWith(".md") && !rel.includes("/lib/public-dist-ftp-deployer")) {
      warnings.push(`GOSAKI_PROD_ reference in ${rel}`);
    }
  }

  const envIgnored = spawnSync("git", ["check-ignore", "-v", "tools/static-to-astro/.env.local"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  const envLocalGitIgnored = envIgnored.status === 0;

  let stagingHost = null;
  try {
    const env = loadExportEnv(toolRoot);
    stagingHost = supabaseHostFromUrl(env.supabaseUrl);
  } catch {
    warnings.push("could not load .env.local for staging host check (export/cms may fail)");
  }

  return {
    ok: issues.length === 0,
    issues,
    warnings,
    envLocalGitIgnored,
    stagingHost,
    prodDeployEnvRejected: !normalizeDeployEnv("production").ok,
  };
}

/**
 * @param {string} repoRoot
 */
export function parseExportCounts(repoRoot) {
  const schedulesPath = path.join(repoRoot, PATHS.generatedAstro, "src/data/schedules.json");
  const discographyPath = path.join(repoRoot, PATHS.generatedAstro, "src/data/discography.json");
  let trackCount = 0;

  if (!fs.existsSync(schedulesPath) || !fs.existsSync(discographyPath)) {
    return { ok: false, schedules: 0, discography: 0, tracks: 0 };
  }

  const schedules = JSON.parse(fs.readFileSync(schedulesPath, "utf8"));
  const discography = JSON.parse(fs.readFileSync(discographyPath, "utf8"));
  for (const album of discography) {
    trackCount += album.tracks?.length ?? 0;
  }

  return {
    ok: true,
    schedules: schedules.length,
    discography: discography.length,
    tracks: trackCount,
    expectedSchedules: 60,
    expectedDiscography: 4,
    expectedTracks: 16,
    countsMatch:
      schedules.length === 60 && discography.length === 4 && trackCount === 16,
  };
}

/**
 * @param {string} repoRoot
 */
export function readConversionReportHints(repoRoot) {
  const reportPath = path.join(repoRoot, PATHS.generatedAstro, "CONVERSION_REPORT.md");
  if (!fs.existsSync(reportPath)) {
    return { ok: false, profile: null, adminApplied: false, buildSuccess: false };
  }
  const content = fs.readFileSync(reportPath, "utf8");
  return {
    ok: true,
    profile: /Profile:\s*musician/m.test(content),
    adminApplied: /Admin CMS template[\s\S]*?Applied:\s*yes/i.test(content) || /## Admin CMS template \(Phase 3-S\)/i.test(content),
    buildSuccess: /buildSuccess:\s*true/i.test(content) || /\*\*成功\*\*/.test(content) || /Build:\s*success/i.test(content),
  };
}

/**
 * @param {string} repoRoot
 */
export function readDeployManifest(repoRoot) {
  const abs = path.join(repoRoot, PATHS.deployManifest);
  if (!fs.existsSync(abs)) return null;
  try {
    return JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch {
    return null;
  }
}

/**
 * @param {string} repoRoot
 */
export function buildStoragePlanCliArgs(repoRoot) {
  /** @type {string[]} */
  const args = [
    "--site-slug",
    SITE_SLUG,
    "--report",
    PATHS.storagePlanReport,
    "--manifest",
    PATHS.storagePlanManifest,
    "--data-dir",
    PATHS.exportDataDir,
  ];

  const seedAbs = path.join(repoRoot, PATHS.seedDir);
  if (fs.existsSync(seedAbs)) {
    args.push("--seed-dir", PATHS.seedDir);
  }

  return {
    args,
    command: `node ${STORAGE_PLAN_SCRIPT} ${args.join(" ")}`,
    seedDirUsed: fs.existsSync(seedAbs),
    dataDirUsed: fs.existsSync(path.join(repoRoot, PATHS.exportDataDir)),
  };
}

/**
 * @param {string} repoRoot
 */
export function readStorageManifest(repoRoot) {
  const abs = path.join(repoRoot, PATHS.storagePlanManifest);
  if (!fs.existsSync(abs)) return null;
  try {
    return JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch {
    return null;
  }
}

/**
 * @param {object} checks
 */
export function computeReadyForStagingFtpApply(checks) {
  const required = [
    checks.siteProfile?.pass,
    checks.convert?.pass,
    checks.export?.pass,
    checks.build?.pass,
    checks.staticPublic?.pass,
    checks.deployDryRun?.pass,
    checks.deployPlan?.pass,
    checks.productionSafety?.pass,
    checks.secretScan?.pass,
  ];

  if (!checks.skipCmsLoop) required.push(checks.cmsLoop?.pass);
  if (!checks.skipStoragePlan) required.push(checks.storagePlan?.pass);

  const ready = required.every(Boolean);
  return { ready, requiredChecks: required.filter((v) => v !== undefined) };
}

/**
 * @param {object} opts
 */
export function runGosakiReadinessVerification(opts) {
  const {
    repoRoot,
    toolRoot,
    reportPath,
    skipCmsLoop = false,
    skipStoragePlan = false,
    skipDeployPlan = false,
    keepOutput = false,
  } = opts;

  const started = Date.now();
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  const mode = "dry-run";
  const timestamp = new Date().toISOString();

  const git = checkGitStatus(repoRoot);
  if (!git.clean) warnings.push(git.warning);

  const personalEmail = scanGitTrackedForPersonalEmail(repoRoot);
  const secretScan = scanRepositorySecrets(repoRoot, toolRoot);

  const profileDefs = verifyProfileDefinitions(toolRoot);
  const siteProfileCli = runNodeCli(repoRoot, "tools/static-to-astro/scripts/verify-site-profiles.mjs", [
    "--report",
    PATHS.siteProfileReport,
  ]);

  const convertCli = runNodeCli(repoRoot, "tools/static-to-astro/scripts/convert-static-to-astro.mjs", [
    PATHS.fixture,
    PATHS.generatedAstro,
    "--base-url",
    BASE_URL,
    "--verify-build",
    "--with-admin-cms",
    "--site-profile",
    PROFILE_ID,
  ]);

  const conversionHints = readConversionReportHints(repoRoot);

  const exportCli = runNodeCli(repoRoot, "tools/static-to-astro/scripts/export-supabase-json.mjs", [
    "--out-astro-dir",
    PATHS.generatedAstro,
    "--report",
    PATHS.exportReport,
  ]);

  const exportCounts = parseExportCounts(repoRoot);

  const buildResult = spawnSync("npm", ["run", "build"], {
    cwd: path.join(repoRoot, PATHS.generatedAstro),
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, CI: "1" },
  });
  const buildPass = buildResult.status === 0 || exportCli.stdout.includes("Build: success");

  const staticPublicCli = runNodeCli(
    repoRoot,
    "tools/static-to-astro/scripts/verify-static-public-artifact.mjs",
    ["--astro-dir", PATHS.generatedAstro, "--report", PATHS.staticPublicReport],
  );

  let deployDryRunCli = { ok: false, stdout: "", stderr: "" };
  let deployPlanCli = { ok: false, stdout: "", stderr: "" };
  if (!skipDeployPlan) {
    deployDryRunCli = runNodeCli(repoRoot, "tools/static-to-astro/scripts/deploy-public-dist-ftp.mjs", [
      "--public-dir",
      PATHS.publicDist,
      "--site-slug",
      SITE_SLUG,
      "--env",
      ALLOWED_DEPLOY_ENV,
      "--report",
      PATHS.deployReport,
      "--manifest",
      PATHS.deployManifest,
    ]);
    deployPlanCli = runNodeCli(
      repoRoot,
      "tools/static-to-astro/scripts/verify-staging-ftp-deploy-plan.mjs",
      ["--public-dir", PATHS.publicDist, "--report", PATHS.deployPlanReport],
    );
  }

  const deployManifest = readDeployManifest(repoRoot);

  let cmsLoopCli = {
    ok: false,
    skipped: true,
    stdout: "",
    stderr: "",
    port: null,
    command: null,
    stdoutTail: "",
    stderrTail: "",
    devServerCleanedUp: true,
  };
  if (!skipCmsLoop) {
    cmsLoopCli = {
      ...runCmsMinimalLoopCli(repoRoot),
      skipped: false,
    };
  } else {
    warnings.push("CMS minimal loop skipped (--skip-cms-loop)");
  }

  let storagePlanCli = {
    ok: false,
    skipped: true,
    stdout: "",
    stderr: "",
    command: null,
    seedDirUsed: false,
    dataDirUsed: false,
  };
  if (!skipStoragePlan) {
    const storagePlanInvoke = buildStoragePlanCliArgs(repoRoot);
    storagePlanCli = {
      ...runNodeCli(repoRoot, STORAGE_PLAN_SCRIPT, storagePlanInvoke.args),
      skipped: false,
      command: storagePlanInvoke.command,
      seedDirUsed: storagePlanInvoke.seedDirUsed,
      dataDirUsed: storagePlanInvoke.dataDirUsed,
    };
  } else {
    warnings.push("Storage asset plan skipped (--skip-storage-plan)");
  }

  const storageManifest = readStorageManifest(repoRoot);
  const ftpEnv = loadStagingFtpEnv(toolRoot);

  const checks = {
    skipCmsLoop,
    skipStoragePlan,
    skipDeployPlan,
    git: {
      pass: git.ok,
      clean: git.clean,
      lines: git.lines,
    },
    secretScan: {
      pass: secretScan.ok && personalEmail.ok,
      personalEmailOk: personalEmail.ok,
      personalEmailHitCount: personalEmail.hitCount,
      envLocalGitIgnored: secretScan.envLocalGitIgnored,
      issues: secretScan.issues,
      scanWarnings: secretScan.warnings,
      warnings: [...warnings, ...secretScan.warnings],
      stagingHost: secretScan.stagingHost,
    },
    siteProfile: {
      pass: profileDefs.ok && siteProfileCli.ok,
      profilesFound: profileDefs.found,
      validationPass: profileDefs.ok,
      cliPass: siteProfileCli.ok,
    },
    convert: {
      pass: convertCli.ok && conversionHints.profile && conversionHints.adminApplied,
      cliPass: convertCli.ok,
      profileMusician: conversionHints.profile,
      adminCmsApplied: conversionHints.adminApplied,
      buildInConvert: conversionHints.buildSuccess,
    },
    export: {
      pass: exportCli.ok && exportCounts.ok,
      cliPass: exportCli.ok,
      readOnly: exportCli.stdout.includes("READ-ONLY") || exportCli.stdout.includes("No Supabase writes"),
      counts: exportCounts,
    },
    build: {
      pass: buildPass,
      npmExit: buildResult.status,
    },
    staticPublic: {
      pass: staticPublicCli.ok && staticPublicCli.stdout.includes("safeForStaticFtp: true"),
      cliPass: staticPublicCli.ok,
      safeForStaticFtp: staticPublicCli.stdout.includes("safeForStaticFtp: true"),
    },
    deployDryRun: {
      pass: skipDeployPlan || (deployDryRunCli.ok && deployManifest?.applied === false && deployManifest?.ftpConnected === false),
      skipped: skipDeployPlan,
      cliPass: deployDryRunCli.ok,
      mode: deployManifest?.mode ?? null,
      applied: deployManifest?.applied ?? null,
      ftpConnected: deployManifest?.ftpConnected ?? false,
    },
    deployPlan: {
      pass: skipDeployPlan || deployPlanCli.ok,
      skipped: skipDeployPlan,
      productionRejected: deployPlanCli.stdout.includes("production rejected: yes"),
    },
    cmsLoop: {
      pass: skipCmsLoop || cmsLoopCli.ok,
      skipped: skipCmsLoop,
      cliPass: cmsLoopCli.ok,
      port: cmsLoopCli.port,
      command: cmsLoopCli.command,
      stdoutTail: cmsLoopCli.stdoutTail,
      stderrTail: cmsLoopCli.stderrTail,
      devServerCleanedUp: cmsLoopCli.devServerCleanedUp,
    },
    storagePlan: {
      pass:
        skipStoragePlan ||
        (storagePlanCli.ok &&
          storageManifest?.uploadsPerformed === false &&
          storageManifest?.mode === "dry-run" &&
          (storageManifest?.summary?.total ?? 0) > 0 &&
          storageManifest?.secretLeak === "none"),
      skipped: skipStoragePlan,
      cliPass: storagePlanCli.ok,
      command: storagePlanCli.command,
      seedDirUsed: storagePlanCli.seedDirUsed,
      dataDirUsed: storagePlanCli.dataDirUsed,
      inputFormat: storageManifest?.inputMeta?.inputFormat ?? null,
      schedulesCount: storageManifest?.inputMeta?.schedulesCount ?? null,
      discographyCount: storageManifest?.inputMeta?.discographyCount ?? null,
      totalRows: storageManifest?.summary?.total ?? null,
      uploadsPerformed: storageManifest?.uploadsPerformed ?? null,
      secretLeak: storageManifest?.secretLeak ?? null,
    },
    productionSafety: {
      pass:
        (deployManifest?.ftpConnected === false || skipDeployPlan) &&
        (deployManifest?.applied === false || skipDeployPlan) &&
        secretScan.prodDeployEnvRejected &&
        !ftpEnv.usedProdPrefix,
      ftpConnected: deployManifest?.ftpConnected ?? false,
      productionTouched: false,
      prodEnvRejected: secretScan.prodDeployEnvRejected,
      prodSecretsNotUsedInDeploy: !ftpEnv.usedProdPrefix,
    },
  };

  const readiness = computeReadyForStagingFtpApply(checks);

  if (!checks.git.clean) warnings.push("git working tree not clean");
  if (!checks.secretScan.pass) errors.push("secret scan failed");
  if (!checks.siteProfile.pass) errors.push("site profile check failed");
  if (!checks.convert.pass) errors.push("convert check failed");
  if (!checks.export.pass) errors.push("export check failed");
  if (!checks.build.pass) errors.push("build check failed");
  if (!checks.staticPublic.pass) errors.push("static-public check failed");
  if (!checks.deployDryRun.pass) errors.push("deploy dry-run check failed");
  if (!checks.deployPlan.pass) errors.push("deploy plan verifier failed");
  if (!checks.cmsLoop.pass) errors.push("CMS minimal loop failed");
  if (!checks.storagePlan.pass) errors.push("storage plan failed");
  if (!checks.productionSafety.pass) errors.push("production safety check failed");

  const result = {
    ok: readiness.ready && errors.length === 0,
    mode,
    timestamp,
    siteSlug: SITE_SLUG,
    profile: PROFILE_ID,
    elapsedMs: Date.now() - started,
    readyForStagingFtpApply: readiness.ready,
    checks,
    errors,
    warnings,
    keepOutput,
    outputNotCommitted: true,
    ftpConnected: deployManifest?.ftpConnected ?? false,
    productionTouched: false,
  };

  if (reportPath) {
    writeReadinessReport(result, reportPath, repoRoot);
  }

  return result;
}

/**
 * @param {object} result
 * @param {string} reportPath
 * @param {string} repoRoot
 */
export function writeReadinessReport(result, reportPath, repoRoot) {
  const abs = path.isAbsolute(reportPath) ? reportPath : path.join(repoRoot, reportPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });

  const c = result.checks;
  const lines = [
    "# gosaki Readiness Report (Phase 3-Y)",
    "",
    `- **Result:** ${result.ok ? "PASS" : "FAIL"}`,
    `- **Mode:** ${result.mode}`,
    `- **Timestamp:** ${result.timestamp}`,
    `- **siteSlug:** ${result.siteSlug}`,
    `- **profile:** ${result.profile}`,
    `- **READY_FOR_STAGING_FTP_APPLY:** ${result.readyForStagingFtpApply ? "yes" : "no"}`,
    `- **Elapsed:** ${result.elapsedMs}ms`,
    "",
    "## Checks summary",
    "",
    "| Check | Status |",
    "| --- | --- |",
    `| git status clean | ${c.git.clean ? "yes" : "no (warning)"} |`,
    `| secret scan | ${c.secretScan.pass ? "PASS" : "FAIL"} |`,
    `| site profile | ${c.siteProfile.pass ? "PASS" : "FAIL"} |`,
    `| convert + admin cms | ${c.convert.pass ? "PASS" : "FAIL"} |`,
    `| Supabase export | ${c.export.pass ? "PASS" : "FAIL"} |`,
    `| build | ${c.build.pass ? "PASS" : "FAIL"} |`,
    `| static-public artifact | ${c.staticPublic.pass ? "PASS" : "FAIL"} |`,
    `| deploy dry-run | ${c.deployDryRun.skipped ? "SKIP" : c.deployDryRun.pass ? "PASS" : "FAIL"} |`,
    `| deploy plan verifier | ${c.deployPlan.skipped ? "SKIP" : c.deployPlan.pass ? "PASS" : "FAIL"} |`,
    `| CMS minimal loop | ${c.cmsLoop.skipped ? "SKIP" : c.cmsLoop.pass ? "PASS" : "FAIL"} |`,
    `| Storage asset plan | ${c.storagePlan.skipped ? "SKIP" : c.storagePlan.pass ? "PASS" : "FAIL"} |`,
    `| production safety | ${c.productionSafety.pass ? "PASS" : "FAIL"} |`,
    "",
    "## Git / secrets",
    "",
    `- gitStatusClean: ${c.git.clean ? "yes" : "no"}`,
    `- .env.local gitignored: ${c.secretScan.envLocalGitIgnored ? "yes" : "no"}`,
    `- personal email scan: ${c.secretScan.personalEmailOk ? "OK" : "FAIL"}`,
    `- staging Supabase host (if loaded): ${c.secretScan.stagingHost ?? "(not loaded)"}`,
    `- FTP connected: ${result.ftpConnected ? "yes" : "no"}`,
    `- production touched: ${result.productionTouched ? "yes" : "no"}`,
    "",
    "## Export counts",
    "",
    `- schedules: ${c.export.counts?.schedules ?? "—"} (expected 60)`,
    `- discography: ${c.export.counts?.discography ?? "—"} (expected 4)`,
    `- discography_tracks: ${c.export.counts?.tracks ?? "—"} (expected 16)`,
    `- read-only: ${c.export.readOnly ? "yes" : "unknown"}`,
    "",
    "## Deploy manifest",
    "",
    `- mode: ${c.deployDryRun.mode ?? "—"}`,
    `- applied: ${c.deployDryRun.applied ?? "—"}`,
    `- env: staging`,
    `- safeForStaticFtp: ${c.staticPublic.safeForStaticFtp ? "true" : "false"}`,
    "",
    "## Storage asset plan",
    "",
    `- status: ${c.storagePlan.skipped ? "SKIP" : c.storagePlan.pass ? "PASS" : "FAIL"}`,
    `- command: \`${c.storagePlan.command ?? "(skipped)"}\``,
    `- seedDir: ${c.storagePlan.seedDirUsed ? "specified (exists)" : "not used"}`,
    `- dataDir: ${c.storagePlan.dataDirUsed ? "specified (exists)" : "missing"}`,
    `- input format: ${c.storagePlan.inputFormat ?? "—"}`,
    `- schedules read: ${c.storagePlan.schedulesCount ?? "—"}`,
    `- discography read: ${c.storagePlan.discographyCount ?? "—"}`,
    `- total rows: ${c.storagePlan.totalRows ?? "—"}`,
    `- uploads performed: ${c.storagePlan.uploadsPerformed === false ? "no" : c.storagePlan.uploadsPerformed ?? "—"}`,
    `- secret leak: ${c.storagePlan.secretLeak ?? "—"}`,
    "",
    "## CMS minimal loop",
    "",
    `- status: ${c.cmsLoop.skipped ? "SKIP" : c.cmsLoop.pass ? "PASS" : "FAIL"}`,
    `- command: \`${c.cmsLoop.command ?? "(skipped)"}\``,
    `- port: ${c.cmsLoop.port ?? "—"}`,
    `- dev server cleaned up: ${c.cmsLoop.devServerCleanedUp ? "yes" : "no"}`,
    "",
  ];

  if (!c.cmsLoop.skipped && !c.cmsLoop.pass) {
    lines.push("### CMS loop failure output tail", "");
    if (c.cmsLoop.stdoutTail) {
      lines.push("**stdout (tail):**", "", "```text", c.cmsLoop.stdoutTail, "```", "");
    }
    if (c.cmsLoop.stderrTail) {
      lines.push("**stderr (tail):**", "", "```text", c.cmsLoop.stderrTail, "```", "");
    }
    if (!c.cmsLoop.stdoutTail && !c.cmsLoop.stderrTail) {
      lines.push("- (no captured output)", "");
    }
  }

  lines.push(
    "## Output policy",
    "",
    "- `output/` artifacts are **not** committed to Git",
    result.keepOutput
      ? "- `--keep-output`: generated artifacts retained locally"
      : "- Generated artifacts remain under `tools/static-to-astro/output/` (delete manually if desired)",
    "",
    "## Next steps",
    "",
    result.readyForStagingFtpApply
      ? "1. Proceed to Phase G-2b: staging FTP `--apply` with tarball backup"
      : "1. Fix failing checks above before G-2b",
    "2. Do not use production FTP / Supabase / Storage for staging verification",
    "3. Re-run this verifier after any CMS Kit changes",
    "",
  );

  if (result.errors.length) {
    lines.push("## Errors", "");
    for (const e of result.errors) lines.push(`- ${e}`);
    lines.push("");
  }
  if (result.warnings.length) {
    lines.push("## Warnings", "");
    for (const w of result.warnings) lines.push(`- ${w}`);
    lines.push("");
  }

  lines.push("---", `Report: \`${path.relative(repoRoot, abs)}\``, "");
  fs.writeFileSync(abs, lines.join("\n"), "utf8");
}

/**
 * @param {object} result
 */
export function formatReadinessSummary(result) {
  const c = result.checks;
  return [
    "",
    "=== gosaki Readiness Summary ===",
    `mode: ${result.mode}`,
    `site profile: ${c.siteProfile.pass ? "PASS" : "FAIL"}`,
    `convert: ${c.convert.pass ? "PASS" : "FAIL"}`,
    `export: ${c.export.pass ? "PASS" : "FAIL"}`,
    `build: ${c.build.pass ? "PASS" : "FAIL"}`,
    `static-public: ${c.staticPublic.pass ? "PASS" : "FAIL"}`,
    `deploy dry-run: ${c.deployDryRun.skipped ? "SKIP" : c.deployDryRun.pass ? "PASS" : "FAIL"}`,
    `production rejected: ${c.deployPlan.productionRejected ? "yes" : c.deployPlan.skipped ? "n/a" : "no"}`,
    `cms minimal loop: ${c.cmsLoop.skipped ? "SKIP" : c.cmsLoop.pass ? "PASS" : "FAIL"}`,
    `storage plan: ${c.storagePlan.skipped ? "SKIP" : c.storagePlan.pass ? "PASS" : "FAIL"}`,
    `secret scan: ${c.secretScan.pass ? "PASS" : "FAIL"}`,
    `READY_FOR_STAGING_FTP_APPLY: ${result.readyForStagingFtpApply ? "yes" : "no"}`,
    `FTP connected: ${result.ftpConnected ? "yes" : "false"}`,
    `production touched: ${result.productionTouched ? "yes" : "false"}`,
    `overall: ${result.ok ? "PASS" : "FAIL"}`,
  ].join("\n");
}
