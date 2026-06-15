/**
 * URL-to-staging pipeline config loader (G-7b).
 * No secrets in config files.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_TOOL_ROOT,
  resolveSiteConfigPath,
  toRepoRelativePath,
} from "./site-config-loader.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @param {string} configPath
 * @param {string} [toolRoot]
 * @param {string} [repoRoot]
 */
export function loadUrlToStagingConfig(configPath, toolRoot = DEFAULT_TOOL_ROOT, repoRoot = null) {
  const abs = resolveSiteConfigPath(configPath, toolRoot, repoRoot);
  if (!fs.existsSync(abs)) {
    throw new Error(`Config not found: ${abs}`);
  }
  const raw = JSON.parse(fs.readFileSync(abs, "utf8"));
  const validation = validateUrlToStagingConfig(raw);
  if (!validation.ok) {
    throw new Error(`Invalid config: ${validation.errors.join("; ")}`);
  }
  return normalizeUrlToStagingConfig(raw, toolRoot, repoRoot);
}

/**
 * @param {unknown} config
 */
export function validateUrlToStagingConfig(config) {
  /** @type {string[]} */
  const errors = [];
  if (!config || typeof config !== "object") {
    return { ok: false, errors: ["Config must be a JSON object"] };
  }
  const c = /** @type {Record<string, unknown>} */ (config);
  if (!c.siteSlug || typeof c.siteSlug !== "string") errors.push("siteSlug required");
  if (!c.startUrl || typeof c.startUrl !== "string") errors.push("startUrl required");
  if (!c.fixtureOut || typeof c.fixtureOut !== "string") errors.push("fixtureOut required");
  if (!c.projectOut || typeof c.projectOut !== "string") errors.push("projectOut required");
  if (!c.deployBase || typeof c.deployBase !== "string") errors.push("deployBase required");
  else if (!String(c.deployBase).startsWith("/")) errors.push("deployBase must start with /");
  if (c.maxPages != null && (typeof c.maxPages !== "number" || c.maxPages < 1)) {
    errors.push("maxPages must be a positive number");
  }
  return { ok: errors.length === 0, errors };
}

/**
 * @param {Record<string, unknown>} raw
 * @param {string} toolRoot
 * @param {string | null} repoRoot
 */
export function normalizeUrlToStagingConfig(raw, toolRoot = DEFAULT_TOOL_ROOT, repoRoot = null) {
  const root = path.resolve(repoRoot ?? path.resolve(toolRoot, "../.."));
  const siteSlug = String(raw.siteSlug);
  const fixtureOut = resolveSiteConfigPath(String(raw.fixtureOut), toolRoot, root);
  const projectOut = resolveSiteConfigPath(String(raw.projectOut), toolRoot, root);
  const staticPublicOut =
    raw.staticPublicOut != null
      ? resolveSiteConfigPath(String(raw.staticPublicOut), toolRoot, root)
      : path.join(toolRoot, "output", "static-public", siteSlug);

  const stagingBaseUrl = raw.stagingBaseUrl != null ? String(raw.stagingBaseUrl).replace(/\/$/, "") : null;
  const productionBaseUrl =
    raw.productionBaseUrl != null ? String(raw.productionBaseUrl).replace(/\/$/, "") : null;

  return {
    siteSlug,
    startUrl: String(raw.startUrl),
    fixtureOut,
    fixtureOutRel: toRepoRelativePath(fixtureOut, toolRoot, root),
    projectOut,
    projectOutRel: toRepoRelativePath(projectOut, toolRoot, root),
    staticPublicOut,
    staticPublicOutRel: toRepoRelativePath(staticPublicOut, toolRoot, root),
    deployBase: String(raw.deployBase),
    stagingBaseUrl,
    productionBaseUrl,
    siteProfile: raw.siteProfile != null ? String(raw.siteProfile) : "musician",
    maxPages: typeof raw.maxPages === "number" ? raw.maxPages : 20,
    sameOriginOnly: raw.sameOriginOnly !== false,
    respectRobots: raw.respectRobots !== false,
    seo: {
      stagingNoindex: raw.seo?.stagingNoindex !== false,
      robotsDisallowAll: raw.seo?.robotsDisallowAll !== false,
      canonicalMode: raw.seo?.canonicalMode ?? "staging-url",
    },
    runsOut: path.join(toolRoot, "output", "runs"),
    configPath: raw._configPath ?? null,
  };
}

/**
 * Merge CLI overrides onto normalized config.
 * @param {ReturnType<typeof normalizeUrlToStagingConfig>} config
 * @param {Record<string, unknown>} cli
 */
export function mergeConfigWithCli(config, cli) {
  const merged = { ...config };
  if (cli.url) merged.startUrl = String(cli.url);
  if (cli.siteSlug) merged.siteSlug = String(cli.siteSlug);
  if (cli.fixtureOut) {
    merged.fixtureOut = resolveSiteConfigPath(String(cli.fixtureOut), DEFAULT_TOOL_ROOT);
    merged.fixtureOutRel = toRepoRelativePath(merged.fixtureOut, DEFAULT_TOOL_ROOT);
  }
  if (cli.projectOut) {
    merged.projectOut = resolveSiteConfigPath(String(cli.projectOut), DEFAULT_TOOL_ROOT);
    merged.projectOutRel = toRepoRelativePath(merged.projectOut, DEFAULT_TOOL_ROOT);
  }
  if (cli.deployBase) merged.deployBase = String(cli.deployBase);
  if (cli.stagingBaseUrl) merged.stagingBaseUrl = String(cli.stagingBaseUrl).replace(/\/$/, "");
  if (cli.maxPages != null) merged.maxPages = Number(cli.maxPages);
  if (cli.siteProfile) merged.siteProfile = String(cli.siteProfile);
  return merged;
}
