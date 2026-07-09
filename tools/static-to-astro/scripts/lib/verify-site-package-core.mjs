/**
 * G-20u4 — Shared site package verification (registry-driven).
 * No FTP · no DB writes.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyPublicDistCssPresence } from "./deploy-base.mjs";
import { resolvePackageZipName } from "./manual-upload-package.mjs";
import {
  findSitemapSafetyViolations,
  validatePackageManifestSafety,
  validatePublicDistAdminSafety,
  walkRelativeFiles,
} from "./package-upload-safety.mjs";
import {
  GOSAKI_SITE_KEY,
  resolvePackageManifestMetaFromRegistry,
  resolveSitePackageBuildProfile,
} from "./site-registry.mjs";
import {
  verifyGosakiProductionContentExtensions,
  verifyGosakiStagingContentExtensions,
} from "./verify-site-package-gosaki-extensions.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const TOOL_ROOT = path.resolve(__dirname, "../..");
export const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

/**
 * @param {string} siteKey
 * @param {string} profileName
 * @param {{ toolRoot?: string, packageDir?: string }} [options]
 */
export function resolveSitePackageDir(siteKey, profileName, options = {}) {
  const toolRoot = options.toolRoot ?? TOOL_ROOT;
  const meta = resolvePackageManifestMetaFromRegistry(siteKey, profileName, { toolRoot });
  if (options.packageDir) {
    return path.isAbsolute(options.packageDir)
      ? options.packageDir
      : path.resolve(toolRoot, options.packageDir);
  }
  return path.join(toolRoot, meta.manualUploadOut);
}

/**
 * @param {{
 *   siteKey: string,
 *   profileName: string,
 *   packageDir?: string,
 *   toolRoot?: string,
 *   includeGosakiExtensions?: boolean,
 * }} options
 */
export function verifySitePackage(options) {
  const {
    siteKey,
    profileName,
    packageDir: packageDirOpt,
    toolRoot = TOOL_ROOT,
    includeGosakiExtensions = siteKey === GOSAKI_SITE_KEY,
  } = options;

  /** @type {string[]} */
  const errors = [];
  const meta = resolvePackageManifestMetaFromRegistry(siteKey, profileName, { toolRoot });
  const profile = resolveSitePackageBuildProfile(siteKey, profileName, { toolRoot });
  const pkg = resolveSitePackageDir(siteKey, profileName, { toolRoot, packageDir: packageDirOpt });
  const publicDist = path.join(pkg, "public-dist");
  const zipName = resolvePackageZipName(meta.siteSlug, meta.packageProfileName);

  const required = [
    "public-dist/index.html",
    "public-dist/robots.txt",
    "README-UPLOAD.md",
    "CHECKLIST.md",
    "MANIFEST.json",
    zipName,
  ];

  for (const rel of required) {
    if (!fs.existsSync(path.join(pkg, rel))) errors.push(`missing: ${rel}`);
  }

  let manifest = null;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(pkg, "MANIFEST.json"), "utf8"));
  } catch {
    errors.push("MANIFEST.json missing or invalid");
  }

  if (manifest) {
    if (manifest.ftpAutoDeployUsed !== false) errors.push("ftpAutoDeployUsed must be false");
    if (!manifest.safeForStaticFtp) errors.push("safeForStaticFtp must be true");
    if (manifest.cssPresenceOk !== true) errors.push("cssPresenceOk must be true");
    if (!manifest.sourceCommit) errors.push("manifest sourceCommit missing");
    if (!manifest.generatedAt) errors.push("manifest generatedAt missing");
    if (manifest.fileCount < 1) errors.push("fileCount must be > 0");

    if (manifest.targetEnvironment !== meta.targetEnvironment) {
      errors.push(
        `targetEnvironment expected ${meta.targetEnvironment}, got ${manifest.targetEnvironment}`,
      );
    }
    if (manifest.packageProfileName !== meta.packageProfileName) {
      errors.push(
        `packageProfileName expected ${meta.packageProfileName}, got ${manifest.packageProfileName}`,
      );
    }
    if (meta.siteKey && manifest.siteKey && manifest.siteKey !== meta.siteKey) {
      errors.push(`siteKey expected ${meta.siteKey}, got ${manifest.siteKey}`);
    }
    if (manifest.publicBaseUrl !== meta.publicBaseUrl) {
      errors.push(`publicBaseUrl expected ${meta.publicBaseUrl}, got ${manifest.publicBaseUrl}`);
    }
    if (manifest.intendedRemotePath !== meta.intendedRemotePath) {
      errors.push(
        `intendedRemotePath expected ${meta.intendedRemotePath}, got ${manifest.intendedRemotePath}`,
      );
    }
    if (manifest.deployBase !== meta.deployBase) {
      errors.push(`deployBase expected ${meta.deployBase}, got ${manifest.deployBase}`);
    }
    if (manifest.includesAdmin !== meta.includesAdmin) {
      errors.push(`includesAdmin expected ${meta.includesAdmin}, got ${manifest.includesAdmin}`);
    }

    for (const err of validatePackageManifestSafety(manifest, meta.targetEnvironment)) {
      errors.push(`manifest safety: ${err}`);
    }
  }

  if (fs.existsSync(path.join(publicDist, "index.html"))) {
    const css = verifyPublicDistCssPresence(publicDist, meta.deployBase);
    if (!css.ok) errors.push(css.reason ?? "public-dist CSS check failed");
  }

  for (const err of validatePublicDistAdminSafety(publicDist, meta.targetEnvironment)) {
    errors.push(err);
  }

  if (meta.targetEnvironment === "staging" && meta.includesAdmin) {
    if (!fs.existsSync(path.join(publicDist, "admin/index.html"))) {
      errors.push("staging package must include admin/index.html when includesAdmin=true");
    }
  }

  if (meta.targetEnvironment === "production") {
    if (fs.existsSync(path.join(publicDist, "admin"))) {
      errors.push("production public-dist must not contain admin/");
    }
    const files = walkRelativeFiles(publicDist);
    if (files.some((f) => f.startsWith("admin/"))) {
      errors.push("production public-dist contains admin files");
    }
  }

  const sitemapPath = path.join(publicDist, "sitemap-0.xml");
  if (fs.existsSync(sitemapPath)) {
    const sitemap = fs.readFileSync(sitemapPath, "utf8");
    if (meta.targetEnvironment === "staging" && sitemap.includes("/admin/")) {
      errors.push("staging sitemap must not include /admin/");
    }
    if (siteKey === GOSAKI_SITE_KEY && !sitemap.includes("/schedule/2026-08/")) {
      errors.push("sitemap missing canonical /schedule/2026-08/");
    }
    for (const violation of findSitemapSafetyViolations(sitemap)) {
      errors.push(`sitemap safety: ${violation}`);
    }
  } else {
    errors.push("missing sitemap-0.xml");
  }

  if (siteKey === GOSAKI_SITE_KEY) {
    const augustCanonical = path.join(publicDist, "schedule/2026-08/index.html");
    if (!fs.existsSync(augustCanonical)) {
      errors.push("missing canonical month page: public-dist/schedule/2026-08/index.html");
    }
  }

  if (includeGosakiExtensions && siteKey === GOSAKI_SITE_KEY) {
    if (profileName === "staging") {
      errors.push(...verifyGosakiStagingContentExtensions(pkg, meta.deployBase));
    } else if (profileName === "production") {
      errors.push(...verifyGosakiProductionContentExtensions(pkg));
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    manifest,
    meta,
    profile,
    packageDir: pkg,
    publicDist,
    zipName,
  };
}
