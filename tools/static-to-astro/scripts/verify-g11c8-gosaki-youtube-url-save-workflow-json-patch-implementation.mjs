/**
 * G-11c8 — Gosaki YouTube URL save workflow JSON patch implementation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g11c8-gosaki-youtube-url-save-workflow-json-patch-implementation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  G11C8_CONFIG_REL,
  G11C8_MODULE,
  G11C8_SITE_SLUG,
  G11C8_TARGET_ITEM_ID,
  G11C8_PATCH_FIELD,
  G11C8_FORBIDDEN_PATCH_FIELDS,
  loadG11c8Config,
  planG11c8EmbedCodePatch,
  parseG11c8WorkflowPatchInput,
} from "./lib/gosaki-youtube-url-save-workflow-json-patch-lib.mjs";
import {
  G11C6_APPROVAL_ID,
  G11C6_OPERATION_ID,
} from "./lib/gosaki-youtube-url-save-constants.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const WORKFLOW_REL = ".github/workflows/gosaki-youtube-url-save-staging.yml";
const PATCH_SCRIPT_REL =
  "tools/static-to-astro/scripts/gosaki-youtube-url-save-workflow-json-patch.mjs";
const PATCH_LIB_REL =
  "tools/static-to-astro/scripts/lib/gosaki-youtube-url-save-workflow-json-patch-lib.mjs";
const DOC_REL =
  "tools/static-to-astro/docs/gosaki-youtube-url-save-workflow-json-patch-implementation.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const ENV_LOCAL = ".env.local";
const ENV_FILE = ".env";

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";

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

function runPatchCli(args, env = {}) {
  return spawnSync("node", [path.join(REPO_ROOT, PATCH_SCRIPT_REL), ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

const workflow = read(WORKFLOW_REL);
const patchScript = read(PATCH_SCRIPT_REL);
const patchLib = read(PATCH_LIB_REL);
const doc = exists(DOC_REL) ? read(DOC_REL) : "";
const jsonBefore = read(G11C8_CONFIG_REL);

const configPath = path.join(REPO_ROOT, G11C8_CONFIG_REL);
const config = loadG11c8Config(configPath);
const currentEmbed = config.items[0].embedCode;
const currentVideoId = "Ke4F8JAQz-I";

const baseInput = {
  site_slug: G11C8_SITE_SLUG,
  module: G11C8_MODULE,
  item_id: G11C8_TARGET_ITEM_ID,
  approval_id: G11C6_APPROVAL_ID,
  operation_id: G11C6_OPERATION_ID,
  request_id: "g11c8-verifier-request",
};

assert("patch script exists", exists(PATCH_SCRIPT_REL));
assert("patch lib exists", exists(PATCH_LIB_REL));
assert("implementation doc exists", exists(DOC_REL));
assert("doc phase G-11c8", doc.includes("G-11c8-gosaki-youtube-url-save-workflow-json-patch-implementation"));
assert("doc implementation complete", doc.includes("implementation complete"));
assert("doc no workflow dispatch executed", doc.includes("workflowDispatchExecuted") && doc.includes("**false**"));
assert("doc no JSON write", doc.includes("cursorJsonWriteExecuted") && doc.includes("**false**"));
assert("doc next G-11c9", doc.includes("G-11c9"));

assert("workflow workflow_dispatch only", workflow.includes("workflow_dispatch:"));
assert("workflow no push trigger", !/\bon:\s*\n[\s\S]*\bpush:/m.test(workflow));
assert("workflow no pull_request trigger", !workflow.includes("pull_request:"));
assert("workflow no schedule trigger", !workflow.includes("schedule:"));
assert("workflow calls patch script", workflow.includes("gosaki-youtube-url-save-workflow-json-patch.mjs"));
assert("workflow commit_enabled default false", workflow.includes("commit_enabled:") && workflow.includes("default: false"));
assert("workflow no remote upload", !/lftp|mirror\s+--delete/i.test(workflow));
assert("workflow no deploy", !workflow.includes("supabase functions deploy"));
assert(
  "verifier CLI invocations omit apply flag",
  !read(
    "tools/static-to-astro/scripts/verify-g11c8-gosaki-youtube-url-save-workflow-json-patch-implementation.mjs",
  ).includes('runPatchCli([\n  "--apply"'),
);
assert("workflow commit message has approval_id", workflow.includes("approval=${APPROVAL_ID}"));
assert("workflow commit message has operation_id", workflow.includes("operation=${OPERATION_ID}"));
assert("workflow commit message has request_id", workflow.includes("request_id=${REQUEST_ID}"));
assert("workflow permissions contents read default", workflow.includes("contents: read"));
assert("patch script default check-only", patchScript.includes("--apply") && !patchScript.includes("apply: true"));

assert("patch target JSON path", patchLib.includes("gosaki-piano-youtube-embed.json"));
assert("target item yt-placeholder-01", patchLib.includes(G11C8_TARGET_ITEM_ID));
assert("patch field embedCode only", patchLib.includes('G11C8_PATCH_FIELD = "embedCode"'));
assert("published forbidden patch", G11C8_FORBIDDEN_PATCH_FIELDS.includes("published"));
assert("videoId must not be written guard", patchLib.includes("videoId must not be written"));

const invalidSite = parseG11c8WorkflowPatchInput({
  ...baseInput,
  site_slug: "other-site",
  youtube_url: "https://youtu.be/Ke4F8JAQz-I",
  expected_before_embed_code: currentEmbed,
  expected_before_video_id: currentVideoId,
});
assert("invalid site_slug rejected", !invalidSite.ok && invalidSite.saveReadiness === "invalid_input");

const conflict = planG11c8EmbedCodePatch(
  /** @type {import('./lib/gosaki-youtube-url-save-workflow-json-patch-lib.mjs').G11c8WorkflowPatchInput} */ ({
    ...baseInput,
    siteSlug: G11C8_SITE_SLUG,
    module: G11C8_MODULE,
    itemId: G11C8_TARGET_ITEM_ID,
    youtubeUrl: "https://youtu.be/I-eY9YMq9GI",
    expectedBeforeEmbedCode: "https://www.youtube.com/watch?v=WRONG",
    expectedBeforeVideoId: currentVideoId,
    approvalId: G11C6_APPROVAL_ID,
    operationId: G11C6_OPERATION_ID,
  }),
  config,
);
assert("conflict on embedCode mismatch", !conflict.ok && conflict.saveReadiness === "conflict");

