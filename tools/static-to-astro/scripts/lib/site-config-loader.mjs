/**
 * Site config loader (G-5c).
 * Loads per-site JSON config and resolves default paths for read-only CLIs.
 * Secrets must NOT appear in site config files.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

/** @type {readonly string[]} */
export const READ_ONLY_CLI_NAMES = [
  "review-storage-assets",
  "prepare-storage-upload-allowlist",
  "review-schedule-storage-assets",
  "promote-schedule-storage-allowlist",
];

export const READ_ONLY_SAFETY_META = {
  uploadPerformed: false,
  dbUpdatePerformed: false,
  ftpDeployPerformed: false,
};

/**
 * @param {string | null | undefined} value
 * @param {string | null | undefined} fallback
 */
export function pickCliArg(value, fallback) {
  if (value != null && String(value).trim() !== "") {
    return value;
  }
  return fallback ?? null;
}

/**
 * @param {string} relOrAbs
 * @param {string} toolRoot
 * @param {string} repoRoot
 */
export function resolveSiteConfigPath(relOrAbs, toolRoot = DEFAULT_TOOL_ROOT, repoRoot = null) {
  const raw = String(relOrAbs ?? "").trim();
  if (!raw) {
    throw new Error("Path is empty");
  }
  if (path.isAbsolute(raw)) {
    return raw;
  }
  const root = path.resolve(repoRoot ?? path.resolve(toolRoot, "../.."));
  if (raw.startsWith("tools/static-to-astro/")) {
    return path.resolve(root, raw);
  }
  return path.resolve(toolRoot, raw);
}

/**
 * @param {string} relOrAbs
 * @param {string} toolRoot
 * @param {string} repoRoot
 */
export function toRepoRelativePath(relOrAbs, toolRoot = DEFAULT_TOOL_ROOT, repoRoot = null) {
  const abs = resolveSiteConfigPath(relOrAbs, toolRoot, repoRoot);
  const root = path.resolve(repoRoot ?? path.resolve(toolRoot, "../.."));
  return path.relative(root, abs).split(path.sep).join("/");
}

/**
 * @param {unknown} config
 */
export function validateSiteConfig(config) {
  /** @type {string[]} */
  const errors = [];

  if (!config || typeof config !== "object") {
    return { ok: false, errors: ["Site config must be a JSON object"] };
  }

  const c = /** @type {Record<string, unknown>} */ (config);

  if (typeof c.siteSlug !== "string" || !c.siteSlug.trim()) {
    errors.push('Missing or invalid required field: siteSlug (string)');
  }

  const source = c.source;
  if (!source || typeof source !== "object") {
    errors.push("Missing or invalid required field: source (object with fixtureDir)");
  } else {
    const s = /** @type {Record<string, unknown>} */ (source);
    if (typeof s.fixtureDir !== "string" || !s.fixtureDir.trim()) {
      errors.push("source.fixtureDir is required (string)");
    }
  }

  const output = c.output;
  if (!output || typeof output !== "object") {
    errors.push(
      "Missing or invalid required field: output (object with storage path — output.reports.storage or output.storageDir)",
    );
  } else {
    const o = /** @type {Record<string, unknown>} */ (output);
    const reports = o.reports && typeof o.reports === "object"
      ? /** @type {Record<string, unknown>} */ (o.reports)
      : null;
    const storagePath =
      (typeof o.storageDir === "string" && o.storageDir.trim()) ||
      (reports && typeof reports.storage === "string" && reports.storage.trim()) ||
      null;
    if (!storagePath) {
      errors.push("output.storageDir or output.reports.storage is required");
    }
  }

  if (errors.length) {
    return { ok: false, errors };
  }

  return { ok: true, config: c };
}

/**
 * @param {string} configPath
 * @param {{ toolRoot?: string, repoRoot?: string }} [opts]
 */
