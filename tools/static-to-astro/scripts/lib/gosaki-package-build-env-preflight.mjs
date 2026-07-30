/**
 * Gosaki adapter — package-build public env preflight (staging admin bake).
 *
 * Injected into site-agnostic Core via `resolveBuildEnv`.
 * Core must NOT import this module.
 *
 * Runs BEFORE git-clean / mutex / filesystem writes (entrypoint order).
 */

import { GOSAKI_SITE_KEY } from "./site-registry.mjs";
import {
  loadGosakiStagingAdminPublicEnv,
  reportGosakiStagingAdminPublicEnvPresence,
  validateGosakiStagingAdminPublicEnv,
} from "./gosaki-staging-admin-public-env.mjs";

/**
 * @param {string | null | undefined} siteKey
 * @returns {boolean}
 */
export function shouldApplyGosakiPackageBuildEnvPreflight(siteKey) {
  return String(siteKey ?? "") === GOSAKI_SITE_KEY;
}

/**
 * @param {ReturnType<typeof validateGosakiStagingAdminPublicEnv>} validation
 * @returns {string}
 */
export function formatGosakiPackageBuildEnvPreflightError(validation) {
  const parts = [];
  if (validation.missing?.length) {
    parts.push(`missing: ${validation.missing.join(",")}`);
  }
  if (validation.errors?.length) {
    parts.push(validation.errors.join("; "));
  }
  return `Gosaki staging admin public env preflight failed · ${parts.join(" · ") || "invalid"}`;
}

/**
 * Core injection for `runSitePackageBuild({ resolveBuildEnv })`.
 * Returns `undefined` for non-Gosaki (no-op).
 *
 * @param {string | null | undefined} siteKey
 * @returns {undefined | ((ctx: {
 *   env?: NodeJS.ProcessEnv | Record<string, string | undefined>,
 *   siteKey?: string,
 * }) => { buildEnv: NodeJS.ProcessEnv })}
 */
export function createGosakiResolveBuildEnv(siteKey) {
  if (!shouldApplyGosakiPackageBuildEnvPreflight(siteKey)) return undefined;

  return (ctx = {}) => {
    const report = reportGosakiStagingAdminPublicEnvPresence();
    console.log("PUBLIC_SUPABASE_URL:", report.presence.PUBLIC_SUPABASE_URL ? "SET" : "UNSET");
    console.log(
      "PUBLIC_SUPABASE_ANON_KEY:",
      report.presence.PUBLIC_SUPABASE_ANON_KEY ? "SET" : "UNSET",
    );
    console.log(
      "PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT:",
      report.presence.PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT
        ? "SET"
        : "UNSET (using staging default)",
    );

    const env = loadGosakiStagingAdminPublicEnv();
    const validation = validateGosakiStagingAdminPublicEnv(env);
    if (!validation.ok) {
      if (validation.missing.length) {
        console.error("Missing required public env:");
        for (const key of validation.missing) console.error(`  - ${key}`);
      }
      if (validation.errors.length) {
        console.error("Env validation errors:");
        for (const msg of validation.errors) console.error(`  - ${msg}`);
      }
      const err = new Error(formatGosakiPackageBuildEnvPreflightError(validation));
      /** @type {any} */ (err).validation = validation;
      throw err;
    }

    const base = ctx.env ?? process.env;
    return {
      buildEnv: {
        ...base,
        PUBLIC_SUPABASE_URL: env.PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_ANON_KEY: env.PUBLIC_SUPABASE_ANON_KEY,
        PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT: env.PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT,
      },
    };
  };
}
