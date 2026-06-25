/**
 * G-11c6c — Gosaki YouTube URL save Edge Function deploy execution result.
 * Run: node tools/static-to-astro/scripts/verify-g11c6c-gosaki-youtube-url-save-edge-function-deploy-execution-result.mjs
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
const FUNCTION_URL = `https://${STAGING_REF}.supabase.co/functions/v1/${FUNCTION_NAME}`;

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-youtube-url-save-edge-function-deploy-execution-result.md";
const CONFIG_TOML_REL = "supabase/config.toml";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const G11C6B_VERIFIER =
  "tools/static-to-astro/scripts/verify-g11c6b-gosaki-youtube-url-save-edge-function-deploy-preflight.mjs";

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
const adminPage = read(ADMIN_PAGE_REL);

assert("G-11c6c doc exists", exists(DOC_REL));
assert(
  "doc phase",
  doc.includes("G-11c6c-gosaki-youtube-url-save-edge-function-deploy-execution-result"),
);
assert("doc deploy executed once", doc.includes("supabaseEdgeFunctionDeployExecuted: true"));
assert("doc deploy count 1", doc.includes("supabaseEdgeFunctionDeployCount: 1"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production not touched", doc.includes("productionProjectRefTouched: false"));
assert("doc function URL", doc.includes(FUNCTION_URL));
assert("doc 401 unauth", doc.includes("UNAUTHORIZED_NO_AUTH_HEADER"));
assert("doc secrets set not executed", doc.includes("supabaseSecretsSetExecuted: false"));
assert("doc workflow_dispatch not executed", doc.includes("workflowDispatchExecuted: false"));
assert("doc no DB write", doc.includes("cursorDbWriteExecuted: false"));
assert("doc no JSON write", doc.includes("cursorJsonWriteExecuted: false"));
assert("doc no FTP", doc.includes("cursorFtpUploadExecuted: false"));
assert("doc Save UI disabled", doc.includes("saveUiEnabled: false"));
assert("doc server arm off", doc.includes("serverSaveArmEnabled: false"));
assert("doc deploy command", doc.includes(`supabase functions deploy ${FUNCTION_NAME}`));
assert(
  "deploy command staging ref only",
  doc.includes(`--project-ref ${STAGING_REF}`) && !doc.includes(`--project-ref ${PRODUCTION_REF}`),
);
assert("doc operator approval", doc.includes("承認します。この操作を1回だけ実行してください。"));
assert(
  "doc no real email",
  !/@(?!example\.com)[a-z0-9.-]+\.[a-z]{2,}/i.test(doc.replace(/example\.com/g, "")),
);

assert("config.toml save function", configToml.includes(`[functions.${FUNCTION_NAME}]`));
assert(
  "config.toml verify_jwt",
  /\[functions\.gosaki-youtube-url-save\][\s\S]*verify_jwt = true/.test(configToml),
);

assert("admin page save btn disabled", adminPage.includes('id="gra-youtube-save-btn"') && adminPage.includes("disabled"));
assert("admin page save enabled default false", adminPage.includes('data-g11c6-save-enabled'));

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
console.log("Running G-11c6b verifier...");
assert("G-11c6b verifier PASS", runVerifier(G11C6B_VERIFIER));

console.log("");
console.log(`G-11c6c verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
