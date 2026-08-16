#!/usr/bin/env node
/**
 * Offline verifier — Discography site-owner authz Slice B planning.
 * npm: verify:discography-site-owner-authz-slice-b-planning
 *
 * No network / SQL apply / DB write / arm / Save / Edge deploy.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

const DOC = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-b-planning.md",
);
const SLICE_A = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-a-live-can-write-site-probe-result.md",
);
const APPLY = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-a-staging-apply-result.md",
);
const EDGE = path.join(
  REPO_ROOT,
  "supabase/functions/gosaki-discography-save-dry-run/handler.ts",
);
const RPC = path.join(
  TOOL_ROOT,
  "scripts/supabase/gosaki-discography-operational-save-rpc-can-write-site.template.sql",
);
const PKG = path.join(TOOL_ROOT, "package.json");
const SUITE = path.join(TOOL_ROOT, "scripts/run-cms-core-v2-safety-suite.mjs");
const LINKED = path.join(REPO_ROOT, "supabase/.temp/linked-project.json");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";

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

const doc = read(DOC);
const sliceA = read(SLICE_A);
const apply = read(APPLY);
const edge = read(EDGE);
const rpc = read(RPC);
const pkg = read(PKG);
const suite = read(SUITE);

assert("doc exists", fs.existsSync(DOC));
assert("slice A result exists", fs.existsSync(SLICE_A));
assert("apply result exists", fs.existsSync(APPLY));
assert("edge exists", fs.existsSync(EDGE));
assert("rpc template exists", fs.existsSync(RPC));
assert(
  "phase id",
  /discography-site-owner-authz-slice-b-planning/.test(doc),
);
assert(
  "planning complete",
  /DISCOGRAPHY_SITE_OWNER_AUTHZ_SLICE_B_PLANNING_COMPLETE:\s*true/.test(doc),
);
assert("SLICE_A_CLOSED true", /SLICE_A_CLOSED:\s*true/.test(doc));
assert(
  "CURRENT_UPDATE_AUTHZ_PATH definer rpc",
  /CURRENT_UPDATE_AUTHZ_PATH:\s*edge_can_write_site_then_definer_rpc/.test(doc),
);
assert(
  "DIRECT_TABLE_WRITE_REQUIRED false",
  /DIRECT_TABLE_WRITE_REQUIRED:\s*false/.test(doc),
);
assert("RPC_CHANGE_REQUIRED false", /RPC_CHANGE_REQUIRED:\s*false/.test(doc));
assert("RLS_CHANGE_REQUIRED false", /RLS_CHANGE_REQUIRED:\s*false/.test(doc));
assert(
  "GRANT_CHANGE_REQUIRED false",
  /GRANT_CHANGE_REQUIRED:\s*false/.test(doc),
);
assert(
  "REAL_SAVE_REQUIRED_FOR_PROOF true",
  /REAL_SAVE_REQUIRED_FOR_PROOF:\s*true/.test(doc),
);
assert(
  "READY_FOR_SLICE_B_IMPLEMENTATION false",
  /READY_FOR_SLICE_B_IMPLEMENTATION:\s*false/.test(doc),
);
assert("UI_READ_WIRING_IN_SCOPE false", /UI_READ_WIRING_IN_SCOPE:\s*false/.test(doc));
assert(
  "owner admin_users forbidden",
  /OWNER_TO_ADMIN_USERS_FORBIDDEN:\s*true/.test(doc),
);
assert("DB_WRITE_EXECUTED false", /DB_WRITE_EXECUTED:\s*false/.test(doc));
assert("MIGRATION_EXECUTED false", /MIGRATION_EXECUTED:\s*false/.test(doc));
assert(
  "CODE_IMPLEMENTATION_EXECUTED false",
  /CODE_IMPLEMENTATION_EXECUTED:\s*false/.test(doc),
);
assert("ARMS_OFF true", /ARMS_OFF:\s*true/.test(doc));
assert("PRODUCTION_UNCHANGED true", /PRODUCTION_UNCHANGED:\s*true/.test(doc));
assert("COMMIT_READY true", /COMMIT_READY:\s*true/.test(doc));
assert("STOP_REASONS none", /STOP_REASONS:\s*none/.test(doc));
assert(
  "next operational save preflight",
  /RECOMMENDED_NEXT_PHASE:\s*discography-site-owner-authz-slice-b-operational-save-preflight/.test(
    doc,
  ),
);
assert(
  "deferred UI wiring",
  /DEFERRED_FINDING:\s*discography-musician-basic-live-read-wiring-fix/.test(
    doc,
  ),
);
assert(
  "deferred postgrest update",
  /DEFERRED_POSTGREST_OWNER_UPDATE:\s*discography-site-owner-authz-postgrest-update-rls-deferred/.test(
    doc,
  ),
);
assert("HEAD recorded", /ee302fd2c949fb2c339febefea3a26a4f6e6faf5/.test(doc));
assert("staging ref", doc.includes(STAGING_REF));
assert("production STOP", doc.includes(PROD_REF));
assert("SECURITY DEFINER", /SECURITY DEFINER/.test(doc));
assert("operational RPC name", /gosaki_discography_operational_save/.test(doc));
assert("do not copy Schedule INSERT", /Why not copy Schedule INSERT-only/.test(doc));
assert("no UPDATE RLS in scope", /discography_site_writer_update/.test(doc) && /Out:/.test(doc));
assert("atomicity DELETE INSERT", /DELETE\+INSERT/.test(doc) || /DELETE then `INSERT`/.test(doc));
assert("platform admin can_write_site", /is_platform_admin/.test(doc));
assert("retain admin_all", /\*_admin_all/.test(doc) || /discography_admin_all/.test(doc));
assert("no service_role", /service_role/.test(doc));
assert("999 not for Save proof", /discography-999/.test(doc) && /Forbidden for Save proof/.test(doc));
assert("this phase no Save", /No Edge deploy · no Secret · no owner POST/.test(doc));
assert("supersedes original Slice B RLS", /supersedes that for Slice B/.test(doc));

assert("slice A CONFIRMED", /LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED:\s*true/.test(sliceA));
assert("slice A RPC_REACHED false", /RPC_REACHED:\s*false/.test(sliceA));
assert("slice A DATA_WRITE false", /DATA_WRITE:\s*false/.test(sliceA));
assert("apply WRITE_GRANTS_UNCHANGED", /WRITE_GRANTS_UNCHANGED:\s*true/.test(apply));
assert("apply UPDATE_GRANTS_CHANGED false", /UPDATE_GRANTS_CHANGED:\s*false/.test(apply));
assert("apply POLICY_COUNT 6", /POLICY_COUNT:\s*6/.test(apply));

assert("edge assertCanWriteSite", /assertCanWriteSiteForSiteSlug/.test(edge));
assert("edge operational rpc call", /client\.rpc\(OPERATIONAL_SAVE_RPC_NAME/.test(edge));
assert("edge still has controlled table update", /\.update\(\{ label:/.test(edge));
assert("rpc SECURITY DEFINER", /SECURITY DEFINER/.test(rpc));
assert("rpc can_write_site", /can_write_site\(v_site_id\)/.test(rpc));
assert("rpc no table GRANT UPDATE", /do not grant table write privileges/i.test(rpc));
assert("rpc GRANT EXECUTE authenticated", /GRANT EXECUTE[\s\S]*TO authenticated/.test(rpc));
assert("rpc UPDATE discography", /UPDATE public\.discography/.test(rpc));
assert("rpc DELETE tracks", /DELETE FROM public\.discography_tracks/.test(rpc));
assert("rpc INSERT tracks", /INSERT INTO public\.discography_tracks/.test(rpc));

if (fs.existsSync(LINKED)) {
  const linked = read(LINKED);
  assert("linked is production", linked.includes(PROD_REF));
  assert("linked is not staging", !linked.includes(STAGING_REF));
} else {
  assert("linked-project exists", false);
}

assert(
  "npm script",
  /"verify:discography-site-owner-authz-slice-b-planning"/.test(pkg),
);
assert(
  "safety suite step",
  /discography-site-owner-authz-slice-b-planning/.test(suite) &&
    /verify-discography-site-owner-authz-slice-b-planning\.mjs/.test(suite),
);

console.log("");
console.log(`passed=${passed} failed=${failed}`);
process.exit(failed > 0 ? 1 : 0);
