/**
 * CMS Core — Supabase staging project-ref safety (Node).
 * Site-agnostic SoT for “staging only · production fail-closed”.
 *
 * Edge / Deno / Admin browser templates intentionally NOT wired in this phase.
 * Feature wrappers keep their own error messages / reason codes.
 */

/** Kit staging Supabase project ref (sole allowed target for staging-only tooling). */
export const STAGING_PROJECT_REF = "kmjqppxjdnwwrtaeqjta";

/** Production Supabase project ref — always fail-closed. */
export const PRODUCTION_REF_STOP = "vsbvndwuajjhnzpohghh";

export const STAGING_SUPABASE_HOST = `${STAGING_PROJECT_REF}.supabase.co`;
export const STAGING_SUPABASE_URL = `https://${STAGING_SUPABASE_HOST}`;

/**
 * @typedef {"empty" | "staging" | "production" | "unknown"} SupabaseProjectRefKind
 */

/**
 * @typedef {{
 *   kind: SupabaseProjectRefKind,
 *   ok: boolean,
 *   code: null | "empty" | "production_ref_stop" | "staging_ref_required",
 *   raw: string,
 * }} StagingOnlyRefEvaluation
 */

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function stringContainsProductionRef(value) {
  return String(value ?? "").includes(PRODUCTION_REF_STOP);
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function stringContainsStagingRef(value) {
  return String(value ?? "").includes(STAGING_PROJECT_REF);
}

/**
 * Exact staging API hostname (stricter than substring contains).
 * @param {unknown} hostname
 * @returns {boolean}
 */
export function isExactStagingSupabaseHostname(hostname) {
  return String(hostname ?? "").trim() === STAGING_SUPABASE_HOST;
}

/**
 * Classify a URL, host, or bare project-ref string for staging-only gates.
 * Order (fail-closed):
 * 1. empty
 * 2. production substring anywhere (before staging)
 * 3. http(s) URL → exact staging API hostname only (blocks query/path spoof)
 * 4. non-URL → staging substring (bare project ref / host string; legacy tooling)
 * 5. else unknown
 *
 * @param {unknown} input
 * @returns {StagingOnlyRefEvaluation}
 */
export function evaluateStagingOnlySupabaseTarget(input) {
  // No trim for empty: preserve historical Node assert behavior (whitespace-only ≠ empty).
  const raw = String(input ?? "");
  if (!raw) {
    return { kind: "empty", ok: false, code: "empty", raw: "" };
  }
  if (stringContainsProductionRef(raw)) {
    return { kind: "production", ok: false, code: "production_ref_stop", raw };
  }

  const hostname = tryParseHttpUrlHostname(raw);
  if (hostname != null) {
    if (isExactStagingSupabaseHostname(hostname)) {
      return { kind: "staging", ok: true, code: null, raw };
    }
    return { kind: "unknown", ok: false, code: "staging_ref_required", raw };
  }

  if (stringContainsStagingRef(raw)) {
    return { kind: "staging", ok: true, code: null, raw };
  }
  return { kind: "unknown", ok: false, code: "staging_ref_required", raw };
}

/**
 * @param {string} raw
 * @returns {string | null} hostname when input parses as http(s) URL; else null
 */
function tryParseHttpUrlHostname(raw) {
  const candidate = raw.trim();
  if (!/^https?:\/\//i.test(candidate)) return null;
  try {
    return new URL(candidate).hostname;
  } catch {
    return null;
  }
}

/**
 * @typedef {{
 *   empty?: string,
 *   production?: string,
 *   nonStaging?: string,
 * }} StagingOnlyAssertMessages
 */

/**
 * Throw fail-closed if input is empty, production, or non-staging.
 * Feature wrappers pass message overrides to preserve existing Error text.
 *
 * @param {unknown} input
 * @param {StagingOnlyAssertMessages} [messages]
 * @returns {StagingOnlyRefEvaluation}
 */
export function assertStagingOnlySupabaseTarget(input, messages = {}) {
  const result = evaluateStagingOnlySupabaseTarget(input);
  if (result.kind === "empty") {
    throw new Error(messages.empty ?? "SUPABASE_URL is required");
  }
  if (result.kind === "production") {
    throw new Error(messages.production ?? "production Supabase ref is blocked");
  }
  if (result.kind === "unknown") {
    throw new Error(messages.nonStaging ?? "staging project ref is required");
  }
  return result;
}
