#!/usr/bin/env node
/**
 * Offline verifier for the Gosaki discography create RPC template.
 * Does not connect to a database and does not apply SQL.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(toolRoot, "../..");

const sql = fs.readFileSync(
  path.join(toolRoot, "scripts/supabase/gosaki-discography-operational-create-rpc.template.sql"),
  "utf8",
);
const saveMigration = fs.readFileSync(
  path.join(repoRoot, "supabase/migrations/20260721100000_gosaki_discography_operational_save_rpc.sql"),
  "utf8",
);
const saveTemplate = fs.readFileSync(
  path.join(toolRoot, "scripts/supabase/gosaki-discography-operational-save-rpc-can-write-site.template.sql"),
  "utf8",
);
const edgeHandler = fs.readFileSync(
  path.join(repoRoot, "supabase/functions/gosaki-discography-save-dry-run/handler.ts"),
  "utf8",
);
const edgeCopy = fs.readFileSync(
  path.join(toolRoot, "scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts"),
  "utf8",
);

const failures = [];
function check(name, ok) {
  if (!ok) failures.push(name);
}

check("template is marked not to execute and is staging-only",
  sql.includes("DO NOT EXECUTE") &&
    sql.includes("kmjqppxjdnwwrtaeqjta") &&
    sql.includes("vsbvndwuajjhnzpohghh") &&
    sql.includes("PRECHECK") &&
    sql.includes("APPLY"));

check("create function is separate from the save function",
  sql.includes("create or replace function public.gosaki_discography_operational_create(") &&
    !sql.includes("create or replace function public.gosaki_discography_operational_save(") &&
    !saveMigration.includes("gosaki_discography_operational_create") &&
    !saveTemplate.includes("gosaki_discography_operational_create") &&
    !edgeHandler.includes("gosaki_discography_operational_create") &&
    !edgeCopy.includes("gosaki_discography_operational_create"));

check("authz is can_write_site for gosaki-piano only",
  sql.includes("security definer") &&
    sql.includes("set search_path = pg_catalog, public") &&
    sql.includes("public.can_write_site(v_site_id)") &&
    sql.includes("v_site_slug <> 'gosaki-piano'") &&
    sql.includes("can_write_site_denied") &&
    !sql.includes("public.is_admin()"));

check("legacy ids are allocated under a transaction lock with a 999 cap",
  sql.includes("pg_advisory_xact_lock(") &&
    !sql.toLowerCase().includes("for update") &&
    sql.includes("v_max_legacy >= 999") &&
    sql.includes("lpad(v_next_legacy::text, 3, '0')") &&
    sql.includes("legacy_id_conflict") &&
    sql.includes("unique_violation") &&
    sql.includes("coalesce(array_length(p_track_titles, 1), 0) > 100"));

check("album and tracks insert together and existing rows are not updated",
  sql.includes("insert into public.discography (") &&
    sql.includes("insert into public.discography_tracks (") &&
    sql.includes("published,") &&
    sql.includes("false,") &&
    sql.includes("create rolled back") &&
    !sql.toLowerCase().includes("update public.discography") &&
    !sql.toLowerCase().includes("delete from"));

check("input checks cover the create fields and urls",
  sql.includes("invalid title") &&
    sql.includes("invalid release_display") &&
    sql.includes("invalid catalog_number") &&
    sql.includes("invalid price") &&
    sql.includes("invalid purchase_note") &&
    sql.includes("invalid purchase_url") &&
    sql.includes("invalid streaming_url") &&
    sql.includes("invalid cover_image_url") &&
    sql.includes("invalid track title") &&
    sql.includes("too many tracks") &&
    sql.includes("javascript:%") &&
    sql.includes("'^https?://'"));

check("execute is granted only to authenticated and table grants stay absent",
  sql.includes("revoke all on function public.gosaki_discography_operational_create(") &&
    sql.includes("from public") &&
    sql.includes("from anon") &&
    sql.includes("grant execute on function public.gosaki_discography_operational_create(") &&
    sql.includes("to authenticated") &&
    !sql.toLowerCase().includes("grant insert") &&
    !sql.toLowerCase().includes("grant update") &&
    !sql.toLowerCase().includes("grant delete") &&
    !sql.toLowerCase().includes("create policy") &&
    !sql.toLowerCase().includes("enable row level") &&
    !sql.includes("service_role") &&
    sql.includes("'legacy_id', v_legacy_id") &&
    sql.includes("coalesce(max(d.sort_order), 0) + 1"));

if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  for (const name of failures) console.error(`- ${name}`);
  process.exit(1);
}

console.log("PASS 7");
