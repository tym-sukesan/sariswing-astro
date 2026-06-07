/**
 * Site profile loader (Phase 3-W).
 * Loads JSON profiles from config/site-profiles/ — no secrets.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
export const SITE_PROFILES_REL = "config/site-profiles";
export const DEFAULT_PROFILE_WITH_ADMIN_CMS = "musician";

/**
 * @param {string} [toolRoot]
 */
export function resolveSiteProfilesDir(toolRoot = DEFAULT_TOOL_ROOT) {
  return path.join(toolRoot, SITE_PROFILES_REL);
}

/**
 * @param {string} [toolRoot]
 */
export function listSiteProfiles(toolRoot = DEFAULT_TOOL_ROOT) {
  const dir = resolveSiteProfilesDir(toolRoot);
  if (!fs.existsSync(dir)) {
    throw new Error(`Site profiles directory not found: ${dir}`);
  }

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name.replace(/\.json$/, ""))
    .sort();
}

/**
 * @param {unknown} profile
 * @returns {{ ok: true, profile: object } | { ok: false, errors: string[] }}
 */
export function validateSiteProfile(profile) {
  /** @type {string[]} */
  const errors = [];

  if (!profile || typeof profile !== "object") {
    return { ok: false, errors: ["Profile must be a JSON object"] };
  }

  const p = /** @type {Record<string, unknown>} */ (profile);

  if (typeof p.id !== "string" || !p.id.trim()) {
    errors.push("Missing or invalid field: id (string)");
  }
  if (typeof p.label !== "string" || !p.label.trim()) {
    errors.push("Missing or invalid field: label (string)");
  }
  if (!p.modules || typeof p.modules !== "object") {
    errors.push("Missing or invalid field: modules (object)");
  }
  if (!p.admin || typeof p.admin !== "object") {
    errors.push("Missing or invalid field: admin (object)");
  } else {
    const admin = /** @type {Record<string, unknown>} */ (p.admin);
    if (typeof admin.enabled !== "boolean") {
      errors.push("admin.enabled must be boolean");
    }
    if (!Array.isArray(admin.pages) || admin.pages.length === 0) {
      errors.push("admin.pages must be a non-empty array");
    }
  }
  if (!p.homeFeatured || typeof p.homeFeatured !== "object") {
    errors.push("Missing or invalid field: homeFeatured (object)");
  } else {
    const hf = /** @type {Record<string, unknown>} */ (p.homeFeatured);
    if (typeof hf.module !== "string" || !hf.module.trim()) {
      errors.push("homeFeatured.module must be a non-empty string");
    }
    if (typeof hf.field !== "string" || !hf.field.trim()) {
      errors.push("homeFeatured.field must be a non-empty string");
    }
    if (typeof hf.limit !== "number" || hf.limit < 1) {
      errors.push("homeFeatured.limit must be a number >= 1");
    }
  }
  if (!p.storage || typeof p.storage !== "object") {
    errors.push("Missing or invalid field: storage (object)");
  } else {
    const storage = /** @type {Record<string, unknown>} */ (p.storage);
    if (!Array.isArray(storage.fields)) {
      errors.push("storage.fields must be an array");
    }
  }
  if (!p.deploy || typeof p.deploy !== "object") {
    errors.push("Missing or invalid field: deploy (object)");
  }

  if (errors.length) {
    return { ok: false, errors };
  }

  return { ok: true, profile: p };
}

/**
 * @param {string} profileId
 * @param {string} [toolRoot]
 */
