/**
 * G-10h4d — Gosaki About bands HTML static JSON write execution verification.
 * Run after Operator one-time Save (marker present in JSON).
 * Run: node tools/static-to-astro/scripts/verify-g10h4d-gosaki-about-bands-html-static-json-write-execution.mjs
 *
 * Pre-execution prep: use verify-g10h4d-gosaki-about-bands-html-static-json-write-execution-prep.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  G10H4C_ABOUT_CONTENT_CONFIG_REL,
  G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
  G10H4C_SITE_SLUG,
  G10H4C_TARGET_BLOCK_ID,
  G10H4D_BANDS_SAVE_TEST_COMMENT,
  G10H4D_PHASE,
} from "../../../src/lib/admin/staging-write/gosaki-about-bands-html-static-json-write-types.ts";
import {
  G10H4A_TARGET_BLOCK_ID,
  G10H4B_PROFILE_SAVE_TEST_COMMENT,
} from "../../../src/lib/admin/staging-write/gosaki-about-profile-html-static-json-write-types.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-about-bands-html-static-json-write-execution.md";
const EXECUTOR_REL =
  "src/lib/admin/staging-write/gosaki-about-bands-html-static-json-write-executor.ts";
const RUN_SCRIPT_REL =
  "tools/static-to-astro/scripts/run-g10h4d-gosaki-about-bands-html-static-json-write-execution.mjs";

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

const doc = read(DOC_REL);
const executorSrc = read(EXECUTOR_REL);
const runScriptSrc = read(RUN_SCRIPT_REL);
const config = JSON.parse(read(G10H4C_ABOUT_CONTENT_CONFIG_REL));
const profileBlock = config.blocks?.find((b) => b.id === G10H4A_TARGET_BLOCK_ID);
const bandsBlock = config.blocks?.find((b) => b.id === G10H4C_TARGET_BLOCK_ID);
const bandsHtml = String(bandsBlock?.html ?? "");
const profileHtml = String(profileBlock?.html ?? "");
const bandsMarker = G10H4D_BANDS_SAVE_TEST_COMMENT;
const profileMarker = G10H4B_PROFILE_SAVE_TEST_COMMENT;

assert("G-10h4d doc phase", doc.includes(G10H4D_PHASE));
assert("execution complete gate", doc.includes("gosakiAboutBandsHtmlStaticJsonWriteExecutionComplete: true"));
assert("one-time save documented", doc.includes("oneTimeSaveOnly: true"));
assert("do not re-click G-10h4d", doc.includes("doNotReClickG10h4dSave: true"));
assert("do not re-click G-10h4b", doc.includes("doNotReClickG10h4bSave: true"));
assert("actual JSON write executed", doc.includes("actualJsonWriteExecuted: true"));
assert("non-dry-run executed", doc.includes("nonDryRunSaveExecuted: true"));

assert("executor exists", exists(EXECUTOR_REL));
assert("run script exists", exists(RUN_SCRIPT_REL));
assert("executor atomic write", executorSrc.includes("atomicWriteJson"));
assert("executor no service_role", !executorSrc.includes("service_role"));
assert("run script already_present guard", runScriptSrc.includes("already_present"));

assert("JSON parse OK", Array.isArray(config.blocks));
assert("blocks count 2", config.blocks?.length === 2);
assert("meta siteSlug", config.siteSlug === G10H4C_SITE_SLUG);
assert("meta page", config.page === "about");
assert("meta version", config.version === 1);
assert("meta previewPath", config.previewPath === "about/");
assert("approvalId in doc", doc.includes(G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID));

assert("bands G-10h4d marker once", (bandsHtml.match(/G-10h4d bands save test/g) || []).length === 1);
assert("bands html ends with marker", bandsHtml.trimEnd().endsWith(bandsMarker));
assert("bands has G-10h4d comment", bandsHtml.includes(bandsMarker));
assert("profile G-10h4b marker once", (profileHtml.match(/G-10h4b profile save test/g) || []).length === 1);
assert("profile has G-10h4b comment", profileHtml.includes(profileMarker));
assert("profile no G-10h4d marker", !profileHtml.includes("G-10h4d bands save test"));
assert("bands no G-10h4b marker", !bandsHtml.includes("G-10h4b profile save test"));

const headConfig = JSON.parse(
  spawnSync("git", ["show", "HEAD:tools/static-to-astro/config/sites/gosaki-piano-about-content.json"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  }).stdout,
);
const headProfile = headConfig.blocks?.find((b) => b.id === G10H4A_TARGET_BLOCK_ID);
const headBands = headConfig.blocks?.find((b) => b.id === G10H4C_TARGET_BLOCK_ID);

assert("about-profile-html unchanged vs HEAD", profileHtml === String(headProfile?.html ?? ""));
assert("profile enabled unchanged", profileBlock?.enabled === headProfile?.enabled);
assert("profile label unchanged", profileBlock?.label === headProfile?.label);
assert("profile id unchanged", profileBlock?.id === headProfile?.id);
assert("bands enabled unchanged", bandsBlock?.enabled === headBands?.enabled);
assert("bands label unchanged", bandsBlock?.label === headBands?.label);
assert("bands id unchanged", bandsBlock?.id === headBands?.id);
assert("bands html changed vs HEAD", bandsHtml !== String(headBands?.html ?? ""));
assert("bands html length delta 32", bandsHtml.length - String(headBands?.html ?? "").length === 32);

assert("DB not executed by Cursor", doc.includes("cursorDbWriteExecuted: false"));
assert("FTP not executed", doc.includes("cursorFtpUploadExecuted: false"));
assert("deploy not executed", doc.includes("cursorDeployExecuted: false"));
assert("image ops not executed", doc.includes("cursorImageFileOpsExecuted: false"));

assert("00-current-state G-10h4d", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10h4d"));

const adminProdDiff = spawnSync("git", ["diff", "--name-only", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", (adminProdDiff.stdout ?? "").trim() === "");

console.log(`\nG-10h4d execution verification: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
