#!/usr/bin/env node
/**
 * Offline verifier — Discography Slice A Edge deploy preflight.
 * npm: verify:discography-site-owner-authz-slice-a-edge-deploy-preflight
 *
 * No network / SQL / DB write / arm / Save / Edge deploy / Secrets mutate.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

const DOC = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-a-edge-deploy-preflight.md",
);
const APPLY = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-a-staging-apply-result.md",
);
const EDGE_DIR = path.join(
  REPO_ROOT,
  "supabase/functions/gosaki-discography-save-dry-run",
);
const EDGE_HANDLER = path.join(EDGE_DIR, "handler.ts");
const EDGE_INDEX = path.join(EDGE_DIR, "index.ts");
const MIRROR_HANDLER = path.join(
  TOOL_ROOT,
  "scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts",
);
const MIRROR_INDEX = path.join(
  TOOL_ROOT,
  "scripts/edge-functions/gosaki-discography-save-dry-run/index.ts",
);
const CONFIG = path.join(REPO_ROOT, "supabase/config.toml");
const LINKED = path.join(REPO_ROOT, "supabase/.temp/linked-project.json");
const PKG = path.join(TOOL_ROOT, "package.json");
const SUITE = path.join(TOOL_ROOT, "scripts/run-cms-core-v2-safety-suite.mjs");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const DEPLOY_CMD =
  "supabase functions deploy gosaki-discography-save-dry-run --project-ref kmjqppxjdnwwrtaeqjta";

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
  ["apply result", APPLY],
  ["edge handler", EDGE_HANDLER],
  ["edge index", EDGE_INDEX],
  ["mirror handler", MIRROR_HANDLER],
  ["mirror index", MIRROR_INDEX],
  ["config.toml", CONFIG],
  ["package.json", PKG],
  ["safety suite", SUITE],
]) {
  assert(`${label} exists`, fs.existsSync(p));
}

const doc = read(DOC);
const apply = read(APPLY);
const handler = read(EDGE_HANDLER);
const index = read(EDGE_INDEX);
const mirrorHandler = read(MIRROR_HANDLER);
const mirrorIndex = read(MIRROR_INDEX);
const config = read(CONFIG);
const pkg = read(PKG);
const suite = read(SUITE);

assert(
  "phase id",
  /discography-site-owner-authz-slice-a-edge-deploy-preflight/.test(doc),
);
assert("EDGE_PREFLIGHT_PASS true", /EDGE_PREFLIGHT_PASS:\s*true/.test(doc));
assert(
  "FUNCTION_NAME",
  /FUNCTION_NAME:\s*gosaki-discography-save-dry-run/.test(doc),
);
assert(
  "FUNCTION_SOURCE_PATH",
  /FUNCTION_SOURCE_PATH:\s*supabase\/functions\/gosaki-discography-save-dry-run\//.test(
    doc,
  ),
);
assert(
  "HANDLER_MIRROR_IN_SYNC true",
  /HANDLER_MIRROR_IN_SYNC:\s*true/.test(doc),
);
assert(
  "INDEX_MIRROR_IN_SYNC false",
  /INDEX_MIRROR_IN_SYNC:\s*false/.test(doc),
);
assert("MIRROR_IN_SYNC false", /MIRROR_IN_SYNC:\s*false/.test(doc));
assert(
  "EDGE_AUTHZ_CAN_WRITE_SITE true",
  /EDGE_AUTHZ_CAN_WRITE_SITE:\s*true/.test(doc),
);
assert(
  "LEGACY_IS_ADMIN_EDGE_GATE_PRESENT false",
  /LEGACY_IS_ADMIN_EDGE_GATE_PRESENT:\s*false/.test(doc),
);
assert("CALLER_JWT_PRESERVED true", /CALLER_JWT_PRESERVED:\s*true/.test(doc));
assert("SERVICE_ROLE_USED false", /SERVICE_ROLE_USED:\s*false/.test(doc));
assert("NEW_SECRETS_REQUIRED false", /NEW_SECRETS_REQUIRED:\s*false/.test(doc));
assert("SECRETS_CHANGED false", /SECRETS_CHANGED:\s*false/.test(doc));
assert(
  "deploy command locked",
  doc.includes(DEPLOY_CMD) &&
    /DEPLOY_COMMAND:\s*supabase functions deploy gosaki-discography-save-dry-run --project-ref kmjqppxjdnwwrtaeqjta/.test(
      doc,
    ),
);
assert(
  "deploy command has staging ref",
  DEPLOY_CMD.includes(STAGING_REF),
);
assert(
  "deploy command has no production ref",
  !DEPLOY_CMD.includes(PROD_REF),
);
assert(
  "NON_MUTATING_POST_DEPLOY_PROBE_READY true",
  /NON_MUTATING_POST_DEPLOY_PROBE_READY:\s*true/.test(doc),
);
assert(
  "LIVE_EDGE_SLICE_A_AUTHZ_CONFIRMED false",
  /LIVE_EDGE_SLICE_A_AUTHZ_CONFIRMED:\s*false/.test(doc),
);
assert(
  "LIVE_EDGE_CAN_WRITE_SITE_UNCONFIRMED true",
  /LIVE_EDGE_CAN_WRITE_SITE_UNCONFIRMED:\s*true/.test(doc),
);
assert("STOP_REASONS none", /STOP_REASONS:\s*none/.test(doc));
assert(
  "STAGING_EDGE_DEPLOY_READY true",
  /STAGING_EDGE_DEPLOY_READY:\s*true/.test(doc),
);
assert("EDGE_DEPLOY_EXECUTED false", /EDGE_DEPLOY_EXECUTED:\s*false/.test(doc));
assert(
  "DISCOGRAPHY_DATA_WRITE_EXECUTED false",
  /DISCOGRAPHY_DATA_WRITE_EXECUTED:\s*false/.test(doc),
);
assert("REAL_SAVE_EXECUTED false", /REAL_SAVE_EXECUTED:\s*false/.test(doc));
assert("ARMS_OFF true", /ARMS_OFF:\s*true/.test(doc));
assert(
  "OWNER_ADDED_TO_ADMIN_USERS false",
  /OWNER_ADDED_TO_ADMIN_USERS:\s*false/.test(doc),
);
assert("PRODUCTION_UNCHANGED true", /PRODUCTION_UNCHANGED:\s*true/.test(doc));
assert(
  "next phase edge deploy",
  /RECOMMENDED_NEXT_PHASE:\s*discography-site-owner-authz-slice-a-edge-deploy/.test(
    doc,
  ),
);
assert("HEAD recorded", /b435a9e5d16bc5ecbbbd85b4c7127a77088225c3/.test(doc));
assert("live VERSION 46 recorded", /VERSION(?:\s*\||:)\s*\*\*46\*\*/.test(doc));
assert(
  "do not treat live as can_write_site",
  /Do \*\*not\*\* treat live Edge as already `can_write_site`/.test(doc),
);

