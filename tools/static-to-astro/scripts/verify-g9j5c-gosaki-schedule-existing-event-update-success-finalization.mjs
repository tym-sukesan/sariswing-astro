/**
 * G-9j5c — Gosaki schedule existing event update success finalization (docs only).
 * Run: node tools/static-to-astro/scripts/verify-g9j5c-gosaki-schedule-existing-event-update-success-finalization.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const DOC = "gosaki-schedule-existing-event-update-success-finalization.md";
const G9J5_RUN = "run-g9j5-gosaki-schedule-existing-event-update-one-row.mjs";

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

const docPath = path.join(TOOL_ROOT, "docs", DOC);
const doc = fs.readFileSync(docPath, "utf8");

assert("finalization doc exists", fs.existsSync(docPath));
assert("phase G-9j5c", doc.includes("G-9j5c-gosaki-schedule-existing-event-update-success-finalization"));
assert("one-row UPDATE success recorded", doc.includes("gosakiScheduleExistingEventUpdateOneRowNonDryRunSuccess: true"));
assert("staging project ref", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert("static-to-astro-cms-staging", doc.includes("static-to-astro-cms-staging"));
assert("sari-site blocked", doc.includes("vsbvndwuajjhnzpohghh"));
assert("target row id", doc.includes("f687ebf3-407c-49d0-9ab8-58040c499b8e"));
assert("site_slug gosaki-piano", doc.includes("gosaki-piano"));
assert("changedFields description only", doc.includes('changedFields: ["description"]'));
assert("rowsAffected 1", doc.includes("rowsAffected: 1"));
assert("post-save updated_at", doc.includes("2026-06-21T13:20:16.626423+00:00"));
assert("post-save description marker", doc.includes("（管理画面保存テスト）"));
assert("service_role not used", doc.includes("service_role") && doc.includes("not used"));
assert("anon signInWithPassword path", doc.includes("signInWithPassword"));
assert("optimistic lock noted", doc.includes("expectedBeforeUpdatedAt"));
assert("UI verification noted", doc.includes("admin/schedule"));
assert("G-9j5a password reset prerequisite", doc.includes("G-9j5a"));
assert("G-9j5b auth gate prerequisite", doc.includes("G-9j5b"));
assert("explicit admin email guard", doc.includes("G9J5_STAGING_ADMIN_EMAIL"));
assert("CMS Kit safety generalization", doc.includes("standard safety mechanisms"));
assert("do not re-run G-9j5", doc.includes("Do not re-run G-9j5"));
assert("no rollback in this phase", doc.includes("no re-run, no rollback") || doc.includes("Rollback SQL executed"));

assert("00-current-state updated", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-9j5c"));
assert("03-next-actions updated", read("tools/static-to-astro/docs/ai/03-next-actions.md").includes("G-9j5c"));
assert("handoff updated", read("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md").includes("G-9j5"));

assert("doc has no service_role key literal", !/eyJ|service_role\s*[:=]\s*['"]/.test(doc));

const adminDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", adminDiff.stdout.trim() === "");

const g9j5RunDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", `tools/static-to-astro/scripts/${G9J5_RUN}`], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("G-9j5 runner not modified in this phase", g9j5RunDiff.stdout.trim() === "");

for (const script of [
  "verify-g9j5-gosaki-schedule-existing-event-auth-email-guard.mjs",
  "verify-g9j5b-gosaki-staging-admin-auth-gate.mjs",
]) {
  const result = spawnSync("node", [path.join(TOOL_ROOT, "scripts", script)], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert(`${script} passes`, result.status === 0);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
