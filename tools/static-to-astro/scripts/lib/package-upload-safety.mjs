/**
 * G-20t3 — Shared helpers for manual-upload package safety checks.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { isCmsKitSitemapExcludedPath } from "./sitemap-exclusions.mjs";
import { isLegacyWixScheduleMonthPath } from "./schedule-pages.mjs";

/** @type {readonly string[]} */
export const REQUIRED_MANIFEST_FIELDS = [
  "phase",
  "siteSlug",
  "packageProfileName",
  "targetEnvironment",
  "deployBase",
  "publicBaseUrl",
  "intendedRemotePath",
  "source",
  "sourceCommit",
  "fileCount",
  "generatedAt",
  "ftpAutoDeployUsed",
  "safeForStaticFtp",
  "includesAdmin",
  "uploadTarget",
  "uploadContents",
];

/** Remote paths that must block upload */
export const UNSAFE_REMOTE_PATH_VALUES = new Set(["", "/", "./", "."]);

/**
 * @param {string | null | undefined} remotePath
 */
export function isUnsafeIntendedRemotePath(remotePath) {
  if (remotePath == null) return true;
  const trimmed = String(remotePath).trim();
  if (UNSAFE_REMOTE_PATH_VALUES.has(trimmed)) return true;
  if (/^TBD/i.test(trimmed)) return true;
  return false;
}

/**
 * @param {string} repoRoot
 */
export function resolveSourceCommit(repoRoot) {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) return null;
  return result.stdout.trim() || null;
}

/**
 * @param {string} dir
 * @param {string} [base]
 */
export function walkRelativeFiles(dir, base = dir) {
  /** @type {string[]} */
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkRelativeFiles(abs, base));
    else out.push(path.relative(base, abs).replace(/\\/g, "/"));
  }
  return out;
}

/**
 * @param {string} sitemapXml
 */
export function sanitizeSitemapXml(sitemapXml) {
  return sitemapXml.replace(/<url>\s*<loc>([^<]+)<\/loc>\s*<\/url>/g, (full, loc) => {
    try {
      const pathname = new URL(loc).pathname;
      if (isLegacyWixScheduleMonthPath(pathname) || isCmsKitSitemapExcludedPath(pathname)) {
        return "";
      }
    } catch {
      return full;
    }
    return full;
  });
}

/**
 * Remove admin / API / preview / legacy month URLs from production sitemap files.
 * @param {string} publicDistDir
 */
export function sanitizeProductionPublicDistSitemaps(publicDistDir) {
  for (const name of ["sitemap-0.xml", "sitemap-index.xml"]) {
    const filePath = path.join(publicDistDir, name);
    if (!fs.existsSync(filePath)) continue;
    const raw = fs.readFileSync(filePath, "utf8");
    const sanitized = sanitizeSitemapXml(raw);
    if (sanitized !== raw) {
      fs.writeFileSync(filePath, sanitized, "utf8");
    }
  }
}

/**
 * @param {string} sitemapXml
 * @returns {string[]}
 */
export function findSitemapSafetyViolations(sitemapXml) {
  /** @type {string[]} */
  const violations = [];
  const locRe = /<loc>([^<]+)<\/loc>/g;
  let match;
  while ((match = locRe.exec(sitemapXml)) !== null) {
    let pathname;
    try {
      pathname = new URL(match[1]).pathname;
    } catch {
      violations.push(`invalid sitemap loc: ${match[1]}`);
      continue;
    }
    if (isLegacyWixScheduleMonthPath(pathname)) {
      violations.push(`legacy month root in sitemap: ${pathname}`);
    }
    if (isCmsKitSitemapExcludedPath(pathname)) {
      violations.push(`excluded CMS route in sitemap: ${pathname}`);
    }
  }
  return violations;
}

/**
 * @param {string} packageDir
 */
export function readPackageManifest(packageDir) {
  const manifestPath = path.join(packageDir, "MANIFEST.json");
  if (!fs.existsSync(manifestPath)) {
    return { ok: false, manifest: null, error: "MANIFEST.json missing" };
  }
  try {
    return { ok: true, manifest: JSON.parse(fs.readFileSync(manifestPath, "utf8")), error: null };
  } catch (err) {
    return { ok: false, manifest: null, error: `MANIFEST.json invalid: ${err.message}` };
  }
}

/**
 * @param {object} manifest
 * @param {"staging"|"production"} expectedEnvironment
 * @returns {string[]}
 */
export function validatePackageManifestSafety(manifest, expectedEnvironment) {
  /** @type {string[]} */
  const errors = [];
  if (!manifest || typeof manifest !== "object") {
    errors.push("manifest missing or not an object");
    return errors;
  }

  for (const field of REQUIRED_MANIFEST_FIELDS) {
    if (!(field in manifest)) errors.push(`manifest missing field: ${field}`);
  }

  if (manifest.targetEnvironment !== expectedEnvironment) {
    errors.push(`targetEnvironment must be ${expectedEnvironment}, got ${manifest.targetEnvironment}`);
  }
  if (manifest.ftpAutoDeployUsed !== false) errors.push("ftpAutoDeployUsed must be false");
  if (!manifest.safeForStaticFtp) errors.push("safeForStaticFtp must be true");
  if (!manifest.generatedAt) errors.push("generatedAt missing");
  if (!manifest.sourceCommit) errors.push("sourceCommit missing");

  if (expectedEnvironment === "production") {
    if (manifest.includesAdmin !== false) errors.push("production includesAdmin must be false");
    const intended = String(manifest.intendedRemotePath ?? "");
    const deployBase = String(manifest.deployBase ?? "");
    if (intended !== deployBase && !/^TBD/i.test(intended)) {
      errors.push("production intendedRemotePath should match deployBase or remain TBD until cutover");
    }
    if (manifest.packageProfileName !== "production") {
      errors.push("production packageProfileName must be production");
    }
  }

  if (expectedEnvironment === "staging") {
    if (manifest.packageProfileName !== "staging") {
      errors.push("staging packageProfileName must be staging");
    }
    if (!String(manifest.intendedRemotePath ?? "").includes("/cms-kit-staging/")) {
      errors.push("staging intendedRemotePath must be under /cms-kit-staging/");
    }
  }

  return errors;
}

/**
 * @param {string} publicDistDir
 * @param {"staging"|"production"} expectedEnvironment
 * @returns {string[]}
 */
export function validatePublicDistAdminSafety(publicDistDir, expectedEnvironment) {
  /** @type {string[]} */
  const errors = [];
  const files = walkRelativeFiles(publicDistDir);

  if (expectedEnvironment === "production") {
    if (fs.existsSync(path.join(publicDistDir, "admin"))) errors.push("production public-dist must not contain admin/");
    if (files.some((f) => f.startsWith("admin/"))) errors.push("production public-dist contains admin files");
    if (files.some((f) => f.includes("__admin-staging-shell"))) {
      errors.push("production public-dist contains __admin-staging-shell");
    }
  }

  return errors;
}
