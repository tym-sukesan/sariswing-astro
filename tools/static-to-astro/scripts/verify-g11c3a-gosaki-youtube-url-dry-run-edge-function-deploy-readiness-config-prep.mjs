/**
 * G-11c3a — Gosaki YouTube URL dry-run Edge Function deploy readiness config prep.
 * Run: node tools/static-to-astro/scripts/verify-g11c3a-gosaki-youtube-url-dry-run-edge-function-deploy-readiness-config-prep.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const FUNCTION_NAME = "gosaki-youtube-url-dry-run";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-youtube-url-dry-run-edge-function-deploy-readiness-config-prep.md";
const PREFLIGHT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-youtube-url-dry-run-edge-function-deploy-preflight.md";
const CONFIG_TOML_REL = "supabase/config.toml";
const EDGE_INDEX_REL = `supabase/functions/${FUNCTION_NAME}/index.ts`;
const EDGE_SHARED_REL = "supabase/functions/_shared/gosaki-youtube-url-dry-run.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const G11C1_VERIFIER =
  "tools/static-to-astro/scripts/verify-g11c1-gosaki-youtube-url-web-save-dry-run-poc-local-prep.mjs";
const G11C2_VERIFIER =
  "tools/static-to-astro/scripts/verify-g11c2-gosaki-youtube-url-dry-run-edge-function-deploy-preflight.mjs";

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

function runVerifier(rel) {
  const out = spawnSync("node", [path.join(REPO_ROOT, rel)], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  if (out.stdout) process.stdout.write(out.stdout);
  if (out.stderr) process.stderr.write(out.stderr);
  return out.status === 0;
}

const configToml = read(CONFIG_TOML_REL);
const doc = read(DOC_REL);
const preflightDoc = exists(PREFLIGHT_DOC_REL) ? read(PREFLIGHT_DOC_REL) : "";
const indexTs = read(EDGE_INDEX_REL);
const sharedTs = read(EDGE_SHARED_REL);
const combined = indexTs + sharedTs;

assert("G-11c3a doc exists", exists(DOC_REL));
assert("G-11c3a doc phase", doc.includes("G-11c3a-gosaki-youtube-url-dry-run-edge-function-deploy-readiness-config-prep"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc blocks production ref", doc.includes(PRODUCTION_REF));
assert("doc deploy command present", doc.includes(`supabase functions deploy ${FUNCTION_NAME}`));
assert("doc deploy not executed by Cursor", doc.includes("Cursor は実行しない"));
assert("doc G-11c3b operator approval", doc.includes("G-11c3b"));
assert("doc rollback plan", doc.includes("Rollback"));
assert("doc deploy checklist", doc.includes("Deploy直前チェックリスト"));

assert("config.toml has function section", configToml.includes(`[functions.${FUNCTION_NAME}]`));
assert("config.toml verify_jwt true", new RegExp(`\\[functions\\.${FUNCTION_NAME}\\][\\s\\S]*?verify_jwt\\s*=\\s*true`).test(configToml));
assert(
  "config.toml verify_jwt not false",
  !new RegExp(`\\[functions\\.${FUNCTION_NAME}\\][\\s\\S]*?verify_jwt\\s*=\\s*false`).test(configToml),
);

assert(
  "deploy docs use staging ref only in command",
  doc.includes(`--project-ref ${STAGING_REF}`) && !doc.includes(`--project-ref ${PRODUCTION_REF}`),
);
assert(
  "preflight doc does not deploy to production",
  !preflightDoc.includes(`--project-ref ${PRODUCTION_REF}`),
);

assert("Edge index exists", exists(EDGE_INDEX_REL));
assert("Edge shared exists", exists(EDGE_SHARED_REL));
assert("dryRun must be true in shared", sharedTs.includes("dryRun must be true"));
assert("wouldWrite false in shared", sharedTs.includes("wouldWrite: false"));
assert("no createServiceClient", !combined.includes("createServiceClient"));
assert("no workflow_dispatch", !/workflow_dispatch/i.test(combined));
assert("no FTP deploy in source", !/mirror\s+--delete|lftp|FileZilla/i.test(combined));
assert("no service_role in gosaki source", !/service_role/i.test(combined));

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
assert("G-11c1 verifier PASS", runVerifier(G11C1_VERIFIER));

console.log("");
console.log("Running G-11c2 verifier...");
assert("G-11c2 verifier PASS", runVerifier(G11C2_VERIFIER));

console.log("");
console.log(`G-11c3a verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
