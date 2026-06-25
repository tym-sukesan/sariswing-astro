/**
 * G-11c4b — Load Gosaki staging admin public env from repo root .env files (read-only).
 * Never logs secret values. Blocks production Supabase host.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const TOOL_ROOT = path.resolve(__dirname, "../..");
export const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

export const STAGING_PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
export const PRODUCTION_PROJECT_REF = "vsbvndwuajjhnzpohghh";
export const STAGING_SUPABASE_URL = `https://${STAGING_PROJECT_REF}.supabase.co`;
export const STAGING_DRY_RUN_ENDPOINT = `${STAGING_SUPABASE_URL}/functions/v1/gosaki-youtube-url-dry-run`;

const PUBLIC_ENV_KEYS = [
  "PUBLIC_SUPABASE_URL",
  "PUBLIC_SUPABASE_ANON_KEY",
  "PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT",
];

/**
 * @param {string} filePath
 */
function parseEnvFile(filePath) {
  /** @type {Record<string, string>} */
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/**
 * @param {Record<string, string>} [extra]
 */
export function loadGosakiStagingAdminPublicEnv(extra = {}) {
  const fromEnv = { ...parseEnvFile(path.join(REPO_ROOT, ".env")), ...parseEnvFile(path.join(REPO_ROOT, ".env.local")) };
  const merged = { ...fromEnv, ...process.env, ...extra };

  const supabaseUrl = String(
    merged.PUBLIC_SUPABASE_URL || merged.SUPABASE_URL || STAGING_SUPABASE_URL,
  ).trim();
  const anonKey = String(merged.PUBLIC_SUPABASE_ANON_KEY || merged.SUPABASE_ANON_KEY || "").trim();
  const dryRunEndpoint = String(
    merged.PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT || STAGING_DRY_RUN_ENDPOINT,
  ).trim();

  return {
    PUBLIC_SUPABASE_URL: supabaseUrl,
    PUBLIC_SUPABASE_ANON_KEY: anonKey,
    PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT: dryRunEndpoint,
  };
}

/**
 * @param {ReturnType<typeof loadGosakiStagingAdminPublicEnv>} env
 */
export function validateGosakiStagingAdminPublicEnv(env) {
  /** @type {string[]} */
  const missing = [];
  /** @type {string[]} */
  const errors = [];

  if (!String(env.PUBLIC_SUPABASE_URL || "").trim()) missing.push("PUBLIC_SUPABASE_URL");
  if (!String(env.PUBLIC_SUPABASE_ANON_KEY || "").trim()) missing.push("PUBLIC_SUPABASE_ANON_KEY");
  if (!String(env.PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT || "").trim()) {
    missing.push("PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT");
  }

  let host = "";
  try {
    host = new URL(env.PUBLIC_SUPABASE_URL).hostname;
  } catch {
    errors.push("PUBLIC_SUPABASE_URL is not a valid URL");
  }

  if (host.includes(PRODUCTION_PROJECT_REF)) {
    errors.push("PUBLIC_SUPABASE_URL must not target production Supabase");
  }
  if (host && host !== `${STAGING_PROJECT_REF}.supabase.co`) {
    errors.push("PUBLIC_SUPABASE_URL host must be staging project only");
  }

  if (env.PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT?.includes(PRODUCTION_PROJECT_REF)) {
    errors.push("PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT must not target production");
  }

  if (/service_role/i.test(env.PUBLIC_SUPABASE_ANON_KEY || "")) {
    errors.push("PUBLIC_SUPABASE_ANON_KEY must be anon key only");
  }

  return {
    ok: missing.length === 0 && errors.length === 0,
    missing,
    errors,
  };
}

/**
 * Env presence report without values (for operator docs / CLI).
 */
export function reportGosakiStagingAdminPublicEnvPresence() {
  const env = loadGosakiStagingAdminPublicEnv();
  const validation = validateGosakiStagingAdminPublicEnv(env);
  return {
    presence: Object.fromEntries(
      PUBLIC_ENV_KEYS.map((key) => [key, Boolean(String(env[key] ?? "").trim())]),
    ),
    validation,
  };
}
