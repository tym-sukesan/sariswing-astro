#!/usr/bin/env node
/**
 * Offline verifier — CMS Core v2 Schedule site-owner authz + site-writer RLS template.
 * npm: verify:cms-core-v2-schedule-site-owner-authz-rls-implementation
 *
 * No network / SQL apply / DB write / arm / Save.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

const DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-site-owner-authz-rls-implementation.md",
);
const SAVE = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-write/gosaki-schedule-tbd-create-oneshot-save.ts",
);
const GUARDS = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-write/gosaki-schedule-tbd-create-oneshot-guards.ts",
);
const RLS_FWD = path.join(
  TOOL_ROOT,
  "scripts/supabase/cms-core-v2-schedules-site-writer-rls.template.sql",
);
const RLS_RB = path.join(
  TOOL_ROOT,
  "scripts/supabase/cms-core-v2-schedules-site-writer-rls-rollback.template.sql",
);
const PKG = path.join(TOOL_ROOT, "package.json");
const SUITE = path.join(TOOL_ROOT, "scripts/run-cms-core-v2-safety-suite.mjs");
const IMPL_DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-implementation.md",
);
const FINAL_DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-final-preflight.md",
);

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
const save = fs.readFileSync(SAVE, "utf8");
const guards = fs.readFileSync(GUARDS, "utf8");
const rlsFwd = fs.readFileSync(RLS_FWD, "utf8");
const rlsRb = fs.readFileSync(RLS_RB, "utf8");
const pkg = fs.readFileSync(PKG, "utf8");
const suite = fs.readFileSync(SUITE, "utf8");
const implDoc = fs.readFileSync(IMPL_DOC, "utf8");
const finalDoc = fs.readFileSync(FINAL_DOC, "utf8");

assert("doc exists", fs.existsSync(DOC));
assert(
  "phase id",
  /cms-core-v2-schedule-site-owner-authz-implementation-and-migration-template/.test(
    doc,
  ),
);
assert("OWNER_ADMIN_DISTINCT true", /OWNER_ADMIN_DISTINCT:\s*true/.test(doc));
assert("SCHEDULE_SITE_MAPPING_SAFE true", /SCHEDULE_SITE_MAPPING_SAFE:\s*true/.test(doc));
assert("SITE_WRITER_RLS_TEMPLATE_CREATED true", /SITE_WRITER_RLS_TEMPLATE_CREATED:\s*true/.test(doc));
assert("SITE_WRITER_RLS_APPLIED true", /SITE_WRITER_RLS_APPLIED:\s*true/.test(doc));
assert(
  "current RLS fingerprint",
  /CURRENT_STAGING_SCHEDULES_RLS_FINGERPRINT:\s*3f6c87dda8edf44159d939ec69fbcc2b/.test(doc),
);
assert(
  "historical pre-apply RLS fingerprint retained",
  /PRE_SITE_WRITER_RLS_FINGERPRINT_HISTORICAL:\s*e7344ff0de1d5e2862965ffc0e4e72cf/.test(doc),
);
assert("POLICY_COUNT 4", /POLICY_COUNT:\s*4/.test(doc));
assert("OWNER_VISIBILITY_PASS true", /OWNER_VISIBILITY_PASS:\s*true/.test(doc));
assert("ANON_VISIBILITY_PASS true", /ANON_VISIBILITY_PASS:\s*true/.test(doc));
assert("CAN_WRITE_SITE_PASS true", /CAN_WRITE_SITE_PASS:\s*true/.test(doc));
assert("READY_FOR_RETRY false", /READY_FOR_RETRY:\s*false/.test(doc));
assert("SCHEDULE_ROW_WRITE_EXECUTED true", /SCHEDULE_ROW_WRITE_EXECUTED:\s*true/.test(doc));
assert("DB_WRITE_EXECUTED true", /DB_WRITE_EXECUTED:\s*true/.test(doc));
assert("ACTUAL_WRITE_EXECUTED true", /ACTUAL_WRITE_EXECUTED:\s*true/.test(doc));
assert("TARGET_ROW_EXISTS false", /TARGET_ROW_EXISTS:\s*false/.test(doc));
assert("CURRENT_TOTAL 79", /CURRENT_TOTAL:\s*79/.test(doc));
assert("oneshot success recorded", /CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_SUCCESS_RECORDED:\s*true/.test(doc));
assert(
  "post-success baseline recorded",
  /CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_POST_SUCCESS_BASELINE_RECORDED:\s*true/.test(
    doc,
  ) &&
    /POST_SUCCESS_SITE_SLUG_FP:\s*1d780b234483e3c860a66cec93311718/.test(doc),
);
assert(
  "cleanup recorded",
  /CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_CLEANUP_RECORDED:\s*true/.test(doc) &&
    /CLEANUP_EXECUTED:\s*true/.test(doc) &&
    /DATA_BASELINE_RESTORED:\s*true/.test(doc),
);
assert("baseline 79/74 historical", /Pre-apply baseline[\s\S]*total\s*\*\*79\*\*/.test(doc) && /published\s*\*\*74\*\*/.test(doc));
assert("owner ≠ legacy admin", /owner ≠ legacy|Owner ≠ legacy|do not conflate|OWNER_ADMIN_DISTINCT/i.test(doc));
assert("apply result doc referenced", /cms-core-v2-schedules-site-writer-rls-apply-result/.test(doc));
assert("success result doc referenced", /cms-core-v2-schedule-tbd-create-oneshot-success-result/.test(doc));

