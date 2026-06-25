/**
 * G-11c4d — Gosaki staging ADMIN_EMAILS secret + YouTube dry-run E2E result.
 * Run: node tools/static-to-astro/scripts/verify-g11c4d-gosaki-staging-admin-emails-secret-and-youtube-dry-run-e2e-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-staging-admin-emails-secret-and-youtube-dry-run-e2e-result.md";
const ADMIN_AUTH_REL = "supabase/functions/_shared/admin-auth.ts";
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

assert("G-11c4d doc exists", exists(DOC_REL));
assert("doc phase", doc.includes("G-11c4d-gosaki-staging-admin-emails-secret-and-youtube-dry-run-e2e-result"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc blocks production ref in commands", !doc.includes(`--project-ref ${PRODUCTION_REF}`));
assert("doc production not touched", doc.includes("not touched") || doc.includes("not used"));
assert("doc ADMIN_EMAILS secret set success", doc.includes("ADMIN_EMAILS") && doc.includes("**yes**"));
assert("doc secrets set count once", doc.includes("once") || doc.includes("Count") && doc.includes("**1**"));
assert("doc same URL dry-run 200 no_change", doc.includes("no_change") && doc.includes("**200**"));
assert("doc different URL changedFields", doc.includes('["embedCode", "videoId"]'));
assert("doc wouldWrite false", doc.includes("wouldWrite") && doc.includes("**false**"));
assert("doc dryRun true", doc.includes("dryRun") && doc.includes("**true**"));
assert("doc no DB write", doc.includes("DB") && (doc.includes("**none**") || doc.includes("**no**")));
assert("doc no JSON write", doc.includes("JSON") && (doc.includes("**none**") || doc.includes("**no**")));
assert("doc no workflow_dispatch", doc.includes("workflow_dispatch") && doc.includes("**no**"));
assert("doc no FTP upload", doc.includes("FTP") && doc.includes("**no**"));
assert("doc no functions deploy re-run", doc.includes("supabase functions deploy") && doc.includes("**no**"));
assert("doc admin authorization OK", doc.includes("admin authorization: OK") || doc.includes("authorization") && doc.includes("**OK**"));
assert("doc next phase G-11c5", doc.includes("G-11c5"));
assert(
  "doc no real email in body",
  !/@(?!example\.com|staging-admin-email)[a-z0-9.-]+\.[a-z]{2,}/i.test(
    doc.replace(/example\.com/g, "").replace(/staging-admin-email/g, ""),
  ),
);

assert("admin-auth ADMIN_EMAILS env", adminAuth.includes('Deno.env.get("ADMIN_EMAILS")'));
assert("admin-auth no service_role", !/service_role/i.test(adminAuth));

const adminDiff = spawnSync("git", ["diff", "--name-only", "--", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", !adminDiff.stdout?.trim());

console.log("");
console.log(`G-11c4d verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
