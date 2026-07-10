/**
 * G-20u21 — Generic read-only admin flag resolution from registry / deploy profiles.
 * Primary: includeReadOnlyAdmin · Manifest: includesAdmin
 * Legacy alias: includeGosakiReadOnlyAdmin
 */

import { GOSAKI_SITE_KEY } from "./site-registry.mjs";

/**
 * @typedef {object} PackageAdminFlags
 * @property {boolean} includeReadOnlyAdmin
 * @property {boolean} includesAdmin
 */

/**
 * @param {unknown} value
 */
function isExplicitTrue(value) {
  return value === true;
}

/**
 * @param {unknown} value
 */
function isExplicitFalse(value) {
  return value === false;
}

/**
 * Resolve read-only admin inclusion for a site package profile.
 *
 * Priority:
 * 1. production → always false
 * 2. packageProfiles.includeReadOnlyAdmin (generic)
 * 3. packageProfiles.includeGosakiReadOnlyAdmin (legacy)
 * 4. packageProfiles.includesAdmin (manifest-oriented)
 * 5. deploy profile includeReadOnlyAdmin / includeGosakiReadOnlyAdmin
 * 6. Gosaki non-production default true (backward compat)
 *
 * @param {string} siteKey
 * @param {string} profileName
 * @param {{ packageOverlay?: Record<string, unknown>, deployProfile?: Record<string, unknown> }} [sources]
 * @returns {PackageAdminFlags}
 */
export function resolvePackageAdminFlags(siteKey, profileName, sources = {}) {
  if (profileName === "production") {
    return { includeReadOnlyAdmin: false, includesAdmin: false };
  }

  const overlay = sources.packageOverlay ?? {};
  const deploy = sources.deployProfile ?? {};

  const overlayFlag =
    overlay.includeReadOnlyAdmin !== undefined
      ? overlay.includeReadOnlyAdmin
      : overlay.includeGosakiReadOnlyAdmin;

  if (isExplicitTrue(overlayFlag) || isExplicitTrue(overlay.includesAdmin)) {
    return { includeReadOnlyAdmin: true, includesAdmin: true };
  }
  if (isExplicitFalse(overlayFlag) || isExplicitFalse(overlay.includesAdmin)) {
    return { includeReadOnlyAdmin: false, includesAdmin: false };
  }

  const deployFlag =
    deploy.includeReadOnlyAdmin !== undefined
      ? deploy.includeReadOnlyAdmin
      : deploy.includeGosakiReadOnlyAdmin;

  if (isExplicitFalse(deployFlag)) {
    return { includeReadOnlyAdmin: false, includesAdmin: false };
  }
  if (isExplicitTrue(deployFlag)) {
    return { includeReadOnlyAdmin: true, includesAdmin: true };
  }

  if (siteKey === GOSAKI_SITE_KEY) {
    return { includeReadOnlyAdmin: true, includesAdmin: true };
  }

  return { includeReadOnlyAdmin: false, includesAdmin: false };
}

/**
 * Normalize CLI / verifier options for static-public copy admin inclusion.
 *
 * @param {{ includeReadOnlyAdmin?: boolean, includeGosakiReadOnlyAdmin?: boolean }} [options]
 */
export function resolveIncludeReadOnlyAdminOption(options = {}) {
  if (options.includeReadOnlyAdmin !== undefined) {
    return options.includeReadOnlyAdmin === true;
  }
  if (options.includeGosakiReadOnlyAdmin !== undefined) {
    return options.includeGosakiReadOnlyAdmin === true;
  }
  return false;
}

/**
 * @param {{ includeReadOnlyAdmin?: boolean, includeGosakiReadOnlyAdmin?: boolean }} opts
 */
export function withLegacyAdminFlagAliases(opts = {}) {
  const includeReadOnlyAdmin = resolveIncludeReadOnlyAdminOption(opts);
  return {
    ...opts,
    includeReadOnlyAdmin,
    includeGosakiReadOnlyAdmin: includeReadOnlyAdmin,
  };
}
