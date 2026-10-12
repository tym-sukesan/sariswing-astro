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
  sql.includes("create function public.gosaki_discography_operational_create(") &&
    !sql.toLowerCase().includes("create or replace") &&
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

const applyAt = sql.indexOf("-- APPLY (write)");
const ownerGuardAt = sql.indexOf("do $create_owner_check$");
const ownerGuardEnd = sql.indexOf("$create_owner_check$;", ownerGuardAt);
const ownerGuard = ownerGuardAt >= 0 && ownerGuardEnd > ownerGuardAt
  ? sql.slice(ownerGuardAt, ownerGuardEnd)
  : "";
const createFnAt = sql.indexOf("create function public.gosaki_discography_operational_create(");
const precheckAt = sql.indexOf("-- PRECHECK (read-only)");
const postcheckAt = sql.indexOf("-- POSTCHECK (read-only)");
check("owner mismatch stops before the function is created",
  precheckAt >= 0 &&
    applyAt > precheckAt &&
    postcheckAt > createFnAt &&
    ownerGuardAt > applyAt &&
    createFnAt > ownerGuardEnd &&
    ownerGuard.includes("c.relname = 'discography'") &&
    ownerGuard.includes("c.relname = 'discography_tracks'") &&
    ownerGuard.includes("STOP: public.discography owner is missing") &&
    ownerGuard.includes("STOP: public.discography_tracks owner is missing") &&
    ownerGuard.includes("anon and authenticated must not own public.discography or public.discography_tracks") &&
    ownerGuard.includes("anon and authenticated must not own this function") &&
    ownerGuard.includes("public.discography and public.discography_tracks must have the same owner") &&
    ownerGuard.includes("current_user must be the owner of public.discography and public.discography_tracks") &&
    ownerGuard.includes("raise exception") &&
    !ownerGuard.includes("pg_catalog.current_user") &&
    ownerGuard.includes("if current_user in ('anon', 'authenticated') then") &&
    ownerGuard.includes("if current_user is distinct from v_discography_owner") &&
    ownerGuard.includes("or current_user is distinct from v_tracks_owner then") &&
    ownerGuard.includes("p.proname = 'gosaki_discography_operational_create'") &&
    ownerGuard.includes("STOP: public.gosaki_discography_operational_create already exists") &&
    ownerGuard.indexOf("already exists") < ownerGuard.indexOf("if current_user in") &&
    sql.includes("Expect all 16 columns"));

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

console.log("PASS 8");
