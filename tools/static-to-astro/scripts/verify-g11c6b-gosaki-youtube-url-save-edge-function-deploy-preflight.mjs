/**
 * G-11c6b — Gosaki YouTube URL save Edge Function deploy preflight.
 * Run: node tools/static-to-astro/scripts/verify-g11c6b-gosaki-youtube-url-save-edge-function-deploy-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const FUNCTION_NAME = "gosaki-youtube-url-save";
const WORKFLOW_REL = ".github/workflows/gosaki-youtube-url-save-staging.yml";

const DOC_REL = "tools/static-to-astro/docs/gosaki-youtube-url-save-edge-function-deploy-preflight.md";
const EDGE_INDEX_REL = `supabase/functions/${FUNCTION_NAME}/index.ts`;
const EDGE_SHARED_REL = "supabase/functions/_shared/gosaki-youtube-url-save.ts";
const CONFIG_TOML_REL = "supabase/config.toml";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const G11C6A_VERIFIER =
  "tools/static-to-astro/scripts/verify-g11c6a-gosaki-youtube-url-web-save-non-dry-run-slice-implementation.mjs";

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
const indexTs = read(EDGE_INDEX_REL);
const sharedTs = read(EDGE_SHARED_REL);
const configToml = read(CONFIG_TOML_REL);
const workflow = read(WORKFLOW_REL);
const combined = indexTs + sharedTs;

assert("G-11c6b doc exists", exists(DOC_REL));
assert("doc phase G-11c6b", doc.includes("G-11c6b-gosaki-youtube-url-save-edge-function-deploy-preflight"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc blocks production ref", doc.includes(PRODUCTION_REF) && doc.includes("Blocked"));
assert("doc deploy target save only", doc.includes(FUNCTION_NAME) && !doc.includes("deploy gosaki-youtube-url-dry-run"));
assert("doc deploy command", doc.includes(`supabase functions deploy ${FUNCTION_NAME}`));
assert("doc deploy not executed", doc.includes("NOT executed") || doc.includes("no deploy"));
assert("doc deploy staging ref in command", doc.includes(`--project-ref ${STAGING_REF}`));
assert("doc no production ref in deploy command", !doc.includes(`--project-ref ${PRODUCTION_REF}`));
assert("doc verify_jwt", doc.includes("verify_jwt = true"));
assert("doc ADMIN_EMAILS reuse", doc.includes("ADMIN_EMAILS") && doc.includes("not required"));
assert("doc secrets set forbidden", doc.includes("secrets set") && doc.includes("not"));
assert("doc Save disabled", doc.includes("disabled") || doc.includes("Save UI"));
assert("doc approvalId", doc.includes("G-11c6-gosaki-youtube-url-web-save-non-dry-run-slice"));
assert("doc saveEnabled", doc.includes("saveEnabled"));
assert("doc dispatch deferred", doc.includes("dispatch_deferred") || doc.includes("dispatch deferred"));
assert("doc workflow_dispatch not executed", doc.includes("workflow_dispatch") && doc.includes("not executed"));
assert("doc no DB JSON FTP execution", doc.includes("JSON") && doc.includes("not executed"));
assert("doc next G-11c6c", doc.includes("G-11c6c"));
assert("doc rollback", doc.includes("Rollback") || doc.includes("rollback"));
assert(
  "doc no real email",
  !/@(?!example\.com)[a-z0-9.-]+\.[a-z]{2,}/i.test(doc.replace(/example\.com/g, "")),
);

assert("config.toml save function", configToml.includes(`[functions.${FUNCTION_NAME}]`));
assert(
  "config.toml verify_jwt true",
  /\[functions\.gosaki-youtube-url-save\][\s\S]*verify_jwt = true/.test(configToml),
);

assert("Edge index requireAdminUser", indexTs.includes("requireAdminUser"));
assert("shared staging ref guard", sharedTs.includes(STAGING_REF));
assert("shared production block", sharedTs.includes(PRODUCTION_REF));
assert("shared no service_role", !/service_role/i.test(combined));
assert("shared no github dispatch", !combined.includes("api.github.com"));
assert("shared save armed env", sharedTs.includes("GOSAKI_YOUTUBE_URL_SAVE_ARMED"));
assert("shared dryRun false required", sharedTs.includes("dryRun must be false"));

assert("workflow exists", exists(WORKFLOW_REL));
assert("workflow workflow_dispatch only", workflow.includes("workflow_dispatch:"));
assert("workflow no push", !/\bon:\s*\n[\s\S]*\bpush:/m.test(workflow));
assert("workflow no pull_request", !workflow.includes("pull_request:"));
assert("workflow no schedule", !workflow.includes("schedule:"));
assert("workflow no FTP", !/lftp|ftp:|mirror|--delete/i.test(workflow));

const adminDiff = spawnSync("git", ["diff", "--name-only", "--", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", !adminDiff.stdout?.trim());

const envDiff = spawnSync("git", ["diff", "--name-only", "--", ".env", ".env.local"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert(".env unchanged", !envDiff.stdout?.trim());

console.log("");
console.log("Running G-11c6a verifier...");
const g11c6a = spawnSync("node", [path.join(REPO_ROOT, G11C6A_VERIFIER)], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
if (g11c6a.stdout) process.stdout.write(g11c6a.stdout);
if (g11c6a.stderr) process.stderr.write(g11c6a.stderr);
assert("G-11c6a verifier PASS", g11c6a.status === 0);

console.log("");
console.log(`G-11c6b verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
