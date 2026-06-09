/**
 * Admin prototype preview harness loader (G-5r).
 * Read-only — loads preview-manifest.json only.
 * No Astro build, runtime, DB, Storage, or deploy.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
export const MANIFEST_REL_PATH =
  "templates/admin-cms/preview/preview-manifest.json";

const SAFETY_BOOLEAN_FIELDS = [
  "runtimeConnected",
  "supabaseAuthConnected",
  "supabaseQueryPerformed",
  "dbUpdatePerformed",
  "storageUploadPerformed",
  "githubDispatchPerformed",
  "ftpDeployPerformed",
  "productionTouched",
];

/**
 * @param {string} [toolRoot]
 */
export function resolveAdminPreviewHarnessManifestPath(toolRoot = DEFAULT_TOOL_ROOT) {
  return path.join(toolRoot, MANIFEST_REL_PATH);
}

/**
 * @param {unknown} data
 */
export function validateAdminPreviewHarnessManifest(data) {
  /** @type {string[]} */
  const errors = [];

  if (!data || typeof data !== "object") {
    return { ok: false, errors: ["Preview manifest must be a JSON object"] };
  }

  const m = /** @type {Record<string, unknown>} */ (data);

  if (typeof m.version !== "string" || !m.version.trim()) {
    errors.push("Missing or invalid field: version");
  }
  if (typeof m.status !== "string" || !m.status.trim()) {
    errors.push("Missing or invalid field: status");
  }
  if (typeof m.mode !== "string" || !m.mode.trim()) {
    errors.push("Missing or invalid field: mode");
  }

  const topBooleans = [
    "connectedToRuntime",
    "productionReady",
    "previewBuildPerformed",
    "deployPerformed",
  ];
  for (const field of topBooleans) {
    if (typeof m[field] !== "boolean") {
      errors.push(`Missing or invalid boolean: ${field}`);
    }
  }

  if (!Array.isArray(m.prototypes) || m.prototypes.length === 0) {
    errors.push("prototypes must be a non-empty array");
    return { ok: false, errors };
  }

  const ids = new Set();
  for (const [index, entry] of m.prototypes.entries()) {
    const prefix = `prototypes[${index}]`;
    if (!entry || typeof entry !== "object") {
      errors.push(`${prefix}: must be an object`);
      continue;
    }
    const p = /** @type {Record<string, unknown>} */ (entry);

    const requiredStrings = [
      "prototypeId",
      "templateId",
      "siteType",
      "label",
      "description",
      "prototypePath",
      "previewStatus",
      "recommendedNextStep",
    ];
    for (const field of requiredStrings) {
      if (typeof p[field] !== "string" || !/** @type {string} */ (p[field]).trim()) {
        errors.push(`${prefix}: missing or invalid ${field}`);
      }
    }

    if (typeof p.customerDemoReady !== "boolean") {
      errors.push(`${prefix}: customerDemoReady must be boolean`);
    }
    if (typeof p.requiresLocalHarness !== "boolean") {
      errors.push(`${prefix}: requiresLocalHarness must be boolean`);
    }

    if (typeof p.prototypeId === "string") {
      if (ids.has(p.prototypeId)) {
        errors.push(`${prefix}: duplicate prototypeId ${p.prototypeId}`);
      }
      ids.add(p.prototypeId);
    }

    if (!p.safety || typeof p.safety !== "object") {
      errors.push(`${prefix}: safety must be an object`);
    } else {
      const s = /** @type {Record<string, unknown>} */ (p.safety);
      for (const field of SAFETY_BOOLEAN_FIELDS) {
        if (typeof s[field] !== "boolean") {
          errors.push(`${prefix}.safety: missing or invalid ${field}`);
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * @param {string} [manifestPath]
 */
export function loadAdminPreviewHarnessManifest(manifestPath) {
  const resolved = manifestPath ?? resolveAdminPreviewHarnessManifestPath();
  if (!fs.existsSync(resolved)) {
    throw new Error(`Preview manifest not found: ${resolved}`);
  }

  const raw = fs.readFileSync(resolved, "utf8");
  const data = JSON.parse(raw);
  const validation = validateAdminPreviewHarnessManifest(data);

  if (!validation.ok) {
    throw new Error(`Invalid preview manifest:\n${validation.errors.join("\n")}`);
  }

  return /** @type {ReturnType<typeof inspectAdminPreviewHarness>["manifest"]} */ (data);
}

/**
 * @param {object} [options]
 * @param {string} [options.manifestPath]
 * @param {string} [options.prototypeId]
 */
export function inspectAdminPreviewHarness(options = {}) {
  const manifestPath =
    options.manifestPath ?? resolveAdminPreviewHarnessManifestPath();
  const manifest = loadAdminPreviewHarnessManifest(manifestPath);

  let prototypes = manifest.prototypes;
  if (options.prototypeId) {
    prototypes = prototypes.filter((p) => p.prototypeId === options.prototypeId);
  }

  const customerDemoReadyCount = prototypes.filter((p) => p.customerDemoReady).length;

  return {
    mode: "read-only-inspection",
    manifestPath,
    manifestVersion: manifest.version,
    manifestStatus: manifest.status,
    harnessMode: manifest.mode,
    connectedToRuntime: manifest.connectedToRuntime,
    productionReady: manifest.productionReady,
    previewBuildPerformed: manifest.previewBuildPerformed,
    deployPerformed: manifest.deployPerformed,
    validationOk: true,
    summary: {
      totalPrototypes: manifest.prototypes.length,
      filteredCount: prototypes.length,
      customerDemoReadyCount,
      scaffoldReadyCount: prototypes.filter((p) => p.previewStatus === "scaffold-ready")
        .length,
    },
    manifest,
    prototypes,
  };
}
