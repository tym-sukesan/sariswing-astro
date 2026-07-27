/**
 * CMS Core v2 — About Supabase Admin read/hydrate Admin-path package preflight verifier.
 * Preflight only — no package generate / FTP / Edge / Secret / SQL.
 *
 * Run: node tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-admin-read-hydrate-admin-path-package-preflight.mjs
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
const PATH_ENV = "PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED";
const SAVE_UI_ENV = "PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED";
const CONTENTS_SAVE_ENV = "PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED";
const SERVER_ARM = "GOSAKI_ABOUT_SUPABASE_SAVE_ARMED";

const DOC_REL =
  "tools/static-to-astro/docs/cms-core-v2-about-supabase-admin-read-hydrate-admin-path-package-preflight.md";
const QA_RESULT_REL =
  "tools/static-to-astro/docs/cms-core-v2-about-supabase-admin-read-hydrate-edge-post-deploy-qa-result.md";
const FTP_QA_REL = "tools/static-to-astro/docs/cms-core-v2-about-supabase-ftp-post-qa.md";
const VERTICAL_VERIFIER =
  "tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-vertical-slice.mjs";
const EDGE_PREFLIGHT_VERIFIER =
  "tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-admin-read-hydrate-edge-deploy-preflight.mjs";
const ADMIN_LIB =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts";
const ABOUT_EDIT =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-about-operational-edit.ts";

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
const qa = exists(QA_RESULT_REL) ? read(QA_RESULT_REL) : "";
const ftpQa = exists(FTP_QA_REL) ? read(FTP_QA_REL) : "";
const adminLib = exists(ADMIN_LIB) ? read(ADMIN_LIB) : "";
const aboutEdit = exists(ABOUT_EDIT) ? read(ABOUT_EDIT) : "";

assert("preflight doc exists", exists(DOC_REL));
assert("qa result doc exists", exists(QA_RESULT_REL));
assert("ftp qa doc exists", exists(FTP_QA_REL));
assert(
  "preflight phase",
  doc.includes("cms-core-v2-about-supabase-admin-read-hydrate-admin-path-package-preflight"),
);
assert(
  "preflight complete gate",
  /ABOUT_SUPABASE_ADMIN_READ_HYDRATE_ADMIN_PATH_PACKAGE_PREFLIGHT_COMPLETE:\s*true/.test(doc),
);
assert(
  "readyFor package generate true",
  /readyForAboutSupabaseAdminReadHydrateAdminPathPackageGenerate:\s*true/.test(doc),
);
assert("package not generated", /PACKAGE_GENERATE_EXECUTED:\s*false/.test(doc));
assert("FTP not executed", /FTP_EXECUTED:\s*false/.test(doc));
assert("Save arm false", /SAVE_ARM_ENABLED:\s*false/.test(doc));
assert("server arm unset gate", /GOSAKI_ABOUT_SUPABASE_SAVE_ARMED_SET:\s*false/.test(doc));
assert("UI arm false", doc.includes(SAVE_UI_ENV) && /false/.test(doc));
assert("Contents Save false", doc.includes(CONTENTS_SAVE_ENV) && /false/.test(doc));
assert("path env true for package", doc.includes(PATH_ENV) && doc.includes("**`true`**"));
assert("build-read unset", doc.includes("CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ") && /unset/i.test(doc));
assert("registry sitePageFields false", /REGISTRY_SITE_PAGE_FIELDS:\s*false/.test(doc));
assert("public About JSON", /PUBLIC_ABOUT_JSON_SOT:\s*true/.test(doc));
assert("Contents retained", /CONTENTS_ABOUT_PATH_RETAINED:\s*true/.test(doc));
assert("staging ref", doc.includes(STAGING_REF));
assert("production STOP", doc.includes(PRODUCTION_REF) && /STOP|untouched|UNCHANGED/i.test(doc));
assert("function name", doc.includes(FUNCTION_NAME));
assert(
  "build command documented",
  doc.includes("build-gosaki-staging-admin-package.mjs") || doc.includes("build:gosaki:staging"),
);
assert("verify:manual-upload documented", doc.includes("verify:manual-upload"));
assert(
  "do not set server arm",
  /Do NOT set GOSAKI_ABOUT_SUPABASE_SAVE_ARMED|do not set/i.test(doc),
);
assert("FTP QA linked", doc.includes("cms-core-v2-about-supabase-ftp-post-qa.md"));
assert("local package QA section", /Local package QA/i.test(doc));
assert("browser QA section", /FTP \+ browser QA|browser QA/i.test(doc));
assert("readyForAnyFutureFtpApply false", /READY_FOR_ANY_FUTURE_FTP_APPLY:\s*false/.test(doc));
assert("lede overlay only", /only.*profile\.lede|profile\.lede.*only/i.test(doc));
assert("JSON fallback", /fallback/i.test(doc));
assert("no raw error codes", /raw error|raw codes/i.test(doc));

assert("qa result PASS", /POST_REDEPLOY_QA_PASSED:\s*true|COMPLETE \/ PASS/i.test(qa));
assert("qa EDGE_REDEPLOY_EXECUTED true", /EDGE_REDEPLOY_EXECUTED:\s*true/.test(qa));
assert("qa operation read live", /operationReadLive:\s*true|operation:"read"/i.test(qa));
assert("qa JWT 401", /401/.test(qa));
assert("qa owner read 200", /200/.test(qa) && /ok:true/.test(qa));
assert("qa pageKey about", /pageKey:"about"/.test(qa));
assert("qa fieldKey profile.lede", /fieldKey:"profile\.lede"/.test(qa));
assert("qa valueTextMatch", /valueTextMatch:\s*true/.test(qa));
assert("qa write flags false", /didWrite:false/.test(qa) && /dbWrite:false/.test(qa));
assert("qa allowlist 400", /400/.test(qa));
assert("qa save_not_armed", /save_not_armed/i.test(qa) && /ok:false/.test(qa));
assert("qa updatedAtUnchanged", /updatedAtUnchanged:\s*true/.test(qa));
assert("qa no DB write", /DB_WRITE_EXECUTED:\s*false|DB writeなし/i.test(qa));
assert(
  "qa ready for package preflight",
  /readyForAboutSupabaseAdminReadHydrateAdminPathPackagePreflight:\s*true/.test(qa),
);

assert("ftp qa section D exists", /Admin read\/hydrate package|operation:"read"/i.test(ftpQa));

assert("admin lib build read request", adminLib.includes("buildAboutSupabaseReadEndpointRequest"));
assert("admin lib overlay lede", adminLib.includes("overlayAboutProfileLedeInBody"));
assert("about edit uses read hydrate", aboutEdit.includes("buildAboutSupabaseReadEndpointRequest"));
assert("about edit overlays lede", aboutEdit.includes("overlayAboutProfileLedeInBody"));
assert("server arm not baked PUBLIC true", !/GOSAKI_ABOUT_SUPABASE_SAVE_ARMED.*=.*true/.test(adminLib));

assert("vertical verifier exists", exists(VERTICAL_VERIFIER));
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

assert("edge preflight verifier exists", exists(EDGE_PREFLIGHT_VERIFIER));
const edgePre = spawnSync("node", [path.join(REPO_ROOT, EDGE_PREFLIGHT_VERIFIER)], {
  cwd: REPO_ROOT,
  encoding: "utf8",
  env: { ...process.env, FORCE_COLOR: "0" },
});
assert(
  "Admin read/hydrate Edge preflight verifier PASS",
  edgePre.status === 0,
  edgePre.status === 0
    ? ""
    : `${edgePre.stdout}\n${edgePre.stderr}`.trim().split("\n").slice(-5).join(" | "),
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
console.log("OK cms-core-v2-about-supabase-admin-read-hydrate-admin-path-package-preflight");
