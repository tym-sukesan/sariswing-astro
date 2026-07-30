/**
 * Gosaki adapter — site package extension checks for verifySitePackage.
 * Owns About/PACKAGE_RUN bake, schedule month contracts, and content extensions
 * so Core verify-site-package-core stays site-agnostic.
 */

import fs from "node:fs";
import path from "node:path";
import {
  EXPECTED_ABOUT_ADMIN_PATH_BAKE,
  EXPECTED_ABOUT_ADMIN_PATH_BAKE_PUBLIC_BUILD_READ,
  EXPECTED_ABOUT_ADMIN_PATH_BAKE_SAVE_UI_ARMED,
  validateGosakiAboutAdminPathPackageArtifacts,
  validatePackageRunMarker,
} from "./package-run-marker.mjs";
import { GOSAKI_SITE_KEY } from "./site-registry.mjs";
import {
  verifyGosakiProductionContentExtensions,
  verifyGosakiStagingContentExtensions,
} from "./verify-site-package-gosaki-extensions.mjs";

/**
 * @typedef {object} SitePackageExtensionContext
 * @property {string} siteKey
 * @property {string} profileName
 * @property {string} packageDir
 * @property {string} publicDist
 * @property {string} repoRoot
 * @property {{ deployBase?: string, targetEnvironment?: string }} meta
 * @property {boolean} [expectAboutSaveUiArmed]
 * @property {boolean} [expectPublicAboutBuildRead]
 */

/**
 * Gosaki-specific package extension verifier (returns error strings).
 * @param {SitePackageExtensionContext} ctx
 * @returns {string[]}
 */
export function verifyGosakiSitePackageExtensions(ctx) {
  /** @type {string[]} */
  const errors = [];
  const {
    profileName,
    packageDir,
    publicDist,
    repoRoot,
    meta,
    expectAboutSaveUiArmed = false,
    expectPublicAboutBuildRead = false,
  } = ctx;

  if (expectAboutSaveUiArmed && expectPublicAboutBuildRead) {
    errors.push(
      "cannot combine --expect-about-save-ui-armed and --expect-public-about-build-read (single-arm)",
    );
  }

  if (profileName === "staging") {
    const expectedBake = expectPublicAboutBuildRead
      ? EXPECTED_ABOUT_ADMIN_PATH_BAKE_PUBLIC_BUILD_READ
      : expectAboutSaveUiArmed
        ? EXPECTED_ABOUT_ADMIN_PATH_BAKE_SAVE_UI_ARMED
        : EXPECTED_ABOUT_ADMIN_PATH_BAKE;
    errors.push(
      ...validatePackageRunMarker({
        packageDir,
        repoRoot,
        siteKey: ctx.siteKey,
        profile: profileName,
        expectedBake,
      }),
    );
    errors.push(
      ...validateGosakiAboutAdminPathPackageArtifacts({
        packageDir,
        expectedBake,
      }),
    );
  }

  const sitemapPath = path.join(publicDist, "sitemap-0.xml");
  if (fs.existsSync(sitemapPath)) {
    const sitemap = fs.readFileSync(sitemapPath, "utf8");
    if (!sitemap.includes("/schedule/2026-08/")) {
      errors.push("sitemap missing canonical /schedule/2026-08/");
    }
  }

  const augustCanonical = path.join(publicDist, "schedule/2026-08/index.html");
  if (!fs.existsSync(augustCanonical)) {
    errors.push("missing canonical month page: public-dist/schedule/2026-08/index.html");
  }

  if (profileName === "staging") {
    errors.push(...verifyGosakiStagingContentExtensions(packageDir, meta.deployBase ?? ""));
  } else if (profileName === "production") {
    errors.push(...verifyGosakiProductionContentExtensions(packageDir));
  }

  return errors;
}

/**
 * Factory for Core `siteExtensionVerifier` injection.
 * @returns {(ctx: SitePackageExtensionContext) => string[]}
 */
export function createGosakiSitePackageExtensionVerifier() {
  return verifyGosakiSitePackageExtensions;
}

/**
 * @param {string} siteKey
 * @returns {((ctx: SitePackageExtensionContext) => string[]) | null}
 */
export function resolveSitePackageExtensionVerifierForSite(siteKey) {
  if (siteKey === GOSAKI_SITE_KEY) {
    return createGosakiSitePackageExtensionVerifier();
  }
  return null;
}
