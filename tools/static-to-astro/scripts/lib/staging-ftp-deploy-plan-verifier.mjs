/**
 * Staging FTP deploy plan verification (Phase G-2).
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  formatDeploySummary,
  normalizeDeployEnv,
  runPublicDistFtpDeploy,
  scanTextForSecretLiterals,
  validatePublicDirForDeploy,
} from "./public-dist-ftp-deployer.mjs";

const DEPLOY_SCRIPT_REL = "tools/static-to-astro/scripts/deploy-public-dist-ftp.mjs";

/**
 * @param {string} repoRoot
 */
export function deployScriptExists(repoRoot) {
  const abs = path.join(repoRoot, DEPLOY_SCRIPT_REL);
  return fs.existsSync(abs);
}

/**
 * @param {string} repoRoot
 * @param {string[]} args
 */
export function runDeployCli(repoRoot, args) {
  const script = path.join(repoRoot, DEPLOY_SCRIPT_REL);
  const result = spawnSync("node", [script, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, CI: "1" },
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

/**
 * @param {string} publicDir
 * @param {string} toolRoot
 */
export function createUnsafePublicDirFixture(publicDir) {
  const abs = path.resolve(publicDir);
  fs.mkdirSync(path.join(abs, "admin"), { recursive: true });
  fs.writeFileSync(path.join(abs, "admin", "index.html"), "<html>admin</html>", "utf8");
  return abs;
}

/**
 * @param {string} publicDir
 */
export function removeUnsafePublicDirFixture(publicDir) {
  const adminDir = path.join(path.resolve(publicDir), "admin");
  if (fs.existsSync(adminDir)) {
    fs.rmSync(adminDir, { recursive: true, force: true });
  }
}

/**
 * @param {object} opts
 */
export function runStagingFtpDeployPlanVerification(opts) {
  const {
    repoRoot,
    toolRoot,
    publicDir,
    reportPath,
    siteSlug = "gosaki",
  } = opts;

  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const notes = [];

  const deployReportRel = "tools/static-to-astro/output/deploy/gosaki/STAGING_FTP_DEPLOY_REPORT.md";
  const deployManifestRel = "tools/static-to-astro/output/deploy/gosaki/staging-ftp-deploy-manifest.json";
  const publicDirRel = path.relative(repoRoot, path.resolve(publicDir));

  if (!deployScriptExists(repoRoot)) {
    errors.push(`deploy script missing: ${DEPLOY_SCRIPT_REL}`);
  }

  const prodEnv = normalizeDeployEnv("production");
  if (prodEnv.ok) errors.push("production env should be rejected");
  const prodRejected = !prodEnv.ok;

  const stagingEnv = normalizeDeployEnv("staging");
  if (!stagingEnv.ok) errors.push("staging env should be allowed");

  const publicAbs = path.resolve(publicDir);
  if (!fs.existsSync(publicAbs)) {
    errors.push(`public-dir not found: ${publicAbs}`);
  }

  const dryRunCli = runDeployCli(repoRoot, [
    "--public-dir",
    publicDirRel,
    "--site-slug",
    siteSlug,
    "--env",
    "staging",
    "--report",
    deployReportRel,
    "--manifest",
    deployManifestRel,
  ]);

  if (!dryRunCli.ok) {
    errors.push(`deploy dry-run CLI failed (exit ${dryRunCli.status})`);
    if (dryRunCli.stderr) notes.push(dryRunCli.stderr.trim().slice(0, 400));
  }

  const prodCli = runDeployCli(repoRoot, [
    "--public-dir",
    publicDirRel,
    "--site-slug",
    siteSlug,
    "--env",
    "production",
    "--report",
    "tools/static-to-astro/output/deploy/gosaki/STAGING_FTP_DEPLOY_PROD_REJECT.md",
    "--manifest",
    "tools/static-to-astro/output/deploy/gosaki/staging-ftp-deploy-manifest-prod-reject.json",
  ]);

  const productionCliRejected = !prodCli.ok;
  if (prodCli.ok) errors.push("production env CLI should fail but passed");

  let adminContaminationRejected = false;
  if (fs.existsSync(publicAbs)) {
    createUnsafePublicDirFixture(publicAbs);
    const unsafe = validatePublicDirForDeploy(publicAbs, toolRoot);
    adminContaminationRejected = !unsafe.ok && !unsafe.adminExcluded;
    removeUnsafePublicDirFixture(publicAbs);
    if (!adminContaminationRejected) {
      errors.push("public-dir with admin/ should be rejected");
    }
  }

  let manifest = null;
  const manifestAbs = path.join(repoRoot, deployManifestRel);
  if (fs.existsSync(manifestAbs)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestAbs, "utf8"));
    } catch (err) {
      errors.push(`manifest parse error: ${err.message}`);
    }
  } else {
    errors.push("deploy manifest not generated");
  }

  const reportAbs = path.join(repoRoot, deployReportRel);
  let reportContent = "";
  if (fs.existsSync(reportAbs)) {
    reportContent = fs.readFileSync(reportAbs, "utf8");
  } else {
    errors.push("deploy report not generated");
  }

  const appliedFalse = manifest ? manifest.applied === false : false;
  const ftpConnectedFalse = manifest ? manifest.ftpConnected === false : false;
  const modeDryRun = manifest ? manifest.mode === "dry-run" : false;

  if (manifest && manifest.applied !== false) errors.push("manifest.applied must be false");
  if (manifest && manifest.ftpConnected !== false) errors.push("manifest.ftpConnected must be false");

  const publicSafe = manifest
    ? manifest.safeForStaticFtp === true &&
      manifest.adminExcluded === true &&
      manifest.apiExcluded === true &&
      manifest.serverExcluded === true
    : false;

  if (manifest && !publicSafe) errors.push("manifest public-dir safety flags incomplete");

  const literalHits = scanTextForSecretLiterals(reportContent);
  if (manifest) {
    literalHits.push(...scanTextForSecretLiterals(JSON.stringify(manifest)));
  }
  const secretLeakOk = literalHits.length === 0;
  if (!secretLeakOk) errors.push(`secret literal in report/manifest: ${literalHits.join(", ")}`);

  const dryRunPass = dryRunCli.ok && appliedFalse && ftpConnectedFalse && modeDryRun;

  const result = {
    ok: errors.length === 0,
    errors,
    notes,
    deployScriptExists: deployScriptExists(repoRoot),
    dryRunPass,
    productionRejected: prodRejected && productionCliRejected,
    adminContaminationRejected,
    publicDirSafe: publicSafe,
    manifestGenerated: Boolean(manifest),
    reportGenerated: Boolean(reportContent),
    appliedFalse,
    ftpConnectedFalse,
    secretLeakOk,
    manifest,
    paths: {
      deployReport: deployReportRel,
      deployManifest: deployManifestRel,
      publicDir: publicDirRel,
    },
  };

  if (reportPath) {
    writeVerifierReport(result, reportPath, repoRoot);
  }

  return result;
}

