/**
 * public-dist staging FTP deploy (Phase G-2).
 * Default dry-run — FTP connect only with --apply --env staging.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { isStagingSubdirBuild, normalizeDeployBase } from "./deploy-base.mjs";
import {
  listPublicFiles,
  loadOptionalSecretsForScan,
  scanAdminApiContamination,
  scanPublicDirForSecrets,
  scanSupabaseKeyExposure,
} from "./static-public-artifact-verifier.mjs";

export const ALLOWED_DEPLOY_ENV = "staging";
export const REJECTED_ENVS = new Set(["production", "prod", "live", "www"]);

export const STAGING_FTP_ENV_KEYS = [
  "GOSAKI_STAGING_FTP_SERVER",
  "GOSAKI_STAGING_FTP_USERNAME",
  "GOSAKI_STAGING_FTP_PASSWORD",
  "GOSAKI_STAGING_FTP_SERVER_DIR",
];

/** Prod-like FTP paths — warn or block */
export const SUSPICIOUS_PROD_FTP_DIR_PATTERNS = [
  { id: "gosaki_piano_domain", pattern: /gosaki-piano\.com/i, block: true },
  { id: "www_root_public_html", pattern: /^\/public_html\/?$/i, block: true },
  { id: "prod_segment", pattern: /\/prod(?:uction)?\b/i, block: true },
  { id: "live_segment", pattern: /\/live\b/i, block: true },
  { id: "staging_hint_ok", pattern: /staging|test|dev/i, block: false },
];

const JWT_LIKE = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/;

/**
 * @param {string | null | undefined} env
 */
export function normalizeDeployEnv(env) {
  const value = (env ?? "").trim().toLowerCase();
  if (!value) return { ok: false, env: null, error: "--env is required (only 'staging' is allowed)" };
  if (REJECTED_ENVS.has(value)) {
    return { ok: false, env: value, error: `Deploy env "${value}" is rejected — only staging is allowed in Phase G-2` };
  }
  if (value !== ALLOWED_DEPLOY_ENV) {
    return {
      ok: false,
      env: value,
      error: `Deploy env "${value}" is not allowed — only "${ALLOWED_DEPLOY_ENV}" is permitted`,
    };
  }
  return { ok: true, env: value, error: null };
}

/**
 * @param {string} filePath
 */
