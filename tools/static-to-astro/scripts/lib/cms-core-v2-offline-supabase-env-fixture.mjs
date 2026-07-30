import { isFeatureFlagTrimTrue } from "./feature-flag-trim-true-utils.mjs";

/**
 * Offline Supabase anon env fixture for CMS Core verifier hardening.
 *
 * Passing these keys overrides `.env.local` via resolveSupabaseAnonReadEnv merge
 * (`{ ...local, ...processEnv }` in `supabase-anon-read-env-utils.mjs`) so loaders
 * return `not-configured` without attempting live fetch.
 *
 * Soft live checks are opt-in via `CMS_CORE_V2_VERIFIER_LIVE_SOFT=true`
 * (avoids accidental remote SELECT in default offline runs).
 */

/** @type {Readonly<Record<string, string>>} */
export const CMS_CORE_V2_OFFLINE_SUPABASE_ANON_ENV = Object.freeze({
  PUBLIC_SUPABASE_URL: "",
  PUBLIC_SUPABASE_ANON_KEY: "",
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
});

/** Valid loadSiteEmbedsDataForBuild outcomes after the registry/env gate engages. */
export const CMS_CORE_V2_SITE_EMBEDS_LOADER_OUTCOMES = Object.freeze([
  "supabase",
  "supabase-empty",
  "error",
  "not-configured",
  "blocked",
]);

/** Opt-in soft live SELECT checks for Core verifiers. */
export function isCmsCoreV2VerifierLiveSoftEnabled(env = process.env) {
  return isFeatureFlagTrimTrue(env.CMS_CORE_V2_VERIFIER_LIVE_SOFT);
}