/**
 * @param {object} result
 * @param {string} reportPath
 * @param {string} repoRoot
 */
export function writeVerifierReport(result, reportPath, repoRoot) {
  const abs = path.isAbsolute(reportPath) ? reportPath : path.join(repoRoot, reportPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });

  const lines = [
    "# Staging FTP Deploy Plan Verification Report (Phase G-2)",
    "",
    `- **Status:** ${result.ok ? "PASS" : "FAIL"}`,
    "",
    "## Checks",
    "",
    `- deploy script exists: ${result.deployScriptExists ? "yes" : "no"}`,
    `- deploy dry-run: ${result.dryRunPass ? "PASS" : "FAIL"}`,
    `- apply: false`,
    `- FTP connected: false`,
    `- env staging allowed: yes`,
    `- production rejected: ${result.productionRejected ? "yes" : "no"}`,
    `- public-dir safe: ${result.publicDirSafe ? "yes" : "no"}`,
    `- admin/api contamination rejected: ${result.adminContaminationRejected ? "yes" : "no"}`,
    `- manifest generated: ${result.manifestGenerated ? "yes" : "no"}`,
    `- secret leak: ${result.secretLeakOk ? "none" : "FAIL"}`,
    "",
    "## Manifest summary",
    "",
  ];

  if (result.manifest) {
    lines.push(
      `- siteSlug: ${result.manifest.siteSlug}`,
      `- env: ${result.manifest.env}`,
      `- mode: ${result.manifest.mode}`,
      `- applied: ${result.manifest.applied}`,
      `- ftpConnected: ${result.manifest.ftpConnected}`,
      `- fileCount: ${result.manifest.fileCount}`,
      `- safeForStaticFtp: ${result.manifest.safeForStaticFtp}`,
      "",
    );
  }

  if (result.errors.length) {
    lines.push("## Errors", "");
    for (const e of result.errors) lines.push(`- ${e}`);
    lines.push("");
  }

  lines.push(
    "---",
    "Phase G-2 dry-run only. No production FTP connection.",
    `Report: \`${path.relative(repoRoot, abs)}\``,
    "",
  );

  fs.writeFileSync(abs, lines.join("\n"), "utf8");
}

/**
 * @param {object} result
 */
export function formatVerifierSummary(result) {
  return [
    "",
    "=== Staging FTP Deploy Plan Verification ===",
    `deploy dry-run: ${result.dryRunPass ? "PASS" : "FAIL"}`,
    `apply: false`,
    `FTP connected: false`,
    `env: staging`,
    `production rejected: ${result.productionRejected ? "yes" : "no"}`,
    `public-dir safe: ${result.publicDirSafe ? "yes" : "no"}`,
    `admin/api/server excluded: ${result.publicDirSafe ? "yes" : "no"}`,
    `secret leak: ${result.secretLeakOk ? "none" : "FAIL"}`,
    `manifest generated: ${result.manifestGenerated ? "yes" : "no"}`,
    `overall: ${result.ok ? "PASS" : "FAIL"}`,
  ].join("\n");
}
