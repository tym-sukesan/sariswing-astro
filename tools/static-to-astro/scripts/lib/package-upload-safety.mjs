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
 * @param {string | null | undefined} ref
 */
export function normalizeGitCommit(ref) {
  return String(ref ?? "").trim().toLowerCase();
}

/**
 * Compare manifest sourceCommit with current git HEAD (full or short).
 * @param {string | null | undefined} manifestCommit
 * @param {string | null | undefined} headCommit
 */
export function commitsMatch(manifestCommit, headCommit) {
  const manifest = normalizeGitCommit(manifestCommit);
  const head = normalizeGitCommit(headCommit);
  if (!manifest || !head) return false;
  return manifest === head || manifest.startsWith(head) || head.startsWith(manifest);
}

/**
 * G-20t6 — Package freshness gate for manual-upload preflight.
 * @param {object | null | undefined} manifest
 * @param {string | null | undefined} currentHead
 */
export function validatePackageFreshness(manifest, currentHead) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const stopReasons = [];
  const generatedAt = manifest?.generatedAt ?? null;
  const manifestCommit = manifest?.sourceCommit ?? null;

  if (!manifest || typeof manifest !== "object") {
    errors.push("manifest missing or not an object");
    stopReasons.push("MANIFEST.json missing or invalid — STOP upload");
    return {
      fresh: false,
      ok: false,
      errors,
      stopReasons,
      manifestCommit,
      currentHead: currentHead ?? null,
      generatedAt,
    };
  }

  if (!manifestCommit) {
    errors.push("sourceCommit missing in MANIFEST.json");
    stopReasons.push("sourceCommit missing — STOP upload; regen package");
    return {
      fresh: false,
      ok: false,
      errors,
      stopReasons,
      manifestCommit,
      currentHead: currentHead ?? null,
      generatedAt,
    };
  }

  if (!currentHead) {
    errors.push("current git HEAD could not be resolved");
    stopReasons.push("git HEAD unavailable — STOP upload until HEAD is known");
    return {
      fresh: false,
      ok: false,
      errors,
      stopReasons,
      manifestCommit,
      currentHead: null,
      generatedAt,
    };
  }

  const fresh = commitsMatch(manifestCommit, currentHead);
  if (!fresh) {
    errors.push(
      `sourceCommit mismatch: MANIFEST=${manifestCommit} current HEAD=${currentHead}`,
    );
    stopReasons.push(
      "sourceCommit !== current HEAD — STOP upload; run package regen at current HEAD first",
    );
  }

  return {
    fresh,
    ok: fresh,
    errors,
    stopReasons,
    manifestCommit,
    currentHead,
    generatedAt,
  };
}

/**
 * @param {{
 *   fresh: boolean,
 *   manifestCommit: string | null,
 *   currentHead: string | null,
 *   generatedAt: string | null,
 *   packageProfileName?: string,
 *   targetEnvironment?: string,
 *   stopReasons?: string[],
 * }} result
 */
export function formatPackageFreshnessReport(result) {
  const lines = [
    "=== Package freshness gate (G-20t6) ===",
    `fresh: ${result.fresh ? "PASS" : "STOP"}`,
    `targetEnvironment: ${result.targetEnvironment ?? "unknown"}`,
    `packageProfileName: ${result.packageProfileName ?? "unknown"}`,
    `generatedAt: ${result.generatedAt ?? "(missing)"}`,
    `manifest sourceCommit: ${result.manifestCommit ?? "(missing)"}`,
    `current git HEAD: ${result.currentHead ?? "(unknown)"}`,
  ];
  if (!result.fresh && result.stopReasons?.length) {
    lines.push("stopReasons:");
    for (const reason of result.stopReasons) lines.push(`  - ${reason}`);
  }
  return lines.join("\n");
}

/**
 * @param {string} packageDir
 * @param {string} repoRoot
 * @param {{ currentHead?: string | null }} [opts]
 */
export function verifyPackageUploadFreshness(packageDir, repoRoot, opts = {}) {
  const manifestState = readPackageManifest(packageDir);
  if (!manifestState.ok) {
    return {
      fresh: false,
      ok: false,
      errors: [manifestState.error ?? "MANIFEST.json unreadable"],
      stopReasons: ["MANIFEST.json missing or invalid — STOP upload"],
      manifestCommit: null,
      currentHead: opts.currentHead ?? resolveSourceCommit(repoRoot),
      generatedAt: null,
      manifest: null,
      packageDir,
    };
  }

  const currentHead = opts.currentHead ?? resolveSourceCommit(repoRoot);
  const result = validatePackageFreshness(manifestState.manifest, currentHead);
  return {
    ...result,
    manifest: manifestState.manifest,
    packageDir,
    targetEnvironment: manifestState.manifest?.targetEnvironment,
    packageProfileName: manifestState.manifest?.packageProfileName,
  };
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
