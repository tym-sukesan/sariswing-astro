#!/usr/bin/env node
/**
 * Offline verifier — Discography site-owner authz Slice A implementation.
 * npm: verify:discography-site-owner-authz-slice-a-implementation
 *
 * No network / SQL apply / DB write / arm / Save.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

const DOC = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-a-implementation.md",
);
const PLAN = path.join(TOOL_ROOT, "docs/discography-site-owner-authz-planning.md");
const EDGE = path.join(
  REPO_ROOT,
  "supabase/functions/gosaki-discography-save-dry-run/handler.ts",
);
const MIRROR = path.join(
  TOOL_ROOT,
  "scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts",
);
const HIST_RPC = path.join(
  REPO_ROOT,
  "supabase/migrations/20260721100000_gosaki_discography_operational_save_rpc.sql",
);
const RPC_FWD = path.join(
  TOOL_ROOT,
  "scripts/supabase/gosaki-discography-operational-save-rpc-can-write-site.template.sql",
);
const RPC_RB = path.join(
  TOOL_ROOT,
  "scripts/supabase/gosaki-discography-operational-save-rpc-is-admin-rollback.template.sql",
);
const RLS_FWD = path.join(
  TOOL_ROOT,
  "scripts/supabase/gosaki-discography-site-writer-select-rls.template.sql",
);
const RLS_RB = path.join(
  TOOL_ROOT,
  "scripts/supabase/gosaki-discography-site-writer-select-rls-rollback.template.sql",
);
const PKG = path.join(TOOL_ROOT, "package.json");
const SUITE = path.join(TOOL_ROOT, "scripts/run-cms-core-v2-safety-suite.mjs");

let passed = 0;
let failed = 0;
function assert(name, cond, detail = "") {
  if (cond) {
    console.log(`PASS ${name}`);
    passed += 1;
  } else {
    console.log(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}

for (const [label, p] of [
  ["doc", DOC],
  ["plan", PLAN],
  ["edge", EDGE],
  ["mirror", MIRROR],
  ["hist rpc", HIST_RPC],
  ["rpc fwd", RPC_FWD],
  ["rpc rb", RPC_RB],
  ["rls fwd", RLS_FWD],
  ["rls rb", RLS_RB],
]) {
  assert(`${label} exists`, fs.existsSync(p));
}

const doc = read(DOC);
const edge = read(EDGE);
const mirror = read(MIRROR);
const histRpc = read(HIST_RPC);
const rpcFwd = read(RPC_FWD);
const rpcRb = read(RPC_RB);
const rlsFwd = read(RLS_FWD);
const rlsRb = read(RLS_RB);
const pkg = read(PKG);
const suite = read(SUITE);

assert(
  "phase id",
  /discography-site-owner-authz-implementation-and-migration-template-slice-a/.test(
    doc,
  ),
);
assert("SLICE_A_IMPLEMENTED true", /SLICE_A_IMPLEMENTED:\s*true/.test(doc));
assert("EDGE_AUTHZ_ALIGNED true", /EDGE_AUTHZ_ALIGNED:\s*true/.test(doc));
assert("RPC_AUTHZ_ALIGNED true", /RPC_AUTHZ_ALIGNED:\s*true/.test(doc));
assert(
  "WRITER_SELECT_TEMPLATE_READY true",
  /WRITER_SELECT_TEMPLATE_READY:\s*true/.test(doc),
);
assert(
  "ROLLBACK_TEMPLATE_READY true",
  /ROLLBACK_TEMPLATE_READY:\s*true/.test(doc),
);
assert("UPDATE_GRANTS_CHANGED false", /UPDATE_GRANTS_CHANGED:\s*false/.test(doc));
assert(
  "TRACK_WRITE_GRANTS_CHANGED false",
  /TRACK_WRITE_GRANTS_CHANGED:\s*false/.test(doc),
);
assert("DB_WRITE_EXECUTED false", /DB_WRITE_EXECUTED:\s*false/.test(doc));
assert("MIGRATION_APPLIED false", /MIGRATION_APPLIED:\s*false/.test(doc));
assert("STAGING_APPLY_READY false", /STAGING_APPLY_READY:\s*false/.test(doc));
assert("ARMS_OFF true", /ARMS_OFF:\s*true/.test(doc));
assert(
  "owner→admin_users forbidden",
  /OWNER_TO_ADMIN_USERS_FORBIDDEN:\s*true/.test(doc),
);
assert(
  "next preflight phase",
  /RECOMMENDED_NEXT_PHASE:\s*discography-site-owner-authz-slice-a-staging-preflight/.test(
    doc,
  ),
);

assert("edge assertCanWriteSiteForSiteSlug", /assertCanWriteSiteForSiteSlug/.test(edge));
assert("edge can_write_site rpc", /rpc\(\s*["']can_write_site["']\s*,\s*\{\s*p_site_id/.test(edge));
assert("edge no assertOperatorIsAdmin", !/assertOperatorIsAdmin/.test(edge));
assert("edge no is_admin rpc", !/\.rpc\(\s*["']is_admin["']\s*\)/.test(edge));
assert("edge site_resolve_ambiguous", /site_resolve_ambiguous/.test(edge));
assert("edge can_write_site_denied", /can_write_site_denied/.test(edge));
assert("edge mirror byte-eq", edge === mirror);

assert("rpc fwd can_write_site", /public\.can_write_site\(v_site_id\)/.test(rpcFwd));
assert(
  "rpc fwd no is_admin() call",
  !/:=\s*public\.is_admin\(\)/.test(rpcFwd) && !/v_admin\s*:=/.test(rpcFwd),
);
assert("rpc fwd DO NOT EXECUTE", /DO NOT EXECUTE/.test(rpcFwd));
assert("rpc fwd staging ref", /kmjqppxjdnwwrtaeqjta/.test(rpcFwd));
assert("rpc fwd prod STOP", /vsbvndwuajjhnzpohghh/.test(rpcFwd));
assert("rpc fwd SECURITY DEFINER", /SECURITY DEFINER/.test(rpcFwd));
assert(
  "rpc fwd track replace DELETE",
  /DELETE FROM public\.discography_tracks/.test(rpcFwd),
);
assert(
  "rpc fwd no service_role grant",
  !/GRANT[\s\S]{0,120}TO\s+service_role/i.test(rpcFwd) &&
    !/TO\s+service_role/i.test(rpcFwd),
);
assert(
  "rpc fwd no table UPDATE grant",
  !/GRANT\s+UPDATE\s+ON\s+TABLE/i.test(rpcFwd) &&
    !/GRANT\s+INSERT\s+ON\s+TABLE/i.test(rpcFwd) &&
    !/GRANT\s+DELETE\s+ON\s+TABLE/i.test(rpcFwd),
);

assert("rpc rb is_admin gate", /public\.is_admin\(\)/.test(rpcRb));
assert("rpc rb DO NOT EXECUTE", /DO NOT EXECUTE/.test(rpcRb));
assert("rpc rb prod STOP", /vsbvndwuajjhnzpohghh/.test(rpcRb));
assert("hist rpc still is_admin (unapplied staging SoT)", /public\.is_admin\(\)/.test(histRpc));

assert(
  "rls fwd discography_site_writer_select",
  /create policy discography_site_writer_select/.test(rlsFwd),
);
assert(
  "rls fwd discography_tracks_site_writer_select",
  /create policy discography_tracks_site_writer_select/.test(rlsFwd),
);
assert("rls fwd SELECT only cmds", /for select/.test(rlsFwd));
assert(
  "rls fwd no UPDATE policy",
  !/for update/i.test(rlsFwd) && !/site_writer_update/.test(rlsFwd),
);
assert(
  "rls fwd no INSERT/DELETE policy",
  !/for insert/i.test(rlsFwd) && !/for delete/i.test(rlsFwd),
);
assert("rls fwd can_write_site", /can_write_site\(site_row\.id\)/.test(rlsFwd));
assert(
  "rls fwd policy body no hardcoded gosaki slug",
  !/where site_row\.site_slug\s*=\s*'gosaki-piano'/i.test(rlsFwd) &&
    /site_row\.site_slug\s*=\s*discography\.site_slug/.test(rlsFwd) &&
    /site_row\.site_slug\s*=\s*discography_tracks\.site_slug/.test(rlsFwd),
);
assert("rls fwd DO NOT EXECUTE", /DO NOT EXECUTE/.test(rlsFwd));
assert("rls fwd prod STOP", /vsbvndwuajjhnzpohghh/.test(rlsFwd));
assert(
  "rls fwd no service_role grant",
  !/GRANT[\s\S]{0,120}TO\s+service_role/i.test(rlsFwd) &&
    !/TO\s+service_role/i.test(rlsFwd),
);
assert(
  "rls rb drops only writer select",
  /drop policy if exists discography_site_writer_select/.test(rlsRb) &&
    /drop policy if exists discography_tracks_site_writer_select/.test(rlsRb) &&
    !/drop policy if exists discography_admin_all/.test(rlsRb) &&
    !/drop policy if exists discography_public_select/.test(rlsRb) &&
    !/drop policy if exists discography_tracks_admin_all/.test(rlsRb) &&
    !/drop policy if exists discography_tracks_public_select/.test(rlsRb),
);

assert(
  "package.json script",
  /"verify:discography-site-owner-authz-slice-a-implementation"/.test(pkg),
);
assert(
  "safety suite step",
  /discography-site-owner-authz-slice-a-implementation/.test(suite) &&
    /verify-discography-site-owner-authz-slice-a-implementation\.mjs/.test(suite),
);

console.log("");
console.log(`passed=${passed} failed=${failed}`);
process.exit(failed > 0 ? 1 : 0);
