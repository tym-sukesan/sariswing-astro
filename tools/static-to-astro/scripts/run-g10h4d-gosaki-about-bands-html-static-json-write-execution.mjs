/**
 * G-10h4d — One-time About bands HTML static JSON write execution (local only).
 * Mirrors executeG10h4dAboutBandsHtmlStaticJsonWrite + dry-run guards.
 * Run once with: G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED=true node tools/static-to-astro/scripts/run-g10h4d-gosaki-about-bands-html-static-json-write-execution.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  G10H4C_ABOUT_CONTENT_CONFIG_REL,
  G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
  G10H4C_BANDS_HTML_MAX_LENGTH,
  G10H4C_SITE_SLUG,
  G10H4C_TARGET_BLOCK_ID,
  G10H4C_TOTAL_HTML_MAX_LENGTH,
  G10H4D_BANDS_SAVE_TEST_COMMENT,
} from "../../../src/lib/admin/staging-write/gosaki-about-bands-html-static-json-write-types.ts";
import {
  G10H4A_TARGET_BLOCK_ID,
  G10H4B_PROFILE_SAVE_TEST_COMMENT,
} from "../../../src/lib/admin/staging-write/gosaki-about-profile-html-static-json-write-types.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const CONFIG_ABS = path.join(REPO_ROOT, G10H4C_ABOUT_CONTENT_CONFIG_REL);
const COMMENT = G10H4D_BANDS_SAVE_TEST_COMMENT;
const APPROVAL_ID = G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID;

function validateHtmlSafety(html) {
  const errors = [];
  const warnings = [];
  if (/<script\b/i.test(html)) errors.push("<script>");
  if (/<iframe\b/i.test(html)) errors.push("<iframe>");
  if (/\son[a-z]+\s*=/i.test(html)) errors.push("on*");
  if (/javascript:/i.test(html)) errors.push("javascript:");
  if (/<style\b/i.test(html)) warnings.push("<style>");
  return { ok: errors.length === 0, errors, warnings };
}

function isSaveEnabled() {
  return String(process.env.G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED ?? "").trim() === "true";
}

function assertPathAllowlisted() {
  const normalized = path.normalize(CONFIG_ABS);
  const expected = path.resolve(REPO_ROOT, G10H4C_ABOUT_CONTENT_CONFIG_REL);
  if (normalized !== expected) {
    console.error("SAVE blocked: config path escape");
    process.exit(1);
  }
}

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_ABS, "utf8"));
}

function atomicWrite(config) {
  const content = `${JSON.stringify(config, null, 2)}\n`;
  const tmp = `${CONFIG_ABS}.g10h4d.tmp.${process.pid}`;
  fs.writeFileSync(tmp, content, "utf8");
  fs.renameSync(tmp, CONFIG_ABS);
}

function countMarker(html, pattern) {
  return (String(html).match(pattern) || []).length;
}

assertPathAllowlisted();

if (APPROVAL_ID !== "G-10h4c-about-bands-html-static-json-write-dry-run") {
  console.error("SAVE blocked: approvalId mismatch");
  process.exit(1);
}

const config = loadConfig();
if (config.siteSlug !== G10H4C_SITE_SLUG) {
  console.error("SAVE blocked: siteSlug mismatch");
  process.exit(1);
}

const bands = config.blocks?.find((b) => b.id === G10H4C_TARGET_BLOCK_ID);
const profile = config.blocks?.find((b) => b.id === G10H4A_TARGET_BLOCK_ID);
if (!bands) {
  console.error("bands block missing");
  process.exit(1);
}
if (!profile) {
  console.error("profile block missing");
  process.exit(1);
}

const profileBefore = String(profile.html ?? "");
const bandsBefore = String(bands.html ?? "");

if (countMarker(profileBefore, /G-10h4b profile save test/g) !== 1) {
  console.error("SAVE blocked: G-10h4b profile marker must appear exactly once");
  process.exit(1);
}

if (bandsBefore.includes(COMMENT)) {
  console.log(
    JSON.stringify({
      phase: "G-10h4d-gosaki-about-bands-html-static-json-write-execution",
      status: "already_present",
      message: "既存のため変更なし",
      comment: COMMENT,
      bandsMarkerCount: countMarker(bandsBefore, /G-10h4d bands save test/g),
    }),
  );
  process.exit(0);
}

const afterHtml = `${bandsBefore}${COMMENT}`;
const changedFields = bandsBefore === afterHtml ? [] : ["html"];
const htmlSafety = validateHtmlSafety(afterHtml);
const oldLength = bandsBefore.length;
const newLength = afterHtml.length;

const dryRun = {
  ok: changedFields.length > 0 && htmlSafety.ok,
  dryRun: true,
  wouldWrite: false,
  approvalId: APPROVAL_ID,
  siteSlug: G10H4C_SITE_SLUG,
  blockId: G10H4C_TARGET_BLOCK_ID,
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
  console.error("SAVE blocked: G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED is not true");
  process.exit(1);
}

if (!dryRun.ok) {
  console.error("SAVE blocked: dry-run guards failed");
  process.exit(1);
}

if (afterHtml.length > G10H4C_BANDS_HTML_MAX_LENGTH) {
  console.error("SAVE blocked: bands html too long");
  process.exit(1);
}

const totalHtml = (config.blocks ?? []).reduce((sum, block) => {
  if (block?.id === G10H4C_TARGET_BLOCK_ID) return sum + afterHtml.length;
  return sum + String(block?.html ?? "").length;
}, 0);
if (totalHtml > G10H4C_TOTAL_HTML_MAX_LENGTH) {
  console.error("SAVE blocked: total html too long");
  process.exit(1);
}

const nextBlocks = (config.blocks ?? []).map((block) =>
  block?.id === G10H4C_TARGET_BLOCK_ID ? { ...block, html: afterHtml } : block,
);
atomicWrite({ ...config, blocks: nextBlocks });

const after = loadConfig();
const bandsAfter = after.blocks?.find((b) => b.id === G10H4C_TARGET_BLOCK_ID);
const profileAfter = after.blocks?.find((b) => b.id === G10H4A_TARGET_BLOCK_ID);

console.log(
  "SAVE",
  JSON.stringify(
    {
      ok: true,
      phase: "G-10h4d-gosaki-about-bands-html-static-json-write-execution",
      approvalId: APPROVAL_ID,
      siteSlug: G10H4C_SITE_SLUG,
      blockId: G10H4C_TARGET_BLOCK_ID,
      configPath: G10H4C_ABOUT_CONTENT_CONFIG_REL,
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
      bandsMarkerCount: countMarker(bandsAfter?.html ?? "", /G-10h4d bands save test/g),
      profileUnchanged: String(profileAfter?.html ?? "") === profileBefore,
      profileMarkerCount: countMarker(profileAfter?.html ?? "", /G-10h4b profile save test/g),
      profileMarker: G10H4B_PROFILE_SAVE_TEST_COMMENT,
      metaUnchanged:
        after.siteSlug === config.siteSlug &&
        after.page === config.page &&
        after.version === config.version &&
        after.previewPath === config.previewPath &&
        bandsAfter?.enabled === bands.enabled &&
        bandsAfter?.label === bands.label &&
        bandsAfter?.id === bands.id,
    },
    null,
    2,
  ),
);