export function parseEnvFile(filePath) {
  /** @type {Record<string, string>} */
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

/**
 * @param {string} toolRoot
 */
export function loadStagingFtpEnv(toolRoot) {
  const envPath = path.join(path.resolve(toolRoot), ".env.local");
  const fileVars = parseEnvFile(envPath);

  const server = process.env.GOSAKI_STAGING_FTP_SERVER ?? fileVars.GOSAKI_STAGING_FTP_SERVER ?? null;
  const username = process.env.GOSAKI_STAGING_FTP_USERNAME ?? fileVars.GOSAKI_STAGING_FTP_USERNAME ?? null;
  const password = process.env.GOSAKI_STAGING_FTP_PASSWORD ?? fileVars.GOSAKI_STAGING_FTP_PASSWORD ?? null;
  const serverDir = process.env.GOSAKI_STAGING_FTP_SERVER_DIR ?? fileVars.GOSAKI_STAGING_FTP_SERVER_DIR ?? null;

  const missing = STAGING_FTP_ENV_KEYS.filter((key) => {
    const map = {
      GOSAKI_STAGING_FTP_SERVER: server,
      GOSAKI_STAGING_FTP_USERNAME: username,
      GOSAKI_STAGING_FTP_PASSWORD: password,
      GOSAKI_STAGING_FTP_SERVER_DIR: serverDir,
    };
    return !map[key]?.trim();
  });

  return {
    envPath,
    envFileExists: fs.existsSync(envPath),
    server,
    username,
    password,
    serverDir,
    missing,
    complete: missing.length === 0,
    usedProdPrefix: STAGING_FTP_ENV_KEYS.some((k) => {
      const prodKey = k.replace("STAGING", "PROD");
      return Boolean(process.env[prodKey] ?? fileVars[prodKey]);
    }),
  };
}

/**
 * @param {string | null | undefined} serverDir
 */
export function assessFtpServerDirRisk(serverDir) {
  if (!serverDir?.trim()) {
    return { ok: false, blocked: true, warnings: [], blocks: ["FTP server dir is empty"] };
  }

  const dir = serverDir.trim();
  /** @type {string[]} */
  const warnings = [];
  /** @type {string[]} */
  const blocks = [];

  for (const { id, pattern, block } of SUSPICIOUS_PROD_FTP_DIR_PATTERNS) {
    if (!pattern.test(dir)) continue;
    if (block) blocks.push(`suspicious prod-like FTP dir (${id})`);
    else warnings.push(`staging hint in path (${id})`);
  }

  if (blocks.length === 0 && !/staging|test|dev/i.test(dir)) {
    warnings.push("FTP server dir has no staging/test/dev segment — verify this is not production");
  }

  return { ok: blocks.length === 0, blocked: blocks.length > 0, warnings, blocks };
}

/**
 * @param {string} publicDir
 */
export function resolveStaticPublicManifestPath(publicDir) {
  const abs = path.resolve(publicDir);
  return path.join(path.dirname(abs), "static-public-manifest.json");
}

/**
 * @param {string} publicDir
 * @param {string} toolRoot
 */
export function validatePublicDirForDeploy(publicDir, toolRoot) {
  const abs = path.resolve(publicDir);
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const checks = [];

  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    return {
      ok: false,
      publicDir: abs,
      errors: ["public-dir does not exist or is not a directory"],
      checks,
      fileCount: 0,
      indexHtmlExists: false,
      adminExcluded: false,
      apiExcluded: false,
      serverExcluded: true,
      envFilesExcluded: true,
      safeForStaticFtp: false,
      secretLeakOk: false,
      manifest: null,
    };
  }

  const files = listPublicFiles(abs);
  const fileCount = files.length;
  checks.push(`file count: ${fileCount}`);
  if (fileCount === 0) errors.push("public-dir has no files");

  const indexHtmlExists = fs.existsSync(path.join(abs, "index.html"));
  checks.push(`index.html: ${indexHtmlExists ? "yes" : "no"}`);
  if (!indexHtmlExists) errors.push("index.html missing in public-dir");

  const adminExcluded = !fs.existsSync(path.join(abs, "admin"));
  const apiExcluded = !fs.existsSync(path.join(abs, "api"));
  const serverExcluded = !fs.existsSync(path.join(abs, "server"));

  if (!adminExcluded) errors.push("admin/ must not exist in public-dir");
  if (!apiExcluded) errors.push("api/ must not exist in public-dir");
  if (!serverExcluded) errors.push("server/ must not exist in public-dir");

  const envHits = files.filter((f) => /^\.env/i.test(path.basename(f.rel)) || f.rel.includes(".env.local"));
  const envFilesExcluded = envHits.length === 0;
  if (!envFilesExcluded) errors.push(".env / .env.local must not exist in public-dir");

  const contamination = scanAdminApiContamination(abs);
  if (contamination.contaminated) {
    errors.push("admin/api path markers found in public-dir");
  }

  const secrets = loadOptionalSecretsForScan(toolRoot);
  const secretValues = [secrets.serviceRoleKey, secrets.adminPassword, secrets.anonKey].filter(Boolean);
  const secretScan = scanPublicDirForSecrets(abs, secretValues);
  const supabaseScan = scanSupabaseKeyExposure(abs);
  const secretLeakOk = secretScan.ok && supabaseScan.publicStaticDoesNotNeedSupabaseKeys;
  if (!secretLeakOk) errors.push("secret leak scan failed for public-dir");

  const manifestPath = resolveStaticPublicManifestPath(abs);
  let manifest = null;
  let safeForStaticFtp = false;

  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      safeForStaticFtp = Boolean(manifest.safeForStaticFtp);
      checks.push(`static-public-manifest: found (safeForStaticFtp=${safeForStaticFtp})`);
    } catch (err) {
      errors.push(`failed to parse static-public-manifest.json: ${err.message}`);
    }
  } else {
    errors.push(`static-public-manifest.json not found at ${manifestPath}`);
  }

  if (!safeForStaticFtp) errors.push("safeForStaticFtp is not true in manifest");

  return {
    ok: errors.length === 0,
    publicDir: abs,
    errors,
    checks,
    fileCount,
    indexHtmlExists,
    adminExcluded: adminExcluded && !contamination.contaminated,
    apiExcluded: apiExcluded && !contamination.contaminated,
    serverExcluded,
    envFilesExcluded,
    safeForStaticFtp,
    secretLeakOk,
    manifest,
    manifestPath,
    contamination,
    secretScan,
    supabaseScan,
  };
}

