/**
 * G-20u17 — Post-build verifier resolution from site registry.
 * Registry field: packageProfiles.{profile}.postBuildVerifier
 * Legacy fallback map retained for profiles without registry entry.
 */

import fs from "node:fs";
import path from "node:path";
import { getSiteRegistryEntry, TOOL_ROOT } from "./site-registry.mjs";

/** @typedef {"site-package" | "package-dir-only" | "none"} PostBuildVerifierArgsMode */

/**
 * @typedef {object} PostBuildVerifierConfig
 * @property {string} script
 * @property {PostBuildVerifierArgsMode} argsMode
 * @property {"registry" | "legacy-fallback"} resolution
 */

/** @type {Record<string, Record<string, Omit<PostBuildVerifierConfig, "resolution">>>} */
export const LEGACY_POST_BUILD_VERIFIER_FALLBACK = {
  "gosaki-piano": {
    staging: {
      script: "scripts/verify-manual-upload-package.mjs",
      argsMode: "package-dir-only",
    },
    production: {
      script: "scripts/verify-g20i3-gosaki-production-package-admin-exclusion.mjs",
      argsMode: "none",
    },
  },
  "pilot-sample-static": {
    staging: {
      script: "scripts/verify-site-package.mjs",
      argsMode: "site-package",
    },
  },
};

const ALLOWED_ARGS_MODES = /** @type {const} */ (["site-package", "package-dir-only", "none"]);

/**
 * @param {unknown} raw
 * @param {string} siteKey
 * @param {string} profileName
 * @returns {Omit<PostBuildVerifierConfig, "resolution">}
 */
function normalizePostBuildVerifierRaw(raw, siteKey, profileName) {
  if (!raw || typeof raw !== "object") {
    throw new Error(
      `postBuildVerifier for site="${siteKey}" profile="${profileName}" must be an object with script + argsMode`,
    );
  }
  const obj = /** @type {Record<string, unknown>} */ (raw);
  const script = String(obj.script ?? "").replace(/\\/g, "/");
  if (!script.startsWith("scripts/") || !script.endsWith(".mjs")) {
    throw new Error(
      `postBuildVerifier.script for site="${siteKey}" profile="${profileName}" must be a scripts/*.mjs path`,
    );
  }
  const argsMode = String(obj.argsMode ?? "");
  if (!ALLOWED_ARGS_MODES.includes(/** @type {PostBuildVerifierArgsMode} */ (argsMode))) {
    throw new Error(
      `postBuildVerifier.argsMode for site="${siteKey}" profile="${profileName}" must be one of: ${ALLOWED_ARGS_MODES.join(", ")}`,
    );
  }
  return { script, argsMode: /** @type {PostBuildVerifierArgsMode} */ (argsMode) };
}

/**
 * @param {string} siteKey
 * @param {string} profileName
 * @param {string} [toolRoot]
 * @returns {PostBuildVerifierConfig}
 */
export function resolvePostBuildVerifierConfig(siteKey, profileName, toolRoot = TOOL_ROOT) {
  const entry = getSiteRegistryEntry(siteKey, toolRoot);
  const overlay = entry.packageProfiles?.[profileName];
  if (!overlay) {
    throw new Error(`Site "${siteKey}" missing packageProfiles.${profileName} in registry`);
  }

  if (overlay.postBuildVerifier) {
    const normalized = normalizePostBuildVerifierRaw(overlay.postBuildVerifier, siteKey, profileName);
    const abs = path.join(toolRoot, normalized.script);
    if (!fs.existsSync(abs)) {
      throw new Error(`postBuildVerifier script not found: ${normalized.script}`);
    }
    return { ...normalized, resolution: "registry" };
  }

  const fallback = LEGACY_POST_BUILD_VERIFIER_FALLBACK[siteKey]?.[profileName];
  if (fallback) {
    return { ...fallback, resolution: "legacy-fallback" };
  }

  throw new Error(
    `No postBuildVerifier configured for site="${siteKey}" profile="${profileName}" (registry or legacy fallback)`,
  );
}

/**
 * @param {string} siteKey
 * @param {string} profileName
 * @param {string} [toolRoot]
 */
export function resolvePostBuildVerifier(siteKey, profileName, toolRoot = TOOL_ROOT) {
  return resolvePostBuildVerifierConfig(siteKey, profileName, toolRoot).script;
}

/**
 * @param {string} siteKey
 * @param {string} profileName
 * @param {{ manualUploadOut: string }} profile
 * @param {string} [toolRoot]
 * @returns {string[]}
 */
export function buildPostBuildVerifierArgs(siteKey, profileName, profile, toolRoot = TOOL_ROOT) {
  const config = resolvePostBuildVerifierConfig(siteKey, profileName, toolRoot);
  const args = [config.script];

  if (config.argsMode === "site-package") {
    args.push("--site", siteKey, "--profile", profileName, "--package-dir", profile.manualUploadOut);
  } else if (config.argsMode === "package-dir-only") {
    args.push("--package-dir", profile.manualUploadOut);
  }

  return args;
}
