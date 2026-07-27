/**
 * CMS Core v2 — About Supabase Admin read/hydrate Edge re-deploy preflight verifier.
 * Preflight only — no deploy / Secret / remote invoke / SQL / FTP / package.
 *
 * Run: node tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-admin-read-hydrate-edge-deploy-preflight.mjs
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
const BASELINE_HEAD = "c93f9e862150ab11d0eeaa69e647cb6aea31777f";

const DOC_REL =
  "tools/static-to-astro/docs/cms-core-v2-about-supabase-admin-read-hydrate-edge-deploy-preflight.md";
const LOCAL_IMPL_REL =
  "tools/static-to-astro/docs/cms-core-v2-about-supabase-admin-read-hydrate-local-implementation.md";
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
assert("local impl doc exists", exists(LOCAL_IMPL_REL));
assert(
  "doc phase",
  doc.includes("cms-core-v2-about-supabase-admin-read-hydrate-edge-deploy-preflight"),
);
assert("doc baseline HEAD", doc.includes(BASELINE_HEAD));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP/i.test(doc));
assert(
  "doc deploy command locked",
  doc.includes(`supabase functions deploy ${FUNCTION_NAME} --project-ref ${STAGING_REF}`),
);
assert(
  "doc no production deploy command",
  !doc.includes(
    `supabase functions deploy ${FUNCTION_NAME} --project-ref ${PRODUCTION_REF}`,
  ),
);
assert("doc EDGE_REDEPLOY_EXECUTED false", /EDGE_REDEPLOY_EXECUTED:\s*false/.test(doc));
assert("doc EDGE_DEPLOY_EXECUTED false", /EDGE_DEPLOY_EXECUTED:\s*false/.test(doc));
assert(
  "doc ready for redeploy execution",
  /readyForAboutSupabaseAdminReadHydrateEdgeRedeployExecution:\s*true/.test(doc),
);
assert("doc EDGE_REDEPLOY_PREFLIGHT_READY", /EDGE_REDEPLOY_PREFLIGHT_READY:\s*true/.test(doc));
assert("doc Save arm false", /SAVE_ARM_ENABLED:\s*false/.test(doc));
assert("doc Save arm unset gate", /GOSAKI_ABOUT_SUPABASE_SAVE_ARMED_SET:\s*false/.test(doc));
assert("doc NEW_SECRETS_REQUIRED false", /NEW_SECRETS_REQUIRED:\s*false/.test(doc));
assert("doc service_role false", /SERVICE_ROLE_USED:\s*false/.test(doc));
assert("doc post-deploy QA section", /Post-deploy QA|HTTP checks/i.test(doc));
assert("doc read body example", doc.includes('"operation": "read"'));
assert("doc JWTなし401", /401/.test(doc));
assert("doc owner read 200", /owner.*read|operation:"read"/i.test(doc) && /200/.test(doc));
assert("doc write flags false", /didWrite.*dbWrite.*networkWrite/i.test(doc));
assert("doc allowlist 400", /400/.test(doc) && /allowlist|wrong/i.test(doc));
assert("doc save_not_armed 403", /save_not_armed/.test(doc) && /403/.test(doc));
assert("doc updated_at unchanged", /updated_at/i.test(doc) && /unchanged|不変/.test(doc));
assert("doc STOP conditions", /STOP conditions/i.test(doc));
assert("doc approval form", doc.includes("承認します。この操作を1回だけ実行してください。"));
assert("doc single function only", /Function \(only\)|1件のみ|single function/i.test(doc));

assert("root handler exists", exists(ROOT_HANDLER));
assert("root index exists", exists(ROOT_INDEX));
assert("mirror handler exists", exists(MIRROR_HANDLER));
assert("mirror index exists", exists(MIRROR_INDEX));
assert("root/mirror handler identical", handler === mirrorHandler);
assert("root/mirror index identical", indexTs === mirrorIndex);

assert("handler READ_OPERATION", handler.includes('READ_OPERATION = "read"'));
assert("handler can_write_site", handler.includes('rpc("can_write_site"'));
assert("handler JWT getUser", handler.includes("auth.getUser()"));
assert("handler site allowlist", handler.includes('SITE_SLUG = "gosaki-piano"'));
assert("handler page/field allowlist", handler.includes('PAGE_KEY = "about"') && handler.includes('FIELD_KEY = "profile.lede"'));
assert(
  "handler read before value_text_required",
  (() => {
    const idx = handler.indexOf("if (operation === READ_OPERATION)");
    const end = handler.indexOf("if (!nextValueText)", idx);
    if (idx < 0 || end < 0) return false;
    const block = handler.slice(idx, end);
    return (
      block.includes("valueText: before.valueText") &&
      block.includes("...WRITE_FALSE") &&
      !block.includes("SAVE_APPROVAL_ID") &&
      !block.includes("nextValueText")
    );
  })(),
);
assert("handler save_not_armed retained", handler.includes("save_not_armed"));
{
  const block = handler.match(
    /if\s*\(!isAboutSupabaseSaveArmed\([\s\S]*?return\s*\{([\s\S]*?)\};\s*\n\s*\}\s*\n\s*\n\s*if\s*\(!expectedBeforeUpdatedAt/,
  );
  const sn = block?.[1] ?? "";
  const planIdx = sn.indexOf("...plan");
  const okFalseIdx = sn.search(/ok:\s*false/);
  assert(
    "handler save_not_armed ok:false after ...plan",
    planIdx >= 0 && okFalseIdx > planIdx,
  );
  assert("handler save_not_armed status 403", /status:\s*403/.test(sn));
}
assert("handler dryRun retained", handler.includes('DRY_RUN_OPERATION = "dryRun"'));
assert("handler service_role flag false", handler.includes("SUPABASE_SERVICE_ROLE_CONNECTED = false"));
assert("handler no SERVICE_ROLE_KEY", !/SERVICE_ROLE_KEY/.test(handler + indexTs));
assert("handler Save arm env", handler.includes(SAVE_ARM));
assert(
  "config.toml verify_jwt true",
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

const head = spawnSync("git", ["rev-parse", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
}).stdout.trim();
assert(
  "repo HEAD matches baseline (or docs note if diverge)",
  head === BASELINE_HEAD || doc.includes(head) || doc.includes(BASELINE_HEAD),
  `HEAD=${head}`,
);

assert("vertical slice verifier exists", exists(VERTICAL_VERIFIER));
const vertical = spawnSync("node", [path.join(REPO_ROOT, VERTICAL_VERIFIER)], {
  cwd: REPO_ROOT,
  encoding: "utf8",
  env: { ...process.env, FORCE_COLOR: "0" },
});
assert(
  "About vertical slice verifier PASS",
  vertical.status === 0,
  vertical.status === 0
    ? ""
    : `${vertical.stdout}\n${vertical.stderr}`.trim().split("\n").slice(-5).join(" | "),
);

const diffCheck = spawnSync("git", ["diff", "--check"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("git diff --check clean", diffCheck.status === 0, diffCheck.stdout || diffCheck.stderr || "");

console.log("");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) process.exit(1);
console.log("OK cms-core-v2-about-supabase-admin-read-hydrate-edge-deploy-preflight");