export function loadSiteProfile(profileId, toolRoot = DEFAULT_TOOL_ROOT) {
  const id = profileId?.trim();
  if (!id) {
    throw new Error("Site profile ID is required (e.g. musician, dance-school, generic)");
  }

  const filePath = path.join(resolveSiteProfilesDir(toolRoot), `${id}.json`);
  if (!fs.existsSync(filePath)) {
    const available = listSiteProfiles(toolRoot);
    throw new Error(
      `Site profile not found: "${id}". Available profiles: ${available.join(", ") || "(none)"}`,
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    throw new Error(`Failed to parse site profile JSON (${id}): ${err.message}`);
  }

  const validation = validateSiteProfile(parsed);
  if (!validation.ok) {
    throw new Error(`Invalid site profile "${id}":\n- ${validation.errors.join("\n- ")}`);
  }

  if (validation.profile.id !== id) {
    throw new Error(
      `Site profile filename/id mismatch: file "${id}.json" has id "${validation.profile.id}"`,
    );
  }

  return validation.profile;
}

/**
 * @param {{ siteProfileId?: string | null, withAdminCms?: boolean, toolRoot?: string }} opts
 */
export function resolveSiteProfile(opts = {}) {
  const { siteProfileId, withAdminCms = false, toolRoot = DEFAULT_TOOL_ROOT } = opts;

  if (siteProfileId?.trim()) {
    return {
      profile: loadSiteProfile(siteProfileId.trim(), toolRoot),
      profileId: siteProfileId.trim(),
      source: "cli",
    };
  }

  if (withAdminCms) {
    return {
      profile: loadSiteProfile(DEFAULT_PROFILE_WITH_ADMIN_CMS, toolRoot),
      profileId: DEFAULT_PROFILE_WITH_ADMIN_CMS,
      source: "default-with-admin-cms",
    };
  }

  return { profile: null, profileId: null, source: "none" };
}

/**
 * @param {object | null} profile
 */
export function getEnabledModules(profile) {
  if (!profile?.modules) return [];
  return Object.entries(profile.modules)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([name]) => name)
    .sort();
}

/**
 * @param {object | null} profile
 */
export function buildSiteProfileSummary(profile, meta = {}) {
  if (!profile) {
    return {
      active: false,
      profileId: null,
      label: null,
      source: meta.source ?? "none",
      enabledModules: [],
      adminPages: [],
      homeFeatured: null,
      storageFields: [],
      deployHints: null,
    };
  }

  return {
    active: true,
    profileId: profile.id,
    label: profile.label,
    source: meta.source ?? "cli",
    enabledModules: getEnabledModules(profile),
    adminPages: profile.admin?.pages ?? [],
    homeFeatured: profile.homeFeatured ?? null,
    storageFields: profile.storage?.fields ?? [],
    deployHints: profile.deploy ?? null,
  };
}

/**
 * @param {object | null} summary
 */
export function formatSiteProfileSection(summary) {
  if (!summary?.active) {
    return [
      "## Site profile",
      "",
      "- **Profile:** (not specified)",
      "- Admin CMS 未使用時は profile を適用しません。`--with-admin-cms` 使用時のデフォルトは `musician` です。",
      "",
    ].join("\n");
  }

  const lines = [
    "## Site profile",
    "",
    `Profile: ${summary.profileId}`,
    `Label: ${summary.label}`,
    summary.source === "default-with-admin-cms"
      ? "Source: default (`--with-admin-cms` without `--site-profile`)"
      : `Source: ${summary.source}`,
    "",
    "Enabled modules:",
  ];

  for (const mod of summary.enabledModules) {
    lines.push(`- ${mod}`);
  }

  lines.push("", "Admin pages:");
  for (const page of summary.adminPages) {
    lines.push(`- ${page}`);
  }

  const hf = summary.homeFeatured;
  lines.push(
    "",
    "Home featured:",
    `- module: ${hf?.module ?? "—"}`,
    `- field: ${hf?.field ?? "—"}`,
    `- limit: ${hf?.limit ?? "—"}`,
    "",
    "Storage fields:",
  );

  for (const field of summary.storageFields) {
    lines.push(`- ${field}`);
  }

  if (summary.deployHints) {
    lines.push(
      "",
      "Deploy hints:",
      `- staticPublicArtifact: ${summary.deployHints.staticPublicArtifact ? "yes" : "no"}`,
      `- adminSeparateHostRecommended: ${summary.deployHints.adminSeparateHostRecommended ? "yes" : "no"}`,
    );
  }

  lines.push("");
  return lines.join("\n");
}