export function loadSiteConfig(configPath, opts = {}) {
  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const repoRoot = opts.repoRoot ?? path.resolve(toolRoot, "../..");
  const abs = resolveSiteConfigPath(configPath, toolRoot, repoRoot);

  if (!fs.existsSync(abs)) {
    throw new Error(`Site config not found: ${abs}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch (err) {
    throw new Error(`Failed to parse site config (${abs}): ${err.message}`);
  }

  const validation = validateSiteConfig(parsed);
  if (!validation.ok) {
    throw new Error(`Invalid site config:\n- ${validation.errors.join("\n- ")}`);
  }

  return {
    config: validation.config,
    configPath: abs,
    configPathRelative: path.relative(repoRoot, abs).split(path.sep).join("/"),
    toolRoot,
    repoRoot,
  };
}

/**
 * @param {Record<string, unknown>} config
 * @param {{ toolRoot?: string, repoRoot?: string }} [opts]
 */
export function resolveSitePaths(config, opts = {}) {
  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const repoRoot = opts.repoRoot ?? path.resolve(toolRoot, "../..");
  const siteSlug = String(config.siteSlug).trim();

  const source = /** @type {Record<string, unknown>} */ (config.source);
  const output = /** @type {Record<string, unknown>} */ (config.output);
  const reports =
    output.reports && typeof output.reports === "object"
      ? /** @type {Record<string, unknown>} */ (output.reports)
      : {};

  const storageRel =
    (typeof output.storageDir === "string" && output.storageDir) ||
    (typeof reports.storage === "string" && reports.storage) ||
    `output/storage/${siteSlug}`;

  const generatedAstroRel =
    (typeof output.generatedAstroDir === "string" && output.generatedAstroDir) ||
    (typeof output.generatedAstro === "string" && output.generatedAstro) ||
    "output/generated-astro";

  const storageDirAbs = resolveSiteConfigPath(storageRel, toolRoot, repoRoot);
  const generatedAstroDirAbs = resolveSiteConfigPath(generatedAstroRel, toolRoot, repoRoot);
  const fixtureDirAbs = resolveSiteConfigPath(String(source.fixtureDir), toolRoot, repoRoot);
  const dataDirAbs = path.join(generatedAstroDirAbs, "src", "data");

  return {
    siteSlug,
    siteName: typeof config.siteName === "string" ? config.siteName : null,
    siteType: typeof config.siteType === "string" ? config.siteType : null,
    fixtureDir: toRepoRelativePath(fixtureDirAbs, toolRoot, repoRoot),
    fixtureDirAbs,
    dataDir: toRepoRelativePath(dataDirAbs, toolRoot, repoRoot),
    dataDirAbs,
    storageDir: toRepoRelativePath(storageDirAbs, toolRoot, repoRoot),
    storageDirAbs,
    generatedAstroDir: toRepoRelativePath(generatedAstroDirAbs, toolRoot, repoRoot),
    paths: {
      reviewManifest: toRepoRelativePath(
        path.join(storageDirAbs, "storage-asset-review-manifest.json"),
        toolRoot,
        repoRoot,
      ),
      reviewReport: toRepoRelativePath(
        path.join(storageDirAbs, "STORAGE_ASSET_REVIEW_REPORT.md"),
        toolRoot,
        repoRoot,
      ),
      uploadAllowlist: toRepoRelativePath(
        path.join(storageDirAbs, "storage-upload-allowlist.json"),
        toolRoot,
        repoRoot,
      ),
      uploadAllowlistReport: toRepoRelativePath(
        path.join(storageDirAbs, "STORAGE_UPLOAD_ALLOWLIST_REPORT.md"),
        toolRoot,
        repoRoot,
      ),
      scheduleHumanReviewManifest: toRepoRelativePath(
        path.join(storageDirAbs, "schedule-image-human-review.json"),
        toolRoot,
        repoRoot,
      ),
      scheduleHumanReviewReport: toRepoRelativePath(
        path.join(storageDirAbs, "SCHEDULE_IMAGE_HUMAN_REVIEW_REPORT.md"),
        toolRoot,
        repoRoot,
      ),
      scheduleDecisionTemplate: toRepoRelativePath(
        path.join(storageDirAbs, "schedule-image-human-decision-template.json"),
        toolRoot,
        repoRoot,
      ),
      scheduleUploadAllowlist: toRepoRelativePath(
        path.join(storageDirAbs, "schedule-upload-allowlist.json"),
        toolRoot,
        repoRoot,
      ),
      scheduleUploadAllowlistReport: toRepoRelativePath(
        path.join(storageDirAbs, "SCHEDULE_UPLOAD_ALLOWLIST_REPORT.md"),
        toolRoot,
        repoRoot,
      ),
    },
  };
}

/**
 * @param {string} cliName
 * @param {Record<string, unknown>} cliOpts
 * @param {Record<string, unknown>} config
 * @param {ReturnType<typeof resolveSitePaths>} paths
 */
export function mergeCliArgsWithSiteConfig(cliName, cliOpts, config, paths) {
  const p = paths.paths;
  /** @type {Record<string, unknown>} */
  const merged = { ...cliOpts };

  merged.siteSlug = pickCliArg(
    /** @type {string | null | undefined} */ (cliOpts.siteSlug),
    paths.siteSlug,
  );

  switch (cliName) {
    case "review-storage-assets":
      merged.fixtureDir = pickCliArg(
        /** @type {string | null | undefined} */ (cliOpts.fixtureDir),
        paths.fixtureDir,
      );
      merged.dataDir = pickCliArg(
        /** @type {string | null | undefined} */ (cliOpts.dataDir),
        paths.dataDir,
      );
      merged.report = pickCliArg(
        /** @type {string | null | undefined} */ (cliOpts.report),
        p.reviewReport,
      );
      merged.manifest = pickCliArg(
        /** @type {string | null | undefined} */ (cliOpts.manifest),
        p.reviewManifest,
      );
      break;

    case "prepare-storage-upload-allowlist":
      merged.reviewManifest = pickCliArg(
        /** @type {string | null | undefined} */ (cliOpts.reviewManifest),
        p.reviewManifest,
      );
      merged.report = pickCliArg(
        /** @type {string | null | undefined} */ (cliOpts.report),
        p.uploadAllowlistReport,
      );
      merged.allowlist = pickCliArg(
        /** @type {string | null | undefined} */ (cliOpts.allowlist),
        p.uploadAllowlist,
      );
      break;

    case "review-schedule-storage-assets":
      merged.allowlist = pickCliArg(
        /** @type {string | null | undefined} */ (cliOpts.allowlist),
        p.uploadAllowlist,
      );
      merged.reviewManifest = pickCliArg(
        /** @type {string | null | undefined} */ (cliOpts.reviewManifest),
        p.reviewManifest,
      );
      merged.dataDir = pickCliArg(
        /** @type {string | null | undefined} */ (cliOpts.dataDir),
        paths.dataDir,
      );
      merged.report = pickCliArg(
        /** @type {string | null | undefined} */ (cliOpts.report),
        p.scheduleHumanReviewReport,
      );
      merged.manifest = pickCliArg(
        /** @type {string | null | undefined} */ (cliOpts.manifest),
        p.scheduleHumanReviewManifest,
      );
      merged.decisionTemplate = pickCliArg(
        /** @type {string | null | undefined} */ (cliOpts.decisionTemplate),
        p.scheduleDecisionTemplate,
      );
      merged.fixtureDir = pickCliArg(
        /** @type {string | null | undefined} */ (cliOpts.fixtureDir),
        paths.fixtureDir,
      );
      break;

    case "promote-schedule-storage-allowlist":
      merged.decisionTemplate = pickCliArg(
        /** @type {string | null | undefined} */ (cliOpts.decisionTemplate),
        p.scheduleDecisionTemplate,
      );
      merged.report = pickCliArg(
        /** @type {string | null | undefined} */ (cliOpts.report),
        p.scheduleUploadAllowlistReport,
      );
      merged.allowlist = pickCliArg(
        /** @type {string | null | undefined} */ (cliOpts.allowlist),
        p.scheduleUploadAllowlist,
      );
      break;

    default:
      throw new Error(
        `mergeCliArgsWithSiteConfig: unsupported CLI "${cliName}". ` +
          `Supported: ${READ_ONLY_CLI_NAMES.join(", ")}`,
      );
  }

  return merged;
}

/**
 * @param {string} cliName
 * @param {Record<string, unknown>} cliOpts
 * @param {{ toolRoot?: string, repoRoot?: string }} [opts]
 */
export function applySiteConfigToCli(cliName, cliOpts, opts = {}) {
  const siteConfigArg = /** @type {string | null | undefined} */ (cliOpts.siteConfig);
  if (!siteConfigArg) {
    return { opts: cliOpts, meta: null, paths: null };
  }

  if (!READ_ONLY_CLI_NAMES.includes(cliName)) {
    throw new Error(
      `--site-config is only supported for read-only CLIs in G-5c: ${READ_ONLY_CLI_NAMES.join(", ")}`,
    );
  }

  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const repoRoot = opts.repoRoot ?? path.resolve(toolRoot, "../..");
  const loaded = loadSiteConfig(siteConfigArg, { toolRoot, repoRoot });
  const paths = resolveSitePaths(loaded.config, { toolRoot, repoRoot });
  const merged = mergeCliArgsWithSiteConfig(cliName, cliOpts, loaded.config, paths);

  const meta = {
    siteConfigPath: loaded.configPathRelative,
    configDriven: true,
    ...READ_ONLY_SAFETY_META,
  };

  return { opts: merged, meta, paths, config: loaded.config };
}

/**
 * @param {object} manifest
 * @param {{ siteConfigPath?: string, configDriven?: boolean } | null} meta
 */
export function attachSiteConfigMeta(manifest, meta) {
  if (!meta) return manifest;
  return {
    ...manifest,
    siteConfigPath: meta.siteConfigPath,
    configDriven: meta.configDriven,
    uploadPerformed: meta.uploadPerformed ?? false,
    dbUpdatePerformed: meta.dbUpdatePerformed ?? false,
    ftpDeployPerformed: meta.ftpDeployPerformed ?? false,
  };
}

/**
 * @param {{ siteConfigPath?: string, configDriven?: boolean } | null} meta
 */
export function formatSiteConfigReportFooter(meta) {
  if (!meta?.configDriven) return "";
  return [
    "",
    "## Site config (G-5c)",
    "",
    `| Field | Value |`,
    `| --- | --- |`,
    `| siteConfigPath | \`${meta.siteConfigPath}\` |`,
    `| configDriven | **true** |`,
    `| uploadPerformed | **false** |`,
    `| dbUpdatePerformed | **false** |`,
    `| ftpDeployPerformed | **false** |`,
    "",
  ].join("\n");
}
