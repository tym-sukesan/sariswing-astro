#!/usr/bin/env node
/**
 * Offline verifier — Discography Slice A staging preflight packet.
 * npm: verify:discography-site-owner-authz-slice-a-staging-preflight
 *
 * No network / SQL apply / DB write / arm / Save.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

const DOC = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-a-staging-preflight.md",
);
const SQL = path.join(
  TOOL_ROOT,
  "scripts/supabase/gosaki-discography-site-owner-authz-slice-a-staging-preflight-select-only.sql",
);
const IMPL = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-a-implementation.md",
);
const RLS_FWD = path.join(
  TOOL_ROOT,
  "scripts/supabase/gosaki-discography-site-writer-select-rls.template.sql",
);
const RPC_FWD = path.join(
  TOOL_ROOT,
  "scripts/supabase/gosaki-discography-operational-save-rpc-can-write-site.template.sql",
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

const doc = fs.readFileSync(DOC, "utf8");
const sql = fs.readFileSync(SQL, "utf8");
const impl = fs.readFileSync(IMPL, "utf8");
const rlsFwd = fs.readFileSync(RLS_FWD, "utf8");
const rpcFwd = fs.readFileSync(RPC_FWD, "utf8");
const pkg = fs.readFileSync(PKG, "utf8");
const suite = fs.readFileSync(SUITE, "utf8");

assert("doc exists", fs.existsSync(DOC));
assert("sql packet exists", fs.existsSync(SQL));
assert(
  "phase id",
  /discography-site-owner-authz-slice-a-staging-preflight/.test(doc),
);
assert(
  "preflight complete gate",
  /DISCOGRAPHY_SITE_OWNER_AUTHZ_SLICE_A_STAGING_PREFLIGHT_COMPLETE:\s*true/.test(
    doc,
  ),
);
assert("PREFLIGHT_PASS false", /PREFLIGHT_PASS:\s*false/.test(doc));
assert(
  "SELECT packet ready",
  /PREFLIGHT_SELECT_PACKET_READY:\s*true/.test(doc),
);
assert("APPLY_PACKET_READY true", /APPLY_PACKET_READY:\s*true/.test(doc));
assert("STAGING_APPLY_READY false", /STAGING_APPLY_READY:\s*false/.test(doc));
assert("STAGING_REF_OK true", /STAGING_REF_OK:\s*true/.test(doc));
assert(
  "FORWARD_POLICIES_ABSENT unknown",
  /FORWARD_POLICIES_ABSENT:\s*unknown/.test(doc),
);
assert(
  "RPC_IS_HISTORICAL_IS_ADMIN unknown",
  /RPC_IS_HISTORICAL_IS_ADMIN:\s*unknown/.test(doc),
);
assert("OWNER_FIXTURE_READY false", /OWNER_FIXTURE_READY:\s*false/.test(doc));
assert(
  "OWNER probes unknown",
  /OWNER_CAN_WRITE_SITE:\s*unknown/.test(doc) &&
    /OWNER_IS_ADMIN:\s*unknown/.test(doc),
);
assert("SLICE_A_SCOPE_DRIFT false", /SLICE_A_SCOPE_DRIFT:\s*false/.test(doc));
assert("DB_WRITE_EXECUTED false", /DB_WRITE_EXECUTED:\s*false/.test(doc));
assert("MIGRATION_APPLIED false", /MIGRATION_APPLIED:\s*false/.test(doc));
assert(
  "catalog not executed by Cursor",
  /CATALOG_SELECT_EXECUTED_BY_CURSOR:\s*false/.test(doc),
);
assert(
  "anon rest executed",
  /ANON_REST_SELECT_EXECUTED:\s*true/.test(doc),
);
assert(
  "next result phase",
  /RECOMMENDED_NEXT_PHASE:\s*discography-site-owner-authz-slice-a-staging-preflight-result/.test(
    doc,
  ),
);
assert("HEAD recorded", /266f7b00a665d9356533975e6cfefea31a80594d/.test(doc));
assert("anon 4 albums", /discography` visible \| \*\*4\*\*/.test(doc) || /visible \| \*\*4\*\*/.test(doc));
assert("anon tracks 34", /tracks` visible \| \*\*34\*\*/.test(doc) || /\*\*34\*\*/.test(doc));
assert("do not treat is_admin as correct", /not an authz design endorsement|current value only/i.test(doc));
assert("owner JWT not PASS", /not.*JWT probe|OWNER_FIXTURE_READY:\s*false/i.test(doc));

assert("sql SELECT-only banner", /SELECT-ONLY|SELECT-only/.test(sql));
assert("sql DO NOT APPLY", /DO NOT APPLY/.test(sql));
assert("sql staging ref", /kmjqppxjdnwwrtaeqjta/.test(sql));
assert("sql prod STOP", /vsbvndwuajjhnzpohghh/.test(sql));
assert("sql forward absent check", /discography_site_writer_select/.test(sql));
assert("sql tracks writer select", /discography_tracks_site_writer_select/.test(sql));
assert("sql RPC name", /gosaki_discography_operational_save/.test(sql));
assert("sql is_admin current check", /is_admin/.test(sql));
assert("sql can_write_site helper", /can_write_site/.test(sql));
assert("sql sites singleton", /sites_gosaki|site_slug = p\.target_site_slug/.test(sql));
assert("sql no CREATE POLICY stmt", !/^\s*create\s+policy\b/im.test(sql));
assert("sql no DROP POLICY stmt", !/^\s*drop\s+policy\b/im.test(sql));
assert("sql no GRANT stmt", !/^\s*grant\b/im.test(sql));
assert("sql no REVOKE stmt", !/^\s*revoke\b/im.test(sql));
assert("sql no CREATE OR REPLACE FUNCTION", !/^\s*create\s+or\s+replace\s+function\b/im.test(sql));
assert("sql no service_role grant", !/TO\s+service_role/i.test(sql));

assert("impl doc exists", /SLICE_A_IMPLEMENTED:\s*true/.test(impl));
assert("rls fwd still select-only", /for select/.test(rlsFwd) && !/for update/i.test(rlsFwd));
assert("rpc fwd can_write_site", /can_write_site/.test(rpcFwd));

assert(
  "package.json script",
  /"verify:discography-site-owner-authz-slice-a-staging-preflight"/.test(pkg),
);
assert(
  "safety suite step",
  /discography-site-owner-authz-slice-a-staging-preflight/.test(suite) &&
    /verify-discography-site-owner-authz-slice-a-staging-preflight\.mjs/.test(
      suite,
    ),
);

console.log("");
console.log(`passed=${passed} failed=${failed}`);
process.exit(failed > 0 ? 1 : 0);
