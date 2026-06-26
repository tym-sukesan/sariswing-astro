/**
 * G-11c9 — Gosaki YouTube URL save workflow dispatch preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g11c9-gosaki-youtube-url-save-workflow-dispatch-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-youtube-url-save-workflow-dispatch-preflight.md";
const WORKFLOW_REL = ".github/workflows/gosaki-youtube-url-save-staging.yml";
const JSON_REL = "tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json";
const PATCH_SCRIPT_REL =
  "tools/static-to-astro/scripts/gosaki-youtube-url-save-workflow-json-patch.mjs";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
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

function runPatch(args) {
  return spawnSync("node", [path.join(REPO_ROOT, PATCH_SCRIPT_REL), ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
}

const doc = read(DOC_REL);
const workflow = read(WORKFLOW_REL);
const jsonConfig = read(JSON_REL);
const jsonBefore = jsonConfig;

assert("preflight doc exists", exists(DOC_REL));
assert("doc phase G-11c9", doc.includes("G-11c9-gosaki-youtube-url-save-workflow-dispatch-preflight"));
assert("doc preflight complete", doc.includes("preflight complete"));
assert("doc workflow dispatch not executed", doc.includes("workflowDispatchExecuted") && doc.includes("**false**"));
assert("doc gh workflow run not executed", doc.includes("ghWorkflowRunExecuted") && doc.includes("**false**"));
assert("doc JSON write not executed", doc.includes("cursorJsonWriteExecuted") && doc.includes("**false**"));
assert("doc patch apply not executed", doc.includes("patchScriptApplyExecuted") && doc.includes("**false**"));
assert("doc no Save", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));
assert("doc no DB write", doc.includes("cursorDbWriteExecuted") && doc.includes("**false**"));
assert("doc no FTP", doc.includes("cursorFtpUploadExecuted") && doc.includes("**false**"));
assert("doc no deploy", doc.includes("supabaseFunctionsDeployExecuted") && doc.includes("**false**"));
assert("doc no secrets set", doc.includes("supabaseSecretsSetExecuted") && doc.includes("**false**"));
assert("doc target JSON path", doc.includes("gosaki-piano-youtube-embed.json"));
assert("doc target item yt-placeholder-01", doc.includes("yt-placeholder-01"));
assert("doc embedCode only patch", doc.includes("embedCode") && doc.includes("only"));
assert("doc published unchanged", doc.includes("published") && (doc.includes("unchanged") || doc.includes("Untouched")));
assert("doc dispatch inputs plan", doc.includes("G-11c10") && doc.includes("workflow_dispatch"));
assert("doc G-11c10 approval gate", doc.includes("承認します。この workflow_dispatch を1回だけ実行してください。"));
assert("doc rollback", doc.includes("Rollback") || doc.includes("rollback") || doc.includes("git revert"));
assert("doc next G-11c10", doc.includes("G-11c10"));
assert("doc current embedCode recorded", doc.includes("Ke4F8JAQz-I"));
assert("doc current videoId recorded", doc.includes("Ke4F8JAQz-I"));
assert("doc local check-only results", doc.includes("no_change") && doc.includes("changed") && doc.includes("conflict"));

assert("workflow workflow_dispatch only", workflow.includes("workflow_dispatch:"));
assert("workflow no push trigger", !/\bon:\s*\n[\s\S]*\bpush:/m.test(workflow));
assert("workflow no pull_request", !workflow.includes("pull_request:"));
assert("workflow no schedule", !workflow.includes("schedule:"));
assert("workflow no remote upload", !/lftp|mirror\s+--delete/i.test(workflow));

const approval = "G-11c6-gosaki-youtube-url-web-save-non-dry-run-slice";
const embed = "https://www.youtube.com/watch?v=Ke4F8JAQz-I";
const vid = "Ke4F8JAQz-I";
const baseArgs = [
  "--site-slug", "gosaki-piano",
  "--module", "youtube-embed",
  "--item-id", "yt-placeholder-01",
  "--expected-before-embed-code", embed,
  "--expected-before-video-id", vid,
  "--approval-id", approval,
  "--operation-id", approval,
  "--json",
];

const noChange = runPatch([...baseArgs, "--youtube-url", embed, "--request-id", "g11c9-verify-no-change"]);
assert("check-only no_change exit 0", noChange.status === 0);
assert("check-only no_change readiness", JSON.parse(noChange.stdout).saveReadiness === "no_change");

const changed = runPatch([
  ...baseArgs,
  "--youtube-url", "https://youtu.be/I-eY9YMq9GI",
  "--request-id", "g11c9-verify-changed",
]);
assert("check-only changed exit 0", changed.status === 0);
const changedJson = JSON.parse(changed.stdout);
assert("check-only changed readiness", changedJson.saveReadiness === "changed");
assert("check-only changed not applied", changedJson.applied === false);

const conflict = runPatch([
  ...baseArgs,
  "--youtube-url", "https://youtu.be/I-eY9YMq9GI",
  "--expected-before-embed-code", "https://www.youtube.com/watch?v=WRONG",
  "--request-id", "g11c9-verify-conflict",
]);
assert("check-only conflict exit 2", conflict.status === 2);

const invalid = runPatch([
  ...baseArgs,
  "--youtube-url", "javascript:alert(1)",
  "--request-id", "g11c9-verify-invalid",
]);
assert("check-only invalid exit 1", invalid.status === 1);

const jsonAfter = read(JSON_REL);
assert("JSON unchanged after verifier", jsonAfter === jsonBefore);

const verifierSource = read(
  "tools/static-to-astro/scripts/verify-g11c9-gosaki-youtube-url-save-workflow-dispatch-preflight.mjs",
);
assert("verifier patch CLI calls omit apply flag", !verifierSource.includes('runPatch([\n  "--apply"'));

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
assert(".env.local not changed", !envDiff.stdout.includes(".env.local"));

assert(
  "no production deploy target in doc",
  !doc.includes(`project-ref ${PRODUCTION_REF}`),
);
assert(
  "no real email in preflight artifacts",
  !/@(?!example\.com|users\.noreply\.github\.com)[a-z0-9.-]+\.[a-z]{2,}/i.test(
    [doc, workflow, verifierSource].join("\n").replace(/users\.noreply\.github\.com/g, ""),
  ),
);

console.log(`\nG-11c9 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