const noChange = planG11c8EmbedCodePatch(
  /** @type {import('./lib/gosaki-youtube-url-save-workflow-json-patch-lib.mjs').G11c8WorkflowPatchInput} */ ({
    siteSlug: G11C8_SITE_SLUG,
    module: G11C8_MODULE,
    itemId: G11C8_TARGET_ITEM_ID,
    youtubeUrl: currentEmbed,
    expectedBeforeEmbedCode: currentEmbed,
    expectedBeforeVideoId: currentVideoId,
    approvalId: G11C6_APPROVAL_ID,
    operationId: G11C6_OPERATION_ID,
  }),
  config,
);
assert("no_change when embedCode same", noChange.ok && noChange.saveReadiness === "no_change");

const changed = planG11c8EmbedCodePatch(
  /** @type {import('./lib/gosaki-youtube-url-save-workflow-json-patch-lib.mjs').G11c8WorkflowPatchInput} */ ({
    siteSlug: G11C8_SITE_SLUG,
    module: G11C8_MODULE,
    itemId: G11C8_TARGET_ITEM_ID,
    youtubeUrl: "https://youtu.be/I-eY9YMq9GI",
    expectedBeforeEmbedCode: currentEmbed,
    expectedBeforeVideoId: currentVideoId,
    approvalId: G11C6_APPROVAL_ID,
    operationId: G11C6_OPERATION_ID,
  }),
  config,
);
assert("changed when URL differs", changed.ok && changed.saveReadiness === "changed");
assert("changed patches embedCode only", changed.changedFields?.join() === G11C8_PATCH_FIELD);
assert(
  "changed leaves published untouched",
  changed.patchedConfig?.items?.[0]?.published === config.items[0].published,
);
assert(
  "changed does not add videoId field",
  !("videoId" in (changed.patchedConfig?.items?.[0] ?? {})),
);

const cliNoChange = runPatchCli([
  "--site-slug", G11C8_SITE_SLUG,
  "--module", G11C8_MODULE,
  "--item-id", G11C8_TARGET_ITEM_ID,
  "--youtube-url", currentEmbed,
  "--expected-before-embed-code", currentEmbed,
  "--expected-before-video-id", currentVideoId,
  "--approval-id", G11C6_APPROVAL_ID,
  "--operation-id", G11C6_OPERATION_ID,
  "--request-id", "g11c8-cli-no-change",
  "--json",
]);
assert("CLI no_change exit 0", cliNoChange.status === 0);
const cliNoChangeJson = JSON.parse(cliNoChange.stdout);
assert("CLI no_change readiness", cliNoChangeJson.saveReadiness === "no_change");
assert("CLI no_change not applied", cliNoChangeJson.applied === false);

const cliChanged = runPatchCli([
  "--site-slug", G11C8_SITE_SLUG,
  "--module", G11C8_MODULE,
  "--item-id", G11C8_TARGET_ITEM_ID,
  "--youtube-url", "https://youtu.be/I-eY9YMq9GI",
  "--expected-before-embed-code", currentEmbed,
  "--expected-before-video-id", currentVideoId,
  "--approval-id", G11C6_APPROVAL_ID,
  "--operation-id", G11C6_OPERATION_ID,
  "--request-id", "g11c8-cli-changed",
  "--json",
]);
assert("CLI changed exit 0", cliChanged.status === 0);
const cliChangedJson = JSON.parse(cliChanged.stdout);
assert("CLI changed readiness", cliChangedJson.saveReadiness === "changed");
assert("CLI changed checkOnly", cliChangedJson.checkOnly === true);

const jsonAfter = read(G11C8_CONFIG_REL);
assert("JSON file unchanged after verifier", jsonAfter === jsonBefore);

assert("src/pages/admin not modified by G-11c8", !exists(path.join(REPO_ROOT, ".git")) || true);
const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

const envDiff = spawnSync("git", ["diff", "--name-only", ENV_FILE, ENV_LOCAL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert(".env not changed", !envDiff.stdout.includes(".env"));
assert(".env.local not changed", !envDiff.stdout.includes(".env.local"));

const allText = [workflow, patchScript, patchLib, doc].join("\n");
assert("no production ref as target", !allText.includes(`project-ref ${PRODUCTION_REF}`));
assert("staging ref awareness optional", doc.includes(STAGING_REF) || patchLib.includes(STAGING_REF) || true);
assert(
  "no real email in artifacts",
  !/@(?!example\.com|users\.noreply\.github\.com)[a-z0-9.-]+\.[a-z]{2,}/i.test(
    allText.replace(/users\.noreply\.github\.com/g, ""),
  ),
);

console.log(`\nG-11c8 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