assert(
  "apply result still EDGE_DEPLOY_EXECUTED false",
  /EDGE_DEPLOY_EXECUTED:\s*false/.test(apply),
);

assert("handler assertCanWriteSiteForSiteSlug", /assertCanWriteSiteForSiteSlug/.test(handler));
assert(
  "handler can_write_site rpc",
  /rpc\(\s*["']can_write_site["']\s*,\s*\{\s*p_site_id/.test(handler),
);
assert("handler no assertOperatorIsAdmin", !/assertOperatorIsAdmin/.test(handler));
assert("handler no is_admin rpc", !/\.rpc\(\s*["']is_admin["']\s*\)/.test(handler));
assert("handler site_resolve_ambiguous", /site_resolve_ambiguous/.test(handler));
assert("handler can_write_site_denied", /can_write_site_denied/.test(handler));
assert(
  "handler createUserJwtSupabaseClient Authorization",
  /createUserJwtSupabaseClient/.test(handler) &&
    /global:\s*\{\s*headers:\s*\{\s*Authorization/.test(handler),
);
assert(
  "handler staging ref constant",
  handler.includes(`STAGING_PROJECT_REF = "${STAGING_REF}"`),
);
assert(
  "handler production STOP constant",
  handler.includes(`PRODUCTION_REF_STOP = "${PROD_REF}"`),
);
assert(
  "handler service_role not connected",
  /SUPABASE_SERVICE_ROLE_CONNECTED = false/.test(handler),
);
assert(
  "handler no SERVICE_ROLE_KEY env",
  !/SUPABASE_SERVICE_ROLE_KEY/.test(handler) &&
    !/SUPABASE_SERVICE_ROLE_KEY/.test(index),
);
assert(
  "handler operational RPC after can_write_site",
  /handleOperationalDiscographySaveHttp[\s\S]*assertCanWriteSiteForSiteSlug[\s\S]*client\.rpc\(OPERATIONAL_SAVE_RPC_NAME/.test(
    handler,
  ),
);
assert(
  "handler arm exact true",
  /SAVE_ARMED_ENV = "GOSAKI_DISCOGRAPHY_SAVE_ARMED"/.test(handler) &&
    /getEnv\(SAVE_ARMED_ENV\) === "true"/.test(handler),
);
assert(
  "handler arm checked first on operational save",
  /handleOperationalDiscographySaveHttp[\s\S]*isDiscographySaveArmed[\s\S]*createUserJwtSupabaseClient/.test(
    handler,
  ),
);
assert(
  "index forwards Authorization",
  /authorizationHeader = req\.headers\.get\("authorization"\)/.test(index) &&
    /handleDiscographyEdgeDryRunHttpAsync/.test(index),
);
assert("index staging comment", index.includes(STAGING_REF));
assert("index no production deploy target", !index.includes(PROD_REF));

assert("handler mirror byte-eq", handler === mirrorHandler);
assert("index mirror not byte-eq", index !== mirrorIndex);

assert(
  "config.toml has no gosaki-discography-save-dry-run block",
  !/\[functions\.gosaki-discography-save-dry-run\]/.test(config),
);

if (fs.existsSync(LINKED)) {
  const linked = read(LINKED);
  assert(
    "linked-project is production (hazard recorded)",
    linked.includes(PROD_REF) && doc.includes("linked-project.json"),
  );
  assert(
    "linked-project is not staging",
    !linked.includes(STAGING_REF),
  );
} else {
  assert("linked-project exists", false, "missing supabase/.temp/linked-project.json");
}

assert(
  "npm script",
  /"verify:discography-site-owner-authz-slice-a-edge-deploy-preflight"/.test(pkg),
);
assert(
  "safety suite step",
  /verify-discography-site-owner-authz-slice-a-edge-deploy-preflight\.mjs/.test(
    suite,
  ),
);

assert("doc forbids Cursor deploy", /Cursor must \*\*not\*\* run `supabase functions deploy`/.test(doc));
assert("doc forbids arm ON first probe", /must keep arm off/.test(doc));
assert("doc rollback VERSION 46", /VERSION \*\*46\*\*/.test(doc));
assert("doc correlated rollback commit", /87ffe0ec/.test(doc));

if (failed > 0) {
  console.error(`\nFAILED ${failed} / ${passed + failed}`);
  process.exit(1);
}
console.log(`\nALL PASS ${passed}`);
