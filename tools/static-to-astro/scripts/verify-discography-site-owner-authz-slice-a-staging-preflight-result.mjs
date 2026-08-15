#!/usr/bin/env node
/**
 * Offline verifier — Discography Slice A staging preflight result recording.
 * npm: verify:discography-site-owner-authz-slice-a-staging-preflight-result
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
  "docs/discography-site-owner-authz-slice-a-staging-preflight-result.md",
);
const PACKET = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-a-staging-preflight.md",
);
const RLS_FWD = path.join(
  TOOL_ROOT,
  "scripts/supabase/gosaki-discography-site-writer-select-rls.template.sql",
);
const RPC_FWD = path.join(
  TOOL_ROOT,
  "scripts/supabase/gosaki-discography-operational-save-rpc-can-write-site.template.sql",
);
const RPC_RB = path.join(
  TOOL_ROOT,
  "scripts/supabase/gosaki-discography-operational-save-rpc-is-admin-rollback.template.sql",
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
const packet = fs.readFileSync(PACKET, "utf8");
const rlsFwd = fs.readFileSync(RLS_FWD, "utf8");
const rpcFwd = fs.readFileSync(RPC_FWD, "utf8");
const rpcRb = fs.readFileSync(RPC_RB, "utf8");
const pkg = fs.readFileSync(PKG, "utf8");
const suite = fs.readFileSync(SUITE, "utf8");

assert("result doc exists", fs.existsSync(DOC));
assert("packet doc exists", fs.existsSync(PACKET));
assert(
  "phase id",
  /discography-site-owner-authz-slice-a-staging-preflight-result-recording/.test(
    doc,
  ),
);
assert(
  "recorded gate",
  /DISCOGRAPHY_SITE_OWNER_AUTHZ_SLICE_A_STAGING_PREFLIGHT_RESULT_RECORDED:\s*true/.test(
    doc,
  ),
);
assert("PREFLIGHT_RECORDED true", /PREFLIGHT_RECORDED:\s*true/.test(doc));
assert("CATALOG_PREFLIGHT_PASS true", /CATALOG_PREFLIGHT_PASS:\s*true/.test(doc));
assert(
  "OWNER_JWT_LIVE_PROBE_PASS true",
  /OWNER_JWT_LIVE_PROBE_PASS:\s*true/.test(doc),
);
assert("OWNER_FIXTURE_READY true", /OWNER_FIXTURE_READY:\s*true/.test(doc));
assert("OWNER_CAN_WRITE_SITE true", /OWNER_CAN_WRITE_SITE:\s*true/.test(doc));
assert("OWNER_IS_ADMIN false", /OWNER_IS_ADMIN:\s*false/.test(doc));
assert("STAGING_REF_OK true", /STAGING_REF_OK:\s*true/.test(doc));
assert("SITE_MAPPING_SAFE true", /SITE_MAPPING_SAFE:\s*true/.test(doc));
assert(
  "FORWARD_POLICIES_ABSENT true",
  /FORWARD_POLICIES_ABSENT:\s*true/.test(doc),
);
assert(
  "RPC_IS_HISTORICAL_IS_ADMIN true",
  /RPC_IS_HISTORICAL_IS_ADMIN:\s*true/.test(doc),
);
assert(
  "policy fp",
  /CURRENT_POLICY_FP:\s*2ae7c19292f2c8c5ae68f27c0fe10221/.test(doc),
);
assert(
  "grants fp",
  /CURRENT_GRANTS_FP:\s*88986aa562aad21b7defa89648288083/.test(doc),
);
assert(
  "rpc fp",
  /CURRENT_RPC_FP:\s*a04cb160099bada44a358404c9eed74c/.test(doc),
);
assert("SLICE_A_SCOPE_DRIFT false", /SLICE_A_SCOPE_DRIFT:\s*false/.test(doc));
assert("UPDATE_GRANTS_CHANGED false", /UPDATE_GRANTS_CHANGED:\s*false/.test(doc));
assert(
  "TRACK_WRITE_GRANTS_CHANGED false",
  /TRACK_WRITE_GRANTS_CHANGED:\s*false/.test(doc),
);
assert("APPLY_PACKET_READY true", /APPLY_PACKET_READY:\s*true/.test(doc));
assert("STAGING_APPLY_READY true", /STAGING_APPLY_READY:\s*true/.test(doc));
assert("COMMIT_READY true", /COMMIT_READY:\s*true/.test(doc));
assert(
  "STAGING_APPLY_EXECUTED false",
  /STAGING_APPLY_EXECUTED:\s*false/.test(doc),
);
assert("MIGRATION_APPLIED false", /MIGRATION_APPLIED:\s*false/.test(doc));
assert("DB_WRITE_EXECUTED false", /DB_WRITE_EXECUTED:\s*false/.test(doc));
assert("ARMS_OFF true", /ARMS_OFF:\s*true/.test(doc));
assert(
  "owner→admin_users forbidden",
  /OWNER_TO_ADMIN_USERS_FORBIDDEN:\s*true/.test(doc),
);
assert(
  "4321 listen recorded honestly",
  /PORT_4321_NO_LISTEN:\s*false/.test(doc) &&
    /PORT_4321_LISTEN_AT_RECORDING:\s*true/.test(doc) &&
    /PORT_4321_LISTEN_PID:\s*11341/.test(doc),
);
assert(
  "next apply phase",
  /RECOMMENDED_NEXT_PHASE:\s*discography-site-owner-authz-slice-a-staging-apply/.test(
    doc,
  ),
);
assert("HEAD recorded", /266f7b00a665d9356533975e6cfefea31a80594d/.test(doc));
assert("albums 4", /albums[\s\S]*total \*\*4\*\*/.test(doc) || /total \*\*4\*\*/.test(doc));
assert("tracks 34", /tracks[\s\S]*total \*\*34\*\*/.test(doc) || /\*\*34\*\*/.test(doc));
assert("owners_in_admin_users 0", /owners_in_admin_users[\s\S]*\*\*0\*\*/.test(doc));
assert(
  "historical is_admin not endorsement",
  /not an endorsement|current-value|current baseline only/i.test(doc),
);
assert("live probe PASS explicit", /ownerJwtProbePass[\s\S]*\*\*true\*\*/.test(doc));
assert("approval still required", /explicit operator approval/.test(doc));
assert("packet doc still historical", /PREFLIGHT_PASS:\s*false/.test(packet));