assert(
  "save can_write_site RPC",
  /rpc\(\s*"can_write_site"\s*,\s*\{\s*p_site_id/.test(save),
);
assert("save sites resolve", /from\(\s*"sites"\s*\)/.test(save));
assert("save auth_site_write_required", /auth_site_write_required/.test(save));
assert("save auth_site_resolve_failed", /auth_site_resolve_failed/.test(save));
assert(
  "save no is_admin RPC gate",
  !/rpc\(\s*["']is_admin["']\s*\)/.test(save) && !/auth_admin_required/.test(save),
);
assert("expected total 79", /totalSchedules:\s*79/.test(guards));
assert("expected total not 74", !/totalSchedules:\s*74/.test(guards));

function stripSqlComments(sql) {
  return sql
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

const rlsFwdBody = stripSqlComments(rlsFwd);
assert("forward template exists", fs.existsSync(RLS_FWD));
assert("rollback template exists", fs.existsSync(RLS_RB));
assert("forward no DROP POLICY", !/drop\s+policy/i.test(rlsFwdBody));
assert(
  "forward creates both writer policies",
  /create policy schedules_site_writer_select/i.test(rlsFwd) &&
    /create policy schedules_site_writer_insert/i.test(rlsFwd),
);
assert(
  "forward uses can_write_site(site_row.id)",
  /can_write_site\(\s*site_row\.id\s*\)/.test(rlsFwd),
);
assert(
  "forward no gosaki hardcode in policy",
  !/site_slug\s*=\s*'gosaki-piano'/i.test(rlsFwdBody),
);
assert("forward no UPDATE/DELETE", !/for\s+update/i.test(rlsFwdBody) && !/for\s+delete/i.test(rlsFwdBody));
assert(
  "rollback only writer drops",
  /drop policy if exists schedules_site_writer_select/i.test(rlsRb) &&
    /drop policy if exists schedules_site_writer_insert/i.test(rlsRb) &&
    !/drop policy if exists schedules_public_select/i.test(rlsRb) &&
    !/drop policy if exists schedules_admin_all/i.test(rlsRb),
);

assert(
  "impl doc records site owner authz",
  /SITE_OWNER_AUTHZ|can_write_site|site-scoped/i.test(implDoc),
);
assert(
  "final-preflight records site owner authz + applied RLS",
  /can_write_site|site owner|SITE_OWNER/i.test(finalDoc) &&
    /SITE_WRITER_RLS_APPLIED:\s*true/.test(finalDoc) &&
    /3f6c87dda8edf44159d939ec69fbcc2b/.test(finalDoc) &&
    /READY_FOR_RETRY:\s*false/.test(finalDoc),
);

assert(
  "npm script registered",
  /verify:cms-core-v2-schedule-site-owner-authz-rls-implementation/.test(pkg),
);
assert(
  "Safety Suite registers site-owner authz",
  /schedule-site-owner-authz-rls-implementation/.test(suite),
);

const impl = spawnSync(
  process.execPath,
  [
    path.join(
      TOOL_ROOT,
      "scripts/verify-cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-implementation.mjs",
    ),
  ],
  { cwd: TOOL_ROOT, encoding: "utf8" },
);
assert(
  "nested implementation verifier exit 0",
  impl.status === 0,
  (impl.stderr || impl.stdout || "").slice(-800),
);

console.log(`RESULT ${failed === 0 ? "PASS" : "FAIL"} passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
