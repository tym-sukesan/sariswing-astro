#!/usr/bin/env node
/**
 * Offline verifier — Discography Slice A staging apply result recording.
 * npm: verify:discography-site-owner-authz-slice-a-staging-apply-result
 *
 * No network / SQL apply / DB write / arm / Save / Edge deploy.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

const DOC = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-a-staging-apply-result.md",
);
const SQL = path.join(
  TOOL_ROOT,
  "scripts/supabase/gosaki-discography-site-owner-authz-slice-a-staging-apply-postcheck-select-only.sql",
);
const FP_SQL = path.join(
  TOOL_ROOT,
  "scripts/supabase/gosaki-discography-site-owner-authz-slice-a-post-apply-policy-fingerprint-select-only.sql",
);
const PREFLIGHT = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-a-staging-preflight-result.md",
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
const fpSql = fs.readFileSync(FP_SQL, "utf8");
const preflight = fs.readFileSync(PREFLIGHT, "utf8");
const pkg = fs.readFileSync(PKG, "utf8");
const suite = fs.readFileSync(SUITE, "utf8");

assert("result doc exists", fs.existsSync(DOC));
assert("postcheck sql exists", fs.existsSync(SQL));
assert(
  "phase id",
  /discography-site-owner-authz-slice-a-staging-apply-result-recording/.test(doc),
);
assert(
  "recorded gate",
  /DISCOGRAPHY_SITE_OWNER_AUTHZ_SLICE_A_STAGING_APPLY_RESULT_RECORDED:\s*true/.test(
    doc,
  ),
);
assert(
  "SLICE_A_STAGING_APPLY_RECORDED true",
  /SLICE_A_STAGING_APPLY_RECORDED:\s*true/.test(doc),
);
assert("RLS_APPLY_CONFIRMED true", /RLS_APPLY_CONFIRMED:\s*true/.test(doc));
assert("RPC_REDEFINE_CONFIRMED true", /RPC_REDEFINE_CONFIRMED:\s*true/.test(doc));
assert(
  "OWNER_RPC_AUTHZ_PROBE_PASS true",
  /OWNER_RPC_AUTHZ_PROBE_PASS:\s*true/.test(doc),
);
assert(
  "STAGING_RLS_CHANGE_EXECUTED true",
  /STAGING_RLS_CHANGE_EXECUTED:\s*true/.test(doc),
);
assert(
  "STAGING_RPC_REDEFINE_EXECUTED true",
  /STAGING_RPC_REDEFINE_EXECUTED:\s*true/.test(doc),
);
assert(
  "DISCOGRAPHY_DATA_WRITE_EXECUTED false",
  /DISCOGRAPHY_DATA_WRITE_EXECUTED:\s*false/.test(doc),
);
assert("EDGE_DEPLOY_EXECUTED false", /EDGE_DEPLOY_EXECUTED:\s*false/.test(doc));
assert("REAL_SAVE_EXECUTED false", /REAL_SAVE_EXECUTED:\s*false/.test(doc));
assert("ROLLBACK_EXECUTED false", /ROLLBACK_EXECUTED:\s*false/.test(doc));
assert("POLICY_COUNT 6", /POLICY_COUNT:\s*6/.test(doc));
assert("ALBUMS_CURRENT 4", /ALBUMS_CURRENT:\s*4/.test(doc));
assert("TRACKS_CURRENT 34", /TRACKS_CURRENT:\s*34/.test(doc));
assert(
  "pre-apply policy fp retained as historical",
  /PRE_APPLY_POLICY_FP:\s*2ae7c19292f2c8c5ae68f27c0fe10221/.test(doc),
);
assert(
  "CURRENT_POLICY_FP live catalog",
  /CURRENT_POLICY_FP:\s*fa62157c08cffc8b49c38256ad8dfe26/.test(doc),
);
assert(
  "CURRENT_POLICY_FP not unmeasured in gates",
  !/CURRENT_POLICY_FP:\s*unmeasured/.test(doc),
);
assert(
  "CURRENT_POLICY_FP_RECORDED true",
  /CURRENT_POLICY_FP_RECORDED:\s*true/.test(doc),
);
assert(
  "SLICE_A_DB_BASELINE_COMPLETE true",
  /SLICE_A_DB_BASELINE_COMPLETE:\s*true/.test(doc),
);
assert(
  "CURRENT_GRANTS_FP retained",
  /CURRENT_GRANTS_FP:\s*88986aa562aad21b7defa89648288083/.test(doc),
);
assert(
  "CURRENT_RPC_FP post-apply",
  /CURRENT_RPC_FP:\s*f4d50563f2e08abcfcded8e8ade7fb3b/.test(doc),
);
assert(
  "historical RPC fp",
  /HISTORICAL_PRE_APPLY_RPC_FP:\s*a04cb160099bada44a358404c9eed74c/.test(doc),
);
assert("FORWARD_POLICIES_PRESENT true", /FORWARD_POLICIES_PRESENT:\s*true/.test(doc));
assert("RPC_HAS_CAN_WRITE_SITE true", /RPC_HAS_CAN_WRITE_SITE:\s*true/.test(doc));
assert(
  "RPC_HAS_NO_LEGACY_IS_ADMIN_CALL true",
  /RPC_HAS_NO_LEGACY_IS_ADMIN_CALL:\s*true/.test(doc),
);
assert("WRITE_GRANTS_UNCHANGED true", /WRITE_GRANTS_UNCHANGED:\s*true/.test(doc));
assert("UPDATE_GRANTS_CHANGED false", /UPDATE_GRANTS_CHANGED:\s*false/.test(doc));
assert(
  "TRACK_WRITE_GRANTS_CHANGED false",
  /TRACK_WRITE_GRANTS_CHANGED:\s*false/.test(doc),
);
assert("SLICE_A_SCOPE_DRIFT false", /SLICE_A_SCOPE_DRIFT:\s*false/.test(doc));
assert(
  "catalog not executed by Cursor",
  /CATALOG_SELECT_EXECUTED_BY_CURSOR:\s*false/.test(doc),
);
assert("anon rest executed", /ANON_REST_SELECT_EXECUTED:\s*true/.test(doc));
assert("PORT_4321_NO_LISTEN true", /PORT_4321_NO_LISTEN:\s*true/.test(doc));
assert("ARMS_OFF true", /ARMS_OFF:\s*true/.test(doc));
assert("PRODUCTION_UNCHANGED true", /PRODUCTION_UNCHANGED:\s*true/.test(doc));
assert(
  "owner not added to admin_users",
  /OWNER_ADDED_TO_ADMIN_USERS:\s*false/.test(doc),
);
assert("COMMIT_READY true", /COMMIT_READY:\s*true/.test(doc));
assert(
  "next edge deploy",
  /RECOMMENDED_NEXT_PHASE:\s*discography-site-owner-authz-slice-a-edge-deploy/.test(
    doc,
  ),
);
assert("HEAD recorded", /2cec8be41794566f87bbbf4f6f2f6686e0c0abc4/.test(doc));
assert("legacy_id_mismatch probe", /legacy_id_mismatch/.test(doc));
assert("rpcHttpStatus 400", /rpcHttpStatus[\s\S]*\*\*400\*\*/.test(doc));
assert("ownerRpcAuthzProbePass true", /ownerRpcAuthzProbePass[\s\S]*\*\*true\*\*/.test(doc));
assert("anon albums 4", /discography` visible \| \*\*4\*\*/.test(doc));
assert("anon tracks 34", /discography_tracks` visible \| \*\*34\*\*/.test(doc));
assert("preflight historical apply not executed", /STAGING_APPLY_EXECUTED:\s*false/.test(preflight));

