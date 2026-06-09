/**
 * CMS template registry loader (G-5d).
 * Read-only metadata — does not drive Astro generation or deploy yet.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadSiteConfig } from "./site-config-loader.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
export const REGISTRY_REL_PATH = "config/templates/cms-template-registry.json";

/**
 * @param {string} [toolRoot]
 */
export function resolveRegistryPath(toolRoot = DEFAULT_TOOL_ROOT) {
  return path.join(toolRoot, REGISTRY_REL_PATH);
}

/**
 * @param {unknown} registry
 */
export function validateTemplateRegistry(registry) {
  /** @type {string[]} */
  const errors = [];

  if (!registry || typeof registry !== "object") {
    return { ok: false, errors: ["Registry must be a JSON object"] };
  }

  const r = /** @type {Record<string, unknown>} */ (registry);
  if (typeof r.version !== "string" || !r.version.trim()) {
    errors.push("Missing or invalid field: version");
  }
  if (!Array.isArray(r.templates) || r.templates.length === 0) {
    errors.push("templates must be a non-empty array");
    return { ok: false, errors };
  }

  const ids = new Set();
  for (const [index, entry] of r.templates.entries()) {
    const prefix = `templates[${index}]`;
    if (!entry || typeof entry !== "object") {
      errors.push(`${prefix}: must be an object`);
      continue;
    }
    const t = /** @type {Record<string, unknown>} */ (entry);
    if (typeof t.templateId !== "string" || !t.templateId.trim()) {
      errors.push(`${prefix}: templateId is required`);
      continue;
    }
    if (ids.has(t.templateId)) {
      errors.push(`${prefix}: duplicate templateId "${t.templateId}"`);
    }
    ids.add(t.templateId);
    if (!Array.isArray(t.siteTypes) || t.siteTypes.length === 0) {
      errors.push(`${prefix}: siteTypes must be a non-empty array`);
    }
    if (typeof t.status !== "string" || !t.status.trim()) {
      errors.push(`${prefix}: status is required`);
    }
    if (!Array.isArray(t.contentModels)) {
      errors.push(`${prefix}: contentModels must be an array`);
    }
    if (!Array.isArray(t.pages)) {
      errors.push(`${prefix}: pages must be an array`);
    }
    if (!Array.isArray(t.storageAssetTypes)) {
      errors.push(`${prefix}: storageAssetTypes must be an array`);
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true, registry: r };
}

/**
 * @param {string | null} [registryPath]
 * @param {{ toolRoot?: string }} [opts]
 */
export function loadTemplateRegistry(registryPath = null, opts = {}) {
  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const abs = registryPath ? path.resolve(registryPath) : resolveRegistryPath(toolRoot);

  if (!fs.existsSync(abs)) {
    throw new Error(`Template registry not found: ${abs}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch (err) {
    throw new Error(`Failed to parse template registry (${abs}): ${err.message}`);
  }

  const validation = validateTemplateRegistry(parsed);
  if (!validation.ok) {
    throw new Error(`Invalid template registry:\n- ${validation.errors.join("\n- ")}`);
  }

  return {
    registry: validation.registry,
    registryPath: abs,
    registryPathRelative: path
      .relative(path.resolve(toolRoot, "../.."), abs)
      .split(path.sep)
      .join("/"),
    toolRoot,
  };
}

/**
 * @param {object} registry
 * @param {string} templateId
 */
export function getTemplateById(registry, templateId) {
  const id = String(templateId ?? "").trim();
  if (!id) {
    throw new Error("templateId is required");
  }
  const templates = Array.isArray(registry.templates) ? registry.templates : [];
  const found = templates.find((t) => t.templateId === id);
  if (!found) {
    const available = templates.map((t) => t.templateId).join(", ");
    throw new Error(`Template not found: "${id}". Available: ${available || "(none)"}`);
  }
  return found;
}

/**
 * @param {object} registry
 * @param {string} siteType
 */
export function getTemplatesForSiteType(registry, siteType) {
  const type = String(siteType ?? "").trim();
  if (!type) {
    throw new Error("siteType is required");
  }
  const templates = Array.isArray(registry.templates) ? registry.templates : [];
  return templates.filter((t) => Array.isArray(t.siteTypes) && t.siteTypes.includes(type));
}

/**
 * @param {object} template
 */
export function getHumanReviewRequiredAssetTypes(template) {
  const fromStorage = (template.storageAssetTypes ?? [])
    .filter((a) => a.humanReviewRequired)
    .map((a) => a.assetType);
  const fromModels = (template.contentModels ?? [])
    .filter((m) => m.humanReviewRequired)
    .flatMap((m) => m.storageAssets ?? []);
  return [...new Set([...fromStorage, ...fromModels])].sort();
}

/**
 * @param {Record<string, unknown>} siteConfig
 * @param {object} registry
 */
export function validateSiteConfigTemplate(siteConfig, registry) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  const siteType = typeof siteConfig.siteType === "string" ? siteConfig.siteType.trim() : "";
  const templateId =
    typeof siteConfig.templateId === "string" ? siteConfig.templateId.trim() : "";

  if (!templateId) {
    warnings.push("site config has no templateId — registry validation skipped");
    return { ok: true, errors, warnings, template: null };
  }

  let template;
  try {
    template = getTemplateById(registry, templateId);
  } catch (err) {
    errors.push(err.message);
    return { ok: false, errors, warnings, template: null };
  }

  if (siteType && !template.siteTypes.includes(siteType)) {
    errors.push(
      `templateId "${templateId}" does not support siteType "${siteType}" (supports: ${template.siteTypes.join(", ")})`,
    );
  }

  const siteProfile =
    typeof siteConfig.siteProfile === "string" ? siteConfig.siteProfile.trim() : "";
  if (siteProfile && siteProfile !== siteType && !template.siteTypes.includes(siteProfile)) {
    warnings.push(
      `siteProfile "${siteProfile}" differs from siteType "${siteType}" — verify profile/registry alignment`,
    );
  }

  const slug = typeof siteConfig.siteSlug === "string" ? siteConfig.siteSlug : "";
  if (
    slug &&
    Array.isArray(template.knownSiteExamples) &&
    template.knownSiteExamples.length &&
    !template.knownSiteExamples.includes(slug) &&
    template.status === "proven-with-gosaki"
  ) {
    warnings.push(
      `siteSlug "${slug}" is not in template knownSiteExamples (${template.knownSiteExamples.join(", ")})`,
    );
  }

  if (template.status === "draft") {
    warnings.push(`template "${templateId}" is draft — not proven on staging yet`);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    template,
  };
}

/**
 * @param {Record<string, unknown>} siteConfig
 * @param {object} registry
 */
export function resolveTemplateForSiteConfig(siteConfig, registry) {
  const templateId =
    typeof siteConfig.templateId === "string" ? siteConfig.templateId.trim() : "";
  if (templateId) {
    return getTemplateById(registry, templateId);
  }

  const siteType = typeof siteConfig.siteType === "string" ? siteConfig.siteType.trim() : "";
  if (!siteType) {
    throw new Error("site config must include templateId or siteType to resolve template");
  }

  const matches = getTemplatesForSiteType(registry, siteType);
  if (matches.length === 0) {
    throw new Error(`No template registered for siteType "${siteType}"`);
  }
  if (matches.length > 1) {
    const proven = matches.find((t) => t.status === "proven-with-gosaki");
    if (proven) return proven;
    throw new Error(
      `Multiple templates for siteType "${siteType}": ${matches.map((t) => t.templateId).join(", ")} — set templateId explicitly`,
    );
  }
  return matches[0];
}

/**
 * @param {{
 *   siteConfigPath?: string | null,
 *   templateId?: string | null,
 *   siteType?: string | null,
 *   registryPath?: string | null,
 *   toolRoot?: string,
 * }} opts
 */
export function inspectTemplateRegistry(opts = {}) {
  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const repoRoot = path.resolve(toolRoot, "../..");
  const { registry, registryPathRelative } = loadTemplateRegistry(opts.registryPath ?? null, {
    toolRoot,
  });

  /** @type {Record<string, unknown> | null} */
  let siteConfig = null;
  let siteConfigPathRelative = null;
  /** @type {ReturnType<typeof validateSiteConfigTemplate> | null} */
  let configValidation = null;

  if (opts.siteConfigPath) {
    const loaded = loadSiteConfig(opts.siteConfigPath, { toolRoot, repoRoot });
    siteConfig = loaded.config;
    siteConfigPathRelative = loaded.configPathRelative;
    configValidation = validateSiteConfigTemplate(siteConfig, registry);
  }

  let template;
  if (opts.templateId) {
    template = getTemplateById(registry, opts.templateId);
  } else if (opts.siteType) {
    const matches = getTemplatesForSiteType(registry, opts.siteType);
    template = matches.length === 1 ? matches[0] : null;
  } else if (siteConfig) {
    template = configValidation?.template ?? resolveTemplateForSiteConfig(siteConfig, registry);
  } else {
    throw new Error("Provide --site-config, --template-id, or --site-type");
  }

  const humanReviewRequired = template ? getHumanReviewRequiredAssetTypes(template) : [];

  /** @type {string[]} */
  const openQuestions = [];
  if (template?.status === "draft") {
    openQuestions.push("Schema adapter and Supabase tables not defined for this template yet.");
    openQuestions.push("Admin CMS pages are not generated from registry in G-5d.");
  }
  if (siteConfig && !siteConfig.templateId) {
    openQuestions.push("Consider adding templateId to site config for explicit template selection.");
  }

  return {
    registryVersion: registry.version,
    registryPath: registryPathRelative,
    siteConfigPath: siteConfigPathRelative,
    siteSlug: siteConfig?.siteSlug ?? null,
    siteType: siteConfig?.siteType ?? opts.siteType ?? template?.siteTypes?.[0] ?? null,
    templateId: template?.templateId ?? opts.templateId ?? siteConfig?.templateId ?? null,
    schemaAdapterId:
      typeof siteConfig?.schemaAdapterId === "string" ? siteConfig.schemaAdapterId.trim() : null,
    templateStatus: template?.status ?? null,
    templateDescription: template?.description ?? null,
    contentModels: template?.contentModels ?? [],
    pages: template?.pages ?? [],
    storageAssetTypes: template?.storageAssetTypes ?? [],
    humanReviewRequiredAssetTypes: humanReviewRequired,
    seoFeatures: template?.seoFeatures ?? [],
    deployFeatures: template?.deployFeatures ?? [],
    knownSiteExamples: template?.knownSiteExamples ?? [],
    notes: template?.notes ?? [],
    warnings: configValidation?.warnings ?? [],
    errors: configValidation?.errors ?? [],
    validationOk: configValidation ? configValidation.ok : true,
    openQuestions,
    candidatesForSiteType:
      opts.siteType && !opts.templateId
        ? getTemplatesForSiteType(registry, opts.siteType).map((t) => ({
            templateId: t.templateId,
            status: t.status,
          }))
        : null,
    uploadPerformed: false,
    dbUpdatePerformed: false,
    ftpDeployPerformed: false,
    configDriven: Boolean(opts.siteConfigPath),
    mode: "read-only",
    phase: "G-5d",
  };
}
