/**
 * G-10h4b — One-time About profile HTML static JSON write execution (local only).
 * Mirrors executeG10h4bAboutProfileHtmlStaticJsonWrite + dry-run guards.
 * Run once with: G10H4A_ABOUT_PROFILE_HTML_SAVE_ENABLED=true node tools/static-to-astro/scripts/run-g10h4b-gosaki-about-profile-html-static-json-write-execution.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  G10H4A_ABOUT_CONTENT_CONFIG_REL,
  G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
  G10H4A_PROFILE_HTML_MAX_LENGTH,
  G10H4A_SITE_SLUG,
  G10H4A_TARGET_BLOCK_ID,
  G10H4A_TOTAL_HTML_MAX_LENGTH,
  G10H4B_PROFILE_SAVE_TEST_COMMENT,
} from "../../../src/lib/admin/staging-write/gosaki-about-profile-html-static-json-write-types.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const CONFIG_ABS = path.join(REPO_ROOT, G10H4A_ABOUT_CONTENT_CONFIG_REL);
const COMMENT = G10H4B_PROFILE_SAVE_TEST_COMMENT;

function validateHtmlSafety(html) {
  const errors = [];
  if (/<script\b/i.test(html)) errors.push("<script>");
  if (/<iframe\b/i.test(html)) errors.push("<iframe>");
  if (/\son[a-z]+\s*=/i.test(html)) errors.push("on*");
  if (/javascript:/i.test(html)) errors.push("javascript:");
  return { ok: errors.length === 0, errors };
}

function isSaveEnabled() {
  return String(process.env.G10H4A_ABOUT_PROFILE_HTML_SAVE_ENABLED ?? "").trim() === "true";
}

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_ABS, "utf8"));
}

function atomicWrite(config) {
  const content = `${JSON.stringify(config, null, 2)}\n`;
  const tmp = `${CONFIG_ABS}.g10h4b.tmp.${process.pid}`;
  fs.writeFileSync(tmp, content, "utf8");
  fs.renameSync(tmp, CONFIG_ABS);
}

const config = loadConfig();
const profile = config.blocks?.find((b) => b.id === G10H4A_TARGET_BLOCK_ID);
const bands = config.blocks?.find((b) => b.id === "about-bands-html");
if (!profile) {
  console.error("profile block missing");
  process.exit(1);
}

const beforeHtml = String(profile.html ?? "");
const bandsBefore = String(bands?.html ?? "");

if (beforeHtml.includes(COMMENT)) {
  console.log(
    JSON.stringify({
      phase: "G-10h4b-gosaki-about-profile-html-static-json-write-execution",
      status: "already_present",
      message: "既存のため変更なし",
      comment: COMMENT,
    }),
  );
  process.exit(0);
}

const afterHtml = `${beforeHtml}${COMMENT}`;
const changedFields = beforeHtml === afterHtml ? [] : ["html"];
const htmlSafety = validateHtmlSafety(afterHtml);
const oldLength = beforeHtml.length;
const newLength = afterHtml.length;

const dryRun = {
  ok: changedFields.length > 0 && htmlSafety.ok,
  dryRun: true,
  wouldWrite: false,
  changedFields,
  blocksAffected: 1,
  htmlSafety,
  oldLength,
  newLength,
  lengthDelta: newLength - oldLength,
  saveAllowed: isSaveEnabled(),
  saveReadiness: isSaveEnabled() ? "ready_to_save" : "ready_but_save_disabled",
};

console.log("DRY_RUN", JSON.stringify(dryRun, null, 2));

if (!isSaveEnabled()) {
  console.error("SAVE blocked: G10H4A_ABOUT_PROFILE_HTML_SAVE_ENABLED is not true");
  process.exit(1);
}

if (!dryRun.ok) {
  console.error("SAVE blocked: dry-run guards failed");
  process.exit(1);
}

if (afterHtml.length > G10H4A_PROFILE_HTML_MAX_LENGTH) {
  console.error("SAVE blocked: profile html too long");
  process.exit(1);
}

const totalHtml = (config.blocks ?? []).reduce((sum, block) => {
  if (block?.id === G10H4A_TARGET_BLOCK_ID) return sum + afterHtml.length;
  return sum + String(block?.html ?? "").length;
}, 0);
if (totalHtml > G10H4A_TOTAL_HTML_MAX_LENGTH) {
  console.error("SAVE blocked: total html too long");
  process.exit(1);
}

const nextBlocks = (config.blocks ?? []).map((block) =>
  block?.id === G10H4A_TARGET_BLOCK_ID ? { ...block, html: afterHtml } : block,
);
atomicWrite({ ...config, blocks: nextBlocks });

const after = loadConfig();
const profileAfter = after.blocks?.find((b) => b.id === G10H4A_TARGET_BLOCK_ID);
const bandsAfter = after.blocks?.find((b) => b.id === "about-bands-html");

console.log(
  "SAVE",
  JSON.stringify(
    {
      ok: true,
      phase: "G-10h4b-gosaki-about-profile-html-static-json-write-execution",
      approvalId: G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
      siteSlug: G10H4A_SITE_SLUG,
      blockId: G10H4A_TARGET_BLOCK_ID,
      configPath: G10H4A_ABOUT_CONTENT_CONFIG_REL,
      changedFields,
      blocksAffected: 1,
      dryRun: false,
      wouldWrite: true,
    },
    null,
    2,
  ),
);

console.log(
  "POST",
  JSON.stringify(
    {
      commentCount: (String(profileAfter?.html ?? "").match(/G-10h4b profile save test/g) || [])
        .length,
      bandsUnchanged: String(bandsAfter?.html ?? "") === bandsBefore,
      metaUnchanged:
        after.siteSlug === config.siteSlug &&
        after.page === config.page &&
        after.version === config.version &&
        after.previewPath === config.previewPath &&
        profileAfter?.enabled === profile.enabled &&
        profileAfter?.label === profile.label &&
        profileAfter?.id === profile.id,
    },
    null,
    2,
  ),
);
