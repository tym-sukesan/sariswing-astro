/**
 * G-10h4d-1 — Gosaki About bands HTML static JSON write execution prep verification.
 * Run: node tools/static-to-astro/scripts/verify-g10h4d-gosaki-about-bands-html-static-json-write-execution-prep.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  G10H4C_ABOUT_CONTENT_CONFIG_REL,
  G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
  G10H4C_BANDS_HTML_MAX_LENGTH,
  G10H4C_SITE_SLUG,
  G10H4C_TARGET_BLOCK_ID,
  G10H4C_TOTAL_HTML_MAX_LENGTH,
  G10H4D_1_PHASE,
  G10H4D_BANDS_SAVE_TEST_COMMENT,
} from "../../../src/lib/admin/staging-write/gosaki-about-bands-html-static-json-write-types.ts";
import {
  G10H4A_TARGET_BLOCK_ID,
  G10H4B_PROFILE_SAVE_TEST_COMMENT,
} from "../../../src/lib/admin/staging-write/gosaki-about-profile-html-static-json-write-types.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-about-bands-html-static-json-write-execution.md";
const API_REL =
  "src/pages/__admin-staging-shell/musician-basic/api/about-bands-html-static-json-write.json.ts";
const EXECUTOR_REL =
  "src/lib/admin/staging-write/gosaki-about-bands-html-static-json-write-executor.ts";
const CLIENT_SAVE_REL =
  "src/lib/admin/staging-write/gosaki-about-bands-html-static-json-write-client-save.ts";
const RUN_SCRIPT_REL =
  "tools/static-to-astro/scripts/run-g10h4d-gosaki-about-bands-html-static-json-write-execution.mjs";
const OPERATOR_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingAboutOperatorPage.astro";
const UI_REL = "src/lib/admin/staging-data/gosaki-staging-about-content-admin-ui.ts";

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}`);
    failed += 1;
  }
}

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

function validateAboutBandsHtmlSafety(html) {
  const errors = [];
  const warnings = [];
  if (/<script\b/i.test(html)) errors.push("<script>");
  if (/<iframe\b/i.test(html)) errors.push("<iframe>");
  if (/\son[a-z]+\s*=/i.test(html)) errors.push("on*");
  if (/javascript:/i.test(html)) errors.push("javascript:");
  if (/<style\b/i.test(html)) warnings.push("<style>");
  return { ok: errors.length === 0, errors, warnings };
}

function isBandsSaveEnvEnabled(env) {
  return String(env?.G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED ?? "").trim() === "true";
}

function runMirroredDryRun({ html, blockId, siteSlug, approvalId, saveEnabled }) {
  const guardErrors = [];
  if (approvalId !== G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID) {
    guardErrors.push("approvalId mismatch");
  }
  if (siteSlug !== G10H4C_SITE_SLUG) {
    guardErrors.push("siteSlug mismatch");
  }
  if (blockId !== G10H4C_TARGET_BLOCK_ID) {
    guardErrors.push("blockId mismatch");
  }

  const config = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, G10H4C_ABOUT_CONTENT_CONFIG_REL), "utf8"));
  const beforeBlock = config.blocks?.find((b) => b.id === G10H4C_TARGET_BLOCK_ID);
  if (!beforeBlock) guardErrors.push("block missing");

  const beforeHtml = String(beforeBlock?.html ?? "");
  const changedFields = beforeHtml === html ? [] : ["html"];
  const htmlSafety = validateAboutBandsHtmlSafety(html);

  if (!htmlSafety.ok) guardErrors.push(...htmlSafety.errors);
  if (html.length > G10H4C_BANDS_HTML_MAX_LENGTH) {
    guardErrors.push("bands html too long");
  }

  let total = 0;
  for (const block of config.blocks ?? []) {
    total +=
      block.id === G10H4C_TARGET_BLOCK_ID
        ? html.length
        : String(block.html ?? "").length;
  }
  if (total > G10H4C_TOTAL_HTML_MAX_LENGTH) {
    guardErrors.push("total html too long");
  }

  const saveAllowed = saveEnabled === true;
  return {
    ok: guardErrors.length === 0 && changedFields.length > 0,
    changedFields,
    blocksAffected: 1,
    guardErrors,
    htmlSafety,
    saveAllowed,
    saveReadiness: saveAllowed ? "ready_to_save" : "ready_but_save_disabled",
    wouldWrite: false,
    dryRun: true,
    oldLength: beforeHtml.length,
    newLength: html.length,
    lengthDelta: html.length - beforeHtml.length,
  };
}

const doc = read(DOC_REL);
const apiSrc = read(API_REL);
const executorSrc = read(EXECUTOR_REL);
const clientSaveSrc = read(CLIENT_SAVE_REL);
const runScriptSrc = read(RUN_SCRIPT_REL);
const operator = read(OPERATOR_REL);
const uiSrc = read(UI_REL);
const config = JSON.parse(read(G10H4C_ABOUT_CONTENT_CONFIG_REL));
const bandsBlock = config.blocks?.find((b) => b.id === G10H4C_TARGET_BLOCK_ID);
const profileBlock = config.blocks?.find((b) => b.id === G10H4A_TARGET_BLOCK_ID);

if (String(bandsBlock?.html ?? "").includes(G10H4D_BANDS_SAVE_TEST_COMMENT)) {
  console.log(
    "SKIP: G-10h4d execution already complete (bands marker present). Use verify-g10h4d-gosaki-about-bands-html-static-json-write-execution.mjs",
  );
  process.exit(0);
}

assert("G-10h4d-1 doc phase", doc.includes(G10H4D_1_PHASE));
assert("prep complete gate", doc.includes("gosakiAboutBandsHtmlStaticJsonWriteExecutionPrepComplete: true"));
assert("readyFor G-10h4d execution", doc.includes("readyForG10h4dGosakiAboutBandsHtmlStaticJsonWriteExecution: true"));
assert("non-dry-run not executed", doc.includes("nonDryRunSaveExecuted: false"));
assert("actual JSON write not executed", doc.includes("actualJsonWriteExecuted: false"));

assert("executor exists", exists(EXECUTOR_REL));
assert("client save exists", exists(CLIENT_SAVE_REL));
assert("run script exists", exists(RUN_SCRIPT_REL));
assert("executor atomic write", executorSrc.includes("atomicWriteJson"));
assert("executor no service_role", !executorSrc.includes("service_role"));
assert("API calls executor", apiSrc.includes("executeG10h4dAboutBandsHtmlStaticJsonWrite"));
assert("API save_not_enabled when env off", apiSrc.includes("save_not_enabled"));
assert("API no non_dry_run_not_implemented", !apiSrc.includes("non_dry_run_not_implemented"));
assert("UI imports client save", uiSrc.includes("executeG10h4dAboutBandsHtmlStaticJsonClientSave"));
assert("UI bands save gate", uiSrc.includes("evaluateG10h4cAboutBandsHtmlSaveUiGate"));
assert("UI runBandsSave", uiSrc.includes("runBandsSave"));
assert("UI bands save result panel", uiSrc.includes("gosaki-about-bands-save-result"));

assert("run script env gate", runScriptSrc.includes("G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED"));
assert("run script approvalId", runScriptSrc.includes(G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID));
assert("run script siteSlug guard", runScriptSrc.includes("siteSlug"));
assert("run script blockId bands", runScriptSrc.includes(G10H4C_TARGET_BLOCK_ID));
assert("run script already_present", runScriptSrc.includes("already_present"));
assert("run script atomic write", runScriptSrc.includes("atomicWrite"));
assert("run script profile marker check", runScriptSrc.includes("G-10h4b profile save test"));
assert("run script bands marker", runScriptSrc.includes("G10H4D_BANDS_SAVE_TEST_COMMENT"));

assert("operator G-10h4d-1 phase", operator.includes(G10H4D_1_PHASE));
assert("operator bands save result panel", operator.includes("gosaki-about-bands-save-result"));

assert("approvalId exact", doc.includes(G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID));
assert("path allowlist config", doc.includes("gosaki-piano-about-content.json"));
assert("block allowlist bands", doc.includes(G10H4C_TARGET_BLOCK_ID));
assert("writable field html only", doc.includes("html` only") || doc.includes("html only"));

assert("profile marker preserved", String(profileBlock?.html ?? "").includes(G10H4B_PROFILE_SAVE_TEST_COMMENT));
assert("profile marker once", (String(profileBlock?.html ?? "").match(/G-10h4b profile save test/g) || []).length === 1);
assert("bands has no G-10h4d marker yet", !String(bandsBlock?.html ?? "").includes(G10H4D_BANDS_SAVE_TEST_COMMENT));
assert("bands has no G-10h4d marker text", !String(bandsBlock?.html ?? "").includes("G-10h4d bands save test"));

assert("env default false", isBandsSaveEnvEnabled({}) === false);
assert("env false when unset", isBandsSaveEnvEnabled({ G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED: "" }) === false);

const beforeHtml = String(bandsBlock?.html ?? "");
const testHtml = `${beforeHtml}${G10H4D_BANDS_SAVE_TEST_COMMENT}`;
const dryRun = runMirroredDryRun({
  approvalId: G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
  siteSlug: G10H4C_SITE_SLUG,
  blockId: G10H4C_TARGET_BLOCK_ID,
  html: testHtml,
  saveEnabled: false,
});
assert("dry-run ok with G-10h4d test html", dryRun.ok === true);
assert("dry-run changedFields html", dryRun.changedFields.includes("html"));
assert("blocksAffected 1", dryRun.blocksAffected === 1);
assert("wouldWrite false", dryRun.wouldWrite === false);
assert("saveAllowed false default", dryRun.saveAllowed === false);
assert("htmlSafety ok", dryRun.htmlSafety.ok === true);

const badBlock = runMirroredDryRun({
  approvalId: G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
  siteSlug: G10H4C_SITE_SLUG,
  blockId: G10H4A_TARGET_BLOCK_ID,
  html: testHtml,
  saveEnabled: false,
});
assert("about-profile-html rejected as blockId", badBlock.ok === false);

const runPrep = spawnSync("node", [RUN_SCRIPT_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
  env: { ...process.env, G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED: "" },
});
assert("run script dry-run prints DRY_RUN", (runPrep.stdout ?? "").includes("DRY_RUN"));
assert("run script blocks save when env off", runPrep.status !== 0);
assert("run script save blocked message", (runPrep.stderr ?? "").includes("SAVE blocked"));

assert("FTP not executed", doc.includes("cursorFtpUploadExecuted: false"));
assert("DB not executed", doc.includes("cursorDbWriteExecuted: false"));

assert("00-current-state G-10h4d-1", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10h4d-1"));

const adminProdDiff = spawnSync("git", ["diff", "--name-only", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", (adminProdDiff.stdout ?? "").trim() === "");

const jsonDiff = spawnSync(
  "git",
  ["diff", "--", "tools/static-to-astro/config/sites/gosaki-piano-about-content.json"],
  { cwd: REPO_ROOT, encoding: "utf8" },
);
assert("JSON file unchanged", (jsonDiff.stdout ?? "").trim() === "");

console.log(`\nG-10h4d-1 verification: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
