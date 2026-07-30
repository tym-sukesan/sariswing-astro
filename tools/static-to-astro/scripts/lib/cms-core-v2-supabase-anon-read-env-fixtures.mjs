/**
 * Fixtures for CMS Core supabase-anon-read-env-utils.
 * No network / secrets — synthetic env maps only.
 */

/** Blank anon keys (overrides .env.local when passed as processEnv). */
export const ANON_ENV_BLANK = Object.freeze({
  PUBLIC_SUPABASE_URL: "",
  PUBLIC_SUPABASE_ANON_KEY: "",
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
});

/** Valid-looking anon pair (no live fetch in helper itself). */
export const ANON_ENV_VALID = Object.freeze({
  PUBLIC_SUPABASE_URL: "https://kmjqppxjdnwwrtaeqjta.supabase.co",
  PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fixture-anon",
});

/** Alias keys SUPABASE_* without PUBLIC_. */
export const ANON_ENV_ALIAS = Object.freeze({
  SUPABASE_URL: "https://kmjqppxjdnwwrtaeqjta.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fixture-alias",
});

/** service_role-looking key must reject. */
export const ANON_ENV_SERVICE_ROLE = Object.freeze({
  PUBLIC_SUPABASE_URL: "https://kmjqppxjdnwwrtaeqjta.supabase.co",
  PUBLIC_SUPABASE_ANON_KEY: "service_role_secret_must_reject",
});

/** Whitespace-only URL/key → null. */
export const ANON_ENV_WHITESPACE = Object.freeze({
  PUBLIC_SUPABASE_URL: "   ",
  PUBLIC_SUPABASE_ANON_KEY: "   ",
});
