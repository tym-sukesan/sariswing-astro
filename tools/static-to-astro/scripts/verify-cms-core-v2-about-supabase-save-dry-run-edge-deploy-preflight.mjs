/**
 * CMS Core v2 — About Supabase Edge deploy preflight verifier.
 * Preflight only — no deploy / Secret / remote invoke / SQL / FTP.
 *
 * Run: node tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-save-dry-run-edge-deploy-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const FUNCTION_NAME = "gosaki-about-supabase-save-dry-run";
const SAVE_ARM = "GOSAKI_ABOUT_SUPABASE_SAVE_ARMED";

const DOC_REL =
  "tools/static-to-astro/docs/cms-core-v2-about-supabase-save-dry-run-edge-deploy-preflight.md";
const ROOT_HANDLER = `supabase/functions/${FUNCTION_NAME}/handler.ts`;
const ROOT_INDEX = `supabase/functions/${FUNCTION_NAME}/index.ts`;
const MIRROR_HANDLER =
  `tools/static-to-astro/scripts/edge-functions/${FUNCTION_NAME}/handler.ts`;
const MIRROR_INDEX =
  `tools/static-to-astro/scripts/edge-functions/${FUNCTION_NAME}/index.ts`;
const CONFIG_TOML = "supabase/config.toml";
const VERTICAL_VERIFIER =
  "tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-vertical-slice.mjs";

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
const handler = exists(ROOT_HANDLER) ? read(ROOT_HANDLER) : "";
const indexTs = exists(ROOT_INDEX) ? read(ROOT_INDEX) : "";
const mirrorHandler = exists(MIRROR_HANDLER) ? read(MIRROR_HANDLER) : "";
const mirrorIndex = exists(MIRROR_INDEX) ? read(MIRROR_INDEX) : "";
const configToml = exists(CONFIG_TOML) ? read(CONFIG_TOML) : "";

assert("preflight doc exists", exists(DOC_REL));
assert(
  "doc phase",
  doc.includes("cms-core-v2-about-supabase-save-dry-run-edge-deploy-preflight"),
);
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP/i.test(doc));
assert(
  "doc deploy command",
  doc.includes(`supabase functions deploy ${FUNCTION_NAME}`) &&
    doc.includes(`--project-ref ${STAGING_REF}`),
);
const lockedDeployCmd =
  `supabase functions deploy ${FUNCTION_NAME} --project-ref ${STAGING_REF}`;
assert("doc locked deploy uses staging only", doc.includes(lockedDeployCmd));
assert(
  "doc has no production deploy command",
  !doc.includes(
    `supabase functions deploy ${FUNCTION_NAME} --project-ref ${PRODUCTION_REF}`,
  ),
);
assert(
  "doc deploy not executed",
  /EDGE_DEPLOY_EXECUTED:\s*false/i.test(doc) || /no Edge deploy/i.test(doc),
);
assert("doc Save arm false", /SAVE_ARM_ENABLED:\s*false/i.test(doc));
assert("doc CORS", /CORS/i.test(doc));
assert("doc rollback", /Rollback/i.test(doc));
assert("doc post-deploy QA", /Post-deploy remote dry-run QA/i.test(doc));
assert("doc STOP conditions", /STOP conditions/i.test(doc));
assert("doc readyForAboutSupabaseEdgeDeployExecution", doc.includes("readyForAboutSupabaseEdgeDeployExecution: true"));
assert("doc EDGE_DEPLOY_PREFLIGHT_READY", doc.includes("EDGE_DEPLOY_PREFLIGHT_READY: true"));
assert("doc service_role not used", /SERVICE_ROLE_USED:\s*false/i.test(doc));
assert("doc NEW_SECRETS_REQUIRED false", /NEW_SECRETS_REQUIRED:\s*false/i.test(doc));

assert("root handler exists", exists(ROOT_HANDLER));
assert("root index exists", exists(ROOT_INDEX));
assert("mirror handler exists", exists(MIRROR_HANDLER));
assert("mirror index exists", exists(MIRROR_INDEX));
assert("root/mirror handler identical", handler === mirrorHandler);
assert("root/mirror index identical", indexTs === mirrorIndex);

assert("handler endpoint name", handler.includes(`ENDPOINT_NAME = "${FUNCTION_NAME}"`));
assert("handler staging ref", handler.includes(STAGING_REF));
assert("handler production STOP", handler.includes(PRODUCTION_REF));
assert("handler page about", handler.includes('PAGE_KEY = "about"'));
assert("handler field profile.lede", handler.includes('FIELD_KEY = "profile.lede"'));
assert("handler can_write_site", handler.includes('rpc("can_write_site"'));
assert("handler JWT getUser", handler.includes("auth.getUser()"));
assert("handler Save arm env", handler.includes(SAVE_ARM));
assert("handler save_not_armed", handler.includes("save_not_armed"));
assert("handler service_role flag false", handler.includes("SUPABASE_SERVICE_ROLE_CONNECTED = false"));
assert("handler no SERVICE_ROLE_KEY", !/SERVICE_ROLE_KEY/.test(handler + indexTs));
assert("handler optimistic lock", handler.includes("expectedBeforeUpdatedAt"));
assert("handler fingerprint", handler.includes("function fingerprint"));
assert("handler dry-run WRITE_FALSE", handler.includes("didWrite: false") && handler.includes("dbWrite: false"));
assert(
  "handler Save UPDATE value_text only in update object",
  /\.update\(\{\s*value_text:\s*after\.valueText\s*\}\)/.test(handler),
);
assert("handler isAboutSupabaseSaveArmed exact true", handler.includes(`getEnv(SAVE_ARMED_ENV) === "true"`));
assert("index CORS Allow-Origin", indexTs.includes('Access-Control-Allow-Origin": "*"'));
assert("index CORS headers", indexTs.includes("authorization, x-client-info, apikey, content-type"));
assert("index OPTIONS", indexTs.includes('req.method === "OPTIONS"'));
assert("index imports handler", indexTs.includes('from "./handler.ts"'));

assert(
  "config.toml lists function verify_jwt",
  configToml.includes(`[functions.${FUNCTION_NAME}]`) &&
    /\[functions\.gosaki-about-supabase-save-dry-run\][\s\S]*?verify_jwt\s*=\s*true/.test(configToml),
);

const envFiles = [".env", ".env.local", "tools/static-to-astro/.env", "tools/static-to-astro/.env.local"];
for (const rel of envFiles) {
  if (!exists(rel)) continue;
  const text = read(rel);
  const armed = new RegExp(`^\\s*${SAVE_ARM}\\s*=\\s*true\\s*$`, "m").test(text);
  assert(`local ${rel} Save arm not true`, !armed);
}

assert("vertical slice verifier exists", exists(VERTICAL_VERIFIER));

const vertical = spawnSync("node", [path.join(REPO_ROOT, VERTICAL_VERIFIER)], {
  cwd: REPO_ROOT,
  encoding: "utf8",
  env: { ...process.env, FORCE_COLOR: "0" },
});
assert(
  "About vertical slice verifier PASS",
  vertical.status === 0,
  vertical.status === 0 ? "" : (vertical.stdout + vertical.stderr).trim().split("\n").slice(-5).join(" | "),
);

const diffCheck = spawnSync("git", ["diff", "--check"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert(
  "git diff --check clean",
  diffCheck.status === 0,
  diffCheck.stdout || diffCheck.stderr || "",
);

console.log("");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) process.exit(1);
console.log("OK cms-core-v2-about-supabase-save-dry-run-edge-deploy-preflight");