/**
 * Build lftp script that mirrors public-dist *contents* into serverDir (not public-dist/ itself).
 * @param {{ serverDir: string, publicDir: string, includeLegacyCleanup?: boolean }} opts
 */
export function buildLftpMirrorScript({ serverDir, publicDir, includeLegacyCleanup = true }) {
  const local = path.resolve(publicDir);
  const remote = serverDir.trim().replace(/\/$/, "") || serverDir;

  const parts = [
    "set ftp:ssl-allow true",
    `cd ${remote}`,
    `lcd ${local}`,
    "mirror -R --delete --verbose -X .env* . .",
  ];

  if (includeLegacyCleanup) {
    // Remove mistaken prior deploy that created public-dist/ under serverDir.
    parts.push("rm -r -f public-dist");
  }

  parts.push("bye");
  return parts.join("; ");
}

/**
 * @param {{ server: string, username: string, serverDir: string, publicDir: string }} opts
 */
export function buildLftpMirrorPreview({ server, username, serverDir, publicDir }) {
  const script = buildLftpMirrorScript({ serverDir, publicDir });
  return `lftp -u "${username}","***" "${server}" -e "${script}"`;
}

/**
 * @param {{ server: string, username: string, password: string, serverDir: string, publicDir: string }} opts
 */
export function runLftpMirrorApply(opts) {
  const script = buildLftpMirrorScript({
    serverDir: opts.serverDir,
    publicDir: opts.publicDir,
  });
  const result = spawnSync(
    "lftp",
    ["-u", `${opts.username},${opts.password}`, opts.server, "-e", script],
    { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
  );

  const stderr = (result.stderr ?? "").replaceAll(opts.password, "***");
  const stdout = (result.stdout ?? "").replaceAll(opts.password, "***");

  return {
    ok: result.status === 0,
    status: result.status,
    stdout,
    stderr,
    ftpConnected: true,
    mirrorMode: "contents-only",
    legacyPublicDistCleanup: true,
  };
}

/**
 * @param {object} opts
 */
export function runPublicDistFtpDeploy(opts) {
  const {
    publicDir,
    siteSlug = "gosaki",
    env,
    toolRoot,
    apply = false,
    dryRun = false,
    reportPath = null,
    manifestOutPath = null,
    repoRoot = toolRoot,
  } = opts;

  const envResult = normalizeDeployEnv(env);
  const publicValidation = validatePublicDirForDeploy(publicDir, toolRoot);
  const ftpEnv = loadStagingFtpEnv(toolRoot);
  const dirRisk = ftpEnv.serverDir ? assessFtpServerDirRisk(ftpEnv.serverDir) : { ok: true, blocked: false, warnings: [], blocks: [] };

  const mode = apply && !dryRun ? "apply" : "dry-run";
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const notes = [];

  if (!envResult.ok) errors.push(envResult.error);
  if (ftpEnv.usedProdPrefix) errors.push("GOSAKI_PROD_* keys must not be used for staging deploy");
  if (!publicValidation.ok) errors.push(...publicValidation.errors);
  if (dirRisk.blocked) errors.push(...dirRisk.blocks.map((b) => `FTP dir blocked: ${b}`));

  let ftpConnected = false;
  let lftpPreview = null;
  let lftpResult = null;

  let canAttemptApply =
    mode === "apply" &&
    envResult.ok &&
    publicValidation.ok &&
    !dirRisk.blocked &&
    ftpEnv.complete &&
    !ftpEnv.usedProdPrefix;

  if (mode === "apply" && !ftpEnv.complete) {
    errors.push(`missing staging FTP env: ${ftpEnv.missing.join(", ")}`);
  }

  const staticManifest = publicValidation.manifest;
  const deployBase =
    staticManifest?.deployBase ?? normalizeDeployBase(ftpEnv.serverDir);
  const stagingSubdirBuild =
    staticManifest?.stagingSubdirBuild ?? isStagingSubdirBuild(deployBase);
  const assetPathsIncludeBase = staticManifest?.assetPathsIncludeBase ?? false;
  const stagingNoindex = staticManifest?.stagingNoindex ?? stagingSubdirBuild;
  const robotsDisallowAll = staticManifest?.robotsDisallowAll ?? stagingSubdirBuild;
  const productionIndexable = staticManifest?.productionIndexable ?? !stagingSubdirBuild;
  const canonicalMode = staticManifest?.canonicalMode ?? (stagingSubdirBuild ? "staging-url" : "production");

  if (
    canAttemptApply &&
    stagingSubdirBuild &&
    !assetPathsIncludeBase
  ) {
    errors.push(
      "public-dist missing staging deploy base in asset/nav paths — rebuild with --deploy-base before --apply",
    );
    canAttemptApply = false;
  }

  if (canAttemptApply && stagingSubdirBuild && (!stagingNoindex || !robotsDisallowAll)) {
    errors.push(
      "public-dist missing staging noindex / robots Disallow — rebuild with --deploy-base before --apply",
    );
    canAttemptApply = false;
  }

  if (
    canAttemptApply &&
    stagingSubdirBuild &&
    staticManifest?.canonicalMode === "production-leak"
  ) {
    errors.push(
      "public-dist still contains production canonical / og:url — rebuild with --deploy-base before --apply",
    );
    canAttemptApply = false;
  }

  if (canAttemptApply) {
    lftpPreview = buildLftpMirrorPreview({
      server: ftpEnv.server,
      username: ftpEnv.username,
      serverDir: ftpEnv.serverDir,
      publicDir: publicValidation.publicDir,
    });
    lftpResult = runLftpMirrorApply({
      server: ftpEnv.server,
      username: ftpEnv.username,
      password: ftpEnv.password,
      serverDir: ftpEnv.serverDir,
      publicDir: publicValidation.publicDir,
    });
    ftpConnected = true;
    if (!lftpResult.ok) {
      errors.push(`lftp mirror failed (exit ${lftpResult.status})`);
    }
  } else if (ftpEnv.server && ftpEnv.username && ftpEnv.serverDir) {
    lftpPreview = buildLftpMirrorPreview({
      server: ftpEnv.server,
      username: ftpEnv.username,
      serverDir: ftpEnv.serverDir,
      publicDir: publicValidation.publicDir,
    });
  }

  if (mode === "dry-run") {
    notes.push("FTP not connected (dry-run — use --apply --env staging to upload)");
  }

  const publicDirForManifest = (() => {
    try {
      return path.relative(repoRoot, publicValidation.publicDir).replace(/\\/g, "/");
    } catch {
      return publicValidation.publicDir;
    }
  })();

  const manifest = {
    siteSlug,
    env: envResult.env ?? env ?? null,
    publicDir: publicDirForManifest,
    fileCount: publicValidation.fileCount,
    safeForStaticFtp: publicValidation.safeForStaticFtp,
    adminExcluded: publicValidation.adminExcluded,
    apiExcluded: publicValidation.apiExcluded,
    serverExcluded: publicValidation.serverExcluded,
    envFilesExcluded: publicValidation.envFilesExcluded,
    secretLeakOk: publicValidation.secretLeakOk,
    mode,
    applied: mode === "apply" && canAttemptApply && lftpResult?.ok === true,
    ftpConnected,
    ftpServer: ftpEnv.server ?? null,
    ftpServerDir: ftpEnv.serverDir ?? null,
    ftpUsername: ftpEnv.username ?? null,
    timestamp: new Date().toISOString(),
    rollback: {
      strategy: "Save this manifest + tarball of public-dist before apply; re-mirror previous public-dist on failure",
      previousManifestPath: manifestOutPath
        ? path
            .relative(repoRoot, manifestOutPath)
            .replace(/\.json$/, ".previous.json")
            .replace(/\\/g, "/")
        : null,
      stagingFtpBackupRecommended: "Download current staging FTP tree to tarball before --apply",
      productionRequiresBackup: true,
    },
    lftpPreview: lftpPreview ?? null,
    mirrorMode: "contents-only",
    uploadedContentsOfPublicDist: true,
    remoteRootReceivesIndexHtml: publicValidation.indexHtmlExists,
    legacyPublicDistDirRemoved: mode === "apply" && canAttemptApply && lftpResult?.legacyPublicDistCleanup === true,
    deployBase,
    stagingSubdirBuild,
    assetPathsIncludeBase,
    stagingNoindex,
    robotsDisallowAll,
    productionIndexable,
    canonicalMode,
  };

  const dryRunPass = envResult.ok && publicValidation.ok && !dirRisk.blocked && !ftpEnv.usedProdPrefix;
  const result = {
    ok: mode === "dry-run" ? dryRunPass : errors.length === 0 && manifest.applied,
    errors,
    notes,
    mode,
    applied: manifest.applied,
    ftpConnected,
    envResult,
    publicValidation,
    ftpEnv: {
      complete: ftpEnv.complete,
      missing: ftpEnv.missing,
      server: ftpEnv.server,
      serverDir: ftpEnv.serverDir,
      username: ftpEnv.username,
      usedProdPrefix: ftpEnv.usedProdPrefix,
    },
    dirRisk,
    manifest,
    lftpResult: lftpResult
      ? { ok: lftpResult.ok, status: lftpResult.status, stdout: lftpResult.stdout, stderr: lftpResult.stderr }
      : null,
  };

  if (manifestOutPath) {
    writeDeployManifest(manifest, manifestOutPath, repoRoot);
  }
  if (reportPath) {
    writeDeployReport(result, reportPath, repoRoot);
  }

  return result;
}

/**
 * @param {object} manifest
 * @param {string} manifestPath
 * @param {string} repoRoot
 */
export function writeDeployManifest(manifest, manifestPath, repoRoot) {
  const abs = path.isAbsolute(manifestPath) ? manifestPath : path.join(repoRoot, manifestPath);
  const prev = abs.replace(/\.json$/, ".previous.json");
  if (fs.existsSync(abs)) {
    fs.copyFileSync(abs, prev);
  }
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return abs;
}

/**
 * @param {object} result
 * @param {string} reportPath
 * @param {string} repoRoot
 */
export function writeDeployReport(result, reportPath, repoRoot) {
  const abs = path.isAbsolute(reportPath) ? reportPath : path.join(repoRoot, reportPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });

  const lines = [
    "# Staging FTP Deploy Report (Phase G-2)",
    "",
    `- **Result:** ${result.ok ? "PASS" : "FAIL"}`,
    `- **Mode:** ${result.mode}`,
    `- **Applied:** ${result.applied ? "yes" : "no"}`,
    `- **FTP connected:** ${result.ftpConnected ? "yes" : "no"}`,
    `- **Env:** ${result.envResult.env ?? "—"} (${result.envResult.ok ? "allowed" : "rejected"})`,
    "",
    "## public-dist pre-deploy checks",
    "",
    `- public-dir: \`${result.publicValidation.publicDir}\``,
    `- file count: ${result.publicValidation.fileCount}`,
    `- index.html: ${result.publicValidation.indexHtmlExists ? "yes" : "no"}`,
    `- admin excluded: ${result.publicValidation.adminExcluded ? "yes" : "no"}`,
    `- api excluded: ${result.publicValidation.apiExcluded ? "yes" : "no"}`,
    `- server excluded: ${result.publicValidation.serverExcluded ? "yes" : "no"}`,
    `- safeForStaticFtp: ${result.publicValidation.safeForStaticFtp ? "true" : "false"}`,
    `- secret leak scan: ${result.publicValidation.secretLeakOk ? "OK" : "FAIL"}`,
    "",
    "## Mirror layout",
    "",
    `- deployBase: \`${result.manifest.deployBase ?? "—"}\``,
    `- stagingSubdirBuild: ${result.manifest.stagingSubdirBuild ? "yes" : "no"}`,
    `- asset paths include base: ${result.manifest.assetPathsIncludeBase ? "yes" : "no"}`,
    `- stagingNoindex: ${result.manifest.stagingNoindex ? "yes" : "no"}`,
    `- robotsDisallowAll: ${result.manifest.robotsDisallowAll ? "yes" : "no"}`,
    `- productionIndexable: ${result.manifest.productionIndexable ? "yes" : "no"}`,
    `- canonicalMode: ${result.manifest.canonicalMode ?? "—"}`,
    `- mirror mode: ${result.manifest.mirrorMode ?? "contents-only"}`,
    `- uploaded contents of public-dist: ${result.manifest.uploadedContentsOfPublicDist ? "yes" : "no"}`,
    `- remote root receives index.html: ${result.manifest.remoteRootReceivesIndexHtml ? "yes" : "no"}`,
    `- legacy public-dist/ cleanup attempted: ${result.manifest.legacyPublicDistDirRemoved ? "yes" : "no (dry-run or not applied)"}`,
    "",
    "## Staging FTP target (no passwords)",
    "",
    `- server: ${result.ftpEnv.server ?? "(not configured)"}`,
    `- username: ${result.ftpEnv.username ?? "(not configured)"}`,
    `- server dir: ${result.ftpEnv.serverDir ?? "(not configured)"}`,
    `- env complete: ${result.ftpEnv.complete ? "yes" : "no"}`,
    "",
    "## Rollback / backup",
    "",
    "- Before `--apply`: tarball current staging FTP + save deploy manifest",
    "- Save `staging-ftp-deploy-manifest.previous.json` automatically on next deploy",
    "- On failure: re-mirror previous `public-dist` tarball to staging FTP",
    "- **Production:** backup is mandatory before any prod deploy (not performed in Phase G-2)",
    "",
  ];

  if (result.manifest.lftpPreview) {
    lines.push("## lftp command preview", "", "```bash", result.manifest.lftpPreview, "```", "");
  }

  if (result.dirRisk.warnings?.length) {
    lines.push("## FTP dir warnings", "");
    for (const w of result.dirRisk.warnings) lines.push(`- ${w}`);
    lines.push("");
  }

  if (result.errors.length) {
    lines.push("## Errors", "");
    for (const e of result.errors) lines.push(`- ${e}`);
    lines.push("");
  }

  if (result.notes.length) {
    lines.push("## Notes", "");
    for (const n of result.notes) lines.push(`- ${n}`);
    lines.push("");
  }

  lines.push(
    "---",
    "Phase G-2: staging FTP only. Production FTP / Sariswing FTP not used.",
    `Report: \`${path.relative(repoRoot, abs)}\``,
    "",
  );

  fs.writeFileSync(abs, lines.join("\n"), "utf8");
  return abs;
}

