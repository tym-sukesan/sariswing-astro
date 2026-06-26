/**
 * G-11c10b — Gosaki YouTube URL save workflow dispatch final preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g11c10b-gosaki-youtube-url-save-workflow-dispatch-final-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  G11C10_APPROVAL_ID,
  G11C10_OPERATION_ID,
} from "./lib/gosaki-youtube-url-save-constants.mjs";
import { G11C8_CONFIG_REL, G11C8_PATCH_FIELD, G11C8_TARGET_ITEM_ID } from "./lib/gosaki-youtube-url-save-workflow-json-patch-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-youtube-url-save-workflow-dispatch-final-preflight.md";
const PATCH_SCRIPT_REL =
  "tools/static-to-astro/scripts/gosaki-youtube-url-save-workflow-json-patch.mjs";
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
const jsonBefore = read(G11C8_CONFIG_REL);
const embed = "https://www.youtube.com/watch?v=Ke4F8JAQz-I";
const vid = "Ke4F8JAQz-I";
const changedUrl = "https://youtu.be/I-eY9YMq9GI";

const baseArgs = [
  "--site-slug", "gosaki-piano",
  "--module", "youtube-embed",
  "--item-id", G11C8_TARGET_ITEM_ID,
  "--expected-before-embed-code", embed,
  "--expected-before-video-id", vid,
  "--approval-id", G11C10_APPROVAL_ID,
  "--operation-id", G11C10_OPERATION_ID,
  "--json",
];

assert("final preflight doc exists", exists(DOC_REL));
assert("doc phase G-11c10b", doc.includes("G-11c10b-gosaki-youtube-url-save-workflow-dispatch-final-preflight"));
assert("doc final preflight complete", doc.includes("final preflight complete"));
assert("doc workflow dispatch not executed", doc.includes("workflowDispatchExecuted") && doc.includes("**false**"));
assert("doc gh workflow run not executed", doc.includes("ghWorkflowRunExecuted") && doc.includes("**false**"));
assert("doc JSON write not executed", doc.includes("cursorJsonWriteExecuted") && doc.includes("**false**"));
assert("doc apply not executed", doc.includes("patchScriptApplyExecuted") && doc.includes("**false**"));
assert("doc commit_enabled not executed", doc.includes("commitEnabledTrueExecuted") && doc.includes("**false**"));
assert("doc no Save", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));
assert("doc no DB", doc.includes("cursorDbWriteExecuted") && doc.includes("**false**"));
assert("doc no FTP", doc.includes("cursorFtpUploadExecuted") && doc.includes("**false**"));
assert("doc no deploy", doc.includes("supabaseFunctionsDeployExecuted") && doc.includes("**false**"));
assert("doc no secrets", doc.includes("supabaseSecretsSetExecuted") && doc.includes("**false**"));
assert("doc target JSON", doc.includes("gosaki-piano-youtube-embed.json"));
assert("doc target item", doc.includes("yt-placeholder-01"));
assert("doc embedCode only", doc.includes("embedCode"));
assert("doc published unchanged", doc.includes("published"));
assert("doc G-11c10 approval_id", doc.includes(G11C10_APPROVAL_ID));
assert("doc G-11c10 operation_id", doc.includes(G11C10_OPERATION_ID));
assert("doc commit_enabled as input plan", doc.includes("commit_enabled=true") && doc.includes("Not executed"));
assert("doc no_change scenario", doc.includes("no_change") || doc.includes("Option A"));
assert("doc changed scenario", doc.includes("changed") && doc.includes("Option B"));
assert("doc changed URL candidate", doc.includes(changedUrl));
assert("doc check-only results", doc.includes("conflict") && doc.includes("invalid"));
assert("doc G-11c10c approval gate", doc.includes("承認します。この workflow_dispatch を1回だけ実行してください。"));
assert("doc rollback", doc.includes("git revert"));
assert("doc next G-11c10c", doc.includes("G-11c10c"));

const noChange = runPatch([...baseArgs, "--youtube-url", embed, "--request-id", "g11c10b-verify-no-change"]);
assert("check-only no_change exit 0", noChange.status === 0);
assert("check-only no_change readiness", JSON.parse(noChange.stdout).saveReadiness === "no_change");

const changed = runPatch([...baseArgs, "--youtube-url", changedUrl, "--request-id", "g11c10b-verify-changed"]);
assert("check-only changed exit 0", changed.status === 0);
const changedJson = JSON.parse(changed.stdout);
assert("check-only changed readiness", changedJson.saveReadiness === "changed");
assert("check-only embedCode only", changedJson.changedFields?.join() === G11C8_PATCH_FIELD);

const conflict = runPatch([
  ...baseArgs,
  "--youtube-url", changedUrl,
  "--expected-before-embed-code", "https://www.youtube.com/watch?v=WRONG",
  "--request-id", "g11c10b-verify-conflict",
]);
assert("check-only conflict exit 2", conflict.status === 2);

const invalid = runPatch([
  ...baseArgs,
  "--youtube-url", "javascript:alert(1)",
  "--request-id", "g11c10b-verify-invalid",
]);
assert("check-only invalid exit 1", invalid.status === 1);

const jsonAfter = read(G11C8_CONFIG_REL);
assert("JSON unchanged", jsonAfter === jsonBefore);

const verifierSource = read(
  "tools/static-to-astro/scripts/verify-g11c10b-gosaki-youtube-url-save-workflow-dispatch-final-preflight.mjs",
);
assert("verifier omit apply", !verifierSource.includes('runPatch([\n  "--apply"'));

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
    [doc, verifierSource].join("\n").replace(/users\.noreply\.github\.com/g, ""),
  ),
);

console.log(`\nG-11c10b verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