assert("sql SELECT-only banner", /SELECT-ONLY|SELECT-only/.test(sql));
assert("sql DO NOT APPLY", /DO NOT APPLY/.test(sql));
assert("sql staging ref", /kmjqppxjdnwwrtaeqjta/.test(sql));
assert("sql prod STOP", /vsbvndwuajjhnzpohghh/.test(sql));
assert("sql expected rpc md5", /f4d50563f2e08abcfcded8e8ade7fb3b/.test(sql));
assert("sql historical rpc md5", /a04cb160099bada44a358404c9eed74c/.test(sql));
assert("sql expected grants fp", /88986aa562aad21b7defa89648288083/.test(sql));
assert("sql expected policy count 6", /expected_policy_count/.test(sql) && /6::int AS expected_policy_count/.test(sql));
assert("sql forward present check", /forward_policies_present/.test(sql));
assert("sql no CREATE POLICY stmt", !/^\s*create\s+policy\b/im.test(sql));
assert("sql no DROP POLICY stmt", !/^\s*drop\s+policy\b/im.test(sql));
assert("sql no GRANT stmt", !/^\s*grant\b/im.test(sql));
assert("sql no REVOKE stmt", !/^\s*revoke\b/im.test(sql));
assert("sql no CREATE OR REPLACE FUNCTION", !/^\s*create\s+or\s+replace\s+function\b/im.test(sql));
assert("sql no service_role grant", !/TO\s+service_role/i.test(sql));

assert("fp sql exists", fs.existsSync(FP_SQL));
assert("fp sql SELECT-only", /SELECT-ONLY|SELECT-only/.test(fpSql));
assert("fp sql same md5 canonicalization",
  /md5\(string_agg\(\s*tablename \|\| '\|' \|\| policyname \|\| '\|' \|\| cmd \|\| '\|' \|\| coalesce\(qual, ''\) \|\| '\|' \|\| coalesce\(with_check, ''\),\s*E'\\n' ORDER BY tablename, policyname\s*\)\)/.test(
    fpSql.replace(/\s+/g, " "),
  ) || /tablename \|\| '\|' \|\| policyname \|\| '\|' \|\| cmd \|\| '\|' \|\| coalesce\(qual, ''\) \|\| '\|' \|\| coalesce\(with_check, ''\)/.test(fpSql),
);
assert("fp sql pre-apply historical", /2ae7c19292f2c8c5ae68f27c0fe10221/.test(fpSql));
assert("fp sql no GRANT stmt", !/^\s*grant\b/im.test(fpSql));
assert("fp sql no CREATE POLICY", !/^\s*create\s+policy\b/im.test(fpSql));
assert("must_differ_from_pre_apply true", /must_differ_from_pre_apply[\s\S]*\*\*true\*\*/.test(doc));
assert("live fp in doc section", /fa62157c08cffc8b49c38256ad8dfe26/.test(doc));

assert(
  "package.json script",
  /"verify:discography-site-owner-authz-slice-a-staging-apply-result"/.test(pkg),
);
assert(
  "safety suite step",
  /discography-site-owner-authz-slice-a-staging-apply-result/.test(suite) &&
    /verify-discography-site-owner-authz-slice-a-staging-apply-result\.mjs/.test(
      suite,
    ),
);

console.log("");
console.log(`passed=${passed} failed=${failed}`);
process.exit(failed > 0 ? 1 : 0);
