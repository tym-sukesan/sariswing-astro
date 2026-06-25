/**
 * G-11c2 — Gosaki YouTube URL dry-run Edge Function deploy preflight verification.
 * Run: node tools/static-to-astro/scripts/verify-g11c2-gosaki-youtube-url-dry-run-edge-function-deploy-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";

const DOC_REL = "tools/static-to-astro/docs/gosaki-youtube-url-dry-run-edge-function-deploy-preflight.md";
const EDGE_INDEX_REL = "supabase/functions/gosaki-youtube-url-dry-run/index.ts";
const EDGE_SHARED_REL = "supabase/functions/_shared/gosaki-youtube-url-dry-run.ts";
const EDGE_CURRENT_REL = "supabase/functions/_shared/gosaki-youtube-staging-current.ts";
const ADMIN_AUTH_REL = "supabase/functions/_shared/admin-auth.ts";
const CONFIG_TOML_REL = "supabase/config.toml";
const ADMIN_HTML_REL =
  "tools/static-to-astro/output/static-public/gosaki-piano/public-dist/admin/index.html";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const G11C1_VERIFIER =
  "tools/static-to-astro/scripts/verify-g11c1-gosaki-youtube-url-web-save-dry-run-poc-local-prep.mjs";

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

const doc = exists(DOC_REL) ? read(DOC_REL) : "";
const indexTs = exists(EDGE_INDEX_REL) ? read(EDGE_INDEX_REL) : "";
const sharedTs = exists(EDGE_SHARED_REL) ? read(EDGE_SHARED_REL) : "";
const currentTs = exists(EDGE_CURRENT_REL) ? read(EDGE_CURRENT_REL) : "";
const adminAuth = exists(ADMIN_AUTH_REL) ? read(ADMIN_AUTH_REL) : "";
const configToml = exists(CONFIG_TOML_REL) ? read(CONFIG_TOML_REL) : "";
const adminHtml = exists(ADMIN_HTML_REL) ? read(ADMIN_HTML_REL) : "";
const combined = indexTs + sharedTs + currentTs;

assert("G-11c2 doc exists", exists(DOC_REL));
assert("G-11c2 doc phase", doc.includes("G-11c2-gosaki-youtube-url-dry-run-edge-function-deploy-preflight"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc blocks production ref as target", doc.includes(PRODUCTION_REF) && doc.includes("Blocked"));
assert("doc deploy command documented", doc.includes("supabase functions deploy gosaki-youtube-url-dry-run"));
assert("doc deploy not executed", doc.includes("NOT executed") || doc.includes("no deploy"));
assert("doc CORS policy", doc.includes("CORS"));
assert("doc rollback plan", doc.includes("Rollback"));
assert("doc no deploy until G-11c3", doc.includes("G-11c3"));

assert("deploy doc uses staging ref in command", doc.includes(`--project-ref ${STAGING_REF}`));
assert(
  "deploy doc does not target production ref in command",
  !doc.includes(`--project-ref ${PRODUCTION_REF}`),
);

assert("Edge index exists", exists(EDGE_INDEX_REL));
assert("Edge shared exists", exists(EDGE_SHARED_REL));
assert("Edge current snapshot exists", exists(EDGE_CURRENT_REL));
assert("index imports admin-auth", indexTs.includes("../_shared/admin-auth.ts"));
assert("index imports dry-run shared", indexTs.includes("../_shared/gosaki-youtube-url-dry-run.ts"));
assert("index requireAdminUser", indexTs.includes("requireAdminUser"));
assert("index OPTIONS handler", indexTs.includes('req.method === "OPTIONS"'));
assert("index Deno.serve", indexTs.includes("Deno.serve"));
assert("shared dryRun must be true", sharedTs.includes("dryRun must be true"));
assert("shared wouldWrite false", sharedTs.includes("wouldWrite: false"));
assert("shared siteSlug gosaki-piano", sharedTs.includes('G11C1_SITE_SLUG = "gosaki-piano"'));
assert("shared module youtube-embed", sharedTs.includes('G11C1_MODULE = "youtube-embed"'));
assert("shared field embedCode", sharedTs.includes('G11C1_FIELD = "embedCode"'));
assert("no createServiceClient in gosaki fn", !combined.includes("createServiceClient"));
assert("no .from( supabase query in gosaki fn", !/\.from\s*\(/.test(combined));
assert("no supabase insert/update RPC in gosaki fn", !/\.(insert|update|upsert|delete)\s*\(/i.test(combined));
assert("no service_role in gosaki fn", !/service_role/i.test(combined));
assert("no workflow_dispatch in gosaki fn", !/workflow_dispatch/i.test(combined));
assert("no FTP/mirror in gosaki fn", !/mirror\s+--delete|lftp|FileZilla/i.test(combined));
assert("no production ref in function source", !combined.includes(PRODUCTION_REF));

assert("admin-auth CORS headers defined", adminAuth.includes("corsHeaders"));
assert("admin-auth uses anon key not service role", adminAuth.includes("SUPABASE_ANON_KEY"));

assert(
  "config.toml documents gosaki fn gap in preflight doc",
  doc.includes("gosaki-youtube-url-dry-run") && doc.includes("verify_jwt"),
);

if (adminHtml) {
  assert("admin html no service_role", !/service_role/i.test(adminHtml));
  assert("admin html no GITHUB_TOKEN", !/GITHUB_TOKEN/i.test(adminHtml));
} else {
  console.log("SKIP admin html checks (package not built — run G-11c1 convert if needed)");
}

const adminDiff = spawnSync("git", ["diff", "--name-only", "--", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const adminStatus = spawnSync("git", ["status", "--short", "--", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert(
  "src/pages/admin unchanged",
  !adminDiff.stdout?.trim() && !adminStatus.stdout?.trim(),
);

console.log("");
console.log("Running G-11c1 verifier...");
const g11c1 = spawnSync("node", [path.join(REPO_ROOT, G11C1_VERIFIER)], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
if (g11c1.stdout) process.stdout.write(g11c1.stdout);
if (g11c1.stderr) process.stderr.write(g11c1.stderr);
assert("G-11c1 verifier PASS", g11c1.status === 0);

console.log("");
console.log(`G-11c2 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
