/**
 * CMS Core — Supabase anon read env resolution (Node).
 * Site-agnostic SoT for build-time PUBLIC_/SUPABASE_ URL + anon key merge.
 *
 * Merge order: `.env.local` (toolRoot) then processEnv overrides.
 * Rejects missing URL/key and any service_role-looking key.
 *
 * Feature loaders (schedule / discography / embeds / page_fields) should
 * import from here. `supabase-schedule-read.mjs` re-exports for compatibility.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_SUPABASE_ANON_READ_TOOL_ROOT = path.resolve(__dirname, "../..");

/**
 * Parse `toolRoot/.env.local` into a flat string map (no expansion).
 * @param {string} toolRoot
 * @returns {Record<string, string>}
 */
export function loadDotEnvLocal(toolRoot) {
  const envPath = path.join(toolRoot, ".env.local");
  if (!fs.existsSync(envPath)) return {};
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
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
 * Resolve anon read env (no service_role).
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} processEnv
 * @param {string | null} [toolRoot]
 * @returns {{ supabaseUrl: string, anonKey: string } | null}
 */
export function resolveSupabaseAnonReadEnv(
  processEnv = process.env,
  toolRoot = DEFAULT_SUPABASE_ANON_READ_TOOL_ROOT,
) {
  const local = toolRoot ? loadDotEnvLocal(toolRoot) : {};
  const merged = { ...local, ...processEnv };
  const supabaseUrl = String(merged.PUBLIC_SUPABASE_URL || merged.SUPABASE_URL || "").trim();
  const anonKey = String(
    merged.PUBLIC_SUPABASE_ANON_KEY || merged.SUPABASE_ANON_KEY || "",
  ).trim();
  if (!supabaseUrl || !anonKey) return null;
  if (/service[_-]?role/i.test(anonKey)) return null;
  return { supabaseUrl, anonKey };
}
