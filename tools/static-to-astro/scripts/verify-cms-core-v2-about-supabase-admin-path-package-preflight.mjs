/**
 * CMS Core v2 — About Supabase Admin-path staging package preflight verifier.
 * Preflight only — no package generate / FTP / Edge / Secret / SQL.
 *
 * Run: node tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-admin-path-package-preflight.mjs
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
const SERVER_ARM = "GOSAKI_ABOUT_SUPABASE_SAVE_ARMED";

const DOC_REL =
  "tools/static-to-astro/docs/cms-core-v2-about-supabase-admin-path-package-preflight.md";
const QA_RESULT_REL =
  "tools/static-to-astro/docs/cms-core-v2-about-supabase-save-dry-run-edge-post-deploy-qa-result.md";
const FTP_QA_REL = "tools/static-to-astro/docs/cms-core-v2-about-supabase-ftp-post-qa.md";
const VERTICAL_VERIFIER =
  "tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-vertical-slice.mjs";
const ADMIN_LIB =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts";

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

assert("preflight doc exists", exists(DOC_REL));
assert("qa result doc exists", exists(QA_RESULT_REL));
assert("ftp qa doc exists", exists(FTP_QA_REL));
assert(
  "preflight phase",
  doc.includes("cms-core-v2-about-supabase-admin-path-package-preflight"),
);
assert("preflight complete gate", /ABOUT_SUPABASE_ADMIN_PATH_PACKAGE_PREFLIGHT_COMPLETE:\s*true/.test(doc));
assert(
  "readyForAboutSupabaseAdminPathPackageGenerate true",
  /readyForAboutSupabaseAdminPathPackageGenerate:\s*true/.test(doc),
);
assert("package not generated", /PACKAGE_GENERATE_EXECUTED:\s*false/.test(doc));
assert("FTP not executed", /FTP_EXECUTED:\s*false/.test(doc));
assert("Save arm false", /SAVE_ARM_ENABLED:\s*false/.test(doc));
assert("server arm unset gate", /GOSAKI_ABOUT_SUPABASE_SAVE_ARMED_SET:\s*false/.test(doc));
assert("UI arm false", doc.includes(SAVE_UI_ENV) && /SAVE_UI_ARMED[`:\s|]*\*?\*?false/i.test(doc));
assert("path env true for package", doc.includes(PATH_ENV) && doc.includes("**`true`**"));
assert("build-read unset", doc.includes("CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ") && /unset/i.test(doc));
assert("registry sitePageFields false", /REGISTRY_SITE_PAGE_FIELDS:\s*false/.test(doc));
assert("staging ref", doc.includes(STAGING_REF));
assert("production STOP", doc.includes(PRODUCTION_REF) && /STOP|untouched|UNCHANGED/i.test(doc));
assert("function name", doc.includes(FUNCTION_NAME));
assert(
  "build command documented",
  doc.includes("build-gosaki-staging-admin-package.mjs") || doc.includes("build:gosaki:staging"),
);
assert("verify:manual-upload documented", doc.includes("verify:manual-upload"));
assert("do not set server arm", /Do NOT set GOSAKI_ABOUT_SUPABASE_SAVE_ARMED|do not set Secret/i.test(doc));
assert("Contents retained", /CONTENTS_ABOUT_PATH_RETAINED:\s*true|Contents G-12a/i.test(doc));
assert("other admin routes out of scope", /Schedule|Discography|YouTube/i.test(doc));
assert("FTP QA linked", doc.includes("cms-core-v2-about-supabase-ftp-post-qa.md"));
assert("local package QA section", /Local package QA/i.test(doc));
assert("browser QA section", /FTP \+ browser QA|browser QA/i.test(doc));
assert("readyForAnyFutureFtpApply false", /READY_FOR_ANY_FUTURE_FTP_APPLY:\s*false/.test(doc));

assert("qa result PASS", /POST_DEPLOY_QA_PASSED:\s*true|COMPLETE \/ PASS/i.test(qa));
assert("qa OPTIONS 200", /OPTIONS[\s\S]{0,80}200/i.test(qa));
assert("qa unauth 401", /401/.test(qa));
assert("qa dry-run 200", /dryRun[\s\S]{0,80}200|owner dryRun[\s\S]{0,40}200/i.test(qa));
assert("qa save_not_armed ok false", /save_not_armed/i.test(qa) && /ok:false/.test(qa));
assert("qa seed unchanged", /updatedAtUnchanged:\s*true/.test(qa));
assert("qa no DB write", /DB_WRITE_EXECUTED:\s*false|DB writeなし/i.test(qa));
assert("qa ready for admin path preflight", /readyForAboutSupabaseAdminPathPackagePreflight:\s*true/.test(qa));

assert("ftp qa section B exists", /Admin path package|write-backend=supabase/i.test(ftpQa));

assert("admin path helper", adminLib.includes("isGosakiAboutSupabasePathEnabled"));
assert("admin path env constant", adminLib.includes(PATH_ENV));
assert("admin save UI arm env", adminLib.includes(SAVE_UI_ENV));
assert("admin resolve dry-run dual path", adminLib.includes("resolveAboutOperationalDryRunEndpoint"));
assert("admin resolve save dual path", adminLib.includes("resolveAboutOperationalSaveEndpoint"));
assert("server arm not baked as PUBLIC true default", !/GOSAKI_ABOUT_SUPABASE_SAVE_ARMED.*=.*true/.test(adminLib));

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

const diffCheck = spawnSync("git", ["diff", "--check"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("git diff --check clean", diffCheck.status === 0, diffCheck.stdout || diffCheck.stderr || "");

console.log("");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) process.exit(1);
console.log("OK cms-core-v2-about-supabase-admin-path-package-preflight");
