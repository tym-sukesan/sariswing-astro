/**
 * G-11c10c-fix — Gosaki YouTube URL save workflow YAML permissions syntax verifier.
 * Run: node tools/static-to-astro/scripts/verify-g11c10c-fix-gosaki-youtube-url-save-workflow-yaml-permissions-syntax.mjs
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

const WORKFLOW_REL = ".github/workflows/gosaki-youtube-url-save-staging.yml";
const PATCH_SCRIPT_REL =
  "tools/static-to-astro/scripts/gosaki-youtube-url-save-workflow-json-patch.mjs";
const RESULT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-youtube-url-save-workflow-dispatch-execution-result.md";
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

function runPatch(args) {
  return spawnSync("node", [path.join(REPO_ROOT, PATCH_SCRIPT_REL), ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
}

const workflow = read(WORKFLOW_REL);
const resultDoc = read(RESULT_DOC_REL);
const jsonBefore = read(G11C8_CONFIG_REL);
const embed = "https://www.youtube.com/watch?v=Ke4F8JAQz-I";

assert("no dynamic permissions expression", !workflow.includes("inputs.commit_enabled == true && 'write' || 'read'"));
const workflowPermBlock = workflow.match(/^permissions:\n[\s\S]*?(?=^jobs:)/m)?.[0] ?? "";
assert("permissions block has no inputs reference", !workflowPermBlock.includes("inputs."));
assert("job has no permissions inputs block", !workflow.includes("permissions:\n      contents: ${{ inputs"));
assert("permissions contents write fixed", /permissions:\s*\n\s*contents:\s*write/m.test(workflow));
assert("workflow workflow_dispatch only", workflow.includes("workflow_dispatch:"));
assert("no push trigger", !/\bon:\s*\n[\s\S]*\bpush:/m.test(workflow));
assert("no pull_request", !workflow.includes("pull_request:"));
assert("no schedule", !workflow.includes("schedule:"));
assert("no remote upload", !/lftp|mirror\s+--delete/i.test(workflow));
assert("no deploy", !workflow.includes("supabase functions deploy"));
assert("commit step gated by commit_enabled", workflow.includes("github.event.inputs.commit_enabled"));
assert("patch script in workflow", workflow.includes("gosaki-youtube-url-save-workflow-json-patch.mjs"));
assert("target JSON path in workflow", workflow.includes("gosaki-piano-youtube-embed.json"));

assert("result doc HTTP 422", resultDoc.includes("HTTP 422"));
assert("result doc permissions root cause", resultDoc.includes("inputs.commit_enabled"));
assert("result doc approval received", resultDoc.includes("承認します"));
assert("result doc no workflow run", resultDoc.includes("workflowRunCreated") && resultDoc.includes("**false**"));
assert("result doc yaml fix applied", resultDoc.includes("G-11c10c-fix"));
assert("result doc new approval required", resultDoc.includes("新たな明示承認") || resultDoc.includes("Required again"));

const changed = runPatch([
  "--site-slug", "gosaki-piano",
  "--module", "youtube-embed",
  "--item-id", G11C8_TARGET_ITEM_ID,
  "--youtube-url", "https://youtu.be/I-eY9YMq9GI",
  "--expected-before-embed-code", embed,
  "--expected-before-video-id", "Ke4F8JAQz-I",
  "--approval-id", G11C10_APPROVAL_ID,
  "--operation-id", G11C10_OPERATION_ID,
  "--request-id", "g11c10c-fix-check-only",
  "--json",
]);
assert("check-only changed exit 0", changed.status === 0);
const changedJson = JSON.parse(changed.stdout);
assert("check-only changed readiness", changedJson.saveReadiness === "changed");
assert("check-only embedCode only", changedJson.changedFields?.join() === G11C8_PATCH_FIELD);

const jsonAfter = read(G11C8_CONFIG_REL);
assert("JSON unchanged", jsonAfter === jsonBefore);

const verifierSource = read(
  "tools/static-to-astro/scripts/verify-g11c10c-fix-gosaki-youtube-url-save-workflow-yaml-permissions-syntax.mjs",
);
assert("verifier omit apply", !verifierSource.includes('runPatch([\n  "--apply"'));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

assert(
  "no real email in artifacts",
  !/@(?!example\.com|users\.noreply\.github\.com)[a-z0-9.-]+\.[a-z]{2,}/i.test(
    [workflow, resultDoc, verifierSource].join("\n").replace(/users\.noreply\.github\.com/g, ""),
  ),
);

console.log(`\nG-11c10c-fix verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
