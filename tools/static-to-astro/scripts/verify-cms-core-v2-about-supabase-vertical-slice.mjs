/**
 * CMS Core v2 — About Supabase vertical slice local implementation verifier.
 * Static checks only — no DB / Edge deploy / FTP / Contents write / Save arm.
 *
 * Run: node tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-vertical-slice.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ABOUT_FIELD_KEY_PROFILE_LEDE,
  ABOUT_PAGE_KEY,
  ABOUT_SITE_PAGE_FIELDS_BUILD_READ_ENV,
  ABOUT_SUPABASE_DRY_RUN_APPROVAL_ID,
  ABOUT_SUPABASE_ENDPOINT_NAME,
  ABOUT_SUPABASE_PATH_ENABLED_ENV,
  ABOUT_SUPABASE_SAVE_APPROVAL_ID,
  ABOUT_SUPABASE_SAVE_ARMED_ENV,
  ABOUT_SUPABASE_SAVE_UI_ARMED_ENV,
  CMS_CORE_V2_ABOUT_PHASE,
  PRODUCTION_REF_STOP,
  STAGING_PROJECT_REF,
  extractProfileLedeFromBody,
  overlayProfileLedeInHtml,
  planAboutProfileLedeDryRun,
} from "./lib/cms-core-v2-about-supabase-contract.mjs";
import { loadSitePageFieldsDataForBuild } from "./lib/site-cms-features.mjs";
import { GOSAKI_SITE_KEY, TOOL_ROOT } from "./lib/site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const LEDE = "後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。";

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

assert("phase id", CMS_CORE_V2_ABOUT_PHASE.includes("about-supabase"));
assert("staging ref", STAGING_PROJECT_REF === "kmjqppxjdnwwrtaeqjta");
assert("production stop", PRODUCTION_REF_STOP === "vsbvndwuajjhnzpohghh");
assert("page/field keys", ABOUT_PAGE_KEY === "about" && ABOUT_FIELD_KEY_PROFILE_LEDE === "profile.lede");
assert("path env", ABOUT_SUPABASE_PATH_ENABLED_ENV.includes("ABOUT_SUPABASE_PATH"));
assert("save ui arm env", ABOUT_SUPABASE_SAVE_UI_ARMED_ENV.includes("SAVE_UI_ARMED"));
assert("server arm env", ABOUT_SUPABASE_SAVE_ARMED_ENV === "GOSAKI_ABOUT_SUPABASE_SAVE_ARMED");
assert("build-read env", ABOUT_SITE_PAGE_FIELDS_BUILD_READ_ENV === "CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ");
assert("dry-run approval", ABOUT_SUPABASE_DRY_RUN_APPROVAL_ID.includes("profile-lede-dry-run"));
assert("save approval", ABOUT_SUPABASE_SAVE_APPROVAL_ID.includes("web-save-non-dry-run"));
assert("no G-12a reuse in approvals", !ABOUT_SUPABASE_DRY_RUN_APPROVAL_ID.includes("G-12a"));

const overlay = overlayProfileLedeInHtml(
  `<p class="x">old lede</p>\n<p class="x">second</p>`,
  LEDE,
);
assert("overlay replaces first p only", overlay.includes(LEDE) && overlay.includes("second"));
assert("extract lede from body", extractProfileLedeFromBody(`${LEDE}\n\nmore`) === LEDE);

const plan = planAboutProfileLedeDryRun({
  before: { valueText: LEDE, updatedAt: "2026-07-24T00:00:00Z", published: true, sortOrder: 10 },
  after: { valueText: LEDE, published: true, sortOrder: 10 },
});
assert("dry-run plan noChange", plan.ok && plan.noChange === true);

const planChange = planAboutProfileLedeDryRun({
  before: { valueText: LEDE, updatedAt: "2026-07-24T00:00:00Z" },
  after: { valueText: `${LEDE}x` },
});
assert("dry-run plan change", planChange.ok && planChange.changedFields.includes("value_text"));

const off = await loadSitePageFieldsDataForBuild({
  siteKey: GOSAKI_SITE_KEY,
  toolRoot: TOOL_ROOT,
  env: {},
});
assert("build loader default null (feature+env off)", off === null);

const registry = JSON.parse(read("tools/static-to-astro/config/sites/registry.json"));
assert(
  "registry sitePageFields default false",
  registry.sites["gosaki-piano"].supabaseFeatures.sitePageFields === false,
);

const features = read("tools/static-to-astro/scripts/lib/site-cms-features.mjs");
assert("loader exported", features.includes("loadSitePageFieldsDataForBuild"));
assert("sitePageFields feature id", features.includes("sitePageFields"));

const aboutContent = read("tools/static-to-astro/scripts/lib/gosaki-about-content.mjs");
assert("about overlay helper", aboutContent.includes("applySitePageFieldsLedeToAboutConfig"));
assert("about accepts pageFieldsBundle", aboutContent.includes("pageFieldsBundle"));

const hooks = read("tools/static-to-astro/scripts/lib/site-generator-hooks.mjs");
assert("hooks pass pageFieldsBundle", hooks.includes("pageFieldsBundle"));

const convert = read("tools/static-to-astro/scripts/convert-static-to-astro.mjs");
assert("convert loads pageFields", convert.includes("pageFieldsBundle"));

const loaders = read("tools/static-to-astro/scripts/lib/site-aware-supabase-loaders.mjs");
assert("loaders include pageFields", loaders.includes("pageFields"));

const adminLib = read(
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts",
);
assert("admin path env wired", adminLib.includes(ABOUT_SUPABASE_PATH_ENABLED_ENV));
assert("admin save ui arm wired", adminLib.includes(ABOUT_SUPABASE_SAVE_UI_ARMED_ENV));
assert("admin path helper", adminLib.includes("isGosakiAboutSupabasePathEnabled"));
assert("admin resolve operational endpoints", adminLib.includes("resolveAboutOperationalDryRunEndpoint"));
assert("admin G-12a retained", adminLib.includes("G-12a-gosaki-about-content-dry-run"));
assert("admin single-arm note via separate arms", adminLib.includes("ABOUT_SUPABASE_SAVE_UI_ARMED_ENV"));

const adminPage = read(
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro",
);
assert("admin page write-backend attr", adminPage.includes("data-gosaki-about-write-backend"));
assert("admin page uses operational resolve", adminPage.includes("resolveAboutOperationalDryRunEndpoint"));
assert("admin page supabase path phase", adminPage.includes("ABOUT_SUPABASE_PATH_PHASE"));
assert(
  "admin page wires supabase about builders",
  adminPage.includes("buildAboutSupabaseDryRunEndpointRequest") &&
    adminPage.includes('aboutWriteBackend === "supabase"'),
);
assert(
  "admin page passes writeBackend to about edit",
  adminPage.includes("writeBackend: aboutUseSupabase"),
);
assert(
  "admin page wires supabase About sanitizers",
  adminPage.includes("sanitizeAboutSupabaseDryRunEndpointDisplay") &&
    adminPage.includes("sanitizeAboutSupabaseSaveEndpointDisplay") &&
    /sanitizeDryRunDisplay:\s*aboutUseSupabase/.test(adminPage) &&
    /sanitizeSaveDisplay:\s*aboutUseSupabase/.test(adminPage),
);

const aboutEdit = read(
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-about-operational-edit.ts",
);
assert("about edit maps value_text_required", aboutEdit.includes("value_text_required"));
assert(
  "about edit user-facing mapper",
  aboutEdit.includes("userFacingAboutErrorMessage") &&
    aboutEdit.includes("プロフィール本文を入力してください"),
);
assert(
  "about edit supabase read hydrate",
  aboutEdit.includes("buildAboutSupabaseReadEndpointRequest") &&
    aboutEdit.includes("sanitizeAboutSupabaseReadDisplay") &&
    aboutEdit.includes("overlayAboutProfileLedeInBody"),
);
assert(
  "about edit read failure falls back to baked JSON",
  aboutEdit.includes("finishWithBakedJson") &&
    aboutEdit.includes("Fail closed to baked JSON"),
);
assert(
  "about edit stores lede updatedAt baseline",
  aboutEdit.includes("supabaseLedeUpdatedAtBaseline"),
);
assert(
  "about edit supabase dry-run lock without fileSha",
  aboutEdit.includes("dryRunExpectedBeforeUpdatedAt") &&
    aboutEdit.includes("hasDryRunLockReady") &&
    aboutEdit.includes("dryRunFormMatchesForSave") &&
    aboutEdit.includes("fingerprintPresentForGate"),
);
assert(
  "about edit supabase Save overlays lede only",
  aboutEdit.includes("isSupabasePath") &&
    aboutEdit.includes("afterValueText") &&
    aboutEdit.includes("overlayAboutProfileLedeInBody"),
);
assert(
  "about edit maps stale_optimistic_lock",
  aboutEdit.includes("stale_optimistic_lock"),
);
assert(
  "about panel HTML has no visible value_text_required",
  !read(
    "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingAboutContentPanel.astro",
  ).includes("value_text_required"),
);

// Mapper contract (no browser): raw codes must never pass through as UI copy.
{
  const mapped = {
    value_text_required: "プロフィール本文を入力してください",
  };
  assert(
    "mapper turns value_text_required into Japanese",
    mapped.value_text_required === "プロフィール本文を入力してください" &&
      aboutEdit.includes(`value_text_required: "${mapped.value_text_required}"`),
  );
}

assert("admin lib read operation const", adminLib.includes("ABOUT_SUPABASE_READ_OPERATION"));
assert("admin lib build read request", adminLib.includes("buildAboutSupabaseReadEndpointRequest"));
assert("admin lib overlay lede helper", adminLib.includes("overlayAboutProfileLedeInBody"));
assert("admin lib sanitize read display", adminLib.includes("sanitizeAboutSupabaseReadDisplay"));
assert(
  "admin lib supabase dry-run sanitize",
  adminLib.includes("sanitizeAboutSupabaseDryRunEndpointDisplay"),
);
assert(
  "admin lib supabase Save sanitize",
  adminLib.includes("sanitizeAboutSupabaseSaveEndpointDisplay"),
);
assert(
  "admin lib Contents dry-run sanitize retained",
  adminLib.includes("export function sanitizeAboutDryRunEndpointDisplay"),
);
assert(
  "admin lib Contents Save sanitize retained",
  adminLib.includes("export function sanitizeAboutSaveEndpointDisplay"),
);
assert(
  "admin lib Save gate accepts supabase approval",
  adminLib.includes("ABOUT_SUPABASE_SAVE_APPROVAL_ID") &&
    /expectedApprovalId !== G12A_ABOUT_SAVE_APPROVAL_ID[\s\S]*?ABOUT_SUPABASE_SAVE_APPROVAL_ID/.test(
      adminLib,
    ),
);
assert(
  "supabase dry-run sanitize requires updatedAt not fileSha",
  /function sanitizeAboutSupabaseDryRunEndpointDisplay[\s\S]*?expectedBeforeUpdatedAt[\s\S]*?Intentionally omit currentFileSha/.test(
    adminLib,
  ),
);
assert(
  "supabase Save sanitize requires didWrite dbWrite after fields",
  /function sanitizeAboutSupabaseSaveEndpointDisplay[\s\S]*?data\.didWrite === true[\s\S]*?data\.dbWrite === true[\s\S]*?afterValueText[\s\S]*?afterUpdatedAt/.test(
    adminLib,
  ),
);
assert(
  "Contents Save still requires commitSha",
  /function sanitizeAboutSaveEndpointDisplay[\s\S]*?commitSha[\s\S]*?committed/.test(adminLib) &&
    /aboutUnsafeContentsSaveFlags[\s\S]*?commitSha/.test(adminLib),
);
assert(
  "read request has no nextValueText / save approval",
  /function buildAboutSupabaseReadEndpointRequest[\s\S]*?operation:\s*ABOUT_SUPABASE_READ_OPERATION/.test(
    adminLib,
  ) &&
    !/function buildAboutSupabaseReadEndpointRequest[\s\S]{0,400}nextValueText/.test(adminLib) &&
    !/function buildAboutSupabaseReadEndpointRequest[\s\S]{0,400}SAVE_APPROVAL/.test(adminLib),
);

// Overlay: first paragraph only
{
  const body = "seed lede\n\nsecond paragraph";
  // Mirror overlayAboutProfileLedeInBody plain-text branch
  const next = "db lede";
  const parts = body.split(/\n\s*\n/);
  parts[0] = next;
  const overlaid = parts.join("\n\n");
  assert("overlay replaces first paragraph only", overlaid === "db lede\n\nsecond paragraph");
  assert(
    "overlay helper source matches first-paragraph semantics",
    adminLib.includes("parts[0] = next") && adminLib.includes("parts.join(\"\\n\\n\")"),
  );
}

// sanitizeAboutSupabaseReadDisplay contract (inline)
{
  const good = {
    ok: true,
    operation: "read",
    pageKey: "about",
    fieldKey: "profile.lede",
    valueText: "hello",
    updatedAt: "2026-07-28T00:00:00Z",
    didWrite: false,
    dbWrite: false,
    networkWrite: false,
  };
  const badWrite = { ...good, didWrite: true };
  const empty = { ...good, valueText: "" };
  assert(
    "sanitize read accepts clean payload shape in source",
    adminLib.includes('String(data.operation ?? "") === ABOUT_SUPABASE_READ_OPERATION') &&
      adminLib.includes("unsafeWriteFlags"),
  );
  assert("read success payload has write flags false", good.didWrite === false && good.dbWrite === false);
  assert("read rejects didWrite true conceptually", badWrite.didWrite === true);
  assert("read rejects empty valueText conceptually", empty.valueText === "");
}

const edgeHandler = read("supabase/functions/gosaki-about-supabase-save-dry-run/handler.ts");
const edgeIndex = read("supabase/functions/gosaki-about-supabase-save-dry-run/index.ts");
assert("edge endpoint name", edgeHandler.includes(ABOUT_SUPABASE_ENDPOINT_NAME));
assert("edge save arm check", edgeHandler.includes(ABOUT_SUPABASE_SAVE_ARMED_ENV));
assert("edge save disarmed by default path", edgeHandler.includes("save_not_armed"));
assert("edge optimistic lock", edgeHandler.includes("expectedBeforeUpdatedAt"));
assert("edge can_write_site", edgeHandler.includes("can_write_site"));
assert("edge profile.lede only", edgeHandler.includes("profile.lede"));
assert("edge read operation const", edgeHandler.includes('READ_OPERATION = "read"'));
assert(
  "edge read returns before value_text_required gate",
  /if \(operation === READ_OPERATION\) \{[\s\S]*?valueText: before\.valueText[\s\S]*?\}\s*\n\s*\n\s*if \(!nextValueText\)/.test(
    edgeHandler,
  ),
);
assert(
  "edge read response has write flags false",
  /operation: READ_OPERATION[\s\S]*?\.\.\.WRITE_FALSE/.test(edgeHandler),
);
assert(
  "edge read does not require Save approval before return",
  (() => {
    const idx = edgeHandler.indexOf("if (operation === READ_OPERATION)");
    const end = edgeHandler.indexOf("if (!nextValueText)", idx);
    if (idx < 0 || end < 0) return false;
    const block = edgeHandler.slice(idx, end);
    return (
      block.includes("valueText: before.valueText") &&
      !block.includes("SAVE_APPROVAL_ID") &&
      !block.includes("nextValueText")
    );
  })(),
);
assert("edge service_role connected false", /SUPABASE_SERVICE_ROLE_CONNECTED\s*=\s*false/.test(edgeHandler));
assert("edge no service_role grant/use", !/service_role\s*key|grant\s+.*service_role|createClient\([^)]*service/i.test(edgeHandler));
assert("edge local banner", /LOCAL IMPLEMENTATION/i.test(edgeIndex));
assert("edge tools mirror", exists("tools/static-to-astro/scripts/edge-functions/gosaki-about-supabase-save-dry-run/handler.ts"));

const mirrorHandler = read(
  "tools/static-to-astro/scripts/edge-functions/gosaki-about-supabase-save-dry-run/handler.ts",
);
assert("root/mirror handler byte match", edgeHandler === mirrorHandler);

const saveNotArmedBlock = edgeHandler.match(
  /if\s*\(!isAboutSupabaseSaveArmed\([\s\S]*?return\s*\{([\s\S]*?)\};\s*\n\s*\}\s*\n\s*\n\s*if\s*\(!expectedBeforeUpdatedAt/,
);
assert("save_not_armed return block found", Boolean(saveNotArmedBlock));
const snBody = saveNotArmedBlock?.[1] ?? "";
const planIdx = snBody.indexOf("...plan");
const okFalseIdx = snBody.search(/ok:\s*false/);
assert(
  "save_not_armed spreads plan before ok:false",
  planIdx >= 0 && okFalseIdx > planIdx,
  `plan@${planIdx} ok:false@${okFalseIdx}`,
);
assert("save_not_armed status 403", /status:\s*403/.test(snBody));
assert("save_not_armed error literal", snBody.includes('error: "save_not_armed"'));
assert("save_not_armed saveArmed false", /saveArmed:\s*false/.test(snBody));
assert("save_not_armed WRITE_FALSE after plan", snBody.includes("...WRITE_FALSE"));

// Contract regression: plan.ok must not win over rejection ok
{
  const planLike = {
    ok: true,
    dryRun: false,
    pageKey: "about",
    fieldKey: "profile.lede",
    didWrite: false,
  };
  const writeFalse = { didWrite: false, dbWrite: false, networkWrite: false };
  const body = {
    status: 403,
    ...planLike,
    ok: false,
    error: "save_not_armed",
    saveArmed: false,
    ...writeFalse,
  };
  assert("save_not_armed contract ok false", body.ok === false);
  assert("save_not_armed contract status 403", body.status === 403);
  assert("save_not_armed contract error", body.error === "save_not_armed");
  assert("save_not_armed contract didWrite false", body.didWrite === false);
  assert("save_not_armed contract dbWrite false", body.dbWrite === false);
  assert("save_not_armed contract saveArmed false", body.saveArmed === false);
  assert("save_not_armed contract keeps plan pageKey", body.pageKey === "about");
}

const otherPlanAfterOkFalse = [
  ...edgeHandler.matchAll(/ok:\s*false[\s\S]{0,120}\.\.\.plan/g),
];
assert(
  "no other ok:false then ...plan overwrite pattern",
  otherPlanAfterOkFalse.length === 0,
  `found ${otherPlanAfterOkFalse.length}`,
);

const contentsDryRun = read("supabase/functions/gosaki-about-content-dry-run/index.ts");
const contentsSave = read("supabase/functions/gosaki-about-content-save/index.ts");
assert("contents dry-run retained", contentsDryRun.length > 100);
assert("contents save retained", contentsSave.length > 100);

const aboutJson = read("tools/static-to-astro/config/sites/gosaki-piano-about-content.json");
assert("json sot lede retained", aboutJson.includes(LEDE));

const doc = "tools/static-to-astro/docs/cms-core-v2-about-supabase-vertical-slice-local-implementation.md";
assert("implementation doc exists", exists(doc));
const docText = read(doc);
assert("doc flags", docText.includes(ABOUT_SUPABASE_PATH_ENABLED_ENV));
assert("doc fallback", /fallback|Contents/i.test(docText));
assert("doc save arm false", /SAVE_ARMED|arms?\s*false/i.test(docText));
assert("doc no FTP apply", /readyForAnyFutureFtpApply:\s*false|FTP.*false/i.test(docText));

const qaDoc = "tools/static-to-astro/docs/cms-core-v2-about-supabase-ftp-post-qa.md";
assert("ftp qa doc exists", exists(qaDoc));

const ai00 = read("tools/static-to-astro/docs/ai/00-current-state.md");
const ai03 = read("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoff = read("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");
assert("ai00 about local impl", /about-supabase-vertical-slice-local|About.*dual-path|About.*local implementation/i.test(ai00));
assert("ai03 about local impl", /aboutSupabaseLocalImplementation|ABOUT_SUPABASE|dual-path/i.test(ai03));
assert("handoff about local impl", /aboutSupabaseLocalImplementation|About.*dual-path|local implementation/i.test(handoff));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