assert("rls fwd select-only", /for select/.test(rlsFwd) && !/for update/i.test(rlsFwd));
assert(
  "rls fwd create policy count 2",
  [...rlsFwd.matchAll(/^\s*create policy\s+\S+/gim)].length === 2,
);
assert(
  "rls fwd for select count 2",
  [...rlsFwd.matchAll(/^\s*for select\b/gim)].length === 2,
);
assert("rpc fwd can_write_site", /can_write_site/.test(rpcFwd));

function stripDollarBodies(sql) {
  return sql.replace(/\$\$[\s\S]*?\$\$/g, "$$BODY$$");
}

function rpcTxnWrapsDdl(sql) {
  const outer = stripDollarBodies(sql);
  const beginIdx = outer.search(/^\s*BEGIN\s*;/im);
  if (beginIdx < 0) return false;
  const afterBegin = outer.slice(beginIdx);
  const createIdx = afterBegin.search(/CREATE\s+OR\s+REPLACE\s+FUNCTION/i);
  const commentIdx = afterBegin.search(/COMMENT\s+ON\s+FUNCTION/i);
  const revokeIdx = afterBegin.search(/REVOKE\s+ALL\s+ON\s+FUNCTION/i);
  const grantIdx = afterBegin.search(/GRANT\s+EXECUTE\s+ON\s+FUNCTION/i);
  const commitIdx = afterBegin.search(/^\s*COMMIT\s*;/im);
  return (
    createIdx > 0 &&
    commentIdx > createIdx &&
    revokeIdx > commentIdx &&
    grantIdx > revokeIdx &&
    commitIdx > grantIdx
  );
}

assert("rpc fwd BEGIN/COMMIT atomic", rpcTxnWrapsDdl(rpcFwd));
assert("rpc rb BEGIN/COMMIT atomic", rpcTxnWrapsDdl(rpcRb));
assert(
  "rpc rb historical is_admin gate",
  /v_admin\s*:=\s*public\.is_admin\(\)/.test(rpcRb),
);
assert(
  "rpc rb baseline fingerprint",
  /a04cb160099bada44a358404c9eed74c/.test(rpcRb),
);
assert(
  "no table write grants",
  !/\bGRANT\s+(UPDATE|INSERT|DELETE)\b/i.test(rpcFwd) &&
    !/\bGRANT\s+(UPDATE|INSERT|DELETE)\b/i.test(rpcRb) &&
    !/\bGRANT\s+(UPDATE|INSERT|DELETE)\b/i.test(rlsFwd),
);
assert(
  "no service_role",
  !/TO\s+service_role/i.test(rpcFwd) &&
    !/TO\s+service_role/i.test(rpcRb) &&
    !/TO\s+service_role/i.test(rlsFwd),
);
assert(
  "production STOP on packets",
  /vsbvndwuajjhnzpohghh/.test(rpcFwd) &&
    /vsbvndwuajjhnzpohghh/.test(rpcRb) &&
    /vsbvndwuajjhnzpohghh/.test(rlsFwd),
);
assert(
  "rls comments no restrictive present",
  /no RESTRICTIVE slice policies/i.test(rlsFwd),
);
assert("RPC_FORWARD_ATOMIC true", /RPC_FORWARD_ATOMIC:\s*true/.test(doc));
assert("RPC_ROLLBACK_ATOMIC true", /RPC_ROLLBACK_ATOMIC:\s*true/.test(doc));
assert("RLS_SCOPE_UNCHANGED true", /RLS_SCOPE_UNCHANGED:\s*true/.test(doc));
assert("WRITE_GRANTS_UNCHANGED true", /WRITE_GRANTS_UNCHANGED:\s*true/.test(doc));
assert(
  "ROLLBACK_BASELINE_TARGET_OK true",
  /ROLLBACK_BASELINE_TARGET_OK:\s*true/.test(doc),
);

assert(
  "package.json script",
  /"verify:discography-site-owner-authz-slice-a-staging-preflight-result"/.test(
    pkg,
  ),
);
assert(
  "safety suite step",
  /discography-site-owner-authz-slice-a-staging-preflight-result/.test(suite) &&
    /verify-discography-site-owner-authz-slice-a-staging-preflight-result\.mjs/.test(
      suite,
    ),
);

console.log("");
console.log(`passed=${passed} failed=${failed}`);
process.exit(failed > 0 ? 1 : 0);
