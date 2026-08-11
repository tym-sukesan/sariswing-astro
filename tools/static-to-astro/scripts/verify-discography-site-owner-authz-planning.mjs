#!/usr/bin/env node
/**
 * Offline verifier — Discography site-owner authz planning.
 * npm: verify:discography-site-owner-authz-planning
 *
 * No network / SQL apply / DB write / arm / Save / code mutation checks beyond docs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

const DOC = path.join(TOOL_ROOT, "docs/discography-site-owner-authz-planning.md");
const AUDIT = path.join(
  TOOL_ROOT,
  "docs/cross-module-owner-authz-consistency-audit.md",
);
const ADR = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-minimal-architecture-decision.md",
);
const EDGE = path.join(
  REPO_ROOT,
  "supabase/functions/gosaki-discography-save-dry-run/handler.ts",
);
const RPC = path.join(
  REPO_ROOT,
  "supabase/migrations/20260721100000_gosaki_discography_operational_save_rpc.sql",
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

assert("doc exists", fs.existsSync(DOC));
assert("audit exists", fs.existsSync(AUDIT));
assert("ADR exists", fs.existsSync(ADR));
assert("Edge handler exists", fs.existsSync(EDGE));
assert("operational RPC migration exists", fs.existsSync(RPC));

const doc = fs.readFileSync(DOC, "utf8");
const audit = fs.readFileSync(AUDIT, "utf8");
const edge = fs.readFileSync(EDGE, "utf8");
const rpc = fs.readFileSync(RPC, "utf8");
const pkg = fs.readFileSync(PKG, "utf8");
const suite = fs.readFileSync(SUITE, "utf8");

assert(
  "phase id",
  /discography-site-owner-authz-planning/.test(doc),
);
assert(
  "planning complete gate",
  /DISCOGRAPHY_SITE_OWNER_AUTHZ_PLANNING_COMPLETE:\s*true/.test(doc),
);
assert(
  "CURRENT_AUTHZ_PATH legacy",
  /CURRENT_AUTHZ_PATH:\s*legacy_is_admin/.test(doc),
);
assert(
  "TARGET_AUTHZ_PATH can_write_site",
  /TARGET_AUTHZ_PATH:\s*sites_resolve_can_write_site_site_scoped_rls/.test(doc),
);
assert("MIGRATION_REQUIRED true", /MIGRATION_REQUIRED:\s*true/.test(doc));
assert("IMPLEMENTATION_READY true", /IMPLEMENTATION_READY:\s*true/.test(doc));
assert(
  "owner→admin_users forbidden",
  /OWNER_TO_ADMIN_USERS_FORBIDDEN:\s*true/.test(doc) &&
    /add site owners to `admin_users`/i.test(doc),
);
assert("DB_WRITE_EXECUTED false", /DB_WRITE_EXECUTED:\s*false/.test(doc));
assert("MIGRATION_EXECUTED false", /MIGRATION_EXECUTED:\s*false/.test(doc));
assert(
  "CODE_IMPLEMENTATION_EXECUTED false",
  /CODE_IMPLEMENTATION_EXECUTED:\s*false/.test(doc),
);
assert("ARMS_OFF true", /ARMS_OFF:\s*true/.test(doc));
assert(
  "next phase implementation-template",
  /RECOMMENDED_NEXT_PHASE:\s*discography-site-owner-authz-implementation-and-migration-template/.test(
    doc,
  ),
);
assert(
  "HEAD recorded",
  /6240be7a0a853c671d7ce6affd3041ea08755bad/.test(doc),
);
assert(
  "album+tracks called out",
  /discography_tracks/.test(doc) && /DELETE\+INSERT|track \*\*replace\*\*|tracks replace/i.test(doc),
);
assert(
  "Slice A/B/C strategy",
  /Slice A/.test(doc) && /Slice B/.test(doc) && /writer SELECT/.test(doc),
);
assert(
  "not copy Schedule blindly",
  /Do not.*copy Schedule|not copy Schedule|Why not copy Schedule/i.test(doc),
);
assert(
  "staging test plan section",
  /## 9\. STAGING_TEST_PLAN/.test(doc) || /STAGING_TEST_PLAN/.test(doc),
);
assert(
  "rollback plan section",
  /## 10\. ROLLBACK_PLAN/.test(doc) || /ROLLBACK_PLAN/.test(doc),
);
assert(
  "audit Discography LEGACY",
  /DISCOGRAPHY_STATUS:\s*LEGACY/.test(audit),
);

assert(
  "Edge still is_admin gate (pre-implementation)",
  /assertOperatorIsAdmin/.test(edge) && /rpc\("is_admin"\)/.test(edge),
);
assert(
  "Edge has no can_write_site yet",
  !/can_write_site/.test(edge),
);
assert(
  "RPC still is_admin gate (pre-implementation)",
  /public\.is_admin\(\)/.test(rpc) && /admin_required/.test(rpc),
);
assert(
  "RPC SECURITY DEFINER",
  /SECURITY DEFINER/.test(rpc),
);
assert(
  "RPC track replace DELETE",
  /DELETE FROM public\.discography_tracks/.test(rpc),
);

assert(
  "package.json script registered",
  /"verify:discography-site-owner-authz-planning"/.test(pkg),
);
assert(
  "safety suite step registered",
  /discography-site-owner-authz-planning/.test(suite) &&
    /verify-discography-site-owner-authz-planning\.mjs/.test(suite),
);

console.log("");
console.log(`passed=${passed} failed=${failed}`);
process.exit(failed > 0 ? 1 : 0);
