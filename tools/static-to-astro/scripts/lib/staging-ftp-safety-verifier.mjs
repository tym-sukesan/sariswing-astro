/**
 * Staging FTP safety verification (Phase G-2b-prep).
 * Static checks only — no FTP connection, no --apply.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  STAGING_FTP_ENV_KEYS,
  parseEnvFile,
} from "./public-dist-ftp-deployer.mjs";
import {
  assessServerDirPath,
  DANGEROUS_DIR_KEYWORDS,
  REQUIRED_STAGING_DIR_KEYWORDS,
} from "./ftp-remote-dir-safety.mjs";

export { assessServerDirPath, DANGEROUS_DIR_KEYWORDS, REQUIRED_STAGING_DIR_KEYWORDS };

export const PROD_FTP_ENV_KEYS = [
  "GOSAKI_PROD_FTP_SERVER",
  "GOSAKI_PROD_FTP_USERNAME",
  "GOSAKI_PROD_FTP_PASSWORD",
  "GOSAKI_PROD_FTP_SERVER_DIR",
];

const JWT_LIKE = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/;

/**
 * @param {string | null | undefined} envFilePath
 * @param {string} toolRoot
 */
export function loadFtpSafetyEnv(envFilePath, toolRoot) {
  const absEnvFile = envFilePath
    ? path.resolve(envFilePath)
    : path.join(path.resolve(toolRoot), ".env.local");

  const fileVars = parseEnvFile(absEnvFile);
  const fromProcess = (key) => process.env[key] ?? fileVars[key] ?? null;

  const staging = {
    server: fromProcess("GOSAKI_STAGING_FTP_SERVER"),
    username: fromProcess("GOSAKI_STAGING_FTP_USERNAME"),
    password: fromProcess("GOSAKI_STAGING_FTP_PASSWORD"),
    serverDir: fromProcess("GOSAKI_STAGING_FTP_SERVER_DIR"),
  };

  const missing = STAGING_FTP_ENV_KEYS.filter((key) => {
    const map = {
      GOSAKI_STAGING_FTP_SERVER: staging.server,
      GOSAKI_STAGING_FTP_USERNAME: staging.username,
      GOSAKI_STAGING_FTP_PASSWORD: staging.password,
      GOSAKI_STAGING_FTP_SERVER_DIR: staging.serverDir,
    };
    return !map[key]?.trim();
  });

  const prodPresent = PROD_FTP_ENV_KEYS.filter((key) => Boolean(fromProcess(key)?.trim()));

  return {
    envFile: absEnvFile,
    envFileExists: fs.existsSync(absEnvFile),
    staging,
    missing,
    requiredComplete: missing.length === 0,
    prodPresent,
    hasProdFtpEnv: prodPresent.length > 0,
  };
}

/**
 * @param {string | null | undefined} host
 */
