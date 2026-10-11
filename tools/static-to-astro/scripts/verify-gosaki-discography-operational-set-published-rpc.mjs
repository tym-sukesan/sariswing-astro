#!/usr/bin/env node
/**
 * Offline verifier for the Gosaki discography set-published RPC template.
 * Does not connect to a database and does not apply SQL.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(toolRoot, "../..");

const sql = fs.readFileSync(
  path.join(toolRoot, "scripts/supabase/gosaki-discography-operational-set-published-rpc.template.sql"),
  "utf8",
);
const createSql = fs.readFileSync(
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

const updateAt = sql.toLowerCase().indexOf("update public.discography");
const updateSql = updateAt >= 0 ? sql.slice(updateAt, sql.indexOf(";", updateAt)) : "";
const setBody = updateSql.slice(updateSql.toLowerCase().indexOf("set"), updateSql.toLowerCase().indexOf("where"));

check("template is marked not to execute and is staging-only",
  sql.includes("DO NOT EXECUTE") &&
    sql.includes("kmjqppxjdnwwrtaeqjta") &&
    sql.includes("vsbvndwuajjhnzpohghh") &&
    sql.includes("PRECHECK") &&
    sql.includes("APPLY") &&
    sql.includes("POSTCHECK"));

check("publish function is separate from save and create",
  sql.includes("create or replace function public.gosaki_discography_operational_set_published(") &&
    !sql.includes("create or replace function public.gosaki_discography_operational_save(") &&
    !sql.includes("create or replace function public.gosaki_discography_operational_create(") &&
    !saveMigration.includes("gosaki_discography_operational_set_published") &&
    !saveTemplate.includes("gosaki_discography_operational_set_published") &&
    !createSql.includes("gosaki_discography_operational_set_published") &&
    !edgeHandler.includes("gosaki_discography_operational_set_published") &&
    !edgeCopy.includes("gosaki_discography_operational_set_published"));

check("authz is can_write_site for gosaki-piano and the owner is the table owner",
  sql.includes("security definer") &&
    sql.includes("set search_path = pg_catalog, public") &&
    sql.includes("public.can_write_site(v_site_id)") &&
    sql.includes("v_site_slug <> 'gosaki-piano'") &&
    sql.includes("can_write_site_denied") &&
    sql.includes("current_user must be the owner of public.discography") &&
    sql.includes("anon and authenticated must not own this function") &&
    !sql.includes("public.is_admin()"));

check("legacy id and optimistic lock are required",
  sql.includes("legacy_id_required") &&
    sql.includes("legacy_id_mismatch") &&
    sql.includes("^discography-[0-9]{3}$") &&
    sql.includes("optimistic_lock_missing") &&
    sql.includes("p_expected_before_updated_at is null"));

check("an already published row returns 422 before the update",
  sql.includes("already_published") &&
    sql.includes("'http_status', 422") &&
    sql.indexOf("already_published") < updateAt);

check("a lock mismatch returns 409 and does not publish",
  sql.includes("optimistic_lock_conflict") &&
    sql.includes("'http_status', 409") &&
    sql.includes("v_updated_at is distinct from p_expected_before_updated_at") &&
    sql.includes("d.updated_at = p_expected_before_updated_at"));

check("permission and other sites are rejected before the row update",
  sql.includes("can_write_site_denied") &&
    sql.includes("site_mismatch") &&
    sql.indexOf("can_write_site_denied") < updateAt &&
    sql.indexOf("site_mismatch") < updateAt);

check("the update assigns published and updated_at only",
  updateSql.includes("published = true") &&
    updateSql.includes("updated_at = now()") &&
    updateSql.includes("d.published is false") &&
    !setBody.includes("title") &&
    !setBody.includes("description") &&
    !setBody.includes("sort_order") &&
    !updateSql.includes("tracks") &&
    !sql.toLowerCase().includes("update public.discography_tracks") &&
    !sql.toLowerCase().includes("insert into") &&
    !sql.toLowerCase().includes("delete from") &&
    !sql.toLowerCase().includes("published = false"));

check("the updated_at trigger is observed and not disabled",
  sql.includes("tgname = 'discography_set_updated_at'") &&
    !sql.toLowerCase().includes("disable trigger"));

check("the target row is locked and a missing row is rejected",
  sql.includes("and d.legacy_id = v_legacy_id") &&
    sql.includes("for update;") &&
    sql.includes("release_not_found") &&
    !sql.includes("legacy_id ~ '^discography-[0-9]{3}$'\n  for update"));

check("false and unpublish requests are rejected",
  sql.includes("p_published is distinct from true") &&
    sql.includes("publish_only") &&
    sql.includes("only published=true is accepted"));

check("success returns the id, published true, and the new updated_at",
  sql.includes("'ok', true") &&
    sql.includes("'legacy_id', v_legacy_id") &&
    sql.includes("'published', true") &&
    sql.includes("'updated_at', v_next_updated_at"));

check("execute is granted only to authenticated and table grants stay absent",
  sql.includes("revoke all on function public.gosaki_discography_operational_set_published(") &&
    sql.includes("from public") &&
    sql.includes("from anon") &&
    sql.includes("grant execute on function public.gosaki_discography_operational_set_published(") &&
    sql.includes("to authenticated") &&
    !sql.toLowerCase().includes("grant insert") &&
    !sql.toLowerCase().includes("grant update") &&
    !sql.toLowerCase().includes("grant delete") &&
    !sql.toLowerCase().includes("create policy") &&
    !sql.toLowerCase().includes("enable row level") &&
    !sql.toLowerCase().includes("disable trigger") &&
    !sql.includes("service_role"));

if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  for (const name of failures) console.error(`- ${name}`);
  process.exit(1);
}

console.log("PASS 12");
