/**
 * CMS Core v2 — About Supabase public build-read local implementation verifier.
 * Local code + docs only — no package / FTP / DB / Secret / Save arm.
 *
 * Run: node tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-public-build-read-local-implementation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { finalizeSitePageFieldsLoadResult } from "./lib/site-cms-features.mjs";
import {
  buildAboutPublicBuildReadEvidence,
  applySitePageFieldsLedeToAboutConfig,
  ABOUT_PUBLIC_BUILD_READ_REPORT_NAME as ABOUT_REPORT_FROM_CONTENT,
} from "./lib/gosaki-about-content.mjs";
import {
  EXPECTED_ABOUT_ADMIN_PATH_BAKE,
  EXPECTED_ABOUT_ADMIN_PATH_BAKE_PUBLIC_BUILD_READ,
  ABOUT_PUBLIC_BUILD_READ_REPORT_NAME,
  GOSAKI_ABOUT_PROFILE_LEDE_BASELINE,
} from "./lib/package-run-marker.mjs";
import {
  assertGitWorkingTreeCleanForManualUploadPackage,
  inspectGitWorkingTreeForManualUploadPackage,
} from "./lib/package-upload-safety.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

const DOC_REL =
  "tools/static-to-astro/docs/cms-core-v2-about-supabase-public-build-read-local-implementation.md";
const PLAN_REL =
  "tools/static-to-astro/docs/cms-core-v2-about-supabase-public-build-read-planning.md";
const LOADER = "tools/static-to-astro/scripts/lib/site-cms-features.mjs";
const ABOUT = "tools/static-to-astro/scripts/lib/gosaki-about-content.mjs";
const MARKER = "tools/static-to-astro/scripts/lib/package-run-marker.mjs";
const BUILD_CORE = "tools/static-to-astro/scripts/lib/build-site-package-core.mjs";
const VERIFY_CORE = "tools/static-to-astro/scripts/lib/verify-site-package-core.mjs";
const PKG_JSON = "tools/static-to-astro/package.json";
const REGISTRY = "tools/static-to-astro/config/sites/registry.json";

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
const plan = exists(PLAN_REL) ? read(PLAN_REL) : "";
const loader = exists(LOADER) ? read(LOADER) : "";
const about = exists(ABOUT) ? read(ABOUT) : "";
const marker = exists(MARKER) ? read(MARKER) : "";
const buildCore = exists(BUILD_CORE) ? read(BUILD_CORE) : "";
const verifyCore = exists(VERIFY_CORE) ? read(VERIFY_CORE) : "";
const pkgJson = exists(PKG_JSON) ? read(PKG_JSON) : "";
const registry = exists(REGISTRY) ? JSON.parse(read(REGISTRY)) : null;

assert("implementation doc exists", exists(DOC_REL));
assert("planning doc exists", exists(PLAN_REL));
assert(
  "impl complete gate",
  /ABOUT_SUPABASE_PUBLIC_BUILD_READ_LOCAL_IMPLEMENTATION_COMPLETE:\s*true/.test(doc),
);
assert("implementation executed", /IMPLEMENTATION_EXECUTED:\s*true/.test(doc));
assert("package not generated", /PACKAGE_GENERATE_EXECUTED:\s*false/.test(doc));
assert("FTP not executed", /FTP_EXECUTED:\s*false/.test(doc));
assert("Save arm false", /SAVE_ARM_ENABLED:\s*false/.test(doc));
assert("registry still false", /REGISTRY_SITE_PAGE_FIELDS:\s*false/.test(doc));
assert("ready for package generate", /readyForAboutSupabasePublicBuildReadPackageGenerate:\s*true/.test(doc));
assert("planning notes impl", /LOCAL_IMPLEMENTATION|local implementation/i.test(plan));
assert("multi-row harden in loader", loader.includes("multiple_profile_lede_rows"));
assert("finalizeSitePageFieldsLoadResult exported", loader.includes("finalizeSitePageFieldsLoadResult"));
assert("fieldCount in loader path", /fieldCount:\s*1/.test(loader) || loader.includes("fieldCount:"));
assert("evidence builder", about.includes("buildAboutPublicBuildReadEvidence"));
assert("report write", about.includes("writeAboutPublicBuildReadReport"));
assert("profileLedeOverlayApplied", about.includes("profileLedeOverlayApplied"));
assert("expected bake public build-read", marker.includes("EXPECTED_ABOUT_ADMIN_PATH_BAKE_PUBLIC_BUILD_READ"));
assert("validate public build-read artifacts", marker.includes("validateGosakiAboutPublicBuildReadArtifacts"));
assert("default bake build-read false", /publicAboutBuildRead:\s*false/.test(marker));
assert("build copies report", buildCore.includes("ABOUT_PUBLIC_BUILD_READ_REPORT_NAME"));
assert("build enriches marker evidence", buildCore.includes("buildReadEvidence"));
assert("verify expectPublicAboutBuildRead", verifyCore.includes("expectPublicAboutBuildRead"));
assert(
  "verify default expectPublicAboutBuildRead false",
  /expectPublicAboutBuildRead\s*=\s*false/.test(verifyCore),
);
assert("npm script public-about-build-read", pkgJson.includes("verify:manual-upload:public-about-build-read"));
assert(
  "registry sitePageFields false",
  registry?.sites?.["gosaki-piano"]?.supabaseFeatures?.sitePageFields === false,
);
assert("report name shared", ABOUT_REPORT_FROM_CONTENT === ABOUT_PUBLIC_BUILD_READ_REPORT_NAME);
assert("default expected bake still false", EXPECTED_ABOUT_ADMIN_PATH_BAKE.publicAboutBuildRead === false);
assert(
  "build-read expected bake true",
  EXPECTED_ABOUT_ADMIN_PATH_BAKE_PUBLIC_BUILD_READ.publicAboutBuildRead === true &&
    EXPECTED_ABOUT_ADMIN_PATH_BAKE_PUBLIC_BUILD_READ.aboutSaveUiArmed === false,
);
assert("baseline lede constant", GOSAKI_ABOUT_PROFILE_LEDE_BASELINE.includes("後藤 沙紀"));

// Pure fallback fixtures (no network)
{
  const mapRow = (row) => ({ valueText: String(row?.value_text ?? "") });
  const empty = finalizeSitePageFieldsLoadResult({ fields: [], siteSlug: "gosaki-piano", mapSitePageFieldRowToLedeDraft: mapRow });
  assert("0-row → supabase-empty", empty.pageFieldDataSource === "supabase-empty" && empty.fieldCount === 0);
  const multi = finalizeSitePageFieldsLoadResult({
    fields: [{ value_text: "a" }, { value_text: "b" }],
    siteSlug: "gosaki-piano",
    mapSitePageFieldRowToLedeDraft: mapRow,
  });
  assert(
    "multi-row → error",
    multi.pageFieldDataSource === "error" && multi.fallbackReason === "multiple_profile_lede_rows",
  );
  const blank = finalizeSitePageFieldsLoadResult({
    fields: [{ value_text: "  " }],
    siteSlug: "gosaki-piano",
    mapSitePageFieldRowToLedeDraft: mapRow,
  });
  assert("empty value → supabase-empty", blank.pageFieldDataSource === "supabase-empty");
  const ok = finalizeSitePageFieldsLoadResult({
    fields: [{ value_text: GOSAKI_ABOUT_PROFILE_LEDE_BASELINE }],
    siteSlug: "gosaki-piano",
    mapSitePageFieldRowToLedeDraft: mapRow,
  });
  assert("exactly 1 row → supabase", ok.pageFieldDataSource === "supabase" && ok.fieldCount === 1);

  const successEv = buildAboutPublicBuildReadEvidence({
    pageFieldsBundle: ok,
    ledeOverlaid: true,
    overlayReason: null,
  });
  assert("success evidence no fallbackReason", successEv.fallbackReason == null);
  assert("success evidence overlay true", successEv.profileLedeOverlayApplied === true);
  assert("success evidence outcome applied", successEv.overlayOutcome === "applied");
  const equalEv = buildAboutPublicBuildReadEvidence({
    pageFieldsBundle: ok,
    ledeOverlaid: false,
    overlayOutcome: "noop_equal",
    overlayReason: null,
  });
  assert("noop_equal is success", equalEv.fallbackReason == null);
  assert("noop_equal overlayApplied false", equalEv.profileLedeOverlayApplied === false);
  assert("noop_equal outcome", equalEv.overlayOutcome === "noop_equal");
  assert("noop_equal keeps lede text", equalEv.profileLedeValueText === GOSAKI_ABOUT_PROFILE_LEDE_BASELINE);
  const fbEv = buildAboutPublicBuildReadEvidence({
    pageFieldsBundle: multi,
    ledeOverlaid: false,
    overlayOutcome: "failed",
    overlayReason: "page_fields_not_supabase",
  });
  assert("fallback evidence has reason", Boolean(fbEv.fallbackReason));
}

{
  const baseline = GOSAKI_ABOUT_PROFILE_LEDE_BASELINE;
  const config = {
    blocks: [
      {
        id: "about-profile-html",
        enabled: true,
        html: `<p>${baseline}</p><p>second</p>`,
      },
    ],
  };
  const equal = applySitePageFieldsLedeToAboutConfig(config, {
    pageFieldDataSource: "supabase",
    profileLede: { valueText: baseline },
    fieldCount: 1,
  });
  assert("overlay noop_equal when texts match", equal.overlayOutcome === "noop_equal");
  assert("overlay noop_equal not applied flag", equal.ledeOverlaid === false);
  const applied = applySitePageFieldsLedeToAboutConfig(config, {
    pageFieldDataSource: "supabase",
    profileLede: { valueText: "different lede text for applied path" },
    fieldCount: 1,
  });
  assert("overlay applied when texts differ", applied.overlayOutcome === "applied" && applied.ledeOverlaid === true);
}

assert(
  "clean-tree helper exported",
  typeof assertGitWorkingTreeCleanForManualUploadPackage === "function" &&
    typeof inspectGitWorkingTreeForManualUploadPackage === "function",
);
assert(
  "create-manual-upload has clean-tree gate",
  read("tools/static-to-astro/scripts/create-manual-upload-package.mjs").includes(
    "assertGitWorkingTreeCleanForManualUploadPackage",
  ),
);
{
  // Current repo is expected dirty during this fix phase — inspect should report not clean.
  // Gate function must throw when dirty (no override).
  const insp = inspectGitWorkingTreeForManualUploadPackage(REPO_ROOT);
  if (!insp.clean) {
    let threw = false;
    try {
      assertGitWorkingTreeCleanForManualUploadPackage(REPO_ROOT);
    } catch {
      threw = true;
    }
    assert("clean-tree assert throws when dirty", threw);
  } else {
    assert("clean-tree assert throws when dirty", true);
  }
}

const fixture = spawnSync(
  "node",
  [path.join(TOOL_ROOT, "scripts/verify-package-stale-backup-and-run-marker.mjs")],
  { cwd: REPO_ROOT, encoding: "utf8", env: { ...process.env, FORCE_COLOR: "0" } },
);
assert(
  "package stale/build-read fixtures PASS",
  fixture.status === 0,
  fixture.status === 0
    ? ""
    : `${fixture.stdout}\n${fixture.stderr}`.trim().split("\n").slice(-8).join(" | "),
);

const vertical = spawnSync(
  "node",
  [path.join(REPO_ROOT, "tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-vertical-slice.mjs")],
  { cwd: REPO_ROOT, encoding: "utf8", env: { ...process.env, FORCE_COLOR: "0" } },
);
assert("About vertical slice PASS", vertical.status === 0);

// Live package may be HEAD-stale (docs-only commits after last generate) — do not require
// verify:manual-upload PASS here. Default bake expectation remains publicAboutBuildRead=false.

const diffCheck = spawnSync("git", ["diff", "--check"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("git diff --check clean", diffCheck.status === 0, diffCheck.stdout || diffCheck.stderr || "");

console.log("");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) process.exit(1);
console.log("OK cms-core-v2-about-supabase-public-build-read-local-implementation");
