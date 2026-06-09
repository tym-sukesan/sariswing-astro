/**
 * Admin UI components registry loader (G-5k).
 * Read-only metadata — maps G-5j inventory to CMS Kit extraction candidates.
 * Does NOT extract, move, or modify Sariswing admin code.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
export const REGISTRY_REL_PATH = "config/admin/admin-ui-components-registry.json";

const VALID_CATEGORIES = new Set([
  "layout",
  "navigation",
  "feedback",
  "form",
  "table",
  "crud",
  "media",
  "auth",
  "publish",
  "module",
  "utility",
]);

const VALID_LEVELS = new Set(["low", "medium", "high"]);

/**
 * @param {string} [toolRoot]
 */
export function resolveAdminUiComponentsRegistryPath(toolRoot = DEFAULT_TOOL_ROOT) {
  return path.join(toolRoot, REGISTRY_REL_PATH);
}

/**
 * @param {unknown} data
 */
export function validateAdminUiComponentsRegistry(data) {
  /** @type {string[]} */
  const errors = [];

  if (!data || typeof data !== "object") {
    return { ok: false, errors: ["Admin UI components registry must be a JSON object"] };
  }

  const r = /** @type {Record<string, unknown>} */ (data);
  if (typeof r.version !== "string" || !r.version.trim()) {
    errors.push("Missing or invalid field: version");
  }
  if (!Array.isArray(r.components) || r.components.length === 0) {
    errors.push("components must be a non-empty array");
    return { ok: false, errors };
  }

  const ids = new Set();
  for (const [index, entry] of r.components.entries()) {
    const prefix = `components[${index}]`;
    if (!entry || typeof entry !== "object") {
      errors.push(`${prefix}: must be an object`);
      continue;
    }
    const c = /** @type {Record<string, unknown>} */ (entry);

    const requiredStrings = [
      "componentId",
      "name",
      "category",
      "status",
      "reusablePotential",
      "extractionDifficulty",
      "risk",
      "suggestedPhase",
      "notes",
    ];
    for (const field of requiredStrings) {
      if (typeof c[field] !== "string" || !/** @type {string} */ (c[field]).trim()) {
        errors.push(`${prefix}: ${field} is required`);
      }
    }

    if (typeof c.componentId === "string") {
      if (ids.has(c.componentId)) {
        errors.push(`${prefix}: duplicate componentId "${c.componentId}"`);
      }
      ids.add(c.componentId);
    }

    if (typeof c.category === "string" && !VALID_CATEGORIES.has(c.category)) {
      errors.push(`${prefix}: invalid category "${c.category}"`);
    }

    for (const levelField of ["reusablePotential", "extractionDifficulty", "risk"]) {
      if (typeof c[levelField] === "string" && !VALID_LEVELS.has(c[levelField])) {
        errors.push(`${prefix}: invalid ${levelField} "${c[levelField]}"`);
      }
    }

    if (!Array.isArray(c.targetSiteTypes)) {
      errors.push(`${prefix}: targetSiteTypes must be an array`);
    }
    if (!Array.isArray(c.sourceHints)) {
      errors.push(`${prefix}: sourceHints must be an array`);
    }
    if (!Array.isArray(c.responsibilities)) {
      errors.push(`${prefix}: responsibilities must be an array`);
    }
    if (!Array.isArray(c.dependencies)) {
      errors.push(`${prefix}: dependencies must be an array`);
    }
    if (!Array.isArray(c.siteSpecificConcerns)) {
      errors.push(`${prefix}: siteSpecificConcerns must be an array`);
    }
    if (typeof c.doNotExtractYet !== "boolean") {
      errors.push(`${prefix}: doNotExtractYet must be a boolean`);
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * @param {string} [registryPath]
 */
export function loadAdminUiComponentsRegistry(registryPath) {
  const resolved = registryPath ?? resolveAdminUiComponentsRegistryPath();
  if (!fs.existsSync(resolved)) {
    throw new Error(`Admin UI components registry not found: ${resolved}`);
  }

  const raw = fs.readFileSync(resolved, "utf8");
  const data = JSON.parse(raw);
  const validation = validateAdminUiComponentsRegistry(data);
  if (!validation.ok) {
    throw new Error(`Invalid admin UI components registry:\n${validation.errors.join("\n")}`);
  }

  return { registryPath: resolved, registry: data };
}

/**
 * @param {object} opts
 * @param {string} [opts.registryPath]
 * @param {string} [opts.category]
 * @param {string} [opts.risk]
 * @param {string} [opts.suggestedPhase]
 * @param {boolean} [opts.extractableOnly]
 */
export function inspectAdminUiComponents(opts = {}) {
  const { registryPath: resolved, registry } = loadAdminUiComponentsRegistry(opts.registryPath);

  let components = [...registry.components];

  if (opts.category) {
    const cat = opts.category.toLowerCase();
    components = components.filter((c) => c.category === cat);
  }
  if (opts.risk) {
    const risk = opts.risk.toLowerCase();
    components = components.filter((c) => c.risk === risk);
  }
  if (opts.suggestedPhase) {
    components = components.filter((c) => c.suggestedPhase === opts.suggestedPhase);
  }
  if (opts.extractableOnly) {
    components = components.filter((c) => !c.doNotExtractYet);
  }

  const all = registry.components;
  const summary = {
    totalComponents: all.length,
    filteredCount: components.length,
    byCategory: /** @type {Record<string, number>} */ ({}),
    byRisk: /** @type {Record<string, number>} */ ({}),
    byPhase: /** @type {Record<string, number>} */ ({}),
    extractableNow: all.filter((c) => !c.doNotExtractYet).length,
    deferred: all.filter((c) => c.doNotExtractYet).length,
    lowRisk: all.filter((c) => c.risk === "low").length,
    mediumRisk: all.filter((c) => c.risk === "medium").length,
    highRisk: all.filter((c) => c.risk === "high").length,
  };

  for (const c of all) {
    summary.byCategory[c.category] = (summary.byCategory[c.category] ?? 0) + 1;
    summary.byRisk[c.risk] = (summary.byRisk[c.risk] ?? 0) + 1;
    summary.byPhase[c.suggestedPhase] = (summary.byPhase[c.suggestedPhase] ?? 0) + 1;
  }

  return {
    mode: "read-only-inspection",
    phase: "G-5k",
    registryPath: resolved,
    registryVersion: registry.version,
    registryStatus: registry.status,
    source: registry.source,
    filters: {
      category: opts.category ?? null,
      risk: opts.risk ?? null,
      suggestedPhase: opts.suggestedPhase ?? null,
      extractableOnly: opts.extractableOnly ?? false,
    },
    summary,
    components,
    safety: {
      codeModified: false,
      dbUpdatePerformed: false,
      storageUploadPerformed: false,
      ftpDeployPerformed: false,
      githubDispatchPerformed: false,
      productionTouched: false,
    },
    validationOk: true,
    validationErrors: [],
  };
}
