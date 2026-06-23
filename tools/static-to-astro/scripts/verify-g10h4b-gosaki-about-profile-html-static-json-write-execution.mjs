/**
 * G-10h4b — Gosaki About profile HTML static JSON write execution verification.
 * Run: node tools/static-to-astro/scripts/verify-g10h4b-gosaki-about-profile-html-static-json-write-execution.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  G10H4A_ABOUT_CONTENT_CONFIG_REL,
  G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
  G10H4A_TARGET_BLOCK_ID,
  G10H4B_PROFILE_SAVE_TEST_COMMENT,
} from "../../../src/lib/admin/staging-write/gosaki-about-profile-html-static-json-write-types.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-about-profile-html-static-json-write-execution.md";
const API_REL =
  "src/pages/__admin-staging-shell/musician-basic/api/about-profile-html-static-json-write.json.ts";
const EXECUTOR_REL =
  "src/lib/admin/staging-write/gosaki-about-profile-html-static-json-write-executor.ts";
const CLIENT_SAVE_REL =
  "src/lib/admin/staging-write/gosaki-about-profile-html-static-json-write-client-save.ts";
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

const doc = read(DOC_REL);
const apiSrc = read(API_REL);
const executorSrc = read(EXECUTOR_REL);
const clientSaveSrc = read(CLIENT_SAVE_REL);
const uiSrc = read(UI_REL);
const config = JSON.parse(read(G10H4A_ABOUT_CONTENT_CONFIG_REL));
const profileBlock = config.blocks?.find((b) => b.id === G10H4A_TARGET_BLOCK_ID);
const bandsBlock = config.blocks?.find((b) => b.id === "about-bands-html");
const comment = G10H4B_PROFILE_SAVE_TEST_COMMENT;

assert("G-10h4b doc phase", doc.includes("G-10h4b-gosaki-about-profile-html-static-json-write-execution"));
assert("execution complete gate", doc.includes("gosakiAboutProfileHtmlStaticJsonWriteExecutionComplete: true"));
assert("one-time save documented", doc.includes("oneTimeSaveOnly: true"));
assert("do not re-click", doc.includes("doNotReClickG10h4bSave: true"));

assert("executor exists", exists(EXECUTOR_REL));
assert("client save exists", exists(CLIENT_SAVE_REL));
assert("executor atomic write", executorSrc.includes("atomicWriteJson"));
assert("executor no supabase", !executorSrc.includes("service_role"));
assert("API calls executor", apiSrc.includes("executeG10h4bAboutProfileHtmlStaticJsonWrite"));
assert("API no longer non_dry_run_not_implemented", !apiSrc.includes("non_dry_run_not_implemented"));
assert("save_not_enabled when env off", apiSrc.includes("save_not_enabled"));
assert("UI imports client save", uiSrc.includes("executeG10h4bAboutProfileHtmlStaticJsonClientSave"));
assert("UI save button gate", uiSrc.includes("evaluateG10h4aAboutProfileHtmlSaveUiGate"));
assert("UI runProfileSave", uiSrc.includes("runProfileSave"));

assert("profile has G-10h4b comment once", (profileBlock?.html?.match(/G-10h4b profile save test/g) || []).length === 1);
assert("profile html ends with comment", String(profileBlock?.html ?? "").trimEnd().endsWith(comment));
assert("bands block unchanged length", String(bandsBlock?.html ?? "").length > 1000);
assert("meta siteSlug", config.siteSlug === "gosaki-piano");
assert("meta page", config.page === "about");
assert("meta version", config.version === 1);
assert("approvalId unchanged", doc.includes(G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID));

assert("profile html contains comment for convert hook", String(profileBlock?.html ?? "").includes(comment));
assert("bands html does not contain G-10h4b comment", !String(bandsBlock?.html ?? "").includes("G-10h4b profile save test"));

assert("00-current-state G-10h4b", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10h4b"));
assert("03-next-actions G-10h4c", read("tools/static-to-astro/docs/ai/03-next-actions.md").includes("G-10h4c"));

console.log(`\nG-10h4b verification: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
