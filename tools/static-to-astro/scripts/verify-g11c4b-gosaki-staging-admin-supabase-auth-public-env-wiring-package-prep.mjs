/**
 * G-11c4b — Gosaki staging admin Supabase Auth public env wiring package prep.
 * Run: node tools/static-to-astro/scripts/verify-g11c4b-gosaki-staging-admin-supabase-auth-public-env-wiring-package-prep.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  STAGING_DRY_RUN_ENDPOINT,
  STAGING_SUPABASE_URL,
  PRODUCTION_PROJECT_REF,
  STAGING_PROJECT_REF,
} from "./lib/gosaki-staging-admin-public-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-staging-admin-supabase-auth-public-env-wiring-package-prep.md";
const BUILD_SCRIPT_REL = "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs";
const ENV_LIB_REL = "tools/static-to-astro/scripts/lib/gosaki-staging-admin-public-env.mjs";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const ADMIN_HTML_REL =
  "tools/static-to-astro/output/static-public/gosaki-piano/public-dist/admin/index.html";
const MANUAL_ADMIN_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/admin/index.html";
const PACKAGE_REL = "tools/static-to-astro/output/manual-upload/gosaki-piano";
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

function extractDataAttr(html, attr) {
  const re = new RegExp(`${attr}="([^"]*)"`);
  return html.match(re)?.[1] ?? "";
}

const doc = exists(DOC_REL) ? read(DOC_REL) : "";
const adminPage = read(ADMIN_PAGE_REL);
const adminHtml = exists(ADMIN_HTML_REL) ? read(ADMIN_HTML_REL) : "";
const manualAdminHtml = exists(MANUAL_ADMIN_REL) ? read(MANUAL_ADMIN_REL) : "";
const envLib = read(ENV_LIB_REL);

assert("G-11c4b doc exists", exists(DOC_REL));
assert(
  "G-11c4b doc phase",
  doc.includes("G-11c4b-gosaki-staging-admin-supabase-auth-public-env-wiring-package-prep"),
);
assert("doc staging ref", doc.includes(STAGING_PROJECT_REF));
assert("doc blocks production ref in endpoint", !doc.includes(`https://${PRODUCTION_PROJECT_REF}.supabase.co`));
assert("doc build script", doc.includes("build-gosaki-staging-admin-package.mjs"));
assert("doc blocks service_role", doc.includes("service_role") && doc.includes("**no**"));

assert("env lib exists", exists(ENV_LIB_REL));
assert("env lib loads public keys only", envLib.includes("PUBLIC_SUPABASE_URL"));
assert("env lib blocks production host", envLib.includes(PRODUCTION_PROJECT_REF));
assert("build script exists", exists(BUILD_SCRIPT_REL));

assert("admin page G-11c4b phase", adminPage.includes("G11C4B_PHASE"));
assert("admin page auth configured message", adminPage.includes("Supabase Auth: configured"));
assert("admin page no secret hardcode", !/eyJ[A-Za-z0-9_-]{20,}/.test(adminPage));

assert("public-dist admin exists", exists(ADMIN_HTML_REL));
assert("built admin staging dry-run endpoint", extractDataAttr(adminHtml, "data-gosaki-youtube-dry-run-endpoint") === STAGING_DRY_RUN_ENDPOINT);
assert(
  "built admin staging supabase url",
  extractDataAttr(adminHtml, "data-gosaki-supabase-url") === STAGING_SUPABASE_URL,
);
assert(
  "built admin anon key non-empty",
  extractDataAttr(adminHtml, "data-gosaki-supabase-anon-key").length > 20,
);
assert(
  "built admin auth configured true",
  extractDataAttr(adminHtml, "data-gosaki-supabase-auth-configured") === "true",
);
assert("built admin auth ready message", adminHtml.includes("Supabase Auth: configured"));
assert(
  "built admin no build-missing auth warn",
  !adminHtml.includes("Supabase Auth 未設定 — build 時に"),
);
assert("built admin no production ref", !adminHtml.includes(PRODUCTION_PROJECT_REF));
assert("built admin no service_role", !/service_role/i.test(adminHtml));
assert("built admin no GITHUB_TOKEN", !/GITHUB_TOKEN/i.test(adminHtml));
assert("built admin Save disabled", adminHtml.includes("Save（無効）") && /disabled/.test(adminHtml));
assert("built admin Publish disabled", adminHtml.includes("Publish（無効）"));
assert("built admin Deploy disabled", adminHtml.includes("Deploy（無効）"));

assert("manual-upload admin exists", exists(MANUAL_ADMIN_REL));
assert("manual-upload auth configured", manualAdminHtml.includes('data-gosaki-supabase-auth-configured="true"'));
assert("manual-upload package dir", exists(PACKAGE_REL));
assert("manual-upload zip", exists(`${PACKAGE_REL}/gosaki-piano-manual-upload.zip`));

const trackedScan = [ADMIN_PAGE_REL, ENV_LIB_REL, BUILD_SCRIPT_REL, DOC_REL]
  .map((rel) => read(rel))
  .join("\n");
assert("tracked sources no anon jwt literal", !/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/.test(trackedScan));

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
console.log(`G-11c4b verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
