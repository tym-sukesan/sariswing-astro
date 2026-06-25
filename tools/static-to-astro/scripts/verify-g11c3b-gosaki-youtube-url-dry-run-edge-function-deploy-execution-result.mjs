/**
 * G-11c3b — Gosaki YouTube URL dry-run Edge Function deploy execution result.
 * Run: node tools/static-to-astro/scripts/verify-g11c3b-gosaki-youtube-url-dry-run-edge-function-deploy-execution-result.mjs
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
const FUNCTION_URL = `https://${STAGING_REF}.supabase.co/functions/v1/${FUNCTION_NAME}`;

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-youtube-url-dry-run-edge-function-deploy-execution-result.md";
const CONFIG_TOML_REL = "supabase/config.toml";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const CLI_TEMP_REL = "supabase/.temp/cli-latest";

const G11C1_VERIFIER =
  "tools/static-to-astro/scripts/verify-g11c1-gosaki-youtube-url-web-save-dry-run-poc-local-prep.mjs";
const G11C2_VERIFIER =
  "tools/static-to-astro/scripts/verify-g11c2-gosaki-youtube-url-dry-run-edge-function-deploy-preflight.mjs";
const G11C3A_VERIFIER =
  "tools/static-to-astro/scripts/verify-g11c3a-gosaki-youtube-url-dry-run-edge-function-deploy-readiness-config-prep.mjs";

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

const doc = read(DOC_REL);
const configToml = read(CONFIG_TOML_REL);

assert("G-11c3b doc exists", exists(DOC_REL));
assert(
  "G-11c3b doc phase",
  doc.includes("G-11c3b-gosaki-youtube-url-dry-run-edge-function-deploy-execution-result"),
);
assert("doc records staging deploy executed", doc.includes("supabaseEdgeFunctionDeployExecuted: true"));
assert("doc deploy count once", doc.includes("supabaseEdgeFunctionDeployCount: 1"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc blocks production ref", doc.includes(PRODUCTION_REF));
assert("doc production not touched", doc.includes("productionProjectRefTouched: false"));
assert("doc function URL staging host", doc.includes(FUNCTION_URL));
assert("doc 401 unauth rejection", doc.includes("UNAUTHORIZED_NO_AUTH_HEADER"));
assert("doc HTTP 401", doc.includes("401"));
assert("doc operator approval recorded", doc.includes("承認します。この操作を1回だけ実行してください。"));
assert("doc deploy command present", doc.includes(`supabase functions deploy ${FUNCTION_NAME}`));
assert(
  "deploy command uses staging ref only",
  doc.includes(`--project-ref ${STAGING_REF}`) && !doc.includes(`--project-ref ${PRODUCTION_REF}`),
);
assert("doc no DB write", doc.includes("cursorDbWriteExecuted: false"));
assert("doc no JSON write", doc.includes("cursorJsonWriteExecuted: false"));
assert("doc no workflow_dispatch", doc.includes("workflowDispatchExecuted: false"));
assert("doc no FTP", doc.includes("cursorFtpUploadExecuted: false"));
assert("doc cli-latest not for commit", doc.includes("supabase/.temp/cli-latest"));
assert("doc G-11c4 next", doc.includes("G-11c4"));

assert("config.toml has function section", configToml.includes(`[functions.${FUNCTION_NAME}]`));
assert(
  "config.toml verify_jwt true",
  new RegExp(`\\[functions\\.${FUNCTION_NAME}\\][\\s\\S]*?verify_jwt\\s*=\\s*true`).test(configToml),
);

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

const staged = spawnSync("git", ["diff", "--cached", "--name-only"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const stagedNames = (staged.stdout ?? "").trim().split("\n").filter(Boolean);
assert(
  "supabase/.temp/cli-latest not staged",
  !stagedNames.includes(CLI_TEMP_REL),
);

console.log("");
console.log("Running G-11c1 verifier...");
assert("G-11c1 verifier PASS", runVerifier(G11C1_VERIFIER));

console.log("");
console.log("Running G-11c2 verifier...");
assert("G-11c2 verifier PASS", runVerifier(G11C2_VERIFIER));

console.log("");
console.log("Running G-11c3a verifier...");
assert("G-11c3a verifier PASS", runVerifier(G11C3A_VERIFIER));

console.log("");
console.log(`G-11c3b verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
