/**
 * G-11c4c — Gosaki staging admin authorization preflight (403 dry-run).
 * Run: node tools/static-to-astro/scripts/verify-g11c4c-admin-authorization-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";

const DOC_REL = "tools/static-to-astro/docs/gosaki-staging-admin-authorization-preflight.md";
const ADMIN_AUTH_REL = "supabase/functions/_shared/admin-auth.ts";
const EDGE_INDEX_REL = "supabase/functions/gosaki-youtube-url-dry-run/index.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

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

const doc = read(DOC_REL);
const adminAuth = read(ADMIN_AUTH_REL);
const edgeIndex = read(EDGE_INDEX_REL);

assert("G-11c4c doc exists", exists(DOC_REL));
assert("doc phase", doc.includes("G-11c4c-admin-authorization-preflight"));
assert("doc 403 root cause", doc.includes("isAdminUser") && doc.includes("403"));
assert("doc E2E interpretation", doc.includes("admin authorization: NG"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc blocks production ref in commands", !doc.includes(`--project-ref ${PRODUCTION_REF}`));
assert("doc ADMIN_EMAILS recommended", doc.includes("ADMIN_EMAILS"));
assert("doc app_metadata comparison", doc.includes("app_metadata.role"));
assert("doc no redeploy for secret only", doc.includes("not required") || doc.includes("**No**"));
assert("doc secrets set documented not executed", doc.includes("NOT executed"));
assert("doc next phase G-11c4d", doc.includes("G-11c4d"));
assert("doc no real email in examples", !/@(?!example\.com)[a-z0-9.-]+\.[a-z]{2,}/i.test(doc.replace(/example\.com/g, "")));

assert("admin-auth isAdminUser", adminAuth.includes("export function isAdminUser"));
assert("admin-auth app_metadata role", adminAuth.includes('app_metadata?.role === "admin"'));
assert("admin-auth ADMIN_EMAILS", adminAuth.includes('Deno.env.get("ADMIN_EMAILS")'));
assert("admin-auth 403 detail", adminAuth.includes("Admin access required"));
assert("admin-auth empty allowlist false", adminAuth.includes("allowlist.size === 0"));
assert("admin-auth no service_role", !/service_role/i.test(adminAuth));

assert("edge requireAdminUser before handler", edgeIndex.includes("requireAdminUser"));
assert("edge admin before dry-run body", edgeIndex.indexOf("requireAdminUser") < edgeIndex.indexOf("handleG11c1"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "--", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", !adminDiff.stdout?.trim());

console.log("");
console.log(`G-11c4c verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
