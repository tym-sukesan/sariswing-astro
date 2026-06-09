/**
 * CMS schema adapter loader (G-5e).
 * Read-only metadata — maps template registry to Supabase tables/columns/storage.
 * Does NOT create DB tables, upload Storage, or apply DB updates.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadSiteConfig } from "./site-config-loader.mjs";
import {
  getTemplateById,
  loadTemplateRegistry,
  resolveTemplateForSiteConfig,
} from "./template-registry-loader.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
export const ADAPTERS_REL_PATH = "config/schema-adapters/cms-schema-adapters.json";

/**
 * @param {string} [toolRoot]
 */
export function resolveSchemaAdaptersPath(toolRoot = DEFAULT_TOOL_ROOT) {
  return path.join(toolRoot, ADAPTERS_REL_PATH);
}

/**
 * @param {unknown} data
 */
export function validateSchemaAdaptersRegistry(data) {
  /** @type {string[]} */
  const errors = [];

  if (!data || typeof data !== "object") {
    return { ok: false, errors: ["Schema adapters registry must be a JSON object"] };
  }

  const r = /** @type {Record<string, unknown>} */ (data);
  if (typeof r.version !== "string" || !r.version.trim()) {
    errors.push("Missing or invalid field: version");
  }
  if (!Array.isArray(r.adapters) || r.adapters.length === 0) {
    errors.push("adapters must be a non-empty array");
    return { ok: false, errors };
  }

  const ids = new Set();
  for (const [index, entry] of r.adapters.entries()) {
    const prefix = `adapters[${index}]`;
    if (!entry || typeof entry !== "object") {
      errors.push(`${prefix}: must be an object`);
      continue;
    }
    const a = /** @type {Record<string, unknown>} */ (entry);
    if (typeof a.adapterId !== "string" || !a.adapterId.trim()) {
      errors.push(`${prefix}: adapterId is required`);
      continue;
    }
    if (ids.has(a.adapterId)) {
      errors.push(`${prefix}: duplicate adapterId "${a.adapterId}"`);
    }
    ids.add(a.adapterId);
    if (typeof a.templateId !== "string" || !a.templateId.trim()) {
      errors.push(`${prefix}: templateId is required`);
    }
    if (typeof a.provider !== "string" || !a.provider.trim()) {
      errors.push(`${prefix}: provider is required`);
    }
    if (!Array.isArray(a.tables)) {
      errors.push(`${prefix}: tables must be an array`);
    }
    if (!Array.isArray(a.storageMappings)) {
      errors.push(`${prefix}: storageMappings must be an array`);
    }
    if (!Array.isArray(a.humanReviewRules)) {
      errors.push(`${prefix}: humanReviewRules must be an array`);
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true, registry: r };
}

/**
 * @param {string | null} [adaptersPath]
 * @param {{ toolRoot?: string }} [opts]
 */
export function loadSchemaAdapters(adaptersPath = null, opts = {}) {
  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const repoRoot = path.resolve(toolRoot, "../..");
  const abs = adaptersPath ? path.resolve(adaptersPath) : resolveSchemaAdaptersPath(toolRoot);

  if (!fs.existsSync(abs)) {
    throw new Error(`Schema adapters registry not found: ${abs}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch (err) {
    throw new Error(`Failed to parse schema adapters (${abs}): ${err.message}`);
  }

  const validation = validateSchemaAdaptersRegistry(parsed);
  if (!validation.ok) {
    throw new Error(`Invalid schema adapters registry:\n- ${validation.errors.join("\n- ")}`);
  }

  return {
    registry: validation.registry,
    adaptersPath: abs,
    adaptersPathRelative: path.relative(repoRoot, abs).split(path.sep).join("/"),
    toolRoot,
    repoRoot,
  };
}

/**
 * @param {object} registry
 * @param {string} adapterId
 */
export function getSchemaAdapterById(registry, adapterId) {
  const id = String(adapterId ?? "").trim();
  if (!id) throw new Error("adapterId is required");

  const adapters = Array.isArray(registry.adapters) ? registry.adapters : [];
  const found = adapters.find((a) => a.adapterId === id);
  if (!found) {
    const available = adapters.map((a) => a.adapterId).join(", ");
    throw new Error(`Schema adapter not found: "${id}". Available: ${available || "(none)"}`);
  }
  return found;
}

/**
 * @param {object} registry
 * @param {string} templateId
 */
export function getSchemaAdaptersForTemplate(registry, templateId) {
  const id = String(templateId ?? "").trim();
  if (!id) throw new Error("templateId is required");

  const adapters = Array.isArray(registry.adapters) ? registry.adapters : [];
  return adapters.filter((a) => a.templateId === id);
}

/**
 * @param {Record<string, unknown>} siteConfig
 * @param {object} adaptersRegistry
 */
export function resolveSchemaAdapterForSiteConfig(siteConfig, adaptersRegistry) {
  const adapterId =
    typeof siteConfig.schemaAdapterId === "string" ? siteConfig.schemaAdapterId.trim() : "";
  if (adapterId) {
    return getSchemaAdapterById(adaptersRegistry, adapterId);
  }

  const templateId =
    typeof siteConfig.templateId === "string" ? siteConfig.templateId.trim() : "";
  if (!templateId) {
    throw new Error("site config must include schemaAdapterId or templateId to resolve adapter");
  }

  const matches = getSchemaAdaptersForTemplate(adaptersRegistry, templateId);
  if (matches.length === 0) {
    throw new Error(`No schema adapter registered for templateId "${templateId}"`);
  }
  if (matches.length > 1) {
    const proven = matches.find((a) => a.status === "proven-with-gosaki");
    if (proven) return proven;
    throw new Error(
      `Multiple adapters for templateId "${templateId}": ${matches.map((a) => a.adapterId).join(", ")} — set schemaAdapterId explicitly`,
    );
  }
  return matches[0];
}

/**
 * @param {object} template
 * @param {object} adapter
 * @param {Record<string, unknown>} [siteConfig]
 */
export function validateTemplateSchemaAdapter(template, adapter, siteConfig = null) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  if (adapter.templateId !== template.templateId) {
    errors.push(
      `adapter.templateId "${adapter.templateId}" does not match template "${template.templateId}"`,
    );
  }

  const templateModels = new Set(
    (template.contentModels ?? []).map((m) => m.model),
  );
  const adapterModels = new Set((adapter.tables ?? []).map((t) => t.model));
  const adapterTables = new Set((adapter.tables ?? []).map((t) => t.table));

  for (const cm of template.contentModels ?? []) {
    if (!adapterModels.has(cm.model)) {
      warnings.push(`template contentModel "${cm.model}" has no adapter table mapping`);
    }
  }

  for (const t of adapter.tables ?? []) {
    if (!templateModels.has(t.model)) {
      warnings.push(`adapter table model "${t.model}" is extra vs template contentModels`);
    }
  }

  const templateAssetTypes = new Set(
    (template.storageAssetTypes ?? []).map((a) => a.assetType),
  );
  const adapterAssetTypes = new Set(
    (adapter.storageMappings ?? []).map((m) => m.assetType),
  );

  for (const a of template.storageAssetTypes ?? []) {
    if (!adapterAssetTypes.has(a.assetType)) {
      warnings.push(`template storageAssetType "${a.assetType}" has no adapter storageMapping`);
    } else {
      const mapping = adapter.storageMappings.find((m) => m.assetType === a.assetType);
      const tmpl = a;
      if (mapping.targetTable !== tmpl.targetTable || mapping.targetColumn !== tmpl.targetColumn) {
        errors.push(
          `storage mapping mismatch for ${a.assetType}: template ${tmpl.targetTable}.${tmpl.targetColumn} vs adapter ${mapping.targetTable}.${mapping.targetColumn}`,
        );
      }
      if (Boolean(mapping.humanReviewRequired) !== Boolean(tmpl.humanReviewRequired)) {
        warnings.push(
          `humanReviewRequired mismatch for ${a.assetType}: template=${tmpl.humanReviewRequired} adapter=${mapping.humanReviewRequired}`,
        );
      }
    }
  }

  for (const m of adapter.storageMappings ?? []) {
    if (!templateAssetTypes.has(m.assetType)) {
      warnings.push(`adapter storageMapping "${m.assetType}" is extra vs template storageAssetTypes`);
    }
  }

  if (adapter.status === "draft" && template.status === "proven-with-gosaki") {
    warnings.push("adapter is draft but template is proven-with-gosaki");
  }
  if (adapter.status === "draft") {
    warnings.push(`schema adapter "${adapter.adapterId}" is draft — tables not created on staging`);
  }

  if (siteConfig) {
    const schemaAdapterId =
      typeof siteConfig.schemaAdapterId === "string" ? siteConfig.schemaAdapterId.trim() : "";
    if (schemaAdapterId && schemaAdapterId !== adapter.adapterId) {
      errors.push(
        `site config schemaAdapterId "${schemaAdapterId}" does not match adapter "${adapter.adapterId}"`,
      );
    }

    const cms = siteConfig.cms && typeof siteConfig.cms === "object"
      ? /** @type {Record<string, unknown>} */ (siteConfig.cms)
      : null;
    const configTables = Array.isArray(cms?.tables) ? cms.tables.map(String) : [];
    if (configTables.length) {
      for (const tableName of configTables) {
        if (!adapterTables.has(tableName)) {
          warnings.push(`site config cms.tables includes "${tableName}" not in adapter tables`);
        }
      }
      for (const t of adapter.tables ?? []) {
        if (t.required && !configTables.includes(t.table)) {
          warnings.push(`adapter required table "${t.table}" not listed in site config cms.tables`);
        }
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * @param {object} adapter
 */
export function summarizeSchemaAdapter(adapter) {
  const tables = adapter.tables ?? [];
  const requiredColumns = tables.flatMap((t) =>
    (t.columns ?? []).filter((c) => c.required).map((c) => `${t.table}.${c.name}`),
  );

  return {
    adapterId: adapter.adapterId,
    templateId: adapter.templateId,
    provider: adapter.provider,
    status: adapter.status,
    description: adapter.description ?? null,
    tables: tables.map((t) => ({
      table: t.table,
      model: t.model,
      required: Boolean(t.required),
      legacyId: t.legacyId ?? null,
      columnCount: (t.columns ?? []).length,
    })),
    models: tables.map((t) => t.model),
    requiredColumns,
    legacyIdRules: tables.map((t) => ({
      table: t.table,
      model: t.model,
      legacyId: t.legacyId ?? null,
    })),
    storageMappings: adapter.storageMappings ?? [],
    humanReviewRules: adapter.humanReviewRules ?? [],
    humanReviewRequiredAssetTypes: (adapter.storageMappings ?? [])
      .filter((m) => m.humanReviewRequired)
      .map((m) => m.assetType),
  };
}

/**
 * @param {{
 *   siteConfigPath?: string | null,
 *   adapterId?: string | null,
 *   templateId?: string | null,
 *   adaptersPath?: string | null,
 *   templateRegistryPath?: string | null,
 *   toolRoot?: string,
 * }} opts
 */
export function inspectSchemaAdapter(opts = {}) {
  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const repoRoot = path.resolve(toolRoot, "../..");

  const { registry: adaptersRegistry, adaptersPathRelative } = loadSchemaAdapters(
    opts.adaptersPath ?? null,
    { toolRoot },
  );
  const { registry: templateRegistry } = loadTemplateRegistry(opts.templateRegistryPath ?? null, {
    toolRoot,
  });

  /** @type {Record<string, unknown> | null} */
  let siteConfig = null;
  let siteConfigPathRelative = null;

  if (opts.siteConfigPath) {
    const loaded = loadSiteConfig(opts.siteConfigPath, { toolRoot, repoRoot });
    siteConfig = loaded.config;
    siteConfigPathRelative = loaded.configPathRelative;
  }

  let template;
  let adapter;

  if (opts.adapterId) {
    adapter = getSchemaAdapterById(adaptersRegistry, opts.adapterId);
    template = getTemplateById(templateRegistry, adapter.templateId);
  } else if (opts.templateId) {
    template = getTemplateById(templateRegistry, opts.templateId);
    const matches = getSchemaAdaptersForTemplate(adaptersRegistry, opts.templateId);
    adapter = matches.length === 1 ? matches[0] : null;
  } else if (siteConfig) {
    template = resolveTemplateForSiteConfig(siteConfig, templateRegistry);
    adapter = resolveSchemaAdapterForSiteConfig(siteConfig, adaptersRegistry);
  } else {
    throw new Error("Provide --site-config, --adapter-id, or --template-id");
  }

  const validation =
    template && adapter
      ? validateTemplateSchemaAdapter(template, adapter, siteConfig ?? undefined)
      : { ok: true, errors: [], warnings: [] };

  if (!adapter && opts.templateId) {
    validation.warnings = validation.warnings ?? [];
    validation.warnings.push(`No unique adapter for templateId "${opts.templateId}"`);
  }

  const summary = adapter ? summarizeSchemaAdapter(adapter) : null;

  /** @type {string[]} */
  const openQuestions = [];
  if (adapter?.status === "draft") {
    openQuestions.push("Supabase tables are not created — draft adapter only.");
    openQuestions.push("Storage upload / DB update executors do not use this adapter yet (G-5f+).");
  }
  if (siteConfig && !siteConfig.schemaAdapterId) {
    openQuestions.push("Consider adding schemaAdapterId to site config for explicit adapter selection.");
  }

  return {
    phase: "G-5e",
    mode: "read-only",
    adaptersPath: adaptersPathRelative,
    siteConfigPath: siteConfigPathRelative,
    siteSlug: siteConfig?.siteSlug ?? null,
    siteType: siteConfig?.siteType ?? null,
    templateId: template?.templateId ?? opts.templateId ?? null,
    templateStatus: template?.status ?? null,
    schemaAdapterId: adapter?.adapterId ?? opts.adapterId ?? siteConfig?.schemaAdapterId ?? null,
    provider: adapter?.provider ?? null,
    adapterStatus: adapter?.status ?? null,
    adapterDescription: adapter?.description ?? null,
    ...summary,
    validationOk: validation.ok,
    validationErrors: validation.errors,
    validationWarnings: validation.warnings,
    candidatesForTemplate:
      opts.templateId && !opts.adapterId
        ? getSchemaAdaptersForTemplate(adaptersRegistry, opts.templateId).map((a) => ({
            adapterId: a.adapterId,
            status: a.status,
          }))
        : null,
    openQuestions,
    uploadPerformed: false,
    dbUpdatePerformed: false,
    ftpDeployPerformed: false,
    configDriven: Boolean(opts.siteConfigPath),
  };
}