export function maskHostPreview(host) {
  if (!host?.trim()) return "(not set)";
  const raw = host.trim().replace(/^ftp:\/\//i, "");
  const hostname = raw.split("/")[0];
  if (hostname.length <= 3) return "***";
  const parts = hostname.split(".");
  if (parts.length >= 2) {
    return `${hostname.slice(0, 3)}***.${parts.slice(-2).join(".")}`;
  }
  return `${hostname.slice(0, 3)}***`;
}

/**
 * @param {string | null | undefined} server
 */
export function assessServerHost(server) {
  /** @type {string[]} */
  const errors = [];
  const host = (server ?? "").trim().replace(/^ftp:\/\//i, "").split("/")[0].toLowerCase();
  if (!host) {
    return { ok: false, errors: ["GOSAKI_STAGING_FTP_SERVER is empty"], hostPreview: "(not set)" };
  }

  for (const marker of ["gosaki-piano.com", "sariswing.com", "sariswing"]) {
    if (host.includes(marker)) {
      errors.push(`dangerous host marker: ${marker}`);
    }
  }

  return { ok: errors.length === 0, errors, hostPreview: maskHostPreview(server) };
}

/**
 * @param {object} envState
 */
export function buildRequiredEnvPresence(envState) {
  return STAGING_FTP_ENV_KEYS.map((key) => {
    const map = {
      GOSAKI_STAGING_FTP_SERVER: envState.staging.server,
      GOSAKI_STAGING_FTP_USERNAME: envState.staging.username,
      GOSAKI_STAGING_FTP_PASSWORD: envState.staging.password,
      GOSAKI_STAGING_FTP_SERVER_DIR: envState.staging.serverDir,
    };
    return { key, present: Boolean(map[key]?.trim()) };
  });
}

/**
 * @param {string} repoRoot
 * @param {string} absEnvFile
 */
export function checkEnvFileGitIgnored(repoRoot, absEnvFile) {
  const rel = path.relative(repoRoot, absEnvFile);
  const res = spawnSync("git", ["check-ignore", "-v", rel], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  return { ignored: res.status === 0, rel };
}

/**
 * @param {string} text
 */
export function scanTextForSecretLeak(text) {
  /** @type {string[]} */
  const hits = [];
  if (JWT_LIKE.test(text)) hits.push("jwt-like token");
  if (/GOSAKI_STAGING_FTP_PASSWORD\s*=\s*['"]?[A-Za-z0-9_\-!@#$%^&*]{6,}/.test(text)) {
    hits.push("ftp password in text");
  }
  if (/GOSAKI_PROD_FTP_PASSWORD\s*=\s*['"]?[A-Za-z0-9_\-!@#$%^&*]{6,}/.test(text)) {
    hits.push("prod ftp password in text");
  }
  return hits;
}

/**
 * @param {object} opts
 * @param {boolean} [opts.allowDelete]
 */
export function runStagingFtpSafetyVerification(opts) {
  const { toolRoot, reportPath, envFile = null, repoRoot = toolRoot, allowDelete = false } = opts;

  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  const envState = loadFtpSafetyEnv(envFile, toolRoot);
  const requiredPresence = buildRequiredEnvPresence(envState);
  const serverDirCheck = assessServerDirPath(envState.staging.serverDir);
  const serverHostCheck = assessServerHost(envState.staging.server);
  const gitIgnore = checkEnvFileGitIgnored(repoRoot, envState.envFile);

  if (!envState.envFileExists) {
    errors.push(`env file not found: ${path.relative(repoRoot, envState.envFile)}`);
  }

  if (!envState.requiredComplete) {
    errors.push(`missing staging FTP env: ${envState.missing.join(", ")}`);
  }

  if (envState.hasProdFtpEnv) {
    errors.push(`prod FTP env must not be present locally: ${envState.prodPresent.join(", ")}`);
  }

  if (envState.requiredComplete && !serverDirCheck.ok) {
    errors.push(...serverDirCheck.errors);
  }

  if (envState.requiredComplete && !serverHostCheck.ok) {
    errors.push(...serverHostCheck.errors);
  }

  if (allowDelete && !serverDirCheck.ok) {
    errors.push("delete-remote-extras requires a passing server dir safety check");
  }

  if (envState.envFileExists && !gitIgnore.ignored && path.basename(envState.envFile) === ".env.local") {
    warnings.push(".env.local is not gitignored — verify .gitignore");
  }

  let reason = "all static checks passed";
  if (!envState.requiredComplete) reason = "missing staging FTP env";
  else if (envState.hasProdFtpEnv) reason = "prod FTP env present";
  else if (!serverDirCheck.ok) reason = "server dir failed safety checks";
  else if (!serverHostCheck.ok) reason = "server host failed safety checks";
  else if (errors.length) reason = "safety checks failed";

  const stagingFtpSafeToApply =
    envState.requiredComplete &&
    !envState.hasProdFtpEnv &&
    serverDirCheck.ok &&
    serverHostCheck.ok &&
    errors.length === 0;

  const result = {
    ok: stagingFtpSafeToApply,
    mode: "static safety check",
    ftpConnected: false,
    applyPerformed: false,
    stagingFtpSafeToApply,
    envFile: path.relative(repoRoot, envState.envFile),
    envFileExists: envState.envFileExists,
    envFileGitIgnored: gitIgnore.ignored,
    requiredEnv: requiredPresence,
    requiredComplete: envState.requiredComplete,
    missing: envState.missing,
    prodEnvPresent: envState.prodPresent,
    hasProdFtpEnv: envState.hasProdFtpEnv,
    serverDirCheck,
    serverHostCheck,
    errors,
    warnings,
    reason,
    secretLeakOk: true,
  };

  if (reportPath) {
    writeSafetyReport(result, reportPath, repoRoot);
    const abs = path.isAbsolute(reportPath) ? reportPath : path.join(repoRoot, reportPath);
    const leakHits = scanTextForSecretLeak(fs.readFileSync(abs, "utf8"));
    if (leakHits.length) {
      result.secretLeakOk = false;
      result.errors.push(`secret leak in report: ${leakHits.join(", ")}`);
      result.stagingFtpSafeToApply = false;
      result.ok = false;
      result.reason = "secret leak in report";
    }
  }

  return result;
}

/**
 * @param {object} result
 * @param {string} reportPath
 * @param {string} repoRoot
 */
export function writeSafetyReport(result, reportPath, repoRoot) {
  const abs = path.isAbsolute(reportPath) ? reportPath : path.join(repoRoot, reportPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });

  const lines = [
    "# Staging FTP Safety Report (Phase G-2b-prep)",
    "",
    `- **Mode:** ${result.mode}`,
    `- **FTP connected:** ${result.ftpConnected ? "yes" : "false"}`,
    `- **Apply performed:** ${result.applyPerformed ? "yes" : "false"}`,
    `- **STAGING_FTP_SAFE_TO_APPLY:** ${result.stagingFtpSafeToApply ? "yes" : "no"}`,
    `- **Reason:** ${result.reason}`,
    "",
    "## Required env presence",
    "",
  ];

  for (const item of result.requiredEnv) {
    lines.push(`- ${item.key}: ${item.present ? "present" : "missing"}`);
  }

  lines.push(
    "",
    "## Prod env presence",
    "",
    `- GOSAKI_PROD_FTP_* present: ${result.hasProdFtpEnv ? "yes (fail)" : "no"}`,
  );
  if (result.prodEnvPresent.length) {
    for (const key of result.prodEnvPresent) {
      lines.push(`- ${key}: present (must remove before staging apply)`);
    }
  }

  lines.push(
    "",
    "## Server / directory safety",
    "",
    `- env file: \`${result.envFile}\` (${result.envFileExists ? "exists" : "missing"})`,
    `- env file gitignored: ${result.envFileGitIgnored ? "yes" : "no"}`,
    `- host preview: ${result.serverHostCheck.hostPreview}`,
    `- server dir set: ${result.serverDirCheck.dir ? "yes" : "no"}`,
    `- server dir staging marker: ${result.serverDirCheck.hasStagingKeyword ? "yes" : "no"}`,
    `- dangerous keyword check: ${result.serverDirCheck.ok && result.serverHostCheck.ok ? "PASS" : "FAIL"}`,
    `- staging keyword check: ${result.serverDirCheck.hasStagingKeyword ? "PASS" : "FAIL"}`,
    "",
    "## Security",
    "",
    `- secret leak scan (report): ${result.secretLeakOk ? "none" : "FAIL"}`,
    `- password logged: no`,
    "",
    "## Next steps",
    "",
  );

  if (result.stagingFtpSafeToApply) {
    lines.push(
      "1. Human confirms FTP directory is disposable staging-only",
      "2. Run readiness verifier PASS",
      "3. Proceed to G-2b `--apply --env staging` with tarball backup",
    );
  } else {
    lines.push(
      "1. Set `GOSAKI_STAGING_FTP_*` in `.env.local` (staging-only directory)",
      "2. Do not add `GOSAKI_PROD_FTP_*` to local env",
      "3. Re-run this verifier until STAGING_FTP_SAFE_TO_APPLY: yes",
    );
  }

  lines.push("", "---", "No FTP connection was made.", `Report: \`${path.relative(repoRoot, abs)}\``, "");

  if (result.errors.length) {
    lines.push("", "## Errors", "");
    for (const e of result.errors) lines.push(`- ${e}`);
    lines.push("");
  }

  if (result.warnings.length) {
    lines.push("## Warnings", "");
    for (const w of result.warnings) lines.push(`- ${w}`);
    lines.push("");
  }

  fs.writeFileSync(abs, lines.join("\n"), "utf8");
}

/**
 * @param {object} result
 */
export function formatSafetySummary(result) {
  return [
    "",
    "=== Staging FTP Safety Summary ===",
    `mode: ${result.mode}`,
    `STAGING_FTP_SAFE_TO_APPLY: ${result.stagingFtpSafeToApply ? "yes" : "no"}`,
    `reason: ${result.reason}`,
    `FTP connected: ${result.ftpConnected}`,
    `apply performed: ${result.applyPerformed}`,
    `required env complete: ${result.requiredComplete ? "yes" : "no"}`,
    `prod FTP env present: ${result.hasProdFtpEnv ? "yes" : "no"}`,
    `server dir safety: ${result.serverDirCheck.ok ? "PASS" : "FAIL"}`,
    `staging keyword: ${result.serverDirCheck.hasStagingKeyword ? "yes" : "no"}`,
    `secret leak: ${result.secretLeakOk ? "none" : "FAIL"}`,
    `overall: ${result.ok ? "PASS" : "FAIL (expected if env not configured)"}`,
  ].join("\n");
}
