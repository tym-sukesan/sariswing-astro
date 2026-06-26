/**
 * G-11c10a — Gosaki YouTube URL save workflow dispatch allowlist registration verifier.
 * Run: node tools/static-to-astro/scripts/verify-g11c10a-gosaki-youtube-url-save-workflow-dispatch-allowlist-registration.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  G11C6_APPROVAL_ID,
  G11C6_OPERATION_ID,
  G11C10_APPROVAL_ID,
  G11C10_OPERATION_ID,
  GOSAKI_YOUTUBE_URL_SAVE_WORKFLOW_APPROVAL_IDS,
  GOSAKI_YOUTUBE_URL_SAVE_WORKFLOW_OPERATION_IDS,
} from "./lib/gosaki-youtube-url-save-constants.mjs";
import {
  G11C8_CONFIG_REL,
  G11C8_PATCH_FIELD,
  G11C8_TARGET_ITEM_ID,
  parseG11c8WorkflowPatchInput,
} from "./lib/gosaki-youtube-url-save-workflow-json-patch-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-youtube-url-save-workflow-dispatch-allowlist-registration.md";
const PATCH_SCRIPT_REL =
  "tools/static-to-astro/scripts/gosaki-youtube-url-save-workflow-json-patch.mjs";
const PATCH_LIB_REL =
  "tools/static-to-astro/scripts/lib/gosaki-youtube-url-save-workflow-json-patch-lib.mjs";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

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

function runPatch(args) {
  return spawnSync("node", [path.join(REPO_ROOT, PATCH_SCRIPT_REL), ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
}

const doc = read(DOC_REL);
const patchLib = read(PATCH_LIB_REL);
const jsonBefore = read(G11C8_CONFIG_REL);
const embed = "https://www.youtube.com/watch?v=Ke4F8JAQz-I";
const vid = "Ke4F8JAQz-I";

assert("doc exists", exists(DOC_REL));
assert("doc phase G-11c10a", doc.includes("G-11c10a-gosaki-youtube-url-save-workflow-dispatch-allowlist-registration"));
assert("doc implementation complete", doc.includes("implementation complete"));
assert("doc G-11c10 approval_id", doc.includes(G11C10_APPROVAL_ID));
assert("doc G-11c10 operation_id", doc.includes(G11C10_OPERATION_ID));
assert("doc no dispatch", doc.includes("workflowDispatchExecuted") && doc.includes("**false**"));
assert("doc no JSON write", doc.includes("cursorJsonWriteExecuted") && doc.includes("**false**"));
assert("doc no apply", doc.includes("patchScriptApplyExecuted") && doc.includes("**false**"));
assert("doc next G-11c10", doc.includes("G-11c10-gosaki-youtube-url-save-workflow-dispatch-execution"));

assert("G-11c10 approval_id in allowlist", GOSAKI_YOUTUBE_URL_SAVE_WORKFLOW_APPROVAL_IDS.includes(G11C10_APPROVAL_ID));
assert("G-11c10 operation_id in allowlist", GOSAKI_YOUTUBE_URL_SAVE_WORKFLOW_OPERATION_IDS.includes(G11C10_OPERATION_ID));
assert("G-11c6 approval_id still in allowlist", GOSAKI_YOUTUBE_URL_SAVE_WORKFLOW_APPROVAL_IDS.includes(G11C6_APPROVAL_ID));
assert("G-11c6 operation_id still in allowlist", GOSAKI_YOUTUBE_URL_SAVE_WORKFLOW_OPERATION_IDS.includes(G11C6_OPERATION_ID));
assert("patch lib uses approval allowlist", patchLib.includes("GOSAKI_YOUTUBE_URL_SAVE_WORKFLOW_APPROVAL_IDS"));
assert("patch lib uses operation allowlist", patchLib.includes("GOSAKI_YOUTUBE_URL_SAVE_WORKFLOW_OPERATION_IDS"));

const g11c10Parse = parseG11c8WorkflowPatchInput({
  site_slug: "gosaki-piano",
  module: "youtube-embed",
  item_id: G11C8_TARGET_ITEM_ID,
  youtube_url: embed,
  expected_before_embed_code: embed,
  expected_before_video_id: vid,
  approval_id: G11C10_APPROVAL_ID,
  operation_id: G11C10_OPERATION_ID,
});
assert("parse accepts G-11c10 IDs", g11c10Parse.ok === true);

const g11c6Parse = parseG11c8WorkflowPatchInput({
  site_slug: "gosaki-piano",
  module: "youtube-embed",
  item_id: G11C8_TARGET_ITEM_ID,
  youtube_url: embed,
  expected_before_embed_code: embed,
  expected_before_video_id: vid,
  approval_id: G11C6_APPROVAL_ID,
  operation_id: G11C6_OPERATION_ID,
});
assert("parse still accepts G-11c6 IDs", g11c6Parse.ok === true);

const unknownParse = parseG11c8WorkflowPatchInput({
  site_slug: "gosaki-piano",
  module: "youtube-embed",
  item_id: G11C8_TARGET_ITEM_ID,
  youtube_url: embed,
  expected_before_embed_code: embed,
  expected_before_video_id: vid,
  approval_id: "unknown-approval",
  operation_id: G11C10_OPERATION_ID,
});
assert("unknown approval_id rejected", !unknownParse.ok);

const baseG11c10 = [
  "--site-slug", "gosaki-piano",
  "--module", "youtube-embed",
  "--item-id", G11C8_TARGET_ITEM_ID,
  "--expected-before-embed-code", embed,
  "--expected-before-video-id", vid,
  "--approval-id", G11C10_APPROVAL_ID,
  "--operation-id", G11C10_OPERATION_ID,
  "--json",
];

const noChange = runPatch([...baseG11c10, "--youtube-url", embed, "--request-id", "g11c10a-no-change"]);
assert("G-11c10 check-only no_change exit 0", noChange.status === 0);
assert("G-11c10 check-only no_change", JSON.parse(noChange.stdout).saveReadiness === "no_change");

const changed = runPatch([
  ...baseG11c10,
  "--youtube-url", "https://youtu.be/I-eY9YMq9GI",
  "--request-id", "g11c10a-changed",
]);
assert("G-11c10 check-only changed exit 0", changed.status === 0);
const changedJson = JSON.parse(changed.stdout);
assert("G-11c10 check-only changed readiness", changedJson.saveReadiness === "changed");
assert("changed field embedCode only", changedJson.changedFields?.join() === G11C8_PATCH_FIELD);

const conflict = runPatch([
  ...baseG11c10,
  "--youtube-url", "https://youtu.be/I-eY9YMq9GI",
  "--expected-before-embed-code", "https://www.youtube.com/watch?v=WRONG",
  "--request-id", "g11c10a-conflict",
]);
assert("G-11c10 check-only conflict exit 2", conflict.status === 2);

const invalid = runPatch([
  ...baseG11c10,
  "--youtube-url", "javascript:alert(1)",
  "--request-id", "g11c10a-invalid",
]);
assert("G-11c10 check-only invalid exit 1", invalid.status === 1);

const g11c6Regression = runPatch([
  "--site-slug", "gosaki-piano",
  "--module", "youtube-embed",
  "--item-id", G11C8_TARGET_ITEM_ID,
  "--youtube-url", embed,
  "--expected-before-embed-code", embed,
  "--expected-before-video-id", vid,
  "--approval-id", G11C6_APPROVAL_ID,
  "--operation-id", G11C6_OPERATION_ID,
  "--request-id", "g11c10a-g11c6-regression",
  "--json",
]);
assert("G-11c6 regression no_change exit 0", g11c6Regression.status === 0);

const jsonAfter = read(G11C8_CONFIG_REL);
assert("JSON unchanged", jsonAfter === jsonBefore);
assert("target JSON path", G11C8_CONFIG_REL.includes("gosaki-piano-youtube-embed.json"));
assert("target item", G11C8_TARGET_ITEM_ID === "yt-placeholder-01");
assert("published guard in lib", patchLib.includes('"published"'));

const verifierSource = read(
  "tools/static-to-astro/scripts/verify-g11c10a-gosaki-youtube-url-save-workflow-dispatch-allowlist-registration.mjs",
);
assert("verifier CLI omit apply", !verifierSource.includes('runPatch([\n  "--apply"'));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

const envDiff = spawnSync("git", ["diff", "--name-only", ".env", ".env.local"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert(".env not changed", !envDiff.stdout.includes(".env"));

assert(
  "no real email in artifacts",
  !/@(?!example\.com|users\.noreply\.github\.com)[a-z0-9.-]+\.[a-z]{2,}/i.test(
    [doc, patchLib, verifierSource].join("\n").replace(/users\.noreply\.github\.com/g, ""),
  ),
);

console.log(`\nG-11c10a verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
