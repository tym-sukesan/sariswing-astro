/**
 * G-6-d-dry-run-retry — Read-only dry-run QA against staging profile.
 * SELECT only; never calls .update(). Uses anon key from tools/static-to-astro/.env.local.
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

export const G6D_APPROVAL_ID = "G-6-d-staging-profile-update-poc";
const PROFILE_TABLE = "profile";
const ALLOWED_FIELDS = { display_name: "name", bio: "bio" };

/**
 * @param {string} toolRoot
 */
export function loadStaticToAstroEnvLocal(toolRoot) {
  const envPath = path.join(toolRoot, ".env.local");
  if (!fs.existsSync(envPath)) return {};
  /** @type {Record<string, string>} */
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

/**
 * @param {Record<string, string>} values
 */
function partitionFields(values) {
  /** @type {Record<string, string>} */
  const dbPayload = {};
  /** @type {string[]} */
  const rejected = [];
  for (const [key, value] of Object.entries(values)) {
    const column = ALLOWED_FIELDS[key];
    if (!column) {
      rejected.push(key);
      continue;
    }
    dbPayload[column] = value;
  }
  return { dbPayload, rejected };
}

/**
 * @param {object} opts
 * @param {string} opts.toolRoot
 */
export async function runG6dDryRunQa({ toolRoot }) {
  const envLocal = loadStaticToAstroEnvLocal(toolRoot);
  const url = envLocal.PUBLIC_SUPABASE_URL || envLocal.SUPABASE_URL || "";
  const anonKey =
    envLocal.PUBLIC_SUPABASE_ANON_KEY || envLocal.SUPABASE_ANON_KEY || "";

  if (!url || !anonKey) {
    return {
      ok: false,
      dryRun: true,
      skipped: true,
      reason: "Missing PUBLIC_SUPABASE_URL/SUPABASE_URL or anon key in tools/static-to-astro/.env.local",
      approvalId: G6D_APPROVAL_ID,
      targetTable: PROFILE_TABLE,
      targetFields: ["name", "bio"],
    };
  }

  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: beforeRows, error: beforeError } = await client
    .from(PROFILE_TABLE)
    .select("id,name,bio")
    .limit(1);

  if (beforeError) {
    return {
      ok: false,
      dryRun: true,
      approvalId: G6D_APPROVAL_ID,
      targetTable: PROFILE_TABLE,
      targetFields: ["name", "bio"],
      error: beforeError.message,
    };
  }

  const beforeRow = beforeRows?.[0];
  if (!beforeRow?.id) {
    return {
      ok: false,
      dryRun: true,
      approvalId: G6D_APPROVAL_ID,
      targetTable: PROFILE_TABLE,
      targetFields: ["name", "bio"],
      error: "No profile row found (single row required).",
    };
  }

  const testValues = {
    display_name: "QA Dry-run Retry Name",
    bio: "QA dry-run retry bio text (no DB write).",
  };
  const { dbPayload, rejected } = partitionFields(testValues);

  if (Object.keys(dbPayload).length === 0 || rejected.length > 0) {
    return {
      ok: false,
      dryRun: true,
      approvalId: G6D_APPROVAL_ID,
      targetTable: PROFILE_TABLE,
      targetFields: ["name", "bio"],
      error: "Payload partition failed for approved fields.",
      rejectedFields: rejected,
    };
  }

  const dryRunResult = {
    ok: true,
    dryRun: true,
    approvalId: G6D_APPROVAL_ID,
    targetTable: PROFILE_TABLE,
    targetOperation: "update",
    targetRowId: String(beforeRow.id),
    allowedFields: Object.keys(ALLOWED_FIELDS),
    updatePayload: dbPayload,
    beforeName: String(beforeRow.name ?? ""),
    beforeBio: String(beforeRow.bio ?? ""),
  };

  const { data: afterRows, error: afterError } = await client
    .from(PROFILE_TABLE)
    .select("id,name,bio")
    .eq("id", beforeRow.id)
    .limit(1);

  if (afterError) {
    return {
      ...dryRunResult,
      ok: false,
      error: `Post dry-run read failed: ${afterError.message}`,
    };
  }

  const afterRow = afterRows?.[0];
  const unchanged =
    String(afterRow?.name ?? "") === dryRunResult.beforeName &&
    String(afterRow?.bio ?? "") === dryRunResult.beforeBio;

  if (!unchanged) {
    return {
      ...dryRunResult,
      ok: false,
      error: "Profile row changed after dry-run QA (unexpected DB write).",
    };
  }

  return {
    ...dryRunResult,
    dbUnchanged: true,
    seedNameMatchesDemoArtist: dryRunResult.beforeName === "Demo Artist",
  };
}