/**
 * @param {object} result
 */
export function formatDeploySummary(result) {
  return [
    "",
    "=== Staging FTP Deploy Summary ===",
    `mode: ${result.mode}`,
    `env: ${result.envResult.env ?? "—"} (${result.envResult.ok ? "allowed" : "rejected"})`,
    `applied: ${result.applied}`,
    `FTP connected: ${result.ftpConnected}`,
    `public-dir safe: ${result.publicValidation.ok ? "yes" : "no"}`,
    `admin/api/server excluded: ${result.publicValidation.adminExcluded && result.publicValidation.apiExcluded && result.publicValidation.serverExcluded ? "yes" : "no"}`,
    `safeForStaticFtp: ${result.publicValidation.safeForStaticFtp}`,
    `deployBase: ${result.manifest.deployBase ?? "—"}`,
    `stagingSubdirBuild: ${result.manifest.stagingSubdirBuild ? "yes" : "no"}`,
    `asset paths include base: ${result.manifest.assetPathsIncludeBase ? "yes" : "no"}`,
    `stagingNoindex: ${result.manifest.stagingNoindex ? "yes" : "no"}`,
    `robotsDisallowAll: ${result.manifest.robotsDisallowAll ? "yes" : "no"}`,
    `productionIndexable: ${result.manifest.productionIndexable ? "yes" : "no"}`,
    `mirror mode: ${result.manifest.mirrorMode ?? "contents-only"}`,
    `uploaded contents of public-dist: ${result.manifest.uploadedContentsOfPublicDist ? "yes" : "no"}`,
    `remote root receives index.html: ${result.manifest.remoteRootReceivesIndexHtml ? "yes" : "no"}`,
    `secret leak: ${result.publicValidation.secretLeakOk ? "none" : "FAIL"}`,
    `overall: ${result.ok ? "PASS" : "FAIL"}`,
  ].join("\n");
}

/**
 * @param {string} text
 */
export function scanTextForSecretLiterals(text) {
  /** @type {string[]} */
  const hits = [];
  if (JWT_LIKE.test(text)) hits.push("jwt-like");
  if (/GOSAKI_STAGING_FTP_PASSWORD\s*=\s*['"]?[A-Za-z0-9_\-!@#$%^&*]{6,}/.test(text)) hits.push("ftp password assignment");
  if (/GOSAKI_PROD_/.test(text) && /=/.test(text)) hits.push("prod secret assignment");
  return hits;
}
