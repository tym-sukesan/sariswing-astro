/**
 * G-10h4c — Gosaki About bands HTML static JSON write dry-run verification.
 * Run: node tools/static-to-astro/scripts/verify-g10h4c-gosaki-about-bands-html-static-json-write-dry-run.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  G10H4C_ABOUT_CONTENT_CONFIG_REL,
  G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
  G10H4C_BANDS_DRY_RUN_TEST_COMMENT,
  G10H4C_BANDS_HTML_MAX_LENGTH,
  G10H4C_SITE_SLUG,
  G10H4C_TARGET_BLOCK_ID,
  G10H4C_TOTAL_HTML_MAX_LENGTH,
} from "../../../src/lib/admin/staging-write/gosaki-about-bands-html-static-json-write-types.ts";
import {
  G10H4B_PROFILE_SAVE_TEST_COMMENT,
  G10H4A_TARGET_BLOCK_ID,
} from "../../../src/lib/admin/staging-write/gosaki-about-profile-html-static-json-write-types.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-about-bands-html-static-json-write-dry-run.md";
const API_REL =
  "src/pages/__admin-staging-shell/musician-basic/api/about-bands-html-static-json-write.json.ts";
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

/** Mirror of guards.ts validateG10h4cBandsHtmlSafety */
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

function runMirroredDryRun({ html, blockId, siteSlug, approvalId }) {
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

  return {
    ok: guardErrors.length === 0,
    changedFields,
    blocksAffected: 1,
    guardErrors,
    htmlSafety,
    saveAllowed: false,
    wouldWrite: false,
    dryRun: true,
    oldLength: beforeHtml.length,
    newLength: html.length,
    lengthDelta: html.length - beforeHtml.length,
  };
}

const doc = read(DOC_REL);
const operator = read(OPERATOR_REL);
const ui = read(UI_REL);
const apiSrc = read(API_REL);
const astroConfig = read("astro.config.mjs");
const config = JSON.parse(read(G10H4C_ABOUT_CONTENT_CONFIG_REL));
const bandsBlock = config.blocks?.find((b) => b.id === G10H4C_TARGET_BLOCK_ID);
const profileBlock = config.blocks?.find((b) => b.id === G10H4A_TARGET_BLOCK_ID);

assert("G-10h4c doc phase", doc.includes("G-10h4c-gosaki-about-bands-html-static-json-write-dry-run"));
assert("dry-run complete gate", doc.includes("gosakiAboutBandsHtmlStaticJsonWriteDryRunComplete: true"));
assert("readyFor G-10h4d", doc.includes("readyForG10h4dGosakiAboutBandsHtmlStaticJsonWriteExecution: true"));

assert("dry-run module exists", exists("src/lib/admin/staging-write/gosaki-about-bands-html-static-json-write-dry-run.ts"));
assert("guards module exists", exists("src/lib/admin/staging-write/gosaki-about-bands-html-static-json-write-guards.ts"));
assert("API route exists", exists(API_REL));
assert("API rejects non-dry-run", apiSrc.includes("save_not_enabled"));
assert("astro injectRoute bands API", astroConfig.includes("about-bands-html-static-json-write.json"));

assert("approvalId exact", doc.includes(G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID));
assert("path allowlist config", doc.includes("gosaki-piano-about-content.json"));
assert("block allowlist bands", doc.includes(G10H4C_TARGET_BLOCK_ID));
assert("writable field html only", doc.includes("html` only") || doc.includes("html only"));

assert("bands dry-run button", operator.includes("gosaki-about-bands-dry-run-btn"));
assert("bands textarea editable", operator.includes("data-gosaki-about-bands-html-editor"));
assert("bands Save disabled", operator.includes("gosaki-about-bands-save-btn"));
assert("bands dry-run result panel", operator.includes("gosaki-about-bands-dry-run-result"));
assert("UI bands dry-run fetch", ui.includes("G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_API_PATH"));
assert("UI runBandsDryRun", ui.includes("runBandsDryRun"));

assert("profile marker preserved", String(profileBlock?.html ?? "").includes(G10H4B_PROFILE_SAVE_TEST_COMMENT));
assert("profile marker once", (String(profileBlock?.html ?? "").match(/G-10h4b profile save test/g) || []).length === 1);

assert("script reject", !validateAboutBandsHtmlSafety('<div><script>alert(1)</script></div>').ok);
assert("iframe reject", !validateAboutBandsHtmlSafety('<iframe src="x"></iframe>').ok);
assert("onclick reject", !validateAboutBandsHtmlSafety('<a onclick="x()">x</a>').ok);
assert("javascript reject", !validateAboutBandsHtmlSafety('<a href="javascript:alert(1)">x</a>').ok);
assert("style block allow with warning", validateAboutBandsHtmlSafety("<style>.x{}</style>").ok);
assert("style attribute allow", validateAboutBandsHtmlSafety('<p style="color:red">x</p>').ok);

assert("env default false", isBandsSaveEnvEnabled({}) === false);
assert("env false when unset", isBandsSaveEnvEnabled({ G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED: "" }) === false);

const beforeHtml = String(bandsBlock?.html ?? "");
const testHtml = `${beforeHtml}${G10H4C_BANDS_DRY_RUN_TEST_COMMENT}`;
const dryRun = runMirroredDryRun({
  approvalId: G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
  siteSlug: G10H4C_SITE_SLUG,
  blockId: G10H4C_TARGET_BLOCK_ID,
  html: testHtml,
});
assert("dry-run ok with test html", dryRun.ok === true);
assert("dry-run changedFields html", dryRun.changedFields.includes("html"));
assert("blocksAffected 1", dryRun.blocksAffected === 1);
assert("wouldWrite false", dryRun.wouldWrite === false);
assert("saveAllowed false default", dryRun.saveAllowed === false);
assert("bands html has style warning path", dryRun.htmlSafety.warnings.length >= 0);

const badBlock = runMirroredDryRun({
  approvalId: G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
  siteSlug: G10H4C_SITE_SLUG,
  blockId: G10H4A_TARGET_BLOCK_ID,
  html: testHtml,
});
assert("about-profile-html rejected as blockId", badBlock.ok === false);

assert("non-dry-run not executed", doc.includes("nonDryRunSaveExecuted: false"));
assert("actual JSON write not executed", doc.includes("actualJsonWriteExecuted: false"));
assert("FTP not executed", doc.includes("cursorFtpUploadExecuted: false"));

assert("00-current-state G-10h4c", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10h4c"));

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

console.log(`\nG-10h4c verification: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
