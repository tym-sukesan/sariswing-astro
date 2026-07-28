/**
 * CMS Core v2 — About Supabase public build-read planning verifier.
 * Planning only — no impl flip / package / FTP / Edge / Secret / SQL / Save arm.
 *
 * Run: node tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-public-build-read-planning.mjs
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
const BUILD_READ_ENV = "CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ";
const BASELINE_TEXT = "後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。";

const DOC_REL =
  "tools/static-to-astro/docs/cms-core-v2-about-supabase-public-build-read-planning.md";
const ROUNDTRIP_RESULT_REL =
  "tools/static-to-astro/docs/cms-core-v2-about-supabase-profile-lede-save-roundtrip-result.md";
const FTP_QA_REL = "tools/static-to-astro/docs/cms-core-v2-about-supabase-ftp-post-qa.md";
const YT_TEMPLATE_REL =
  "tools/static-to-astro/docs/cms-core-v2-youtube-supabase-public-build-read-package-prep.md";
const LOADER_REL = "tools/static-to-astro/scripts/lib/site-cms-features.mjs";
const ABOUT_CONTENT_REL = "tools/static-to-astro/scripts/lib/gosaki-about-content.mjs";
const CONTRACT_REL =
  "tools/static-to-astro/scripts/lib/cms-core-v2-about-supabase-contract.mjs";
const MARKER_REL = "tools/static-to-astro/scripts/lib/package-run-marker.mjs";
const VERIFY_CORE_REL = "tools/static-to-astro/scripts/lib/verify-site-package-core.mjs";
const ANON_REL = "tools/static-to-astro/scripts/lib/supabase-schedule-read.mjs";
const RLS_REL =
  "tools/static-to-astro/scripts/supabase/cms-core-v2-site-page-fields-rls.template.sql";
const REGISTRY_REL = "tools/static-to-astro/config/sites/registry.json";
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
const roundtrip = exists(ROUNDTRIP_RESULT_REL) ? read(ROUNDTRIP_RESULT_REL) : "";
const ftpQa = exists(FTP_QA_REL) ? read(FTP_QA_REL) : "";
const loader = exists(LOADER_REL) ? read(LOADER_REL) : "";
const aboutContent = exists(ABOUT_CONTENT_REL) ? read(ABOUT_CONTENT_REL) : "";
const contract = exists(CONTRACT_REL) ? read(CONTRACT_REL) : "";
const marker = exists(MARKER_REL) ? read(MARKER_REL) : "";
const verifyCore = exists(VERIFY_CORE_REL) ? read(VERIFY_CORE_REL) : "";
const anon = exists(ANON_REL) ? read(ANON_REL) : "";
const rls = exists(RLS_REL) ? read(RLS_REL) : "";
const registry = exists(REGISTRY_REL) ? JSON.parse(read(REGISTRY_REL)) : null;

assert("planning doc exists", exists(DOC_REL));
assert("prior roundtrip result exists", exists(ROUNDTRIP_RESULT_REL));
assert("ftp-post-qa exists", exists(FTP_QA_REL));
assert("YouTube build-read template exists", exists(YT_TEMPLATE_REL));
assert(
  "phase id",
  doc.includes("cms-core-v2-about-supabase-public-build-read-planning"),
);
assert(
  "planning complete gate",
  /ABOUT_SUPABASE_PUBLIC_BUILD_READ_PLANNING_COMPLETE:\s*true/.test(doc),
);
assert(
  "ready for local implementation",
  /readyForAboutSupabasePublicBuildReadLocalImplementation:\s*true/.test(doc),
);
assert("blocking issue false", /BLOCKING_ISSUE:\s*false/.test(doc));
assert("implementation not executed", /IMPLEMENTATION_EXECUTED:\s*false/.test(doc));
assert("package not generated", /PACKAGE_GENERATE_EXECUTED:\s*false/.test(doc));
assert("FTP not executed", /FTP_EXECUTED:\s*false/.test(doc));
assert("registry sitePageFields false", /REGISTRY_SITE_PAGE_FIELDS:\s*false/.test(doc));
assert("build-read unset", doc.includes(BUILD_READ_ENV) && /unset/.test(doc));
assert("public JSON SoT", /PUBLIC_ABOUT_JSON_SOT:\s*true/.test(doc));
assert("Save arm false", /SAVE_ARM_ENABLED:\s*false/.test(doc));
assert("server arm false", /GOSAKI_ABOUT_SUPABASE_SAVE_ARMED:\s*false/.test(doc));
assert("Save UI false", /PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED:\s*false/.test(doc));
assert("service_role false", /SERVICE_ROLE_USED:\s*false/.test(doc));
assert("FTP apply false", /READY_FOR_ANY_FUTURE_FTP_APPLY:\s*false/.test(doc));
assert("production unchanged", /PRODUCTION_UNCHANGED:\s*true/.test(doc));
assert("staging ref", doc.includes(STAGING_REF));
assert("production STOP", doc.includes(PRODUCTION_REF) && /STOP/i.test(doc));
assert("anon auth recommended", /anon/i.test(doc) && /service_role.*forbid/i.test(doc));
assert("filters site_slug page_key field_key", /site_slug/.test(doc) && /page_key/.test(doc) && /profile\.lede/.test(doc));
assert("fallback 0-row", /0 published|supabase-empty|0行/i.test(doc));
assert("fallback multi-row", /multiple_profile_lede_rows|>1 row|複数行/i.test(doc));
assert("fallback empty value", /Empty `value_text`|empty_profile_lede|空値/i.test(doc));
assert("fallback network error", /error|通信失敗|Network/i.test(doc));
assert("JSON keep never blank", /Never blank About|never blank/i.test(doc));
assert("JSON retention", /JSON retained|fallback forever|JSON fallback/i.test(doc));
assert("env-only first cutover", /env-only|CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ=true/.test(doc));
assert("registry later", /registry\.sitePageFields|REGISTRY_SITE_PAGE_FIELDS/.test(doc));
assert("verifier flag planned", /expect-public-about-build-read|expectPublicAboutBuildRead/.test(doc));
assert("default verify stays false", /publicAboutBuildRead=false|publicAboutBuildRead:false/.test(doc));
assert("stale package / sourceCommit", /sourceCommit|stale-backup|PACKAGE_RUN/.test(doc));
assert("staging QA section", /Browser QA|ftp-post-qa §C|Staging QA/i.test(doc));
assert("STOP conditions", /stop immediately|STOP conditions/i.test(doc));
assert("baseline text", doc.includes(BASELINE_TEXT));
assert("impact isolation", /Bands|YouTube|Schedule|Discography/i.test(doc));
assert(
  "prior roundtrip PASS gate",
  /ABOUT_SUPABASE_PROFILE_LEDE_SAVE_ROUNDTRIP_PASSED:\s*true/.test(roundtrip),
);
assert("ftp-post-qa §C mentions build-read", ftpQa.includes(BUILD_READ_ENV) || /build-read/i.test(ftpQa));

assert("loader function present", loader.includes("loadSitePageFieldsDataForBuild"));
assert("loader env gate", loader.includes(BUILD_READ_ENV));
assert("loader published filter", loader.includes('published", true') || loader.includes(".eq(\"published\", true)"));
assert("loader site_slug filter", loader.includes('site_slug"'));
assert("loader page/field filters", loader.includes("ABOUT_PAGE_KEY") && loader.includes("ABOUT_FIELD_KEY_PROFILE_LEDE"));
assert("loader production block", loader.includes(PRODUCTION_REF));
assert("loader uses anon env", loader.includes("resolveSupabaseAnonReadEnv"));
assert("overlay apply present", aboutContent.includes("applySitePageFieldsLedeToAboutConfig"));
assert("overlay requires supabase source", aboutContent.includes('pageFieldDataSource !== "supabase"'));
assert("contract overlay first p", contract.includes("overlayProfileLedeInHtml"));
assert("contract build-read env const", contract.includes(BUILD_READ_ENV));
assert("PACKAGE_RUN publicAboutBuildRead", marker.includes("publicAboutBuildRead"));
assert("default bake build-read false", /publicAboutBuildRead:\s*false/.test(marker));
assert("verify core uses expectedBake", verifyCore.includes("EXPECTED_ABOUT_ADMIN_PATH_BAKE"));
assert(
  "anon helper rejects service role or documents anon",
  anon.includes("resolveSupabaseAnonReadEnv") &&
    (/service_role/i.test(anon) || /anon/i.test(anon)),
);
assert(
  "RLS public select published",
  /site_page_fields_public_select_published/.test(rls) &&
    /to anon,\s*authenticated/.test(rls) &&
    /published\s*=\s*true/.test(rls),
);
assert(
  "RLS grant select anon",
  /grant select on table public\.site_page_fields to anon/i.test(rls),
);
assert(
  "registry sitePageFields still false",
  registry?.sites?.["gosaki-piano"]?.supabaseFeatures?.sitePageFields === false,
);

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
console.log("OK cms-core-v2-about-supabase-public-build-read-planning");
