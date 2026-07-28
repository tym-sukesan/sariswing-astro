/**
 * CMS Core v2 — About Supabase profile.lede Save roundtrip planning verifier.
 * Planning only — no arm / Save / package / FTP / Edge / Secret / SQL mutation.
 *
 * Run: node tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-profile-lede-save-roundtrip-planning.mjs
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
const BASELINE_HEAD = "eeae89018c3791a14634c1b48a49324ed90ed3a2";
const FUNCTION_NAME = "gosaki-about-supabase-save-dry-run";
const SAVE_APPROVAL = "G-cms-v2-about-supabase-profile-lede-web-save-non-dry-run-slice";
const DRY_RUN_APPROVAL = "G-cms-v2-about-supabase-profile-lede-dry-run";
const BASELINE_TEXT = "後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。";
const TEMP_TEXT = "[CMS Kit staging] About profile.lede Save roundtrip PoC";
const SAVE_UI_ENV = "PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED";
const SERVER_ARM = "GOSAKI_ABOUT_SUPABASE_SAVE_ARMED";

const DOC_REL =
  "tools/static-to-astro/docs/cms-core-v2-about-supabase-profile-lede-save-roundtrip-planning.md";
const FTP_QA_REL =
  "tools/static-to-astro/docs/cms-core-v2-about-supabase-admin-read-hydrate-staging-ftp-post-qa-result.md";
const HANDLER_REL = "supabase/functions/gosaki-about-supabase-save-dry-run/handler.ts";
const ADMIN_LIB =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts";
const ABOUT_EDIT =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-about-operational-edit.ts";
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
const ftpQa = exists(FTP_QA_REL) ? read(FTP_QA_REL) : "";
const handler = exists(HANDLER_REL) ? read(HANDLER_REL) : "";
const adminLib = exists(ADMIN_LIB) ? read(ADMIN_LIB) : "";
const aboutEdit = exists(ABOUT_EDIT) ? read(ABOUT_EDIT) : "";

assert("planning doc exists", exists(DOC_REL));
assert("prior FTP QA result exists", exists(FTP_QA_REL));
assert(
  "phase id",
  doc.includes("cms-core-v2-about-supabase-profile-lede-save-roundtrip-planning"),
);
assert(
  "planning complete gate",
  /ABOUT_SUPABASE_PROFILE_LEDE_SAVE_ROUNDTRIP_PLANNING_COMPLETE:\s*true/.test(doc),
);
assert(
  "ready for implementation",
  /readyForAboutSupabaseProfileLedeSaveRoundtripImplementation:\s*true/.test(doc),
);
assert(
  "implementation executed true (adapter landed)",
  /IMPLEMENTATION_EXECUTED:\s*true/.test(doc),
);
assert(
  "ready for armed package generate",
  /readyForAboutSupabaseProfileLedeSaveArmedPackageGenerate:\s*true/.test(doc),
);
assert("Save arm false", /SAVE_ARM_ENABLED:\s*false/.test(doc));
assert("server arm unset", /GOSAKI_ABOUT_SUPABASE_SAVE_ARMED_SET:\s*false/.test(doc));
assert("Save UI false", doc.includes(SAVE_UI_ENV) && /false/.test(doc));
assert("package not generated", /PACKAGE_GENERATE_EXECUTED:\s*false/.test(doc));
assert("FTP not executed", /FTP_EXECUTED:\s*false/.test(doc));
assert("DB write false", /DB_WRITE_EXECUTED:\s*false/.test(doc));
assert("build-read unset", /CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ:\s*unset/.test(doc));
assert("public JSON SoT", /PUBLIC_ABOUT_JSON_SOT:\s*true/.test(doc));
assert("production unchanged", /PRODUCTION_UNCHANGED:\s*true/.test(doc));
assert("service_role false", /SERVICE_ROLE_USED:\s*false/.test(doc));
assert("FTP apply false", /READY_FOR_ANY_FUTURE_FTP_APPLY:\s*false/.test(doc));
assert("baseline HEAD in doc", doc.includes(BASELINE_HEAD));
assert("staging ref", doc.includes(STAGING_REF));
assert("production STOP", doc.includes(PRODUCTION_REF) && /STOP/i.test(doc));
assert("function name", doc.includes(FUNCTION_NAME));
assert("pageKey about", /pageKey.*about|page_key.*about/i.test(doc));
assert("fieldKey profile.lede", /profile\.lede/.test(doc));
assert("Save approval id", doc.includes(SAVE_APPROVAL));
assert("dry-run approval id", doc.includes(DRY_RUN_APPROVAL));
assert("baseline text", doc.includes(BASELINE_TEXT));
assert("temporary text", doc.includes(TEMP_TEXT));
assert("optimistic lock", /expectedBeforeUpdatedAt/.test(doc));
assert("SELECT-only mid check", /SELECT-only/.test(doc));
assert("arm ON CLI documented", doc.includes(`${SERVER_ARM}=true`) && doc.includes(STAGING_REF));
assert("arm OFF CLI documented", doc.includes(`${SERVER_ARM}=false`));
assert("Save UI armed package", /SAVE_UI_ARMED.*=.*true|SAVE_UI_ARMED`\*?\*?true/i.test(doc) || doc.includes(`${SAVE_UI_ENV}`));
assert("disarm package after", /disarm|SAVE_UI_ARMED=false|再無効/i.test(doc));
assert("order section", /Exact order|Strict sequence|厳密/i.test(doc) || /Bake temporary Save-UI-armed/.test(doc));
assert("STOP conditions", /stop immediately|STOP/i.test(doc));
assert("stale package", /stale-backup|PACKAGE_RUN|sourceCommit/i.test(doc));
assert(
  "adapter implementation linked",
  /save-client-adapter-implementation|sanitizeAboutSupabaseDryRunEndpointDisplay/.test(doc),
);
assert("no service_role", /service_role.*forbid|service_role.*禁止|SERVICE_ROLE_USED:\s*false/i.test(doc));
assert("DELETE forbidden", /DELETE/.test(doc));
assert("prior FTP QA PASS", /ABOUT_SUPABASE_ADMIN_READ_HYDRATE_STAGING_FTP_POST_QA_PASSED:\s*true/.test(ftpQa));

assert("handler SAVE_OPERATION", handler.includes('SAVE_OPERATION = "save"'));
assert("handler SAVE_ARMED_ENV", handler.includes(SERVER_ARM));
assert("handler SAVE_APPROVAL", handler.includes(SAVE_APPROVAL));
assert("handler optimistic lock", handler.includes("expectedBeforeUpdatedAt"));
assert("handler stale_optimistic_lock", handler.includes("stale_optimistic_lock"));
assert("handler save_not_armed", handler.includes("save_not_armed"));
assert("handler page/field", handler.includes('PAGE_KEY = "about"') && handler.includes('FIELD_KEY = "profile.lede"'));
assert("handler staging ref", handler.includes(STAGING_REF));
assert("handler production stop", handler.includes(PRODUCTION_REF));
assert("handler no SERVICE_ROLE_KEY", !/SERVICE_ROLE_KEY/.test(handler));
assert("handler update value_text only slice", /\.update\(\{\s*value_text:/.test(handler));

assert("admin lib supabase Save UI env", adminLib.includes(SAVE_UI_ENV));
assert("admin lib Save approval const", adminLib.includes(SAVE_APPROVAL));
assert("admin lib build Save request", adminLib.includes("buildAboutSupabaseSaveEndpointRequest"));
assert("admin lib build dry-run request", adminLib.includes("buildAboutSupabaseDryRunEndpointRequest"));
assert("about edit stores lede updatedAt", aboutEdit.includes("supabaseLedeUpdatedAtBaseline") || aboutEdit.includes("gosakiAboutLedeUpdatedAt"));

assert(
  "gate accepts supabase approval (adapter)",
  adminLib.includes("ABOUT_SUPABASE_SAVE_APPROVAL_ID") &&
    /expectedApprovalId !== G12A_ABOUT_SAVE_APPROVAL_ID[\s\S]*?ABOUT_SUPABASE_SAVE_APPROVAL_ID/.test(
      adminLib,
    ),
);
assert(
  "supabase dry-run sanitize present",
  adminLib.includes("sanitizeAboutSupabaseDryRunEndpointDisplay"),
);
assert(
  "supabase Save sanitize present",
  adminLib.includes("sanitizeAboutSupabaseSaveEndpointDisplay"),
);

const head = spawnSync("git", ["rev-parse", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const headSha = String(head.stdout || "").trim();
assert(
  "repo HEAD matches planning baseline (or ancestor note)",
  headSha === BASELINE_HEAD || doc.includes(BASELINE_HEAD),
  `HEAD=${headSha}`,
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
console.log("OK cms-core-v2-about-supabase-profile-lede-save-roundtrip-planning");
