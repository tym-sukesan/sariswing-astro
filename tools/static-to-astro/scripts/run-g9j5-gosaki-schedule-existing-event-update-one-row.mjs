#!/usr/bin/env node
/**
 * G-9j5 — One-row Gosaki schedule description non-dry-run UPDATE (staging only).
 * Self-contained mjs — no service_role. Does not modify .env files.
 *
 * Operator re-run (zsh — do not commit secrets):
 *   cd /Users/toyamayusuke/sariswing-astro
 *   read "G9J5_STAGING_ADMIN_EMAIL?Staging admin email: "
 *   read -s "SUPABASE_ADMIN_PASSWORD?Staging admin password: "; echo
 *   export G9J5_STAGING_ADMIN_EMAIL
 *   export SUPABASE_ADMIN_PASSWORD
 *   PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED=true \
 *   PUBLIC_ADMIN_WRITE_DRY_RUN=false \
 *   PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
 *   PUBLIC_ADMIN_WRITE_MODULE=schedule \
 *   PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9j-gosaki-schedule-existing-event-update-non-dry-run \
 *   node tools/static-to-astro/scripts/run-g9j5-gosaki-schedule-existing-event-update-one-row.mjs
 *   unset G9J5_STAGING_ADMIN_EMAIL
 *   unset SUPABASE_ADMIN_PASSWORD
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const G9J5_PHASE = "G-9j5-gosaki-schedule-existing-event-update-one-row-non-dry-run";
const TARGET_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const TARGET_LEGACY_ID = "schedule-2026-03-007";
const TARGET_SITE_SLUG = "gosaki-piano";
const EXPECTED_BEFORE_UPDATED_AT = "2026-06-16T16:03:41.551792+00:00";
const DESCRIPTION_BEFORE =
  "出演：長谷川薫vo 後藤沙紀pf\n会場website: http://pubhpp.com/";
const DESCRIPTION_AFTER =
  "出演：長谷川薫vo 後藤沙紀pf\n会場website: http://pubhpp.com/\n（管理画面保存テスト）";
const APPROVAL_ID = "G-9j-gosaki-schedule-existing-event-update-non-dry-run";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const ARM_ENV = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED";
const G9J5_STAGING_ADMIN_EMAIL_ENV = "G9J5_STAGING_ADMIN_EMAIL";
const SUPABASE_ADMIN_EMAIL_ENV = "SUPABASE_ADMIN_EMAIL";
const EXPLICIT_ADMIN_EMAIL_REQUIRED_MSG =
  "G-9j5 STOP: explicit staging admin email is required. Set G9J5_STAGING_ADMIN_EMAIL or SUPABASE_ADMIN_EMAIL.";

const SELECT_COLUMNS =
  "id,legacy_id,site_slug,date,year,month,title,venue,open_time,start_time,price,description,published,source_route,updated_at";

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
  return out;
}

function loadMergedEnv() {
  return {
    ...parseEnvFile(path.join(REPO_ROOT, ".env")),
    ...parseEnvFile(path.join(REPO_ROOT, ".env.local")),
    ...parseEnvFile(path.join(REPO_ROOT, "tools/static-to-astro/.env.local")),
    ...process.env,
  };
}

function projectRefFromUrl(url) {
  try {
    return new URL(url).host.replace(/\.supabase\.co$/i, "");
  } catch {
    return "—";
  }
}

function assertStagingProject(url) {
  const ref = projectRefFromUrl(url);
  if (ref === PRODUCTION_REF) {
    throw new Error(`DANGER: sari-site production ref ${ref}`);
  }
  if (ref !== STAGING_REF) {
    throw new Error(`project ref ${ref} is not allowlisted (expected ${STAGING_REF})`);
  }
  return ref;
}

export function resolveG9j5ExplicitAdminEmail(env) {
  const g9j5Email = String(env[G9J5_STAGING_ADMIN_EMAIL_ENV] ?? "").trim();
  if (g9j5Email) {
    return { email: g9j5Email, source: G9J5_STAGING_ADMIN_EMAIL_ENV };
  }
  const supabaseEmail = String(env[SUPABASE_ADMIN_EMAIL_ENV] ?? "").trim();
  if (supabaseEmail) {
    return { email: supabaseEmail, source: SUPABASE_ADMIN_EMAIL_ENV };
  }
  return { email: null, source: null };
}

function assertLiveRow(row) {
  if (!row) throw new Error("live row missing");
  if (row.id !== TARGET_ID) throw new Error("id mismatch");
  if (row.site_slug !== TARGET_SITE_SLUG) throw new Error("site_slug mismatch");
  if (row.legacy_id !== TARGET_LEGACY_ID) throw new Error("legacy_id mismatch");
  if (row.updated_at !== EXPECTED_BEFORE_UPDATED_AT) {
    throw new Error(`updated_at mismatch: ${row.updated_at}`);
  }
  if (row.description !== DESCRIPTION_BEFORE) {
    throw new Error("description before mismatch");
  }
}

async function fetchLiveRow(client) {
  const { data, error } = await client
    .from("schedules")
    .select(SELECT_COLUMNS)
    .eq("id", TARGET_ID)
    .eq("site_slug", TARGET_SITE_SLUG)
    .maybeSingle();
  if (error) throw new Error(`live SELECT failed: ${error.message}`);
  return data;
}

async function lockedUpdate(client, beforeSnapshot) {
  const payload = { description: DESCRIPTION_AFTER };
  const changedFields = ["description"];

  const { data: currentRow, error: selectError } = await client
    .from("schedules")
    .select("updated_at,site_slug,legacy_id")
    .eq("id", TARGET_ID)
    .single();
  if (selectError) throw new Error(`lock SELECT failed: ${selectError.message}`);
  if (String(currentRow.updated_at) !== EXPECTED_BEFORE_UPDATED_AT) {
    throw new Error("optimistic lock failed — updated_at changed");
  }
  if (currentRow.site_slug !== TARGET_SITE_SLUG) {
    throw new Error("site_slug scope failed");
  }
  if (currentRow.legacy_id !== TARGET_LEGACY_ID) {
    throw new Error("legacy_id scope failed");
  }

  const { data: updatedRow, error: updateError } = await client
    .from("schedules")
    .update(payload)
    .eq("id", TARGET_ID)
    .eq("site_slug", TARGET_SITE_SLUG)
    .eq("legacy_id", TARGET_LEGACY_ID)
    .eq("updated_at", EXPECTED_BEFORE_UPDATED_AT)
    .select(SELECT_COLUMNS)
    .single();

  if (updateError) throw new Error(`UPDATE failed: ${updateError.message}`);
  if (!updatedRow) throw new Error("UPDATE returned no row (0 rows affected)");

  return { payload, changedFields, beforeSnapshot, afterSnapshot: updatedRow };
}

async function main() {
  const env = loadMergedEnv();
  const url = (env.PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "").trim();
  const anonKey = (env.PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "").trim();
  const adminPassword = (
    env.SUPABASE_ADMIN_PASSWORD || env.G9J5_STAGING_ADMIN_PASSWORD || ""
  ).trim();

  console.log(`phase: ${G9J5_PHASE}`);
  console.log(`approvalId: ${APPROVAL_ID}`);
  console.log("service_role: not used");

  const ref = assertStagingProject(url);
  console.log(`project ref: ${ref} (static-to-astro-cms-staging)`);
  console.log(`blocked sari-site ref: ${PRODUCTION_REF} — not active`);

  if (!url || !anonKey) throw new Error("PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY required");

  const emailResolution = resolveG9j5ExplicitAdminEmail(env);
  if (!emailResolution.email) {
    throw new Error(EXPLICIT_ADMIN_EMAIL_REQUIRED_MSG);
  }
  const adminEmail = emailResolution.email;
  console.log(`admin email source: ${emailResolution.source}`);
  console.log(`admin email: ${adminEmail}`);

  if (!adminPassword) {
    throw new Error(
      "SUPABASE_ADMIN_PASSWORD or G9J5_STAGING_ADMIN_PASSWORD required in process env.",
    );
  }
  if (String(env[ARM_ENV] ?? "") !== "true") {
    throw new Error(`${ARM_ENV}=true required`);
  }

  const readClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const live = await fetchLiveRow(readClient);
  assertLiveRow(live);
  console.log("live row preflight: PASS");
  console.log("expectedBeforeUpdatedAt: MATCH");

  const dryRunPayload = { description: DESCRIPTION_AFTER };
  if (Object.keys(dryRunPayload).join() !== "description") {
    throw new Error("dry-run payload keys invalid");
  }
  console.log('dry-run changedFields: ["description"]');
  console.log('dry-run payload keys: ["description"]');

  const writeClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: signInError } = await writeClient.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (signInError) {
    throw new Error(`signInWithPassword failed: ${signInError.message}`);
  }

  console.log("executing locked UPDATE once...");
  const writeResult = await lockedUpdate(writeClient, live);

  const post = await fetchLiveRow(readClient);
  console.log("post-save description:", post.description);
  console.log("post-save updated_at:", post.updated_at);

  if (post.description !== DESCRIPTION_AFTER) throw new Error("post-save description mismatch");
  if (post.updated_at === EXPECTED_BEFORE_UPDATED_AT) {
    throw new Error("updated_at did not advance");
  }
  for (const field of ["title", "date", "venue", "open_time", "start_time", "price", "published", "source_route"]) {
    if (String(live[field] ?? "") !== String(post[field] ?? "")) {
      throw new Error(`unexpected change in ${field}`);
    }
  }

  console.log("G-9j5 UPDATE success");
  console.log("targetRows: 1");
  console.log(`changedFields: ${JSON.stringify(writeResult.changedFields)}`);
  console.log(`payload keys: ${JSON.stringify(Object.keys(writeResult.payload))}`);
  console.log("rowsAffected: 1");
}

const isDirectRun =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirectRun) {
  main().catch((err) => {
    const message = err?.message ?? String(err);
    console.error(
      message.startsWith("G-9j5 STOP:") ? message : `G-9j5 STOP: ${message}`,
    );
    process.exit(1);
  });
}
