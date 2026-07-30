/**
 * Gosaki adapter — resolve staging anon key for static-public secret allowlist.
 * Owns `gosaki-staging-admin-public-env` so Core verifier stays site-agnostic.
 */

import { loadGosakiStagingAdminPublicEnv } from "./gosaki-staging-admin-public-env.mjs";
import { resolveKnownGosakiStagingAnonKeyForScan } from "./static-public-artifact-verifier.mjs";

/**
 * Load PUBLIC_SUPABASE_ANON_KEY via Gosaki staging admin public-env (fail-closed).
 * @returns {string | null}
 */
export function resolveGosakiEnvAnonKeyForStaticPublicScan() {
  try {
    const env = loadGosakiStagingAdminPublicEnv();
    const key = String(env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
    return key || null;
  } catch {
    return null;
  }
}

/**
 * Same contract as Core {@link resolveKnownGosakiStagingAnonKeyForScan},
 * with Gosaki env-file fallback wired (previous Core default).
 *
 * @param {{ knownAnonKey?: string | null, secretsAnonKey?: string | null }} [opts]
 * @returns {string | null}
 */
export function resolveKnownGosakiStagingAnonKeyForScanWithEnv(opts = {}) {
  return resolveKnownGosakiStagingAnonKeyForScan({
    ...opts,
    resolveEnvAnonKey: resolveGosakiEnvAnonKeyForStaticPublicScan,
  });
}
